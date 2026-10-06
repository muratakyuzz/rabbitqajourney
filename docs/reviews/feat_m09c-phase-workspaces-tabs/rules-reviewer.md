## rules-reviewer — feat/m09c-phase-workspaces-tabs @ 9171430 (round 2)
**Karar:** APPROVE (iki Medium bulgu BACKLOG'a gider, Low'lar isteğe bağlı)

Round 1'deki High bulgu (RUL-01) ve Medium bulgu (RUL-02) kodda doğru düzeltilmiş. RUL-04 ve RUL-06 da kapandı. RUL-03'teki test boşluklarının çoğu kapandı ama hepsi değil (aşağıda RUL-07 ve RUL-09). Kodu okuyarak doğruladım; testleri ben çalıştırmadım, bu iş qa-verifier'ın. Demo store'da veritabanı yok: tüm testler Vitest L1/L3, pg-mem ya da parity motoru bu PR'a uygulanmıyor. "Transaction" burada tek bir `setState` updater'ı anlamına geliyor ve kural, audit ve `settleAll` aynı updater'da çalışıyor (store.tsx:106-113).

### İstenen ek kontrol: `addTeam`'in üç durumu
| # | Girdi | Spec'e göre beklenen (plan §6.2 + AC7/AC19) | Koddaki davranış (store.tsx `addTeam`) | Test |
|---|---|---|---|---|
| 1 | 05 `out_of_scope` | Adım `out_of_scope` doğar. Aksiyon açılmaz. `adapt:general` dalı çalışmaz. | Doğru. `phaseClosed` adımı `out_of_scope` yapıyor, create reason `Otomatik kural: takım eklendi — 05 Uyarlama aşaması kapsam dışı`. `ensureReviewAction` yalnızca `phaseDone` iken çağrılıyor. `adapt:general` dalı `else if (!phaseClosed)` ile korunuyor. | **Var.** store.test.tsx:415 "REV-02/RUL-02: 05 out_of_scope — new team step is out_of_scope, no action opens, the existing team's step is untouched". Adım durumunu, reason'ı, aksiyon olmadığını ve mevcut takım adımının değişmediğini assert ediyor. Eksik: `p_garanti`'de `adapt:general` adımı yok, yani "`adapt:general`'e dokunulmaz" korumasını hiçbir test sınamıyor (RUL-07). |
| 2 | 05 `done` | Adım `out_of_scope` doğar. Reason `…05 Uyarlama aşaması tamamlanmıştı`. `ensureReviewAction` çalışır: CSM, ball csm, due `addBusinessDays(todayISO(),2)`, gerekçe `Takım eklendi: <t>; 05 Uyarlama tamamlanmıştı`. 05 `done` kalır. Aynı adla ikinci çağrı no-op olur. | Doğru (`if (phaseDone) next = ensureReviewAction(...)`). `ensureReviewAction` (rules.ts:20-48) idempotent ve termini `holidayDates(s.holidays)` ile hesaplıyor. | **Var.** store.test.tsx:385 "REV-02/RUL-02: 05 done — new team step is out_of_scope, a rule_review action opens for the CSM, phase stays done, second addTeam is a no-op". Adım durumunu, reason'ı, aksiyonun open/ownerId/ball/title alanlarını, 05'in done kalmasını ve ikinci çağrının adım/audit/aksiyon üretmemesini assert ediyor. Eksik: `due` assert edilmiyor (RUL-09). |
| 3 | 05 aktif (`in_progress`) | Adım `locked` olarak oluşur ve aynı updater'daki `settleAll`/`advanceFlow` onu hemen `pending` yapar (AC7: "05 aktif bir projede adım akışla hemen pending olur"). Aksiyon açılmaz. İşaretsiz `adapt:general` `out_of_scope` olur. | Doğru. Adım `locked` doğuyor; flow.ts:50-60 aktif aşamadaki `independent` adımı `pending` yapıyor ve status/due audit'i yazıyor. Aksiyon yok. `adapt:general` dalı çalışıyor. | **Yok.** store.test.tsx:377 "no rule_review action opens while 05 is locked or active" yalnızca `p_garanti`'yi kullanıyor (05 locked). Aktif 05 için seed'de hazır bir fixture var (`p_perakende`, seed.ts:463-466) ama hiçbir test onu `addTeam` ile kullanmıyor. **RUL-07** |
| 3b | 05 `locked` | Adım `locked`, aksiyon yok | Doğru | Var: store.test.tsx:335 (alanlar + ikinci çağrı no-op), :377 (aksiyon yok), :367 (order = max+1) |

Sonuç: 1. ve 2. durumun gerçek testi var. 3. durumun (aktif 05) testi yok; ayrıca `adapt:general` → `out_of_scope` alt kuralının hiçbir durumda testi yok (repoda `takım tanımlandı` reason'ını assert eden test bulunmuyor). Bunu RUL-07 olarak raporluyorum.

### Karar tablosu: otomatik kurallar (rules.ts), round 1 ile karşılaştırmalı
| # | Tetik / durum | Beklenen | Kod @ 9171430 | Test |
|---|---|---|---|---|
| 1 | SaaS→On-prem, ONPREM adımı `out_of_scope`, aşama `done` | Durum değişmez, aksiyon açılır | Doğru (rules.ts:93-94) | completion.test.ts:707 (reqdoc); **:957 tüm ONPREM_KEYS** (round 1'deki boşluk kapandı) |
| 2 | On-prem→SaaS, aşama `done` | `cancelReviewAction` | Doğru (:95-96) | :745, :889 (status audit'i, oldValue `open`) |
| 3 | null→On-prem ilk seçim | Gerekçe metni `…seçildi` | Doğru (:79) | Yok (Low, round 1'den kalan) |
| 4 | Aşama `out_of_scope` | Durum değişmez, aksiyon yok | Doğru (:100) | :782 |
| 5 | Aşama aktif veya kilitli | Bugünkü davranış | Doğru | store.test.tsx:270, :586 |
| 6 | →SaaS, `saas_env` yok, 03 `done` | `out_of_scope` create audit (plandaki reason) + aksiyon | Doğru. Reason artık `Otomatik kural: kurulum tipi SaaS — 03 Kurulum aşaması tamamlanmıştı` (:123-125), **RUL-04 kapandı** | :824 (adımın out_of_scope olarak oluşması ve aksiyon). Create reason assert edilmiyor |
| 7 | →SaaS, `saas_env` var ve `out_of_scope`, 03 `done` | Aksiyon açılır ya da yeniden açılır | Doğru (:110) | :824 (yeniden açma, aynı id, adet 1) |
| 8 | **SaaS→On-prem, `saas_env` var, 03 `done`** | **`cancelReviewAction`** | **Doğru, düzeltildi (:137-138). RUL-01 kapandı** | :824 (cancelled, aynı id, status audit'i). Reason metni plan kalıbında değil (RUL-08) |
| 9 | SaaS→On-prem, `saas_env` `out_of_scope` değil, 03 `done` | Aksiyon yok | Artık cancel (no-op), aksiyon açılmıyor. Round 1'deki yanlış `ensure` kalktı | Yok (pratikte erişilemez) |
| 10 | LLM →gpu, `model_install` oos, 03 `done` | Aksiyon açılır, gerekçe `LLM tercihi X→… değişti; 03 …` | Doğru (:196-197) | :766, store.test.tsx:621 |
| 11 | LLM gpu→gpu dışı | Cancel | Doğru | :766 |
| 12 | `in_progress` iken yeniden tetikleme | Yeni aksiyon açılmaz | Doğru (:22-23) | **:853** (yeni) |
| 13 | `done` sonrası yeniden tetikleme | Yeni `open` aksiyon, `done` kayıt değişmez | Doğru | **:870** (yeni) |
| 14 | A→B→A yeniden açma | Status/due/owner/title güncellenir, alan başına audit yazılır | Doğru (:27-37) | **:889** status ve ownerId audit'lerini assert ediyor. due/title değerleri değişmediği için audit'leri sınanmıyor (RUL-09) |
| 15 | `action_due_soon` | Açılış anında sarı uyarı (plan :848) | Doğru | **:922** (yeni) |
| 16 | `item_late` | Termin geçince kırmızı uyarı | Doğru | :812 |
| 17 | LLM_ACTIONS döngüsü `rule_review:*` aksiyonuna dokunmaz | Yapısal ayrım | Doğru (:167 üyelik yalnızca LLM_ACTIONS anahtarları) | :933 var ama ayırt edici değil: iptal ve yeniden açma `cancel/ensureReviewAction` yolundan da gelebiliyor, testin kendi yorumu da bunu söylüyor (:948). Döngü yanlışlıkla `rule_review:*` aksiyonunu içerse de test geçer (RUL-09) |
| 18 | Termin, iş günü | `addBusinessDays` + tatiller | Doğru (:26) | :725, :802. NOW tatil arifesine sabitlenmediği için :802 hâlâ totolojik (round 1 önerisi uygulanmadı, Low) |
| 19 | Müşteri raporu | `isCustomerVisible:false` | Doğru (:41) | Dolaylı |
| 20 | `ensureReviewAction` imzası | Plan: `(s, pid, step, phase, trigger, mk, reason)` | Kullanılmayan `phase`/`trigger` parametreleri kaldırılmış (`(s,pid,step,mk,reason)`). Davranış farkı yok, sapma zararsız | — |

### Karar tablosu: completion.ts ve takım adı
| Girdi | Beklenen | Kod | Test |
|---|---|---|---|
| `conditionFor` için `STEP_CONDITIONS` anahtarı, `adapt:general` ve `adapt:<t>` | Plan §6.2'deki gibi | Doğru, bu turda değişmedi | completion.test.ts:667, :679, :687 |
| `addTeam(pid, "general")` ya da `"General "` | Reddedilir (RUL-06) | Store'da `team.trim().toLowerCase()==="general"` ise `s` döner. UI'da DiscoveryContent.tsx:31-33 toast gösteriyor. **RUL-06 kapandı** | store.test.tsx:357 |
| Yeni takım adımının `order` değeri | Aşamadaki max order + 1 | Doğru (store.tsx `Math.max(...)+1`) | store.test.tsx:367 |

### Karar tablosu: audit ve gerekçe
| Olay | Beklenen reason | Kod | Test |
|---|---|---|---|
| addTeam, 05 done, adım create | `Otomatik kural: takım eklendi — 05 Uyarlama aşaması tamamlanmıştı` | Doğru | store.test.tsx:395 |
| addTeam, 05 oos, adım create | `…05 Uyarlama aşaması kapsam dışı` | Doğru | store.test.tsx:432 |
| addTeam, review aksiyonu create | `Otomatik kural: Takım eklendi: <t>; 05 Uyarlama tamamlanmıştı` | Doğru | Yalnızca title üzerinden (`toContain`), :402 |
| `saas_env` create (03 done) | Plandaki kalıp | Doğru | Yok |
| `saas_env` review iptali (SaaS→On-prem) | Plan "Gerekçe metni": hangi değişiklik, hangi aşama | `Otomatik kural: kurulum tipi değişti, gözden geçirme gereksiz`. Ne eski→yeni değeri ne aşamayı içeriyor (**RUL-08**) | :841 bu metni sabitliyor |
| Hayalet audit | Kural, audit ve settle aynı updater'da | Doğru | — |

### Round 1 bulgularının durumu
| Round 1 ID | Durum | Kanıt |
|---|---|---|
| RUL-01 (High) | Kapandı | rules.ts:137-138; completion.test.ts:824 |
| RUL-02 (Medium) | Kapandı | store.tsx `phaseClosed` / `else if (!phaseClosed)`; store.test.tsx:415 |
| RUL-03 (Medium) | Kısmen kapandı | (a)–(g) ve (i) var. (h) ayırt edici değil. AC7'nin aktif 05 durumu ile `adapt:general` gizleme kuralı hâlâ testsiz → RUL-07 ve RUL-09 |
| RUL-04 (Low) | Kapandı | rules.ts:123 |
| RUL-05 (Low, değişiklik notu) | Büyük ölçüde kapandı | Backlog tablosu düzeltilmiş (RUL-05 m09a → :208; RUL-08 testi aynı-act sınırlaması açık soru olarak belgelenmiş; RUL-02 `p_lojistik`). Bir yeni hata var: AC7 satırı `completion.test.ts (addTeam kuralı)` testine atıf yapıyor ama completion.test.ts'de `addTeam` geçmiyor (grep boş) → RUL-07'nin içinde |
| RUL-06 (Low) | Kapandı | store.tsx addTeam koruması; store.test.tsx:357 |

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RUL-07 | Medium | AGENTS §6 (her AC bir testle; yeni iş kuralına negatif senaryolu test); plan AC7 ("05 aktif bir projede adım akışla hemen `pending` olur", "kilitli veya aktifken `rule_review:*` açılmaz"); plan §6.2 `adapt:general` kuralı | src/lib/rabbitqa/store.test.tsx:377; src/lib/rabbitqa/store.tsx (addTeam `else if (!phaseClosed)` dalı); docs/changes/feat_m09c-phase-workspaces-tabs.md:51 | (1) `addTeam`'in 05 aktif durumunun testi yok. :377'nin adı "locked or active" ama yalnızca `p_garanti` (05 locked) kullanıyor. `locked`→`pending` dönüşümü ve "aktifken aksiyon yok" hiç sınanmıyor. (2) Bu PR'ın yeni kuralı olan "takım eklenince işaretsiz `adapt:general` → `out_of_scope` (reason `Otomatik kural: takım tanımlandı`), işaret varsa dokunulmaz" hiçbir testte yok. `out_of_scope` ve `done` dallarındaki "`adapt:general`'e dokunma" koruması da sınanmıyor, çünkü `p_garanti`/`p_isyatirim`'de genel adım yok. Bu dal regresyona uğrarsa (ör. `!phaseClosed` koruması kalkarsa) kapsam dışı aşamada sessizce durum değişir ve audit yazılır. Hiçbir test bunu yakalamaz. Kod okumayla doğru. (3) Değişiklik notu AC7 kanıtı olarak var olmayan bir completion.test.ts testini gösteriyor. | store.test.tsx'e ekle: (a) `p_perakende` (05 in_progress) + `addTeam("Yeni")`. Beklenen: adım `pending`, `activatedAt`/`due` dolu, locked→pending status audit'i var, `rule_review:<id>` yok. (b) Takımsız ve 05'i locked bir proje (ör. `p_akbank`), genel kayıt işaretsiz + `addTeam`. Beklenen: `adapt:general` `out_of_scope`, reason `Otomatik kural: takım tanımlandı`. (c) Aynı fixture'da genel kayıtta bir madde işaretliyken `addTeam`. Beklenen: `adapt:general` değişmez. (d) Takımsız bir projede 05 `out_of_scope` ya da `done` fixture'ı + `addTeam`. Beklenen: `adapt:general` durumu ve audit adedi değişmez. Değişiklik notunun AC7 satırını gerçek test adlarıyla düzelt. |
| RUL-08 | Low | Plan §6.2 "Gerekçe metni" (hangi kural, hangi değişiklik, hangi aşama); round 1 direktif 1 | src/lib/rabbitqa/rules.ts:138; src/lib/rabbitqa/completion.test.ts:841 | `saas_env` review iptalinin reason'ı sabit `kurulum tipi değişti, gözden geçirme gereksiz`. Kardeş iptal çağrıları (:96, :111, :199) `installTypeReasonText` / LLM kalıbını kullanıyor. History'de bu iptal "SaaS→On-prem" bilgisini ve aşamayı taşımıyor. | `cancelReviewAction(next, projectId, saas.id, mk, installTypeReasonText(type, from, \`${phase.code} ${phase.name}\`))`. :841'deki beklentiyi `Otomatik kural: Kurulum tipi SaaS→On-prem değişti; 03 Kurulum tamamlanmıştı` olarak güncelle. |
| RUL-09 | Low | Plan AC19 (LLM_ACTIONS döngüsü, A→B→A due/title, addTeam due) | src/lib/rabbitqa/completion.test.ts:933-955, :889-920, :957; src/lib/rabbitqa/store.test.tsx:385-413 | (a) :933 iki mekanizmayı hâlâ ayırt etmiyor: `model_install` review aksiyonunu LLM geçişi zaten cancel/ensure ile iptal edip yeniden açıyor. (b) :889'da r1 ve r3 aynı gün ve aynı gerekçeyle çalıştığı için `due`/`title` audit'leri hiç oluşmuyor ve sınanmıyor. (c) addTeam done testi `due === addBusinessDays(todayISO(),2)` assert etmiyor. (d) :957'nin adı "On-prem->SaaS" diyor ama SaaS→On-prem'i sınıyor. (e) Round 1 direktif 1'deki L3 (store) SaaS↔On-prem testi ve ara durumda `computeAlerts`'in bu aksiyon için uyarı üretmemesi eklenmemiş. | (a) LLM'e bağlı olmayan bir `rule_review:<reqdocId>` aksiyonu açıkken `applyLlmChoice` gpu→own→gpu çalıştır; aksiyonun status'ü ve audit adedi değişmemeli. (b) r3'ü farklı bir tarihte (`vi.setSystemTime`) ve farklı `from` ile çalıştır; `due` ve `title` update audit'lerini assert et. (c) due assert'i ekle. (d) Test adını düzelt. (e) İsteğe bağlı L3 testi. |

### Düzeltme direktifi
1. **RUL-07**: store.test.tsx "addTeam — adaptation step (AC7)" bloğuna dört test ekle: (a) `p_perakende` aktif 05 → adım `pending`, aksiyon yok. (b) Takımsız proje, işaretsiz genel kayıt → `adapt:general` `out_of_scope` + reason `Otomatik kural: takım tanımlandı`. (c) İşaretli genel kayıt → `adapt:general` değişmez. (d) Takımsız proje, 05 `out_of_scope`/`done` → `adapt:general` ve audit değişmez. Ayrıca docs/changes/feat_m09c-phase-workspaces-tabs.md:51'deki AC7 kanıtını gerçek test adlarıyla güncelle.
2. **RUL-08**: rules.ts:138'de reason'ı `installTypeReasonText(type, from, \`${phase.code} ${phase.name}\`)` yap ve completion.test.ts:841'i güncelle.
3. **RUL-09**: completion.test.ts:933'ü `rule_review:<reqdocId>` ile ayırt edici hâle getir. :889'da due/title audit'lerini farklı sistem saati ve gerekçeyle sına. store.test.tsx:385'e due assert'i ekle. :957'nin adını düzelt.

### Açık sorular / öneriler (engelleyici değil)
- DiscoveryContent.tsx:37-41: 05 `out_of_scope` iken de "Takım eklendi, Uyarlama aşamasına adım açıldı" toast'ı çıkıyor, oysa adım kapsam dışı doğuyor. Metin "kapsam dışı olarak eklendi" gibi olabilir (UI, reviewer kapsamı).
- Değişiklik notunda belgelenen "aynı `act()` içinde iki `setInstallChoice` çağrısında dönüş değeri `error:null`" davranışı state'i bozmuyor ama dönüş değeri yanıltıcı. BACKLOG'a girmesine katılıyorum.
- seed.ts:456: `p_perakende`'de `reqdoc` artık `out_of_scope` (SaaS projesi ve 01 done olduğu için tutarlı). `reqdoc_not_shared` yalnızca On-prem'de üretildiği için uyarı sayısı etkilenmiyor.
- Round 1'den kalanlar: null→On-prem ilk seçim gerekçesinin testi yok; termin testi tatil arifesine sabitlenmemiş; `todayISO()` tarayıcının yerel saatini kullanıyor (F1'e).

### İlgili dosyalar
- src/lib/rabbitqa/store.tsx
- src/lib/rabbitqa/rules.ts
- src/lib/rabbitqa/flow.ts
- src/lib/rabbitqa/completion.ts
- src/lib/rabbitqa/store.test.tsx
- src/lib/rabbitqa/completion.test.ts
- src/lib/rabbitqa/seed.ts
- src/pages/project/DiscoveryContent.tsx
- docs/changes/feat_m09c-phase-workspaces-tabs.md
- docs/plans/M-09c-phase-workspaces-tabs.md
