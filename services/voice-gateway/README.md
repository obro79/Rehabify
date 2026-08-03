# Rehabify voice gateway

Browser WebSocket in, Deepgram WebSocket out, the turn loop in the middle.
Python / FastAPI per [ADR-016](../../docs/architecture/09-decision-log.md#adr-016);
the pipeline it implements is [05-voice-pipeline.md](../../docs/architecture/05-voice-pipeline.md).

```
browser mic ──linear16@16k──► /v1/intake/stream ──► Deepgram /v1/listen
                                     │                  (nova-3-medical)
                                     ├─ turn detection (05 §4)
                                     ├─ deterministic graph transition — no LLM
                                     ├─ pre-rendered approved audio (~90% of turns)
                                     └─ POST each turn to the TypeScript tier
```

## What this service must never grow

- **A database client.** It holds no connection and no credentials. Every write
  goes to the TypeScript tier over HTTP (ADR-016, doc 03 §4). Adding `asyncpg`
  here to save a round trip deletes the guarantee that makes the boundary real.
- **A second place that builds a Deepgram URL.** `deepgram/urls.py` is the only
  one, and `tests/test_url_chokepoint.py` fails the build if that stops being
  true. `mip_opt_out=true` is a per-request PHI guarantee (05 §6).
- **LangChain or LangGraph.** The model never chooses the next question.
- **PHI in a traced function's signature.** Pass an identifier, load the content
  inside (doc 06 §3).

## Running it

```sh
uv venv && uv pip install -e '.[dev]'

# 1. Pre-render the approved questions. --offline synthesises placeholder tones
#    so the loop is demonstrable without Deepgram credentials.
uv run prerender-questions --offline

# 2. The stub for the not-yet-built TypeScript persistence route.
uv run python -m voice_gateway.persistence.stub_server

# 3. The gateway. Demo client at http://127.0.0.1:8080/demo
uv run voice-gateway
```

Without `VOICE_GATEWAY_DEEPGRAM_API_KEY` the gateway starts in **transcript
mode**: the browser sends typed text instead of audio and the whole turn loop,
graph transition, audio cache and persistence hop run unchanged. That path
exists to make the loop testable, not to be shipped.

```sh
uv run pytest
```

## Layout

| Path | What it is |
|---|---|
| `deepgram/urls.py` | The choke point. Security-critical. |
| `deepgram/auth.py` | Server-side `/v1/auth/grant`; the long-lived key never enters the STT/TTS path. |
| `deepgram/listen.py` | STT socket: KeepAlive, pacing, close-code classification. |
| `deepgram/speak.py` | Live TTS socket for the cache-miss path only. |
| `turn/detector.py` | 05 §4, ported statement for statement. |
| `turn/session.py` | The turn loop and reconnect supervision. |
| `audio/cache.py` | Pre-rendered approved-question audio (05 §7). |
| `contracts/` | **Temporary.** Stand-in for slice 0; delete on merge. |
| `graph/mock_graph.py` | **Temporary.** Three hardcoded questions; slice 3 replaces it. |

## Known gaps, deliberately

- No LLM. Phrasing and structured extraction are slice 3.
- Barge-in has the primitives wired (`SpeechStarted` in, `Clear` out) but the
  policy is not decided — see `turn/session.py`.
- Langfuse is not installed. `telemetry.py` emits the structural fields slice 4
  will forward, and enforces the no-PHI signature rule today.
