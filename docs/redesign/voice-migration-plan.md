# Voice Migration Plan: Vapi → Gemini Live

> Implementation plan for Phase 1 of the B2B redesign voice architecture.
> Branch: `voice-architecture-redesign`

## Context

Vapi bundles Deepgram STT + GPT-4o + ElevenLabs TTS at ~$0.15/min = **$40/patient/month**. This exceeds the $39 SaaS price. We're replacing the entire pipeline with **Gemini 2.5 Flash Live API** which handles STT + LLM + TTS natively over a single WebSocket for ~**$1.11/patient/month**.

See `docs/redesign/03-voice-architecture.md` for the full architecture spec.
See `docs/redesign/voice-migration-detailed.md` for cached exploration findings.

---

## Step 1: Install `@google/genai` SDK

```bash
bun add @google/genai
```

Keep `@google/generative-ai` (used by `src/lib/gemini/client.ts` for plan generation). Remove `@vapi-ai/web` at the end.

---

## Step 2: Create `src/lib/gemini-live/` (8 files)

### `constants.ts`
- `GEMINI_LIVE_MODEL = 'gemini-live-2.5-flash-preview'`
- Audio params: 16kHz input, 24kHz output, 16-bit PCM, mono
- `READY_PHRASES` array + `isReadyPhrase()` (port from `src/lib/vapi/constants.ts`)

### `types.ts`
- `GeminiLiveConfig` wrapping `LiveConnectConfig`
- `GeminiVoiceCallbacks` matching current `UseVapiOptions`
- `UseVoiceReturn` = same shape as current `UseVapiReturn`
- `UseVoiceOptions` = same shape as current `UseVapiOptions`

### `pcm-worklet-processor.js`
- `AudioWorkletProcessor` subclass, captures Float32 → Int16 PCM
- Posts Int16 buffer to main thread via `port.postMessage()`

### `audio-capture.ts`
- Class `AudioCapture` managing mic access via `getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } })`
- Registers AudioWorklet, wires PCM output callback
- `start(onAudioData)`, `stop()`, `setMuted(bool)`, `getVolumeLevel(): number`
- Uses `AnalyserNode` for volume level

### `audio-playback.ts`
- Class `AudioPlayback` managing Web Audio API playback
- `enqueue(pcmData, sampleRate)` — decodes PCM, creates AudioBuffer, queues
- Gapless scheduling via `AudioBufferSourceNode.start(nextTime)`
- `interrupt()` for user barge-in
- Callbacks: `onPlaybackStart`/`onPlaybackEnd` → `setSpeakingStatus`

### `tool-handler.ts`
- Class `ToolCallDispatcher` — registers handlers by name, dispatches function calls
- Replaces entire webhook route pattern (tool calls now client-side)

### `session-manager.ts` (core)
- Class `GeminiLiveSessionManager` orchestrating everything
- `connect(config)` — fetches key from `/api/voice/token`, calls `ai.live.connect()`, starts AudioCapture
- `disconnect()` — stops capture, closes session, stops playback
- `sendContext(text)` — calls `session.sendClientContent()` (replaces `injectContext`)
- `say(text)` — sends `[URGENT - SAY EXACTLY]: "text"` via sendClientContent; for CRITICAL priority, also fires `SpeechSynthesis`
- Handles `onmessage` routing: audio → AudioPlayback, text → transcripts, toolCall → ToolCallDispatcher

### `index.ts`
- Barrel exports

---

## Step 3: Create `/api/voice/token` endpoint

`src/app/api/voice/token/route.ts`:
- Authenticated POST endpoint
- Returns `{ apiKey: env.GEMINI_API_KEY, model: GEMINI_LIVE_MODEL }`

---

## Step 4: Create `src/hooks/use-gemini-voice.ts`

Drop-in replacement for `use-vapi.ts`. Must export identical `UseVoiceReturn` and `UseVoiceOptions` interfaces. Internally uses `GeminiLiveSessionManager`.

---

## Step 5: Create `src/hooks/use-assessment-voice.ts`

Drop-in replacement for `use-assessment-vapi.ts`. Uses `useGeminiVoice` internally.

Key changes:
- Assessment tools converted from Vapi format to Gemini `FunctionDeclaration` format
- System prompt + tools passed via `LiveConnectConfig`
- REMOVES: `handleVariableExtraction`, `handleNodeTransition`, `window.__assessmentHandlers`

---

## Step 6: Switch consumers (3 import changes)

| File | Old Import | New Import |
|------|-----------|------------|
| `src/hooks/use-session-voice.ts` | `use-vapi` | `use-gemini-voice` |
| `src/app/(dashboard)/workout/[slug]/page.tsx` | `use-vapi` | `use-gemini-voice` |
| `src/app/assessment/lower-back/page.tsx` | `use-assessment-vapi` | `use-assessment-voice` |

---

## Step 7: Update env config

In `src/lib/env.ts`:
- Make `VAPI_PRIVATE_KEY`, `VAPI_WEBHOOK_SECRET`, `NEXT_PUBLIC_VAPI_PUBLIC_KEY` optional
- Ensure `GEMINI_API_KEY` exists (already there)

---

## Step 8: Delete Vapi files

```bash
rm -rf src/lib/vapi/                          # 8 files
rm src/hooks/use-vapi.ts                      # 384 lines
rm src/hooks/use-assessment-vapi.ts           # 766 lines
rm src/hooks/assessment-vapi-config.ts        # ~390 lines
rm -rf src/app/api/vapi/                      # webhook + assessment-webhook
rm src/types/vapi-webhook.ts                  # duplicate types
```

Remove `@vapi-ai/web` from package.json.

---

## Step 9: Cleanup

- Rename `VapiMethods` → `VoiceMethods` in `src/lib/voice/form-event-bridge.ts`
- Update `src/types/voice.ts` to remove Vapi-specific types
- Clean up remaining Vapi references

---

## Commit Strategy

1. `docs: cache voice architecture exploration findings`
2. `chore: add @google/genai dependency`
3. `feat: add gemini-live core library (audio capture, playback, session manager)`
4. `feat: add voice token API endpoint`
5. `feat: add use-gemini-voice hook (replaces use-vapi)`
6. `feat: add use-assessment-voice hook (replaces use-assessment-vapi)`
7. `refactor: switch all consumers to gemini voice hooks`
8. `chore: remove all vapi files and dependency`
9. `refactor: rename VapiMethods to VoiceMethods`

---

## Verification Checklist

- [ ] `bun run build` passes with no errors
- [ ] Voice coach connects on workout page
- [ ] Audio plays back smoothly (no gaps/echo)
- [ ] User barge-in interrupts model speech
- [ ] Mute/unmute works
- [ ] Form feedback corrections arrive via voice
- [ ] Assessment flow completes: all 6 function tools fire correctly
- [ ] Assessment store populates with structured data
- [ ] Volume indicator animates
- [ ] No Vapi imports remain in codebase
- [ ] No `@vapi-ai/web` in package.json
