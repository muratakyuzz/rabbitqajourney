---
description: UYGULAMA oturumunda onaylı bir planı uygular — branch, kod, test, commit, push, PR (örn. /build docs/plans/M-09a-step-completion.md)
argument-hint: <plan dosyası yolu>
---

Plan: **$ARGUMENTS**

### 0. Rol kontrolü
`echo "${CLAUDE_ROLE:-auditor}"` çalıştır. Çıktı `builder` değilse **dur** ve kullanıcıya şunu söyle:
"Bu komut uygulama oturumunda çalışır. Yeni bir terminal sekmesinde `CLAUDE_ROLE=builder claude` ile başlatıp `/build $ARGUMENTS` yazın."

### 1. Oku
`AGENTS.md`, `docs/INVARIANTS.md`, `docs/RBAC.md`, `docs/TEST_STRATEGY.md`, plan dosyasının **tamamı** (kapsam, kabul kriterleri, kararlar, açık sorular, "Uygulama görev metni" bölümü — eski planlarda başlığı "Codex görev metni"dir, aynı şeydir). Faz M planıysa `AGENTS.md` → "Demo kuralları". F1 ve sonrasıysa `docs/DATA_MODEL.md` ve `docs/API_CONTRACT.md`.
Plan "Durum: Onaylandı" değilse veya cevaplanmamış (karar gerektiren) açık soru varsa **dur**, kullanıcıya sor.

### 2. Branch
Plandaki branch adını kullan. Branch uzakta varsa `git fetch && git checkout <branch> && git pull`; yoksa `git checkout main && git pull && git checkout -b <branch>`. Çalışma ağacı temiz değilse dur ve kullanıcıya göster.

### 3. Uygula
"Uygulama görev metni"ni ve planın tamamını uygula. Kurallar:
- Yalnızca plandaki kapsam. Kapsam dışı fikirler PR'da "Öneriler" altına.
- Planda adlar tahminse koddaki gerçek adları kullan; farkı PR'da "Eşleme" altına yaz.
- Karar gerektirmeyen varsayımları uygula ve PR'da "Açık sorular / sapmalar" altına yaz; iş kuralını etkileyen belirsizlikte **dur ve kullanıcıya sor**.
- Planda commit bölünmesi varsa ona uy; yoksa mantıksal parçalar halinde Conventional Commits.
- Her kabul kriteri (negatifler dahil) için TEST_STRATEGY'deki doğru seviyede test yaz.
- Plan, review, INVARIANTS/RBAC, ADR ve `.claude/` dosyalarını değiştirme (guard engeller). Plan yanlış/eksikse dur ve kullanıcıya söyle — plan denetim oturumunda düzeltilir.
- Yeni paket gerekiyorsa önce kullanıcıya sor.

### 4. Doğrula
Plandaki komutları çalıştır (yoksa: `npm run lint && npx tsc --noEmit && npm test && npm run build`; UI/akış değiştiyse varsa `npm run e2e`). Kırmızıysa düzelt. Lint hata sayısı main'deki sayıdan artmamalı (main'deki sayı: plan veya `docs/AUDIT.md`).
Test çıktılarını (test-results/, playwright-report/, coverage/) commit etme.

### 5. PR
`git push -u origin <branch>`, sonra `gh pr create --base main` — gövde `.github/pull_request_template.md`'ye göre: Ne değişti · Eşleme · Kabul kriteri ↔ test tablosu · komut çıktı özeti · Açık sorular / sapmalar · Öneriler. `gh` yoksa veya giriş yapılmamışsa PR gövdesini kullanıcıya kod bloğunda ver, GitHub'da elle açmasını söyle.

### 6. Bitir
Kullanıcıya: PR bağlantısı, commit listesi, komut sonuçları, açık sorular. Son satır:
"Şimdi **denetim** sekmesinde `/clear` yazıp `/gate <branch>` çalıştırın."
Kendi işini onaylama, `/gate` çalıştırma, merge etme.
