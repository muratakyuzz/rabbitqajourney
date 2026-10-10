---
description: docs/PLAN.md'deki sıradaki işaretlenmemiş maddeyi (veya verilen kilometre taşını) uygular, doğrular, main'e commit eder
argument-hint: "[kilometre taşı, örn. M1]"
---

Hedef: **$ARGUMENTS** (boşsa `docs/PLAN.md`'deki ilk `[ ]` madde ve aynı kilometre taşının devamı)

1. `AGENTS.md` ve `docs/PLAN.md`'yi oku ("Çalışma kuralları", "Teknik kararlar", "Store köprüsü" ve hedef kilometre taşı). Endpoint ve şemalar için `docs/API_CONTRACT.md` §2.1 / §3.
2. Uygula. Kapsam yalnızca hedef madde(ler). İş kuralını etkileyen belirsizlikte dur ve sor; küçük kararları uygula ve PLAN.md "Kararlar" listesine bir satır yaz.
3. Her davranış için test yaz (negatif senaryo dahil).
4. `npm run check` yeşil olana kadar düzelt. UI değiştiyse uygulamayı `npm run dev` ile açıp gözle kontrol et.
5. `main`'e Conventional Commit (İngilizce). Push'u kullanıcı istemedikçe yapma.
6. PLAN.md'de biten kutuları `[x]` yap; kilometre taşı bittiyse "Notlar"a kısa özet ve `git tag mN`.
7. Kullanıcıya kısa özet: ne değişti, komut sonuçları, açık sorular.
