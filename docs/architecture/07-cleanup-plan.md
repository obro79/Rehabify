# 07 — Cleanup & Deletion Plan

> Audited 2026-08-02 by static import-graph analysis of `src/**/*.{ts,tsx}`
> (53,633 LOC, 190 files). Entrypoints: `page.tsx`, `layout.tsx`, `route.ts`,
> `not-found.tsx`, `error.tsx`, `loading.tsx`, `template.tsx`, `default.tsx`,
> and `src/proxy.ts` (Next 16's `middleware.ts` replacement).
>
> **Verified 2026-08-02** with `tsc`, `vitest`, and `knip` against installed
> dependencies — see **§0**, which supersedes any disagreement below.
>
> **Headline: ~13,000 LOC (24% of `src/`) is removable with no behaviour
> change, rising to ~14,800 (28%) once vision is parked. Plus ~6,000 lines of
> regenerable SQL and 28 MB of assets.**
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
| `__tests__/form-engine-flexion.test.ts` | Vision | Deleted in §3 |
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

## 3. Vision removal

Vision is **shelved**, not deleted from history
([01-product-definition.md](./01-product-definition.md)).

### Already dead regardless of the vision decision — 1,099 LOC · **SAFE**

`exercises/assessment-movements.ts` (314), `exercises/standing.ts` (252),
`exercises/lumbar.ts` (172), `exercises/floor.ts` (141), `geometry.ts` (137),
`form-types.ts` (83).

**`form-engine.ts` is 1,286 LOC and has exactly one live analyzer: squat.**
(`form-engine.ts:4` is the only import of `./exercises/squat`; the other four
exercise modules have zero importers, and `geometry.ts`/`form-types.ts` are
imported only by *those*.)

### The rest — +1,813 LOC, 7 files edited, 3 deps

Delete: all of `src/lib/vision/`, `hooks/use-pose-detection.ts`,
`hooks/use-camera.ts`, `components/workout/{feedback-overlay, draw-skeleton,
camera-status-overlay, pose-constants}`, `__tests__/form-engine-flexion.test.ts`,
`types/vision.ts`, `types/dynamic-time-warping.d.ts`.

Edit:

| File | Change |
|---|---|
| `components/workout/exercise-camera.tsx` (406) | **Delete** — the only live consumer of `pose-landmarker`, `form-engine`, `landmark-filter`, `camera-feedback` (lines 8–11) |
| `components/workout/index.ts` | Remove `export { ExerciseCamera }` (line 3) |
| `(dashboard)/workout/[slug]/page.tsx` (866) | Remove import at :21 + all usages |
| `assessment/lower-back/page.tsx` (946) | Remove import at :13 + usage |
| `assessment/page.tsx` (506) | Moot — deleted per §2j |
| `stores/exercise-store.ts` | `exercise-camera.tsx` writes form errors here; audit the `FormError` surface |
| `package.json` | Drop `@mediapipe/tasks-vision`, `1eurofilter`, `dynamic-time-warping` |

**NOT in the blast radius** — `src/components/motion/` (231 LOC) is
framer-motion animation helpers used by **16 files**, unrelated to computer
vision despite the name. And 11 non-vision files in `components/workout/`
(~1,200 LOC) survive.

**Vision total: 2,912 LOC + 3 npm dependencies.**

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

`scripts/{generate-seed-sql.js, seed-pt-data.mjs, setup-database.sh}` are all
wired to `package.json`. `docs/` is 148 KB and active — though
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

| # | Phase | Scope | Risk |
|---|---|---|---|
| **0** | **Make the build gate real** — declare `@testing-library/dom`, `chmod +x .husky/pre-commit`, add a `.github/workflows` running typecheck + test + build, add `postcss-load-config`, set a test env for `NEXT_PUBLIC_*` | ~10 lines | **None — do this first** |
| **1** | **Green the baseline** — delete the 3 test files covering code that no longer exists (§0b), fix the remaining tsc errors, delete `date-utils.js` + `.gitignore` `src/**/*.js` | ~500 deleted | Low |
| **2** | Fix §1a (fabricated `/progress` charts) — a patient-facing correctness bug. **Ship this one on its own.** | ~50 changed | Low |
| **3** | Assets: `public/` 25.9 MB, `.playwright-mcp/` (+ `.gitignore` fix), empty dirs, move public `.md` files to `docs/` | 25.9 MB | None |
| **4** | Unreferenced files: §2a–2g **reconciled against knip's 116** (§0e). Largest sweep, zero behaviour change. | ~9,200 | Low |
| **5** | Vision removal: §3, including the 7 file edits and 3 dependency drops | 2,912 | Medium — touches two live pages |
| **6** | Unused exports/types sweep (knip: 269 + 186) — **after** phase 4, since most live in deleted files | — | Low |
| **7** | `react-is`, remaining `console.log`s, `pt-store` legacy shape | ~60 | None |
| — | *Product deletions: messaging (§2i), duplicate `/assessment` route (§2j)* | 1,658 | **Parked — open question, §10** |
| — | *Vapi removal ([05 §9](./05-voice-pipeline.md))* | — | **Not cleanup** — lands with Deepgram ([08 stage 7](./08-migration-plan.md)) |
| — | *Database: 8 unqueried tables, `002`/`003` SQL, one migration system* | ~6,300 | **Not cleanup** — superseded by [03](./03-data-architecture.md) |

**Phases 0–7 are pure cleanup and land before any rebuild work starts.** That is
the "good starting spot": ~12,000 LOC and 25.9 MB gone, a green suite, and a CI
gate that keeps it green.

Three changes from the original ordering, all forced by §0:

1. **Phase 0 is new and comes first.** The old plan's phase 0 said "establish a
   green build" — but the build was never green and nothing enforced it. Fixing
   the gate before the cleanup is what stops this from recurring.
2. **Vapi and database work are no longer phases here.** Deleting Vapi before
   Deepgram works leaves the app with no voice path; both belong to
   [08](./08-migration-plan.md), not to cleanup.
3. **Test deletion moved to phase 1** rather than being spread across later
   phases — the three dead test files are what keep the suite red, and a red
   suite makes every subsequent phase's exit criterion meaningless.

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
