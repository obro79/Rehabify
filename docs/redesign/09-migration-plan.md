# 09 — Migration Plan

> Phased rollout from current B2C architecture to B2B Medical Device SaaS.

---

## Phase Overview

```
Phase 0: Foundation ─────────────────────────── No user-facing changes
Phase 1: Voice Migration ────────────────────── Gemini Live replaces Vapi
Phase 2: Vision Enhancement ─────────────────── Server-side telemetry & DTW
Phase 3: Billing Engine ─────────────────────── CPT tracking & PT dashboard
Phase 4: Compliance Hardening ───────────────── HIPAA audit, pen testing, BAAs
```

Each phase is independently deployable and adds value. No phase requires a later phase to function.

---

## Phase 0: Foundation

> Multi-tenancy, audit logging, and infrastructure groundwork. No user-facing changes.

### Deliverables
- [ ] `clinics` and `clinic_memberships` tables
- [ ] `clinic_id` column added to all tenant-scoped tables
- [ ] Default clinic created for existing data, all rows backfilled
- [ ] PostgreSQL RLS policies on all PHI tables
- [ ] `audit_log` table with write triggers on PHI tables
- [ ] API middleware: clinic scoping on all routes
- [ ] `audit_log` read-logging middleware
- [ ] Environment setup for staging/production on target infrastructure

### Files Changed
- `src/db/schema/` — New schema files for clinics, memberships, audit_log
- `src/db/schema/*.ts` — Add `clinic_id` to existing tables
- `src/db/migrations/` — Migration SQL for schema changes
- `src/app/api/` — All route handlers updated with clinic scoping middleware
- New: `src/lib/auth/clinic-context.ts` — Middleware to extract clinic from auth token
- New: `src/lib/audit/logger.ts` — Audit logging utility

### Risk
- **Data migration**: Backfilling `clinic_id` on existing rows must be done carefully
- **RLS correctness**: Incorrect policies could leak data or block legitimate access

### Dependencies
None. This phase can start immediately.

---

## Phase 1: Voice Migration

> Replace Vapi ($40/patient/mo) with Gemini 2.0 Flash Live ($1.11/patient/mo).

### Deliverables
- [ ] Gemini 2.0 Flash Live WebSocket integration
- [ ] Client-side Silero VAD (WASM)
- [ ] Context caching for session continuity
- [ ] Usage guardrails (10hr soft cap, 20hr hard cap)
- [ ] WebSocket server deployed and operational
- [ ] A/B testing framework: Vapi vs Gemini for quality comparison
- [ ] Vapi code removed after validation

### Migration Strategy

```
Week 1-2: Build Gemini Live integration alongside Vapi (both available)
Week 3-4: A/B test with internal users (50/50 split)
Week 5-6: Expand Gemini to 90% of sessions, Vapi as fallback
Week 7-8: Remove Vapi, Gemini only
```

### Files Changed
- REMOVE: `src/lib/vapi/` (8 files), `src/hooks/use-vapi.ts`, `src/hooks/use-assessment-vapi.ts`, `src/hooks/assessment-vapi-config.ts`, `src/app/api/vapi/` (5 files)
- CREATE: `src/lib/gemini-live/` (6+ files), `src/hooks/use-gemini-voice.ts`, `src/hooks/use-assessment-voice.ts`
- MODIFY: `src/hooks/use-session-voice.ts`, `src/stores/voice-store.ts`, `src/lib/voice/event-handlers.ts`
- MODIFY: `package.json` — Remove `@vapi-ai/web`, add Silero VAD package

### Risk
- **Gemini Live API stability**: API may still be in preview/beta
- **Audio quality regression**: Gemini TTS may not match ElevenLabs quality
- **Latency**: Self-managed WebSocket may have higher latency than Vapi's optimized pipeline

### Dependencies
- Phase 0 (infrastructure setup for WebSocket server hosting)

---

## Phase 2: Vision Enhancement

> Add server-side telemetry streaming and DTW analysis for billing-grade exercise verification.

### Deliverables
- [ ] Telemetry WebSocket: client sends landmark JSON to server
- [ ] Server-side DTW analysis against reference motions
- [ ] `reference_motions` table populated with initial exercises
- [ ] `telemetry_sessions` table for storing aggregated results
- [ ] Server-authoritative rep counting
- [ ] Client fallback mode (if WebSocket disconnects, client-only continues to work)

### Files Changed
- CREATE: `src/lib/vision/telemetry-stream.ts`, `src/hooks/use-telemetry.ts`
- CREATE: Server-side analysis service (Python or TypeScript — see [decision-log.md](./decision-log.md))
- MODIFY: `src/lib/vision/form-engine.ts` — Add telemetry emission hooks
- MODIFY: `src/hooks/use-form-event-bridge.ts` — Extend for telemetry
- CREATE: `src/db/schema/reference-motions.ts`, `src/db/schema/telemetry-sessions.ts`

### Risk
- **Bandwidth**: Landmark streaming adds ~5KB/s; may be an issue on poor connections
- **Server analysis accuracy**: DTW scoring needs calibration against client-side results
- **Reference motion quality**: Need PT/expert input to create gold-standard recordings

### Dependencies
- Phase 0 (multi-tenancy for `clinic_id` on telemetry tables)
- Phase 1 (WebSocket infrastructure, if sharing the same WS server)

---

## Phase 3: Billing Engine

> CPT 98977/98980 tracking, automated notifications, PT call list dashboard.

### Deliverables
- [ ] `billing_records` table and API endpoints
- [ ] Device day counter (auto-increments on session completion)
- [ ] PT time tracker (monitors time spent reviewing patient data)
- [ ] Push notification automation for patients at risk of missing 16-day threshold
- [ ] PT "call list" dashboard showing billing opportunities
- [ ] Monthly billing report export (CSV/JSON)

### Files Changed
- CREATE: `src/db/schema/billing-records.ts`
- CREATE: `src/app/api/billing/` — 8+ route files
- CREATE: `src/components/pt/billing-dashboard.tsx` — Call list UI
- MODIFY: `src/app/api/sessions/route.ts` — Trigger device day recording on session save
- MODIFY: `src/components/pt/` — Add billing info to patient detail views

### Risk
- **Billing accuracy**: Incorrect tracking could lead to compliance issues
- **Timer gaming**: PT could leave patient detail page open to accumulate time
- **Clinic workflow**: Billing integration may not match existing clinic processes

### Dependencies
- Phase 0 (multi-tenancy, audit logging)
- Phase 2 (telemetry sessions provide richer "device data" for 98977)

---

## Phase 4: Compliance Hardening

> HIPAA audit, penetration testing, BAAs, and operational readiness for handling PHI.

### Deliverables
- [ ] Google Cloud BAA signed
- [ ] Penetration testing completed (third-party)
- [ ] HIPAA risk assessment documented
- [ ] Incident response plan created
- [ ] Data retention automation (6-year retention, automated purge)
- [ ] Employee HIPAA training completed
- [ ] Third-party HIPAA compliance audit (optional but recommended)

### Risk
- **Cost**: Pen testing and audits are expensive ($5K-50K+)
- **Timeline**: Audit findings may require significant remediation
- **Ongoing**: HIPAA compliance is not a one-time event; requires annual reassessment

### Dependencies
- Phase 0 (audit logging, RLS)
- All other phases ideally complete (auditing a moving target is wasteful)

---

## Dependency Graph

```
Phase 0 (Foundation)
  │
  ├──→ Phase 1 (Voice)
  │      │
  │      └──→ Phase 2 (Vision) ──→ Phase 3 (Billing)
  │                                      │
  └──────────────────────────────────────→ Phase 4 (Compliance)
```

Phase 1 and Phase 2 can overlap if the WebSocket infrastructure is shared. Phase 3 benefits from Phase 2 (richer telemetry data) but could launch with client-only session data.

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Gemini Live API changes/deprecation | High | Low | Abstract behind interface, maintain Vapi fallback until stable |
| HIPAA breach during migration | Critical | Low | Phase 0 first, no PHI without controls |
| Client-side performance degradation | Medium | Medium | Telemetry streaming is additive; monitor bundle size |
| PT adoption resistance | High | Medium | Co-design with pilot clinics, iterate on UX |
| Billing compliance issues | High | Medium | Legal review of CPT code interpretation |
| Neon → Cloud SQL migration data loss | High | Low | Full backup before migration, staged cutover |
| WebSocket reliability | Medium | Medium | Client fallback modes for voice and vision |

---

## Success Metrics

| Phase | Metric | Target |
|-------|--------|--------|
| 0 | All PHI tables have RLS policies | 100% |
| 0 | Audit log captures all PHI access | 100% |
| 1 | Voice cost per patient/month | < $2.00 |
| 1 | Voice quality (user satisfaction) | >= Vapi baseline |
| 2 | Telemetry capture rate | > 95% of sessions |
| 2 | Server DTW score correlation with client | > 0.85 |
| 3 | Patients meeting 16-day device threshold | > 70% |
| 3 | PTs using call list weekly | > 80% |
| 4 | HIPAA risk assessment completed | Yes |
| 4 | Penetration test findings remediated | 100% critical/high |

---

See also:
- [current-state.md](./current-state.md) — Starting point
- [10-api-contracts.md](./10-api-contracts.md) — New endpoints per phase
