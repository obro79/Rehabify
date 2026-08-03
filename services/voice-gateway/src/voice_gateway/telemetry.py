"""Structure-only tracing, with the no-PHI rule enforced at import time.

Doc 06 §3 layer 2: *send structure, never content.* Token counts, validation
verdicts, latency, model ID, prompt version, question-node ID, retry count, turn
index. Never the transcript.

The failure this module is designed against is not malice, it is convenience:
someone writes `@traced` on a function that happens to take the transcript as an
argument, Langfuse's default `capture_input=True` picks it up, and PHI is in a
third-party system. Production config sets `capture_input=False` and
`capture_output=False`, which is a *setting* — one deployment with the wrong
value and the guarantee is gone.

So the rule "never put patient content in a traced function's signature" is
enforced structurally instead: `@traced` reads the signature at decoration time
and refuses to decorate a function whose parameters are not on an explicit
allowlist of structural names. It fails at import, in CI, before it can ever run
against a patient.

Langfuse itself is slice 4's deliverable — two projects, separate credentials,
selected by deployment context. This module emits the same structural fields to
logs today so that wiring Langfuse in is a transport change, not a redesign.
"""

from __future__ import annotations

import functools
import inspect
import logging
import time
from collections.abc import Callable
from typing import Any, ParamSpec, TypeVar

from voice_gateway.config import get_settings

logger = logging.getLogger("voice_gateway.trace")

P = ParamSpec("P")
R = TypeVar("R")

ALLOWED_SPAN_PARAMS: frozenset[str] = frozenset(
    {
        # Opaque identifiers. Per-episode UUIDs, never an MRN, name, or
        # anything derived from one (doc 06 §3, layer 4).
        "session_id",
        "connection_index",
        # Structure.
        "turn_index",
        "question_id",
        "prompt_version",
        "answer_type",
        "outcome",
        "commit_reason",
        "segment_count",
        "retry_count",
        "attempt",
        # Models and cost.
        "model",
        "stt_model",
        "tts_model",
        "tts_cache_hit",
        # Timing and verdicts.
        "duration_seconds",
        "latency_ms",
        "validation_passed",
        "close_outcome",
        # `self` on methods.
        "self",
    }
)
"""Everything a span may take as an argument. Adding a name here is a decision
about what may leave the PHI boundary — review it as one."""


class PhiInSignatureError(TypeError):
    """A traced function takes an argument that could carry patient content."""


def _check_signature(fn: Callable[..., Any]) -> None:
    signature = inspect.signature(fn)
    offending = [
        name
        for name, param in signature.parameters.items()
        if name not in ALLOWED_SPAN_PARAMS
        and param.kind
        not in (inspect.Parameter.VAR_POSITIONAL, inspect.Parameter.VAR_KEYWORD)
    ]
    if offending:
        raise PhiInSignatureError(
            f"{fn.__qualname__} is traced but takes {', '.join(sorted(offending))}, "
            "which is not on the structural allowlist. Pass an identifier and load "
            "the content inside the function (doc 06 §3). If the argument genuinely "
            "carries no patient content, add it to ALLOWED_SPAN_PARAMS — and treat "
            "that as a decision about what leaves the PHI boundary."
        )


def traced(name: str) -> Callable[[Callable[P, R]], Callable[P, R]]:
    """Wrap a function in a span whose attributes are structure only.

    Note what is *not* here: no `input=`, no `output=`, no return-value capture.
    Not configurably — at all. A traced function's return value is frequently an
    `IntakeAnswer`, and the only reliable way not to export it is to have no
    code path that could.
    """

    def decorate(fn: Callable[P, R]) -> Callable[P, R]:
        _check_signature(fn)
        is_async = inspect.iscoroutinefunction(fn)
        signature = inspect.signature(fn)

        def attributes(args: tuple[Any, ...], kwargs: dict[str, Any]) -> dict[str, Any]:
            bound = signature.bind_partial(*args, **kwargs)
            return {
                k: v
                for k, v in bound.arguments.items()
                if k != "self" and isinstance(v, str | int | float | bool | None)
            }

        if is_async:

            @functools.wraps(fn)
            async def async_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
                started = time.monotonic()
                try:
                    return await fn(*args, **kwargs)  # type: ignore[misc]
                finally:
                    emit_span(name, attributes(args, kwargs), time.monotonic() - started)

            return async_wrapper  # type: ignore[return-value]

        @functools.wraps(fn)
        def sync_wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
            started = time.monotonic()
            try:
                return fn(*args, **kwargs)
            finally:
                emit_span(name, attributes(args, kwargs), time.monotonic() - started)

        return sync_wrapper

    return decorate


def emit_span(name: str, attributes: dict[str, Any], duration_seconds: float) -> None:
    """Where slice 4 attaches Langfuse.

    Until then this is a structured log line. The attribute set is the contract;
    the destination is not.
    """
    settings = get_settings()
    if settings.langfuse_capture_input or settings.langfuse_capture_output:
        # A deployment that sees real traffic must not have these on. Slice 4
        # replaces this warning with the two-project split that makes the eval
        # path safe by construction.
        logger.warning(
            "langfuse content capture is enabled — this configuration must never "
            "see real patient traffic (doc 06 §3)"
        )
    logger.info(
        "span=%s duration_ms=%.1f %s",
        name,
        duration_seconds * 1000,
        " ".join(f"{k}={v}" for k, v in sorted(attributes.items())),
    )
