# 10 — Clinical Content & Evaluation

> Where exercises come from, which metadata does work and which merely displays,
> why templated plans and the eval set are the same artifact, and what the
> clinical lead actually has to produce.
>
> This is the workstream that runs *beside* the rebuild in
> [08](./08-migration-plan.md), not inside it. It is gated on a person, not on
> code, which is why it starts now.

---

## 0. The scope this assumes

From [01](./01-product-definition.md): **non-acute knee complaints**, English,
BC, **a ≤30-exercise clinician-reviewed library**, 1–2 clinics, 20–50 episodes.

Thirty exercises is the single most important number in this document. It means
the content problem is **days of clinical authoring, not a licensing
negotiation** — and that most of the instincts imported from "we need an exercise
database" are sized for a product we are not building yet.

> ⚠️ **Asset/scope mismatch.** `public/exercise-images/` holds 31 self-made
> images, but roughly half are lumbar-specific (cat-camel, cobra, sphinx, prone
> press-up, standing lumbar flexion/extension/side-bending, knee-to-chest).
> Around 8–10 are knee-relevant — and they are the hip/glute ones (clamshell,
> glute bridge, single-leg bridge, fire hydrant, quadruped/prone hip extension,
> figure-four, 90-90), which is correct, since hip abductor and external rotator
> work is central to patellofemoral rehab. The live vision analyzer is squat,
> which is knee-relevant; the orphaned analyzers are lumbar.
>
> Resolve before authoring: is the pilot pathway knee (per 01) or low back (per
> the assets)? Everything below is written pathway-agnostically, but the
> authoring list is not.

---

## 1. There are two kinds of exercise metadata, and only one is scarce

This distinction decides the whole sourcing question.

**Descriptive metadata** — name, aliases, starting position, equipment, cueing
text, common errors, images, video. It is commodity. Every exercise library
vendor has tens of thousands of these. An LLM can draft it competently for a
physiotherapist to correct. **We already have the images.** Cost: low. Risk: low.
Differentiating value: none.

**Clinical decision metadata** — indications by classification, contraindications
coded against specific intake findings, dosage ranges by rehab phase, progression
and regression edges, stop rules, red flags. This is what lets software decide
*whether* an exercise may be prescribed to *this* patient, rather than merely
render it.

**No exercise library vendor sells the second kind.** Wibbi's 75,000 exercises
and Physitrack's 18,000 videos are descriptive libraries with delivery tooling.
They do not encode "contraindicated when the patient reports night pain," because
that is a clinical judgment belonging to the prescriber, and selling it would
make the vendor a medical device.

**Therefore: buying a library does not solve our problem.** It solves the cheap
half of a problem whose expensive half is the actual product. Author both
ourselves, at 30 items, with the clinical half sourced from published guidelines
and signed by the clinical lead.

---

## 2. Sourcing

### The legal line

Exercise *names* and the movements themselves are not copyrightable — they are
facts and physical acts. Specific written descriptions, photographs, and videos
are. So the lawful method is the one every library company uses: read widely,
**author your own expression**, and cite the clinical sources for the reasoning.

**Rejected: NASM.** Its exercise library is a free marketing resource with no
commercial licence or API on offer; copying the descriptions is infringement
regardless of reformatting. It is also a US *personal-training* certification,
and sourcing clinical prescriptions from a fitness credential is a credibility
problem in front of the CPTBC-regulated physiotherapist who has to sign the
pathway boundary (gate 9, [08 §4](./08-migration-plan.md)).

**Also rejected: scraping any HEP vendor.** Same infringement, worse optics.

### Where the clinical layer actually comes from

| Source | What it gives | Notes |
|---|---|---|
| **JOSPT clinical practice guidelines** | Indications, classification schemes, graded evidence per intervention — for knee, the patellofemoral pain and knee ligament/meniscal CPGs | The primary source for the decision layer. Citable, authoritative, physio-native |
| **Cochrane / systematic reviews** | Evidence grading behind each protocol choice | Feeds the `evidence_grade` field, and the rationale a clinician reads |
| **Named published protocols** | Phase structure and progression criteria | e.g. criterion-based return-to-sport progressions. ⚠️ Some named programs (GLA:D for knee/hip OA) are **licensed** and require clinician training — reference the evidence, do not reproduce the program |
| **Open exercise datasets** (ExRx API, wger CC-BY-SA, Free Exercise DB) | Naming conventions, aliases, structural sanity-check | Fitness-oriented. Useful for descriptive scaffolding and alias lists only — never for clinical metadata |
| **The clinical lead** | Everything the guidelines leave to judgment, and sign-off on all of it | The bottleneck. See §7 |

### The authoring loop

Use the same authority pattern the product itself uses — **AI drafts, clinician
approves** — because it is the pattern we are asking clinics to trust:

1. LLM drafts descriptive fields for the 30 exercises from general knowledge plus
   the images we already have.
2. LLM drafts the clinical layer *with citations* from the relevant CPG.
3. **The physiotherapist reviews, corrects, and signs each entry.** Nothing is
   `active` until signed.
4. The signature is data: `authored_by`, `approved_by`, `approved_at`,
   `source_refs`, `evidence_grade`.

Step 3 is not a formality — it is the same clinical authority boundary as
[01](./01-product-definition.md), applied to our own content pipeline. An
unsigned exercise cannot enter a plan, enforced by FK, not by policy.

---

## 3. The data model

### What exists today

[`src/db/schema/exercises.ts`](../../src/db/schema/exercises.ts) is a reasonable
start: name, slug, category, body region, difficulty, tier, description,
instructions, common mistakes, contraindications, dosage defaults, equipment,
media, and — usefully — `formDetectionEnabled` + `detectionConfig` wiring to the
retained vision engine ([ADR-003](./09-decision-log.md#adr-003)).

### The five gaps that block the product

| Gap | Consequence |
|---|---|
| **No progression/regression edges** | [01 stage G](./01-product-definition.md) forbids the AI independently progressing or regressing treatment. A clinician-authored progression *graph* is what makes that enforceable in code: the system may only move along an approved edge. Today there is no way to express "this is the harder version of that" |
| **`contraindications` is `text[]`** | Free text renders; it cannot gate. To *prevent* a prescription, a contraindication must be a predicate over structured intake findings |
| **No `organization_id`** | [ADR-008](./09-decision-log.md#adr-008) says "the **clinic's** approved library," but this is one global table. Also violates [ADR-005](./09-decision-log.md#adr-005) — every domain table carries tenancy |
| **No versioning** | If a physio edits contraindications, every already-prescribed plan silently changes meaning. The append-only clinical record forbids that |
| **No provenance** | Source, licence, author, approver, approved-at, evidence grade. Stage 4 adds governance tables for AI artifacts; clinical content needs the same treatment for the same reason |

Minor: no `aliases` (feeds the [ADR-010](./09-decision-log.md#adr-010) keyterm
list and patient-facing phrasing), and `difficulty` as
beginner/intermediate/advanced is too coarse to drive progression — the graph
replaces it.

### Shape

Three tables where there is one:

- **`exercise` (global catalogue)** — the movement's stable identity. Immutable
  `slug`.
- **`exercise_version`** — every clinically meaningful field, versioned and
  append-only. **Plans reference a version, never an exercise.** This is what
  makes "what exactly was this patient told, in April" answerable.
- **`organization_exercise`** — a clinic's approval of a specific version, plus
  clinic-local overrides (dosage bounds, cueing language, disabled entirely).
  `active` gates prescription. Carries `organization_id` and RLS.

Plus **`exercise_progression`** — directed edges `(from_version, to_version,
direction, criteria)` where `criteria` is the clinician-authored condition for
moving along it.

**Contraindications become predicates**, not prose: a small closed vocabulary of
intake findings (`night_pain`, `locking`, `giving_way`, `effusion`,
`weight_bearing_limited`, …) and a rule referencing them. Free-text rationale
still displays to the clinician — it just is not the thing the engine reads. The
vocabulary is deliberately small and closed; a coding system we cannot fully
enumerate cannot be tested against.

---

## 4. Templated plans

A **plan template** is a physiotherapist-authored plan skeleton for one
`(classification × phase)` pair — the exercises, dosage bounds, progression
criteria, and review interval a competent physio would prescribe for that
presentation before seeing this particular patient.

At 30 exercises and one pathway, expect roughly **12–20 templates**.

This is the highest-leverage idea in this document, for four reasons:

1. **It collapses the AI's job.** Not "compose a plan from 30 exercises"
   (combinatorial, unbounded failure surface) but "select the template matching
   this classification, then personalize *within* clinician-authored bounds."
   [01 stage F](./01-product-definition.md) already says dosage comes from
   approved templates — this makes that concrete.
2. **It matches how physiotherapists actually work**, so authoring feels like
   documenting existing practice rather than feeding a machine.
3. **It is the clinical sign-off artifact.** Gate 9 asks the clinical lead to
   sign the pathway boundary. A set of templates *is* that boundary, written
   down.
4. **It is the eval set.** See below.

The LLM's remaining scope is: classification support, selection among templates,
personalization inside declared bounds, and prose. Never membership of the
exercise set beyond the approved library, never a dosage outside bounds.

---

## 5. Evaluation

> "How do we know the plans are actually generated accurately?" — the answer is
> that constraining the library and templating the plans is what makes this
> question answerable at all.

Constraining selection to a known set converts an open-ended clinical judgment
("is this plan correct?", needs a physio per output) into a **set comparison
against a reference** ("did it pick the right subset at the right dosage?").
Four layers, cheapest first.

### Layer 1 — Deterministic gates (not eval; tests)

Assertions, in CI, no model involved:

- every prescribed exercise ID exists and is `active` for this organization
- no exercise whose contraindication predicate matches this patient's findings
- every dosage inside the template's declared bounds
- plan structure complete; no orphaned or duplicate items
- no progression edge traversed that a clinician did not author

**Most of the safety lives here, not in the eval set.** These catch every
catastrophic failure, cost nothing, and never flake. Write them first.

### Layer 2 — Golden cases against template references

The templates from §4 *are* the reference plans. The remaining work is synthetic
patients that should route to them.

**Decompose into two measurable stages**, because a single end-to-end score tells
you nothing about which half broke:

| Stage | Question | Metric |
|---|---|---|
| Classification | Did intake + assessment route to the right template? | Accuracy / confusion matrix over classifications |
| Plan fidelity | Given the right template, is the emitted plan faithful? | Precision & recall on exercise set; dosage delta; hard-fail on any missing `must_include` |

Authoring cost is low because the reference already exists: the physio writes
**3–5 synthetic vignettes per template** that should classify to it, varying
surface presentation while holding classification constant. At 15 templates that
is 45–75 cases, and the physio is confirming a classification rather than writing
a plan.

### Layer 3 — Safety and negative cases

The cheapest high-value cases to author, and the ones that matter most:

- **red-flag vignettes** that must escalate and must *not* produce a plan
- **contraindication cases** where a normally-indicated exercise must be excluded
- **out-of-scope cases** outside the signed inclusion criteria, which must decline
- **ambiguous cases** that must ask rather than assume

A physiotherapist can write ten of these in an hour. They are pass/fail, not
scored. **Any failure here blocks release** — unlike layer 2, where a fidelity
score below target is a tuning signal.

### Layer 4 — Clinician edit distance: the eval set that builds itself

[01](./01-product-definition.md) already targets **≥80% of generated plan items
approved with no or minor edits**. Because the authority boundary *forces* a
physiotherapist to approve every plan before it publishes, **every approval is a
free label.**

Diff the draft against the approved version and record: items removed, items
added, dosage changed, rationale rewritten. That is continuous real-world
evaluation at zero additional process cost, and it is the only layer that
measures the thing we actually care about.

**Instrument this from the first clinical surface in stage 8** — retrofitting it
means discarding the pilot's most valuable data. It is structure, not content
(IDs and deltas, no clinical prose), so it survives the no-PHI telemetry contract
in [ADR-009](./09-decision-log.md#adr-009) unchanged.

### What is not eval

LLM-as-judge is restricted to **rationale prose quality on synthetic cases
only** — never clinical correctness, never patient data. A model is not competent
to judge whether a plan is clinically right, and asking it to is how a plausible
wrong answer gets a passing grade.

---

## 6. Prompt tuning and versioning

Mostly already decided, and worth restating because it is the piece that makes
tuning safe:

- **Prompts live in git**, reviewed like code.
  [ADR-009](./09-decision-log.md#adr-009) rejected Langfuse's prompt CMS because
  its 60-second stale-while-revalidate window means a bad clinical prompt reaches
  production in a minute with no review gate.
- **`PromptVersion`** is already a stage-4 governance table, and every
  `ModelRun` records which version produced it.
- **The tuning loop is layer 2 + layer 3 as a CI gate**: change a prompt, the
  golden set runs, regression exits non-zero ([08 stage 9](./08-migration-plan.md)).

What is missing is only the harness. There is no separate prompt-tuning project —
there is an eval set, and tuning is what you do once you have one.

---

## 7. What the clinical lead has to produce

Every item in this document bottoms out in the same scarce resource:
**a physiotherapist's authoring time.** Not four workstreams — one clinical
content bottleneck with three pieces of software hanging off it. And it is the
same person as gate 9's clinical lead.

| Deliverable | Rough size |
|---|---|
| Approve the pathway and inclusion/exclusion criteria | Already gate 9 |
| Sign 30 exercises: clinical fields, contraindication predicates, dosage bounds | 30 reviews on drafted content |
| Draw the progression graph | One session over the 30 |
| Author 12–20 plan templates | The largest item; also the gate-9 artifact |
| 3–5 vignettes per template | 45–75 classification labels |
| 10–15 red-flag and contraindication cases | ~1–2 hours |

Order matters: **pathway → exercises → templates → vignettes.** Each depends on
the last, so this cannot be parallelized across sessions with them, and it should
start before stage 8 rather than during it.

**Design the authoring surface so their hours produce structured data**, not a
Google Doc someone transcribes later. Transcription is where provenance and
predicate coding quietly get lost, and those are the two fields the whole
enforcement story rests on.

---

## 8. Open questions

1. **Knee or low back?** 01 says non-acute knee; the assets are largely lumbar.
   Blocks the authoring list. *(→ clinical lead + product)*
2. **Who is the clinical lead, and what hours are actually committed?** This
   document assumes a real allocation, not goodwill.
3. **Contraindication vocabulary** — the closed finding list must be enumerated
   and agreed before predicates can be authored or tested.
4. **Does any template need a licensed program** (e.g. GLA:D for knee OA)? If so
   that is a licensing conversation, not an authoring one.
5. **Layer 2 pass thresholds** — what recall on `must_include` items, and what
   dosage delta, constitutes a release gate? Should be set by the clinical lead
   before the first run, not tuned to whatever the first run produces.
