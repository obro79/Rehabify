"""Behaviour of the URL builder.

05 §3 lists three keyterm mistakes that Deepgram accepts without error and acts
on incorrectly, and says a single unit test on the URL builder is the whole
mitigation. That is the second half of this file. The first half is the
opt-out flag, which is the part that is a PHI disclosure when it goes wrong.
"""

from __future__ import annotations

from urllib.parse import parse_qs, urlsplit

import pytest

from voice_gateway.deepgram.urls import (
    DeepgramEndpoint,
    DeepgramUrlError,
    build_auth_grant_url,
    build_deepgram_url,
    build_listen_url,
    build_speak_url,
)


def _query(url: str) -> dict[str, list[str]]:
    return parse_qs(urlsplit(url).query, keep_blank_values=True)


# --- mip_opt_out ---------------------------------------------------------


@pytest.mark.parametrize(
    "url_factory",
    [
        pytest.param(
            lambda: build_listen_url(
                model="nova-3-medical",
                sample_rate=16000,
                endpointing_ms=400,
                utterance_end_ms=1500,
            ),
            id="listen",
        ),
        pytest.param(
            lambda: build_speak_url(model="aura-2-harmonia-en", sample_rate=24000),
            id="speak",
        ),
        pytest.param(build_auth_grant_url, id="auth-grant"),
    ],
)
def test_every_endpoint_is_opted_out_of_model_training(url_factory) -> None:
    assert _query(url_factory())["mip_opt_out"] == ["true"]


def test_the_flag_survives_a_caller_who_passes_their_own_params() -> None:
    url = build_deepgram_url(
        DeepgramEndpoint.LISTEN,
        params={"model": "nova-3-medical", "channels": 1},
    )
    assert _query(url)["mip_opt_out"] == ["true"]


def test_the_flag_cannot_be_turned_off() -> None:
    with pytest.raises(DeepgramUrlError, match="cannot be disabled"):
        build_deepgram_url(DeepgramEndpoint.LISTEN, params={"mip_opt_out": "false"})


def test_passing_the_flag_redundantly_does_not_duplicate_it() -> None:
    # Two mip_opt_out params is not a disclosure, but it is a sign someone
    # thinks they own this flag. Collapse it rather than emit both.
    url = build_deepgram_url(DeepgramEndpoint.LISTEN, params={"mip_opt_out": "true"})
    assert _query(url)["mip_opt_out"] == ["true"]


# --- keyterms: the three silent failures from 05 §3 ----------------------


def test_keyterms_are_a_repeated_parameter_not_a_comma_list() -> None:
    url = build_listen_url(
        model="nova-3-medical",
        sample_rate=16000,
        endpointing_ms=400,
        utterance_end_ms=1500,
        keyterms=("patellofemoral", "meniscus"),
    )
    assert _query(url)["keyterm"] == ["patellofemoral", "meniscus"]
    assert "patellofemoral,meniscus" not in url


def test_a_comma_inside_a_keyterm_is_rejected_rather_than_sent() -> None:
    with pytest.raises(DeepgramUrlError, match="comma"):
        build_listen_url(
            model="nova-3-medical",
            sample_rate=16000,
            endpointing_ms=400,
            utterance_end_ms=1500,
            keyterms=("patella,meniscus",),
        )


def test_multi_word_keyterms_are_percent_encoded_not_plus_encoded() -> None:
    url = build_listen_url(
        model="nova-3-medical",
        sample_rate=16000,
        endpointing_ms=400,
        utterance_end_ms=1500,
        keyterms=("rotator cuff",),
    )
    assert "keyterm=rotator%20cuff" in url
    assert "rotator+cuff" not in url
    assert _query(url)["keyterm"] == ["rotator cuff"]


def test_keyword_style_weights_are_rejected() -> None:
    # `keyterm=patella:0.15` is `keywords` syntax. Deepgram accepts it as one
    # literal term and boosts nothing.
    with pytest.raises(DeepgramUrlError, match="weight"):
        build_listen_url(
            model="nova-3-medical",
            sample_rate=16000,
            endpointing_ms=400,
            utterance_end_ms=1500,
            keyterms=("patella:0.15",),
        )


def test_keyterm_case_is_preserved() -> None:
    # Case influences output: lowercase common nouns, capitalize proper nouns.
    url = build_listen_url(
        model="nova-3-medical",
        sample_rate=16000,
        endpointing_ms=400,
        utterance_end_ms=1500,
        keyterms=("patellofemoral", "Achilles"),
    )
    assert _query(url)["keyterm"] == ["patellofemoral", "Achilles"]


def test_keyterms_must_go_through_the_keyterms_argument() -> None:
    with pytest.raises(DeepgramUrlError, match="keyterms"):
        build_deepgram_url(DeepgramEndpoint.LISTEN, params={"keyterm": "patella"})


# --- listen parameters pinned by 05 §3 -----------------------------------


def test_interim_results_is_on_because_utterance_end_silently_needs_it() -> None:
    q = _query(
        build_listen_url(
            model="nova-3-medical",
            sample_rate=16000,
            endpointing_ms=400,
            utterance_end_ms=1500,
        )
    )
    # Without interim_results, utterance_end_ms never fires and the safety net
    # in 05 §4 does not exist — with no error to tell you.
    assert q["interim_results"] == ["true"]
    assert q["utterance_end_ms"] == ["1500"]


def test_smart_format_is_off_on_purpose() -> None:
    q = _query(
        build_listen_url(
            model="nova-3-medical",
            sample_rate=16000,
            endpointing_ms=400,
            utterance_end_ms=1500,
        )
    )
    # It delays finalization waiting for entities to complete, suppressing
    # speech_final mid-utterance. Normalization is ours (05 §3).
    assert q["smart_format"] == ["false"]
    assert q["numerals"] == ["true"]
    assert q["vad_events"] == ["true"]


def test_booleans_are_serialised_the_way_deepgram_expects() -> None:
    url = build_deepgram_url(DeepgramEndpoint.LISTEN, params={"interim_results": True})
    assert "interim_results=true" in url
    assert "True" not in url


def test_diarize_is_not_sent() -> None:
    # Deprecated, halves EU/AU streaming concurrency, and intake is
    # single-speaker anyway (05 §5).
    url = build_listen_url(
        model="nova-3-medical",
        sample_rate=16000,
        endpointing_ms=400,
        utterance_end_ms=1500,
    )
    assert "diarize" not in url


@pytest.mark.parametrize("bad", [999, 5001, 0])
def test_utterance_end_ms_is_range_checked(bad: int) -> None:
    with pytest.raises(DeepgramUrlError, match="utterance_end_ms"):
        build_listen_url(
            model="nova-3-medical",
            sample_rate=16000,
            endpointing_ms=400,
            utterance_end_ms=bad,
        )


# --- schemes and hosts ---------------------------------------------------


def test_websocket_endpoints_get_wss_and_rest_endpoints_get_https() -> None:
    assert build_listen_url(
        model="m", sample_rate=16000, endpointing_ms=400, utterance_end_ms=1500
    ).startswith("wss://")
    assert build_speak_url(model="m", sample_rate=24000).startswith("wss://")
    assert build_auth_grant_url().startswith("https://")


def test_an_unknown_host_is_rejected_unless_declared_self_hosted() -> None:
    with pytest.raises(DeepgramUrlError, match="not a known Deepgram host"):
        build_auth_grant_url(host="deepgram.attacker.example")

    # ADR-013: self-hosted in ca-central-1. The flag is inert there and stays
    # on anyway — the choke point still governs the cloud fallback.
    url = build_auth_grant_url(host="deepgram.internal", allow_self_hosted_host=True)
    assert url.startswith("https://deepgram.internal/")
    assert _query(url)["mip_opt_out"] == ["true"]


def test_the_regional_hosts_are_the_only_public_ones() -> None:
    for host in ("api.deepgram.com", "api.eu.deepgram.com", "api.au.deepgram.com"):
        assert build_auth_grant_url(host=host).startswith(f"https://{host}/")
    # There is no Canadian endpoint. If this ever starts failing because
    # Deepgram shipped one, ADR-013 gets a lot cheaper.
    with pytest.raises(DeepgramUrlError):
        build_auth_grant_url(host="api.ca.deepgram.com")
