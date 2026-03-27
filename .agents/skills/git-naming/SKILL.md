---
name: git-naming
description: "Generate git naming guide (issue, branch, commits, PR title, labels, description). Use when user asks for git naming, commit messages, PR prep, branch names, or says 'git stuff' / 'PR labels'. Trigger on /git-naming."
---

# Git Naming Guide

Run `git diff --stat` and `git status --short` to see what changed, then output this:

```
## Git Naming Guide

### Issue Title
<under 50 chars>

### Branch Name
<feat|fix|test|chore>/<kebab-case>

### Commit Messages
<type>: <message>

### PR Title
<type>: <under 70 chars>

### PR Labels
<label>, <label>

### PR Description
## Summary
- <what changed>

## Test Plan
- [ ] <how to verify>
```

Keep it short. No explanations. No "why not" lists. Just the guide.

## Labels — pick only what applies

| Label | Use when |
|-------|----------|
| `testing` | tests added/changed |
| `backend` | backend code |
| `frontend` | frontend code |
| `performance` | load tests, optimization |
| `database` | schema, migrations |
| `cheat-detection` | anti-cheat code |
| `gamification` | XP, levels, leaderboard |
| `analytics` | dashboard, stats |
| `auth` | login, auth code |
| `bug` | fixing bugs |
| `documentation` | docs only |

2-4 labels typical. Don't guess — only add if files clearly touch that domain.

## Commit rules

- Conventional: `feat:`, `fix:`, `test:`, `chore:`
- One logical chunk per commit
- Under 72 chars
