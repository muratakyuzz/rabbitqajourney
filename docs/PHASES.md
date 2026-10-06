# Geliştirme Fazları

**İlke:** Önce FE tam mockup olarak tamamlanır ve dondurulur; BE, dondurulmuş mockup'ın sözleşmesine (`docs/API_CONTRACT.md`) göre yazılır ve ekranlar modül modül gerçek API'ye bağlanır.
Durum tespiti: `docs/AUDIT.md` v3 (2026-10-03, main @ 4bfa4cb). Lovable ile mockup geliştirmesi bitti; tüm geliştirme uygulama oturumu ile, bu dokümandaki döngüyle yapılır.

Her görev = 1 plan = 1 branch = 1 PR. Görev kodu: `M-<no>` veya `F<faz>-<no>`.
Her PR'da **reviewer** + **qa-verifier** zorunlu; CI'da **app** (+ migration olunca **parity**) ve **secrets** yeşil olmalı.
**Kural** kolonunda ● olan görevlerde **rules-reviewer** da zorunludur.
Faz geçişi yalnızca `/phase-close <faz>` → **GO** ile olur.

| Faz | Ad | Nerede | Çıktı | Durum |
|---|---|---|---|---|
| M | Mockup tamamlama & dondurma | Claude Code — uygulama oturumu (demo) | M-09 adım tamamlama + çalışma alanları; görsel referans; `mockup-freeze` | 🟡 M-06 kaldı |
| F0 | Temizlik, yapı & sözleşme | Claude Code — uygulama oturumu | API sözleşmesi, temiz repo, monorepo, güncel stack, FE veri katmanı (mock adaptör), API iskeleti, test altyapısı, CI | ⬜ |
| F1 | Veri modeli, çekirdek & yetki | Claude Code — uygulama oturumu | DATA_MODEL, şema, oturum (gerçek giriş), RBAC, audit, soft delete | ⬜ |
| F2 | Admin konfigürasyonu → API | Claude Code — uygulama oturumu | Kullanıcı, satışçı, modül, şablon, keşif soruları, eşikler | ⬜ |
| F3 | Proje çekirdeği → API | Claude Code — uygulama oturumu | Proje listesi/oluşturma, sıralı akış, aşama-adım, aksiyon, toplantı, kişi, satış devri, doküman | ⬜ |
| F4 | Aşamalar 01–03 + kurallar → API | Claude Code — uygulama oturumu | Kural ve adım tamamlama motoru, kick-off, keşif/takım/KPI, kurulum, şifreli erişim bilgisi | ⬜ |
| F5 | Aşamalar 04–08 → API | Claude Code — uygulama oturumu | Eğitim, uyarlama, risk/karar, Go-Live, süreklilik (destek kayıtları Faz 2) | ⬜ |
| F6 | Uyarı motoru → API | Claude Code — uygulama oturumu | İş günü (TR tatil), 14 uyarı, erteleme/kapatma | ⬜ |
| F7 | Raporlar & geçmiş → API | Claude Code — uygulama oturumu | Müşteri geçmişi, haftalık müşteri raporu, iç yönetim raporu, PDF/Excel, arşiv | ⬜ |
| F8 | AI Insight & entegrasyonlar → API | Claude Code — uygulama oturumu | İşçi süreci, Teams/e-posta okuma, e-posta eşleştirme, AI analizi, öneri onay API'si (spec Ek A, ADR-0003) | ⬜ |
| F9 | Sertleştirme & yayın | Claude Code — uygulama oturumu | Mock adaptörün kaldırılması, güvenlik, performans, a11y, E2E, Docker, test ortamı | ⬜ |

"→ API" görevlerinin ortak şekli (F2–F7):
1. **BE:** endpoint(ler) + servis + repository + migration (DATA_MODEL'e göre); kural mantığı FE store/`rules.ts`'ten **taşınır** (kopyalanmaz).
2. **FE:** ilgili modülün adaptörü `mock` → `http`; ekran kodu değişmez (değişirse gerekçesi planda).
3. **Sözleşme testi:** API yanıtı ve mock adaptör aynı `packages/shared` şemasından geçer.
4. **Görsel kontrol:** qa-verifier ekranı mock ve http modunda karşılaştırır.

---

## M — Mockup tamamlama & dondurma
Lovable turları (Faz 1–4, AI Insight, akış, uyarı motoru, kapanış) tamamlandı — ayrıntı `docs/AUDIT.md` v3. Kalan iş **uygulama oturumu** ile, demo uygulama üzerinde (backend yok) ve kitteki `/gate` döngüsüyle yapılır; reviewer ve qa-verifier **demo modunda** çalışır (`AGENTS.md` → Demo kuralları).

| Kod | Görev | Kural | Durum |
|---|---|---|---|
| M-09a | Adım tamamlama motoru (veri / toplantı / elle), toplantı durumu, "Taahhüt yok", kurulum tipi + LLM Satış Devri'ne | ● | ✅ |
| M-09b | Aşama çalışma alanı altyapısı + 00 Satış Devri paneli; Satış devri ve Kick-off sekmeleri kalkar | | ✅ |
| M-09c | Keşif, Erişim, Eğitim, Uyarlama çalışma alanları; uyarı rozeti/paneli; 13 sekmelik son düzen; Destek kayıtları pasif (Faz 2) | ● | ✅ |
| M-06 | **Dondurma:** `/phase-close M` → her ekran × rol görsel referansı (`docs/reviews/M-06/baseline/`), spec kapsaması son kontrol, `mockup-freeze` etiketi | | ⬜ |

Görev metinleri: `docs/plans/M-09-step-completion-workspaces.md` (§0 Bağlam + üç görev; plan hazır, `/plan` gerekmez).

## F0 — Temizlik, yapı & sözleşme
| Kod | Görev | Kural |
|---|---|---|
| F0-01 | **API sözleşmesi çıkarımı:** dondurulmuş mockup'ın store `Ctx` işlemleri (M-09 sonrası) + `types.ts` + saf iş mantığı dosyaları (`flow.ts`, `completion.ts`, `rules.ts`, `alerts.ts`, `reports.ts`) + ekranlar → `docs/API_CONTRACT.md` (endpoint, girdi/çıktı şeması, rol, audit/gerekçe, tetiklenen kurallar). Kod değişmez | ● |
| F0-02 | **Temizlik:** tek kilit dosyası (npm; bun dosyaları silinir, `npm ci` çalışır), kullanılmayan paketler (`xlsx`, `@supabase/supabase-js` + `src/integrations/supabase` + `supabase/`, `canvas-confetti`, `@lovable.dev/mcp-js`, `lovable-tagger`), `.lovable/` klasörü, README'deki Lovable metni, `.env` repodan çıkar + `.env.example`, `.gitignore`, TS `strict: true`, lint hataları (16), code-split (bundle 1,16 MB). **package-lock senkronu M-09b'de yapıldı (QA-01, main @ aee9657); kalan F0-02 işleri:** `bun.lockb` silinir, lint, `npm audit`, kullanılmayan paketler (xlsx vb.) | |
| F0-03 | **Monorepo + yükseltme:** `apps/web` (mevcut kod), `apps/api` (boş), `packages/shared`; React 19, Vite 8 + plugin-react v6, Tailwind 4, react-router 7, recharts 3, date-fns 4 + @date-fns/tz. **Kabul:** M-06 görsel referansına göre fark yok (qa-verifier karşılaştırır) | |
| F0-04 | **FE veri erişim katmanı:** `packages/shared` zod şemaları (types.ts'ten), modül bazlı TanStack Query hook'ları, `DataSource` arayüzü; mevcut store → `mock` adaptörü; modül başına `VITE_DATA_<MODÜL>=mock|http` anahtarı; ekranlar `useRq()` yerine hook'ları kullanır. **Kabul:** görsel referansa göre fark yok, tüm akışlar aynı | ● |
| F0-05 | **API + işçi iskeleti:** `apps/api` ve boş `apps/worker` (ADR-0003), Express 5, katmanlar, hata/validasyon middleware'i, helmet/cors/rate-limit, `db/` (pgmem\|pg), migration runner (`schema_migrations` + checksum, `--pg-only`), seed (mock seed ile aynı veri), dev snapshot | ● |
| F0-06 | **Test altyapısı:** Vitest (tüm workspace'ler), supertest, pg-mem test DB, fabrikalar, sabit saat, sözleşme testi yardımcısı; Playwright (`webServer`, rol oturumları, axe, görsel karşılaştırma script'i) | |
| F0-07 | **CI:** `app`, `parity`, `secrets`; branch koruması | |
| F0-08 | **Lokal geliştirme:** `npm run dev` (API + web), `.env.example`, Azure Blob dev modu | |

## F1 — Veri modeli, çekirdek & yetki
| Kod | Görev | Kural |
|---|---|---|
| F1-00 | **Veri modeli tasarımı** (planner VERİ MODELİ modu): kaynaklar spec + `API_CONTRACT.md` + mock `types.ts`/store davranışı; enum değerleri FE ile aynı → `docs/DATA_MODEL.md` (kod yok; Murat onayı) | ● |
| F1-01 | Kimlik doğrulama → API: `users`, `sessions`, login/logout/şifre sıfırlama, cookie + CSRF, bcrypt, rate-limit; FE `auth-api.ts` demo modu yerine http | ● |
| F1-02 | `core/audit` + transaction yardımcısı + gerekçe altyapısı; `pg-only` audit grant'ları | ● |
| F1-03 | Soft delete standardı + ortak kolonlar + repository taban yardımcıları | |
| F1-04 | Çekirdek şema migration'ları (DATA_MODEL'e göre) | ● |
| F1-05 | `authorize()` + `packages/shared/rbac` (FE `perm.ts` ile tek kaynak) + rol × endpoint test üreticisi | |

## F2 — Admin konfigürasyonu → API
| Kod | Görev | Kural |
|---|---|---|
| F2-01 | Kullanıcılar & roller (pasifleştirme, son aktif admin kuralı) | |
| F2-02 | Satışçılar + modüller | |
| F2-03 | Aşama/adım şablonu (sürümlü) | ● |
| F2-04 | Keşif soruları | |
| F2-05 | Uyarı eşikleri + resmi tatil takvimi | |

## F3 — Proje çekirdeği → API
| Kod | Görev | Kural |
|---|---|---|
| F3-01 | Proje listesi + oluşturma (CSM kendine, Manager herkese + CSM ataması) + şablondan kopyalama | ● |
| F3-02 | Aşamalar/adımlar: sıralı akış (`flow.ts` → `core/rules`: kilitli adım, bağlılık, iş günü termini, aşama onayı bekliyor aksiyonu), durum + gerekçe, top kimde, aşama onayı (`FOR UPDATE`), baseline | ● |
| F3-03 | Aksiyonlar (sahip tipi: kullanıcı / müşteri kişisi) | |
| F3-04 | Müşteri kişileri | |
| F3-05 | Toplantılar (durum Planlandı/Yapıldı/İptal, tür, ekler) + toplantıdan aksiyon + toplantıyla tamamlanan adımlar | ● |
| F3-06 | Satış Devri çalışma alanı: satışçı, lisans, modüller, kurulum tipi + LLM (+ kurallar), taahhütler / "taahhüt yok" | ● |
| F3-07 | Dokümanlar: Azure Blob + SAS + bağlama + teklif/sözleşme kuralı | ● |
| F3-08 | Proje sağlığı + "Bana atananlar" | |

## F4 — Aşamalar 01–03 + kurallar → API
| Kod | Görev | Kural |
|---|---|---|
| F4-01 | `core/rules`: kurulum tipi / LLM kuralları ve adım tamamlama motoru (`rules.ts`, `completion.ts`'ten taşınır; idempotent, audit'li) | ● |
| F4-02 | Kick-off: toplantı, gereksinim dokümanı (On-prem), sunum paylaşımı adımları | |
| F4-03 | Keşif formu, takımlar (→ uyarlama adımı), KPI + ölçümler | ● |
| F4-04 | Kurulum adımları + erişim bilgileri (AES-256-GCM, çözme endpoint'i, görüntüleme audit'i) | ● |

## F5 — Aşamalar 04–08 → API
| Kod | Görev | Kural |
|---|---|---|
| F5-01 | Eğitim: Eğitim türündeki toplantılar (eğitmen, modüller, kayıt linki) + planlama/yapılma adımları | ● |
| F5-02 | Uyarlama: takım başına adım + 5 maddelik kontrol listesi + Uyarlama toplantıları + ilerleme oranı | ● |
| F5-03 | ~~Destek kayıtları~~ — **Faz 2'ye ertelendi** (mockup'ta pasif) | |
| F5-04 | Riskler ve kararlar | |
| F5-05 | Go-Live (Go/No-Go, açık taahhüt kontrolü, müşteri onayı) + Süreklilik | ● |

## F6 — Uyarı motoru → API
| Kod | Görev | Kural |
|---|---|---|
| F6-01 | `packages/shared/business-days` + TR tatil tablosu (mock'taki hesaptan taşınır); %100 dal kapsamı | ● |
| F6-02 | 14 uyarının hesaplanması (DATA_MODEL D6) | ● |
| F6-03 | Erteleme / gerekçeyle kapatma + proje rozeti/paneli, zil, "Uyarılarım", aşama durumunun türetilmesi | ● |

## F7 — Raporlar & geçmiş → API
| Kod | Görev | Kural |
|---|---|---|
| F7-01 | Müşteri geçmişi (toplantı + audit, filtreli, sayfalı) | ● |
| F7-02 | Haftalık müşteri raporu: snapshot (`reports.ts`), `isCustomerVisible`, düzenlenebilir alanlar, gönderildi + arşiv | ● |
| F7-03 | İç yönetim raporu | |
| F7-04 | PDF + Excel (exceljs) + arşiv | |

## F8 — AI Insight & entegrasyonlar → API
Ön koşul: ADR-0003 kabul edildi (açık sorular kapandı).
| Kod | Görev | Kural |
|---|---|---|
| F8-00 | **Keşif ve karar:** AI sağlayıcısı, Teams erişim modeli, e-posta yöntemi, saklama süresi; Virgosol M365 deneme kiracısında elle bağlantı denemesi → ADR-0003 "Kabul edildi" (kod yok) | |
| F8-01 | Entegrasyon ayarları API'si: Teams/e-posta/AI ayarları, secret şifreleme ve maskeleme, "göster" audit'i, bağlantı testi (Mock adaptörle) | ● |
| F8-02 | Proje entegrasyonu API'si: kanal bağlama (tek proje kuralı), e-posta takibi, ek domain'ler | |
| F8-03 | AI önerileri API'si: listeleme (görünür projeler), onayla / düzenle ve onayla / reddet / toplu reddet, hedef değişti uyarısı, süresi dolma; onay mevcut servislerle (INV-21) | ● |
| F8-04 | `apps/worker` çekirdeği: döngü, imleç tablosu, idempotent işleme, Mock kaynak ve Mock analizör (`ai-mock.ts`'ten taşınır) | ● |
| F8-05 | E-posta eşleştirme (`email-match.ts`'ten taşınır) + eşleşmeyen e-posta kuyruğu API'si | ● |
| F8-06 | Gerçek adaptörler: Teams (Graph), e-posta (Graph Mail veya IMAP) — ortam değişkeniyle açılır | ● |
| F8-07 | Gerçek `AiAnalyzer` (seçilen LLM), `InsightProposal` şema doğrulaması, prompt injection testleri (INV-23) | ● |
| F8-08 | Saklama süresi işi + alıntı uzunluğu sınırı (INV-24) | ● |

## F9 — Sertleştirme & yayın
| Kod | Görev | Kural |
|---|---|---|
| F9-01 | Mock adaptörlerin ve demo girişin üretim build'inden çıkarılması (yalnızca test/dev'de kalır) | |
| F9-02 | Tam güvenlik denetimi (reviewer tam tarama) | ● |
| F9-03 | Performans (parity EXPLAIN raporları, code-split — mevcut bundle 668 KB) | |
| F9-04 | Erişilebilirlik + Türkçe metin taraması | |
| F9-05 | Tam E2E regresyon + UAT | |
| F9-06 | Docker imajları (web, api, worker), test ortamına çıkış runbook'u, yedekleme, izleme | |
