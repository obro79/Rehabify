# YC Demo — Rehabify Repository Execution Plan

Status: authoritative and ready for implementation
Date: 2026-07-27
Repository: `obro79/Rehabify`
Base branch: `main`
Integration branch: `of/yc-demo-plan`
Final target: one pull request to `main`
Runtime boundary: synthetic demo data only; not for clinical use

## Authority

This file is the repository-specific execution source for the YC demo.
The six companion plans preserve the detailed product, interaction, and visual
intent. Where they mention the `rehabifyy` monorepo, `apps/web`, pnpm,
`packages/clinical-rules`, production brief routes, or a knee-specific fixture,
this file overrides those implementation details.

Cloud tasks must read this file first and use only the paths and commands below.

## Verified Repository Reality

The destination is a single Next.js application:

- Next.js 16, React 19, TypeScript, Tailwind CSS.
- Bun lockfile and Vitest/jsdom test configuration.
- Application source under `src/`.
- Existing long-form Vapi assessment at
  `src/app/assessment/lower-back/page.tsx`.
- Existing Vapi browser hook at `src/hooks/use-vapi.ts`.
- Existing assessment orchestration at
  `src/hooks/use-assessment-vapi.ts`.
- Existing reusable Vapi tools/config at
  `src/hooks/assessment-vapi-config.ts`.
- Existing structured assessment state at
  `src/stores/assessment-store.ts`.
- Existing PT client and plan UI under `src/app/pt/clients/[id]/`.
- Existing patient plan UI at `src/app/(dashboard)/plan/page.tsx`.
- Existing exercise catalog at `src/lib/exercises/data.json`.
- Existing UI primitives under `src/components/ui/`.

Do not import assumptions from the separate private `obro79/rehabifyy`
repository.

## Locked Three-Minute Story

Use one synthetic patient, Maya, with a lower-back complaint so the demo can
reuse the repository's real voice-assessment infrastructure.

```text
0:00–1:30  interactive voice intake
1:30–1:38  automatic "preparing brief" handoff
1:38–2:05  clinician brief and one source inspection
2:05–2:22  clinician changes movement pain from 4/10 to 3/10 and confirms
2:22–2:42  deterministic plan composition and review
2:42–2:52  exact plan approval
2:52–3:00  patient Today screen derived from that approved plan
```

The voice UI is interactive but does not show a transcript. The final accepted
voice data is structured and source-addressable internally. The handoff starts
automatically when intake completes.

## Scope Boundary

The `/demo` route is self-contained and may reuse stable UI and voice
infrastructure. The live voice scene may use the existing assessment hook and
its existing voice/assessment stores, but the shell receives only one immutable
completed artifact. The route must not depend on:

- Neon, Drizzle, or any database;
- existing assessment, plan, or patient APIs;
- authentication or PT route layouts;
- Gemini plan generation;
- production persistence;
- real patient data.

Do not edit existing API, database, production route, global store, or mock
patient files for this slice. A backward-compatible option/config change to the
existing assessment Vapi hook is allowed only in Wave 2A; its production
default must remain the full assessment. `/demo` makes no application API calls
and never saves the intake or plan; the optional browser-to-Vapi call is the
only external live-voice integration. The live Vapi path is optional at runtime
and has a deterministic rehearsed fallback.

## Shared Contract and Ownership

Wave 1 owns these shared files:

```text
src/app/demo/page.tsx
src/app/demo/demo-shell.tsx
src/app/demo/demo-shell.test.tsx
src/app/demo/demo-model.ts
src/app/demo/demo-model.test.ts
src/app/demo/demo-fixture.ts
src/app/demo/demo-contracts.ts
src/app/demo/demo-frames.tsx
src/app/demo/presenter-controls.tsx
src/app/demo/demo.module.css
```

Only the integration owner edits these shared files after Wave 1. Leaf tasks
own only their listed subdirectories/files.

The public immutable contracts are:

- `CompletedDemoIntake`
- `DemoBriefAssessmentHandoff`
- `DemoPlanDraft`
- `DemoApproval`
- `DemoTodayView`

The root reducer owns the artifact slots, scene gates, retry/reset behavior,
transition nonce, direct-scene recovery, and approval invariant. Leaf
components return artifacts through callbacks; they do not navigate or create
another global store.

## Fixture

`demo-fixture.ts` owns the only Maya fixture:

- patient: Maya, synthetic identifier, lower-back complaint;
- current pain: `4/10`;
- aggravator: prolonged sitting and bending;
- reliever: walking;
- goal: return to a normal workday and weekend hikes;
- safety screen: no reported red flags;
- one deliberately missing fact represented as `missing`, never `false`;
- one movement finding editable by the clinician from `4/10` to `3/10`;
- bounded source IDs for every recorded material fact;
- exactly these eligible catalog records: `cat-camel`, `cobra-stretch`, and
  `dead-bug`; and the deliberately excluded record `bodyweight-squat`;
- stable draft version and input fingerprint seed;
- Today week/day metadata.

The fixture must be frozen or deeply readonly. Resolve those records by their
known catalog entries and assert their expected lower-back/tier properties;
do not select an exercise by a non-unique slug alone. No leaf module duplicates
the fixture.

## Scene and Gate Model

Use these scene IDs:

```text
patient_intake
preparing_brief
clinician_brief
clinician_assessment
composing_plan
clinician_plan_review
plan_approved
patient_today
```

Required gates:

- intake cannot complete without a valid immutable intake artifact;
- brief cannot advance until the rehearsed source is inspected;
- assessment cannot advance until the `4/10 → 3/10` correction is confirmed;
- composition runs once per verified handoff and fails closed;
- approval binds the exact draft version and input fingerprint;
- Today returns `null` for missing, stale, reset, failed, or mismatched approval;
- reset invalidates pending timers and late voice callbacks;
- direct navigation to Today normalizes to plan review until exact approval.

## Wave 0 — Publish the Plan

Commit these eight documents to `of/yc-demo-plan` in `obro79/Rehabify`:

```text
docs/specs/2026-07-27-yc-demo.md
docs/specs/2026-07-27-yc-demo-part-1-shell-state.md
docs/specs/2026-07-27-yc-demo-part-2-voice-handoff.md
docs/specs/2026-07-27-yc-demo-part-3-brief-assessment.md
docs/specs/2026-07-27-yc-demo-part-4-plan-today.md
docs/specs/2026-07-27-yc-demo-ui-improvements.md
docs/specs/2026-07-27-yc-demo-cloud-execution.md
docs/specs/2026-07-27-yc-demo-rehabify-execution.md
```

Do not open a PR and do not request Greptile during Wave 0.

## Wave 1 — Shell, Contracts, Fixture, and Reducer

Create the ten shared files. Deliver:

- public `/demo` route outside the auth matcher;
- all eight typed placeholder scenes;
- immutable contracts and one fixture;
- a pure reducer with every gate and invalid-transition test;
- patient, clinician, and Today presentation frames;
- quiet presenter controls: previous, next, reset, and guarded scene jump;
- focus restoration, visible status, reduced motion, and 1280×800 support.

Focused gate:

```bash
bunx vitest run \
  src/app/demo/demo-model.test.ts \
  src/app/demo/demo-shell.test.tsx
bunx tsc --noEmit
SKIP_ENV_VALIDATION=true bun run build
```

Apply the Cloud diff to `of/yc-demo-plan`, review it, rerun the gate, commit,
and push before Wave 2.

## Wave 2A — Voice Intake and Automatic Handoff

Exclusive ownership:

```text
src/app/demo/voice/demo-voice-config.ts
src/app/demo/voice/demo-voice-adapter.ts
src/app/demo/voice/demo-voice-adapter.test.ts
src/app/demo/voice/demo-voice-intake.tsx
src/app/demo/voice/demo-voice-intake.test.tsx
src/app/demo/voice/demo-preparing-brief.tsx
src/app/demo/voice/demo-preparing-brief.test.tsx
src/app/demo/voice/voice.module.css
src/hooks/use-assessment-vapi.ts
src/hooks/assessment-vapi-config.ts
src/hooks/assessment-vapi-config.test.ts
```

Implementation:

- reuse `useAssessmentVapi` rather than rebuilding the voice intake;
- add an optional `mode: "full" | "short"` to `useAssessmentVapi` and make
  `getAssessmentAssistantConfig({ mode })` the single assistant-config
  selector used by that hook; remove or stop using the hook-local duplicate
  config so the two prompts cannot drift;
- callers that omit `mode` must receive `"full"`, preserving the current
  production assessment; `/demo` explicitly requests `"short"` and reuses the
  existing concise lower-back prompt;
- use the existing concise lower-back prompt for `/demo`;
- keep Vapi's structured function-tool extraction and automatic completion;
- read the existing assessment store only inside the adapter, then copy the
  accepted values into an immutable `CompletedDemoIntake`;
- do not render the transcript;
- auto-submit once when the completion tool arrives;
- never auto-start a second assessment session;
- ignore late callbacks after stop, reset, or unmount;
- expose a visible "Use rehearsed intake" fallback that produces the same
  clinical values and source IDs with only `inputMode` different.

Live voice requires `NEXT_PUBLIC_VAPI_PUBLIC_KEY`. Missing or failed Vapi must
leave the fallback usable and must not block the deterministic demo.
The current short prompt describes an approximately four-minute conversation,
so live voice is a best-effort interactive path, not a timed-rehearsal
acceptance criterion.

Focused gate:

```bash
bunx vitest run \
  src/hooks/assessment-vapi-config.test.ts \
  src/app/demo/voice/demo-voice-adapter.test.ts \
  src/app/demo/voice/demo-voice-intake.test.tsx \
  src/app/demo/voice/demo-preparing-brief.test.tsx
bunx tsc --noEmit
```

## Wave 2B — Clinician Brief and Assessment

Exclusive ownership:

```text
src/app/demo/brief/brief-assessment-model.ts
src/app/demo/brief/brief-assessment-model.test.ts
src/app/demo/brief/clinician-brief-scene.tsx
src/app/demo/brief/clinician-brief-scene.test.tsx
src/app/demo/brief/clinician-assessment-scene.tsx
src/app/demo/brief/clinician-assessment-scene.test.tsx
src/app/demo/brief/brief.module.css
```

Reuse:

- patient identity and attention-card hierarchy from
  `src/app/pt/clients/[id]/page.tsx`;
- `Card`, `Badge`, `Button`, `Dialog`, and `Select` from
  `src/components/ui/`;
- sage/sand/terracotta tokens from `src/app/globals.css`.

Do not reuse the PT route's fetch/mutation logic, `pt-store`, or mock patients.

Required behavior:

- recorded, missing, and not-tested states are visibly distinct;
- exactly one fact remains `Unknown from intake`;
- every recorded material fact opens a bounded source excerpt;
- inspecting the rehearsed source marks the brief ready;
- only movement pain is editable from `4/10` to `3/10`;
- confirmation emits one immutable verified handoff and locks editing.

Focused gate:

```bash
bunx vitest run \
  src/app/demo/brief/brief-assessment-model.test.ts \
  src/app/demo/brief/clinician-brief-scene.test.tsx \
  src/app/demo/brief/clinician-assessment-scene.test.tsx
bunx tsc --noEmit
```

## Wave 2C — Deterministic Plan, Approval, and Today

Exclusive ownership:

```text
src/app/demo/plan/compose-demo-plan.ts
src/app/demo/plan/compose-demo-plan.test.ts
src/app/demo/plan/plan-review-scene.tsx
src/app/demo/plan/plan-review-scene.test.tsx
src/app/demo/plan/plan.module.css
src/app/demo/today/select-demo-today.ts
src/app/demo/today/select-demo-today.test.ts
src/app/demo/today/patient-today-scene.tsx
src/app/demo/today/patient-today-scene.test.tsx
src/app/demo/today/today.module.css
```

Implementation:

- read real catalog entries from `src/lib/exercises/data.json`;
- use a pure demo-local composer, not Gemini, a database, or an API;
- validate the verified handoff and fixture pins;
- return exactly three eligible exercises and one truthful exclusion;
- derive dosage from catalog plus explicit deterministic demo rules;
- use a stable canonical input fingerprint;
- bind approval to exact draft version and fingerprint;
- derive Today only through `selectDemoToday(approval, draft)`;
- reuse presentation ideas from
  `src/app/pt/clients/[id]/plan/` and
  `src/app/(dashboard)/plan/page.tsx`, not their data access.

Focused gate:

```bash
bunx vitest run \
  src/app/demo/plan/compose-demo-plan.test.ts \
  src/app/demo/plan/plan-review-scene.test.tsx \
  src/app/demo/today/select-demo-today.test.ts \
  src/app/demo/today/patient-today-scene.test.tsx
bunx tsc --noEmit
```

## Wave 2 Landing Rule

Launch 2A, 2B, and 2C from the same pushed Wave 1 commit. Cloud tasks return
independent diffs and do not push or open PRs.

Apply diffs serially to local `of/yc-demo-plan`, preferably 2C, 2B, then 2A.
After each:

1. reject edits outside the task's ownership;
2. inspect the exact diff;
3. run its focused gate;
4. commit only owned files;
5. push the integration branch.

## Wave 3 — Single-Owner Integration

One task wires all leaves into the shared shell:

1. voice completion → immutable intake → nonce-safe preparation timer;
2. preparation → focused clinician brief;
3. source inspection → assessment correction and confirmation;
4. verified handoff → single composition attempt and deterministic retry;
5. exact draft → approval → guarded Today selector.

No parallel writer edits shared files during this wave.

Integrated gate:

```bash
bunx vitest run src/app/demo
bunx tsc --noEmit
SKIP_ENV_VALIDATION=true bun run build
```

Do not open a PR or request Greptile yet.

## Wave 4 — Hardening and Rehearsal

Automated assertions:

- every legal and prohibited transition;
- live/fallback input equivalence except `inputMode`;
- stale voice callbacks and preparation timers do nothing;
- a canonical mocked successful Vapi tool sequence and the rehearsed fallback
  produce equivalent intake values and source IDs except for `inputMode`;
- missing never becomes false;
- confirmation and composition are idempotent;
- stale approval cannot open Today;
- Today identity and dosage equal the approved first candidate;
- reset works from listening, preparing, composing, and approved states.

Manual matrix:

- Chrome with microphone allowed;
- microphone denied, then rehearsed fallback;
- keyboard-only path;
- reduced-motion path;
- reset during listening, preparation, and composition;
- composition failure and retry;
- 1440×900 and 1280×800;
- 200% zoom on brief, plan approval, and Today;
- five uninterrupted rehearsed-fallback runs under 2:45; do not treat an
  external live-Vapi conversation as a deterministic timing test.

Full gate:

```bash
bunx eslint src/app/demo
bunx tsc --noEmit
bunx vitest run
SKIP_ENV_VALIDATION=true bun run build
```

## Cloud Environment

Configure Codex Cloud for:

- repository: `obro79/Rehabify`;
- branch: `of/yc-demo-plan`;
- Node: `24.x`;
- Bun: `1.3.x`;
- setup: `bun install --frozen-lockfile`;
- maintenance: `bun install --frozen-lockfile`;
- no required secrets for build or fallback demo;
- optional `NEXT_PUBLIC_VAPI_PUBLIC_KEY` for live voice.

Setup has network access. The Next build uses Google fonts, so prewarming the
build during setup or allowing `fonts.googleapis.com` and
`fonts.gstatic.com` may be necessary.

## First Cloud Task Prompt

```text
Work in obro79/Rehabify from the existing branch of/yc-demo-plan.
Read docs/specs/2026-07-27-yc-demo-rehabify-execution.md completely, then read
the master, Part 1, and UI plans for product intent.

Implement Wave 1 only: shell, contracts, fixture, reducer, typed placeholders,
frames, presenter controls, and focused tests. Own only the ten Wave 1 files
listed in the authoritative Rehabify execution plan. Preserve all other work.
Do not implement leaf scenes or touch production routes, APIs, databases,
stores, auth, Vapi hooks, or unrelated files.

Run the exact Wave 1 focused gate. Review git diff and git status. Do not push,
open a PR, or request Greptile. Return the Cloud task ID, changed files, diff,
checks/results, and any precise contract issue.
```

## Final PR and Greptile

Only after Wave 4 is green:

1. push the final `of/yc-demo-plan` commit to `obro79/Rehabify`;
2. open the single ready-for-review PR to `main`;
3. wait for all GitHub CI checks to pass;
4. add one top-level PR comment containing `@greptileai`;
5. address actionable findings and rerun affected gates.

No planning, leaf, draft, or partially integrated work receives a Greptile
review.

## Completion Definition

- the public `/demo` route works from a clean checkout;
- live voice works when configured and fallback always works;
- the complete state chain is artifact-driven and approval-gated;
- focused tests, full tests, typecheck, lint, build, and CI pass;
- five rehearsals finish under 2:45;
- one final PR targets `main`;
- Greptile runs only after final CI is green.
