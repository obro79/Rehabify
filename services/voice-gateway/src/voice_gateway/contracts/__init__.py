"""Stand-in for the slice 0 contract package.

> **This module is temporary and is deleted, not merged.**
>
> Slice 0 (`slice/contracts`) owns `IntakeAnswer`, `ExtractedField`,
> `QuestionNode`, `QuestionGraph`, `PlanDraft`, `PlanItem`, `ModelRunRecord`
> and `TurnEvent`, with TypeScript types generated from the Pydantic source and
> a CI check against drift. At the time this slice was built, `slice/contracts`
> contained documentation only — no code — so there was nothing to import.
>
> These definitions are deliberately narrow: only the fields the voice gateway
> actually reads or writes, named to match the slice 0 brief so the swap is a
> rename of the import, not a redesign. When slice 0 lands, delete this package
> and re-point `voice_gateway.contracts` at it. The gateway touches these types
> in three places only — `graph/mock_graph.py`, `turn/session.py`, and
> `persistence/client.py`.
"""

from voice_gateway.contracts.models import (
    AnswerType,
    IntakeAnswer,
    QuestionGraph,
    QuestionNode,
    TranscriptProvenance,
    TurnEvent,
    TurnOutcome,
)

__all__ = [
    "AnswerType",
    "IntakeAnswer",
    "QuestionGraph",
    "QuestionNode",
    "TranscriptProvenance",
    "TurnEvent",
    "TurnOutcome",
]
