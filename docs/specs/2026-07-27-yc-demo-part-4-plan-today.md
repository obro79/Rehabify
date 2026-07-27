# YC Demo Part 4 — Deterministic Plan, Approval, Today, and Finish Line

> **Rehabify repository override:** the real composer package referenced below
> does not exist in `obro79/Rehabify`. Follow
> `docs/specs/2026-07-27-yc-demo-rehabify-execution.md`: compose
> deterministically from `src/lib/exercises/data.json` in demo-local pure code,
> and use the exact `src/app/demo/plan/` and `today/` ownership listed there.

Status: implementation-ready sprint plan
Date: 2026-07-27
Estimate: 1–2 focused days
Boundary: synthetic demo data only; not clinical use

## Objective

Complete the last product loop of the unified `/demo` experience:

```text
verified brief + verified assessment
  -> deterministic in-memory composition
  -> visible eligible and rejected rationale
  -> explicit clinician approval
  -> patient Today in a phone frame
```

The audience should understand in under 70 seconds that Rehabify drafts from
verified inputs, deterministic rules constrain the draft, a clinician decides,
and only that approved draft reaches the patient. The result must be reliable
enough to finish the complete three-minute demo five times in a row, with a
normal run under 2:45.

Part 4 consumes the `/demo` shell, scene state machine, presenter controls,
voice-intake completion, brief, and assessment contracts produced by Parts
1–3. It must not create a second flow controller or redefine their fixtures.

## Non-goals

- Redesigning `DeterministicSyntheticPlanComposer` or adding a general clinical
  rule engine.
- Making arbitrary assessment fields affect eligibility when the existing
  composer does not evaluate them.
- Calling Postgres, plan-review APIs, background jobs, speech providers, or
  model providers from the live demo path.
- Replacing production-shaped plan approval, consent activation, or Patient
  Today behavior.
- Persisting a plan, audit record, correction history, or treatment consent.
- Showing check-ins, holds, attention queues, follow-up, or exercise playback.
- Broad responsive work beyond the demo laptop viewport and the final phone
  presentation.
- Reworking the shell, intake, brief, or assessment content owned by Parts
  1–3.

## Current Code and Reuse Map

| Capability | Concrete source | Part 4 use |
| --- | --- | --- |
| Deterministic composer | `packages/clinical-rules/src/deterministic-plan-composer.ts` | Instantiate directly with immutable demo-local catalogs and trusted callbacks. Preserve its stable sorting, fail-closed holds, dosage clamping, and decision trace. |
| Composer tests | `packages/clinical-rules/src/deterministic-plan-composer.test.ts` | Copy the tested catalog-extension technique, not test-private helpers. Add demo adapter assertions; do not weaken package tests. |
| Composer exports | `packages/clinical-rules/src/index.ts` | Already exports the composer. No change expected. |
| Exercise/catalog contracts | `packages/contracts/src/content/exercise-content.ts`, `packages/contracts/src/content/synthetic-exercise-content.fixture.ts`, `packages/contracts/src/content/symptom-contingency.ts`, `packages/contracts/src/content/synthetic-symptom-contingency.fixture.ts` | Use validators and readiness markers. Existing fixtures prove shape but contain only technical names, so the demo adapter owns presentation labels. |
| Playbook/input contracts | `packages/contracts/src/planning/playbook.ts`, `packages/contracts/src/planning/synthetic-playbook.fixture.ts` | Build a frozen demo-only catalog with three included items and one excluded item. |
| Draft/result contracts | `packages/contracts/src/planning/active-plan.ts` | Preserve candidate dosage and immutable source-pin semantics. Do not claim activation. |
| Review/approval contracts | `packages/contracts/src/planning/plan-review.ts`, `packages/contracts/src/planning/plan-approval.ts` | Reuse the conceptual version pin and `approve`/`reject` boundary. Demo state records a local approval event; it does not call the repository contract. |
| Production-shaped plan workspace | `apps/web/src/app/clinician/episodes/[episodeId]/plan/plan-review-workspace.tsx` and `.module.css` | Reuse accessible loading/error/status patterns and approval language. Do not reuse its API calls or dense technical correction forms. |
| Plan runtimes | `apps/web/src/server/plan-review-runtime.ts`, `apps/web/src/server/plan-approval-runtime.ts`, and synthetic runtime files | Reference only for semantic boundaries and failure language. They are intentionally off the demo critical path. |
| Today read model | `apps/web/src/server/patient-today.ts` and `.test.ts` | Reuse the principle that hidden/inactive versions never leak. The `/demo` selector reads only `approvedPlan`; it does not call this server reader. |
| Today route | `apps/web/src/app/patient/today/today-screen.tsx`, `today.module.css`, and `today-screen.test.ts` | Reuse accessible empty/error conventions and dosage formatting ideas. Do not port the technical-readiness copy into the closing demo scene. |
| Strong visual reference | `prototype/index.html` (`Care plan v4 preview`, `Today`) and `prototype/styles.css` (`.plan-review-*`, `.plan-footer`, `.patient-heading`, `.exercise-card`, `.weekly-progress`) | Port the calm card hierarchy, reason lines, approval footer, and phone Today layout into CSS modules. |
| Prototype behavior | `prototype/app.js` | Reuse only the visual approval-to-Today story. Do not copy its consent modal or DOM mutation model. |
| Reducer/testing pattern | `apps/web/src/app/prototype/model.ts` and `.test.ts` | Follow pure transition/selector tests where the shared Part 1 state machine needs new events. |

### Important implementation constraint

`apps/web/package.json` does not currently depend on
`@rehabify/clinical-rules`. Part 4 must add that workspace dependency before
the `/demo` adapter imports the composer. Build `@rehabify/contracts` and
`@rehabify/clinical-rules` before isolated web typecheck/build validation.

The composer currently emits concrete exclusion codes such as
`not_included_by_playbook`, `missing_playbook_dosage`,
`missing_live_cnt05`, and `disjoint_validated_dosage_bounds`; it does not
evaluate free-form assessment contraindications. The demo must translate a
real emitted code, never invent a trace rule.

## Proposed Contracts

These contracts align to Part 1's canonical fixture/reducer names. There is
one source of truth under `apps/web/src/app/demo/`.

```ts
interface DemoPlanCandidateView {
  readonly candidateId: string;
  readonly exerciseVersionId: string;
  readonly label: string;
  readonly dosageLabel: string;
  readonly rationale: string;
}

interface DemoPlanRejectionView {
  readonly exerciseVersionId: string;
  readonly label: string;
  readonly ruleCode: string; // retained for tests; not rendered as primary copy
  readonly reason: string;
}

interface DemoPlanDraft {
  readonly inputHash: string;
  readonly versionId: "demo.plan.maya-knee-v1";
  readonly candidates: readonly DemoPlanCandidateView[];
  readonly rejected: readonly DemoPlanRejectionView[];
  readonly sourceSummary: "Verified brief + verified assessment";
}

interface DemoApproval {
  readonly planVersionId: DemoPlanDraft["versionId"];
  readonly inputHash: string;
  readonly decision: "approved";
}

type DemoPlanComposeResult =
  | { readonly ok: true; readonly draft: DemoPlanDraft }
  | {
      readonly ok: false;
      readonly recoveryMessage: string;
      readonly holdReasonCodes: readonly string[];
    };

interface DemoPlanStateSlice {
  readonly composerStatus: "idle" | "running" | "complete" | "failed";
  readonly planDraft: DemoPlanDraft | null;
  readonly approval: DemoApproval | null;
}
```

The adapter function is async because the composer contract is async, but it
must perform no network, storage, timer, or environment access:

```ts
composeDemoPlan(input: DemoComposerInput): Promise<DemoPlanComposeResult>
```

The Part 1 controller owns transitions and state. Part 4 contributes or
consumes these events/selectors:

```ts
{ type: "composition_started" }
{ type: "composition_succeeded"; draft: DemoPlanDraft }
{ type: "composition_failed"; message: string }
{ type: "composition_retried" }
{ type: "plan_approved"; approval: DemoApproval }

canApprovePlan(state): boolean
canOpenPatientToday(state): boolean
selectApprovedToday(state): DemoTodayView | null
```

`plan_approved` is valid only when `composerStatus === "complete"`, the current
draft is non-null, and the approval carries that exact draft version and input
hash. `patient_today` is valid only when `selectApprovedToday` returns a view.
Previous/direct-scene presenter navigation may preview plan review for
recovery, but it must not manufacture approval or reveal Today.

## Explicit Plan-Generation Pipeline and Ownership

Plan generation is a Part 4 implementation workstream, not a UI-only fixture
swap. The one allowed path is:

```text
DemoBriefAssessmentHandoff
  -> buildDemoPlanInput
  -> validate handoff + fixture-owned pins/catalogs
  -> canonicalize and SHA-256 the complete composer-input payload
  -> DeterministicSyntheticPlanComposer.compose
  -> validate result hash/trace/cardinality
  -> map 3 candidates + 1 real exclusion into DemoPlanDraft
  -> composition_succeeded(draft)
  -> plan_approved(exact version + hash)
  -> selectApprovedToday(state)
  -> DemoTodayView
```

`demo-plan-fixture.ts` owns organization/episode IDs, evaluated date,
playbook/content/rule/protocol/prompt/model pins, validated exercise,
registry, playbook, and contingency catalogs, plus presentation metadata.
`compose-demo-plan.ts` owns all translation from
`DemoBriefAssessmentHandoff` to `DeterministicPlanInput`; neither the shell
nor a React component constructs composer input.

`buildDemoPlanInput(handoff)` must:

1. Require the handoff's exact verified discriminants, IDs, and version IDs;
   reject a draft or unrecognized handoff before invoking the composer.
2. Add fixture-owned `organizationId`, `episodeId`, `playbookVersionId`, all
   four `contentVersions`, immutable `ruleSet`, `protocol`, `prompt`, `model`,
   and `syntheticPlanReadiness`.
3. Validate all four catalogs with the existing contract validators. Every
   content pin must resolve in the registry and exercise catalog, and the
   playbook/evaluator pins must exactly match the fixture.
4. Canonicalize a property-ordered payload containing every
   `DeterministicPlanInput` field except `inputHash`, including the sorted
   content pins and verified brief/assessment pins. Hash its UTF-8 bytes with
   Web Crypto SHA-256 and encode lowercase hexadecimal.
5. Pass that hash as `inputHash`. Because the composer's
   `verifyInputHash` callback is synchronous, close over the precomputed
   canonical string and hash; the callback re-canonicalizes its received
   input (excluding `inputHash`) and requires the received canonical string to
   equal the precomputed string and `input.inputHash` to equal the precomputed
   hash. It does not call asynchronous Web Crypto inside the callback or
   blindly return `true`. `verifySourceAffinity` compares the fixed
   organization/episode and selected playbook owner.

`composeDemoPlan` then instantiates the real
`DeterministicSyntheticPlanComposer` and awaits `compose(input)`. It fails
closed unless the result hash equals the input hash, the trace evaluator
equals the trusted pin, hold reasons are empty, ordered candidate IDs match
three unique known candidates, and `excludedContent` contains exactly the
fourth fixture pin with only `not_included_by_playbook`. It also checks every
returned dosage remains within the validated exercise/playbook intersection.

Only then may the adapter map IDs, dosage, and reason codes through
fixture-owned labels into `DemoPlanDraft`. The lowercase
`composition_succeeded` stores that artifact; lowercase `plan_approved` must
carry its exact version/hash. `selectApprovedToday` returns `null` unless both
still match. Today copies candidates from the draft and never reads raw
composer catalogs or a lookalike plan fixture.

## Deterministic Fixture Behavior

Part 4 extends the single Maya/right-knee case supplied by Parts 1–3. The
brief and assessment references passed to `DeterministicPlanInput` must use
their existing IDs/version IDs and must both be `verified`. The adapter owns
only the composer catalogs, version pins, display metadata, and hash expected
by this final slice.

Use an immutable fixture with:

- evaluated date `2026-07-27`;
- one expected 64-character input-hash test vector derived from the frozen
  fixture; the runtime builder recomputes it and must match;
- one server-trusted synthetic evaluator pin;
- one playbook valid across the evaluated date;
- four pinned exercise versions registered in the catalog;
- three playbook preferences set to `include`, with valid dosage intersections
  and live contingencies;
- one preference set to `exclude`;
- stable lexical IDs that produce the intended display order after the adapter
  maps candidate IDs to the narrative order; and
- presentation metadata keyed by exercise version, not embedded in rule-engine
  results.

Recommended display set:

1. Sit-to-stand — `2 sets · 8 repetitions · 3× weekly`
2. Quadriceps isometric — `4 holds · 30 seconds · daily`
3. Supported step-down — `2 sets · 8 repetitions · 3× weekly`
4. Resistance-band knee extension — rejected

The catalog's numerical units may stay synthetic and bounded; the adapter
must derive the displayed dosage from the returned candidate dosage plus
fixture-owned unit labels. Do not hard-code a dosage that disagrees with the
composer result.

The rejected item uses the composer's real `not_included_by_playbook` trace
code. Render:

> Not eligible for this draft: this exercise is not included in the activated
> clinic playbook.

This is a plain-English explanation of the actual deterministic rule, not a
claim that an assessment finding or autonomous clinical judgment rejected it.
Keep the raw code available in an optional subdued “Rule detail” affordance or
test hook; do not lead with a developer trace.

The adapter fails closed if it receives no candidates, any hold reason, a
missing expected rejection, a duplicate/missing presentation mapping, or a
candidate count other than three. A failed result never produces an
approvable draft.

## UI Behavior

### Composition and plan review

Entering `composing_plan` starts composition once. Show a brief, deterministic
three-step visual sequence:

1. Verified brief and assessment loaded
2. Clinic content and dosage bounds checked
3. Eligibility rules evaluated

The sequence is presentation only; result creation must not rely on animation
timers. Reduced motion shows the final checklist immediately. After the result
settles, the shared controller enters `plan_review`.

The review scene has:

- title “Proposed care plan” and a visible `Draft · clinician review` chip;
- source line “Generated from the verified brief and assessment”;
- three eligible cards with dosage and one concise rationale each;
- one visually secondary rejected panel with the exercise name, a `Not
  eligible` label, and the plain-English rule reason;
- footer summary “3 eligible · 1 rejected by clinic rule”;
- primary action “Approve plan for Maya”; and
- quiet boundary copy: “Rehabify drafts. Deterministic rules constrain. You
  decide.”

Do not expose correction forms, source-pin JSON, a consent modal, production
readiness blockers, or a fake network save. Disable approval while composition
is running or failed. A single click records the local, version-bound approval
and changes the status to `Approved`.

After approval, show a short success state with “Approved plan is now
patient-visible” and enable the presenter’s transition to Today. Never label
the plan `active` unless the shared fixture explicitly models pre-satisfied
synthetic consent; for the demo narrative, `approved` is sufficient and more
truthful.

### Patient Today

Render the final scene inside the phone-frame slot owned by the Part 1 shell.
The view is a pure projection of `approvedPlan`, not a second fixture:

- “Good morning, Maya”
- “Today”
- “Week 2 · 2 of 3 sessions this week”
- first approved candidate as “Next exercise”
- dosage copied from that exact approved candidate
- one primary action, “Start exercise” (visual demo endpoint; no playback)
- “This week” progress with Today highlighted
- next review date from the shared case fixture
- a small “Approved by your clinician” state

If no exact approval exists, render a guarded unavailable state and keep the
Today transition disabled. Direct-scene recovery attempts must route back to
plan review with “Approve this exact draft before opening the patient view.”

The phone frame is presentation chrome, not responsive emulation. Target a
roughly 390×760 content viewport that stays fully visible beside or within a
standard 1440×900 laptop presentation. Include a useful accessible heading
structure and maintain keyboard focus on the scene heading after transitions.

## Exact Files to Add or Change

Part 1's shared filenames and contracts are fixed. Part 4 owns the new
plan/Today leaf modules; the Part 1 owner integrates their props and artifacts.

| Action | File | Change |
| --- | --- | --- |
| Change | `apps/web/package.json` | Add `@rehabify/clinical-rules: "workspace:*"`. |
| Change | `pnpm-lock.yaml` | Refresh only through the workspace install after the dependency change. |
| Add | `apps/web/src/app/demo/plan/demo-plan-fixture.ts` | Frozen catalogs, pins, exercise presentation metadata, expected hash vector, and exact expected rejection; no React state or composer-input construction. |
| Add | `apps/web/src/app/demo/plan/compose-demo-plan.ts` | Handoff-to-input builder, canonical hash/source verification, real in-memory composer adapter, trace-code translation, cardinality checks, and fail-closed result. |
| Add | `apps/web/src/app/demo/plan/compose-demo-plan.test.ts` | Determinism, three eligible/one rejected, dosage derivation, verified-input hold, and malformed fixture tests. |
| Add | `apps/web/src/app/demo/plan/plan-review-scene.tsx` | Export `CompositionScene` for checklist/retry, `PlanReviewScene` for eligible/rejected review and approval, and the short `ApprovalScene`. |
| Add | `apps/web/src/app/demo/plan/plan-review-scene.module.css` | Clinician plan hierarchy ported from prototype patterns. |
| Add | `apps/web/src/app/demo/plan/plan-review-scene.test.ts` | Accessible rendering, real reason mapping, disabled/error states, exact version-bound approval callback. |
| Add | `apps/web/src/app/demo/today/demo-today.ts` | Guarded selector projecting only the exact approved draft plus shared patient/week/review metadata. |
| Add | `apps/web/src/app/demo/today/patient-today-scene.tsx` | Phone Today view and guarded unavailable state. |
| Add | `apps/web/src/app/demo/today/patient-today-scene.module.css` | Phone, next-action card, weekly context, and reduced-motion polish. |
| Add | `apps/web/src/app/demo/today/patient-today-scene.test.ts` | Approval gate, approved candidate identity/dosage, primary action, weekly/review context, accessibility. |
| Request from Part 1 owner | `apps/web/src/app/demo/model.ts` | Add plan artifacts/events, version-bound approval guard, Today guard, retry/reset behavior. |
| Request from Part 1 owner | `apps/web/src/app/demo/model.test.ts` | Add transition, stale approval, direct-scene, retry, and reset cases. |
| Request from Part 1 owner | `apps/web/src/app/demo/fixture.ts` | Add only patient week/review metadata and verified brief/assessment version references if not already supplied. |
| Request from Part 1 owner | `apps/web/src/app/demo/scene-contracts.ts` | Re-export Part 4 artifacts and artifact-carrying callbacks. |
| Request from Part 1 owner | `apps/web/src/app/demo/demo-shell.tsx` | Render Part 4 scenes and connect callbacks/selectors; do not add local navigation state. |
| Request from Part 1 owner | `apps/web/src/app/demo/demo.module.css` | Accept only phone-slot/scene-transition integration that cannot live in Part 4 CSS modules. |

Do not change the production plan route, approval runtime, Today route, server
read model, contracts package, or core composer unless a failing adapter test
proves an actual defect. Such a defect is a scope escalation, not opportunistic
Part 4 work.

## Ordered Tasks

1. Import the fixed Part 1 scene/event contracts and Part 3's exact
   `DemoBriefAssessmentHandoff`. Implement the single
   `buildDemoPlanInput(handoff)` boundary; do not duplicate scene state.
2. Add the web workspace dependency and verify a minimal import from
   `@rehabify/clinical-rules`.
3. Build and validate the frozen four-exercise catalogs and immutable source
   pins. Make the excluded preference produce `not_included_by_playbook`.
4. Implement canonical property ordering, Web Crypto SHA-256 hashing, the
   synchronous closure-backed `verifyInputHash`, and source-affinity
   verification.
5. Implement `composeDemoPlan` around the real composer, including result
   hash/trace validation, display mapping, truthful reason translation,
   exact-cardinality checks, and recovery-safe errors.
6. Write adapter tests before UI integration. Run them independently to catch
   the previously observed composer-test stall.
7. Extend the shared reducer with compose request/success/failure, retry, exact
   approval, Today guard, and reset. Preserve all Part 1 transitions.
8. Build the plan-review scene, then connect it to reducer state and the single
   compose effect in the shared experience.
9. Add the approved-plan-to-Today selector and assert it returns `null` for
   missing, failed, stale, or reset approval.
10. Build the patient Today scene from the selector output. Verify its first
   item ID and dosage equal the approved draft, not fixture lookalikes.
11. Apply plan/Today polish at the 1440×900 presentation viewport, then verify
    keyboard use, contrast, focus, and reduced motion.
12. Run the focused test/typecheck/build matrix, then execute the whole flow
    with normal, retry, reset, and direct-scene recovery.
13. Complete five timed rehearsals and capture timings/failures in the shared
    demo run log. Fix any failure that touches the critical path before calling
    the sprint done.

## Approval Gate and Recovery

The approval invariant is:

```text
Today visible
  iff approval.decision === "approved"
  and approval.planVersionId === draft.versionId
  and approval.inputHash === draft.inputHash
```

- Composition failure: show “Plan draft could not be prepared. No plan was
  approved or shared.” Offer `Retry composition` and presenter `Previous`.
- Double click: the reducer treats the same approval as idempotent; the button
  disables immediately.
- Stale approval after recomposition: clear approval before accepting the new
  result.
- Back navigation after approval: retain the exact approved result during the
  same run so the presenter may return to Today.
- Reset: clear composer result, approval, Today projection, animation state,
  and any stored scene marker.
- Direct jump to `patient_today`: allow only with exact approval; otherwise
  land on plan review with the guarded message.
- Refresh: follow Part 1's scene-only checkpoint policy. Restored `approved`
  or `patient_today` checkpoints normalize to plan review with the canonical
  draft and require one fresh exact approval.
- Unexpected trace code: show a generic safe recovery message and retain the
  raw code only in tests/development logging; never reinterpret it as a
  clinical reason.

## Visual Polish Ownership

Part 4 owns plan cards, rejected-rule presentation, approval footer/success
state, Today card hierarchy, weekly progress, and internal phone content.
Part 1 owns global canvas, headers, presenter controls, desktop/phone scene
slots, and cross-scene transitions. Part 2 owns voice/handoff styling; Part 3
owns brief and assessment styling.

Use shared tokens if Part 1 provides them. Otherwise port only the necessary
values from `prototype/styles.css`; do not import the global prototype
stylesheet. Plan is dense/calm, with restrained success and rejection colors.
Today is simpler/warmer with one obvious action. At 200% zoom, critical copy
and approval controls must remain reachable. With
`prefers-reduced-motion: reduce`, eliminate staged checklist motion and scene
translation without hiding state changes.

## Tests and Validation

### Focused automated tests

- Same input and reversed catalog construction yield byte-equivalent mapped
  results.
- The exact `DemoBriefAssessmentHandoff` maps to every expected
  `DeterministicPlanInput` pin; altered brief/assessment IDs or states fail
  before the composer is invoked.
- Canonicalization ignores object insertion order, while changing any brief,
  assessment, playbook, content, rule, protocol, prompt, model, organization,
  or episode pin changes the SHA-256 hash.
- `verifyInputHash` rejects a forged/reused hash, and source-affinity
  verification rejects a foreign organization, episode, or playbook owner.
- One adapter test injects/spies on the `DeterministicPlanComposer` boundary
  to prove the validated input reaches `compose` exactly once; one integration
  test runs the real `DeterministicSyntheticPlanComposer`.
- The result has exactly three eligible candidates and exactly one rejected
  candidate.
- The rejected candidate carries `not_included_by_playbook` and the approved
  plain-English mapping.
- Every displayed dosage is derived from the returned candidate.
- A mismatched result hash/evaluator/order, unknown or duplicate content pin,
  unexpected exclusion, or out-of-intersection dosage fails closed without
  dispatching `composition_succeeded`.
- Draft composition fails closed for unverified brief, unverified assessment,
  bad hash, stale pins, empty candidates, or missing expected rejection.
- Approval is impossible before a successful draft and is bound to exact
  version/hash.
- Today is unreachable before approval and after reset/recomposition.
- Today shows the exact first approved candidate, dosage, week context, and
  next review date.
- The reducer integration test dispatches `assessment_confirmed`,
  `composition_started`, `composition_succeeded`, and `plan_approved` with
  generated artifacts, proves Today preserves candidate IDs/dosage, then
  proves the selector returns `null` after stale approval or reset.
- Retry recovers from a compose failure without duplicating approval.
- All scene headings, status announcements, buttons, and focus transitions are
  keyboard/screen-reader usable.

Suggested narrow commands:

```bash
pnpm --filter @rehabify/contracts run build
pnpm --filter @rehabify/clinical-rules run build
pnpm exec vitest run packages/clinical-rules/src/deterministic-plan-composer.test.ts
pnpm exec vitest run apps/web/src/app/demo/plan/compose-demo-plan.test.ts
pnpm exec vitest run apps/web/src/app/demo/plan/plan-review-scene.test.ts
pnpm exec vitest run apps/web/src/app/demo/today/patient-today-scene.test.ts
pnpm exec vitest run apps/web/src/app/demo/model.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build
```

If a test stalls, rerun that single file with a 60-second external timeout and
inspect open handles/import build state. Do not mask the stall by deleting the
composer test from validation.

### Whole-flow manual verification

At the single `/demo` URL:

1. Complete intake by voice and arrive automatically at the brief.
2. Inspect source evidence and advance through the verified assessment.
3. Observe all three composition checks and the stable 3/1 result.
4. Explain the rejected item's plain-English clinic-playbook rule.
5. Attempt direct Today navigation before approval; confirm it is blocked.
6. Approve once; confirm the exact status changes and Today becomes available.
7. Open Today; compare its exercise ID/label/dosage to the approved first card.
8. Navigate back and forward; confirm the approved projection remains stable.
9. Reset; confirm no approval or Today data survives.
10. Repeat with reduced motion and keyboard-only navigation.
11. Repeat the entire demo after a forced composition failure/retry.
12. Verify at 1440×900 in the intended presentation browser with no horizontal
    clipping and the full phone frame visible.

### Rehearsal readiness

- Run five consecutive complete rehearsals.
- Log total time plus plan-composition, approval, and Today split.
- Target normal total under 2:45, leaving 15 seconds for recovery.
- Rehearse the direct-scene recovery path once and reset recovery once.
- Freeze the fixture, browser zoom, viewport, and presenter script after the
  fifth passing run.
- Keep a pre-opened reset `/demo` tab as the only backup; no server/data repair
  should be required.

## Dependencies and Hand-off Contracts

| From | Required hand-off |
| --- | --- |
| Part 1 shell | Canonical scene IDs, reducer/event API, quiet presenter controls, reset/direct-scene policy, focus target, desktop plan slot, and phone-frame slot. |
| Part 2 intake | Completed intake artifact and stable source IDs consumed by Part 3. |
| Part 3 brief + assessment | Exact verified brief/assessment IDs and versions in one plan-ready `DemoBriefAssessmentHandoff`. |
| Shared fixture owner | Maya identity, current week/session context, and next review date. |
| Part 4 to shell | `PlanReviewScene` and `PatientTodayScene` prop contracts, composition result, approval event, Today selector, retry/reset expectations. |
| Part 4 to rehearsal owner | Stable 3 eligible/1 rejected result, approved first item, expected recovery copy, and timing checkpoints. |

No downstream owner should import Part 4's raw composer catalogs. They consume
only `DemoPlanDraft`, `DemoApproval`, and `DemoTodayView`.

## Risks and Tradeoffs

| Risk/tradeoff | Decision or mitigation |
| --- | --- |
| “Rejected due to assessment” would be a stronger story but is not implemented by the composer. | Use the truthful `not_included_by_playbook` exclusion. Explain that deterministic clinic rules constrained the draft. |
| Three eligible items require more fixture content than current shared synthetic catalogs provide. | Keep the extension demo-local and validated; do not broaden production fixtures for presentation labels. |
| Web-to-clinical-rules dependency may expose build-order issues. | Add the explicit workspace dependency and validate package builds before web typecheck. |
| Animated checks can imply work that already completed synchronously. | Treat animation as a short explanatory reveal, never as causal processing, and make reduced motion immediate. |
| Local approval is not a production approval record or consent activation. | Label the entire route synthetic and say “approved for this demo”; do not claim persistence or production activation. |
| Presenter direct navigation can bypass the product gate. | Route guards apply to presenter navigation too; recovery returns to review rather than fabricating approval. |
| Today can become a disconnected mock. | Build it only from the exact approved draft selector and assert candidate identity/dosage in tests. |
| Shared-file edits may collide across Parts 1–3. | Part 4 owns leaf modules; send reducer/experience/CSS integration patches to the respective owners or coordinate before editing. |
| Styling expands beyond the sprint. | Limit polish to the two live scenes and the shared transition seams visible in the three-minute path. |

## Done Criteria

- The existing composer runs in memory with no external dependency.
- The stable fixture always yields three eligible items and one rejected item.
- The visible rejection reason maps to a real trace code and uses plain
  English.
- Composer holds or fixture mismatches fail closed and offer a working retry.
- The plan review clearly distinguishes draft, deterministic constraints, and
  clinician decision.
- Approval is explicit, idempotent, and bound to the exact draft version/hash.
- Today cannot be opened or rendered from draft-only state.
- The final Today view is projected from the approved plan and shows the same
  first exercise and dosage.
- The plan scene is polished at clinician desktop width; Today is polished in
  the shared phone frame.
- Keyboard, focus, contrast, reduced motion, reset, back/forward, and guarded
  direct-scene recovery are verified.
- Focused composer/adapter/component/reducer tests pass.
- Web typecheck and production build pass.
- The complete Part 1–4 flow passes five consecutive rehearsals, normally
  finishes under 2:45, and has a documented three-minute presenter script.
- No application code outside the agreed `/demo` leaf modules and shared
  integration files is changed for this slice.
