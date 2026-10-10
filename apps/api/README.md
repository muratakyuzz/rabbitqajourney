# @rabbitqa/api

Express 5 API, `/api` prefix. Faz 1: pg-mem in memory; `src/db/schema.sql` and the shared seed are loaded on every boot, so a restart resets all data (docs/PLAN.md).

- `npm run dev -w @rabbitqa/api` — watch mode on port 3001 (`API_PORT` overrides)
- `npm test -w @rabbitqa/api` — Vitest + supertest
