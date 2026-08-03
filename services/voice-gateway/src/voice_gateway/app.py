"""FastAPI application: the browser-facing half of the gateway.

    browser ──WSS──► /v1/intake/stream   ◄── the PHI boundary starts here

Audio arrives as binary frames of linear16 @ 16 kHz from an AudioWorklet.
Control arrives as JSON text frames. Everything going back out is either a JSON
event or a binary frame of linear16 PCM for Web Audio playback — the streaming
TTS surface emits raw audio only, so `<audio src>` is not available to us
(05 §7).
"""

from __future__ import annotations

import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from voice_gateway.audio.cache import PrerenderedAudioCache
from voice_gateway.config import get_settings
from voice_gateway.deepgram.auth import EphemeralTokenProvider
from voice_gateway.persistence.client import TurnPersistenceClient
from voice_gateway.turn.session import IntakeSession

logger = logging.getLogger(__name__)

_STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    app.state.tokens = EphemeralTokenProvider(settings)
    app.state.cache = PrerenderedAudioCache(settings.audio_cache_dir)
    app.state.persistence = TurnPersistenceClient(settings)
    logger.info(
        "voice gateway ready (stt=%s tts=%s deepgram=%s)",
        settings.stt_model,
        settings.tts_model,
        "configured" if settings.has_deepgram_credentials else "NOT CONFIGURED",
    )
    try:
        yield
    finally:
        await app.state.tokens.aclose()
        await app.state.persistence.aclose()


app = FastAPI(title="Rehabify voice gateway", lifespan=lifespan, docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> JSONResponse:
    settings = app.state.settings
    cache: PrerenderedAudioCache = app.state.cache
    return JSONResponse(
        {
            "ok": True,
            "stt_model": settings.stt_model,
            "tts_model": settings.tts_model,
            "deepgram_configured": settings.has_deepgram_credentials,
            "audio_cache_hit_rate": round(cache.hit_rate, 3),
            # Stated rather than assumed. If this is ever anything but false,
            # something has gone very wrong with ADR-016.
            "database_connected": False,
        }
    )


@app.get("/demo")
async def demo() -> FileResponse:
    return FileResponse(_STATIC_DIR / "demo.html")


@app.get("/demo/worklet.js")
async def worklet() -> FileResponse:
    return FileResponse(_STATIC_DIR / "worklet.js", media_type="text/javascript")


class _WebSocketChannel:
    """Adapts a FastAPI WebSocket to the session's `BrowserChannel`."""

    def __init__(self, websocket: WebSocket) -> None:
        self._ws = websocket

    async def send_event(self, event: dict[str, object]) -> None:
        await self._ws.send_text(json.dumps(event))

    async def send_audio(self, chunk: bytes) -> None:
        await self._ws.send_bytes(chunk)


@app.websocket("/v1/intake/stream")
async def intake_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    settings = app.state.settings

    session = IntakeSession(
        settings=settings,
        channel=_WebSocketChannel(websocket),
        tokens=app.state.tokens,
        cache=app.state.cache,
        persistence=app.state.persistence,
    )

    try:
        await session.start()
        while True:
            message = await websocket.receive()

            if message["type"] == "websocket.disconnect":
                break

            if (chunk := message.get("bytes")) is not None:
                # linear16 @ 16 kHz, straight through to Deepgram.
                await session.push_audio(chunk)
                continue

            if (text := message.get("text")) is not None:
                await _handle_control(session, text)

    except WebSocketDisconnect:
        logger.info("browser disconnected from session %s", session.session_id)
    except Exception:
        logger.exception("intake stream failed for session %s", session.session_id)
    finally:
        await session.aclose()


async def _handle_control(session: IntakeSession, raw: str) -> None:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("undecodable control frame from browser")
        return

    match payload.get("type"):
        case "text":
            # Transcript mode — see IntakeSession.push_text. Development only.
            await session.push_text(str(payload.get("text", "")))
        case "simulate_drop":
            logger.info("simulating a connection drop for session %s", session.session_id)
            await session.simulate_connection_drop()
        case other:
            logger.debug("ignoring unknown control frame %r", other)
