---
name: sync-issues
description: Create GitHub Issues from spec tasks and organize with labels
---

# Sync Tasks to GitHub Issues

Create GitHub Issues from your spec tasks for team collaboration.

## Prerequisites

Ensure your GitHub token is configured in `.mcp.json`:
```json
"GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
```

## Usage

### 1. Identify the spec to sync

Look for task files in `agent-os/specs/*/tasks.md` or similar task lists.

### 2. Parse tasks and create issues

For each task:
1. Create a GitHub Issue with:
   - **Title**: Task name
   - **Body**: Task description, acceptance criteria, related files
   - **Labels**: Based on category (frontend, backend, vision, voice-ai, database)
   - **Milestone**: Sprint or phase name (if applicable)

### 3. Label scheme

Suggested labels to create:
- `tier-1` / `tier-2` - Exercise tiers
- `frontend` / `backend` / `database` / `vision` / `voice-ai` - Component
- `bug` / `feature` / `enhancement` / `docs`
- `priority:high` / `priority:medium` / `priority:low`
- `good-first-issue` - For onboarding

### Example workflow

```
# Read tasks from a spec
Read agent-os/specs/[spec-name]/tasks.md

# Create issues using GitHub MCP
mcp__github__create_issue({
  owner: "your-username",
  repo: "rehabify",
  title: "Implement Cat-Camel pose detection",
  body: "## Description\nImplement MediaPipe-based form detection for Cat-Camel exercise.\n\n## Acceptance Criteria\n- [ ] Detect cat phase (spine curved up)\n- [ ] Detect camel phase (spine curved down)\n- [ ] Track rep count\n- [ ] Calculate form score",
  labels: ["tier-1", "vision", "feature"]
})
```

### Bulk creation

To create multiple issues at once, parse the tasks.md file and loop through creating issues. Claude can do this automatically when asked.

## Tips

- Group related issues using GitHub Projects
- Use milestones for sprint planning
- Link issues to PRs with "Fixes #123" in commit messages
- Use issue templates for consistency
