# 08 — Billing Engine

> Automated CPT 98977/98980 tracking, billing record generation, and PT dashboard integration.

---

## CPT Code Overview

Remote Therapeutic Monitoring (RTM) codes allow PT clinics to bill for technology-assisted patient monitoring:

### CPT 98977 — Device Data Transmission

| Attribute | Detail |
|-----------|--------|
| Description | Remote physiologic monitoring treatment management — device data transmission |
| Trigger | Patient's device transmits exercise data on **16+ distinct days** in a calendar month |
| Reimbursement | ~$58/patient/month |
| PT involvement | **None required** — purely automated data transmission |
| What counts as "data" | Exercise session telemetry, form scores, rep counts, ROM measurements |

### CPT 98980 — PT Monitoring Interaction

| Attribute | Detail |
|-----------|--------|
| Description | Remote therapeutic monitoring treatment management, first 20 minutes |
| Trigger | PT spends **20+ minutes** reviewing patient data and/or communicating with patient |
| Reimbursement | ~$40/patient/month |
| PT involvement | **Required** — must document time spent reviewing monitoring data |
| What counts as "monitoring" | Reviewing session data, sending messages, adjusting plans, reviewing alerts |

### Combined Billing Opportunity

Per patient per month: **~$98** in reimbursable revenue when both codes are triggered.

---

## Automated Tracking

### CPT 98977: Device Day Counter

The system automatically tracks "device days" — calendar days on which the patient's device transmits exercise data.

```
Patient completes session → Session saved to DB → Check if new calendar day
  → If new day: increment device_days on billing_record
    → If device_days >= 16: mark as eligible, notify PT
```

**What constitutes a valid device transmission?**
- At minimum: a session record with duration > 0 and at least 1 exercise completed
- Preferred: telemetry session with server-verified rep count
- The bar is intentionally low — CMS defines "data transmission" broadly

**Push notification automation**:
If a patient hasn't transmitted data and is at risk of missing the 16-day threshold:
- Day 10 with <8 days: "gentle reminder" notification
- Day 20 with <14 days: "you're close!" notification
- Day 25 with <16 days: "last chance" notification

### CPT 98980: PT Time Tracker

The system tracks PT time spent on monitoring activities:

| Activity | How Tracked | Counts Toward 20 min? |
|----------|-------------|----------------------|
| Reviewing patient session data | Time on PT dashboard patient detail page | Yes |
| Sending messages to patient | Message compose time | Yes |
| Adjusting exercise plan | Plan edit time | Yes |
| Reviewing alerts | Alert review time | Yes |
| Phone call with patient | Manual time entry by PT | Yes |

```
PT opens patient detail → Start timer
  → PT navigates away → Stop timer, add to pt_minutes
    → If pt_minutes >= 20: mark as eligible
```

**PT "Call List" Dashboard**: Shows PTs which patients are close to the 20-minute threshold, prioritized by:
1. Patients at 15-19 minutes (almost there, quick review triggers billing)
2. Patients with unread alerts (clinically relevant + time accrual)
3. Patients with 16+ device days but <20 PT minutes (98977 eligible, just need 98980)

---

## Billing Record Lifecycle

```
tracking → eligible → submitted → paid
```

| Status | Meaning |
|--------|---------|
| `tracking` | Month in progress, counting toward threshold |
| `eligible` | Threshold met, ready to submit |
| `submitted` | Claim submitted to payer |
| `paid` | Reimbursement received |

### Billing Record Schema

See full schema in [05-data-architecture.md](./05-data-architecture.md) (`billing_records` table).

Key fields:
- `cpt_code`: '98977' or '98980'
- `device_days`: count of unique days with data (for 98977)
- `pt_minutes`: accumulated PT monitoring time (for 98980)
- `status`: lifecycle state
- `eligible_at`: timestamp when threshold was crossed

---

## API Endpoints

### Patient-facing (automated)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/billing/record-session` | POST | Record a device transmission day (called automatically after each session) |
| `GET /api/billing/my-status` | GET | Patient view of their billing month status |

### PT-facing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/billing/call-list` | GET | PT call list: patients sorted by billing opportunity |
| `POST /api/billing/log-time` | POST | Record PT monitoring time |
| `GET /api/billing/[patientId]/status` | GET | Billing status for a specific patient |

### Admin/Billing

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/billing/report` | GET | Monthly billing report for clinic |
| `PUT /api/billing/[recordId]/submit` | PUT | Mark record as submitted |
| `PUT /api/billing/[recordId]/paid` | PUT | Mark record as paid |
| `GET /api/billing/export` | GET | Export billing data (CSV/JSON) |

---

## PT Dashboard Integration

### Call List View

The PT dashboard gains a "Billing" tab or section that shows:

```
┌─────────────────────────────────────────────────────────┐
│ Billing Opportunities — February 2026                    │
│                                                          │
│ 12 patients eligible for 98977 | 8 eligible for 98980   │
│ Est. revenue: $1,216                                     │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Quick Wins (98980 almost eligible)                  │ │
│ │                                                     │ │
│ │ Sarah M. — 18 min (2 min to go) — 3 unread alerts  │ │
│ │ James K. — 17 min (3 min to go) — plan expiring    │ │
│ │ Lisa P.  — 15 min (5 min to go) — low adherence    │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ At Risk (98977 device days behind)                  │ │
│ │                                                     │ │
│ │ Tom R.   — 11/16 days — 9 days left in month       │ │
│ │ Maria S. — 8/16 days  — 9 days left in month       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Monthly Billing Report

Exportable report showing all billing-eligible records for the month, suitable for submission to clinic's billing department or integration with practice management software.

---

## Integration with Existing Systems

### Session Completion → Device Day

When a patient completes a workout session (existing flow: `POST /api/sessions`), the billing engine:
1. Checks if this is a new calendar day for this patient
2. If yes, increments `device_days` on the billing record
3. If `device_days >= 16`, updates status to `eligible` and creates PT notification

### PT Dashboard → Time Tracking

The existing PT portal (`src/components/pt/`) needs modification to:
1. Start a timer when PT views patient data
2. Accumulate time in `pt_minutes` on the billing record
3. Show billing status alongside clinical data

<!-- TODO: Decide on timer implementation (client-side tracking vs. server heartbeat) -->

## Open Questions

- How does the billing record integrate with clinic EHR/practice management systems?
- Should we provide direct insurance claim submission, or just generate billing-ready reports?
- How do we handle months where a patient starts mid-month (pro-rating)?
- Should the 20-minute PT timer be client-tracked or server-tracked?
- How do we verify that PT time is genuinely spent reviewing (not just leaving the tab open)?

---

See also:
- [01-executive-summary.md](./01-executive-summary.md) — Revenue model overview
- [02-unit-economics.md](./02-unit-economics.md) — Revenue projections
- [05-data-architecture.md](./05-data-architecture.md) — billing_records schema
- [10-api-contracts.md](./10-api-contracts.md) — Full endpoint specification
