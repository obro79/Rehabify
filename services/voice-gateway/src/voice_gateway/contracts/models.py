"""Wire types between the voice gateway and the TypeScript tier.

Closed sets are enums, not strings (doc 03 §5). Provenance rides with every
answer so the clinical record can say which transcript segment, at which
session-relative timestamp, produced a given field (doc 01 stage D).
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class AnswerType(StrEnum):
    """What the graph expects back from a node.

    This is load-bearing for turn detection, not decoration. 05 §4: when
    `UtteranceEnd` false-triggers mid-thought, the expected answer type is what
    tells us `"it started maybe"` is a schema failure rather than a turn — so
    we re-prompt instead of advancing.
    """

    FREE_TEXT = "free_text"
    NUMERIC_SCALE = "numeric_scale"
    BODY_REGION = "body_region"
    DATE = "date"
    YES_NO = "yes_no"


class TurnOutcome(StrEnum):
    """Why a turn ended. Structure, never content — safe for telemetry."""

    ANSWERED = "answered"
    REPROMPT = "reprompt"
    RECONNECT_REASK = "reconnect_reask"


class QuestionNode(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    """Opaque, stable, and part of the pre-render cache key. Never a slug
    matched fuzzily — the same discipline as PlanItem.exercise_id."""

    prompt_version: str
    text: str
    """The clinician-approved wording. The pre-rendered audio artifact *is* the
    reviewed artifact, pinned to this prompt_version (05 §7)."""

    answer_type: AnswerType
    keyterms: tuple[str, ...] = ()
    """Merged into one pruned union list per pathway. Nova-3 cannot swap
    keyterms mid-stream, so per-node scoping is not available to us (05 §3)."""

    next_id: str | None = None
    """Slice 3 replaces this with real graph traversal. A linear `next_id` is
    enough to prove the loop and keeps the transition deterministic — the model
    is not in this decision, here or later."""


class QuestionGraph(BaseModel):
    model_config = ConfigDict(frozen=True)

    version: str
    nodes: tuple[QuestionNode, ...]

    def node(self, node_id: str) -> QuestionNode:
        for n in self.nodes:
            if n.id == node_id:
                return n
        raise KeyError(node_id)

    @property
    def entry(self) -> QuestionNode:
        return self.nodes[0]

    def all_keyterms(self) -> tuple[str, ...]:
        seen: dict[str, None] = {}
        for n in self.nodes:
            for t in n.keyterms:
                seen.setdefault(t, None)
        return tuple(seen)


class TranscriptProvenance(BaseModel):
    """Where an answer came from, in session-relative time.

    Deepgram resets timestamps to 00:00:00 on every new connection (05 §5), so
    these are always *session* offsets — the gateway adds the per-connection
    base before constructing this.
    """

    model_config = ConfigDict(frozen=True)

    segment_count: int
    """How many `is_final` segments were accumulated into this answer."""

    start_seconds: float
    end_seconds: float
    connection_index: int
    """Which STT connection produced it. Non-zero means the session survived a
    reconnect, which the clinical record should be able to see."""


class IntakeAnswer(BaseModel):
    model_config = ConfigDict(frozen=True)

    question_id: str
    prompt_version: str
    answer_type: AnswerType
    transcript: str
    """PHI. Never a traced function's argument — pass `question_id` and load it
    inside (doc 06 §3, layer 2)."""

    provenance: TranscriptProvenance


class TurnEvent(BaseModel):
    """One completed turn, handed to the TypeScript tier to persist.

    The gateway builds it, validates it, POSTs it, and forgets it. It does not
    write it anywhere itself.
    """

    model_config = ConfigDict(frozen=True)

    session_id: str
    """An opaque per-episode UUID. Never an MRN, name, or anything derived from
    one (doc 06 §3, layer 4)."""

    turn_index: int
    question_id: str
    prompt_version: str
    outcome: TurnOutcome
    answer: IntakeAnswer | None = None
    stt_model: str
    tts_cache_hit: bool
    """~90% of turns should be True. If this trends down, the 45-stream Aura
    concurrency ceiling is back on the critical path (05 §7)."""

    occurred_at: datetime = Field(default_factory=lambda: datetime.now().astimezone())
