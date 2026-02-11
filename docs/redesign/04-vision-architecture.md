# 04 — Vision Architecture

> Skeleton Streaming: client-side MediaPipe landmark extraction → JSON telemetry → server-side DTW analysis.

---

## Current State

### Pipeline
```
Camera (browser)
  → MediaPipe Pose Landmarker (client WASM, 33 landmarks @ 30fps)
    → 1-Euro filter (smoothing)
      → form-engine.ts (1,286 lines, 10 exercise analyzers)
        → Real-time form feedback to UI
```

All analysis runs **entirely client-side**. This is great for privacy but has limitations:
- No server-side record of exercise execution (can't bill against it)
- No reference motion library (gold-standard comparisons)
- Monolithic engine — all 10 exercises in one 1,286-line file
- No way for PTs to verify patient actually performed exercises

### Files in Codebase

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/vision/form-engine.ts` | Main form analysis engine | 1,286 |
| `src/lib/vision/form-types.ts` | Type definitions, state management | 84 |
| `src/lib/vision/geometry.ts` | Angle/distance calculations | — |
| `src/lib/vision/pose-landmarker.ts` | MediaPipe WASM initialization | — |
| `src/lib/vision/landmark-filter.ts` | 1-Euro filter for landmark smoothing | — |
| `src/lib/vision/camera-feedback.ts` | Camera quality/positioning feedback | — |
| `src/lib/vision/movement-comparison.ts` | DTW-based movement comparison | — |
| `src/lib/vision/exercises/squat.ts` | Squat form analyzer | 361 |
| `src/lib/vision/exercises/standing.ts` | Standing exercise analyzers | 252 |
| `src/lib/vision/exercises/floor.ts` | Floor exercise analyzers | 141 |
| `src/lib/vision/exercises/lumbar.ts` | Lumbar exercise analyzers | 172 |
| `src/lib/vision/exercises/assessment-movements.ts` | Assessment movement analyzers | 314 |
| `src/hooks/use-camera.ts` | Camera access hook | — |
| `src/hooks/use-pose-detection.ts` | MediaPipe pose detection hook | — |
| `src/hooks/use-form-event-bridge.ts` | Form events → voice feedback | — |

### Dependencies
- `@mediapipe/tasks-vision` ^0.10.14 — Pose Landmarker WASM
- `1eurofilter` ^1.2.2 — Jitter reduction for landmarks
- `dynamic-time-warping` ^1.0.0 — Movement comparison

---

## Target Architecture: Skeleton Streaming

### Pipeline
```
Camera (browser)
  → MediaPipe Pose Landmarker (client WASM, 33 landmarks @ 30fps)
    → 1-Euro filter (smoothing)
      → Client form engine (real-time feedback, kept for responsiveness)
      → JSON telemetry stream (~5KB/s) via WebSocket
        → Server analysis (Python: NumPy/SciPy/FastDTW)
          → DTW scoring against reference motions
            → Billing-grade exercise verification
            → Stored telemetry for audit trail
```

### Privacy Firewall

**Video frames NEVER leave the device.**

The client extracts 33 landmark coordinates (x, y, z, visibility) per frame and sends only this JSON telemetry to the server. A skeleton is not reconstructible into a recognizable image of the patient.

| Data | Leaves device? | Format | Bandwidth |
|------|---------------|--------|-----------|
| Video frames | **No** | — | — |
| Landmark coordinates | **Yes** | JSON array of 33 {x,y,z,v} | ~5 KB/s at 30fps |
| Form scores | **Yes** | JSON | ~0.1 KB/s |
| Rep counts | **Yes** | JSON | ~0.01 KB/s |

### Dual Analysis Model

The system runs analysis at **two levels**:

1. **Client-side (real-time)** — Existing `form-engine.ts` continues to provide instant feedback (< 16ms latency). This is critical for user experience — you can't wait for a server round-trip to tell someone their knee is caving in.

2. **Server-side (billing-grade)** — Receives the same landmark stream and performs:
   - **DTW comparison** against gold-standard reference motions
   - **Physics-based validation** (joint angle constraints, anatomical feasibility)
   - **Rep verification** — server-authoritative rep count for billing
   - **Telemetry storage** — persistent record for audit and PT review

---

## File Migration Plan

### KEEP (client-side, unchanged)
- `src/lib/vision/pose-landmarker.ts` — MediaPipe initialization
- `src/lib/vision/landmark-filter.ts` — 1-Euro filter
- `src/lib/vision/geometry.ts` — Angle calculations
- `src/lib/vision/camera-feedback.ts` — Camera quality feedback
- `src/lib/vision/form-types.ts` — Type definitions
- `src/lib/vision/exercises/` — All exercise analyzers (client feedback continues)
- `src/hooks/use-camera.ts` — Camera access
- `src/hooks/use-pose-detection.ts` — Pose detection

### MODIFY
- `src/lib/vision/form-engine.ts` — Add telemetry emission alongside existing analysis. Each frame's landmarks get forwarded to the WebSocket connection.
- `src/hooks/use-form-event-bridge.ts` — Extend to also send events to telemetry stream
- `src/lib/vision/movement-comparison.ts` — May be migrated server-side for billing-grade DTW

### CREATE (client-side)
- `src/lib/vision/telemetry-stream.ts` — WebSocket client that sends landmark JSON to server
- `src/hooks/use-telemetry.ts` — Hook managing telemetry WebSocket lifecycle

### CREATE (server-side)

> **Open Decision**: Server-side analysis may be Python (NumPy/SciPy/FastDTW) or TypeScript. See [decision-log.md](./decision-log.md) ADR-004.

If Python:
- `services/vision-server/` — Standalone Python service
  - `analysis/dtw_scorer.py` — FastDTW comparison against reference motions
  - `analysis/physics.py` — Joint constraint validation
  - `analysis/rep_counter.py` — Server-authoritative rep counting
  - `models/reference_motions/` — Gold-standard exercise recordings
  - `api/telemetry_ws.py` — WebSocket endpoint for landmark ingestion

If TypeScript (within Next.js or separate service):
- `src/lib/vision/server/dtw-scorer.ts` — Server DTW using existing `dynamic-time-warping` package
- `src/lib/vision/server/physics.ts` — Joint constraint validation
- `src/lib/vision/server/rep-counter.ts` — Server rep counting

---

## Telemetry Protocol

### Client → Server (per frame, ~30fps)

```json
{
  "type": "frame",
  "sessionId": "uuid",
  "exerciseId": "squat",
  "timestamp": 1707600000000,
  "frameIndex": 1234,
  "landmarks": [
    { "x": 0.52, "y": 0.31, "z": -0.08, "v": 0.99 },
    // ... 33 total landmarks
  ],
  "clientAnalysis": {
    "phase": "descent",
    "formScore": 0.85,
    "repCount": 3,
    "errors": ["knee_valgus"]
  }
}
```

### Server → Client (per rep or on-demand)

```json
{
  "type": "rep_result",
  "sessionId": "uuid",
  "repIndex": 3,
  "dtwScore": 0.91,
  "physicsValid": true,
  "serverRepCount": 3,
  "feedback": null
}
```

### Bandwidth Estimate

- 33 landmarks x 4 floats x 4 bytes = 528 bytes/frame
- At 30fps = ~15.8 KB/s raw
- With JSON overhead and metadata: ~5 KB/s (can downsample to 10-15fps for server stream)
- Per 30-min session: ~9 MB of telemetry data

## Reference Motion Library

<!-- TODO: Define how reference motions are captured and stored -->

Server-side DTW requires gold-standard reference motions:
- Capture from PTs or biomechanics experts
- Store as landmark time series in `reference_motions` table
- Per-exercise, per-variant (e.g., squat-standard, squat-sumo)
- Versioned — reference motions can be updated without breaking historical comparisons

## Open Questions

- Python vs TypeScript for server-side analysis? (See [decision-log.md](./decision-log.md))
- Should we downsample the telemetry stream (10fps vs 30fps) to reduce bandwidth/storage?
- How do we handle clients with poor network? Buffer and batch-send?
- Should the client fall back to client-only mode if the telemetry WebSocket disconnects?
- How are reference motions captured? Manual recording tool? Crowd-sourced from PTs?

---

See also:
- [diagrams/vision-pipeline.mermaid](./diagrams/vision-pipeline.mermaid) — Visual pipeline diagram
- [current-state.md](./current-state.md) — Current vision system detail
- [05-data-architecture.md](./05-data-architecture.md) — Telemetry storage schema
