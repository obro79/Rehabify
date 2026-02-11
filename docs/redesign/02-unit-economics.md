# 02 — Unit Economics

> Component-by-component cost analysis and the path to 96% gross margin.

---

## Revenue Model

| Item | Amount | Notes |
|------|--------|-------|
| SaaS fee (to clinic) | **$39/patient/month** | Clinic pays per active patient |
| CPT 98977 reimbursement | ~$58/patient/month | Goes to clinic, not Rehabify — but this is the value prop |
| CPT 98980 reimbursement | ~$40/patient/month | Goes to clinic, not Rehabify |
| **Clinic net value** | **~$59/patient/month** | ($98 reimbursement - $39 SaaS fee) |

The pitch: the clinic pays $39/month and gets $98/month in new reimbursable revenue. **Net positive from day one.**

## Current Cost Structure (Vapi-based)

Per-patient monthly costs assuming ~4.5 hours of voice interaction and ~10 hours of exercise sessions:

| Component | Provider | Unit Cost | Monthly Usage | Monthly Cost |
|-----------|----------|-----------|---------------|--------------|
| Voice AI (bundled) | Vapi | $0.15/min | 270 min | **$40.50** |
| Vision (MediaPipe) | Client-side | $0 | N/A | **$0.00** |
| LLM (plan gen) | Gemini | ~$0.002/call | ~30 calls | **$0.06** |
| Database | Neon | ~$0.01/GB | ~50MB | **$0.50** |
| Storage | — | — | — | **$0.00** |
| Hosting | Vercel | ~$0.00004/req | ~10K req | **$0.40** |
| **Total** | | | | **$41.46** |

**Current gross margin**: ($39 - $41.46) / $39 = **-6.3%** (negative!)

> The Vapi dependency alone makes the business unviable at $39/patient/month.

## Target Cost Structure (Gemini-based)

| Component | Provider | Unit Cost | Monthly Usage | Monthly Cost |
|-----------|----------|-----------|---------------|--------------|
| Voice AI (Gemini Live) | Google | ~$0.004/min | 270 min | **$1.08** |
| VAD (Silero, client) | Client-side | $0 | N/A | **$0.00** |
| Context caching | Google | ~$0.001/session | 30 sessions | **$0.03** |
| Vision (MediaPipe) | Client-side | $0 | N/A | **$0.00** |
| Vision (server DTW) | Self-hosted | ~$0.001/session | 30 sessions | **$0.03** |
| LLM (plan gen) | Gemini | ~$0.002/call | ~30 calls | **$0.06** |
| Database | Cloud SQL | ~$0.02/GB | ~100MB | **$0.20** |
| Storage | Cloud Storage | ~$0.02/GB | ~50MB | **$0.01** |
| Hosting (Next.js) | Cloud Run | ~$0.0001/req | ~10K req | **$0.10** |
| Hosting (WS server) | Cloud Run | ~$0.04/hr | ~50 hrs | **$0.10** |
| **Total** | | | | **$1.61** |

**Target gross margin**: ($39 - $1.61) / $39 = **95.9%**

## Cost Breakdown by Workstream

### Voice: $40.50 → $1.11 (97% reduction)

| Current (Vapi) | Target (Gemini Live) |
|----------------|---------------------|
| Deepgram STT: bundled | Gemini native STT: included |
| Gemini LLM: bundled | Gemini Flash: included |
| ElevenLabs TTS: bundled | Gemini native TTS: included |
| Vapi orchestration: bundled | Self-managed WebSocket: ~$0 |
| **$40.50/patient/mo** | **$1.11/patient/mo** |

Key enablers:
- **Client-side VAD** (Silero WASM): Only sends audio when patient is speaking, reducing LLM input tokens
- **Context caching**: Reuses session context across turns instead of re-sending full history
- **Usage guardrails**: Soft cap at 10hr/mo (concise mode), hard cap at 20hr/mo (push-to-talk)

### Vision: $0 → $0.03 (stays near-zero)

Client-side MediaPipe remains free. Server-side DTW analysis adds minimal compute cost (~$0.001/session for NumPy/SciPy operations on lightweight JSON telemetry).

### Infrastructure: $0.90 → $0.40

Moving to GCP Cloud Run slightly reduces per-request cost and adds WebSocket support that Vercel lacks.

## Sensitivity Analysis

<!-- TODO: Model these scenarios with actual numbers -->

| Scenario | Voice Cost | Margin | Notes |
|----------|-----------|--------|-------|
| Base case | $1.11 | 95.9% | 4.5 hrs voice/mo, VAD enabled |
| Heavy user (2x voice) | $2.22 | 93.0% | 9 hrs voice/mo |
| No VAD savings | $2.70 | 89.5% | VAD disabled, all audio sent |
| Gemini price increase (2x) | $2.22 | 93.0% | Google doubles Gemini pricing |
| Volume discount (50%) | $0.56 | 97.8% | Committed use discount |

## Key Assumptions

1. Gemini 2.0 Flash Live pricing holds at ~$0.004/min (audio in + audio out + LLM)
2. Average patient does 30 sessions/month, each ~9 min of voice interaction
3. Client-side VAD reduces actual audio transmission by ~60%
4. Context caching reduces per-turn token cost by ~70%
5. Server-side vision analysis processes ~5KB/s of landmark JSON, not video

## Open Questions

- What is the actual Gemini 2.0 Flash Live pricing for audio I/O? (Need to verify against current rate card)
- Can we negotiate committed use discounts at 1,000+ patient scale?
- Should we offer tiered pricing ($29/$39/$49) based on feature access?

---

<!-- TODO: Build financial model spreadsheet with 12-month projections -->
<!-- TODO: Add customer acquisition cost (CAC) and lifetime value (LTV) estimates -->
