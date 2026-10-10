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
- **Mockup ekranlardan gelen adım değişiklikleri** (veriyle tamamlanan adımlar, kurulum tipi/LLM kuralları, takım ekleme vb.) store'da hesaplanır ve `PATCH /api/steps/:id` ile `origin: "client-rule"` olarak sunucuya yazılır. Bu yol kilit kontrolünü atlar (INV-25). İlgili ekran API'ye geçince köprü kalkar.
- **Restart tespiti:** `GET /api/health` bir `bootId` döner. Kayıtlı `bootId` farklıysa store seed'e sıfırlanır (localStorage temizlenir), böylece iki taraf aynı seed'den başlar.
- **Bilinen kısıtlar (Faz 2'de kalkar):** API'ye giden değişiklikler Geçmiş sekmesinde, "Son değişiklikler"de ve aksiyon geçmişinde görünmez. API restart olunca tüm veri seed'e döner.

---

## M0 — Süreç sadeleştirme + API iskeleti
- [ ] `.claude/` sadeleşir: guard yalnızca `.env*` ve gizli anahtar dosyalarını korur; rol ve commit denetimi kalkar; `plan/gate/phase-close/fix` komutları ve ajanlar silinir; `build` = "PLAN.md'deki sıradaki maddeyi uygula"
- [ ] `CLAUDE.md` / `AGENTS.md`: rol, gate, branch, yazma yetkisi bölümleri kaldırılır; bu dosyadaki çalışma kuralları yazılır
- [ ] Kök `npm run check`; `docs/PHASES.md` başına "yerine docs/PLAN.md geçti" notu; BACKLOG'da GATE-01..03 "süreç değişti" ile kapanır
- [ ] `ci.yml`: parity ve check-migrations job'ları kaldırılır (Murat elle)
- [ ] `apps/api`: Express 5, `/api` router, zod doğrulama + hata middleware'i, `GET /api/health` (`bootId`)
- [ ] `apps/api/src/db`: pg-mem, `schema.sql` (bu kapsamın tabloları: users, projects, template_versions, phases, steps, actions, meetings, meeting_participants), açılışta şema + seed
- [ ] `seed.ts` → `packages/shared`; web import'ları güncellenir; seed API'ye yüklenir
- [ ] `npm run dev` (API + web), Vite proxy; Vitest + supertest API'de
- [ ] Web: küçük `api` istemcisi (`fetch` + hata çevirisi), `bootId` kontrolü
- **Kabul:** `npm run check` yeşil · `GET /api/health` 200 · mockup ekranlar önceki gibi çalışır
- **Notlar:**

## M1 — Ayarlar → Aşama şablonu
- [ ] `GET /api/config/template` (aktif sürüm), `PUT /api/config/template` → yeni sürüm (#39a); sistem adımı silinemez (`409`), yalnızca yeni projeler etkilenir
- [ ] Gerekirse salt-okunur yardımcılar: `GET /api/users`, `GET /api/config/modules` (seed'den)
- [ ] Ayarlar → Aşama şablonu sekmesi API'den okur/yazar; plan önizlemesi `packages/shared` ile istemcide
- [ ] Testler: sürüm artışı, sistem adımı koruması, doğrulama hataları
- **Kabul:** şablon değişir → API restart'a kadar kalır → yeni proje yeni sürümle açılır (M2'de doğrulanır)
- **Notlar:**

## M2 — Proje açılışı + Aşamalar ve adımlar
- [ ] İş kuralları `packages/shared`'a taşınır (`flow`, `rules`, `completion`, `business-days`); web testleri yeşil kalır
- [ ] `POST /api/projects` (#1): şablondan kopyalama (INV-10), kurulum tipi/LLM koşullu adımlar, iş günü termini, plan tahmini
- [ ] `GET /api/projects/:projectId/phases` (`PhaseWithSteps[]`, türetilmiş durum + `ConditionResult`)
- [ ] `PATCH /api/phases/:id` (#3; plan bitişi gerekçeli), `POST /api/phases/:id/complete` (#4; aşama onayı, sonraki aşama açılır, onaylayan + tarih)
- [ ] `PATCH /api/steps/:id` (#5): durum (gerekçeli), termin (gerekçeli), sorumlu/top; kilitli adıma elle değişiklik `409`; `origin: "client-rule"` köprüsü
- [ ] Store köprüsü: phases/steps hidrasyonu, yeni proje diyaloğu → API, mockup kurallarının adım değişikliklerini API'ye yazması
- [ ] Testler: kopyalama, sıralı açılış, kilit, aşama onayı, gerekçe zorunluluğu, iş günü (tatil dahil)
- **Kabul:** yeni proje → Aşamalar sekmesi API'den gelir; adım tamamla, termin değiştir, aşamayı onayla → sayfa yenilenince durur; uyarılar ve diğer sekmeler bozulmaz
- **Notlar:**

## M3 — Aksiyonlar
- [ ] `GET /api/projects/:projectId/actions`, `POST /api/projects/:projectId/actions` (#6), `PATCH /api/actions/:id` (#7; termin ve iptalde gerekçe zorunlu)
- [ ] "Aşama onayı bekliyor" kural aksiyonu sunucuda (M2'deki adım/aşama değişiklikleriyle)
- [ ] Sahip kullanıcı veya müşteri kişisi olabilir: kişi id'si FK'siz saklanır (kişiler mockup'ta kalır), top sahibin tipinden türetilir
- [ ] Aksiyonlar sekmesi + aksiyon paneli API'ye bağlanır
- [ ] Testler: oluşturma, gerekçe zorunluluğu, tamamlama, kural aksiyonunun açılıp kapanması
- **Kabul:** sekmedeki tüm filtreler ve panel API verisiyle çalışır
- **Notlar:**

## M4 — Toplantılar
- [ ] `GET /api/projects/:projectId/meetings`, `POST /api/projects/:projectId/meetings` (#8), `PATCH /api/meetings/:id` (#19; iptalde gerekçe)
- [ ] Toplantı + kararlar + doğan aksiyonlar tek transaction'da (INV-28)
- [ ] Toplantıyla tamamlanan adımlar ve `applyMeetingHeldRules` (Go/No-Go, DevOps devri → top DevOps'ta); "Yapıldı" için tarih ≤ bugün ve en az bir iç katılımcı
- [ ] Toplantılar sekmesi, detay paneli ve `MeetingDialog` API'ye bağlanır ("Kaydedince tamamlanır: …" önizlemesi `packages/shared` ile)
- [ ] Testler: transaction (aksiyon hatasında toplantı da yazılmaz), adım tamamlama, iptal gerekçesi
- **Kabul:** toplantı kaydı → ilgili adım Aşamalar'da tamamlanır, doğan aksiyonlar Aksiyonlar'da görünür
- **Notlar:**

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
