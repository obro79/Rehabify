# Voice Architecture: Exploration Findings Cache

> Cached exploration results to avoid re-exploring in future sessions.
> Last updated: 2026-02-10

---

## 1. Complete File Inventory

### Files to REMOVE (Vapi-specific)

| File | Lines | Purpose |
|------|-------|---------|
| `src/hooks/use-vapi.ts` | 384 | Core Vapi SDK hook — creates `new Vapi(publicKey)`, registers event handlers |
| `src/hooks/use-assessment-vapi.ts` | 766 | Assessment-specific wrapper with inline assistant config |
| `src/hooks/assessment-vapi-config.ts` | ~390 | Unused duplicate of assessment config |
| `src/lib/vapi/constants.ts` | — | READY_PHRASES, isReadyPhrase() |
| `src/lib/vapi/assessment-workflow.ts` | — | getPhaseFromNode() |
| `src/lib/vapi/event-handlers.ts` | — | Vapi event handler wrappers (imports `@vapi-ai/web`) |
| `src/lib/vapi/index.ts` | — | Barrel exports |
| `src/lib/vapi/webhook-utils.ts` | — | Webhook signature verification |
| `src/lib/vapi/workflow-edges.ts` | — | Workflow graph edges |
| `src/lib/vapi/workflow-nodes.ts` | — | Workflow graph nodes |
| `src/lib/vapi/workflow-types.ts` | — | Workflow type definitions |
| `src/app/api/vapi/webhook/route.ts` | — | Vapi webhook endpoint (verifies signature, routes events) |
| `src/app/api/vapi/assessment-webhook/route.ts` | — | Assessment webhook endpoint |
| `src/app/api/vapi/assessment-webhook/handlers.ts` | — | Assessment tool handlers |
| `src/app/api/vapi/assessment-webhook/store.ts` | — | Assessment webhook store |
| `src/types/vapi-webhook.ts` | — | Vapi webhook type definitions |

### Files to KEEP (Vapi-agnostic)

| File | Lines | Why it stays |
|------|-------|-------------|
| `src/stores/voice-store.ts` | 72 | Pure Zustand state: `connectionState`, `speakingStatus`, `volumeLevel`, `transcript[]`, `isMuted`, `error`. Zero Vapi imports. |
| `src/stores/voice-store-selectors.ts` | — | Pure derived state selectors |
| `src/lib/voice/form-event-bridge.ts` | 330 | Only depends on `VapiMethods` interface: `{ say, injectContext, isConnected }`. Rename interface → `VoiceMethods` |
| `src/lib/voice/form-event-debouncer.ts` | — | Pure timing utility, no voice dependencies |
| `src/lib/voice/types.ts` | — | Domain form event types (FormEvent, FormErrorType, etc.) |
| `src/hooks/use-form-event-bridge.ts` | — | Uses `injectContext` abstraction only |
| `src/hooks/use-session-voice.ts` | 158 | Wraps `useVapi` → change import to `useGeminiVoice` |
| All UI components | — | VoiceIndicator, VoiceCoachCard, FloatingVoiceCoach, WorkoutStatsPanel — pure presentation |
| `src/stores/assessment-store.ts` | — | Pure assessment state, no Vapi dependency |
| `src/stores/assessment-store-selectors.ts` | — | Pure selectors |
| `src/stores/assessment-store-types.ts` | — | Pure types |

### Files to CREATE (Gemini Live)

| File | Purpose |
|------|---------|
| `src/lib/gemini-live/constants.ts` | Model name, audio params, ready phrases |
| `src/lib/gemini-live/types.ts` | Config, callbacks, return types |
| `src/lib/gemini-live/pcm-worklet-processor.js` | AudioWorkletProcessor for mic capture |
| `src/lib/gemini-live/audio-capture.ts` | Mic access + PCM streaming class |
| `src/lib/gemini-live/audio-playback.ts` | Web Audio playback with gapless scheduling |
| `src/lib/gemini-live/tool-handler.ts` | Client-side function call dispatcher |
| `src/lib/gemini-live/session-manager.ts` | Core orchestrator — WebSocket, audio I/O, state |
| `src/lib/gemini-live/index.ts` | Barrel exports |
| `src/app/api/voice/token/route.ts` | Authenticated endpoint returning API key |
| `src/hooks/use-gemini-voice.ts` | Drop-in replacement for `use-vapi.ts` |
| `src/hooks/use-assessment-voice.ts` | Drop-in replacement for `use-assessment-vapi.ts` |

---

## 2. API Contracts

### UseVapiReturn (critical interface to match)

```typescript
interface UseVapiReturn {
  start: (assistantIdOrConfig?: string | Record<string, unknown>, metadata?: Record<string, unknown>) => Promise<void>;
  stop: () => void;
  say: (text: string) => void;
  injectContext: (context: string) => void;
  setMuted: (muted: boolean) => void;
  isConnected: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  isVoiceEnabled: boolean;
}
```

### UseVapiOptions (critical interface to match)

```typescript
interface UseVapiOptions {
  assistantId?: string;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;
  onUserReady?: () => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>) => void;
}
```

### UseAssessmentVapiReturn

```typescript
interface UseAssessmentVapiReturn {
  start: () => Promise<void>;
  stop: () => void;
  isConnected: boolean;
  isSpeaking: boolean;
  setMuted: (muted: boolean) => void;
  injectContext: (context: string) => void;
  currentNode: string | null;
  currentPhase: "interview" | "movement" | "summary";
}
```

### VapiMethods (FormEventBridge dependency)

```typescript
interface VapiMethods {
  say: (text: string) => void;
  injectContext: (context: string) => void;
  isConnected: boolean;
}
```

### Voice Store State

```typescript
interface VoiceState {
  connectionState: ConnectionState; // 'disconnected' | 'connecting' | 'connected' | 'error'
  error: string | null;
  speakingStatus: SpeakingStatus; // 'idle' | 'listening' | 'thinking' | 'speaking'
  volumeLevel: number; // 0-1
  transcript: TranscriptEntry[];
  isMuted: boolean;
}
```

---

## 3. Consumer Analysis

### Consumer 1: `src/hooks/use-session-voice.ts` (workout page)

- Imports `useVapi` → swap to `useGeminiVoice`
- Uses: `start`, `stop`, `isConnected`, `isSpeaking`, `setMuted`, `injectContext`
- `start()` called with `(undefined, { sessionId, exerciseId, exerciseName, targetReps })`
- Does NOT use `say()` directly (only via FormEventBridge)
- Does NOT use `assistantId` option
- Uses `onUserReady` callback

### Consumer 2: `src/app/(dashboard)/workout/[slug]/page.tsx`

- Imports `useVapi` → swap to `useGeminiVoice`
- Uses it indirectly through `useSessionVoice`

### Consumer 3: `src/app/assessment/lower-back/page.tsx`

- Imports `useAssessmentVapi` → swap to `useAssessmentVoice`
- Uses: `start`, `stop`, `isConnected`, `isSpeaking`, `setMuted`, `injectContext`, `currentNode`, `currentPhase`

### Consumer 4: `src/lib/voice/form-event-bridge.ts`

- Depends on `VapiMethods` interface (not the hook)
- Only needs `{ say, injectContext, isConnected }`
- Rename interface to `VoiceMethods`

---

## 4. Dependency Graph

```
UI Components (no changes needed)
  ├── VoiceCoachCard → reads voice-store
  ├── FloatingVoiceCoach → reads voice-store
  ├── VoiceIndicator → reads voice-store
  └── WorkoutStatsPanel → reads voice-store

Hooks Layer (changes needed)
  ├── use-session-voice.ts → imports use-vapi → SWAP to use-gemini-voice
  ├── use-form-event-bridge.ts → uses VapiMethods interface → RENAME to VoiceMethods
  ├── use-vapi.ts → DELETE (replaced by use-gemini-voice)
  └── use-assessment-vapi.ts → DELETE (replaced by use-assessment-voice)

Store Layer (no changes)
  ├── voice-store.ts → pure state, zero Vapi imports
  └── assessment-store.ts → pure state, zero Vapi imports

Library Layer
  ├── src/lib/vapi/ → DELETE entirely
  ├── src/lib/voice/ → KEEP (form-event-bridge, debouncer, types)
  └── src/lib/gemini-live/ → CREATE (new)

API Routes
  ├── src/app/api/vapi/ → DELETE (webhooks no longer needed)
  └── src/app/api/voice/token/ → CREATE (API key endpoint)

Env Config
  └── src/lib/env.ts → Make VAPI_* vars optional, keep GEMINI_API_KEY
```

---

## 5. Assessment Function Tools (6 total)

These need conversion from Vapi format to Gemini `FunctionDeclaration` format:

| Tool | Parameters | Store Action |
|------|-----------|--------------|
| `recordChiefComplaint` | bodyPart, symptomType, duration, onset | `updateChiefComplaint()` |
| `recordPainLevel` | currentLevel, aggravators, relievers | `updatePain()` |
| `recordGoals` | goals, limitedActivities | `updateFunctional()` |
| `recordSafetyCheck` | hasRedFlags, redFlagDetails | `updateHistory()` + `setRedFlag()` |
| `recordMovementTest` | testType, painLevel, painLocation, comparison, tighterSide | `updateMovementScreen()` |
| `completeAssessment` | wantsToStartExercise, focusAreas | `setWantsToStart()` + `setComplete()` |

### Format conversion (Vapi → Gemini):

```typescript
// Vapi format
{ type: "function", function: { name: "...", description: "...", parameters: { ... } } }

// Gemini FunctionDeclaration format
{ name: "...", description: "...", parameters: { type: "OBJECT", properties: { ... }, required: [...] } }
```

---

## 6. Vapi Event → Gemini Mapping

| Vapi Event | Gemini Equivalent |
|-----------|-------------------|
| `call-start` | `session` connected (onopen) |
| `call-end` | `session.close()` / connection closed |
| `speech-start` | AudioPlayback starts playing |
| `speech-end` | AudioPlayback finishes queue |
| `volume-level` | AnalyserNode on mic AudioCapture |
| `message` (transcript) | `inputAudioTranscription` + `outputAudioTranscription` in config |
| `message` (function-call) | `toolCall` in session messages |
| `error` | `session.onerror` / WebSocket error |

---

## 7. The `say()` Problem

Vapi has `vapi.say(text)` which bypasses the LLM and goes directly to TTS (ElevenLabs). This is used by FormEventBridge for HIGH/CRITICAL priority safety corrections.

Gemini Live has **no equivalent** — all audio goes through the model.

**Solution (chosen)**: Gemini instruction approach
- **HIGH priority**: Send `[URGENT - SAY EXACTLY]: "text"` via `session.sendClientContent()`. ~200-500ms latency.
- **CRITICAL priority** (pain >= 7): Also fire browser `window.speechSynthesis.speak()` for instant backup.

---

## 8. Environment Variables

### Currently Required (Vapi)

```
VAPI_PRIVATE_KEY=...           # Server-side, used by webhooks
VAPI_WEBHOOK_SECRET=...        # Server-side, webhook signature verification
NEXT_PUBLIC_VAPI_PUBLIC_KEY=... # Client-side, Vapi SDK init
```

### After Migration

```
GEMINI_API_KEY=...             # Already exists (used for plan generation)
# VAPI vars become optional, then removed
```

---

## 9. Key Decisions

1. **Model**: Gemini 2.5 Flash Live (not 2.0 Flash — retiring March 2026)
2. **SDK**: `@google/genai` (new unified SDK, not `@google/generative-ai`)
3. **Audio format**: 16kHz PCM input, 24kHz PCM output, 16-bit mono
4. **Tool calls**: Client-side dispatch (replaces server-side webhooks)
5. **Transcription**: Gemini native `inputAudioTranscription` + `outputAudioTranscription`
6. **API key delivery**: Server endpoint `/api/voice/token` returns key per session
7. **Voice quality**: Gemini native TTS (good, not ElevenLabs quality — acceptable tradeoff for 36x cost reduction)
