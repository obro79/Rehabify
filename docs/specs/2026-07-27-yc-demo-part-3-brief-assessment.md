# YC Demo Part 3 — Clinician Brief and Assessment

> **Rehabify repository override:** use
> `docs/specs/2026-07-27-yc-demo-rehabify-execution.md` for exact
> `src/app/demo/brief/` ownership and reuse only the visual primitives from the
> existing PT UI. Do not use its API, database, global stores, or mock patient
> data. Monorepo paths below describe intent only.

Status: implementation brief for a 1–2 day demo sprint
Date: 2026-07-27
Scope owner: clinician brief and assessment scenes only
Runtime boundary: synthetic, deterministic, in memory; not for clinical use

## Objective

Deliver the 57-second clinician segment between intake handoff and plan
composition:

1. turn Maya Chen's completed synthetic intake into a concise, source-linked
   pre-visit brief;
2. make the value legible in one glance: patient story, symptoms/behavior,
   goal, and exactly one visibly unknown fact;
3. let the presenter inspect one concise source excerpt without opening a raw
   transcript;
4. move into a small, prefilled clinician assessment;
5. require one meaningful clinician action—confirming an edited functional
   finding—before producing a typed, verified in-memory handoff for the
   deterministic plan composer.

Target timing is approximately 32 seconds on the brief and 25 seconds on the
assessment. Both scenes must use the same Maya/right-knee fixture as intake and
the later plan.

## Non-goals

- Demo shell, presenter navigation, reset/recovery, or transition animation.
- Voice capture, transcript review, or intake question-graph behavior.
- Composer rules, catalogs, dosage, rejection presentation, or plan-review UI.
- Plan approval, treatment consent, patient Today, or global visual polish.
- Postgres persistence, API routes, authentication, background jobs, external
  speech/model providers, or production audit/event behavior.
- Porting the full production brief correction/rejection workflow.
- Porting the full 11-section assessment, autosave, offline, conflict, revision,
  dictation-candidate, or version-history workflow.
- Diagnosing the patient, generating a hypothesis, or implying that a patient
  answer is a clinician finding.

## Current Code and Reuse Map

| Existing source | Reuse | Do not carry into the live path |
| --- | --- | --- |
| `docs/specs/2026-07-27-yc-demo.md` | Locked Maya/right-knee narrative, timing, in-memory boundary, automatic intake-to-brief handoff, presenter-controlled later transitions | Open review questions that would enlarge this slice |
| `prototype/index.html` lines 222–266 | Strong episode header; patient-story-first brief; symptoms fact grid; goal; right review rail; concise assessment fields; Maya copy | `Open transcript`, second “Clarify timeline” warning, already-verified assessment state |
| `prototype/styles.css` lines 946–1050 | Dense-but-calm two-column brief layout, fact grid, review rail, episode typography/cards | Static global selectors copied wholesale |
| `apps/web/src/app/clinician/episodes/[episodeId]/brief/brief-workspace.tsx` | Recorded-vs-missing fact semantics, per-fact source affordance, accessible modal/focus trap/restore behavior | Fetch/API lifecycle, corrections, four attestations, rejection, stale-version and idempotency machinery |
| `apps/web/src/app/clinician/episodes/[episodeId]/brief/brief-workspace.test.ts` | Tests for explicit missingness and keyboard-safe source inspection | Network and production audit assertions |
| `packages/contracts/src/clinician-brief.ts` | `recorded` versus `missing`; every recorded material fact has source IDs; brief review states | Model generation, immutable DB versions, production review events |
| `apps/web/src/app/prototype/model.ts` lines 74–99 | Usability success criterion: find missing information and inspect one accepted-response source | Usability-lab flow wrapper |
| `apps/web/src/app/clinician/episodes/[episodeId]/assessment/assessment-workspace.tsx` | Clear labels for recorded, missing, and not-tested values; clinician-only hypothesis language | Full section index, persistence simulation, conflict/offline controls |
| `apps/web/src/app/clinician/episodes/[episodeId]/assessment/model.ts` and `model.test.ts` | Reducer/test patterns; never treat blank, missing, or not-tested as normal | Existing left-knee fixture and `generationEligible: false` draft semantics |
| `packages/contracts/src/knee-assessment.ts` | `AssessmentFieldValue`, laterality, section vocabulary, explicit `missing`/`not_tested`, verified version concept | Full clinical record envelope |
| `packages/contracts/src/assessment-workspace.ts` | Separation of draft fields and clinician-authored hypothesis | Reusing a production draft as composer-authorized input; that contract explicitly remains generation-ineligible |
| `packages/clinical-rules/src/deterministic-plan-composer.ts` | Required downstream pins: brief `reviewState: "verified"` and assessment `state: "verified"` | Any change to composer validation or rule behavior |

The duplicate untracked files whose names contain ` 2` or ` 3` are not sources
of truth and must not be edited, deleted, or staged.

## Proposed User Experience

### Brief scene

Use the prototype's clinician episode header and two-column hierarchy.

Main column, in this order:

1. **Patient story** — “Maya reports gradual right anterior knee pain beginning
   three weeks ago after increasing her running volume. Stairs and downhill
   walking are currently limited.”
2. **Symptoms and behavior** — location, severity, aggravating, relieving.
3. **Goal** — return to three comfortable runs per week and use stairs without
   limiting pace.

Each section has a small source affordance. For the rehearsed interaction,
clicking the patient-story source opens an inline dialog/drawer titled
`Accepted intake response` containing:

- source label: `Intake answer · activity and onset`;
- concise excerpt: `“It started about three weeks ago after I increased my
  running. Stairs and walking downhill make it worse.”`;
- state label: `Patient confirmed`;
- a close button plus Escape behavior and focus restoration.

Do not expose timestamps/offsets, a transcript browser, or more than the
minimum excerpt needed to substantiate the displayed fact.

The right rail contains one—and only one—attention item:

> **Unknown from intake**
> Previous knee surgery was not provided.

There is no second warning, no inferred value, and no control to “fix” the
unknown from this scene. The unknown remains visible in the handoff. A brief
may be reviewed with an explicitly missing non-blocking fact; missing does not
mean “no” and does not become a clinician finding.

Opening the rehearsed source evidence marks the brief reviewed once and shows
a small `Reviewed for this synthetic demo` status. This calls the shell's
`onReviewed()` gate callback but does not navigate. The quiet presenter
`Next` control then moves to assessment. This keeps the required provenance
interaction and avoids adding a second product button whose only purpose is
demo navigation. It is not a production verification/audit claim; the screen
must retain the global synthetic-demo label.

### Assessment scene

Show three visually distinct blocks:

- **Patient-reported context** (read-only): goal, symptom behavior, and
  `Previous knee surgery — Unknown from intake`.
- **Clinician-recorded findings** (prefilled):
  - right knee flexion: `135°`;
  - right knee extension: `0°`;
  - knee extension strength: `4+/5, pain-free`;
  - single-leg squat: proposed `Pain 4/10 at 45°; dynamic valgus observed`;
  - sit-to-stand response: `Not tested — deferred`.
- **Working hypothesis** (read-only clinician-authored fixture):
  `Patellofemoral pain presentation; clinician-entered working hypothesis.`

The functional finding is the only editable field. Start it in a visibly
`Needs confirmation` state. The presenter changes its pain value from `4/10`
to `3/10` using a compact select or segmented control, leaving the observation
text intact, then presses `Confirm assessment`.

Behavior:

- before the edit, `Confirm assessment` is disabled and explains that the
  functional finding needs confirmation;
- editing creates a typed recorded value and marks the finding `Edited —
  confirm`;
- the button confirms the complete assessment snapshot exactly once;
- after confirmation, fields become read-only, status becomes `Verified for
  this synthetic demo`, and presenter `Next` becomes enabled;
- returning to the scene shows the confirmed value and does not require a
  second edit;
- presenter navigation is owned by the shell; transient pre-confirmation edits
  are local, while the confirmed handoff is preserved by the shell.

`Not tested — deferred` is deliberately separate from the intake's single
missing fact and must not be styled as an attention warning. It proves the
semantic distinction without introducing a second “missing fact.”

## Proposed Data and Contracts

Add a demo-owned model near the `/demo` feature rather than weakening
production contracts:

```ts
type DemoBriefFact =
  | {
      readonly kind: "recorded";
      readonly id: string;
      readonly label: string;
      readonly value: string;
      readonly sourceIds: readonly [string, ...string[]];
    }
  | {
      readonly kind: "missing";
      readonly id: "previous-knee-surgery";
      readonly label: "Previous knee surgery";
      readonly reason: "not_provided";
    };

interface DemoVerifiedBrief {
  readonly id: "demo.brief.maya-right-knee";
  readonly versionId: "demo.brief.maya-right-knee-v1";
  readonly reviewState: "verified";
  readonly facts: readonly DemoBriefFact[];
}

type DemoAssessmentValue =
  | { readonly kind: "recorded"; readonly value: string; readonly unit: string | null }
  | { readonly kind: "not_tested"; readonly reason: "deferred" };

interface DemoVerifiedAssessment {
  readonly id: "demo.assessment.maya-right-knee";
  readonly versionId: "demo.assessment.maya-right-knee-v1";
  readonly state: "verified";
  readonly findings: readonly DemoAssessmentFinding[];
  readonly workingHypothesis: {
    readonly provenance: "clinician_fixture";
    readonly text: string;
  };
}

interface DemoBriefAssessmentHandoff {
  readonly brief: DemoVerifiedBrief;
  readonly assessment: DemoVerifiedAssessment;
}

interface ClinicianBriefSceneProps {
  readonly fixture: DemoBriefFixture;
  readonly completedIntake: CompletedDemoIntake;
  readonly reviewed: boolean;
  readonly onReviewed: () => void;
}

interface ClinicianAssessmentSceneProps {
  readonly fixture: DemoAssessmentFixture;
  readonly completedIntake: CompletedDemoIntake;
  readonly confirmedHandoff: DemoBriefAssessmentHandoff | null;
  readonly onConfirmed: (handoff: DemoBriefAssessmentHandoff) => void;
}
```

The shared fixture should store source excerpts separately from facts and map
them by source ID. This preserves the production-shaped rule that the default
brief projection carries source metadata, while inspection deliberately
reveals a bounded excerpt.

The scene-local model owns source-dialog state and the one assessment edit.
Only cross-scene readiness/artifacts enter Part 1's reducer:

```ts
{ type: "brief_reviewed" }
{
  type: "assessment_confirmed";
  handoff: DemoBriefAssessmentHandoff;
}
```

Required invariants:

- fixture validation finds exactly one `DemoBriefFact` with
  `kind: "missing"`;
- every recorded brief fact has at least one existing source;
- the missing fact has no value and no source assertion;
- patient-reported values never appear in clinician findings;
- only the single-leg-squat pain value is editable;
- the scene cannot construct `assessment_confirmed` until brief review and the
  required local edit;
- confirmation freezes a verified snapshot with a stable version pin;
- the downstream object contains no React state, callbacks, source excerpts,
  or raw intake transcript.

The composer adapter owner receives the verified pins:

```ts
{
  brief: {
    id: handoff.brief.id,
    versionId: handoff.brief.versionId,
    reviewState: "verified",
  },
  assessment: {
    id: handoff.assessment.id,
    versionId: handoff.assessment.versionId,
    state: "verified",
  },
}
```

The adapter remains responsible for the rest of `DeterministicPlanInput`,
including content/playbook/rule pins and the canonical input hash. This slice
must not call the composer directly.

## Exact Files to Add or Change

Part 1's canonical shared names are `fixture.ts`, `model.ts`,
`scene-contracts.ts`, `demo-shell.tsx`, and their corresponding tests.

Add:

- `apps/web/src/app/demo/brief-assessment-model.ts` — demo-only types,
  fixture selectors, reducer helpers, invariants, verified handoff builder.
- `apps/web/src/app/demo/brief-assessment-model.test.ts` — state and contract
  tests.
- `apps/web/src/app/demo/clinician-brief-scene.tsx` — brief hierarchy, missing
  fact rail, source inspector, and review-ready callback.
- `apps/web/src/app/demo/clinician-brief-scene.test.ts` — rendering,
  accessibility, source, and missingness tests.
- `apps/web/src/app/demo/clinician-assessment-scene.tsx` — concise assessment,
  one edit, confirmation gate, and verified state.
- `apps/web/src/app/demo/clinician-assessment-scene.test.ts` — edit/gate,
  provenance-label, missing/not-tested, and handoff tests.
- `apps/web/src/app/demo/brief-assessment.module.css` — scene-local episode
  header, brief grid, source dialog, assessment blocks, and focused control
  styling derived from the static prototype.

Integration requests for the Part 1 owner:

- `apps/web/src/app/demo/fixture.ts` — add brief facts, bounded sources,
  assessment values, and stable brief/assessment IDs.
- `apps/web/src/app/demo/model.ts` — register `brief_reviewed` and the
  artifact-carrying `assessment_confirmed`; do not store dialog or edit state.
- `apps/web/src/app/demo/scene-contracts.ts` — expose `onReviewed()` and
  `onConfirmed(handoff)`.
- `apps/web/src/app/demo/demo-shell.tsx` — mount these two components, consume
  their callbacks, and keep presenter navigation authoritative.

Do not change production clinician routes, package contracts, composer code,
API/server files, or static `prototype/` files for this slice.

## Ordered Implementation Tasks

1. Import the fixed Part 1 fixture/contracts; do not create a second demo state
   machine or alternate shared filenames.
2. Add demo-only brief/assessment types and invariant checks.
3. Extend the shared Maya fixture with the exact copy and stable pins above.
4. Add model tests first: one missing fact, complete source mapping, pre-edit
   block, post-edit confirmation, idempotent confirmed snapshot.
5. Implement the brief main column and review rail using semantic sections and
   headings.
6. Implement the accessible bounded source inspector; port the focus
   trap/Escape/restore behavior, not the API auditing path.
7. Wire the first successful source inspection to the idempotent
   `onReviewed()` callback; presenter `Next` performs navigation.
8. Implement the assessment's provenance-separated blocks and the one editable
   single-leg-squat pain control.
9. Implement the confirmation gate and immutable typed handoff.
10. Integrate with the shell's two scene slots and the composer adapter's pin
    input.
11. Run narrow tests/typecheck, keyboard-check both scenes, and rehearse the
    brief/assessment segment under 57 seconds.

## Tests and Validation

Automated:

- `brief-assessment-model.test.ts`
  - fixture has exactly one missing brief fact;
  - every recorded material fact resolves to a source;
  - previous knee surgery remains `missing/not_provided`, never `false`;
  - assessment confirmation is unavailable before brief review and edit;
  - the edit changes only single-leg-squat pain from 4 to 3;
  - confirmation produces stable verified IDs/pins and is idempotent;
  - source excerpts and patient-reported facts do not leak into composer pins.
- `clinician-brief-scene.test.ts`
  - story precedes symptoms and goal;
  - the UI renders exactly one `Unknown from intake` attention item;
  - source control opens only the bounded excerpt;
  - first source inspection calls `onReviewed` once and enables presenter Next
    without navigating from the scene;
  - dialog has an accessible name, traps focus, closes on Escape, restores
    focus, and does not expose `Open transcript`.
- `clinician-assessment-scene.test.ts`
  - patient context, clinician findings, not-tested state, and working
    hypothesis have explicit labels;
  - the primary action begins disabled;
  - the one edit enables confirmation;
  - confirmation locks controls and invokes the handoff callback once;
  - rerendering confirmed state preserves `3/10`.

Run exact paths through the root Vitest installation:

```sh
pnpm exec vitest run apps/web/src/app/demo/brief-assessment-model.test.ts
pnpm exec vitest run apps/web/src/app/demo/clinician-brief-scene.test.ts
pnpm exec vitest run apps/web/src/app/demo/clinician-assessment-scene.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build
```

If a focused command stalls, record its exact last output rather than
broad-running the known-to-stall suite.

Manual:

- keyboard-only source open/close and assessment edit/confirm;
- 1440px laptop viewport with no clipped primary actions;
- reduced-motion mode does not affect comprehension;
- exactly one visually prominent missing-fact treatment across both scenes;
- timed run from brief arrival to composer handoff is at or below 57 seconds;
- refresh/reset behavior follows the shell contract and never fetches data.

## Dependencies and Hand-off Contracts

### Inputs from intake/fixture owner

- Stable Maya/right-knee identity and the accepted synthetic answers.
- A completion signal before the brief scene becomes reachable.
- Source IDs/excerpts matching the displayed story, symptoms, and goal.
- Confirmation that `previous knee surgery` is the sole unanswered material
  brief fact.

### Inputs from shell owner

- Scene identity for `brief_review` and `assessment`.
- Read-only state plus event callbacks; the scene components must not own
  navigation.
- Global synthetic/non-clinical label.
- Presenter Previous/Next/reset behavior and state retention policy.
- The canonical shared fixture location.

### Output to composer adapter owner

- `DemoBriefAssessmentHandoff` only after assessment confirmation.
- Stable verified brief/assessment IDs and version IDs.
- No Postgres IDs, fetches, providers, mutable clocks, or raw transcript.
- No promise that the missing surgery answer was resolved; it remains explicit
  in the verified demo brief.

### Output to plan-review/presenter owners

- a non-null `DemoBriefAssessmentHandoff` is the only enablement signal to
  enter composition.
- These scenes do not decide which exercise is rejected, render composer
  progress, or approve a plan.

## Risks and Tradeoffs

| Risk | Decision / mitigation |
| --- | --- |
| “Verified” looks like a production clinical/audit claim | Label it `Verified for this synthetic demo`; keep the global synthetic banner; use demo-owned types only. |
| The production assessment draft cannot feed the composer | Build a narrow demo verification snapshot; do not change `generationEligible: false` or composer validation. |
| One missing fact becomes confused with “no surgery” | Render `Unknown from intake`, never a boolean/negative value; preserve it in the handoff. |
| `Not tested` reads as a second missing fact | Place it under clinician findings with neutral styling and explicit `Deferred`; reserve warning styling for the intake unknown. |
| Source proof consumes demo time | One-click bounded excerpt in place; no transcript browser or network request. |
| A forced edit feels theatrical | Use a plausible confirmation of a prefilled functional finding and explain the gate in the UI. Keep it to one field and one confirmation. |
| Brief verification adds another interaction | Let the required source inspection set review readiness; presenter Next advances, and assessment edit/confirm remains the single meaningful clinical input. |
| Concurrent shell/fixture edits conflict | Part 3 owns only its seven leaf files; send typed fixture/model/shell integration requests to the Part 1 owner. |
| Clinical copy could imply diagnosis/readiness | Hypothesis is explicitly clinician-authored; all data remains synthetic and not clinically approved. |

## Done Criteria

- Brief and assessment render inside the unified demo shell from shared
  in-memory state with zero fetches.
- Maya's story, symptoms/behavior, and goal are the dominant brief hierarchy.
- Exactly one fact—previous knee surgery—is visibly unknown and never inferred.
- One source interaction reveals concise accepted-response evidence and is
  keyboard accessible.
- The assessment clearly separates patient-reported context,
  clinician-recorded findings, not-tested values, and clinician-authored
  hypothesis.
- Only single-leg-squat pain is editable; changing `4/10` to `3/10` is required
  before confirmation.
- Confirmation creates a stable typed verified brief/assessment handoff and
  enables composition exactly once.
- Production brief, assessment, and composer contracts are unchanged.
- Focused component/model tests and web typecheck pass, or any infeasible check
  is reported with the exact command and reason.
- The combined segment is rehearsed at or below 57 seconds and remains clear
  without presenter explanation.
