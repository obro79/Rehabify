"""The failure modes from 05 §5.

Every one of these fails *quietly* in production: the socket stays open and
transcription degrades, or the socket dies mid-question and the patient hears
silence. None of them raise. That is why they are tested rather than reviewed.
"""

from __future__ import annotations

import json

import pytest

from voice_gateway.deepgram.listen import KEEPALIVE_INTERVAL_SECONDS, CloseOutcome, classify_close
from voice_gateway.deepgram.speak import FLUSH_LIMIT, SOCKET_MAX_LIFETIME_SECONDS
from voice_gateway.deepgram.transport import (
    MAX_REALTIME_MULTIPLIER,
    ControlMessage,
    DeepgramTransport,
    FrameTypeError,
    RealtimePacer,
)


class FakeSocket:
    """Records the *type* of every frame, which is the whole point."""

    def __init__(self) -> None:
        self.frames: list[tuple[str, object]] = []
        self.closed_with: tuple[int, str] | None = None

    async def send(self, message: str | bytes) -> None:
        self.frames.append(("text" if isinstance(message, str) else "binary", message))

    async def close(self, code: int = 1000, reason: str = "") -> None:
        self.closed_with = (code, reason)

    @property
    def text_frames(self) -> list[dict]:
        return [json.loads(m) for kind, m in self.frames if kind == "text"]


# --- KeepAlive must be a TEXT frame --------------------------------------


async def test_keepalive_goes_out_as_a_text_frame() -> None:
    """Sent as binary it is "handled incorrectly" and causes audio processing to
    "choke or hiccup." There is no server ACK and no error — classic silent
    degradation, so the frame type is asserted in the transport layer."""
    socket = FakeSocket()
    transport = DeepgramTransport(socket, sample_rate=16000)

    await transport.keep_alive()

    assert socket.frames[0][0] == "text"
    assert socket.text_frames[0] == {"type": ControlMessage.KEEP_ALIVE.value}


async def test_close_stream_is_also_a_text_frame() -> None:
    socket = FakeSocket()
    transport = DeepgramTransport(socket, sample_rate=16000)

    await transport.close_stream()

    assert socket.frames[0][0] == "text"
    assert socket.text_frames[0] == {"type": ControlMessage.CLOSE_STREAM.value}


async def test_audio_goes_out_as_a_binary_frame() -> None:
    socket = FakeSocket()
    transport = DeepgramTransport(socket, sample_rate=16000)

    await transport.send_audio(b"\x00\x01" * 160)

    assert socket.frames[0][0] == "binary"


async def test_a_control_message_cannot_take_the_audio_path() -> None:
    """A control message sent as binary is one of the two documented causes of
    a 1008 DATA-0000 close. Refuse it here rather than transcribe it."""
    socket = FakeSocket()
    transport = DeepgramTransport(socket, sample_rate=16000)

    with pytest.raises(FrameTypeError, match="send_control"):
        await transport.send_audio('{"type":"KeepAlive"}')  # type: ignore[arg-type]

    assert socket.frames == []


def test_the_keepalive_interval_sits_inside_both_documented_timeouts() -> None:
    # The docs conflict — Keep Alive page says 10s, the Flux comparison table
    # says 12s. 05 §5: "3–5s intervals make it moot."
    assert 3.0 <= KEEPALIVE_INTERVAL_SECONDS <= 5.0


# --- max send rate 1.25x realtime ----------------------------------------


def test_realtime_audio_is_never_delayed() -> None:
    pacer = RealtimePacer(16000)
    # 40 ms frames arriving at 40 ms intervals — the live-capture case.
    assert pacer.delay_for(1280, now=0.0) == 0.0
    assert pacer.delay_for(1280, now=0.04) == 0.0
    assert pacer.delay_for(1280, now=0.08) == 0.0


def test_a_reconnect_backlog_is_held_to_the_1_25x_ceiling() -> None:
    """05 §5: "A 30s buffered gap takes 24s to drain." That ratio is the test."""
    pacer = RealtimePacer(16000)
    bytes_per_second = 16000 * 2

    # Dump the whole backlog at t=0 in one-second chunks and see when the
    # pacer lets the last one go out.
    delay = 0.0
    for i in range(30):
        delay = pacer.delay_for(bytes_per_second, now=0.0)
        assert i == 0 or delay > 0, "a flood must be throttled after the first chunk"

    # The final chunk starts at 29/1.25 and carries 1s of audio, so the drain
    # completes at 30/1.25 = 24s.
    assert pacer.seconds_of_audio_sent == pytest.approx(30.0)
    drain_complete = delay + (1 / MAX_REALTIME_MULTIPLIER)
    assert drain_complete == pytest.approx(30 / MAX_REALTIME_MULTIPLIER, abs=0.05)
    assert drain_complete == pytest.approx(24.0, abs=0.05)


async def test_the_transport_actually_sleeps_before_an_over_budget_send() -> None:
    import time

    socket = FakeSocket()
    transport = DeepgramTransport(socket, sample_rate=16000)
    one_second_of_audio = b"\x00" * (16000 * 2)

    started = time.monotonic()
    await transport.send_audio(one_second_of_audio)
    await transport.send_audio(one_second_of_audio)
    elapsed = time.monotonic() - started

    # Second chunk may not go out until 1/1.25 = 0.8s after the first.
    assert elapsed >= 0.7
    assert len(socket.frames) == 2


# --- close-code classification -------------------------------------------


@pytest.mark.parametrize(
    ("code", "reason", "expected"),
    [
        (1000, "", CloseOutcome.CLEAN),
        (1001, "going away", CloseOutcome.CLEAN),
        (1008, "DATA-0000", CloseOutcome.UNDECODABLE_AUDIO),
        (1011, "NET-0001", CloseOutcome.CLIENT_SILENT),
        (1011, "NET-0002", CloseOutcome.NO_AUDIO_TIMEOUT),
        (1011, "", CloseOutcome.CLIENT_SILENT),
        (1006, "abnormal", CloseOutcome.TRANSPORT_ERROR),
    ],
)
def test_close_codes_map_to_outcomes(code: int, reason: str, expected: CloseOutcome) -> None:
    assert classify_close(code, reason) is expected


def test_undecodable_audio_is_the_one_that_must_not_be_retried() -> None:
    """1008 DATA-0000 means wrong encoding/sample_rate or a control message sent
    as binary. The same bad audio follows a reconnect, so retrying just burns
    the session slowly instead of quickly."""
    assert not classify_close(1008, "DATA-0000").is_recoverable
    assert classify_close(1011, "NET-0001").is_recoverable
    assert classify_close(1011, "NET-0002").is_recoverable


# --- TTS ceilings ---------------------------------------------------------


def test_the_tts_socket_is_recycled_before_the_60_minute_cap() -> None:
    # The documented hard cap is 60 minutes. Closing at our own bookkeeping
    # boundary beats being cut off mid-sentence.
    assert SOCKET_MAX_LIFETIME_SECONDS < 60 * 60


def test_the_flush_budget_matches_the_documented_limit() -> None:
    # 20 per 60s. Flush per turn, never per sentence.
    assert FLUSH_LIMIT == 20
