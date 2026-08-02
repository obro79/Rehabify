# 02 — Current State

> Verified baseline of **this** repository, February 2026. Everything here was
> read out of the source tree, not inferred from prior docs. Claims carry
> `file:line` references so they can be re-checked.
>
> This document exists to justify the rebuild. It is deliberately unflattering.

---

## 1. Stack as built

| Layer | Technology | Note |
|---|---|---|
| Framework | Next.js 16.1.3, React 19.2 | `middleware.ts` is renamed `src/proxy.ts` under Next 16 |
| Language | TypeScript 5, Zod 4 | |
| Database | Neon Postgres via `@neondatabase/serverless` ^0.10 | **HTTP driver — no pooling, no transactions** |
| ORM | Drizzle 0.38 (`drizzle-orm/neon-http`) | |
| Auth | `@neondatabase/auth` **0.1.0-beta.21** | beta; Better Auth underneath |
| Voice | `@vapi-ai/web` ^2.0 | GPT-4o + ElevenLabs `sarah` + Deepgram `nova-2`, all via Vapi |
| LLM | `@google/generative-ai` ^0.21, `gemini-2.5-flash` | plain text in/out, no JSON mode |
| Vision | `@mediapipe/tasks-vision`, `1eurofilter`, `dynamic-time-warping` | client-side only |
| State | Zustand 5 (15 stores) | |

**Size:** 53,633 tracked TS/TSX lines. 105 files under `src/app`, 166 under
`src/components`, 68 under `src/lib`.

---

## 2. Security findings

These are the findings that make "rebuild" the right call rather than
"refactor". They are ordered by severity. **None of them should be assumed
fixed by the rewrite unless the rewrite explicitly addresses them** — several
are design-level, not bug-level.

### 2.1 Role is client-controlled — CRITICAL

`requireAuth()` reads the **`x-demo-role` request header** and returns a
hardcoded PT identity when it equals `"pt"` ([src/lib/auth/server.ts:29](src/lib/auth/server.ts:29)).
Every PT page sends that header from the browser — e.g.
[src/app/pt/layout.tsx:24](src/app/pt/layout.tsx:24),
[src/app/pt/clients/[id]/plan/page.tsx:78](src/app/pt/clients/[id]/plan/page.tsx:78).

Any client can set it. It grants the PT role, which grants read access to
patient rosters, plans, sessions, assessments, and alerts.

The gate is `NEXT_PUBLIC_DEMO_MODE`, and **`.env.example:73` ships it as
`true`** ([.env.example:73](.env.example:73)). `src/proxy.ts:7` also returns
`NextResponse.next()` unconditionally in demo mode, disabling page-level auth
entirely.

### 2.2 Role is never read from the database

`withAuth(handler, { roles })` reads `user.role ?? 'patient'` straight off the
Neon Auth user object ([src/lib/api/auth.ts:76](src/lib/api/auth.ts:76)).
**Nothing anywhere reads `profiles.role`.** Neon Auth's user object carries no
`role` claim and nothing syncs one.

Consequence: outside demo mode every user resolves to `patient`, so every
`roles: ['pt','admin']` route returns 403 — the PT product only functions with
the insecure demo path enabled. *(Flagged as high-confidence but not verified
against a live session.)*

### 2.3 Seven routes read or write patient data with no auth check

| Route | Exposure |
|---|---|
| `api/session-state` (GET/POST/DELETE) | `GET ?sessionId=` returns **any** session's live state — exercise, rep count, form score — to any caller |
| `api/messages` (GET/POST) | no auth; hardcoded clinical mock content |
| `api/messages/[userId]` (GET/POST) | no auth; returns any conversation for any `userId` |
| `api/messages/[userId]/read` (PUT) | no auth (stub) |
| `api/vapi/webhook` (POST) | **no signature verification** |
| `api/vapi/assessment-webhook` (POST) | **no signature verification**; accepts arbitrary `callId` |
| `api/health` (GET) | no auth, no patient data — acceptable |

`VAPI_WEBHOOK_SECRET` is declared **required** in
[src/lib/env.ts:37](src/lib/env.ts:37) and `.env.example:37`, and is
**referenced by zero source files.** No route verifies a signature.

### 2.4 Missing ownership checks on authenticated routes

| Route | Gap |
|---|---|
| `GET /api/plans/[planId]` | `withAuth` with **no role and no ownership check** — any authenticated user reads any plan by UUID ([route.ts:31](src/app/api/plans/[planId]/route.ts:31)) |
| `PATCH /api/plans/[planId]` | any PT can edit any plan |
| `GET /api/pt/clients/[id]` | gated to pt/admin but **never checks `patient.ptId === user.id`** — any PT reads any patient ([route.ts:25](src/app/api/pt/clients/[id]/route.ts:25)) |
| `getTargetPatientId` | PT/admin may pass any `?patientId=` unchecked ([patient-access.ts:26](src/lib/api/patient-access.ts:26)) |

`GET /api/pt/clients` (the list) *is* correctly scoped to `ptId = user.id`
([route.ts:22](src/app/api/pt/clients/route.ts:22)) — the detail route just
forgot.

### 2.5 Row-level security is almost certainly inert

`001_complete_schema.sql:561-655` enables RLS on 11 tables with ~18 policies
keyed on **`auth.uid()`** — a *Supabase* idiom. This codebase connects to Neon
through `neon-http` as a single database role with no per-request JWT and no
`request.jwt.claims`. Those policies cannot be evaluating a real user.

Treat the database as having **no row-level protection today**. (Not verified
against the live DB; verify before relying on either conclusion.)

### 2.6 No tenancy at all

**No table has an organization, clinic, or tenant column.** Scoping is entirely
`profiles.pt_id` (a self-referencing FK) plus per-row `patient_id`/`pt_id`.
Introducing `organization_id` is a schema-wide change touching every table —
this is the single largest reason the data layer is rebuilt rather than
migrated.

### 2.7 Onboarding writes identity to localStorage

`/onboard` writes `userProfile` and `onboardingCompleted` to **localStorage**
and redirects to the assessment ([onboard/page.tsx:19](src/app/(onboard)/page.tsx:19)).
Nothing server-side. The file carries its own TODO acknowledging this.

Also note: `/assessment/*`, `/onboard`, and **all of `/api/*`** are absent from
the `src/proxy.ts` middleware matcher.

---

## 3. Data layer

### 3.1 Schema

14 tables in `src/db/schema/`: `profiles`, `exercises`, `plans`,
`plan_modifications`, `assessments`, `sessions`, `session_notes`, `messages`,
`canned_responses`, `notifications`, `pt_alerts`, `pt_recommendations`,
`achievements`, `user_achievements`, `patient_medical_info`.

- **Zero Postgres enum types.** Every enum is `text` + a `check()` constraint.
- **JSONB is load-bearing and unvalidated at the DB layer**: `plans.structure`
  holds the entire 12-week program; `assessments` has five JSONB columns;
  also `sessions.exercises`, `profiles.preferences`,
  `exercises.modifications`/`detection_config`. Only `plans.structure` is
  Zod-validated, and only on write.

### 3.2 Two competing migration systems, already drifted

- `db:push` / `db:generate` → drizzle-kit, writing to
  `./src/db/migrations/drizzle` — **a directory that does not exist**.
- `db:migrate` / `db:seed` / `db:mock` → raw `psql` against hand-written SQL.

`003_mock_data.sql` inserts into **`plan_weeks` and `exercise_results`, which
are not in the Drizzle schema**, and into `assessments` columns (`status`,
`pain_location`, `pain_level`, `goals`, `ai_summary`) that do not exist. **That
file cannot run against the current schema.** It is unknown which shape the
deployed database actually has.

### 3.3 Connection

`neon()` HTTP driver ([src/db/neon-client.ts:11](src/db/neon-client.ts:11)),
lazily initialized behind a `Proxy` so build-time imports don't throw.
**No transaction support** — a hard constraint for any workflow needing
atomicity (e.g. "create attention task and pause intake in one commit").

---

## 4. Voice — what is actually wired

The declared architecture and the running code disagree.

### 4.1 Three dead definitions, one live path

| File | Lines | Status |
|---|---|---|
| `src/lib/vapi/workflow-nodes.ts` + `workflow-edges.ts` + `workflow-types.ts` | 385 | **imported by nothing** |
| `src/lib/vapi/assessment-workflow.ts` | 649 | only `getPhaseFromNode` is imported; the 13-node graph is unused |
| `src/hooks/assessment-vapi-config.ts` | 389 | **imported by nothing** — `use-assessment-vapi.ts` inlines byte-identical copies |
| `src/hooks/use-assessment-vapi.ts` | 765 | **the only live path** |

The 13-node question graph (greeting → chief_complaint → pain_characterization
→ functional_impact → medical_history → {red_flag_exit | movement_intro} →
flexion/extension/sidebend tests → summary → plan_generation → complete) is
**declared but never executed**. What actually runs is a single inline
assistant config with one giant system prompt
([use-assessment-vapi.ts:411](src/hooks/use-assessment-vapi.ts:411)).

This matters for the rebuild: **the deterministic question graph the product
requires does not exist in running code.** It has to be built, not ported.

### 4.2 Extraction happens client-side

Six tools (`recordChiefComplaint`, `recordPainLevel`, `recordGoals`,
`recordSafetyCheck`, `recordMovementTest`, `completeAssessment`) arrive as
`function-call` messages **over the browser WebSocket** and write straight into
the Zustand store ([use-assessment-vapi.ts:473](src/hooks/use-assessment-vapi.ts:473)).
They never touch the server. Persistence is a single later POST of the whole
store to `/api/assessments/save`.

So structured clinical extraction is currently **client-trusted**.

### 4.3 The webhooks are orphaned

`api/vapi/assessment-webhook` handles tools named `save_assessment_response`,
`get_movement_screen_result`, `generate_rehab_plan`, `flag_red_flag`,
`start_movement_screen` — **none of which match the six tools the live
assistant is configured with.** It stores state in a module-level `Map` with no
TTL, lost on cold start, not shared across instances. `handleEndOfCall` carries
a `// TODO: Persist to database` and deletes the entry.

`api/vapi/webhook` reads live form state by importing `getSessionState` from
the sibling route module — cross-route singleton coupling that only works in a
single warm process.

### 4.4 What survives a Deepgram migration

**Portable** (depends on a 3-method seam `{say, injectContext, isConnected}`,
[form-event-bridge.ts:26](src/lib/voice/form-event-bridge.ts:26)):
`src/stores/voice-store.ts`, the assessment store family, `src/lib/voice/types.ts`,
`form-event-debouncer.ts`, and ~600 lines of provider-neutral clinical prompt text.

**Vapi-coupled, to be replaced:** `src/hooks/use-vapi.ts`, `src/lib/vapi/*`,
both webhook routes, `src/types/vapi-webhook.ts`, the inline assistant config.

⚠️ `src/lib/voice/form-event-bridge.ts` (class) and
`src/hooks/use-form-event-bridge.ts` (hook) are **two competing implementations
of the same logic**; only the hook is wired up.

---

## 5. AI / plan generation

`src/lib/gemini/` — 6 files, ~983 lines.

- **No structured output.** Plain text in/out, no `responseSchema`, no JSON
  mode, no function calling. `parseGeminiJson` strips ```` ```json ```` fences
  ([client.ts:96](src/lib/gemini/client.ts:96)).
- **Zod validation is genuinely good** — `rawPlanStructureSchema` requires
  exactly 12 weeks, sets 1–10, reps 1–100, hold 0–300.
- **Fuzzy slug matching is a correctness risk**: `findClosestSlug`
  ([plan-generator.ts:35](src/lib/gemini/plan-generator.ts:35)) strips prefixes
  like `kneeling-`/`standing-`/`seated-` then accepts a match on ≥2 shared words
  or ≥50% word overlap. This is how a model-invented exercise name becomes a
  real exercise ID. **The target architecture forbids exactly this** — the
  composer must reject unknown exercises, not approximate them.
- Prompts live in three places: `prompts.ts`, inline in `plans/chat/route.ts:91`,
  inline in `assessments/from-text/route.ts`.
- Three plan-generation entry points, one of which (`assessments/save`) inserts
  the plan with **`status: 'approved'` without any clinician review** — directly
  contrary to the product boundary in [01-product-definition.md](./01-product-definition.md).

---

## 6. Tests

21 files, ~208 assertions. Vitest + jsdom.

**Covered:** API helpers (`validation` 27, `response` 24, `errors` 22, `auth` 16),
session lib, four Zustand stores, PT data shapes.

**Not covered:** every `src/app/api/**/route.ts` (zero route-handler tests),
all Gemini code including fuzzy slug matching and progression validation, all
Vapi hooks and webhooks, `form-engine.ts` beyond one function (2 tests for
3,036 lines), all pages, `patient-access.ts`.

No E2E. `vitest.config.ts:17` excludes an `e2e/` directory that does not exist.
`.playwright-mcp/` sits unused at the repo root.

---

## 7. Vision — blast radius

`src/lib/vision/` is 12 files / 3,036 lines, dominated by `form-engine.ts`
(1,286 lines). It has **only four importers**: `use-pose-detection.ts`,
`exercise-camera.tsx`, `feedback-overlay.tsx`, and one test.

Shelving it is a small cut at the import boundary but a wider *data* cut:
`exercise-store`'s form score / rep count / phase go unpopulated, which starves
`use-form-event-bridge` → `injectContext` (live voice form coaching goes
silent), `POST /api/session-state`, and `sessions.overall_form_score`.

⚠️ `src/components/motion/` is **not vision** — it is 5 files of framer-motion
animation wrappers imported by 16 files including the entire landing page. Do
not confuse the two during cleanup.

---

## 8. Environment variables

Declared **required** in `src/lib/env.ts` but **referenced by zero source files**:
`NEON_API_KEY`, `VAPI_PRIVATE_KEY`, `VAPI_WEBHOOK_SECRET`.

Missing from `.env.example`: `NEON_AUTH_BASE_URL`.
Missing from **both** `env.ts` and `.env.example`, read raw from `process.env`:
`NEXT_PUBLIC_VAPI_ASSISTANT_ID` ([use-vapi.ts:245](src/hooks/use-vapi.ts:245)).

Two escape hatches blank the entire validated config: `SKIP_ENV_VALIDATION=true`,
and `npm_lifecycle_event === 'lint'` ([env.ts:119](src/lib/env.ts:119)).

---

## 9. Open questions carried into the rebuild

1. Does the deployed database match `src/db/schema/` or `003_mock_data.sql`?
   They disagree. **Resolve before any migration is written.**
2. Do the `auth.uid()` RLS policies exist in the live Neon database, and do they
   evaluate? Code analysis says they cannot.
3. Does Neon Auth's user object carry a `role` claim in this beta? If not, PT
   authorization has never functioned outside demo mode.
4. Has `NEXT_PUBLIC_DEMO_MODE=true` ever been deployed to a public URL? If so,
   the `x-demo-role` header exposure was live, and that needs assessing
   separately from this rebuild.

---

*Sources: full-tree inspection, February 2026. Supersedes
`docs/redesign/current-state.md`, which under-reported the auth findings.*
