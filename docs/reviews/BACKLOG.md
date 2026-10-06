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
| RUL-07 | Low | `updateMeeting` held toplantının type/date'ini gerekçesiz değiştirebiliyor | src/lib/rabbitqa/store.tsx:285-301 | M-09b/c |
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
- Locked aşamada pending adım olabiliyor, INV-25'e yakın boşluk — F1 servis katmanında kapatılmalı (rules-reviewer Açık soru 7)
- Plan dosyasının `main` yerine branch üzerinden gelmesi (2bf2de9) — iş akışı onayı gerekiyor (reviewer notu)
- `package-lock.json` main'de de `npm ci` ile senkron değil (pre-existing, bu PR'a özgü değil) — ayrı kapsam dışı commit önerilir (qa-verifier notu)

## feat/m09b-phase-workspace-handover (@ dbbcd41, 2026-10-04 — round 1)

REV-01, REV-02 (RUL-10 yarısı), REV-03, REV-04, REV-05, RUL-01 round 2'de (@ 6bf0590) düzeltildi ve doğrulandı. REV-06 de RUL-01 ile aynı kök nedenden kapandı (reviewer REV-17 ile teyit edildi) — aşağıdaki tablodan çıkarıldı.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-07 | Low | `approveInsight` otomatik adımda her `step_update`'i reddediyor, `out_of_scope` önerisi de dahil; plan ile `manualStatusError` arasında çelişki | src/lib/rabbitqa/store.tsx:648 | Açık soru — Murat kararı |
| REV-08 | Low | Manual adımlar ve `rowClickable=false` başlıklar işlevsiz `<button>` olarak çiziliyor (a11y) | src/pages/project/workspaces/PhaseWorkspaceSheet.tsx:57,72; ProjectDetail.tsx:335,340 | M-09c |
| REV-09 | Low | Geçersiz `?ws=` koduyla panel boş gövdeyle açılıyor | src/pages/ProjectDetail.tsx:237-240 | M-09c |
| REV-10 | Low | `highlightField` seçicisi `:disabled`/`[data-disabled]` öğeleri dışlamıyor | src/pages/project/workspaces/highlight.ts:9 | M-09c |
| REV-11 | Low | AC11 "v9 atılır" testi yanlış anahtara yazıyor, sürüm koruması fiilen test edilmiyor | src/lib/rabbitqa/store.test.tsx:370 | M-09c |
| RUL-02 | Low | AC12 c testi kilitli reqdoc fixture'ı kullanıyor, `pending→done` yolu L3'te hiç test edilmiyor | src/lib/rabbitqa/store.test.tsx:422-430 | M-09c |
| RUL-03 | Low | v9→v10 sürüm koruması testi zayıf (yanlış anahtar) | src/lib/rabbitqa/store.test.tsx:369-374 | M-09c |

### Açık sorular (Murat kararı gerekiyor, backlog değil ama not edildi)
- S6: Kilitli `reqdoc`'un `req_doc` yüklenince doğrudan `done` olması mı, yoksa kilitli kalıp aşama açılınca tamamlanması mı doğru? Spec'ten çıkarılamıyor (reviewer + rules-reviewer ortak notu).
- A11 (rules-reviewer): `done` olan ONPREM adımı SaaS'a geçince `done` kalıyor; spec "Kapsam dışı olur" diyor, kod "tamamlanmış işi koru" davranışında.
- Admin'in çalışma alanı yazma yetkisi (`canManageProject` → `isAllSeeing`) RBAC.md Karar 1 ile çelişiyor gibi görünüyor — F1 RBAC matrisinde netleşmeli.
- `canCreateProject` admin'e proje oluşturma izni veriyor, RBAC Karar 4 (projeyi yalnızca CSM/Manager oluşturur) ile uyumsuz — Murat kararı gerekiyor.
- PRODUCT_SPEC 01'deki "paylaşıldı işareti/tarihi" artık doküman `addedAt`'ı ile eşdeğer sayılıyor — spec metni güncellenmeli mi?

## feat/m09b-phase-workspace-handover (@ 6bf0590, 2026-10-04 — round 2)

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| RUL-05 | Medium | `applyInstallType`/`applyLlmChoice`, aşaması `done` olan adımı da `out_of_scope→locked` yapıyor; akış motoru `done` aşamadaki adımı asla açmıyor, adım sonsuza kadar kilitli kalır (INV-08). RUL-11 testi `not.toBe("out_of_scope")` gibi gevşek assertion'la gizliyor | src/lib/rabbitqa/rules.ts:35,40,100 | Açık soru — Murat kural kararı gerekiyor |
| REV-14 | Medium | `xlsx` (yasaklı paket, AGENTS.md §2) artık `npm ci` ile kuruluyor (QA-01 lock senkronu sonrası); `npm audit` high/prototype pollution/ReDoS bulgusu, kullanılmıyor | package.json:67 | F0 (ayrı chore commit) |
| RUL-06 | Low | RUL-11 testi "her geçişte audit" ve ruleKey tekilliğini (gpu_model/llm_integration) doğrulamıyor; AC12 e ara durumları (out_of_scope→locked→done) kontrol etmiyor | src/lib/rabbitqa/store.test.tsx:432-444,491,520-521 | M-09c |
| REV-15 | Low | `HandoverWorkspace.test.tsx`: audit sayısı render edilmeyen DOM'dan sayılıyor (hep 0), bir assert zaten geçen çağrıdan kaynaklanıyor, AC3 toast/tür ön değeri L3'te doğrulanmıyor | src/pages/project/workspaces/HandoverWorkspace.test.tsx:77,102,114,121 | M-09c |
| REV-16 | Low | Kural aksiyon durum etiketi satır içi yazılmış, `ACTION_STATUS_LABEL` kullanılmıyor (`in_progress` → "Açık" gösteriliyor) | src/pages/project/workspaces/HandoverWorkspace.tsx:165 | M-09c |

### Açık sorular (round 2, Murat kararı gerekiyor)
- RUL-05: `done`/`out_of_scope` aşamadaki adımların kural motorunca `locked`'a çevrilip çevrilmeyeceği netleşmeli.

## feat/m09b-phase-workspace-handover (@ 4d67bd3, 2026-10-05 — round 3)

Round 1-2 bulgularının tamamı (QA-01, QA-02, QA-03, REV-01…05, REV-12, REV-13, RUL-01) kodda doğrulandı. Yeni bulgular:

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| RUL-07 | Medium | RUL-05 ile bağlantılı: `reqdoc_not_shared` artık adım durumuna (`isOpenStep`) bakıyor; SaaS→On-prem geçişinde reqdoc kalıcı `locked` kalırsa (RUL-05 senaryosu) uyarı hiç üretilmiyor — önceki kod üretiyordu. On-prem projede paylaşılmamış doküman sessiz kalabilir | src/lib/rabbitqa/alerts.ts:68-69; rules.ts:35; flow.ts:52 | RUL-05 kararıyla birlikte |
| REV-18 | Low | Değişiklik notu "`npx tsc --noEmit` → temiz" diyor ama kök tsconfig hiçbir dosya derlemiyor; gerçek doğrulama `-p tsconfig.app.json` ile yapılmalı | docs/changes/...md:61; tsconfig.json | M-09c |
| REV-19 | Low | Manual/alansız adım panelde işlevsiz tıklanabilir `<button>` olarak çiziliyor (a11y) | PhaseWorkspaceSheet.tsx:57,72; ProjectDetail.tsx:335,339 | M-09c |
| REV-20 | Low | "Gerekçe (zorunlu)" ve DocumentUploadDialog etiketleri `htmlFor`/`id` ile bağlı değil (a11y) | HandoverWorkspace.tsx:40-41; Phase2Tabs.tsx:355,359,366 | M-09c |
| REV-21 | Low | `?ws=<kod>` çalışma alanı olmayan aşama için de boş panel açıyor | ProjectDetail.tsx:113,236-240,382-385 | M-09c |
| RUL-08 | Low | `setInstallChoice` doğrulaması closure'daki `state`'e karşı yapılıyor, aynı render döngüsünde art arda çağrılarda gerekçesiz değişiklik sızabilir (teorik, UI'da zor tetiklenir) | src/lib/rabbitqa/store.tsx:353-356 | M-09c / F1 |

### Açık sorular (round 3, Murat kararı gerekiyor)
- RUL-05 kararına `reqdoc_not_shared` sonucu (RUL-07) eklenmeli — karar hangi yönde olursa olsun ilgili alert testi yazılmalı.
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
- `canSeeCredentials` her DevOps kullanıcısına tüm projelerin erişim bilgisini gösteriyor; RBAC.md "atanmış DevOps" diyor — bu PR'da değişmedi (S4 kararı), 03 paneli yeni giriş noktası ekliyor. F1 RBAC matrisinde ele alınmalı.
- Admin `isAllSeeing` üzerinden 02/04/05 panellerini düzenleyebiliyor; RBAC.md admin'e salt okuma veriyor — bilinen açık soru (plan §5), F1'e bırakıldı.
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
- INV-06'daki "tarih değişikliği" kararın `decidedAt` alanını da kapsıyor mu? Kapsarsa REV-M06-01/RUL-01 zorunlu hale gelir.
