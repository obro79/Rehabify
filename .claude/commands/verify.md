# Spec Verification Process

Verify that a spec has been fully implemented by checking files exist, build passes, and tests run.

## Arguments

- `$ARGUMENTS` - The spec number (e.g., "10" for spec 10-zustand-state-management)

## Instructions

1. **Find the spec folder**
   - Look in `agent-os/specs/` for folders starting with the given number
   - Pattern: `agent-os/specs/{number}-*/`

2. **Read the spec documentation**
   - Read `spec.md` to understand what should be implemented
   - Focus on "File Structure" and "Success Criteria" sections

3. **Verify files exist**
   - Check that all files listed in "File Structure" section exist
   - Use `ls` or file glob patterns to verify
   - Report any missing files

4. **Run build**
   - Execute `pnpm build`
   - Report any build errors related to the spec's code

5. **Run relevant tests**
   - Look for test files related to the spec (e.g., `*.test.ts`, `*.spec.ts`)
   - Run `pnpm test --run` if tests exist
   - Report test results

6. **Check success criteria**
   - Go through each item in "Success Criteria" section
   - Verify each criterion is met
   - Mark criteria as passed/failed

7. **Generate verification report**
   - Summarize what was checked
   - List any issues found
   - Provide overall pass/fail status

## Example Usage

User: `/verify 10`

Claude will:
1. Find `agent-os/specs/10-zustand-state-management/`
2. Check for src/stores/exercise-store.ts, session-store.ts, voice-store.ts, etc.
3. Run `pnpm build` and `pnpm test --run`
4. Report verification status

## Output Format

```
## Spec 10: Zustand State Management - Verification Report

### Files
- [x] src/stores/exercise-store.ts
- [x] src/stores/session-store.ts
- [x] src/stores/voice-store.ts
- [ ] src/lib/session/session-guard.ts (MISSING)

### Build
- Status: PASS
- Errors: None

### Tests
- Status: PASS (3/3 tests passing)

### Success Criteria
- [x] State updates from vision worker < 5ms
- [x] Components using selectors only re-render on slice changes
- [ ] Multi-tab blocking - NOT TESTED

### Overall: PARTIAL (1 file missing, 1 criterion unverified)
```
