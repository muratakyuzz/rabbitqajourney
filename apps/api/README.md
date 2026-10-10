# @rabbitqa/api

Express 5 API, `/api` prefix. Faz 1: pg-mem in memory; `src/db/schema.sql` and the shared seed are loaded on every boot, so a restart resets all data (docs/PLAN.md).

- `npm run dev -w @rabbitqa/api` — watch mode on 127.0.0.1:3001 (`API_HOST`, `API_PORT` override; no login in Faz 1, so keep it on loopback)
- `npm test -w @rabbitqa/api` — Vitest + supertest
