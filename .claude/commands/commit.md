# Git Commit Command

Create a commit for the current work based on the active task context.

## Instructions

1. Check the current todo list to understand what task is in progress or was just completed
2. Run `git status` to see what files have changed
3. Run `git diff --staged` and `git diff` to understand the changes
4. Stage all relevant files (exclude any sensitive files like .env, credentials, etc.)
5. Generate a clear, descriptive commit message that:
   - Starts with a verb (Add, Fix, Update, Refactor, Implement, etc.)
   - References the task being worked on
   - Summarizes the "why" not just the "what"
   - Is concise (1-2 sentences max)
6. Create the commit with the generated message
7. Show the commit result to confirm success

## Format

The commit message should follow this pattern:
```
<type>: <brief description>

<optional body with more context if needed>
```

Types: feat, fix, refactor, docs, test, chore, style
