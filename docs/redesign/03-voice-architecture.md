# 03 — Voice Architecture

> Migrating from Vapi ($40/patient/mo) to Gemini 2.0 Flash Live ($1.11/patient/mo) with client-side VAD.

---

## Current State

### Pipeline
```
Patient speaks → Vapi SDK (client) → Deepgram STT → Gemini LLM → ElevenLabs TTS → Audio playback
```

### Files in Codebase

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/vapi/index.ts` | Barrel export for Vapi utilities | 27 |
| `src/lib/vapi/constants.ts` | Ready phrases, error extraction | — |
| `src/lib/vapi/event-handlers.ts` | Vapi SDK event attachment | — |
| `src/lib/vapi/webhook-utils.ts` | Webhook payload parsing, tool call processing | — |
| `src/lib/vapi/assessment-workflow.ts` | Assessment voice flow orchestration | — |
| `src/lib/vapi/workflow-nodes.ts` | Workflow graph nodes | — |
| `src/lib/vapi/workflow-edges.ts` | Workflow graph edges | — |
| `src/lib/vapi/workflow-types.ts` | Workflow type definitions | — |
| `src/hooks/use-vapi.ts` | Main Vapi hook for workout sessions | — |
| `src/hooks/use-assessment-vapi.ts` | Assessment-specific Vapi hook | — |
| `src/hooks/use-session-voice.ts` | Session voice orchestration | — |
| `src/hooks/assessment-vapi-config.ts` | Assessment voice configuration | — |
| `src/app/api/vapi/webhook/route.ts` | Session webhook handler | — |
| `src/app/api/vapi/assessment-webhook/route.ts` | Assessment webhook route | — |
| `src/app/api/vapi/assessment-webhook/handlers.ts` | Assessment webhook handlers | — |
| `src/app/api/vapi/assessment-webhook/constants.ts` | Assessment webhook constants | — |
| `src/app/api/vapi/assessment-webhook/store.ts` | Assessment webhook state | — |
| `src/lib/voice/index.ts` | Voice event bridge barrel | — |
| `src/lib/voice/form-event-bridge.ts` | Bridge between form events and voice | — |
| `src/lib/voice/form-event-debouncer.ts` | Debounce form events for voice | — |
| `src/lib/voice/event-handlers.ts` | Voice event handlers | — |
| `src/lib/voice/types.ts` | Voice type definitions | — |
| `src/stores/voice-store.ts` | Voice connection state (Zustand) | — |

### Cost Problem
Vapi bundles Deepgram + Gemini + ElevenLabs at **$0.15/min**. At ~4.5 hrs/patient/month = **$40.50/patient/month**. This alone exceeds the $39 SaaS price.

---

## Target Architecture

### Pipeline
```
Patient speaks
  → Silero VAD (client WASM) — detects voice activity
    → WebSocket connection to server
      → Gemini 2.0 Flash Live (native audio I/O)
        → Audio response streamed back
          → Web Audio API playback
```

### Key Design Decisions

1. **Gemini 2.0 Flash Live** — Single model handles STT + reasoning + TTS natively. No orchestration of separate STT/LLM/TTS services.
2. **Client-side VAD (Silero WASM)** — Detects when patient is actually speaking. Only sends audio during speech, reducing Gemini input tokens by ~60%.
3. **WebSocket transport** — Persistent connection for bidirectional audio streaming. Requires hosting outside Vercel (see [06-infrastructure.md](./06-infrastructure.md)).
4. **Context caching** — Reuses patient context (assessment data, exercise plan, session history) across turns without re-sending full prompts.

### Usage Guardrails

| Threshold | Behavior | Rationale |
|-----------|----------|-----------|
| 0–10 hrs/month | Normal mode | Full conversational coaching |
| 10–20 hrs/month | Concise mode | Shorter responses, less chitchat |
| 20+ hrs/month | Push-to-talk | Patient must press button to speak, no always-listening |

These guardrails protect against runaway costs from outlier users while keeping the experience good for typical usage (~4.5 hrs/month).

---

## File Migration Plan

### REMOVE (Vapi-specific, no longer needed)
- `src/lib/vapi/` — Entire directory (8 files)
- `src/hooks/use-vapi.ts`
- `src/hooks/use-assessment-vapi.ts`
- `src/hooks/assessment-vapi-config.ts`
- `src/app/api/vapi/` — Entire directory (webhook + assessment-webhook)
- `@vapi-ai/web` dependency from `package.json`

### KEEP (voice infrastructure, reusable)
- `src/lib/voice/form-event-bridge.ts` — Bridge between form analysis and voice feedback (works regardless of voice backend)
- `src/lib/voice/form-event-debouncer.ts` — Debouncing logic is backend-agnostic
- `src/lib/voice/types.ts` — Voice event types (may need extension)
- `src/stores/voice-store.ts` — Voice state management (will need updates for new connection model)

### CREATE (new Gemini Live integration)
- `src/lib/gemini-live/client.ts` — WebSocket client for Gemini 2.0 Flash Live
- `src/lib/gemini-live/vad.ts` — Silero VAD WASM wrapper
- `src/lib/gemini-live/audio-player.ts` — Web Audio API response playback
- `src/lib/gemini-live/context-cache.ts` — Session context caching
- `src/lib/gemini-live/guardrails.ts` — Usage tracking and mode switching
- `src/lib/gemini-live/types.ts` — Type definitions
- `src/hooks/use-gemini-voice.ts` — Replacement for `use-vapi.ts`
- `src/hooks/use-assessment-voice.ts` — Replacement for `use-assessment-vapi.ts`
- `src/app/api/voice/connect/route.ts` — WebSocket upgrade endpoint (or separate WS server)

### MODIFY
- `src/hooks/use-session-voice.ts` — Update to use new Gemini hook instead of Vapi hook
- `src/lib/voice/event-handlers.ts` — Update event types for Gemini events
- `src/stores/voice-store.ts` — Update state shape for WebSocket connection model

---

## WebSocket Server Design

<!-- TODO: Decide if the WebSocket server lives as a separate service or inside the Next.js app -->

The WebSocket server handles:
1. **Connection lifecycle** — Open/close, reconnection, heartbeat
2. **Audio routing** — Client audio → Gemini, Gemini audio → client
3. **VAD coordination** — Server-side backup VAD (optional), silence detection
4. **Context injection** — Send patient context to Gemini at session start
5. **Session logging** — Record session metadata (duration, turns) for billing

```
Client (Browser)                    WS Server                    Gemini Live
    │                                  │                              │
    │── WebSocket connect ────────────→│                              │
    │                                  │── Open Gemini session ──────→│
    │                                  │←── Session ready ────────────│
    │── Audio chunk (VAD active) ─────→│── Forward audio ────────────→│
    │                                  │←── Audio response ───────────│
    │←── Audio response ───────────────│                              │
    │                                  │                              │
    │── [silence / VAD inactive] ──────│  (no data sent to Gemini)   │
    │                                  │                              │
```

## Open Questions

- Should the WebSocket server be a standalone Node.js/Python service, or can it run within Next.js (e.g., via custom server)?
- What is the exact Gemini 2.0 Flash Live WebSocket protocol? (API may still be in preview)
- How do we handle mid-session Gemini disconnects? Auto-reconnect with context replay?
- Should we implement server-side audio recording for HIPAA audit purposes?
- A/B testing strategy: run Vapi and Gemini Live simultaneously during migration?

---

See also:
- [diagrams/voice-pipeline.mermaid](./diagrams/voice-pipeline.mermaid) — Visual pipeline diagram
- [02-unit-economics.md](./02-unit-economics.md) — Cost comparison detail
- [09-migration-plan.md](./09-migration-plan.md) — Phase 1 migration plan
