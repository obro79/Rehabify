# YC Demo Part 2: Voice Intake and Brief Handoff

> **Rehabify repository override:** use
> `docs/specs/2026-07-27-yc-demo-rehabify-execution.md` for the lower-back
> fixture, `useVapi` reuse boundary, live Vapi/fallback behavior, exact
> `src/app/demo/voice/` ownership, commands, and landing policy. The detailed
> interaction guidance below remains product intent.

Status: implementation-ready slice plan
Date: 2026-07-27
Owner boundary: unified demo intake scene and its transition into the brief
Sprint budget: 1–2 days
Runtime boundary: synthetic fixture only; no clinical use

## Objective

Put the existing, real browser microphone interaction inside `/demo`, use each
successful voice turn to accept the next predetermined Maya knee-intake answer,
and automatically move from the last required answer through a short
`Preparing your clinician summary...` state into the clinician brief.

The audience should see a credible patient interaction: microphone permission,
live listening feedback, explicit stop/cancel, question progress, and a clean
handoff. The implementation remains deterministic and demo-safe: no STT
provider, transcript, database, background job, or mutable shared state is on
the live path.

Success means both voice and text fallback produce the same immutable,
source-linked intake result expected by the Part 3 brief.

## Non-goals

- Do not build or display transcript review.
- Do not add production STT/TTS, model, database, authentication, upload, or
  recovery-job integration.
- Do not persist raw audio or expose an audio replay control.
- Do not reuse the standalone intake pages wholesale or preserve their
  engineering-harness chrome.
- Do not reproduce the `intake-demo` final-review, correction-history, or
  explicit confirmation walkthrough in the three-minute narrative.
- Do not implement the internals of the clinician brief, assessment, composer,
  approval, or Today scenes.
- Do not change production intake contracts merely to support the demo.
- Do not infer clinical facts from voice content. A successful recording is
  only a user gesture that selects the fixture answer for the current prompt.

## Current Code and Reuse Map

| Path | Current behavior | Part 2 decision |
| --- | --- | --- |
| `apps/web/src/app/intake-voice-demo/browser-voice-capture.ts` | Framework-independent controller for permission, recording, VAD level, duration/size limits, abort, track cleanup, and one-shot memory-only audio consumption. | Reuse unchanged. Construct it inside the demo intake component and turn successful consumption into a fixture-answer event. |
| `apps/web/src/app/intake-voice-demo/browser-voice-capture.test.ts` | Covers denial/missing device, limits, stop timeout, revoked permission, cancel/dispose, VAD behavior, and memory release. | Keep as the controller regression suite; do not duplicate its exhaustive cases in `/demo`. |
| `apps/web/src/app/intake-voice-demo/voice-control-state.ts` | Maps capture phase and mode to accessible primary actions and a single announcement path. | Reuse directly, or extract only if the demo view cannot import it cleanly. |
| `apps/web/src/app/intake-voice-demo/intake-voice-demo.tsx` | Contains a reusable-looking `IntakeVoiceControlView`, but its question, accepted count, receipt copy, and callbacks are demo-hard-coded; successful capture records metadata only. | Reuse interaction/copy patterns, not the top-level page. Prefer extracting a presentation component only if that is less work than a focused `/demo` view. Remove engineering labels and the receipt beat from the YC path. |
| `apps/web/src/app/intake-voice-demo/intake-voice-demo.test.ts` | Verifies native mode controls, focus transfer, one live region, denial recovery, non-transcript processing copy, touch targets, and reduced motion. | Preserve. Add integration tests around the new `/demo` adapter rather than weakening these assertions. |
| `apps/web/src/app/intake-demo/model.ts` | Uses `QuestionGraphInterpreter`, accepted responses, missing fields, confirmations, provenance revisions, simulated refresh, and a final-review workflow. | Reuse graph/progress concepts only. Do not put its confirmation and final-review beats into the YC path. The demo fixture should already define the accepted values and evidence IDs. |
| `apps/web/src/app/intake-demo/model.test.ts` | Demonstrates deterministic completion, explicit missing answers, provenance coverage, correction invalidation, and reset/recovery behavior. | Use as reference for reducer tests, especially terminal detection and preservation of accepted answers. |
| `packages/contracts/src/intake-session.ts` | Production-shaped session statuses and answer/source contracts; `complete` is terminal and missing is explicit. | Align names and semantics where useful, but keep the YC adapter local to `/demo`. |
| `packages/contracts/src/intake-voice-recovery.ts` | Public recovery states all preserve accepted answers and keep text fallback available. | Carry those guarantees into the UI; do not invoke the production recovery path. |
| `packages/contracts/src/intake-voice-turn.ts` | Production-shaped voice/STT outcomes and provider metadata. | Deliberately do not use: the YC path has no transcript or provider call. |
| `apps/web/src/app/prototype/model.ts` and `model.test.ts` | Pure reducer, explicit events, deterministic restart/navigation, and test patterns. | Follow this reducer/event style for shell integration and recovery. |
| `apps/web/src/app/clinician/episodes/[episodeId]/brief/brief-workspace.tsx` | Production-shaped clinician brief hierarchy and source affordances. | Part 3 owns its adaptation; Part 2 supplies only the completed intake artifact and transition event. |

The controller's `consumeUtterance` callback is the truthful success boundary:
audio exists only within that callback, is checked/released, and is never
interpreted. Part 2 must not describe this as transcription. Audience-facing
copy can say `Answer captured` or `Got it`; a small persistent banner labels
the whole experience as a synthetic demo.

## Proposed Demo Data, Events, and Interfaces

Part 1 owns the unified state machine, `model.ts`, `fixture.ts`,
`scene-contracts.ts`, and `demo-shell.tsx`. Part 2 owns transient capture,
prompt-progress, and text-draft state inside the intake scene. Only one
immutable completed artifact crosses into the shell.

```ts
export interface DemoIntakePrompt {
  readonly id: string;
  readonly field: string;
  readonly question: string;
  readonly fixtureAnswer: string;
  readonly displayAnswer: string;
  readonly sourceId: string;
  readonly required: true;
}

export interface DemoIntakeAnswer {
  readonly promptId: string;
  readonly field: string;
  readonly value: string;
  readonly displayValue: string;
  readonly sourceId: string;
  readonly inputMode: "voice" | "text";
}

export interface CompletedDemoIntake {
  readonly patientId: string;
  readonly episodeId: string;
  readonly graphVersion: "yc-maya-knee-v1";
  readonly answers: readonly DemoIntakeAnswer[];
  readonly missingFields: readonly string[];
  readonly completed: true;
}
```

Use 2–3 short prompts, totaling roughly 20–25 seconds in rehearsal. The exact
answers live in the shared Maya fixture, not in the voice component. Include
the one intentionally unknown fact in `missingFields`; do not ask a prompt
whose demo answer must be visibly missing unless that omission reads naturally
and does not add time.

The shared reducer accepts only the completed cross-scene artifact:

```ts
{ readonly type: "intake_completed"; readonly intake: CompletedDemoIntake }
```

Part 2 local-state and Part 1 reducer invariants:

1. Local answer acceptance resolves the current prompt against the shared
   fixture; it never accepts arbitrary audio-derived clinical content.
2. A prompt is accepted once. Duplicate callback delivery is
   idempotent.
3. The scene calls `onComplete` only when every required prompt has an answer.
4. Completion stores one `CompletedDemoIntake` and moves atomically from
   `patient_intake` to `preparing_brief`.
5. Only Part 1's nonce-matched `preparation_elapsed` event may move
   `preparing_brief` to
   `brief_review`.
6. Reset remounts the scene, discards local intake progress, cancels active
   capture/timers, clears the artifact, and returns to the first prompt.
7. Part 3 reads `completedIntake`; it does not parse component-local state,
   capture metadata, raw audio, or transcript text.

Component boundary:

```ts
interface DemoVoiceIntakeProps {
  readonly prompts: readonly DemoIntakePrompt[];
  readonly completedIntake: CompletedDemoIntake | null;
  readonly onComplete: (intake: CompletedDemoIntake) => void;
}
```

The capture component owns accepted-answer progress and constructs the artifact
from fixture IDs only. The shell validates/stores it and treats repeated
`onComplete` calls with the same artifact as no-ops. If presenter Previous
returns to intake after completion, `completedIntake` lets the scene render a
stable completed state instead of recreating capture progress.

## User Flow and Timing

1. Enter `patient_intake` with the first question focused and voice selected.
2. `Answer by voice` requests permission. While listening, show elapsed time,
   local input level, explicit `Stop`, `Cancel`, and `Type instead`.
3. On `Stop`, show `Capturing your answer...` while the one-shot consumer
   validates metadata and releases audio. Do not say transcribing, analyzing,
   or generating.
4. On consumer success, accept the current fixture answer in local scene state.
   Briefly show `Got it` (target 350–500 ms), then advance focus to the next
   question. Do not show a transcript or editable voice result.
5. On the last accepted answer, skip the normal inter-question delay, construct
   the completed artifact, and enter `preparing_brief` within 250 ms.
6. Render a dedicated, full-scene handoff for 1.2 seconds:
   `Preparing your clinician summary...`, a subtle progress indicator, and
   `Organizing the information you shared.` The synthetic safety label remains
   visible.
7. Dispatch Part 1's nonce-matched `preparation_elapsed` event and enter `brief_review`
   automatically. Focus the brief heading. No presenter click is required.

Timing constants should be named and colocated with the demo model:

```ts
export const DEMO_INTAKE_ACCEPT_DELAY_MS = 400;
export const DEMO_BRIEF_HANDOFF_MS = 1_200;
```

For `prefers-reduced-motion`, remove animated movement but retain the handoff
state and its readable duration. Tests should use fake timers. Do not use
CSS-animation completion as business logic.

## Voice-agent behavior

For this sprint, “voice agent” means a scripted, turn-based intake experience,
not an open-ended conversational agent. The product owns the next prompt; the
patient owns when recording starts and stops; successful capture accepts the
current prompt's predetermined fixture answer and advances the script.

### P0: required live-demo loop

1. Render the next ordered fixture prompt visually and announce it once through
   the polite live region. Focus the prompt heading when the scene opens and
   after each accepted turn.
2. Let the patient explicitly start the microphone, then show
   `requesting_permission` and `listening` states with elapsed time and local
   input-level feedback.
3. Keep `Stop recording`, `Cancel`, and `Type instead` available according to
   the existing controller state. Local VAD may suggest stopping but must never
   auto-stop or accept a turn.
4. Treat successful one-shot audio consumption as turn acceptance only. Map it
   to the current fixture answer without STT, semantic interpretation, or an
   editable transcript.
5. Announce `Got it`, advance automatically to the next scripted prompt, and
   return the controller to an idle turn. Never start the next recording
   automatically.
6. After the final accepted turn, complete automatically and enter the
   `preparing_brief` handoff with no transcript-review or confirmation beat.
7. On denial, unsupported media, cancellation, or capture failure, keep the
   current prompt and accepted turns intact and expose the equivalent text
   fallback.

This is intentionally push-to-talk. P0 has no wake word, continuous listening,
barge-in, agent-generated follow-up, LLM routing, silence-based submission, or
claim that Rehabify understood the spoken words. Audience copy and presenter
language must say the browser capture is real and the example-case mapping is
synthetic and deterministic.

### P1: optional, non-blocking polish

Spoken prompt playback is **out of P0**. Prompts are visible text plus screen
reader announcements; the application does not speak them aloud during the
required demo path. If rehearsal shows that audible prompts materially improve
the story, a separate P1 may add a user-initiated `Play question` control using
fixed synthetic prompt audio or a browser-local mechanism. It must not add a
provider dependency, auto-play, overlap microphone capture, alter prompt
ordering, or become required for completion. Do not schedule this P1 until the
full P0 voice-to-brief path is reliable five times in a row.

## Recovery, Permission, and Error Behavior

| Condition | Required behavior |
| --- | --- |
| Browser unsupported or no microphone | Detect on mount, select/focus text mode, disable voice, preserve progress, and state that typing completes the same intake. |
| Permission denied | Show one `role="alert"` without leaking browser error text. Offer `Type instead` as primary and `Try microphone again` as secondary. Prior answers stay accepted. |
| Permission revoked/track ended | Discard the active turn, keep current prompt and prior answers, then offer retry or text. |
| Empty, too long, too large, recorder failure, or stop timeout | Reuse controller copy/issue classification. Never advance the prompt. Offer retry and text fallback. |
| User cancels | Discard active audio, remain on the same prompt, announce that accepted answers are unchanged. |
| Switch to text while capturing | Cancel capture first, then focus the text field. |
| Text fallback | Require non-blank input for the current prompt, but map submission to that prompt's fixture answer. Show helper copy: `For this synthetic demo, typing advances the same example case.` Do not propagate arbitrary text into the clinician brief. |
| Component unmount, reset, page hide, scene jump | Cancel/dispose the controller and clear the local accept timer so no late callback advances a different scene. Part 1 owns the handoff timer. |
| Direct presenter jump to brief | Part 1 must seed the same canonical `CompletedDemoIntake` from the fixture before entering `brief_review`. Part 3 never receives an absent/partial artifact. |
| Refresh | Follow Part 1's scene-only checkpoint policy. A restored brief seeds the canonical completed artifact; intake itself restarts idle at prompt one. Never restore audio, text drafts, capture phase, or timers. |

The UI must keep exactly one announcement path per transition: failure via a
single assertive alert; normal capture/progress via one polite live region.

## Exact Files to Add or Change

Part 1's canonical shared names are fixed: `model.ts`, `model.test.ts`,
`fixture.ts`, `scene-contracts.ts`, `demo-shell.tsx`, and
`demo-shell.test.ts`.

### Add

- `apps/web/src/app/demo/demo-voice-intake.tsx` — microphone/text interaction,
  prompt rendering, controller lifecycle, and adapter callbacks.
- `apps/web/src/app/demo/demo-voice-intake.test.ts` — integration tests for
  voice success, text fallback, permission denial, cancellation, completion,
  focus, and late-callback protection.
- `apps/web/src/app/demo/demo-voice-intake.module.css` — voice-scene layout,
  fixed-height capture states, meter, modes, controls, focus, and error
  treatments using Part 1's shared demo tokens.
- `apps/web/src/app/demo/demo-preparing-brief.tsx` — accessible, timer-agnostic
  handoff presentation.
- `apps/web/src/app/demo/demo-preparing-brief.test.ts` — rendering and
  reduced-motion/accessibility assertions if these are not covered in the shell
  test.
- `apps/web/src/app/demo/demo-preparing-brief.module.css` — add only if the
  handoff's small local layout would otherwise pollute the shared module.

### Integration requests for the Part 1 owner

- `apps/web/src/app/demo/model.ts` — store `CompletedDemoIntake`, guard
  idempotent completion, and own the nonce-safe `preparing_brief` transition.
- `apps/web/src/app/demo/model.test.ts` — prove completion, handoff,
  direct-jump seeding, reset, and stale-timer invariants.
- `apps/web/src/app/demo/fixture.ts` — define the ordered prompts, fixture
  answers, source IDs, graph version, and intentional missing field. Fixture
  ownership remains Part 1; do not duplicate values locally.
- `apps/web/src/app/demo/demo-shell.tsx` — render `DemoVoiceIntake` for
  `patient_intake`, render `DemoPreparingBrief` for `preparing_brief`, own the
  handoff timer/effect, and focus the destination. Part 1 owns this file.
- `apps/web/src/app/demo/scene-contracts.ts` — re-export
  `CompletedDemoIntake` and the artifact-carrying callback.
- `apps/web/src/app/demo/demo.module.css` — accept only shared-frame/handoff
  styles that cannot stay local to the voice component.

### Reuse unchanged unless extraction is demonstrably smaller

- `apps/web/src/app/intake-voice-demo/browser-voice-capture.ts`
- `apps/web/src/app/intake-voice-demo/voice-control-state.ts`

Avoid editing the standalone `intake-voice-demo` and `intake-demo` pages during
this sprint. If `IntakeVoiceControlView` extraction is selected, move only the
generic presentation primitives into
`apps/web/src/app/intake-voice-demo/intake-voice-control.tsx`, update the
existing page/tests, and keep YC-specific prompt/fixture logic under `/demo`.

## Ordered Implementation Tasks

1. Reconcile the exact Part 1 `DemoState`, event names, fixture shape, reset,
   presenter jump, and timer ownership before writing components.
2. Add ordered Maya prompts and source IDs to the canonical fixture. Assert
   unique prompt/source IDs and at least one intentional missing field.
3. Send the Part 1 owner the completed-artifact contract plus the idempotent
   completion, `preparing_brief`, reset, and direct-jump test cases.
4. Build `DemoVoiceIntake` around `BrowserVoiceCaptureController`. Reuse capture
   limits, issues, announcements, input meter, explicit stop/cancel, and
   lifecycle cleanup.
5. In the one-shot audio consumer, validate only the existing metadata/audio
   size relationship, release the lease, and notify fixture acceptance. Do not
   retain the `Blob` or add a fake transcript.
6. Add complete text fallback and focus behavior. Map valid submission to the
   same current fixture answer.
7. Connect progress (`Question n of m`, accepted count, progress bar) to local
   scene state. On each accepted turn, announce acceptance once, focus the next
   prompt heading, and return capture to idle without auto-starting the mic.
   Prevent rapid double stop/submit and stale callbacks.
8. Add automatic final-answer completion and the timer-driven preparing state.
   Clear both timers on reset/unmount/scene change.
9. Wire the timer-agnostic handoff view into the Part 1 shell; use the existing
   presenter reset/scene menu for rendering recovery instead of inventing a
   synthetic handoff-failure state.
10. Apply the calm patient-intake styling, 48 px targets, visible focus,
    sufficient contrast, and reduced-motion behavior.
11. Run focused unit/component tests, web typecheck, build if feasible, then
    rehearse allowed, denied, unsupported, cancel/retry, and text-only paths.

## Tests and Validation

### Reducer/model

- Voice and text events resolve to identical values/source IDs except
  `inputMode`.
- An answer cannot be applied to a non-current prompt or twice.
- Partial intake cannot enter `preparing_brief`.
- Final accepted answer creates exactly one immutable completed artifact.
- `preparing_brief` can only advance to `brief_review`.
- Reset clears progress/artifact and returns to `patient_intake`.
- Direct brief recovery seeds the canonical completed artifact.

### Component integration

- Supported microphone: start → listening → stop → ephemeral consumption →
  next prompt.
- Fixture prompts render in their locked order; a successful turn accepts only
  the current prompt's fixture answer.
- Each accepted non-final turn announces `Got it`, focuses the next prompt, and
  leaves its microphone idle until the patient starts it.
- Last voice success automatically reaches `preparing_brief`, then
  `brief_review` under fake timers without a review click.
- Text-only completion reaches the same artifact and brief.
- Permission denial exposes one alert, preserves accepted count, and focuses
  text fallback.
- Unsupported browser starts in focused text mode.
- Cancel, revoked permission, empty recording, and controller failure do not
  advance.
- Switching mode cancels active capture.
- Reset/unmount/page hide disposes capture and prevents late acceptance.
- No YC intake or handoff text includes `transcript`, `transcribing`, or a claim
  that the spoken content was understood.
- One polite live region is used for normal progress; error states use one
  assertive alert.
- P0 renders no audible prompt playback/auto-play control and makes no
  STT/understanding claim; screen reader announcement of visible prompt text
  remains supported.
- Keyboard operation, visible focus, 48 px targets, and reduced motion remain
  covered.

### Commands

Run the narrowest tests first because broader repository validation has
previously stalled:

```sh
pnpm exec vitest run apps/web/src/app/intake-voice-demo/browser-voice-capture.test.ts
pnpm exec vitest run apps/web/src/app/intake-voice-demo/intake-voice-demo.test.ts
pnpm exec vitest run apps/web/src/app/demo/model.test.ts
pnpm exec vitest run apps/web/src/app/demo/demo-voice-intake.test.ts
pnpm --filter @rehabify/web run typecheck
pnpm --filter @rehabify/web run build
```

If typecheck/build or a focused test stalls, record the exact command and last
output rather than expanding scope into unrelated repository repair.

Manual validation matrix:

- Chrome with microphone allowed.
- Chrome with permission denied, then text fallback.
- Unsupported media APIs.
- Cancel and retry on prompt two.
- Reset while listening.
- Direct presenter recovery to brief.
- Five consecutive full voice-to-brief rehearsals; intake plus handoff should
  stay under 40 seconds, with the handoff itself about 1.2 seconds.

## Contracts with Adjacent Parts

### Part 1 shell/state provides to Part 2

- The current `DemoScene`.
- The canonical Maya fixture and ordered intake prompts.
- The `completedIntake` artifact when returning to an already completed scene.
- An idempotent `onComplete(completedIntake)` callback.
- Global reset and presenter scene-selection behavior.
- Timer scheduling in `demo-shell.tsx`, outside the pure reducer.

Part 2 must not create a nested competing demo state machine or navigate with
`router.push`. Scene changes occur through Part 1 events.

### Part 2 provides to Part 3 brief

- A complete, deterministic `CompletedDemoIntake`.
- Stable field and source IDs that the brief fixture can reference.
- Explicit `missingFields`; unknown values stay unknown.
- The guarantee that `brief_review` is never entered from normal flow without
  a complete artifact.
- The guarantee that neither transcript text nor raw audio is required.

Part 3 may derive its display model through a pure adapter:

```ts
buildDemoBrief(fixture: DemoFixture, intake: CompletedDemoIntake): DemoBrief
```

The brief must source its material facts from `answers[].sourceId` and its
unknown card from `missingFields`; it must not inspect `inputMode` to change
clinical content.

## Risks and Tradeoffs

| Risk/tradeoff | Decision or mitigation |
| --- | --- |
| A recording advances a predetermined answer, which could be mistaken for speech understanding. | Keep the demo visibly synthetic, never show a transcript, and use precise presenter language: the browser interaction is real; the case mapping is deterministic. |
| Reusing `IntakeVoiceControlView` carries engineering copy and hard-coded state. | Reuse controller/state logic first; extract presentation only if it saves time. Do not ship the current standalone chrome in `/demo`. |
| The existing text graph requires confirmations and final review, slowing the narrative. | Use its state concepts, not its full workflow. The fixture supplies already-defined accepted facts and source IDs. |
| React effects can double-run and timers/callbacks can race. | Make local acceptance and the shell's completion event idempotent, use current-prompt tokens/refs, clear timers, and test late callbacks and Strict Mode behavior. |
| Permission prompts vary by browser and rehearsal state. | Rehearse in the presentation browser/profile and keep text fallback first-class at every prompt. |
| Text fallback accepts arbitrary prose but the brief is deterministic. | Say this plainly in synthetic-demo helper copy and store only the fixture answer plus `inputMode`; never imply arbitrary text was interpreted. |
| Automatic handoff can strand the presenter if rendering fails. | Keep preparation state nonce-safe and use Part 1's reset/direct-scene recovery; do not add a fake timer-failure branch. |
| Concurrent work can duplicate fixture/types or conflict in shared shell files. | Part 1 owns shell/model; Part 3 consumes the artifact; Part 2 owns voice/handoff components. Agree names before shared-file edits. |

## Done Criteria

- `/demo` starts on a polished patient intake using the real browser capture
  controller.
- Voice shows permission, listening level, elapsed time, stop, cancel, bounded
  capture, and memory-only cleanup.
- Every successful voice turn advances exactly one deterministic fixture
  prompt; no transcript is created or reviewed.
- The ordered prompt → listen → explicit stop/cancel → accept → next-prompt
  loop is complete, and the microphone never auto-starts between turns.
- Text fallback is always reachable and completes the identical case.
- Permission denial, unsupported media, revoked permission, capture errors,
  cancel, reset, and navigation preserve prior accepted answers and never
  falsely advance.
- The final required answer automatically creates one complete intake artifact
  and enters `preparing_brief`.
- The preparation scene lasts about 1.2 seconds and automatically opens the
  brief, with stale-timer/reset behavior tested in Part 1.
- Part 3 receives stable answer/source IDs and explicit missing fields, with no
  dependency on raw audio, transcript, or component-local state.
- Presenter direct recovery to brief produces the same canonical artifact.
- Focus, announcements, keyboard controls, touch targets, and reduced motion
  are validated.
- Spoken prompt playback is not required or shipped in P0; any later P1 remains
  user-initiated, provider-free, and independent of intake completion.
- Focused tests, web typecheck, and build pass, or any infeasible broader check
  is reported with the exact reason.
- Five consecutive allowed-microphone and at least one denied-microphone
  rehearsal complete reliably inside the 40-second intake-and-handoff budget.
