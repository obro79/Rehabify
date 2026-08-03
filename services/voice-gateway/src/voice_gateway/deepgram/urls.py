"""The single place a Deepgram URL is constructed.

    SECURITY-CRITICAL. Same review bar as the RLS client boundary in doc 03.

Deepgram's published rates opt in to the Model Improvement Partnership Program.
For a self-serve account **the default posture is opt-in to training on your
audio.** The opt-out is a per-request query parameter, and the retention
guarantee rides on it:

> "Data from opted-out requests is retained only for the duration necessary to
> process the request."

Per request. Not per account. **A single request missing the flag is a PHI
disclosure** (05 §6).

So `mip_opt_out=true` is not a default here, it is not a keyword argument, and
it is not something a caller can turn off. It is welded on after the caller's
parameters are applied. `tests/test_url_chokepoint.py` walks the AST of every
other module in the package and fails if any of them so much as mentions a
Deepgram host — the flag is only as good as the guarantee that no code path
routes around this function.

ADR-013 moves us toward self-hosted Deepgram in ca-central-1, where nothing is
sent to Deepgram and the flag is moot. The choke point stays regardless: it
still governs any cloud fallback, and a guarantee that holds only while one
deployment mode holds is not a guarantee.
"""

from __future__ import annotations

from enum import StrEnum
from urllib.parse import quote, urlencode

MIP_OPT_OUT_PARAM = "mip_opt_out"
MIP_OPT_OUT_VALUE = "true"

DEEPGRAM_HOSTS: frozenset[str] = frozenset(
    {
        "api.deepgram.com",
        "api.eu.deepgram.com",
        "api.au.deepgram.com",
    }
)
"""The public regional endpoints. There is no Canadian one — that absence is
what ADR-013 is about. Self-hosted deployments use a private host, which is
allowed through `allow_self_hosted_host`."""


class DeepgramEndpoint(StrEnum):
    """Every Deepgram surface this service touches."""

    LISTEN = "/v1/listen"
    SPEAK = "/v1/speak"
    AUTH_GRANT = "/v1/auth/grant"


_WEBSOCKET_ENDPOINTS = frozenset({DeepgramEndpoint.LISTEN, DeepgramEndpoint.SPEAK})


class DeepgramUrlError(ValueError):
    """Raised for a keyterm or parameter that Deepgram would accept silently
    and act on incorrectly. Every one of these is a failure that returns HTTP
    200 and boosts nothing (05 §3)."""


def _validate_keyterm(term: str) -> str:
    if not term or not term.strip():
        raise DeepgramUrlError("keyterm must not be empty")
    if "," in term:
        # `keyterm=a,b,c` is accepted as ONE literal keyterm containing commas.
        raise DeepgramUrlError(
            f"keyterm {term!r} contains a comma. Deepgram takes this as a single "
            "literal term and boosts nothing. Pass separate terms instead."
        )
    if ":" in term:
        # `keyterm=patella:0.15` is `keywords` syntax. Nova-3 keyterms have no
        # weights; the colon and number become part of the term.
        raise DeepgramUrlError(
            f"keyterm {term!r} looks like a weight. Keyterm weights are not "
            "supported — the weight would be treated as part of the term."
        )
    return term


def build_deepgram_url(
    endpoint: DeepgramEndpoint,
    *,
    params: dict[str, str | int | float | bool] | None = None,
    keyterms: tuple[str, ...] | list[str] = (),
    host: str | None = None,
    allow_self_hosted_host: bool | None = None,
    over_http: bool = False,
) -> str:
    """Build a Deepgram URL. Always opted out of model training.

    Args:
        endpoint: which Deepgram surface. Determines wss:// vs https://.
        over_http: force https:// for an endpoint that also has a WebSocket
            form. Only `speak` has both: the socket streams raw PCM during a
            turn, the REST form renders the approved question set at build
            time. Same endpoint, same opt-out, different transport.
        params: query parameters. `mip_opt_out` is forced on afterwards; passing
            it explicitly with any value other than "true" is an error rather
            than a silent override.
        keyterms: emitted as a repeated `keyterm` parameter, percent-encoded.
        host: overrides the configured host. Must be a known Deepgram host
            unless `allow_self_hosted_host` is set.
        allow_self_hosted_host: permits a private host for the ADR-013
            self-hosted deployment. Note that the opt-out flag is still applied
            — it is inert there, and harmless. Defaults to the configured
            setting, so the deployment is reachable by configuration rather than
            only by a keyword argument every call site would have to remember to
            thread through; pass it explicitly to override.

    Raises:
        DeepgramUrlError: on a keyterm or parameter that would fail silently.
    """
    from voice_gateway.config import get_settings

    settings = get_settings()
    resolved_host = host or settings.deepgram_host
    allow_self_hosted = (
        settings.deepgram_allow_self_hosted_host
        if allow_self_hosted_host is None
        else allow_self_hosted_host
    )
    if resolved_host not in DEEPGRAM_HOSTS and not allow_self_hosted:
        raise DeepgramUrlError(
            f"{resolved_host!r} is not a known Deepgram host. If this is the "
            "self-hosted deployment, set deepgram_allow_self_hosted_host."
        )

    supplied = dict(params or {})

    # A caller trying to set the flag is either redundant or attacking the
    # guarantee. Both should be loud.
    if MIP_OPT_OUT_PARAM in supplied:
        if str(supplied[MIP_OPT_OUT_PARAM]).lower() != MIP_OPT_OUT_VALUE:
            raise DeepgramUrlError(
                f"{MIP_OPT_OUT_PARAM} cannot be disabled. It is the per-request "
                "zero-retention guarantee (05 §6)."
            )
        del supplied[MIP_OPT_OUT_PARAM]

    if "keyterm" in supplied:
        raise DeepgramUrlError("pass keyterms via the `keyterms` argument, not `params`")

    pairs: list[tuple[str, str]] = []
    for key, value in supplied.items():
        if isinstance(value, bool):
            # Deepgram wants "true"/"false", not Python's "True"/"False".
            pairs.append((key, "true" if value else "false"))
        else:
            pairs.append((key, str(value)))

    # Repeated parameter, one entry per term. `urlencode` with `quote` gives
    # %20 for spaces rather than the `+` that quote_plus would produce.
    for term in keyterms:
        pairs.append(("keyterm", _validate_keyterm(term)))

    # Welded on last, unconditionally, on every endpoint. STT, TTS, and every
    # other Deepgram call (05 §6, consequence 1).
    pairs.append((MIP_OPT_OUT_PARAM, MIP_OPT_OUT_VALUE))

    scheme = "wss" if endpoint in _WEBSOCKET_ENDPOINTS and not over_http else "https"
    query = urlencode(pairs, quote_via=quote, safe="")
    return f"{scheme}://{resolved_host}{endpoint.value}?{query}"


def build_listen_url(
    *,
    model: str,
    sample_rate: int,
    endpointing_ms: int,
    utterance_end_ms: int,
    keyterms: tuple[str, ...] = (),
    host: str | None = None,
    allow_self_hosted_host: bool | None = None,
) -> str:
    """Streaming STT connection parameters, exactly as pinned in 05 §3."""
    if not 1000 <= utterance_end_ms <= 5000:
        raise DeepgramUrlError("utterance_end_ms must be between 1000 and 5000")

    return build_deepgram_url(
        DeepgramEndpoint.LISTEN,
        params={
            "model": model,
            "encoding": "linear16",
            "sample_rate": sample_rate,
            "channels": 1,
            # REQUIRED for utterance_end_ms. Without it UtteranceEnd never
            # fires and the safety net in 05 §4 silently does not exist.
            "interim_results": True,
            "endpointing": endpointing_ms,
            "utterance_end_ms": utterance_end_ms,
            # SpeechStarted, for barge-in.
            "vad_events": True,
            "numerals": True,
            # Deliberate. Smart formatting delays finalization while it waits
            # for an entity to complete, which suppresses speech_final
            # mid-utterance. The question graph already tells us the expected
            # answer type, so we normalize "seven out of ten" ourselves and
            # keep formatting decoupled from turn detection (05 §3).
            "smart_format": False,
        },
        keyterms=keyterms,
        host=host,
        allow_self_hosted_host=allow_self_hosted_host,
    )


def build_speak_url(
    *,
    model: str,
    sample_rate: int,
    container: str | None = None,
    over_http: bool = False,
    host: str | None = None,
    allow_self_hosted_host: bool | None = None,
) -> str:
    """TTS URL, for both the streaming socket and the REST pre-render.

    One builder serves both, which is the point. Both are Deepgram calls
    carrying PHI-adjacent text — a question can encode the answer to the
    previous one (05 §6, question 4) — so both are opted out.

    The encoding split from 05 §7 is why `over_http` exists: the streaming
    socket emits raw audio only (`linear16`/`mulaw`/`alaw`), while containerised
    formats are REST-only. The pre-render is a REST call; the live
    clarification path is the socket.
    """
    params: dict[str, str | int | float | bool] = {
        "model": model,
        "encoding": "linear16",
        "sample_rate": sample_rate,
    }
    if container is not None:
        params["container"] = container

    return build_deepgram_url(
        DeepgramEndpoint.SPEAK,
        params=params,
        host=host,
        allow_self_hosted_host=allow_self_hosted_host,
        over_http=over_http,
    )


def build_auth_grant_url(
    *, host: str | None = None, allow_self_hosted_host: bool | None = None
) -> str:
    """Ephemeral token grant. Also goes through the builder — "all API
    requests" in 05 §6 has no carve-out for the ones that do not carry audio,
    and an exception here is the crack the next one grows from."""
    return build_deepgram_url(
        DeepgramEndpoint.AUTH_GRANT,
        host=host,
        allow_self_hosted_host=allow_self_hosted_host,
    )
