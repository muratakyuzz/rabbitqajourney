## rules-reviewer — feat/m09a-step-completion @ c3048ec
**Karar:** APPROVE (Critical veya High yok. Bir Medium bulgu `docs/reviews/BACKLOG.md`'ye gider, kalanlar Low.)

Branch demo modunda (Faz M), backend yok. Bu yüzden "Test / motor" sütununda pg-mem veya parity yerine vitest katmanı (L1 saf fonksiyon, L3 store `renderHook`) yazıyor. İnceleme yalnızca `/Users/murat/Development/rabbitqajourney/.verify/feat_m09a-step-completion` worktree'sinde yapıldı ve dosya yazılmadı. Testleri çalıştırmadım. Bu ajan salt okunur, test kanıtı qa-verifier'ın işi. "Test var" sütunu, test kodunu okuyup seed verisiyle elle izlediğim sonuca dayanıyor.

Okunanlar: AGENTS.md, rules-reviewer.md, REVIEW_FORMAT.md, INV-09/13/26, PRODUCT_SPEC (00–03, Otomatik kurallar, Pano içi uyarılar, Ek B.1–B.3), plan M-09a, değişiklik notu, 1. tur raporu ve SUMMARY. Kod tarafında `completion.ts`, `rules.ts`, `alerts.ts` (diff), `ai-mock.ts` (diff), `types.ts` (diff), `store.tsx` (diff), `seed.ts` (şablon ve 4 senaryo), `completion.test.ts`, `store.test.tsx`.

### 1. tur düzeltmelerinin doğrulaması

| ID | İddia | Gerçek durum | Kanıt |
|---|---|---|---|
| RUL-01 | SaaS→On-prem→SaaS testi eklendi (117e3d6) | **Düzeldi** (test zayıf, bkz. RUL-10). Test şunları doğruluyor: `saas_env` tam 1 adet; `vpn_info` sırayla out_of_scope→locked→out_of_scope; On-prem geçişinde `saas_env` out_of_scope oluyor. | store.test.tsx:230-259 |
| RUL-02 | AC18 testi p_garanti ile yeniden yazıldı (60ee10f) | **Düzeldi.** Garanti seed'de onprem, `reqDocShared=false`, `m_3` kickoff held ve tarihi 2026-09-24. Kickoff `planned` iken uyarı yok, seed halinde (held) 2026-10-20'de uyarı üretiliyor. İki yarı da var ve filtreyi gerçekten sınıyor. | completion.test.ts:362-374, seed.ts:321,327, alerts.ts:67-68 |
| RUL-03 | AC16 değişmez testi eklendi (9327561) | **Düzeldi.** Done aşamalardaki her done ve manual olmayan adımın `stepConditionResult().met` değeri doğrulanıyor. Done olmayan aşamaları zaten "seed is already settled" testi kapsıyor (`applyStepCompletion` hiçbir proje için değişiklik yapmıyor). İkisi birlikte değişmezi tam kapsıyor. Garanti'nin KPI (k_3), teklif, sözleşme ve toplantı verisi koşulları karşılıyor, test boş geçmiyor. | completion.test.ts:418-425, 224-231 |
| RUL-08 | Garanti keşif toplantısı geçmişe çekildi (9988203) | **Düzeldi.** `m_disc_gar` 2026-10-09'dan 2026-09-30'a alındı; bugünden (2026-10-04) ve 02 planEnd'den (2026-10-09) önce. Garanti'de main'den kalma başka tarih tutarsızlıkları var (aşağıda Açık soru 2). | seed.ts:328 |

### Karar tablosu

**A. STEP_CONDITIONS ve toplantı koşulu (INV-26)**

| Girdi | Spec'e göre beklenen | Koddaki davranış | Test / katman |
|---|---|---|---|
| csm: csmId dolu / null | 00 CSM ataması | `csmId !== null` (completion.ts:19-25) | L1 CT:26-34 |
| sales_license: satışçı + lisans | 00 | iki ayrı kontrol | L1 CT:36-44 |
| modules: liste boş / dolu | 00 | `length>0` | L1 CT:46-50 |
| commitments: taahhüt var / yok + noCommitments | 00 + B.2 "Taahhüt yok" | `has \|\| noCommitments` | L1 CT:52-57, L3 store.test:47-78 |
| install_llm: iki alan null / dolu | B.2 (Satış Devri'nde girilir) | iki ayrı kontrol | L1 CT:59-65 |
| offer / contract dokümanı | 00 | ilgili türde doküman var mı | L1 CT:67-73 |
| discovery_form: zorunlu soruların hepsi dolu | 02 | canlı `state.questions` üzerinden; zorunlu soru yoksa met | L1 CT:75-79 |
| teams | 02 + B.2 "zorunlu değil" | `teams.length>0`, `required:false` | L1 CT:81-85, CT:392-396 |
| kpi: baseline ve target dolu en az 1 KPI | 02 | evet | L1 CT:87-91 |
| vpn_info: tür "vpn" (büyük/küçük harf duyarsız) | 03 | evet | L1 CT:93-97, CT AC5/AC6 |
| meeting: planned / held / cancelled | B.2 yalnızca "Yapıldı" tamamlar | `status==="held"` (completion.ts:97) | L1 CT:99-107; L3 store.test:81-150 |
| tanımsız key veya meetingType | otomatik tamamlanmamalı | met=false | L1 CT:109-115 |

**B. applyStepCompletion / settle (INV-26, INV-25)**

| Girdi | Beklenen | Kod | Test |
|---|---|---|---|
| koşul sağlandı, adım pending/locked | done + "Otomatik kural: veri tamamlandı — …" audit | :131-139 | L1 AC1, AC5 |
| koşul bozuldu, aşama açık, adım daha önce aktive edilmiş | pending; due yoksa iş günüyle hesaplanır; audit | :147-152 | L1 AC3 (due değeri yalnızca "null değil" diye bakılıyor → RUL-12) |
| koşul bozuldu, adım hiç aktive edilmemiş | locked, due null | :153-155 | L1 AC6 |
| koşul bozuldu, aşama done veya out_of_scope | dokunulmaz | :143 | L1 AC4 |
| adım veya aşama out_of_scope | dokunulmaz | :121-123 | L1 AC7, S2 |
| iki kez settle (idempotans) | aynı referans | :159, :165-169 | L1 AC8 ×2 |
| zincir: Taahhütler done → brief açılır | B.1 | settle döngüsü | L1 CT:235-275 |

**C. Elle tamamlama koruması (INV-26)**

| Girdi | Beklenen | Kod | Test |
|---|---|---|---|
| data/meeting adımı → done (elle) | ret | manualStatusError :180, store.tsx:267 | L1 + L3 store.test:18-35 |
| done → pending/in_progress (elle) | ret | :181 | L1 + L3 |
| → out_of_scope, ve out_of_scope → pending | izin; settle yeniden tamamlar | :182 | L3 store.test:169-183 |
| AI önerisi data/meeting adımını hedefliyor | öneri üretilmez veya onaylanmaz | ai-mock.ts:49, store.tsx:650-655 | L1 CT:355-360, L3 store.test:318+ |
| setStepByKey ile yazılan otomatik "done" yolları | yalnızca manual adımlara | commit_check, presentation, reqdoc, support_track, customer_approval, gonogo: hepsi şablonda manual | grep ile doğrulandı |

**D. Toplantı kuralları (applyMeetingHeldRules)**

| Girdi | Beklenen | Kod | Test |
|---|---|---|---|
| planned devops_handover | top değişmez | rules.ts:122 | L1 CT:331-336, L3 store.test:151-167 |
| held devops_handover | top DevOps'a geçer; adımı completion tamamlar | :124-129 | L1 + L3 |
| held devops_handover, adım out_of_scope (SaaS) | dokunulmaz | :126 | **test yok** (1. turdaki RUL-04, backlog'da) |
| aynı held kural iki kez | değişiklik yok | setStepByKey'de audit yoksa `s` döner; ballSince audit'e girmez | test yok (RUL-04, backlog'da) |
| planned→held / held→X / planned→cancelled gerekçesiz | izin / ret / ret | store.tsx:286-299 | L3 store.test:103-137 |
| held go_no_go | gonogo done; adım kilitliyse de akışı atlıyor | :130-132 | L1 CT:345-351 (RUL-06, M-09c'ye kadar backlog'da) |

**E. Kurulum tipi / LLM (INV-09)**

| Girdi | Beklenen | Kod | Test |
|---|---|---|---|
| null→değer, gerekçesiz | izin | installChoiceError | L1 + L3 |
| değer→başka değer, gerekçesiz / gerekçeli | ret / izin, kurallar yeniden çalışır | :112, :116 | L1 + L3 store.test:198-228 |
| değer→null | ret | :111, :115 | L1 + L3 |
| SaaS→On-prem→SaaS | kopya yok; eski adımlar out_of_scope; gerekçeli audit | rules.ts:27-55 doğru | L3 store.test:230-259 (zayıf assert'ler → RUL-10) |
| SaaS geçişinde done olan ONPREM adımı | spec net değil | done kalıyor (:32) | — (1. turdaki Açık soru 3) |
| LLM gpu→own→gpu | aksiyon kopyası yok; iptal→open; model_install out_of_scope↔locked | rules.ts:69-103 kod incelemesinde doğru | **hiç test yok** → RUL-11 |
| LLM kuralı iki kez | idempotent | setKickoff yalnızca değer değişince çağırıyor (store.tsx:374) | test yok (RUL-11) |
| SaaS projede req_doc dokümanı yüklendi | out_of_scope reqdoc adımı değişmemeli | **done oluyor** (store.tsx:420, setStepByKey durum kontrolü yapmıyor) | test yok → RUL-13 |

**F. Uyarılar ve iş günü (INV-13)**

| Girdi | Beklenen | Kod | Test |
|---|---|---|---|
| reqdoc: yalnızca planned kick-off | uyarı yok | alerts.ts:67 `status==="held"` | L1 CT:362-371 |
| reqdoc: held kick-off, ≥2 iş günü | sarı uyarı | :68 | L1 CT:372-373 |
| reqdoc: tam 2. iş günü sınırı / tatil arifesi (28 Ekim) | `>=` ile uyarı | kod doğru | **test yok** → RUL-12 |
| geri açılan adımın due'su: hafta sonu, tatil, yılbaşı | iş günü (business-days.ts) | `addBusinessDays(today, durationDays||1, hol)` (completion.ts:148). Tarih aritmetiği yalnızca business-days.ts'te, INV-13'e uygun. | kesin değer assert edilmiyor; repoda business-days testi hiç yok → RUL-12 |
| Europe/Istanbul gece yarısı | yerel tarih | `localISO(now)` tarayıcının yerel saatini kullanıyor (mockup genelindeki desen) | uygulanamaz (demo) |

### Bulgular

| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RUL-10 | Low | INV-09, 1. tur RUL-01 direktifi | src/lib/rabbitqa/store.test.tsx:230-259 | A→B→A testi eklendi ama assert'leri dar. Audit için yalnızca `installTypeAudits.length > 0` kontrol ediliyor, oysa direktif "her geçişte audit" istiyordu. Üçüncü geçişte `saas_env` için out_of_scope→locked yolu (rules.ts:39) assert edilmiyor; `saas_env`'in id'sinin korunduğu da kontrol edilmiyor. rules.ts:39 bozulursa (ör. SaaS'a dönüşte `saas_env` out_of_scope kalırsa) test yine geçer. | Her `setKickoff`'tan sonra o geçişe ait "Otomatik kural: kurulum tipi SaaS/On-prem" audit sayısının arttığını; son durumda `saas_env.status==="locked"` olduğunu ve id'nin ilk oluşturulan id ile aynı kaldığını assert et. |
| RUL-11 | Medium | INV-09 ("A→B→A testi") | src/lib/rabbitqa/rules.ts:69-103 | LLM kuralı (`applyLlmChoice`) için hiçbir test yok. Bu diff setKickoff'ta LLM yolunu değiştirdi (`llm` adım yazımı kaldırıldı, gerekçe kuralı eklendi). gpu→own→gpu senaryosunda aksiyonların kopyalanmaması, cancelled→open dönüşü ve `model_install` out_of_scope↔locked geçişi regresyona karşı korumasız. | L1 testi yaz: `applyLlmChoice` gpu → own → gpu; ruleKey başına tek aksiyon, gpu aksiyonları cancelled→open, `model_install` locked/out_of_scope, her değişimde "Otomatik kural: LLM tercihi …" audit'i. Aynı seçimle ikinci çağrı yeni audit üretmemeli. |
| RUL-12 | Low | INV-13 | src/lib/rabbitqa/completion.ts:148; src/lib/rabbitqa/alerts.ts:68; completion.test.ts (AC3) | İş günü kenar durumları test edilmiyor. AC3 testi geri açılan adımın due'sunda yalnızca `not.toBeNull()` kontrolü yapıyor. reqdoc eşiği sınırda (tam 2 iş günü, tatil arifesi) test edilmiyor. Repoda business-days testi de yok. Hesap business-days.ts'e devredildiği için risk düşük. | AC3'te kesin due'yu assert et (ör. NOW=2026-10-28, 29 Ekim tatili ve hafta sonu atlanmalı). reqdoc için bd=1 iken uyarı yok, bd=2 iken uyarı var testi ekle. |
| RUL-13 | Low | INV-09, spec "Otomatik kurallar" (SaaS → Kapsam dışı) | src/lib/rabbitqa/store.tsx:420 (ayrıca :378) | `addDocument(req_doc)` ve `setKickoff(reqDocShared)` reqdoc adımını `setStepByKey(... done)` ile durum kontrolü yapmadan done yapıyor. SaaS projede `out_of_scope` olan reqdoc adımı, bir req_doc yüklenince "Tamamlandı" oluyor; kilitli adım da sırası gelmeden done oluyor. Davranış main'den geliyor, ama bu diff 420. satırı yeniden yazdı. | Bu iki yolda adım `out_of_scope` ise atla (opsiyonel: `locked` ise de). Ya da M-09b/c'de reqdoc'u `data` tipine al; o durumda completion motoru out_of_scope'u zaten atlıyor. |

Ek not: 1. turda backlog'a alınan RUL-04, RUL-05, RUL-06, RUL-07 ve RUL-09 bu turda yeniden doğrulandı ve hâlâ geçerli. Koddaki durumları değişmedi, backlog kayıtları yeterli.

### Düzeltme direktifi (rules-reviewer)
Bu PR'ı engelleyen bir madde yok. Aşağıdakiler backlog'a veya isteğe bağlı düzeltmeye:
1. **RUL-11 (Medium → BACKLOG):** `completion.test.ts` (ya da yeni `rules.test.ts`) dosyasına `applyLlmChoice` için gpu→own→gpu A→B→A ve idempotans testi ekle. Beklenenler: ruleKey başına tek aksiyon, cancelled↔open geçişi, `model_install` locked↔out_of_scope, her geçişte "Otomatik kural: LLM tercihi" audit'i.
2. **RUL-10 (Low):** store.test.tsx:230-259'u güçlendir. Her geçiş için audit sayısı artmalı; son durumda `saas_env` locked olmalı ve id'si değişmemeli.
3. **RUL-12 (Low):** completion.test.ts AC3'te kesin due assert'i (tatil + hafta sonu senaryosu) ve reqdoc_not_shared için bd=1 / bd=2 sınır testi.
4. **RUL-13 (Low):** store.tsx:378 ve :420'de reqdoc adımı `out_of_scope` ise done yazma. Negatif test: SaaS projede req_doc yüklenince reqdoc out_of_scope kalır.

### Açık sorular / öneriler (engelleyici değil)
1. **Garanti seed'i spec 01 ile çelişiyor (main'den kalma):** 01 aşaması done ve reqdoc adımı done, ama `reqDocShared=false`. Spec 01 tamamlanma koşulu "On-prem ise gereksinim dokümanı paylaşıldı" diyor. Seed, `reqdoc_not_shared` uyarısını göstermek için bilinçli böyle görünüyor; reqdoc `manual` olduğu için AC16 testine takılmıyor. Murat kararı: seed mi düzeltilsin, reqdoc M-09b/c'de `data` tipine mi alınsın?
2. **Garanti'de main'den kalma tarih tutarsızlıkları:** 01/02 aşamalarının `actualEnd`/`approvedAt` değerleri bugünden sonra (2026-10-02 / 2026-10-09). 03 aşaması bugünden 9 iş günü önce (~2026-09-21) başlıyor, yani 01/02 toplantılarından (09-24, 09-30) önce. RUL-08 kendi kapsamında düzeldi; bu daha geniş tutarsızlık bu PR'ın kapsamı dışında.
3. 1. turdaki açık sorular hâlâ geçerli: canlı keşif soruları değişince tüm açık projelerde adımların geri açılması; geri açılan adımın eski (geçmiş) due'yu koruması; SaaS geçişinde done ONPREM adımının "Tamamlandı" kalması; S4 (Planlandı→Yapıldı gerekçesiz); meeting adımı için "veriyle tamamlanır" ve "veri eksildi" metinleri (RUL-09).
4. `Phase2Tabs.tsx:42` held kick-off'u `find` ile alıyor, alerts.ts ise en erken tarihliyi seçiyor. Birden fazla held kick-off varsa UI ile uyarı farklı tarih gösterebilir. Yalnızca görsel tutarlılık sorunu.
