"""The no-PHI rule is structural, so it is testable.

Doc 06 §3 layer 2 says send structure, never content. The version of that rule
which fails safely is not "reviewers will catch it" and not "the Langfuse config
has capture_input=False" — a config is one deployment away from being wrong.
It is: a traced function that takes patient content cannot be imported.
"""

from __future__ import annotations

import logging

import pytest

from voice_gateway.telemetry import ALLOWED_SPAN_PARAMS, PhiInSignatureError, traced


def test_a_transcript_parameter_fails_at_decoration_time() -> None:
    """Not at call time. At *decoration* time, which is import time, which is
    CI — before the function has ever run against a patient."""
    with pytest.raises(PhiInSignatureError, match="transcript"):

        @traced("intake.turn")
        def record(*, session_id: str, transcript: str) -> None: ...


@pytest.mark.parametrize(
    "param",
    ["transcript", "text", "answer", "utterance", "patient_name", "note", "content"],
)
def test_the_obvious_ways_to_leak_content_are_all_refused(param: str) -> None:
    source = f"def span(*, session_id: str, {param}: str) -> None: ...\n"
    namespace: dict[str, object] = {}
    exec(source, namespace)  # noqa: S102 - building a signature is the point

    with pytest.raises(PhiInSignatureError, match=param):
        traced("t")(namespace["span"])  # type: ignore[arg-type]


def test_structural_parameters_are_accepted() -> None:
    @traced("intake.turn")
    def span(
        *,
        session_id: str,
        turn_index: int,
        question_id: str,
        outcome: str,
        tts_cache_hit: bool,
    ) -> str:
        return "ok"

    assert span(
        session_id="s", turn_index=0, question_id="knee.onset", outcome="answered",
        tts_cache_hit=True,
    ) == "ok"


def test_the_allowlist_holds_no_content_bearing_names() -> None:
    """A regression guard on the allowlist itself. Adding a name to it is a
    decision about what leaves the PHI boundary; this makes the careless
    version of that decision fail."""
    forbidden = {"transcript", "text", "answer", "utterance", "prompt", "content",
                 "input", "output", "message", "name", "patient_id", "mrn"}
    assert not (ALLOWED_SPAN_PARAMS & forbidden)


def test_there_is_no_capture_input_or_capture_output_path_at_all() -> None:
    """Production config is capture_input=False / capture_output=False. That is
    a setting, and a setting is one bad deployment away from being wrong. The
    stronger guarantee is that no code path exists to capture either, so a wrong
    setting has nothing to turn on.

    Checked against the parse tree rather than the text, because the module's
    own prose says "no `input=`, no `output=`" and a substring scan would happily
    fail on the documentation of the property it is verifying."""
    import ast
    import inspect

    from voice_gateway import telemetry

    tree = ast.parse(inspect.getsource(telemetry))
    passed = {
        kw.arg
        for node in ast.walk(tree)
        if isinstance(node, ast.Call)
        for kw in node.keywords
        if kw.arg is not None
    }
    assert not passed & {"input", "output", "capture_input", "capture_output"}


def test_a_span_emits_structure_and_a_duration(caplog: pytest.LogCaptureFixture) -> None:
    @traced("intake.turn")
    def span(*, session_id: str, question_id: str) -> None: ...

    with caplog.at_level(logging.INFO, logger="voice_gateway.trace"):
        span(session_id="episode-1", question_id="knee.onset")

    line = caplog.records[-1].getMessage()
    assert "span=intake.turn" in line
    assert "question_id=knee.onset" in line
    assert "duration_ms=" in line


async def test_async_functions_are_checked_the_same_way() -> None:
    with pytest.raises(PhiInSignatureError):

        @traced("intake.turn")
        async def span(*, session_id: str, transcript: str) -> None: ...


def test_the_real_turn_span_imports() -> None:
    """`session._trace_turn` is decorated at module scope, so importing the turn
    loop at all is the assertion. Named here so the failure reads as a PHI
    violation rather than an unrelated import error."""
    from voice_gateway.turn.session import _trace_turn

    assert _trace_turn is not None
