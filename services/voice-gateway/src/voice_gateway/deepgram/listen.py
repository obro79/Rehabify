"""Streaming STT connection to Deepgram.

One instance is one socket. Reconnect supervision is deliberately *not* here —
it lives in `turn/session.py`, because deciding to re-ask a question is a
product decision (05 §5: "do not guess at a partial answer") and does not
belong in a transport class.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from collections.abc import Callable
from enum import StrEnum

import websockets
from websockets.exceptions import ConnectionClosed, InvalidStatus

from voice_gateway.config import Settings
from voice_gateway.deepgram.auth import DeepgramAuthError, EphemeralTokenProvider
from voice_gateway.deepgram.messages import (
    DeepgramError,
    Metadata,
    Results,
    SpeechStarted,
    UtteranceEnd,
    parse,
)
from voice_gateway.deepgram.transport import DeepgramTransport
from voice_gateway.deepgram.urls import build_listen_url

logger = logging.getLogger(__name__)

KEEPALIVE_INTERVAL_SECONDS = 4.0
"""05 §5 says 3–5s. The docs disagree with themselves about whether the no-data
timeout is 10s or 12s; an interval this far inside both makes it moot."""

_CLOSE_STREAM_DRAIN_SECONDS = 2.0


class CloseOutcome(StrEnum):
    """Why the socket ended. Drives the reconnect decision one layer up."""

    CLEAN = "clean"

    UNDECODABLE_AUDIO = "undecodable_audio"
    """1008 DATA-0000. Almost always wrong encoding/sample_rate, or a control
    message sent as a binary frame. Reconnecting will not help — the same bad
    audio will follow — so this one is fatal to the session."""

    CLIENT_SILENT = "client_silent"
    """1011 NET-0001. KeepAlive does NOT reset this one."""

    NO_AUDIO_TIMEOUT = "no_audio_timeout"
    """1011 NET-0002. KeepAlive DOES reset this one, so seeing it means the
    keepalive loop stalled — worth a warning, not just a reconnect."""

    AUTH_REJECTED = "auth_rejected"
    TRANSPORT_ERROR = "transport_error"

    @property
    def is_recoverable(self) -> bool:
        return self is not CloseOutcome.UNDECODABLE_AUDIO


def classify_close(code: int | None, reason: str) -> CloseOutcome:
    """Map a close frame to an outcome.

    05 §5 lists three codes worth handling distinctly. Note the internal
    disagreement in that section, flagged rather than resolved here: the
    failure-mode table attributes the 10s no-data timeout to NET-0001 and
    prescribes KeepAlive for it, while the close-code list says KeepAlive does
    *not* reset NET-0001 and *does* reset NET-0002. This function follows the
    close-code list, which is the more specific of the two.
    """
    haystack = (reason or "").upper()

    if code == 1008 or "DATA-0000" in haystack:
        return CloseOutcome.UNDECODABLE_AUDIO
    if "NET-0002" in haystack:
        return CloseOutcome.NO_AUDIO_TIMEOUT
    if "NET-0001" in haystack:
        return CloseOutcome.CLIENT_SILENT
    if code in (1000, 1001, None):
        return CloseOutcome.CLEAN
    if code == 1011:
        # 1011 with an unparseable reason — treat as the silent-client case,
        # which is the recoverable one.
        return CloseOutcome.CLIENT_SILENT
    return CloseOutcome.TRANSPORT_ERROR


class ListenConnection:
    """A single Deepgram `listen` socket, with its keepalive and reader loops."""

    def __init__(
        self,
        settings: Settings,
        tokens: EphemeralTokenProvider,
        *,
        keyterms: tuple[str, ...] = (),
        on_results: Callable[[Results], None],
        on_utterance_end: Callable[[UtteranceEnd], None],
        on_speech_started: Callable[[SpeechStarted], None] | None = None,
        on_error: Callable[[DeepgramError], None] | None = None,
        on_metadata: Callable[[Metadata], None] | None = None,
    ) -> None:
        self._settings = settings
        self._tokens = tokens
        self._keyterms = keyterms
        self._on_results = on_results
        self._on_utterance_end = on_utterance_end
        self._on_speech_started = on_speech_started
        self._on_error = on_error
        self._on_metadata = on_metadata

        self._transport: DeepgramTransport | None = None
        self._socket: websockets.ClientConnection | None = None
        self._keepalive_task: asyncio.Task[None] | None = None
        self._reader_task: asyncio.Task[None] | None = None
        self._closed_event = asyncio.Event()
        self._outcome: CloseOutcome | None = None

    @property
    def outcome(self) -> CloseOutcome | None:
        return self._outcome

    @property
    def is_open(self) -> bool:
        return self._socket is not None and not self._closed_event.is_set()

    async def open(self) -> None:
        """Open the socket and start the keepalive immediately.

        05 §5: audio must start within 10 seconds of opening, and we greet with
        TTS before the patient speaks. Two mitigations are offered — open the
        socket late, or KeepAlive from the moment it opens. We do both: the
        session opens this connection only after the greeting has been sent,
        and the keepalive loop starts here rather than on first audio, so a
        patient who takes fifteen seconds to begin does not lose the socket.
        """
        token = await self._tokens.get_token()
        url = build_listen_url(
            model=self._settings.stt_model,
            sample_rate=self._settings.browser_sample_rate,
            endpointing_ms=self._settings.stt_endpointing_ms,
            utterance_end_ms=self._settings.stt_utterance_end_ms,
            keyterms=self._keyterms,
        )

        try:
            self._socket = await websockets.connect(
                url,
                additional_headers={"Authorization": f"Bearer {token}"},
                # Deepgram does not respond to client pings on this endpoint;
                # KeepAlive is the liveness mechanism.
                ping_interval=None,
                max_size=None,
            )
        except InvalidStatus as exc:
            if exc.response.status_code in (401, 403):
                self._tokens.invalidate()
                self._outcome = CloseOutcome.AUTH_REJECTED
                raise DeepgramAuthError("Deepgram rejected the ephemeral token") from exc
            self._outcome = CloseOutcome.TRANSPORT_ERROR
            raise

        self._transport = DeepgramTransport(
            self._socket, sample_rate=self._settings.browser_sample_rate
        )
        self._closed_event.clear()
        self._outcome = None
        self._keepalive_task = asyncio.create_task(self._keepalive_loop())
        self._reader_task = asyncio.create_task(self._read_loop())
        logger.info("STT socket open (model=%s)", self._settings.stt_model)

    async def send_audio(self, chunk: bytes) -> None:
        if self._transport is None or self._closed_event.is_set():
            # Audio arriving while the socket is down is dropped, not queued.
            # 05 §5 is explicit that audio during a reconnect is lost unless
            # buffered client-side, and the session re-asks rather than
            # stitching a hole-punched answer together.
            return
        await self._transport.send_audio(chunk)

    async def _keepalive_loop(self) -> None:
        assert self._transport is not None
        try:
            while not self._closed_event.is_set():
                await asyncio.sleep(KEEPALIVE_INTERVAL_SECONDS)
                if self._closed_event.is_set():
                    return
                if self._transport.seconds_since_last_send >= KEEPALIVE_INTERVAL_SECONDS:
                    # TEXT frame, enforced by the transport.
                    await self._transport.keep_alive()
        except asyncio.CancelledError:
            raise
        except ConnectionClosed:
            return
        except Exception:
            logger.exception("keepalive loop failed")

    async def _read_loop(self) -> None:
        assert self._socket is not None
        try:
            async for raw in self._socket:
                if isinstance(raw, bytes):
                    # `listen` sends JSON only. Binary here means something is
                    # badly wrong; do not try to interpret it.
                    logger.warning("unexpected binary frame from Deepgram listen socket")
                    continue
                self._dispatch(raw)
        except ConnectionClosed as exc:
            self._outcome = classify_close(exc.rcvd.code if exc.rcvd else None,
                                           exc.rcvd.reason if exc.rcvd else "")
            logger.info("STT socket closed: %s", self._outcome)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("STT reader failed")
            self._outcome = CloseOutcome.TRANSPORT_ERROR
        finally:
            self._closed_event.set()

    def _dispatch(self, raw: str) -> None:
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning("undecodable JSON from Deepgram listen socket")
            return

        match parse(payload):
            case Results() as msg:
                self._on_results(msg)
            case UtteranceEnd() as msg:
                self._on_utterance_end(msg)
            case SpeechStarted() as msg:
                if self._on_speech_started:
                    self._on_speech_started(msg)
            case Metadata() as msg:
                if self._on_metadata:
                    self._on_metadata(msg)
            case DeepgramError() as msg:
                logger.error("Deepgram error %s: %s", msg.code, msg.description)
                if self._on_error:
                    self._on_error(msg)
            case _:
                pass

    async def wait_closed(self) -> CloseOutcome:
        await self._closed_event.wait()
        return self._outcome or CloseOutcome.CLEAN

    async def close(self) -> None:
        """Close cleanly: CloseStream, let the server flush, then tear down."""
        if self._transport is not None and not self._closed_event.is_set():
            with contextlib.suppress(ConnectionClosed, OSError):
                await self._transport.close_stream()
                # Give the server its chance to flush remaining audio and send
                # summary metadata before we drop the socket.
                with contextlib.suppress(TimeoutError):
                    await asyncio.wait_for(
                        self._closed_event.wait(), timeout=_CLOSE_STREAM_DRAIN_SECONDS
                    )

        self._closed_event.set()
        for task in (self._keepalive_task, self._reader_task):
            if task is not None:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task

        if self._socket is not None:
            with contextlib.suppress(Exception):
                await self._socket.close()
        self._socket = None
        self._transport = None
        if self._outcome is None:
            self._outcome = CloseOutcome.CLEAN
