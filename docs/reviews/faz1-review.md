# Faz 1 inceleme — m0..HEAD

> 2026-10-10 · Salt-okunur inceleme, kod değiştirilmedi. Kapsam `git diff m0..HEAD` (064f3b0), bağlam `docs/PLAN.md` (Kararlar dahil).
> "Doğrulandı" diye işaretlenen bulgular geçici bir supertest betiğiyle (repo dışında, `createApp` + `createDb`) denendi.

## Özet

| # | Bulgu | Önem |
|---|---|---|
| Y1 | Go-Live onayı 07'yi yalnız store'da kapatıyor; aşama sunucuya gitmiyor | Yüksek |
| Y2 | API (ve Vite proxy'si) tüm ağ arayüzlerine bağlanıyor | Yüksek |
| O1 | Boşluk başlıklı aksiyon kaydediliyor ve projenin hidrasyonunu kalıcı bozuyor | Orta |
| O2 | Sync hatasında yeniden yükleme bekleyen değişiklikleri siliyor; ağ hatasında köprü sessizce kapanıyor | Orta |
| O3 | Aşama `actualStart`/`actualEnd` gerekçesiz değişiyor | Orta |
| D1 | Hidrasyon yanıtı arada yapılan yazmayı eziyor | Düşük |
| D2 | Kilitli adımda termin/sahip/süre değişikliği kabul ediliyor | Düşük |
| D3 | Aksiyon `cancelled` olarak oluşturulunca iptal gerekçesi atlanıyor | Düşük |
| D4 | `customer_approval` elle `done` yapılabiliyor (Go-Live onayı atlanır) | Düşük |
| D5 | 413/415 gövde hataları `500 INTERNAL` dönüyor | Düşük |
| D6 | Oturum ortasında API restart'ı fark edilmiyor | Düşük |
| D7 | Kullanılmayan kod | Düşük |
| D8 | PLAN.md ile kod arasındaki tutarsızlıklar | Düşük |

---

## Yüksek

### Y1 — Go-Live onayı 07'yi yalnız store'da kapatıyor; aşama sunucuya gitmiyor
- **Yer:** `apps/web/src/lib/rabbitqa/store.tsx:566-597` (aşama yazımı `:589`); köprü kapsamı `apps/web/src/lib/rabbitqa/server-sync.ts:41-46`
- **Ne oluyor:** `approveGoLive` (Go-Live sekmesi, `Phase3Tabs.tsx:552`), zorunlu adımlar tamamsa 07'yi store'da `done` yapıyor ve `approvedBy`/`approvedAt`/`actualEnd` yazıyor. Kararlar (M2b) gereği köprü yalnız adımları ve aksiyonları taşıyor, aşamaları taşımıyor. AI `date_change` için ayrıca `PATCH /phases` eklenmiş, bu yol unutulmuş. Sonuç:
  - Sunucuya yalnız `customer_approval: done` gidiyor. Ayrıca istemcinin `settleAll`'ı yerelde 08'i açtığı için 08'in adımları da `pending` olarak gidiyor. Sync kilit kontrolü yapmadığından bunlar sunucuda **kilitli 08 aşamasının altına** `pending` olarak yazılıyor.
  - Sunucuda 07 `in_progress` kalıyor. `advanceFlow` 07'yi onaya hazır görüp yeni bir `phase_approval:07` (açık) açıyor.
  - İstemci bu aksiyonu alıyor. Yerelde 07 `done` olduğu için akış motoru aksiyonu `done` yapıp geri gönderiyor. Sunucu onu kapatıp yeniden açıyor (`flow.ts` c adımı). Bir sonraki tur aynı farkı ürettiği için döngü koruması (`store.tsx:216`) durduruyor; elde konsol uyarısı ve sunucuda fazladan kural aksiyonu kayıtları kalıyor. (Bu tur kodun okunmasıyla çıkarıldı, tarayıcıda denenmedi.)
  - Sayfa yenilenince sunucu kazanıyor: 07 yine "Devam ediyor", "Aşama onayı bekliyor" açık, onaylayan ve tarih yok. Store'daki `goLiveApproval` ise kalıyor.
- **Nasıl tetiklenir:** Go/No-Go yapılmış, açık taahhüdü olmayan bir projede (ör. Garanti) Go-Live sekmesinden müşteri onayını kaydetmek, sonra sayfayı yenilemek.
- **Önerilen düzeltme:** Faz 1'de en küçük değişiklik: `approveGoLive` aşamayı store'da kapatmasın. `customer_approval` köprüden gittikten sonra (projenin sync kuyruğu boşaldığında) `POST /api/phases/:id/complete` çağrılsın ve yanıt `applyServerEffects` ile yerleşsin. Onaylayan Faz 1'de seed admin olur, PLAN'da zaten böyle. Daha temiz alternatif #38'i (`POST /projects/:id/go-live/approval`) şimdi eklemek, ama bu Faz 1 kapsamını genişletir. Her iki yolda da bir web testi: onay → `completePhase` çağrıldı, sync'te 08 adımı yok.

### Y2 — API (ve Vite proxy'si) tüm ağ arayüzlerine bağlanıyor
- **Yer:** `apps/api/src/server.ts:10` (`app.listen(port, …)`, host verilmemiş → `::`/`0.0.0.0`); `apps/web/vite.config.ts:14` (`host: "::"`, `/api` proxy'si). İkisi de m0'dan beri böyle, bu aralıkta değişmedi. Madde 6 doğrudan sorduğu için buraya yazıldı.
- **Ne oluyor:** Faz 1'de kimlik doğrulama yok (bilerek), herkes Admin. Aynı ağdaki herkes `http://<makine-ip>:3001/api/...` ya da `http://<makine-ip>:8080/api/...` üzerinden proje oluşturabilir, aşama onaylayabilir, şablonu değiştirebilir.
- **Nasıl tetiklenir:** `npm run dev` açıkken başka bir makineden `curl -X PUT http://<ip>:3001/api/config/template …`.
- **Önerilen düzeltme:** `app.listen(port, "127.0.0.1", cb)`, log satırı da buna göre. Vite'ta `host: "127.0.0.1"` (ya da `localhost`). LAN'dan erişim gerekiyorsa bunu PLAN Kararlar'a bilinçli bir istisna olarak yazın. Ek savunma (isteğe bağlı, DNS rebinding'e karşı): API'de `Host` başlığı `localhost`/`127.0.0.1` değilse `403`.

---

## Orta

### O1 — Boşluk başlıklı aksiyon kaydediliyor ve projenin hidrasyonunu kalıcı bozuyor (doğrulandı)
- **Yer:** `packages/shared/src/schemas/action.ts:8` (`title: z.string().min(1)`, trim yok); `apps/api/src/modules/actions/actions.service.ts:26` (`input.title.trim()`, boş kontrolü yok)
- **Ne oluyor:** `"   "` şemadan geçiyor, servis kırpınca `""` yazılıyor. Bundan sonra `GET /projects/:id/actions` yanıtı `ActionListSchema`'ya uymuyor (`title` min 1). Web istemcisi `schema.parse` ile atıyor, `hydrate` bunu "offline" sayıp `views.current.delete(pid)` yapıyor (`store.tsx:190`). Sonuç: o proje **her açılışta** köprü dışında kalıyor, konsolda yanıltıcı "API'ye ulaşılamadı" yazıyor. Bu, API restart'ına kadar sürüyor. `POST` yanıtının kendisi de `RuleEffectsSchema` ile parse edilemiyor, yani kayıt yazılmış olsa da kullanıcı hata görüyor.
- **Nasıl tetiklenir:** `POST /api/projects/p_akbank/actions` `{ "title": "   ", … }` → `201`, `actions[0].title === ""`. Ardından `GET …/actions` gövdesi `ActionListSchema.safeParse` → `success: false`.
- **Önerilen düzeltme:** `ActionCreateSchema.title` → `z.string().trim().min(1, "Başlık boş olamaz.")` (`ActionPatchSchema` zaten böyle). `MeetingCreate.actions` aynı şemayı kullandığı için `meetings.service.ts:53-54`'teki elle kontrol gereksiz kalır, ama `field` yolu (`actions.N.title`) korunur. Test: boşluk başlık → `400`, `field: "title"`.

### O2 — Sync hatasında yeniden yükleme bekleyen değişiklikleri siliyor; ağ hatasında köprü sessizce kapanıyor
- **Yer:** `apps/web/src/lib/rabbitqa/store.tsx:225-229` (`catch` → `await hydrate(pid)`), `:178-198` (`hydrate`), `:187` (`replaceProjectData`), `:190` (`views.current.delete`)
- **Ne oluyor:**
  1. **4xx/5xx:** `hydrate` başarılı olur ve `replaceProjectData` projenin adım ve aksiyonlarını sunucununkiyle **tümden** değiştirir. Kaybolanlar yalnız reddedilen fark değil: hata beklenirken debounce'ta bekleyen sonraki değişiklikler de gidiyor. Bu değişiklikleri tetikleyen store alanları ise yerinde kalıyor (`installType`/`llmChoice`, `teams`, `goLiveApproval`, onaylanmış AI önerisinin durumu, taahhütler). `settleAll` yalnız veri/toplantı tamamlamasını ve akışı yeniden üretiyor. `applyInstallType`, `addTeam`'in `adapt:<takım>` adımı, AI `action_create` gibi sonuçlar yeniden üretilmiyor. Proje alanı ile adımlar kalıcı olarak ayrışıyor. Örnek: kurulum tipi SaaS görünüyor ama adımlar on-prem.
  2. **Ağ hatası (API kısa süre erişilemez):** `hydrate` de başarısız olur ve `views.current.delete(pid)` çalışır. O proje oturumun geri kalanında **köprü dışı** kalıyor; tek uyarı ilk toast. Yeniden deneme yok. Sonraki yerel değişiklikler hiç gönderilmiyor ve bir sonraki açılıştaki hidrasyon onları sessizce siliyor. Açılışta API kapalıysa (`hydrateAll` → hepsi "offline") aynı durum tüm projeler için geçerli.
- **Nasıl tetiklenir:** (1) için sunucunun 400 döndüğü herhangi bir sync, ör. O1'deki gibi şemaya uymayan bir kayıt. (2) için `npm run dev` açıkken API'yi birkaç saniye durdurup bir mockup ekranında veri adımını tamamlamak (ör. modül seçimi), API'yi açıp sayfayı yenilemek.
- **Önerilen düzeltme:**
  - "offline"da görüntüyü silmek yerine koru ve projeyi "beklemede" işaretle. Bir sonraki store değişikliğinde ya da kısa aralıklı yeniden denemede tekrar `flush` et. Kalıcı bir uyarı göster (ör. "N değişiklik gönderilemedi").
  - 4xx'te tümden değiştirmeden önce kullanıcıya hangi değişikliğin geri alındığını söyle (toast metni). Bu yolun PLAN'daki "sunucu kazanır" kararının bilinçli sonucu olduğunu ve store'da kalan tetikleyici alanların ayrışabileceğini Kararlar'a yaz.
  - Test: `bridge.test.tsx`'e "sync ağ hatası → API geri gelince fark gönderilir" ve "sync 400 → sonradan gelen bekleyen değişiklik" senaryoları.

### O3 — Aşama `actualStart`/`actualEnd` gerekçesiz değişiyor (doğrulandı)
- **Yer:** `apps/api/src/modules/projects/projects.service.ts:81-83`
- **Ne oluyor:** Gerekçe yalnız durum ve `planStart`/`planEnd` değişikliğinde isteniyor. INV-06 (1) ve API_CONTRACT #3 fiili tarihleri de (`actualStart`/`actualEnd`) gerekçe zorunlu sayıyor. PLAN Kararlar'da bu alanlar için bir istisna yok. Arayüz (`PhaseDialog`) bu alanları göndermiyor, yani bugün yalnız API düzeyinde açık.
- **Nasıl tetiklenir:** `PATCH /api/phases/<açık aşama>` `{ "actualStart": "2019-01-01", "actualEnd": "2020-01-01" }` → `200`.
- **Önerilen düzeltme:** `datesChanged`'e `actualStart`/`actualEnd` değişikliğini ekle. Test: gerekçesiz `400 REASON_REQUIRED`, gerekçeli `200` + `last_reason`.

---

## Düşük

### D1 — Hidrasyon yanıtı arada yapılan yazmayı eziyor
- **Yer:** `apps/web/src/lib/rabbitqa/store.tsx:178-187`, `server-sync.ts:105-112`
- **Ne oluyor:** `hydrate` üç `GET`'i başlatıyor. Yanıtlar dönene kadar projenin görüntüsü yok:
  - Bu sırada bir API yazması (ör. "Aşamayı tamamla") olursa `applyServerEffects` onu store'a yazıyor ama görüntüye kaydetmiyor.
  - Ardından yazmadan **önce** okunmuş `GET` sonucu `replaceProjectData` ile hem store'u hem görüntüyü eski haline getiriyor.
  - Aynı pencerede mockup ekranında yapılan yerel adım/aksiyon değişiklikleri de siliniyor.
  
  Ekran yenilemeye kadar eski durumu gösteriyor.
- **Nasıl tetiklenir:** Açılışta ya da "Demo verisini sıfırla"dan hemen sonra (`store.tsx:824-829`), hidrasyon bitmeden bir projede yazma yapmak. Yerelde pencere milisaniyeler, yavaş bağlantıda daha geniş.
- **Önerilen düzeltme:** Proje başına bir "hidrasyon nesli" sayacı tut. Hidrasyon sırasında gelen `applyServerEffects`'i, `replaceProjectData`'dan sonra yeniden uygula (ya da yazma varsa hidrasyon sonucunu at ve yeniden çek). Yerel değişiklikler için: hidrasyon bitene kadar o projede mockup yazmalarını kuyruğa al ya da hidrasyondan sonra `diffProject` ile yeniden uygula.

### D2 — Kilitli adımda termin/sahip/süre değişikliği kabul ediliyor (doğrulandı)
- **Yer:** `apps/api/src/modules/projects/projects.service.ts:125-126` (`stepLockError(old, patch.status)` yalnız durumu kontrol ediyor)
- **Ne oluyor:** PLAN M2 maddesi "kilitli adıma elle değişiklik `409`" diyor. API_CONTRACT #5 (RR-F017) "kilitli adımda `due` değişikliği → `409`" ve "`durationDays` yalnız adım kilitliyken" diyor. API ise kilitli adımda gerekçeli `due` değişikliğine `200` dönüyor ve `durationDays`'i her durumda kabul ediyor. Faz 2'ye kalanlar listesinde (PLAN.md:107-113) bu kural yok.
- **Nasıl tetiklenir:** `PATCH /api/steps/<locked adım>` `{ "due": "2030-01-01", "reason": "x" }` → `200`.
- **Önerilen düzeltme:** Kilitli adımda `due` → `409`; kilitli olmayan adımda `durationDays` → `409` (sözleşme). Ya da kararı PLAN Kararlar'a "Faz 2" olarak yazın.

### D3 — Aksiyon `cancelled` olarak oluşturulunca iptal gerekçesi atlanıyor (doğrulandı)
- **Yer:** `apps/api/src/modules/actions/actions.service.ts:27` (`status: input.status`), `packages/shared/src/schemas/action.ts:13`
- **Ne oluyor:** `POST /projects/:id/actions` `status: "cancelled"` kabul ediyor (`201`), gerekçe yok. M3 kararında iptal gerekçe istiyor. INV-06 "oluştururken girilen ilk değer gerekçe istemez" diyor, yani teknik olarak ihlal değil, ama iptal edilmiş bir aksiyonun "oluşturulması" anlamsız.
- **Önerilen düzeltme:** `ActionCreateSchema.status` → `open | in_progress` (gerekirse `done`). Toplantı diyaloğunun gönderdiği değerleri kontrol edin.

### D4 — `customer_approval` elle `done` yapılabiliyor; Go-Live onayı atlanır
- **Yer:** `apps/api/src/modules/projects/projects.service.ts:120-144`
- **Ne oluyor:** API_CONTRACT #5 (§5 S22, RR-F022) "`customer_approval` yalnız #38 ile `done` olur; elle `done` → `409`" ve "açık taahhüt varken `commit_check` elle `done` → `409`" diyor. API'de ikisi de yok. Elle `done` → onay aksiyonu → `POST /phases/:id/complete` yolu 07'yi müşteri onayı ve taahhüt kontrolü olmadan kapatabiliyor. PLAN'ın Faz 2'ye kalanlar listesinde yok.
- **Önerilen düzeltme:** İki kuralı `updateStep`'e ekleyin (taahhütler store'da olduğu için `commit_check` Faz 1'de uygulanamaz). Ya da Faz 2'ye kaldığını PLAN'a yazın. Y1'in düzeltmesiyle birlikte ele alınması mantıklı.

### D5 — 413/415 gövde hataları `500 INTERNAL` dönüyor (doğrulandı)
- **Yer:** `apps/api/src/http/errors.ts:40-45`
- **Ne oluyor:** Yalnız `entity.parse.failed` eşleniyor. 100 kB'ı aşan gövde (`entity.too.large`, body-parser `status: 413`) ya da desteklenmeyen charset `500` + `console.error` ile dönüyor. Yığın izi sızmıyor, ama durum kodu yanlış.
- **Önerilen düzeltme:** `err.type` / `err.status` 4xx olan body-parser hatalarını aynı durumla (`413` → `VALIDATION`, "İstek gövdesi çok büyük.") döndürün. Test ekleyin.

### D6 — Oturum ortasında API restart'ı fark edilmiyor
- **Yer:** `apps/web/src/lib/boot.ts:15-30` (yalnız açılışta), `store.tsx:209-233`
- **Ne oluyor:** `npm run dev` altında `tsx watch` her API dosyası kaydında sunucuyu seed'e döndürüyor. Açık sekme bunu bilmiyor:
  - Seed projelerinde köprü, eski görüntüye göre hesaplanan farkı seed'in üzerine yazıyor; sonuç karışık bir durum.
  - Oturumda açılmış projeler `404` alıyor ve yerel-only'ye düşüyor.
  
  Sayfa yenilenince `bootId` farkı her şeyi düzeltiyor. Bu yüzden önemi düşük, ama PLAN'daki "API restart olunca tüm veri seed'e döner" notu bu karışmayı kapsamıyor.
- **Önerilen düzeltme:** Sync/yazma yanıtında ya da `404`'te `GET /health`'e bakın. `bootId` değiştiyse "Sunucu yeniden başladı, sayfayı yenileyin" uyarısı gösterin ve köprüyü durdurun.

### D7 — Kullanılmayan kod
- `apps/web/src/lib/rabbitqa/store.tsx:3` `projectPlan`; `:8` `DEFAULT_PROJECT_INTEGRATIONS`, `buildFromTemplate`; `:14` `Meeting` tipi. Kaldırılan `createProject`/`addMeeting`/`updateMeeting`'ten kalan import'lar. `tsc --noUnusedLocals` ile bulundu; lint kuralı (`no-unused-vars: off`) ve tsconfig (`noUnusedLocals: false`) bunları yakalamıyor.
- `store.tsx:109, 834` `isLocalOnly` Ctx'te; yalnız `bridge.test.tsx` kullanıyor, hiçbir ekran kullanmıyor.
- `apps/web/src/lib/rabbitqa/server-sync.ts:56-59` `projectFromCore`, `apps/api/src/modules/projects/project-state.ts:21-27` `toDomainProject` ile aynı varsayılanları ayrı ayrı yazıyor. İkisi `packages/shared`'da tek fonksiyon olabilir (INV-19 ruhu).
- **Önerilen düzeltme:** İmport'ları silin. `isLocalOnly`'yi ya bir ekranda kullanın (ör. ProjectDetail'de "Bu proje yalnız yerel" bandı) ya da Ctx'ten çıkarın. Varsayılan proje alanlarını shared'a taşıyın.

### D8 — PLAN.md ile kod arasındaki tutarsızlıklar
- `docs/PLAN.md:44`: `ci.yml` maddesi `[ ]` duruyor, oysa `44dd6ca` (bu aralıkta) parity ve check-migrations job'larını kaldırdı. `.github/workflows/ci.yml:34`'te "parity job'una output olarak aktarılır" yorumu kalmış (Murat elle).
- `docs/PLAN.md:32`: "Hidrasyon: uygulama açılınca **(ve proje açılınca)**". Kodda yalnız açılışta, "Demo verisini sıfırla"da ve sync hatasında (`store.tsx:205-207, 228, 829`) var; proje açılınca yok.
- `docs/PLAN.md:80`: "kilitli adıma elle değişiklik `409`". Kod yalnız durum için uyguluyor (D2).
- `docs/PLAN.md:240-241` (M2b Kararlar): "Köprü aşamaları taşımaz" ve "`updatePhase`/`updateStep` yalnız AI öneri onayı için kaldı" yazıyor. `approveGoLive` store'da aşama yazan üçüncü bir yol olarak listede yok (Y1).
- INV-06 / API_CONTRACT #3'teki `actualStart`/`actualEnd` gerekçesi ve #5'teki S22 kuralları için PLAN'da ne "uygulandı" ne de "Faz 2'ye kaldı" kaydı var (O3, D4).

---

## Madde 4 — Gerekçe kuralları eşlemesi

| Kural (kaynak) | API'de | Test |
|---|---|---|
| Aşama durum değişikliği gerekçeli (M2a Kararlar) | `projects.service.ts:83` ✔ | Yalnız pozitif yol var (testler hep `reason: "x"` gönderiyor). **Gerekçesiz durum değişikliği → 400 testi yok** |
| Aşama `planEnd` gerekçeli (#3, INV-06) | `:81-83` ✔ | `projects.test.ts:165` ✔ |
| Aşama `planStart` gerekçeli | `:81-83` ✔ | **Test yok** |
| Aşama `actualStart`/`actualEnd` gerekçeli (INV-06, #3) | ✘ (O3) | — |
| Aşama `last_reason` saklanır | `:93` ✔ | **Test yok** (adım, aksiyon, toplantıda var) |
| Adım termin gerekçeli (#5) | `:130-132` ✔ | `projects.test.ts:141` ✔ |
| Adım `done` dışı durum gerekçeli, `done` gerekçesiz (K1) | `:132` ✔ | `projects.test.ts:141` (out_of_scope, boşluk gerekçe), `:119` (done gerekçesiz) ✔ |
| Aksiyon termin gerekçeli (M3) | `actions.service.ts:40-43` ✔ | `actions.test.ts:97`, kural aksiyonu `:172` ✔ |
| Aksiyon `cancelled` gerekçeli; tamamlama/yeniden açma gerekçesiz (M3) | `:41-43` ✔ (oluşturmada atlanıyor, D3) | `actions.test.ts:110` ✔ |
| Toplantı `cancelled` gerekçeli (M4) | `meetings.service.ts:78` ✔ | `meetings.test.ts:235` ✔ |
| `held` toplantının tür/tarih değişikliği gerekçeli (M4) | `:80-82` ✔ | `meetings.test.ts:256` ✔ (planlı toplantıda gerekçesiz `:270` ✔) |
| Gerekçe boşlukla geçmez | `project-state.ts:121-124` (trim) ✔ | `projects.test.ts:145` ✔ |
| Köprü (`steps/sync`) gerekçe uygulamaz (M2a, M3 Kararlar) | bilerek ✔ | — |
| Kurulum tipi/LLM, uyarı kapatma/erteleme (AGENTS) | Faz 1'de store'da, kapsam dışı | — |

---

## Kontrol edildi, sorun yok
- **Transaction (madde 1):**
  - API'deki tüm yazmalar (`insertRow`, `updateRow`, `writeParticipants`, `setLastReason`, `insertVersion`, `persistDiff`) yalnız `db.transaction` içinden çağrılıyor: `projects.service.ts:24,70,100,121,158`, `actions.service.ts:24,36`, `meetings.service.ts:40,71`, `template.routes.ts:21`, `db/index.ts:80`.
  - Karar veren okumalar da transaction içinde: `projectIdOf`, sync'teki sahiplik sorguları, `createProject`'in ad kontrolü, şablonun `baseVersion` kontrolü ve `changeProject` içindeki `loadProjectState`.
  - İç içe `db.transaction` yok, yani kuyrukta kilitlenme riski yok.
  - `GET` uçları transaction dışında okuyor; bu, `db/index.ts:16` kuralına uygun.
- **Sonsuz döngü (madde 2):**
  - Sunucu yanıtı önce görüntüye kaydediliyor, sonra store'a aynen yerleşiyor (`mergeEffects`); böylece kendi kaydı fark sayılmıyor.
  - Aynı farkın ardışık ikinci kez gönderilmesi `lastSent` ile engelleniyor.
  - Not: hata → yeniden yükleme `lastSent`'i siliyor (`store.tsx:186`). Sunucunun her seferinde reddettiği ve istemcinin `settleAll` ile yeniden ürettiği bir fark 400 → yeniden yükleme → sync döngüsü kurardı. Somut bir tetikleyici bulamadım (yeniden yükleme yerel kural sonuçlarını sildiği için `settleAll` yalnız sunucu kayıtlarından türetiyor).
- **Kural aksiyonunun iki kopyası:**
  - Sunucu `projectId + ruleKey` ile eşliyor (`currentRuleAction`); başka kayda ait id gelirse yeni id veriyor (`takenIds`).
  - İstemci `mergeEffects`'te yerel açık kopyaları temizliyor; hidrasyon projeyi tümden değiştiriyor.
  - Y1 dışında çift açık kopya üreten bir yol bulunmadı.
- **"Yalnız yerel" projeler:** `createProject` artık yalnız API'den gidiyor ve yeni `bootId` store'u sıfırlıyor. Bu yüzden yerel-only pratikte yalnız `404` durumunda oluşuyor. Köprü bu projelere dokunmuyor (`store.tsx:238`), ekranlar hata toast'ı gösteriyor (M2b Kararlar ile uyumlu).
- **TZ / `activatedAt` / `due` (madde 3):**
  - `dev`/`start` `TZ=Europe/Istanbul`; PLAN'a göre testler UTC'de de geçiyor.
  - Bir kaydı hangi taraf önce hesaplarsa diğer taraf onu alıyor. Köprü istemcinin adım değerlerini aynen yazıyor; sunucu yanıtı da istemcide aynen yerleşiyor. `advanceFlow` yalnız `locked` adım/aşamayı açtığı için açık kaydı yeniden hesaplamıyor. Bu yüzden iki tarafın `now`'u ya da tatil takvimi farklı olsa da kalıcı salınım oluşmuyor.
  - Tatil farkı bilinen bir kısıt (M2a Kararlar). Kalıcı ayrışma yalnız köprü dışı kalan aşama durumunda görüldü (Y1).
- **Doğrulama (madde 5):**
  - Gövdesi olan her uç zod şemasından geçiyor (`*.routes.ts`); path parametreleri yalnız SQL parametresi olarak kullanılıyor.
  - `:id` uçları `projectId`'yi kaydın kendisinden türetiyor.
  - Sync, başka projeye dokunmaya karşı korumalı: adım/aksiyon `projectId` eşitliği, id'nin sahibi olan proje, `phaseId`'nin aynı projede olması, kural aksiyonu id çakışması ve tekrarlanan id kontrol ediliyor.
  - `actions.meeting_id` FK'sız olduğundan başka projenin toplantı id'si yazılabiliyor. Toplantı listesi aksiyonları proje içinden aldığı için bunun etkisi yok.
  - SQL'e giren tablo ve kolon adları koddan geliyor (`rows.ts:98`, `project-state.ts:117`).
- **Güvenlik (madde 6, Y2 dışında):**
  - CORS başlığı yok: tarayıcıdan çapraz köken okuma ve JSON yazma (preflight) engelleniyor. `express.json()` yalnız `application/json` ayrıştırıyor, bu yüzden form tabanlı CSRF `400`'e düşüyor.
  - Hata yanıtlarında yığın izi yok (`errors.ts:28-46`).
  - Gövde sınırı Express varsayılanı olan 100 kB (eşlemesi D5'te).
- **Kaldırılan store işlemleri (madde 7):** `createProject`, `completePhase`, `addAction`, `addMeeting`, `updateMeeting` ve `setConfig("template")` için çağıran kalmamış. Store `applyMeetingHeldRules` çalıştırmıyor. `apps/web/src/test/fake-api.ts` içindeki kullanım test yardımcısı, üretim kodu değil.

---

## Düzeltme sırası önerisi (Yüksek/Orta)
1. **Y2**: tek satır (`127.0.0.1`), riski en yüksek ve en ucuz olanı.
2. **O1**: şemaya `trim()` + test. Projeyi kalıcı bozan bir kayıt yazılabildiği için erken düzeltilmeli.
3. **Y1**: Go-Live onayında 07'yi API'den kapatmak (`completePhase`), D4 ile birlikte. M5'teki e2e akışına Go-Live adımı eklenirse regresyon testi olur.
4. **O2**: köprünün ağ hatasında kapanmaması ve yeniden denemesi, 4xx'te kullanıcıya net mesaj. Kararlar'a "sunucu kazanır"ın yan etkisi yazılır.
5. **O3**: `actualStart`/`actualEnd` gerekçesi + test. Aynı turda madde 4 tablosundaki eksik testler (aşama durumu gerekçesiz → 400, `planStart`, aşama `last_reason`).

Düşükler M5 kapanışında tek bir "temizlik" commit'inde toplanabilir: D2, D3, D5, D7 ve D8'in PLAN düzeltmeleri. D1 ve D6 Faz 2'ye bırakılabilir; bırakılırsa Kararlar'a bir satır yazılmalı.

---

## Düzeltmeler (2026-10-11)

Her madde ayrı commit; her commit öncesi `npm run check` yeşil. Kararlar ve bilinçli bırakılanlar `docs/PLAN.md` → "Kararlar"da (2026-10-11 satırları).

| Bulgu | Durum | Commit | Ne yapıldı / test |
|---|---|---|---|
| Y2 | Düzeltildi | `22d5838` | API `API_HOST` (varsayılan `127.0.0.1`) üzerinde dinler, başlangıç mesajı gerçek adresi yazar. Vite dev/preview `localhost`, proxy hedefi API'nin adresi (`localhost` ::1'e çözülebildiği için). Doğrulama: `lsof` → `127.0.0.1:3001 (LISTEN)`. Playwright'ın API sağlık URL'si `127.0.0.1` oldu (`playwright.config.ts` M5 e2e iskeletiyle `2d39cee`'de commit'lendi). |
| O1 | Düzeltildi | `f0794d8` | Shared `requiredText` (trim + boşsa `400`, `field` ile): aksiyon başlığı (oluşturma, düzenleme, toplantı aksiyonları, köprü), adım başlığı, aşama kodu/adı, müşteri/proje adı, şablon adları. Web istemcisi şemaya uymayan yanıtı `ApiError` `INVALID_RESPONSE` olarak atar (alan yolu + kayıt id'si); hidrasyon bunu konsola yazar ve toast gösterir. Testler: API (aksiyon oluşturma/düzenleme, proje adları, sync adım/aksiyon başlığı), web (`client.test`, hidrasyon testi). |
| Y1 | Düzeltildi | `a3b9aaf` | `approveGoLive` 07'yi store'da kapatmaz: onay + `customer_approval` store'da → köprü hemen gönderilir ve beklenir (`flushNow`) → `POST /phases/:07id/complete` → `applyServerEffects`. Tamamlama hatası (ör. `409`) uyarı olarak gösterilir, 07 açık kalır. Web testi: sync, sonra complete; 409 → bildirim. Sahte API'ye `complete` ucu eklendi, `steps/sync` artık yazdığını saklıyor. |
| D4 | Düzeltildi (kısmen) | `a3b9aaf` | `PATCH /steps/:id` `customer_approval`'ı elle `done` yapmaz (`409 "Müşteri onayı Go-Live ekranından kaydedilir"`); köprü yolu çalışıyor (API testi). `commit_check` kuralı Faz 2'de (taahhütler store'da). |
| O2 | Düzeltildi | `9e12d5a` | Ağ/5xx: aynı fark 1 s, 3 s, 10 s sonra yeniden gönderilir; hepsi başarısızsa görüntü geri alınır, proje duraklatılır, kalıcı toast gösterilir. Bir sonraki başarılı API yanıtında ya da hidrasyonda köprü geri açılır ve bekleyen fark gider. 4xx: toast reddedilen kaydı ve sunucu haline dönüşü söyler, sonra yeniden yükleme. Store'daki tetikleyici alanın geri alınmaması "Faz 1 bilinen kısıt" olarak Kararlar'da. Testler: yeniden deneme ve kalıcı uyarı, duraklatılmışken gönderim yok, geri açılınca iki değişiklik birlikte gider, geçici 5xx, yüklenemeyen projenin sonradan hidrate edilmesi, `snapshotView`/`describeSent`. |
| O3 | Düzeltildi | `1dac437` | `actualStart`/`actualEnd` değişikliği gerekçe ister. Eksik üç test eklendi: aşama durumu gerekçesiz → 400, `planStart` gerekçesiz → 400, aşamada `last_reason` saklanır. **Rapordaki yanlış:** "PhaseDialog bu alanları göndermiyor" doğru değildi; diyalog `actualStart` gönderiyor. Diyalog artık bu alan değişince de gerekçe istiyor (web testi). |
| D5 | Düzeltildi | `9eb79c8` | `entity.too.large` → `413`; diğer body-parser 4xx'leri (ör. desteklenmeyen charset `415`) kendi durumlarıyla, `VALIDATION`. Testler: `app.test.ts`. |
| D3 | Düzeltildi | `ec9cf02` | Aksiyon `cancelled` olarak oluşturulamaz (`400`, `status` / `actions.N.status`). Kontrol serviste, çünkü AI `action_update` şeması aynı `status`'u kullanıyor. Yeni aksiyon diyaloğu "İptal"i sunmuyor. Testler: API (aksiyon, toplantı), web (seçenek listesi). |
| D1 | Düzeltildi (API yazmaları) | `6a7ec67` | Hidrasyon sürerken gelen API yanıtları biriktirilip GET sonuçlarının üstüne sırayla yeniden uygulanıyor. Test, düzeltme olmadan düştüğü doğrulanarak eklendi. Hidrasyon sırasındaki yerel mockup değişikliklerinin sunucu verisiyle değişmesi bilinen kısıt (Kararlar). |
| D7 | Düzeltildi | `1aea11c` | Kullanılmayan import'lar (`store.tsx`, `domain/types.ts`, `projects.service.ts`) silindi. `isLocalOnly` Ctx'ten çıkarıldı. `projectFromCore` shared'da tek fonksiyon; API ve web ondan kullanıyor (shared testi). |
| D8 | Düzeltildi | `455c8ca` | PLAN: hidrasyon ifadesi koda uyduruldu, `ci.yml` kutusu işaretlendi (`44dd6ca`), `PATCH /steps` satırı "kilitli adımda yalnız durum `409`" olarak düzeltildi, yerel geliştirme satırına host bilgisi eklendi. `ci.yml:34`'teki eski yorum Murat'a önerildi. |
| D2 | Bilerek bırakıldı | `455c8ca` (Kararlar) | Kilitli adımda termin değişikliği ileri planlama için serbest; gerekçe kuralı geçerli. |
| D6 | Bırakıldı | `455c8ca` (Kararlar) | Oturum ortasında API restart'ı yalnız geliştirmede görülür, sayfa yenileme düzeltir; Faz 2'de kalıcı veritabanıyla kalkar. |

Son doğrulama: `npm run check` ve `npm run e2e` arka arkaya iki kez yeşil. Lint 0 hata / 27 uyarı; test sayıları api 122, web 272, shared 286, guard 3; e2e 1/1. e2e senaryosu şimdilik yalnız 1. adımı (yeni proje) kapsıyor, M5 raporundaki duruma göre.
