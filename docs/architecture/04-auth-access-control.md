# 04 — Authentication & Access Control

> **Decision (revised 2026-08-02): use Supabase Auth.** This reverses the earlier
> "Postgres + Storage, keep our own auth" call. Tracked as **ADR-004**.
>
> The reversal is defensible and I think correct — but it buys native RLS
> integration at the cost of four specific constraints that have to be designed
> around rather than discovered. They are §4.

---

## 1. What we are replacing — and why none of it survives

[02-current-state.md §2](./02-current-state.md) found the following. This is not
a list of bugs to fix; it is the reason the auth layer is rewritten.

| Finding | Location |
|---|---|
| `requireAuth()` reads the **client-controlled `x-demo-role` header** and returns a hardcoded PT identity | `src/lib/auth/server.ts:29` |
| Every PT page sends that header from the browser | — |
| `.env.example:73` ships `NEXT_PUBLIC_DEMO_MODE=true` | — |
| `src/proxy.ts:7` **disables page auth entirely** in demo mode | — |
| Role is **never read from `profiles.role`** — it is read off the Neon Auth user object, which carries no `role` claim. PT authorization is likely non-functional outside demo mode. | `src/lib/api/auth.ts:76` |
| **7 routes read or write patient data with no auth at all** — `api/session-state` (GET returns *any* session's live state), `api/messages`, `api/messages/[userId]`, `api/messages/[userId]/read`, `api/vapi/webhook` (unsigned), `api/vapi/assessment-webhook` (unsigned) | — |
| `VAPI_WEBHOOK_SECRET` declared **required**, referenced by **zero** source files | `src/lib/env.ts:37` |
| Missing ownership checks — `GET /api/plans/[planId]` (no role, no ownership), `PATCH /api/plans/[planId]`, `GET /api/pt/clients/[id]` (**never checks `patient.ptId === user.id`**) | — |
| `/onboard` writes identity to **localStorage** | `src/app/onboard/page.tsx:19` |
| `/assessment/*`, `/onboard`, and **all of `/api/*`** are absent from the middleware matcher | `src/proxy.ts` |
| RLS policies use `auth.uid()` against the `neon-http` driver → **inert** | `001_complete_schema.sql:561-655` |

Two structural lessons carried into the design:

1. **Demo mode was a backdoor, not a feature flag.** There is no
   `NEXT_PUBLIC_DEMO_MODE` in the rebuild, and no code path where an environment
   variable weakens authentication. Demo data is *seeded data under real auth*.
2. **Middleware was treated as the auth layer and covered a third of the app.**
   In the rebuild, `src/proxy.ts` is a redirect convenience only.
   **Authorization is enforced at the data layer** — see §5.

---

## 2. Why Supabase Auth

The earlier call was to keep first-party auth (porting `rehabifyy`'s HMAC
episode links, phone OTP, episode grants, and staff 2FA). Reversed because:

- **`auth.uid()` and `auth.jwt()` work natively in RLS policies.** This is the
  whole ballgame. [03 §3](./03-data-architecture.md) puts the entire tenant
  isolation guarantee on RLS; writing policies against a first-party session
  table means threading claims into Postgres by hand for every request, and the
  failure mode is silent. Native integration removes a category of bug.
- Phone OTP, anonymous sign-ins, and TOTP MFA/AAL2 — the four primitives the
  intake flow actually needs — are all first-party.
- One less system to own, in a codebase whose current auth is the single worst
  part of it.

**What it costs:** there is no migration path *off* Supabase Auth later, and four
non-configurable behaviors constrain the design (§4). Accept both explicitly.

---

## 3. Identity model

Two populations with genuinely different lifecycles.

### Clinic staff — physiotherapists and administrators

Email + password or SSO, **TOTP MFA required at AAL2** for any PHI access.
Membership in an organization is a row in `organization_members`, not a claim
the user controls.

**Role is read from the database, never from the user object.** The current
repo's central failure was reading role off an identity provider that never
issued one. Roles live in `organization_members.role` (a Postgres enum), and
reach policies via a **custom access token auth hook** that stamps
`organization_id` and `role` into the JWT at issue time.

### Patients — episode-scoped, phone-verified

Per [01 stage B](./01-product-definition.md):

```text
expiring SMS episode link
  → anonymous session, PHI-free pending state
  → phone OTP to the number already in the clinic's record
  → episode-scoped grant
```

**Before verification the patient sees no identity and no clinical
information.** The anonymous session exists only to hold the pending state.

Access is scoped to **an episode**, not to an account. A patient with two
episodes at two clinics has two grants. Grants expire. This is the model
`rehabifyy` already proved out, and it survives the switch to Supabase Auth
intact — it is a data model, not an auth implementation.

---

## 4. The four constraints — design around these, don't discover them

### 4a. 🔴 Anonymous users get the `authenticated` role

Not `anon`. A pending patient session is `authenticated` at the Postgres level,
so **every PHI policy needs a restrictive `is_anonymous is false` gate**, written
as a separate `as restrictive` policy so a later permissive policy on the same
table cannot bypass it. Full treatment in
[03 §3](./03-data-architecture.md).

This is the single most likely source of a data leak in this design. Test it
directly: an anonymous session must return zero rows from every PHI table.

### 4b. 🔴 MFA verify is rate-limited to 15/hour **per IP**

Non-configurable. **A clinic behind NAT is one IP.** Five physiotherapists each
retrying a TOTP code twice on a Monday morning will exhaust it, and the failure
looks like "MFA is broken" rather than "you are rate limited."

Mitigations: generous TOTP time-window tolerance, long-lived staff sessions so
re-verification is rare, clear error copy that names the real cause, and a
documented recovery path for the clinic. **Raise the limit with Supabase before
the pilot** — this will happen, not might.

### 4c. 🟠 Anonymous sign-in is 30/hour per IP

Also non-configurable, also a clinic-NAT problem — and it has a specific
implication: **anonymous sign-in must be client-initiated, never
server-proxied.** If our server creates the anonymous session, every patient in
the world shares our server's IP and we exhaust the limit globally at 30/hour.

### 4d. 🟠 Custom claims are stale until token refresh

Up to one hour. So **revoking a grant does not take effect immediately** if the
check depends only on a JWT claim.

Therefore: claims carry `organization_id` and `role` for *policy efficiency*, but
**episode grant validity is checked against a live table**, not a claim. Anything
that must revoke promptly is a row, not a claim. Related: **Realtime
authorization is cached for the connection's lifetime** — a revoked user keeps an
open channel until they reconnect. Do not put PHI on Realtime channels without
accounting for this (and see the unresolved Realtime residency question in
[03 §2](./03-data-architecture.md)).

### Also noted

**Passkeys are explicitly experimental**, anonymous users cannot enroll, and
AAL2 status is undocumented. Not in the pilot.

---

## 5. Enforcement — where authorization actually happens

Three layers, in order of trust. **Only the innermost is load-bearing.**

| Layer | Purpose | Trusted? |
|---|---|---|
| `src/proxy.ts` (middleware) | Redirect unauthenticated users to sign-in | ❌ UX only |
| Route handler | Validate input, check the action makes sense, load context | ⚠️ Defense in depth |
| **Postgres RLS via `db.rls`** | **The actual guarantee** | ✅ |

The current repo inverted this: middleware was the enforcement point, it covered
a third of the routes, and RLS was inert. Under the rebuild, a route handler that
forgets an ownership check returns zero rows instead of another patient's data.

Route handlers still perform explicit ownership and role checks — the ones missing
today on `GET /api/plans/[planId]`, `PATCH /api/plans/[planId]`,
`GET /api/pt/clients/[id]`, and `getTargetPatientId`. Defense in depth means both,
not either.

**Every route handler gets a test.** The current repo has ~21 test files and
**zero route-handler tests** ([02 §6](./02-current-state.md)). The minimum bar
per handler: unauthenticated → 401; wrong tenant → 404 or empty; wrong role →
403; anonymous session against PHI → empty.

---

## 6. Webhooks

Both current webhooks (`api/vapi/webhook`, `api/vapi/assessment-webhook`) are
**unauthenticated and unsigned**, accept patient data, and are deleted with Vapi
([05 §9](./05-voice-pipeline.md)).

The rule for any replacement: **signature verification before body parsing**,
constant-time comparison, timestamp window to reject replays, and the secret
actually referenced by code. `VAPI_WEBHOOK_SECRET` was declared required and used
by nothing — a lint check should catch a declared-but-unreferenced secret, since
that pattern reliably means the verification was never written.

---

## 7. Keys, sessions, audit

**Asymmetric ES256 signing keys** and `sb_publishable_` / `sb_secret_` API keys
from day one — legacy formats deprecate end of 2026, and migrating signing keys
later reissues every session. See [03 §2](./03-data-architecture.md).

**`sb_secret_` never reaches the browser.** Anything holding it is server-only,
in the `db.admin` allowlist directory.

**`AuditEvent` is insert-only** with no update or delete policy for any role.
Every authentication event, grant issue and revocation, PHI read by staff, and
plan-version approval writes one. Corrections are new events referencing the
prior event — the clinical record does not get rewritten.

---

## 8. Open items

| # | Item | Blocks |
|---|---|---|
| 1 | **Raise MFA verify rate limit with Supabase** (15/hr/IP vs clinic NAT) | Pilot — this *will* fire |
| 2 | Confirm AAL2 enforcement semantics for the staff flow | MFA design |
| 3 | Confirm Realtime authorization-cache behavior on grant revocation | Any PHI on Realtime |
| 4 | Decide the staff recovery path when MFA rate-limits a whole clinic | Pilot runbook |
| 5 | Confirm anonymous sign-in from the client meets the 30/hr/IP limit under real clinic conditions | Intake flow |
| 6 | Write the anonymous-session-sees-nothing test **before** the first PHI table ships | Engineering |
