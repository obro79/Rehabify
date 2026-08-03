# 03 — Data Architecture

> **Decisions:** Supabase Postgres in **`ca-central-1`**, multi-tenancy via
> `organization_id` + **forced RLS** (ADR-005), Drizzle with a **two-client
> boundary** and `drizzle-kit push` banned outright (ADR-006).
>
> Supabase facts verified 2026-08-02. Items marked **⚠️** are undocumented by
> Supabase or unconfirmed, and are load-bearing.

---

## 1. What we are replacing

From [02-current-state.md](./02-current-state.md), the current data layer has:

- **No tenancy column on any table.** Multi-clinic is not degraded, it is absent.
- **RLS policies that are inert.** `001_complete_schema.sql:561-655` uses
  `auth.uid()` — a *Supabase* idiom — against the `neon-http` driver. They parse
  and do nothing. Treat the database as having no row-level protection today.
- **Zero Postgres enums.** Fourteen tables, all status/role/type columns as
  `text` + check constraints.
- **JSONB that is load-bearing and unvalidated.** Plans, assessment results, and
  session metrics live in JSONB with no schema enforcement at either boundary.
- **Two competing migration systems, already drifted.** `db:push`/`db:generate`
  vs `db:migrate`/`db:seed`/`db:mock`; `004` was never folded into `001`;
  `003_mock_data.sql` inserts into tables and columns that do not exist and
  **cannot run**.

Every one of these is addressed below. None of it is migrated — the schema is
rewritten.

---

## 2. Platform: Supabase, `ca-central-1`

Region is fixed by [ADR-011](./09-decision-log.md) (BC market). What lands
in-region and what does not:

| Component | Region | Note |
|---|---|---|
| Postgres | ✅ `ca-central-1` | |
| Storage | ✅ `ca-central-1` | |
| Auth | ✅ `ca-central-1` | |
| **Platform logs** | ❌ **out-of-region** | ClickHouse/BigQuery; location unstated by Supabase. **The single biggest residency gap.** |
| Edge Functions | ⚠️ **global by default** | Must be pinned with the `x-region` header — and *verify* the pin, don't assume it |
| Realtime | ⚠️ **undocumented** | Treat as out-of-region until Supabase confirms otherwise |

**Design consequence:** assume anything that reaches platform logs has left
Canada. That means **no PHI in log lines, error messages, or exception payloads
that Supabase can see** — including Postgres `RAISE NOTICE`, constraint violation
messages that echo column values, and unhandled errors from Edge Functions. This
is the same class of discipline as the no-PHI telemetry contract in
[06 §3](./06-ai-pipelines.md), and it should be enforced the same way: a
structured logger that takes IDs and codes, never free text.

### Cost floor

**⚠️ Supabase's HIPAA posture requires the Team plan ($599/mo) plus an
unpublished-price add-on plus PITR ($100/mo) — a $760–810/mo floor.**
Self-hosting Supabase is **explicitly not HIPAA-capable.**

For a BC deployment HIPAA is not the operative regime, but the same tier gates
the compliance controls we want (PITR, longer log retention, SOC 2 reporting), so
budget for it. And note again: **Supabase publishes zero PIPEDA representation**
— a legal-review item, not an engineering one.

### Keys and signing — get this right on day one

Start with **asymmetric ES256 JWT signing keys** and the new
`sb_publishable_` / `sb_secret_` API key format. The legacy symmetric JWT secret
and `anon`/`service_role` key format **deprecate at the end of 2026**. Migrating
signing keys later means reissuing every session; doing it now costs nothing.

**No CMK/BYOK is available.** If customer-managed keys become a clinic
requirement, this is a platform-level blocker with no workaround.

---

## 3. Multi-tenancy

Shared database, `organization_id` on every domain table, **forced RLS**.
Separate databases per clinic were rejected: at 1–2 pilot clinics and a target of
tens, the operational cost dominates the isolation benefit, and a shared schema
keeps one migration path.

That trade puts the entire isolation guarantee on RLS correctness. So:

1. **`alter table … force row level security`** on every domain table. Plain
   `enable` does not apply policies to the table owner, and migrations run as the
   owner.
2. **`organization_id` is `not null` on every domain table**, including join and
   audit tables. No nullable tenancy, ever — a null tenant is a policy hole.
3. **Every policy is `to authenticated`.** Never `to public`. A `public` policy
   is evaluated for every role, including `anon`.
4. **Tenancy is derived from the JWT, never from a request parameter.** A
   `?organizationId=` in a route handler is a vulnerability, not an API.

### The anonymous-user trap

**Supabase anonymous users receive the `authenticated` Postgres role, not
`anon`.** This surprises people, and it is exactly the kind of thing that turns
a correct-looking policy into a leak.

The intake flow *needs* anonymous sessions: a patient follows an SMS episode link
and gets a PHI-free pending session before OTP verification
([01 stage B](./01-product-definition.md)). Those users are `authenticated` at
the Postgres level.

**Therefore every PHI-touching policy carries a restrictive
`is_anonymous is false` gate.** Not as an extra condition on the permissive
policy — as a separate `as restrictive` policy, so it cannot be forgotten on a
later permissive policy added to the same table.

```sql
create policy "phi_requires_verified_identity"
  on public.episodes
  as restrictive
  to authenticated
  using ((select auth.jwt() ->> 'is_anonymous')::boolean is false);
```

### RLS performance — four rules with measured impact

These are not micro-optimizations. The numbers are from Supabase's own
benchmarks and the differences are three to four orders of magnitude.

| Rule | Effect |
|---|---|
| Wrap `auth.uid()` / `auth.jwt()` in `(select …)` so it evaluates once per query, not once per row | **11,000ms → 10ms** |
| Index the tenancy column (and every column named in a policy) | **171ms → <0.1ms** |
| Use a `security definer` function for cross-table membership checks instead of an inline join | **178,000ms → 12ms** |
| Always specify `to authenticated` | avoids evaluating the policy for every role |

The `security definer` helper is the load-bearing one — "is this user a member of
this organization?" appears in nearly every policy, and inlining that join into
each one is what produces the 178-second case.

---

## 4. The Drizzle boundary — the most dangerous part of this stack

> **Drizzle bypasses RLS by default.** It connects as the database owner. Every
> query you write is a full-table query unless you do something about it.

This is not hypothetical: it is precisely how the current repo ended up with
policies that look protective and protect nothing.

The fix is the community `set local role` + `set_config` transaction pattern —
**which Supabase does not document**, so it needs to live in this repo as a
deliberate, tested, reviewed boundary rather than as folklore:

```ts
// Conceptual shape. Wrap every request-scoped query.
await db.transaction(async (tx) => {
  await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
  await tx.execute(sql`set local role authenticated`);
  return fn(tx);   // policies now apply
});
```

### Two clients, enforced by lint

| Client | Role | Use |
|---|---|---|
| `db.rls` | `authenticated`, claims set per transaction | **Everything request-scoped.** The default. |
| `db.admin` | owner, bypasses RLS | Migrations, the durable worker's system tasks, explicitly-reviewed jobs |

**An ESLint rule forbids importing `db.admin` outside an allowlisted directory.**
Same pattern as the `mip_opt_out` URL builder in
[05 §6](./05-voice-pipeline.md) and the telemetry allowlist in
[06 §3](./06-ai-pipelines.md): a narrow, testable choke point standing in for a
policy that would otherwise depend on everyone remembering.

Add a test that runs a representative query through `db.rls` as tenant A and
asserts zero rows from tenant B. **Per table.** RLS regressions are silent
otherwise.

> **The Python service is not in this table, and that is the point.**
> Under [ADR-016](./09-decision-log.md#adr-016) the AI service holds no database
> connection and no database credentials. It returns validated models; the
> TypeScript tier persists them.
>
> This began as a workaround — the ESLint guard above cannot run on Python — and
> ended up stronger than the design it replaces. "All database access goes through
> one boundary" stops being a rule someone can forget: the AI service cannot reach
> Postgres because it has nothing to reach it with. **Do not give the Python
> service a database client to save a round trip.** That one change deletes the
> guarantee.

### 🔴 `drizzle-kit push` is banned

**`drizzle-kit push` silently skips RLS policy SQL.** It will report success and
leave your tables unprotected.

Remove `db:push` from `package.json`. The only path is `drizzle-kit generate` →
review the generated SQL → `drizzle-kit migrate`. Policies are written by hand in
migration files and reviewed like application code, because that is what they
are.

---

## 5. Schema principles

Rewritten from scratch, not migrated. The rules that differ from the current
schema:

**Postgres enums for every closed set.** `role`, `episode_status`,
`plan_version_status`, `attention_tier`, `observation_type`, and so on. The
current schema has zero enums and fourteen tables of `text` + check constraints,
which gives no type safety at the Drizzle boundary and makes every status
comparison a string comparison.

**JSONB is for genuinely open payloads only, and is always schema-validated at
both boundaries** — Zod in the TypeScript tier, Pydantic in the AI service
([ADR-016](./09-decision-log.md#adr-016)); the two are generated from one source
so they cannot drift. Today plans, assessment results, and session metrics are unvalidated
JSONB. A clinical plan is *structured* — it gets real columns and real foreign
keys. If a thing has a schema, it gets a table.

**Exercise references are foreign keys, never strings.** This is what kills
`findClosestSlug` ([06 §1](./06-ai-pipelines.md)) at the database level: a
model-invented exercise cannot be stored, because the FK will not resolve.

**Append-only where the clinical record demands it.** Plan versions are new rows,
never updates. `AuditEvent` is insert-only with no update or delete policy at
all — not even for the owner. Corrections are new events referencing the prior
one.

**Every domain table carries** `organization_id not null`, `created_at`,
`updated_at`, and a `created_by` that resolves to an identity.

### Governance tables

`GenerationJob`, `ModelRun`, `AIArtifact`, `SourceReference`, `PromptVersion`,
`EvaluationResult`, `AuditEvent` — defined in
[06-ai-pipelines.md §1](./06-ai-pipelines.md). They live in Postgres and are the
source of truth; Langfuse is a lens over them, never the record.

---

## 6. Storage

Patient-facing media and clinician uploads go to Supabase Storage in
`ca-central-1`, in **private buckets only**. Access is via signed URLs.

> **⚠️ Signed Storage URLs cannot be revoked.** Not by key rotation, not by
> sign-out, not by deleting the object's ACL. Once issued, the URL works until it
> expires.

Therefore: **TTLs of 60–300 seconds**, issued per-view, from a route handler that
has already checked authorization. Never embed a signed URL in a page that is
cached, emailed, or logged. A five-minute window on a URL that leaks is a
five-minute exposure; a one-hour window is a one-hour exposure with no way to
close it.

**Raw voice audio is not stored** — see [05](./05-voice-pipeline.md). The
transcript and the structured extraction are the record.

---

## 7. Migration from Neon

Neon → Supabase Postgres is a documented path (`pg_dump`/`pg_restore`, or
Supabase's migration tooling). It is the easy half.

**Neon Auth (Stack Auth) → Supabase Auth has no official path.** See
[04-auth-access-control.md](./04-auth-access-control.md) — the recommendation is
not to migrate credentials at all.

Given that the schema is being rewritten and the current database holds hackathon
demo data plus mock rows, **there is no production data to migrate.** The
"migration" is: stand up a new Supabase project, run the new migration set, seed
the exercise library from `scripts/generate-seed-sql.js` output, and re-invite
staff. Treat the Neon database as disposable.

---

## 8. Connection management

`@neondatabase/serverless` (HTTP driver) is dropped. It supports **no pooling and
no transactions** — and §4's entire RLS pattern *is* a transaction, so the
current driver cannot express it even in principle.

Supabase connection modes:

| Mode | Use |
|---|---|
| **Session mode** (port 5432, direct or Supavisor) | Route handlers and the worker. Required — `set local role` needs session semantics. |
| Transaction mode (port 6543) | Only where prepared statements are disabled and no session state is needed. **Not compatible with the `set local role` pattern.** |

Serverless route handlers on session-mode pooling need deliberate connection
limits. The durable worker holds long-lived connections and should be sized
separately.

---

## 9. Open items

| # | Item | Owner |
|---|---|---|
| 1 | **Supabase has no PIPEDA representation.** Clear with counsel before real patient data. | Legal — **blocking for pilot** |
| 2 | Confirm Realtime residency; if it cannot be confirmed in-region, do not use it for PHI-bearing channels | Supabase support |
| 3 | Verify the Edge Functions `x-region` pin actually holds — test it, don't trust the header | Engineering |
| 4 | Confirm what Supabase platform logs capture, and where they live | Supabase support |
| 5 | Team plan + add-on pricing for the compliance tier (add-on price unpublished) | Commercial |
| 6 | No CMK/BYOK — confirm no clinic requires customer-managed keys | Product |
| 7 | Write the per-table cross-tenant RLS test harness **before** the first policy ships | Engineering |
