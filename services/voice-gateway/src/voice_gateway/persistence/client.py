"""The hop to the TypeScript tier.

ADR-016: this service holds no database connection and no database credentials.
It receives context, returns validated Pydantic models, and the TypeScript tier
persists them through `db.rls`.

That is one extra hop per turn — single-digit milliseconds within a region,
against a turn budget measured in hundreds. The temptation to delete it by
adding a Postgres client here is exactly the thing ADR-016 is defending
against, and the defence is not a lint rule: **the AI service cannot reach
Postgres because it has no credentials to reach it with.** Make the unsafe thing
unreachable rather than forbidden.

The endpoint on the other end does not exist yet. Slice 1 owns the schema and
slice 3 the intake route; `stub_server.py` stands in until then.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from voice_gateway.config import Settings
from voice_gateway.contracts import TurnEvent

logger = logging.getLogger(__name__)

_MAX_ATTEMPTS = 3
_BACKOFF_BASE_SECONDS = 0.25


class TurnPersistenceClient:
    """POSTs each completed turn and gets out of the way.

    A persistence failure never propagates into the turn loop. A patient
    mid-intake should not have the conversation collapse because the web tier
    hiccupped — the turn is retried, and if it still fails it is logged as a
    dropped turn with its identifiers, never with its content.
    """

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None
        self._dropped = 0

    @property
    def dropped_turn_count(self) -> int:
        return self._dropped

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self._settings.persist_timeout_seconds)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def persist(self, event: TurnEvent) -> bool:
        """Returns True if the TypeScript tier accepted the turn."""
        client = await self._http()
        # mode="json" so datetimes and StrEnums serialise the way the TS side
        # expects. When slice 0 lands, this is the payload its generated types
        # describe.
        payload = event.model_dump(mode="json")

        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                response = await client.post(
                    self._settings.persist_turn_url,
                    json=payload,
                    headers={"Authorization": f"Bearer {self._settings.persist_turn_token}"},
                )
            except httpx.HTTPError as exc:
                logger.warning(
                    "turn persistence attempt %d/%d failed for session=%s turn=%d: %s",
                    attempt, _MAX_ATTEMPTS, event.session_id, event.turn_index, exc,
                )
            else:
                if response.status_code < 300:
                    return True
                if 400 <= response.status_code < 500:
                    # A malformed payload will be malformed on retry too. This
                    # is contract drift between the Pydantic models and the TS
                    # types — the standing hazard ADR-016 names — and it should
                    # be visible immediately rather than smeared across retries.
                    logger.error(
                        "TypeScript tier rejected turn session=%s turn=%d with HTTP %d; "
                        "not retrying (likely contract drift)",
                        event.session_id, event.turn_index, response.status_code,
                    )
                    break
                logger.warning(
                    "turn persistence attempt %d/%d got HTTP %d",
                    attempt, _MAX_ATTEMPTS, response.status_code,
                )

            if attempt < _MAX_ATTEMPTS:
                await asyncio.sleep(_BACKOFF_BASE_SECONDS * (2 ** (attempt - 1)))

        self._dropped += 1
        # Identifiers only. The transcript is PHI and does not go to a log file.
        logger.error(
            "DROPPED TURN session=%s turn=%d question=%s — not persisted",
            event.session_id, event.turn_index, event.question_id,
        )
        return False
