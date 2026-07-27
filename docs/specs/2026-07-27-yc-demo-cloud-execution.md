# YC Demo Cloud Execution Plan

> **Destination override:** Cloud implementation now targets the public
> `obro79/Rehabify` repository, not `obro79/rehabifyy`. The authoritative Cloud
> environment, file ownership, Bun commands, task prompt, branch flow, and
> final Greptile gate are in
> `docs/specs/2026-07-27-yc-demo-rehabify-execution.md`. Any conflicting
> monorepo or pnpm instruction below is superseded.

Status: superseded for `obro79/Rehabify`; retained as planning history
Date: 2026-07-27
Chosen strategy: A — vertical slice first
Target: one reliable three-minute `/demo` story
Execution surface: Codex Cloud authoring against GitHub
Runtime boundary: deterministic synthetic data only; no clinical use
Landing strategy: one long-lived `of/yc-demo-plan` integration branch, then one
final pull request to `main`

This document controls implementation order, cloud task boundaries, shared-file
ownership, and merge gates. The master plan and Parts 1–4 remain the detailed
product and scene specifications. If their execution instructions conflict,
this document wins.

## Outcome

Ship the smallest complete product loop first:

```text
real browser microphone interaction
  -> deterministic synthetic intake artifact
  -> source-linked clinician brief
  -> one clinician assessment edit and confirmation
  -> real deterministic composer with 3 eligible + 1 truthful rejection
  -> exact clinician approval
  -> Today projected from that approved draft
```

The implementation is incremental, but no shortcut may disconnect the final
Today screen from the exact generated and approved plan.

## Priority Cut

### P0 — required vertical slice

- One `/demo` route with the eight locked scenes.
- One immutable Maya/right-knee fixture and one shared state machine.
- Two or three explicit push-to-talk turns using the existing browser capture
  controller; no transcript, STT, or semantic voice claim.
- Text fallback that reaches the identical deterministic intake result.
- Automatic final-answer handoff into the clinician brief.
- One bounded source excerpt and exactly one `Unknown from intake` fact.
- One assessment edit from `4/10` to `3/10`, followed by confirmation.
- The real `DeterministicSyntheticPlanComposer` running in memory.
- Three eligible exercises and one real `not_included_by_playbook` rejection.
- Exact version-and-hash-bound clinician approval.
- Today projected only from the approved draft.
- Reset, guarded direct-scene recovery, composition retry, keyboard focus,
  visible status, reduced motion, and the presentation viewport.
- Focused tests, web typecheck, production build, and five passing rehearsals.

### P1 — comprehension polish after P0 is reliable

- Better handoff and composition reveal transitions.
- Source-dialog and rejected-panel scanability.
- Card, spacing, density, and 1280×800 fallback refinement.
- Screenshot comparison and small accessibility fixes found during rehearsal.
- Optional user-initiated prompt playback only if rehearsal proves it helps.

### P2 — optional; do not schedule before five P0 passes

- Decorative phone details, extra icons, hover refinement, and minor motion.
- Broader responsive work, extra Today analytics, and shortcut hints.
- Any external speech/model provider, persistence, or production-route work.

## What Already Exists

| Need | Reuse source | Execution decision |
| --- | --- | --- |
| Browser microphone capture | `apps/web/src/app/intake-voice-demo/` | Import the controller and control-state helpers unchanged. |
| Intake progress concepts | `apps/web/src/app/intake-demo/` | Reuse deterministic progress patterns, not its final-review workflow. |
| Pure reducer and focus patterns | `apps/web/src/app/prototype/` | Mirror its reducer/tests and focus restoration. |
| Brief hierarchy and source dialog | `apps/web/src/app/clinician/episodes/[episodeId]/brief/` | Adapt the hierarchy and accessibility behavior to fixture-only props. |
| Assessment semantics | `apps/web/src/app/clinician/episodes/[episodeId]/assessment/` | Reuse recorded/missing/not-tested distinctions in a much smaller scene. |
| Deterministic composer | `packages/clinical-rules/src/deterministic-plan-composer.ts` | Invoke the real composer with demo-local validated catalogs. |
| Plan review concepts | `apps/web/src/app/clinician/episodes/[episodeId]/plan/` | Reuse the draft/approval boundary, not its APIs. |
| Today concepts | `apps/web/src/app/patient/today/` | Reuse presentation semantics; derive data from the exact approval selector. |
| Cohesive visual reference | `prototype/index.html` and `prototype/styles.css` | Port a small token/layout subset into `/demo` CSS modules. |

## Non-Negotiable Ownership

One integration owner is the only writer to shared state, fixture, shell, and
global demo presentation files:

```text
apps/web/src/app/demo/
  page.tsx
  model.ts
  model.test.ts
  fixture.ts
  scene-contracts.ts
  demo-shell.tsx
  demo-shell.test.ts
  demo-frames.tsx
  presenter-controls.tsx
  demo.module.css
```

The integration owner defines the public artifact types in
`scene-contracts.ts`. Leaf modules implement and return those artifacts; shared
contracts must not import leaf-private model files.

Leaf agents may request a contract change in their final report, but they may
not edit the shared files. No agent may use casts, duplicate fixtures, or a
second reducer to work around the boundary.

## Execution Graph

```text
Wave 0 — publish planning source
  push docs to of/yc-demo-plan
        |
        v
Wave 1 — freeze the shared contract
  apply Cloud diff to of/yc-demo-plan
        |
        +----------------------+----------------------+
        |                      |                      |
        v                      v                      v
Wave 2A                 Wave 2B                 Wave 2C
voice + handoff         brief + assessment      composer + plan + Today
leaf modules            leaf modules            leaf modules + dependency
        |                      |                      |
        +----------------------+----------------------+
                               |
                               v
Wave 3 — single-owner integration
  voice seam -> clinician seam -> plan/approval/Today seam
                               |
                               v
Wave 4 — P0 hardening and rehearsal
  focused tests -> build -> browser matrix -> five timed passes
                               |
                               v
Wave 5 — P1 polish, only if P0 remains green
                               |
                               v
Final landing
  one PR: of/yc-demo-plan -> main
  GitHub CI green -> top-level @greptileai comment
```

The critical path has four implementation waves after the docs seed. Wave 2
contains three cloud tasks that run concurrently. Cloud tasks return independent
diffs; they do not push directly to the shared branch and do not open PRs.

## Wave 0 — Publish the Planning Source

### Why this is first

Codex Cloud checks out a selected Git branch or commit. The six detailed YC
plans and this execution plan must be visible on the selected remote branch
before a fresh Cloud task can use them.

### Required change

Use the long-lived integration branch `of/yc-demo-plan`, and stage only:

```text
docs/specs/2026-07-27-yc-demo.md
docs/specs/2026-07-27-yc-demo-part-1-shell-state.md
docs/specs/2026-07-27-yc-demo-part-2-voice-handoff.md
docs/specs/2026-07-27-yc-demo-part-3-brief-assessment.md
docs/specs/2026-07-27-yc-demo-part-4-plan-today.md
docs/specs/2026-07-27-yc-demo-ui-improvements.md
docs/specs/2026-07-27-yc-demo-cloud-execution.md
```

Never run `git add -A` in the local checkout. Hundreds of unrelated untracked
duplicate files are present, including filenames ending in ` 2` and ` 3`.

### Exit gate

- The seven documents are committed and visible on GitHub.
- No application, duplicate, or unrelated file is in the diff.
- `origin/of/yc-demo-plan` is the starting branch for Wave 1.
- No PR to `main` and no Greptile review are opened during Wave 0.

## Wave 1 — Contract Freeze and Deployable Skeleton

Start one Cloud task from the latest `origin/of/yc-demo-plan` commit. Do not
launch the Wave 2 tasks until the Wave 1 diff is applied, verified, committed,
and pushed back to that integration branch.

### Sole ownership

The integration owner creates and owns the ten shared files listed under
Non-Negotiable Ownership.

### Deliverable

- `/demo` loads without auth, database, worker, or provider dependencies.
- All eight scene IDs and surfaces exist.
- `scene-contracts.ts` contains the public immutable shapes for:
  `CompletedDemoIntake`, `DemoBriefAssessmentHandoff`, `DemoPlanDraft`,
  `DemoApproval`, and `DemoTodayView`.
- `fixture.ts` contains the complete shared Maya identity, intake prompts and
  source IDs, brief/assessment display data, and Today week/review metadata.
- The reducer contains all gates, artifact slots, idempotent events, retry,
  reset, transition nonce, direct-scene normalization, and approval invariant.
- The shell renders typed placeholders for leaf scenes.
- Shared visual tokens, clinician frame, patient surface, phone boundary, and
  quiet presenter controls exist.
- `preparing_brief` ownership is explicit: Part 2 supplies the leaf view while
  Part 1 owns its timer and state transition.

### Tests

```bash
pnpm exec vitest run \
  apps/web/src/app/demo/model.test.ts \
  apps/web/src/app/demo/demo-shell.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build
```

### Exit gate

- The route renders from one stable URL.
- Every illegal transition is ignored or normalized.
- `patient_today` cannot be reached by Next, direct jump, restore, or forged
  event before exact approval.
- Reset invalidates pending transition timers.
- Focus and presenter controls work with placeholders.
- Focused tests, web typecheck, and web build pass.
- Apply the Cloud diff to local `of/yc-demo-plan`, review it, run the gate,
  commit it, and push it before launching Wave 2.
- Do not open a PR to `main` and do not request Greptile.

## Wave 2 — Three Parallel Leaf Tasks

Launch all three tasks from the same Wave 1 commit on
`origin/of/yc-demo-plan`. Each Cloud task returns a diff that adds only its
exclusive leaf paths and corresponding tests. Unused leaf modules may be
applied before shell integration as long as they typecheck and their tests
pass.

### Wave 2A — Voice and Automatic Handoff

Suggested Cloud task label: `yc-demo-wave-2a-voice`

Exclusive paths:

```text
apps/web/src/app/demo/demo-voice-intake.tsx
apps/web/src/app/demo/demo-voice-intake.test.ts
apps/web/src/app/demo/demo-voice-intake.module.css
apps/web/src/app/demo/demo-preparing-brief.tsx
apps/web/src/app/demo/demo-preparing-brief.test.ts
apps/web/src/app/demo/demo-preparing-brief.module.css
```

Reuse unchanged:

```text
apps/web/src/app/intake-voice-demo/browser-voice-capture.ts
apps/web/src/app/intake-voice-demo/voice-control-state.ts
```

Required behavior:

- Two or three ordered prompts, each requiring explicit microphone start and
  stop, or equivalent text fallback.
- Successful audio consumption accepts only the current fixture answer.
- The next microphone turn never starts automatically.
- Final acceptance submits exactly one immutable intake artifact.
- Denial, unsupported media, cancellation, failure, reset, unmount, and late
  callbacks never advance incorrectly.
- No transcript, STT, understanding, or autonomous-agent claim.

Focused gate:

```bash
pnpm exec vitest run \
  apps/web/src/app/intake-voice-demo/browser-voice-capture.test.ts \
  apps/web/src/app/intake-voice-demo/voice-control-state.test.ts \
  apps/web/src/app/intake-voice-demo/intake-voice-demo.test.ts \
  apps/web/src/app/demo/demo-voice-intake.test.ts \
  apps/web/src/app/demo/demo-preparing-brief.test.ts
pnpm --filter @rehabify/web run typecheck
```

### Wave 2B — Brief and Assessment

Suggested Cloud task label: `yc-demo-wave-2b-brief-assessment`

Exclusive paths:

```text
apps/web/src/app/demo/brief-assessment-model.ts
apps/web/src/app/demo/brief-assessment-model.test.ts
apps/web/src/app/demo/clinician-brief-scene.tsx
apps/web/src/app/demo/clinician-brief-scene.test.ts
apps/web/src/app/demo/clinician-assessment-scene.tsx
apps/web/src/app/demo/clinician-assessment-scene.test.ts
apps/web/src/app/demo/brief-assessment.module.css
```

Required behavior:

- Exactly one missing fact remains `Unknown from intake`, never `false`.
- Each recorded material fact resolves to a bounded source excerpt.
- Opening the rehearsed source marks the brief reviewed without navigating.
- Recorded, missing, and not-tested values are visibly distinct.
- Only the single-leg-squat pain value is editable from `4/10` to `3/10`.
- Confirmation returns the exact verified handoff contract once and locks the
  scene.

Focused gate:

```bash
pnpm exec vitest run \
  apps/web/src/app/demo/brief-assessment-model.test.ts \
  apps/web/src/app/demo/clinician-brief-scene.test.ts \
  apps/web/src/app/demo/clinician-assessment-scene.test.ts
pnpm --filter @rehabify/web run typecheck
```

### Wave 2C — Composer, Plan Review, and Today

Suggested Cloud task label: `yc-demo-wave-2c-plan-today`

Exclusive paths:

```text
apps/web/src/app/demo/plan/**
apps/web/src/app/demo/today/**
apps/web/package.json
pnpm-lock.yaml
```

Required behavior:

- Add `@rehabify/clinical-rules: "workspace:*"` to the web package.
- Build a validated four-exercise demo catalog.
- Build and hash the exact verified handoff plus fixture-owned pins.
- Invoke the real composer once.
- Fail closed unless the result contains exactly three eligible candidates and
  the one expected real `not_included_by_playbook` exclusion.
- Map dosage only from composer output.
- Bind approval to the exact draft version and input hash.
- Return `null` from the Today selector for missing, stale, failed, reset, or
  mismatched approval.
- Build Today only from the approved selector result.

Focused gate:

```bash
pnpm --filter @rehabify/contracts run build
pnpm --filter @rehabify/clinical-rules run build
pnpm exec vitest run \
  packages/clinical-rules/src/deterministic-plan-composer.test.ts \
  apps/web/src/app/demo/plan/compose-demo-plan.test.ts \
  apps/web/src/app/demo/plan/plan-review-scene.test.ts \
  apps/web/src/app/demo/today/patient-today-scene.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build
```

### Wave 2 diff landing rule

- No Cloud task pushes directly to `of/yc-demo-plan`, opens a PR, or requests
  Greptile.
- Apply the three returned diffs serially to local `of/yc-demo-plan`.
- Because file ownership is exclusive, application order is flexible. Prefer
  Wave 2C first so its dependency and lockfile are established.
- After each application, review the diff, run that lane's focused gate,
  commit only its owned files, and push the integration branch.
- A leaf diff with shared-file edits is rejected and returned to its owner.
- After all three diffs land, run the combined focused gate before Wave 3.

## Wave 3 — Single-Owner Vertical Integration

Start one Cloud task from the latest `origin/of/yc-demo-plan` only after all
three Wave 2 diffs have landed and passed their gates. One integration owner
wires the leaf modules into the shared shell. No parallel writer is allowed
during this wave.

### Checkpoint 3.1 — Patient to clinician

- Mount the voice and preparation views.
- Store the immutable completed intake artifact.
- Run the nonce-safe 1.2-second preparation timer.
- Focus the clinician brief heading after automatic handoff.
- Prove text fallback produces the same clinical values and source IDs.

### Checkpoint 3.2 — Clinician to composer

- Mount brief and assessment scenes.
- Use source inspection to satisfy brief readiness.
- Store the confirmed verified handoff.
- Start composition exactly once when the presenter advances.
- Surface failure and deterministic retry without manufacturing a draft.

### Checkpoint 3.3 — Draft to Today

- Mount composition, plan review, approval, and Today scenes.
- Store only validated composer output.
- Record the exact approval and enter the short approved scene.
- Require presenter Next to open Today.
- Preserve exact candidate identity and dosage through the approved selector.

Make each checkpoint a separate green commit on the integration branch.

### Integrated gate

```bash
pnpm --filter @rehabify/contracts run build
pnpm --filter @rehabify/clinical-rules run build
pnpm exec vitest run \
  apps/web/src/app/demo/model.test.ts \
  apps/web/src/app/demo/demo-shell.test.ts \
  apps/web/src/app/demo/demo-voice-intake.test.ts \
  apps/web/src/app/demo/demo-preparing-brief.test.ts \
  apps/web/src/app/demo/brief-assessment-model.test.ts \
  apps/web/src/app/demo/clinician-brief-scene.test.ts \
  apps/web/src/app/demo/clinician-assessment-scene.test.ts \
  apps/web/src/app/demo/plan/compose-demo-plan.test.ts \
  apps/web/src/app/demo/plan/plan-review-scene.test.ts \
  apps/web/src/app/demo/today/patient-today-scene.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build
```

Apply, review, test, commit, and push the Wave 3 diff to `of/yc-demo-plan`.
Do not open a PR or request Greptile yet; Wave 4 must still prove the complete
story.

## Wave 4 — P0 Hardening and Rehearsal

This wave fixes only failures found by the acceptance matrix. It does not add
new product scope. Run it from the latest `origin/of/yc-demo-plan`, then apply
and validate its diff on the local integration branch.

### Automated coverage map

```text
fixture + pure shell model ──unit──> voice adapter ──component──> intake artifact
         │                                                     │
         └──── shell gates / timers / checkpoint integration ──┘
                                                               v
brief source ──component──> assessment edit / verify ──unit+integration──>
                                                               composer adapter
                                                                      │
                                                          unit+integration
                                                                      v
                                                   exact approval ──component──>
                                                                      Today
```

Critical assertions:

- Every normal and prohibited scene transition.
- Voice and text produce identical fixture values except `inputMode`.
- Stale capture callbacks and preparation timers do nothing.
- Missing is not converted to negative or recorded data.
- Assessment confirmation cannot double-fire.
- Unverified or altered pins fail before composition.
- Composer invocation is exactly once per eligible entry.
- Retry clears failure without creating approval.
- Stale approval after recomposition cannot open Today.
- Today identity and dosage equal the approved first candidate.

There is no Playwright or Cypress configuration in this repository. Do not
silently add a browser framework to P0. Component tests plus a real browser
rehearsal are the acceptance layers for this sprint.

Vitest currently discovers `apps/**/src/**/*.test.ts`, not test filenames with
a TSX suffix.
Component tests therefore keep the repository's existing `*.test.ts` naming,
add `// @vitest-environment happy-dom`, and follow the current
`createRoot`/`act`/`createElement` pattern. Do not expand the global test
configuration for this demo.

### Manual browser matrix

- Chrome, microphone allowed.
- Chrome, microphone denied, then text fallback.
- Reset while listening, preparing, and composing.
- Direct recovery to brief and guarded direct recovery to Today.
- Forced composition failure, then retry.
- Keyboard-only full path.
- Reduced-motion full path.
- 1440×900 at 100% zoom.
- 1280×800 without horizontal clipping.
- Brief, approval, and Today at 200% zoom.
- Five uninterrupted runs under 2:45, with intake plus handoff under 40
  seconds.

Capture the ten screenshots listed in the UI plan after the fifth green run.

### Full merge gate

```bash
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test:unit:built
pnpm run eval:smoke
```

GitHub Actions separately runs the Postgres/Testcontainers migration suite.
Do not make the isolated `/demo` route depend on those services.

## Wave 5 — P1 Polish

Only begin if Wave 4 remains green.

Scene owners may refine their exclusive TSX/CSS files in parallel. The
integration owner remains the only writer to shared tokens, frames, shell, and
presenter controls. Merge P1 changes one scene group at a time and rerun the
integrated focused gate after each merge.

Stop P1 immediately if it threatens the three-minute timing, view continuity,
approval gate, accessibility, or five-run reliability.

## Final Landing and Greptile Gate

Only after Wave 4 is green, and after any explicitly chosen Wave 5 polish has
been revalidated:

1. Push the final `of/yc-demo-plan` commit.
2. Open the single ready-for-review PR from `of/yc-demo-plan` to `main`.
3. Wait for all required GitHub CI checks to pass.
4. Add one top-level PR comment containing `@greptileai`.
5. Address any actionable review findings and rerun affected gates before
   merge.

Do not request Greptile on planning, shell, leaf, integration, draft, or
partially green work. The final integrated PR is the only Greptile review for
this execution.

## Cloud Environment

Codex Cloud checks out the selected branch or commit into an isolated
container, runs the environment setup, and then performs the task. Configure
the Rehabify environment with:

- Repository: `obro79/rehabifyy`
- Node: `24.14.0`
- pnpm: `10.34.5`
- No runtime secrets for `/demo`

Setup script:

```bash
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm run build:test-runtime-dependencies
pnpm --filter @rehabify/clinical-rules run build
```

Maintenance script:

```bash
pnpm install --frozen-lockfile
pnpm run build:test-runtime-dependencies
pnpm --filter @rehabify/clinical-rules run build
```

Setup has network access for dependency installation. The existing Next layout
uses `next/font/google`; if an agent-phase production build cannot reuse the
font cache, allow limited access to `fonts.googleapis.com` and
`fonts.gstatic.com`, or prewarm the web build during setup. Do not broaden
internet access for the demo itself.

Cloud is the implementation environment, not the hosting target. The
repository has no configured preview deployment provider. Preview hosting is
a separate follow-up after the local and CI demo gates pass.

## Kick Off the First Cloud Task

In Codex, create a new task, choose the Rehabify Cloud environment, select
`of/yc-demo-plan` as the starting branch, and paste:

```text
Implement Wave 1 only from
docs/specs/2026-07-27-yc-demo-cloud-execution.md: Contract Freeze and
Deployable Skeleton.

Read the cloud execution plan, master YC demo plan, Part 1 shell/state plan,
and UI improvements plan completely before editing. You are not alone in the
repository. Preserve other work and never edit, delete, or stage duplicate
files whose names end in " 2" or " 3".

Own only the ten shared Wave 1 files under apps/web/src/app/demo/. Build the
/demo route with complete public artifact contracts, the immutable Maya
fixture, pure reducer gates, typed placeholder scenes, presenter controls,
frames, and focused tests. Do not implement the Wave 2 leaf scenes. Do not
touch production routes, databases, workers, providers, auth, APIs, or
unrelated files.

Run exactly:
pnpm exec vitest run apps/web/src/app/demo/model.test.ts apps/web/src/app/demo/demo-shell.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build

Before finishing, review git diff and git status. Do not push to
of/yc-demo-plan, open a PR, or request Greptile. Return the Cloud task ID,
changed files, checks and results, the reviewable diff, and any precise
contract issue.
```

When the task finishes, apply its returned diff to a local checkout of
`of/yc-demo-plan` using the Codex apply action or `codex apply <TASK_ID>`.
Review it, run the Wave 1 gate, commit only the owned files, and push the
integration branch. Only then launch the three Wave 2 tasks from the new remote
commit.

## Ready-to-Paste Cloud Task Header

Prefix every implementation task with:

```text
Read docs/specs/2026-07-27-yc-demo-cloud-execution.md and the referenced part
plan completely before editing. Follow the accepted vertical-slice-first
strategy. You are not alone in the repository. Preserve other work and never
edit, delete, or stage duplicate files whose names end in " 2" or " 3".

Own only the paths assigned to this task. Do not edit shared /demo state,
fixture, contracts, shell, frames, presenter controls, or shared CSS unless
this task is explicitly the integration owner. Do not work around a missing
contract with casts, duplicate fixtures, local navigation, or a second state
machine. Report a precise integration request instead.

Use the existing patterns and real deterministic composer. Keep databases,
workers, APIs, external speech/model providers, auth, and production routes
off the /demo critical path. Run the exact focused checks in the execution
plan and review git diff/status. Do not push directly to the integration branch,
open a PR, or request Greptile. Return the Cloud task ID, the reviewable diff,
changed files, checks run, and any precise integration request.
```

Append the relevant Wave deliverable and exclusive path list to create each
task prompt.

## Failure Modes and Stop Conditions

| Failure | Required response |
| --- | --- |
| Cloud cannot find the plans | Stop. `origin/of/yc-demo-plan` is missing, stale, or was not selected as the base. |
| A leaf needs a shared contract change | Do not edit the shared file. Report the exact type/fixture change to the integration owner. |
| A leaf task sees another lane's edits | Preserve them and remain inside exclusive ownership. |
| A focused command stalls | Record command, duration, and last output; rerun the single test with a 60-second limit. |
| Composer package import fails | Build contracts and clinical-rules first; do not replace the real composer with a mock. |
| Composer output violates the expected 3/1 result | Fail closed and fix the fixture/adapter; do not hard-code a fake UI result. |
| Browser microphone fails | Keep the current prompt and use the equivalent text path. |
| Timed/effect callback fires after reset | Ignore it through nonce/token validation and add a regression test. |
| Direct navigation reaches Today before approval | Treat as P0. Normalize to plan review and add a regression test. |
| Today data differs from the approved draft | Treat as P0. Fix the selector; never patch Today with lookalike fixture data. |
| A core composer defect is discovered | Stop and report a scope escalation before changing the production package. |
| Full CI fails outside `/demo` | Identify whether it is pre-existing. Do not repair unrelated systems inside the demo branch. |

## Explicitly Not in Scope

- Production STT, TTS, LLM, authentication, database, jobs, or APIs.
- Real patient data or clinical-use/readiness claims.
- Transcript review, full production assessment, plan correction history, or
  consent expansion.
- Changes to production brief, assessment, plan, or Today routes.
- Redesign of the deterministic composer.
- Broad repository cleanup, especially duplicate untracked files.
- New browser E2E framework during P0.
- Hosting/deployment setup during implementation.
- P2 decoration before the five-run reliability gate.

## Completion Definition

Execution is complete when:

- every Wave 0–4 diff is reviewed, validated, committed, and pushed to
  `of/yc-demo-plan` with only owned files;
- the full `/demo` route works from one clean GitHub checkout;
- focused tests, lint, typecheck, build, unit tests, eval smoke, and GitHub
  Actions pass;
- no presenter navigation or recovery path bypasses exact approval;
- Today displays the exact first approved candidate and dosage;
- microphone allowed and denied paths are rehearsed;
- the complete story passes five consecutive times under 2:45; and
- any P1 work is separately justified and does not weaken P0;
- exactly one final PR targets `main`; and
- Greptile is requested only on that final PR after CI is green.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
| --- | --- | --- | ---: | --- | --- |
| CEO Review | `/plan-ceo-review` | Scope and strategy | 0 | Not run | Vertical-slice scope was selected directly by the user. |
| Codex Review | `/codex review` | Independent second opinion | 0 | Not run | Final P0 audit used an independent repository subagent. |
| Eng Review | `/plan-eng-review` | Architecture and tests | 1 | Clear | Scope reduced; test-discovery mismatch found and fixed; no P0 blockers remain. |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | Not run | Dedicated UI implementation plan already defines the P0/P1/P2 cut. |
| DX Review | `/plan-devex-review` | Developer experience | 0 | Not run | Cloud bootstrap and task boundaries are defined in this runbook. |

- **UNRESOLVED:** 0 execution decisions
- **VERDICT:** ENG CLEARED — ready to publish the planning seed and implement
