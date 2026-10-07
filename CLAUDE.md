# CLAUDE.md

Bu repodaki tüm kurallar `AGENTS.md` dosyasındadır — önce onu oku. (@AGENTS.md)

Claude Code bu projede **iki rolle** çalışır. Rol `.claude/role` dosyasından (git'e girmez) veya `CLAUDE_ROLE` ortam değişkeninden okunur; rolü yalnızca Murat terminalden değiştirir. Rol değişince Claude Code'da **yeni sohbet** (`/clear`) açılır.

| Rol | Terminalde | Ne yapar | Komutlar |
|---|---|---|---|
| **Denetim** (varsayılan) | `rm .claude/role` | Plan üretir, veri modelini tasarlar, inceler, doğrular. Uygulama koduna, paket dosyalarına, git geçmişine yazamaz. | `/plan`, `/gate`, `/phase-close` |
| **Uygulama** | `echo builder > .claude/role` | Onaylı planı uygular, test yazar, değişiklik notu yazar, branch'e commit/push eder, gate bulgularını düzeltir. PR açılmaz. `main`'e push, force push, merge ve uzak DB yasak; `docs/reviews/` ve `docs/plans/` salt okunur. | `/build`, `/fix` |

`.claude/hooks/guard.mjs` bu sınırları zorlar. `/gate` her zaman denetim rolünde ve **yeni bir sohbette** çalıştırılır (yazan ≠ denetleyen).

| Ajan | Yetki | Ne zaman |
|---|---|---|
| `planner` | Read/Grep/Glob | Her görev öncesi (`/plan`), F1-00 veri modeli, faz kapanışı |
| `reviewer` | salt okunur + okuma amaçlı Bash | Her branch (`/gate`) |
| `qa-verifier` | Bash ile test + Playwright MCP, yazamaz | Her branch (`/gate`), faz sonu regresyon |
| `rules-reviewer` | salt okunur + okuma amaçlı Bash | Kural/audit/iş günü/erişim bilgisi/rapor/transaction değişince |

Komutlar — denetim: `/plan <görev>`, `/gate <branch>`, `/phase-close <faz>` (Faz M dahil) · uygulama: `/build <plan>`, `/fix <branch>`
Referanslar: `docs/AUDIT.md`, `docs/API_CONTRACT.md`, `docs/INVARIANTS.md`, `docs/RBAC.md`, `docs/DATA_MODEL.md`, `docs/TEST_STRATEGY.md`, `docs/WORKFLOW.md`, `docs/PHASES.md`, `docs/adr/` (0001 stack, 0002 pg-mem, 0003 AI/entegrasyon)

Yazma yetkileri (REV-F022). "guard" satırlarını `.claude/hooks/guard.mjs` zorlar; "kural" satırları rol talimatıdır, gate denetler.

| Dosya / klasör | Denetim | Uygulama | Zorlayan |
|---|---|---|---|
| `docs/plans/`, `docs/reviews/`, `docs/adr/` | ✔ | — | guard |
| `docs/INVARIANTS.md`, `docs/RBAC.md`, `docs/PRODUCT_SPEC.md` | ✔ (Murat onayıyla) | — | guard |
| `AGENTS.md`, `CLAUDE.md`, `docs/agents/`, `.claude/` (`.claude/role` hariç) | ✔ (yalnızca Murat'ın istediği kit değişikliği) | — | guard |
| `docs/DATA_MODEL.md`, `docs/AUDIT.md`, `docs/PHASES.md` | ✔ | yalnızca plan gerektiriyorsa | kural |
| `docs/API_CONTRACT.md`, `docs/changes/` | — (sözleşmeyi uygulama rolü yazar, gate denetler) | ✔ | kural |
| `docs/TEST_STRATEGY.md`, `docs/WORKFLOW.md` | ✔ | yalnızca plan gerektiriyorsa | kural |
| Uygulama kodu, paket/konfig dosyaları | — | ✔ | guard |
| `.env` / `.env.example` | — / — | — / ✔ | guard |
| `.github/workflows/`, `.claude/role` | — (Murat) | — (Murat) | guard |
