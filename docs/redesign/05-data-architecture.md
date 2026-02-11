# 05 — Data Architecture

> Schema evolution from single-tenant B2C to multi-tenant B2B with HIPAA-compliant data handling.

---

## Current Schema (11 tables)

Defined in `src/db/schema/` using Drizzle ORM with Neon PostgreSQL:

| Table | File | Key Relationships |
|-------|------|-------------------|
| `profiles` | `profiles.ts` | Root user table (patients + PTs) |
| `exercises` | `exercises.ts` | Exercise catalog |
| `plans` | `plans.ts` | Rehab plans → profiles, exercises |
| `plan_modifications` | `plans.ts` | Plan change log → plans |
| `assessments` | `assessments.ts` | Assessment results → profiles |
| `sessions` | `sessions.ts` | Workout sessions → profiles, plans |
| `session_notes` | `sessions.ts` | Annotations → sessions |
| `messages` | `messages.ts` | PT-patient messages → profiles (sender, receiver) |
| `canned_responses` | `messages.ts` | Message templates |
| `notifications` | `notifications.ts` | Push notifications → profiles |
| `pt_alerts` | `alerts.ts` | Clinical alerts → profiles (patient) |
| `pt_recommendations` | `alerts.ts` | PT recommendations → profiles (patient) |
| `achievements` | `achievements.ts` | Gamification definitions |
| `user_achievements` | `achievements.ts` | Earned achievements → profiles, achievements |
| `patient_medical_info` | `patient-medical-info.ts` | Medical intake → profiles |

### Current Gaps

1. **No clinic scoping** — All data is globally accessible by role. A PT can theoretically see any patient's data.
2. **No audit logging** — No record of data access or modification.
3. **No billing tables** — No infrastructure for CPT code tracking.
4. **No telemetry storage** — Vision analysis results are ephemeral (client-side only).
5. **No data retention controls** — No mechanism for HIPAA-required 6-year retention.

---

## Multi-Tenancy Model

### Approach: Shared Database, Row-Level Security

All clinics share the same database. Data isolation is enforced by:
1. **`clinic_id` column** on all tenant-scoped tables
2. **PostgreSQL Row-Level Security (RLS)** policies that filter rows based on the authenticated user's clinic membership
3. **Application-level enforcement** in API routes as a defense-in-depth layer

### Why not separate databases per clinic?

| Approach | Pros | Cons |
|----------|------|------|
| Separate DBs | Strongest isolation | Operational nightmare at scale, costly |
| Separate schemas | Good isolation | Migration complexity |
| **Shared DB + RLS** | Simple ops, low cost, proven pattern | Must be careful with queries |

Neon PostgreSQL supports RLS natively. This is the standard multi-tenancy pattern for SaaS on PostgreSQL.

---

## New Tables

### `clinics`
```sql
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,           -- URL-friendly identifier
  billing_email TEXT,
  billing_tier TEXT DEFAULT 'standard', -- standard, premium, enterprise
  hipaa_baa_signed_at TIMESTAMPTZ,     -- when BAA was executed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `clinic_memberships`
```sql
CREATE TABLE clinic_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  role TEXT NOT NULL DEFAULT 'patient', -- patient, pt, admin, owner
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  UNIQUE(clinic_id, user_id)
);
```

### `billing_records`
```sql
CREATE TABLE billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  billing_month DATE NOT NULL,          -- first day of billing month
  cpt_code TEXT NOT NULL,               -- '98977' or '98980'
  status TEXT DEFAULT 'tracking',       -- tracking, eligible, submitted, paid

  -- CPT 98977 tracking
  device_days INTEGER DEFAULT 0,        -- days with data transmission
  device_day_threshold INTEGER DEFAULT 16,

  -- CPT 98980 tracking
  pt_minutes INTEGER DEFAULT 0,         -- minutes of PT monitoring
  pt_minute_threshold INTEGER DEFAULT 20,

  eligible_at TIMESTAMPTZ,              -- when threshold was met
  submitted_at TIMESTAMPTZ,             -- when submitted to payer
  paid_at TIMESTAMPTZ,
  amount_cents INTEGER,                 -- reimbursement amount

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, patient_id, billing_month, cpt_code)
);
```

### `audit_log`
```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  actor_id UUID REFERENCES profiles(id),
  clinic_id UUID REFERENCES clinics(id),
  action TEXT NOT NULL,                 -- 'read', 'create', 'update', 'delete'
  resource_type TEXT NOT NULL,          -- 'profile', 'session', 'assessment', etc.
  resource_id UUID,
  details JSONB,                        -- additional context
  ip_address INET,
  user_agent TEXT
);
-- Partitioned by month for query performance and retention management
```

### `reference_motions`
```sql
CREATE TABLE reference_motions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id TEXT NOT NULL,            -- matches exercise catalog ID
  variant TEXT DEFAULT 'standard',      -- standard, modified, assisted
  landmarks JSONB NOT NULL,             -- time series of landmark frames
  duration_ms INTEGER NOT NULL,
  captured_by UUID REFERENCES profiles(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `telemetry_sessions`
```sql
CREATE TABLE telemetry_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  exercise_id TEXT NOT NULL,

  -- Aggregated results (not raw frames)
  total_reps INTEGER DEFAULT 0,
  verified_reps INTEGER DEFAULT 0,      -- server-validated reps
  avg_dtw_score FLOAT,
  avg_form_score FLOAT,
  duration_ms INTEGER,

  -- Raw telemetry reference (stored in object storage, not DB)
  telemetry_blob_url TEXT,              -- Cloud Storage URL for raw landmark data

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Schema Modifications to Existing Tables

### Add `clinic_id` to tenant-scoped tables

The following tables need a `clinic_id` column with a foreign key to `clinics`:

- `profiles` (users belong to clinics via `clinic_memberships`, but profile itself may be clinic-scoped)
- `plans`
- `assessments`
- `sessions`
- `session_notes`
- `messages`
- `notifications`
- `pt_alerts`
- `pt_recommendations`
- `patient_medical_info`

**Migration strategy**:
1. Add `clinic_id` column as nullable
2. Create a default clinic for existing data
3. Backfill all existing rows with the default clinic ID
4. Set column to NOT NULL
5. Add RLS policies

### Row-Level Security Policy Template

```sql
-- Enable RLS on table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see rows from their clinic
CREATE POLICY clinic_isolation ON sessions
  USING (
    clinic_id IN (
      SELECT clinic_id FROM clinic_memberships
      WHERE user_id = current_setting('app.current_user_id')::UUID
        AND deactivated_at IS NULL
    )
  );
```

---

## Data Retention

HIPAA requires that covered entities retain medical records for a minimum of **6 years** from the date of creation or last effective date.

| Data Type | Retention | Storage |
|-----------|-----------|---------|
| Patient profiles | 6 years after deactivation | PostgreSQL |
| Session records | 6 years | PostgreSQL |
| Assessment results | 6 years | PostgreSQL |
| Telemetry (aggregated) | 6 years | PostgreSQL |
| Telemetry (raw landmarks) | 1 year (then delete) | Cloud Storage |
| Audit logs | 6 years | PostgreSQL (partitioned) |
| Billing records | 7 years (per CMS) | PostgreSQL |
| Messages | 6 years | PostgreSQL |

<!-- TODO: Implement automated retention policy (cron job to archive/purge expired data) -->

## Open Questions

- Should we use Drizzle ORM for the new tables, or migrate to a different ORM?
- How do we handle users who belong to multiple clinics?
- Should audit logs be stored in a separate database for isolation?
- What's the migration path for existing Neon data to Cloud SQL?

---

See also:
- [07-hipaa-compliance.md](./07-hipaa-compliance.md) — PHI handling requirements
- [08-billing-engine.md](./08-billing-engine.md) — Billing records detail
- [09-migration-plan.md](./09-migration-plan.md) — Phase 0 (Foundation) migration
