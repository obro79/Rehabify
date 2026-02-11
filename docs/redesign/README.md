# Rehabify B2B Redesign — Architecture Specification

Rehabify is pivoting from a B2C fitness app (built at nwHacks 2026) to a **B2B Medical Device SaaS** for physical therapy clinics. This directory contains the living architecture specification that guides the transition: replacing expensive third-party APIs with cost-effective alternatives, adding multi-tenancy and HIPAA compliance, and building an automated CPT billing engine that unlocks $98+/patient/month in reimbursable revenue for clinics.

---

## Document Index

| # | Document | Description | Status | Updated |
|---|----------|-------------|--------|---------|
| — | [current-state.md](./current-state.md) | Snapshot of today's architecture as baseline | Draft | 2026-02-11 |
| 01 | [01-executive-summary.md](./01-executive-summary.md) | Pivot rationale, market thesis, competitive positioning | Draft | 2026-02-11 |
| 02 | [02-unit-economics.md](./02-unit-economics.md) | Cost models, pricing, 96% margin analysis | Draft | 2026-02-11 |
| 03 | [03-voice-architecture.md](./03-voice-architecture.md) | Vapi → Gemini 2.0 Flash Live + client-side VAD | Draft | 2026-02-11 |
| 04 | [04-vision-architecture.md](./04-vision-architecture.md) | Skeleton Streaming: client MediaPipe → JSON → server DTW | Draft | 2026-02-11 |
| 05 | [05-data-architecture.md](./05-data-architecture.md) | Schema evolution, multi-tenancy, new tables | Draft | 2026-02-11 |
| 06 | [06-infrastructure.md](./06-infrastructure.md) | Deployment, WebSocket hosting, scaling | Draft | 2026-02-11 |
| 07 | [07-hipaa-compliance.md](./07-hipaa-compliance.md) | PHI handling, encryption, BAAs, audit trails | Draft | 2026-02-11 |
| 08 | [08-billing-engine.md](./08-billing-engine.md) | CPT 98977/98980 automation, billing records | Draft | 2026-02-11 |
| 09 | [09-migration-plan.md](./09-migration-plan.md) | Phased rollout (Foundation → Voice → Vision → Billing) | Draft | 2026-02-11 |
| 10 | [10-api-contracts.md](./10-api-contracts.md) | New/modified/deprecated endpoints | Draft | 2026-02-11 |
| — | [glossary.md](./glossary.md) | Domain terms (CPT, DTW, HIPAA, VAD, etc.) | Draft | 2026-02-11 |
| — | [decision-log.md](./decision-log.md) | ADR-style log of key architectural decisions | Draft | 2026-02-11 |
| — | [diagrams/](./diagrams/) | Mermaid diagrams for pipelines and data flows | Draft | 2026-02-11 |

## Reading Order by Audience

### Investor / Business Stakeholder
1. [Executive Summary](./01-executive-summary.md) — the "why"
2. [Unit Economics](./02-unit-economics.md) — the "how much"
3. [HIPAA Compliance](./07-hipaa-compliance.md) — regulatory readiness
4. [Billing Engine](./08-billing-engine.md) — revenue mechanics

### Engineer / Technical Contributor
1. [Current State](./current-state.md) — where we are today
2. [Voice Architecture](./03-voice-architecture.md) — voice pipeline redesign
3. [Vision Architecture](./04-vision-architecture.md) — vision pipeline redesign
4. [Data Architecture](./05-data-architecture.md) — schema evolution
5. [Infrastructure](./06-infrastructure.md) — deployment & scaling
6. [Migration Plan](./09-migration-plan.md) — phased rollout
7. [API Contracts](./10-api-contracts.md) — endpoint spec

### Compliance / Legal
1. [HIPAA Compliance](./07-hipaa-compliance.md) — PHI handling & requirements
2. [Billing Engine](./08-billing-engine.md) — CPT code compliance
3. [Data Architecture](./05-data-architecture.md) — retention & security

---

## Changelog

| Date | Change |
|------|--------|
| 2026-02-11 | Initial creation of all specification documents |
