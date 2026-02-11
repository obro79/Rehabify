# 01 — Executive Summary

> Rehabify's pivot from B2C fitness app to B2B Medical Device SaaS for physical therapy clinics.

---

## The Problem

Physical therapy has a compliance and monitoring gap:

1. **Patient adherence is abysmal** — Only ~35% of PT patients complete their prescribed home exercise programs. Clinics have no visibility into what patients actually do between visits.
2. **Existing solutions are too expensive** — Enterprise rehab platforms (Sword Health, Hinge Health) charge $500-2,000+/patient/month, pricing out small and mid-size clinics.
3. **Or too dumb** — Simple exercise reminder apps provide no form feedback, no adherence verification, and no data PTs can bill against.

The result: clinics leave significant RTM (Remote Therapeutic Monitoring) revenue on the table because they lack the tooling to document and bill for it.

## The Opportunity

CMS (Centers for Medicare & Medicaid Services) introduced CPT codes specifically for remote therapeutic monitoring:

| Code | Trigger | Reimbursement | Description |
|------|---------|---------------|-------------|
| **CPT 98977** | 16+ days of device data transmission/month | ~$58/patient/month | Automated — device sends data, no PT interaction required |
| **CPT 98980** | 20+ min of PT review/interaction/month | ~$40/patient/month | Requires documented PT engagement with monitoring data |

**Combined**: ~$98/patient/month in new billable revenue, largely automatable.

Most clinics aren't capturing this revenue because they don't have systems that track the right data in the right format.

## The Solution

Rehabify becomes an **automated adherence and compliance engine**:

1. **AI Voice Coach** — Guides patients through exercises with real-time conversation, replacing static video instructions
2. **Computer Vision Analysis** — Verifies exercise form via MediaPipe pose detection, providing the "device data" required for CPT 98977
3. **Automated Billing Triggers** — Tracks the 16-day device rule and 20-minute PT engagement rule, generating billing-ready records
4. **PT Dashboard** — Gives physical therapists a "call list" of patients who need brief check-ins to trigger CPT 98980

## Competitive Landscape

| Company | Model | Price Point | Weakness |
|---------|-------|-------------|----------|
| **Sword Health** | Enterprise B2B, sensors + coaching | $500-2,000/patient/mo | Too expensive for small clinics |
| **Hinge Health** | Enterprise B2B, sensors + coaching | $500-1,500/patient/mo | Enterprise-only, long sales cycles |
| **Kaia Health** | B2B, app-based vision | $200-400/patient/mo | No voice coaching, limited form analysis |
| **MedBridge** | B2C/B2B, HEP platform | $10-30/patient/mo | No vision, no voice, no RTM billing |
| **Rehabify** | B2B SaaS, voice + vision | **$39/patient/mo** | New entrant, unproven at scale |

## Key Differentiators

1. **Price** — 10-50x cheaper than Sword/Hinge, with comparable AI capabilities
2. **Voice + Vision combined** — No competitor offers both conversational coaching AND computer vision form analysis at our price point
3. **Privacy-first architecture** — Video never leaves the device; only skeleton data (JSON landmarks) is transmitted
4. **Billing automation** — Purpose-built for CPT 98977/98980, not retrofitted
5. **96% gross margin** — Achieved by replacing third-party APIs (Vapi at $40/patient/mo) with direct Gemini integration (~$1.20/patient/mo)

## What This Requires

The pivot requires four architectural workstreams:

1. **Voice Migration** — Replace Vapi ($40/patient/mo) with Gemini 2.0 Flash Live ($1.20/patient/mo)
2. **Vision Enhancement** — Add server-side analysis for billing-grade exercise verification
3. **Data & Compliance** — Multi-tenancy, HIPAA compliance, audit logging
4. **Billing Engine** — CPT code tracking, automated triggers, billing record generation

See [09-migration-plan.md](./09-migration-plan.md) for the phased rollout plan.

---

<!-- TODO: Add TAM/SAM/SOM sizing for the PT clinic market -->
<!-- TODO: Add customer discovery findings / LOIs if available -->
