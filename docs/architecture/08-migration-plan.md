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

**But the repo still runs, and one bug in it is patient-facing.** `/progress`
renders fabricated clinical history to real users
([07 §1a](./07-cleanup-plan.md)). That is fixed in week one regardless of
everything else here.

So the plan is: fix what is live and wrong, delete what is dead, then build the
new foundation underneath, then port features onto it. Not: build in parallel and
swap.

---

## 1. Build order

Ten stages. Stages are sequential where the dependency is real and parallel where
it is not. LOC figures are from [07](./07-cleanup-plan.md).

| # | Stage | Depends on | Doc |
|---|---|---|---|
| 1 | Fix the live bug; establish a green baseline | — | [07 §1a, §9 phase 0–1](./07-cleanup-plan.md) |
| 2 | Cleanup sweep — assets, dead files, vision | 1 | [07 §9 phases 2–4](./07-cleanup-plan.md) |
| 3 | New remote, clean history | 2 | [ADR-001](./09-decision-log.md) |
| 4 | **Supabase foundation** — project, schema, RLS, the Drizzle boundary | 3 | [03](./03-data-architecture.md) |
| 5 | **Auth** — Supabase Auth, staff and episode-scoped patients | 4 | [04](./04-auth-access-control.md) |
| 6 | Observability + LLM swap — Langfuse contract, GPT-5.6, structured outputs | 4 | [06](./06-ai-pipelines.md) |
| 7 | **Voice** — composed Deepgram pipeline; Vapi removed in the same PR | 5, 6 | [05](./05-voice-pipeline.md) |
| 8 | Clinical surfaces — playbook, intake, brief, plan composer | 5, 6 | [01](./01-product-definition.md) |
| 9 | Evaluation harness + golden cases as a CI gate | 6, 8 | [06 §5](./06-ai-pipelines.md) |
| 10 | Pilot readiness — legal, rate limits, runbook | all | §4 below |

Stages 5 and 6 are independent of each other and can run in parallel once 4
lands. Everything else is a real dependency.

---

## 2. Stage detail

### Stage 1 — Fix the live bug, establish a baseline

Ship `/progress` first and separately. It is a correctness bug in front of real
users and it has nothing to do with the rebuild.

Then, before deleting anything: run `knip`, `ts-prune`, and `tsc --noEmit` with
`node_modules` present and **diff the output against [07](./07-cleanup-plan.md)**.
That document's inventory was assembled by reading imports, not by running the
tools — it should hold up, but confirm it rather than trust it. Any disagreement
is worth understanding before 9,000 lines are deleted on its say-so.

**Exit:** `tsc --noEmit && next build && vitest run` green, tool output
reconciled, `/progress` shipped.

### Stage 2 — Cleanup

[07 §9](./07-cleanup-plan.md) phases 2–4, one commit each, green at every step:
assets (25.9 MB, including a 5.2 MB favicon that is not even wired up), the
unreferenced-file sweep (~9,200 LOC), and vision removal (2,912 LOC + 3 deps,
touching two live pages).

Phases 5–9 of that document are *not* cleanup — they are stages 4 and 7 here, and
they happen with the rebuild rather than before it. Deleting Vapi before Deepgram
works would leave the app with no voice path at all.

Product deletions (messaging, the duplicate `/assessment` route) stay parked;
they are open questions in [07 §10](./07-cleanup-plan.md), not decisions.

**Exit:** ~12,000 LOC and 25.9 MB gone, build green, no behaviour change outside
vision.

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

> ⚠️ [ADR-010](./09-decision-log.md) — run the `nova-3-medical` vs Flux bake-off
> against recorded intake audio before the pilot. It is provisional, and it is
> cheap to settle.

### Stage 8 — Clinical surfaces

Playbook and exercise library (stage A) → intake question graph (C) → pre-visit
brief (D) → assessment workspace (E) → plan composer (F) → patient plan (G) →
check-ins (H) → next-review briefing (I).

Two invariants hold across all of them: **hard constraints in code, LLM only for
rationale and phrasing**; and **nothing publishes without physiotherapist
approval of the whole version.** The current repo's
`POST /api/assessments/save` inserts plans with `status: 'approved'` and no
clinician in the loop — that route does not come back in any form.

### Stage 9 — Evaluation

Golden synthetic cases (normal, ambiguous, safety-rule, valid-plan, invalid-plan,
follow-up) as a CI gate via `runExperiment`, exiting non-zero on regression.
Every prompt, model, rule, and schema change runs the set. LLM-as-judge is
restricted to synthetic cases — never patient data.

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

## 4. Gates that are not engineering

These block the pilot, they have long lead times, and none of them gets faster by
being started later.

| # | Gate | Raise with | Blocks |
|---|---|---|---|
| 1 | **Supabase publishes zero PIPEDA representation** | Counsel | 🔴 Any real patient data |
| 2 | **Deepgram has no Canadian region** — dedicated `ca-central-1` is plausible, unconfirmed, Enterprise-only | Deepgram | 🔴 Real patient voice |
| 3 | OpenAI residency and DPA coverage for GPT-5.6 tiers | OpenAI | 🔴 Real patient data through the LLM |
| 4 | **Raise the MFA verify rate limit** (15/hr/IP vs clinic NAT) | Supabase | 🟠 Pilot — this *will* fire |
| 5 | Confirm Realtime residency; treat as out-of-region until then | Supabase | 🟠 PHI on Realtime |
| 6 | Confirm what platform logs capture and where they live | Supabase | 🟠 The no-PHI-in-logs discipline |
| 7 | Langfuse BAA counterparty post-ClickHouse acquisition | Langfuse | 🟡 Mooted if the no-PHI contract holds |
| 8 | Team plan + compliance add-on pricing (unpublished) | Supabase | 🟡 Budget |
| 9 | **Clinical lead signs the exact pathway boundary** | Partner clinic | 🔴 Any real-patient episode |

Gates 1–3 are the ones to open **now**, in parallel with stage 1. They are
conversations with other organizations, and the answers may change the
architecture — if Deepgram cannot offer a Canadian deployment, that is a design
input for stage 7, not a surprise during it.

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
