# Agent Handoff

Create structured handoff documentation when an agent completes a phase and needs to pass work to other agents. Generates YAML handoff files with deliverables, blockers, and messages for consuming agents.

## When to Use

- When completing a phase/checkpoint as a specialized agent
- When another agent is waiting for your deliverables
- Before sync checkpoints to document what's ready
- When blocked and need to communicate status

## Process Overview

PHASE 1: Identify current agent and checkpoint
PHASE 2: Verify deliverables and gather status
PHASE 3: Generate handoff file
PHASE 4: Update sync checkpoint and notify

Follow each phase IN SEQUENCE:

---

## PHASE 1: Identify Agent and Checkpoint

Determine which agent is creating the handoff:

**If user specifies:** `/agent-handoff backend-engineer hour-2`
- Agent: backend-engineer
- Checkpoint: hour-2

**If not specified:** Ask user:
```
Which agent is creating this handoff?
- backend-engineer
- frontend-engineer
- vision-engineer
- voice-engineer
- [other]

Which checkpoint is this for?
- hour-2 (Foundation)
- hour-6 (Core Components)
- hour-10 (Integration)
- hour-16 (Form Detection)
- hour-20 (Feature Freeze)
- [custom]
```

Load the agent configuration:
```
agent-os/agents/[agent-name].yaml
```

Extract:
- `coordination.outputs_to` - Who receives this agent's work
- `verification.[phase]` - What should be verified
- `context.required` - What files this agent works with

---

## PHASE 2: Verify Deliverables

For each deliverable this agent is responsible for:

### Deliverable Verification

```yaml
deliverable_check:
  - name: "[deliverable name]"
    file: "[file path]"
    checks:
      - exists: [true/false]
      - syntax_valid: [true/false]  # For code files
      - tests_pass: [true/false]    # If tests exist
      - exports_ready: [true/false] # For shared interfaces
    status: [ready/partial/blocked]
    notes: "[any issues or context]"
```

### Verification Commands

Run relevant verification commands from agent config:

```bash
# Example for backend-engineer
npm run build              # Check for TypeScript errors
curl $API_URL/api/test-db  # Verify DB connection
```

### Gather Blockers

If any deliverables are not ready:

```yaml
blockers:
  - deliverable: "[what's blocked]"
    reason: "[why it's blocked]"
    needs_from: "[agent or external]"
    workaround: "[if any]"
```

Present verification summary to user:

```
## Deliverable Verification: [agent-name] @ [checkpoint]

| Deliverable | File | Status | Notes |
|-------------|------|--------|-------|
| Neon client | src/lib/neon/client.ts | ✅ Ready | - |
| Server client | src/lib/neon/server.ts | ✅ Ready | - |
| Auth actions | src/lib/auth/auth-actions.ts | ⚠️ Partial | Missing signOut |
| Middleware | src/middleware.ts | ✅ Ready | - |

Blockers: None

Proceed with handoff generation? (yes/fix issues first)
```

WAIT for user confirmation if there are issues.

---

## PHASE 3: Generate Handoff File

Create handoff file at:
```
agent-os/specs/[current-spec]/handoffs/[agent-name]-[checkpoint].yaml
```

### Handoff File Template

```yaml
# Agent Handoff: [agent-name] → [checkpoint]
# Generated: [ISO timestamp]
# Status: [complete/partial/blocked]

handoff:
  from: [agent-name]
  checkpoint: [checkpoint-name]
  timestamp: "[ISO timestamp]"
  status: [complete/partial/blocked]

# Summary of work completed
summary: |
  [2-3 sentence description of what was accomplished]

# Detailed deliverables
deliverables:
  - name: "[Deliverable 1]"
    file: "[file path]"
    status: ready
    description: |
      [What this deliverable provides]
    usage: |
      [How consuming agents should use this]
    example: |
      ```typescript
      // Example usage
      import { thing } from '@/lib/path'
      ```

  - name: "[Deliverable 2]"
    file: "[file path]"
    status: ready
    description: |
      [Description]

# Messages for specific agents
for_agents:
  frontend-engineer:
    priority: high  # high/medium/low
    message: |
      [Specific message for this agent about what's ready]
    files_to_use:
      - src/lib/neon/client.ts
      - src/lib/neon/server.ts
    interfaces_available:
      - name: createClient
        from: "@/lib/neon/client"
        description: Browser-side Neon client
    warnings:
      - "[Any gotchas or things to watch out for]"

  vision-engineer:
    priority: low
    message: |
      [Message for this agent]
    files_to_use: []

# Current blockers (if any)
blockers:
  - issue: "[What's blocked]"
    severity: [critical/moderate/minor]
    needs: "[What's needed to unblock]"
    from: "[agent or external dependency]"
    workaround: "[If any temporary solution exists]"

# Work remaining (if partial handoff)
remaining:
  - task: "[What still needs to be done]"
    estimate: "[rough time estimate]"
    blocked_by: "[if blocked]"

# Notes for next phase
notes: |
  [Any important context, decisions made, or things to be aware of]

# Verification results
verification:
  commands_run:
    - command: "npm run build"
      result: "success"
      output: "Compiled successfully"
    - command: "curl $API/api/test-db"
      result: "success"
      output: '{"success":true}'

  tests:
    passed: 12
    failed: 0
    skipped: 2

# Files modified in this phase
files_changed:
  created:
    - src/lib/neon/client.ts
    - src/lib/neon/server.ts
  modified:
    - .env.example
  deleted: []
```

---

## PHASE 4: Update Sync and Notify

### Update Sync Checkpoint File

Read and update:
```
agent-os/specs/[current-spec]/handoffs/sync-[checkpoint].yaml
```

```yaml
# Update agent status
agents:
  [agent-name]:
    status: complete  # Update from pending/in_progress
    deliverables:
      - name: "[deliverable]"
        status: ready  # Update each deliverable
    blockers: []  # Clear or add blockers
    handoff_file: "[path to handoff file]"
```

### Check Sync Completion

```python
# Pseudo-logic
all_complete = all(agent.status == 'complete' for agent in checkpoint.agents)

if all_complete:
    checkpoint.sync_complete = True
    checkpoint.sync_completed_at = now()
```

### Generate Notification

Output to user:

```
## Handoff Complete: [agent-name] @ [checkpoint]

✅ Handoff file created:
   `agent-os/specs/[spec]/handoffs/[agent]-[checkpoint].yaml`

### Deliverables Ready
- [Deliverable 1] → frontend-engineer, voice-engineer
- [Deliverable 2] → frontend-engineer

### Messages Sent
- **frontend-engineer** (high priority): Neon clients ready
- **vision-engineer** (low priority): No direct dependencies

### Sync Status: [checkpoint]
| Agent | Status |
|-------|--------|
| backend-engineer | ✅ Complete |
| frontend-engineer | ⏳ In Progress |
| vision-engineer | ⏳ In Progress |
| voice-engineer | ✅ Complete |

[2/4 agents complete - waiting for frontend-engineer, vision-engineer]
```

If sync is complete:

```
## 🎉 Checkpoint [checkpoint] Complete!

All agents have completed their deliverables.

Ready to dispatch next phase?
👉 Run `/parallel-agent-dispatch` to continue
```

---

## Quick Handoff (Shortcut)

For simple handoffs without full verification:

```
/agent-handoff --quick [agent-name] [checkpoint]
```

Generates minimal handoff:

```yaml
handoff:
  from: [agent-name]
  checkpoint: [checkpoint]
  timestamp: "[now]"
  status: complete

summary: "Phase complete. See tasks.md for details."

deliverables:
  - name: "All phase deliverables"
    status: ready

for_agents:
  all:
    message: "[agent-name] has completed [checkpoint]. Check tasks.md for completed items."

blockers: []
```

---

## Handoff Templates by Agent Type

### Backend Engineer Handoff
Key deliverables: DB schema, auth, API routes, env vars

### Frontend Engineer Handoff
Key deliverables: Components, hooks, stores, types

### Vision Engineer Handoff
Key deliverables: Detector classes, worker, event interfaces

### Voice Engineer Handoff
Key deliverables: useVapi hook, webhook handler, prompts

---

## Reading Handoffs (For Consuming Agents)

When starting work, check for handoffs:

```bash
ls agent-os/specs/[spec]/handoffs/*-[checkpoint].yaml
```

Load relevant handoffs and extract:
- `for_agents.[your-agent].message` - What you need to know
- `for_agents.[your-agent].files_to_use` - Files to import/reference
- `for_agents.[your-agent].interfaces_available` - APIs you can use
- `blockers` - Anything that might affect you
