---
description: UYGULAMA oturumunda /gate düzeltme direktifini uygular ve push eder (örn. /fix feat/m09a-step-completion)
argument-hint: <branch>
---

Branch: **$ARGUMENTS**

### 0. Rol kontrolü
`echo "${CLAUDE_ROLE:-auditor}"` → `builder` değilse dur; kullanıcıya `CLAUDE_ROLE=builder claude` ile yeni sekme açmasını söyle.

### 1. Direktifi bul
`docs/reviews/<branch adı, / → _>/SUMMARY.md` → "Düzeltme direktifi" bölümü; ayrıntı için aynı klasördeki `reviewer.md`, `qa-verifier.md`, `rules-reviewer.md`. Dosya yoksa dur: "Önce denetim sekmesinde `/gate $ARGUMENTS` çalıştırın."

### 2. Uygula
`git checkout $ARGUMENTS && git pull`.
- Critical ve High zorunlu; Medium'ları da yap; Low'ları yalnızca küçükse.
- Her bulguyu ayrı commit'te düzelt, mesajına bulgu ID'si: `fix: ... [REV-01]`.
- "MISSING" kabul kriterleri için test yaz. Parity kırmızıysa CI logunu oku (`gh run view --log-failed`) ve düzelt; pg-mem'e özel çözüm yazma.
- Katılmadığın bulguyu düzeltme; gerekçeyi PR yorumu olarak yaz (`gh pr comment`).
- Review dosyalarını değiştirme.

### 3. Doğrula ve push
Lint / tsc / test / build (planın komutları). PR açıklamasındaki "Review düzeltmeleri" tablosunu güncelle (`gh pr edit --body-file`), push et.

### 4. Bitir
Kullanıcıya düzeltilen / düzeltilmeyen (gerekçeli) bulgu listesi. Son satır:
"Şimdi **denetim** sekmesinde `/clear` yazıp `/gate $ARGUMENTS` çalıştırın."
