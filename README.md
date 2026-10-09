# RabbitQA Onboarding Tracker

Virgosol iç ekibinin RabbitQA müşteri onboarding sürecini uçtan uca takip ettiği web uygulaması. Şu an dondurulmuş bir demo mockup'tır (`mockup-freeze`): backend yoktur, tüm veri tarayıcıda (localStorage) tutulur. Backend, dondurulmuş mockup'ın sözleşmesine (`docs/API_CONTRACT.md`) göre fazlar halinde yazılır.

## Gereksinimler
- Node 24
- npm (tek kilit dosyası `package-lock.json`)

## Yapı
npm workspaces monorepo'su; komutlar kökten çalışır ve workspace'lere devredilir.
- `apps/web`: web uygulaması (`@rabbitqa/web`; React, Vite). Mockup kodu `apps/web/src/` altındadır.
- `apps/api`: API (`@rabbitqa/api`); şimdilik boş iskelet, F0-05'te yazılır.
- `packages/shared`: ortak şemalar, enum'lar ve iş günü hesabı (`@rabbitqa/shared`); şimdilik boş, F0-04'te dolar.

## Çalıştırma
```sh
npm ci
npm run dev
```
Uygulama http://localhost:8080 adresinde açılır. Demo giriş: store'daki kullanıcılardan birinin e-postası (`apps/web/src/lib/auth-api.ts`); şifre kontrol edilmez, pasif kullanıcı giremez.

## Kontroller
```sh
npm run lint
npm run typecheck
npm test
npm run build
```

## Belgeler
- `AGENTS.md`: ajan ve geliştirme kuralları
- `docs/PRODUCT_SPEC.md`: ürün gereksinimleri
- `docs/PHASES.md`: faz ve görev planı
- `docs/WORKFLOW.md`: geliştirme akışı
