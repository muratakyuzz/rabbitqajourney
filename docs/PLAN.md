# Plan — Faz 1 (hızlı yol)

> 2026-10-10 · Tek geliştirici. `docs/PHASES.md` (F0–F9) yerine bu dosya geçerlidir.

## Kapsam
Yalnızca şu ekranlar gerçek API'ye bağlanır:
- **Ayarlar → Aşama şablonu**
- **Proje detayı → Aşamalar ve adımlar · Aksiyonlar · Toplantılar** (`MeetingDialog` dahil)

Diğer tüm ekranlar mockup kalır (store + localStorage) ve sonra **ekran ekran** aynı yöntemle taşınır.

## Çalışma kuralları
- Doğrudan `main`. Branch, `/plan`, `/gate`, rol ayrımı yok. Her kilometre taşı bitince `git tag mN`.
- Commit'ten önce `npm run check` (lint + typecheck + test) yeşil. CI (`app` + `secrets`) kırmızıysa önce o düzeltilir.
- Karar gerekirse bu dosyanın sonundaki "Kararlar" listesine bir satır yazılır. Ayrı plan dosyası, ADR, BACKLOG turu yok.
- Endpoint yolları ve şemalar `docs/API_CONTRACT.md` §2.1 / §3'ten alınır; **authorize, audit ve rol sütunları Faz 2'ye kadar yok sayılır.**

## Teknik kararlar (Faz 1)
| Konu | Karar |
|---|---|
| API | REST, Express 5, `/api` öneki; istek/yanıt doğrulaması `packages/shared` zod şemalarıyla; tek hata biçimi `{ error: { code, message, field? } }` |
| Veritabanı | **pg-mem**, bellekte. Sunucu her açılışta SQL şemasını kurar ve seed'i yükler. Restart'ta veri gider (bilerek). Migration runner, `schema_migrations`, checksum, parity job **yok** |
| Seed | Mockup'taki `seed.ts` `packages/shared`'a taşınır; web store ve API **aynı** seed'den beslenir (aynı id'ler) |
| Yetki | **Yok.** Herkes Admin. Giriş ekranı mockup (demo) kalır. API "geçerli kullanıcı" olarak seed'deki Admin'i kullanır (`createdBy`, `approvedBy` vb. için) |
| Audit | **Yok (Faz 2).** Gerekçe zorunlulukları API'de doğrulanır ve kaydın üzerinde saklanır (`reason` / `last_reason`), geçmiş tablosu yazılmaz |
| İş kuralları | `flow.ts`, `rules.ts`, `completion.ts`, `business-days.ts` → `packages/shared` (taşınır, kopyalanmaz); API ve web aynı kodu kullanır |
| Uyarılar | İstemcide, store'dan hesaplanmaya devam eder (değişiklik yok) |
| Yerel geliştirme | `npm run dev` API (3001) + web birlikte; Vite `/api` → 3001 proxy |

### Store köprüsü (mockup ile API'nin birlikte çalışması)
- **API'ye ait dilimler:** `template`, `phases`, `steps`, `actions`, `meetings`. Diğer dilimler store'da kalır.
- **Hidrasyon:** uygulama açılınca (ve proje açılınca) bu dilimler API'den okunup store'a yazılır. Bu modüllerdeki her değişiklik önce API'ye gider, dönen kayıt (+ `RuleEffects`) store'a uygulanır.
- **Yeni proje:** proje oluşturma diyaloğu `POST /api/projects` çağırır (şablondan kopyalama sunucuda). Proje kaydının diğer alanları (sağlık, satış devri, keşif…) store'da kalır.
- **Mockup ekranlardan gelen adım değişiklikleri** (veriyle tamamlanan adımlar, kurulum tipi/LLM kuralları, takım ekleme vb.) store'da hesaplanır ve `POST /api/projects/:projectId/steps/sync` ile (origin client-rule) sunucuya yazılır. Bu yol kilit kontrolünü atlar (INV-25). (M2a kararı; ilk taslakta `PATCH /api/steps/:id` + `origin` alanıydı.) İlgili ekran API'ye geçince köprü kalkar.
- **Restart tespiti:** `GET /api/health` bir `bootId` döner. Kayıtlı `bootId` farklıysa store seed'e sıfırlanır (localStorage temizlenir), böylece iki taraf aynı seed'den başlar.
- **Bilinen kısıtlar (Faz 2'de kalkar):** API'ye giden değişiklikler Geçmiş sekmesinde, "Son değişiklikler"de ve aksiyon geçmişinde görünmez. API restart olunca tüm veri seed'e döner.

---

## M0 — Süreç sadeleştirme + API iskeleti
- [x] `.claude/` sadeleşir: guard yalnızca `.env*` ve gizli anahtar dosyalarını korur; rol ve commit denetimi kalkar; `plan/gate/phase-close/fix` komutları ve ajanlar silinir; `build` = "PLAN.md'deki sıradaki maddeyi uygula"
- [x] `CLAUDE.md` / `AGENTS.md`: rol, gate, branch, yazma yetkisi bölümleri kaldırılır; bu dosyadaki çalışma kuralları yazılır
- [x] Kök `npm run check`; `docs/PHASES.md` başına "yerine docs/PLAN.md geçti" notu; BACKLOG'da GATE-01..03 "süreç değişti" ile kapanır
- [ ] `ci.yml`: parity ve check-migrations job'ları kaldırılır (Murat elle — gerekli değişiklik M0 kapanışında iletildi)
- [x] `apps/api`: Express 5, `/api` router, zod doğrulama + hata middleware'i, `GET /api/health` (`bootId`)
- [x] `apps/api/src/db`: pg-mem, `schema.sql` (bu kapsamın tabloları: users, projects, template_versions, phases, steps, actions, meetings, meeting_participants), açılışta şema + seed
- [x] `seed.ts` → `packages/shared`; web import'ları güncellenir; seed API'ye yüklenir
- [x] `npm run dev` (API + web), Vite proxy; Vitest + supertest API'de
- [x] Web: küçük `api` istemcisi (`fetch` + hata çevirisi), `bootId` kontrolü
- **Kabul:** `npm run check` yeşil · `GET /api/health` 200 · mockup ekranlar önceki gibi çalışır
- **Notlar:** 2026-10-10, tag `m0`.
  - `npm run check` yeşil: lint 0 hata / 27 uyarı; test sayıları api 18, web 227, shared 276.
  - `GET /api/health` 200, hem doğrudan hem Vite proxy üzerinden.
  - Tarayıcıda admin girişi, Genel bakış ve proje detayı (İş Yatırım) önceki gibi çalışıyor; konsolda hata yok.
  - bootId değişince store seed'e dönüyor, oturum korunuyor.
  - Seed ile birlikte iş kuralları da shared'a taşındı (M2'nin ilk maddesi).
  - pg-mem `ROLLBACK` desteklemiyor; yerine snapshot tabanlı `db.transaction` (bkz. Kararlar).
  - Yeni paketler: express, pg-mem, tsx, supertest (+ tipler).
  - Açık: `ci.yml` (Murat elle).

## M1 — Ayarlar → Aşama şablonu
- [x] `GET /api/config/template` (aktif sürüm), `PUT /api/config/template` → yeni sürüm (#39a); sistem adımı silinemez (`409`), yalnızca yeni projeler etkilenir
- [x] Gerekirse salt-okunur yardımcılar: `GET /api/users`, `GET /api/config/modules` (seed'den) — gerekmedi, eklenmedi
- [x] Ayarlar → Aşama şablonu sekmesi API'den okur/yazar; plan önizlemesi `packages/shared` ile istemcide
- [x] Testler: sürüm artışı, sistem adımı koruması, doğrulama hataları
- **Kabul:** şablon değişir → API restart'a kadar kalır → yeni proje yeni sürümle açılır (M2'de doğrulanır)
- **Notlar:** 2026-10-10, tag `m1`.
  - `npm run check` yeşil: lint 0 hata / 27 uyarı; test sayıları api 40, web 232, shared 276.
  - API: `GET`/`PUT /api/config/template` (`apps/api/src/modules/template/`). Kurallar `template.rules.ts`'te saf fonksiyon; yazma `db.transaction` içinde. `createdBy` = seed'deki ilk aktif admin (`core/current-user.ts`).
  - Şemalar `packages/shared/src/schemas/template.ts`. `domain/types`'taki `StepTpl`/`PhaseTpl` artık bu şemalardan türetiliyor.
  - Web: `TemplateEditor` → `pages/admin/TemplateEditor.tsx`. Şablon açılışta `RqProvider`'da API'den alınıp `state.template`'e yazılıyor; sürüm bilgisi (`templateVersion`) yalnızca bellekte, localStorage'a yazılmıyor. `setConfig("template")` kaldırıldı; başka çağıran yoktu.
  - Tarayıcıda denendi: 06'ya adım ekle → yukarı taşı → sil → kaydet ("Şablon kaydedildi · sürüm 2"). Yerel şablon silinip sayfa yenilenince sürüm 2 ve değişiklik API'den geldi. API restart → sürüm 1. Konsolda hata yok.
  - Bilinen: şablon değişikliği artık Ayarlar → Değişiklikler listesine düşmüyor (audit Faz 2).

## M2 — Proje açılışı + Aşamalar ve adımlar
- [x] İş kuralları `packages/shared`'a taşınır (`flow`, `rules`, `completion`, `business-days`); web testleri yeşil kalır — M0'da yapıldı (bkz. Kararlar)
- [x] `POST /api/projects` (#1): şablondan kopyalama (INV-10), kurulum tipi/LLM koşullu adımlar, iş günü termini, plan tahmini — M2a. Kurulum tipi/LLM koşullu adımlar açılışta yok (proje `installType: null` ile açılır; kurallar istemcide, sync ile gelir)
- [x] `GET /api/projects/:projectId/phases` — M2a. Yanıt `{ phases, steps }`; türetilmiş durum ve `ConditionResult` istemcide kalır (Kararlar)
- [x] `PATCH /api/phases/:id` (#3; plan bitişi gerekçeli), `POST /api/phases/:id/complete` (#4; aşama onayı, sonraki aşama açılır, onaylayan + tarih) — M2a
- [x] `PATCH /api/steps/:id` (#5): durum (gerekçeli), termin (gerekçeli), sorumlu/top; kilitli adıma elle değişiklik `409`; köprü `POST /api/projects/:projectId/steps/sync` — M2a
- [x] Store köprüsü: phases/steps hidrasyonu, yeni proje diyaloğu → API, mockup kurallarının adım değişikliklerini API'ye yazması — M2b
- [x] Testler: kopyalama, sıralı açılış, kilit, aşama onayı, gerekçe zorunluluğu, iş günü (tatil dahil) — API M2a, web köprüsü M2b
- **Kabul:** yeni proje → Aşamalar sekmesi API'den gelir; adım tamamla, termin değiştir, aşamayı onayla → sayfa yenilenince durur; uyarılar ve diğer sekmeler bozulmaz
- **Notlar:**
  - **M2a (API, 2026-10-10):** web'e dokunulmadı.
    - Desen: `apps/api/src/modules/projects/`. `loadProjectState` (kısmi `RqState`) → shared kural fonksiyonları aynen (`advanceFlow`, `buildFromTemplate`, `projectPlan`, `stepLockError`, `manualStatusError`, `ensureReviewAction`/`cancelReviewAction`; audit no-op) → `persistDiff` (yalnızca değişen/yeni aşama, adım, aksiyon) tek `db.transaction`'da.
    - Her yazma ucu `RuleEffects` = yalnızca değişen kayıtlar döner (`POST /projects`'te `project` dahil).
    - Şema: `projects`'e `salesperson_id`, `license_model`, `purchased_modules`; yeni `holidays` tablosu (seed: TR tatilleri); `steps.owner_id` FK'sı kaldırıldı (sahip kişi de olabilir).
    - Shared: `ProjectCore`, `ProjectCreate`, `Phase`/`Step`/`Action`, `PhasePatch`, `StepPatch`, `StepsSync`, `RuleEffects`, `PhasesWithSteps` şemaları. Domain'deki `Phase`/`Step`/`Action` tipleri bu şemalardan türetiliyor.
    - `npm run check` yeşil: lint 0 hata / 27 uyarı; test sayıları api 62, web 232, shared 276. API testleri `TZ=UTC` ile de geçiyor.
  - **M2b (web + köprü, 2026-10-10, tag `m2`):**
    - API: `steps/sync` body'sine opsiyonel `actions` (yalnız `source: "rule"` + `ruleKey`). Sunucu `projectId` + `ruleKey` ile eşleştirir; açık olanı, yoksa en yenisini seçer (`domain/rule-actions.ts`, web ile ortak). Sunucunun id'si korunur. `dev`/`start` `TZ=Europe/Istanbul`.
    - Web API: `lib/api/` (`client`, `template`, `projects`: `createProject`, `getPhases`, `patchPhase`, `completePhase`, `patchStep`, `syncProject`).
    - Store: `applyServerEffects` (saf kısmı `lib/rabbitqa/server-sync.ts` → `mergeEffects`). Proje başına "son sunucu görüntüsü" (`ServerView`: adım id → kanonik JSON, `ruleKey` → status/title/due/ownerId). Hidrasyon: açılışta her proje için paralel `GET phases`; 404 → yalnız yerel (`isLocalOnly`).
    - Köprü: her store değişikliğinde görüntüsü olan projeler için fark hesaplanır. 300 ms sonra `POST steps/sync` gider; proje başına sıralı kuyruk var; gönderilen kayıt beklenirken görüntüye işlenir. Hata → toast + `GET phases` ile yeniden yükleme (sunucu kazanır). Aynı fark art arda ikinci kez oluşursa gönderilmez, konsola uyarı yazılır (döngü koruması).
    - Ekranlar: Aşamalar sekmesindeki "Aşamayı tamamla", `StepDialog` (adım satırındaki düzenle; durum/termin/sorumlu/top/akış tek diyalogda), `PhaseDialog` ("Aşamayı düzenle": durum, plan tarihleri) ve yeni proje diyaloğu API'yi çağırıyor (`useServerAction`: busy + hata mesajı). `PhaseWorkspaceSheet` yalnız okur; çalışma alanlarındaki değişiklikler köprüden gider.
    - Tarayıcıda denendi:
      - Yeni proje → `POST /projects` + bir sync (`csm`, `sales_license`, `modules` done).
      - Termin gerekçeyle değişti (`PATCH`, `reason`).
      - Kurulum tipi, LLM, taahhüt yok, teklif, sözleşme ve brief → her biri tek sync. Brief sync'i istemcinin açtığı `phase_approval`'ı da taşıdı; sunucuda tek kayıt.
      - "Aşamayı tamamla" → 00 done, 01 açıldı, onay aksiyonu done.
      - Yenileme → durum kalıcı, sync gitmedi.
      - On-prem → SaaS → tek sync: 5 adım `out_of_scope` + yeni `saas_env`, sunucuda da aynı.
      - API restart → web ve sunucu seed'e döndü.
      - Konsolda hata yok.
    - `npm run check` yeşil: lint 0 hata / 27 uyarı; test sayıları api 65, web 247, shared 276.
  - **Faz 2'ye kalan "Hedef" kuralları (API_CONTRACT #3, #5):**
    - K10: tamamlanmış aşamayı yeniden açınca onaylayan, onay tarihi ve `actualEnd` temizlenir.
    - Kapsam dışından dönen aşama/adım önce `locked` olur, akışla açılır.
    - Tamamlanmış aşamadaki adıma elle durum değişikliği `409`.
    - Aşama kapsam dışı yapılınca açık `phase_approval` iptal edilir.
    - "Sahip ata" aksiyonu (rol bazlı sahip `ownerId: null`).
    - Tatiller yalnız seed'den; Ayarlar → Tatiller sunucuya gitmez.

## M3 — Aksiyonlar
- [x] `GET /api/projects/:projectId/actions`, `POST /api/projects/:projectId/actions` (#6), `PATCH /api/actions/:id` (#7; termin ve iptalde gerekçe zorunlu) — M3a
- [x] "Aşama onayı bekliyor" kural aksiyonu sunucuda (M2'deki adım/aşama değişiklikleriyle). M2'de `advanceFlow` ile geldi; aksiyon yazmaları da `changeProject`'ten geçiyor, testleri M3a'da.
- [x] Sahip kullanıcı veya müşteri kişisi olabilir: kişi id'si FK'siz saklanır (kişiler mockup'ta kalır), top sahibin tipinden türetilir (`domain/ball.ts`)
- [x] Aksiyonlar sekmesi + aksiyon paneli API'ye bağlanır — M3b
- [x] Testler: oluşturma, gerekçe zorunluluğu, tamamlama, kural aksiyonunun açılıp kapanması
- **Kabul:** sekmedeki tüm filtreler ve panel API verisiyle çalışır
- **Notlar:** 2026-10-10, tag `m3`.
  - **Önce iki düzeltme:**
    - `steps/sync` yanıtı, gönderilen tüm adım ve aksiyonların sunucudaki son halini de taşır (değişmemiş olsa bile). Sunucu bir değeri kabul etmeyip kendininkini korursa (ör. tamamlanmış aşamada `out_of_scope` adım) istemcinin kopyası düzelir.
    - `guard.mjs` Bash'te yalnız dosya yolu gibi görünen parçaları kontrol eder. `${x.key}`, `console.log(obj.key)` ve jq yolu (`.data.key`) engellenmez; özel anahtar adları (`id_rsa`), `server.key` ve `certs/a.pem` engellenir. Tek başına duran `obj.key` kelimesi dosya adından ayırt edilemediği için engellenir. Testi `.claude/hooks/guard.test.mjs`, kök `npm test`'e eklendi.
  - **M3a (API):**
    - Yeni modül: `apps/api/src/modules/actions/` (`listActions`, `createAction`, `updateAction`).
    - `changeProject`, `projectIdOf`, `requireReason`, `replace` → `projects/project-state.ts` (iki modül ortak kullanıyor).
    - Liste termine göre sıralı (terminsiz en sonda, sonra oluşturma zamanı).
    - Yazmalar `RuleEffects` döner; `POST` 201.
    - `last_reason` aksiyonda da saklanır.
    - `actions.meeting_id` FK'sı kaldırıldı (`owner_id` zaten FK'sızdı).
    - Shared: `ActionPatchSchema`, `ActionListSchema`, `domain/ball.ts` (`ballForOwner`), `defaultCustomerVisible`.
    - `steps/sync` her kaynaktan aksiyon kabul eder (bkz. Kararlar).
  - **M3b (web):**
    - `lib/api/actions.ts` (`getActions`, `createAction`, `patchAction`).
    - Aksiyonlar sekmesi ve paneli (`ActionDialog`) API'yi çağırır (`useServerAction`); hata panelde gösterilir.
    - Satırdaki "Tamamlandı" kutusu `PATCH status` gönderir (done ↔ open).
    - Filtreler store'dan çalışır.
    - Köprü: `ServerView.actions` (id → kanonik JSON) eklendi; `diffProject` kural dışı aksiyonları da gönderir.
    - Hidrasyon: proje başına `GET phases` + `GET actions` paralel; projenin aksiyonları sunucununkiyle değiştirilir (`replaceProjectData`). Hata sonrası yeniden yükleme de aksiyonları kapsar.
    - Store'daki `addAction`/`updateAction` çağıranları:
      - Önce: `addAction` ← Aksiyonlar sekmesi; `updateAction` ← aksiyon paneli ve AI `action_update` onayı (`approveInsight`).
      - Şimdi: `addAction` kaldırıldı (çağıran kalmadı). `updateAction` yalnız AI onayı için kaldı; değişikliği köprüden gider.
      - Toplantı diyaloğu (`addMeeting`) ve AI `action_create` onayının aksiyonları da köprüden gider.
  - Tarayıcıda denendi (Deniz Uzun, İş Yatırım):
    - Aksiyon ekle → `POST` 201 → yenileme → duruyor.
    - Termin değişti, gerekçe panelde soruldu, sonra kaydedildi.
    - Sahip müşteri kişisi (Sevcan Vural) yapıldı → top "Müşteri" (sunucuda `customer`).
    - "Tamamlandı" kutusu → `done`.
    - İptal → gerekçe soruldu → `cancelled`.
    - Toplantı kaydet diyaloğundan aksiyon → tek `steps/sync` → yenileme → aksiyon duruyor (`source: meeting`, `meetingId` yerel toplantının id'si).
    - Yenilemelerde sync gitmedi.
    - API restart → aksiyonlar seed'e döndü.
    - Konsolda hata yok.
  - `npm run check` yeşil: lint 0 hata / 27 uyarı; test sayıları api 85, web 259, shared 279, guard 3.

## M4 — Toplantılar
- [x] `GET /api/projects/:projectId/meetings`, `POST /api/projects/:projectId/meetings` (#8), `PATCH /api/meetings/:id` (#19; iptalde gerekçe)
- [x] Toplantı + kararlar + doğan aksiyonlar tek transaction'da (INV-28)
- [x] Toplantıyla tamamlanan adımlar ve `applyMeetingHeldRules` (Go/No-Go, DevOps devri → top DevOps'ta); "Yapıldı" için tarih ≤ bugün ve en az bir iç katılımcı
- [x] Toplantılar sekmesi, detay paneli ve `MeetingDialog` API'ye bağlanır ("Kaydedince tamamlanır: …" önizlemesi `packages/shared` ile)
- [x] Testler: transaction (aksiyon hatasında toplantı da yazılmaz), adım tamamlama, iptal gerekçesi
- **Kabul:** toplantı kaydı → ilgili adım Aşamalar'da tamamlanır, doğan aksiyonlar Aksiyonlar'da görünür
- **Notlar:** 2026-10-10, tag `m4`.
  - **API:**
    - Yeni modül: `apps/api/src/modules/meetings/` (`listMeetings`, `createMeeting`, `updateMeeting`). Yazmalar `changeProject(…, { meetingSteps: true })` üzerinden.
    - `persistDiff` toplantıları da yazar. Katılımcılar toplantıyla birlikte değişmiş sayılır ve yeniden yazılır.
    - `RuleEffects`'e `meetings` eklendi (şemada opsiyonel, API her yanıtta gönderir). `POST` 201 döner, yanıtta yeni toplantı ayrıca `meeting` alanında.
    - Liste: tarih azalan; her toplantı kendi aksiyonlarıyla (`actions`) gelir. Sözleşmedeki `total` ve filtreler yok.
    - `meeting_participants`'a `sort_order` eklendi (katılımcı sırası korunur). Kişi id'leri FK'sız. `last_reason` toplantıda da saklanır.
    - Aynı katılımcı iki kez gelirse tekilleştirilir.
    - Shared:
      - Şemalar: `MeetingSchema`, `MeetingCreateSchema`, `MeetingPatchSchema`, `MeetingListSchema`, `MeetingCreatedSchema`. `domain/types`'taki `Meeting` bu şemadan türetiliyor.
      - `domain/meetings.ts`: `meetingHeldError`, `stepsCompletedByMeeting`.
      - `applyStepCompletion`'a `{ only: "data" | "meeting" }` seçeneği eklendi. Varsayılan ikisini de işler; web'in davranışı değişmedi.
  - **Web:**
    - `lib/api/meetings.ts` (`getMeetings`, `createMeeting`, `patchMeeting`). Ayrıca `lib/rabbitqa/use-meeting-patch.ts` (busy + hata toast'ı).
    - Toplantılar köprüye girmez; `mergeEffects` toplantıları id ile yerleştirir.
    - Hidrasyon: proje başına `GET phases` + `GET actions` + `GET meetings` paralel çağrılır, sunucu kazanır. Hata sonrası yeniden yükleme toplantıları da kapsar.
    - API'ye bağlanan yerler:
      - `MeetingDialog`: tek `POST`; doğan aksiyonlar bu istekle gider. Hata ve yerel doğrulama diyalogda gösterilir. Ekler (`addDocument`) store'da kalır ve sunucunun toplantı id'siyle bağlanır.
      - Toplantılar sekmesi: "Yapıldı olarak işaretle" ve yeni "İptal et" (gerekçe diyaloğu, `MeetingCancelDialog`).
      - Go-Live → Go/No-Go "Toplantıyı kaydet".
      - Toplantı kartındaki "Müşteriye görünür" anahtarı (`ContinuityTab` → `MeetingExtras`).
      - `TrainingWorkspace` ve `MeetingStepSection` "Yapıldı olarak işaretle".
    - Bu dosyalarda başka toplantı yazan yer yok. `AdaptationWorkspace` ve `HandoverWorkspace` yalnız `MeetingDialog`'u açıyor; `MeetingDetailDialog` salt okunur.
    - Store'daki `addMeeting`/`updateMeeting` çağıranları:
      - Önce: `addMeeting` ← `MeetingDialog`, Go/No-Go; `updateMeeting` ← Toplantılar sekmesi, `TrainingWorkspace`, `MeetingStepSection`, `MeetingExtras`.
      - Şimdi çağıran kalmadı; ikisi de kaldırıldı (store testleri API testlerine taşındı). Store `applyMeetingHeldRules` çalıştırmıyor (INV-20).
  - **Tarayıcıda denendi** (Deniz Uzun):
    - Örnek Sigorta: ileri tarihli planlı Satış devri → "Yapıldı olarak işaretle" → `400` ve toast. Sonra gerekçeyle iptal edildi.
    - Örnek Sigorta: Kick-off "Yapıldı" + bir aksiyon. Diyalogda "Kaydedince tamamlanır: Kick-off toplantısı" göründü. Tek `POST` gitti; sunucuda `kickoff` done, aksiyon `source: meeting`, `meetingId` sunucunun id'si. Yenileme → aksiyon Aksiyonlar sekmesinde, `steps/sync` gitmedi.
    - Garanti, 04 paneli: session planlandı → `POST` + bir `steps/sync` (`training_plan` veri adımı istemcide, beklenen). "Yapıldı" → `training_plan` ve `training_done` sunucuda done.
    - Garanti Go-Live: Go/No-Go → `gonogo` Tamamlandı.
    - "Müşteriye görünür" anahtarı → `PATCH`, sync yok.
    - API restart → toplantılar seed'e döndü.
    - Konsolda yalnız bilerek tetiklenen `400` var.
  - `npm run check` yeşil: lint 0 hata / 27 uyarı; test sayıları api 110, web 259, shared 284, guard 3. API testleri `TZ=UTC` ve `TZ=Europe/Istanbul` ile de geçiyor.

## M5 — Kapanış
- [ ] Playwright: tek ana akış e2e (yeni proje → adım tamamla → toplantı kaydet + aksiyon → aksiyonu tamamla → aşamayı onayla)
- [ ] Tek inceleme turu (M0–M4 aralığı) ve görsel kontrol (bu dört ekran)
- [ ] `git tag faz1`
- **Notlar:**

---

## Faz 2 ve sonrası (bilerek ertelendi)
- Gerçek giriş, roller ve RBAC (`authorize()`, `perm.ts`)
- Audit: Geçmiş sekmesi, "Son değişiklikler", aksiyon geçmişi, Ayarlar → Değişiklikler
- Kalıcı PostgreSQL, migration runner, parity
- Diğer ekranların API'leri (ekran ekran): Müşteri listesi/başlık, Satış devri, Keşif/takım/KPI, Erişim, Dokümanlar, Riskler, Go-Live, Süreklilik, Kişiler, Ayarlar'ın diğer sekmeleri, Raporlar, Bana atananlar
- Uyarı motorunun sunucuya taşınması, AI Insight ve entegrasyonlar, Docker ve yayın

## Kararlar
- 2026-10-10: Süreç sadeleşti (doğrudan main, gate yok). Faz 1 kapsamı yukarıdaki dört ekran. Audit ve roller Faz 2. pg-mem + seed, kalıcılık yok.
- 2026-10-10 (M0): `seed.ts` tek başına taşınamadı (`completion`, `flow`, `alerts`, `reports`, `business-days`, `labels`, `types`'a bağlı). Bağımlılık kümesinin tamamı (+ `rules`) `packages/shared/src/domain/`'e taşındı, `@rabbitqa/shared/domain/<ad>` olarak import edilir. M2'nin "iş kuralları taşınır" maddesi böylece M0'da bitti. Testler web'de kaldı.
- 2026-10-10 (M0): Seed id'leri deterministik: aşama/adım `ph_<proje>_NN` / `st_<proje>_NN`, seed sırasında kuralların ürettiği id'ler `<önek>_seedNNNN`. Çalışma anında yeni kayıtlar rastgele `uid()` almaya devam eder.
- 2026-10-10 (M0): Tablo id'leri `text` (seed id'leri okunur metin; uuid değil). Enum CHECK'leri `schema.sql`'de `{{Ad}}` yer tutucusundan `AdSchema` değerleriyle üretilir (tek kaynak). Kişi id'leri (aksiyon sahibi, toplantı katılımcısı) FK'siz.
- 2026-10-10 (M0): pg-mem `ROLLBACK`'i yok sayıyor. `db.transaction` yazmaları sıraya dizer, başta `backup()` alır, hatada `restore()` eder. Bu yüzden **her yazma `db.transaction` içinden** yapılır. Sıralama Faz 1'de proje kilidinin (INV-08) yerini de tutar.
- 2026-10-10 (M0): API TS'i `tsx` ile çalışır (`tsx watch`); derleme adımı yok.
- 2026-10-10 (M1): Sistem adımı = `key`'i olan ya da `completion`'ı manual olmayan adım (seed'de manual olmayan her adımın `key`'i var). Kimlik `key` ile kurulur: aynı aşamada kalmalı, `completion`/`meetingType` değişmez. Yeni eklenen adım sistem adımı olamaz (`409`).
- 2026-10-10 (M1): Doğrulama sırası: şema (`400`) → `baseVersion` (`409`, `field: "baseVersion"`) → yapı (`400`) → sistem adımı (`409`). İstemci "Yenile"yi yalnızca `field: "baseVersion"` olan `409`'da gösterir.
- 2026-10-10 (M1): API'de zod varsayılan mesajları Türkçe (`z.locales.tr()`); `400` mesajı ilk hatanın mesajı, `field` ilk hatanın yolu (ör. `phases.6.steps.0.durationDays`).
- 2026-10-10 (M1): API'ye ulaşılamazsa editör yerel şablonu gösterir, "Şablonu kaydet" kapalıdır (yerel kayıt yolu yok).
- 2026-10-10 (M2a): Mockup kurallarının adım değişiklikleri için köprü `PATCH /api/steps/:id` + `origin: "client-rule"` değil, ayrı uç: `POST /api/projects/:projectId/steps/sync` (body `{ steps: Step[] }`, id'ye göre upsert, yeni adım eklenebilir, kilit kontrolü yok). Gerekçe: elle yapılan değişikliğin kuralları (kilit, gerekçe) ile kural sonucunun yazılması aynı uçta bayrakla ayrılmasın; köprü kalkınca uç silinir.
- 2026-10-10 (M2a): Sunucu `applyStepCompletion`/`stepConditionResult` çalıştırmaz (veri istemcide); `derivePhaseStatus` ve `ConditionResult` istemcide kalır. Bu yüzden `POST /projects` sonrası veri adımları (ör. `csm`) sunucuda `pending` kalır, istemci tamamlayıp sync ile yazar (store'daki `settleAll` bunu aynı anda yapıyordu).
- 2026-10-10 (M2a): Store'dan bilerek ayrılan noktalar:
  - `PATCH /phases/:id` `status: "done"`'ı `409` ile reddeder ("Aşamayı tamamla" kullanılır, INV-08).
  - Durum değişikliği de gerekçe ister (UI zaten istiyordu; store zorlamıyordu).
  - `baselineEnd` istekte kabul edilmez; boşsa `planEnd`'den bir kez yazılır (INV-07).
  - `POST /phases/:id/complete` zaten `done` aşamada `409`.
  - `PATCH /steps/:id`'de `done` gerekçesiz (K1); diğer elle durum değişiklikleri ve termin değişikliği gerekçeli (UI her durum değişikliğinde istiyordu).
  - Aynı müşteri adıyla ikinci proje `409` (adlar `trim` + Türkçe küçük harfle karşılaştırılır).
  - `csmId` olmayan bir kullanıcıysa `400`.
- 2026-10-10 (M2a): Sync'te aşaması `done` olan adımın durumu değişmez (RUL-05 Seçenek A). Kapsam dışından geri istenen adım için `ensureReviewAction`, kapsam dışına alınan adım için `cancelReviewAction` çalışır. Tamamlanmış aşamaya `out_of_scope` gelen yeni adım (`saas_env`) eklenir ve inceleme aksiyonu açılır.
- 2026-10-10 (M2a): Tatil takvimi sunucuda `holidays` tablosundan okunur (seed: TR tatilleri). Ayarlar → Tatiller hâlâ store'da; oradaki değişiklik sunucuya gitmez (ekran API'ye geçince kalkar).
- 2026-10-10 (M2b): Kural aksiyonlarının kimliği `projectId` + `ruleKey` (id değil): web ve API aynı kuralları ayrı çalıştırıp kendi kopyalarını açar. Seçim `domain/rule-actions.ts` → `currentRuleAction` (açık olan, yoksa en yeni), iki tarafta ortak. Köprü bir kural aksiyonunun yalnız status/title/due/ownerId alanlarını taşır.
- 2026-10-10 (M2b): Köprü yalnız adımları ve kural aksiyonlarını taşır; aşamalar taşınmaz. AI önerisi onayındaki aşama plan tarihi (`date_change` + `phaseId`) bu yüzden ayrıca `PATCH /phases/:id` ile yazılır (gerekçe = onay gerekçesi). AI `step_update` yerel `updateStep` + köprüden gider (kilit kuralları yerelde uygulanır).
- 2026-10-10 (M2b): Store'da eski `createProject` ve `completePhase` kaldırıldı (çağıran yok). `updatePhase`/`updateStep` yalnız AI öneri onayı (`approveInsight`) ve store testleri için kaldı.
- 2026-10-10 (M2b): `StepDialog` "Tamamlandı" için gerekçe istemiyor (API ile aynı, K1).
- 2026-10-10 (M2b): API'nin döndürdüğü proje store'da var olan projeyle birleşirken `installType`, `llmChoice`, `teams` ezilmez (bu alanlar Faz 1'de store'da değişiyor, API'ye yazılmıyor).
- 2026-10-10 (M2b): "Demo verisini sıfırla" artık store'u seed'e döndürüp projeleri API'den yeniden yükler (sunucu kazanır). Sıfırlama sunucuyu sıfırlamaz; bunun için API restart gerekir.
- 2026-10-10 (M2b): Yalnız yerel projeler (API'de 404) ekranlarda API çağrısı yapınca hata toast'ı görür; yerel yedek yol yok.
- 2026-10-10 (M3): Brief, aksiyon panelinde filtreler, "Tamamlandı" kutusu ve bir top türetme mantığı varmış gibi yazıyordu. Kodda yoktu: sekme filtresiz bir tabloydu, top elle seçiliyordu. M3b'de eklendi:
  - Filtreler:
    - Açık = `open`/`in_progress`
    - Geciken = açık + termini geçmiş
    - Top müşteride = açık + `ball: customer`
    - Bana atanan = açık + sahibi giriş yapan kullanıcı
    - Tamamlanan = `done`
    - Tümü
    - Varsayılan "Açık".
  - "Tamamlandı" kutusu satırda: `done` ↔ `open`. İptal edilmiş aksiyonda kapalı.
  - Top türetmesi `ai-mock.ts`'teki "kişi → müşteri" kuralı genişletilerek `domain/ball.ts`'e yazıldı:
    - Kullanıcı sahip → rolüne göre (csm/manager/admin → CSM, devops → DevOps, care → Customer Care).
    - Kullanıcı olmayan id → Müşteri (kişiler store'da, API tanımaz).
    - Sahip yoksa top elle seçilir.
- 2026-10-10 (M3): Top yalnız sahip değişince (ve oluşturmada) türetilir. Sahip aynı kalırsa top değişmez; istekteki `ball` yalnız sahipsiz aksiyonda uygulanır. Gerekçe: kural aksiyonlarında sahip ile top bilerek farklı olabilir (`llm_endpoint`: sahip CSM, top müşteri).
- 2026-10-10 (M3): `PATCH /actions/:id` gerekçeyi yalnız termin değişikliğinde ve `cancelled`'a geçişte ister. Tamamlama, yeniden açma ve `in_progress` gerekçesizdir. API_CONTRACT #7 her durum değişikliğinde istiyordu; brief'e göre daraltıldı. Panel de aynı kuralı uygular.
- 2026-10-10 (M3): Köprü (`steps/sync`) artık her kaynaktan aksiyon taşır:
  - Kural aksiyonları eskisi gibi `projectId` + `ruleKey` ile eşleşir.
  - Diğerleri istemcinin id'siyle, gönderildiği gibi upsert edilir.
  - 400 durumları: başka projenin id'si, bir kural aksiyonunun id'si, yabancı `projectId`, aynı id'nin iki kez gelmesi.
  - Köprü yolunda #7'nin gerekçe kuralları uygulanmaz (adımlardaki gibi; ekran API'ye geçince köprü kalkar).
- 2026-10-10 (M3): Elle tamamlanan ya da iptal edilen "Aşama onayı bekliyor" aksiyonu, aşama hâlâ onaya hazırsa akış motoru tarafından hemen yeniden açılır. Bu, mockup ve API_CONTRACT #7 ile aynı davranış; aşama "Aşamayı tamamla" ile kapanır.
- 2026-10-10 (M4): Brief'te olup kodda bulunmayanlar:
  - "Yapıldı" doğrulaması (tarih ≤ bugün, en az bir iç katılımcı) ne `MeetingDialog`'da ne store'da vardı. **Yeni:** shared `meetingHeldError`. API bunu `POST`'ta (`held` ise) ve `PATCH`'te uygular; `PATCH`'te yalnız durum, tarih ya da iç katılımcılar değişince bakılır, böylece eski kayıtlar düzenlenebilir kalır. Hata `400` (`field: date | internalIds`). `MeetingDialog` aynı fonksiyonla önceden kontrol eder. "UX §2.6" adlı bir belge repoda yok.
  - "Kaydedince tamamlanır: <adım>" önizlemesi yoktu; yalnız adım satırında "… toplantısı kaydedilince tamamlanır" ipucu vardı. **Yeni:** shared `stepsCompletedByMeeting` (held kuralları + adım tamamlama simülasyonu), `MeetingDialog`'da gösterilir.
  - Planlı toplantıyı iptal eden bir arayüz yoktu. **Yeni:** Toplantılar sekmesinde "İptal et" + gerekçe diyaloğu.
  - Brief'teki "Yapıldı olarak kaydet" düğmesinin kodundaki adı "Yapıldı olarak işaretle"; ad değişmedi.
  - Yapılmış toplantının tür/tarih değişikliği için de arayüz yok. Kural API'de uygulanır (gerekçe zorunlu), arayüz eklenmedi.
- 2026-10-10 (M4): `PATCH /meetings/:id` store'un kurallarıyla çalışır:
  - Durum yalnız `planned`'dan değişir, aksi `409`.
  - `cancelled`'a geçiş gerekçe ister.
  - `held` toplantının tür veya tarih değişikliği gerekçe ister.
  - Diğer alanlar (`isCustomerVisible`, notlar, katılımcılar …) gerekçesizdir.
  - `applyMeetingHeldRules` yalnız `planned → held` geçişinde ve `held` ile oluşturmada çalışır. Toplantı adımları ise her toplantı yazmasından sonra çalışır (`only: "meeting"`), bu yüzden tür değişikliği ya da iptal koşulu bozarsa adım geri açılır (`gonogo` ve DevOps topu geri alınmaz, API_CONTRACT #19).
- 2026-10-10 (M4): Varsayılanlar store'daki gibi: toplantı `isCustomerVisible: false`, doğan aksiyonlar `true`. Aksiyon başlığı kırpılır; boş kalırsa `400` (`actions.N.title`) döner ve hiçbir şey yazılmaz.
- 2026-10-10 (M4): Brief INV-28'i "tek transaction" için kullanıyor, `db/index.ts` de öyle. `docs/INVARIANTS.md`'de INV-28 aşama yeniden açma kuralı. Tek transaction kuralı tutuluyor; numara karışıklığı düzeltilmedi.
- 2026-10-10 (M4): Eğitim veri adımları (`training_plan`, `training_done`) sunucuda hesaplanmaz (M2a kararı). Toplantı yazıldıktan sonra istemci bunları tamamlar ve köprüden yazar; eğitim planlayınca bir `steps/sync` gitmesi bu yüzden beklenen davranış.
- 2026-10-11 (inceleme O1): Zorunlu metin alanları shared `requiredText` ile doğrulanır: kırpılır, boş/yalnız boşluk `400` (`field` alan yolu). Kapsam: aksiyon başlığı (oluşturma, düzenleme, toplantı aksiyonları `actions.N.title`, köprü), adım başlığı, aşama kodu/adı, müşteri ve proje adı, şablon adım/aşama adları. Web istemcisinde şemaya uymayan başarılı yanıt `ApiError` `INVALID_RESPONSE` olur (alan yolu + kayıt id'si); hidrasyonda konsola yazılır ve toast gösterilir, proje köprü dışında kalır.
