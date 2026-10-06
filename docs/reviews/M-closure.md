# Faz M kapanışı (M-06 mockup-freeze): GO/NO-GO, round 3

**Tarih:** 2026-10-06
**Kapsam:** main @ dffa61f (round 2 kapsamına ek olarak `fix/m06-insight-step-lock` merge edildi). Girdiler: `docs/reviews/M-qa-regression.md` (qa-verifier, round 3), `docs/reviews/fix_m06-insight-step-lock/SUMMARY.md` (+ reviewer/qa-verifier/rules-reviewer raporları), `docs/reviews/BACKLOG.md`. Doğrudan okunan kod: `src/lib/rabbitqa/store.tsx:259-265` (`updateStep`), `:669-715` (`approveInsight`), `src/lib/rabbitqa/completion.ts:230-244` (`manualStatusError`, `stepLockError`).

Round 1 (NO-GO, 62a8f90) ve round 2 (NO-GO, REV-13, ab95e9a) kararları git geçmişinde duruyor. Gerekçe, blocker ölçütleri ve baseline etkisi analizi round 2'de; burada tekrarlanmıyor.

## Karar: **GO**

Round 2'nin tek blocker'ı REV-13 kapandı ve merge sonrası main'de regresyon yok. Round 3 plan gereği hafif yapıldı: baseline yeniden çekilmedi ve reviewer tüm kod tabanını yeniden taramadı, fix branch'inin gate'i yeterli sayıldı. Bu round'da yeni High veya Critical bulgu yok.

## Kanıt özeti

- **Fix gate (`fix/m06-insight-step-lock` @ 2940e56):** reviewer, qa-verifier ve rules-reviewer APPROVE; toplam 0 High. `approveInsight` → `step_update` artık `api.updateStep` çağırıp hatasını yayıyor (store.tsx:687-692). Kilit (`stepLockError`), otomatik adım (`manualStatusError`) ve `ballSince` kuralları tek kaynaktan uygulanıyor. INV-21 ve INV-25 sağlanıyor. `ApproveDialog` artık "Sırası gelmedi" sunmuyor.
- **Round 3 regresyon (qa-verifier, main @ dffa61f): APPROVE.**
  - tsc temiz.
  - Vitest 13 dosya / 210 test yeşil; round 2'ye göre +1 dosya ve +5 test (REV-13 AC1-AC5).
  - Lint 14 hata / 28 uyarı, referansla aynı.
  - Build başarılı, bilinen 1,22 MB chunk uyarısı duruyor.
  - `docs/reviews/M-06/baseline/` altında 37 PNG (REV-13 ek görseli dahil, bkz. QA-01).

## Bu round'un bulguları

| ID | Sev. | Özet | Karar |
|---|---|---|---|
| QA-01 | Low | REV-13 ek görseli (`fix_m06-insight-step-lock/screens/…-ac4-status-dropdown.png`) başlangıçta baseline klasörüne kopyalanmamıştı. Round 2 belgeleri baseline'ı 35 PNG diye yazıyor, klasörde 36 vardı; sayım farkı belge düzeyinde. | **Kapandı.** Denetim rolü görseli `docs/reviews/M-06/baseline/csm-insights-step-update-edit-dialog-status-open.png` olarak kopyaladı; baseline 37 PNG. |
| REV-M13-01 / RUL-01 | Med/Low | `isAutoStep` erken reddi kaldırıldı ve belgelenmedi. | **Planner: sapma kabul.** `manualStatusError` otomatik adımda `done`'ı reddediyor (INV-26), davranış StepDialog ile aynı. Yalnızca değişiklik notu güncellenir. m09b REV-07 sorusu buna bağlı; Murat F0-01'de aksini isterse geri alınır. |
| REV-M13-02 / RUL-02, RUL-03, REV-M13-03 | Med/Low | AC5/AC17 sahte-yeşil, "Adım bulunamadı" testi yok, ApproveDialog seçenek kısıtı yok. | Test/UI boşluğu, invariant ihlali değil. F4-01 (testler) ve F3-02 (UI). |

Round 2'nin isteğe bağlı maddeleri (RUL-02, REV-M06-02, REV-07, PLN-01) fix branch'ine alınmadı. Round 2'deki hedeflerinde açık kalıyorlar.

## BACKLOG

Round 2'nin "GO durumunda BACKLOG.md'ye taşınacaklar" tablosu (REV-13 satırı hariç) ve bu round'un bulguları, `docs/reviews/BACKLOG.md`'ye "Faz M kapanış (round 2-3)" başlığıyla taşındı.

## Teknik borç / ADR-0002

Round 2 ile aynı. Parity job'ı yok, pg-mem farkı gözlenmedi, ADR-0002'yi yeniden değerlendirme koşulu oluşmadı. Lint, bundle boyutu, `xlsx` ve lock senkronu F0-02'de.

## Sonraki adım

1. Murat: `git tag mockup-freeze && git push --tags` (main @ dffa61f + bu kapanış belgelerinin commit'i).
2. Faz F0 başlar. Önce F0-01'den önce verilmesi gereken Murat kararları (BACKLOG "Faz M kapanış" → Murat kararı satırları), sonra `/plan F0-01`.
