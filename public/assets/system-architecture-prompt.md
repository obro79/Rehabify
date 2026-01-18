# System Architecture Diagram Prompt for Rehabify

## Overview
Create a polished system architecture diagram for Rehabify, an AI-powered physical therapy coaching app. The diagram should show how computer vision (MediaPipe) and voice AI (Vapi) work together in real-time to provide form correction during rehabilitation exercises.

## Visual Style
- **Color palette:** Sage green (`#8B9F82`), cream/off-white (`#F5F3EE`), light sage (`#A3B899`), with warm coral accent (`#D4A59A`) for highlights
- **Style:** Clean, modern, slightly rounded corners on boxes
- **Aesthetic:** Healthcare/wellness feel - calming, trustworthy, not overly technical
- **Use official logos** for: MediaPipe, Vapi, Neon, Next.js, Vercel, Deepgram, GPT-4o/OpenAI, ElevenLabs, Google Gemini

## Layout Structure

### Three Main Sections (Left to Right):

```
[CLIENT/BROWSER]  →  [CLOUD SERVICES]  →  [BACKEND/DATABASE]
```

---

## Section 1: Client/Browser (Left Side)
Title: "Browser (Client-Side)"
Background: Light sage green box

### Components (top to bottom):

1. **Webcam**
   - Icon: Camera icon
   - Label: "Webcam (30fps)"
   - Small note: "Video never leaves device"

2. **Web Worker**
   - Icon: MediaPipe logo
   - Label: "Web Worker"
   - Sublabel: "MediaPipe Pose"
   - Small note: "33 body landmarks"

3. **Form Analysis Engine**
   - Icon: Checkmark/analytics icon
   - Label: "Form Analysis"
   - Sublabel: "Exercise-specific rules"
   - Small note: "Cat-Camel, Cobra, Dead Bug"

4. **Zustand Stores**
   - Icon: State/database icon
   - Label: "Zustand Stores"
   - Three small boxes inside: "exercise" | "session" | "voice"

5. **React UI**
   - Icon: Next.js logo
   - Label: "React UI (Next.js)"
   - Sublabel: "Real-time feedback display"

6. **Vapi SDK**
   - Icon: Microphone + speaker icon
   - Label: "Vapi SDK"
   - Sublabel: "WebSocket connection"

### Arrows within Client:
- Webcam → Web Worker: "ImageData (transfer)"
- Web Worker → Form Analysis: "landmarks"
- Form Analysis → Zustand: "errors (debounced 500ms)"
- Zustand → React UI: bidirectional
- Zustand → Vapi SDK: "form context injection"

---

## Section 2: Cloud Services (Middle)
Title: "Voice AI Pipeline (Vapi Cloud)"
Background: Cream/white box with subtle border

### Components (arranged as a flow):

1. **Deepgram**
   - Icon: Deepgram logo
   - Label: "Deepgram"
   - Sublabel: "Speech-to-Text"

2. **GPT-4o**
   - Icon: OpenAI logo
   - Label: "GPT-4o"
   - Sublabel: "LLM (coaching logic)"

3. **ElevenLabs**
   - Icon: ElevenLabs logo
   - Label: "ElevenLabs"
   - Sublabel: "Text-to-Speech"

### Flow arrows:
- Vapi SDK ←→ Deepgram: "WebSocket (audio)"
- Deepgram → GPT-4o: "transcription"
- GPT-4o → ElevenLabs: "response text"
- ElevenLabs → Vapi SDK: "audio stream"

### Key callout box:
"Form errors from vision → injected as system context → LLM generates natural corrections"

---

## Section 3: Backend/Database (Right Side)
Title: "Backend & Storage"
Background: Light cream box

### Components:

1. **Next.js API Routes**
   - Icon: Next.js logo
   - Label: "API Routes"
   - Sublabel: "/api/sessions, /api/plans"

2. **Google Gemini**
   - Icon: Gemini logo
   - Label: "Google Gemini"
   - Sublabel: "Plan Generation"

3. **Neon Database**
   - Icon: Neon logo (elephant)
   - Label: "Neon"
   - Sublabel: "PostgreSQL + RLS"

4. **Neon Auth**
   - Icon: Lock/key icon
   - Label: "Neon Auth"
   - Sublabel: "Authentication"

### Arrows:
- React UI ←→ API Routes: "HTTP requests"
- API Routes ←→ Neon: "queries"
- API Routes → Gemini: "plan generation requests"
- Neon Auth → Neon: "RLS policies"

---

## Bottom Section: Key Data Flow Highlight

Add a highlighted flow at the bottom showing the critical path:

```
[Webcam] → [MediaPipe] → [Form Error Detected] → [Context Injection] → [Vapi LLM] → [Voice Correction]
   30fps      33 landmarks    "hip_drop"           500ms debounce      GPT-4o        "Lift your hips!"
```

Label: "Target latency: Form error → Voice correction < 1 second"

---

## Privacy Callout Box

Add a small callout box (coral accent border):
"🔒 Privacy First"
- Video processed 100% client-side
- Only landmarks, scores, and rep counts transmitted
- Audio encrypted via WebSocket

---

## Technical Stats (Optional footer)

Small footer with key metrics:
- "30 FPS video processing"
- "33 body landmarks tracked"
- "500ms error debouncing"
- "<1s voice correction latency"

---

## Logos Needed

Download/include these official logos:
1. MediaPipe (Google) - blue/green gradient
2. Vapi - their brand logo
3. Next.js - black "N" icon or wordmark
4. Vercel - black triangle
5. Neon - green elephant
6. Deepgram - their brand mark
7. OpenAI - black spiral logo
8. ElevenLabs - their brand mark
9. Google Gemini - multicolor star

---

## Example Visual Reference

The diagram should feel similar to:
- Vercel's architecture diagrams (clean, minimal)
- Linear's technical docs (polished, modern)
- NOT like AWS reference architectures (too complex/corporate)

---

## Export Specifications

- **Format:** PNG and SVG
- **Resolution:** High-res for presentation (2x or 3x)
- **Aspect ratio:** 16:9 (fits slides) or 4:3
- **Background:** Transparent or light cream (#F5F3EE)
