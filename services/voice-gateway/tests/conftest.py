from __future__ import annotations

import asyncio
from collections.abc import Callable
from pathlib import Path

import httpx
import pytest

from voice_gateway.audio.cache import PrerenderedAudioCache
from voice_gateway.audio.prerender import render_all
from voice_gateway.config import Settings
from voice_gateway.contracts import TurnEvent
from voice_gateway.persistence.client import TurnPersistenceClient


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    """A credential-free configuration.

    No Deepgram key means the session runs in transcript mode, which exercises
    the turn loop, the graph transition, the audio cache and the persistence
    hop without a network. And no database URL, because there is no such
    setting to give it (ADR-016).
    """
    return Settings(
        deepgram_api_key="",
        audio_cache_dir=tmp_path / "audio-cache",
        persist_turn_url="http://persistence.test/api/internal/intake/turn",
        max_reconnect_attempts=2,
        reconnect_backoff_seconds=0.0,
    )


@pytest.fixture
async def cache(settings: Settings) -> PrerenderedAudioCache:
    await render_all(offline=True, settings=settings)
    return PrerenderedAudioCache(settings.audio_cache_dir)


class RecordingPersistence(TurnPersistenceClient):
    """The real client against an in-memory transport.

    Using the real class means the retry logic, the headers and the JSON
    serialisation are all under test, rather than a mock that agrees with
    whatever the code does.
    """

    def __init__(self, settings: Settings, *, responder: Callable[[httpx.Request], httpx.Response] | None = None) -> None:
        self.received: list[TurnEvent] = []

        def handle(request: httpx.Request) -> httpx.Response:
            if responder is not None:
                return responder(request)
            self.received.append(TurnEvent.model_validate_json(request.content))
            return httpx.Response(201, json={"accepted": True})

        super().__init__(settings, client=httpx.AsyncClient(transport=httpx.MockTransport(handle)))


@pytest.fixture
async def persistence(settings: Settings) -> RecordingPersistence:
    return RecordingPersistence(settings)


class FakeChannel:
    """Stands in for the browser socket."""

    def __init__(self) -> None:
        self.events: list[dict] = []
        self.audio_chunks: list[bytes] = []

    async def send_event(self, event: dict) -> None:
        self.events.append(event)

    async def send_audio(self, chunk: bytes) -> None:
        self.audio_chunks.append(chunk)

    def of_type(self, event_type: str) -> list[dict]:
        return [e for e in self.events if e.get("type") == event_type]

    @property
    def spoken(self) -> list[str]:
        return [str(e["text"]) for e in self.of_type("assistant_text")]

    @property
    def audio_bytes(self) -> int:
        return sum(len(c) for c in self.audio_chunks)

    async def wait_for(self, predicate: Callable[[list[dict]], bool], timeout: float = 2.0) -> None:
        deadline = asyncio.get_running_loop().time() + timeout
        while asyncio.get_running_loop().time() < deadline:
            if predicate(self.events):
                return
            await asyncio.sleep(0.01)
        raise AssertionError(f"timed out; events so far: {[e.get('type') for e in self.events]}")

    async def wait_for_listening_on(self, question_id: str, timeout: float = 2.0) -> None:
        await self.wait_for(
            lambda events: any(
                e.get("type") == "listening" and e.get("question_id") == question_id
                for e in events
            ),
            timeout,
        )


@pytest.fixture
def channel() -> FakeChannel:
    return FakeChannel()
