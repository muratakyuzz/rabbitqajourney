# CLAUDE.md

Bu repodaki tüm kurallar `AGENTS.md` dosyasındadır — önce onu oku. (@AGENTS.md)

Claude Code bu projede **denetçi** rolündedir: plan üretir, veri modelini tasarlar, inceler, doğrular. Uygulama kodunu Codex yazar.
`.claude/hooks/guard.mjs` uygulama kodu, migration'lar, paket/altyapı dosyaları, git geçmişi ve uzak veritabanı erişimini engeller (bilinçli istisna: `CLAUDE_ALLOW_APP_WRITES=1 claude`).

| Ajan | Yetki | Ne zaman |
|---|---|---|
| `planner` | Read/Grep/Glob | Her görev öncesi (`/plan`), F1-00 veri modeli, faz kapanışı |
| `reviewer` | salt okunur + okuma amaçlı Bash | Her PR (`/gate`) |
| `qa-verifier` | Bash ile test + Playwright MCP, yazamaz | Her PR (`/gate`), faz sonu regresyon |
| `rules-reviewer` | salt okunur + okuma amaçlı Bash | Kural/audit/iş günü/erişim bilgisi/rapor/transaction değişince |

Komutlar: `/plan <görev>`, `/gate <branch>`, `/phase-close <faz>` (Faz M dahil)
Referanslar: `docs/AUDIT.md`, `docs/API_CONTRACT.md`, `docs/INVARIANTS.md`, `docs/RBAC.md`, `docs/DATA_MODEL.md`, `docs/TEST_STRATEGY.md`, `docs/WORKFLOW.md`, `docs/PHASES.md`, `docs/adr/` (0001 stack, 0002 pg-mem, 0003 AI/entegrasyon)

Ana oturum yalnızca `docs/plans/`, `docs/reviews/`, `docs/adr/`, `docs/DATA_MODEL.md`, `docs/AUDIT.md` ve `docs/PHASES.md` dosyalarını yazar.
