# 06 — Infrastructure

> Deployment architecture for WebSocket support, HIPAA compliance, and scaling.

---

## Current State

| Component | Hosting | Notes |
|-----------|---------|-------|
| Next.js app | Vercel (assumed) | Serverless functions, edge runtime |
| Database | Neon PostgreSQL | Serverless, auto-scaling |
| Auth | Neon Auth | Beta, bundled with Neon |
| Voice | Vapi (managed) | No infrastructure to manage |
| Vision | Client-side only | No server component |
| Storage | None | No file/blob storage |

### Vercel Limitations

The redesign introduces two requirements that conflict with Vercel's serverless model:

1. **WebSockets** — Gemini 2.0 Flash Live requires persistent WebSocket connections for audio streaming. Vercel Functions have a max execution time of 60s (Pro) / 300s (Enterprise) and don't support WebSocket upgrades natively.

2. **HIPAA BAA** — Vercel offers HIPAA compliance on Enterprise plans, but this is expensive and may not cover all requirements.

---

## Deployment Options

> **Open Decision**: The deployment target is not yet finalized. See [decision-log.md](./decision-log.md) ADR-003 and ADR-005.

### Option A: Vercel + Separate WebSocket Server

```
┌─────────────────────────────────────────┐
│  Vercel                                  │
│  ┌─────────────────────────────────────┐│
│  │ Next.js App (SSR, API routes)       ││
│  │ - UI rendering                      ││
│  │ - REST API endpoints                ││
│  │ - Auth                              ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
                    │
     ┌──────────────┼──────────────┐
     ▼              ▼              ▼
┌─────────┐  ┌───────────┐  ┌──────────┐
│ Neon DB │  │ WS Server  │  │ Cloud    │
│ (Postgres)│  │ (Fly.io/  │  │ Storage  │
│          │  │  Railway)  │  │ (GCS/S3) │
└─────────┘  └───────────┘  └──────────┘
```

**Pros**: Keep existing Vercel deployment for the web app; only add a WS server for voice/vision.
**Cons**: Split infrastructure, two deployment targets, harder to get a single BAA.

### Option B: Full GCP Deployment

```
┌─────────────────────────────────────────────┐
│  GCP                                         │
│  ┌────────────────────────────────────────┐  │
│  │ Cloud Run                              │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ Next.js App (containerized)      │  │  │
│  │  │ - SSR, API routes, Auth          │  │  │
│  │  └──────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │ WebSocket Server                 │  │  │
│  │  │ - Voice (Gemini Live)            │  │  │
│  │  │ - Vision (Telemetry ingestion)   │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Cloud SQL    │  │ Cloud Storage        │  │
│  │ (PostgreSQL) │  │ (Telemetry blobs)    │  │
│  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Pros**: Single cloud provider, single BAA with Google, WebSocket support native on Cloud Run, HIPAA-eligible services.
**Cons**: Migration effort from Vercel + Neon, need to manage containers, lose Vercel DX.

### Option C: Hybrid (Vercel + GCP for regulated services)

Keep Vercel for the frontend, move PHI-touching services to GCP.

**Pros**: Best DX for frontend, compliance where it matters.
**Cons**: Most complex architecture, multiple BAAs needed.

---

## WebSocket Server Requirements

Regardless of hosting choice, the WebSocket server needs:

| Requirement | Detail |
|-------------|--------|
| Persistent connections | Voice sessions last 5-30 minutes |
| Concurrent connections | ~50-500 per clinic initially |
| Audio throughput | ~16KB/s per voice connection (16kHz mono PCM) |
| Telemetry throughput | ~5KB/s per vision connection |
| Auto-scaling | Scale with active sessions, scale to zero when idle |
| Health checks | Liveness and readiness probes |
| Graceful shutdown | Drain existing connections before termination |
| TLS | Required for HIPAA (encryption in transit) |

### Cloud Run WebSocket Support

GCP Cloud Run supports WebSocket connections with:
- Max connection duration: 3600s (configurable)
- Idle timeout: 600s (configurable, reset on any message)
- Supports HTTP/2 and gRPC

This is sufficient for voice sessions (typically 5-30 min).

---

## Database Migration

### Neon → Cloud SQL

If moving to GCP (Option B), the database migration involves:

1. Export Neon schema and data (`pg_dump`)
2. Create Cloud SQL instance (PostgreSQL 15+)
3. Import to Cloud SQL (`pg_restore`)
4. Update connection strings in environment
5. Enable RLS policies (new for multi-tenancy)
6. Set up automated backups (HIPAA requirement)
7. Enable encryption at rest (default on Cloud SQL)

### Connection Pooling

Cloud SQL supports direct connections and the Cloud SQL Auth Proxy. For serverless (Cloud Run), use:
- **Cloud SQL Auth Proxy** as a sidecar container
- Or **Cloud SQL Connector** library for Node.js

---

## Environment Management

| Environment | Purpose | Hosting |
|-------------|---------|---------|
| `development` | Local development | `next dev` + local Docker |
| `preview` | PR previews | Vercel Preview (or Cloud Run revision) |
| `staging` | Pre-production testing | Cloud Run (staging project) |
| `production` | Live | Cloud Run (production project) |

---

## Monitoring & Observability

<!-- TODO: Select specific monitoring tools -->

| Layer | Tool Options | What to Monitor |
|-------|-------------|-----------------|
| Application | Cloud Logging, Datadog, Sentry | Errors, latency, throughput |
| Infrastructure | Cloud Monitoring, Grafana | CPU, memory, connection count |
| Database | Cloud SQL Insights, pganalyze | Query performance, connections |
| WebSocket | Custom metrics | Active connections, message rate, disconnects |
| Voice | Custom metrics | Session duration, Gemini latency, VAD hit rate |
| Vision | Custom metrics | Telemetry throughput, DTW processing time |
| Billing | Custom dashboard | Eligible patients, billing accuracy |

---

## Scaling Model

| Component | Scaling Trigger | Min | Max |
|-----------|----------------|-----|-----|
| Next.js (Cloud Run) | Request concurrency | 1 | 10 |
| WS Server (Cloud Run) | Active connections | 1 | 20 |
| Cloud SQL | Manual (vertical) | db-f1-micro | db-custom-4-16384 |
| Cloud Storage | Automatic | N/A | N/A |

### Cost Estimate (per-clinic, ~100 patients)

<!-- TODO: Validate these estimates with GCP pricing calculator -->

| Component | Monthly Est. |
|-----------|-------------|
| Cloud Run (Next.js) | ~$20 |
| Cloud Run (WS Server) | ~$30 |
| Cloud SQL (db-g1-small) | ~$50 |
| Cloud Storage | ~$5 |
| Cloud Logging | ~$10 |
| **Total** | **~$115/clinic** |

At $39/patient x 100 patients = $3,900 revenue → infrastructure is ~3% of revenue.

## Open Questions

- Vercel Enterprise HIPAA pricing — is it competitive with self-hosted GCP?
- Can we use Cloud Run's "always-on" instances to eliminate cold starts for WebSocket?
- Should the Python vision analysis server be a separate Cloud Run service?
- CDN strategy for static assets (MediaPipe WASM, exercise videos)?

---

See also:
- [07-hipaa-compliance.md](./07-hipaa-compliance.md) — BAA and compliance requirements
- [09-migration-plan.md](./09-migration-plan.md) — Deployment migration phases
