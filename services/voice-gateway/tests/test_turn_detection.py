"""05 §4 is specified rather than described because it is "the part most likely
to be built wrong." These tests pin the parts that are easy to get subtly wrong
and impossible to notice in a demo.
"""

from __future__ import annotations

from voice_gateway.deepgram.messages import Results, UtteranceEnd
from voice_gateway.turn.detector import CommitReason, CommittedTurn, TurnDetector


def _result(
    transcript: str,
    *,
    is_final: bool = False,
    speech_final: bool = False,
    start: float = 0.0,
    duration: float = 1.0,
) -> Results:
    return Results(
        transcript=transcript,
        is_final=is_final,
        speech_final=speech_final,
        start=start,
        duration=duration,
    )


class Recorder:
    def __init__(self) -> None:
        self.turns: list[CommittedTurn] = []

    def __call__(self, turn: CommittedTurn) -> None:
        self.turns.append(turn)

    @property
    def transcripts(self) -> list[str]:
        return [t.transcript for t in self.turns]


# --- accumulation --------------------------------------------------------


def test_a_long_answer_accumulates_several_is_final_segments_into_one_turn() -> None:
    """The documented failure: "Do not use speech_final: true alone to capture
    full transcripts." A long answer produces several is_final messages first."""
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("it started", is_final=True, start=0.0, duration=1.0))
    d.on_results(_result("about three weeks ago", is_final=True, start=1.0, duration=1.5))
    assert rec.turns == []

    d.on_results(_result("after a hike", is_final=True, speech_final=True, start=2.5, duration=1.0))

    assert rec.transcripts == ["it started about three weeks ago after a hike"]
    assert rec.turns[0].segment_count == 3
    assert rec.turns[0].reason == CommitReason.SPEECH_FINAL


def test_interim_results_are_not_accumulated() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("it star", is_final=False))
    d.on_results(_result("it started", is_final=False))
    d.on_results(_result("it started", is_final=True, speech_final=True))

    assert rec.transcripts == ["it started"]


def test_the_buffer_is_empty_after_a_commit() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("seven", is_final=True, speech_final=True))
    d.on_results(_result("out of ten", is_final=True, speech_final=True))

    assert rec.transcripts == ["seven", "out of ten"]


def test_speech_final_on_an_empty_buffer_does_not_commit() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("", is_final=True, speech_final=True))
    d.on_results(_result("   ", is_final=True, speech_final=True))

    assert rec.turns == []


# --- the UtteranceEnd safety net -----------------------------------------


def test_utterance_end_commits_when_speech_final_never_arrived() -> None:
    """The whole reason UtteranceEnd exists: background noise keeps the VAD
    triggered and suppresses speech_final entirely. Clinic rooms have noise."""
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("my knee hurts", is_final=True, start=0.0, duration=1.2))
    d.on_utterance_end(UtteranceEnd(last_word_end=1.2))

    assert rec.transcripts == ["my knee hurts"]
    assert rec.turns[0].reason == CommitReason.UTTERANCE_END


def test_last_word_end_of_minus_one_is_ignored() -> None:
    """Documented: -1 means the result was already finalized before the
    utterance_end_ms condition was met. Processing it duplicates the turn."""
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("seven", is_final=True, speech_final=True))
    assert rec.transcripts == ["seven"]

    d.on_utterance_end(UtteranceEnd(last_word_end=-1))

    assert rec.transcripts == ["seven"], "a -1 UtteranceEnd must not commit anything"


def test_minus_one_returns_before_the_committed_recently_reset() -> None:
    """The ordering inside on_utterance_end is load-bearing.

    The -1 early return sits ABOVE `committedRecently = false`. If it were
    below, a -1 message would clear the flag and the next real UtteranceEnd
    would re-commit a turn that speech_final already committed — a duplicated
    answer, which for a clinical questionnaire is a wrong record rather than a
    crash.
    """
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("seven", is_final=True, speech_final=True))
    d.on_utterance_end(UtteranceEnd(last_word_end=-1))
    # Same turn: nothing new spoken, so the buffer is still empty. Feed a real
    # UtteranceEnd and confirm the flag was left intact by the -1.
    d.on_results(_result("out of ten", is_final=True))
    d.on_utterance_end(UtteranceEnd(last_word_end=3.0))

    # committed_recently was still True from speech_final, so this UtteranceEnd
    # suppresses its commit — and clears the flag for next time.
    assert rec.transcripts == ["seven"]


def test_utterance_end_does_not_duplicate_a_turn_speech_final_already_committed() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("three weeks", is_final=True, speech_final=True))
    d.on_utterance_end(UtteranceEnd(last_word_end=2.0))

    assert rec.transcripts == ["three weeks"]


def test_the_suppression_lasts_exactly_one_utterance_end() -> None:
    """`committedRecently = false` runs at the end of every non-(-1)
    UtteranceEnd, committing or not. So the suppression is one-shot: the next
    turn's safety net is armed again."""
    rec = Recorder()
    d = TurnDetector(rec)

    # Turn 1 commits via speech_final, and its UtteranceEnd is suppressed.
    d.on_results(_result("three weeks", is_final=True, speech_final=True))
    d.on_utterance_end(UtteranceEnd(last_word_end=2.0))

    # Turn 2 gets no speech_final at all — the noisy-room case.
    d.on_results(_result("it aches at night", is_final=True, start=3.0, duration=1.5))
    d.on_utterance_end(UtteranceEnd(last_word_end=4.5))

    assert rec.transcripts == ["three weeks", "it aches at night"]


def test_utterance_end_on_an_empty_buffer_still_clears_the_flag() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("seven", is_final=True, speech_final=True))
    d.on_utterance_end(UtteranceEnd(last_word_end=1.0))  # suppressed, clears flag
    d.on_utterance_end(UtteranceEnd(last_word_end=2.0))  # empty buffer, no-op

    d.on_results(_result("nine", is_final=True))
    d.on_utterance_end(UtteranceEnd(last_word_end=3.0))

    assert rec.transcripts == ["seven", "nine"]


def test_the_known_false_trigger_mid_thought() -> None:
    """05 §4's named hazard: UtteranceEnd fires on a word-timing gap while the
    patient is still speaking. For someone recalling when their knee started
    hurting, this WILL happen.

    The detector commits — it cannot know better. The mitigation lives one layer
    up, in the question graph's expected answer type: a DATE node handed "it
    started maybe" is a schema failure, so we re-prompt rather than advance.
    This test pins the detector's half of that contract.
    """
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("it started maybe", is_final=True, start=0.0, duration=1.0))
    d.on_utterance_end(UtteranceEnd(last_word_end=1.0))

    assert rec.transcripts == ["it started maybe"]
    assert rec.turns[0].reason == CommitReason.UTTERANCE_END


# --- provenance and reconnect --------------------------------------------


def test_provenance_carries_segment_count_and_session_relative_timings() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("about", is_final=True, start=1.5, duration=0.5))
    d.on_results(_result("three weeks", is_final=True, speech_final=True, start=2.0, duration=1.0))

    turn = rec.turns[0]
    assert turn.segment_count == 2
    assert turn.start_seconds == 1.5
    assert turn.end_seconds == 3.0


def test_the_session_offset_is_added_because_deepgram_resets_timestamps() -> None:
    """05 §5: timestamps reset to 00:00:00 on every new connection, and the
    clinical record needs per-answer timing for provenance."""
    rec = Recorder()
    d = TurnDetector(rec)
    d.time_offset = 42.0

    d.on_results(_result("nine", is_final=True, speech_final=True, start=0.5, duration=0.5))

    assert rec.turns[0].start_seconds == 42.5
    assert rec.turns[0].end_seconds == 43.0


def test_discard_throws_away_a_partial_answer_rather_than_guessing() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("it started about", is_final=True))
    assert d.has_pending_audio

    d.discard()

    assert not d.has_pending_audio
    assert rec.turns == []

    # And the detector is clean for the re-asked question.
    d.on_results(_result("three weeks ago", is_final=True, speech_final=True))
    assert rec.transcripts == ["three weeks ago"]


def test_discard_also_clears_the_suppression_flag() -> None:
    rec = Recorder()
    d = TurnDetector(rec)

    d.on_results(_result("seven", is_final=True, speech_final=True))
    d.discard()

    # After a reconnect the safety net must be armed, not suppressed by state
    # left over from the previous connection.
    d.on_results(_result("nine", is_final=True))
    d.on_utterance_end(UtteranceEnd(last_word_end=1.0))

    assert rec.transcripts == ["seven", "nine"]
