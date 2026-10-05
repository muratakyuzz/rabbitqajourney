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
