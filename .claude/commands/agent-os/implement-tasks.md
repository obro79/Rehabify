# Spec Implementation Process

Now that we have a spec and tasks list ready for implementation, we will proceed with implementation of this spec by following this multi-phase process:

**Usage:**
```
/implement-tasks                    # With planning gate (default)
/implement-tasks --skip-planning    # Skip planning gate, direct to implementation
```

**Process Overview:**
- PHASE 0: Planning Gate (auto, skippable)
- PHASE 1: Determine which task group(s) to implement
- PHASE 2: Delegate implementation to the implementer subagent
- PHASE 3: After ALL task groups implemented, produce verification report

Follow each of these phases and their individual workflows IN SEQUENCE:

---

## PHASE 0: Planning Gate

**Skip this phase if user specified `--skip-planning`**

Before implementation, classify tasks to catch ambiguity early.

### Step 0.1: Read the task group

Read the task group from `agent-os/specs/[this-spec]/tasks.md` that will be implemented.

### Step 0.2: Classify each task

For each task in the group, classify as:

**READY** (implement directly) - Task has ALL of:
- Complete code snippet or clear implementation path
- Explicit file path(s)
- Testable acceptance criteria
- No notes like "tune during testing", "iterate", "TBD"

**NEEDS_PLAN** (generate mini-plan) - Task has ANY of:
- Contains words: "tune", "iterate", "test to find", "TBD", "experiment"
- Involves integration between multiple systems/agents
- UI/UX decisions not fully specified
- Threshold/configuration values not determined
- Mentions "during testing" or "post-hackathon refinement"

### Step 0.3: Output classification

Display classification to user:

```
## Planning Gate: Task Group [N] - [Name]

| Task | Status | Reason |
|------|--------|--------|
| [task number] | READY | [brief reason] |
| [task number] | NEEDS_PLAN ⚠️ | [why it needs planning] |
| ... | ... | ... |

[X] tasks READY
[Y] tasks NEED PLANNING
```

### Step 0.4: Handle based on classification

**If ALL tasks are READY:**
```
All tasks classified as READY - proceeding to implementation.
```
→ Continue to PHASE 1

**If ANY tasks NEED_PLAN:**

Launch a **Plan** subagent to create a mini-plan:

Provide to the Plan subagent:
- The specific tasks flagged as NEEDS_PLAN
- Context from spec.md and requirements.md
- The engineer task sheet if applicable

Instruct the Plan subagent to:
1. Analyze each flagged task
2. Make decisions on ambiguous items
3. Create a mini-plan file at: `agent-os/specs/[this-spec]/plans/task-group-[N].md`

**Mini-plan template:**
```markdown
# Mini-Plan: Task Group [N] - [Name]

## Tasks Requiring Planning
- [task]: [why it needed planning]

## Decisions Made
- [decision]: [rationale]

## Implementation Approach
[specific approach for previously ambiguous items]

## Open Questions (if any)
- [question for user before proceeding]
```

After mini-plan is generated, output to user:

```
Mini-plan created: agent-os/specs/[this-spec]/plans/task-group-[N].md

[Summary of key decisions made]

Review and approve? (yes / modify / skip-planning)
```

WAIT for user response before proceeding.

---

## PHASE 1: Determine which task group(s) to implement

First, check if the user has already provided instructions about which task group(s) to implement.

**If the user HAS provided instructions:** Proceed to PHASE 2 to delegate implementation of those specified task group(s) to the **implementer** subagent.

**If the user has NOT provided instructions:**

Read `agent-os/specs/[this-spec]/tasks.md` to review the available task groups, then output the following message to the user and WAIT for their response:

```
Should we proceed with implementation of all task groups in tasks.md?

If not, then please specify which task(s) to implement.
```

---

## PHASE 2: Delegate implementation to the implementer subagent

Delegate to the **implementer** subagent to implement the specified task group(s):

Provide to the subagent:
- The specific task group(s) from `agent-os/specs/[this-spec]/tasks.md` including the parent task, all sub-tasks, and any sub-bullet points
- The path to this spec's documentation: `agent-os/specs/[this-spec]/spec.md`
- The path to this spec's requirements: `agent-os/specs/[this-spec]/planning/requirements.md`
- The path to this spec's visuals (if any): `agent-os/specs/[this-spec]/planning/visuals`
- **NEW:** The mini-plan (if created): `agent-os/specs/[this-spec]/plans/task-group-[N].md`

Instruct the subagent to:
1. Analyze the provided spec.md, requirements.md, and visuals (if any)
2. **NEW:** If a mini-plan exists for this task group, follow the decisions and approaches documented there
3. Analyze patterns in the codebase according to its built-in workflow
4. Implement the assigned task group according to requirements and standards
5. Update `agent-os/specs/[this-spec]/tasks.md` to mark completed tasks with `- [x]`

---

## PHASE 3: Produce the final verification report

IF ALL task groups in tasks.md are marked complete with `- [x]`, then proceed with this step. Otherwise, return to PHASE 1.

Assuming all tasks are marked complete, then delegate to the **implementation-verifier** subagent to do its implementation verification and produce its final verification report.

Provide to the subagent the following:
- The path to this spec: `agent-os/specs/[this-spec]`
Instruct the subagent to do the following:
  1. Run all of its final verifications according to its built-in workflow
  2. Produce the final verification report in `agent-os/specs/[this-spec]/verifications/final-verification.md`.
