---
description: Faz kapanış denetimi — qa-verifier tam regresyon + reviewer tam tarama + planner GO/NO-GO (örn. /phase-close F1)
argument-hint: <faz>
---

Faz: **$ARGUMENTS**

> `$ARGUMENTS` = `M` ise (mockup dondurma, M-06): qa-verifier'ı "M-06" moduyla çalıştır (görsel referans + kapsama son kontrolü), reviewer'ı demo modunda tüm kod tabanına çalıştır; planner GO verirse kullanıcıya `git tag mockup-freeze && git push --tags` komutunu ver ve `docs/PHASES.md`'de Faz M'yi ✅ yap. Aşağıdaki parity adımları bu modda atlanır.

1. `git fetch && git worktree add --detach .verify/main origin/main`
2. `gh run list --branch main --workflow ci.yml --limit 1` → `main` üzerindeki son parity sonucunu not et.
3. Paralel çalıştır (dizin `.verify/main`):
   - `qa-verifier` → "$ARGUMENTS regresyon"
   - `reviewer` → **tüm kod tabanı** (yalnızca diff değil): INVARIANTS, RBAC matrisi, DATA_MODEL uyumu
   - Fazda rules-reviewer tetikleyen görev varsa `rules-reviewer` → tam tarama
4. Çıktıları `docs/reviews/$ARGUMENTS-qa-regression.md`, `docs/reviews/$ARGUMENTS-full-review.md` (ve `-rules.md`) olarak kaydet.
5. `planner`'ı "$ARGUMENTS kapanış" ile çalıştır; yukarıdaki çıktıları, parity sonucunu ve `docs/reviews/BACKLOG.md`'yi ver. Sonucu `docs/reviews/$ARGUMENTS-closure.md` olarak kaydet.
6. `docs/PHASES.md`'de fazın durumunu güncelle (✅ GO / ⚠️ NO-GO) ve kapanış raporunun yolunu ekle.
7. `git worktree remove --force .verify/main`
8. Kullanıcıya GO / NO-GO, açık bulgular ve sonraki fazın ilk görev kodunu söyle.
