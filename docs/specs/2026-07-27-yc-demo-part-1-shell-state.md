# YC Demo Part 1 — Unified Shell, Fixture, and State

> **Rehabify repository override:** use the authoritative shared-file list,
> contracts, commands, and Wave 1 gate in
> `docs/specs/2026-07-27-yc-demo-rehabify-execution.md`. Paths under
> `apps/web/...` below describe intent only; implementation lives under
> `src/app/demo/`.

Status: implementation-ready
Date: 2026-07-27
Sprint size: 1–2 days
Route: `/demo`
Runtime boundary: deterministic synthetic data only; no clinical use

## Objective

Build the stable frame that makes the three-minute demo feel like one product:

- one `/demo` route and one synthetic Maya/right-knee case;
- a pure, typed state machine that owns scene order and cross-scene gates;
- automatic intake-to-preparation-to-brief handoff;
- quiet presenter navigation, reset, refresh recovery, and direct-scene rehearsal;
- a consistent clinician desktop shell and a patient phone-frame boundary; and
- narrow typed interfaces through which Parts 2–4 render and advance their scenes.

The shell must be usable before every scene is polished. Placeholder scene bodies are acceptable
temporarily, provided they conform to the final contracts and make the entire state sequence
testable.

## Non-goals and ownership boundary

Part 1 does **not** implement:

- browser voice capture, intake questions, transcript behavior, or text fallback (Part 2);
- brief content, source inspection, assessment fields, or their internal review interactions
  (Part 3);
- composer adaptation, rule evaluation, rejection presentation, plan approval UI, or Today
  contents (Part 4);
- production authentication, persistence, APIs, jobs, Postgres, speech/model providers, consent
  expansion, or real patient data;
- root-route replacement, redesign of the general product, or responsive support beyond the
  presentation viewport and contained phone frame.

Part 1 owns only cross-scene orchestration and visual framing. Scene components own their local
interaction state. No scene may directly set another scene, mutate the fixture, write session
storage, or parse the URL.

## Current code and reuse map

| Path | Current value | Part 1 decision |
| --- | --- | --- |
| `apps/web/src/app/prototype/model.ts` | Pure reducer, ordered IDs, bounded navigation, reset, recovery, announcements, and focused tests | Reuse the pure reducer/event/helper pattern. Do not extend the seven-flow usability model; the YC narrative has different scenes and gates. |
| `apps/web/src/app/prototype/model.test.ts` | Covers ordering, invalid actions, direct selection, restart, recovery, and keyboard indexing | Mirror its table-driven reducer coverage for the demo state machine. |
| `apps/web/src/app/prototype/prototype-navigator.tsx` | Client reducer wiring, focus restoration, tab semantics, live announcements | Reuse focus/live-region patterns, but not its visible usability-lab rail or task-completion UI. |
| `apps/web/src/app/prototype/prototype.module.css` | Existing app-local CSS-module approach | Use a new demo CSS module so YC polish cannot regress the usability prototype. |
| `prototype/index.html` | Cohesive Maya episode shell, episode header/tabs, clinician content hierarchy, demo bar, and patient Today structure | Port only the desktop frame, identity, restrained safety label, and patient-frame geometry needed by `/demo`. |
| `prototype/styles.css` | Calm clinical tokens and detailed clinician/patient layouts | Copy a small, renamed token/layout subset into the demo module. Do not import this global static stylesheet or its unrelated attention/check-in styles. |
| `prototype/app.js` | Imperative role/view switching and local UI mutations | Visual reference only. Do not reuse imperative DOM state. |
| `apps/web/src/app/page.tsx` | Stale foundation page | Leave unchanged; `/demo` is the explicit entry URL. |
| `apps/web/src/app/layout.tsx` and `globals.css` | Plus Jakarta Sans, global reset, metadata shell | Reuse inherited font/reset; keep demo-specific styles local. |
| `apps/web/src/app/intake-voice-demo/` | Browser capture controller, control states, fallback, and narrow tests | Part 2 consumes it behind `IntakeDemoSceneProps`; Part 1 must not couple state to capture phases. |
| `apps/web/src/app/clinician/episodes/[episodeId]/brief/` | Production-shaped source inspection, missingness, review UI and accessibility behavior | Part 3 adapts its information hierarchy and dialog focus behavior to fixture-only props. No API calls from `/demo`. |
| `apps/web/src/app/clinician/episodes/[episodeId]/assessment/` | Structured findings and explicit missing/unknown semantics | Part 3 adapts a small fixture-backed subset. |
| `packages/clinical-rules/src/deterministic-plan-composer.ts` | Existing deterministic in-memory rule engine | Part 4 owns its adapter and result mapping. Part 1 stores only composer lifecycle/output readiness. |
| `apps/web/src/app/clinician/episodes/[episodeId]/plan/` | Draft/review/approval concepts | Part 4 renders these concepts inside the clinician frame. |
| `apps/web/src/app/patient/today/` | Patient Today read-model concepts | Part 4 renders a fixture-backed view inside Part 1's phone frame. |

There are many pre-existing untracked duplicate files with names ending in ` 2` or ` 3`. All
implementation and staging must target exact canonical paths and must not overwrite, delete, or
stage those duplicates.

## Proposed architecture

```text
app/demo/page.tsx (server metadata + route entry)
  -> DemoShell (client orchestration)
       -> demoReducer(state, event)          pure and exhaustively tested
       -> recovery adapter                   URL/sessionStorage boundary
       -> PresenterControls                  quiet, dev/presenter-only navigation
       -> ClinicianFrame or PatientFrame     shell selected from scene metadata
       -> scene registry
            patient_intake     -> Part 2
            preparing_brief    -> Part 2 view / Part 1 timer
            brief_review       -> Part 3
            assessment         -> Part 3
            composing_plan     -> Part 4
            plan_review        -> Part 4
            approved           -> Part 4 approval confirmation
            patient_today      -> Part 4
```

`model.ts` remains framework-free. `fixture.ts` is immutable data. `demo-shell.tsx` is the only
client component allowed to dispatch cross-scene events or perform recovery persistence.
`scene-contracts.ts` prevents scene implementations from importing the reducer or presenter
controls.

## Typed contracts

The implementation may refine names, but it must preserve these semantics.

```ts
export const DEMO_SCENES = [
  "patient_intake",
  "preparing_brief",
  "brief_review",
  "assessment",
  "composing_plan",
  "plan_review",
  "approved",
  "patient_today",
] as const;

export type DemoScene = (typeof DEMO_SCENES)[number];
export type DemoSurface = "patient_full" | "clinician_desktop" | "patient_phone";
export type DemoComposerStatus = "idle" | "running" | "complete" | "failed";

export interface DemoState {
  readonly scene: DemoScene;
  readonly completedIntake: CompletedDemoIntake | null;
  readonly briefReviewed: boolean;
  readonly clinicalHandoff: DemoBriefAssessmentHandoff | null;
  readonly composerStatus: DemoComposerStatus;
  readonly planDraft: DemoPlanDraft | null;
  readonly approval: DemoApproval | null;
  readonly transitionNonce: number;
  readonly recoveryMessage: string | null;
}

export type DemoEvent =
  | { readonly type: "intake_completed"; readonly intake: CompletedDemoIntake }
  | { readonly type: "preparation_elapsed"; readonly nonce: number }
  | { readonly type: "brief_reviewed" }
  | {
      readonly type: "assessment_confirmed";
      readonly handoff: DemoBriefAssessmentHandoff;
    }
  | { readonly type: "composition_started" }
  | { readonly type: "composition_succeeded"; readonly draft: DemoPlanDraft }
  | { readonly type: "composition_failed"; readonly message: string }
  | { readonly type: "composition_retried" }
  | { readonly type: "plan_approved"; readonly approval: DemoApproval }
  | { readonly type: "show_patient_today" }
  | { readonly type: "presenter_previous" }
  | { readonly type: "presenter_next" }
  | { readonly type: "presenter_jump"; readonly scene: DemoScene }
  | { readonly type: "restore"; readonly checkpoint: DemoCheckpoint }
  | { readonly type: "reset" }
  | { readonly type: "recovery_acknowledged" };

export interface DemoCheckpoint {
  readonly version: 1;
  readonly scene: DemoScene;
}
```

`CompletedDemoIntake`, `DemoBriefAssessmentHandoff`, `DemoPlanDraft`, `DemoApproval`, and
`DemoTodayView` are immutable leaf contracts supplied by Parts 2–4 and re-exported through
`scene-contracts.ts`. Capture phases, prompt progress, source-dialog state, form edits, and
animation state stay local to their scene. Only the complete artifacts that another scene needs
enter the shared reducer.

The reducer derives a canonical prerequisite state for `restore` and `presenter_jump` from a
scene checkpoint; it must never trust serialized booleans or artifacts. `transitionNonce`
increments when a timed scene is entered so stale timers cannot advance a later/reset run.

The immutable fixture should be one exported `DEMO_CASE` object with `as const satisfies
DemoCaseFixture`. Part 1 owns and integrates stable identity, ordering, and section boundaries;
Parts 2–4 supply their section-specific content without duplicating Maya facts:

```ts
export interface DemoCaseFixture {
  readonly fixtureVersion: "yc-demo-v1";
  readonly synthetic: true;
  readonly patient: {
    readonly id: "maya-chen";
    readonly displayName: string;
    readonly firstName: string;
  };
  readonly episode: {
    readonly id: string;
    readonly regionLabel: string;
    readonly weekLabel: string;
    readonly nextReviewLabel: string;
  };
  readonly intake: DemoIntakeFixture;       // Part 2 contract
  readonly brief: DemoBriefFixture;         // Part 3 contract
  readonly assessment: DemoAssessmentFixture; // Part 3 contract
  readonly composition: DemoCompositionFixture; // Part 4 contract
  readonly today: DemoTodayFixture;         // Part 4 contract
}
```

`DemoTodayFixture` contains only patient/week/review presentation metadata; it must not contain
a duplicate exercise list or dosage. Those values come from the exact approved draft selector.
All fixture text is display-ready and deterministic. It contains no `Date.now()`, random IDs,
network-derived values, mutable arrays, or production identifiers. Internal scene code receives
only its fixture slice plus callbacks:

```ts
export interface IntakeDemoSceneProps {
  readonly fixture: DemoIntakeFixture;
  readonly completedIntake: CompletedDemoIntake | null;
  readonly onComplete: (intake: CompletedDemoIntake) => void; // idempotent
}

export interface BriefDemoSceneProps {
  readonly fixture: DemoBriefFixture;
  readonly completedIntake: CompletedDemoIntake;
  readonly reviewed: boolean;
  readonly onReviewed: () => void;
}

export interface AssessmentDemoSceneProps {
  readonly fixture: DemoAssessmentFixture;
  readonly completedIntake: CompletedDemoIntake;
  readonly confirmedHandoff: DemoBriefAssessmentHandoff | null;
  readonly onConfirmed: (handoff: DemoBriefAssessmentHandoff) => void;
}

export interface CompositionDemoSceneProps {
  readonly fixture: DemoCompositionFixture;
  readonly handoff: DemoBriefAssessmentHandoff;
  readonly status: DemoComposerStatus;
  readonly draft: DemoPlanDraft | null;
  readonly onStart: () => void;
  readonly onComplete: (draft: DemoPlanDraft) => void;
  readonly onFailure: (message: string) => void;
  readonly onRetry: () => void;
}

export interface PlanReviewDemoSceneProps {
  readonly draft: DemoPlanDraft;
  readonly approval: DemoApproval | null;
  readonly onApprove: (approval: DemoApproval) => void;
}

export interface TodayDemoSceneProps {
  readonly view: DemoTodayView;
}
```

Scene callbacks submit readiness or immutable output artifacts; they do not navigate. Presenter
`Next` remains the only post-intake navigation trigger except for automatic preparation and
composition completion. Repeated callbacks/events with the same artifact are no-ops.

## Scene metadata and surfaces

Keep a single ordered metadata table next to the reducer:

| Scene | Surface | Entry requirements | Exit |
| --- | --- | --- | --- |
| `patient_intake` | `patient_full` | none | final required answer dispatches `intake_completed` |
| `preparing_brief` | `patient_full` | completed intake artifact | automatically after 1,200 ms; reduced motion still preserves a brief status announcement |
| `brief_review` | `clinician_desktop` | intake complete | presenter Next requires `briefReviewed` |
| `assessment` | `clinician_desktop` | brief reviewed | presenter Next requires a verified clinical handoff |
| `composing_plan` | `clinician_desktop` | verified clinical handoff | starts once on entry; success stores the draft and opens `plan_review`; failure remains recoverable |
| `plan_review` | `clinician_desktop` | composition complete | exact approval artifact enters `approved`; presenter Next is unavailable until then |
| `approved` | `clinician_desktop` | plan approved | presenter Next opens Today |
| `patient_today` | `patient_phone` | plan approved | terminal narrative scene |

The clinician frame includes a compact Rehabify brand/sidebar strip, Maya episode identity,
right-knee context, scene-level progress/tabs, and the scene body. It must not include static
prototype controls that are irrelevant to the narrative. The patient phone frame is owned by
Part 1 (device chrome, max width, safe padding, background, overflow boundary); Part 4 owns
everything inside it. `patient_intake` is a patient surface but should use the laptop viewport,
not the Today phone frame.

Presenter controls sit outside the product frame, use a subdued neutral style, and are labelled
“Presenter.” Normal mode shows Previous/Next plus an unobtrusive menu trigger. Reset and scene
selection live inside the menu. The menu is closed by default and keyboard accessible. Do not
style presenter controls like product actions.

## State transitions, reset, and recovery

### Normal path

```text
initial
  patient_intake
  --intake_completed-->
  preparing_brief
  --preparation_elapsed(current nonce)-->
  brief_review
  --brief_reviewed + presenter_next-->
  assessment
  --assessment_confirmed(handoff) + presenter_next-->
  composing_plan
  --composition_succeeded-->
  plan_review
  --plan_approved-->
  approved
  --presenter_next-->
  patient_today
```

### Guard rules

- Reject/ignore events that do not apply to the current scene.
- `patient_today` is unreachable unless an approval matches the current draft version and input
  hash, including direct scene selection and restore.
- A normal Next button is hidden during intake/preparation/composition and disabled when the
  current gate is unmet.
- Previous is available after the automatic handoff. It selects the prior stable scene without
  clearing already-achieved gates, which supports presentation recovery.
- Returning to `composing_plan` after a successful composition must not rerun the composer;
  it immediately exposes the completed state or permits moving forward.
- A failed composition stays in `composing_plan`, announces a concise failure, and exposes a
  deterministic Retry action supplied by Part 4. It never skips to a canned approved result.
- Reset returns the exact initial state, invalidates pending timers via `transitionNonce`, clears
  the saved checkpoint, removes the `scene` query parameter with `history.replaceState`, closes
  presenter UI, and restores focus to the intake heading.

### Direct-scene rehearsal

Use `?scene=<DemoScene>` as the explicit shareable/rehearsal entry. On first client hydration:

1. validate the value against `DEMO_SCENES`;
2. derive the minimum canonical prerequisite state for that checkpoint;
3. replace the URL with `/demo` so an accidental refresh follows normal checkpoint behavior;
4. announce “Rehearsal mode: opened [scene label]”; and
5. persist only `{ version: 1, scene }`.

Jumping is presenter-only and seeds deterministic prerequisites only through `plan_review`.
Requests for `approved` or `patient_today` normalize to `plan_review` with the exact deterministic
draft and a quiet recovery notice. The presenter must perform the real approval click once in
that run before opening Today. Invalid scene values safely start at intake and show no error
page.

### Refresh recovery

Use `sessionStorage` key `rehabify:yc-demo:v1` to save only the current stable scene after each
transition. Do not persist `preparing_brief` or `composing_plan`; normalize them to
`brief_review` and `plan_review` respectively only if their prerequisite result is known,
otherwise to the preceding stable scene. Because scene-only storage cannot prove an exact
approval, restored `approved` or `patient_today` checkpoints normalize to `plan_review` with the
canonical draft and require approval again. A valid same-tab refresh restores the canonical
checkpoint and displays a quiet “Demo restored” notice with Reset available. Missing, malformed,
unknown-version, or unavailable storage starts from intake. Storage failures are caught and do
not block the demo.

Precedence is: valid `?scene=` override, then valid session checkpoint, then initial state.

## Exact files to add or change

Add:

- `apps/web/src/app/demo/page.tsx` — route metadata and `DemoShell` entry.
- `apps/web/src/app/demo/demo-shell.tsx` — reducer wiring, scene registry, persistence, timers,
  focus restoration, and live announcements.
- `apps/web/src/app/demo/model.ts` — scene IDs, metadata, state, events, reducer, gate helpers,
  checkpoint normalization.
- `apps/web/src/app/demo/fixture.ts` — immutable `DEMO_CASE` and shared fixture interfaces.
- `apps/web/src/app/demo/scene-contracts.ts` — narrow props used by Parts 2–4.
- `apps/web/src/app/demo/presenter-controls.tsx` — Previous/Next/menu/reset/direct-scene controls.
- `apps/web/src/app/demo/demo-frames.tsx` — clinician desktop frame, patient full surface, and
  patient phone frame.
- `apps/web/src/app/demo/demo.module.css` — isolated visual tokens, frames, presenter controls,
  transitions, focus styles, and reduced-motion rules.
- `apps/web/src/app/demo/model.test.ts` — reducer, gates, checkpoints, and reset tests.
- `apps/web/src/app/demo/demo-shell.test.ts` — orchestration, recovery, focus, timer, and
  approval-gate tests.

No existing file needs to change for Part 1. If scene owners create their files concurrently,
`demo-shell.tsx` may initially use typed local placeholders and swap imports only after their
contracts compile; do not edit files owned by Parts 2–4.

## Parallel execution strategy

Use Codex workers in parallel only after the shared contracts are frozen:

| Lane | Ownership | Can run in parallel |
| --- | --- | --- |
| Part 1 integration owner | `fixture.ts`, `scene-contracts.ts`, `model.ts`, `demo-shell.tsx`, shared frames/CSS/tests | Starts first; remains the only writer to shared files |
| Part 2 owner | Voice-intake and preparing-brief leaf components/tests | Yes, against frozen props |
| Part 3 owner | Brief/assessment model, leaf components, CSS, and tests | Yes, against frozen props |
| Part 4 owner | Composer adapter, plan/Today leaf components, CSS, and tests | Yes, after handoff types are frozen |

Integrate leaf modules serially in the order Part 2 → Part 3 → Part 4, running the relevant
focused tests after each merge into the shell. This keeps the critical path to one contract-freeze
block, three parallel leaf builds, and one final integration/polish pass rather than four
sequential 1–2 day efforts.

## Ordered implementation tasks

1. Create `model.ts` with scene constants/metadata, initial state, pure reducer, canonical
   checkpoint derivation, guard helpers, and idempotent events.
2. Write `model.test.ts` before UI wiring. Cover the happy path and every prohibited transition,
   especially Today before approval.
3. Create `fixture.ts` with stable Maya/episode identity and typed, read-only section boundaries.
   Coordinate section shapes with Parts 2–4 before they add content; no second fixture source.
4. Create `scene-contracts.ts` with the five immutable cross-scene artifacts and callback props
   above. Scene modules may import this file and their own fixture slice, but never
   `DemoState`/`dispatch`.
5. Add `page.tsx` and `demo-shell.tsx` with the complete registry using minimal placeholders.
   Implement nonce-safe preparation timing and exactly-once composition entry.
6. Add URL/session recovery as a small adapter in `demo-shell.tsx`; validate all external strings
   before dispatch and catch storage access errors.
7. Build `demo-frames.tsx` and the minimal CSS token/layout subset from the static prototype.
   Verify desktop at the presentation resolution and phone containment independently.
8. Add accessible presenter controls, focus restoration on scene changes/reset, and one polite
   live region. Confirm presenter UI cannot be mistaken for product UI.
9. Replace placeholders with imports from Parts 2–4 as they land, without absorbing their local
   state or implementation.
10. Add shell integration tests, run focused validation, then rehearse reset, refresh, direct
    scene, denied-storage, and composition-failure recovery by hand.

## Testing and validation

### Unit tests

`model.test.ts` must prove:

- exact scene order and surface metadata;
- normal automatic/manual transition sequence;
- brief/assessment/composition/approval gates;
- Today is unreachable before approval by Next, jump, malformed restore, or forged event order;
- repeated completion/approval events are idempotent;
- Previous is bounded and preserves achieved gates;
- composer failure/retry/success behavior;
- reset clears all gates and changes the timer nonce;
- every scene checkpoint derives one exact canonical state; and
- invalid/version-mismatched checkpoints return the initial state.

### Shell tests

Using the repository's Vitest + happy-dom conventions:

- render `/demo` orchestration at intake;
- complete intake, advance fake timers, and assert automatic brief handoff;
- reset while preparation timer is pending and prove the stale timer cannot advance;
- assert Next visibility/disabled behavior for each gate;
- restore from a valid session checkpoint and reject malformed storage;
- prefer a valid query checkpoint over storage and strip the query afterward;
- direct-open Today normalizes to plan review and still requires the approval action;
- composition is triggered once per eligible entry and retry works after failure;
- scene changes focus the new scene heading and update the polite live region;
- presenter menu closes on Escape and returns focus to its trigger; and
- reduced-motion mode does not remove status feedback or trap progression.

### Commands

Run narrowly first:

```bash
pnpm exec vitest run apps/web/src/app/demo/model.test.ts apps/web/src/app/demo/demo-shell.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build
```

Then run the existing prototype and voice tests most likely to reveal shared-pattern regressions:

```bash
pnpm exec vitest run \
  apps/web/src/app/prototype/model.test.ts \
  apps/web/src/app/prototype/prototype-navigator.test.ts \
  apps/web/src/app/intake-voice-demo/browser-voice-capture.test.ts \
  apps/web/src/app/intake-voice-demo/voice-control-state.test.ts
```

The captured parent plan notes that wider commands previously stalled. Record command, duration,
and last output if this repeats; do not substitute an unbounded full-suite run for focused
evidence.

Manual validation at the actual laptop/browser presentation setup:

- refresh at every stable scene;
- run `?scene=` for every scene and one invalid value;
- reset from every scene, including during preparation and composition;
- exercise browser back/forward and confirm it does not create hidden scene history;
- inspect clinician shell at presentation width and Today inside the phone frame;
- keyboard through presenter controls and verify visible focus;
- enable reduced motion; and
- complete five consecutive runs without stale state or an unrecoverable scene.

## Dependencies and hand-off contracts

### Part 2 — intake and handoff

Part 1 provides `DEMO_CASE.intake`, `IntakeDemoSceneProps`, the patient full surface, and an
idempotent `onComplete(completedIntake)`. Part 2 keeps capture phase, prompt progress, and text
drafts local; it submits one immutable `CompletedDemoIntake` only after its final required
fixture answer succeeds by voice or text fallback. It must not render presenter navigation,
preparation, or perform route/storage writes. Capture errors remain local and recoverable; they
do not change the shell scene.

### Part 3 — brief and assessment

Part 1 provides fixture slices, the completed intake, clinician frame, and artifact callbacks.
Part 3 keeps source-dialog and assessment-edit state local, marks the brief reviewed without
navigating, and submits one immutable `DemoBriefAssessmentHandoff` on confirmation. Its local
state resets on full demo reset via remount keyed by `transitionNonce`. It must not fetch
production routes.

### Part 4 — composer, approval, and Today

Part 1 provides the verified clinical handoff, composition lifecycle callbacks, version-bound
approval callback, clinician frame, and phone boundary. Part 4 owns the in-memory composer
adapter and deterministic output. It calls `onComplete(draft)` only after a result containing
eligible and rejected candidates exists, and `onApprove(approval)` only from the explicit
clinician action. Today receives only `DemoTodayView` from the shell's exact-approved-result
selector; it cannot introduce its own bypass, fixture-only plan, or approval state.

### Shared contract discipline

- `fixture.ts`, `scene-contracts.ts`, and `model.ts` are Part 1-owned integration files.
- Other parts propose shape changes to the Part 1 owner rather than editing around the contract
  with casts.
- Scene components are controlled at the cross-scene boundary and locally stateful internally.
- No circular imports: fixture/contracts are leaf modules; scenes do not import the shell.
- All parts use canonical files and preserve unrelated/untracked user work.

## Risks and tradeoffs

| Risk | Decision or mitigation |
| --- | --- |
| Presenter jump could bypass approval | Late jumps normalize to plan review with the canonical draft; the presenter performs the approval action once before Today. |
| Session recovery restores contradictory booleans | Persist only a versioned scene ID and derive prerequisites centrally. |
| Timed preparation advances after reset | Nonce-check the timer and clear it in effect cleanup. |
| Composer runs twice under React development effects | Part 4 exposes an idempotent adapter; shell guards entry by state/nonce and tests exactly-once observable behavior. |
| Scene teams couple to reducer internals | Narrow callback props; only shell dispatches cross-scene events. |
| One giant fixture becomes a merge hotspot | Part 1 defines stable section boundaries early; scene owners provide content through coordinated, small changes or handoff snippets. |
| Porting static CSS consumes the sprint | Copy only tokens and three frames; omit attention queue, messages, check-in, dark theme, and unrelated responsive rules. |
| Presenter controls are visible or confused with product actions | Place them outside the frame, neutralize styling, and hide recovery actions in a labelled menu. |
| Refresh behavior surprises the presenter | Same-tab session checkpoint is deterministic, visibly announces restore, and Reset is always available. Query checkpoints are one-shot. |
| Dirty worktree contaminates implementation | Check status before/after, edit exact files only, and stage explicit paths only. |

## Done criteria

Part 1 is complete when:

- `/demo` loads directly without auth, database, provider, worker, or root-route dependency;
- the eight scenes exist in the locked order with the correct product surface;
- the happy path and every gate are enforced by a pure tested reducer;
- intake completion automatically shows preparation and then the brief;
- presenter controls support bounded Previous/Next, reset, and hidden direct-scene selection;
- reset is safe during pending transitions and always returns to a clean intake;
- a valid same-tab refresh restores one canonical stable checkpoint;
- every `?scene=` value opens a deterministic rehearsal state, with gated late scenes
  normalizing to plan review, and invalid values fail safe;
- Today cannot be reached in the normal flow before explicit plan approval;
- clinician scenes share one calm desktop frame and Today is contained in one phone frame;
- Parts 2–4 compile against narrow fixture/callback contracts without importing shell state;
- focus, live announcements, Escape behavior, and reduced motion work;
- focused unit tests, web typecheck, and web production build pass (or any pre-existing/stalled
  validation is recorded precisely); and
- no application code outside `apps/web/src/app/demo/` and no unrelated/untracked file is
  changed by this part.
