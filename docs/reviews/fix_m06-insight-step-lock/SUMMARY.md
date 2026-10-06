# Gate Özeti — fix/m06-insight-step-lock @ 2940e56

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 2 | 1 |
| qa-verifier | APPROVE | 0 | 0 | 0 | 0 |
| rules-reviewer | APPROVE | 0 | 0 | 0 | 3 |
| CI (app / parity / secrets) | okunamadı (gh yok) | — | — | — | — |

**Genel karar:** MERGE'E HAZIR

CI: `gh` CLI kurulu değil, sonuç okunamadı. Faz M demo modunda bu bir engel değil (reviewer ve qa-verifier'ın planı da bunu teyit etti). F1 ve sonrasında parity zorunlu olacağı için kullanıcıya `brew install gh && gh auth login` önerilir.

## Bulgu mutabakatı
reviewer ve rules-reviewer aynı iki konuyu farklı severity ile işaretledi — aynı bulgu, tekrar sayılmadı:
- **REV-M13-01 / RUL-01** (isAutoStep korumasının kaldırılması, belgelenmemiş sapma): reviewer Medium, rules-reviewer Low. rules-reviewer'ın gerekçesi daha güçlü: davranış `updateStep`/StepDialog ile tutarlı hale geldi (tek kaynak ilkesi), INV-26 metnine aykırı değil, ai-mock bugün bu yola hiç ulaşmıyor. Asıl sorun kod değil, **belgeleme eksikliği**.
- **REV-M13-02 / RUL-02** (AC5 testinin `if (!insight) return;` ile sahte-yeşil geçmesi): her iki ajan da aynı boşluğu buldu.
- **RUL-03** (geçersiz `targetId` için "Adım bulunamadı" davranışının test edilmemesi): yalnızca rules-reviewer'da, ek Low bulgu.
- **REV-M13-03** (ApproveDialog'un kilitli/otomatik adım için StepDialog'daki gibi seçenek kısıtlamaması): yalnızca reviewer'da, Low, UI tutarlılığı.

Hiçbir bulgu engelleyici değil; üç gate de kodun REV-13'ü kapattığını ve INV-21/INV-25 ilkelerinin artık tek yerden (stepLockError + updateStep) sağlandığını doğruladı. qa-verifier tüm AC'leri (AC1-AC5) canlı testlerle ve UI ekran kanıtıyla PASS olarak doğruladı.

## Düzeltme direktifi (BACKLOG'a aktarıldı, bu turda zorunlu değil)
1. **(Medium/Low)** `docs/changes/fix_m06-insight-step-lock.md` → "Açık sorular / sapmalar" bölümüne, `approveInsight`'ın `step_update` dalından `isAutoStep` erken reddinin kaldırıldığını ve otomatik adım kuralının artık `updateStep` → `manualStatusError` üzerinden devralındığını (done dışı geçişlerde StepDialog ile hizalı) belgele. [REV-M13-01 / RUL-01] Dosya: `src/lib/rabbitqa/store.tsx:687-692`. Kod değişikliği gerekmiyor, yalnızca belge.
2. **(Medium/Low)** `src/lib/rabbitqa/store.test.tsx`: AC5 (satır ~530-543) ve AC17 (satır ~454-468) testlerini, localStorage'a doğrudan otomatik (data) adımı hedefleyen bir `step_update` insight'ı seed ederek yeniden yaz; `if (!insight) return;` erken çıkışını kaldır. Beklenen: `approveInsight` "Bu adım veriyle tamamlanır" döner, adım/insight/audit değişmez. [REV-M13-02 / RUL-02]
3. **(Low)** `src/lib/rabbitqa/store.test.tsx`'e geçersiz `targetId`'li bir `step_update` testi ekle: `approveInsight` "Adım bulunamadı" döner, öneri `pending` kalır, audit sayısı değişmez. [RUL-03]
4. **(Low, isteğe bağlı)** `src/components/rq/InsightCard.tsx:164` — ApproveDialog'un Durum seçenek kümesini, hedef adımın durumuna/completion tipine göre StepDialog'daki `allowed` mantığıyla hizala (kilitli/otomatik adımda geçersiz seçenek sunulmasın). [REV-M13-03]

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki "Review düzeltmeleri" tablosunu güncelle ve push et.
