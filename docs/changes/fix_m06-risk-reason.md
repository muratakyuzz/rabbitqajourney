# Değişiklik notu — fix/m06-risk-reason

## Görev
- Kaynak: `docs/reviews/M-full-review.md` (REV-01), `docs/reviews/M-closure.md`
- Faz / görev kodu: Faz M kapanış düzeltmesi (M-06)

## Ne değişti
- `updateRisk` (store.tsx): durum veya termin değişikliği artık `reason` zorunlu; gerekçesiz çağrı `"Durum veya termin değişikliğinde gerekçe zorunlu"` hatasıyla reddedilir ve state değişmez (diğer gerekçeli işlemler — `updateMeeting`, `updateStep` — ile aynı desen: `string | null` dönüş, çağıran hata mesajını gösterir). Dönüş tipi `void` → `string | null`.
- `RiskDialog` (Phase3Tabs.tsx): `needsReason = !!risk && (d.status !== risk.status || d.due !== risk.due)`; doğruysa "Gerekçe (zorunlu)" Textarea'sı gösterilir (mevcut `ChoiceReasonDialog` / `CommitmentEditDialog` deseniyle aynı: boşken `toast.error` ile kaydetme engellenir). Kaydet'te `updateRisk(risk.id, d, reason.trim() || undefined)` çağrılır; store hatası varsa `toast.error(err)` gösterilir, dialog açık kalır.
- Yeni kayıt oluşturma (`onCreate`) ve başlık/açıklama gibi durum/termin dışı alan değişiklikleri gerekçe istemez.

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Test (dosya › test adı) |
|---|---|---|---|
| AC1 | ✅ | L3 | `Phase3Tabs.RiskDialog.test.tsx` › "AC1: blank reason on a status change blocks save and shows an error" |
| AC2 | ✅ | L3 | `Phase3Tabs.RiskDialog.test.tsx` › "AC2: a due-date change with a reason saves and records it on the audit entry" |
| AC3 | ✅ | L3 | `Phase3Tabs.RiskDialog.test.tsx` › "AC3: editing only the title/description shows no reason field and saves directly" |
| AC4 | ✅ | L3 | `Phase3Tabs.RiskDialog.test.tsx` › "AC4: creating a new risk never requires a reason" |
| (store) | ✅ | L2 | `store.test.tsx` › describe "updateRisk — status/due reason guard (REV-01, INV-06)" (4 test: gerekçesiz durum reddi, gerekçesiz termin reddi, gerekçeli kabul + audit.reason, başlık değişikliği gerekçesiz kabul) |

## Mockup ↔ API
- Kapsam dışı (henüz backend/API yok, Faz M mockup).

## Veritabanı
- [x] Migration yok (Faz M, pg yok)

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-06
- [x] Gerekçe zorunlu işlem store seviyesinde zorlanıyor (`updateMeeting`/`updateStep` ile aynı desen); audit kaydının `reason` alanına yazılıyor (`patch` helper'ı zaten her `reason` parametresini audit'e aktarıyor)
- [ ] RBAC testleri — kapsam dışı (bu bulgu yetki değil, gerekçe zorunluluğu)
- [x] Trigger / PL/pgSQL / RLS / motor kontrolü yok

## Kontroller (çıktı özeti)
```
npm run lint       → 42 problem (14 hata / 28 uyarı) — M-full-review.md referansıyla aynı, regresyon yok
npm run typecheck  → temiz (hata yok)
npm test           → 12 dosya / 205 test yeşil (önceki 197 + yeni 8: 4 store + 4 component)
npm run build      → başarılı (1,22 MB chunk uyarısı eskiden beri var, değişmedi)
```

## Ekran görüntüleri
- Yok (bu turda alınmadı; M-06 baseline turu ayrı bir adımda `/phase-close M` ile çekilecek).

## Eşleme (plandaki ad → koddaki ad)
- "Risk durum veya termin değişikliği gerekçe zorunlu" → `RisksTab` içindeki `RiskDialog` bileşeni + `Ctx.updateRisk` (store.tsx)

## Açık sorular / sapmalar
- Yok. Görev kapsamı REV-01 ile sınırlı tutuldu; REV-07/REV-11 (isteğe bağlı, aynı branch'te yapılabilir deniliyordu) bu turda kapsam dışı bırakıldı çünkü görev metninde zorunlu tutulmadı.

## Öneriler (kapsam dışı)
- REV-07 (store.tsx:482 no-op `support_track` satırı) ve REV-11 (`isCustomerVisible === true` fail-closed) ayrı bir `/fix` turunda ya da ilgili faz görevinde ele alınabilir.

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
| REV-01 | Düzeltildi | (bu branch'in commit'i) |
