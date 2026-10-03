---
description: Bir branch için reviewer + qa-verifier (+ gerekiyorsa rules-reviewer) gate'lerini paralel çalıştırır ve tek düzeltme direktifi üretir; MERGE'E HAZIR ise merge komutlarını verir (örn. /gate feat/f1-02-audit)
argument-hint: <branch>
---

Hedef branch: **$ARGUMENTS**

### 0. Rol kontrolü
`echo "${CLAUDE_ROLE:-$(cat .claude/role 2>/dev/null || echo auditor)}"` → `builder` ise **dur**: "/gate uygulama rolünde çalışmaz. Terminalde `rm .claude/role` çalıştırın, Claude Code'da `/clear` yazıp tekrar deneyin." (yazan ≠ denetleyen)

### 1. Hazırlık
```bash
git fetch origin
B="$ARGUMENTS"; D=".verify/${B//\//_}"
git worktree remove --force "$D" 2>/dev/null; git worktree add --detach "$D" "origin/$B"
git diff --stat origin/main..."origin/$B"
gh run list --branch "$B" --workflow ci.yml --limit 1 2>/dev/null || echo "gh yok — CI sonucu okunamadı"
```
İlgili planı bul (`docs/plans/`, branch adındaki görev kodundan) ve değişiklik notunu oku: `$D/docs/changes/<branch, / → _>.md` (PR yok; uygulamanın iddiaları, AC tablosu ve açık sorular buradadır). Not yoksa reviewer'a "değişiklik notu eksik" bulgusu (Medium) olarak ilet ve commit mesajlarıyla devam et.
CI sonucu okunamıyorsa: demo modunda (Faz M) engel değil, raporda "CI: okunamadı (gh yok)" yaz; F1 ve sonrasında parity zorunlu olduğu için `DOĞRULANAMADI` ve kullanıcıya `brew install gh && gh auth login` öner.
Branch `feat/m09*` ise (Faz M, demo): reviewer ve qa-verifier'a "demo modu" girdisi ver; parity kontrolü yapılmaz.

### 2. rules-reviewer gerekli mi?
`docs/agents/rules-reviewer.md` → "Tetikleyiciler" tablosundaki yol ve anahtar kelimeleri diff'te ara.
Plan "rules-reviewer gerekli" diyorsa da çalıştır.

### 3. Gate'leri paralel çalıştır
Girdi: branch adı, `$D` dizini, plan dosyası yolu.
- `reviewer` — her zaman
- `qa-verifier` — her zaman
- `rules-reviewer` — 2. adım eşleştiyse

### 4. Kaydet
Her yanıtı `docs/reviews/<branch>/<ajan>.md` olarak kaydet (branch adındaki `/` → `_`).
qa-verifier yanıtında "Komut kanıtları" tablosu yoksa ya da PASS satırlarında çıktı alıntısı yoksa kararını `UNVERIFIED` say.

### 5. Özet → `docs/reviews/<branch>/SUMMARY.md`
```markdown
# Gate Özeti — <branch> @ <sha>
| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| CI (app / parity / secrets) | … | | | | |
**Genel karar:** MERGE'E HAZIR | DÜZELTME GEREKLİ | BLOKE | DOĞRULANAMADI

## Düzeltme direktifi
(Tüm bulguları birleştir, tekrarları tek maddeye indir. Sıra: Critical → High → Medium.
Her madde: bulgu ID'leri + dosya + beklenen davranış + eklenecek test.
Son satır: "Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki 'Review düzeltmeleri' tablosunu güncelle ve push et.")
```
Genel karar: herhangi biri BLOCKED → BLOKE; UNVERIFIED veya parity bitmemiş → DOĞRULANAMADI; CHANGES_REQUESTED veya CI kırmızı → DÜZELTME GEREKLİ; hepsi APPROVE + CI yeşil → MERGE'E HAZIR.

### 6. Temizlik ve bildirim
- Medium/Low bulguları `docs/reviews/BACKLOG.md`'ye ekle.
- `git worktree remove --force "$D"` (ekran görüntüleri gerekiyorsa önce `docs/reviews/<branch>/screens/` altına kopyala).
- Kullanıcıya genel kararı ve gate tablosunu göster. Sonra karara göre:
  - **DÜZELTME GEREKLİ / BLOKE:** "Terminalde `echo builder > .claude/role`, Claude Code'da `/clear`, sonra `/fix <branch>`."
  - **MERGE'E HAZIR:** terminalde çalıştırılacak komutları kod bloğunda ver (gate kayıtları `docs/reviews/` altında, commit'lenmemiş olabilir — önce onlar):
    ```bash
    git add docs/reviews && git commit -m "docs(review): gate <branch>" ; git push
    git checkout main && git pull
    git merge --squash <branch>
    git commit -m "<branch'in conventional başlığı, ör. feat(rabbitqa): M-09a step completion>"
    git push
    git branch -D <branch> && git push origin --delete <branch>
    ```
    Ardından `docs/PHASES.md`'de görevi ✅ yapmayı öner.
