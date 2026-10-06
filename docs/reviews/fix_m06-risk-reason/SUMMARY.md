# Gate Özeti — fix/m06-risk-reason @ 55dafe7

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 1 | 2 |
| qa-verifier | APPROVE | 0 | 0 | 0 | 1 |
| rules-reviewer | APPROVE | 0 | 0 | 1 | 3 |
| CI (app / parity / secrets) | okunamadı (`gh` yok) — Faz M demo modunda engelleyici değil, qa-verifier lokal lint/typecheck/test/build'i gerçek çıktıyla doğruladı | | | | |

**Genel karar:** MERGE'E HAZIR

### Not
Reviewer ve rules-reviewer birbirinden bağımsız olarak aynı Medium bulguyu buldu: karar kaydının `decidedAt` (Karar tarihi) alanı gerekçesiz değiştirilebiliyor (REV-M06-01 / RUL-01). REV-01'in (High, bu branch'in hedefi) kapsamı status/due ile sınırlıydı ve bu kapsam tam karşılandı — `decidedAt` genişletmesi freeze'i engellemiyor, ayrı bir karar gerektiriyor.

## Düzeltme direktifi
Zorunlu madde yok — tüm gate'ler APPROVE verdi, Critical/High bulgu yok. Aşağıdakiler isteğe bağlı, BACKLOG'a (`docs/reviews/BACKLOG.md` → "fix/m06-risk-reason") kaydedildi:

1. **REV-M06-01 / RUL-01 (Medium, açık soru):** Karar kaydının `decidedAt` alanı gerekçesiz değiştirilebiliyor (`Phase3Tabs.tsx:357,365,384`, `store.tsx:506`). INV-06'daki "tarih değişikliği" ifadesi bunu kapsıyor mu — Murat karar versin. Kapsanırsa: `needsReason`'a `|| d.decidedAt !== risk.decidedAt`, store koşuluna `(p.decidedAt !== undefined && p.decidedAt !== old.decidedAt)` eklenmeli; store.test.tsx'e gerekçesiz `decidedAt` reddi testi eklenmeli.
2. **RUL-02 (Low):** `Phase3Tabs.tsx:434` — durum/termin geri alınıp sadece başlık değiştirildiğinde eski `reason` hâlâ gönderiliyor. `updateRisk(risk.id, d, needsReason ? reason.trim() : undefined)` kullanılmalı.
3. **REV-M06-02 / RUL-03 (Low):** `Phase3Tabs.RiskDialog.test.tsx:56-67` — AC2 testi adında "audit entry" diyor ama audit.reason'ı assert etmiyor. Test adı düzeltilmeli veya assert eklenmeli.
4. **RUL-04 (Low):** `store.test.tsx:674-713` — yalnızca boşluk gerekçe, durum+termin birlikte değişimi, termin null'a çekilmesi senaryoları için test eksik.
5. **REV-M06-03 (Low, opsiyonel):** `store.tsx:509` — gerekçe trim edilmeden audit'e yazılıyor; `patch(..., reason?.trim() || undefined)` kullanılabilir.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki "Review düzeltmeleri" tablosunu güncelle ve push et.
