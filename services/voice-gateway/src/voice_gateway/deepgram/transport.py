"""Frame-type discipline and send pacing for Deepgram sockets.

Two of 05 §5's failure modes are transport-level and both are silent:

**`KeepAlive` must be a TEXT frame.** Sent as binary it is "handled
incorrectly" and causes audio processing to "choke or hiccup." There is no
server ACK and no error — the socket stays open and the transcription quietly
degrades. That is the worst shape a bug can have in a clinical pipeline, so the
assertion lives in the transport where it cannot be forgotten at a call site.

**Max send rate is 1.25× realtime.** This only bites on reconnect catch-up: a
30-second buffered gap takes 24 seconds to drain. Exceeding it is not an error
you see either — you just get throttled or disconnected somewhere downstream.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from enum import StrEnum
from typing import Any, Protocol

logger = logging.getLogger(__name__)

MAX_REALTIME_MULTIPLIER = 1.25
BYTES_PER_LINEAR16_SAMPLE = 2


class FrameTypeError(TypeError):
    """A control message about to go out as binary, or audio as text."""


class ControlMessage(StrEnum):
    KEEP_ALIVE = "KeepAlive"
    CLOSE_STREAM = "CloseStream"
    # TTS control (05 §7)
    SPEAK = "Speak"
    FLUSH = "Flush"
    CLEAR = "Clear"


class WebSocketLike(Protocol):
    """The slice of the websockets API this module uses.

    Narrow on purpose: it makes the fake in `tests/test_transport.py` — which
    records the *type* of every frame — a two-line class rather than a mock.
    """

    async def send(self, message: str | bytes) -> None: ...
    async def close(self, code: int = 1000, reason: str = "") -> None: ...


class RealtimePacer:
    """Holds outbound audio at or under 1.25× realtime.

    Live capture arrives at 1× and never touches this. It exists for the
    reconnect drain, where a buffered backlog would otherwise be flushed as
    fast as the socket accepts it.
    """

    def __init__(self, sample_rate: int, *, channels: int = 1) -> None:
        self._bytes_per_second = sample_rate * channels * BYTES_PER_LINEAR16_SAMPLE
        self._budget_bytes_per_second = self._bytes_per_second * MAX_REALTIME_MULTIPLIER
        self._bytes_sent = 0
        self._started_at: float | None = None

    def reset(self) -> None:
        self._bytes_sent = 0
        self._started_at = None

    def delay_for(self, chunk_size: int, *, now: float | None = None) -> float:
        """Seconds to wait before sending `chunk_size` bytes. 0.0 when in budget.

        The budget is charged against what has *already* been sent, not
        including this chunk. Charging the chunk against its own send time
        would throttle live capture, which arrives at exactly 1× and must never
        be delayed — only the reconnect backlog should ever wait here.
        """
        now = time.monotonic() if now is None else now
        if self._started_at is None:
            self._started_at = now

        earliest = self._started_at + (self._bytes_sent / self._budget_bytes_per_second)
        self._bytes_sent += chunk_size
        return max(0.0, earliest - now)

    @property
    def seconds_of_audio_sent(self) -> float:
        return self._bytes_sent / self._bytes_per_second


class DeepgramTransport:
    """Wraps a socket so control and audio cannot be sent as the wrong frame type.

    `websockets` picks the frame type from the Python type — `str` becomes TEXT,
    `bytes` becomes BINARY. That is a convenient default and a bad thing to
    leave implicit when one of the two silently corrupts audio processing, so
    both directions are checked and named here.
    """

    def __init__(self, socket: WebSocketLike, *, sample_rate: int) -> None:
        self._socket = socket
        self._pacer = RealtimePacer(sample_rate)
        self._last_send_at = time.monotonic()
        self._closed = False

    @property
    def pacer(self) -> RealtimePacer:
        return self._pacer

    @property
    def seconds_since_last_send(self) -> float:
        return time.monotonic() - self._last_send_at

    async def send_control(self, message: ControlMessage, **fields: Any) -> None:
        """Send a JSON control message as a TEXT frame."""
        payload = json.dumps({"type": message.value, **fields})
        if not isinstance(payload, str):  # pragma: no cover - defensive
            raise FrameTypeError("control messages must serialise to str")
        await self._socket.send(payload)
        self._last_send_at = time.monotonic()

    async def send_audio(self, chunk: bytes) -> None:
        """Send raw PCM as a BINARY frame, paced to 1.25× realtime."""
        if isinstance(chunk, str):
            # A control message that arrived here as text would be transcribed
            # as audio; DATA-0000 / close 1008 is the good outcome.
            raise FrameTypeError(
                "audio must be bytes. A str here means a control message took the "
                "audio path — send it via send_control()."
            )
        if not chunk:
            return

        delay = self._pacer.delay_for(len(chunk))
        if delay > 0:
            logger.debug("pacing outbound audio: sleeping %.3fs to stay under 1.25x", delay)
            await asyncio.sleep(delay)

        await self._socket.send(chunk)
        self._last_send_at = time.monotonic()

    async def keep_alive(self) -> None:
        """05 §5: send every 3–5s during silence.

        Docs conflict on the no-data timeout — the Keep Alive page says 10s and
        the Flux comparison table says 12s. A 3–5s interval makes the
        disagreement moot, which is why the interval is not tuned to either.
        """
        await self.send_control(ControlMessage.KEEP_ALIVE)

    async def close_stream(self) -> None:
        """Close cleanly so the server flushes remaining audio and sends summary
        metadata (05 §5)."""
        if self._closed:
            return
        self._closed = True
        await self.send_control(ControlMessage.CLOSE_STREAM)

    async def close(self, code: int = 1000, reason: str = "") -> None:
        self._closed = True
        await self._socket.close(code=code, reason=reason)
