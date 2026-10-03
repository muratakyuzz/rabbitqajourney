---
description: UYGULAMA rolünde onaylı bir planı uygular — branch, kod, test, değişiklik notu, commit, push (örn. /build docs/plans/M-09a-step-completion.md)
argument-hint: <plan dosyası yolu>
---

Plan: **$ARGUMENTS**

### 0. Rol kontrolü
`echo "${CLAUDE_ROLE:-$(cat .claude/role 2>/dev/null || echo auditor)}"` çalıştır. Çıktı `builder` değilse **dur** ve kullanıcıya şunu söyle:
"Bu komut uygulama rolünde çalışır. Terminalde `echo builder > .claude/role` çalıştırın, Claude Code'da yeni sohbet açın (`/clear`) ve `/build $ARGUMENTS` yazın."

### 1. Oku
`AGENTS.md`, `docs/INVARIANTS.md`, `docs/RBAC.md`, `docs/TEST_STRATEGY.md`, plan dosyasının **tamamı** (kapsam, kabul kriterleri, kararlar, açık sorular, "Uygulama görev metni" bölümü — eski planlarda başlığı "Codex görev metni"dir, aynı şeydir). Faz M planıysa `AGENTS.md` → "Demo kuralları". F1 ve sonrasıysa `docs/DATA_MODEL.md` ve `docs/API_CONTRACT.md`.
Plan "Durum: Onaylandı" değilse veya cevaplanmamış (karar gerektiren) açık soru varsa **dur**, kullanıcıya sor.

### 2. Branch
Plandaki branch adını kullan. Branch uzakta varsa `git fetch && git checkout <branch> && git pull`; yoksa `git checkout main && git pull && git checkout -b <branch>`. Çalışma ağacı temiz değilse dur ve kullanıcıya göster.

### 3. Uygula
"Uygulama görev metni"ni ve planın tamamını uygula. Kurallar:
- Yalnızca plandaki kapsam. Kapsam dışı fikirler değişiklik notunda "Öneriler" altına.
- Planda adlar tahminse koddaki gerçek adları kullan; farkı değişiklik notunda "Eşleme" altına yaz.
- Karar gerektirmeyen varsayımları uygula ve değişiklik notunda "Açık sorular / sapmalar" altına yaz; iş kuralını etkileyen belirsizlikte **dur ve kullanıcıya sor**.
- Planda commit bölünmesi varsa ona uy; yoksa mantıksal parçalar halinde Conventional Commits.
- Her kabul kriteri (negatifler dahil) için TEST_STRATEGY'deki doğru seviyede test yaz.
- Plan, review, INVARIANTS/RBAC, ADR ve `.claude/` dosyalarını değiştirme (guard engeller). Plan yanlış/eksikse dur ve kullanıcıya söyle — plan denetim oturumunda düzeltilir.
- Yeni paket gerekiyorsa önce kullanıcıya sor.

### 4. Doğrula
Plandaki komutları çalıştır (yoksa: `npm run lint && npx tsc --noEmit && npm test && npm run build`; UI/akış değiştiyse varsa `npm run e2e`). Kırmızıysa düzelt. Lint hata sayısı main'deki sayıdan artmamalı (main'deki sayı: plan veya `docs/AUDIT.md`).
Test çıktılarını (test-results/, playwright-report/, coverage/) commit etme.

### 5. Değişiklik notu ve push (PR açılmaz)
`docs/changes/_TEMPLATE.md`'yi `docs/changes/<branch, / → _>.md` olarak doldur: Ne değişti · Eşleme · Kabul kriteri ↔ test tablosu · komut çıktı özeti · Açık sorular / sapmalar · Öneriler. Uygulanmayan şablon bölümlerini sil. Son commit'e ekle (`docs: change note`), sonra `git push -u origin <branch>`.
**PR açma** — bu projede PR kullanılmaz; `/gate` branch'i inceler, merge'ü Murat terminalden yapar.

### 6. Bitir
Kullanıcıya: commit listesi, komut sonuçları, açık sorular (değişiklik notunun kısa özeti). Son satır:
"Şimdi terminalde `rm .claude/role` çalıştırın, Claude Code'da `/clear` yazın ve `/gate <branch>` çalıştırın."
Kendi işini onaylama, `/gate` çalıştırma, merge etme.
