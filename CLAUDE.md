# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a full-stack exam platform (PineQuest) deployed entirely on Cloudflare, split into three apps:

- **`backend/`** — Cloudflare Worker API using [Hono](https://hono.dev/) with [Drizzle ORM](https://orm.drizzle.team/) against a D1 (SQLite) database. Routes are modular (18 route files in `src/routes/`). DB schema: `src/db/schema.ts`. DB access helper: `src/db/index.ts` exports `getDb(d1)`. Uses R2 for file storage and Cloudflare Workers AI for exam generation.
- **`frontend/`** — Next.js 16 (React 19) app deployed via [OpenNext for Cloudflare](https://opennext.js.org/cloudflare). Code-based auth (no external provider), shadcn/ui components (`src/components/ui/`), and Tailwind CSS v4. Extensive custom hook architecture in `src/app/student/hooks/` and `src/app/teacher/hooks/`.
- **`educore/`** — Expo React Native mobile app (student-facing). Uses React Context for state, file system persistence, and a comprehensive API client. Currently in early development (Phase 1 planning).

### Key Backend Middleware

- **Authentication** — code-based (no passwords), validates student/teacher codes
- **Role guard** — restricts routes to teacher or student roles
- **CORS** — configured for production frontend domains
- **Error handler** — centralized error handling
- **Logger** — request logging

### Database Schema Overview

16 tables in the D1 SQLite database, organized by domain:

| Domain        | Tables                                                   |
| ------------- | -------------------------------------------------------- |
| Auth          | `teachers`, `students` (code-based, no passwords)        |
| Exams         | `subjects`, `exams`, `questions`, `options`, `materials` |
| Question Bank | `question_bank`, `question_bank_options`                 |
| Sessions      | `exam_sessions`, `student_answers`, `cheat_events`       |
| Gamification  | `xp_transactions`, `saved_exams`                         |
| System        | `notifications`, `ai_exam_generator_runs`                |

All primary keys are nanoid text. Foreign keys cascade on delete. Schema changes require running `npm run db:generate` then applying with `npm run db:migrate`.

### Backend API Routes (18 modules)

`auth`, `exam`, `session`, `cheat`, `student`, `teacher`, `analytics`, `xp`, `saved`, `subjects`, `materials`, `question-bank`, `pdf`, `agent`, `notifications` + helper files.

### Frontend Key Directories

- `src/app/student/` — Student dashboard, exam view, results, leaderboard, progress
- `src/app/teacher/` — Teacher dashboard, exam creation, analytics, schedule
- `src/app/student/hooks/` — 14 hooks (exam state, timer, integrity monitor, proctoring, etc.)
- `src/app/teacher/hooks/` — 20+ hooks (exam management, AI generator, PDF/CSV/DOCX import, etc.)
- `src/lib/` — API client, auth, exam guard, role session, notifications, utils
- `src/components/ui/` — 30 shadcn/radix-ui components + sidebar system

## Commands

Run all commands from within the relevant app directory (`backend/`, `frontend/`, or `educore/`).

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
- Backend route handlers go in `src/routes/` (imported in `src/index.ts`); DB changes go alongside `schema.ts`.
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

## Test Coverage

- **Backend:** 19 test files in `backend/tests/` covering all route modules + grading logic + load tests (Artillery)
- **Frontend:** 29 test files in `frontend/tests/` covering student components (13), teacher components (7), hooks, helpers, and library utils (3)
- **Mobile:** No tests yet (educore/ is in early development)
