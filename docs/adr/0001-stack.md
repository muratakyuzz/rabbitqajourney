# ADR-0001: Teknoloji yığını

**Durum:** Kabul edildi
**Tarih:** 2026-10-02
**Hazırlayan:** planner · **Onaylayan:** Murat

## Bağlam
Lovable ile üretilen frontend iskeleti var. Virgosol'ün başka bir projesinde kullanılan ve ekibin tanıdığı yığın (React + Express + PostgreSQL) temel alınacak; 2026 Ekim itibarıyla desteği biten veya güvenlik açığı olan parçalar güncellenecek.

## Karar

### Çalışma ortamı
| Parça | Seçim | Not |
|---|---|---|
| Node.js | **24 LTS** | Node 20 desteği 30.04.2026'da bitti. Docker: `node:24-alpine` |
| Dil | TypeScript (strict) | FE + BE + shared |
| Paket yöneticisi | npm workspaces | |

### Repo yapısı
```
apps/web/          React SPA (Lovable mockup'ı buraya taşınır — F0-03)
apps/api/          Express API
apps/worker/       Teams/e-posta dinleme + AI analizi (ADR-0003)
packages/shared/   zod şemaları, enum'lar, RBAC matrisi, iş günü hesabı, tipler
migrations/        numaralı .sql dosyaları (pg-mem + PostgreSQL uyumlu)
migrations/pg-only/ yalnızca gerçek PostgreSQL'de uygulanan dosyalar (rol, grant, extension)
e2e/               Playwright testleri
docker/            Dockerfile'lar, nginx.conf
```

### Frontend (`apps/web`)
React **19** · Vite **8** + `@vitejs/plugin-react` **v6** (SWC eklentisi kaldırıldı) · Tailwind **4** + `tailwind-merge` v3 + class-variance-authority · shadcn/ui · lucide-react · **react-router v7** · TanStack Query v5 · react-hook-form + **Zod 4** · recharts **3** · sonner · **date-fns 4 + @date-fns/tz** · react-day-picker · @dnd-kit

Kaldırılanlar: `xlsx` (SheetJS npm sürümü 0.18.5 — CVE-2023-30533, CVE-2024-22363; bakımsız), `lovable-tagger`, `.lovable/`.
Excel dışa aktarma backend'de `exceljs` ile yapılır, frontend dosyayı indirir.

### Backend (`apps/api`)
Express **5** · katmanlar: `routes → controller → service → repository` + zod şemaları (shared'dan) · `pg` (node-postgres), ORM yok, ham SQL repository'lerde · migration: numaralı `.sql` + `schema_migrations` tablosu (sürüm + checksum) tutan küçük runner · kimlik: token hash'li `sessions` tablosu (JWT yok), cookie `httpOnly; Secure; SameSite=Lax` + CSRF token · parola: bcryptjs (cost ≥ 12) — argon2id'e geçiş F8'de değerlendirilir · helmet, cors, express-rate-limit · dosyalar: Azure Blob Storage, kısa ömürlü, salt-okuma, blob bazlı SAS · Excel: exceljs · dev: `tsx watch` · şifreleme: `node:crypto` AES-256-GCM (anahtar ortam değişkeni / Azure Key Vault)

### Veritabanı
- Dev + otomatik testler: **pg-mem** (bkz. ADR-0002)
- Test ve canlı ortam: **PostgreSQL 17** (kendi sunucumuz)
- CI'da her PR'da gerçek PostgreSQL ile "parity" doğrulaması

### Test
**Vitest** (FE + BE, tek araç) · Testing Library · supertest · **Playwright** (E2E, lokal) · Playwright MCP (qa-verifier'ın tarayıcıda gözle kontrolü)

### Deployment ve sürüm kontrolü
İki Docker imajı: API `node:24-alpine` :4000, web `nginx:alpine` :8080 · Git: **yalnızca GitHub** (PR + GitHub Actions)

## Sonuçlar
- Olumlu: güncel ve desteklenen sürümler; FE/BE arasında şema ve kural paylaşımı (`packages/shared`); bilinen açıklı bağımlılık yok.
- Olumsuz: Lovable iskeletinin React 19 / Tailwind 4 / Router 7'ye taşınması F0'da iş çıkarır.
- Takip: F0-03 yükseltme ve yeniden yapılandırma görevi (ADR-0006; F0-03a yükseltme, F0-03b monorepo).
