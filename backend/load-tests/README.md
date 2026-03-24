# Backend Load Tests

This directory contains Artillery scenarios for the Cloudflare Worker API.

## Scenarios

- `smoke.yml`: lightweight health-check traffic for CI and quick local verification.
- `student-flow.yml`: manual load scenario for the student exam path.
- `teacher-reads.yml`: manual load scenario for teacher dashboards and analytics reads.

## Local smoke run

Start the worker locally in one terminal:

```bash
npx wrangler dev --port 8787 --ip 127.0.0.1
```

Run the smoke profile in another terminal:

```bash
npm run test:load:smoke:local
```

## Manual full runs

Seed a teacher, student, and exam state first. The student flow requires an active exam with a room code and at least one question with one option.

Set these environment variables before running the full scenarios:

```bash
LOAD_STUDENT_ID=student-1
LOAD_TEACHER_ID=teacher-1
LOAD_ROOM_CODE=ROOM01
LOAD_EXAM_ID=exam-1
```

Run the local or staging profiles:

```bash
npm run test:load:student:local
npm run test:load:teacher:local
npm run test:load:student:staging
npm run test:load:teacher:staging
```

For staging runs, also set:

```bash
STAGING_API_BASE_URL=https://your-staging-worker.example.workers.dev
```

## CI smoke scope

The PR workflow uses `smoke.yml` only. That keeps CI deterministic and avoids requiring seeded D1 data for the heavier student and teacher scenarios.
