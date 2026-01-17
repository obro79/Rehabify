# Hackathon Status Check

Quick overview of spec implementation progress across all specs.

## Instructions

1. **List all specs**
   - Read `agent-os/specs/` directory
   - Get all numbered spec folders (01-*, 02-*, etc.)
   - Sort by spec number

2. **For each spec, quick-check status**
   - Read the spec.md "File Structure" section
   - Check if primary files exist in `src/`
   - Categorize as: DONE, PARTIAL, TODO

   Status criteria:
   - **DONE**: All files in File Structure exist and build passes
   - **PARTIAL**: Some files exist but not all
   - **TODO**: No implementation files exist yet

3. **Generate progress report**
   - Show overall counts (X done, Y partial, Z todo)
   - List each spec with its status
   - Highlight which spec to work on next (based on dependencies)

## Output Format

```
# Hackathon Progress Report

## Summary
- Done: 5/25 specs (20%)
- Partial: 3/25 specs (12%)
- Todo: 17/25 specs (68%)

## Spec Status

| # | Spec Name | Status | Notes |
|---|-----------|--------|-------|
| 01 | Environment Configuration | DONE | .env.local exists |
| 02 | Neon Postgres Connection | DONE | db/index.ts exists |
| 03 | Drizzle ORM Configuration | DONE | schema files exist |
| 04 | - | SKIP | (no spec 04) |
| 05 | Row Level Security | TODO | No RLS policies found |
| ... | ... | ... | ... |

## Recommended Next
Based on dependencies, work on: **Spec 05 (Row Level Security)**
- Depends on: Spec 02, 03 (both DONE)
- Blocks: Spec 06, 07
```

## Quick Mode

For a faster check, just count files:
- Specs with >80% files present = DONE
- Specs with 20-80% files present = PARTIAL
- Specs with <20% files present = TODO
