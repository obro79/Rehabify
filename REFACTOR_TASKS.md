# Refactoring Tasks for Parallel Agent Execution

This document contains high-value refactoring and deletion tasks identified from codebase exploration.
Tasks are organized for parallel agent execution.

---

## Priority 1: Quick Wins (Deletions - No Dependencies)

These can all be executed in parallel by separate agents.

### Task 1.1: Remove Unused npm Dependencies
**Agent Type:** Bash
**Estimated Impact:** ~1.2 MB node_modules reduction

```bash
npm uninstall three @react-three/fiber @react-three/drei react-is
```

**Files to update:**
- `package.json` - Remove the 4 unused dependencies

---

### Task 1.2: Delete API Template Files
**Agent Type:** Bash
**Estimated Impact:** ~314 lines removed

Delete entire directory:
```
src/app/api/_templates/
```

Files:
- `src/app/api/_templates/crud-resource/route.ts` (110 lines)
- `src/app/api/_templates/crud-resource/[id]/route.ts` (204 lines)
- `src/app/api/_templates/README.md`

---

### Task 1.3: Delete Unused Assessment Constants File
**Agent Type:** Bash
**Estimated Impact:** ~62 lines removed

Delete file:
```
src/app/assessment/lower-back/constants.ts
```

All exports are unused:
- `ASSESSMENT_STEPS`
- `MOVEMENT_SLUGS`
- `MOVEMENT_KEYWORDS`
- `DEFAULT_ASSESSMENT_DATA`
- `VoiceState` type (duplicated elsewhere)
- `AssessmentPhase` type (duplicated elsewhere)

---

### Task 1.4: Delete Unused Message Store
**Agent Type:** Bash
**Estimated Impact:** ~50 lines removed

Delete file:
```
src/stores/message-store.ts
```

The entire store is defined but never imported anywhere.

---

### Task 1.5: Remove Unused plan-utils Functions
**Agent Type:** Edit
**File:** `src/app/pt/clients/[id]/plan/plan-utils.ts`
**Impact:** ~60 lines removed

Delete these unused exported functions:
- `getWeekFocus()` (lines 82-89)
- `getWeekNotes()` (lines 94-101)
- `generateExerciseId()` (lines 61-63)
- `getDayLabel()` (lines 40-42)

---

## Priority 2: Debug Code Removal (Parallel Safe)

All these can run in parallel - no interdependencies.

### Task 2.1: Remove Debug Logs from assessment-webhook
**Agent Type:** Edit
**File:** `src/app/api/vapi/assessment-webhook/route.ts`
**Impact:** Remove 18 console.log statements

Remove all `console.log('[assessment-webhook]` statements.

---

### Task 2.2: Remove Debug Logs from webhook
**Agent Type:** Edit
**File:** `src/app/api/vapi/webhook/route.ts`
**Impact:** Remove 8 console.log statements

Remove all `console.log('[vapi-webhook]` statements.

---

### Task 2.3: Remove Debug Logs from use-form-event-bridge
**Agent Type:** Edit
**File:** `src/hooks/use-form-event-bridge.ts`
**Impact:** Remove 10 console.log statements with emoji markers

Remove all `console.log('[useFormEventBridge]` statements.

---

### Task 2.4: Remove Debug Logs from use-vapi
**Agent Type:** Edit
**File:** `src/hooks/use-vapi.ts`
**Impact:** Remove 30+ console.log statements

Remove all debug logging with emoji markers (keep legitimate console.error for actual errors).

---

### Task 2.5: Remove Debug Logs from lower-back Assessment Page
**Agent Type:** Edit
**File:** `src/app/assessment/lower-back/page.tsx`
**Impact:** Remove 11 console.log statements

Remove all `console.log('[AssessmentPage]` statements.

---

## Priority 3: Code Consolidation (Sequential - Has Dependencies)

### Task 3.1: Consolidate Time Formatting Functions
**Agent Type:** Edit
**Files:**
- `src/components/messaging/message-inbox.tsx` - Remove `formatRelativeTime` function (lines 13-26)
- `src/components/messaging/message-thread.tsx` - Remove `formatTimestamp` function

**Action:** Replace with imports from existing `src/lib/date-utils.ts`

---

### Task 3.2: Consolidate TranscriptEntry Type
**Agent Type:** Edit
**Files:**
- `src/stores/assessment-store.types.ts` - Remove `TranscriptEntry` (lines 68-72)
- Update to import from `src/stores/voice-store.ts` or `src/types/voice.ts`

---

### Task 3.3: Create Patient Access Utility
**Agent Type:** Write + Edit
**New File:** `src/lib/api/patient-access.ts`

Extract duplicate authorization logic from:
- `src/app/api/patient-records/route.ts` (lines 26-45)
- `src/app/api/patient-medical-info/route.ts` (lines 61-81)

Create shared function:
```typescript
export async function getTargetPatientId(request: NextRequest, user: User): Promise<string>
```

---

### Task 3.4: Create Message Validation Schema
**Agent Type:** Write + Edit
**New File:** `src/lib/api/validation-schemas.ts`

Extract from:
- `src/app/api/messages/route.ts` (lines 112-129)
- `src/app/api/messages/[userId]/route.ts` (lines 94-107)

Create:
```typescript
export const messageContentSchema = z.object({
  content: z.string().min(1).max(2000)
});
```

---

### Task 3.5: Create Vapi Webhook Utilities
**Agent Type:** Write + Edit
**New File:** `src/lib/vapi/webhook-utils.ts`

Extract shared types and handlers from:
- `src/app/api/vapi/webhook/route.ts`
- `src/app/api/vapi/assessment-webhook/route.ts`

Types to extract:
- `VapiToolCall`
- `VapiWebhookPayload`
- `ToolResult`

Function to extract:
- `handleToolCalls()`

---

## Priority 4: Store Simplification (Sequential)

### Task 4.1: Remove Unused Exercise Store State
**Agent Type:** Edit
**Files:**
- `src/stores/exercise-store.ts` - Remove `lastFrameAt` and `updateLastFrame()`
- `src/stores/exercise-store-selectors.ts` - Remove `selectLastFrameAt`
- `src/components/workout/exercise-camera.tsx` - Remove `updateLastFrame` usage
- `src/hooks/use-pose-detection.ts` - Remove `updateLastFrame` usage

---

### Task 4.2: Remove Unused Voice Store State
**Agent Type:** Edit
**Files:**
- `src/stores/voice-store.ts` - Remove `lastSpokenFeedback` and `setLastSpokenFeedback()`
- `src/stores/voice-store-selectors.ts` - Remove `selectLastSpokenFeedback`

---

### Task 4.3: Remove Assessment Store Duplicate Transcript
**Agent Type:** Edit
**Files:**
- `src/stores/assessment-store.ts` - Remove `transcript` array
- `src/stores/assessment-store.types.ts` - Remove transcript-related types
- Update consumers to use voice-store transcript instead

---

## Priority 5: CSS Utilities (Parallel Safe)

### Task 5.1: Add Common Layout Utilities
**Agent Type:** Edit
**File:** `src/app/globals.css`

Add to `@layer utilities`:
```css
.center { @apply flex items-center justify-center; }
.label-xs { @apply text-xs font-medium; }
.label-sm { @apply text-sm font-medium; }
.heading-lg { @apply text-lg font-bold; }
.heading-xl { @apply text-2xl font-bold; }
```

---

### Task 5.2: Remove Unused CSS Class
**Agent Type:** Edit
**File:** `src/app/globals.css`

Remove `.rounded-pill` class (defined but never used).

---

## Priority 6: Type Consolidation (Complex - Needs Planning)

### Task 6.1: Consolidate Exercise Types
**Files:**
- `src/types/exercise.ts` - Has model-agnostic Exercise interface
- `src/lib/exercises/types.ts` - Has database schema Exercise interface

**Action:** Make `src/lib/exercises/types.ts` the source of truth, update `src/types/exercise.ts` to re-export.

---

### Task 6.2: Consolidate VoiceState Types
**Files:**
- `src/types/voice.ts` - `VapiConnectionState`
- `src/stores/voice-store.ts` - `ConnectionState`

**Action:** Normalize to single `ConnectionState` in `src/types/voice.ts`, re-export from stores.

---

### Task 6.3: Rename VapiMessage in Constants
**Agent Type:** Edit
**File:** `src/lib/vapi/constants.ts`

Rename `VapiMessage` to `VapiWebhookMessage` to avoid conflict with `src/types/voice.ts`.

---

## Priority 7: Large File Splitting (Complex - Needs Planning)

### Task 7.1: Split form-engine.ts
**File:** `src/lib/vision/form-engine.ts` (1,286 lines)

**Suggested splits:**
- `src/lib/vision/analyzers/cat-camel-analyzer.ts`
- `src/lib/vision/analyzers/cobra-analyzer.ts`
- `src/lib/vision/analyzers/squat-analyzer.ts`
- `src/lib/vision/form-scoring.ts`
- `src/lib/vision/form-state-manager.ts`

---

### Task 7.2: Split assessment lower-back page
**File:** `src/app/assessment/lower-back/page.tsx` (833 lines)

**Suggested splits:**
- `src/app/assessment/lower-back/_components/assessment-left-panel.tsx`
- `src/app/assessment/lower-back/_components/assessment-right-panel.tsx`
- `src/app/assessment/lower-back/_components/exercise-camera-section.tsx`

---

### Task 7.3: Split PT plan page
**File:** `src/app/pt/clients/[id]/plan/page.tsx` (810 lines)

Note: ExerciseLibraryPanel.tsx and CurrentPlanPanel.tsx already exist.
Check if page.tsx duplicates their functionality.

---

## Priority 8: Hardcoded Values to Extract

### Task 8.1: Create Session Config
**New File:** `src/config/session.ts`

Extract from:
- `src/lib/session/session-persistence.ts` - `RESUME_WINDOW_MS = 5 * 60 * 1000`
- `src/app/api/session-state/route.ts` - `SESSION_TTL_MS = 5 * 60 * 1000` (duplicate!)
- `src/lib/session/session-guard.ts` - `CLAIM_TIMEOUT_MS`, `HEARTBEAT_INTERVAL_MS`, `HEARTBEAT_TIMEOUT_MS`

---

### Task 8.2: Create Voice Feedback Config
**New File:** `src/config/voice.ts`

Extract from:
- `src/lib/voice/form-event-debouncer.ts` - `DEFAULT_COOLDOWN_MS`, `EXTENDED_COOLDOWN_MS`, `EXTENDED_COOLDOWN_THRESHOLD`
- `src/hooks/use-form-event-bridge.ts` - `FEEDBACK_COOLDOWN` (conflicts with above!)

Note: There's a conflict - 3000ms vs 5000ms cooldown. Needs clarification.

---

### Task 8.3: Create UI Config
**New File:** `src/config/ui.ts`

Extract from:
- `src/components/ui/toast.tsx` - `duration = 5000` default
- `src/hooks/use-carousel.ts` - `intervalMs = 5000`
- `src/components/ui/progress-ring.tsx` - `duration = 1000`

---

## Dependency Graph for Execution Order

```
Priority 1 (All Parallel)
├── 1.1 Remove npm deps
├── 1.2 Delete templates
├── 1.3 Delete constants
├── 1.4 Delete message-store
└── 1.5 Remove unused functions

Priority 2 (All Parallel)
├── 2.1 assessment-webhook logs
├── 2.2 webhook logs
├── 2.3 form-event-bridge logs
├── 2.4 use-vapi logs
└── 2.5 lower-back page logs

Priority 3 (Sequential within group)
├── 3.1 Time formatting (parallel safe)
├── 3.2 TranscriptEntry (depends on type location decision)
├── 3.3 Patient access (parallel safe)
├── 3.4 Message validation (parallel safe)
└── 3.5 Vapi webhook utils (parallel safe)

Priority 4 (Sequential)
├── 4.1 Exercise store
├── 4.2 Voice store
└── 4.3 Assessment store (depends on 4.2)

Priority 5 (Parallel Safe)
├── 5.1 Add CSS utilities
└── 5.2 Remove unused CSS

Priority 6-8 (Needs planning first)
```

---

## Quick Reference: Files to Delete

```
src/app/api/_templates/                              # Entire directory
src/app/assessment/lower-back/constants.ts           # Unused exports
src/stores/message-store.ts                          # Never imported
```

## Quick Reference: Dependencies to Remove

```json
{
  "three": "^0.182.0",
  "@react-three/fiber": "^9.4.2",
  "@react-three/drei": "^10.7.7",
  "react-is": "^19.2.3"
}
```

---

*Generated: 2026-01-21*
