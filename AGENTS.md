# Repository Guidelines

## Project Structure & Module Organization
This repository is split into two deployable apps:

- `backend/`: Cloudflare Worker API built with Hono and Drizzle. Main entrypoint is `backend/src/index.ts`; database schema and migrations live in `backend/src/db/` and `backend/migrations/`.
- `frontend/`: Next.js app deployed with OpenNext to Cloudflare. App routes are in `frontend/src/app/`; shared UI lives in `frontend/src/components/`; helpers live in `frontend/src/lib/` and `frontend/src/hooks/`.
- Tests live in `backend/tests/` and `frontend/tests/`. CI is defined in `.github/workflows/`.

## Build, Test, and Development Commands
Run commands from the relevant app directory.

- `npm install`: install dependencies.
- `npm run dev`: start local development (`wrangler dev` in `backend/`, `next dev` in `frontend/`).
- `npm run test`: run Jest once with `--runInBand`.
- `npm run deploy`: deploy the app to Cloudflare.
- `npm run cf-typegen`: regenerate Cloudflare binding types after config changes.
- `npm run db:generate`: generate Drizzle migrations in `backend/`.
- `npm run db:migrate`: apply backend D1 migrations locally.
- `npm run db:migrate:prod`: apply backend D1 migrations remotely.

## Coding Style & Naming Conventions
Use TypeScript throughout. Follow existing formatting in each package: `frontend/` currently uses tabs in `package.json`, while `backend/` uses two-space indentation. Match the surrounding file instead of reformatting unrelated code.

Use `PascalCase` for React components, `camelCase` for variables/functions, and `kebab-case` for migration filenames. Keep modules small and place backend database changes beside `schema.ts`.

## Testing Guidelines
Jest is configured in both apps (`backend/jest.config.cjs`, `frontend/jest.config.mjs`). Add or update tests when changing routes, schema behavior, or UI logic.

Name backend tests `*.test.ts`. Frontend tests may live under `frontend/tests/app/` and should mirror the feature or route being tested. Run `npm run test` in both packages before opening a PR.

## Commit & Pull Request Guidelines
Recent history uses short conventional subjects such as `feat: ...` alongside merge commits. Prefer concise, imperative commit messages like `feat: expand exam schema` or `fix: handle empty subject list`.

PRs should include:

- a short description of the user-visible or API-facing change
- linked issue or task number when available
- screenshots for frontend UI changes
- note of any migration, environment, or Cloudflare config change

Keep lockfile updates scoped to the package you changed.
