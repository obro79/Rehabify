# Rehabify — Architecture

Rebuild specification. Written 2026-08-02.

Rehabify is an AI workflow copilot for physiotherapy clinics: structured
pre-visit intake, a clinician brief, a constrained care-plan draft, and
between-visit check-ins. **It accelerates clinical work without replacing
examination or judgment.**

These documents describe the architecture being built, why each choice was made,
and what each one costs. They are written to be read by someone who was not in
the conversation.

---

## The documents

| | Doc | What it answers |
|---|---|---|
| 01 | [Product Definition](./01-product-definition.md) | What the product is, the authority boundary, first-release scope, the workflow stages |
| 02 | [Current State](./02-current-state.md) | What exists today, verified — including the security findings |
| 03 | [Data Architecture](./03-data-architecture.md) | Supabase, multi-tenancy, RLS, the Drizzle boundary, storage |
| 04 | [Auth & Access Control](./04-auth-access-control.md) | Identity model, Supabase Auth constraints, where authorization is actually enforced |
| 05 | [Voice Pipeline](./05-voice-pipeline.md) | Composed Deepgram STT → LLM → TTS: topology, turn detection, failure modes, capacity |
| 06 | [AI Pipelines & Observability](./06-ai-pipelines.md) | GPT-5.6 tiering, structured outputs, Langfuse under a no-PHI telemetry contract, evaluation |
| 07 | [Cleanup Plan](./07-cleanup-plan.md) | The deletion inventory — ~12,000 LOC and 25.9 MB, with verdicts and risk |
| 08 | [Migration Plan](./08-migration-plan.md) | Build order, what gets ported, the non-engineering gates |
| 09 | [Decision Log](./09-decision-log.md) | Twelve ADRs, and what they supersede |

**Reading order.** For the shape of the thing: 01 → 09 → 08. For implementation:
03 → 04 → the relevant pipeline doc. 02 and 07 are reference — read them when you
want to know why something is being replaced rather than fixed.

---

## The decisions, in one place

| | Decision |
|---|---|
| Market | **British Columbia, Canada.** PIPEDA + BC PIPA. SaaS revenue; billing deferred |
| Platform | **Supabase** — Postgres, Storage, Auth — in `ca-central-1` |
| Tenancy | Shared database, `organization_id`, **forced RLS**, tenancy from the JWT |
| ORM | Drizzle behind a **two-client boundary**; `drizzle-kit push` banned |
| Auth | **Supabase Auth** — staff at AAL2, patients episode-scoped and phone-verified |
| Voice | **Composed** Deepgram STT → GPT-5.6 → Aura TTS. We own the turn loop |
| LLM | **GPT-5.6** — Luna for bounded work, Sol for clinician-facing prose |
| Observability | **Langfuse Cloud** under a no-PHI telemetry contract, CI-enforced |
| Vision | **Shelved** |
| Shape | Modular monolith + a durable worker |

Full context and consequences for each: [09](./09-decision-log.md).

---

## Four ideas the rest of the docs assume

**1. The authority boundary is the product, not a compliance layer.**
Rehabify drafts; a physiotherapist approves. It does not diagnose, does not
finalize notes, does not invent treatments outside the approved library, and does
not independently progress, regress, pause, or stop treatment. Every technical
decision here is downstream of that — it is why the voice pipeline is composed
rather than a managed agent, why exercise selection is an enum resolved by exact
ID, and why nothing publishes without an approved plan version.

**2. Where residency can be bought, buy it. Where it cannot, design around it.**
Canadian residency is unsolved or unconfirmed with every vendor in this stack.
Postgres, Storage, and Auth sit in `ca-central-1`. Observability cannot — no
vendor has a Canadian region — so the answer is to **send no PHI at all**, and
assert that in CI. Speech is where this move is unavailable, which is why the
Deepgram residency conversation is a gating dependency rather than a detail.

**3. A guarantee that depends on everyone remembering is not a guarantee.**
Three places in this architecture replace a policy with a narrow, enforced choke
point: the ESLint-guarded `db.admin` boundary ([03 §4](./03-data-architecture.md)),
the single `mip_opt_out=true` URL builder ([05 §6](./05-voice-pipeline.md)), and
the telemetry attribute allowlist test ([06 §3](./06-ai-pipelines.md)). Each is
one function or one test, and each stands in for a rule that would otherwise be
documentation.

**4. Silent failures are the recurring enemy.**
The current repo's RLS policies parse and do nothing. `drizzle-kit push` reports
success and skips policy SQL. Deepgram keyterms fail without an error. Custom
JWT claims go stale for an hour. Signed Storage URLs cannot be revoked. In every
case the system reports success while the guarantee is absent — so the tests in
[08](./08-migration-plan.md) are written *before* the things they protect, not
after.

---

## Status

Specification. No rebuild code has been written.

The nine documents are complete. Open items live at the end of each doc; the ones
that block the pilot are consolidated in
[08 §4](./08-migration-plan.md) — and three of them (Supabase's PIPEDA
representation, Deepgram's Canadian residency, OpenAI's DPA coverage) are
conversations with other organizations that should start before the first line of
rebuild code.

One decision remains explicitly **Proposed** rather than Accepted:
[ADR-010](./09-decision-log.md), `nova-3-medical` over Flux. It is settled by a
bake-off against recorded intake audio, and that should happen before the pilot.
