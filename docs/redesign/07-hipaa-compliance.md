# 07 — HIPAA Compliance

> PHI handling, encryption, BAAs, audit trails, and the path to HIPAA-compliant operations.

---

## HIPAA Overview

HIPAA applies to Rehabify because we handle Protected Health Information (PHI) on behalf of PT clinics (covered entities). Rehabify is a **Business Associate** and must:

1. Sign a BAA with each clinic
2. Sign BAAs with all subprocessors (cloud providers, etc.)
3. Implement administrative, physical, and technical safeguards
4. Report breaches within 60 days

## PHI in Rehabify

### What constitutes PHI in our system?

| Data | PHI? | Location | Notes |
|------|------|----------|-------|
| Patient name + email | Yes | `profiles` table | Individually identifiable |
| Medical conditions | Yes | `patient_medical_info` table | Health information |
| Assessment results | Yes | `assessments` table | Health outcomes |
| Session records (exercises, reps, scores) | Yes | `sessions` table | Treatment data |
| PT-patient messages | Yes | `messages` table | Clinical communication |
| PT alerts/recommendations | Yes | `pt_alerts`, `pt_recommendations` | Clinical data |
| Exercise plan details | Yes | `plans` table | Treatment plan |
| Telemetry data (landmark coordinates) | Maybe | `telemetry_sessions` | Not individually identifiable alone, but linked to patient ID |
| Voice session audio | Yes | Transient (Gemini) | If recorded, definitely PHI |
| Billing records | Yes | `billing_records` (new) | Patient + treatment + billing |
| Audit logs | Yes | `audit_log` (new) | Contains PHI references |

### What is NOT PHI?

| Data | Why Not PHI |
|------|-------------|
| Exercise catalog | Generic, not patient-specific |
| Achievement definitions | Generic gamification |
| Canned responses | Template text |
| Reference motions | Captured from experts, not patients |
| Video frames | Never leave the device — not stored or transmitted |

---

## Technical Safeguards

### Encryption

| Layer | Requirement | Implementation |
|-------|-------------|----------------|
| At rest | AES-256 | Cloud SQL: automatic. Cloud Storage: automatic. |
| In transit | TLS 1.2+ | All connections use HTTPS/WSS. Cloud Run enforces TLS. |
| Application-level | Field-level encryption for sensitive fields | <!-- TODO: Determine which fields need app-level encryption --> |

### Access Control

| Control | Implementation |
|---------|----------------|
| Authentication | Auth provider (current: Neon Auth, target: TBD) |
| Authorization | Role-based (patient, pt, admin, owner) + clinic scoping |
| Row-level security | PostgreSQL RLS policies on all PHI tables |
| API authorization | Middleware checks role + clinic membership on every request |
| Session management | Short-lived tokens, secure cookie flags |

### Audit Logging

Every access to PHI must be logged:

```
WHO (actor_id) did WHAT (action) to WHICH (resource_type, resource_id)
WHEN (timestamp) FROM WHERE (ip_address, user_agent)
```

See `audit_log` table in [05-data-architecture.md](./05-data-architecture.md).

Implementation:
- Database-level: triggers on PHI tables for write operations
- Application-level: middleware logging for read operations
- Retention: 6 years minimum

---

## Infrastructure Requirements

### GCP HIPAA-Eligible Services

If deploying to GCP (see [06-infrastructure.md](./06-infrastructure.md)):

| Service | HIPAA Eligible? | BAA Required? |
|---------|----------------|---------------|
| Cloud Run | Yes | Covered under Google Cloud BAA |
| Cloud SQL (PostgreSQL) | Yes | Covered under Google Cloud BAA |
| Cloud Storage | Yes | Covered under Google Cloud BAA |
| Cloud Logging | Yes | Covered under Google Cloud BAA |
| Gemini API | Yes (with BAA) | Separate BAA may be needed for Gemini |

**Google Cloud BAA**: A single BAA with Google covers all HIPAA-eligible GCP services. This is simpler than AWS (where each service requires separate consideration).

### BAA Chain

```
Clinic (Covered Entity)
  → BAA → Rehabify (Business Associate)
    → BAA → Google Cloud (Subprocessor)
    → BAA → Gemini API (Subprocessor, if separate)
    → BAA → Domain registrar, email provider, etc. (if they touch PHI)
```

---

## Current Gaps Analysis

| Requirement | Current State | Gap | Priority |
|-------------|---------------|-----|----------|
| BAA with cloud provider | No BAA (Vercel/Neon) | Need GCP BAA or Vercel Enterprise | Critical |
| Encryption at rest | Neon encrypts (verify) | Need explicit confirmation | High |
| Encryption in transit | HTTPS on Vercel | Need WSS for new WebSocket connections | High |
| Access control (multi-tenant) | No clinic scoping | Need RLS + clinic_id | Critical |
| Audit logging | None | Need audit_log table + middleware | Critical |
| PHI identification | Not classified | Need data classification exercise | High |
| Breach notification process | None | Need incident response plan | Medium |
| Data retention policy | None | Need 6-year retention + purge automation | Medium |
| Employee training | None | Need HIPAA training for all team members | Medium |
| Risk assessment | None | Need annual HIPAA risk assessment | High |
| Backup & disaster recovery | Neon auto-backup (verify) | Need documented backup strategy | Medium |
| Minimum necessary principle | Not enforced | API returns full objects; need field-level filtering | Low |

---

## Implementation Phases

### Phase 0: Foundation (pre-launch)
- [ ] Sign Google Cloud BAA
- [ ] Deploy to HIPAA-eligible GCP services
- [ ] Enable encryption at rest (verify Cloud SQL default)
- [ ] Enable TLS for all connections
- [ ] Implement audit logging table and write triggers

### Phase 1: Access Control
- [ ] Add `clinic_id` to all PHI tables
- [ ] Implement PostgreSQL RLS policies
- [ ] Add clinic-scoped middleware to all API routes
- [ ] Implement role-based access control

### Phase 2: Operational
- [ ] Create incident response plan
- [ ] Implement breach notification workflow
- [ ] Set up data retention automation
- [ ] Complete HIPAA risk assessment
- [ ] HIPAA training for all team members

### Phase 3: Hardening
- [ ] Penetration testing
- [ ] Third-party HIPAA audit
- [ ] Field-level encryption for most sensitive fields
- [ ] Automated compliance monitoring

---

## Breach Notification Requirements

If a breach of unsecured PHI occurs:

| Notification To | Timeframe | Method |
|-----------------|-----------|--------|
| Affected individuals | Within 60 days of discovery | Written notice |
| HHS (Dept of Health) | Within 60 days (or annually if <500 people) | HHS breach portal |
| Media | Within 60 days (if >500 people in a state) | Press release |

<!-- TODO: Create incident response playbook -->

## Open Questions

- Is Neon PostgreSQL covered under any HIPAA BAA? (May determine if we need to migrate to Cloud SQL)
- Does the Gemini API require a separate BAA from the Google Cloud BAA?
- Should we pursue SOC 2 Type II certification in addition to HIPAA compliance?
- Do we need a dedicated HIPAA compliance officer?

---

See also:
- [05-data-architecture.md](./05-data-architecture.md) — Audit log and retention schemas
- [06-infrastructure.md](./06-infrastructure.md) — GCP deployment for compliance
- [08-billing-engine.md](./08-billing-engine.md) — Billing data is PHI
