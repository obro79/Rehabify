# Refactor Tasks Summary

## Overview

The REFACTOR_TASKS.md file contains findings from 10 exploration agents, organized for parallel execution.

## 8 Priority Levels

| Priority | Category | Tasks | Parallelizable |
|----------|----------|-------|----------------|
| 1 | Quick Wins (Deletions) | 5 tasks | All parallel |
| 2 | Debug Code Removal | 5 tasks | All parallel |
| 3 | Code Consolidation | 5 tasks | Most parallel |
| 4 | Store Simplification | 3 tasks | Sequential |
| 5 | CSS Utilities | 2 tasks | All parallel |
| 6 | Type Consolidation | 3 tasks | Needs planning |
| 7 | Large File Splitting | 3 tasks | Needs planning |
| 8 | Hardcoded Values | 3 tasks | Needs planning |

## Key Quick Wins (Ready for Immediate Execution)

- Remove 4 unused npm deps (three, @react-three/fiber, @react-three/drei, react-is)
- Delete `src/app/api/_templates/` directory
- Delete `src/app/assessment/lower-back/constants.ts`
- Delete `src/stores/message-store.ts`
- Remove 80+ console.log statements across 5 files

## Priority 1: Parallel Deletions (5 agents)

1. **Remove unused npm deps** - `npm uninstall three @react-three/fiber @react-three/drei react-is`
2. **Delete templates** - `src/app/api/_templates/` directory
3. **Delete constants** - `src/app/assessment/lower-back/constants.ts`
4. **Delete message store** - `src/stores/message-store.ts`
5. **Remove unused functions** - `plan-utils.ts` (getWeekFocus, getWeekNotes, generateExerciseId, getDayLabel)

## Priority 2: Debug Log Removal (5 agents)

1. **assessment-webhook/route.ts** - 18 console.log statements
2. **webhook/route.ts** - 8 console.log statements
3. **use-form-event-bridge.ts** - 10 console.log statements with emoji markers
4. **use-vapi.ts** - 30+ console.log statements
5. **lower-back/page.tsx** - 11 console.log statements

## Execution Notes

- Priority 1 and 2 tasks have no interdependencies
- All 10 tasks can run simultaneously
- See REFACTOR_TASKS.md for full details and dependency graph

---

*Generated: 2026-01-21*
