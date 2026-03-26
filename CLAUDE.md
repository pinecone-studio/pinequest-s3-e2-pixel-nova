# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a full-stack exam platform (PineQuest) deployed entirely on Cloudflare, split into two independent apps:

- **`backend/`** — Cloudflare Worker API using [Hono](https://hono.dev/) with [Drizzle ORM](https://orm.drizzle.team/) against a D1 (SQLite) database. Entry point: `src/index.ts`. DB schema: `src/db/schema.ts`. DB access helper: `src/db/index.ts` exports `getDb(d1)`.
- **`frontend/`** — Next.js 16 app deployed via [OpenNext for Cloudflare](https://opennext.js.org/cloudflare). Code-based auth (no external provider), shadcn/ui components (`src/components/ui/`), and Tailwind CSS v4.

### Database Schema Overview

14 tables in the D1 SQLite database, organized by domain:

| Domain        | Tables                                                   |
| ------------- | -------------------------------------------------------- |
| Auth          | `teachers`, `students` (code-based, no passwords)        |
| Exams         | `subjects`, `exams`, `questions`, `options`, `materials` |
| Question Bank | `question_bank`, `question_bank_options`                 |
| Sessions      | `exam_sessions`, `student_answers`, `cheat_events`       |
| Gamification  | `xp_transactions`, `saved_exams`                         |

All primary keys are nanoid text. Foreign keys cascade on delete. Schema changes require running `npm run db:generate` then applying with `npm run db:migrate`.

## Commands

Run all commands from within the relevant app directory (`backend/` or `frontend/`).

```bash
# Install
npm install

# Dev
npm run dev          # wrangler dev (backend) / next dev (frontend)

# Test
npm run test         # run all tests with --runInBand
npx jest tests/path/to/specific.test.ts  # run a single test file

# Lint (frontend only)
npm run lint

# Build (frontend only)
npm run build

# Deploy
npm run deploy

# Database (backend only)
npm run db:generate       # generate Drizzle migrations from schema changes
npm run db:migrate        # apply migrations locally (D1 local)
npm run db:migrate:prod   # apply migrations remotely

# Regenerate Cloudflare binding types after wrangler.jsonc changes
npm run cf-typegen
```

## Conventions

- TypeScript strict mode throughout. Match surrounding file indentation (frontend uses tabs, backend uses 2 spaces).
- `PascalCase` for React components, `camelCase` for variables/functions, `kebab-case` for migration filenames.
- Backend route handlers go in `src/index.ts` (or new route files imported there); DB changes go alongside `schema.ts`.
- Frontend path alias `@/` maps to `src/`.
- Tests live in `backend/tests/` and `frontend/tests/` — file pattern `*.test.ts` / `*.test.tsx`.
- Keep lockfile updates scoped to the package being changed.
- PRs touching DB schema or Cloudflare config must note the migration/config change.

## Memory

At the **start of every session**, read all files in `C:/Users/user/.claude/projects/D--zozo-pinequest-s3-e2-pixel-nova/memory/`:

- `user.md` — who the user is
- `language.md` — language preferences
- `people.md` — team members and stakeholders
- `decisions.md` — key architectural and product decisions
- `preferences.md` — working style and feedback

At the **end of every session** (or when you learn something new), update the relevant memory files to reflect new information about the user, team, decisions made, or preferences expressed during the session.

## Git Naming Conventions

- **Issue titles**: Short and descriptive (e.g., "Add unit tests and load tests for API")
- **Branch names**: `feat/short-description`, `fix/short-description`, `test/short-description`
- **Commit messages**: Conventional commits with concise description — `feat:`, `fix:`, `test:`, `chore:`, `refactor:`, `docs:`
- **PR titles**: Conventional commit style, under 70 characters
- **PR labels**: Use specific labels — `testing`, `backend`, `frontend`, `performance`, `database`, `cheat-detection`, `gamification`, `analytics`
