# 08 — Migration Plan

> How to get from [02 current state](./02-current-state.md) to the architecture in
> [03](./03-data-architecture.md)–[06](./06-ai-pipelines.md), in an order where
> each step is shippable and nothing is half-migrated for long.
>
> **This is sequenced for a durable architecture, not for a demo date.** Where a
> compliance question gates engineering work, it appears in the build order as a
> real dependency rather than as a footnote.

---

## 0. The two things that are true at once

**Nothing in the current repo is production.** There is no real patient data, the
database holds hackathon demo rows, and the auth layer trusts a client-supplied
header. That is liberating: **this is a rewrite with a working reference, not a
migration.** No dual-write, no backfill, no cutover window.

**But the repo still runs, and one bug in it will be seen.** `/progress` renders
fabricated clinical history ([07 §1a](./07-cleanup-plan.md)).

> **Corrected 2026-08-02.** This section previously read *"to real users."* There
> are none — the app is a frozen reference with no active users. The bug is not a
> patient-safety issue. It is a **credibility** issue: fabricated clinical history
> in a health product, shown to an investor, is worse than a blank screen. It
> still ships early, for a different reason.

The old repo is **frozen for development and live for demonstration**. Nothing new
ships to it, and its demo path stays working until the rebuild can carry a demo
itself. That is what makes the stage 2 cleanup sweep and the stage 3 remote cut
cheap — there is no active feature work to merge against.

So the plan is: fix what will be seen, delete what is dead, then build the new
foundation underneath, then port features onto it. Not: build in parallel and
swap.

---

## 1. Build order — three tracks over ten stages

The ten stages are still the unit of work and their numbers are unchanged (the
rest of the doc set references them). What changed on 2026-08-02 is that they
**stopped being one serial ladder.**

Three tracks run concurrently, because they are paced by three things that have
nothing to do with each other:

| Track | Paced by | Starts | Blocks |
|---|---|---|---|
| **A — Foundation** | Engineering capacity | Now | Everything downstream |
| **B — Clinical content** | Physiotherapist hours | Now — recruiting first | Stage 8 content, stage 9 cases, gate 9 |
| **C — Vendor gates** | Other organizations' legal and sales calendars | Today | First real patient, and nothing before it |

Running these serially is the single most expensive mistake available here.
Track C is measured in months and consumes almost no attention; Track B is
measured in someone else's spare evenings. Both should be in flight long before
Track A needs them.

### Track A — Foundation

| # | Stage | Depends on | Doc |
|---|---|---|---|
| 1 | Fix the visible bug; establish a green baseline | — | [07 §1a, §9 phase 0–1](./07-cleanup-plan.md) |
| 2 | Cleanup sweep — assets, dead files, vision | 1 | [07 §9 phases 2–4](./07-cleanup-plan.md) |
| 3 | New remote, clean history | 2 | [ADR-001](./09-decision-log.md) |
| 4 | **Supabase foundation** — project, schema, RLS, the Drizzle boundary | 3 | [03](./03-data-architecture.md) |
| 5 | **Auth** — Supabase Auth, staff and episode-scoped patients | 4 | [04](./04-auth-access-control.md) |
| 6 | Observability + LLM swap — Langfuse contract, GPT-5.6, structured outputs | 4 | [06](./06-ai-pipelines.md) |
| 9a | **Eval harness** — `runExperiment`, the CI gate, verbose synthetic tracing | 6 | [06 §5](./06-ai-pipelines.md), §3a below |
| 7 | **Voice** — composed Deepgram pipeline; Vapi removed in the same PR | 5, 6, **gate 2** | [05](./05-voice-pipeline.md) |
| 8 | Clinical surfaces — playbook, intake, brief, plan composer | 5, 6 | [01](./01-product-definition.md) |
| 9b | **Golden cases** loaded into the harness as a hard gate | 9a, Track B | [06 §5](./06-ai-pipelines.md) |
| 10 | Pilot readiness — legal, rate limits, runbook | all | §4 |

Stages 5 and 6 are independent once 4 lands. **Stage 9 has been split and half of
it moved forward** — see §3a. Stage 7 is the one stage with a hard external
dependency inside Track A: §2 requires the deployment target decided *before* it
starts, and that answer lives in Track C.

### Track B — Clinical content

Not previously in this plan at all, which was a real omission: it is the longest
pole in the project and it had no row. Its specification is
[10 — Clinical Content & Evaluation](./10-clinical-content.md).

| # | Item | Doc |
|---|---|---|
| B0 | **Recruit and commit the clinical lead** | gate 9 |
| B1 | Closed finding vocabulary + contraindication predicates | [10 §3](./10-clinical-content.md) |
| B2 | ~30 knee exercises: source, draft, physio-sign | [10 §2](./10-clinical-content.md) |
| B3 | `exercise` / `exercise_version` / `organization_exercise` schema — folds into stage 4 | [10 §3](./10-clinical-content.md) |
| B4 | 12–20 templated knee plans | [10 §4](./10-clinical-content.md) |
| B5 | Pathway boundary signed | [10 §7](./10-clinical-content.md), gate 9 |

**B4 and stage 9b are the same artifact.** The physio-authored templates are
simultaneously the generation scaffold, the gate-9 sign-off document, and the
golden reference set. Building them once and using them three times is the whole
reason Track B is worth starting before anyone is ready for it.

**B0 is the critical path of this track and possibly of the project.** The clinical
lead is *kinda* identified as of 2026-08-02, which is not the same as committed.
Size the first ask accordingly: two hours to validate an exercise list beats
twenty hours to author a library, and the small ask is what converts "kinda" into
"yes."

### Track C — Vendor gates

§4. Nine gates, three of them 🔴. **Open gates 1, 2, and 3 today.** They cost a
few emails and then run in the background for one to three months.

---

## 1a. Two deadlines, not one

Every 🔴 gate in §4 blocks **real patient data**. None of them blocks a demo,
because a demo runs on synthetic data. That splits the project into two schedules
that were previously collapsed into one:

| | Gated by | Runs on |
|---|---|---|
| **Raise** | Track A + a credible slice of Track B | Synthetic data, seeded clinics |
| **First real patient** | Gates 1, 2, 3, 9 — Track C | Real PHI, in Canada |

This document previously asserted *"these gates, not engineering, are the critical
path."* That is true for the pilot and **false for the raise**, and conflating
them would have pointed capacity at conversations instead of code.

> **The one piece of work that is both.** An investor cannot see a Drizzle client
> boundary or an RLS policy. They can see an evaluation harness that proves the
> generated plans are clinically accurate — and in a market where most AI health
> demos are unfalsifiable, that is the differentiated claim. **Stage 9a is the only
> item in this plan that is simultaneously durable architecture and legible to a
> non-engineer.** That is why it moved from last to fourth.

---

## 2. Stage detail

### Stage 1 — Make the gate real, then green the baseline

**The verification pass has been run** — see [07 §0](./07-cleanup-plan.md). It
found that the baseline was never green and that **nothing has ever enforced it**:
no CI, and the one pre-commit hook is not executable. The entire test suite was
non-executing because a peer dependency was never declared.

So stage 1 starts with the gate, not the cleanup: declare
`@testing-library/dom`, make the hook executable, add a CI workflow running
typecheck + test + build. Then green the baseline by deleting the three test
files that cover code which no longer exists.

Ship the `/progress` fix separately on top — it is a correctness bug in front of
real users and has nothing to do with the rebuild.

**Exit:** `tsc --noEmit && next build && vitest run` green **in CI**, not just
locally; `/progress` shipped.

### Stage 2 — Cleanup

[07 §9](./07-cleanup-plan.md) phases 3–6, one commit each, green at every step:
assets (25.9 MB, including a 5.1 MB favicon that is not even wired up), the
unreferenced-file sweep (**103 files, ~9,300 LOC**, knip-confirmed), then the
unused-export sweep and the odds and ends.

**Vision is retained in full ([ADR-003](./09-decision-log.md#adr-003)) and is
excluded from every phase** — including the ~1,099 LOC inside it that has no
importers.

That exclusion got *stronger*, not weaker, when vision left the first slice
([ADR-015](./09-decision-log.md#adr-015)). Being out of scope is not a licence to
sweep it: the code is a working reference for the eventual rebuild, and it still
runs in the frozen demo. Nothing under `src/lib/vision/` is deleted, moved, or
refactored by any stage in this plan.

Vapi and database work are *not* cleanup — they are stages 7 and 4 here, and they
happen with the rebuild rather than before it. Deleting the live Vapi path before
Deepgram works would leave the app with no voice at all. (The *dead* Vapi modules
are a different thing and do go in the sweep; they are already unreferenced.)

Product deletions (messaging, the duplicate `/assessment` route) stay parked;
they are open questions in [07 §10](./07-cleanup-plan.md), not decisions.

**Exit:** ~9,300 LOC and 25.9 MB gone, build green, zero behaviour change.

### Stage 3 — New remote

Tag the current `prod` as `archive/pre-rebuild-2026-08` on the old remote, push
the cleaned trunk to the new one, let the old remote go cold. The 22 stale remote
branches resolve themselves ([07 §8](./07-cleanup-plan.md)).

### Stage 4 — Supabase foundation

The largest single stage, and the one everything else stands on.

1. Supabase project in **`ca-central-1`**, with **asymmetric ES256 signing keys
   and `sb_publishable_`/`sb_secret_` API keys from the first commit.** Legacy
   formats deprecate end of 2026 and migrating signing keys later reissues every
   session. This costs nothing now and is expensive later.
2. Schema rewritten, not migrated — Postgres enums for closed sets, real columns
   and FKs instead of load-bearing JSONB, `organization_id not null` everywhere,
   append-only where the clinical record demands it. Governance tables
   (`GenerationJob`, `ModelRun`, `AIArtifact`, `SourceReference`, `PromptVersion`,
   `EvaluationResult`, `AuditEvent`) land here, not later — retrofitting
   provenance onto a schema that did not have it is how provenance becomes
   approximate.
3. **The Drizzle boundary before the first policy**: `db.rls` / `db.admin`, the
   `set local role` transaction wrapper, the ESLint rule, `db:push` removed from
   `package.json`.
4. **The cross-tenant test harness before the first policy**, per table. Tenant A
   queries, tenant B rows, assert zero. RLS regressions are otherwise silent, and
   silence is exactly how the current repo shipped inert policies.
5. Then the policies: forced RLS, `to authenticated`, `(select auth.uid())`,
   indexed tenancy columns, the `security definer` membership helper, and a
   restrictive `is_anonymous is false` gate on every PHI table.

> **Order matters here.** Boundary and tests come before policies. Writing
> policies first and testing them later reproduces the exact failure this
> architecture exists to correct.

**Exit:** cross-tenant tests pass per table; an anonymous session returns zero
rows from every PHI table; `drizzle-kit push` is not reachable from any script.

### Stage 5 — Auth

Staff first (email/SSO + TOTP at AAL2, role from `organization_members` via the
custom access token hook), then the episode-scoped patient flow (SMS link →
client-initiated anonymous session → phone OTP → grant).

Design the four constraints in from the start rather than discovering them:
anonymous users hold the `authenticated` role; MFA verify is 15/hr **per IP** and
a clinic is one IP; anonymous sign-in must be client-initiated; grant revocation
checks a live table, not a claim ([04 §4](./04-auth-access-control.md)).

`x-demo-role`, `NEXT_PUBLIC_DEMO_MODE`, and the demo bypass in `proxy.ts` are
deleted in this stage. **Demo data becomes seeded data under real auth.**

Every route handler gets its four-case test: unauthenticated → 401, wrong tenant
→ empty, wrong role → 403, anonymous against PHI → empty. The current repo has
zero route-handler tests; this is where that changes.

**Exit:** no code path where an environment variable weakens authentication.

### Stage 6 — Observability and the LLM swap

Langfuse **contract before instrumentation.** Deny-by-default `shouldExportSpan`,
the structure-only payload discipline, `mask` as a backstop, opaque IDs — and
**the CI test asserting no `gen_ai.*` or off-allowlist attribute reaches the
exporter, written before the first span is emitted.** Pin `v3.224.x`.

Then GPT-5.6: Luna for bounded high-volume work, Sol for clinician- and
patient-facing prose, structured outputs everywhere, exercise selection as an
enum resolved by exact ID. **`findClosestSlug` is deleted, not ported** — and
stage 4's FK means an invented exercise is unstorable even if something upstream
tries.

**Exit:** the attribute-allowlist test is green in CI and would fail if someone
added content to a span.

### Stage 7 — Voice

Deepgram STT → GPT-5.6 → Aura TTS through the Rehabify gateway. Browser never
talks to Deepgram directly — that is what keeps transcript and extraction inside
the PHI boundary, where today extraction runs on the *client* and writes to
Zustand.

Build in this order: gateway and ephemeral tokens → the `mip_opt_out=true` URL
builder (one function, lint-enforced) → turn detection including the
`last_word_end === -1` guard → reconnection and keep-alives → barge-in →
pre-rendered approved question audio.

Pre-rendering is not a cost optimization dressed up as architecture: **TTS
concurrency (45) is the system's real capacity ceiling, not STT (150)**, so
pre-rendering the approved question set removes the binding constraint.

**Vapi is deleted in the same PR that lands Deepgram**, not before.

**Deployment target is decided before this stage, not during it.**
[ADR-013](./09-decision-log.md#adr-013) proposes self-hosting Deepgram in
`ca-central-1` on cloud credits, which adds GPU capacity, container
orchestration, and the License Server dependency to this stage's surface. Build
behind the speech adapter boundary ported from `rehabifyy` (§3) so the hosted and
self-hosted paths differ at one seam — but know which one is real before
capacity-planning against the 45-stream ceiling.

> ⚠️ [ADR-010](./09-decision-log.md#adr-010) — run the bake-off against recorded
> intake audio before the pilot. It now has **three arms**: cloud
> `nova-3-medical`, self-hosted Flux, and self-hosted `nova-3-medical` if it
> exists. If it does not, residency and the medical model are mutually exclusive
> and the choice belongs to the clinical lead, not to engineering.

### Stage 8 — Clinical surfaces

Playbook and exercise library (stage A) → intake question graph (C) → pre-visit
brief (D) → assessment workspace (E) → plan composer (F) → patient plan (G) →
check-ins (H) → next-review briefing (I).

Two invariants hold across all of them: **hard constraints in code, LLM only for
rationale and phrasing**; and **nothing publishes without physiotherapist
approval of the whole version.** The current repo's
`POST /api/assessments/save` inserts plans with `status: 'approved'` and no
clinician in the loop — that route does not come back in any form.

### Stage 9 — Evaluation, split in two

**Stage 9a — the harness, built early (immediately after stage 6).** The
`runExperiment` plumbing, the CI gate that exits non-zero on regression, the
scoring model, and **verbose synthetic tracing** (§3a). None of it needs finished
clinical content: build it against a handful of placeholder cases and let Track B
fill it in. Built here, every subsequent stage lands with a regression net already
under it, rather than acquiring one at the end.

**Stage 9b — the golden cases as a hard gate.** Track B's templates (B4) loaded
as the real dataset: normal, ambiguous, safety-rule, valid-plan, invalid-plan,
follow-up. Every prompt, model, rule, and schema change runs the set.
LLM-as-judge is restricted to synthetic cases — never patient data.

> **Why the split.** Stage 9 was originally last, which meant the eval harness
> would have been built after the things it was supposed to be evaluating — the
> same inversion this architecture exists to correct everywhere else. It also made
> the one investor-legible artifact in the plan the last thing to exist (§1a).

Prompts live in git and are reviewed like code. Langfuse's prompt CMS serves
stale-while-revalidate on a 60s TTL, which means a bad clinical prompt reaches
production in a minute with no review gate. That is disqualifying for this
product.

### Stage 10 — Pilot readiness

Non-code, and genuinely blocking. See §4.

---

## 3. What gets ported from `rehabifyy`, and what does not

`rehabifyy` is a reference implementation, not the trunk ([ADR-001](./09-decision-log.md)).
Port deliberately:

| Port | Why |
|---|---|
| Episode-grant model | A data model, not an auth implementation — survives the Supabase Auth switch intact |
| Speech adapter boundary | The right seam; the provider behind it changes |
| Forced-RLS migration patterns | Already proved out there |
| Test structure (162 test files / 192 source files) | The single largest gap in this repo |

Do **not** port wholesale. 87,668 LOC contains a great many decisions we did not
make, and inheriting them undoes the reason for [ADR-001](./09-decision-log.md).

---

## 3a. Observability depth — two tiers, not one

**Decided 2026-08-02.** [06 §3](./06-ai-pipelines.md) specifies a no-PHI telemetry
contract: deny-by-default export, structure never content, opaque IDs. Read
literally and applied everywhere, that contract makes the system **deliberately
blind** — when a golden case regresses, there is no trace to open and no way to
see what the model actually said. Excellent for compliance, useless for the eval
work that has to prove clinical accuracy.

Both are achievable, because they are different traffic:

| | Synthetic / golden cases | Real patient episodes |
|---|---|---|
| Prompts, completions, tool calls | ✅ Full content | ❌ Never |
| Retrieved exercises, rule evaluations | ✅ Full content | Rule **IDs** only |
| Judge reasoning | ✅ Full | ❌ Disabled entirely |
| Identifiers | Case IDs | Per-episode UUIDs |
| Governing rule | Nothing here is PHI | [06 §3](./06-ai-pipelines.md), unchanged |

### The discriminator must be structural, not a boolean

The obvious implementation — one Langfuse project and an `isSynthetic` flag on
the exporter — is the wrong one. It puts a single mutable boolean between patient
narrative and a US-hosted vendor, and a wrong value fails **open** and silently.
That is the exact failure shape catalogued in [00 §4](./00-README.md).

**Use two Langfuse projects with separate credentials, selected by deployment
context rather than by a runtime value.** The eval harness runs in CI and in a
dedicated local process; production request handlers run somewhere else entirely.
Production is not configured with the verbose project's key and therefore
*cannot* write to it, whatever any flag says.

Consequences:

- The [06 §3](./06-ai-pipelines.md) CI attribute-allowlist test is unchanged and
  still guards the production exporter. It gains a second assertion: the
  production runtime resolves no verbose-project credential.
- [ADR-009](./09-decision-log.md#adr-009) stands. This does not put PHI in
  Langfuse; it puts *synthetic* content there, and synthetic content was never
  what the contract was protecting.
- The Langfuse **Core** tier is still right ([06 §6](./06-ai-pipelines.md)) — two
  projects, not two subscriptions.
- Volume becomes the thing to watch, not privacy: full-content traces on every CI
  run consume units far faster than structure-only production traffic. Expect
  the eval project, not production, to drive the bill.

This is the fourth choke point in the architecture, alongside the `db.admin`
boundary, the `mip_opt_out` URL builder, and the attribute allowlist. Same
principle: **make the unsafe thing unreachable rather than forbidden.**

---

## 4. Gates that are not engineering

These block the pilot, they have long lead times, and none of them gets faster by
being started later.

| # | Gate | Raise with | Blocks |
|---|---|---|---|
| 1 | **Supabase publishes zero PIPEDA representation** | Counsel | 🔴 Any real patient data |
| 2 | **Canadian-resident speech** — self-host in `ca-central-1` ([ADR-013](./09-decision-log.md#adr-013)). First question: is streaming `nova-3-medical` available self-hosted? | Deepgram **sales** (Enterprise plan) | 🔴 Real patient voice |
| 3 | **LLM residency is a fork** — Canada or GPT-5.6, likely not both ([ADR-008](./09-decision-log.md#adr-008)). Price PTU in Canada East | OpenAI / Microsoft | 🔴 Real patient data through the LLM |
| 4 | **Raise the MFA verify rate limit** (15/hr/IP vs clinic NAT) | Supabase | 🟠 Pilot — this *will* fire |
| 5 | Confirm Realtime residency; treat as out-of-region until then | Supabase | 🟠 PHI on Realtime |
| 6 | Confirm what platform logs capture and where they live | Supabase | 🟠 The no-PHI-in-logs discipline |
| 7 | Langfuse BAA counterparty post-ClickHouse acquisition | Langfuse | 🟡 Mooted if the no-PHI contract holds; self-hosting rejected ([ADR-009](./09-decision-log.md#adr-009)) |
| 8 | Team plan + compliance add-on pricing (unpublished) | Supabase | 🟡 Budget |
| 9 | **Clinical lead signs the exact pathway boundary** | Partner clinic | 🔴 Any real-patient episode |

Gates 1–3 are the ones to open **now**, in parallel with stage 1. They are
conversations with other organizations, and the answers may change the
architecture — if streaming `nova-3-medical` is unavailable self-hosted, that is
a design input for stage 7 and a clinical-risk decision for gate 9, not a
surprise during either.

**These gates, not engineering, are the critical path *to the pilot*.** The build
is on the order of weeks; vendor legal and sales cycles are on the order of one to
three months, and they do not compress by adding capacity. Any plan that starts
engineering before these conversations finishes them late.

> **Qualified 2026-08-02.** This sentence originally had no *"to the pilot."* It
> does now, because the two deadlines are different (§1a): these gates block real
> PHI, and a demo runs on synthetic data. They are the critical path to the first
> patient and they are **not** on the path to a raise. The practical instruction is
> unchanged — open them today, they are nearly free to run in the background — but
> do not let a three-month legal cycle set the pace of work that does not depend on
> it. See [ADR-014](./09-decision-log.md#adr-014).

### 4a. What the cloud credits change

We hold GCP, Azure, and AWS credits. They are worth spending here for exactly one
reason, and it is not cost.

**Credits buy residency, not discount.** Three gates are variations on "a vendor
will not put PHI in Canada." Where the vendor's software can be run by us, that
converts from *waiting* into *spending* — which is the only lever we control.

| Gate | Credits help? | |
|---|---|---|
| 2 — Deepgram | ✅ | Self-host in `ca-central-1` ([ADR-013](./09-decision-log.md#adr-013)) — the clear win, subject to the model question |
| 3 — LLM | 🟠 | Azure OpenAI Canada is real but has no GPT-5.x on standard deployment; PTU is credit-fundable |
| 7 — Langfuse | ✅ | Technically feasible, deliberately **rejected** — five stateful services to hold PHI we do not emit |
| 1, 4, 5, 6, 8 — Supabase | ❌ | Legal representation and platform configuration. **Do not replatform off Supabase for credits** — [03](./03-data-architecture.md) and [04](./04-auth-access-control.md) are Supabase-shaped, and Supabase already runs in `ca-central-1` |
| 9 — Clinical sign-off | ❌ | |

The discipline: **spend credits on capability that is not for sale at any price,
never on a discount for something we already have.** Canadian-resident Deepgram
passes. Cheaper hosting does not — credits expire and the architecture stays.

---

## 5. Success criteria

**Per stage:** `tsc --noEmit && next build && vitest run` green, and the stage's
own exit criterion above met.

**For the rebuild overall**, from [01](./01-product-definition.md):

- Median clinician time saved: ≥10 min initial visit, ≥5 min follow-up
- ≥80% of generated plan items approved with no or minor edits
- Golden case set green before any real-patient deployment

And three architectural criteria this document adds, because they are the things
that went wrong the first time:

- **No code path where an environment variable weakens authentication.**
- **No PHI table without a passing cross-tenant and anonymous-session test.**
- **No span reaching an external exporter with patient content in it**, asserted
  in CI rather than assumed.
