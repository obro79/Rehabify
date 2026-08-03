"""Ephemeral Deepgram tokens, minted server-side.

05 §2: browser-to-Deepgram-direct is technically supported and we are not doing
it, but we still use the auth-grant endpoint **server-side**, so the long-lived
API key never sits in the outbound request path and per-session revocation is
clean.

(The endpoint path is not written out anywhere in this file. It lives in the
`DeepgramEndpoint` enum in `urls.py`, and `test_url_chokepoint.py` fails the
build if any other module — including in a docstring — spells it out. An
example URL in a comment is how a copy-paste call site gets written later.)

The key therefore appears in exactly one outbound request in this codebase: the
grant call below. Everything else — every STT socket, every TTS socket — carries
a token that expires in 30 seconds.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass

import httpx

from voice_gateway.config import Settings
from voice_gateway.deepgram.urls import build_auth_grant_url

logger = logging.getLogger(__name__)

# Tokens only need to be valid at handshake (05 §2), but a token that expires
# between the mint and the connect is a confusing failure. Re-mint early.
_EXPIRY_SAFETY_MARGIN_SECONDS = 5.0


class DeepgramAuthError(RuntimeError):
    pass


@dataclass(slots=True)
class _CachedToken:
    token: str
    expires_at: float

    def is_usable(self, now: float) -> bool:
        return now < self.expires_at - _EXPIRY_SAFETY_MARGIN_SECONDS


class EphemeralTokenProvider:
    """Mints and briefly caches short-lived Deepgram access tokens.

    Caching is per-process and deliberately shallow. A 30-second TTL against a
    session that opens one STT socket and occasionally one TTS socket means the
    cache saves a round trip at connection time and nothing more; it is not a
    pool and should not become one, because a long-lived cached token has the
    revocation properties of the API key we are avoiding.
    """

    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self._settings = settings
        self._client = client
        self._owns_client = client is None
        self._cached: _CachedToken | None = None
        self._lock = asyncio.Lock()

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=10.0)
        return self._client

    async def aclose(self) -> None:
        if self._owns_client and self._client is not None:
            await self._client.aclose()
            self._client = None

    async def get_token(self) -> str:
        if not self._settings.has_deepgram_credentials:
            raise DeepgramAuthError(
                "no Deepgram API key configured; set VOICE_GATEWAY_DEEPGRAM_API_KEY"
            )

        async with self._lock:
            now = time.monotonic()
            if self._cached is not None and self._cached.is_usable(now):
                return self._cached.token

            client = await self._http()
            url = build_auth_grant_url()
            try:
                response = await client.post(
                    url,
                    # The one place the long-lived key is used.
                    headers={"Authorization": f"Token {self._settings.deepgram_api_key}"},
                    json={"ttl_seconds": self._settings.deepgram_token_ttl_seconds},
                )
            except httpx.HTTPError as exc:
                raise DeepgramAuthError(f"auth grant request failed: {exc}") from exc

            if response.status_code >= 400:
                # Never log the response body verbatim — this endpoint echoes
                # request context and the body is not worth the risk.
                raise DeepgramAuthError(f"auth grant returned HTTP {response.status_code}")

            payload = response.json()
            token = payload.get("access_token")
            if not token:
                raise DeepgramAuthError("auth grant response contained no access_token")

            ttl = float(payload.get("expires_in", self._settings.deepgram_token_ttl_seconds))
            self._cached = _CachedToken(token=token, expires_at=time.monotonic() + ttl)
            logger.debug("minted ephemeral Deepgram token, ttl=%.0fs", ttl)
            return token

    def invalidate(self) -> None:
        """Drop the cached token after an auth-shaped connection failure, so the
        next connect re-mints rather than retrying with a token the server has
        already rejected."""
        self._cached = None
