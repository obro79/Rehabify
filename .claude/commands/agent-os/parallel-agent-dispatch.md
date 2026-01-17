# Parallel Agent Dispatch

Coordinate launching multiple specialized agents with dependency awareness. This skill manages launch order, sync points, and creates handoff files for agent communication.

## When to Use

- After running `/spec-to-agents` when you have agent configurations ready
- When starting a new implementation phase with multiple engineers
- When resuming work after a sync checkpoint

## Process Overview

PHASE 1: Load agent configurations and analyze dependencies
PHASE 2: Determine launch order and parallel groups
PHASE 3: Create sync point infrastructure
PHASE 4: Dispatch agents and monitor progress

Follow each phase IN SEQUENCE:

---

## PHASE 1: Load Agent Configurations

Read all agent configurations from:
```
agent-os/agents/*.yaml
```

For each agent, extract:
- `agent.name` - Identifier
- `coordination.outputs_to` - What this agent produces
- `coordination.expects_from` - What this agent needs
- `verification` - Phase checkpoints

Also read the tasks file to understand current progress:
```
agent-os/specs/[current-spec]/tasks.md
```

Build a dependency graph:

```
Dependencies Found:
┌────────────────────────────────────────────────────┐
│ frontend-engineer                                   │
│   expects: backend-engineer (neon clients)         │
│   outputs: vision-engineer (VideoCanvas)           │
│            voice-engineer (VoiceCoach)             │
├────────────────────────────────────────────────────┤
│ vision-engineer                                     │
│   expects: frontend-engineer (VideoCanvas ref)     │
│   outputs: frontend-engineer (skeleton renderer)   │
│            voice-engineer (form events)            │
├────────────────────────────────────────────────────┤
│ [etc.]                                             │
└────────────────────────────────────────────────────┘
```

---

## PHASE 2: Determine Launch Order

Analyze dependencies to create parallel execution groups:

### Dependency Analysis Rules

1. **No dependencies** → Can launch immediately (Group 1)
2. **Depends on Group 1** → Launch after Group 1 sync (Group 2)
3. **Depends on Group 2** → Launch after Group 2 sync (Group 3)
4. **Circular dependencies** → Flag for user resolution

### Launch Group Template

```yaml
launch_groups:
  group_1:
    name: "Foundation"
    agents: [backend-engineer, frontend-engineer, vision-engineer, voice-engineer]
    can_parallel: true
    reason: "All agents work on independent foundation tasks"
    sync_at: "hour-2"

  group_2:
    name: "Core Components"
    agents: [backend-engineer, frontend-engineer, vision-engineer, voice-engineer]
    can_parallel: true
    reason: "Dependencies met by Group 1 deliverables"
    sync_at: "hour-6"

  group_3:
    name: "Integration"
    agents: [frontend-engineer]
    can_parallel: false
    reason: "Integration requires all components ready"
    sync_at: "hour-10"
    dependencies:
      - vision-engineer: skeleton renderer
      - voice-engineer: useVapi hook
```

Present the launch plan to user:

```
## Parallel Agent Dispatch Plan

### Group 1: Foundation (Hours 0-2)
Launch in parallel:
- ✅ backend-engineer - DB schema, env vars
- ✅ frontend-engineer - Project init, folders
- ✅ vision-engineer - MediaPipe test
- ✅ voice-engineer - Vapi account setup

Sync checkpoint: hour-2

### Group 2: Core Components (Hours 2-6)
Launch in parallel (after hour-2 sync):
- ✅ backend-engineer - Auth flow
- ✅ frontend-engineer - VideoCanvas, VoiceCoach
- ✅ vision-engineer - Web Worker, skeleton
- ✅ voice-engineer - useVapi hook, webhook

Sync checkpoint: hour-6

[etc.]

Ready to dispatch? (yes/modify/cancel)
```

WAIT for user confirmation.

---

## PHASE 3: Create Sync Point Infrastructure

Create the handoff directory structure:

```bash
mkdir -p agent-os/specs/[current-spec]/handoffs
```

Create sync point files for each checkpoint:

### Sync Point File: `handoffs/sync-[checkpoint].yaml`

```yaml
# Sync checkpoint: [checkpoint-name]
# Created: [timestamp]

checkpoint: [checkpoint-name]
expected_at: "[time description]"

agents:
  backend-engineer:
    status: pending  # pending | in_progress | complete | blocked
    deliverables:
      - name: "Neon clients"
        file: "src/lib/neon/client.ts"
        status: pending
      - name: "Environment template"
        file: ".env.example"
        status: pending
    blockers: []

  frontend-engineer:
    status: pending
    deliverables:
      - name: "VideoCanvas component"
        file: "src/components/features/video-canvas.tsx"
        status: pending
    blockers: []

  [etc.]

sync_complete: false
sync_completed_at: null
```

Create a dispatch log:

### Dispatch Log: `handoffs/dispatch-log.yaml`

```yaml
# Agent Dispatch Log
# Spec: [spec-name]
# Started: [timestamp]

dispatches:
  - timestamp: [time]
    group: 1
    agents: [backend-engineer, frontend-engineer, vision-engineer, voice-engineer]
    phase: "Foundation"
    status: dispatched

sync_history: []

current_group: 1
current_checkpoint: hour-2
```

---

## PHASE 4: Dispatch Agents

For each agent in the current group, create a dispatch command.

### Dispatch Options

**Option A: Sequential dispatch (simple)**
```
For each agent in [group]:
  1. Launch agent with phase-specific context
  2. Wait for completion
  3. Update dispatch log
  4. Check sync status
```

**Option B: True parallel dispatch (advanced)**
```
Launch all agents simultaneously using subagents:
  - backend-engineer → implementer subagent with backend context
  - frontend-engineer → implementer subagent with frontend context
  - etc.
```

### Agent Dispatch Message

For each agent, provide:

```markdown
## Dispatch: [agent-name]

**Phase:** [phase name]
**Checkpoint:** [sync checkpoint]

### Your Tasks
[Extract relevant tasks from tasks.md for this agent and phase]

### Context Files
- Spec: agent-os/specs/[spec]/spec.md
- Tasks: agent-os/specs/[spec]/engineer-tasks/[agent].md
- Standards: agent-os/standards/[relevant]/*.md

### Sync Requirements
Before checkpoint [X], you must deliver:
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

### Handoff Instructions
When phase complete, create handoff at:
`agent-os/specs/[spec]/handoffs/[agent]-[checkpoint].yaml`

Use `/agent-handoff` to generate the handoff file.
```

### Dispatch Execution

Use the **implementer** subagent for each agent dispatch:

```
Dispatch [agent-name] for [phase]:

Provide to implementer subagent:
- Agent config: agent-os/agents/[agent-name].yaml
- System prompt from agent config
- Phase-specific tasks from tasks.md
- Spec and requirements paths
- Handoff template location
```

### Parallel Dispatch (if supported)

Launch multiple implementer subagents simultaneously:

```
Dispatching Group [N] agents in parallel:

1. backend-engineer → implementer (backend context)
2. frontend-engineer → implementer (frontend context)
3. vision-engineer → implementer (vision context)
4. voice-engineer → implementer (voice context)

Monitoring for completion...
```

---

## Sync Checkpoint Handling

When a group completes, check sync status:

```yaml
# Check sync-[checkpoint].yaml
# All agents in group must have status: complete

if all_agents_complete:
  - Update sync_complete: true
  - Record sync_completed_at
  - Inform user of group completion
  - Ask if ready to dispatch next group
else:
  - Show which agents are still pending
  - Show any blockers
  - Ask user how to proceed
```

### Sync Status Report

```
## Sync Checkpoint: hour-2

| Agent | Status | Deliverables | Blockers |
|-------|--------|--------------|----------|
| backend-engineer | ✅ complete | 3/3 | - |
| frontend-engineer | ✅ complete | 4/4 | - |
| vision-engineer | ⏳ in_progress | 1/2 | - |
| voice-engineer | ✅ complete | 2/2 | - |

Waiting for: vision-engineer (MediaPipe test)

Options:
1. Wait for vision-engineer to complete
2. Proceed with available agents (frontend can continue)
3. Investigate vision-engineer blocker
```

---

## Final Output

After all groups dispatched (or current session complete):

```
## Dispatch Session Complete

### Progress Summary
- Group 1 (Foundation): ✅ Complete
- Group 2 (Core): ⏳ In Progress (3/4 agents)
- Group 3 (Integration): ⏸️ Pending

### Handoffs Created
- agent-os/specs/[spec]/handoffs/backend-engineer-hour-2.yaml
- agent-os/specs/[spec]/handoffs/frontend-engineer-hour-2.yaml
- [etc.]

### Next Steps
👉 Run `/parallel-agent-dispatch` again to continue
👉 Or run `/agent-handoff [agent]` to create manual handoff
👉 Check sync status: agent-os/specs/[spec]/handoffs/sync-hour-6.yaml
```
