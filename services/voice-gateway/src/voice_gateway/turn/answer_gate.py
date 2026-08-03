"""Does this transcript plausibly answer the question that was asked?

05 §4 names this as the mitigation for `UtteranceEnd`'s known false trigger:

> if we expect a number and got "it started maybe", that is a schema validation
> failure, not a turn, and we re-prompt rather than advance.

That is the whole job of this module. It is **not** structured extraction —
slice 3 owns that, via OpenAI structured outputs against a Pydantic schema, and
will replace these checks with something that produces a typed value rather than
a boolean. What must survive that replacement is the *shape*: a validation
failure is a re-prompt or a hard failure, never a coerced value.

Nothing here calls a model or the network.
"""

from __future__ import annotations

import re

from voice_gateway.contracts import AnswerType

_NUMBER_WORDS = {
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten",
}
_YES_NO_WORDS = {"yes", "no", "yeah", "nope", "yep", "nah", "correct", "incorrect"}
_TIME_WORDS = {
    "day", "days", "week", "weeks", "month", "months", "year", "years",
    "yesterday", "today", "ago", "since", "january", "february", "march",
    "april", "may", "june", "july", "august", "september", "october",
    "november", "december",
}

_MIN_FREE_TEXT_WORDS = 2


def _words(transcript: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", transcript.lower())


def is_plausible_answer(transcript: str, answer_type: AnswerType) -> bool:
    """A deliberately permissive gate.

    Permissive is the right bias. A false *reject* re-asks a question the
    patient already answered, which is annoying but recoverable and visible. A
    false *accept* writes a fragment into the clinical record as if it were an
    answer, which is neither. So this rejects only what is clearly not an
    answer of the expected kind, and leaves genuine judgement to slice 3's
    extractor.
    """
    words = _words(transcript)
    if not words:
        return False

    match answer_type:
        case AnswerType.NUMERIC_SCALE:
            return any(w.isdigit() or w in _NUMBER_WORDS for w in words)
        case AnswerType.YES_NO:
            return any(w in _YES_NO_WORDS for w in words)
        case AnswerType.DATE:
            # "three weeks ago", "since March", "last June", "2024".
            return any(w in _TIME_WORDS for w in words) or any(
                len(w) == 4 and w.isdigit() for w in words
            )
        case AnswerType.BODY_REGION | AnswerType.FREE_TEXT:
            return len(words) >= _MIN_FREE_TEXT_WORDS
        case _:  # pragma: no cover - StrEnum is exhaustive
            return True
