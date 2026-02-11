# Decision Log

> Architectural Decision Records (ADRs) for the Rehabify B2B redesign.

Format: Date | Status | Context | Decision | Consequences

---

## ADR-001: Gemini 2.0 Flash Live over Vapi

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-11 |
| **Status** | Accepted |
| **Context** | Vapi bundles Deepgram STT + Gemini LLM + ElevenLabs TTS at $0.15/min, costing ~$40/patient/month. This exceeds our $39 SaaS price, making the business unviable. Gemini 2.0 Flash Live offers native audio I/O (STT + reasoning + TTS in one model) at ~$0.004/min. |
| **Decision** | Replace Vapi with Gemini 2.0 Flash Live for all voice AI features. Add client-side Silero VAD to reduce transmitted audio. |
| **Consequences** | **Positive**: 97% cost reduction ($40.50 → $1.11/patient/mo), 96% gross margin achievable. **Negative**: Lose Vapi's managed orchestration, must build WebSocket infrastructure, TTS quality may differ from ElevenLabs, Gemini Live API may still be in preview. |

---

## ADR-002: Skeleton Streaming over Server-Side Video

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-11 |
| **Status** | Accepted |
| **Context** | For billing-grade exercise verification (CPT 98977), we need server-side records of patient exercise. Options: (A) stream video to server for analysis, (B) stream skeleton landmarks (JSON) to server for DTW analysis. |
| **Decision** | Stream only MediaPipe landmark coordinates (33 points x {x,y,z,visibility}) as JSON to the server. Video frames never leave the device. |
| **Consequences** | **Positive**: Privacy-first (skeleton data cannot reconstruct patient image), low bandwidth (~5KB/s vs ~500KB/s for video), minimal infrastructure cost. **Negative**: Server analysis limited to joint angles/DTW (no visual assessment of e.g., facial expression, skin color), reference motion library needed for DTW comparison. |

---

## ADR-003: GCP over AWS for HIPAA Compliance

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-11 |
| **Status** | Proposed |
| **Context** | We need HIPAA-compliant cloud infrastructure with a BAA. Both AWS and GCP offer HIPAA-eligible services. We already use Gemini (Google AI), which simplifies the BAA chain if we stay within the Google ecosystem. |
| **Decision** | Use GCP (Cloud Run, Cloud SQL, Cloud Storage) as the primary infrastructure, covered under a single Google Cloud BAA. |
| **Consequences** | **Positive**: Single BAA covers all services (simpler compliance), native Gemini integration, Cloud Run supports WebSockets. **Negative**: Team may have less GCP experience than AWS, migration from Vercel + Neon required, Cloud Run DX less polished than Vercel. |

> **Note**: This decision is still **proposed**. The Vercel + separate WS server option (see [06-infrastructure.md](./06-infrastructure.md)) remains viable.

---

## ADR-004: Server-Side Vision Analysis Language

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-11 |
| **Status** | Open |
| **Context** | Server-side DTW analysis can be implemented in Python (NumPy/SciPy/FastDTW — mature scientific computing ecosystem) or TypeScript (using existing `dynamic-time-warping` npm package — keeps the stack unified). |
| **Options** | |

### Option A: Python

| Aspect | Detail |
|--------|--------|
| Ecosystem | NumPy, SciPy, FastDTW are battle-tested for signal processing |
| Performance | NumPy vectorized ops are faster than JS equivalents |
| Deployment | Separate service (Cloud Run container) |
| Drawback | Adds a second language to the stack, separate deployment pipeline |

### Option B: TypeScript

| Aspect | Detail |
|--------|--------|
| Ecosystem | `dynamic-time-warping` npm package already in `package.json` |
| Performance | Adequate for 33-landmark DTW at 10-30fps |
| Deployment | Can run within Next.js API routes or a shared Node.js WS server |
| Drawback | Less mature scientific computing, may need custom implementations |

**Decision**: TBD. Needs benchmarking of TypeScript DTW performance at expected scale.

---

## ADR-005: Deployment Model

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-11 |
| **Status** | Open |
| **Context** | The redesign requires WebSocket support (voice + vision) and HIPAA compliance. Three deployment models are under consideration. |
| **Options** | A) Vercel + separate WS server, B) Full GCP (Cloud Run), C) Hybrid (Vercel frontend + GCP regulated services). See [06-infrastructure.md](./06-infrastructure.md) for details. |
| **Decision** | TBD. Depends on Vercel Enterprise HIPAA pricing, team GCP experience, and pilot clinic requirements. |

---

## ADR-006: Multi-Tenancy via Shared DB + RLS

| Field | Detail |
|-------|--------|
| **Date** | 2026-02-11 |
| **Status** | Accepted |
| **Context** | Multi-tenancy options: separate databases per clinic, separate schemas, or shared database with row-level security. At our expected scale (10-100 clinics initially), operational simplicity matters more than absolute isolation. |
| **Decision** | Use a shared PostgreSQL database with `clinic_id` columns and PostgreSQL Row-Level Security policies for data isolation. |
| **Consequences** | **Positive**: Simple operations, low cost, single migration path, proven SaaS pattern. **Negative**: Must be rigorous about RLS policy correctness; a bug could leak data across clinics. Requires application-level defense-in-depth. |

---

## Template for New Decisions

```markdown
## ADR-NNN: Title

| Field | Detail |
|-------|--------|
| **Date** | YYYY-MM-DD |
| **Status** | Proposed / Accepted / Deprecated / Superseded |
| **Context** | What is the issue that we're seeing that is motivating this decision? |
| **Decision** | What is the change that we're proposing and/or doing? |
| **Consequences** | What becomes easier or more difficult to do because of this change? |
```
