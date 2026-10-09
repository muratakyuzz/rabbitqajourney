# Review Backlog (Medium/Low bulgular)

Bu dosya `/gate` çalıştırmalarından çıkan, merge'i engellemeyen Medium/Low bulguları biriktirir.

## feat/m09a-step-completion (@ 6253eb4, 2026-10-04 — round 1)

REV-01, REV-02, REV-03, REV-04, REV-06, RUL-01, RUL-02, RUL-03, RUL-08 round 2'de (@ c3048ec) düzeltildi ve doğrulandı — aşağıdaki tablodan çıkarıldı.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-05 | Low | `MkAudit` tipi 3 yerde kopyalanmış, `./flow`'dan import edilmeli | src/lib/rabbitqa/completion.ts:6, rules.ts:4 | M-09b |
| RUL-04 | Low | `applyMeetingHeldRules` idempotans + SaaS out_of_scope testleri yok | src/lib/rabbitqa/completion.test.ts:330-352 | M-09b |
| RUL-05 | Low | AC10 out_of_scope→pending→done store seviyesinde uçtan uca test yok | src/lib/rabbitqa/store.test.tsx:17-44 | M-09b |
| RUL-06 | Low | `go_no_go` held kuralı akışı atlıyor (bilinçli, M-09c'de kaldırılacak) | src/lib/rabbitqa/rules.ts:130-132 | M-09c |
| RUL-07 | Low | `updateMeeting` held toplantının type/date'ini gerekçesiz değiştirebiliyor | src/lib/rabbitqa/store.tsx:285-301 | M-09b/c — **Karar verildi → ADR-0004 K4** |
| RUL-09 | Low | Meeting adımı geri açılınca audit metni "veri eksildi" diyor (yanıltıcı) | src/lib/rabbitqa/completion.ts:145-146 | M-09b |

## feat/m09a-step-completion (@ c3048ec, 2026-10-04 — round 2)

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-07 | Medium | AC13 store testi (`p_isyatirim`) zaten `done` olan bir adımı sınıyor, "held meeting → step done" iddiasını gerçekte test etmiyor | src/lib/rabbitqa/store.test.tsx:151-165 | M-09a fix (önerilir) |
| RUL-11 | Medium | `applyLlmChoice` (gpu→own→gpu, idempotans, model_install geçişleri) için hiç test yok | src/lib/rabbitqa/rules.ts:69-103 | M-09a fix (önerilir) |
| REV-08 | Low | `manualStatusError`/`approveInsight` kontrolleri negatif (`!== "manual"`) yazılmış; `completion` alanı tanımsız bir adımda motorla UI zıt karar verir (bugün ulaşılamıyor, savunma amaçlı) | src/lib/rabbitqa/completion.ts:178, store.tsx:653 | M-09b |
| RUL-10 | Low | SaaS→On-prem→SaaS testinin assert'leri dar (audit sayımı toplam, id/son durum kontrolü yok) | src/lib/rabbitqa/store.test.tsx:230-259 | M-09b |
| RUL-12 | Low | İş günü kenar durumları (tatil arifesi, tam sınır) hiç test edilmiyor | src/lib/rabbitqa/completion.ts:148, alerts.ts:68 | M-09b |
| RUL-13 | Low | `addDocument`/`setKickoff` reqdoc adımını `out_of_scope` durumunu kontrol etmeden done yazıyor (main'den kalma, bu diff satırı yeniden yazdı) | src/lib/rabbitqa/store.tsx:378, 420 | M-09b |

### Açık sorular (Murat kararı gerekiyor, backlog değil ama not edildi)
- Canlı keşif soruları: admin bir soruyu zorunlu yaparsa açık projelerde adım geri açılabilir mi? (rules-reviewer Açık soru 1)
- Geri açılmada eski `due` korunuyor, `ballSince` sıfırlanmıyor — spec net değil (rules-reviewer Açık soru 2)
- SaaS geçişinde done `vpn_info` adımı "Tamamlandı" kalıyor, spec "Kapsam dışı" diyor — done adımlar kural dışı mı? (rules-reviewer Açık soru 3)
- S4: Planlandı→Yapıldı gerekçesiz — plan varsayımı onay bekliyor (rules-reviewer Açık soru 4)
- `reqdoc` adımı `manual` kaldı, fiilen veriye dayalı (rules-reviewer Açık soru 6)
- Locked aşamada pending adım olabiliyor, INV-25'e yakın boşluk — F1 servis katmanında kapatılmalı (rules-reviewer Açık soru 7) **Karar verildi → ADR-0005 (INV-25 netleştirmesi, RR-F002)**
- Plan dosyasının `main` yerine branch üzerinden gelmesi (2bf2de9) — iş akışı onayı gerekiyor (reviewer notu)
- `package-lock.json` main'de de `npm ci` ile senkron değil (pre-existing, bu PR'a özgü değil) — ayrı kapsam dışı commit önerilir (qa-verifier notu)

## feat/m09b-phase-workspace-handover (@ dbbcd41, 2026-10-04 — round 1)

REV-01, REV-02 (RUL-10 yarısı), REV-03, REV-04, REV-05, RUL-01 round 2'de (@ 6bf0590) düzeltildi ve doğrulandı. REV-06 de RUL-01 ile aynı kök nedenden kapandı (reviewer REV-17 ile teyit edildi) — aşağıdaki tablodan çıkarıldı.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-07 | Low | `approveInsight` otomatik adımda her `step_update`'i reddediyor, `out_of_scope` önerisi de dahil; plan ile `manualStatusError` arasında çelişki | src/lib/rabbitqa/store.tsx:648 | **Karar verildi → ADR-0004 K7** |
| REV-08 | Low | Manual adımlar ve `rowClickable=false` başlıklar işlevsiz `<button>` olarak çiziliyor (a11y) | src/pages/project/workspaces/PhaseWorkspaceSheet.tsx:57,72; ProjectDetail.tsx:335,340 | M-09c |
| REV-09 | Low | Geçersiz `?ws=` koduyla panel boş gövdeyle açılıyor | src/pages/ProjectDetail.tsx:237-240 | M-09c |
| REV-10 | Low | `highlightField` seçicisi `:disabled`/`[data-disabled]` öğeleri dışlamıyor | src/pages/project/workspaces/highlight.ts:9 | M-09c |
| REV-11 | Low | AC11 "v9 atılır" testi yanlış anahtara yazıyor, sürüm koruması fiilen test edilmiyor | src/lib/rabbitqa/store.test.tsx:370 | M-09c |
| RUL-02 | Low | AC12 c testi kilitli reqdoc fixture'ı kullanıyor, `pending→done` yolu L3'te hiç test edilmiyor | src/lib/rabbitqa/store.test.tsx:422-430 | M-09c |
| RUL-03 | Low | v9→v10 sürüm koruması testi zayıf (yanlış anahtar) | src/lib/rabbitqa/store.test.tsx:369-374 | M-09c |

### Açık sorular (Murat kararı gerekiyor, backlog değil ama not edildi)
- S6: Kilitli `reqdoc`'un `req_doc` yüklenince doğrudan `done` olması mı, yoksa kilitli kalıp aşama açılınca tamamlanması mı doğru? Spec'ten çıkarılamıyor (reviewer + rules-reviewer ortak notu). **Karar verildi → ADR-0004 K5**
- A11 (rules-reviewer): `done` olan ONPREM adımı SaaS'a geçince `done` kalıyor; spec "Kapsam dışı olur" diyor, kod "tamamlanmış işi koru" davranışında. **Karar verildi → ADR-0004 K6**
- Admin'in çalışma alanı yazma yetkisi (`canManageProject` → `isAllSeeing`) RBAC.md Karar 1 ile çelişiyor gibi görünüyor — F1 RBAC matrisinde netleşmeli. **Karar verildi → ADR-0004 K3**
- `canCreateProject` admin'e proje oluşturma izni veriyor, RBAC Karar 4 (projeyi yalnızca CSM/Manager oluşturur) ile uyumsuz — Murat kararı gerekiyor. **Karar verildi → ADR-0004 K3**
- PRODUCT_SPEC 01'deki "paylaşıldı işareti/tarihi" artık doküman `addedAt`'ı ile eşdeğer sayılıyor — spec metni güncellenmeli mi?

## feat/m09b-phase-workspace-handover (@ 6bf0590, 2026-10-04 — round 2)

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| RUL-05 | Medium | `applyInstallType`/`applyLlmChoice`, aşaması `done` olan adımı da `out_of_scope→locked` yapıyor; akış motoru `done` aşamadaki adımı asla açmıyor, adım sonsuza kadar kilitli kalır (INV-08). RUL-11 testi `not.toBe("out_of_scope")` gibi gevşek assertion'la gizliyor | src/lib/rabbitqa/rules.ts:35,40,100 | **Karar verildi → ADR-0004 K2** (API'de aşama yeniden açılır, adım pending olur; mockup değişmez) |
| REV-14 | Medium | `xlsx` (yasaklı paket, AGENTS.md §2) artık `npm ci` ile kuruluyor (QA-01 lock senkronu sonrası); `npm audit` high/prototype pollution/ReDoS bulgusu, kullanılmıyor | package.json:67 | F0 (ayrı chore commit) |
| RUL-06 | Low | RUL-11 testi "her geçişte audit" ve ruleKey tekilliğini (gpu_model/llm_integration) doğrulamıyor; AC12 e ara durumları (out_of_scope→locked→done) kontrol etmiyor | src/lib/rabbitqa/store.test.tsx:432-444,491,520-521 | M-09c |
| REV-15 | Low | `HandoverWorkspace.test.tsx`: audit sayısı render edilmeyen DOM'dan sayılıyor (hep 0), bir assert zaten geçen çağrıdan kaynaklanıyor, AC3 toast/tür ön değeri L3'te doğrulanmıyor | src/pages/project/workspaces/HandoverWorkspace.test.tsx:77,102,114,121 | M-09c |
| REV-16 | Low | Kural aksiyon durum etiketi satır içi yazılmış, `ACTION_STATUS_LABEL` kullanılmıyor (`in_progress` → "Açık" gösteriliyor) | src/pages/project/workspaces/HandoverWorkspace.tsx:165 | M-09c |

### Açık sorular (round 2, Murat kararı gerekiyor)
- RUL-05: `done`/`out_of_scope` aşamadaki adımların kural motorunca `locked`'a çevrilip çevrilmeyeceği netleşmeli. **Karar verildi → ADR-0004 K2, ADR-0005 K11**

## feat/m09b-phase-workspace-handover (@ 4d67bd3, 2026-10-05 — round 3)

Round 1-2 bulgularının tamamı (QA-01, QA-02, QA-03, REV-01…05, REV-12, REV-13, RUL-01) kodda doğrulandı. Yeni bulgular:

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| RUL-07 | Medium | RUL-05 ile bağlantılı: `reqdoc_not_shared` artık adım durumuna (`isOpenStep`) bakıyor; SaaS→On-prem geçişinde reqdoc kalıcı `locked` kalırsa (RUL-05 senaryosu) uyarı hiç üretilmiyor — önceki kod üretiyordu. On-prem projede paylaşılmamış doküman sessiz kalabilir | src/lib/rabbitqa/alerts.ts:68-69; rules.ts:35; flow.ts:52 | **Karar verildi → ADR-0004 K2** (adım pending olur, uyarı normal çalışır) |
| REV-18 | Low | Değişiklik notu "`npx tsc --noEmit` → temiz" diyor ama kök tsconfig hiçbir dosya derlemiyor; gerçek doğrulama `-p tsconfig.app.json` ile yapılmalı | docs/changes/...md:61; tsconfig.json | M-09c |
| REV-19 | Low | Manual/alansız adım panelde işlevsiz tıklanabilir `<button>` olarak çiziliyor (a11y) | PhaseWorkspaceSheet.tsx:57,72; ProjectDetail.tsx:335,339 | M-09c |
| REV-20 | Low | "Gerekçe (zorunlu)" ve DocumentUploadDialog etiketleri `htmlFor`/`id` ile bağlı değil (a11y) | HandoverWorkspace.tsx:40-41; Phase2Tabs.tsx:355,359,366 | M-09c |
| REV-21 | Low | `?ws=<kod>` çalışma alanı olmayan aşama için de boş panel açıyor | ProjectDetail.tsx:113,236-240,382-385 | M-09c |
| RUL-08 | Low | `setInstallChoice` doğrulaması closure'daki `state`'e karşı yapılıyor, aynı render döngüsünde art arda çağrılarda gerekçesiz değişiklik sızabilir (teorik, UI'da zor tetiklenir) | src/lib/rabbitqa/store.tsx:353-356 | M-09c / F1 |

### Açık sorular (round 3, Murat kararı gerekiyor)
- RUL-05 kararına `reqdoc_not_shared` sonucu (RUL-07) eklenmeli — karar hangi yönde olursa olsun ilgili alert testi yazılmalı. **Karar verildi → ADR-0004 K2** (reqdoc dahil, pending olur, uyarı normal çalışır)
- Değişiklik notu round 1 tablosunda REV-06 "düzeltilmedi" görünüyor; BACKLOG'da RUL-01 ile kapandığı yazıyor — belge tutarsızlığı, düzeltilebilir.

## feat/m09c-phase-workspaces-tabs (@ 2cfb718, 2026-10-06 — round 1)

High bulgular (REV-01/02/03, RUL-01/02/03) `/fix`'e gönderildi, backlog'a alınmadı — bkz. `docs/reviews/feat_m09c-phase-workspaces-tabs/SUMMARY.md`.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-04 / RUL-05 | Medium | Değişiklik notu AC13/AC14/AC15'i güçlü gösteriyor + backlog kanıt tablosunda 3 satır (RUL-08, RUL-02 m09b, RUL-05 m09a) iddia edilen davranışı göstermiyor | docs/changes/feat_m09c-phase-workspaces-tabs.md; store.test.tsx:319-329,477-485,545-589 | M-09c fix |
| REV-05 | Medium | Manager/role sekme testi sırayı doğrulamıyor; `?tab=training`/`?tab=adaptation` testleri hangi panel açıldığını assert etmiyor | src/pages/ProjectDetail.tabs.test.tsx:37-53,69-81 | M-09c fix |
| REV-06 | Low | `Phase2Tabs.tsx`'te kullanılmayan import'lar (`Textarea`,`Checkbox`,`StepStatusBadge`,`personName`,`selectableUsers`) ve `NONE` sabiti | src/pages/project/Phase2Tabs.tsx:8,9,16,18,19,25 | M-09c fix |
| REV-07 | Low | `AccessTab` geriye dönük sarmalayıcı hiçbir yerden import edilmiyor | src/pages/project/Phase2Tabs.tsx:197-200 | M-09c fix |
| REV-08 | Low | `AdaptationWorkspace`'te ölü dal (`teams.length===0 && hideGeneral`); takım yokken beklenen boş durum metni hiç görünmüyor | src/pages/project/workspaces/AdaptationWorkspace.tsx:71-74 | M-09c fix |
| REV-09 | Low | p_perakende SaaS proje ama `reqdoc` `done`; `p6OutOfScopeKeys` istisnası bunu gizliyor | src/lib/rabbitqa/seed.ts | M-09c fix |
| REV-10 | Low | `ensureReviewAction`'ın kullanılmayan `phase`/`_trigger` parametreleri; `addTeam`'in `order` hesabı adım sayısına dayanıyor (boşluklu sıralarda çakışabilir); `conditionFor` "general" adlı takımı genel listeyle karıştırıyor | rules.ts:20; store.tsx:337; completion.ts:133-134 | M-09c fix |
| REV-11 | Low | Satır uyarı tooltip'i başlıkları `, ` ile birleştiriyor (plan "satır satır" istiyor); 00 panelindeki kural aksiyonları listesi artık tüm `rule_review:*` aksiyonlarını da gösteriyor | ProjectDetail.tsx (PhasesTab tooltip); HandoverWorkspace.tsx (ruleActions) | M-09c fix |
| RUL-06 | Low | `addTeam(pid,"general")` `adapt:general` şablon adımıyla çakışıyor; adım hiç tamamlanamayabilir | store.tsx:331-339; completion.ts:134-136 | M-09c fix / F1 D15 |

### Açık sorular (round 1, Murat kararı gerekiyor)
- `canSeeCredentials` her DevOps kullanıcısına tüm projelerin erişim bilgisini gösteriyor; RBAC.md "atanmış DevOps" diyor — bu PR'da değişmedi (S4 kararı), 03 paneli yeni giriş noktası ekliyor. F1 RBAC matrisinde ele alınmalı. **Karar verildi → ADR-0005 K9** (DevOps yalnızca atandığı projede görür/oluşturur/günceller)
- Admin `isAllSeeing` üzerinden 02/04/05 panellerini düzenleyebiliyor; RBAC.md admin'e salt okuma veriyor — bilinen açık soru (plan §5), F1'e bırakıldı. **Karar verildi → ADR-0004 K3**
- RUL-05 aksiyonu 2 iş günlük termin + `dueSoonDays≥2` nedeniyle açıldığı anda sarı `action_due_soon` üretiyor — istenen davranış mı, netleşmeli.
- `todayISO()` tarayıcı yerel saatini kullanıyor, Europe/Istanbul değil (pre-existing, bu PR'a özgü değil) — F1'de `packages/shared/business-days`'te çözülmeli.
- Yeniden açılan RUL-05 aksiyonunda `ball` sıfırlanmıyor (plan da istemiyor) — biri topu değiştirdiyse eski değer kalır, F1'de netleştirilmeli.

## feat/m09c-phase-workspaces-tabs (@ 9171430, 2026-10-06 — round 2)

Round 1'in High bulguları (REV-01/02/03, RUL-01/02/03) ve çoğu Low bulgusu (REV-06…11, RUL-04, RUL-06) kodda doğrulandı ve kapandı. Üç gate de APPROVE verdi — MERGE'E HAZIR. Kalan Medium/Low bulgular:

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-12 | Medium | AC19 test boşlukları: `saas_env` create audit reason'ı hiçbir testte birebir assert edilmiyor; LLM_ACTIONS döngüsünün `rule_review:*` aksiyonuna dokunmadığını ayırt edici sınayan test yok; `setInstallChoice` idempotansı (aynı değer iki kez) store seviyesinde test edilmiyor; 05 done `addTeam` testinde aksiyonun `due`'su assert edilmiyor | src/lib/rabbitqa/completion.test.ts:824-851,933-955; store.test.tsx (setInstallChoice blokları) | M-09c fix / F1 |
| RUL-07 | Medium | `addTeam`'in 05 aktif/in_progress durumunun testi yok (`p_perakende` fixture'ı hazır ama kullanılmıyor); bu PR'ın yeni kuralı "takım eklenince işaretsiz `adapt:general` → `out_of_scope`" hiçbir testte yok, "dokunulmaz" koruması da sınanmıyor | src/lib/rabbitqa/store.test.tsx:377; store.tsx (addTeam `else if (!phaseClosed)`) | M-09c fix / F1 |
| REV-13 | Low | Değişiklik notu round 2 fix commit'lerini "Ne değişti"ye eklememiş; ":101 kural motorunda değişiklik yapılmadı" iddiası yanlış (dc7584c/4d753b7/9890b44 rules.ts'i değiştirdi); `store.tsx:381-382` satır referansı eskimiş (gerçek 387-388) | docs/changes/feat_m09c-phase-workspaces-tabs.md:8,67,81,101 | M-09c fix |
| REV-14 | Low | `completion.test.ts:957` testinin adı "On-prem->SaaS" diyor, gövde SaaS→On-prem'i sınıyor | src/lib/rabbitqa/completion.test.ts:957 | M-09c fix |
| REV-15 | Low | 05 `out_of_scope` iken takım eklenince toast hâlâ "adım açıldı" diyor, adım gerçekte `out_of_scope` doğuyor | src/pages/project/DiscoveryContent.tsx:36-40 | M-09c fix |
| REV-16 / RUL-08 | Low | SaaS→On-prem'de `saas_env` review iptalinin reason'ı sabit metin, kardeş iptal çağrıları gibi `installTypeReasonText`/geçiş bilgisini taşımıyor | src/lib/rabbitqa/rules.ts:138 | M-09c fix |
| RUL-09 | Low | LLM_ACTIONS/model_install testi (:933) iki mekanizmayı ayırt etmiyor; A→B→A testinde (:889) due/title audit'leri hiç tetiklenmiyor (aynı gün/gerekçe); addTeam done testinde due assert'i yok | src/lib/rabbitqa/completion.test.ts:889-920,933-955; store.test.tsx:385-413 | M-09c fix / F1 |
| — | Low | lint karşılaştırması: değişiklik notu "42 problems, main'le aynı" diyor; gerçek main 44 problems veriyor (branch 2 error az — regresyon değil, iddia yanlış) | docs/changes/feat_m09c-phase-workspaces-tabs.md | M-09c fix (belge düzeltme) |
| — | Low/Medium | `setInstallChoice`'a aynı render döngüsünde art arda iki çağrı yapılırsa ikinci çağrının dönüş değeri `error:null` gelebiliyor (state bozulmuyor, dönüş değeri yanıltıcı) | src/lib/rabbitqa/store.tsx:377-389 | F1 (API'ye geçişte kendiliğinden çözülür) |

### Açık sorular (round 2, Murat kararı gerekiyor)
- Yukarıdaki açık sorular (round 1) hâlâ geçerli.

## fix/m06-risk-reason (@ 55dafe7, 2026-10-06)

REV-01 (High) kapatıldı — reviewer, qa-verifier, rules-reviewer hepsi APPROVE. MERGE'E HAZIR. Kalan Medium/Low bulgular:

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-M06-01 / RUL-01 | Medium | Karar kaydının `decidedAt` (Karar tarihi) alanı gerekçesiz değiştirilebiliyor; INV-06'nın "tarih değişikliği" ifadesi bunu kapsıyor mu belirsiz. Haftalık rapor kararları `decidedAt`'e göre seçiyor (reports.ts:52), yani gerekçesiz tarih düzenlemesi raporu etkileyebilir. | src/pages/project/Phase3Tabs.tsx:357,365,384; src/lib/rabbitqa/store.tsx:506 | Murat kararına bağlı — kapsama alınırsa M-06 fix turu, alınmazsa INVARIANTS/API_CONTRACT'ta netleştirilsin |
| RUL-02 | Low | Gerekçe yazılıp durum/termin geri alındığında (sadece başlık değişince) eski `reason` state'te kalıp yine gönderiliyor; gerekçe gerektirmeyen alan değişikliğine bayat gerekçe yazılıyor | src/pages/project/Phase3Tabs.tsx:434 | M-06 fix (opsiyonel) |
| REV-M06-02 / RUL-03 | Low | AC2 test adı "records it on the audit entry" diyor ama audit.reason'ı assert etmiyor (yalnızca toast/dialog kapanması kontrol ediliyor) | src/pages/project/Phase3Tabs.RiskDialog.test.tsx:56-67 | M-06 fix (opsiyonel) |
| REV-M06-03 | Low | Store, gerekçeyi trim etmeden audit'e yazıyor (UI trimli gönderiyor); `updateMeeting` de aynı tutarsızlığı taşıyor (yeni değil) | src/lib/rabbitqa/store.tsx:509 | Opsiyonel, genel tutarlılık geçişinde |
| RUL-04 | Low | Eksik negatif testler: sadece boşluktan oluşan gerekçe, durum+termin aynı anda değişince iki audit kaydına da aynı reason, termin null'a çekilmesi — kod doğru ama test yok | src/lib/rabbitqa/store.test.tsx:674-713 | M-06 fix (opsiyonel) |
| — | Low | Değişiklik notu "`npm run typecheck`" diyor ama script repoda yok; demo-modu eşdeğeri `npx tsc --noEmit` kullanılmalı (davranış sorunu değil) | docs/changes/fix_m06-risk-reason.md | Belge düzeltme |

### Açık soru
- INV-06'daki "tarih değişikliği" kararın `decidedAt` alanını da kapsıyor mu? Kapsarsa REV-M06-01/RUL-01 zorunlu hale gelir. **Karar verildi → ADR-0004 K1** (kapsıyor; create'te gerekçesiz, update'te zorunlu)

## fix/m06-insight-step-lock (@ 2940e56, 2026-10-06)

REV-13 kapatıldı — reviewer, qa-verifier, rules-reviewer hepsi APPROVE. MERGE'E HAZIR. Kalan Medium/Low bulgular:

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-M13-01 / RUL-01 | Medium/Low | `approveInsight`'ın `step_update` dalından `isAutoStep` erken reddi kaldırıldı (direktif bunun kalmasını istemişti); otomatik adım kuralı artık yalnızca `updateStep` → `manualStatusError`'a dayanıyor (done dışı geçişlerde StepDialog ile hizalı, INV-26'ya aykırı değil) ama değişiklik notunda belgelenmemiş sapma | src/lib/rabbitqa/store.tsx:687-692 | M-06 fix (belge) ya da BACKLOG |
| REV-M13-02 / RUL-02 | Medium/Low | AC5 ve AC17 testleri `if (!insight) return;` içeriyor; ai-mock otomatik adıma öneri üretmediği için bu testler hiçbir assert çalıştırmadan yeşil geçiyor — isAutoStep guard'ının kaldırıldığını yakalayan gerçek bir test yok | src/lib/rabbitqa/store.test.tsx:454-468,530-543 | M-06 fix |
| RUL-03 | Low | Geçersiz `targetId`'li `step_update` için "Adım bulunamadı" davranışı (önceden sessiz no-op + approved idi, şimdi düzeldi) hiç test edilmiyor | src/lib/rabbitqa/store.tsx:689-690 | M-06 fix (opsiyonel) |
| REV-M13-03 | Low | ApproveDialog, StepDialog'daki gibi kilitli/otomatik adım için Durum seçeneklerini kısıtlamıyor; store reddettiği için invariant ihlali yok ama kullanıcı hatayı ancak onay sonrası görüyor | src/components/rq/InsightCard.tsx:164 | Opsiyonel UI iyileştirmesi |
| — | Low | `action_update` dalı `api.updateAction`'ın hata dönüşünü kontrol etmiyor (pre-existing, REV-13 dışı) | src/lib/rabbitqa/store.tsx:686 | F0-01 (API_CONTRACT) |
| — | Low | İnsight onayının hedef adımın `projectId`'sini doğrulamadığı (INV-23), `step_update`'in `Partial<Step>`'i olduğu gibi `updateStep`'e geçirip alan beyaz listesi yapmadığı (pre-existing) | src/lib/rabbitqa/store.tsx | F0-01 (API_CONTRACT, zod şeması) |

### Açık soru
- RUL-01'in önerdiği gibi, `isAutoStep` kaldırma sapması planner/Murat tarafından onaylanmalı; onaylanırsa yalnızca belge güncellemesi yeterli, onaylanmazsa kod geri eklenmeli.

## Faz M kapanış (round 2-3, main @ dffa61f, 2026-10-06)

Kaynak: `docs/reviews/M-full-review.md` (round 2), `docs/reviews/M-qa-regression.md` (round 3), M-closure round 2 (ab95e9a) tablosu. REV-13 kapandı (fix/m06-insight-step-lock).

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| QA-01 | Low | **Kapandı.** REV-13 ek görseli (`fix_m06-insight-step-lock/screens/…-ac4-status-dropdown.png`) `docs/reviews/M-06/baseline/csm-insights-step-update-edit-dialog-status-open.png` olarak kopyalandı; baseline 37 PNG. | docs/reviews/M-06/baseline/ | Kapandı |
| REV-14 | Medium | `PhaseDialog` `actualStart` gerekçesiz değişiyor | — | **Karar verildi → ADR-0004 K1** → F0-01, F3 |
| REV-M06-01 / RUL-01 | Medium | Karar `decidedAt` gerekçesiz (reports.ts:52) | — | **Karar verildi → ADR-0004 K1** → F0-01, F3-05 |
| REV-15 | Low | Ulaşılamayan `TicketDialog` gerekçesiz durum değişikliği | — | Faz 2 planı + F0-01 notu |
| REV-02 | Medium | `canViewProject`; URL ile proje detayına/rapora erişim | — | F1-05 (+F3-01) |
| REV-03 | Medium | `canEditReport` rol kararı | — | **Karar verildi → ADR-0005 K8 (Manager), K12 (Admin)** → F1-05 |
| REV-04 | Medium | Admin yazma yetkisi (`isAllSeeing`) ve AI onayıyla proje verisi yazması; RBAC.md Karar 1 ile çelişki | store.tsx | **Karar verildi → ADR-0004 K3** → F1-05 |
| REV-05 | Medium | `setStepByKey` kilit kontrolü yapmıyor | store.tsx | **Karar verildi → ADR-0004 K5** → F0-01 notu, F4-01 |
| REV-06 | Medium | INV-06/08 kontrolleri sözleşmeye ve servis katmanına | — | F0-01 + F1-02 |
| REV-07 | Low | No-op `support_track` satırı | store.tsx:480 | F0-02 |
| REV-08 | Low | `reportsSent` tutulsun mu | — | F1-00 |
| REV-09 | Low | `"system"`/`"auto"` sentinel'leri, takımın adla tutulması | — | F1-00 (DATA_MODEL §9) |
| REV-10 | Low | `isOpenStep` kopyaları, takvim günü aritmetiği | — | F6-01 |
| REV-11 | Low | `=== true` fail-closed (INV-12) | reports | F7-02 (rules-reviewer) |
| REV-12 | Low | AUDIT §5 güncellemesi (denetim rolü); AGENTS.md:28-29 v11/51 işlem (Murat) | docs | Hemen (belge) |
| PLN-01 | Low | `date_change` dalı `updatePhase` dönüşünü yok sayıyor; `action_update` da aynı | store.tsx:686,707 | F0-01 notu |
| RUL-02 (m06) | Low | Bayat gerekçe gönderiliyor | Phase3Tabs.tsx:434 | F3-05 |
| REV-M06-02 / RUL-03 | Low | AC2 testi audit.reason assert etmiyor | Phase3Tabs.RiskDialog.test.tsx:56-67 | F4-01 |
| REV-M06-03 | Low | Gerekçe store'da trim edilmiyor | store.tsx:509 | F1-02 (servis katmanı) |
| RUL-04 (m06) | Low | Boş/çift audit/null termin negatif testleri | store.test.tsx | F4-01 |
| REV-M13-01 / RUL-01 | Med/Low | `isAutoStep` kaldırma sapması — **planner kabul etti**; değişiklik notuna belge. **Karar verildi → ADR-0004 K7** | store.tsx:687-692 | Belge (sonraki builder turu) / F0-01 notu |
| REV-M13-02 / RUL-02, RUL-03 (m13) | Med/Low | AC5/AC17 sahte-yeşil; "Adım bulunamadı" testi yok | store.test.tsx:454-468,530-543 | F4-01 |
| REV-M13-03 | Low | ApproveDialog seçenek kısıtı (StepDialog `allowed`) | InsightCard.tsx:164 | F3-02 |
| QA: chunk / lint / e2e | — | 1,22 MB chunk; lint 14 hata; e2e yok | — | F0-02 / F9-03; F0-02; F0-06 |

Önceki bölümlerdeki açık maddelerin hedefleri (round 2 kararıyla): test boşlukları → F4-01; a11y → F9-04; UI kenar durumları → F3-02; RBAC → F1-05; belge tutarsızlıkları (m09b/c REV-13/18, lint iddiaları, satır referansları) → kapatıldı.

### F0-01'den önce Murat kararı gerekenler
- INV-06 "tarih" kapsamı (REV-14, REV-M06-01) — **Karar verildi → ADR-0004 K1**
- RUL-05/RUL-07 (done aşamada `locked` + `reqdoc_not_shared`) — **Karar verildi → ADR-0004 K2**
- S4 (toplantı Planlandı→Yapıldı / held değişikliği gerekçesi) — **Karar verildi → ADR-0004 K4**
- S6 (kilitli reqdoc'un req_doc ile tamamlanması) — **Karar verildi → ADR-0004 K5**
- A11 (done ONPREM adımı SaaS'a geçince durumu) — **Karar verildi → ADR-0004 K6**
- m09b REV-07 (otomatik adımda `out_of_scope` onayı) — REV-13 fix'i ile StepDialog'a hizalandı; aksi istenirse geri alınır — **Karar verildi → ADR-0004 K7**
- m09a RUL-07 (held toplantı type/date gerekçesi) — **Karar verildi → ADR-0004 K4**
- REV-04 (Admin yazma yetkisi) — **Karar verildi → ADR-0004 K3**

## chore/f0-01-api-contract (@ d9e7644, 2026-10-06 — round 1)

Gate kararı DÜZELTME GEREKLİ. Medium maddeler `/fix` direktifinde (SUMMARY.md madde 4–19); fix turunda kapanmazsa burada kalır. Low maddeler opsiyonel.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-F002 | Medium | #5 `step:update` + `flow:update` birlikte aranıyor; Manager akış ayarı yapamaz → alan bazında yetki | docs/API_CONTRACT.md:30, :69 | F0-01 fix (ADR-0005 K8 ile Manager `step:update`'e de sahip; alan bazında yetki yine geçerli) |
| REV-F003 | Medium | `GET /integrations/channels` iki authorize; kapsam dışı müşteri adı sızıyor (409 mesajı dahil) | docs/API_CONTRACT.md:114, :169, :187 | F0-01 fix |
| REV-F004 / RR-F007 | Medium | Durum geçişlerinde (#4, #34, #36, #13) gerekçesizlik INV-06 istisnası olarak yazılmamış; done aşamanın elle yeniden açılması tanımsız | docs/API_CONTRACT.md:67-68, :77, :98, :100 | RR-F007: **Karar verildi → ADR-0005 K10** (409 değil, gerekçeli yeniden açma). REV-F004: açık (§5 maddesi). F0-01 fix |
| REV-F005 | Medium | Go-Live / 00 çalışma alanında DevOps/Care davranışı (403 mü, alan filtresi mi) tanımsız | docs/API_CONTRACT.md:167, :174, :255 | F0-01 fix |
| REV-F006 | Medium | Config PUT (keşif soruları, tatiller) kaldırma semantiği tanımsız; RBAC "silme yok" | docs/API_CONTRACT.md:105, :108, :224 | F0-01 fix |
| REV-F007 | Medium | `{ item, effects }` zarf kuralı ile kural tetikleyen satırların yanıt şeması tutarsız | docs/API_CONTRACT.md:15 | F0-01 fix |
| REV-F008 | Medium | AI insight onayında tür başına alan beyaz listesi yok (flow alanları sızabilir) | docs/API_CONTRACT.md:115 | F0-01 fix |
| RR-F003 | Medium | Ters yön kurulum/LLM kuralı metni koddan farklı (aksiyon açılmaz) | docs/API_CONTRACT.md:80, :212 | INV-28 ve ADR-0004 K2 metni düzeltildi (ADR-0005); sözleşme metni F0-01 fix |
| RR-F004 | Medium | K2 hedefi eksik (due/activatedAt, kapsam, gerekçe, A→B→A, bağlılık) | docs/API_CONTRACT.md:80, :212 | Bağlılık: **Karar verildi → ADR-0005 K11** (§5 maddesi açılmaz). Kalan ayrıntılar F0-01 fix |
| RR-F005 / REV-F009 | Medium | `setStepByKey` yolları `out_of_scope` adımı eziyor; §2.2'de hedef yok | docs/API_CONTRACT.md:124-135 | F0-01 fix |
| RR-F006 / REV-F012 | Medium | `approveGoLive`: 07 locked/done/tekrar çağrı davranışı ve alan başına audit eksik | docs/API_CONTRACT.md:102, :175 | F0-01 fix |
| RR-F008 | Medium | `gonogo` tek yönlü/manual; #19 "geri açılır" genellemesi yanlış | docs/API_CONTRACT.md:83, :132-133 | F0-01 fix; hedef (meeting-completion mı) açık, §5 güvenli varsayım (ADR-0005 "Açık kalanlar") |
| RR-F009 | Medium | Insight health/date onayında `note` zorunluluğu (Spec A.2) yok | docs/API_CONTRACT.md:115, :209 | F0-01 fix |
| RR-F010 | Medium | Kontrol-sonra-yaz yarışları için koşullu update / tekil kısıt yazılmamış | docs/API_CONTRACT.md §1, :96-100, :114-117 | F0-01 fix; kısıtlar F1-00 |
| RR-F011 | Medium | Insight üretiminde INV-23/INV-24 hedefleri yok | docs/API_CONTRACT.md:118, :120, :121 | F0-01 fix |
| RR-F012 | Medium | Kuralla otomatik sahip ataması pasif kullanıcı / rastgele DevOps seçebilir | docs/API_CONTRACT.md:61, :80 | F0-01 fix; sahip seçimi açık, §5 güvenli varsayım (ADR-0005 "Açık kalanlar") |
| REV-F010 | Low | `*Patch` gövdeler PUT ile; `:projectId`/`:id` tutarsız; #16 400↔409 | docs/API_CONTRACT.md:77, :79, :80, :85 | F0-01 fix (ops.) / F0-04 |
| REV-F011 | Low | "oturum" katalogda aksiyon değil; `/audit?scope=system` kapsamı tanımsız | docs/API_CONTRACT.md:141, :150-151, :192 | F0-01 fix (ops.) / F1-05 |
| RR-F013 | Low | #16 LLM ayrıntıları (`required`, iptal edilen aksiyonun yeniden açılması, `saas_env` locked) | docs/API_CONTRACT.md:80 | F0-01 fix (ops.) |
| RR-F014 | Low | #47 "proje verisi değişmez" ifadesi `addAsContact` ile çelişiyor | docs/API_CONTRACT.md:118 | F0-01 fix (ops.) |
| RR-F015 | Low | red→yellow→red ikinci kritik uyarı açıyor; tekilleştirme hedefi yok | docs/API_CONTRACT.md:62 | F0-01 fix (ops.) / F5 |
| RR-F016 | Low | Credential/secret görüntüleme audit'inin aynı transaction'da olduğu yazılmamış; #1 kopya audit'i belirsiz | docs/API_CONTRACT.md:61, :87, :113 | F0-01 fix (ops.) |
| RR-F017 | Low | #4 oos aşamayı reddetmiyor; #5 kilitli adımda `due` değişebiliyor | docs/API_CONTRACT.md:68, :69 | F0-01 fix (ops.) |
| QA-F001 | Bilgi | Lint 14 error (main'den miras) | src/** | F0-02 |

### Denetim oturumu / Murat
- ADR-0004 K4 "Sonuçlar" metni eskimiş (kod gerekçeyi zaten zorluyor, store.tsx:286-288) — ADR'ye not. **Kapandı → ADR-0004 K4 düzeltildi (ADR-0005)**
- ADR-0004 K2 ve INV-28 ters yön cümlesi koda göre yanlış (RR-F003); INV-28 ↔ INV-25 bağlılık çatışması (RR-F004) — planner + Murat. **Kapandı → ters yön metni düzeltildi (ADR-0005); bağlılık: Karar verildi → ADR-0005 K11**
- RBAC.md satırları: S5, S6, S7, S16 + DevOps credential oluşturma (REV-F001); INV-06 kapsamı: S8 + REV-F004 — F1-05 öncesi. **Kapandı (REV-F004 hariç):** S5/S6/S7/S16 satırları RBAC.md'ye eklendi (Karar 9); REV-F001 → **Karar verildi → ADR-0005 K9**; S8 → **Karar verildi → ADR-0005 K13**. REV-F004 (durum geçişi istisnası) açık.
- AGENTS.md:29 "state v8, `Ctx` 52 işlem" → state v11, 51 işlem (Murat).
- ADR-0005'in API_CONTRACT'a etkisi: gate `SUMMARY.md` direktif #1 (DevOps credential), #9 (done aşama 409) ve #14 (bağlılık §5 maddesi) ADR-0005 K9/K10/K11 ile geçersizleşti; builder `/fix` ADR-0005 "API_CONTRACT'a yansıtılacaklar" bölümünü esas alır.

## chore/f0-01-api-contract (@ 1d8f4d2, 2026-10-06 — round 2)

Round 1'deki 29 bulgunun 28'i kapandı (REV-F003 kısmen → REV-F014). Yukarıdaki round 1 tablosu tarihsel; açık olanlar yalnızca aşağıdakiler. Gate kararı DÜZELTME GEREKLİ — Medium maddeler `/fix` direktifinde (SUMMARY.md madde 3–8).

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-F015 / RR-F019 | Medium | K10 yeniden açma "done adımlar done kalır" ↔ INV-26 geri açma çelişkisi | docs/API_CONTRACT.md:74, :87; INVARIANTS.md INV-28 | **Karar verildi → INV-28 (ADR-0005 round 2 netleştirmesi, Murat 2026-10-06)**: "done kalır" yalnızca açma anı, INV-26 aynı transaction'da çalışır, termin eski `due`. Sözleşme metni F0-01 fix (S24 §5.2) |
| RR-F021 / REV-F018 | Medium | Açık aşamada manuel adım `out_of_scope→done` hedefi yok | docs/API_CONTRACT.md:22, :76 | F0-01 fix |
| RR-F022 | Medium | `customer_approval` / `commit_check` elle `done` ile Go-Live onayı/taahhüt kontrolü atlanıyor | docs/API_CONTRACT.md:109, :256 | F0-01 fix (S22; S23 açılmadı, S22'ye katıldı — ADR-0005 numaralandırma kaydı) |
| REV-F014 | Medium | Proje kapsamlı kanal listesi başka projelere bağlı kanal adlarını (= müşteri adı) sızdırıyor | docs/API_CONTRACT.md:177, :242 | F0-01 fix |
| REV-F016 | Medium | S21 INV-06 istisna listesi eksik (#41, #43, #45/#46, #48) | docs/API_CONTRACT.md:255 | F0-01 fix |
| REV-F017 | Medium | S10/S13/S15/S17/S18 Murat onayı olmadan "kapandı" tablosunda | docs/API_CONTRACT.md:270-282 | **Karar verildi → ADR-0005 K14 (S10), K15 (S13), K16 (S15), K17 (S17), K18 (S18)**; sözleşme metni F0-01 fix (S15/S17 hedef davranış + §4) |
| REV-F019 | Low | (a) `session:authenticated` RBAC.md satırı yok; (b) `adaptation:read` katalogda yok | docs/API_CONTRACT.md:58, :186; RBAC.md | (a) **Denetim oturumunda yapıldı (2026-10-06)** → RBAC.md "Oturumlu, kaynağa bağlı olmayan uçlar" satırı (`session:authenticated`); (b) F0-01 fix (ops.) / F1-05 |
| REV-F020 | Low | #2c `csmId` doğrulaması (aktif, `role=csm`, null) yok | docs/API_CONTRACT.md:71 | F0-01 fix (ops.) / F2 |
| REV-F021 | Low | Değişiklik notu AC5 ve "§5 19 nokta" ifadeleri eskimiş | docs/changes/chore_f0-01-api-contract.md:16, :31 | F0-01 fix (ops.) |
| REV-F022 | Low | CLAUDE.md:24 denetim yazma listesi ↔ uygulama; PRODUCT_SPEC guard'da yok; normatif dokümanlar branch merge'üne bağlı | CLAUDE.md:24; .claude/hooks/guard.mjs:44-47 | Merge kısmı: **Karar verildi → ADR-0005 (süreç notu, REV-F022)**, bu branch'le merge. CLAUDE.md:24 / guard PRODUCT_SPEC kısmı → **F0-02** (Murat, 2026-10-06) |
| RR-F023 | Low | K11 yüklemi ("zorunlu adımlar tamamsa") akış motoru kuralından farklı; iki yol iki mekanizma gibi yazılmış | docs/API_CONTRACT.md:87, :220; INV-28; ADR-0005 K11 | **Karar verildi → ADR-0005 K11 netleştirmesi, INV-28** (yüklem = akış motoru kuralı). Sözleşme metni F0-01 fix |
| RR-F024 | Low | Kilit altında yeniden okuma/ön koşul kuralı; #2a kilit listesi; #39c kilit sırası | docs/API_CONTRACT.md:17, :19, :69, :112 | F0-01 fix (ops.) / F1-02 |
| RR-F025 | Low | K10 ayrıntıları (`phase_approval` yeni/eski, `actualEnd` istekte, kilitli adımların açılması) | docs/API_CONTRACT.md:74 | F0-01 fix (ops.) / F3 |
| RR-F026 | Low | §2 "Hedef" farklarından altısı §4'te yok | docs/API_CONTRACT.md:204-246 | F0-01 fix (ops.) / F9 (INV-20 geçişi) |
| QA-F001 | Bilgi | Lint 14 error (main'den miras, round 2'de yeniden doğrulandı) | src/** | F0-02 |

### Açık sorular (round 2)
- `gonogo` `out_of_scope` iken #38 hep 409 → Go-Live onayı kaydedilemez (S22 ile, Murat).
- Öneri oluştuktan sonra tür kapatılırsa / hedef değişirse onay ucu davranışı (Spec A.2).
- #32 `ON CONFLICT`, #43 kısmi tekil index → pg-mem desteği F1-00 / ADR-0002 parity listesi.
- `step_update.ownerId` / `action_update.ownerId` DevOps/Care onayıyla değişebiliyor (RBAC Karar 5) → F8-03 planı.
- `docs/agents/reviewer.md` kontrol listesi "INV-01…27" diyor, INV-28 eksik (kit güncellemesi, denetim).

## chore/f0-01-api-contract (@ 4563ca2, 2026-10-07 — round 3)

Round 2'deki 19 bulgunun hepsi kapandı (yukarıdaki round 2 tablosu tarihsel). Gate kararı **MERGE'E HAZIR**. Açık olanlar yalnızca aşağıdakiler; düzeltme sırası SUMMARY.md direktifinde.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-F023 / RR-F027 | Medium | Kapsama dönen, daha önce açılmış aşama yeniden `locked` oluyor; içinde açık adımlar ve `phase_approval` kalıyor (uyarı/iş listesi, elle değiştirilemez). Yüklemde "önceki aşama yok" (00) dalı eksik (REV-F028b) | docs/API_CONTRACT.md:22, :74, :228 | **Karar verildi → ADR-0005 K19 (Murat, 2026-10-07, seçenek (a))**; INV-25 istisnası ve PRODUCT_SPEC B.1 yazıldı. Sözleşme metni (§1, #3, §4 + REV-F028b yüklemi) → F0-01 takip / F3-02 |
| RR-F032 | Low | Aşama `out_of_scope` olunca açık `phase_approval` aksiyonu kapanmıyor | docs/API_CONTRACT.md:74 | F0-01 takip (ops.) / F3 |
| RR-F029 | Low | `customer_approval` K10 sonrası elle `done→pending` yapılırsa yeniden `done` olamıyor (çıkmaz) | docs/API_CONTRACT.md:76, :109 | F0-01 takip (ops.) / F5-05 |
| RR-F030 | Low | `out_of_scope → in_progress` isteğinin sonuç durumu (`pending`/`in_progress`) yazılmamış | docs/API_CONTRACT.md:22, :76 | F0-01 takip (ops.) / F3 |
| RR-F028 | Low | #14 `addTeam`, 07 `done` iken `409` kapsamı (05'in durumundan bağımsız mı) belirsiz | docs/API_CONTRACT.md:85; INVARIANTS.md:36; ADR-0005:172 | F0-01 takip (ops.) |
| REV-F025 | Low | `401 UNAUTHENTICATED` hata kodu ve oturumsuz `/auth/me` yanıtı tanımsız | docs/API_CONTRACT.md:12, :158 | F0-01 takip (ops.) / F1-01 |
| REV-F024 | Low | §1.1 `session:authenticated` "RBAC.md satırı" sütunu hâlâ "—" | docs/API_CONTRACT.md:58 | F0-01 takip (ops.) |
| REV-F028a | Low | :17 yazım (virgül, #14 K16) | docs/API_CONTRACT.md:17 | F0-01 takip (ops.) |
| QA3-F001 | Low | Değişiklik notu REV-F019(a) ve AC5 satırı 4563ca2'yi yansıtmıyor | docs/changes/chore_f0-01-api-contract.md | F0-01 takip (ops.) |
| REV-F026 / RR-F031 | Low | ADR-0005 :142 var olmayan S23'e atıf; "Açık kalanlar" §5.1 ile hizasız; S23→S22 ve S25 kararı ADR'de yok | docs/adr/0005-f0-01-contract-decisions.md:142, :235, :237 | **Düzeltildi (denetim oturumu, 2026-10-07):** :142 S23 atfı → mockup #38 + §5 S22; "Açık kalanlar" S20–S22 ile hizalandı; S23/S25 numaralandırma kaydı ADR-0005'e eklendi; BACKLOG RR-F022 satırı güncellendi |
| REV-F027 / RR-F031 | Low | PRODUCT_SPEC :166 ve ADR-0004 :37 eski K11 yüklemi ("zorunlu adımlar"); spec'te K16/K17 yok | docs/PRODUCT_SPEC.md:166, :172; docs/adr/0004-f0-pre-decisions.md:37 | **Düzeltildi (denetim oturumu, 2026-10-07):** spec :166 ve ADR-0004 :37 yüklemi akış motoru kuralına (INV-28) göre; spec'e K16 (05'e takım ekleme) ve K17 (CSM değişince aktarım) eklendi. İsteğe bağlı :172 notu yapılmadı |

### Açık sorular (round 3)
- Canlı projede (07 `done`) K2 kurulum tipi değişikliği 03'ü yeniden açıyor; K16 benzeri 409 koruması yok (Murat).
- "Onaysız Go-Live": `customer_approval` `out_of_scope` + `gonogo` `out_of_scope` iken #38 hep 409 (S22, Murat).
- Kapsam dışı aşamanın açık adımları iş sayılıyor (alerts.ts:50, 61) — INV-25 kapsamı, F6 öncesi.
- Kapsama dönen 03 `locked` olunca 04 açık kalıyor — F3-02 planında bilinçli tercih olarak yazılmalı.
- `customer_approval` "`out_of_scope` serbest" ↔ RR-F018 önceliği — F5-05 planı.

## chore/f0-02-cleanup (@ 980e65c, 2026-10-07 — round 1)

Gate kararı **MERGE'E HAZIR** (koşullu: CI GitHub'da kontrol edilmeli, `gh` yok). Bu branch F0-01 round 3 takip maddelerini (K19 sözleşme metni + REV-F028b, RR-F032/K20, RR-F029, RR-F030, RR-F028, REV-F025, REV-F024, REV-F028a, QA3-F001) `docs/API_CONTRACT.md` ve F0-01 değişiklik notuna yazdı; reviewer AC20/AC21 ile, rules-reviewer K19↔INV-25 karar tablosuyla doğruladı. Yalnızca RR-F028'in INV tarafı açık (RUL-02).

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-01 | Low | `tailwindcss-animate` → `devDependencies` plan dışı (3e08fe1 (squash; branch commit 84eeac9)); `--omit=dev --audit-level=high` yeşilinin bir nedeni bu sınıflandırma. Builder işi yok | package.json:82 | **Kapandı (M7, Murat 2026-10-09)** → PHASES F0-02 kapanış kaydı: yalnızca build-time, sürüm ve CSS aynı |
| REV-02 | Low | Değişiklik notunda şablonun "Mockup ↔ API" ve "Ekran görüntüleri" başlıkları yok | docs/changes/chore_f0-02-cleanup.md:266-289 | F0-02 fix (ops.) |
| REV-03 | Low | API_CONTRACT v1.3 geçmiş satırı C2 maddelerini C1 commit'inde önceden listeliyor; tek C2 revert'ünde tarihçe tutarsız kalır | docs/API_CONTRACT.md:315 | F0-02 fix (ops.) |
| RUL-01 | Low | Sözleşme #29 ve §2.2 hâlâ kaldırılmış `support_track` kuralını anıyor | docs/API_CONTRACT.md:100, :138 | F0-02 fix (ops.) / sonraki sözleşme turu |
| RUL-02 | Low | INV-28 (c) "05 `out_of_scope` + 07 `done`" için sözleşmeyle (D8 = (a), `409`) farklı okunuyor; M8 yapılmadı | docs/INVARIANTS.md:36 | **Karar verildi (M8, Murat 2026-10-09)** → INV-28 (c): 07 `done` ise `addTeam` 05'in durumundan bağımsız `409` (D8 = (a), ADR-0005 K16) |
| QA-01 | Low | AC14 mutasyon kanıtı gate'te yeniden üretilemedi: guard.mjs auditor rolünde geçici yazmayı (scratchpad kopya dahil) engelliyor | .claude/hooks/guard.mjs | Kit (Murat kararı) |
| QA-03 | Info | Go-Live "Müşteri onayı kaydedildi" başarı dalı toast'ı ekranda doğrulanmadı (hata dalı doğrulandı) | src/pages/project/Phase3Tabs.tsx:545 | F0-04 L5b turu |

### Açık sorular (round 1)
- RR-F029: `goLiveApproval` varken `customer_approval` `done → out_of_scope` serbest mi `409` mu (güvenli varsayım `409`) — F5-05 planı.
- K19: yeniden kilitlenen aşamanın `activatedAt`'i korunur mu (güvenli varsayım: korunur) — F3-02 planı.
- `addTicket` `priority: "high"` yolu (otomatik uyarı + audit) için koruma testi yok — Faz 2 öncesi.
- `InsightProposedFields` şemaya kopyalanmamalı; F0-04 `InsightProposal` #44 tür başına alan listesini zorlamalı (INV-19).
- Sözleşme/plandaki `store.tsx` satır başvuruları 1 satır kaydı (main @ 7ba26ef'e sabitli) — sonraki sözleşme turu.
- guard.mjs reviewer'ın `tsc -p tsconfig.app.json` komutunu da engelliyor — kit değişikliği gerekirse Murat.

## chore/f0-02-cleanup (@ b936fb7, 2026-10-09 — round 2)

Gate kararı **MERGE'E HAZIR** (CI run #57 yeşil, Murat doğruladı). Round 1'den RUL-01, REV-02, REV-03 düzeltildi ve doğrulandı (d419000, 5b85e7a, aee62be); yukarıdaki round 1 tablosu tarihsel. Round 1'den açık kalanlar: REV-01, RUL-02, QA-01, QA-03.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| RUL2-02 | Medium | Haftalık rapor `weekEnd = addBusinessDays(weekStart, 4)`: cumartesi/pazar kayıtları hiçbir rapora girmiyor; tam gün tatilli haftada `weekEnd` sonraki pazartesiye kayıyor (2026-10-26 → 11-02), o günün kaydı iki raporda. Snapshot dondurulduğu için (INV-27) kalıcı. Branch öncesinden kalma; pazartesi Date sabitlemesi artık gizliyor | src/lib/rabbitqa/reports.ts:28-29 | **Karar verildi → ADR-0005 K21 (Murat, 2026-10-09)**: takvim haftası Pzt 00:00 – Paz 23:59 Europe/Istanbul; INV-27 ve PRODUCT_SPEC güncellendi. Uygulama F7-02 (yalnızca API) |
| RUL2-01 | Low | `report_not_sent` uyarısının (cuma/hafta sonu, `sent` rapor, 07 `done`, seed snooze anahtarı) hiç testi yok; açık `today` ile tarih matrisi testi gerekli | src/lib/rabbitqa/alerts.ts:113-119 | F4-01 (Murat, 2026-10-09) |
| RUL2-03 | Low | TEST_STRATEGY §3 tek sabit saat (`2026-09-01T09:00:00+03:00`) yazıyor; mockup testleri `2026-10-05T09:00:00` yerel kullanıyor ve sabit iki dosyada ayrı tanımlı. §3'e mockup/API ayrımı + "haftanın gününe bağlı kurallar açık `today` ile test edilir" eklenmeli; ortak `MOCKUP_NOW` | docs/TEST_STRATEGY.md:49 | **Kapandı (2026-10-09)** → TEST_STRATEGY §3: API/mockup referans tarihleri + "tarih/uyarı/termin içeren testler zamanı sabitler" kuralı. Ortak `MOCKUP_NOW` → F0-06 |
| REV2-02 | Low | (RUL2-03 ile aynı konu, reviewer bakışı) "Gerçek saate bağlı test yok" ilkesi fb253e1'e kadar ihlal ediliyordu | docs/TEST_STRATEGY.md:49 | **Kapandı** (RUL2-03 ile) |
| REV2-01 | Low | API_CONTRACT v1.3 geçmiş satırı `support_track` kuralının kaldırılmasını (RUL-01, d419000) anmıyor | docs/API_CONTRACT.md:315 | F0-03 (Murat, 2026-10-09) |
| QA-F02-FLAKY | Low | Flaky adayı (paralel yük): `HandoverWorkspace.test.tsx` AC1 ve `HandoverWorkspace.toast-router.test.tsx` QA-02 yalnızca 3 suite paralel koşarken kırmızı (yük/zaman aşımı); tek başına ve sabitlemesiz yeşil (F0-02 değişiklik notu :347) | src/pages/project/workspaces/HandoverWorkspace.test.tsx; HandoverWorkspace.toast-router.test.tsx | F4-01 |

### Öneriler (round 2)
- §2.2 tablosundaki üstü çizili `support_track` satırı tablodan çıkarılıp altına not olarak yazılabilir (tablo başı cümlesiyle çelişmesin) — sonraki sözleşme turu.
- "seed produces reqdoc_not_shared only for p_lojistik" testine `computeAlerts(s, "2026-10-05")` assert'i eklensin (iddiayı seed anında sınasın).
- Dondurulmuş sahte Date: `ProjectDetail.tabs.test.tsx`'e ileride zaman damgası sıralaması assert'i eklenirse `shouldAdvanceTime` gerekir.

## F0-02 kapanış (main @ 3e08fe1, 2026-10-09)

Merge sonrası denetim oturumu (Murat talimatı):
- **Kapandı / karar verildi:** REV-01 (M7 → PHASES F0-02 kaydı), RUL-02 (M8 → INV-28 (c)), RUL2-02 (→ ADR-0005 K21, INV-27, PRODUCT_SPEC), RUL2-03 + REV2-02 (→ TEST_STRATEGY §3).
- **Yeniden hedeflendi:** RUL2-01 `report_not_sent` testi → F4-01; HandoverWorkspace AC1 / toast-router QA-02 flaky adayı → F4-01; REV2-01 → F0-03.
- **Açık kalan (round 1):** QA-01 (guard.mjs, kit — Murat kararı), QA-03 (F0-04 L5b).
- CI: `ci.yml` job seviyesindeki `hashFiles()` hatası Murat tarafından düzeltildi (5c41bd2); önceki 55 koşu geçersiz, ilk yeşil run #57.

## chore/f0-03a-upgrades (@ 0ccd22c, 2026-10-09 — round 1)

Gate kararı **DÜZELTME GEREKLİ** (High: REV-01 = QA-01, Sonner toast stili Tailwind 4 `@layer` × katmansız Sonner CSS). Medium maddeler düzeltme direktifinde; burada iz için.

**Round 2 (@ 9ace149) durumu:** REV-01/QA-01, REV-02, REV-03/QA-03, QA-02/REV-04, REV-06, QA-05, QA-06 düzeltildi ve doğrulandı. REV-05/QA-04 açık; dönem değişimi sonrası legend sırası F0-06'da ölçülecek.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-02 | Medium | Değişiklik notu L5b-A "38/38 0 px" ve "değişiklik yok" diyor; eşik 0'da toast çiftleri 19.451 / 8.665 px, diğer >0 çiftler açıklanmamış | docs/changes/chore_f0-03a-upgrades.md:27,290,297 | F0-03a fix |
| REV-03 / QA-03 (tooltip) | Medium | recharts 3 Tooltip varsayılan `itemSorter: 'name'`: "CSM başına müşteri ve açık iş" tooltip sırası ters ("Açık iş, Müşteri") | src/pages/ManagementReport.tsx:134 (+119, 126) | F0-03a fix |
| QA-02 / REV-04 | Medium (QA) / Low (REV) | recharts 3 `accessibilityLayer` varsayılan `true`: 4 grafik Tab ile odaklanıyor, tıklamada odak çerçevesi + tooltip | src/components/rq/KpiChart.tsx:11, src/pages/ManagementReport.tsx:115,123,131 | F0-03a fix — **Karar verildi (Murat, 2026-10-09): (a) `accessibilityLayer={false}`**, main davranışı. Gerekçe: uygulama fare ile kullanım esaslı, a11y öncelik değil → PHASES F9-04'e not (kapsam daraltılabilir) |
| REV-05 / QA-04 | Low | `Legend itemSorter={null}` sırası render'lar arasında değişebilir (recharts belgesi). qa-verifier "Bu ay → Bu hafta" sonrası tekrarlamadı; diğer dönemler denenmedi | src/pages/ManagementReport.tsx:119,126,134 | F0-06 (görsel regresyon setine dönem değişimi) |
| REV-06 | Low | `space-x/y` uyumluluk kuralı ADR-0006 K2'nin 3 kuralı dışında; `--value(number)` yalnızca çıplak sayıları kapsıyor (`space-y-px` / `space-y-[..]` sessizce v4 davranışı) | src/index.css:139-166 | F0-03a fix (yorum) — **Karar verildi (Murat, 2026-10-09): kural kabul → ADR-0006 K2 (d)** |
| QA-05 | Low | Eşik 0'da kalan farklar: `csm-insights-step-update-edit-dialog-status-open` en büyük kanal farkı 35, `manager-new-project-dialog` 10; neden kesinleşmedi (diyalog animasyon karesi / odak halkası?) | — | F0-03a fix (notta açıklama, REV-02 ile) |
| QA-06 | Low | Go-Live onayı iki toast'u üst üste bindiriyor ("Müşteri onayı kaydedildi" arkada kalıyor); ekran kanıtı yarım. main'de de var | Go-Live onay akışı (`p_isyatirim`) | F0-06 (kalıcı L3/L6 testi, round 1 QA-03 ile birlikte) |

### Öneriler / notlar (round 1)
- F0-03b: lock `--prefer-dedupe` ile üretilmiş; bayraksız yeniden kurulum Radix'i yeniden bölebilir → kurulum talimatına yazılsın (AC2 `.npmrc`'yi yasaklıyor).
- F0-06: kalıcı görsel betik eşik 0 + bbox raporu içersin; katmansız 3. taraf CSS (Sonner/Radix) Tailwind 4 utility'lerini ezer → toast ekranları regresyon setine. ADR-0006 K5 / plan §8.1'e tam-eşik geçişi (M2).
- QA-07 (Info): Playwright MCP'de `animate-fade-in` ekran karelerine bağlı ilerliyor; viewport "ısıtma" sonrası `fullPage` çekim gerekiyor. §8.1 yöntemine eklenmeli.
- QA-08 (Info): baseline yöntem farkları (`csm-tab-access-credentials` panel, `csm-phase00-handover-workspace` 2277 vs 1284 px, `manager-reports` animasyon ortası) — M-06 baseline yenilenirken düzeltilsin.
- QA-09 (Info): CSS bundle 68,25 → 86,12 kB (+%26).
- Bulgu değil: `ui/toast.tsx:70` Radix toast `focus:ring-2` rengi v4'te currentColor; Radix `toast()` çağrılmıyor, ulaşılamaz.

## chore/f0-03a-upgrades (@ 9ace149, 2026-10-09 — round 2)

Gate kararı **MERGE'E HAZIR**. Koşul: Murat QA2-04 yöntem sapmasını kabul etmeli. Engelleyici bulgu yok.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV2-01 | Low | Not "description/action/cancel kullanılmıyor" diyor, ama `description` HandoverWorkspace toast'ında kullanılıyor (görsel olarak main ile aynı, qa-verifier r2). "betik L5b-A bölümünde" ifadesi karşılıksız | docs/changes/chore_f0-03a-upgrades.md:465 | F0-03a (merge öncesi, isteğe bağlı) / F0-03b |
| REV2-02 | Low | `index.css` yorumundaki "sonner `<style>` bu dosyadan sonra eklenir" ifadesi yalnızca production için doğru, dev'de sıra ters. Sonuç v3 ile aynı | src/index.css:288-289 | F0-03a (isteğe bağlı) / F0-03b |
| REV2-03 | Low | Notta KPI hover tooltip satırı builder ölçümüyle desteklenmiyor (`kpiTooltipOnHover: null`). qa-verifier r2 ölçümü: iki tarafta `25.09.2026 / Değer : 40 %` | docs/changes/chore_f0-03a-upgrades.md:356,371 | F0-03a (isteğe bağlı) / F0-03b |
| REV2-04 | Low | `[class*="recharts-zIndex-layer_"]:focus` kuralı recharts'ın iç sınıf adına dayanıyor; sürüm değişince sessizce etkisiz kalabilir. ADR-0006 K2'de katmansız Sonner kuralları ve bu kural kayıtlı değil | src/index.css:312-318 | Denetim (M2): ADR-0006 K2 (e) + F0-06 regresyon adımı |
| REV2-05 | Low | Direktif 1–3'ün not güncellemeleri db255a0'da `[REV-02]` etiketiyle toplanmış; izlenebilirlik zayıf | docs/changes/chore_f0-03a-upgrades.md | Süreç notu (sonraki turlar) |

### Öneriler / notlar (round 2)
- QA2-04 (Info): A seti, computed stil ve odak ölçümleri MCP yerine qa-verifier'ın kendi `playwright-core` betikleriyle yapıldı. Neden: ajan araç listesinde `browser_evaluate` yok. Kit önerisi: `.claude/agents/qa-verifier.md` araç listesine `mcp__playwright__browser_evaluate` eklensin (Murat kararı).
- QA2-01 (Info): ham r2 PNG/diff seti `.verify/screens/f0-03a-gate-r2/` altında, commit edilmedi.
- QA2-02 (Info): toast `box-shadow` serileştirmesinde v3'ün iki şeffaf ring katmanı yok; görsel etkisi yok.
- QA2-03 (Info): Tailwind 4 `outline-hidden` yalnızca `forced-colors` modunda `2px solid transparent` veriyor; yüksek kontrast modunda v3'ten ayrışabilir (F9-04 kapsamı).
- F0-06: description'lı handover toast'ı ve grafik tıklaması (çerçeve yok) regresyon setine eklensin.
