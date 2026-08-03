"""Live Aura TTS — the cache-*miss* path only.

Most turns never reach this module. The approved question set is pre-rendered
(05 §7, `audio/cache.py`), which is what takes TTS off the concurrency path:
Aura streaming allows 45 concurrent connections against STT's 150, so a naive
one-TTS-socket-per-session design caps the whole product at ~45 concurrent
intakes regardless of how much STT headroom exists.

What is left for live synthesis is LLM-generated clarifications and
confirmations — slice 3's territory. This client exists so that path is wired
and bounded rather than improvised later.

Two hard limits from 05 §5 are enforced here because both fail quietly:
  * the socket has a **60-minute cap**, so sockets are per-session and never
    shared or long-lived;
  * `Flush` is capped at **20 per 60 seconds**, so we flush **per turn**, never
    per sentence.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
import time
from collections import deque
from collections.abc import AsyncIterator

import websockets
from websockets.exceptions import ConnectionClosed

from voice_gateway.config import Settings
from voice_gateway.deepgram.auth import EphemeralTokenProvider
from voice_gateway.deepgram.transport import ControlMessage, DeepgramTransport
from voice_gateway.deepgram.urls import build_speak_url

logger = logging.getLogger(__name__)

SOCKET_MAX_LIFETIME_SECONDS = 55 * 60
"""The documented cap is 60 minutes. We close at 55 so the ceiling is hit by
our own bookkeeping rather than by a mid-sentence disconnect."""

FLUSH_LIMIT = 20
FLUSH_WINDOW_SECONDS = 60.0


class FlushRateLimitError(RuntimeError):
    """Raised instead of silently exceeding the documented Flush budget.

    Hitting this means something is flushing per sentence rather than per turn.
    That is a design error upstream, and it should surface as one.
    """


class SpeakConnection:
    """A per-session Aura socket for live synthesis."""

    def __init__(self, settings: Settings, tokens: EphemeralTokenProvider) -> None:
        self._settings = settings
        self._tokens = tokens
        self._socket: websockets.ClientConnection | None = None
        self._transport: DeepgramTransport | None = None
        self._opened_at: float = 0.0
        self._flushes: deque[float] = deque()

    @property
    def is_open(self) -> bool:
        return self._socket is not None

    @property
    def is_expiring(self) -> bool:
        return self.is_open and (time.monotonic() - self._opened_at) >= SOCKET_MAX_LIFETIME_SECONDS

    async def open(self) -> None:
        token = await self._tokens.get_token()
        url = build_speak_url(
            model=self._settings.tts_model,
            sample_rate=self._settings.tts_sample_rate,
        )
        self._socket = await websockets.connect(
            url,
            additional_headers={"Authorization": f"Bearer {token}"},
            ping_interval=None,
            max_size=None,
        )
        self._transport = DeepgramTransport(
            self._socket, sample_rate=self._settings.tts_sample_rate
        )
        self._opened_at = time.monotonic()
        logger.info("TTS socket open (model=%s)", self._settings.tts_model)

    def _record_flush(self) -> None:
        now = time.monotonic()
        while self._flushes and now - self._flushes[0] > FLUSH_WINDOW_SECONDS:
            self._flushes.popleft()
        if len(self._flushes) >= FLUSH_LIMIT:
            raise FlushRateLimitError(
                f"{FLUSH_LIMIT} Flush messages in {FLUSH_WINDOW_SECONDS:.0f}s. "
                "Flush per turn, not per sentence (05 §5)."
            )
        self._flushes.append(now)

    async def synthesize(self, text: str) -> AsyncIterator[bytes]:
        """Speak `text` and yield raw linear16 frames.

        One `Flush` for the whole utterance. Callers that stream LLM tokens
        should send several `Speak` messages and flush once at the end of the
        turn — that is the shape 05 §7 describes and the only one that stays
        inside the rate limit.
        """
        if self._socket is None or self._transport is None:
            raise RuntimeError("TTS socket is not open")

        self._record_flush()
        await self._transport.send_control(ControlMessage.SPEAK, text=text)
        await self._transport.send_control(ControlMessage.FLUSH)

        async for message in self._socket:
            if isinstance(message, bytes):
                yield message
                continue
            try:
                payload = json.loads(message)
            except json.JSONDecodeError:
                continue
            # Aura signals the end of a flushed segment; anything else is
            # metadata we do not need on this path.
            if payload.get("type") in ("Flushed", "Cleared"):
                return
            if payload.get("type") == "Error":
                logger.error("Aura error: %s", payload.get("description", ""))
                return

    async def clear(self) -> None:
        """Drop queued audio. The barge-in primitive, paired with SpeechStarted
        from STT (05 §7)."""
        if self._transport is None:
            return
        with contextlib.suppress(ConnectionClosed):
            await self._transport.send_control(ControlMessage.CLEAR)

    async def close(self) -> None:
        if self._transport is not None:
            with contextlib.suppress(ConnectionClosed, OSError):
                await self._transport.close_stream()
        if self._socket is not None:
            with contextlib.suppress(Exception):
                await asyncio.wait_for(self._socket.close(), timeout=2.0)
        self._socket = None
        self._transport = None
