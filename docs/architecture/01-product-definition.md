# 01 — Product Definition

> Adapted from `feature-architecture-plan.md` in the `rehabifyy` repository,
> with this rebuild's scope decisions applied: **computer vision is shelved**,
> and the target platform is Supabase + a composed Deepgram voice pipeline.

---

## What Rehabify is

Rehabify is an AI workflow copilot for physiotherapy clinics. It conducts
structured pre-visit intake, briefs the physiotherapist, drafts a care plan
using that clinician's preferred exercises and rules, and summarizes the
patient's response between appointments.

It accelerates work without replacing examination or clinical judgment. The
product hierarchy is **time savings → care consistency → patient outcomes**.

The first customer is a clinician-owner or clinical lead at a small outpatient
musculoskeletal clinic with roughly 2–10 physiotherapists.

```text
Patient voice or text intake
  → Structured pre-visit brief
  → Physiotherapist examination and findings
  → Clinician-specific plan draft
  → Clinician review, approval, treatment-consent attestation
  → Patient exercises and check-ins
  → Next-review progress summary
```

---

## The authority boundary

This is the constraint that shapes every technical decision in this spec. It is
not a compliance afterthought — it is the product.

**Rehabify may:** collect and organize history, identify missing or
contradictory information, draft documentation, retrieve clinic-approved
exercises, draft plan options, show provenance, summarize trends.

**Rehabify must not:** diagnose, claim an injury diagnosis, finalize notes
automatically, invent treatments outside the approved library, select treatment
without approval, present unexplained recommendations, or independently
progress, regress, stop, pause, or replace treatment.

When a patient response matches an explicit clinician-approved threshold,
Rehabify may show **exact reviewed contingency text**, record the patient's
acknowledgement or decision to hold the affected activity, and atomically create
an owned clinical-attention task. **It does not mutate treatment state.**
Clearing a patient hold or changing the plan requires a physiotherapist-approved
replacement plan version.

Language: `draft`, `consider`, `review`, `supporting finding`, `requires
approval`.

> **The current codebase violates this boundary.** `POST /api/assessments/save`
> generates a plan and inserts it with `status: 'approved'` and no clinician in
> the loop, and `findClosestSlug` fuzzy-matches model output onto real exercise
> IDs. See [02-current-state.md §5](./02-current-state.md). Both are removed in
> the rebuild.

---

## Users

**Physiotherapist** — the principal user and the buyer. Needs less repetitive
intake work, faster documentation, plans that reflect their own practice, better
between-visit information, and confidence the system has not invented anything.

**Patient** — needs low-friction intake, a clear approved plan, short check-ins,
and a way to report issues without receiving autonomous medical advice.

**Clinic administrator** — clinician invitations, branding, consent language,
exercise-library management, basic usage data. Scheduling, payments, payroll,
insurance claims, and clinic management are out of scope.

---

## First release scope

One complete vertical slice: English-speaking adults physically in **British
Columbia** meeting a partner clinic's signed inclusion/exclusion criteria for
**non-acute knee complaints**, with a ≤30-exercise clinician-reviewed library.

Target: a controlled design-partner pilot — 1–2 clinics, 2–5 physiotherapists,
20–50 active episodes. Clinic onboarding may be manual. **The clinic clinical
lead signs the exact pathway boundary before any real-patient episode is
enabled.**

### Workflow stages

| | Stage | Summary |
|---|---|---|
| A | Clinic & clinician playbook | Exercise library with provenance, contraindications, dosage bounds, review versions. Clinical lead activates content before it can drive a plan. Each clinician configures preferences; edits create a versioned `PlaybookRuleProposal` requiring confirmation. Nothing becomes a global rule automatically. |
| B | Patient onboarding & consent | Expiring SMS episode link → PHI-free pending session → OTP to the phone in the clinic's record → episode-scoped grant. Before verification the patient sees no identity or clinical information. Data-processing consent only; treatment consent is separately attested by the clinician per plan version. |
| C | Adaptive intake | 8–12 min resumable subjective history. Feels conversational, **is a controlled questionnaire**. Text is a complete fallback, not a degraded one. |
| D | Pre-visit clinician brief | Not a transcript wall. Every material statement links to the answer, transcript segment, and timestamp. Corrections create audit events. |
| E | Assessment workspace | ROM, strength, functional testing, observations, palpation, special tests, working hypothesis. Structured knee template + dictation. Dictated findings are *proposed* and must be verified before plan generation. |
| F | Constrained care-plan composer | Hard constraints in code, soft preferences for ranking, dosage from approved templates, LLM only for rationale and patient wording. Nothing published until a physiotherapist approves the whole version. |
| G | Patient plan | Primary screen is `Today`, not a chatbot. Optional voice guide paces reps/holds/rest. **It never claims to observe or correct form.** One-tap `I'm unsure` creates a clinical-attention task. |
| H | Between-visit check-ins | 10–20s post-session check-in. Threshold crossings show exact reviewed contingency text and create a task — they never change treatment state. |
| I | Next-review briefing | Generated 24h before clinician-entered `next_review_at`. Every assertion labeled: patient reported / system calculated / clinician previously specified / AI suggestion requiring review. |

### Intake control flow

```text
Approved question graph
  → LLM selects or phrases an allowed next question
  → speech-to-text or typed answer
  → structured answer extraction
  → schema validation
  → deterministic clinical-rule checks
  → next question or completion
```

The LLM **may** phrase questions, clarify ambiguity, confirm dates or locations,
summarize answers, and choose among approved follow-ups. It **may not** create a
question category, diagnose, reassure, recommend an exercise, decide treatment
appropriateness, or invent urgency instructions.

The patient is **never** told that free text is monitored for emergencies.

---

## Rules engine

Versioned rules cover required fields, intake branching, escalation,
prerequisites, contraindications, dosage bounds, progression/regression,
equipment, clinician exclusions, plan publication, attention-task creation, and
plan-change approval.

```json
{
  "rule_type": "exercise_eligibility",
  "exercise_id": "exercise_123",
  "when": {
    "all": [
      {"field": "equipment_available", "contains": "resistance_band"},
      {"field": "clinician_disabled", "equals": false}
    ]
  },
  "effect": "eligible",
  "version": 3
}
```

**The language model cannot bypass this engine.** In the pilot, a contingency
rule may select reviewed content and an attention tier; it cannot mutate
treatment state.

---

## Evaluation targets

Primary pilot outcome is **measured clinician time saved**: median reduction of
≥10 minutes for an initial visit, ≥5 minutes for a follow-up.

Quality guardrail: **≥80% of generated plan items approved with no or minor
edits.** Time saved does not count if correction effort increases.

Golden synthetic cases (normal, ambiguous, safety-rule, valid-plan,
invalid-plan, follow-up) must exist before real deployment. Every prompt, model,
rule, and schema change runs the regression set.

---

## Explicitly deferred

Computer vision, AI-observed form correction, autonomous diagnosis, any
automatic treatment-state mutation, generated patient-support answers, document
upload or summarization, a general medical chatbot, a full EHR, billing,
scheduling, an exercise marketplace, recovery prediction, provider ranking,
population-level recommendations, microservices, Kubernetes, a custom foundation
model.

---

## Scope conflict — resolved: Canada / BC

> **Decided 2026-08-02: the target market is British Columbia, Canada.**
> `docs/redesign/` is superseded in full. ADR-011 is **Accepted**.

The superseded `docs/redesign/` spec and this document assumed **different
countries and different business models**, and the difference was not cosmetic.

| | `docs/redesign/` (superseded) | This document |
|---|---|---|
| Market | United States | British Columbia, Canada |
| Regulation | HIPAA, BAAs | PIPEDA + BC PIPA / provincial health privacy |
| Revenue | $39/mo SaaS **+ CPT 98977/98980 RTM reimbursement (~$98/patient/mo)** | SaaS only; billing explicitly deferred |
| Vision | Central — MediaPipe + DTW, skeleton streaming for billing-grade verification | Shelved |

**CPT codes are US Medicare billing codes. They do not exist in the Canadian
system.** With BC confirmed, the entire billing-engine premise — and the unit
economics built on it in `docs/redesign/02-unit-economics.md` — **does not
apply and is discarded.** Revenue is SaaS-only; billing stays deferred.

### What choosing BC costs us

This is the expensive option, and the docs should say so plainly. Canadian data
residency is **unsolved or unconfirmed with every vendor in this stack**:

| | Canadian residency |
|---|---|
| Supabase Postgres / Storage / Auth | ✅ `ca-central-1` |
| Supabase **platform logs** | ❌ almost certainly out-of-region — **the biggest gap** |
| Supabase Edge Functions | ⚠️ global by default; must be pinned with `x-region` |
| Supabase Realtime | ⚠️ residency undocumented |
| Deepgram | ❌ **no Canadian endpoint.** EU and AU only; "servers are exclusively in the United States." Dedicated on AWS `ca-central-1` is plausible but **unconfirmed**, and Enterprise-only |
| Langfuse / Braintrust / LangSmith / Helicone | ❌ **none has a Canadian region** |
| OpenAI | ⚠️ unconfirmed |

Two consequences run through the rest of these docs:

1. **Supabase has zero PIPEDA representation anywhere on its site.** Not a
   technical blocker, but a **legal-review blocker** that must be cleared before
   real patient data lands. Raise it with counsel early.
2. Where residency cannot be bought, it is **designed around** — see the no-PHI
   telemetry contract in [06 §3](./06-ai-pipelines.md), which makes the
   observability vendors' US hosting moot by never sending them PHI. The same
   move is not available for speech, which is why
   [05 §6](./05-voice-pipeline.md) treats the Deepgram residency conversation as
   a gating dependency rather than a detail.

Tracked as **ADR-011** in [09-decision-log.md](./09-decision-log.md).

---

*Source: `rehabifyy/docs/feature-architecture-plan.md`, adapted 2026-02-11.*
