# 09 — Decision Log

> Architectural Decision Records for the Rehabify rebuild.
> Supersedes `docs/redesign/decision-log.md` in full.

**Status values:** Proposed · Accepted · Superseded · Open

| # | Decision | Status |
|---|---|---|
| [001](#adr-001) | Rebuild in this repo, push to a new remote | Accepted |
| [002](#adr-002) | Supabase as the platform, `ca-central-1` | Accepted |
| [003](#adr-003) | Computer vision **retained in full** | Accepted — reversed 2026-08-02 |
| [004](#adr-004) | Supabase Auth *(reverses an earlier call)* | Accepted |
| [005](#adr-005) | Multi-tenancy: shared DB + `organization_id` + forced RLS | Accepted |
| [006](#adr-006) | Drizzle two-client boundary; `drizzle-kit push` banned | Accepted |
| [007](#adr-007) | Composed Deepgram voice pipeline *(supersedes old ADR-001)* | Accepted |
| [008](#adr-008) | GPT-5.6, tiered Luna/Sol | Accepted |
| [009](#adr-009) | Langfuse Cloud under a no-PHI telemetry contract | Accepted |
| [010](#adr-010) | `nova-3-medical` over Flux | **Proposed** — bake-off required |
| [011](#adr-011) | Target market: British Columbia, Canada | Accepted |
| [012](#adr-012) | Modular monolith + durable worker | Accepted |

### Superseded from `docs/redesign/`

| Old | Was | Now |
|---|---|---|
| ADR-001 | Gemini 2.0 Flash Live over Vapi | **Superseded by ADR-007** |
| ADR-002 | Skeleton streaming for billing-grade verification | **Partly superseded** — vision is retained (ADR-003), but the *billing-grade verification* premise dies with CPT, which does not exist in Canada (ADR-011) |
| ADR-003 | GCP over AWS for HIPAA | **Superseded by ADR-002** |
| ADR-004 | Server-side vision analysis language | **Open** — vision is retained (ADR-003), so where analysis runs is undecided; today it is entirely client-side |
| ADR-005 | Deployment model | **Superseded by ADR-002** |
| ADR-006 | Multi-tenancy via shared DB + RLS | **Carried forward as ADR-005**, with the correction that the old policies were inert |

---

## ADR-001 — Rebuild in this repo, push to a new remote {#adr-001}

**Date** 2026-08-02 · **Status** Accepted

**Context.** Two repos exist. `rehabify` (this one) is 53,633 tracked TS/TSX LOC
with the security findings in [02](./02-current-state.md). `rehabifyy` is 87,668
LOC with 64 domain tables, 40 migrations, forced RLS, and 162 test files against
192 source files — a substantially more mature implementation. The obvious move
was to make `rehabifyy` the trunk.

**Decision.** Rebuild **in this repo** and push to a **new remote**. `rehabifyy`
is a reference implementation to port patterns from, not the trunk.

**Consequences.** More work than adopting `rehabifyy` wholesale, and the good
work there has to be ported deliberately rather than inherited. In exchange:
one repo, one history, no ambiguity about which is canonical, and the port is
selective — we take the speech adapter boundary and the episode-grant model
without also taking 87k lines of decisions we did not make.

The 22 stale remote branches resolve themselves — the new remote starts clean.
Tag the old `prod` as `archive/pre-rebuild-2026-08` before letting it go cold.

---

## ADR-002 — Supabase, `ca-central-1` {#adr-002}

**Date** 2026-08-02 · **Status** Accepted

**Context.** Current stack is Neon Postgres via `@neondatabase/serverless` (HTTP
driver — no pooling, **no transactions**) plus Neon Auth `0.1.0-beta.21`. The
RLS pattern this architecture depends on *is* a transaction, so the current
driver cannot express it even in principle.

**Decision.** Supabase Postgres + Storage + Auth in `ca-central-1`, session-mode
pooling.

**Consequences.** Native `auth.uid()` in policies; one vendor instead of three;
a documented Neon→Supabase Postgres path (and no production data to move
anyway). Costs: a $760–810/mo compliance-tier floor, **no CMK/BYOK**, **platform
logs out-of-region**, Edge Functions global unless pinned, Realtime residency
undocumented, and **zero PIPEDA representation on supabase.com** — a
legal-review blocker under ADR-011. Details in [03](./03-data-architecture.md).

---

## ADR-003 — Computer vision retained {#adr-003}

**Date** 2026-08-02 · **Status** Accepted — **reversed the same day**

**Context.** MediaPipe pose detection, a 1,286-line form engine, DTW movement
comparison, and skeleton streaming were central to the previous plan. The initial
call was to shelve all of it, and the cleanup plan was written to remove 2,912
LOC and 3 dependencies across 7 file edits.

**Decision (revised).** **Vision is kept in full.** No vision code is deleted,
refactored, or touched by the cleanup — explicitly including the ~1,099 LOC that
currently has zero importers (`form-engine.ts` has one live analyzer, squat; the
`standing`, `lumbar`, `floor`, and `assessment-movements` modules plus
`geometry.ts` and `form-types.ts` are unreferenced today). knip confirms those
six independently, and they stay anyway.

**Consequences.** The cleanup shrinks from ~14,800 LOC to ~9,500, and phase 5
disappears from [07 §9](./07-cleanup-plan.md). `@mediapipe/tasks-vision`,
`1eurofilter`, and `dynamic-time-warping` stay in `package.json`. The
vision-adjacent files in `components/workout/` are excluded from the deletion
sweep even where knip reports them unused.

Two things this decision does **not** settle, and which should be revisited
before vision ships to real patients:

- **The authority boundary in [01 stage G](./01-product-definition.md) still
  reads "never claims to observe or correct form."** That language and a live
  form-correction feature are in tension. It was not renegotiated here, so it
  stands as written — flag it when vision re-enters product scope.
- `__tests__/form-engine-flexion.test.ts` has **two genuinely failing
  assertions** about rep counting. Under ADR-003-as-shelved that test was going
  to be deleted; under this decision it is a **live bug in retained code**. See
  [07 §0f](./07-cleanup-plan.md).

Note that the `docs/redesign/` billing-verification premise still dies — not on
vision grounds but on [ADR-011](#adr-011), since CPT codes do not exist in Canada.

---

## ADR-004 — Supabase Auth {#adr-004}

**Date** 2026-08-02 · **Status** Accepted — **reverses an earlier decision**

**Context.** The initial call was Supabase for Postgres + Storage while keeping
first-party auth (porting `rehabifyy`'s HMAC episode links, phone OTP, episode
grants, staff 2FA). On reflection, the deciding factor is that
[ADR-005](#adr-005) puts the **entire tenant isolation guarantee on RLS**, and
first-party auth means hand-threading claims into Postgres on every request —
with a silent failure mode.

**Decision.** Use Supabase Auth. `auth.uid()` / `auth.jwt()` work natively in
policies. Phone OTP, anonymous sign-ins, and TOTP MFA/AAL2 are first-party.

**Consequences.** Removes a category of bug and a system to own. Costs four
non-configurable constraints that must be designed around, not discovered:
anonymous users get the **`authenticated`** role (not `anon`); MFA verify is
**15/hour per IP** and a clinic is one IP behind NAT; anonymous sign-in is
30/hour per IP and must therefore be **client-initiated, never server-proxied**;
custom claims are **stale until token refresh** (up to 1h), so revocation checks
a live table rather than a claim. **There is no migration path off Supabase Auth
later.** Full treatment in [04](./04-auth-access-control.md).

The episode-grant model survives the switch intact — it is a data model, not an
auth implementation.

---

## ADR-005 — Multi-tenancy: shared DB, `organization_id`, forced RLS {#adr-005}

**Date** 2026-08-02 · **Status** Accepted *(carried forward from old ADR-006)*

**Context.** The current schema has **no tenancy column on any table**, and its
RLS policies use the Supabase `auth.uid()` idiom against the `neon-http` driver —
they parse and do nothing. The database has no row-level protection today.

**Decision.** Shared database, `organization_id not null` on every domain table,
`force row level security` everywhere, every policy `to authenticated`, tenancy
derived from the JWT and never from a request parameter.

**Consequences.** Operational simplicity at 1–2 pilot clinics scaling to tens;
one migration path. In exchange the *entire* isolation guarantee rests on policy
correctness, which demands: a `security definer` membership helper (inline joins
measured at 178,000ms vs 12ms), `(select auth.uid())` wrapping (11,000ms → 10ms),
indexed tenancy columns (171ms → <0.1ms), a restrictive `is_anonymous is false`
gate on every PHI table, and a **per-table cross-tenant test harness written
before the first policy ships.**

---

## ADR-006 — Drizzle two-client boundary; `drizzle-kit push` banned {#adr-006}

**Date** 2026-08-02 · **Status** Accepted

**Context.** **Drizzle connects as the database owner and bypasses RLS by
default.** This is exactly how the current repo ended up with policies that look
protective and protect nothing. Separately, **`drizzle-kit push` silently skips
RLS policy SQL** — it reports success and leaves tables unprotected.

**Decision.** Two clients: `db.rls` (per-transaction `set local role
authenticated` + `set_config('request.jwt.claims', …)`) for everything
request-scoped, and `db.admin` (owner) for migrations and reviewed system jobs,
**with an ESLint rule forbidding `db.admin` imports outside an allowlisted
directory.** Remove `db:push` from `package.json`; the only path is `generate` →
review → `migrate`.

**Consequences.** Every request-scoped query costs a transaction. The
`set local role` pattern is **not Supabase-documented** — it is community
practice — so it lives in this repo as deliberate, tested, reviewed code rather
than folklore. Policies are hand-written in migration files and reviewed like
application code, because that is what they are.

This is one of three narrow choke points standing in for policies that would
otherwise depend on everyone remembering — the others are ADR-007's
`mip_opt_out` URL builder and ADR-009's telemetry allowlist. All three are
lint- or test-enforced.

---

## ADR-007 — Composed Deepgram voice pipeline {#adr-007}

**Date** 2026-08-02 · **Status** Accepted · **Supersedes** old ADR-001

**Context.** Current voice is Vapi (Deepgram + Gemini + ElevenLabs bundled at
~$0.15/min, ~$40/patient/month). The previous plan replaced it with Gemini 2.0
Flash Live. Both are **managed agents that own the turn loop.**

**Decision.** Compose it ourselves: Deepgram STT → GPT-5.6 → Deepgram Aura TTS,
orchestrated by Rehabify, browser → our server → Deepgram.

**The argument is authority, not cost.** Intake is a controlled questionnaire
wearing a conversation's clothes. A managed agent owning the turn loop owns the
decision about what to say next — precisely the authority the product must not
delegate. Composing also puts transcript and extraction server-side inside the
PHI boundary (today extraction happens on the *client* and writes to Zustand),
and lets `mip_opt_out=true` be enforced in one server-side URL builder.

**Consequences.** We own turn detection, reconnection, keep-alives, and barge-in
— see [05 §4–5](./05-voice-pipeline.md), where the failure modes are specified
rather than described. Cost drops roughly two orders of magnitude (~$0.23/session,
TTS-dominated, before pre-rendering). Pre-rendering the approved question set
collapses TTS cost *and* removes TTS from the 45-concurrent-stream ceiling that
is the system's real capacity limit.

Deepgram has **no Canadian region** — this is ADR-011's bill coming due, and it
is the one place where the "design around it" move used for telemetry (ADR-009)
is unavailable.

---

## ADR-008 — GPT-5.6, tiered {#adr-008}

**Date** 2026-08-02 · **Status** Accepted

**Context.** Current LLM is Gemini via `@google/generative-ai`, with no
structured output and a `findClosestSlug` fuzzy matcher that maps model output
onto real exercise IDs on ≥2 shared words or ≥50% overlap — the mechanism by
which a model-invented exercise becomes a real prescription.

**Decision.** OpenAI GPT-5.6 (released 2026-07-09), routed per task: **Luna**
for bounded high-volume work (intake phrasing, structured extraction, check-in
summarization), **Sol** for clinician- and patient-facing prose (plan rationale,
pre-visit and next-review briefs, LLM-as-judge). Terra unused.

**Consequences.** Structured outputs are mandatory everywhere; exercise selection
is an enum constrained to the clinic's approved library, resolved by exact ID —
`findClosestSlug` is deleted, not ported, and the FK makes an invented exercise
unstorable. **⚠️ OpenAI BAA/DPA coverage for GPT-5.6 tiers and Canadian
residency options are unconfirmed** — same conversation as ADR-007 and ADR-009.

---

## ADR-009 — Langfuse Cloud, no-PHI telemetry contract {#adr-009}

**Date** 2026-08-02 · **Status** Accepted

**Context.** Five options evaluated. **No LLM observability vendor has a Canadian
region — not one.** So vendor selection cannot solve residency.

**Decision.** Langfuse Cloud (start on Core, $29/mo), with telemetry carrying
**structure, never content**. Deny-by-default span export via `shouldExportSpan`;
structure-only payloads; `mask` as a regex backstop only; opaque IDs in
`userId`/`sessionId`. **A CI test asserts no `gen_ai.*` or off-allowlist
attribute reaches the exporter.**

**Consequences.** If we send no PHI, region and BAA stop being blockers and we
avoid operating ClickHouse + a second Postgres + Redis. This reframing is the
highest-leverage decision in the doc set.

Caveats: Langfuse was **acquired by ClickHouse 2026-01-16** — the BAA
counterparty changed and the published BAA predates it. The **JS masking hook
covers only six `langfuse.*` attributes** (verified in the shipped bundle); the
Python `mask_otel_spans` equivalent does not exist in JS — mitigated by using
the first-party `@langfuse/openai` wrapper and banning third-party OTel LLM
instrumentation. **Pin to v3.224.x**; v4.0.0 is days old. Prompts stay in git
(Langfuse serves stale-while-revalidate on a 60s TTL — a bad clinical prompt
would reach production in a minute with no review). LLM-as-judge is restricted to
synthetic cases.

---

## ADR-010 — `nova-3-medical` over Flux {#adr-010}

**Date** 2026-08-02 · **Status** ⚠️ **Proposed — bake-off required before pilot**

**Context.** Deepgram's `flux-general-en` is purpose-built for conversational
turn-taking and emits `EndOfTurn` natively, replacing the whole
`endpointing`/`utterance_end_ms`/`speech_final` heuristic stack. **But Flux has
no medical variant, and `nova-3-medical` is `/v1/listen` only. You cannot have
both.**

**Decision (provisional).** `nova-3-medical`, on asymmetric-risk grounds: the
question graph tells us the expected answer type per node, so we **can**
compensate for a turn-detection false positive (re-prompt, or confirm a partial).
We **cannot** compensate for a mis-transcribed anatomy term, because we will not
know it was wrong.

**Consequences.** We implement turn detection ourselves, including the
`last_word_end === -1` stale-message guard. Keyterms are one pruned union list
rather than per-node scoping (Nova-3 cannot swap mid-stream). Also: **⚠️
`nova-3-medical` self-hosted was "coming soon"** as of Deepgram's announcement —
if it has not shipped, a self-hosted Canadian deployment *forces* Flux and this
ADR flips.

**Why still Proposed.** This is testable and cheap to test: run both against
recorded intake audio and measure term accuracy vs premature-cutoff rate. Do it
before the pilot. If cutoffs prove worse in practice, Flux at Deepgram's own
documented medical profile (`eot_threshold=0.85`, `eot_timeout_ms=8000`, no
eager) is the fallback.

---

## ADR-011 — Target market: British Columbia, Canada {#adr-011}

**Date** 2026-08-02 · **Status** Accepted

**Context.** Two spec sets disagreed on country and business model.
`docs/redesign/` assumed the US, HIPAA, and **CPT 98977/98980 RTM reimbursement
(~$98/patient/month)** as the revenue engine. The architecture plan assumed BC.
**CPT codes are US Medicare billing codes that do not exist in the Canadian
system**, so only one of these is coherent.

**Decision.** British Columbia. PIPEDA + BC PIPA. SaaS-only revenue; billing
deferred.

**Consequences — and this is the expensive option, which the docs should say
plainly.** The `docs/redesign/` unit economics are discarded entirely. Canadian
residency is unsolved or unconfirmed with **every** vendor in the stack:
Supabase platform logs are out-of-region, Edge Functions are global unless
pinned, Realtime is undocumented; Deepgram has no Canadian endpoint at all;
no observability vendor has one either.

Two responses run through the rest of the docs. Where residency can be bought, we
buy it (`ca-central-1`). Where it cannot, we **design around it** — the no-PHI
telemetry contract (ADR-009) makes US-hosted observability moot by never sending
PHI. That move is unavailable for speech, which is why ADR-007's residency
conversation is a gating dependency.

**Supabase publishes zero PIPEDA representation** — a legal-review blocker, not
an engineering one. Clear it before real patient data.

---

## ADR-012 — Modular monolith + durable worker {#adr-012}

**Date** 2026-08-02 · **Status** Accepted

**Context.** Explicitly deferred by the product definition: microservices,
Kubernetes, a custom foundation model.

**Decision.** A modular monolith (Next.js) plus a **durable async worker** for
long-running AI pipelines — plan composition, brief generation, next-review
briefing, eval runs.

**Consequences.** The worker is where Langfuse tracing lives (long-lived process,
no serverless flush race — `@langfuse/otel` is Node-only and not Edge-compatible)
and where `db.admin` is legitimately used. Generation is inherently async and
clinician-reviewed, so a job queue matches the product's actual latency budget
rather than fighting it.

---

## Template

```markdown
## ADR-NNN — Title {#adr-nnn}

**Date** YYYY-MM-DD · **Status** Proposed / Accepted / Superseded / Open

**Context.** What is motivating this decision?

**Decision.** What are we doing?

**Consequences.** What gets easier, what gets harder, what did we accept?
```
