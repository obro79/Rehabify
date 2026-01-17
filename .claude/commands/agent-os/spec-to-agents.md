# Spec to Agents Generator

Automatically generate specialized agent configurations from a spec document. This skill analyzes a specification and creates YAML agent configs for each identified engineering role.

## When to Use

- After running `/write-spec` when you have a complete spec.md
- When starting a multi-engineer project that needs parallel work streams
- When you want to delegate implementation to specialized agents

## Process Overview

PHASE 1: Read and analyze the spec
PHASE 2: Identify engineering roles and responsibilities
PHASE 3: Generate agent YAML configurations
PHASE 4: Create agent orchestration guide

Follow each phase IN SEQUENCE:

---

## PHASE 1: Read and Analyze Spec

First, locate and read the spec document. Check if user provided a path, otherwise search:

```
agent-os/specs/[latest-spec]/spec.md
```

Read and extract:
1. **Tech stack** - What technologies are being used?
2. **Team structure** - Are roles explicitly defined? (e.g., "Vision Engineer", "Backend Engineer")
3. **Deliverables** - What files/components does each role produce?
4. **Dependencies** - What does each role need from others?
5. **Timeline** - Are there phases or milestones?

If no explicit roles defined, infer from tech stack:
- Database/Auth/API → backend-engineer
- UI/Components/Styling → frontend-engineer
- ML/Vision/Detection → vision-engineer (if applicable)
- Voice/AI/Prompts → voice-engineer (if applicable)
- Mobile/Native → mobile-engineer (if applicable)

---

## PHASE 2: Identify Roles and Responsibilities

For each identified role, determine:

### Role Analysis Template
```yaml
role: [role-name]
focus: [primary responsibility]
tech_stack: [technologies this role uses]
deliverables:
  - [file/component 1]
  - [file/component 2]
outputs_to:  # What this role provides to others
  - agent: [other-role]
    data: [what they provide]
expects_from:  # What this role needs from others
  - agent: [other-role]
    data: [what they need]
mcp_needs:  # What MCP servers would help
  - [server-name]: [why needed]
```

Present the identified roles to the user:

```
I've identified the following engineering roles from the spec:

1. **[role-1]** - [brief description]
   - Tech: [technologies]
   - Delivers: [key deliverables]

2. **[role-2]** - [brief description]
   - Tech: [technologies]
   - Delivers: [key deliverables]

[etc.]

Should I generate agent configurations for these roles?
Or would you like to add/remove/modify any roles?
```

WAIT for user confirmation before proceeding.

---

## PHASE 3: Generate Agent YAML Configurations

For each confirmed role, generate a YAML config file at:
```
agent-os/agents/[role-name].yaml
```

Use this template structure:

```yaml
# [Role Name] Agent Configuration
# Handles: [brief description]

agent:
  name: [role-name]
  role: [Human Readable Role]
  description: |
    [2-3 sentence description of specialization]

system_prompt: |
  # [Role Name] - [Project Name]

  You are a [role] working on [project context]. Your focus is:
  - [responsibility 1]
  - [responsibility 2]
  - [responsibility 3]

  ## Tech Stack
  [List technologies]

  ## Your Responsibilities
  1. [Responsibility with details]
  2. [Responsibility with details]
  3. [etc.]

  ## Key Principles
  - [Principle 1]
  - [Principle 2]
  - [etc.]

  ## Coordination Points
  - [Checkpoint 1]: [What should be ready]
  - [Checkpoint 2]: [What should be ready]

  ## Quality Checklist
  Before marking any task complete:
  - [ ] [Check 1]
  - [ ] [Check 2]
  - [ ] [etc.]

mcp_servers:
  - name: [server-name]
    purpose: |
      [Why this agent needs this server]
    config:
      allowed_paths:
        - "[relevant paths]"
    capabilities:
      - [capability 1]
      - [capability 2]

context:
  required:
    - path: [spec path]
      description: [why needed]
    - path: [task sheet path]
      description: [why needed]
  optional:
    - path: [other useful path]
      description: [why useful]

constraints:
  - description: [Constraint 1]
  - description: [Constraint 2]

coordination:
  outputs_to:
    - agent: [other-agent]
      data: |
        [What this agent provides]
  expects_from:
    - agent: [other-agent]
      data: |
        [What this agent needs]

verification:
  phase_1:
    - command: "[verification command]"
      expect: "[expected result]"
```

### MCP Server Selection Guide

Choose appropriate MCP servers based on role:

| Role Type | Recommended MCP Servers |
|-----------|------------------------|
| Backend/Database | neon, postgres, filesystem, terminal, git |
| Frontend/UI | filesystem, playwright, terminal, git |
| Vision/ML | filesystem, playwright (camera), terminal, git |
| Voice/AI | filesystem, vapi/openai, terminal, git |
| Mobile | filesystem, terminal, git, simulator |
| DevOps | filesystem, terminal, git, docker, cloud-provider |

---

## PHASE 4: Create Orchestration Guide

After generating all agent configs, create/update the orchestration guide at:
```
agent-os/agents/orchestration.md
```

Include:
1. **Agent summary table** - All agents and their focus
2. **Dependency graph** - Visual representation of agent dependencies
3. **Sync points** - When agents need to coordinate
4. **Launch order** - Which agents can run in parallel vs sequential
5. **Handoff protocol** - How agents pass work to each other

---

## Final Output

After all phases complete, inform the user:

```
Agent configurations generated!

✅ Created agent configs:
   - agent-os/agents/[role-1].yaml
   - agent-os/agents/[role-2].yaml
   - [etc.]

✅ Updated orchestration guide:
   - agent-os/agents/orchestration.md

## Summary

| Agent | Focus | MCP Servers |
|-------|-------|-------------|
| [role-1] | [focus] | [servers] |
| [role-2] | [focus] | [servers] |

NEXT STEPS:
👉 Run `/parallel-agent-dispatch` to launch agents
👉 Or manually launch: `claude-code --agent [role-name]`
```
