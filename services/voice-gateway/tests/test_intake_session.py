"""The turn loop end to end, without a network.

This is the "DONE WHEN" of slice 2 expressed as tests: a multi-turn exchange
against the mocked question list, and a connection drop that recovers without
inventing an answer.
"""

from __future__ import annotations

import pytest

from voice_gateway.audio.cache import PrerenderedAudioCache
from voice_gateway.config import Settings
from voice_gateway.contracts import TurnOutcome
from voice_gateway.deepgram.auth import EphemeralTokenProvider
from voice_gateway.graph.mock_graph import MOCK_GRAPH
from voice_gateway.turn.session import IntakeSession

from conftest import FakeChannel, RecordingPersistence


@pytest.fixture
async def session(
    settings: Settings,
    channel: FakeChannel,
    cache: PrerenderedAudioCache,
    persistence: RecordingPersistence,
):
    s = IntakeSession(
        settings=settings,
        channel=channel,
        tokens=EphemeralTokenProvider(settings),
        cache=cache,
        persistence=persistence,
        session_id="session-under-test",
    )
    try:
        yield s
    finally:
        await s.aclose()


async def _answer(session: IntakeSession, channel: FakeChannel, text: str) -> None:
    """Speak one answer and wait for the loop to finish acting on it.

    The turn is committed on a worker task, so waiting for the transcript event
    *count* to rise is what makes these tests deterministic rather than
    order-of-scheduling dependent.
    """
    before = len(channel.of_type("transcript"))
    await session.push_text(text)
    await channel.wait_for(
        lambda events: len([e for e in events if e.get("type") == "transcript"]) > before
    )


# --- the multi-turn exchange ---------------------------------------------


async def test_a_full_three_question_exchange(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    await session.start()

    # Greeting, then the first question.
    assert channel.spoken[0].startswith("Hi, I'm going to ask you")
    await channel.wait_for_listening_on("knee.onset")

    await _answer(session, channel, "it started about three weeks ago")
    await channel.wait_for_listening_on("knee.severity")

    await _answer(session, channel, "about seven out of ten at its worst")
    await channel.wait_for_listening_on("knee.aggravating")

    await _answer(session, channel, "going down stairs and squatting")
    await channel.wait_for(lambda e: any(x.get("type") == "session_complete" for x in e))

    answered = [t for t in persistence.received if t.outcome is TurnOutcome.ANSWERED]
    assert [t.question_id for t in answered] == [
        "knee.onset",
        "knee.severity",
        "knee.aggravating",
    ]
    assert answered[1].answer is not None
    assert "seven" in answered[1].answer.transcript
    # Closing wording is exact reviewed content and never passes through a model.
    assert channel.spoken[-1].startswith("That's everything I needed")


async def test_the_graph_transition_is_the_order_the_data_says(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    """05 §2 puts the question-graph transition between STT and the LLM so the
    decision about what to say next is never delegated. Nothing in the turn
    loop may reorder it."""
    await session.start()
    for text in ("three weeks ago", "seven out of ten", "stairs and squatting"):
        await _answer(session, channel, text)
    await channel.wait_for(lambda e: any(x.get("type") == "session_complete" for x in e))

    asked = [e["question_id"] for e in channel.of_type("listening")]
    assert asked == [n.id for n in MOCK_GRAPH.nodes]


# --- turns land at the TypeScript tier, not in a database ----------------


async def test_every_turn_is_posted_to_the_typescript_tier(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    await session.start()
    await _answer(session, channel, "three weeks ago")
    await channel.wait_for_listening_on("knee.severity")

    assert len(persistence.received) == 1
    event = persistence.received[0]
    assert event.session_id == "session-under-test"
    assert event.turn_index == 0
    assert event.stt_model == "nova-3-medical"


async def test_provenance_rides_with_the_answer(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    """Doc 01 stage D: the clinical record needs to know which transcript
    segment and which connection produced a field."""
    await session.start()
    await _answer(session, channel, "three weeks ago")
    await channel.wait_for_listening_on("knee.severity")

    answer = persistence.received[0].answer
    assert answer is not None
    assert answer.provenance.segment_count == 1
    assert answer.provenance.connection_index == 0
    assert answer.provenance.end_seconds >= answer.provenance.start_seconds


async def test_a_persistence_failure_does_not_kill_the_intake(
    settings: Settings, channel: FakeChannel, cache: PrerenderedAudioCache
) -> None:
    """A patient mid-intake should not have the conversation collapse because
    the web tier hiccupped."""
    import httpx

    failing = RecordingPersistence(
        settings, responder=lambda request: httpx.Response(503, json={"error": "down"})
    )
    session = IntakeSession(
        settings=settings,
        channel=channel,
        tokens=EphemeralTokenProvider(settings),
        cache=cache,
        persistence=failing,
        session_id="s",
    )
    try:
        await session.start()
        await _answer(session, channel, "three weeks ago")
        await channel.wait_for_listening_on("knee.severity")
    finally:
        await session.aclose()

    assert failing.dropped_turn_count == 1
    # The turn was dropped and the conversation carried on.
    assert any(e.get("question_id") == "knee.severity" for e in channel.of_type("listening"))


# --- the answer-type gate -------------------------------------------------


async def test_a_fragment_where_a_number_was_expected_is_a_reprompt(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    """05 §4: "if we expect a number and got 'it started maybe', that is a
    schema validation failure, not a turn, and we re-prompt rather than
    advance." This is UtteranceEnd's known false trigger, mitigated."""
    await session.start()
    await _answer(session, channel, "three weeks ago")
    await channel.wait_for_listening_on("knee.severity")

    before = len(channel.of_type("listening"))
    await _answer(session, channel, "it started maybe")
    await channel.wait_for(lambda e: len([x for x in e if x.get("type") == "listening"]) > before)

    asked = [e["question_id"] for e in channel.of_type("listening")]
    assert asked[-1] == "knee.severity", "the same question must be re-asked"
    assert persistence.received[-1].outcome is TurnOutcome.REPROMPT
    assert persistence.received[-1].answer is None, "a rejected fragment is never stored"


async def test_a_question_that_is_never_answered_advances_unanswered(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    """After the re-prompt budget is spent we advance with NO answer rather than
    coercing a fragment into the record. The clinician sees an unanswered
    question, which is true, instead of a wrong one."""
    await session.start()
    await _answer(session, channel, "three weeks ago")
    await channel.wait_for_listening_on("knee.severity")

    for _ in range(3):
        await _answer(session, channel, "hmm")
    await channel.wait_for_listening_on("knee.aggravating")

    severity_turns = [t for t in persistence.received if t.question_id == "knee.severity"]
    assert all(t.outcome is TurnOutcome.REPROMPT for t in severity_turns)
    assert all(t.answer is None for t in severity_turns)


# --- reconnect ------------------------------------------------------------


async def test_a_connection_drop_re_asks_and_discards_the_partial_answer(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    """05 §5: audio during a reconnect is lost unless buffered client-side. On
    reconnect, discard in-flight turn state and re-ask. Do not guess at a
    partial answer."""
    await session.start()
    await channel.wait_for_listening_on("knee.onset")

    await session.simulate_connection_drop()
    await channel.wait_for(lambda e: any(x.get("type") == "reconnected" for x in e))

    reconnect_turns = [t for t in persistence.received if t.outcome is TurnOutcome.RECONNECT_REASK]
    assert len(reconnect_turns) == 1
    assert reconnect_turns[0].question_id == "knee.onset"
    assert reconnect_turns[0].answer is None

    # The patient hears the notice and then the same question again.
    assert any("lost you for a moment" in text for text in channel.spoken)
    assert [e["question_id"] for e in channel.of_type("listening")][-1] == "knee.onset"


async def test_the_session_survives_the_drop_and_finishes(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    await session.start()
    await _answer(session, channel, "three weeks ago")
    await channel.wait_for_listening_on("knee.severity")

    await session.simulate_connection_drop()
    await channel.wait_for(lambda e: any(x.get("type") == "reconnected" for x in e))

    await _answer(session, channel, "seven out of ten")
    await _answer(session, channel, "stairs and squatting")
    await channel.wait_for(lambda e: any(x.get("type") == "session_complete" for x in e))

    answered = [t for t in persistence.received if t.outcome is TurnOutcome.ANSWERED]
    assert [t.question_id for t in answered] == [
        "knee.onset",
        "knee.severity",
        "knee.aggravating",
    ]
    # The answer given after the drop is attributed to the second connection,
    # which is what makes the reconnect visible in the clinical record.
    severity = next(t for t in answered if t.question_id == "knee.severity")
    assert severity.answer is not None
    assert severity.answer.provenance.connection_index == 1


# --- pre-rendered audio ---------------------------------------------------


async def test_questions_are_served_from_the_pre_rendered_cache(
    session: IntakeSession, channel: FakeChannel, persistence: RecordingPersistence
) -> None:
    """~90% of turns hit this path, which is what keeps Aura's 45-stream cap
    off the critical path (05 §7)."""
    await session.start()
    await channel.wait_for_listening_on("knee.onset")

    assert channel.audio_bytes > 0
    assert all(t.tts_cache_hit for t in persistence.received)
    assert len(channel.of_type("audio_begin")) >= 2  # greeting + first question
