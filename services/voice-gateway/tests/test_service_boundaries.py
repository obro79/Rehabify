"""The three edges of this service, and what is checked at each of them.

The gateway sits inside the PHI boundary and outside the persistence boundary
(ADR-016). That makes its edges the interesting part: who may open an intake
session, what it presents to the TypeScript tier, and where it is allowed to
send audio. Each of these had a check that looked present and was not.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from voice_gateway.app import _origin_is_allowed, app
from voice_gateway.config import Settings
from voice_gateway.deepgram.urls import DeepgramUrlError, build_auth_grant_url

# --- who may open an intake session ---------------------------------------


def test_a_page_on_another_origin_cannot_open_a_session() -> None:
    """CORS does not cover this. A browser sends no preflight for a WebSocket
    handshake and applies no same-origin rule to it, so the CORS middleware —
    which is where `allowed_origins` was wired — never sees this request."""
    with TestClient(app) as client:
        with pytest.raises(WebSocketDisconnect) as caught:
            with client.websocket_connect(
                "/v1/intake/stream", headers={"Origin": "https://not-us.example"}
            ):
                pass

    assert caught.value.code == 1008


@pytest.mark.parametrize(
    ("origin", "allowed", "expected"),
    [
        ("http://127.0.0.1:8080", ["http://127.0.0.1:8080"], True),
        ("https://evil.example", ["http://127.0.0.1:8080"], False),
        # No Origin means not a browser. Native clients are the deployment's
        # problem to authenticate, and here that means "not yet".
        (None, ["http://127.0.0.1:8080"], False),
        (None, ["*"], True),
        ("https://anything.example", ["*"], True),
        # Not a prefix match: a domain that merely starts with an allowed one
        # is a different origin.
        ("http://127.0.0.1:8080.evil.example", ["http://127.0.0.1:8080"], False),
    ],
)
def test_origin_matching(origin: str | None, allowed: list[str], expected: bool) -> None:
    assert _origin_is_allowed(origin, allowed) is expected


# --- what it presents to the TypeScript tier ------------------------------


def _post(client: TestClient, token: str | None) -> int:
    event = {
        "session_id": "11111111-1111-1111-1111-111111111111",
        "turn_index": 0,
        "question_id": "knee.onset",
        "prompt_version": "knee-v0-mock",
        "outcome": "reprompt",
        "stt_model": "nova-3-medical",
        "tts_cache_hit": True,
        "answer": None,
    }
    headers = {} if token is None else {"Authorization": f"Bearer {token}"}
    return client.post("/api/internal/intake/turn", json=event, headers=headers).status_code


def test_the_stub_checks_the_token_rather_than_its_shape() -> None:
    """A stub that accepts any bearer teaches the shape of the check without
    the substance of it — and the real TypeScript route gets written from this
    file. `persist_turn_token` existing in config made it read as enforced."""
    from voice_gateway.persistence.stub_server import app as stub

    with TestClient(stub) as client:
        assert _post(client, None) == 401
        assert _post(client, "not-the-secret") == 401
        assert _post(client, Settings().persist_turn_token) == 201


# --- where it is allowed to send audio ------------------------------------


def test_a_self_hosted_host_is_reachable_by_configuration(monkeypatch) -> None:
    """ADR-013 points at self-hosted Deepgram in ca-central-1, because there is
    no Canadian Deepgram region. The builder had an `allow_self_hosted_host`
    parameter that no call site passed, so that deployment was unreachable —
    every URL raised. A flag only the tests can set is not a flag."""
    from voice_gateway import config

    def _self_hosted() -> Settings:
        return Settings(
            deepgram_host="deepgram.internal.rehabify.ca",
            deepgram_allow_self_hosted_host=True,
        )

    monkeypatch.setattr(config, "get_settings", _self_hosted)
    url = build_auth_grant_url()

    assert url.startswith("https://deepgram.internal.rehabify.ca/v1/auth/grant")
    # Inert on a self-hosted deployment, and applied anyway. A guarantee that
    # holds only while one deployment mode holds is not a guarantee.
    assert "mip_opt_out=true" in url


def test_an_unrecognised_host_still_fails_without_the_flag(monkeypatch) -> None:
    """Off by default, so a typo in `deepgram_host` fails loudly instead of
    quietly sending audio somewhere unintended."""
    from voice_gateway import config

    monkeypatch.setattr(
        config, "get_settings", lambda: Settings(deepgram_host="api.deepgran.com")
    )

    with pytest.raises(DeepgramUrlError, match="not a known Deepgram host"):
        build_auth_grant_url()
