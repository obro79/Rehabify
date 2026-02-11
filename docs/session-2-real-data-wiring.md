# Session 2: Wire Up Real Data, Improve UX & Plan-Aware Voice Coach

## Overview

Replaced all mock/hardcoded data across the app with real database-backed data. Created missing API endpoints, wired the full workout-to-dashboard data flow, and made the VAPI voice coach exercise-aware so it can coach through any exercise in the library.

## Changes Summary

### New API Endpoints

| File | Method | Purpose |
|---|---|---|
| `src/app/api/sessions/route.ts` | POST | Save completed workout sessions. Calculates XP (+10/rep, +5 bonus if score > 80), updates streaks, levels. Returns session + updated profile stats. |
| `src/app/api/profile/route.ts` | GET | Return current user's profile (name, email, xp, level, streak, preferences). |
| `src/app/api/profile/route.ts` | PATCH | Update displayName and/or preferences JSONB. |

### Modified Pages

| Page | What Changed |
|---|---|
| **Dashboard** (`dashboard/page.tsx`) | Replaced hardcoded "Sarah", mock exercises, mock sessions, mock stats. Now fetches `/api/profile` + `/api/patient-records` in parallel. Shows real plan exercises, real sessions, real weekly activity calendar, real streaks. |
| **Workout** (`workout/[slug]/page.tsx`) | Calls `POST /api/sessions` on completion. Fetches user's plan to determine exercise position. Stores session result + plan context in sessionStorage for the complete page. Full exercise data injected to VAPI voice coach. |
| **Complete** (`workout/[slug]/complete/page.tsx`) | Reads real session result from sessionStorage (XP earned, streak, level, duration). Shows plan-aware "Next Exercise" button. Fetches user profile for display name. |
| **History** (`history/page.tsx`) | Fetches real sessions from `/api/patient-records`. Transforms DB records to display format. Filters and pagination work on real data. Loading skeleton added. |
| **Progress** (`progress/page.tsx`) | Fetches real sessions, transforms into chart data formats (form scores, activity heatmap, exercise breakdown, personal records, session frequency). All 5 chart components receive real data. |
| **Profile/Settings** (`profile/page.tsx`) | Loads profile from `GET /api/profile`. Saves display name via `PATCH /api/profile`. All preference toggles (verbosity, speed, mute, high contrast, reduced motion, larger text) now persist to DB via preferences JSONB. Removed all "(demo mode - not persisted)" messages. |

### Voice Coach Enhancements

| File | What Changed |
|---|---|
| **Workout page** | Exercise intro context now includes: full step-by-step instructions, common mistakes, rep type (hold/alternating/standard), modifications, contraindications, equipment, and a structured coaching approach prompt. Exercise starting context includes rep type reminders and top mistakes to watch for. |
| **`use-form-event-bridge.ts`** | Accepts `commonMistakes` and `exerciseInstructions` props. Form correction cues now use exercise-specific common mistakes as context for the LLM, not just hardcoded squat/lunge cues. Falls back gracefully for exercises without specific detection cues. |
| **`use-session-voice.ts`** | Passes `commonMistakes`, `exerciseInstructions`, `nextExercise`, and `planName` through to the form event bridge. |

## Data Flow

```
User completes workout
  → POST /api/sessions (save session, update XP/streak/level)
  → sessionStorage stores result + plan context
  → Navigate to /complete page
  → Complete page reads sessionStorage, shows real stats
  → Dashboard/History/Progress fetch from /api/patient-records
  → All pages show real data
```

## Voice Coach Data Flow

```
Workout page mounts
  → Fetch plan from /api/patient-records
  → Find current exercise position in plan
  → On VAPI connect: inject full exercise context
    (instructions, mistakes, rep type, plan position, etc.)
  → On "Ready": inject exercise-specific starting context
  → During reps: form bridge sends corrections with exercise mistakes context
  → On completion: mention next exercise in plan
```

## Gamification Logic (in POST /api/sessions)

- **XP**: `repsCompleted * 10` base + `repsCompleted * 5` bonus if formScore > 80
- **Level**: `Math.floor(totalXP / 500) + 1`
- **Streak**: Incremented if last workout was yesterday; reset to 1 if gap > 1 day; unchanged if same day
- **Longest Streak**: Updated when current streak exceeds previous longest

## Files Changed

### New Files
- `src/app/api/sessions/route.ts`
- `src/app/api/profile/route.ts`
- `docs/session-2-real-data-wiring.md` (this file)

### Modified Files
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/history/page.tsx`
- `src/app/(dashboard)/profile/page.tsx`
- `src/app/(dashboard)/progress/page.tsx`
- `src/app/(dashboard)/workout/[slug]/page.tsx`
- `src/app/(dashboard)/workout/[slug]/complete/page.tsx`
- `src/hooks/use-form-event-bridge.ts`
- `src/hooks/use-session-voice.ts`
