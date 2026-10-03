# AGENTS.md

- App is the RabbitQA Onboarding Tracker (Turkish UI), demo-only: no database. Why: user wants mock data login, not real DB writes.
- All data lives in `src/lib/rabbitqa/` (types, seed, localStorage store via `RqProvider`/`useRq`); every mutation goes through the store so it writes audit entries. Why: single place for history/audit rules.
- Demo auth in `src/lib/auth-api.ts` uses seeded RabbitQA users (any password); roles csm/devops/care/manager/admin, permissions in `src/lib/rabbitqa/perm.ts`.
- Keep `AppShell` and semantic theme tokens in `src/index.css`/`tailwind.config.ts`.
- Faz 3 (tamam): Uyarılar, destek kayıtları, riskler/kararlar ve Go-Live sekmeleri `src/pages/project/Phase3Tabs.tsx`; otomatik kurallar store'da (sağlık kırmızı → kritik uyarı, yüksek öncelikli ticket → uyarı, Go/No-Go toplantısı → adım, açık taahhüt kalmayınca commit_check adımı, müşteri onayı → Go-Live aşaması kapanır). Depo sürümü v3 (`rabbitqa-demo-state-v3`).
- Faz 4 (tamam): müşteri haftalık raporu `/app/projects/:id/report`, yönetim raporu `/app/reports` (manager/admin), sistem ayarları `/app/admin` (admin); PDF = tarayıcı yazdırma (`print:` sınıfları). Şablon/modül/sorular state'te, `setConfig` ile değişir ve `projectId: "system"` audit yazar. Depo v4 (`rabbitqa-demo-state-v4`). Why: admin değişiklikleri yalnızca yeni projeleri etkiler.
