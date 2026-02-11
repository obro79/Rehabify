# 10 — API Contracts

> Current API inventory, new endpoints, deprecated endpoints, and request/response schemas.

---

## Current API Inventory

All routes live under `src/app/api/` using Next.js App Router conventions.

| Route | Methods | Auth | Phase |
|-------|---------|------|-------|
| `/api/auth/[...path]` | * | Public | Current |
| `/api/health` | GET | Public | Current |
| `/api/profile` | GET, PUT | User | Current |
| `/api/assessments/save` | POST | User | Current |
| `/api/assessments/from-text` | POST | User | Current |
| `/api/assessments/[patientId]` | GET | PT | Current |
| `/api/plans` | GET | User | Current |
| `/api/plans/create-default` | POST | User | Current |
| `/api/plans/generate` | POST | User | Current |
| `/api/plans/chat` | POST | User | Current |
| `/api/plans/[planId]` | GET, PUT, DELETE | User | Current |
| `/api/sessions` | GET, POST | User | Current |
| `/api/session-state` | GET, PUT | User | Current |
| `/api/messages` | GET | User | Current |
| `/api/messages/[userId]` | GET, POST | User | Current |
| `/api/messages/[userId]/read` | PUT | User | Current |
| `/api/patient-records` | GET | PT | Current |
| `/api/patient-medical-info` | GET, POST | User | Current |
| `/api/pt/clients` | GET | PT | Current |
| `/api/pt/clients/[id]` | GET | PT | Current |
| `/api/vapi/webhook` | POST | Vapi | Current (deprecated Phase 1) |
| `/api/vapi/assessment-webhook` | POST | Vapi | Current (deprecated Phase 1) |

---

## New Endpoints

### Phase 0: Foundation

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/clinics` | GET, POST | Admin | List/create clinics |
| `/api/clinics/[clinicId]` | GET, PUT | Admin | Clinic detail/update |
| `/api/clinics/[clinicId]/members` | GET, POST | Admin | List/invite members |
| `/api/clinics/[clinicId]/members/[userId]` | PUT, DELETE | Admin | Update/remove member |
| `/api/audit` | GET | Admin | Query audit log |
| `/api/audit/export` | GET | Admin | Export audit log |

### Phase 1: Voice

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/voice/connect` | GET (WebSocket upgrade) | User | Establish voice session WebSocket |
| `/api/voice/session/[sessionId]` | GET | User | Voice session metadata |
| `/api/voice/usage` | GET | User | Voice usage stats (for guardrails) |

> Note: The WebSocket endpoint may live on a separate server depending on infrastructure decisions. See [06-infrastructure.md](./06-infrastructure.md).

### Phase 2: Vision

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/vision/telemetry` | GET (WebSocket upgrade) | User | Establish telemetry streaming WebSocket |
| `/api/vision/session/[sessionId]` | GET | User | Telemetry session results |
| `/api/vision/reference-motions` | GET | User | List available reference motions |
| `/api/vision/reference-motions/[id]` | GET | User | Get reference motion data |

### Phase 3: Billing

| Route | Methods | Auth | Purpose |
|-------|---------|------|---------|
| `/api/billing/record-session` | POST | System | Record device transmission day |
| `/api/billing/my-status` | GET | User | Patient's billing month status |
| `/api/billing/call-list` | GET | PT | PT call list (billing opportunities) |
| `/api/billing/log-time` | POST | PT | Record PT monitoring time |
| `/api/billing/[patientId]/status` | GET | PT | Patient billing detail |
| `/api/billing/report` | GET | Admin | Monthly billing report |
| `/api/billing/[recordId]/submit` | PUT | Admin | Mark as submitted |
| `/api/billing/[recordId]/paid` | PUT | Admin | Mark as paid |
| `/api/billing/export` | GET | Admin | Export billing data |

---

## Deprecated Endpoints

### Phase 1: Vapi Removal

| Route | Replacement |
|-------|-------------|
| `/api/vapi/webhook` | Removed (Gemini Live uses direct WebSocket, no webhooks) |
| `/api/vapi/assessment-webhook` | Removed (assessment voice handled via `/api/voice/connect`) |

---

## Modified Endpoints

### Phase 0: Add Clinic Scoping

All existing endpoints gain implicit clinic scoping via middleware. No URL changes, but:
- Request: Clinic ID extracted from auth token
- Response: Only returns data scoped to the user's clinic
- Error: 403 if accessing data outside user's clinic

### Phase 3: Session Creation Triggers Billing

`POST /api/sessions` (existing) additionally:
- Calls billing engine to record device transmission day
- Returns `billingDayRecorded: true/false` in response

---

## Request/Response Schemas

### Clinic CRUD

```typescript
// POST /api/clinics
// Request
z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(50),
  billingEmail: z.string().email().optional(),
})

// Response
z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  billingEmail: z.string().nullable(),
  createdAt: z.string().datetime(),
})
```

### Billing Record

```typescript
// GET /api/billing/[patientId]/status
// Response
z.object({
  patientId: z.string().uuid(),
  billingMonth: z.string(),  // "2026-02"
  records: z.array(z.object({
    id: z.string().uuid(),
    cptCode: z.enum(['98977', '98980']),
    status: z.enum(['tracking', 'eligible', 'submitted', 'paid']),
    deviceDays: z.number().int().optional(),       // for 98977
    ptMinutes: z.number().int().optional(),         // for 98980
    eligibleAt: z.string().datetime().nullable(),
    amountCents: z.number().int().nullable(),
  })),
})
```

### Billing Call List

```typescript
// GET /api/billing/call-list
// Response
z.object({
  month: z.string(),
  patients: z.array(z.object({
    patientId: z.string().uuid(),
    patientName: z.string(),
    cpt98977: z.object({
      deviceDays: z.number().int(),
      eligible: z.boolean(),
    }),
    cpt98980: z.object({
      ptMinutes: z.number().int(),
      eligible: z.boolean(),
      minutesRemaining: z.number().int(),
    }),
    unreadAlerts: z.number().int(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
})
```

### Telemetry Frame (WebSocket)

```typescript
// Client → Server (via WebSocket)
z.object({
  type: z.literal('frame'),
  sessionId: z.string().uuid(),
  exerciseId: z.string(),
  timestamp: z.number(),
  frameIndex: z.number().int(),
  landmarks: z.array(z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
    v: z.number(),  // visibility
  })).length(33),
  clientAnalysis: z.object({
    phase: z.string(),
    formScore: z.number(),
    repCount: z.number().int(),
    errors: z.array(z.string()),
  }),
})
```

### Voice Session (WebSocket)

```typescript
// Client → Server: Audio chunk
z.object({
  type: z.literal('audio'),
  sessionId: z.string().uuid(),
  chunk: z.string(),  // base64 encoded PCM audio
  vadActive: z.boolean(),
})

// Server → Client: Audio response
z.object({
  type: z.literal('audio_response'),
  chunk: z.string(),  // base64 encoded audio
  transcript: z.string().optional(),  // text of what was said
})
```

---

## Authentication & Authorization

| Role | Endpoints Accessible |
|------|---------------------|
| `patient` | Own profile, sessions, assessments, plans, messages, billing status |
| `pt` | Own patients' data, call list, time logging, alerts |
| `admin` | Clinic management, all patients, billing reports, audit log |
| `owner` | Everything admin can do + clinic settings + member management |
| `system` | Internal endpoints (billing record-session, etc.) |

All endpoints require authentication except `/api/auth/*` and `/api/health`.

---

## Open Questions

- Should WebSocket endpoints use the same auth mechanism as REST, or a separate token exchange?
- How do we version the API? URL path (`/api/v2/`) or header-based?
- Should we provide a GraphQL layer for the PT dashboard (complex nested queries)?
- How do we handle rate limiting per clinic vs per user?

---

See also:
- [current-state.md](./current-state.md) — Full current API inventory
- [05-data-architecture.md](./05-data-architecture.md) — Database schemas backing these endpoints
- [09-migration-plan.md](./09-migration-plan.md) — Which endpoints ship in which phase
