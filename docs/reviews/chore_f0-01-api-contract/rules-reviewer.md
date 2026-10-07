## rules-reviewer — chore/f0-01-api-contract @ 4563ca2 (gate round 3)
**Karar:** APPROVE (Critical 0 · High 0 · Medium 1 · Low 4). Medium bulgu `docs/reviews/BACKLOG.md`'ye gider.

**Kapsam.** `1d8f4d2..4563ca2` arasındaki 20 commit incelendi. Diff'te `docs/` dışında dosya yok, AC5 korunuyor.

**Karşılaştırılan kaynaklar:**
- Sözleşme: `docs/API_CONTRACT.md` v1.2 (§1, §2.1, §2.2, §4, §5)
- Kurallar: `docs/INVARIANTS.md` (INV-06/07/08/09/25/26/28), ADR-0005 K10, K11, K14–K18 ve "Round 2 — API_CONTRACT'a yansıtılacaklar"
- Spec: PRODUCT_SPEC ("Otomatik kurallar", "Aşama durumu", "Sıralı akış", B.4)
- Mockup: `src/lib/rabbitqa/flow.ts`, `completion.ts`, `rules.ts`, `store.tsx`, `seed.ts`, `alerts.ts`

**Değerlendirme notları:**
- SUMMARY'deki denetim notu gereği madde 8 (REV-F017), madde 3 (INV-28) ve S23/S25 numaralandırması ADR-0005 K14–K18 ölçüsüyle değerlendirildi.
- Kod olmadığı için "test" sütunu, sözleşmede BE için Doğrulama notu olup olmadığını gösterir. pg-mem ve parity uygulanmıyor.
- CI okunamadı (`gh` yok, F0-07 öncesi); engel sayılmadı.
- Satır numaraları 4563ca2'ye göredir.

**Özet:**
- Round 2'deki 9 bulgunun 9'u da sözleşmede kapandı. ADR-0005 K14–K18 ve "Round 2 — yansıtılacaklar" listesi sözleşmeye eksiksiz yansımış.
- Yeni engel yok.
- Bir Medium bulgu var (RR-F027). Round 2'de benim önerdiğim "kapsam dışından dönen aşama `locked` olur" kuralının `locked` dalı API'de yalnızca daha önce açılmış bir aşamada tetikleniyor. Sonuç: kilitli bir aşamanın içinde açık adımlar kalıyor.
- Dört Low bulgu sözleşme kenar durumları ve denetim dokümanlarındaki eski metin kalıntılarıyla ilgili.

### Round 2 bulgularının kapanışı
| ID | Durum | Kanıt (API_CONTRACT.md, aksi belirtilmedikçe) | Commit |
|---|---|---|---|
| RR-F018 | Kapandı | §1 :22 "Aşaması `done` olan adımın durumu da elle (PATCH, AI `step_update` onayı) değişmez → `409 "Aşama tamamlandı; önce aşamayı yeniden açın"`"; `ownerId`/`ball`/kilitli olmayan adımda `due` serbest. Aynı kural #5 :76'da Doğrulama notuyla (`out_of_scope→pending` 409, `done→pending` 409, K10 sonrası kabul), #44 :122'de "aynı kural, RR-F018" notuyla var. §4 :229 satırı eklenmiş. Sistem yolları mockup'ta da done aşamayı koruyor (completion.ts:192, rules.ts:91), kural hepsiyle tutarlı | 1f3a107 |
| RR-F019 | Kapandı | #3 :74 INV-28 :36'nın yeni metniyle birebir. Yeniden açma işlemi adım durumuna dokunmuyor, ardından aynı transaction'da INV-26 ve INV-25 çalışıyor. Manuel adım `done` kalıyor. Koşulu bozulan adım `activatedAt` doluysa `pending` oluyor ve eski `due` kalıyor (completion.ts:198-203: `step.due ?? …`), boşsa `locked` oluyor (completion.ts:204-206). #16 :87 #3'e bağlanmış. S24 §5.2 :292'de "INV-28 (Murat onayı, 2026-10-06)" dayanağıyla yazılmış. Doğrulama notu var (02 → #39c → K10 → `discovery_form` `pending`, `phase_approval` açılmaz) | dd84070 |
| RR-F020 | Kapandı (yan etki → RR-F027) | §1 :22 ve #3 :74: kapsama dönen aşama `locked` olur, aynı transaction'da ve proje kilidi altında akış motoru açar (önceki aşama geçilmişse ya da aşama `independent` ise; flow.ts:37 ile uyumlu, bir istisnası RR-F027'de). `applyInstallType`/`applyLlmChoice` güncel seçimle idempotent olarak yeniden uygulanır. `not_started` → `409`, INV-25'in sonucu olarak yazılmış; S25 açılmamış (§5 :261, Murat kararı). Doğrulama notunda üç senaryo var. §4 :228 satırı eklenmiş | dbfe25a |
| RR-F021 | Kapandı | §1 :22 ve #5 :76: manuel adımda `out_of_scope → done` önce `locked` yapılıyor, akış motoru çalışıyor. Adım açılırsa `done` uygulanıyor; açılmazsa `409 "Adımın sırası gelmedi"` dönüyor, transaction geri alınıyor ve adım `out_of_scope` kalıyor. AI `step_update` da aynı kurala tabi. Doğrulama notu var. §4 :227 güncellenmiş | b8b2fdf |
| RR-F022 | Kapandı (yan etki → RR-F029) | #5 :76: `customer_approval` elle `done` → `409 "Müşteri onayı Go-Live onayıyla kaydedilir"`, `out_of_scope` serbest; açık taahhüt varken `commit_check` elle `done` → `409 "Açık taahhüt var"`; AI dahil. #38 :109'da "tek `done` yolu" yazıyor. S22 :268 genişletilmiş, §4 :231 eklenmiş. S23 açılmadı, S22'ye katıldı (Murat kararı) | 71bbdfa |
| RR-F023 | Kapandı (sözleşmede); kalıntı → RR-F031 | #16 :87'de yüklem akış motoru kuralına bağlanmış (`previousStep`, flow.ts:14-19, 52-59): `independent` adım hemen açılıyor; değilse önceki ve kapsam dışı olmayan en yakın adım `done` ise ya da böyle bir adım yoksa açılıyor. Termin `addBusinessDays(max(startDate, bugün), durationDays \|\| 1)` (flow.ts:50, 61). Done aşama yolu, açık aşama yolu ve #14 için tek mekanizma tanımlanmış. §4 :220, INV-28 :36 ve ADR-0005 :87 aynı metni taşıyor. Kalıntı: PRODUCT_SPEC :166 ve ADR-0004 :37'de eski yüklem duruyor | bd90f8c |
| RR-F024 | Kapandı | §1 :17: kilit listesine #14 (`adapt:<takım>`), #16 (`saas_env`) ve #2a eklenmiş. Kilitten sonra yeniden okuma kuralı ve kilit altında yapılacak ön koşul kontrolleri (#3, #5, #13, #14, #16, #38) yazılmış. §1 :18'de parity doğrulamaları var (`completePhase(05) ∥ addTeam`, `PATCH step done ∥ setInstallChoice(saas)`, iki kırmızı → tek uyarı). #39c :112 kilit sırası: önce projeler `id` artan sırada, sonra config satırı. INV-08 :16 round 2 ekiyle aynı | 1bacd80 |
| RR-F025 | Kapandı | #3 :74 "Ayrıntılar" bölümü: `phase_approval` yeni aksiyon olarak açılıyor, `ruleKey` ile idempotent (flow.ts:74, 85-92); yeniden açma isteğinde `actualEnd`/`planEnd` → `400`; kilitli adımlar akışla açılıyor | a24fb28 |
| RR-F026 | Kapandı | §4 :233-238'de altı satır var (S20 sahip, #2a tekilleştirme, #4 done/oos, kilitli `due`, aynı takım adı, pasif takip). RR-F018/20/21/22 satırları da :229, :228, :227, :231'de | b9e2086 |

### ADR-0005 K14–K18 ve "Round 2 — yansıtılacaklar" kontrolü
| Madde | Beklenen | Sözleşmede | Sonuç |
|---|---|---|---|
| K14 / S10 | §5.2, dayanak "Murat onayı, ADR-0005 K14 (2026-10-06)"; #12 tek yönlü | :282, #12 :83, §2.2 :136 | ✔ |
| K15 / S13 | §5.2, K15 | :285, #10 :81 | ✔ |
| K16 / S15 | #14 hedef davranış; dayanak "ADR-0005 K16, INV-28 (c)"; §4 satırı; "tek kural" ifadeleri kaldırılmış; 07 `done` → 409; proje kilidi; Doğrulama | #14 :85, §5.2 :287, §4 :221, #16 :87 "hiçbir kural `rule_review` üretmez", §1 :17 | ✔ (409'un kapsamı belirsiz → RR-F028) |
| K17 / S17 | #2c hedef davranış; kayıt başına audit; aynı transaction; §4 satırı | #2c :71, §5.2 :289, §4 :222 | ✔ |
| K18 / S18 | §5.2, K18; #7 | :290, #7 :78 | ✔ |
| INV-28 metni / S24 | §5.2'de; eski `due` kalır | :292, #3 :74 | ✔ |
| RR-F023 | #3, #16 ve §4'te yüklem akış motoru kuralına bağlanmış; `addBusinessDays(bugün…)` düzeltilmiş | #16 :87, §4 :220; #3 :74 "adımdaki K11 / RR-F002 ile aynı mekanizma" | ✔ |
| INV-08 round 2 eki | #14 ve `saas_env` kilit listesinde; `completePhase(05) ∥ addTeam` Doğrulaması | §1 :17-18 | ✔ |
| Madde 8 (REV-F017) geçersiz | S10/S13/S15/S17/S18 §5.1'e geri taşınmamalı | §5.1 :263-268'de yalnızca S20–S22 var | ✔ |

### Karar tablosu (round 3'te değişen kurallar)
Sütunlar: Girdi → spec/INV/ADR'ye göre beklenen → sözleşme → mockup → Doğrulama notu → sonuç.

| # | Girdi | Beklenen | Sözleşme | Mockup | Doğr. | Sonuç |
|---|---|---|---|---|---|---|
| **(a) §1 kilit ayrımı — adım** |||||||
| A1 | Aşama `locked`, adım `out_of_scope` → elle `pending` | 409 (INV-25) | §1 :22, #5 | izin verir (completion.ts:239-244) | var | ✔ |
| A2 | Aşama `done`, adım `done→pending` ya da `out_of_scope→pending` (PATCH/AI) | 409 (INV-08, INV-28) | §1 :22, #5, #44 | izin verir (StepDialog) | var | ✔ |
| A3 | Aşama `done`, `ownerId`/`ball`/`due` | serbest (`due` gerekçeli, INV-06) | §1 :22, #5 | — | — | ✔ |
| A4 | Aşama `done`, veri adımının koşulu sağlanır ya da bozulur | sağlanırsa `done`; bozulursa geri açılmaz (INV-26) | §1 "otomatik tamamlama kilidi aşabilir" | completion.ts:180-192 | — | ✔ |
| A5 | Açık aşama, `out_of_scope→pending`, önceki adım açık | `locked` kalır | #5 | doğrudan `pending` | var | ✔ |
| A6 | Açık aşama, `out_of_scope→in_progress`, önceki adım `done` | açılır; sonuç durum `pending` mı `in_progress` mı? | "akış motoru … açar" → `pending`; `→ done`'da ise istenen durum uygulanıyor | doğrudan `in_progress` | yok | ◐ RR-F030 |
| A7 | Manuel adım `out_of_scope→done`, önceki adım açık / `done` | 409 + rollback / `done` ve `activatedAt` dolu | #5, §1 | doğrudan `done` | var | ✔ |
| A8 | Veri adımı `out_of_scope→done` | 409 (`manualStatusError`) | #5 | completion.ts:233 | — | ✔ |
| **(b) §1 / #3 — aşamanın kapsama dönüşü** |||||||
| B1 | Aşama `locked` → herhangi bir elle durum | 409 | #3 "kilitli aşama 409" | store.tsx:240 | — | ✔. Not: `locked` aşama elle `out_of_scope` yapılamıyor, yani API'de her `out_of_scope` aşama daha önce açılmış (`activatedAt` dolu) |
| B2 | 03 `out_of_scope→in_progress`, 02 geçilmiş | `locked` → akış açar (`activatedAt`, `actualStart` boşsa bugün) | #3 | doğrudan `in_progress` (store.tsx:244) | var | ✔ (flow.ts:37-38) |
| B3 | 03 `out_of_scope→in_progress`, 02 K10/K2 ile yeniden açılmış | INV-25 "açılmış … tekrar kilitlenmez" ve K10 "sonraki aşamalar değişmez" (03 hiç kapsam dışı yapılmasaydı `in_progress` kalırdı) | 03 `locked` olur; daha önce açılmış `pending`/`in_progress` adımları ve açık `phase_approval` aksiyonu kilitli aşamada kalır | — | Doğrulama "adımları açılmaz" diyor, oysa adımlar zaten açık | ✘ RR-F027 |
| B4 | 00 `out_of_scope→in_progress` (önceki aşama yok) | akış açar (flow.ts:37 `!prev`) | yüklem yalnızca "önceki aşama geçilmişse ya da `independent`" | — | yok | ◐ RR-F027 |
| B5 | SaaS projede 03 geri alınır | ONPREM `out_of_scope`, `saas_env` `locked` oluşur; kural akıştan önce çalışır (§1 :16) | #3 | rules.ts:100 atlıyor | var | ✔ |
| B6 | Elle `not_started` | 409 | #3 | izin verir | — | ✔ |
| B7 | `done → not_started/out_of_scope` | 409 | #3, §5.2 :293 | izin verir | — | ✔ |
| B8 | `in_progress → out_of_scope`, `phase_approval` açık | aksiyon iptal edilmeli (aşama artık #4 ile kapanamaz, RR-F017) | yazılmamış | flow.ts:83-84 yalnızca `done` ya da aktif aşamada kapatır → aksiyon açık kalır | yok | ✘ RR-F032 |
| **(c) #3 K10 yeniden açma (INV-28)** |||||||
| C1 | `done→in_progress`, gerekçeli | onay ve `actualEnd` temizlenir, adımlara dokunulmaz, ardından INV-26/25 | #3 | — | var | ✔ |
| C2 | Koşulu bozulan veri adımı, `activatedAt` dolu / boş | `pending` (eski `due`) / `locked` | #3 | completion.ts:198-206 | var | ✔ |
| C3 | `phase_approval` | yeni aksiyon, idempotent | #3 | flow.ts:74, 85 | — | ✔ |
| C4 | İstekte `actualEnd`/`planEnd` | 400 | #3 | — | — | ✔ |
| C5 | #38 sonrası 07 K10 ile açılır, `customer_approval` elle `done→pending` yapılır | adım yeniden `done` yapılabilmeli ya da geri alınamamalı | `→pending` serbest (aşama açık); `done` hem #5'te hem #38'de 409 ("onay zaten var") → 07 kapanamaz | — | yok | ✘ RR-F029 |
| **(d) #16 K2 / K11** |||||||
| D1 | Kapsama giren adım: `independent` / önceki kapsam içi adım `done` / önceki adım yok / önceki adım açık | `pending` / `pending` / `pending` / `locked` | #16 | flow.ts:52-59 | var | ✔ |
| D2 | Termin | `max(startDate, bugün) + (durationDays \|\| 1)` iş günü | #16 | flow.ts:50, 61 | — | ✔ |
| D3 | A→B→A, idempotans, ters yön | INV-09, INV-28 | #16 | rules.ts:89-96, 134-138 | var | ✔ |
| D4 | 07 `done` (canlı) iken On-prem'e geçiş, 03 `done` | K16'daki canlı proje koruması K2 için yazılmamış | 03 açılır | — | — | Açık soru |
| **(e) #14 K16** |||||||
| E1 | 05 `done`, 07 açık | 05 `in_progress`, `adapt:<takım>` `pending` (`dependency: independent`, store.tsx:340), `rule_review` yok | #14 | `out_of_scope` + `rule_review` (store.tsx:358-359) | var | ✔ |
| E2 | 05 `done`, 07 `done` | 409 | #14, INV-28 | aynı `rule_review` | var | ✔ |
| E3 | 05 `out_of_scope`, 07 açık | adım `out_of_scope`, aşama açılmaz | #14 | store.tsx:341 | — | ✔ |
| E4 | 05 `out_of_scope` ya da K10 ile `in_progress`, 07 `done` | INV-28 :36 "(c)'de 07 `done` ise 409" (yalnızca 05 `done` iken); ADR-0005 :172 ve #14 genel okunabiliyor | belirsiz | — | yok | ◐ RR-F028 |
| E5 | 05 açık/kilitli; işaretsiz `adapt:general` | `adapt:<takım>` `locked` + akış; `adapt:general` → `out_of_scope` | #14 | store.tsx:360-366 | — | ✔ |
| E6 | `completePhase(05) ∥ addTeam` | açık zorunlu adımla `done` aşama oluşmaz | §1 :17-18 | — | parity | ✔ |
| **(f) #5 / #38 Go-Live manuel adımları** |||||||
| F1 | `customer_approval` PATCH `done` | 409 | #5, #38 | izin verir | var | ✔ |
| F2 | Açık taahhüt varken `commit_check` PATCH `done` | 409 | #5 | izin verir | var | ✔ |
| F3 | `customer_approval` `out_of_scope` → 07 #4 ile kapanır | B.4 "onaylayan kişi ve tarih zorunlu" | S22 güvenli varsayımı "`out_of_scope` serbest" | — | — | Açık soru |
| F4 | `gonogo` `out_of_scope` → #38 | — | her zaman 409 | — | — | Açık soru (round 2'den, hâlâ yazılmamış) |
| **(g) Kilit** |||||||
| G1 | #2a ∥ #2a | tek uyarı | §1 :17-18 | — | parity | ✔ |
| G2 | #5 kilitten önce okur ∥ #16 SaaS | adım `out_of_scope` kalır ya da 409 | §1 :17-18 | — | parity | ✔ |
| G3 | #39c birden çok proje | önce projeler `id` artan sırada, sonra config | #39c :112 | — | — | ✔ |

INV çapraz kontrolü:
- INV-06 ✔: #3 kapsama dönüşü "durum" gerekçesi alıyor; K16/K2 gerekçesi sistemce yazılıyor.
- INV-07 ✔: yeniden açma `baselineEnd`'e dokunmuyor.
- INV-08 ✔
- INV-09 ✔: #3'te kurallar yeniden uygulanıyor, idempotent.
- INV-25 ◐: RR-F027.
- INV-26 ✔
- INV-28 ✔: RR-F028 metin belirsizliği.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RR-F027 | Medium | INV-25, INV-28 (K10 "sonraki aşamalar değişmez"), spec "Sıralı akış" :322 | docs/API_CONTRACT.md:22, :74, :228; flow.ts:37, 83-84; store.tsx:240; alerts.ts:50, 61 | **Kapsama dönen aşamanın `locked` dalı, daha önce açılmış bir aşamayı yeniden kilitliyor.** `locked` aşama elle değiştirilemiyor (#3 "kilitli aşama 409", store.tsx:240). Bu yüzden API'de her `out_of_scope` aşama daha önce akışla açılmış: `activatedAt` dolu, ilk adımları `pending`. `locked` dalı yalnızca önceki aşama sonradan K10/K2 ile yeniden açıldığında tetikleniyor. **Senaryo:** 03 `in_progress` iken içinde `vpn_req` `pending`. 03 `out_of_scope` yapılıyor. 02 K10 ile yeniden açılıyor. 03 kapsama geri alınıyor ve sözleşmeye göre `locked` oluyor. Sonuç: (1) Kilitli aşamada `pending`/`in_progress` adımlar kalıyor ve iş sayılıyor: `item_late`, `waiting_customer` (alerts.ts:50, 61, aşama filtresi yok), My Work, yönetim raporu. Adım sahibi bu adımı elle değiştiremiyor (`409 "Aşamanın sırası gelmedi"`). (2) Açık `phase_approval` varsa kilitli aşamada kalıyor (flow.ts:84 yalnızca aktif aşamada iptal ediyor). (3) Çelişki: 03 hiç kapsam dışı yapılmasaydı K10'a göre `in_progress` kalacaktı ("sonraki aşamalar değişmez"). Kapsam dışına alıp geri almak, aşamayı yeniden kilitliyor. #3 Doğrulama notundaki "03 `locked` kalır ve adımları açılmaz" ifadesi de bu durumla uyuşmuyor, çünkü adımlar zaten açık. **Ek:** yüklemde "önceki aşama yoksa" dalı eksik (flow.ts:37 `!prev`). Metin harfiyen uygulanırsa 00 Satış Devri geri alındığında kalıcı olarak `locked` kalır. Round 2 RR-F020 önerimde bu dal eksikti. | Güvenli varsayım yazılmalı ve §5.1'e bir S-maddesi açılmalı (Murat kararı). Önerilen seçenek, INV-25 "açılmış … tekrar kilitlenmez" ve completion.ts:198-206'daki `activatedAt` emsaliyle uyumlu olan **(b)**: `activatedAt` dolu aşama doğrudan `in_progress`'e döner (adımlarına dokunulmaz, kurallar yeniden uygulanır, ardından akış çalışır); `activatedAt` boş aşama `locked` olur ve akışla açılır (yüklem: önceki aşama yoksa, `independent` ise ya da önceki aşama geçilmişse). Alternatif **(a)**: `locked` kalır ve aşamanın açık adımları da `locked` yapılır (`activatedAt` ve `due` temizlenir). Bu seçenek spec :322 ile çeliştiği için Murat onayı gerekir. Doğrulama: 02 K10 ile açıkken 03 geri alınır → (b)'de 03 `in_progress` olur ve `vpn_req` `pending` kalır; 00 geri alınınca açılır. §4 :228 de buna göre güncellenmeli. |
| RR-F028 | Low | ADR-0005 K16, INV-28 (c) | docs/API_CONTRACT.md:85, :221; docs/INVARIANTS.md:36; docs/adr/0005-f0-01-contract-decisions.md:172 | `addTeam`'in 07 `done` iken 409 dönmesinin kapsamı belirsiz. INV-28 bunu "(c)'de", yani yalnızca 05 `done` iken söylüyor. #14 ve ADR-0005 :172 ise genel okunabiliyor. 05 `out_of_scope` iken (#14 "mockup gibi `out_of_scope` oluşur") ya da canlıya geçişten sonra K10 ile `in_progress` yapılmışken 07 `done` ise sonuç ne? İki BE okuması farklı sonuç verir: 201 + `out_of_scope`/`locked` adım ya da 409. | #14'e tek cümle eklenmeli: "07 `done` ise 05'in durumundan bağımsız olarak `409`" ya da "yalnızca 05 `done` iken `409`". Doğrulama satırına "05 `out_of_scope` + 07 `done`" eklenmeli. Gerekirse INV-28 metni denetim oturumunda hizalanır. |
| RR-F029 | Low | Spec B.4, S22 (RR-F022), RBAC Karar 9, ADR-0005 K10 | docs/API_CONTRACT.md:76, :109 | **`customer_approval` için çıkmaz durum.** #38 sonrası 07 kapanıyor. 07 K10 ile yeniden açılıyor (`in_progress`); manuel adım `done` kalıyor. Bu noktada adım elle `done→pending` yapılabiliyor, çünkü aşama artık `done` değil (RR-F018 kuralı uygulanmıyor). Sonra adımı yeniden `done` yapmanın yolu yok: #5 `409 "Müşteri onayı Go-Live onayıyla kaydedilir"`, #38 ise `409` (onay zaten var). 07 yalnızca adımı semantik olarak yanlış biçimde `out_of_scope` yaparak kapanabiliyor. | #5'e eklenmeli: "projede `goLiveApproval` varken `customer_approval`'ın elle `done`'dan çıkışı `409`" (adım onay kaydını yansıtır). Alternatif: onay varken elle `done` serbest. Doğrulama: #38, ardından K10 ile 07 açılır, ardından `customer_approval` PATCH `pending` → 409. |
| RR-F030 | Low | INV-25, RR-F021 | docs/API_CONTRACT.md:22, :76 | Kapsam dışından dönüşte istenen durumun uygulanması tutarsız. `out_of_scope → done` isteğinde adım açılırsa istenen `done` uygulanıyor. `out_of_scope → in_progress` isteğinde ise adım akışla `pending` açılıyor ve istenen `in_progress`'in uygulanıp uygulanmadığı yazılmamış. Yanıt istenen durumdan farklı olabilir; BE ve FE farklı varsayabilir. | #5'e tek cümle: "adım açılırsa istenen `in_progress` de aynı transaction'da uygulanır; açılmazsa adım `locked` kalır ve yanıt `200` + `effects` döner" (ya da açıkça "`pending` açılır"). Doğrulama: önceki adım `done` iken `out_of_scope → in_progress` isteğinin sonucu. |
| RR-F031 | Low | ADR-0005 K11 netleştirmesi, AGENTS.md:10 ("tek doğruluk kaynağı: PRODUCT_SPEC") | docs/PRODUCT_SPEC.md:166; docs/adr/0004-f0-pre-decisions.md:37; docs/adr/0005-f0-01-contract-decisions.md:142, :237 | RR-F023 sözleşmede, INV-28'de ve ADR-0005 :87'de kapandı. Ancak spec :166 ve ADR-0004 K2 netleştirme notu (:37) hâlâ "öncesindeki **zorunlu** adımlar tamamsa" diyor. Spec tek doğruluk kaynağı olduğu için F4-01 planı yanlış yüklemi çekebilir. Ayrıca ADR-0005 :142 artık var olmayan "S23"e atıf yapıyor (S22'ye katıldı), :237'deki REV-F004 listesinde de S21'in güncel dokuz maddesi yok. | Denetim oturumu yapar, builder'ın işi değil: spec :166 ve ADR-0004 :37 "akış motorunun kuralı (INV-28)" diye güncellenir; ADR-0005 :142 "S22" olur, :237 S21'e yönlendirilir. |
| RR-F032 | Low | INV-08, RR-F017, ADR-0005 K18 | docs/API_CONTRACT.md:74 ("`out_of_scope` → akış motoru sonraki aşamayı açar"), :75; flow.ts:83-84 | Aşama `in_progress → out_of_scope` yapıldığında açık `phase_approval:<phaseId>` aksiyonu kapanmıyor. flow.ts yalnızca `done` aşamada (`done`) ya da aktif ve hazır olmayan aşamada (`cancelled`) kapatıyor. #4 artık `out_of_scope` aşamaya `409` döndüğü için aksiyon çözülemiyor: CSM'in açık işlerinde ve 2 iş günü sonra `item_late` uyarısında kalıyor. Mockup davranışı bu, ama round 2'deki RR-F017 hedefiyle birlikte öksüz kalıyor. | #3'e eklenmeli: "aşama `out_of_scope` olunca açık `phase_approval` aksiyonu `cancelled` olur (`Otomatik kural:`)". §4'e satır eklenmeli. Doğrulama: hazır aşama `out_of_scope` yapılınca aksiyon `cancelled`. |

### Düzeltme direktifi
Hiçbiri merge engeli değil. Medium bulgu BACKLOG'a girer; Low bulgular aynı turda yapılabilir, yapılmazsa BACKLOG'a girer. Satır numaraları 4563ca2'ye göredir.
1. **[RR-F027] (Medium)** `docs/API_CONTRACT.md` §1 :22, #3 :74, §4 :228:
   - **Güvenli varsayım:** `activatedAt` dolu aşama kapsama dönünce `in_progress` olur (adımlara dokunulmaz, #16 kuralları yeniden uygulanır, ardından akış çalışır). `activatedAt` boş aşama `locked` olur ve akışla açılır; yüklem: önceki aşama yoksa, `independent` ise ya da önceki aşama `done`/`out_of_scope` ise.
   - §5.1'e S-maddesi açılır (alternatif (a): `locked` + açık adımların yeniden kilitlenmesi; spec :322 ile çelişir).
   - Doğrulama notu yeniden yazılır: 02 K10 ile açıkken 03 geri alınır → 03 `in_progress`, açık adımlar korunur; 00 geri alınınca açılır.
2. **[RR-F028] (Low)** #14 :85: 07 `done` iken `409`'un 05'in durumundan bağımsız olup olmadığı tek cümleyle yazılır. Doğrulamaya "05 `out_of_scope` + 07 `done`" eklenir.
3. **[RR-F029] (Low)** #5 :76: `goLiveApproval` varken `customer_approval`'ın elle `done`'dan çıkışı `409` döner. Doğrulama: #38, ardından K10 ile 07 açılır, ardından PATCH `pending` → 409.
4. **[RR-F030] (Low)** #5 :76 ve §1 :22: `out_of_scope → in_progress` isteğinin sonuç durumu yazılır.
5. **[RR-F032] (Low)** #3 :74: aşama `out_of_scope` olunca açık `phase_approval` `cancelled` olur. §4'e satır eklenir.

Uygulama rolü dışında (denetim oturumu):
- **[RR-F031]** PRODUCT_SPEC :166, ADR-0004 :37, ADR-0005 :142 ve :237 metinleri hizalanır.
- RR-F027 seçimi Murat kararıdır.

### Açık sorular / öneriler (engelleyici değil)
- **Canlı projede K2:** 07 `done` iken kurulum tipi değişikliği 03'ü (ve 01'i) yeniden açıyor. K16'daki "proje canlıyken 409" koruması K2 için yok. Bilinçli mi?
- **`customer_approval` kapsam dışıyken Go-Live:** S22'ye göre `customer_approval` `out_of_scope` yapılabiliyor. Bu durumda 07, `GoLiveApproval` kaydı olmadan #4 ile kapanıyor (spec B.4 :347). `gonogo` `out_of_scope` iken #38 hep 409 döndüğü için iki kural birlikte "onaysız Go-Live" yolunu açık bırakıyor. Murat bunu bilinçli kabul ediyor mu? S22'de açıkça yazılabilir.
- **Kapsam dışı aşamadaki açık adımlar:** Aşama `out_of_scope` yapıldığında içindeki `pending`/`in_progress` adımlar iş sayılmaya devam ediyor (alerts.ts:50, 61; aşama filtresi yok). Bu mockup davranışı ve sözleşmede yazılmamış. INV-25 "iş sayılmaz" kapsamına `out_of_scope` aşamanın adımlarının girip girmediği F6 öncesinde netleşmeli.
- **Round 2'den kalanlar:** öneri oluştuktan sonra tür kapatılırsa ya da hedef değişirse onay davranışı; #32/#43 için `ON CONFLICT` ve kısmi tekil index'in pg-mem desteği (F1-00 parity listesi). İkisi de hâlâ açık.
- **Yazım:** §1 :17'de "(#3 `done → in_progress`, #16 K2) adım durumunu" ifadesinde virgül eksik; bir sonraki düzenlemede düzeltilebilir.
