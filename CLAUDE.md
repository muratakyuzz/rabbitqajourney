# CLAUDE.md

Bu repodaki kurallar `AGENTS.md` dosyasındadır — önce onu oku. (@AGENTS.md)
Güncel plan ve çalışma kuralları: `docs/PLAN.md`.

- Tek geliştirici, doğrudan `main`. Branch, rol, plan dosyası, gate yok.
- Commit'ten önce `npm run check` (lint + typecheck + test) yeşil.
- `/build [mN]`: `docs/PLAN.md`'deki sıradaki maddeyi uygular.
- `.claude/hooks/guard.mjs` yalnızca gizli dosyaları korur (`.env`, `.env.*` — `.env.example` hariç — ve anahtar/sertifika dosyaları). Bunlara dokunmak gerekirse kullanıcıya bırak.
- `.github/workflows/` değişikliklerini Murat elle yapar; gerekiyorsa değişikliği öner.
