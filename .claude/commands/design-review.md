---
name: design-review
description: Run comprehensive UI/UX design review with Playwright
---

# Design Review Command

Run a comprehensive design review on the current UI changes using browser automation.

## Context Gathering

First, gather the necessary context:

```bash
!git status
```

```bash
!git diff --name-only HEAD~1 | grep -E '\.(tsx?|css|scss)$'
```

```bash
!git log --oneline -5
```

## Design Principles Reference

Read the design principles to understand the standards:
- `context/design-principles.md` - Project design system and checklist

## Review Process

### Step 1: Identify What Changed

Based on the git diff, identify:
- Which pages/routes were modified
- Which components changed
- Any new styling or layout changes

### Step 2: Start Dev Server (if not running)

Ensure the development server is running:
```bash
pnpm dev
```

### Step 3: Launch Design Review Agent

Invoke the `@agent-design-review` subagent to conduct the full seven-phase review:

1. **Preparation** - Analyze changes and set up
2. **Interaction Testing** - Verify user flows work
3. **Responsiveness** - Test 1440px, 768px, 375px breakpoints
4. **Visual Polish** - Check design system compliance
5. **Accessibility** - WCAG 2.1 AA verification
6. **Robustness** - Edge cases and error states
7. **Code Health** - Component patterns

### Step 4: Generate Report

The agent will produce a structured report with:
- Screenshots at each breakpoint
- Findings categorized by severity (Blocker, High, Medium, Nitpick)
- Accessibility checklist results
- Prioritized recommendations

## Quick Review (Abbreviated)

For a faster review focusing on critical issues:

1. Navigate to changed pages
2. Take desktop screenshot (1440px)
3. Check for console errors
4. Verify basic interaction works
5. Report blockers only

## Available Tools

The review uses Playwright MCP for:
- `mcp__playwright__browser_navigate` - Navigate to pages
- `mcp__playwright__browser_take_screenshot` - Capture evidence
- `mcp__playwright__browser_resize` - Test breakpoints
- `mcp__playwright__browser_click` - Test interactions
- `mcp__playwright__browser_console_messages` - Check for errors

## Output Location

Save the full review report to:
`agent-os/specs/[current-spec]/verifications/design-review.md`

Or if no active spec, output inline in the conversation.
