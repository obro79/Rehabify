# 07 — Cleanup & Deletion Plan

> Audited 2026-08-02 by static import-graph analysis of `src/**/*.{ts,tsx}`
> (53,633 LOC, 190 files). Entrypoints: `page.tsx`, `layout.tsx`, `route.ts`,
> `not-found.tsx`, `error.tsx`, `loading.tsx`, `template.tsx`, `default.tsx`,
> and `src/proxy.ts` (Next 16's `middleware.ts` replacement).
>
> **Verified 2026-08-02** with `tsc`, `vitest`, and `knip` against installed
> dependencies — see **§0**, which supersedes any disagreement below.
>
> **Vision is retained in full ([ADR-003](./09-decision-log.md)) and is excluded
> from every phase below. §3 is a do-not-touch list.**
>
> **Headline: ~9,300 LOC across 103 files is removable with no behaviour change
> — knip-confirmed, vision already carved out. Plus ~6,000 lines of regenerable
> SQL and 25.9 MB of assets.**
>
> **And the finding that reframes the rest: there is no CI, the pre-commit hook
> is not executable, and the test suite has not run at all — 21 of 21 files fail
> to load on a missing peer dependency. Production code typechecks clean; every
> one of the 20 `tsc` errors is in a test file.**

---

## 0. Verification pass — run 2026-08-02

The audit below was originally hand-built (no `node_modules`). **Dependencies
have since been installed and `tsc`, `vitest`, and `knip` were run.** This
section records what that changed. Where §0 and the sections below disagree, §0
wins.

### 🔴 0a. The baseline was not green, and nothing has ever gated it

**There is no CI.** No `.github/workflows` of any kind. The only hook is
`.husky/pre-commit` (`bun run build`), and **it is not executable** — git prints
`hook was ignored because it's not set as executable` on every commit. So no
typecheck, no test run, and no build has ever been enforced on this repo.

That is the root cause of everything in §0b–0c. It is also the cheapest thing
here to fix, and it should be fixed *first* — otherwise the cleanup restores a
green baseline that immediately rots again.

### 🔴 0b. The entire test suite was non-executing

All **21 test files failed to load**: `Cannot find module '@testing-library/dom'`.
It is a peer dependency of `@testing-library/react` v16 and **was never declared
in `package.json`**.

`bun add -d @testing-library/dom` — one line — takes the suite from
**0 tests running** to **192 of 203 passing**.

The 11 remaining failures across 5 files, categorized:

| File | Cause | Action |
|---|---|---|
| `lib/session/__tests__/react-integration.test.ts` | Imports `@/hooks/useSessionResume` and `@/hooks/useMultiTabGuard` — **neither module exists** | Delete with §2g `session-guard.ts` |
| `stores/__tests__/onboarding-store.test.ts` | Imports 6 selectors the store no longer exports | Rewrite or delete |
| `__tests__/form-engine-flexion.test.ts` | **Live vision bug — see §0f** | Fix; do not delete |
| `app/privacy/page.test.tsx`, `app/terms/page.test.tsx` | Env validation — `NEXT_PUBLIC_VAPI_PUBLIC_KEY` / `NEXT_PUBLIC_APP_URL` unset under test | Add test env; the Vapi key disappears with §2e |

**Three of five failing files test code that no longer exists.** The tests were
never updated when the code moved, and nothing ran them to notice.

### 0c. `tsc --noEmit`: 20 errors — **all of them in test files**

| File | Errors |
|---|---|
| `lib/api/__tests__/auth.test.ts` | 8 |
| `stores/__tests__/onboarding-store.test.ts` | 6 |
| `lib/session/__tests__/react-integration.test.ts` | 3 |
| `app/terms/page.test.tsx`, `app/privacy/page.test.tsx`, `__tests__/form-engine-flexion.test.ts` | 1 each |

**Production code typechecks clean.** That is a genuinely good result for 53k
LOC and worth stating plainly — the rot is confined to the test layer, which is
exactly what "no CI" predicts.

### 🟠 0d. New finding — `src/lib/date-utils.js` is a committed build artifact

`src/lib/date-utils.js` (190 lines, CommonJS, `Object.defineProperty(exports,
"__esModule", …)`) sits next to `src/lib/date-utils.ts` (183 lines). It is `tsc`
output, committed in `826de38 Add date-utils`, exporting the same 11 functions.

It is the **only** stray `.js` in `src/`, and it shadows its own source in some
resolvers — which is why knip reports the `.ts` as unused while three live pages
import from `@/lib/date-utils`. Delete the `.js`; add `src/**/*.js` to
`.gitignore`.

### 0e. knip found ~116 unused files — more than this document did

knip's list is a **superset** of §2, and the additions are all the same
extract-but-never-adopt pattern §2a describes, in directories §2 did not reach:

| Directory | Files | Note |
|---|---|---|
| `components/landing/` | 8 | **Verified**: `landing-client.tsx` is the live component and imports only `./clinical-trust-section` |
| `components/ui/` | ~18 | Overlaps §2b |
| `app/**/_components/` (dashboard, exercises, profile, workout complete, plan, analytics) | ~35 | Overlaps §2a |

**Both tools have false positives — verify per file, do not pipe either list into
`rm`:**

- knip flags `src/lib/date-utils.ts` as unused. It is live (§0d explains why).
- knip flags `eslint-config-next` and `lint-staged` as unused devDependencies.
  Both are used — via `eslint.config`/`next lint` and via husky respectively.
- knip does **not** flag `react-is`, which §4 identifies as genuinely unused.

Other knip output worth acting on: `postcss-load-config` is an **unlisted**
dependency (used by `postcss.config.mjs`, not declared), and there are 269 unused
exports / 186 unused exported types — mostly inside files already slated for
deletion, so sweep those *after* the file deletions, not before.

### 🟠 0f. Standing lumbar flexion never enters its flexion phase

Surfaced only because the suite was made to run. Both failures in
`form-engine-flexion.test.ts` share one root cause:

```
AssertionError: expected 'neutral' to be 'flexion'
```

`analyzeStandingLumbarFlexion` is defined **twice** — at `form-engine.ts:319`
(live, dispatched from `:1205` and `:1239`) and again at
`lib/vision/exercises/lumbar.ts:14` (unreferenced). The test imports the **live**
one, so this is not a dead-code failure.

The live analyzer gates flexion on `hipAngle <= 90`, commented
`// Require deeper bend for flexion`. The test fixture was written against a
looser threshold. So the threshold was **deliberately retuned and the test was
never re-run** — §0a again.

Consequence if the analyzer is right: phase never leaves `neutral` for that
fixture, `repIncremented` is therefore never true, and **standing lumbar flexion
cannot count a rep**. Consequence if the test is right: the threshold is too
strict for real patients. Someone who knows the movement has to say which — and
a 90° hip-angle cutoff is arguably clinician-configurable data, not a constant in
a 1,286-line file.

Related, and in scope for phase 6 rather than here: that function
`console.log`s joint angles on every phase transition
(`[LUMBAR_FLEX] … hipAngle=…`). Under the PHI discipline in
[03 §2](./03-data-architecture.md) that is a disclosure vector, not just noise.

**Vision is retained in full ([ADR-003](./09-decision-log.md)), so this is a bug
to fix, not a file to delete.**

### Caveats that still stand

- Static `import` / `export … from` / `require` / `import('literal')` were
  resolved. A component pulled in by a computed specifier or a string-keyed
  registry would read as dead. No such registry was found, but its absence was
  not exhaustively proven.
- **`src/app/globals.css` was not audited.** Several greps hit CSS names that
  shadow component names being deleted (`.sidebar-nav`, `.calendar-container`,
  `--popover`). Check it when removing those components.
- `next build` was not run (it needs env vars). Confirm in Phase 0.

**Method for every deletion below:** confirm against knip *and* this document,
then delete in the ordered phases. Each phase is one commit with a green
`tsc --noEmit && next build && vitest run`.

---

## 1. Findings that are bugs, not bloat

These must be fixed regardless of the rebuild. Two of them are patient-facing.

### 🔴 1a. `/progress` renders fabricated clinical history to real users

Five chart components take **mock generators as default parameter values**:

```
src/components/progress/activity-heatmap.tsx:25          data = getMockActivityData()
src/components/progress/exercise-breakdown-chart.tsx:24  data = getMockExerciseBreakdown()
src/components/progress/form-score-chart.tsx:22          data = getMockFormScores()
src/components/progress/personal-records.tsx:14          data = getMockPersonalRecords()
src/components/progress/session-frequency-chart.tsx:15   data = getMockSessionFrequency()
```

[progress/page.tsx:159](src/app/(dashboard)/progress/page.tsx:159) initialises
`data` to `null` and only calls `setData` when `sessions.length > 0` (line 175).
It then renders `<FormScoreChart data={data?.formScores} />` and four siblings.
`data?.x` is `undefined` → **the JS default parameters fire** → all five charts
render invented history.

Triggers on: **a new user with zero sessions**, a non-2xx from
`/api/patient-records` (swallowed at `page.tsx:165-168`), or a thrown fetch
(logged and ignored at `page.tsx:180`). There is no error UI.

**A patient sees a fabricated recovery trend and cannot tell.** Fix before
anything else: make `data` a required prop, delete the defaults, and add an
empty state and an error state.

### 🟠 1b. Clinician-facing analytics run on hardcoded benchmarks

[pt/clients/[id]/analytics/page.tsx:10-16](src/app/pt/clients/[id]/analytics/page.tsx:10)
imports `BENCHMARKS`, `compareToBenchmark`, `calculateFormScoreImprovement`,
`calculatePainReduction`, and `getBenchmarkStatusMessage` from
`lib/mock-data/pt-benchmarks`. Hardcoded clinical benchmark constants drive a
page a physiotherapist reads. Either source them from clinician-configured
values or remove the page.

### 🟠 1c. The PT store is seeded from mock patients

```ts
src/stores/pt-store.ts:9   import { mockPatients } from '@/lib/mock-data/pt-data';
src/stores/pt-store.ts:41  patients: mockPatients,
```

Consumed in production by
[pt/clients/[id]/plan/page.tsx:57](src/app/pt/clients/[id]/plan/page.tsx:57),
which calls `getPatientById` against the seeded array. **The plan builder reads a
hardcoded roster, not the database.**

### 🟠 1d. Exiting the new assessment dumps you into the old one

All four inbound links point at `/assessment/lower-back`. `/assessment` (506 LOC)
is reachable *only* from
[lower-back/page.tsx:629](src/app/assessment/lower-back/page.tsx:629) —
`router.push("/assessment")` inside `handleExit`. Delete the old route and fix
the exit target.

### 🟡 1e. Internal hackathon docs are served on the public web

`public/assets/pitch/FAQ-judge-questions.md`,
`public/assets/icons/ICON-GENERATION-GUIDE.md`,
`public/assets/system-architecture-prompt.md`,
`public/assets/ui-screenshots/UI-DESIGN-NOTES.md` are live at
`/assets/pitch/FAQ-judge-questions.md` etc. Move to `docs/`.

### 🟡 1f. `db:migrate` cannot run against a fresh database

`001_complete_schema.sql` targets **Supabase** while the app runs **Neon Auth**.
Three references to `auth.users`: `profiles.id UUID PRIMARY KEY REFERENCES
auth.users(id)` (line 31) and a `handle_new_user()` trigger `AFTER INSERT ON
auth.users` (~84-99). `003_mock_data.sql:17` admits it: *"In a real setup, you'd
create auth.users entries first via Neon Auth."*

Ironically this resolves itself — [03-data-architecture.md](./03-data-architecture.md)
moves to Supabase, where `auth.users` is real. But the migration set is being
rewritten from scratch regardless.

---

## 2. Deletion inventory

### 2a. Extracted-but-never-adopted components — 3,340 LOC, 50 files · **SAFE**

The single biggest pattern. Someone refactored six large pages into
`_components/` directories and **never changed the pages to import them**. The
pages still contain the inline originals.

Proof: `src/app/(dashboard)/exercises/page.tsx` imports *only*
`./_components/constants` (line 36) — none of the other six files in that
directory. Each directory's `index.ts` barrel is itself dead, so the barrel is
the only "importer".

| Directory | Files | LOC |
|---|---|---|
| `(dashboard)/exercises/_components/` (minus `constants.ts`) | 6 | 546 |
| `(dashboard)/workout/[slug]/complete/_components/` | 10 | 522 |
| `pt/clients/[id]/plan/*Panel.tsx` etc. (no barrel at all) | 7 | 641 |
| `components/landing/*-section.tsx` + `feature-card` + `landing-data` | 8 | 553 |
| `(dashboard)/profile/_components/` | 6 | 380 |
| `(dashboard)/dashboard/_components/` (minus `constants.ts`) | 5 | 303 |
| `(dashboard)/patient-profile/components/` | 2 | 217 |
| `pt/clients/[id]/analytics/_components/` | 4 | 152 |

The landing case is measurable: `landing/testimonials-section.tsx` is **94%
verbatim overlap** with `landing-client.tsx`, which `app/page.tsx:2` actually
renders.

### 2b. `src/components/ui/` — 2,262 LOC, 22 files · **SAFE**

*(subset of the 114-file total; called out separately because it is the cleanest
sweep)*

17 unreferenced components — `date-picker.tsx` (**446**),
`illustrations/wellness-illustration.tsx` (207), `popover.tsx` (168),
`calendar.tsx` (134), `slider.tsx` (112), `radio-group.tsx` (99),
`session-controls.tsx` (96), `tooltip.tsx` (93), `breadcrumb.tsx` (74),
`sidebar-nav.tsx` (72), `stat-display.tsx` (64), `step-badge.tsx` (54),
`icon-container.tsx` (51), `stat-card-wrapper.tsx` (38), `skeleton.tsx` (32),
`separator.tsx` (30), `index.ts` (4).

`date-picker` → `calendar` → `popover` is a dead cluster (356 LOC).
`stat-display`/`icon-container`/`stat-card-wrapper` look alive but their only
importer is the dead `complete/_components/stat-cards.tsx`.

Plus **5 unused icons, 488 LOC** — `shoulder-icon` (128), `ankle-icon` (115),
`knee-icon` (108), `activity-icon` (72), `spine-icon` (65). The `icons/index.ts`
barrel has 20 importers, so this required per-named-export analysis; remove
their lines from the barrel too.

⚠️ Before deleting `tooltip.tsx`: the live component is `tooltip-card.tsx`
(`landing/clinical-trust-section.tsx:5`) — a different file.

### 2c. `src/lib/voice/` — entire package, 888 LOC · **SAFE**

`form-event-bridge.ts` (329), `form-event-debouncer.ts` (197), `types.ts` (191),
`event-handlers.ts` (152), `index.ts` (19).

The only importer chain runs through the dead `lib/voice/index.ts` and the dead
`use-session-voice.ts`. The live workout page uses `src/hooks/use-form-event-bridge.ts`
(206 LOC), an **independent reimplementation** importing only `react` and
`@/stores/exercise-store`.

Note `lib/vapi/event-handlers.ts` (live) and `lib/voice/event-handlers.ts` (dead)
share a name and have **0% overlap** — unrelated files.

### 2d. Dead hooks — 1,280 LOC · **SAFE**

`assessment-vapi-config.ts` (389), `use-pose-detection.ts` (191),
`use-session-voice.ts` (157), `use-multi-tab-guard.ts` (156),
`use-session-resume.ts` (132), `use-carousel.ts` (107), `use-auto-save.ts` (93),
`use-camera.ts` (55).

`use-pose-detection.ts` is also **55% overlap (70 contiguous lines)** with
`components/workout/exercise-camera.tsx` — two full MediaPipe loops.

### 2e. Dead Vapi surface — 540 LOC · **SAFE**

- `lib/vapi/workflow-nodes.ts` (301) + `workflow-edges.ts` (16) — the 13-node
  graph, **zero import sites**. Declared, never executed.
- `api/vapi/assessment-webhook/{handlers.ts (127), store.ts (55), constants.ts (41)}`
  — `route.ts` (383 LOC) has exactly two imports (lines 8–9) and imports **none**
  of them; it reimplements the tool handlers inline at `route.ts:170`.

*(All remaining Vapi code goes with [05-voice-pipeline.md §9](./05-voice-pipeline.md).)*

### 2f. `src/components/assessment/` — 281 LOC, 6 of 7 files · **SAFE**

`assessment-overlays.tsx` (72), `body-region-card.tsx` (72),
`phase-instructions.tsx` (68), `movement-metrics.tsx` (43), `numbered-list.tsx`
(20), `index.ts` (6). Only `step-indicator.tsx` survives.

### 2g. Misc orphans — 835 LOC

| File | LOC | Verdict |
|---|---|---|
| `lib/session/session-guard.ts` | 271 | **LIKELY** — dead in prod, but two test files exercise it. Its only non-test importer is the dead `use-multi-tab-guard.ts`. Delete tests with it. |
| `stores/assessment-store.types.ts` | 167 | SAFE |
| `lib/analytics/patient-analytics.ts` | 101 | SAFE |
| `components/layout/floating-sidebar.tsx` | 96 | SAFE — near-dupe of live `sidebar.tsx` |
| `stores/assessment-store.actions.ts` | 83 | SAFE |
| `types/vapi-webhook.ts` | 72 | SAFE |
| `lib/session/index.ts` | 29 | SAFE (barrel) |
| `lib/gemini/index.ts` | 11 | SAFE (barrel) |
| `components/pt/index.ts` | 5 | SAFE (barrel) |
| `types/exercise.ts` | 27 | **LIKELY** — pure re-export shim over `lib/exercises/types` |

### 2h. Mock data — 1,610 LOC in `src/lib/mock-data/`

`index.ts` (784) and `pt-data.ts` (659) **both** declare `Alert`, `PlanExercise`,
`Plan`, `Session`, `MockPatient`, and `mockPatients` — same patient `pt-001`
"Sarah Johnson" at `index.ts:312` and `pt-data.ts:131`. 51 contiguous duplicate
lines.

**~420 LOC SAFE DELETE** inside `index.ts` (verified zero external references):
`mockExercises`, `aiEnabledExercises`, `getRandomQuote`, `mockSessions`,
`mockWeeklyActivity`, `mockHistorySessions`.

The rest is **REFACTOR** — see §1a–1c. Type-only imports from `mock-data` in
seven production files are harmless but couple prod to the mock module; retype
against `db/schema` instead.

### 2i. The messaging feature — 1,152 LOC · **LIKELY (product call)**

`api/messages/route.ts:5,11` and `api/messages/[userId]/route.ts:5,11` define
`MOCK_CURRENT_USER` and `MOCK_MESSAGES` — **duplicated verbatim, 60% / 52
contiguous lines**. Neither route imports `@/db`. A real `messages` table exists
in the schema and in `001:349` and is never queried. `/messages` has **zero
inbound links** from any nav component.

So: a fully-mocked, unreachable feature with a real table behind it. This is a
product decision, not a cleanup one — it is not in the first-release scope in
[01-product-definition.md](./01-product-definition.md), so **delete it and
rebuild if needed.**

### 2j. Duplicate assessment route — 506 LOC · **LIKELY**

`app/assessment/page.tsx` (506, camera-only, no Vapi) vs
`app/assessment/lower-back/page.tsx` (946, Vapi interview). Only 18% textual
overlap — genuinely different implementations, not copies. See §1d for the exit
bug. Delete the former.

---

## 3. Vision — retained in full, excluded from cleanup

> **[ADR-003](./09-decision-log.md) was reversed. Vision is kept.** Nothing in
> this section is deleted or refactored. It is documented so the cleanup knows
> what **not** to touch.

**This section is a do-not-touch list, not a deletion list.** That includes the
~1,099 LOC below that currently has zero importers — knip confirms all six files
independently, and they stay anyway.

### Excluded from every deletion phase

| Path | Note |
|---|---|
| `src/lib/vision/**` | All of it, including `form-engine.ts` (1,286) |
| `src/hooks/use-pose-detection.ts`, `src/hooks/use-camera.ts` | |
| `src/components/workout/{exercise-camera, feedback-overlay, draw-skeleton, camera-status-overlay, pose-constants}` | |
| `src/types/vision.ts`, `src/types/dynamic-time-warping.d.ts` | |
| `src/__tests__/form-engine-flexion.test.ts` | **Fix per §0f** |
| `@mediapipe/tasks-vision`, `1eurofilter`, `dynamic-time-warping` | Stay in `package.json` |

`components/workout/index.ts`, `(dashboard)/workout/[slug]/page.tsx`,
`assessment/lower-back/page.tsx`, and `stores/exercise-store.ts` are **not
edited for vision reasons** — the earlier plan's 7-file edit table is void.

### Two things worth knowing about the retained code

**`form-engine.ts` has exactly one live analyzer: squat.** `form-engine.ts:4` is
the only import of `./exercises/squat`; `standing`, `lumbar`, `floor`, and
`assessment-movements` have zero importers, and `geometry.ts` / `form-types.ts`
are imported only by those. Dead-but-kept, by decision.

**`analyzeStandingLumbarFlexion` is duplicated** — `form-engine.ts:319` (live)
and `exercises/lumbar.ts:14` (orphaned). Two implementations that can drift, and
one of them has the §0f bug. Deduplicating is a refactor, so it is **out of scope
here**; flagged for whoever picks vision back up.

### Also not in scope, despite the name

`src/components/motion/` (231 LOC) is framer-motion animation helpers used by
**16 files** — unrelated to computer vision.

Four files in `components/workout/` that knip reports unused —
`metrics-grid.tsx` (70), `exercise-instructions-card.tsx` (68),
`session-header.tsx` (59), `demo-video-sidebar.tsx` (40) — were checked for
vision references and have **none**. They are eligible for phase 4, but because
they sit in the vision-adjacent directory, **verify each against the live workout
page by hand** rather than trusting knip.

---

## 4. Dependencies

| Package | Import sites | Verdict |
|---|---|---|
| `react-is@^19.2.3` | **0** anywhere | **DELETE** — `bun.lock` shows only `prop-types`/`hoist-non-react-statics` needing `react-is@^16`. Likely added to silence a recharts peer warning. |
| `@mediapipe/tasks-vision` | 1 | Delete with vision |
| `1eurofilter` | 1 | Delete with vision |
| `dynamic-time-warping` | 1 | Delete with vision |
| `@vapi-ai/web` | 2 | Delete with the voice swap ([05](./05-voice-pipeline.md)) |
| `@google/generative-ai` | 1 | Replace with the OpenAI SDK ([06](./06-ai-pipelines.md)) |
| `@neondatabase/serverless`, `@neondatabase/auth`, `drizzle-orm` | — | Replaced per [03](./03-data-architecture.md) / [04](./04-auth-access-control.md) |

`recharts` is a heavy dependency for three charts — worth revisiting, but keep
for now. Everything else (`clsx`, `tailwind-merge`, `@radix-ui/react-slot`) is a
correct single-chokepoint dependency. Toolchain devDependencies with zero direct
imports (`dotenv-cli`, `lint-staged`, `@vitest/coverage-v8`, `jsdom`, `postcss`)
are used via scripts and config — **keep**.

**Only one genuinely unused dependency today: `react-is`.** That is a good sign;
the bloat is in source files, not in `package.json`.

---

## 5. Database surface

`src/db` is 7,602 lines, and **88% of it is seed/mock SQL, not schema**:

```
TypeScript:   888   (index 28, neon-client 46, 11 schema files 814)
SQL:        6,714   (001_complete_schema 666, 002_seed_data 5,102,
                     003_mock_data 886, 004_patient_medical_info 60)
```

`002_seed_data.sql` is 5,102 lines of generated `INSERT`s for 200 exercises —
**two statements**, regenerable via `npm run db:generate-seed`. `003_mock_data.sql`
(886) is the hackathon demo dataset, with hardcoded demo credentials in its
header comment. Neither is code.

### Tables with zero query sites — 8 of 15

15 tables are declared; only 7 appear in any query (`assessments`, `plans`,
`profiles`, `sessions`, `ptAlerts`, `patientMedicalInfo`, `exercises`).

`planModifications`, `sessionNotes`, `cannedResponses`, `ptRecommendations`,
`achievements`, `userAchievements`, `notifications`, `messages` — all zero.

`messages` is different in kind from the rest: **planned-but-unwired**, not
abandoned (see §2i). Decide the feature first.

### Drift

Column-for-column, **all 15 tables match** their `pgTable` definitions — no
column drift. The two real drifts are §1f (`auth.users` against Neon Auth) and
the fact that `004_patient_medical_info.sql` was never folded into `001` while
`drizzle-kit generate` output is not committed — **two parallel migration
systems** (`db:push`/`db:generate` vs `db:migrate`/`db:seed`/`db:mock`).

[03-data-architecture.md](./03-data-architecture.md) resolves this by banning
`drizzle-kit push` outright (it **silently skips RLS policy SQL**) and adopting
`generate` + `migrate` as the only path.

---

## 6. Assets & config — 28.1 MB

### `public/` — 34.6 MB, 49 files

**SAFE DELETE — 25.9 MB, 5 files** (zero references in `src/`, `docs/`,
`scripts/`, `README.md`):

| File | Size |
|---|---|
| `public/demopics/good lunge.gif` | **19.6 MB** |
| `public/favicon.png` | **5.2 MB** |
| `public/404.jpg` | 825 KB |
| `public/register.jpg` | 704 KB |
| `public/exercise-images/standing-back-extension.jpg` | 258 KB |

A 5.2 MB favicon is itself a bug — and it is not even wired up: there is no
`src/app/favicon.ico` or `icon.*`, and `layout.tsx` declares no `icons`
metadata.

⚠️ **Correction to a naive scan:** the other 30 `exercise-images/*.jpg` look
unreferenced but are resolved dynamically at `lib/exercise-utils.tsx:254,259` via
`` `/exercise-images/${slug}.jpg` ``. Reconciled against the 30-entry
`EXERCISE_IMAGES` allowlist plus 18 `IMAGE_FALLBACKS` targets: **30 used, 0
missing, exactly 1 orphaned.** All `public/videos/*.mp4` are referenced from
`lib/exercises/video-map.ts:12-57`.

### `.playwright-mcp/` — 2.2 MB, **git-tracked** · SAFE

`git ls-files .playwright-mcp` returns 3 PNGs. `.gitignore:70` says
`playwright-mcp/` — **missing the leading dot**, so it never matched. Fix the
pattern *and* `git rm -r --cached`.

### Empty placeholder dirs · SAFE

`components/dashboard/.gitkeep`, `lib/neon/.gitkeep`, `lib/voice/prompts/.gitkeep`,
`app/(dashboard)/exercise/[type]/.gitkeep` — the last is a **live empty Next.js
route segment**.

### Keep

⚠️ **Correction (§0):** `generate-seed-sql.js` and `setup-database.sh` are wired
to `package.json` (`db:generate-seed`, `db:setup`). **`seed-pt-data.mjs` (311
LOC) is not** — knip flags it, and its only mention anywhere is a `Run: node
scripts/seed-pt-data.mjs` comment in its own header. It is a manual hackathon
script; delete it in phase 4. `docs/` is 148 KB and active — though
`docs/session-2-real-data-wiring.md` is stale hackathon notes.

---

## 7. Code quality inside live files

**This is the cleanest category, and it is worth saying so.**

| Metric | Count | Note |
|---|---|---|
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` | **0** | |
| `eslint-disable` | 2 | `proxy.ts:11`, `dashboard/page.tsx` |
| `any` | **11** | genuinely low for 53k LOC; 7 are in `patient-profile/page.tsx` |
| `TODO`/`FIXME`/`HACK` | 7 | |
| Commented-out code | ~12 lines | |
| `console.log` | **39** | 25 are in files already slated for deletion |
| `console.warn`/`console.error` | 62 | |

Only two real items: strip the remaining `console.log`s (a structured logger is
required anyway once PHI is in play — a `console.log` of a request body is a
disclosure), and unpick the dual `draftPlan` / `draftPlanStructure` legacy shape
in `pt-store.ts:15`. **~60 LOC.** Fold into the phases below.

---

## 8. Branches

3 local (`claude/rehabifyy-architecture-rebuild-1dbc35`, `feat/yc-demo-brief-plan`,
`prod`), **22 remote** — most from January 2026: `origin/computer-vision`,
`origin/form-engine`, `origin/lunge`, `origin/fix-squat`, `origin/pitch-slide`,
and others.

Since the rebuild pushes to a **new remote**, this resolves itself: the new
remote starts with `prod` and the rebuild branch only. Before cutting over, tag
the current `prod` as `archive/pre-rebuild-2026-08` on the old remote so nothing
is lost, then let the old remote go cold.

---

## 9. Execution order

Each phase is one commit, ending green on
`tsc --noEmit && next build && vitest run`.

One branch off `prod` (`cleanup/*`), one commit per phase, each ending green on
`tsc --noEmit && next build && vitest run`.

Branch `cleanup` off `prod`. One commit per phase. Each phase ends green on
`tsc --noEmit && next build && vitest run`.

| # | Phase | Scope | Risk |
|---|---|---|---|
| **0** | **Make the build gate real** | ~10 lines | **None — do this first** |
| **1** | Green the baseline | ~460 deleted | Low |
| **2** | Fix `/progress` fabricated charts (§1a) — **ship alone** | ~50 changed | Low |
| **3** | Assets | 25.9 MB | None |
| **4** | The unreferenced-file sweep | ~9,300 | Low |
| **5** | Unused exports and types | — | Low |
| **6** | Odds and ends | ~60 | None |
| — | *Product deletions: messaging (§2i), duplicate `/assessment` route (§2j)* | 1,658 | **Parked — §10** |
| — | *Vision* | — | **Retained — §3, [ADR-003](./09-decision-log.md)** |
| — | *Vapi removal ([05 §9](./05-voice-pipeline.md))* | — | **Not cleanup** — lands with Deepgram ([08 stage 7](./08-migration-plan.md)) |
| — | *Database: 8 unqueried tables, `002`/`003` SQL, one migration system* | ~6,300 | **Not cleanup** — see [03](./03-data-architecture.md) |

### Phase 0 — make the build gate real

Nothing is deleted. This exists because §0a found that no CI has ever run.

- `bun add -d @testing-library/dom` — unblocks all 21 test files
- `chmod +x .husky/pre-commit` — currently ignored by git on every commit
- Add `.github/workflows/ci.yml`: `tsc --noEmit`, `vitest run`, `next build`
- Declare `postcss-load-config` (knip: unlisted, used by `postcss.config.mjs`)
- Add a test env providing `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_VAPI_PUBLIC_KEY`
  so `privacy`/`terms` tests stop failing on env validation

> CI is allowed to be red at the end of phase 0 — phase 1 is what makes it green.
> Land phase 0 first anyway, so phase 1 is verified by the gate rather than by me.

### Phase 1 — green the baseline

| Action | File | LOC |
|---|---|---|
| Delete | `lib/session/__tests__/react-integration.test.ts` — imports two modules that do not exist | — |
| Delete | `lib/session/session-guard.ts` + its second test, `hooks/use-multi-tab-guard.ts`, `hooks/use-session-resume.ts`, `lib/session/index.ts` | ~590 |
| Fix or delete | `stores/__tests__/onboarding-store.test.ts` — imports 6 selectors the store no longer exports | — |
| Fix | `lib/api/__tests__/auth.test.ts` — 8 tsc errors, incomplete user fixtures | — |
| Fix | `__tests__/form-engine-flexion.test.ts` per §0f — **reconcile the 90° threshold, do not delete** | — |
| Delete | `src/lib/date-utils.js` (§0d) and add `src/**/*.js` to `.gitignore` | 190 |

§10 asks whether the multi-tab guard is a requirement. If it is, keep
`session-guard.ts` and wire it instead — but then it needs tests that reference
modules that exist.

**Exit: `vitest run` fully green, `tsc --noEmit` clean.**

### Phase 2 — the `/progress` bug

§1a, on its own branch and its own PR. It is a patient-facing correctness bug and
should not be reviewed alongside a 9,000-line deletion.

### Phase 3 — assets

25.9 MB across 5 files (§6, re-verified 2026-08-02: `good lunge.gif` 19 MB,
`favicon.png` 5.1 MB, `404.jpg` 828 KB, `register.jpg` 704 KB,
`standing-back-extension.jpg` 260 KB). Plus `git rm -r --cached .playwright-mcp`
and the `.gitignore` dot fix, and the four `.gitkeep` placeholder dirs.

**Do not touch the other 30 `exercise-images/*.jpg`** — they resolve dynamically
at `lib/exercise-utils.tsx:254,259`.

### Phase 4 — the unreferenced-file sweep

**103 files, ~9,300 LOC** — knip's 116, minus 12 vision files and one false positive. Full list in
§11. Sub-commits, so a bisect lands somewhere useful:

| Group | Files | LOC |
|---|---|---|
| `app/**/_components/` extractions never adopted | 35 | ~2,000 |
| `components/ui/` unused primitives | 18 | ~1,700 |
| `components/landing/` — verified: `landing-client.tsx` imports only `./clinical-trust-section` | 8 | ~550 |
| Dead Vapi/voice modules (`lib/voice/`, `lib/vapi/workflow-*`, `assessment-webhook/*`, `hooks/assessment-vapi-config.ts`, `types/vapi-webhook.ts`) — **already unreferenced; distinct from the live Vapi path, which defers** | 13 | ~2,100 |
| `components/assessment/` (§2f) | 6 | 281 |
| Dead hooks and stores | 8 | ~800 |
| Misc — `scripts/seed-pt-data.mjs` (311, §6 correction), `__tests__/unit/stores/store-test-utils.ts` (301), `lib/analytics/patient-analytics.ts`, `components/layout/floating-sidebar.tsx`, barrels | 16 | ~1,000 |

Two rules for this phase:

1. **`src/lib/date-utils.ts` is a knip false positive — do not delete it.** Three
   live pages import it (§0d).
2. The four `components/workout/` files listed in §3 are eligible but sit next to
   vision. **Verify by hand.**

### Phase 5 — unused exports and types

knip reports 269 unused exports and 186 unused exported types. Most live in files
deleted in phase 4, so **re-run knip after phase 4** and sweep the remainder.
Doing this first would be mostly wasted work.

### Phase 6 — odds and ends

`react-is` (§4 — knip misses it, the import-graph audit caught it), the remaining
`console.log`s including the `[LUMBAR_FLEX]` joint-angle log in §0f, and the dual
`draftPlan` / `draftPlanStructure` shape in `pt-store.ts:15`.

---

**Phases 0–6 land before any rebuild work.** That is the "good starting spot":
~9,500 LOC and 25.9 MB gone, a green suite, and a gate that keeps it green.

Four changes from the original ordering:

1. **Phase 0 is new and comes first.** The old phase 0 said "establish a green
   build" — but it was never green and nothing enforced it. Fixing the gate
   before the cleanup is what stops the rot recurring.
2. **Vision is gone from the plan entirely** — retained per
   [ADR-003](./09-decision-log.md).
3. **Vapi and database work left cleanup.** Deleting the live Vapi path before
   Deepgram exists leaves no voice path; both belong to
   [08](./08-migration-plan.md). The *dead* Vapi modules still go in phase 4 —
   they are already unreferenced.
4. **Test deletion moved up to phase 1.** A red suite makes every later phase's
   "ends green" exit criterion meaningless.

---

## 10. Open questions

1. **Messaging** — delete, or is it in scope later? Zero inbound links and a
   fully-mocked API say delete; a real table says someone intended it.
2. **`/progress` charts** — fix in place, or delete pending the rebuild's own
   between-visit check-in surface (stage H)?
3. **PT analytics benchmarks** (§1b) — source from clinician config, or remove
   the page for the pilot?
4. **`session-guard.ts`** — 271 LOC, dead in production, but two test files
   exercise it. Is the multi-tab guard a requirement for the rebuild? If yes,
   keep and wire it; if no, delete with its tests.

---

## 11. Appendix — phase 4 deletion list

Generated from `knip` 2026-08-02, with the 12 vision files removed (§3) and
`src/lib/date-utils.ts` removed as a verified false positive (§0d).

**Verify each file before deleting.** knip has false positives; this list is a
starting point for review, not an argument to `xargs rm`.

**A. `app/**` component extractions never adopted** — 42 files, 2787 LOC

```
  176  src/app/pt/clients/[id]/plan/CurrentPlanPanel.tsx
  139  src/app/(dashboard)/patient-profile/components/FormField.tsx
  135  src/app/(dashboard)/exercises/_components/use-exercise-filters.ts
  135  src/app/(dashboard)/profile/_components/useProfileForm.ts
  118  src/app/(dashboard)/dashboard/_components/use-first-exercise.ts
  111  src/app/(dashboard)/exercises/_components/ExercisePagination.tsx
  103  src/app/(dashboard)/workout/[slug]/complete/_components/gamification-cards.tsx
   98  src/app/pt/clients/[id]/plan/PlanExerciseCard.tsx
   94  src/app/(dashboard)/exercises/_components/ExerciseGridCard.tsx
   91  src/app/(dashboard)/dashboard/_components/recent-sessions-table.tsx
   88  src/app/pt/clients/[id]/plan/WeekSelector.tsx
   87  src/app/(dashboard)/exercises/_components/ExerciseGrid.tsx
   87  src/app/(dashboard)/profile/_components/VoiceCoachSection.tsx
   86  src/app/pt/clients/[id]/plan/PlanHeader.tsx
   85  src/app/pt/clients/[id]/plan/ExerciseLibraryPanel.tsx
   84  src/app/(dashboard)/workout/[slug]/complete/_components/stat-cards.tsx
   78  src/app/(dashboard)/patient-profile/components/RecordList.tsx
   76  src/app/(dashboard)/profile/_components/SettingsRow.tsx
   71  src/app/(dashboard)/exercises/_components/ExerciseFilters.tsx
   70  src/app/(dashboard)/workout/[slug]/complete/_components/next-steps.tsx
   68  src/app/(dashboard)/workout/[slug]/complete/_components/use-session-data.ts
   63  src/app/pt/clients/[id]/plan/ExerciseLibraryItem.tsx
   62  src/app/pt/clients/[id]/analytics/_components/form-score-trend-card.tsx
   55  src/app/(dashboard)/workout/[slug]/complete/_components/form-breakdown.tsx
   53  src/app/pt/clients/[id]/analytics/_components/benchmark-card.tsx
   47  src/app/(dashboard)/profile/_components/SettingsSection.tsx
   45  src/app/pt/clients/[id]/plan/DayTabs.tsx
   44  src/app/(dashboard)/dashboard/_components/form-score-card.tsx
   41  src/app/(dashboard)/exercises/_components/CategoryTabs.tsx
   39  src/app/(dashboard)/dashboard/_components/weekly-activity-card.tsx
   39  src/app/(dashboard)/workout/[slug]/complete/_components/constants.ts
   34  src/app/(dashboard)/workout/[slug]/complete/_components/celebration-header.tsx
   34  src/app/pt/clients/[id]/analytics/_components/pain-tracking-card.tsx
   33  src/app/(dashboard)/workout/[slug]/complete/_components/coach-summary.tsx
   30  src/app/(dashboard)/profile/_components/types.ts
   27  src/app/(dashboard)/workout/[slug]/complete/_components/types.ts
   26  src/app/(dashboard)/dashboard/_components/constants.ts
   11  src/app/(dashboard)/dashboard/_components/index.ts
    9  src/app/(dashboard)/workout/[slug]/complete/_components/index.ts
    7  src/app/(dashboard)/exercises/_components/index.ts
    5  src/app/(dashboard)/profile/_components/index.ts
    3  src/app/pt/clients/[id]/analytics/_components/index.ts
```

**B. `components/ui/` unused primitives** — 17 files, 1774 LOC

```
  446  src/components/ui/date-picker.tsx
  207  src/components/ui/illustrations/wellness-illustration.tsx
  168  src/components/ui/popover.tsx
  134  src/components/ui/calendar.tsx
  112  src/components/ui/slider.tsx
   99  src/components/ui/radio-group.tsx
   96  src/components/ui/session-controls.tsx
   93  src/components/ui/tooltip.tsx
   74  src/components/ui/breadcrumb.tsx
   72  src/components/ui/sidebar-nav.tsx
   64  src/components/ui/stat-display.tsx
   54  src/components/ui/step-badge.tsx
   51  src/components/ui/icon-container.tsx
   38  src/components/ui/stat-card-wrapper.tsx
   32  src/components/ui/skeleton.tsx
   30  src/components/ui/separator.tsx
    4  src/components/ui/index.ts
```

**C. `components/landing/` unused sections** — 8 files, 553 LOC

```
  129  src/components/landing/exercise-preview-section.tsx
  125  src/components/landing/hero-section.tsx
   91  src/components/landing/how-it-works-section.tsx
   73  src/components/landing/testimonials-section.tsx
   43  src/components/landing/landing-data.ts
   42  src/components/landing/privacy-section.tsx
   41  src/components/landing/feature-card.tsx
    9  src/components/landing/index.ts
```

**D. Dead Vapi / voice modules** — 12 files, 1889 LOC

```
  389  src/hooks/assessment-vapi-config.ts
  329  src/lib/voice/form-event-bridge.ts
  301  src/lib/vapi/workflow-nodes.ts
  197  src/lib/voice/form-event-debouncer.ts
  191  src/lib/voice/types.ts
  152  src/lib/voice/event-handlers.ts
  127  src/app/api/vapi/assessment-webhook/handlers.ts
   72  src/types/vapi-webhook.ts
   55  src/app/api/vapi/assessment-webhook/store.ts
   41  src/app/api/vapi/assessment-webhook/constants.ts
   19  src/lib/voice/index.ts
   16  src/lib/vapi/workflow-edges.ts
```

**E. `components/assessment/`** — 6 files, 281 LOC

```
   72  src/components/assessment/assessment-overlays.tsx
   72  src/components/assessment/body-region-card.tsx
   68  src/components/assessment/phase-instructions.tsx
   43  src/components/assessment/movement-metrics.tsx
   20  src/components/assessment/numbered-list.tsx
    6  src/components/assessment/index.ts
```

**F. Dead hooks and stores** — 7 files, 895 LOC

```
  167  src/stores/assessment-store.types.ts
  157  src/hooks/use-session-voice.ts
  156  src/hooks/use-multi-tab-guard.ts
  132  src/hooks/use-session-resume.ts
  107  src/hooks/use-carousel.ts
   93  src/hooks/use-auto-save.ts
   83  src/stores/assessment-store.actions.ts
```

**G. `components/workout/` — VERIFY BY HAND (vision-adjacent)** — 4 files, 237 LOC

```
   70  src/components/workout/metrics-grid.tsx
   68  src/components/workout/exercise-instructions-card.tsx
   59  src/components/workout/session-header.tsx
   40  src/components/workout/demo-video-sidebar.tsx
```

**H. Misc and barrels** — 7 files, 854 LOC

```
  311  scripts/seed-pt-data.mjs
  301  __tests__/unit/stores/store-test-utils.ts
  101  src/lib/analytics/patient-analytics.ts
   96  src/components/layout/floating-sidebar.tsx
   29  src/lib/session/index.ts
   11  src/lib/gemini/index.ts
    5  src/components/pt/index.ts
```

**Total: 103 files, 9270 LOC.**
