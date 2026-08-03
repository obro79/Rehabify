"""Typed views over Deepgram's streaming messages.

Deliberately tolerant: unknown fields are ignored and missing optional fields
default rather than raise. A schema surprise from Deepgram should degrade one
message, not kill a live intake.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any


class MessageType(StrEnum):
    RESULTS = "Results"
    UTTERANCE_END = "UtteranceEnd"
    SPEECH_STARTED = "SpeechStarted"
    METADATA = "Metadata"
    ERROR = "Error"


@dataclass(slots=True, frozen=True)
class Results:
    """One transcription result.

    `is_final` freezes an audio *segment*; `speech_final` marks the *utterance*
    boundary. They are different things and 05 §4 turns on the difference.
    """

    transcript: str
    is_final: bool
    speech_final: bool
    start: float
    duration: float

    @property
    def end(self) -> float:
        return self.start + self.duration

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> Results:
        channel = payload.get("channel") or {}
        alternatives = channel.get("alternatives") or [{}]
        transcript = (alternatives[0] or {}).get("transcript", "") or ""
        return cls(
            transcript=transcript,
            is_final=bool(payload.get("is_final", False)),
            speech_final=bool(payload.get("speech_final", False)),
            start=float(payload.get("start", 0.0) or 0.0),
            duration=float(payload.get("duration", 0.0) or 0.0),
        )


@dataclass(slots=True, frozen=True)
class UtteranceEnd:
    """The safety net, computed from word timings rather than acoustics.

    It exists because background noise can keep the VAD triggered and suppress
    `speech_final` entirely, and clinic rooms have background noise (05 §4).
    """

    last_word_end: float

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> UtteranceEnd:
        # Documented: -1 means the result was already finalized before the
        # utterance_end_ms condition was met. Handled in the detector, not
        # here, because it is turn *policy*, not parsing.
        return cls(last_word_end=float(payload.get("last_word_end", -1.0)))


@dataclass(slots=True, frozen=True)
class SpeechStarted:
    """Start of speech. The barge-in trigger, paired with TTS `Clear` (05 §7)."""

    timestamp: float

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> SpeechStarted:
        return cls(timestamp=float(payload.get("timestamp", 0.0) or 0.0))


@dataclass(slots=True, frozen=True)
class DeepgramError:
    code: str
    description: str = ""

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> DeepgramError:
        return cls(
            code=str(payload.get("err_code", payload.get("type", "unknown"))),
            description=str(payload.get("err_msg", payload.get("description", ""))),
        )


@dataclass(slots=True, frozen=True)
class Metadata:
    raw: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_payload(cls, payload: dict[str, Any]) -> Metadata:
        return cls(raw=payload)


ParsedMessage = Results | UtteranceEnd | SpeechStarted | Metadata | DeepgramError | None


def parse(payload: dict[str, Any]) -> ParsedMessage:
    match payload.get("type"):
        case MessageType.RESULTS:
            return Results.from_payload(payload)
        case MessageType.UTTERANCE_END:
            return UtteranceEnd.from_payload(payload)
        case MessageType.SPEECH_STARTED:
            return SpeechStarted.from_payload(payload)
        case MessageType.METADATA:
            return Metadata.from_payload(payload)
        case MessageType.ERROR:
            return DeepgramError.from_payload(payload)
        case _:
            return None
