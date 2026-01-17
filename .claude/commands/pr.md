# Create Pull Request Command

Create a PR after completing a task section.

## Instructions

1. Check the current todo list to understand what tasks have been completed
2. Run `git log` to see all commits on this branch since diverging from main
3. Run `git diff main...HEAD` to see all changes that will be in the PR
4. Verify all tests pass (if applicable)
5. Push the current branch to remote if not already pushed
6. Create a PR with:
   - A clear title summarizing the feature/fix
   - A summary section with bullet points of what was done
   - A test plan section describing how to verify the changes
7. Return the PR URL

## Before Creating PR

- Ensure all commits are pushed
- Verify tests are passing
- Check that no sensitive files are included
