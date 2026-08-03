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
| 07 | [Cleanup Plan](./07-cleanup-plan.md) | The deletion inventory — ~9,300 LOC and 25.9 MB, with verdicts and risk |
| 08 | [Migration Plan](./08-migration-plan.md) | Three concurrent tracks, what gets ported, the non-engineering gates |
| 09 | [Decision Log](./09-decision-log.md) | Fifteen ADRs, and what they supersede |
| 10 | [Clinical Content & Evaluation](./10-clinical-content.md) | Where exercises come from, the metadata that gates rather than displays, templated plans, and the eval strategy |
| 11 | [Diagrams](./11-diagrams.md) | Where components live, one voice-intake turn, and what gets recorded where |

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
| Speech hosting | **Self-hosted in `ca-central-1`**, on cloud credits — *proposed*, gated on model availability ([ADR-013](./09-decision-log.md#adr-013)) |
| LLM | **GPT-5.6** — Luna for bounded work, Sol for clinician-facing prose. Residency is an open fork ([ADR-008](./09-decision-log.md#adr-008)) |
| Observability | **Langfuse Cloud** — no-PHI on real traffic, **full content on synthetic**, split across two projects ([08 §3a](./08-migration-plan.md)) |
| Sequencing | **Three concurrent tracks, two deadlines** — raise and first-patient are different dates ([ADR-014](./09-decision-log.md#adr-014)) |
| Vision | **Retained, untouched, out of the first slice** — rebuilt from scratch later, never ported ([ADR-003](./09-decision-log.md#adr-003), [ADR-015](./09-decision-log.md#adr-015)) |
| First slice | **Voice intake → plan generation → clinician approval**, cut thin through every layer ([ADR-015](./09-decision-log.md#adr-015)) |
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

**2. Buy residency, or don't send the data, or host it yourself.**
Canadian residency is unsolved or unconfirmed with every vendor in this stack, and
there are exactly three answers. **Buy it** where it is sold — Postgres, Storage,
and Auth sit in `ca-central-1`. **Don't send the data** where it is not sold and
the data need not travel — no observability vendor has a Canadian region, so the
answer is to send no PHI at all and assert that in CI. **Host it yourself** where
the data must travel and no region exists: speech is that case, and Deepgram's
containers can run in `ca-central-1` even though Deepgram's cloud cannot
([ADR-013](./09-decision-log.md#adr-013)).

The third move is what the cloud credits are for, and it is worth naming why it
was almost missed: the first draft of these docs treated a vendor's hosted region
list as the whole menu, concluded speech had no answer, and wrote gate 2 as an
open-ended wait. **The residency question is "where does the data sit," not
"where does the vendor operate."**

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

The twelve documents are complete. Open items live at the end of each doc; the
ones that block the pilot are consolidated in [08 §4](./08-migration-plan.md) —
and three of them (Supabase's PIPEDA representation, Deepgram's Canadian
residency, OpenAI's DPA coverage) are conversations with other organizations that
should start today.

**They should start today because they are cheap to run in the background, not
because they block the next thing.** All three gate *real patient data*, and the
nearer milestone runs on synthetic data ([ADR-014](./09-decision-log.md#adr-014)).
Work proceeds on three tracks that do not wait on each other.

The largest unpriced risk in the project is not technical: **Track B0, committing a
clinical lead.** Stages 8 and 9b, gate 9, and the entire scope of
[10](./10-clinical-content.md) rest on physiotherapist hours that are not yet
promised.

Two decisions remain explicitly **Proposed** rather than Accepted, and they are
the same question seen twice:

- [ADR-010](./09-decision-log.md#adr-010) — `nova-3-medical` over Flux, settled by
  a bake-off against recorded intake audio.
- [ADR-013](./09-decision-log.md#adr-013) — self-hosted speech in `ca-central-1`,
  gated on whether streaming `nova-3-medical` is available self-hosted at all.

If it is not, **Canadian residency and the medical speech model are mutually
exclusive**, and that is a clinical-risk decision rather than an architectural
one. Both are answered by the same Deepgram Enterprise conversation, which is why
it should start now.
