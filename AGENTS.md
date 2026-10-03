# AGENTS.md — RabbitQA Onboarding Tracker

Bu dosya bu repoda çalışan **tüm AI kodlama ajanları** (Claude Code'un uygulama ve denetim oturumları, alt ajanlar) için bağlayıcı kurallardır.
Her görevden önce bu dosyayı, `docs/INVARIANTS.md` ve `docs/RBAC.md`'yi oku.

---

## 1. Ürün özeti
Virgosol iç ekibinin RabbitQA müşteri onboarding sürecini uçtan uca takip ettiği web uygulaması.
Gereksinimlerin tek doğruluk kaynağı: `docs/PRODUCT_SPEC.md`.
Arayüz dili **Türkçe**. Kod, tablo, değişken ve commit mesajları **İngilizce**.

Hiyerarşi: **Müşteri → Onboarding projesi → Aşama → Adım → Aksiyon**
Roller: `csm`, `devops`, `care`, `manager`, `admin` (enum değerleri mockup'takiyle aynıdır; değiştirilmez)

**Yaklaşım:** FE mock veriyle tam mockup olarak tamamlandı (Lovable, bitti) ve M-09 + M-06 ile dondurulur. BE dondurulmuş mockup'ın sözleşmesine (`docs/API_CONTRACT.md`) göre yazılır; ekranlar modül modül `mock` → `http` adaptörüne geçirilir. Mevcut durum: `docs/AUDIT.md`.

### Demo kuralları (Faz M — M-09 ve mockup koduna dokunan her iş, F0-04'e kadar)
- Backend, veritabanı, Supabase yok. Tüm veri `src/lib/rabbitqa/` store'unda (`RqProvider`/`useRq`) ve seed'de.
- Her veri değişikliği store fonksiyonundan geçer ve audit yazar; bileşende state doğrudan değişmez.
- Gerekçe zorunlu: kurulum tipi/LLM değişikliği, tarih ve durum değişikliği, uyarı kapatma/erteleme.
- Enum değerleri değiştirilmez/yeniden adlandırılmaz; yalnızca yeni değer eklenir. Model değişirse state sürümü +1 ve store KEY aynı sürüme.
- Akış yalnızca `flow.ts` (`advanceFlow`, `isOpenStep`); adım tamamlama yalnızca `completion.ts` (M-09a); uyarılar yalnızca `alerts.ts`; iş günü yalnızca `business-days.ts`; rapor snapshot'ı yalnızca `reports.ts`.
- Yetki yalnızca `perm.ts`; bileşende rol karşılaştırması yok (Overview'daki role göre içerik hariç).
- Yeni npm paketi yok. Arayüz Türkçe, tarih `gg.aa.yyyy`, mevcut AppShell/tema/shadcn.
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
  db/                        pool (pgmem|pg), transaction yardımcısı, migration runner, seed
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
Tam liste ve doğrulama yöntemleri: **`docs/INVARIANTS.md`**. Yetki matrisi: **`docs/RBAC.md`**. İhlal = PR reddi.
En sık unutulanlar:
- Her yazma işlemi `core/audit` üzerinden ve aynı transaction içinde audit kaydı üretir.
- Her endpoint `authorize()` çağırır; yetki yalnızca UI'da gizlemekle sağlanmaz.
- Migration'lar pg-mem **ve** PostgreSQL'de çalışmak zorunda; trigger/PL/pgSQL/RLS yok.
- Repository'de motor kontrolü (`if (isPgMem)`) yok.
- Doğrulama şemaları, enum'lar ve iş günü hesabı `packages/shared`'dan gelir; kopyası yazılmaz (INV-19).
- Bir modül API'ye bağlanınca o modülün kural kodu web'den kaldırılır (INV-20).

## 5. Çalışma akışı (detay: `docs/WORKFLOW.md`)
1. Her görevin planı vardır: `docs/plans/<FAZ>-<NO>-<slug>.md` (planner üretir, Murat onaylar).
2. **Yalnızca plandaki kapsam** uygulanır. Kapsam dışı fikirler PR'da "Öneriler" altına yazılır.
3. Branch: `feat/<faz>-<no>-<slug>`, `fix/…`, `chore/…`. `main`'e doğrudan push yok. Uzak depo: yalnızca GitHub.
4. Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
5. PR açmadan önce: `npm run lint && npm run typecheck && npm test && npm run build`. E2E etkileniyorsa `npm run e2e`.
6. PR şablonu eksiksiz doldurulur.
7. Merge koşulları: CI yeşil (**parity job dahil**) + `reviewer` ve `qa-verifier` APPROVE (+ tetiklenirse `rules-reviewer`).

## 6. Tamamlanma tanımı
- [ ] Plandaki tüm kabul kriterleri karşılandı, her biri bir testle eşlendi
- [ ] Yeni/değişen iş kuralı için unit + entegrasyon testi (negatif senaryo dahil)
- [ ] Lint, typecheck, test, build yeşil; CI parity yeşil
- [ ] Yeni tablo: ortak kolonlar + soft delete + audit kapsamında + `DATA_MODEL.md` güncel
- [ ] Yeni endpoint: `authorize()` + RBAC testi (izinli + yasaklı rol)
- [ ] UI metinleri Türkçe; yükleniyor/boş/hata durumları var
- [ ] Gerekiyorsa ADR veya docs güncellendi

## 7. Ajanlara not
- Bu repoda tek araç Claude Code'dur, ama iki ayrı oturumla çalışılır (`docs/WORKFLOW.md` → "İki oturum"):
  - **Uygulama oturumu** (`CLAUDE_ROLE=builder claude`): planı uygular, test yazar, commit/push eder, PR açar (`/build`, `/fix`). Kendi işini onaylamaz, `/gate` çalıştırmaz, merge etmez.
  - **Denetim oturumu** (`claude`): plan üretir ve inceler (`/plan`, `/gate`, `/phase-close`); uygulama koduna yazamaz (`guard.mjs`).
- Yazan ve denetleyen aynı oturum olamaz: `/gate` her zaman uygulama oturumunun bağlamını görmemiş, yeni açılmış bir denetim oturumunda çalışır.
- Emin olmadığın iş kuralında tahmin etme; PR'da "Açık sorular"a yaz, güvenli varsayımı belirt.
- Gate bulgusunu düzeltirken bulgu ID'sini commit mesajına ekle: `fix: enforce reason on status change [REV-03]`.
