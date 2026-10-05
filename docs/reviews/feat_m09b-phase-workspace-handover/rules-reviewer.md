# rules-reviewer — feat/m09b-phase-workspace-handover @ 4d67bd3
**Karar:** APPROVE

Bu tur için bir engelleyici bulgu yok. İstenen dört konu spec'e, plana ve INV-06/09/13/25/26'ya uyuyor.

- **`data` tamamlama türü:** doğru çalışıyor; RUL-13 yapısal olarak kapandı.
- **`setInstallChoice` gerekçe zorunluluğu (AC-NEG1/2):** doğru çalışıyor.
- **`reqdoc_not_shared`:** artık adım durumunu `isOpenStep` ile okuyor, doğru. Tatil ve iş günü hesabı da doğru.
- **`canAssignCsm`:** CSM'in yazılabildiği iki yerde de (yeni proje diyaloğu ve 00 paneli) aynı fonksiyonla uygulanıyor.

Round 2'den sonra yalnızca `App.tsx`, testler ve değişiklik notu değişmiş; iş kuralı kodu değişmemiş. Faz M olduğu için parity kontrolü yapılmadı. Testler okuma yoluyla doğrulandı, çalıştırılmadı (qa-verifier'ın işi).

## Karar tablosu özeti
Tam karar tabloları (completion "data" türü 1a-1m, setInstallChoice 2a-2k, reqdoc_not_shared iş günü 3a-3p, canAssignCsm 4a-4g) agent raporunda detaylı mevcut — tümü spec/plan ile uyumlu, istisnalar aşağıdaki bulgularda.

## Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RUL-07 | Medium | INV-25, INV-08, RUL-05 | src/lib/rabbitqa/alerts.ts:68-69; rules.ts:35; flow.ts:52 | RUL-05 ile bağlantılı: `reqdoc_not_shared` artık proje alanı yerine adım durumuna bakıyor. SaaS'ta 01 onaylanıp (reqdoc `out_of_scope`) sonra On-prem'e geçilirse `req_doc` yoksa reqdoc kalıcı `locked` kalıyor (akış motoru `done` aşamadaki adımı açmıyor) ve `isOpenStep` false olduğundan uyarı hiç üretilmiyor. Önceki kod bu durumda uyarı veriyordu — On-prem projede paylaşılmamış doküman artık sessiz. | RUL-05 kararıyla birlikte çözülmeli; BACKLOG'daki RUL-05 satırına bu sonuç eklensin. L1 testi: "01 done + SaaS→On-prem + req_doc yok + eşik aşıldı → beklenen davranış". |
| RUL-08 | Low | INV-06, INV-05 | src/lib/rabbitqa/store.tsx:353-356 | `installChoiceError` güncel `cur` yerine closure'daki `state`'e karşı doğrulanıyor (önceki `setKickoff` deseninden kalma). Aynı render döngüsünde art arda iki çağrı gelirse ikinci çağrı eski değere göre doğrulanıp gerekçesiz değişiklik sızabilir. UI'da pratikte zor tetiklenir. | Demo: updater içinde `cur` ile tekrar doğrula. F1: transaction + `FOR UPDATE`, parity'de eşzamanlılık testi. |

### RUL-05 değerlendirmesi (backlog'daki "Murat kararı" maddesi)
`applyInstallType`/`applyLlmChoice` (rules.ts:35,100), aşaması `done` olan adımı da `out_of_scope→locked` yapabiliyor; akış motoru yalnızca aktif aşamalardaki adımları açtığından (flow.ts:52) adım kalıcı kilitli kalabiliyor (örn. 03 done iken LLM değişince `model_install` kilitlenir). Kod değişmedi, RUL-11 testi hâlâ bu durumu `not.toBe("out_of_scope")` ile kabul ediyor. Spec hem "yeni adımlar açılır" hem INV-08'i söylüyor ama tamamlanmış aşamada uzlaşmayı tanımlamıyor — bu bir ürün kararı, Murat'ı bekliyor. Severity Medium, gate'i engellemiyor. Güvenli varsayım önerisi: karar verilene kadar `done`/`out_of_scope` aşamadaki adım kural motorunca değiştirilmesin, yerine CSM'e gerekçeli aksiyon açılsın.

## Düzeltme direktifi
1. **RUL-07 (BACKLOG, engellemiyor):** BACKLOG'daki RUL-05 satırına `reqdoc_not_shared` sonucu not edilsin; karar görevinde completion.test.ts'e ilgili test eklensin.
2. **RUL-08 (Low, M-09c/F1):** `setInstallChoice` updater'ı `cur` ile tekrar doğrulasın.
3. **Test eksikleri (Low, M-09c):** hafta sonu+tatil/tatil gününde kick-off/yılbaşı senaryoları, csm'in yeni proje diyaloğunda pasif seçim testi, `business-days.ts` birim testi.

## Açık sorular (engelleyici değil)
- S6 teyidi hâlâ bekleniyor (plan §11).
- Arife yarım gününün iş günü sayılması spec'te açık değil.
- "Paylaşıldı" ile "yüklendi" eşitlenmesi spec metnine yansıtılmalı mı?
- Admin'in kurulum/LLM alanlarını düzenleyebilmesi RBAC.md satır 9 ile netleştirilmeli (F1).
- RUL-02, RUL-03, RUL-06 BACKLOG'da M-09c için açık; kodda değişiklik yok.
