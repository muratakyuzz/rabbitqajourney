# Değişiklik notu — chore/f0-03b-monorepo
> `/build` doldurur, branch'in son commit'iyle birlikte push edilir; `/gate` bunu okur, `/fix` "Review düzeltmeleri" tablosunu günceller.

## Görev
- Plan: `docs/plans/F0-03b-monorepo.md`
- Faz / görev kodu: F0-03b
- Ek talimat (Murat, `/build` argümanı): BACKLOG "F0-03a kapanış" satırındaki REV2-01..03 Low düzeltmeleri taşıma (R100) commit'inden ayrı, sonraki bir commit'te; CSS hash'inin değişmediği notta gösterilir (aşağıda "REV2-01..03").

## Ölçüm — main (`2d522d5`, temiz `npm ci` sonrası)
| Ölçüm | Değer |
|---|---|
| `npm run build` | `dist/index.html` 0,87 kB · `dist/assets/index-CDN67-XW.css` 86.706 B (86,70 kB) · `dist/assets/index-LqGeOgQ3.js` 1.313.283 B (1.313,28 kB); >500 kB uyarısı (mevcut) |
| CSS sha256 | `35246c672c5582faeb38172444dc6ce819795efb764ee4256077d217fad531e4` |
| JS sha256 | `0b9a5a56f8d5f5485285c9229cc7b526ce38b0384589e4f738f11498b7df4764` |
| `npm test` | 13 dosya / 213 test, hepsi geçti |
| `npm run lint` | 0 hata / 21 uyarı (liste scratchpad'de, aşağıda karşılaştırma) |
| `npm run typecheck` | exit 0 |
| `npm audit` | 0; `--omit=dev --audit-level=high` exit 0 |
| `npm ls --all --json` | 443 benzersiz `name@version` (scratchpad, commit edilmedi) |
| `npm view @types/node versions` | Son stabil sürümler: 22 → 22.20.5, **24 → 24.19.2**, 25 → 25.9.9, 26 → 26.6.5. 24 stabil yayımlanmış; `^24.19.2` seçildi (D4, Murat ek kuralı) |
| "Önce" ekran seti | main worktree'sinin (`.verify/wt-main`, `2d522d5`) production build'i, port 8090; çiftler "sonra" ile art arda çekildi (L5b-A bölümü) |

## Ne değişti
- **Taşıma (`8692ac6`):** `git mv` ile `src/`, `public/`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `components.json` → `apps/web/`. 142 dosya, hepsi `R100`, içerik değişmedi. `postcss.config.js` yok (03a'da kaldırıldı). Bu commit tek başına build olmaz (kökte `package.json` hâlâ eski, `vite` kökte `index.html` bulamaz); sonraki iki commit'le birlikte doğrulandı.
- **`tsconfig.app.json` `lib` ES2020 → ES2022 (`d95469e`):** D4'ün yan etkisi; ayrı commit (Açık sorular 2).
- **Workspace kurulumu (`65a140a`):**
  - Kök `package.json`: `rabbitqa`, private, `type: module`, `workspaces: ["apps/*", "packages/*"]`, `engines.node >=24`. Script'ler plan §2'deki gibi workspace'lere devreder. Ortak araçlar (`typescript`, `eslint`, `@eslint/js`, `typescript-eslint`, `globals`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `@types/node`) kökte, aynı aralıklarla. `@types/node` `^22.16.5` → `^24.19.2` (D4).
  - `apps/web/package.json` (`@rabbitqa/web`): main'deki 7 script (`dev`, `build`, `build:dev`, `preview`, `test`, `test:watch`, `typecheck`) aynen. 52 çalışma zamanı bağımlılığı ve 11 web dev bağımlılığı aynı aralıklarla. Ek olarak `"@rabbitqa/shared": "*"` (import edilmiyor).
  - `apps/api/`: yalnızca `package.json` (`@rabbitqa/api`, script/bağımlılık yok) ve `README.md`.
  - `packages/shared/`: `package.json` (`exports: { ".": "./src/index.ts" }`, `typecheck` script'i), `tsconfig.json`, `src/index.ts` (yalnızca `export {};` + yorum).
  - Kök `tsconfig.json` (yeni içerik): `files: []` + `references` (`./apps/web`, `./packages/shared`) (D5).
  - `eslint.config.js`: `ignores`'a `**/dist`; ui override yolu `apps/web/src/components/ui/**/*.{ts,tsx}`.
  - `package-lock.json`: `node_modules` ve lock silinmeden `npm install` ile güncellendi.
- **Belgeler (`7fe2227`):** README'ye "Yapı" bölümü; demo giriş yolu `apps/web/src/lib/auth-api.ts`. `docs/API_CONTRACT.md` başlığına tek satır not.
- **REV2-01..03 (`42696b9`):** taşımadan ayrı commit, mesajda üç ID (aşağıda).
- **Kök script argüman geçişi (`d5fad3c`):** `dev`, `preview`, `test:watch` sonuna `--` (Açık sorular 3).

## REV2-01..03 (BACKLOG "F0-03a kapanış")
| ID | Dosya | Değişiklik |
|---|---|---|
| REV2-01 | `docs/changes/chore_f0-03a-upgrades.md:465` | "uygulamada description/action/cancel bugün kullanılmıyor" → "`description` `HandoverWorkspace.tsx:73`'te kullanılıyor (handover toast'ı); action/cancel kullanılmıyor". "betik L5b-A bölümünde" → "kontrol: build CSS'inde (`dist/assets/index-*.css`) bu 4 seçicinin `@layer` blok derinliği 0, yani hiçbir `@layer` bloğunun içinde değil" |
| REV2-02 | `apps/web/src/index.css:283-290` (yorum) | "sonner's `<style>` is appended after this file" → "In production sonner's `<style>` is appended after this file, in dev before it; the order is the same as in v3, so ties resolve as in v3." Yalnızca yorum |
| REV2-03 | `docs/changes/chore_f0-03a-upgrades.md:356,371` | KPI hover satırı qa-verifier r2 ölçümüyle: `25.09.2026 / Değer : 40 %`, iki tarafta aynı; "builder betiği yakalayamadı, `kpiTooltipOnHover: null`" kaynağı yazıldı |

**CSS hash kanıtı:** REV2 commit'inden sonraki build'de CSS dosyası yine `index-CDN67-XW.css`, sha256 ön ölçümle aynı (`35246c67…fad531e4`). Yorum minify'da atılıyor, build CSS'ine girmiyor. Temiz `npm ci` sonrası son build'de de aynı (Kontroller).

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Kanıt |
|---|---|---|---|
| AC1 | ✅ | Dosya | Kökte `src/`, `public/`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `components.json` yok. `git ls-files apps/api` → `README.md`, `package.json`. `git ls-files packages/shared` → `package.json`, `src/index.ts`, `tsconfig.json`. `apps/web/` altında taşınanlar + `package.json` |
| AC2 | ✅ (2 bilinçli istisna) | Diff | Taşıma commit'i `8692ac6`: 142/142 `R100`. `main...HEAD` (`-M100%`): 139 `R100`. İstisnalar: `tsconfig.app.json` (`-M` ile R097, 1+/1−, `lib`; Açık sorular 2) ve `src/index.css` (`-M` ile R097, 3+/2−, REV2-02 yorumu; Murat ek talimatı). Ayrıca `apps/web/tsconfig.json` `A` görünür, çünkü kökte aynı adla yeni `tsconfig.json` var; `-C100% --find-copies-harder` ile `C100 tsconfig.json → apps/web/tsconfig.json`. R100 dışı satırların tam listesi Kontroller'de |
| AC3 | ✅ | Komut | Temiz `npm ci` exit 0. `npm ls --workspaces --depth=0` üç workspace (`@rabbitqa/api -> ./apps/api`, `@rabbitqa/shared -> ./packages/shared`, `@rabbitqa/web -> ./apps/web`). `npm ls @rabbitqa/shared`: `@rabbitqa/web` altında `@rabbitqa/shared@0.0.0 deduped -> ./packages/shared`. `npm ls --depth=0` exit 0 |
| AC4 | ✅ (sapma notlu) | Komut | `@rabbitqa/*` ve `@types/node` dışında tek fark `undici-types` 6.21.0 → 7.24.6. Bunu yalnızca `@types/node` kullanıyor; D4'ün geçişli sonucu, Murat kabulü (Açık sorular 1). Script ve çıktı aşağıda |
| AC5 | ✅ lokal / CI gate'te | Komut | Kökten lint (0 hata / 21 uyarı, liste main ile birebir, `apps/web/` önekli), typecheck, test, build exit 0. `.github/workflows/ci.yml` diff'i boş. `npm ls xlsx --all` → `(empty)`. CI sonucu: Kontroller |
| AC6 | ✅ | Komut | CSS adı `index-CDN67-XW.css`, ön ölçümle aynı (sha256 de aynı). JS `index-LqGeOgQ3.js` aynı ad, aynı boyut (fark %0) ve aynı sha256; modül yolu farkı JS'e yansımadı. `apps/web/dist/index.html` main'deki `dist/index.html` ile bayt düzeyinde aynı (`diff` boş) |
| AC7 | ✅ | L1/L3 | `npm test` (kök → `@rabbitqa/web`): 13 dosya / 213 test, hepsi geçti; ön ölçümle aynı |
| AC8 | ✅ (builder kontrolü) | Betikli L6 | Kökten `npm run dev` → `vite` `http://localhost:8080/`. Playwright (Chromium): `/` → `/login`, başlık "Hoş geldiniz", "Giriş yap"; CSM girişi → `/app/overview`; konsol hata 0, uyarı 0. `npm run preview -- --host 127.0.0.1 --port 8091 --strictPort` kökten çalışıyor (L5b-A "sonra" sunucusu) |
| AC9 | ✅ (builder kontrolü) | L5b-A | 39 çift (37 baseline ekranı + QA-03 çifti + yığın açık QA-03): son durumda hepsi eşik 0,1'de **ve** eşik 0'da 0 px. Tablo aşağıda |
| AC10 | — | L5b-B | qa-verifier (M-06 baseline'a gözle). Bundle'lar main ile bayt düzeyinde aynı olduğundan 03a AC13 sonucundan farklı bir görünüm beklenmiyor |
| AC11 | ✅ (builder kontrolü) | Betikli L6 | QA-03 akışı branch'te (8091) ve main'de (8090): toast "Müşteri onayı kaydedildi" görünür, "Onaylayan" satırı 1, kontrol listesi "Müşteri onayı … Tamamlandı". Çift eşik 0'da 0 px |
| AC12 | ✅ | Diff | README "Yapı" bölümü (+6 satır) ve demo giriş yolu (1 satır). `docs/API_CONTRACT.md` diff'i yalnızca başlıktaki tek satır not (+1) |
| AC-NEG1 | ✅ (2 bilinçli istisna) | Diff | `git diff -M main...HEAD -- src apps/web/src` → tek R100 dışı satır `R097 src/index.css` (REV2-02 yorumu, build CSS'ine girmiyor). `src/lib/rabbitqa/**` 16 dosyanın hepsi `similarity index 100%`; `rules-reviewer` tetik kontrolü (`-- '*rabbitqa*'`) yalnızca R100 |
| AC-NEG2 | ✅ | Dosya | `packages/shared/src/index.ts` yalnızca `export {};` + 2 satır yorum. `apps/api/package.json`'da `dependencies`/`scripts` yok. Şema/enum/tip kopyası yok |
| AC-NEG3 | ✅ | Komut | `grep overrides` kök + 3 workspace `package.json` → boş. `npm audit` 0 (03a son durumu 0); `--omit=dev --audit-level=high` exit 0 |

### AC4 karşılaştırma script'i ve çıktısı
```js
// pkgset.mjs: node pkgset.mjs ls.json → sorted unique name@version
import fs from "fs";
const t = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const set = new Set();
const walk = (deps) => { for (const [n, d] of Object.entries(deps ?? {})) { set.add(`${n}@${d.version ?? (d.resolved ?? "?")}`); walk(d.dependencies); } };
walk(t.dependencies);
console.log([...set].sort().join("\n"));
```
```
$ npm ls --all --json > pre/ls.json   # main, temiz npm ci
$ npm ls --all --json > post/ls.json  # branch, temiz npm ci
$ diff pre/set.txt post/set.txt       # 443 → 446 satır
32a33,35
> @rabbitqa/api@0.0.0
> @rabbitqa/shared@0.0.0
> @rabbitqa/web@0.0.0
143c146
< @types/node@22.20.5
---
> @types/node@24.19.2
418c421
< undici-types@6.21.0
---
> undici-types@7.24.6
$ npm ls undici-types --all
rabbitqa@0.0.0
`-- @types/node@24.19.2
  `-- undici-types@7.24.6
```
`npm install` bayraksız yapıldı ve Radix ya da başka bir paket yeniden bölünmedi; `--prefer-offline` / `--prefer-dedupe` gerekmedi.

## L5b-A (önce = main `2d522d5` @ 8090, sonra = branch @ 8091)
Yöntem: F0-03a §8.1. Her iki taraf production build + `vite preview`; Playwright (Chromium 1228, headless, `deviceScaleFactor` 1, `tr-TR`, Europe/Istanbul), temiz bağlam (seed). Her ekran için önce/sonra art arda çekildi. Karşılaştırma pixelmatch (Node, `includeAA` false), eşik 0,1 ve 0. Ekranlar `.verify/screens/f0-03b/{before,after,diff,diff0}/`, yeniden çekim `rerun/` (commit edilmedi).

| Ekran | Boyut | Fark (eşik 0,1) | Oran | Eşik 0 |
|---|---|---|---|---|
| 34 ekran (aşağıdaki 5 hariç), QA-03 çifti ve yığın açık QA-03 dahil | eşit | 0 | %0 | 0 |
| care-project-detail-no-credentials-tab | 1200×1284 | 794 → **0** | %0,0515 → 0 | 10.064 → **0** |
| csm-insights | 1200×2124 | 1.532 → **0** | %0,0601 → 0 | 16.373 → **0** |
| csm-overview | 1200×2505 | 1.839 → **0** | %0,0612 → 0 | 20.471 → **0** |
| csm-projects-list | 1200×1284 | 359 → **0** | %0,0233 → 0 | 5.038 → **0** |
| csm-tab-access-credentials | 1200×1284 | 534 → **0** | %0,0347 → 0 | 5.622 → **0** |

- İlk koşuda 5 ekranda fark çıktı. Hepsi eşik altındaydı, boyutlar eşitti. Farklar sayfanın her yerinde metin kenarlarına dağılmıştı (sidebar dahil); yerleşim farkı yoktu.
- Aynı 5 çift yeniden çekildi: hepsi eşik 0,1'de ve 0'da **0 px**.
- Neden: koşudan koşuya değişen metin rasterleştirmesi; kodla ilgisi yok. Kanıt: main'in ilk koşusu main'in ikinci koşusuyla karşılaştırıldığında da aynı tür fark çıkıyor (`csm-overview` 21.170 px, `csm-projects-list` 5.038 px, `csm-insights` 1.798 px, eşik 0). Ayrıca iki tarafın JS/CSS/`index.html`'i bayt düzeyinde aynı.
- Son durum: 39/39 çift eşik 0'da 0 px. 33 çiftin PNG'si ilk koşuda bayt düzeyinde aynıydı.
- Konsol: 78 çekimin hepsinde hata 0, uyarı 0. Toast computed stilleri (arka plan, renk, kenarlık, gölge) iki tarafta aynı.

## Veritabanı
- [x] Migration yok

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-19 (shared boş açıldı, kopya yok), INV-13 (`business-days` `apps/web/src/lib/rabbitqa/` altında, değişmedi), INV-14 (`.env*` kökte; aşağıda), INV-20/25–28 (kod yalnızca taşındı).
- Endpoint, yazma işlemi, gerekçe şeması yok. Trigger / PL/pgSQL / RLS / motor kontrolü yok.

## Kontroller (çıktı özeti)
Temiz kurulumdan sonra (`rm -rf node_modules apps/web/node_modules apps/api/node_modules packages/shared/node_modules apps/web/dist && npm ci`), `42696b9` üzerinde. `d5fad3c` yalnızca 3 kök script'e `--` ekliyor; aşağıda yeniden koşuldu:
```
npm ci             → exit 0, found 0 vulnerabilities
npm run lint       → exit 0; ✖ 21 problems (0 errors, 21 warnings); liste main ile birebir (yollar apps/web/ önekli, diff boş)
npm run typecheck  → exit 0 (@rabbitqa/web: tsconfig.app + tsconfig.node; @rabbitqa/shared: tsconfig)
npm test           → exit 0; Test Files 13 passed (13), Tests 213 passed (213)   [RUN v5.0.3 apps/web]
npm run build      → exit 0; apps/web/dist/assets/index-CDN67-XW.css 86,70 kB, index-LqGeOgQ3.js 1.313,28 kB (>500 kB uyarısı mevcut)
npm ls --workspaces --depth=0 → @rabbitqa/api -> ./apps/api, @rabbitqa/shared -> ./packages/shared, @rabbitqa/web -> ./apps/web
npm ls @rabbitqa/shared       → @rabbitqa/web └ @rabbitqa/shared@0.0.0 deduped -> ./packages/shared
npm ls --depth=0              → exit 0
npm ls xlsx --all             → (empty)
npm audit                     → found 0 vulnerabilities; --omit=dev --audit-level=high exit 0
npm run e2e        → tanımlı değil (F0-06)
```
`git diff -M100% --name-status main...HEAD` R100 dışı satırlar (139 R100):
```
M  README.md                      A  apps/api/README.md          A  apps/api/package.json
A  apps/web/package.json          A  apps/web/src/index.css      A  apps/web/tsconfig.app.json
A  apps/web/tsconfig.json         M  docs/API_CONTRACT.md        M  docs/changes/chore_f0-03a-upgrades.md
M  eslint.config.js               M  package-lock.json           M  package.json
A  packages/shared/package.json   A  packages/shared/src/index.ts A packages/shared/tsconfig.json
D  src/index.css                  D  tsconfig.app.json           M  tsconfig.json
```
(+ bu not.) `src/index.css` ve `tsconfig.app.json` `-M` ile R097. `apps/web/tsconfig.json` `-C100% --find-copies-harder` ile `C100`.

CI (`app` + `secrets`): **builder doğrulayamadı.** Branch `d5fad3c` ile push edildi, push CI'ı tetikler. Ancak bu makinede `gh` kurulu değil ve depo özel olduğu için API anonim yanıt vermiyor (`Not Found`). CI'daki komutların hepsi yukarıda lokal olarak yeşil: `npm ci`, lint, typecheck, test, build, audit high, xlsx. Sonucu qa-verifier `/gate`'te okur (AC5).

## Eşleme (plandaki ad → koddaki ad)
- BACKLOG REV2-01 `HandoverWorkspace.tsx:72` → gerçek yer `apps/web/src/pages/project/workspaces/HandoverWorkspace.tsx:73`.
- BACKLOG REV2-02 `src/index.css:288-289` → `apps/web/src/index.css:283-290` (yorum bloğu).
- Plan "`apps/web/package.json`: bugünkü script'ler" → main'deki 7 script aynen; `lint` kökte kaldı (plan §2 ile uyumlu).

## Açık sorular / sapmalar
1. **AC4 — `undici-types` 6.21.0 → 7.24.6:** Plan "fark varsa dur" diyordu; durup Murat'a soruldu. **Karar (Murat, 2026-10-09): D4 kapsamında kabul.** Paket yalnızca `@types/node`'un bağımlılığı (`>=7.24.0 <7.24.7`).
2. **`apps/web/tsconfig.app.json` `lib` ES2020 → ES2022 (`d95469e`):** `@types/node` 24 (D4), `Array`'e `RelativeIndexable.at` eklemesini artık yapmıyor. Bu yüzden typecheck 3 dosyada TS2550 verdi: `reports.ts:55`, `ContinuityTab.tsx:70`, `Phase2Tabs.tsx:42`. F0-03a not 7 bu durumu öngörmüştü. Durup Murat'a soruldu. **Karar (Murat, 2026-10-09): `lib` ES2022, taşımadan ayrı commit.**
   - `target` ES2020'de kaldı. Değişiklik yalnızca tip düzeyinde; build çıktısı bayt düzeyinde aynı.
   - Bu yüzden `tsconfig.app.json` AC2'de R100 değil (1+/1−). Plan bunu "farklı olan varsa satır sayısı ve gerekçesi nottadır" diye öngörüyordu.
3. **Kök script'lerde `--` (`d5fad3c`):** Plan kök script'i `npm run preview -w @rabbitqa/web` olarak veriyordu. Bu biçimde `npm run preview -- --host 127.0.0.1 --port 8091` kökten çalışmıyor: npm `--host`/`--port`'u kendi bayrağı sanıyor, vite "Unused args: `8091`" hatasıyla çıkıyor. Plan §13'teki qa-verifier demo komutu (`npm run build && npm run preview -- --host 127.0.0.1 --port 8090`, kökten) buna dayanıyor. `dev`, `preview` ve `test:watch` sonuna `--` eklendi. Argümansız davranış aynı (`npm run dev` → `vite`, doğrulandı). Plan metninden mekanik sapma; iş kuralı yok.
4. **`version: "0.0.0"`:** Kökte (main'de vardı) ve üç workspace'te tutuldu/eklendi. Planda yok. `npm ls` çıktısında `@rabbitqa/web@0.0.0` görünsün diye eklendi; davranış etkisi yok.
5. **`packages/shared/tsconfig.json`:** Plandaki `strict`, `module ESNext`, `moduleResolution bundler`, `noEmit`, `include: ["src"]` alanlarına ek olarak `target ES2022`, `isolatedModules` ve `skipLibCheck` var. Neden: varsayılan hedef ES5 ve kökte hoist edilen `@types/node` 24'ün tip kontrolü gereksiz yere koşmasın. `apps/web/tsconfig.node.json` ile aynı tercih.
6. **REV2 değişikliği ve AC2/AC-NEG1:** REV2-02 yorumu taşınan `apps/web/src/index.css`'te. Bu yüzden branch düzeyinde (`main...HEAD`) bu dosya R100 değil (R097, 3+/2−). Taşıma commit'i (`8692ac6`) kendi içinde 142/142 R100; REV2 ayrı commit'te (`42696b9`), Murat ek talimatı ve BACKLOG satırıyla uyumlu.
7. **INV-14 / `envDir`:** `.env` ve `.env.example` kökte kaldı. Vite `envDir` varsayılanı artık `apps/web`. Uygulama ortam değişkeni kullanmıyor; etki yok (plan §9).

## Öneriler (kapsam dışı)
- `.nvmrc` (D6): `engines` yeterli, eklenmedi.
- Vite `envDir` → kök `.env` (F0-08 / F0-04).
- Vitest `projects` / ortak test altyapısı (F0-06).
- L5b-A betiği metin rasterleştirmesinden kaynaklı koşu belirsizliği gösteriyor (bu turda 5 ekran, ≤ %0,07). F0-06 repo içi betiğinde, fark çıkan çift için otomatik bir yeniden çekim ya da fontların ısınması için ek bekleme önerilir (QA-07 ile aynı aile).
- Kit (§13, denetim): `docs/agents/qa-verifier.md` demo komutu kökten `npm run preview -- --host … --port …` olarak artık çalışıyor (Açık sorular 3). `guard.mjs`'teki `^src/`, `^public/`, `^index\.html$` desenleri artık boşta. `apps/web/**` zaten `^apps\//` ile korunuyor, zararsız (plan §13).

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
| REV2-01 (F0-03a r2) | Düzeltildi | `42696b9` |
| REV2-02 (F0-03a r2) | Düzeltildi | `42696b9` |
| REV2-03 (F0-03a r2) | Düzeltildi | `42696b9` |
