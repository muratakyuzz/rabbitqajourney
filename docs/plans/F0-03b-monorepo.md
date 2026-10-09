# F0-03b — Monorepo taşıması (`apps/web`, boş `apps/api`, `packages/shared`)

**Durum:** Onaylandı
**Spec referansı:** Yok, teknik görev. Dayanaklar:
- `docs/adr/0001-stack.md` (Repo yapısı)
- `AGENTS.md` §3 (Klasör sözleşmesi)
- `docs/PHASES.md` F0-03
- `docs/TEST_STRATEGY.md` §5 ("Komutlar — F0-02/F0-03 ile tanımlanır")
- F0-02 değişiklik notu :317 (`name`, `engines`)
- ADR-0006 K6

**Branch:** `chore/f0-03b-monorepo`
**Bağımlılıklar:** F0-03a ✅ (main'e merge edilmiş). Branch, 03a merge'ünden sonraki main'den açılır.

## 1. Amaç
Mevcut web uygulamasını içeriğine dokunmadan `apps/web`'e taşımak, boş `apps/api` ve `packages/shared` iskeletlerini açmak, kökü npm workspaces köküne çevirmek. CI ve günlük komutlar kökten aynen çalışmaya devam eder. Kabul ölçütleri:
- Taşınan dosyalar saf yeniden adlandırmadır (R100).
- CSS asset adı 03a'dakiyle aynıdır.
- M-06 karşılaştırmasında fark yoktur.

## 2. Kapsam
- **Taşıma (`git mv`):** `src/` → `apps/web/src/`, `public/` → `apps/web/public/`, ayrıca şu dosyalar `apps/web/` altına: `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json` (web çözüm dosyası, `paths` `./src/*` göreli kalır), `tsconfig.app.json`, `tsconfig.node.json`, `components.json`. D2 yolunda `postcss.config.js` varsa o da taşınır.
- **Kökte kalanlar:** `package.json` (yeniden yazılır), `package-lock.json` (yeniden üretilir), `eslint.config.js` (yol güncellemesi), `.gitignore`, `.gitleaksignore`, `README.md`, `.mcp.json`, `.github/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `.claude/`. Yeni bir kök `tsconfig.json` eklenir; yalnızca `references` içerir.
- **Kök `package.json`:**
  - `"name": "rabbitqa"`, `"private": true`, `"type": "module"`
  - `"workspaces": ["apps/*", "packages/*"]`
  - `"engines": { "node": ">=24" }`
  - Ortak araçlar `devDependencies`'te: `typescript`, `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@types/node` (24'e yükseltilir, D4).
  - Script'ler:
    - `dev`: `npm run dev -w @rabbitqa/web`
    - `build`: `npm run build --workspaces --if-present`
    - `preview`: `npm run preview -w @rabbitqa/web`
    - `lint`: `eslint .`
    - `typecheck`: `npm run typecheck --workspaces --if-present`
    - `test`: `npm run test --workspaces --if-present`
    - `test:watch`: `npm run test:watch -w @rabbitqa/web`
- **`apps/web/package.json`:**
  - `"name": "@rabbitqa/web"`, private, `type: module`.
  - Bugünkü script'ler: `dev`, `build`, `build:dev`, `preview`, `test`, `test:watch`, `typecheck`.
  - Bütün çalışma zamanı bağımlılıkları ve web'e özgü dev bağımlılıkları **aynı sürüm aralıklarıyla**: vite, plugin-react, tailwind, vitest, testing-library, jsdom, @types/react, tailwindcss-animate ve diğerleri.
  - `"@rabbitqa/shared": "*"` (workspace bağı; import edilmez).
- **`apps/api/`:** `package.json` (`@rabbitqa/api`, private, `type: module`, script ve bağımlılık yok) ve `README.md` ("API iskeleti F0-05'te"). Kaynak kod yok.
- **`packages/shared/`:**
  - `package.json`: `@rabbitqa/shared`, private, `type: module`, `"exports": { ".": "./src/index.ts" }`, `"scripts": { "typecheck": "tsc --noEmit -p tsconfig.json" }`.
  - `tsconfig.json`: strict, `module ESNext`, `moduleResolution bundler`, `noEmit`, `include: ["src"]`.
  - `src/index.ts`: yalnızca `export {};` ve "F0-04'te şemalar, enum'lar; F6-01'de business-days" yorumu.
  - **Tip, şema ya da enum kopyalanmaz** (INV-19; F0-04).
- **`eslint.config.js`:** `ignores`'a `**/dist`; ui override yolu `apps/web/src/components/ui/**/*.{ts,tsx}`.
- **Belgeler (builder):**
  - `README.md`: "Yapı" bölümü (apps/web, apps/api, packages/shared); komutlar aynı.
  - `docs/API_CONTRACT.md` başlığına tek not: "F0-03b'den itibaren mockup kodu `apps/web/src/` altındadır; bu belgedeki `src/…` başvuruları `apps/web/src/…` olarak okunur."

### Kapsam dışı
- Dosya içeriği değişikliği (AC-NEG1). Paket sürümü değişikliği; tek istisna `@types/node` (D4).
- `apps/worker` (F0-05). Vitest `projects` / ortak test altyapısı (F0-06). `e2e/`, `migrations/` (F0-05, F0-06).
- `.github/workflows/ci.yml` (değişiklik gerekmemeli; gerekirse Murat). `.claude/`, `AGENTS.md`, `docs/agents/`, `TEST_STRATEGY` (§13).

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: yok. `pg-only`: yok.

## 4. API etkisi
Endpoint yok. `apps/api` boştur. `docs/API_CONTRACT.md`'ye yalnızca başlık notu eklenir.

## 5. Yetki etkisi (RBAC)
| Rol | İzin | Not |
|---|---|---|
| csm | değişmez | — |
| devops | değişmez | — |
| care | değişmez | — |
| manager | değişmez | — |
| admin | değişmez | — |

## 6. UI etkisi
- Ekranlar: değişiklik yok. Build çıktısının CSS'i aynı olmalıdır (AC6).
- Boş, yükleniyor ve hata durumları: değişmez.

## 7. Kabul kriterleri

**Ön ölçüm (main @ 03a merge sonrası `<sha>`):**
- `npm run build` asset adları ve boyutları (CSS dosya adı ayrıca)
- `npm test` dosya/test sayısı
- `npm ls --all --json` → `name@version` kümesi (scratchpad'e, commit edilmez)
- `npm audit`
- "Önce" ekran seti (03a §8.1)

- **AC1 (yapı)** — Given branch, Then:
  - Kökte `src/`, `public/`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `components.json` yoktur.
  - `apps/web/` altında bunlar ve `package.json` vardır.
  - `apps/api/` altında yalnızca `package.json` ve `README.md` vardır.
  - `packages/shared/` altında yalnızca `package.json`, `tsconfig.json` ve `src/index.ts` vardır.
- **AC2 (saf taşıma)** — When `git diff -M100% --name-status main...HEAD` çalıştırılır, Then `apps/web/src/**` ve `apps/web/public/**` altındaki her dosya `R100`'dür. Taşınan config dosyaları da `R100`'dür; farklı olan varsa satır sayısı ve gerekçesi nottadır (beklenen: yok).
- **AC3 (workspace)** — When temiz klonda `npm ci` çalıştırılır, Then:
  - Çıkış 0'dır.
  - `npm ls --workspaces --depth=0` üç workspace'i listeler.
  - `npm ls @rabbitqa/shared` `apps/web` altında workspace bağlantısı (`-> ./packages/shared`) gösterir.
  - `npm ls --depth=0` çıkışı 0'dır.
- **AC4 (sürüm eşitliği)** — Given ön ölçümdeki `name@version` kümesi, When branch'te aynı komut koşulur, Then workspace girdileri (`@rabbitqa/*`) ve `@types/node` (D4) dışında küme **eşittir**: yeni paket, kaybolan paket ve sürüm farkı 0'dır. Karşılaştırma script'i ve çıktısı nottadır.
- **AC5 (komutlar ve CI)** — Given kök dizin, When `npm run lint`, `npm run typecheck`, `npm test` ve `npm run build` çalıştırılır, Then hepsi 0 ile çıkar. Lint uyarı listesi main ile aynıdır (yollar `apps/web/` önekli). `.github/workflows/ci.yml` değişmemiştir ve branch'te CI `app` + `secrets` yeşildir. `npm ls xlsx --all` boştur.
- **AC6 (build eşitliği)** — When `npm run build`, Then `apps/web/dist/assets/index-*.css` dosya adı (içerik hash'i) ön ölçümdeki CSS adıyla **aynıdır**. JS boyutu ±%0,5 içindedir; hash farkı varsa nedeni (modül yolu) nottadır. `apps/web/dist/index.html` yapısı aynıdır.
- **AC7 (test eşitliği)** — `npm test` dosya ve test sayısı ön ölçümle aynıdır; hepsi geçer.
- **AC8 (dev)** — Kökten `npm run dev` `http://localhost:8080` adresinde login ekranını açar. `npm run preview` çalışır.
- **AC9 (L5b-A)** — 03a §8.1 yöntemi uygulanır: önce = main @ `<sha>`, sonra = branch; 37 ekran + QA-03 çifti. **Beklenen: her çiftte 0 farklı piksel**. Eşik ≤ %0,1 (ADR-0006 K5); sıfırdan büyük fark açıklanır.
- **AC10 (L5b-B)** — M-06 baseline'ın (D12 kabul edildiyse 38 PNG) gözle karşılaştırması; 03a AC13 ile aynı ölçüt.
- **AC11 (QA-03)** — 03a AC14 adımları branch'te tekrarlanır: toast "Müşteri onayı kaydedildi" görünür.
- **AC12 (belgeler)** — README "Yapı" bölümünü içerir. `docs/API_CONTRACT.md` diff'i yalnızca başlık notudur.
- **AC-NEG1** — Taşınan dosyalarda içerik değişikliği yoktur (AC2). `git diff -M main...HEAD -- apps/web/src` yalnızca yeniden adlandırma gösterir. `src/lib/rabbitqa/**` davranışı aynıdır.
- **AC-NEG2** — `apps/api` ve `packages/shared` içinde iş kodu, şema, enum ya da tip kopyası yoktur. `packages/shared/src/index.ts` yalnızca `export {}` içerir (INV-19). `apps/api/package.json`'da `dependencies` yoktur.
- **AC-NEG3** — Kök ve workspace `package.json`'larında `overrides` yoktur. `npm audit` sonucu 03a'nın son durumundan kötü değildir.

## 8. Test planı
| AC | Seviye | Doğrulama |
|---|---|---|
| AC1, AC2, AC-NEG1, AC-NEG2, AC12 | Diff/dosya kontrolü (reviewer) | `git diff -M100% --name-status`, `ls` |
| AC3, AC4, AC5, AC6, AC7, AC-NEG3 | Komut kontrolü (qa-verifier) | `npm ci`, `npm ls`, karşılaştırma script'i, kök komutlar, `gh run list` |
| AC8, AC11 | L6 (Playwright MCP) | — |
| AC9 | L5b-A (pixelmatch) | — |
| AC10 | L5b-B | — |

Yeni test yazılmaz. Mevcut 13 dosyalık set `apps/web` workspace'inde kökten koşar.

## 9. İlgili invariant maddeleri
- **INV-19**: `packages/shared` açılır ama boştur. Tip, şema ve enum F0-04'te tek kaynak olarak eklenir; bu görevde kopya yoktur (AC-NEG2).
- **INV-13**: `business-days` henüz `apps/web/src/lib/rabbitqa/` altındadır. Shared'a taşınması F6-01'dir.
- **INV-14**: `.env*` kökte kalır. Vite `envDir` varsayılanı `apps/web` olur. Uygulama şu an ortam değişkeni kullanmadığı için etki yoktur; F0-04/F0-08 bunu `envDir` ile netleştirir (Öneriler).
- **INV-20 / 25–28**: Kod taşınır, değişmez.

## 10. Riskler ve açık sorular
| Risk | Azaltma |
|---|---|
| Tailwind kaynak taraması cwd'ye bağlı | 03a'da `source` CSS dosyasına göreli yapıldı; AC6 CSS hash eşitliği bunu kanıtlar |
| `npm install` lock'u yeniden çözerken sürüm kaydırır | AC4 küme karşılaştırması. Kayma olursa `npm install`'ı `--prefer-offline` ile tekrarla; düzelmezse dur |
| JS hash'i modül yolları yüzünden değişir | Kabul, ±%0,5 boyut. Görsel kanıt AC9 |
| `.verify/` worktree'leri ve kök `eslint .` | `.verify` zaten `ignores`'ta |
| Vite `envDir` ve `.env` yeri | Bugün env kullanılmıyor. Öneri F0-08 |
| Guard'ın eski kök yolları (`^src/`, `^public/`, `^index\.html$`) | Zararsız. Kit güncellemesi §13 |

### Karar tablosu (Murat)
| # | Soru | Seçenekler | Öneri |
|---|---|---|---|
| D1 | Paket adları | `rabbitqa` (kök), `@rabbitqa/web`, `@rabbitqa/api`, `@rabbitqa/shared` | Öneri bu |
| D2 | `packages/shared` tüketim biçimi | (a) TS kaynağı `exports` ile (build yok; Vite, Vitest ve `tsx` doğrudan okur) · (b) `tsc` build + `dist` | **(a), geçici.** F0-05 API'nin üretim build'inde yeniden değerlendirilir (ADR-0006 K6) |
| D3 | `apps/web` şimdiden `@rabbitqa/shared`'a bağımlı olsun mu? | evet / hayır | **Evet.** Workspace bağını kanıtlar, bundle'a girmez |
| D4 | `@types/node` 22 → 24 (Node 24 ile hizalama) | evet / hayır | **Evet**, yalnızca tip. AC4 istisnası |
| D5 | Kök `tsconfig.json` | (a) yalnızca `files: []` + `references` (`apps/web`, `packages/shared`) · (b) `tsconfig.base.json` | **(a).** Ortak taban F0-05/F0-06'da gerekirse eklenir |
| D6 | `.nvmrc` | ekle / ekleme | **Ekleme** (kapsam dışı). `engines` yeterli; Öneriler'e |

> **Murat cevapları (2026-10-09):**
> - D1–D6: "Öneri" sütunu kabul edildi.
>   - D1: paket adları `rabbitqa` (kök), `@rabbitqa/web`, `@rabbitqa/api`, `@rabbitqa/shared`.
>   - D2 = (a): `packages/shared` TS kaynağını `exports` ile verir, build yok. Geçici karar; F0-05'te yeniden değerlendirilir (ADR-0006 K6).
>   - D3: evet, `apps/web` `@rabbitqa/shared`'a bağlanır.
>   - D4: evet, `@types/node` 24'e çıkar (yalnızca tip, AC4 istisnası).
>   - D5 = (a): kök `tsconfig.json` yalnızca `files: []` + `references`.
>   - D6: `.nvmrc` eklenmez, Öneriler'e yazılır.
> - **Ek kural (sürüm varsayma):** Sürümü değişen tek paket olan `@types/node` için ön ölçümde `npm view @types/node versions` çalıştırılır. 24 major'u stabil olarak yayımlanmamışsa en son stabil major'da kalınır; sapma değişiklik notunun "Açık sorular / sapmalar" bölümüne yazılır.
> - **CI audit:** `ci.yml` değişmez. `npm audit --omit=dev --audit-level=high` bloklayıcı kalır. Tam audit bloklamayan rapor adımı olarak F0-07'ye not edildi (F0-03a §10.3).
> - Plan durumu: Onaylandı.

### Açık sorular
- CI'da değişiklik gerekmemeli. Gerekirse (ör. `npm ls xlsx --all` workspace davranışı) builder durur; `ci.yml`'yi Murat düzenler.

## 11. Gerekli gate'ler
- [x] **reviewer**: R100 kanıtı, `package.json` dağılımı (sürüm aralıkları aynı), workspace yapısı, shared/api'nin boşluğu, eslint yolları, belgeler.
- [x] **qa-verifier**: temiz klonda `npm ci` ve kök komutlar, AC4 küme karşılaştırması, AC6 CSS hash'i, L5b-A ve L5b-B, AC8, AC11.
- [ ] **rules-reviewer: HAYIR.** İçerik değişmiyor; yalnızca yeniden adlandırma var. `/gate` yol anahtar kelimeleriyle (`rules.ts`, `flow.ts`, `alerts.ts`, `business-days.ts`, `reports.ts` yeniden adlandırmaları) tetiklenirse tek kontrol şudur: `git diff -M100% --name-status main...HEAD -- '*rabbitqa*'` çıktısındaki her satır `R100` mü? Karar tablosu gerekmez.

## 12. Uygulama görev metni
```
AGENTS.md, docs/INVARIANTS.md, docs/RBAC.md, docs/DATA_MODEL.md ve docs/TEST_STRATEGY.md dosyalarını oku.
Ardından docs/plans/F0-03b-monorepo.md planını ve docs/adr/0006-f0-03-upgrade-and-monorepo.md K6'yı uygula. Kararlar §10 "Murat cevapları"nda (yoksa dur, sor).
Ön koşul: F0-03a main'de merge edilmiş. Branch: chore/f0-03b-monorepo (main'den). PR açma.

0) ÖN ÖLÇÜM (main @ <sha>) → docs/changes/chore_f0-03b-monorepo.md "Ölçüm — main":
   npm run build (asset adları/boyutları, CSS adı ayrıca) · npm test (dosya/test) · npm audit ·
   npm ls --all --json → name@version kümesi (scratchpad, commit ETME) · "önce" ekran seti (F0-03a §8.1).

1) refactor: move web app to apps/web
   git mv src apps/web/src ; git mv public apps/web/public ;
   git mv index.html vite.config.ts vitest.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json components.json apps/web/
   (postcss.config.js varsa o da). İçerik DEĞİŞTİRME. Bu commit tek başına build olmayabilir; 2. commit'le birlikte doğrulanır, notta belirt.
2) chore: set up npm workspaces (apps/web, apps/api, packages/shared)
   - Kök package.json: name "rabbitqa", private, type module, workspaces ["apps/*","packages/*"], engines {"node": ">=24"},
     scripts: dev, build, preview, lint ("eslint ."), typecheck, test, test:watch (plan §2'deki delegasyonla).
     devDependencies: typescript, eslint, @eslint/js, typescript-eslint, globals, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @types/node (24, D4; önce npm view @types/node versions — 24 stabil yayımlanmamışsa en son stabil major, sürüm VARSAYMA, sapma nota).
   - apps/web/package.json: name "@rabbitqa/web"; mevcut script'ler (dev, build, build:dev, preview, test, test:watch, typecheck);
     kalan tüm dependencies/devDependencies AYNI ARALIKLARLA; "@rabbitqa/shared": "*".
   - apps/api/package.json (@rabbitqa/api, private, type module) + README.md ("API iskeleti F0-05'te — docs/PHASES.md").
   - packages/shared/package.json (@rabbitqa/shared, private, type module, exports {".": "./src/index.ts"}, scripts.typecheck "tsc --noEmit -p tsconfig.json"),
     tsconfig.json (strict, ESNext, bundler, noEmit, include src), src/index.ts: `export {};` + yorum. Şema/enum/tip KOPYALAMA.
   - Kök tsconfig.json (yeni): { "files": [], "references": [{ "path": "./apps/web" }, { "path": "./packages/shared" }] }.
   - eslint.config.js: ignores'a "**/dist"; ui override files → "apps/web/src/components/ui/**/*.{ts,tsx}".
   - rm -rf node_modules package-lock.json YAPMA; `npm install` ile lock'u güncelle. Sonra name@version kümesini ön ölçümle karşılaştır (AC4).
     Fark varsa (@rabbitqa/* ve @types/node dışında) dur ve not et.
3) docs: describe monorepo layout → README.md "Yapı" bölümü; docs/API_CONTRACT.md başlığına plan §2'deki tek not.

Bitiş:
- rm -rf node_modules apps/*/node_modules packages/*/node_modules && npm ci && npm run lint && npm run typecheck && npm test && npm run build → nota.
- npm ls --workspaces --depth=0 ; npm ls @rabbitqa/shared ; npm ls xlsx --all ; npm audit → nota.
- git diff -M100% --name-status main...HEAD → R100 dışı satırları listele (beklenen: yalnızca yeni ve kök dosyalar).
- CSS asset adı ön ölçümle aynı mı (AC6)? JS boyut farkı?
- npm run dev → http://localhost:8080 login açılıyor (AC8).
- F0-03a §8.1 A seti (önce = main, sonra = branch) → tablo nota; beklenen 0 piksel.
- Değişiklik notu: Ölçüm—main, commit listesi, AC ↔ kanıt, AC4 karşılaştırma çıktısı, Eşleme, Açık sorular, Öneriler (.nvmrc, envDir → F0-08, Vitest projects → F0-06).
- Push et. PR açma.
Kurallar: docs/WORKFLOW.md şablon A. Taşınan dosyaların içeriği değişmez. Paket sürümü değişmez (yalnızca @types/node, D4). Hedef major npm'de stabil yayımlanmamışsa en son stabil major'da kal; sapmayı değişiklik notuna yaz.
```

## 13. Denetim / Murat işleri (builder dışı)
- **Önce:** PHASES'ta F0-03b satırı (03a M1 ile aynı commit).
- **Merge sonrası (denetim, kit değişiklikleri Murat onayıyla):**
  - `AGENTS.md` §1 "Mockup yapısı" yolları → `apps/web/src/…`.
  - `docs/agents/qa-verifier.md:63` demo komutu → `npm run build && npm run preview -- --host 127.0.0.1 --port 8090` (kökten).
  - `docs/TEST_STRATEGY.md` §3 "Mockup testleri (`src/`)" → `apps/web/src/`; §5 → kök komutların workspace delegasyonu.
  - `.claude/hooks/guard.mjs:32-33` yorumu "F0-03b ile taşındı" olarak güncellenir. `^src/`, `^public/`, `^index\.html$` desenleri zararsız; F0-04'te kaldırılabilir.
  - PHASES F0-03 ✅. BACKLOG'da QA-03 kapanır. ADR-0001 repo yapısı satırı "gerçekleşti (F0-03b)".
