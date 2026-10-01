# AGENTS.md

- App is the RabbitQA Onboarding Tracker (Turkish UI), demo-only: no database. Why: user wants mock data login, not real DB writes.
- All data lives in `src/lib/rabbitqa/` (types, seed, localStorage store via `RqProvider`/`useRq`); every mutation goes through the store so it writes audit entries. Why: single place for history/audit rules.
- Demo auth in `src/lib/auth-api.ts` uses seeded RabbitQA users (any password); roles csm/devops/care/manager/admin, permissions in `src/lib/rabbitqa/perm.ts`.
- Keep `AppShell` and semantic theme tokens in `src/index.css`/`tailwind.config.ts`.
