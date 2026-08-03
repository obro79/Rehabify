"""A hardcoded three-question stand-in for the intake graph.

Slice 3 replaces this with the real thing: the graph as *data* in git — YAML a
physiotherapist can read and sign (gate 9) — plus a pure traversal function.
Nothing here is clinical content; it exists to prove the turn loop.

What this file does establish, and what slice 3 must preserve: the transition
below is a dictionary lookup. There is no model in it. 05 §2 puts the
question-graph transition between STT and the LLM precisely so that the
decision about what to say next is never delegated.
"""

from __future__ import annotations

from voice_gateway.contracts import AnswerType, QuestionGraph, QuestionNode

MOCK_PROMPT_VERSION = "knee-v0-mock"

# Case is preserved by Deepgram and influences output: lowercase common nouns,
# capitalize proper nouns (05 §3). Weights are NOT supported — a `term:0.15`
# here would be accepted as one literal keyterm and boost nothing.
_KNEE_KEYTERMS = (
    "patellofemoral",
    "meniscus",
    "anterior cruciate ligament",
    "patellar tendinopathy",
    "quadriceps",
    "iliotibial band",
)

MOCK_GRAPH = QuestionGraph(
    version=MOCK_PROMPT_VERSION,
    nodes=(
        QuestionNode(
            id="knee.onset",
            prompt_version=MOCK_PROMPT_VERSION,
            text="To start, when did the knee pain begin?",
            answer_type=AnswerType.DATE,
            keyterms=_KNEE_KEYTERMS,
            next_id="knee.severity",
        ),
        QuestionNode(
            id="knee.severity",
            prompt_version=MOCK_PROMPT_VERSION,
            text=(
                "On a scale of zero to ten, where ten is the worst pain you can "
                "imagine, how bad is it at its worst?"
            ),
            answer_type=AnswerType.NUMERIC_SCALE,
            keyterms=_KNEE_KEYTERMS,
            next_id="knee.aggravating",
        ),
        QuestionNode(
            id="knee.aggravating",
            prompt_version=MOCK_PROMPT_VERSION,
            text="What movements or activities make it worse?",
            answer_type=AnswerType.FREE_TEXT,
            keyterms=_KNEE_KEYTERMS,
            next_id=None,
        ),
    ),
)

# Not a question node — exact reviewed wording that never passes through a model
# at all, and goes straight to the pre-rendered cache (05 §8).
SESSION_GREETING = QuestionNode(
    id="system.greeting",
    prompt_version=MOCK_PROMPT_VERSION,
    text=(
        "Hi, I'm going to ask you a few questions about your knee before your "
        "appointment. Take your time — there's no rush."
    ),
    answer_type=AnswerType.FREE_TEXT,
    keyterms=(),
    next_id=None,
)

SESSION_CLOSING = QuestionNode(
    id="system.closing",
    prompt_version=MOCK_PROMPT_VERSION,
    text="That's everything I needed. Thank you — your physiotherapist will review this before you come in.",
    answer_type=AnswerType.FREE_TEXT,
    keyterms=(),
    next_id=None,
)

RECONNECT_NOTICE = SESSION_GREETING.model_copy(
    update={
        "id": "system.reconnect",
        "text": "Sorry, I lost you for a moment there. Let me ask that again.",
    }
)
"""05 §5: audio during a reconnect is lost unless buffered client-side. We do
not guess at a partial answer — we discard in-flight turn state and re-ask."""


def all_prerenderable_nodes() -> tuple[QuestionNode, ...]:
    """Everything with fixed approved wording, and therefore everything that
    should be audio in the cache rather than a live Aura stream."""
    return (SESSION_GREETING, *MOCK_GRAPH.nodes, SESSION_CLOSING, RECONNECT_NOTICE)


def next_node(current_id: str) -> QuestionNode | None:
    """Deterministic transition. No LLM, no network, no I/O."""
    node = MOCK_GRAPH.node(current_id)
    if node.next_id is None:
        return None
    return MOCK_GRAPH.node(node.next_id)
