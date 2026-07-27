# YC Demo UI Improvement Plan

> **Rehabify repository override:** apply this visual intent through the
> existing Tailwind sage/sand/terracotta tokens and `src/components/ui`
> primitives named in
> `docs/specs/2026-07-27-yc-demo-rehabify-execution.md`. Do not port
> monorepo-only CSS or production data access.

Status: implementation-ready visual integration plan
Date: 2026-07-27
Scope: the unified `/demo` route only
Runtime boundary: deterministic synthetic data; no clinical use
Constraint: polish the existing calm clinical direction; do not redesign it

## Outcome

Make the three-minute demo read as one product, at presentation distance, without
adding narrative beats or visual spectacle. The audience should always be able to
answer three questions:

1. Whose episode is this, and which surface am I seeing?
2. What changed because of the last action?
3. What is the one action that moves the product story forward?

This plan is subordinate to the master plan and Parts 1–4. It does not change
their state, clinical, fixture, approval, or ownership contracts.

## Visual principles

1. **Calm clinical utility.** Keep Plus Jakarta Sans, pale neutral-green
   surfaces, dark green ink, restrained borders, small radii, and sparse
   elevation. Do not introduce a new brand style.
2. **Evidence before decoration.** Patient story, unknown fact, verified finding,
   deterministic rejection, approval boundary, and approved Today item receive
   visual emphasis. Ornament does not.
3. **One scene, one primary action.** Product actions and presenter navigation
   must never compete. A scene may have several controls, but only one filled
   brand button.
4. **Continuity over novelty.** Maya, right knee, episode context, state labels,
   geometry, and semantic colors stay stable as scenes change.
5. **Desktop density, phone simplicity.** Clinician views may use compact
   13–15 px supporting text and two-column information architecture; the patient
   view uses 16 px body text, larger controls, shorter copy, and one next action.
6. **State is explicit.** Color may reinforce `Unknown`, `Not tested`, `Draft`,
   `Not eligible`, `Approved`, and `Ready`, but visible text must carry meaning.
7. **Motion explains cause and effect.** Use only short opacity/transform
   transitions. Never use animation to imply model work, safety, or approval.
8. **Demo chrome stays outside the product.** Presenter controls are neutral,
   compact, labelled `Presenter`, and visually separated from the Rehabify frame.

## Current reusable source map

These are references, not instructions to import the static prototype or copy
whole production workspaces.

| Source | Reuse exactly | Adapt or omit |
| --- | --- | --- |
| `prototype/styles.css:1-32` | Light palette, sidebar colors, radii, focus color, floating shadow | Rename into `/demo`-scoped semantic tokens; omit dark theme for the live route unless already free |
| `prototype/styles.css:187-321` | Quiet top-bar separation, segmented-control geometry, primary/secondary/text action hierarchy | Raise interactive targets to the rules below; presenter bar must not look like product navigation |
| `prototype/styles.css:946-1138` | Episode heading/tabs, 1fr + 310 px brief grid, bordered section stack, fact grid, review rail, form geometry | Remove unrelated episode actions and the second prototype warning |
| `prototype/styles.css:1147-1224` | Ordered plan rows, reason lines, attached approval footer | Add a visually secondary rejected-rule panel; keep only approval as the filled CTA |
| `prototype/styles.css:1307-1535` | Centered patient frame, 48 px patient controls, Today heading, exercise card, weekly progress/session rows | Target 390×760 content; omit prototype media if rights/status copy distracts from the endpoint |
| `prototype/index.html:222-266` | Maya episode identity, brief story/symptom/goal order, assessment/plan hierarchy | Replace `Open transcript`, extra warning, and disabled prototype approval with Parts 3–4 behavior |
| `prototype/index.html:315-349` | `Good morning, Maya`, Today hierarchy, next exercise, weekly context, review note | Render only from the exact approved draft; remove prototype jump and unrelated patient navigation |
| `prototype/app.js` | Visual-state reference only | Reuse no imperative DOM mutations, theme switching, consent modal, or role/view controller |
| `apps/web/src/app/globals.css` | Plus Jakarta Sans, box sizing, 16 px/1.5 base, global 3 px focus treatment | Do not expand global styles for demo polish |
| `apps/web/src/app/layout.tsx` | Existing font weights 400/500/600/700 and `font-display: swap` | No layout change required |
| `apps/web/src/app/prototype/prototype-navigator.tsx` | Focus restoration, keyboard-index behavior, single live announcement approach | Do not reuse usability-lab rail, progress list, state preview, or completion chrome |
| `apps/web/src/app/prototype/prototype.module.css` | Restrained cards, tabular progress, 180 ms progress transition, accessible state patterns | Do not reuse radial gradient, 48 px showcase title, or large floating workspace as the demo style |
| `apps/web/src/app/intake-voice-demo/intake-voice-demo.tsx` | Capture-state structure, one polite live region, explicit stop/cancel/type fallback, visible question | Remove engineering IDs, readiness badge, receipt metadata, and standalone-page header |
| `apps/web/src/app/intake-voice-demo/intake-voice-demo.module.css` | 48 px controls, selected voice/type state, meter, error panel, text fallback, reduced-motion rules | Restyle with shared demo tokens; avoid the standalone page's separate palette |
| `apps/web/src/app/clinician/episodes/[episodeId]/brief/brief-workspace.tsx` and `.module.css` | Recorded/missing semantics, bounded source inspector, focus trap, Escape and focus restoration, 44 px controls | Do not port API/loading/revision/rejection/attestation density |
| `apps/web/src/app/clinician/episodes/[episodeId]/assessment/assessment-workspace.tsx` and `.module.css` | Explicit recorded/missing/not-tested treatments, field labels, 44 px controls, sticky-action concept | Reduce the three-column/full-section workspace to the demo's three blocks and one editable finding |
| `apps/web/src/app/clinician/episodes/[episodeId]/plan/plan-review-workspace.tsx` | Loading/error focus and approval-boundary language | Do not reuse the current dense technical workspace or its minimal one-line CSS |
| `apps/web/src/app/patient/today/today-screen.tsx` and `today.module.css` | Guarded state semantics and dosage formatting | Do not reuse technical-readiness copy or flat desktop panel as the YC closing screen |

Canonical sources are paths without ` 2` or ` 3`. Duplicate untracked files are
never edited, moved, deleted, or staged.

## Shared visual contract

Part 1 owns the contract in `apps/web/src/app/demo/demo.module.css`. Scene CSS
modules consume variables from the shared demo root and may define layout-only
local variables. They must not introduce competing palettes.

### Color

Use the prototype's proven light values:

```css
--demo-canvas: #f5f7f6;
--demo-surface: #ffffff;
--demo-surface-subtle: #ebf0ed;
--demo-surface-strong: #e2e7e4;
--demo-ink: #18201c;
--demo-ink-secondary: #4c5b53;
--demo-ink-tertiary: #65736c;
--demo-border: #c9d2cd;
--demo-border-strong: #89978f;
--demo-brand: #16624d;
--demo-brand-hover: #0f4f3e;
--demo-brand-soft: #e4f3ed;
--demo-link: #075ea8;
--demo-success: #11623b;
--demo-success-soft: #e4f4ea;
--demo-warning: #7a4700;
--demo-warning-soft: #fff2d6;
--demo-danger: #a32936;
--demo-danger-soft: #fce8ea;
--demo-focus: #0068b2;
```

- Verify every normal/body foreground-background pair at **4.5:1 or better**.
- Use dark ink for copy inside tinted panels; do not assume the semantic hue
  itself passes for small text.
- Unknown uses `Unknown from intake` plus warning styling; rejected uses `Not
  eligible` plus reason; approved uses `Approved` plus success styling.
- The synthetic/non-clinical boundary remains persistent but quiet: one
  compact note per frame, not repeated inside every card.

### Typography

- Family: inherited Plus Jakarta Sans only; no display or monospace font except
  tabular timer/debug-like presenter numbers.
- Desktop scene title: 28 px/1.2, 600. Section title: 18–20 px/1.3, 600.
  Body: 15 px/1.55. Metadata/labels: 12–13 px/1.4, 600–700.
- Patient title: 28 px/1.2. Patient body and controls: at least 16 px/1.5.
- Use uppercase tracking only for short eyebrows; never for sentences.
- Keep narrative copy to roughly 65–75 characters per line on desktop and
  35–60 in the phone frame. Use tabular figures for elapsed time and counts.

### Spacing, geometry, elevation

- Spacing scale: `4, 8, 12, 16, 24, 32, 48` px. Use 12 px for compact
  within-card relationships, 16 px for card padding, 24 px between sections,
  and 32 px only for scene-level separation.
- Radius scale: 4 px small status/control details, 7–8 px controls/cards,
  10–12 px outer frames. Pills are reserved for compact statuses, not buttons.
- Border is the default separation. Use one low elevation for the clinician
  product frame and one stronger elevation for the phone frame/dialog:
  `0 8px 28px rgb(16 35 28 / 8%)` and
  `0 16px 44px rgb(16 35 28 / 14%)`.
- Avoid nested shadows, glass cards, decorative blur, glowing AI treatments,
  excessive gradients, and layout-shifting hover states.

### Controls and action hierarchy

- Clinician control minimum: 44×44 px. Patient controls and the main voice
  controls: 48 px high. Maintain at least 8 px between targets.
- Filled brand button: one per scene. Secondary buttons use white surface and
  strong border. Tertiary actions are text links with underline on hover/focus.
- Destructive/cancel is not automatically red; use danger fill only for a
  genuinely destructive or stop-recording action.
- Icons are consistent 18–20 px SVG strokes with accessible labels where
  icon-only. Do not use emoji.
- Disabled state includes the native `disabled` attribute, reduced emphasis,
  and nearby text explaining the gate where necessary.

### Focus and motion

- All interactive elements use a visible 3 px `--demo-focus` outline with
  2–3 px offset. Never remove outlines without replacement.
- Scene entry moves programmatic focus to the scene heading (`tabIndex={-1}`),
  not the first CTA. Dialogs trap focus, close on Escape, and restore focus.
- Motion tokens: 150 ms fast, 200 ms standard, 280 ms scene transition;
  `ease-out` on entry and `ease-in` on exit.
- Animate only `opacity` and `transform`; reserve dimensions so transitions do
  not shift the surrounding layout. At most two elements animate per scene.
- `prefers-reduced-motion: reduce` removes transform and staged checklist
  animation, while keeping status copy and timing/state transitions legible.

## Priority under severe time pressure

### P0 — core demo clarity

These ship before any decorative polish:

1. Freeze the shared tokens, product-frame geometry, target viewports, focus
   treatment, buttons, statuses, and presenter/product separation.
2. Give every scene one obvious primary action and remove competing filled
   buttons.
3. Preserve Maya/right-knee context across clinician scenes and exact approved
   item/dosage continuity into Today.
4. Make the brief's one unknown, assessment's one required edit, composer's
   one truthful rejection, and approval gate legible without narration.
5. Ensure the voice state, permission fallback, handoff state, composition
   state, approval result, and Today availability never depend on color alone.
6. Fit the complete clinician frame and presenter bar at 1440×900 with no
   clipped action. Fit the entire 390×760 phone content inside the same viewport.
7. Meet contrast, keyboard, focus, target-size, reduced-motion, and no-layout-
   shift requirements.

### P1 — polish that improves comprehension

- Align card padding, type hierarchy, status chips, dividers, and section gaps
  across all scene-owned modules.
- Add restrained opacity/translate scene entry and causal state feedback.
- Improve source-dialog balance, composition checklist scanability, rejected
  panel grouping, approval success transition, and weekly-progress legibility.
- Add 1280×800 fallback rules that reduce outer gutters and clinician
  supporting density without shrinking controls or body contrast.
- Capture and compare a screenshot set at every narrative scene.

### P2 — optional decorative polish

Do only after five passing rehearsals:

- Subtle active-tab indicator interpolation.
- A refined, non-interactive phone bezel/speaker detail.
- Minor icon additions where text remains present.
- Fine-grained hover/pressed elevation and a gentle success check fade.

P2 explicitly excludes hero gradients, animated wave spectacles, confetti,
glow, glassmorphism, AI sparkles, illustrative background art, extra media,
dark mode, or transitions longer than 300 ms. None of these improve the core
YC argument.

## Scene-by-scene deltas

### 1. Voice intake

- Use a centered patient card, max 680 px, within the laptop-width patient
  surface. Keep the persistent synthetic note above it.
- Top row: `Question n of m` and a stable progress bar. Main hierarchy:
  question, one-line reassurance, voice/type mode, capture state, actions.
- Voice mode's filled primary action is `Answer by voice`. While listening,
  `Stop` becomes the single prominent action; `Cancel` and `Type instead` are
  secondary/tertiary. In denied/unsupported states, `Type instead` becomes the
  single primary action.
- Keep elapsed time and input meter in a fixed-height status region so
  permission → listening → captured does not move the controls.
- Remove engineering IDs, capture receipts, readiness badges, transcript
  language, and decorative waveform ideas. Show `Got it` with text and a
  restrained success mark for 350–500 ms.

### 2. Handoff

- Use one compact centered panel inside the same patient surface:
  `Preparing your clinician summary...` and
  `Organizing the information you shared.`
- Keep a fixed-size progress indicator and the synthetic note. No percentage,
  fake steps, or AI language.
- Fade the intake body out and the handoff panel in using opacity plus at most
  8 px translate over 200 ms. Preserve the 1.2-second logical state even under
  reduced motion; only the movement disappears.

### 3. Clinician brief

- The Part 1 clinician frame introduces Maya/right knee once; scene content
  begins with `Pre-visit brief`, not another oversized page header.
- Use the prototype's main-column + 310 px rail. Story comes first, then 2×2
  symptom facts, then goal. One bounded `View source` control sits beside the
  story heading.
- The right rail contains exactly one warning treatment:
  `Unknown from intake — Previous knee surgery was not provided.`
- Opening source evidence is the scene's product interaction and marks review
  readiness. It is secondary-styled because presenter Next performs navigation;
  do not add a second filled `Verify` CTA.
- Source inspector uses a modal/sheet with concise excerpt, `Patient
  confirmed` text, close control, scrim, Escape, focus trap, and focus restore.

### 4. Assessment

- Use three stacked visual groups: patient-reported context, clinician-recorded
  findings, working hypothesis. Provenance labels are always text.
- Keep patient context compact/read-only. Use a two-column findings grid where
  space permits; put the editable single-leg-squat finding first.
- `Needs confirmation` sits next to that finding. The pain control changes
  4/10 → 3/10; observation copy remains stable. `Not tested — deferred` uses
  neutral styling, not warning styling.
- `Confirm assessment` is the only filled action. Before edit it is disabled
  with visible helper text. After confirmation it becomes a stable verified
  status, fields lock, and presenter Next becomes available.
- Avoid the production workspace's section index, autosave/history, test
  controls, and fixed footer; they obscure the 25-second demo beat.

### 5. Composition and truthful rejection

- Composition uses one fixed-height checklist card with the three exact steps.
  Completed steps receive check icon plus `Complete`; color only reinforces.
- The real composer result controls state; the visual checklist never gates
  it. Reduced motion reveals final statuses immediately.
- Plan review uses three ordered eligible cards/rows and a visually secondary
  rejected panel below them. Keep label, dosage, and rationale aligned.
- Rejected panel copy leads with `Not eligible` and the exact exercise name,
  followed by the plain-English clinic-playbook reason. Raw rule code is
  optional subdued detail, not headline content.
- Footer summarizes `3 eligible · 1 rejected by clinic rule`; no hard-constraint
  jargon or source-pin dump appears in the primary view.

### 6. Approval

- In plan review, `Approve plan for Maya` is the sole filled product CTA.
  `Rehabify drafts. Deterministic rules constrain. You decide.` sits nearby as
  quiet boundary copy.
- On click, disable immediately without resizing. Announce completion and
  transition to a compact success state:
  `Approved for this synthetic demo` and
  `This exact plan is now patient-visible.`
- Do not call it active, saved to a record, consent-attested, or production
  approved. Presenter Next—not another product CTA—opens Today.

### 7. Today phone frame

- Part 1 supplies a 390×760 content viewport, 10–12 px outer radius, border,
  stronger shadow, safe 16–18 px gutters, and clipped overflow. Part 4 owns all
  content inside it.
- Hierarchy: `Good morning, Maya` → `Today` → week/session context → `Next
  exercise` card → `Start exercise` → weekly context → next review →
  `Approved by your clinician`.
- Use the exact first approved candidate and exact dosage. `Start exercise` is
  the one full-width 48 px primary action and may be a visual endpoint.
- Prefer a clean typographic exercise card if approved media is unavailable.
  Do not add rights-review labels or a placeholder image that steals attention.
- Keep weekly progress accessible with a text label and current/completed row
  labels; the bar is supplemental. No bottom navigation is required for this
  terminal scene.

### 8. Presenter controls

- Place outside the product frame in a 44 px minimum-height neutral strip.
  Left: `Presenter`. Right: Previous, Next, and `More` menu.
- Previous/Next are neutral outlined controls, never brand-filled. Hide them
  during automatic scenes as Part 1 specifies; disabled Next includes a
  concise gate reason available to assistive technology.
- Reset and scene jump live in the closed-by-default menu. The menu supports
  Enter/Space, Escape, outside click, logical tab order, and focus restoration.
- Presenter controls must not enter the phone frame, clinician tabs, or
  screenshot crop intended to represent the product.

## Viewport and density contract

Primary validation viewport is **1440×900 CSS px at 100% browser zoom** in the
presentation browser. Secondary safety viewport is **1280×800**. Accessibility
checks also run at **200% zoom** with critical actions reachable by scrolling.

- Clinician product frame: max width 1320 px; outer gutter 24–32 px at 1440,
  16 px at 1280. Prefer one document scroll region; avoid nested scrolling.
- Clinician content: dense but calm. Keep metadata compact, allow two-column
  layouts, and pin important scene action near the content end—not over it.
- Patient intake: full laptop surface with a 640–680 px readable card.
- Patient Today: a fixed presentation boundary around approximately 390×760;
  internal content may scroll if needed, but the 1440×900 closing screenshot
  must show the primary card, action, weekly context, and next review.
- Do not solve desktop fit by shrinking below the type/target rules.

## Exact implementation files and ownership

### Part 1 integration owner — only writer to shared files

Change:

- `apps/web/src/app/demo/demo.module.css` — shared tokens, canvas, clinician
  frame, patient-full surface, phone boundary, presenter strip, focus, scene
  transitions, and reduced-motion override.
- `apps/web/src/app/demo/demo-frames.tsx` — semantic frame structure, persistent
  synthetic note, clinician identity/context, phone boundary.
- `apps/web/src/app/demo/presenter-controls.tsx` — neutral hierarchy, menu
  accessibility, labels, and gate description wiring.
- `apps/web/src/app/demo/demo-shell.tsx` — heading focus targets, transition
  classes, single live-region coordination, and scene-level action separation.
- `apps/web/src/app/demo/demo-shell.test.ts` — focus, announcements, presenter
  menu, scene class, and product/presenter boundary assertions.

No changes are planned for `globals.css`, `layout.tsx`, `prototype/`, or
production-shaped routes. Shared token requests from scene owners go through
the Part 1 owner.

### Part 2 voice/handoff owner

Change:

- `apps/web/src/app/demo/demo-voice-intake.tsx`
- `apps/web/src/app/demo/demo-voice-intake.test.ts`
- `apps/web/src/app/demo/demo-preparing-brief.tsx`
- `apps/web/src/app/demo/demo-preparing-brief.test.ts`

Add:

- `apps/web/src/app/demo/demo-voice-intake.module.css` — all voice-scene-local
  layout and state styling, consuming Part 1 tokens.
- `apps/web/src/app/demo/demo-preparing-brief.module.css` — only if the
  handoff's few local rules would otherwise pollute the shared module.

Part 2 does not edit `demo.module.css`, shell, frame, fixture, or presenter
files.

### Part 3 brief/assessment owner

Change the already planned leaf files:

- `apps/web/src/app/demo/clinician-brief-scene.tsx`
- `apps/web/src/app/demo/clinician-assessment-scene.tsx`
- `apps/web/src/app/demo/brief-assessment.module.css`
- their corresponding component tests

Part 3 owns source-dialog and scene layout styles only; it does not restyle
the clinician frame or shared actions globally.

### Part 4 plan/Today owner

Change the already planned leaf files:

- `apps/web/src/app/demo/plan/plan-review-scene.tsx`
- `apps/web/src/app/demo/plan/plan-review-scene.module.css`
- `apps/web/src/app/demo/plan/plan-review-scene.test.ts`
- `apps/web/src/app/demo/today/patient-today-scene.tsx`
- `apps/web/src/app/demo/today/patient-today-scene.module.css`
- `apps/web/src/app/demo/today/patient-today-scene.test.ts`

Part 4 owns eligible/rejected card hierarchy, approval state, and phone
content. It does not edit the phone boundary or shared transition rules.

No owner changes state, fixture, composer, or clinical contracts solely for
visual polish. New shared component abstractions are not planned; the sprint
is too short to justify them.

## Parallel execution boundaries

1. Part 1 freezes token names, frame DOM slots, and action class contract first.
2. Parts 2, 3, and 4 then work in parallel with exclusive ownership of their
   leaf TSX/CSS/tests listed above.
3. Only Part 1 accepts small, reviewed integration patches to shared files.
   Scene owners submit token/slot requests rather than editing shared files.
4. Part 1 integrates in narrative order: voice/handoff, brief/assessment,
   plan/Today. Run each leaf's focused tests before the next seam.
5. A final single-owner visual pass may adjust shared tokens, never scene
   behavior. Do not run competing whole-route CSS passes in parallel.

## Time-boxed implementation order

For one focused day:

| Time box | Work | Exit condition |
| --- | --- | --- |
| 0:00–0:45 | Freeze tokens, viewports, frame/action contract | All owners can style without inventing colors or geometry |
| 0:45–2:15 | P0 voice, handoff, shared shell, presenter boundary | First 48 seconds are legible and stable |
| 2:15–3:45 | P0 brief and assessment | Unknown, provenance, one edit, and confirmation scan in under 57 seconds |
| 3:45–5:15 | P0 composition, rejection, approval | 3/1 result and human approval boundary read at a glance |
| 5:15–6:00 | P0 Today and phone fit | Exact approved item/dosage and CTA are visible at 1440×900 |
| 6:00–7:00 | Accessibility and 1280/200% fixes | No critical contrast, keyboard, focus, target, or clipping issue |
| 7:00–8:00 | Screenshots and five rehearsals | Five passes, normal run under 2:45 |

If time expires, cut P2 first, then P1 motion/hover refinements. Never cut P0
state clarity, approval continuity, accessibility, or recovery controls.

## Validation, screenshots, and rehearsal

### Automated and static checks

- Run all focused component/shell tests named in Parts 1–4.
- Run web typecheck and build after focused tests.
- Search `/demo` UI files for raw color values; allow only documented
  scene-specific semantic exceptions.
- Inspect computed target sizes for every visible button/control.
- Check body/status contrast with a contrast tool at the actual computed
  colors; record any exception and fix it rather than eyeballing it.
- Confirm only transform/opacity properties transition and reduced-motion
  disables nonessential motion.

### Screenshot set

Capture at 1440×900, 100%, same browser/profile:

1. intake idle;
2. intake listening and permission-denied/text fallback;
3. handoff;
4. brief plus source inspector;
5. assessment before edit and verified;
6. composition;
7. plan review with 3 eligible/1 rejected;
8. approval success;
9. Today phone frame;
10. presenter menu open.

Capture one 1280×800 whole-flow sample and one 200% zoom sample for brief,
approval, and Today. Compare side by side for identity position, content width,
primary action, status treatment, card radius, and divider alignment.

### Manual accessibility checklist

- Keyboard-only complete path; no trap outside the intended dialog.
- Visible focus on every control; scene heading receives focus after change.
- Source dialog and presenter menu close on Escape and restore focus.
- 44×44 desktop and 48 px patient targets with 8 px separation.
- Statuses have semantic text/icons, never color alone.
- Exactly one polite normal-status live region; errors use a deliberate alert.
- Reduced motion preserves all information and gates.
- No horizontal scroll at 1280×800 or within 390 px phone content.
- At 200% zoom, approval and Start exercise remain reachable and unobscured.
- Heading order and accessible names remain logical in every scene.

### Rehearsal checklist

- Freeze browser zoom, window size, permissions, fixture, and demo URL.
- Rehearse microphone allowed, denied → text fallback, reset while listening,
  direct recovery to brief, composition failure → retry, and blocked Today
  before approval.
- Run five uninterrupted full rehearsals; log total and scene splits.
- Target normal completion under 2:45 and intake + handoff under 40 seconds.
- Confirm the presenter never has to explain where to click or whether a state
  succeeded.
- Keep one pre-opened reset `/demo` tab; do not depend on a server/data repair.

## Risks

| Risk | Mitigation |
| --- | --- |
| Static prototype, standalone voice, and production workspaces each bring a slightly different palette and density | Part 1 publishes one scoped token contract; leaf CSS consumes it |
| Presenter controls compete with product actions | Neutral external strip; never brand-filled; recovery controls hidden in menu |
| Too much clinical density slows the demo | Keep only the evidence and fields named in Parts 3–4; remove production-workspace chrome |
| Composition animation implies autonomous intelligence | Checklist describes deterministic checks; actual result controls state; no glow/sparkles |
| Rejection looks like a clinical contraindication | Display the truthful clinic-playbook reason and `Not eligible`, not assessment-based claims |
| Approval and Today look disconnected | Preserve exact item/dosage and show explicit approved status on both sides |
| Phone frame does not fit the projector viewport | Validate 390×760 inside 1440×900 and a 1280×800 fallback before decorative polish |
| Low-contrast muted metadata becomes unreadable at distance | Keep body at 4.5:1; reduce prominence with size/weight/placement, not pale gray |
| Fixed/sticky controls obscure content at zoom | Prefer document flow; reserve space for any sticky region and validate 200% |
| Concurrent CSS edits collide | Exclusive leaf ownership; Part 1 is sole shared-file writer |
| Polish expands into redesign | P0/P1/P2 cut line and explicit exclusion list govern every proposed change |

## Done criteria

- The visual language is recognizably the existing Rehabify clinical style,
  with no new theme or disconnected scene style.
- At every scene, patient/episode context, state, and one next action are clear
  at 1440×900.
- Voice states, the automatic handoff, the one brief unknown, the assessment
  edit gate, the truthful 3/1 composition result, clinician approval, and
  approved Today continuity are understandable without narration.
- Product and presenter controls cannot be confused.
- Every scene has at most one filled primary product CTA.
- Body contrast is at least 4.5:1; focus is visible; targets meet 44×44 or
  planned 48 px; statuses do not rely on color; reduced motion works.
- No emoji icons, glow, excessive gradients, layout-shifting interactions,
  animation-driven state, or unrelated production UI enters the route.
- The primary and fallback viewports have no horizontal clipping; 200% zoom
  keeps critical actions reachable.
- The screenshot set is visually consistent and the complete flow passes five
  consecutive rehearsals under the existing timing and recovery criteria.
- Only agreed `/demo` files are changed during implementation, shared-file
  ownership is respected, and duplicate/unrelated dirty-worktree files remain
  untouched.
