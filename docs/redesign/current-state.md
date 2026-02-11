# Current State — Rehabify Architecture Baseline

> Snapshot of the codebase as of February 2026. This document serves as the "before" reference for all redesign docs.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.1.3 |
| Language | TypeScript | ^5 |
| React | React | ^19.2.3 |
| Database | Neon PostgreSQL (serverless) | `@neondatabase/serverless` ^0.10.0 |
| ORM | Drizzle ORM | ^0.38.0 |
| Auth | Neon Auth | `@neondatabase/auth` 0.1.0-beta.21 |
| Voice AI | Vapi SDK | `@vapi-ai/web` ^2.0.0 |
| Vision | MediaPipe Tasks Vision | `@mediapipe/tasks-vision` ^0.10.14 |
| AI/LLM | Google Generative AI (Gemini) | `@google/generative-ai` ^0.21.0 |
| State Management | Zustand | ^5.0.0 |
| Styling | Tailwind CSS | ^3.4.1 |
| Animation | Framer Motion | ^12.28.1 |
| Charts | Recharts | ^3.6.0 |
| Validation | Zod | ^4.3.5 |
| Testing | Vitest + Testing Library | ^4.0.15 |
| Signal Processing | 1eurofilter | ^1.2.2 |
| Time Series | dynamic-time-warping | ^1.0.0 |

## Directory Structure

```
src/
  app/
    (auth)/           # Login, register pages
    (dashboard)/      # Patient dashboard
    api/              # 15 API route groups (see below)
  components/
    assessment/       # Assessment flow UI (9 files)
    dashboard/        # Dashboard widgets
    landing/          # Marketing/landing page (13 files)
    layout/           # App shell, sidebar, nav (9 files)
    messaging/        # PT-patient messaging (8 files)
    motion/           # Exercise motion/camera UI (8 files)
    onboarding/       # Onboarding flow (6 files)
    progress/         # Progress tracking charts (8 files)
    pt/               # PT portal components (10 files)
    ui/               # Shared UI primitives (~60 files)
    workout/          # Workout session UI (24 files)
  db/
    schema/           # 11 Drizzle table definitions
    migrations/       # SQL migration files
  hooks/              # 17 React hooks
  lib/
    analytics/        # Analytics utilities
    api/              # API client helpers
    auth/             # Auth utilities
    exercises/        # Exercise catalog & types
    gemini/           # Gemini LLM integration (plan generation)
    mock-data/        # Development seed data
    neon/             # Neon DB client
    session/          # Session persistence & guards
    vapi/             # Vapi SDK integration (8 files)
    vision/           # MediaPipe + form analysis (12 files)
    voice/            # Voice event bridge (5 files)
  stores/             # Zustand stores (15 files)
  types/              # TypeScript type definitions
```

## Database Schema (11 tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User accounts (patients + PTs) | id, role, name, email |
| `exercises` | Exercise catalog | id, name, category, muscle_groups |
| `plans` | Rehab plans | id, patient_id, exercises, status |
| `plan_modifications` | Plan change history | id, plan_id, modification |
| `assessments` | Patient assessments | id, patient_id, type, results |
| `sessions` | Workout sessions | id, patient_id, plan_id, metrics |
| `session_notes` | Session annotations | id, session_id, note |
| `messages` | PT-patient messaging | id, sender_id, receiver_id, content |
| `canned_responses` | Pre-built message templates | id, category, content |
| `notifications` | Push notifications | id, user_id, type, read |
| `pt_alerts` | PT clinical alerts | id, patient_id, severity, message |
| `pt_recommendations` | PT recommendations | id, patient_id, recommendation |
| `achievements` | Gamification definitions | id, name, criteria |
| `user_achievements` | Earned achievements | id, user_id, achievement_id |
| `patient_medical_info` | Medical intake data | id, patient_id, conditions |

> **Note**: No `clinic_id` scoping exists today. All data is globally accessible by role. No audit logging.

## API Route Inventory

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/auth/[...path]` | * | Neon Auth catch-all |
| `/api/health` | GET | Health check |
| `/api/profile` | GET, PUT | User profile CRUD |
| `/api/assessments/save` | POST | Save assessment results |
| `/api/assessments/from-text` | POST | Parse assessment from text |
| `/api/assessments/[patientId]` | GET | Get patient assessments |
| `/api/plans` | GET | List plans |
| `/api/plans/create-default` | POST | Create default plan |
| `/api/plans/generate` | POST | Gemini plan generation |
| `/api/plans/chat` | POST | Chat with plan (Gemini) |
| `/api/plans/[planId]` | GET, PUT, DELETE | Plan CRUD |
| `/api/sessions` | GET, POST | Session CRUD |
| `/api/session-state` | GET, PUT | Session state persistence |
| `/api/messages` | GET | List conversations |
| `/api/messages/[userId]` | GET, POST | Conversation messages |
| `/api/messages/[userId]/read` | PUT | Mark messages read |
| `/api/patient-records` | GET | Patient records list |
| `/api/patient-medical-info` | GET, POST | Medical info CRUD |
| `/api/pt/clients` | GET | PT client list |
| `/api/pt/clients/[id]` | GET | PT client detail |
| `/api/vapi/webhook` | POST | Vapi session webhook |
| `/api/vapi/assessment-webhook` | POST | Vapi assessment webhook |

## Voice Pipeline (Current)

```
Patient speaks
  → Vapi SDK (client) captures audio
    → Deepgram STT (via Vapi)
      → Gemini LLM (via Vapi)
        → ElevenLabs TTS (via Vapi)
          → Audio playback to patient
```

**Key files**:
- `src/lib/vapi/` — SDK integration (8 files: constants, event-handlers, webhook-utils, assessment-workflow, workflow-nodes, workflow-edges, workflow-types, index)
- `src/hooks/use-vapi.ts` — Main Vapi hook for workout sessions
- `src/hooks/use-assessment-vapi.ts` — Assessment-specific Vapi hook
- `src/hooks/use-session-voice.ts` — Session voice orchestration
- `src/hooks/assessment-vapi-config.ts` — Assessment voice configuration
- `src/app/api/vapi/webhook/route.ts` — Session webhook handler
- `src/app/api/vapi/assessment-webhook/` — Assessment webhook (route, handlers, constants, store)
- `src/lib/voice/` — Voice event bridge (form-event-bridge, form-event-debouncer, event-handlers, types, index)
- `src/stores/voice-store.ts` — Voice state management

**Cost**: Vapi bundles Deepgram + Gemini + ElevenLabs at ~$0.15/min. At ~4.5 hrs/patient/month, this is ~$40/patient/month.

## Vision Pipeline (Current)

```
Camera feed (browser)
  → MediaPipe Pose Landmarker (client WASM)
    → 33 landmarks at 30fps
      → 1-Euro filter (smoothing)
        → form-engine.ts (1,286 lines)
          → Exercise-specific analyzers
            → Real-time form feedback
```

**Key files**:
- `src/lib/vision/form-engine.ts` — Main analysis engine (1,286 lines, handles all 10 exercises)
- `src/lib/vision/form-types.ts` — Type definitions and state management
- `src/lib/vision/geometry.ts` — Angle/distance calculations
- `src/lib/vision/pose-landmarker.ts` — MediaPipe initialization
- `src/lib/vision/landmark-filter.ts` — 1-Euro filter smoothing
- `src/lib/vision/camera-feedback.ts` — Camera quality feedback
- `src/lib/vision/movement-comparison.ts` — DTW-based movement comparison
- `src/lib/vision/exercises/squat.ts` — Squat analyzer (361 lines)
- `src/lib/vision/exercises/standing.ts` — Standing exercises (252 lines)
- `src/lib/vision/exercises/floor.ts` — Floor exercises (141 lines)
- `src/lib/vision/exercises/lumbar.ts` — Lumbar exercises (172 lines)
- `src/lib/vision/exercises/assessment-movements.ts` — Assessment movements (314 lines)
- `src/hooks/use-camera.ts` — Camera access hook
- `src/hooks/use-pose-detection.ts` — Pose detection hook
- `src/hooks/use-form-event-bridge.ts` — Form↔voice event bridge

**Privacy**: All video processing happens client-side. No video frames leave the device.

## Gemini Integration (Current)

- `src/lib/gemini/client.ts` — Gemini API client
- `src/lib/gemini/plan-generator.ts` — Rehab plan generation
- `src/lib/gemini/prompts.ts` — Prompt templates
- `src/lib/gemini/types.ts` — Type definitions
- `src/lib/gemini/fallback-plan.ts` — Fallback when generation fails

## State Management

Zustand stores in `src/stores/`:
- `session-store.ts` — Active workout session state
- `exercise-store.ts` — Exercise catalog state
- `voice-store.ts` — Voice AI connection state
- `assessment-store.ts` — Assessment flow state (with separate actions and types files)
- `onboarding-store.ts` — Onboarding flow state
- `pt-store.ts` — PT portal state
- `message-store.ts` — Messaging state

## Known Technical Debt

1. **No multi-tenancy** — No clinic scoping; all data is globally accessible by role
2. **No audit logging** — No record of who accessed/modified what data
3. **Vapi cost** — ~$40/patient/month voice AI costs are unsustainable at scale
4. **Monolithic form engine** — `form-engine.ts` at 1,286 lines handles all exercises in one file
5. **No billing infrastructure** — No CPT code tracking, no billing records
6. **Client-only vision** — All analysis is client-side; no server-side validation or reference motion library
7. **No HIPAA compliance** — No encryption at rest, no BAAs, no PHI identification controls
8. **Neon Auth beta** — Auth dependency on beta-stage library (`0.1.0-beta.21`)
9. **No WebSocket support** — Vercel (assumed deployment) has limited WebSocket support
10. **No data retention policy** — No mechanism for HIPAA-required 6-year retention
