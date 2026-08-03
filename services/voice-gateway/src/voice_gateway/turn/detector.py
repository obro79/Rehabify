"""Turn detection, ported from 05 §4 statement for statement.

That section says "implement it exactly" and gives the reference implementation
in TypeScript. This is that code in Python, with the control flow preserved
line for line — including the parts that look redundant. Two of them are not:

  * the `last_word_end == -1` early return happens *before* the
    `committed_recently` reset, so a `-1` message leaves the flag alone;
  * `committed_recently = False` runs at the end of every non-`-1`
    `UtteranceEnd`, whether or not that message committed anything.

Deepgram's docs are explicit that `speech_final: true` alone must not be used
to capture full transcripts. A long answer produces several `is_final` messages
before the turn ends, and they must be accumulated.

Everything beyond the reference implementation — provenance, session-relative
timestamps, the answer-type gate — is additive and marked as such.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from enum import StrEnum

from voice_gateway.deepgram.messages import Results, UtteranceEnd

logger = logging.getLogger(__name__)


class CommitReason(StrEnum):
    """Which of the two paths committed the turn.

    Worth recording: a session whose turns commit mostly via UTTERANCE_END is a
    session where `speech_final` is being suppressed — the background-noise case
    05 §4 warns about. It is a number, so it crosses the no-PHI boundary intact.
    """

    SPEECH_FINAL = "speech_final"
    UTTERANCE_END = "utterance_end"


@dataclass(slots=True)
class CommittedTurn:
    transcript: str
    reason: CommitReason
    segment_count: int
    start_seconds: float
    end_seconds: float

    question_id: str | None = None
    """Which question was on the floor when these words were spoken.

    Stamped here, at commit time, and not read from session state later. A turn
    is handled on a worker task behind a persistence round trip and a stretch of
    audio playback, so by the time it is handled the session has often moved on
    — and a patient who keeps talking through that window would otherwise have
    their words filed under a question they had not yet been asked. `None` means
    nothing was on the floor, which happens if the patient talks over the
    greeting.
    """


@dataclass(slots=True)
class _Accumulator:
    """The `buffer` from the reference implementation, plus the provenance the
    clinical record needs (doc 01 stage D)."""

    text: str = ""
    segment_count: int = 0
    start_seconds: float | None = None
    end_seconds: float = 0.0

    def append(self, result: Results) -> None:
        # The reference is `buffer += msg.transcript`. Deepgram segments do not
        # carry a leading space, so a bare `+=` runs words together across
        # segment boundaries. Joining with a space changes the rendered text,
        # never which messages commit a turn.
        if self.text and result.transcript:
            self.text += " "
        self.text += result.transcript
        self.segment_count += 1
        if self.start_seconds is None:
            self.start_seconds = result.start
        self.end_seconds = max(self.end_seconds, result.end)

    def is_empty(self) -> bool:
        # `if (buffer)` in the reference — an empty string is falsy there, and a
        # whitespace-only buffer is not a turn here either.
        return not self.text.strip()

    def drain(
        self, reason: CommitReason, time_offset: float, question_id: str | None
    ) -> CommittedTurn:
        turn = CommittedTurn(
            transcript=self.text.strip(),
            reason=reason,
            segment_count=self.segment_count,
            start_seconds=(self.start_seconds or 0.0) + time_offset,
            end_seconds=self.end_seconds + time_offset,
            question_id=question_id,
        )
        self.reset()
        return turn

    def reset(self) -> None:
        self.text = ""
        self.segment_count = 0
        self.start_seconds = None
        self.end_seconds = 0.0


class TurnDetector:
    """Accumulates transcription results and emits completed turns.

    Not thread-safe and not async — it is a state machine fed by the socket
    reader. Keeping it synchronous and I/O-free is what makes 05 §4 testable
    without a network.
    """

    def __init__(self, on_commit: Callable[[CommittedTurn], None]) -> None:
        self._on_commit = on_commit
        self._buffer = _Accumulator()
        self._committed_recently = False

        # Additive: Deepgram resets timestamps to 00:00:00 on every new
        # connection (05 §5). The session offset is added on the way out so
        # provenance stays continuous across a reconnect.
        self._time_offset = 0.0

        # Additive: the question currently on the floor. Set by the session at
        # the moment it starts listening, read at the moment a turn commits.
        # See CommittedTurn.question_id for why it is captured this early.
        self._question_id: str | None = None

    # --- 05 §4, verbatim ---------------------------------------------------

    def on_results(self, msg: Results) -> None:
        if msg.is_final:
            self._buffer.append(msg)
        if msg.speech_final and not self._buffer.is_empty():
            self._commit(CommitReason.SPEECH_FINAL)
            self._committed_recently = True

    def on_utterance_end(self, msg: UtteranceEnd) -> None:
        # Documented: -1 means the result was already finalized before the
        # utterance_end_ms condition was met. Processing it duplicates the turn.
        if msg.last_word_end == -1:
            return
        if not self._committed_recently and not self._buffer.is_empty():
            self._commit(CommitReason.UTTERANCE_END)
        self._committed_recently = False

    # --- additive ----------------------------------------------------------

    def _commit(self, reason: CommitReason) -> None:
        turn = self._buffer.drain(reason, self._time_offset, self._question_id)
        logger.debug(
            "turn committed via %s for %s: %d segments, %.2fs-%.2fs",
            reason,
            turn.question_id,
            turn.segment_count,
            turn.start_seconds,
            turn.end_seconds,
        )
        self._on_commit(turn)

    @property
    def time_offset(self) -> float:
        return self._time_offset

    @time_offset.setter
    def time_offset(self, value: float) -> None:
        self._time_offset = value

    @property
    def question_id(self) -> str | None:
        return self._question_id

    @question_id.setter
    def question_id(self, value: str | None) -> None:
        self._question_id = value

    @property
    def has_pending_audio(self) -> bool:
        return not self._buffer.is_empty()

    def discard(self) -> None:
        """Throw away in-flight turn state.

        Called on reconnect. 05 §5: audio during a reconnect is lost unless
        buffered client-side, so a partial buffer from before the drop is a
        fragment of an answer with a hole in the middle. We re-ask rather than
        guess at it.
        """
        if not self._buffer.is_empty():
            logger.info(
                "discarding %d in-flight transcript segments after connection loss",
                self._buffer.segment_count,
            )
        self._buffer.reset()
        self._committed_recently = False
