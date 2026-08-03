"""Runtime configuration for the voice gateway.

There is exactly one thing that must never appear in this file: a database URL.
The gateway sits inside the PHI boundary but outside the *persistence* boundary
(ADR-016, doc 03 §4). It receives audio, returns validated models, and hands
each turn to the TypeScript tier over HTTP. It cannot reach Postgres because it
has no credentials to reach it with.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_SERVICE_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="VOICE_GATEWAY_",
        env_file=(_SERVICE_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Deepgram ---------------------------------------------------------
    # The long-lived key is used for exactly one thing: minting short-lived
    # tokens at /v1/auth/grant. It never enters the STT or TTS request path.
    deepgram_api_key: str = ""

    # Host is configurable because ADR-013 points at self-hosted Deepgram in
    # ca-central-1. `mip_opt_out` becomes moot on that path and the choke point
    # stays anyway — a guarantee that holds only while one deployment mode
    # holds is not a guarantee.
    deepgram_host: str = "api.deepgram.com"

    # Ephemeral tokens only need to be valid at handshake time (05 §2).
    deepgram_token_ttl_seconds: int = 30

    stt_model: str = "nova-3-medical"
    stt_endpointing_ms: int = 400
    stt_utterance_end_ms: int = 1500

    tts_model: str = "aura-2-harmonia-en"
    """05 §7 lists harmonia and vesta as the clinical-tone candidates and calls
    the choice a product decision for the clinical lead. harmonia is the
    placeholder, not the decision."""

    # --- Audio formats ----------------------------------------------------
    browser_sample_rate: int = 16000
    """linear16 @ 16 kHz from the browser AudioWorklet (05 §2)."""

    tts_sample_rate: int = 24000
    """Aura-2 linear16 output rate. The WS TTS endpoint emits raw audio only —
    linear16/mulaw/alaw — so the browser plays it through Web Audio, not
    <audio src> (05 §7)."""

    # --- Pre-rendered approved-question audio (05 §7) ---------------------
    audio_cache_dir: Path = _SERVICE_ROOT / "audio-cache"
    prompt_version: str = "knee-v0-mock"
    """Part of the pre-render cache key. Slice 3 owns the real versioned graph."""

    barge_in_enabled: bool = False
    """`SpeechStarted` in, Aura `Clear` out — the primitives are wired in
    `turn/session.py`, and the policy is not decided. Off by default because a
    patient who says "um" three words into a question would cut it off, and
    05 §4 already warns that VAD false positives are expected in a clinic room.
    Turning this on is a product decision with the clinical lead."""

    max_reconnect_attempts: int = 5
    reconnect_backoff_seconds: float = 0.5

    # --- The TypeScript persistence hop (ADR-016) -------------------------
    persist_turn_url: str = "http://127.0.0.1:8787/api/internal/intake/turn"
    persist_turn_token: str = "dev-shared-secret"
    persist_timeout_seconds: float = 5.0

    # --- Telemetry (doc 06 §3) -------------------------------------------
    langfuse_capture_input: bool = False
    langfuse_capture_output: bool = False
    """Production posture. Never flip these on a deployment that sees real
    patient traffic; slice 4 owns the two-project split that makes the eval
    path safe."""

    # --- Server -----------------------------------------------------------
    host: str = "127.0.0.1"
    port: int = 8080
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://127.0.0.1:8080"])

    @field_validator("deepgram_host")
    @classmethod
    def _no_scheme_in_host(cls, v: str) -> str:
        if "://" in v or "/" in v:
            raise ValueError("deepgram_host is a bare hostname, not a URL")
        return v

    @property
    def has_deepgram_credentials(self) -> bool:
        return bool(self.deepgram_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
