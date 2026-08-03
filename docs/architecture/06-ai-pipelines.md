# 06 — AI Pipelines & Observability

> **Decisions:** LLM provider is **OpenAI GPT-5.6**, tiered Luna/Sol per task
> (ADR-008). Observability is **Langfuse, on Cloud, under a strict no-PHI
> telemetry contract** (ADR-009) — *not* self-hosted, and *not* relying on a BAA
> as the primary control.
>
> Facts verified 2026-08-02 against `openai.com`, `developers.openai.com`,
> `langfuse.com`, and the shipped npm bundles. Unverified claims are flagged.

---

## 1. LLM provider

[GPT-5.6](https://openai.com/index/gpt-5-6/) shipped **2026-07-09** in three
tiers, least to most capable: **Luna**, **Terra**, **Sol**. Luna is the
cost-optimized tier — 1M+ context, vision, tool use, function calling,
[$1.00/M input tokens at OpenAI](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

**Routing is per-task, not global.** The cheap tier is right for bounded,
schema-constrained, high-volume work; it is not right for the one place where a
model's output reaches a clinician as prose.

| Pipeline | Tier | Why |
|---|---|---|
| Intake question phrasing | **Luna** | Phrase one *approved* question. Bounded, high volume, ~40 turns/session. |
| Structured answer extraction | **Luna** | Output is a Zod schema. The schema, not the model, carries the correctness burden. |
| Assessment dictation → proposed findings | **Luna** | Proposals are clinician-verified before they can drive a plan (stage E). |
| Plan-item rationale & patient wording | **Sol** | Reaches the clinician as prose and the patient as instructions. Highest review cost if wrong. |
| Pre-visit brief (stage D) & next-review briefing (stage I) | **Sol** | Synthesis across the full episode; every assertion must be attributable. |
| Between-visit check-in summarization | **Luna** | Short, templated, high volume. |
| Golden-case LLM-as-judge | **Sol** | Judge quality bounds eval quality. Synthetic data only — see §5. |

Terra is not used. If Sol proves unnecessary for briefs, drop to Terra before
dropping to Luna; the tier is a quality dial on clinician-facing prose.

### Non-negotiables regardless of tier

1. **Structured outputs everywhere.** Every extraction and every plan item is a
   schema round-trip. A validation failure is a re-prompt or a hard failure —
   never a coerced value.
2. **`findClosestSlug` is deleted, not ported.** The current fuzzy matcher in
   `src/lib/gemini/plan-generator.ts:35` maps model output onto real exercise IDs
   on ≥2 shared words or ≥50% overlap. That is the mechanism by which a
   model-invented exercise becomes a real prescription. Exercise selection is an
   **enum constrained to the clinic's approved library**, resolved by exact ID.
   See [02-current-state.md §5](./02-current-state.md).
3. **The model never decides the next question** and never mutates treatment
   state. See [01-product-definition.md](./01-product-definition.md).
4. **Safety, consent, and outcome language is exact reviewed text** and does not
   pass through a model at all.
5. **Training prohibition.** OpenAI's API does not train on business API data by
   default, but this must be confirmed in the contract alongside a BAA or
   Canadian DPA — the same conversation as [05 §6](./05-voice-pipeline.md).
   **⚠️ Unverified: whether OpenAI's BAA covers GPT-5.6 tiers and what the
   Canadian data-residency options are. Confirm before provisioning.**

### Governance entities

Every model call is recorded in Postgres, not just in telemetry:

`GenerationJob` (the unit of work) → `ModelRun` (one call: model ID, tier,
`PromptVersion`, token counts, latency, validation verdict) → `AIArtifact` (the
validated output) → `SourceReference` (provenance links) → `EvaluationResult`
(scores) → `AuditEvent`.

**Postgres is the source of truth. Langfuse is a lens.** If Langfuse is
unavailable, the clinical record is unaffected.

---

## 2. Observability — why Langfuse, and the shape of the decision

Four options were evaluated in depth (Langfuse, Braintrust, LangSmith, Helicone,
plus plain OpenTelemetry). The full comparison is in
[Appendix A](#appendix-a--alternatives-considered). The short version:

**No vendor has a Canadian region. Not one.** Langfuse Cloud offers US, EU,
Japan, and a HIPAA region in `us-west-2` (Oregon). Braintrust is US/EU.
LangSmith is GCP US/EU/APAC + AWS US. Helicone is US/EU. So "pick the one with
Canadian residency" is not a move that exists.

That reframes the problem. If residency cannot be solved by vendor selection,
solve it by **not sending PHI at all**.

> **The highest-leverage decision in this document:** telemetry carries
> *structure*, never *content*. A trace that reads *"care-plan composer, 4 rules
> evaluated, 1 violation (`RULE_KNEE_LOAD`), 2 citations, 1,840 tokens, schema
> valid, prompt v7"* is enormously useful for debugging and contains zero PHI.
>
> Done this way, Langfuse Cloud without a BAA becomes defensible, the Oregon
> residency question becomes moot, and we avoid operating a ClickHouse cluster.

Langfuse wins on the remaining criteria: it is OTel-native (so the instrumentation
is portable if we leave), MIT-core and genuinely self-hostable if the no-PHI
contract ever proves insufficient, and its dataset/experiment API gates CI
natively.

### ⚠️ Three findings that shaped this

**1. Langfuse was acquired by ClickHouse on 2026-01-16.** The compliance contacts
on langfuse.com are now `legal@clickhouse.com` / `privacy@clickhouse.com`, and
self-host Enterprise is now bundled with and "additive to" a ClickHouse
commercial plan. Public commitments are that the OSS licence and Cloud both
continue unchanged. **The BAA counterparty and subprocessor list have changed;
the published BAA PDF is dated 2025-04-29 and predates the acquisition.**

**2. The JS masking hook has a real gap** — verified in the shipped
`@langfuse/otel@5.10.0` bundle, not from docs. `applyMaskInPlace()` iterates a
hardcoded list of exactly six attributes:

```
langfuse.trace.input        langfuse.observation.input
langfuse.trace.output       langfuse.observation.output
langfuse.trace.metadata     langfuse.observation.metadata
```

Third-party OTel instrumentation writes content to `gen_ai.*` / OpenInference
attributes, which the mask **never touches**. The Python SDK has a second hook
(`mask_otel_spans`) for exactly this; **the JS SDK has no equivalent**.
`user.id` and `session.id` are also never masked.

*This bites less than it might*: the documented failure case is the third-party
Arize Anthropic instrumentation. We are on OpenAI, and Langfuse ships a
**first-party `@langfuse/openai` wrapper** that writes to the maskable
`langfuse.*` attributes. **Use `@langfuse/openai` or the Vercel AI SDK provider.
Do not add third-party OTel LLM instrumentation.** This is enforced by §3's
allowlist, and tested.

Good failure mode, also verified in the bundle: if the mask function throws, the
attribute becomes `"<fully masked due to failed mask function>"`. **It fails
closed.**

**3. Langfuse v4.0.0 shipped 2026-07-29 — four days ago.** v4.1.0 on 07-30,
v4.2.0 on 07-31. **Pin to v3.224.x.** Revisit in roughly two quarters. v4 gates
the faster Observations/Metrics v2 APIs and Monitors & Alerts, none of which we
need at pilot scale.

---

## 3. The no-PHI telemetry contract

> **Scope, added 2026-08-02.** Everything in this section governs **real patient
> traffic only.** Synthetic and golden-case runs are traced with **full content** —
> prompts, completions, tool calls, judge reasoning — in a *separate Langfuse
> project with separate credentials* that production cannot reach. There is no PHI
> in a synthetic case, so there is no contract to violate, and an eval harness you
> cannot read traces from cannot debug a regression.
>
> The split, and why the discriminator is two projects rather than a boolean flag:
> [08 §3a](./08-migration-plan.md). This section is unchanged for the path that
> matters.

Four layers, in order of load-bearing. **Masking is layer three, not the design.**

### Layer 1 — deny-by-default span export (primary control)

`shouldExportSpan` drops anything not on an explicit allowlist of our own
instrumentation scopes. A new library that starts emitting spans is silently
dropped rather than silently exported.

### Layer 2 — send structure, never content

Never call `span.update({ input })` or `{ output }` with clinical text. Emit:
token counts, schema-validation pass/fail, rule IDs fired, `SourceReference`
*counts*, latency, model ID and tier, `PromptVersion`, question-node ID, retry
count, turn index.

### Layer 3 — `mask` as a regex backstop

For accidental leakage only. Regex will not reliably redact free-text clinical
narrative, and it is not asked to.

### Layer 4 — opaque identifiers

`userId` and `sessionId` are per-episode UUIDs. **Never an MRN, name, phone
number, or anything derived from one** — they are not maskable.

### The CI invariant

The masking gap is a code-level property, so it is tested like one:

> **A CI test asserts that no `gen_ai.*` attribute, and no attribute outside the
> allowlist, reaches the exporter.** It fails the build.

This is the same class of control as the single `mip_opt_out=true` URL builder in
[05 §6](./05-voice-pipeline.md) and the RLS client boundary in
[03-data-architecture.md](./03-data-architecture.md): a narrow, testable choke
point standing in for a policy.

### Trace correlation

Langfuse supports deterministic trace IDs, so `GenerationJob` needs no join
table:

```ts
const traceId = await createTraceId(generationJob.id); // 32 hex chars
```

The durable worker attaches to a trace opened in Next.js by supplying a
`parentSpanContext`; the parent span need not exist (Langfuse documents the
`spanId` as inheritance-only). Store `getActiveSpanId()` on the `ModelRun` row.

| Our entity | Langfuse | Note |
|---|---|---|
| `GenerationJob.id` | trace ID via `createTraceId()` | deterministic |
| `ModelRun` | `generation` observation | |
| `AIArtifact.id` | metadata on root span | **opaque ID only** |
| `PromptVersion` | `langfuse.observation.prompt.{name,version}` | |
| `EvaluationResult` | Score (`NUMERIC`/`CATEGORICAL`/`BOOLEAN`/`TEXT`) | |
| `SourceReference` | ❌ **never sent** | citations point at clinical documents |
| `AuditEvent` | ❌ stays in Supabase | Langfuse audit logs are *their* trail, not ours — and are EE-gated |

### Runtime placement

`@langfuse/otel` requires **Node ≥20** (Node 22+ with AI SDK 7). **It is not an
Edge-runtime library.** In serverless handlers, `forceFlush()` before exit (on
Vercel, via `after()`). Flush never throws — it logs and retries.

**Prefer tracing from the durable worker**: long-lived process, no flush race,
and it is where the expensive pipelines already run.

---

## 4. Prompt management — git is the source of truth

**Do not adopt Langfuse prompt management as authoritative.** Reasons specific
to this product:

- Langfuse serves prompts stale-while-revalidate with a 60s default TTL. **A bad
  prompt reaches production in ~60 seconds with no deploy gate and no code
  review.** For clinician- and patient-facing clinical text that is
  disqualifying.
- The golden-case suite must run on *every* prompt change. Only git gives us the
  CI hook.
- `PromptVersion` and `AuditEvent` are already governance entities. Splitting the
  source of truth across a vendor creates a reconciliation problem in an audit.

**Instead:** prompts live in git → CI runs golden cases → on merge, CI
*publishes* the version to Langfuse **and** writes the `PromptVersion` row. Pass
`langfuse.observation.prompt.{name,version}` on every generation so traces stay
filterable by prompt version. Full analytics, no availability coupling, no
governance split.

If non-engineer prompt editing is wanted later, revisit — but gate it behind the
eval suite, and note that protected prompt labels are EE-gated when self-hosted.

---

## 5. Evaluation — the golden-case gate

[01-product-definition.md](./01-product-definition.md) requires golden synthetic
cases (normal, ambiguous, safety-rule, valid-plan, invalid-plan, follow-up) to
exist before real deployment, and requires every prompt, model, rule, and schema
change to run the regression set. This is the mechanism.

Langfuse datasets + `runExperiment` support item-level `evaluators` and aggregate
`runEvaluators`, and all of it is free on every tier including Hobby:

```ts
const result = await dataset.runExperiment({
  name: "golden-cases",
  task, evaluators,
  runEvaluators: [gatingEvaluator],
  maxConcurrency: 10,
  metadata: { ciRun: process.env.GITHUB_RUN_ID },
});
await result.format();
const gate = result.runEvaluations.find(e => e.name === "gate_pass");
if (!gate || gate.value < 1.0) process.exit(1);
await otelSdk.shutdown();   // must flush before exit
```

**Governance gap to work around:** *"Experiments always run on the latest dataset
version"* — there is **no version pinning**. For a regulated regression suite
that is unacceptable on its own, so **golden cases are versioned in git and
pushed to Langfuse by CI**, never authored in the UI. Same principle as §4.

### 🔴 LLM-as-a-judge is a PHI hazard

It runs server-side, maps observation input/output/metadata into a judge prompt,
and sends it to the configured LLM connection. If production traces ever
contained PHI, this is a second, unreviewed disclosure path — and it would need
to satisfy the training prohibition independently.

**Restrict LLM-as-a-judge to synthetic golden cases. Disable it on production
traces.** Enforce in project configuration, and note it in the runbook.

---

## 6. Cost

| | Price | Note |
|---|---|---|
| Hobby | Free | 50k units, 30d retention, 2 users |
| **Core** | **$29/mo** | 100k units, 90d retention, unlimited users |
| Pro | $199/mo | 3y retention, SOC2/ISO reports, **HIPAA region**, retention management |
| Enterprise | $2,499/mo | + audit logs, SCIM |
| Overage | $8/100k units | all paid tiers |

**Start on Core.** Under the no-PHI contract, the Pro-tier HIPAA region is not
what we are buying — retention management and the SOC 2 report are the reasons
to move up, and neither is urgent at 1–2 pilot clinics.

Self-hosted OSS is free and unlimited, but requires ClickHouse **plus** a second
Postgres **plus** Redis **plus** blob storage **plus** two app containers — and
the three EE-gated features are *retention policies, audit logs, and server-side
masking*, i.e. exactly the compliance controls. That is a meaningful fraction of
an SRE for a clinic-scale team. Revisit only if counsel rejects the no-PHI
argument.

---

## 7. Before this spec freezes

| # | Action | Blocks |
|---|---|---|
| 1 | Written confirmation of the **post-acquisition BAA counterparty** and updated subprocessor list (`legal@clickhouse.com`) | Any fallback to a BAA-based posture |
| 2 | Resolve the **retention-policy EE contradiction** — the data-retention doc describes it without an EE gate; the licence page lists it as EE | Self-host option |
| 3 | **Pin Langfuse to v3.224.x** | Immediate |
| 4 | Write the **CI attribute-allowlist test** (§3) | Before any real trace |
| 5 | Ask privacy counsel whether **US-hosted telemetry is acceptable at all under BC PIPA**, even de-identified | Whether the Cloud path is open |
| 6 | Confirm **OpenAI BAA/DPA coverage for GPT-5.6 tiers** and Canadian residency options | Provisioning |
| 7 | Confirm **OpenAI training prohibition** in contract, not just in default settings | Provisioning |

Items 5 and 6 are the same conversation as [05 §6](./05-voice-pipeline.md) and
the unresolved Canada-vs-US market question (ADR-011). **Have it once, for all
three vendors.**

---

## Appendix A — alternatives considered

| | Self-host | Licence | BAA | 🇨🇦 region | TS SDK | Prompt mgmt | Evals/CI |
|---|---|---|---|---|---|---|---|
| **Langfuse** ✅ | Free, full | MIT core + `ee/` dirs | Pro+, US-Oregon | ❌ | Excellent, OTel-native, v5.10.0 | Strong, w/ fallback | **Native SDK gate** |
| Braintrust | ⚠️ Enterprise, **hybrid** — control plane stays vendor-side | Proprietary server | Enterprise | ❌ | Best-in-class; OTLP ingest | Strong | ⚠️ Action comments only, no documented gate |
| LangSmith | ⚠️ Enterprise, self-contained, licence key | Proprietary | ⚠️ **unverified** | ❌ | Excellent; some `experimental/` | Strong | **Best** — `langsmith/vitest` fails the build |
| Helicone | ✅ Free, full | **Apache-2.0**, no EE carve-out | ❌ **undocumented** | ❌ | ❌ stale 9–13mo; no OpenAI-agnostic OTel | Exists | ❌ **none** |
| Plain OTel | ✅ it's yours | Apache-2.0 | N/A | ✅ anywhere | Client only | ❌ build it | ❌ build it |

Why each was not chosen:

**Braintrust** has the best TypeScript SDK (v3.26.0, published 2026-08-01) and
OTLP ingest that maps `gen_ai.*` natively — genuinely the lowest lock-in. But
self-hosting is Enterprise-only and *architecturally hybrid*: the web UI,
authentication, user management, and metadata storage stay vendor-side. A vendor
component in the auth path complicates the PHI story rather than simplifying it.
Infra is also heavier than Langfuse (Postgres 17+ at 15k IOPS, Redis, plus
proprietary Brainstore at 150k IOPS).

**LangSmith** has the strongest CI story of anyone — `ls.describe()`/`ls.test()`
raise assertion errors that fail the build natively — and its self-host is fully
self-contained, which is *better* than Braintrust for PHI. It loses on: the BAA
claim could not be confirmed from a primary page (`trust.langchain.com` is
JS-rendered; the support article 404'd), it is proprietary and licence-keyed, and
its Vercel/OTel entrypoints are still under `experimental/`. Worth revisiting if
the no-PHI contract fails and we need genuine in-jurisdiction self-hosting.

**Helicone** is the only true Apache-2.0 full self-host, so a `ca-central-1`
deployment would need **no BAA at all** — the cleanest PHI posture on paper. In
practice it disqualifies itself: packages stale 9–13 months, no OTel exporter, no
CI eval gate and no TS eval SDK (directly contradicting our golden-case
requirement), BAA undocumented anywhere, and self-host docs that warn port 8585
proxying is unauthenticated by default and *"container restarts will wipe all
data."*

**Plain OTel → our own Postgres** gives Canadian residency for free, and two hard
blockers. The GenAI semantic conventions **moved** to
`open-telemetry/semantic-conventions-genai` — a repo with **zero tagged
releases**, Schema URL still "TODO", and **every `gen_ai.*` attribute marked
Development**. Nothing is stable. And there is **no PostgreSQL exporter** among
the 47 in collector-contrib; we would write a Go exporter or our own OTLP
receiver, into a Postgres that is not columnar. Worst of all, OTel gives us
nothing for prompt management or evals — precisely the parts we need most.

---

*Sources: `openai.com`, `developers.openai.com`, `langfuse.com`,
`github.com/langfuse/langfuse`, npm registry, and the shipped
`@langfuse/otel@5.10.0` / `@langfuse/core@5.10.0` bundles. Retrieved 2026-08-02.*
