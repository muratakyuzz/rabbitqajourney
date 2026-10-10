# AGENTS.md — RabbitQA Onboarding Tracker

Bu dosya bu repoda çalışan **tüm AI kodlama ajanları** için bağlayıcı kurallardır.
Her görevden önce bu dosyayı ve `docs/PLAN.md`'yi oku. Faz planı ve çalışma kuralları için **`docs/PLAN.md` geçerlidir** (`docs/PHASES.md` ve `docs/WORKFLOW.md` tarihsel).

---

## 1. Ürün özeti
Virgosol iç ekibinin RabbitQA müşteri onboarding sürecini uçtan uca takip ettiği web uygulaması.
Gereksinimlerin tek doğruluk kaynağı: `docs/PRODUCT_SPEC.md`.
Arayüz dili **Türkçe**. Kod, tablo, değişken ve commit mesajları **İngilizce**.

Hiyerarşi: **Müşteri → Onboarding projesi → Aşama → Adım → Aksiyon**
Roller: `csm`, `devops`, `care`, `manager`, `admin` (enum değerleri mockup'takiyle aynıdır; değiştirilmez)

**Yaklaşım:** FE mock veriyle tam mockup olarak tamamlandı. BE mockup'ın sözleşmesine (`docs/API_CONTRACT.md`) göre yazılır; ekranlar ekran ekran API'ye bağlanır (Faz 1 kapsamı ve store köprüsü: `docs/PLAN.md`). Mevcut durum: `docs/AUDIT.md`.

### Mockup kuralları (henüz API'ye bağlanmamış ekranlar)
- Bu ekranların verisi `apps/web/src/lib/rabbitqa/` store'unda (`RqProvider`/`useRq`) ve seed'de.
- Her veri değişikliği store fonksiyonundan geçer ve audit yazar; bileşende state doğrudan değişmez.
- Gerekçe zorunlu: kurulum tipi/LLM değişikliği, tarih ve durum değişikliği, uyarı kapatma/erteleme.
- Enum değerleri değiştirilmez/yeniden adlandırılmaz; yalnızca yeni değer eklenir. Model değişirse state sürümü +1 ve store KEY aynı sürüme.
- Akış yalnızca `flow.ts` (`advanceFlow`, `isOpenStep`); adım tamamlama yalnızca `completion.ts` (M-09a); uyarılar yalnızca `alerts.ts`; iş günü yalnızca `business-days.ts`; rapor snapshot'ı yalnızca `reports.ts`.
- Yetki yalnızca `perm.ts`; bileşende rol karşılaştırması yok (Overview'daki role göre içerik hariç).
- Yeni npm paketi eklemeden önce sor (`docs/PLAN.md` teknik kararlarındakiler hariç). Arayüz Türkçe, tarih `gg.aa.yyyy`, mevcut AppShell/tema/shadcn.
- Kilitli ("Sırası gelmedi") adım iş sayılmaz.

### Mockup yapısı (main @ 4bfa4cb)
- State v8 (`rabbitqa-demo-state-v8`), store `Ctx` 52 işlem; demo giriş `src/lib/auth-api.ts` (store'daki kullanıcılar, pasif kullanıcı giremez).
- Saf iş mantığı: `flow.ts` (sıralı akış), `rules.ts` (kurulum/LLM kuralları), `alerts.ts` (14 uyarı), `business-days.ts` (iş günü + tatil), `reports.ts` (haftalık rapor snapshot'ı), `email-match.ts`, `ai-mock.ts`.
- Ekranlar: `src/pages/` (Overview, Insights, Projects, ProjectDetail, MyWork, CustomerReport, ManagementReport, Admin) · sekmeler `src/pages/project/` · admin alt ekranları `src/pages/admin/`.
- Şablon/modül/soru/kullanıcı/satışçı/eşik/tatil değişiklikleri `setConfig` ile, `projectId: "system"` audit yazar; şablon değişikliği yalnızca yeni projeleri etkiler.
- `AppShell` ve tema token'ları `src/index.css` / `tailwind.config.ts`'te.

## 2. Teknoloji yığını
Ayrıntı ve gerekçe: `docs/adr/0001-stack.md`. Özet:
- **Web:** React 19, Vite 8, Tailwind 4, shadcn/ui, react-router 7, TanStack Query 5, react-hook-form + Zod 4, date-fns 4 + @date-fns/tz
- **İşçi:** `apps/worker` — Teams/e-posta dinleme ve AI analizi (ADR-0003)
- **API:** Node 24, Express 5, `routes → controller → service → repository`, `pg` + ham SQL (ORM yok), token hash'li session, Azure Blob (SAS), exceljs
- **DB:** lokal ve otomatik testlerde **pg-mem**, test/canlıda **PostgreSQL 17** — kurallar: `docs/adr/0002-pg-mem-and-postgres-parity.md`
- **Test:** Vitest, Testing Library, supertest, Playwright

Kullanılmaz: `xlsx` (SheetJS npm), ORM, trigger / PL/pgSQL / RLS (ADR-0002), Supabase.

## 3. Klasör sözleşmesi
```
apps/web/src/
  pages/, pages/project/     ekranlar (mockup'tan)
  data/<modül>/              TanStack Query hook'ları + DataSource arayüzü
  data/<modül>/mock.ts       mock adaptör (mockup store'u; F9-01'e kadar, yalnızca dev/test)
  data/<modül>/http.ts       API adaptörü (docs/API_CONTRACT.md)
  components/ui/             shadcn — elle değiştirilmez
  lib/rabbitqa/              mockup store, seed, perm, rules (modül API'ye bağlandıkça kural kodu buradan kalkar — INV-20)
apps/api/src/
  modules/<module>/          <m>.routes.ts  <m>.controller.ts  <m>.service.ts  <m>.repository.ts  <m>.test.ts  <m>.int.test.ts
  core/auth/                 session, authorize()
  core/audit/                audit yazıcı (tek giriş noktası)
  core/crypto/               AES-256-GCM
  core/rules/                otomatik kural motoru
  db/                        pg-mem, schema.sql, seed yükleme, transaction yardımcısı (Faz 1; pg + migration runner Faz 2)
apps/worker/src/             Teams/e-posta okuma, e-posta eşleştirme, AI analizi (ADR-0003); proje verisini DEĞİŞTİRMEZ (INV-21)
  sources/                   ChatSource, MailSource adaptörleri (mock | graph | imap)
  analyzer/                  AiAnalyzer (mock | llm)
packages/shared/src/
  schemas/  enums/  rbac/  business-days/  types/
migrations/                  0001_xxx.sql … (pg-mem + PostgreSQL uyumlu)
migrations/pg-only/          yalnızca PostgreSQL (grant, rol, extension)
e2e/                         Playwright
docs/                        PRODUCT_SPEC, AUDIT, API_CONTRACT, INVARIANTS, RBAC, DATA_MODEL, TEST_STRATEGY, PHASES, WORKFLOW, adr/, plans/, reviews/
```

## 4. Değişmez kurallar
Tam liste: **`docs/INVARIANTS.md`**. Yetki matrisi: **`docs/RBAC.md`**.
**Faz 1 istisnası (`docs/PLAN.md`):** `authorize()`, RBAC ve audit (geçmiş tablosu) Faz 2'ye kadar yok; gerekçe zorunlulukları API'de doğrulanır ve kaydın üzerinde saklanır. Veritabanı pg-mem (bellekte, açılışta şema + seed); migration runner ve parity yok.
Faz 1'de de geçerli olanlar:
- Doğrulama şemaları, enum'lar, seed ve iş kuralları (`flow`, `rules`, `completion`, `business-days`) `packages/shared`'dan gelir; kopyası yazılmaz (INV-19).
- Bir modül API'ye bağlanınca o modülün kural kodu web'de kopya olarak kalmaz (INV-20).
- Repository'de motor kontrolü (`if (isPgMem)`) yok; trigger/PL/pgSQL/RLS yok.
- Çok tablolu yazmalar tek transaction'da.

## 5. Çalışma akışı (`docs/PLAN.md` → "Çalışma kuralları")
1. Doğrudan `main`. Branch, plan dosyası, gate, rol ayrımı yok. Sıradaki iş `docs/PLAN.md`'deki ilk işaretlenmemiş madde (`/build`).
2. Kapsam yalnızca o madde. Karar gerekirse `docs/PLAN.md` → "Kararlar" listesine bir satır; ayrı plan dosyası, ADR, BACKLOG turu yok.
3. Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
4. Commit'ten önce `npm run check` (lint + typecheck + test) yeşil. CI (`app` + `secrets`) kırmızıysa önce o düzeltilir.
5. Kilometre taşı bitince PLAN.md kutuları işaretlenir ve `git tag mN`.

## 6. Tamamlanma tanımı
- [ ] Maddenin kabul kriterleri karşılandı; her davranış bir testle (negatif senaryo dahil) eşlendi
- [ ] `npm run check` yeşil
- [ ] UI metinleri Türkçe; yükleniyor/boş/hata durumları var
- [ ] Gerekiyorsa `docs/PLAN.md` (Kararlar/Notlar) ve `docs/API_CONTRACT.md` güncellendi

## 7. Ajanlara not
- Emin olmadığın iş kuralında tahmin etme; dur ve sor ya da güvenli varsayımı PLAN.md "Kararlar"a yaz.
- `.env` ve gizli anahtar dosyalarına dokunma (`.claude/hooks/guard.mjs` engeller).
- `.github/workflows/` değişikliğini öner; Murat uygular.
