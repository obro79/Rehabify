"""The turn loop.

Everything the gateway does for the duration of one intake lives here: greet,
open the STT socket, ask, listen, commit a turn, gate it against the expected
answer type, hand it to the TypeScript tier, advance the graph, ask the next
one. Plus the part that is easy to skip and expensive to skip: surviving a
dropped connection without inventing an answer.

The transition between questions is a dictionary lookup (`graph/mock_graph.py`).
There is no model in this file, and slice 3 replacing the mock graph with the
real one must not change that — 05 §2 puts the question-graph transition between
STT and the LLM precisely so the decision about what to say next is never
delegated.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import time
import uuid
from typing import Protocol

from voice_gateway.audio.cache import CacheKey, PrerenderedAudioCache
from voice_gateway.config import Settings
from voice_gateway.contracts import (
    IntakeAnswer,
    QuestionGraph,
    QuestionNode,
    TranscriptProvenance,
    TurnEvent,
    TurnOutcome,
)
from voice_gateway.deepgram.auth import DeepgramAuthError, EphemeralTokenProvider
from voice_gateway.deepgram.listen import CloseOutcome, ListenConnection
from voice_gateway.deepgram.messages import Results, SpeechStarted, UtteranceEnd
from voice_gateway.deepgram.speak import SpeakConnection
from voice_gateway.graph.mock_graph import (
    MOCK_GRAPH,
    RECONNECT_NOTICE,
    SESSION_CLOSING,
    SESSION_GREETING,
    next_node,
)
from voice_gateway.persistence.client import TurnPersistenceClient
from voice_gateway.telemetry import traced
from voice_gateway.turn.answer_gate import is_plausible_answer
from voice_gateway.turn.detector import CommittedTurn, TurnDetector

logger = logging.getLogger(__name__)

_PCM_CHUNK_BYTES = 8192
MAX_REPROMPTS = 2


@traced("intake.turn")
def _trace_turn(
    *,
    session_id: str,
    turn_index: int,
    question_id: str,
    prompt_version: str,
    outcome: str,
    commit_reason: str,
    segment_count: int,
    tts_cache_hit: bool,
    connection_index: int,
) -> None:
    """A span for one turn.

    Note what this function cannot take: the transcript. `@traced` reads the
    signature at import time and refuses any parameter not on the structural
    allowlist, so the rule from doc 06 §3 — pass an identifier, load content
    inside — is checked by CI rather than by review.
    """


class BrowserChannel(Protocol):
    """What the session needs from the browser socket.

    A Protocol rather than the FastAPI WebSocket so the whole turn loop can be
    driven by a fake in tests without a server, a browser, or a microphone.
    """

    async def send_event(self, event: dict[str, object]) -> None: ...
    async def send_audio(self, chunk: bytes) -> None: ...


class IntakeSession:
    def __init__(
        self,
        *,
        settings: Settings,
        channel: BrowserChannel,
        tokens: EphemeralTokenProvider,
        cache: PrerenderedAudioCache,
        persistence: TurnPersistenceClient,
        graph: QuestionGraph = MOCK_GRAPH,
        session_id: str | None = None,
    ) -> None:
        self._settings = settings
        self._channel = channel
        self._tokens = tokens
        self._cache = cache
        self._persistence = persistence
        self._graph = graph

        # An opaque per-episode UUID. Never an MRN, name, or anything derived
        # from one (doc 06 §3, layer 4).
        self.session_id = session_id or str(uuid.uuid4())

        self._current: QuestionNode | None = None
        self._turn_index = 0
        self._reprompts = 0
        self._connection_index = 0
        self._started_at = time.monotonic()

        self._turns: asyncio.Queue[CommittedTurn] = asyncio.Queue()
        self._detector = TurnDetector(self._turns.put_nowait)
        self._stt: ListenConnection | None = None
        self._tts: SpeakConnection | None = None

        self._worker: asyncio.Task[None] | None = None
        self._supervisor: asyncio.Task[None] | None = None
        self._stopping = asyncio.Event()
        self._finished = asyncio.Event()
        self._speaking = False
        self._audio_only_mode = settings.has_deepgram_credentials
        # Whether the last thing the patient heard came out of the pre-rendered
        # cache. Recorded per turn because the ~90% hit rate is the number that
        # decides whether Aura's 45-stream cap is on the critical path (05 §7),
        # and a hardcoded `True` here would make it unmeasurable.
        self._last_tts_cache_hit = False

    # --- lifecycle --------------------------------------------------------

    async def start(self) -> None:
        self._worker = asyncio.create_task(self._turn_worker())

        await self._channel.send_event(
            {
                "type": "session_started",
                "session_id": self.session_id,
                "tts_sample_rate": self._settings.tts_sample_rate,
                "expected_input_sample_rate": self._settings.browser_sample_rate,
                "stt_available": self._audio_only_mode,
                "graph_version": self._graph.version,
            }
        )

        # Greeting first, socket second. 05 §5: audio must start within 10s of
        # opening the STT socket, and we greet before the patient speaks — so
        # the socket is opened late, *after* the greeting has gone out.
        await self._speak(SESSION_GREETING)

        if self._audio_only_mode:
            await self._connect_stt()

        self._current = self._graph.entry
        await self._ask(self._current)

    async def _connect_stt(self) -> None:
        connection = ListenConnection(
            self._settings,
            self._tokens,
            keyterms=self._graph.all_keyterms(),
            on_results=self._on_results,
            on_utterance_end=self._on_utterance_end,
            on_speech_started=self._on_speech_started,
        )
        await connection.open()
        self._stt = connection

        # 05 §5: timestamps reset to 00:00:00 on every new connection, and the
        # clinical record needs per-answer timing for provenance. Rebase.
        self._detector.time_offset = time.monotonic() - self._started_at

        self._supervisor = asyncio.create_task(self._supervise(connection))

    async def aclose(self) -> None:
        self._stopping.set()
        for task in (self._supervisor, self._worker):
            if task is not None:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task
        if self._stt is not None:
            await self._stt.close()
            self._stt = None
        if self._tts is not None:
            await self._tts.close()
            self._tts = None

    async def wait_finished(self) -> None:
        await self._finished.wait()

    # --- inbound from the browser ----------------------------------------

    async def push_audio(self, chunk: bytes) -> None:
        if self._stt is not None:
            await self._stt.send_audio(chunk)

    async def push_text(self, text: str) -> None:
        """Transcript mode: the browser sends typed text instead of audio.

        This exists so the turn loop, the graph transition, the audio cache and
        the persistence hop are all exercisable without Deepgram credentials.
        It synthesises the message sequence a real socket would produce —
        `is_final` then `speech_final` — rather than bypassing the detector, so
        the path under test is the real one.
        """
        now = time.monotonic() - self._started_at
        self._detector.on_results(
            Results(transcript=text, is_final=True, speech_final=True, start=now, duration=0.0)
        )

    async def simulate_connection_drop(self) -> None:
        """Force the reconnect path, for the demo and for tests.

        Closes the STT socket underneath the session without telling it to stop,
        which is what a real drop looks like from here.
        """
        if self._stt is not None:
            await self._stt.close()
        else:
            # No live socket (transcript mode) — exercise the recovery
            # behaviour directly so the demo still shows what it does.
            await self._recover()

    # --- Deepgram callbacks (sync, called from the reader task) -----------

    def _on_results(self, msg: Results) -> None:
        self._detector.on_results(msg)

    def _on_utterance_end(self, msg: UtteranceEnd) -> None:
        self._detector.on_utterance_end(msg)

    def _on_speech_started(self, msg: SpeechStarted) -> None:
        if not self._settings.barge_in_enabled or not self._speaking:
            return
        # The primitives, wired: SpeechStarted from STT pairs with Aura's
        # `Clear` to drop queued audio (05 §7). Off by default — see
        # Settings.barge_in_enabled for why the policy is not ours to pick.
        asyncio.create_task(self._barge_in())

    async def _barge_in(self) -> None:
        if self._tts is not None:
            await self._tts.clear()
        await self._channel.send_event({"type": "audio_clear"})

    # --- reconnect --------------------------------------------------------

    async def _supervise(self, connection: ListenConnection) -> None:
        outcome = await connection.wait_closed()
        if self._stopping.is_set() or self._finished.is_set():
            return

        if not outcome.is_recoverable:
            # 1008 DATA-0000: undecodable audio, almost always a wrong
            # encoding/sample_rate or a control message sent as a binary frame.
            # Reconnecting sends the same bad audio again.
            logger.error("STT closed unrecoverably (%s); ending session", outcome)
            await self._channel.send_event(
                {"type": "fatal", "reason": outcome.value}
            )
            self._finished.set()
            return

        if outcome is CloseOutcome.NO_AUDIO_TIMEOUT:
            # KeepAlive resets this one, so seeing it means the keepalive loop
            # stalled rather than that the patient went quiet.
            logger.warning("NET-0002 despite KeepAlive — the keepalive loop may have stalled")

        await self._recover()

    async def _recover(self) -> None:
        # 05 §5: audio during a reconnect is lost unless buffered client-side.
        # Whatever is in the buffer is a fragment with a hole in it, so it is
        # discarded rather than persisted as a partial answer.
        self._detector.discard()
        self._connection_index += 1

        for attempt in range(1, self._settings.max_reconnect_attempts + 1):
            if self._stopping.is_set():
                return
            try:
                if self._audio_only_mode:
                    await self._connect_stt()
                break
            except (DeepgramAuthError, OSError) as exc:
                logger.warning(
                    "reconnect attempt %d/%d failed: %s",
                    attempt, self._settings.max_reconnect_attempts, exc,
                )
                if attempt == self._settings.max_reconnect_attempts:
                    await self._channel.send_event({"type": "fatal", "reason": "reconnect_failed"})
                    self._finished.set()
                    return
                await asyncio.sleep(self._settings.reconnect_backoff_seconds * attempt)

        await self._channel.send_event(
            {"type": "reconnected", "connection_index": self._connection_index}
        )

        # Re-ask. Do not guess at a partial answer.
        node = self._current
        if node is None:
            return
        await self._record_turn(node, outcome=TurnOutcome.RECONNECT_REASK, answer=None,
                               commit_reason="reconnect", tts_cache_hit=self._last_tts_cache_hit)
        await self._speak(RECONNECT_NOTICE)
        await self._ask(node)

    # --- the loop ---------------------------------------------------------

    async def _turn_worker(self) -> None:
        while True:
            turn = await self._turns.get()
            try:
                await self._handle_turn(turn)
            except Exception:
                logger.exception("turn handling failed")

    async def _handle_turn(self, turn: CommittedTurn) -> None:
        node = self._current
        if node is None:
            return

        await self._channel.send_event(
            {"type": "transcript", "text": turn.transcript, "question_id": node.id}
        )

        if not is_plausible_answer(turn.transcript, node.answer_type):
            # 05 §4's mitigation for the UtteranceEnd false trigger: expecting a
            # number and getting "it started maybe" is a schema failure, not a
            # turn. Re-prompt rather than advance.
            self._reprompts += 1
            if self._reprompts <= MAX_REPROMPTS:
                await self._record_turn(
                    node, outcome=TurnOutcome.REPROMPT, answer=None,
                    commit_reason=turn.reason.value, tts_cache_hit=self._last_tts_cache_hit,
                )
                await self._ask(node)
                return
            # Out of re-prompts. Advance with *no* answer rather than coercing
            # a fragment into the record — the clinician sees an unanswered
            # question, which is true, instead of a wrong one.
            logger.info("advancing past %s unanswered after %d re-prompts", node.id, MAX_REPROMPTS)
            await self._record_turn(
                node, outcome=TurnOutcome.REPROMPT, answer=None,
                commit_reason=turn.reason.value, tts_cache_hit=self._last_tts_cache_hit,
            )
            await self._advance(node)
            return

        answer = IntakeAnswer(
            question_id=node.id,
            prompt_version=node.prompt_version,
            answer_type=node.answer_type,
            transcript=turn.transcript,
            provenance=TranscriptProvenance(
                segment_count=turn.segment_count,
                start_seconds=turn.start_seconds,
                end_seconds=turn.end_seconds,
                connection_index=self._connection_index,
            ),
        )
        await self._record_turn(
            node, outcome=TurnOutcome.ANSWERED, answer=answer,
            commit_reason=turn.reason.value, tts_cache_hit=self._last_tts_cache_hit,
        )
        await self._advance(node)

    async def _advance(self, node: QuestionNode) -> None:
        self._reprompts = 0
        nxt = next_node(node.id)
        self._current = nxt
        if nxt is None:
            await self._speak(SESSION_CLOSING)
            await self._channel.send_event({"type": "session_complete"})
            self._finished.set()
            return
        await self._ask(nxt)

    async def _ask(self, node: QuestionNode) -> None:
        await self._speak(node)
        await self._channel.send_event({"type": "listening", "question_id": node.id})

    # --- output -----------------------------------------------------------

    async def _speak(self, node: QuestionNode) -> bool:
        """Send a question to the browser. Returns True on a cache hit."""
        await self._channel.send_event(
            {"type": "assistant_text", "text": node.text, "question_id": node.id}
        )

        key = CacheKey(
            question_id=node.id,
            prompt_version=node.prompt_version,
            model=self._settings.tts_model,
            sample_rate=self._settings.tts_sample_rate,
        )
        cached = self._cache.lookup(key, node.text)
        self._last_tts_cache_hit = cached is not None

        if cached is None and not self._settings.has_deepgram_credentials:
            # Nothing to play at all. Return before the begin/end pair rather
            # than emitting an empty one the client would sit waiting on.
            logger.warning(
                "no pre-rendered audio for %s and no credentials for live TTS", node.id
            )
            return False

        self._speaking = True
        await self._channel.send_event(
            {"type": "audio_begin", "sample_rate": self._settings.tts_sample_rate}
        )
        try:
            if cached is not None:
                # ~90% of turns land here, which is what keeps Aura's
                # 45-stream cap off the critical path (05 §7).
                await self._stream_pcm(self._cache.read(cached))
                return True

            await self._speak_live(node.text)
            return False
        finally:
            self._speaking = False
            await self._channel.send_event({"type": "audio_end"})

    async def _speak_live(self, text: str) -> None:
        """The cache-miss path. Every turn that reaches here consumes one of the
        45 concurrent Aura streams."""
        if self._tts is None or not self._tts.is_open or self._tts.is_expiring:
            if self._tts is not None:
                # 05 §5: the TTS socket has a hard 60-minute cap, so it is
                # per-session and recycled rather than long-lived.
                await self._tts.close()
            self._tts = SpeakConnection(self._settings, self._tokens)
            await self._tts.open()

        async for chunk in self._tts.synthesize(text):
            await self._channel.send_audio(chunk)

    async def _stream_pcm(self, pcm: bytes) -> None:
        for offset in range(0, len(pcm), _PCM_CHUNK_BYTES):
            await self._channel.send_audio(pcm[offset : offset + _PCM_CHUNK_BYTES])

    # --- persistence ------------------------------------------------------

    async def _record_turn(
        self,
        node: QuestionNode,
        *,
        outcome: TurnOutcome,
        answer: IntakeAnswer | None,
        commit_reason: str,
        tts_cache_hit: bool,
    ) -> None:
        event = TurnEvent(
            session_id=self.session_id,
            turn_index=self._turn_index,
            question_id=node.id,
            prompt_version=node.prompt_version,
            outcome=outcome,
            answer=answer,
            stt_model=self._settings.stt_model,
            tts_cache_hit=tts_cache_hit,
        )
        self._turn_index += 1

        _trace_turn(
            session_id=self.session_id,
            turn_index=event.turn_index,
            question_id=node.id,
            prompt_version=node.prompt_version,
            outcome=outcome.value,
            commit_reason=commit_reason,
            segment_count=answer.provenance.segment_count if answer else 0,
            tts_cache_hit=tts_cache_hit,
            connection_index=self._connection_index,
        )

        # Over the wire to the TypeScript tier. No database client here, ever.
        await self._persistence.persist(event)
