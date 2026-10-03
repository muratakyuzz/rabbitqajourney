# Test Stratejisi

Amaç: her kabul kriterinin **en ucuz doğru seviyede** bir testle kanıtlanması, pg-mem ile PostgreSQL arasındaki farkın test ortamına gitmeden yakalanması ve kritik akışların gerçek tarayıcıda doğrulanması.
Sahiplik: testleri **uygulama oturumu** yazar; `qa-verifier` çalıştırır, eşler ve kanıtlar; `reviewer` kapsamı denetler.

## 1. Seviyeler

| Seviye | Araç | Nerede koşar | Neyi test eder | Dosya adı |
|---|---|---|---|---|
| **L1 Unit** | Vitest | lokal + CI | Saf mantık: `packages/shared` (iş günü, tatil, saat dilimi, zod şemaları, RBAC matrisi), kural motorunun karar fonksiyonları, rapor veri hazırlama, crypto | `*.test.ts` |
| **L2 API entegrasyon** | Vitest + supertest + **pg-mem** | lokal + CI | Gerçek Express app + gerçek migration'lar + seed: endpoint davranışı, RBAC (rol × endpoint), audit satırı, gerekçe zorunluluğu, soft delete, transaction geri alma | `*.int.test.ts` |
| **L2c Sözleşme** | Vitest + `packages/shared` şemaları | lokal + CI | Her API yanıtı ilgili shared şemadan geçer; aynı test mock adaptörün çıktısına da uygulanır → mock ile API aynı şekli döndürür (INV-19) | `*.contract.test.ts` |
| **L3 Bileşen** | Vitest + Testing Library (+ MSW) | lokal + CI | Formlar, gerekçe diyaloğu, rol bazlı görünürlük, boş/yükleniyor/hata durumları | `*.test.tsx` |
| **L4 E2E** | Playwright | **lokal** (uygulama oturumu, Murat, qa-verifier) | Kritik akışlar, rol bazlı uçtan uca senaryolar, temel erişilebilirlik (axe) | `e2e/**/*.spec.ts` |
| **L5 Parity** | Vitest (L2 seti) + PostgreSQL 17 | **CI**, her branch push'u | L2 setinin **aynısı** gerçek PostgreSQL'de + `pg-only` migration'lar + eşzamanlılık testleri + kritik sorgu `EXPLAIN` ölçümü | `*.int.test.ts`, `*.pg.test.ts` |
| **L5b Görsel karşılaştırma** | Playwright ekran görüntüsü | **yalnızca** M-06, F0-03, F0-04 ve modül bağlama görevlerinde, lokal | Dondurulmuş mockup referansı (`docs/reviews/M-06/baseline/`) ile ekran farkı; modül bağlanınca mock ve http modunda aynı ekran | — |
| **L6 Keşif** | Playwright MCP | `/gate` ve `/phase-close` sırasında, qa-verifier | Testlerin görmediği UX/görsel sorunlar, konsol hataları, 4xx/5xx, dar ekran | — |

Kararlar (Murat, 2026-10-02): CI'da E2E/smoke job'ı ve gece regresyonu **yok**. E2E lokal koşar; kanıtı qa-verifier'ın gate raporundadır.

### Hangi AC hangi seviyede?
| Kabul kriteri türü | Seviye |
|---|---|
| Hesaplama, tarih/iş günü, eşik | L1 |
| Yetki (rol X bunu yapabilir / yapamaz) | L2 (her endpoint) + L3 (görünürlük) |
| Kayıt, durum geçişi, gerekçe, audit, otomatik kural | L2 |
| Eşzamanlılık, kilit, PostgreSQL'e özgü davranış | L5 (`*.pg.test.ts`) |
| İşçi (worker) davranışı: idempotent işleme, pasif proje, şema dışı AI çıktısı | L2 (Mock kaynak + Mock analizör) |
| Form doğrulama, diyalog, ekran durumu | L3 |
| Birden çok ekranı ve rolü kapsayan iş akışı | L4 |
| API yanıtının FE'nin beklediği şekle uyması | L2c |
| Yükseltme / adaptör değişimi sonrası ekranın aynı kalması | L5b |

Kural: bir AC'yi E2E ile test etmeden önce L1–L3'te test edilip edilemeyeceği sorulur. E2E yalnızca kritik akışlar içindir.

## 2. Veritabanı testleri (pg-mem ve parity)
- `apps/api/test/db.ts`: test başına temiz veritabanı. pg-mem'de migration'lar bir kez uygulanır, `backup()` alınır, her testte `restore()` (hızlı).
- Aynı test dosyası `DB_DRIVER=pg` ile parity'de koşar: her test dosyası için ayrı şema veya transaction + rollback.
- Testlerde motor kontrolü yasak. Yalnızca PostgreSQL'de anlamlı olan test → `*.pg.test.ts` (L2 lokal komutu bunları atlar).
- Zorunlu PostgreSQL testleri (`*.pg.test.ts`):
  - `audit_log` üzerinde UPDATE/DELETE uygulama rolüyle reddedilir (INV-04). `pg-only` migration'ı uygulamanın bağlandığı `app_rw` rolünü oluşturur; test `SET ROLE app_rw` ile dener. Test/canlı ortamda API bu rolle bağlanır, şema sahibi rolle değil.
  - Aşama tamamlama yarışı: iki eşzamanlı istekten biri kazanır (INV-08)
  - Kural tetikleme yarışı: kopya adım oluşmaz (INV-09)
- `npm run db:explain`: parity job'ında hacim seed'i (`DATA_MODEL.md` §6) yükler, §8'deki sorguları `EXPLAIN (ANALYZE, BUFFERS)` ile koşar, hedef süreyi aşanları uyarı olarak raporlar, çıktıyı artifact yapar.

## 3. Test verisi
- Deterministik seed: `apps/api/src/db/seed.ts` (spec "Başlangıç verisi": modüller, 3 kullanıcı + manager + admin, İş Yatırım projesi).
- Test fabrikaları: `apps/api/test/factories/` — `makeProject({ installType: 'on_prem' })` gibi; testler seed'e değil fabrikaya dayanır.
- Sabit saat: `vi.setSystemTime(new Date('2026-09-01T09:00:00+03:00'))`. Gerçek saate bağlı test yok.
- E2E'de her rol için giriş bir kez yapılır, oturum `playwright/.auth/<rol>.json`'a kaydedilir (git'e girmez — oturum token'ı içerir).

## 4. Kritik E2E akışları (fazlarla büyür)
| # | Akış | Roller | Faz |
|---|---|---|---|
| E1 | Admin kullanıcı, modül ve şablon tanımlar | admin | F2 |
| E2 | Manager müşteri + proje oluşturur, CSM atar → aşamalar şablondan kopyalanır | manager, csm | F3 |
| E3 | CSM Satış Devri çalışma alanını doldurur (satışçı, lisans, modüller, kurulum tipi + LLM, taahhüt, teklif, sözleşme, Satış devri toplantısı) → adımlar kendiliğinden tamamlanır, sıradaki adımlar açılır | csm | F3 |
| E4 | Satış Devri'nde On-prem seçilir → Kurulum adımları açılır; SaaS'a çevrilir → "Kapsam dışı" + gerekçe + geçmişte görünür | csm | F4 |
| E5 | Keşifte takım eklenir → Uyarlama'da takım adımı; 5 madde işaretlenince adım tamamlanır | csm | F5 |
| E6 | DevOps erişim bilgisini görüntüler → geçmişte kayıt; Customer Care göremez | devops, care | F4 |
| E7 | Geciken aksiyon kırmızı uyarı üretir; proje rozetinden açılan panelde uyarı gerekçeyle kapatılır | csm | F6 |
| E7b | Yeni proje: yalnızca ilk/bağımsız adımlar açık; adım tamamlanınca sıradaki açılır, termini iş günüyle hesaplanır; kilitli adım Bana atananlar'da görünmez | csm | F3 |
| E8 | Haftalık müşteri raporu üretilir → iç notlar yok → PDF/Excel iner | csm | F7 |
| E9 | Mock kaynaktan gelen e-posta → öneri oluşur → CSM "Düzenle ve onayla" → aksiyon AI rozetiyle tabloda, audit'te gerekçe | csm | F8 |
| E10 | Başka projeyi göremeyen kullanıcı o projenin önerisini hiçbir ekranda görmez; admin dışı rol entegrasyon ayarlarını açamaz | devops, care | F8 |

Her E2E sonunda `@axe-core/playwright` ile ana sayfanın erişilebilirlik taraması (serious/critical = başarısız).

## 5. Komutlar (F0-02/F0-03 ile tanımlanır)
| Komut | Ne yapar |
|---|---|
| `npm test` | L1 + L2 (pg-mem) + L3, tüm workspace'ler |
| `npm run test:int` | Yalnızca L2; `DB_DRIVER=pg` ile parity'de kullanılır (`*.pg.test.ts` dahil) |
| `npm run e2e` | L4; API (pg-mem + seed) ve web'i kendisi başlatır (`webServer`) |
| `npm run db:migrate` | Migration runner; `--pg-only` ile `migrations/pg-only/` da uygulanır |
| `npm run db:explain` | Kritik sorgu ölçümü (yalnızca PostgreSQL) |

## 6. Test çıktıları ve git
Playwright ve Vitest çıktıları **asla commit edilmez** (`.gitignore`): `test-results/`, `playwright-report/`, `blob-report/`, `playwright/.cache/`, `playwright/.auth/`, `coverage/`, `.verify/`, `.data/`.
Gate kanıtı olarak saklanacak ekran görüntüleri yalnızca `docs/reviews/<branch>/screens/` altına, bilinçli olarak kopyalanır.

## 7. Kapsam hedefleri (bilgi amaçlı, gate değil)
`packages/shared` ≥ %90 satır · `apps/api` servisleri ≥ %80 · `business-days` %100 dal kapsamı (bu bir gate'tir — INV-13).

## 8. Flaky test politikası
Flaky test `test.fixme` ile işaretlenmez; aynı gün düzeltilir ya da qa-verifier bulgusu (High) olarak açık kalır. `waitForTimeout` ve gerçek saat kullanımı yasak.
