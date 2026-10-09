# Değişiklik notu — chore/f0-03a-upgrades
> `/build` doldurur, branch'in son commit'iyle birlikte push edilir; `/gate` bunu okur, `/fix` "Review düzeltmeleri" tablosunu günceller. Dosya adı: `docs/changes/<branch, / → _>.md`.

## Görev
- Plan: `docs/plans/F0-03a-stack-upgrades.md` (+ `docs/adr/0006-f0-03-upgrade-and-monorepo.md`)
- Faz / görev kodu: F0-03a
- Baz: main @ 269bf44 (M1 commit'i dahil; ADR-0006 "Kabul edildi")

## Ne değişti
- **Paketler** (§2.1 hedefleri, hepsi stabil sürüm): React 19, react-router 7 (`react-router-dom` kaldırıldı), recharts 3 (+ `react-is` doğrudan bağımlılık), date-fns 4 + `@date-fns/tz`, Vite 8 + `@vitejs/plugin-react` 6 (`plugin-react-swc` kaldırıldı), Vitest 5, Tailwind 4 + `@tailwindcss/vite` (`postcss`, `autoprefixer` kaldırıldı), tailwind-merge 3. Peer'in zorunlu kıldığı eşlikler: react-day-picker 9, next-themes 0.4, vaul 1.
- **Tailwind 4 CSS-first:**
  - `tailwind.config.ts` ve `postcss.config.js` silindi.
  - `src/index.css`'te sıra: font `@import` → `@import "tailwindcss" source(none)` → `@source "./**/*.{ts,tsx}"` → `@custom-variant dark` → `@plugin "tailwindcss-animate"` → `@theme inline`.
  - Ardından v3 uyumluluk kuralları gelir.
  - `:root`/`.dark` blokları byte-byte aynı (aşağıdaki AC6).
- **Codemod** (`@tailwindcss/upgrade@4.3.3`): 32 dosyada (31 ui + `AppShell.tsx`) mekanik sınıf yeniden adlandırması. 3 yanlış pozitif geri alındı ya da düzeltildi (Açık sorular 3).
- **Tip düzeyi uyarlamalar:** recharts 3 (`KpiChart` formatter parametresi, `ui/chart.tsx`), react-day-picker 9 (`ui/calendar.tsx`). Vitest 5 tip ortamı: `tsconfig.app.json` `types`'a `node`; setup'ta `@testing-library/jest-dom/vitest`.
- **Görünüm koruması:**
  - `ManagementReport`'ta `Legend itemSorter={null}`: recharts 3'ün alfabetik legend sıralamasını kapatır. `Tooltip itemSorter={() => 0}`: recharts 3'ün ada göre tooltip sıralamasını kapatır (gate REV-03).
  - 4 grafik kökünde (`KpiChart`, `ManagementReport` ×3) `accessibilityLayer={false}`: recharts 3'ün klavye odağı varsayılanı kapatıldı, v2 davranışı korundu (Murat kararı, gate QA-02/REV-04).
  - `index.css`'e katmansız Sonner toast kuralları eklendi: Tailwind 4 utility'leri `@layer` içinde, Sonner'ın çalışma anında eklediği katmansız CSS `ui/sonner.tsx` classNames'ini eziyordu (gate REV-01).
  - `Badges`'ta v3'te CSS üretmeyen `bg-success/12` kaldırıldı.
  - `index.css`'e v3 `space-x/y` kuralı eklendi.
  - Gerekçeler "Açık sorular / sapmalar"da.
- **Router:** 26 dosyada yalnızca import satırı değişti. Ara commit `583d5db` future flag'leri açar, son durumda `future` prop'u yoktur.
- **Takip maddeleri:**
  - `eslint.config.js`: ui override'ına `react-refresh/only-export-components: "off"` eklendi (lint uyarısı 28 → 21).
  - `docs/API_CONTRACT.md:315` v1.3 satırına REV2-01 notu eklendi.
- **Ekran ve akış davranışı (gate round 1 düzeltmeleri sonrası, `a6f46d8`):** görsel fark yok. L5b-A'da 39 çiftin 39'u eşik 0,1'de PASS; iki toast çifti ve Go-Live onay toast'ı (yığılı ve açık hali) eşik 0'da da 0 px. Eşik 0'da sıfırdan büyük kalan çiftlerin nedeni L5b-A tablosunda (recharts 3 kenar yuvarlaması, diyalog kenarı AA, çekim gürültüsü). Grafik davranışı (tooltip sırası, klavye odağı, tıklama çerçevesi) main ile aynı; tek görünmez fark, grafiğe tıklandıktan sonra odağın recharts 3'ün `tabindex=-1` katmanında kalması.

## Ölçüm — main @ 269bf44 (değişiklikten önce)
```
npm ls --depth=0        → exit 0 (react 18.3.1, react-router-dom 6.30.6, recharts 2.15.4, date-fns 3.6.0,
                          react-day-picker 8.10.2, next-themes 0.3.0, vaul 0.9.9, vite 5.4.21,
                          @vitejs/plugin-react-swc 3.11.0, vitest 3.2.7, tailwindcss 3.4.19,
                          tailwind-merge 2.6.1, postcss 8.5.28, autoprefixer 10.6.1, jsdom 20.0.3)
npx eslint .            → 0 errors, 28 warnings (liste aşağıda)
npm run typecheck       → exit 0
npm test                → Test Files 13 passed (13) · Tests 213 passed (213)
npm run build           → dist/assets/index-CjfMyXEl.css 68.25 kB (gzip 11.83)
                          dist/assets/index-Dcv2guIw.js 1,223.99 kB (gzip 344.57)
npm audit               → 14 (critical 2, high 6, moderate 6)
npm audit --omit=dev    → 2 moderate (react-router, react-router-dom)
```
"Önce" ekran seti: `.verify/screens/f0-03a/before/` (37 baseline + `csm-golive-approval-success-toast`, commit edilmedi; yöntem L5b-A bölümünde).

**Hedef sürüm kontrolü (`npm view <paket> versions`, stabil olanlar; alpha/beta/rc/next/canary sayılmadı):**

| Paket | Hedef major | npm'de en son stabil sürüm | Kullanılan |
|---|---|---|---|
| react / react-dom / react-is / @types/react(-dom) | 19 | 19.3.0 | 19.3.0 |
| react-router | 7 | 7.18.4 (latest dist-tag 8.4.0) | 7.18.4 |
| recharts | 3 | 3.10.1 | 3.10.1 |
| date-fns / @date-fns/tz | 4 / 1 | 4.4.0 / 1.5.0 | 4.4.0 / 1.5.0 |
| react-day-picker | 9 | 9.14.0 (latest dist-tag 10.0.2) | 9.14.0 |
| next-themes / vaul | 0.4 / 1 | 0.4.6 / 1.1.2 | 0.4.6 / 1.1.2 |
| vite / @vitejs/plugin-react | 8 / 6 | 8.3.4 / 6.1.2 | 8.3.4 / 6.1.2 |
| vitest | 5 | 5.0.3 | 5.0.3 |
| tailwindcss / @tailwindcss/vite | 4 | 4.3.3 | 4.3.3 |
| tailwind-merge | 3 | 3.7.0 | 3.7.0 |

Her hedef major stabil olarak yayımlanmış; sürüm sapması yok. react-router 8 ve react-day-picker 10 yayımlanmış ama plan hedefi 7 ve 9; bunlar kapsam dışı (Öneriler).

## Breaking change kontrol listesi
Kaynaklar resmi rehberlerdir:
- vite.dev/guide/migration (v6, v7, v8)
- plugin-react CHANGELOG (5.0.0, 6.0.0)
- vitest.dev/guide/migration (v4, v5)
- tailwindcss.com/docs/upgrade-guide
- react.dev React 19 upgrade guide
- React Router `docs/upgrading/v6.md` (7.18.4 paketi; reactrouter.com sayfası 404 verdi)
- recharts wiki 3.0-migration-guide
- daypicker.dev/v9/upgrading
- date-fns v4.0.0 release

| Paket | Madde | Etkiliyor mu | Kanıt |
|---|---|---|---|
| Vite 6–8 | Node `^20.19 \|\| >=22.12` | Hayır | Node 24.14.1 |
| Vite 6 | `resolve.conditions`, `json.stringify`, Sass modern API, postcss-load-config 6, lib CSS adı | Hayır | config'te yok; Sass/lib yok |
| Vite 7 | `build.target` → `baseline-widely-available`; `splitVendorChunkPlugin`, `transformIndexHtml` `enforce` kalktı | Hayır (target) / Hayır | `vite.config.ts`'te `build` yok |
| Vite 8 | Rolldown/Oxc: `rollupOptions`→`rolldownOptions`, `esbuild`→`oxc`, `optimizeDeps.esbuildOptions` | Hayır | `grep -nE "rollupOptions\|esbuild\|optimizeDeps\|manualChunks\|build\." vite.config.ts vitest.config.ts` boş |
| Vite 8 | CSS minify Lightning CSS | **Evet** | CSS 68,25 → 66,55 kB (commit `f20a1e4`), L5b-A 0 piksel fark |
| Vite 8 | Native config loader `__dirname` uyarısı | **Evet** | Build uyarısı → `import.meta.dirname` (`vite.config.ts:17`, `vitest.config.ts:14`) |
| Vite 8 | Object `manualChunks` kalktı, CJS interop tutarlı | Hayır | `manualChunks` yok; build ve testler yeşil |
| plugin-react 5 | `react`/`react-dom` otomatik `dedupe` kalktı | Hayır | `vite.config.ts` `dedupe` zaten açık |
| plugin-react 6 | Babel ve `babel` seçeneği kalktı; peer `vite ^8` | Hayır | `react()` seçeneksiz |
| Vitest 4 | `workspace`→`projects`, pool seçenekleri, `environmentMatchGlobs`, `basic` reporter | Hayır | `vitest.config.ts`'te yok |
| Vitest 4 | `vi.fn`/`restoreAllMocks`/`getMockName`/`invocationCallOrder` semantiği, `new vi.fn` | Hayır | `restoreAllMocks\|getMockName\|clearMocks\|settledResults\|invocationCallOrder` 0; `new …vi.fn` 0 |
| Vitest 5 | Node `^22.12 \|\| ^24`; peer vite `^6.4 \|\| ^7 \|\| ^8` | Hayır / **Evet** | Vitest 3 + Vite 8 → ERESOLVE (D9 birleşimi) |
| Vitest 5 | `clearMocks: true` varsayılan | Hayır | Mock kullanan testler (17 `vi.fn`/`spyOn`, 11 çağrı assert'i) değişmeden 213/213 yeşil; 3 kez koşuldu |
| Vitest 5 | `vi.mock`/`vi.hoisted` yalnızca üst seviyede | Hayır | 17 `vi.mock` hepsi satır başında; girintili çağrı 0 |
| Vitest 5 | Sahte saat `Temporal`'ı da sahteler | Hayır | `Temporal` kullanımı yok; `Date` davranışı aynı |
| Vitest 5 | `vitest/globals` tipleri `@types/node`'u artık dolaylı getirmiyor; jest-dom matcher tipleri `Assertion`'a eklenmiyor | **Evet** | typecheck 20 hata (`Array.at`, `node:fs`, `toHaveAttribute`…) → `types: [..., "node"]`, `@testing-library/jest-dom/vitest` |
| Tailwind 4 | Config → CSS (`@theme`), `@tailwind` → `@import` | **Evet** | §2.4 uygulandı |
| Tailwind 4 | Yeniden adlandırmalar (shadow, blur, outline, ring…) | **Evet** | Codemod tablosu aşağıda; sayfa dosyalarında v3 adı kalmadı (grep 0) |
| Tailwind 4 | Varsayılan kenarlık `currentColor`, placeholder, buton imleci | **Evet** | Uyumluluk kuralları (a)(b)(c) |
| Tailwind 4 | `space-x/y` seçicisi değişti | **Evet** | 172 kullanım; inline çocukta boşluk kayboldu (login, handover, insights) → uyumluluk kuralı (d) |
| Tailwind 4 | Opaklık değiştiricisi her sayıyı kabul eder (`color-mix`) | **Evet** | `bg-success/12` v3'te CSS üretmiyordu → kaldırıldı |
| Tailwind 4 | `hover:` yalnızca hover cihazında, `[hidden]` önceliği | Hayır | Ekran görüntüsünü etkilemez; `sidebar.tsx:471` tooltip `hidden` prop'u, L5b-A'da fark yok |
| Tailwind 4 | Varyant yığılma sırası, `!` soneki, `[--x]`→`(--x)` | **Evet** | Codemod düzeltti (tablo) |
| Tailwind 4 | Tarayıcı tabanı Safari 16.4 / Chrome 111 / Firefox 128 | Kabul | ADR-0006 |
| tailwind-merge 3 | Yalnızca TW4 sınıfları; `extendTailwindMerge` tema anahtarları | Hayır | `extendTailwindMerge\|createTailwindMerge` 0; L5b-A 0 piksel |
| React 19 | `propTypes`/`defaultProps`, string ref, `ReactDOM.render`, `findDOMNode`, `react-dom/test-utils` kalktı | Hayır | `grep -rnE "useRef\(\)\|[^.]JSX\.\|defaultProps\|propTypes\|react-dom/test-utils\|findDOMNode\|ReactDOM\.render" src` boş |
| React 19 | `element.ref` deprecated (eski Radix uyarısı) | Hayır | Dev modunda 38 ekran, konsol uyarısı 0 (D11 tetiklenmedi) |
| React 19 | TS: `useRef` argümanı, global `JSX`, `ReactElement["props"]` unknown | Hayır | typecheck exit 0, kod değişikliği yok |
| React Router 7 | Paket birleşti, future flag'ler varsayılan | **Evet** | 26 import + `583d5db` / `96982a3` |
| React Router 7 | `v7_relativeSplatPath` | Hayır | Tek splat `App.tsx:59` `path="*"`, göreli link yok |
| React Router 7 | `json`/`defer` kalktı, data router bayrakları | Hayır | Data router yok; `json(`/`defer(` 0 |
| recharts 3 | Tooltip/Legend tipleri (`TooltipContentProps`, Legend `payload`) | **Evet** | `KpiChart.tsx:15`, `ui/chart.tsx` tip düzeltmesi |
| recharts 3 | Legend sırası değişebilir (varsayılan `itemSorter="value"`) | **Evet** | `manager-reports` legend'ları alfabetik → `itemSorter={null}` |
| recharts 3 | `react-is` peer | **Evet** | `react-is` doğrudan bağımlılık (önce ^18, React 19 commit'inde ^19) |
| recharts 3 | `Customized`/`activeIndex`/`blendStroke`/`isFront`/`alwaysShow`/`yAxisId`/`connectNulls` | Hayır | grep 0 |
| recharts 3 | `accessibilityLayer` varsayılan `true` (v2: `false`) | **Evet** | Grafikler Tab ile odaklanıyor, tıklamada odak çerçevesi + tooltip çıkıyordu. 4 grafik köküne `accessibilityLayer={false}` ile v2 davranışı korundu (Murat kararı, gate QA-02/REV-04) |
| recharts 3 | Tooltip varsayılan `itemSorter: 'name'` (v2: sırasız) | **Evet** | "CSM başına müşteri ve açık iş" tooltip'i "Açık iş, Müşteri" oluyordu → 3 `Tooltip`'e `itemSorter={() => 0}` (gate REV-03) |
| recharts 3 | z-sırası, animasyon motoru | Hayır (görsel) | `manager-reports` çubuk/dilim kenarında 1–2 px yuvarlama, `csm-tab-discovery-teams` KPI çizgisi kenarı (L5b-A tablosu) |
| Tailwind 4 × Sonner | Utility'ler `@layer` içinde; Sonner'ın katmansız CSS'i `ui/sonner.tsx` classNames'ini eziyor | **Evet** | Tüm toast'ların kenarlık, metin rengi ve gölgesi Sonner varsayılanına dönmüştü → `index.css`'te katmansız, (0,3,0) özgüllüklü v3 kuralları (gate REV-01) |
| react-day-picker 9 | classNames anahtarları, `IconLeft/Right`→`Chevron`, date-fns kendi bağımlılığı | **Evet** | `ui/calendar.tsx` (kullanılmıyor; tek kullanım yeri) |
| react-day-picker 9 | `initialFocus`→`autoFocus`, `fromDate`… | Hayır | Calendar hiçbir yerde render edilmiyor |
| date-fns 4 | Tipler değişti, ESM-first, `in`/`TZDate` | Hayır | `src`'de date-fns import'u 0 (AC11) |

## Commit tablosu
Her commit'ten sonra `npm run lint && npm run typecheck && npm test && npm run build` çalıştırıldı.

| # | sha | Paketler / değişiklik | lint (E/W) | typecheck | test (dosya/test) | build CSS / JS |
|---|---|---|---|---|---|---|
| 1 | `7b130a1` | react-day-picker 9 + `calendar.tsx` | 0 / 28 | 0 | 13 / 213 | 68,25 kB (`CjfMyXEl`) / 1.223,99 kB |
| 2 | `af46ebd` | date-fns 4, @date-fns/tz 1 | 0 / 28 | 0 | 13 / 213 | 68,25 / 1.223,99 |
| 3 | `34ca067` | recharts 3, react-is 18 + tip + `itemSorter` | 0 / 28 | 0 | 13 / 213 | 68,25 / 1.234,44 |
| 4 | `b858e97` | React 19, @types 19, react-is 19, next-themes 0.4, vaul 1 | 0 / 28 | 0 | 13 / 213 | 68,25 / 1.314,72 |
| 5a | `583d5db` | `BrowserRouter future` (paket yok) | 0 / 28 | 0 | 13 / 213 (×3) | 68,25 / 1.314,78 |
| 5b | `96982a3` | react-router 7, react-router-dom kaldırıldı | 0 / 28 | 0 | 13 / 213 (×3) | 68,25 / 1.331,44 |
| 6+7 | `f20a1e4` | vite 8, plugin-react 6, vitest 5 (D9), plugin-react-swc kaldırıldı | 0 / 28 | 0 | 13 / 213 | 66,55 kB / 1.305,44 |
| 8a | `d77c64d` | tailwindcss 4, @tailwindcss/vite 4; postcss, autoprefixer kaldırıldı | 0 / 28 | 0 | 13 / 213 | 86,12 kB / 1.305,38 |
| 8b | `deb546c` | tailwind-merge 3 | 0 / 28 | 0 | 13 / 213 | 86,12 / 1.313,14 |
| 9 | `261e36a` | eslint ui override | 0 / 21 | 0 | 13 / 213 | 86,12 / 1.313,14 |
| 10 | `2cbc93e` | API_CONTRACT REV2-01 (yalnızca doküman) | 0 / 21 | 0 | 13 / 213 | 86,12 / 1.313,14 |

- Ara commit'lerde kullanılan `node_modules`, o commit'teki lock'tan kuruldu (npm install sonucu).
- Bitişte temiz kurulum yapıldı: `rm -rf node_modules && npm ci`.

**D9 birleşimi (6+7):**
- `npm install vite@8 @vitejs/plugin-react@6` → `ERESOLVE`: `@vitest/mocker@3.2.7` ve `vite-node@3.2.4` (vitest 3) peer olarak `vite ^5 || ^6 || ^7` istiyor.
- Vite 8 tek başına kurulamadığı için iki adım tek commit'te yapıldı.
- Kurulum: `npm uninstall vitest` → `npm install --prefer-dedupe -D vite@^8.3.4 @vitejs/plugin-react@^6.1.2 vitest@^5.0.3`.

## Çözümlenen sürümler (`npm ls --depth=0`, branch HEAD, temiz `npm ci` sonrası, exit 0)
```
@date-fns/tz@1.5.0  @tailwindcss/vite@4.3.3  @types/react@19.3.0  @types/react-dom@19.3.0
@vitejs/plugin-react@6.1.2  date-fns@4.4.0  next-themes@0.4.6  react@19.3.0  react-dom@19.3.0
react-day-picker@9.14.0  react-is@19.3.0  react-router@7.18.4  recharts@3.10.1
tailwind-merge@3.7.0  tailwindcss@4.3.3  tailwindcss-animate@1.0.7  vaul@1.1.2
vite@8.3.4  vitest@5.0.3  jsdom@20.0.3 (değişmedi)
Yok: react-router-dom, @vitejs/plugin-react-swc, autoprefixer, postcss (doğrudan bağımlılık olarak)
Değişmeyen: @radix-ui/* (main ile aynı sürümler), sonner 1.7.4, lucide-react 0.462.0, typescript 5.9.3, eslint 9.39.5
```
- `package.json`'a eklenen adlar: `@date-fns/tz`, `react-is`, `react-router`, `@vitejs/plugin-react`, `@tailwindcss/vite`. Hepsi ADR-0006 K4 listesinde.
- `jsdom` değişmedi.
- `overrides`/`resolutions` yok; `.npmrc` yok.
- `--legacy-peer-deps` ve `--force` **kullanılmadı**; `npm audit fix` çalıştırılmadı.
- Kullanılan tek ek bayrak `--prefer-dedupe` (Açık sorular 1).

## Codemod çıktısı (`npx -y @tailwindcss/upgrade@4.3.3`, temiz ağaçta, `d77c64d` öncesi)
```
≈ tailwindcss v4.3.3
↳ Upgrading from Tailwind CSS `v3.4.19`
↳ Linked `./tailwind.config.ts` to `./src/index.css`
↳ Migrated configuration file: `./tailwind.config.ts`
↳ Migrated stylesheet: `./src/index.css`
↳ Updated package: `tailwindcss`
↳ Migrated templates for configuration file: `./tailwind.config.ts` (35 files changed)
   ui: radio-group, scroll-area, button, hover-card, context-menu, textarea, pagination, select, tabs,
       resizable, popover, sidebar, separator, toast, sheet, calendar, menubar, toggle, breadcrumb, chart,
       badge, table, dropdown-menu, input, input-otp, checkbox, card, command, dialog, navigation-menu,
       slider, switch · diğer: AppShell.tsx, PageHeader.tsx, workspaces.test.ts
↳ Installed package: `@tailwindcss/postcss` · Removed package: `autoprefixer`
↳ Migrated PostCSS configuration: `./postcss.config.js`
```
Codemod sonrası elle yapılanlar:
- D7 = (a): `@tailwindcss/postcss` ve `postcss` kaldırıldı, `postcss.config.js` silindi, `@tailwindcss/vite` eklendi.
- `@theme` → `@theme inline`; `@utility container` silindi (kodda `container` sınıfı yok).
- Font import'una codemod'un eklediği `layer(base)` geri alındı (ilk satır main'le aynı).
- Uyumluluk kuralları (b)(c)(d) eklendi.

**Yeniden adlandırma türü → sayı** (son durumda, `d77c64d`, 32 dosya):

| Tür | Sayı |
|---|---|
| `outline-none` → `outline-hidden` (varyantlı dahil) | 44 |
| `data-[x]` / `has-[:x]` / `supports-[x]` → yalın varyant (`data-disabled`, `has-disabled`…) | 36 |
| Rastgele değer → ölçek (`p-[1px]`→`p-px`, `min-w-[8rem]`→`min-w-32`, `z-[1]`→`z-1`…) | 15 |
| CSS değişkeni `[--x]` / `[var(--x)]` → `(--x)` (`sidebar.tsx` `w-(--sidebar-width)` dahil) | 15 |
| Rastgele seçici varyantı → `**:` / `in-*` / `has-*` | 15 |
| Varyant sırası (soldan sağa yığılma) | 11 |
| `theme(spacing.4)` → `--spacing(4)` | 3 |
| `shadow-sm` → `shadow-xs` | 2 |
| `shadow` → `shadow-sm` | 2 |
| `backdrop-blur` → `backdrop-blur-sm` | 1 |
| `break-words` → `wrap-break-word` | 1 |

## Test değişiklik türleri (AC-NEG2)
| Test dosyası | Değişiklik türü |
|---|---|
| `src/components/rq/InsightCard.test.tsx` | import yolu (`react-router-dom` → `react-router`) |
| `src/pages/MyWork.test.tsx` | import yolu |
| `src/pages/ProjectDetail.tabs.test.tsx` | import yolu |
| `src/pages/Projects.test.tsx` | import yolu |
| `src/pages/project/Phase3Tabs.RiskDialog.test.tsx` | import yolu |
| `src/pages/project/workspaces/HandoverWorkspace.test.tsx` | import yolu |
| `src/pages/project/workspaces/PhaseWorkspaces.test.tsx` | import yolu |
| `src/test/setup.ts` (test kurulumu) | `@testing-library/jest-dom` → `@testing-library/jest-dom/vitest` (Vitest API) |

Kalan durum:
- `getBy` → `findBy` gerekmedi.
- Assertion değişmedi; test silinmedi.
- `.skip`/`.only`/`.todo`, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `as any` eklenmedi (`git diff main...HEAD -- src` grep boş).

## Lint uyarıları (önce → sonra)
Önce (main, 28):
```
src/components/rq/Badges.tsx:47 · InsightCard.tsx:36,41,55,237,239            react-refresh/only-export-components
src/components/ui/badge.tsx:29 · button.tsx:47 · form.tsx:129 · navigation-menu.tsx:111 ·
  sidebar.tsx:636 · sonner.tsx:27 · toggle.tsx:37                              react-refresh/only-export-components
src/lib/auth-context.tsx:50,89                                                 react-hooks/exhaustive-deps
src/lib/auth-context.tsx:95                                                    react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:158,169,758                                         react-hooks/exhaustive-deps
src/lib/rabbitqa/store.tsx:763,770,774,779,785,792,796                         react-refresh/only-export-components
src/pages/ProjectDetail.tsx:237                                                react-refresh/only-export-components
src/pages/project/DiscoveryContent.tsx:24                                      react-hooks/exhaustive-deps
```
- Sonra 21 uyarı var: yukarıdaki listeden `src/components/ui/**`'daki 7 satır çıktı.
- Kalan 21 satır main'deki dosya:satır:kural ile birebir aynı; yeni `kural:dosya` çifti yok. Hata 0.

## Audit (önce → sonra)
| Paket (F0-02'den kalan 14) | main | branch |
|---|---|---|
| `@vitest/mocker` (moderate) | 3.2.7 | kapandı (5.0.3) |
| `braces` (high) | var | kapandı (ağaçta yok) |
| `chokidar` (high) | var | kapandı (ağaçta yok) |
| `esbuild` (moderate) | vite 5 altında | kapandı (ağaçta yok) |
| `fast-glob` (high) | var | kapandı (ağaçta yok) |
| `micromatch` (high) | var | kapandı (ağaçta yok) |
| `postcss-nested` (moderate) | tailwind 3 altında | kapandı (ağaçta yok) |
| `postcss-selector-parser` (moderate) | var | kapandı (ağaçta yok) |
| `react-router` (moderate) | 6.30.x | kapandı (7.18.4) |
| `react-router-dom` (moderate) | 6.30.6 | kapandı (kaldırıldı) |
| `tailwindcss` (high) | 3.4.19 | kapandı (4.3.3) |
| `tinypool` (critical) | var | kapandı (ağaçta yok) |
| `vite` (high) | 5.4.21 | kapandı (8.3.4) |
| `vitest` (critical) | 3.2.7 | kapandı (5.0.3) |

```
npm audit                                → found 0 vulnerabilities  ({"total":0})
npm audit --omit=dev --audit-level=high  → found 0 vulnerabilities, exit 0
```

## L5b-A — önce/sonra piksel karşılaştırması (builder kontrolü; kabul kanıtı qa-verifier'ındır)
**Ortam:**
- main @ 269bf44: ayrı worktree `.verify/f0-03a-base`, `npm ci && npm run build && npx vite preview --host 127.0.0.1 --port 8090 --strictPort`.
- Branch HEAD: aynı komutlarla port 8091.
- Aynı makine, aynı oturum. Her ekran için önce main, hemen ardından branch çekildi.

**Çekim aracı (sapma, Açık sorular 2):**
- Playwright MCP yerine scratchpad'de Playwright 1.x betiği kullanıldı (repo bağımlılığı değil).
- Tarayıcı: MCP'nin kullandığı önbellekteki Chromium (`chromium-1228`), headless.
- Her ekranda yeni ve izole context (temiz localStorage = seed), `deviceScaleFactor: 1`, `tr-TR`, `Europe/Istanbul`.
- Rol girişi UI'dan yapıldı.
- Viewport 1200×1284; insights diyaloğu 1200×718 (yalnızca viewport); mobil 390×844. Bunların dışında tam sayfa çekildi.
- Bekleme: `networkidle`, hedef metin, `document.fonts.ready`; ardından 0,9 s (grafiklerde 2,5 s).

**Karşılaştırma:**
- `pixelmatch` 8.0.0, `threshold: 0.1`, `includeAA: false` (varsayılan).
- `npx pixelmatch` CLI'ı ile aynı algoritma ve parametreler; Node betiği olarak çalıştırıldı.
- **Gate düzeltmesinden sonra (REV-02):** her çifte ikinci geçiş `threshold: 0` (pixelmatch, `includeAA: false`), ayrıca ham bayt karşılaştırması (herhangi bir kanalı farklı piksel sayısı, bbox, en büyük kanal farkı). Toast ekranlarında Sonner toast'larının computed `background-color`/`color`/`border-color`/`box-shadow` değerleri iki tarafta da kaydedildi.

| Koşu | Sonuç |
|---|---|
| Recharts sonrası (`34ca067`, 2 grafik ekranı) | `itemSorter` öncesi `manager-reports` %0,071 (legend sırası ters); sonrası %0,0089 |
| Vite 8 sonrası (`f20a1e4`, 38 ekran) | 36 ekran 0 px; `manager-reports` 235 px, `csm-tab-discovery-teams` 2 px |
| Tailwind 4 ilk koşu (codemod + `index.css`, uyumluluk (d) ve Badges düzeltmesi öncesi) | 5 FAIL: `admin-settings-integrations` %2,40, `login` %2,08, `csm-phase00-handover-workspace` %1,18, `csm-insights` %0,137, `csm-tab-integrations` %0,120. Nedenler: `space-y` + inline çocuk, `bg-success/12` |
| Tailwind 4 son (`d77c64d`) ve `2cbc93e` | 38/38 PASS (yalnızca eşik 0,1). Eşik 0 koşulmadığı için toast kenarlık/metin rengi farkı görünmedi (gate REV-01/REV-02) |
| Gate düzeltmeleri, koşu 1 (`f573ea2` build'i, 39 çift) | Eşik 0,1: 39/39 PASS. Eşik 0: toast çiftleri 0 px. `admin-settings-template` (main karesi) ve `manager-project-detail-no-credentials-tab` (branch karesi) tüm metinde glif farkı verdi; yeniden çekimde ikisi de ham 0 px (fade-in karesi, gate QA-07) |
| Gate düzeltmeleri, **son koşu** (`a6f46d8`) | Eşik 0,1: 39/39 PASS; tablo aşağıda |

**Son koşu (HEAD `a6f46d8` ↔ main `269bf44`, 39 çift):**

Sütunlar: pixelmatch eşik 0,1 (kabul ölçütü, AC12) · pixelmatch eşik 0 · ham fark (herhangi bir kanalı farklı piksel), bbox `x0,y0–x1,y1` ve en büyük kanal farkı.

| Ekran | Boyut | Fark (0,1) | Oran | Fark (eşik 0) | Ham fark · bbox · maks Δ | Açıklama |
|---|---|---|---|---|---|---|
| admin-overview | 1200×2790 | 0 | 0 | 0 | 0 | — |
| admin-project-detail | 1200×1284 | 0 | 0 | 0 | 0 | — |
| admin-settings-audit-log | 1200×1284 | 0 | 0 | 0 | 0 | — |
| admin-settings-integrations | 1200×1284 | 0 | 0 | 0 | 0 | — |
| admin-settings-template | 1200×1284 | 0 | 0 | 0 | 0 | — |
| admin-settings-users | 1200×1284 | 0 | 0 | 0 | 0 | — |
| care-overview | 1200×2448 | 911 | %0,0310 | 1252 | 2462 · 512,390–731,1304 · 177 | Main karesinde saat metni `12:56` ↔ `12:57` (dakika dönümü, bbox AI öneri satırları). Yeniden çekimde ham 0 px |
| care-project-detail-mobile-390 | 390×2042 | 0 | 0 | 0 | 0 | — |
| care-project-detail-no-credentials-tab | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-customer-report | 1200×2208 | 0 | 0 | 0 | 0 | — |
| csm-golive-approval-success-toast-expanded (ek çift, yığın açık) | 1200×1284 | 0 | 0 | 0 | 0 | Toast computed değerleri iki tarafta aynı: kenarlık rgb(214,221,230), metin rgb(15,23,41), arka plan beyaz, v3 `shadow-lg` |
| csm-golive-approval-success-toast (QA-03, AC14) | 1200×1284 | 0 | 0 | 0 | 0 | Toast computed değerleri iki tarafta aynı: kenarlık rgb(214,221,230), metin rgb(15,23,41), arka plan beyaz, v3 `shadow-lg` |
| csm-insights-step-update-edit-dialog-status-open | 1200×718 | 0 | 0 | 0 | 2 · 827,506–829,508 · 12 | Yalnızca ham farkta 2 px, en büyük kanal farkı 12; pixelmatch eşik 0'da AA olarak dışarıda kalıyor. Select odak halkası köşesi |
| csm-insights | 1200×2124 | 0 | 0 | 0 | 0 | — |
| csm-my-work | 1200×3789 | 0 | 0 | 0 | 0 | — |
| csm-overview | 1200×2505 | 0 | 0 | 0 | 0 | — |
| csm-phase00-handover-workspace | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-phase6-riskdialog-edit-default | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-phase6-riskdialog-reason-error-toast | 1200×1284 | 0 | 0 | 0 | 0 | Toast computed değerleri iki tarafta aynı: kenarlık rgb(214,221,230), metin rgb(15,23,41), arka plan beyaz, v3 `shadow-lg` |
| csm-phase6-riskdialog-reason-field | 1200×1284 | 0 | 0 | 0 | 11 · 370,472–675,774 · 7 | Yalnızca ham farkta 11 px, en büyük kanal farkı 7; pixelmatch eşik 0'da AA. Diyalog kenarı |
| csm-project-detail-phases | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-projects-list | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-tab-access-credentials | 1200×1284 | 534 | %0,0347 | 5622 | 16394 · 28,9–1162,1254 · 175 | Main karesi `animate-fade-in` ortasında (tüm metinde glif farkı; gate QA-07). Branch karesi koşular arasında birebir aynı; yeniden çekimde ham 0 px |
| csm-tab-actions | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-tab-contacts | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-tab-continuity | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-tab-discovery-teams | 1200×2470 | 2 | %0,0001 | 5 | 186 · 362,2191–392,2283 · 48 | KPI çizgi grafiği (bbox grafik alanı): recharts 3 çizgi kenarı yumuşatması |
| csm-tab-documents | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-tab-golive | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-tab-history | 1200×1284 | 0 | 0 | 0 | 0 | — |
| csm-tab-integrations | 1200×3028 | 0 | 0 | 0 | 0 | — |
| csm-tab-meetings | 1200×2002 | 0 | 0 | 0 | 0 | — |
| devops-overview | 1200×2443 | 0 | 0 | 0 | 0 | — |
| devops-tab-access-credentials | 1200×1284 | 0 | 0 | 0 | 0 | — |
| login | 1200×1284 | 0 | 0 | 0 | 0 | — |
| manager-new-project-dialog | 1200×1284 | 0 | 0 | 135 | 863 · 345,301–854,958 · 58 | Diyalog köşe/odak halkası kenarında AA; 863 ham pikselin yalnızca 135'i pixelmatch 0'da sayılıyor, en büyük fark 58. Önceki koşularla aynı |
| manager-overview | 1200×2790 | 0 | 0 | 0 | 0 | — |
| manager-project-detail-no-credentials-tab | 1200×1284 | 0 | 0 | 0 | 0 | — |
| manager-reports | 1200×2198 | 235 | %0,0089 | 235 | 1176 · 282,158–1136,474 · 177 | "CSM başına müşteri ve açık iş" ve "Gecikenler" çubuklarının kenarında 1 px yuvarlama, pasta dilim ucu (recharts 3 çubuk genişliği hesabı). Legend ve tooltip sırası, renkler aynı |

**Ekran notları:**
- Her ekranda konsol hatası 0, uyarısı 0 (her iki taraf, production build; son koşuda 78 çekim).
- Eşik 0'da sıfırdan büyük çiftlerin hiçbiri toast bölgesinde değil. Çekim gürültüsü (fade-in karesi, dakika dönümü) iki tam koşuda dört kez görüldü; her seferinde tek tarafta, yeniden çekimde ham 0 px.
- **Toast (REV-01):** `csm-phase6-riskdialog-reason-error-toast` ve `csm-golive-approval-success-toast` eşik 0'da 0 px (gate round 1'de 8.665 ve 19.451 px). Go-Live onayı iki toast üretiyor ("Go-Live tamamlandı…" önde, "Müşteri onayı kaydedildi" arkada; gate QA-06, main'de de aynı). Arkadaki toast'ı da sınamak için yığın hover ile açılıp ek çift (`…-expanded`) çekildi: 0 px, iki toast'ın da computed değerleri main ile aynı.
- Boyutlar baseline'la karşılaştırıldı. `csm-my-work` (3789; baseline 3868) ve `csm-phase00-handover-workspace` (1284; baseline 2277) her iki tarafta aynı. Fark seed/tarih ve çekim yönteminden geliyor (sheet açıkken sayfa kaydırma kilidi), branch'ten değil.
- **QA-03 (AC14), iki tarafta aynı akış:**
  - Akış: Go/No-Go "Toplantıyı kaydet" → 00'da 1 açık taahhüt "Karşılandı" (gerekçeli) → kişi seç, not yaz → "Müşteri onayını kaydet".
  - Sonuç: "Müşteri onayı kaydedildi" toast'ı görüldü. Kontrol listesinde "Müşteri onayı · Tamamlandı" var, "Onaylayan: Sevcan Vural (Product Owner) · 09.10.2026 · Kaydeden: Deniz Uzun" satırı var, konsol hatası 0.

**Dev modu konsolu (AC8-e, AC10):** aynı 38 ekran `vite` dev sunucusunda (main 8092, branch 8093) gezildi.
- main: 0 hata; 2 tür React Router future-flag uyarısı (`v7_startTransition`, `v7_relativeSplatPath`), 77'şer kez.
- branch: 0 hata, **0 uyarı**. React 19 / Radix `element.ref` uyarısı yok, bu yüzden D11 uygulanmadı.

Ekranlar `.verify/screens/f0-03a/{before,after,diff}/` altında (commit edilmedi). Ara koşular `after-6/`, `after-8a/`, `after-8a-r2/`, `c3/` altında. Gate düzeltmesi koşuları `.verify/screens/f0-03a-fix/` altında: koşu 1 `{before,after,diff,diff0}/`, son koşu `final/` (`l5b-final.tsv`), yeniden çekimler `rerun/`, `rerun2/`, grafik davranışı `behav-final/behav.json`.

**Grafik davranışı (REV-03, QA-02; betikle, main 8090 ↔ branch 8091, production build):**

| Kontrol | main | branch |
|---|---|---|
| `svg.recharts-surface[role=application]` (rapor + KPI) | 0 | 0 |
| "CSM başına müşteri ve açık iş" hover tooltip'i | `Deniz Uzun / Müşteri : 6 / Açık iş : 23` | aynı |
| "Gecikenler" hover tooltip'i (iki satır) | `Deniz Uzun / Adım : 9 / Aksiyon : 1`; `Mehmet Ertuğrul Elitop / Adım : 0 / Aksiyon : 1` | aynı |
| Legend sırası (3 grafik) | `Yeşil, Sarı, Kırmızı` / `Adım, Aksiyon` / `Müşteri, Açık iş` | aynı |
| 80 Tab basışında grafik içine düşen durak | 4 (pasta katmanı `tabindex=0`, recharts 2'de de var) | 4 |
| CSM grafiğine tıklama → odak çerçevesi | yok (`activeElement` = `body`) | yok (`outline: none`; `activeElement` recharts 3 `g.recharts-zIndex-layer_-100`, `tabindex=-1`) |
| Tıklama sonrası imleç ayrılınca tooltip | gizli | gizli |
| KPI grafiği hover tooltip'i / tıklayıp ayrılınca | `25.09.2026 / Değer : 40 %` (qa-verifier r2 ölçümü; builder betiği hover'ı yakalayamadı, `kpiTooltipOnHover: null`) / gizli | aynı / gizli |

`accessibilityLayer={false}` Tab odağını ve `role=application`'ı kaldırdı. Tıklamadaki çerçeve ise ayrı bir recharts 3 yapısından geliyordu: z-index katmanları `<g tabindex="-1">` (`recharts/lib/zIndex/ZIndexPortal.js:35`, prop'la kapatılamıyor). Bu katmanlara `index.css`'te `:focus { outline: none }` verildi (`a6f46d8`). Kalan fark görünmez: tıklamadan sonra odak bu katmanda kalıyor, main'de `body`'ye düşüyordu.

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Kanıt |
|---|---|---|---|
| AC1 | ✅ | Komut | `npm ls --depth=0` exit 0, invalid/missing yok; sürümler yukarıda; kaldırılan 4 paket listede yok |
| AC2 | ✅ | Komut | Eklenen adlar K4 listesinde; overrides/resolutions/.npmrc yok; `--legacy-peer-deps`/`--force` kullanılmadı |
| AC3 | ✅ | Komut | Commit'ler §2.3 sırasında; 6+7 D9 birleşimi açıklamalı; Commit tablosu yukarıda (2 ara commit'in yeniden koşusu qa-verifier'da) |
| AC4 | ✅ | Komut + L1/L3 | Temiz `npm ci` sonrası lint 0 error / 21 warning (alt küme), typecheck 0, 13 dosya / 213 test, build 0 (>500 kB uyarısı kabul) |
| AC5 | ✅ | Komut | `npm audit` 0; `--omit=dev --audit-level=high` exit 0; 14 paket "kapandı" |
| AC6 | ✅ | Diff | `tailwind.config.ts` ve `postcss.config.js` yok. `@tailwind` yok. Font import'undan sonra `@import "tailwindcss" source(none)` + `@source "./**/*.{ts,tsx}"`. `@custom-variant dark` ve `@plugin "tailwindcss-animate"` var. (a)(b)(c) var, (d) ek. `git diff main -- src/index.css`'te `:root`/`.dark` satırı değişmedi (yalnızca 3 `@tailwind` satırı silindi, gerisi ekleme). `components.json` `"config": ""` |
| AC7 | ✅ (sapma notlu) | Diff | ui/sayfa diff'i: codemod yeniden adlandırmaları, 26 router import'u, `calendar.tsx` (rdp 9), `chart.tsx` (tip + `border-(--color-border)`), `KpiChart.tsx` (tip). Plan dışı iki dokunuş: `ManagementReport.tsx` `itemSorter={null}` ve `Badges.tsx` `bg-success/12` (Açık sorular 4–5) |
| AC8 | ✅ | L3 + L6 | `grep -rn react-router-dom src package.json` boş; rota ağacı aynı, `future` son durumda yok. L3 router testleri yeşil (`ProjectDetail.tabs`, `PhaseWorkspaces`, `HandoverWorkspace.toast-router`). L6 (a–d) qa-verifier'da. (e) dev konsolunda future-flag uyarısı 0 (yukarıda) |
| AC9 | ✅ (builder kontrolü) | L5b-A + betikli L6 | `manager-reports` pasta + 2 çubuk + legend çizili, 235 px fark; KPI çizgi grafiği 2 px. Tooltip metni ve sırası iki çubuk grafiğinde main ile aynı, KPI tooltip'i iki tarafta `25.09.2026 / Değer : 40 %` (qa-verifier r2 ölçümü; builder betiği yakalayamadı, `kpiTooltipOnHover: null`) (Grafik davranışı tablosu). Plan dışı prop'lar: `itemSorter`, `accessibilityLayer` (Açık sorular 6, 10) |
| AC10 | ✅ (builder kontrolü) | L6 | 38 ekran, production ve dev'de konsol hatası 0; branch dev'de uyarı 0 |
| AC11 | ✅ | Diff | `git diff main -- src \| grep -E "^\+.*from ['\"](date-fns\|@date-fns/tz)"` boş |
| AC12 | ✅ (builder kontrolü) | L5b-A | Son koşu (`a6f46d8`): 39/39 ≤ %0,1, boyutlar eşit; eşik 0 sütunu ve nedenler tabloda |
| AC13 | — | L5b-B | qa-verifier (baseline'a gözle) |
| AC14 | ✅ (builder kontrolü) | L6 | QA-03 akışı main ve branch'te başarılı; çift eşik 0,1 ve eşik 0'da 0 px, yığın açık ek çift de 0 px |
| AC15 | ✅ | Diff | `docs/API_CONTRACT.md:315` yalnızca bu satır; commit `2cbc93e` `[REV2-01]` |
| AC16 | ✅ | Diff + komut | `eslint.config.js` ui override'ı; uyarı 28 → 21 |
| AC-NEG1 | ✅ | Diff | `git diff main...HEAD -- src/lib/rabbitqa src/lib/auth-api.ts src/lib/auth-context.tsx` boş |
| AC-NEG2 | ✅ | Diff | Yasaklı ifade yok; test değişiklikleri yalnızca import yolu ve setup'ta Vitest girişi (tablo) |
| AC-NEG3 | ✅ | Komut | `npm ls xlsx --all` → `(empty)`; `grep -ril supabase dist/` boş; `.env`'deki 3 değerin hiçbiri `dist/`'te yok (değerler yazdırılmadan kontrol edildi) |
| AC-NEG4 | ⏳ | CI | Push sonrası Murat / `gh run list` |

## Veritabanı
- [x] Migration yok

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri:
  - INV-13: date-fns kullanılmıyor.
  - INV-14: env değeri dist'te yok.
  - INV-19: domain tipi eklenmedi.
  - INV-12/25/26/27: kural kodu değişmedi (AC-NEG1).
- [x] Trigger / PL/pgSQL / RLS / motor kontrolü yok. Endpoint ve yazma işlemi yok.

## Kontroller (çıktı özeti; temiz `rm -rf node_modules && npm ci` sonrası)
Gate round 1 düzeltmeleri sonrası (`a6f46d8`; paket ve lock değişmedi, `npm ci` yeniden koşulmadı):
```
npm run lint       → ✖ 21 problems (0 errors, 21 warnings)
npm run typecheck  → exit 0
npm test           → Test Files 13 passed (13) · Tests 213 passed (213)
npm run build      → dist/assets/index-CDN67-XW.css 86.70 kB (gzip 14.29)
                     dist/assets/index-LqGeOgQ3.js 1,313.28 kB (gzip 370.05)
build CSS @layer kontrolü → 4 Sonner seçicisi ve recharts odak seçicisi bulundu, @layer derinliği 0
```
İlk build (`2cbc93e`):
```
npm ci             → added 386 packages · found 0 vulnerabilities
npm run lint       → ✖ 21 problems (0 errors, 21 warnings)
npm run typecheck  → exit 0
npm test           → Test Files 13 passed (13) · Tests 213 passed (213)
npm run build      → vite v8.3.4 · dist/assets/index-CgNYKflT.css 86.12 kB (gzip 14.17)
                     dist/assets/index-BXBNZ0Nv.js 1,313.14 kB (gzip 370.02) · >500 kB uyarısı (F9-03)
npm audit          → found 0 vulnerabilities
npm audit --omit=dev --audit-level=high → exit 0
npm run e2e        → yok (repo'da E2E yok; F0-06)
```
CSS boyutu 68,25 → 86,12 kB oldu:
- Tailwind 4 `@property`/`@layer` ve `color-mix` çıktısı ekliyor.
- Uyumluluk kuralı (d) eklendi.
- Vite 8 ile Lightning CSS minify kullanılıyor.

## Eşleme (plandaki ad → koddaki ad)
- Plan §2.3-3 "react-is (^18)": recharts commit'inde `^18.3.1` eklendi, React 19 commit'inde `^19.3.0`'a çıktı.
- Plan §2.3 commit 6 ve 7: tek commit `f20a1e4` (D9).
- Plan "`npx pixelmatch before.png after.png diff.png 0.1`": `pixelmatch` 8.0.0 kütüphanesi Node betiğiyle, `threshold 0.1`.
- Plan §2.2 "codemod ~30 ui dosyası": codemod 35 dosyaya dokundu; `PageHeader.tsx`, `ui/pagination.tsx` ve `workspaces.test.ts` geri alındı, son durumda 31 ui dosyası + `AppShell.tsx`.
- Plan §2.2 "`space-x/y-*` 171 kullanım": grep ile 172 bulundu (`space-y-*` 164, `space-x-*` 8; `sm:` dahil).

## Açık sorular / sapmalar
1. **`npm install --prefer-dedupe`:** React 19 commit'inde düz `npm install` şu sonuçları verdi:
   - `@radix-ui/react-dialog`'u (doğrudan bağımlılık) 1.1.23 → 1.2.0'a kaydırdı.
   - Radix iç paketlerini (`react-dismissable-layer`, `react-portal`, `react-focus-scope`, `react-primitive`) iki sürüm halinde 40+ iç içe kopyaya böldü.
   - Lock'a +1025 satır ekledi.

   İkiye bölünmüş DismissableLayer context'i diyalog içindeki Select/Popover'ın "dışarı tıklama" davranışını bozabilir. Bu yüzden kurulum `--prefer-dedupe` ile tekrarlandı: Radix sürümleri main'le aynı kaldı, yeni iç içe paket oluşmadı. Sonraki paket kurulumları da aynı bayrakla yapıldı. Bu bayrak `--force`/`--legacy-peer-deps` değildir; peer çakışmasını gizlemez, `npm ls` exit 0.
2. **L5b-A çekim aracı:** Plan §8.1, Playwright MCP diyor. Builder'ın kendi kontrolü için aynı Chromium ile scriptli Playwright (scratchpad, repo dışı) kullanıldı. Gerekçe: 38 ekran × 2 taraf × 4 koşu için tekrar üretilebilirlik. Kabul kanıtı plandaki gibi qa-verifier'ın MCP koşusudur.
3. **Codemod yanlış pozitifleri (geri alındı ya da düzeltildi):**
   - `workspaces.test.ts`: test başlığındaki "ring classes" metni "ring-3 classes" yapılmıştı. Test dosyası main'le aynı bırakıldı.
   - `PageHeader.tsx` ve `ui/pagination.tsx`: buton `variant` değeri `"outline"`, `"outline-solid"` yapılmıştı (typecheck hatası). İki dosya main'le aynı bırakıldı.
   - `ui/chart.tsx:186`: codemod `border-[--color-border]`'ı `border-border` yaptı. Bu tema kenarlığını kullanır ve bileşenin `style`'da verdiği yerel `--color-border`'ı yok sayar. v3 anlamının karşılığı olan `border-(--color-border)` yazıldı (plan §2.2'de bu satır "kritik" olarak işaretli).
4. **Uyumluluk kuralı (d) — `space-x/y` (plan dışı, ADR-0006 K2 kapsamında):**
   - **Neden:** Tailwind 4'te `space-y-N` boşluğu önceki kardeşe `margin-bottom` olarak veriyor. Önceki kardeş satır içiyse (`<label>`, `inline-flex` buton) bu margin etkisiz kalıyor.
   - **Etkilenen ekranlar:** login %2,08 (etiket–input arası), 00 handover %1,18 ("Kurulum tipi", "LLM tercihi" grupları), insights %0,137 ("Kaynağı göster" 1 px). Admin entegrasyonlar %2,40'ın bir kısmı da buradan geliyordu.
   - **Seçilen yol:** Plan §10.1 "fark yerelse sayfa dosyasında sınıf düzeyinde eşdeğer düzeltme" diyor. Ancak `space-y` 172 yerde kullanılıyor ve inline çocuklu her kullanım etkileniyor. Sayfa sayfa düzeltmek hem çok dosyaya dokunur hem eşdeğerliği kanıtlamak zor (`grid gap` satır kutusu yüksekliğini değiştirir). Bunun yerine v3 kuralı `index.css`'e `@utility space-y-*` / `space-x-*` ile geri getirildi:
     - `> :not([hidden]) ~ :not([hidden])` seçicisine `margin-top`/`margin-left` ve 0 karşı margin verildi.
     - Çekirdeğin `margin-*-end`'i (0,0,1) özgüllüklü `:where(...):not(tw-never)` ile sıfırlandı. Özel utility çekirdekten önce basıldığı için sıraya dayanılamadı. Bu özgüllük çocuğun kendi `mb-*` sınıfını v3'teki gibi ezmez.
   - **Sonuç:** 38 ekran 0 px (eşik 0,1).
   - **Karar:** Kabul edildi → ADR-0006 K2 (d) (Murat, 2026-10-09; gate REV-06). Kural yalnızca sayısal değerleri kapsar (`--value(number)`); `space-*-px` ve `space-*-[..]` v4 davranışını alır. `index.css` yorumu ADR'ye bağlandı.
5. **`Badges.tsx` `bg-success/12` kaldırıldı (plan dışı, görünüm koruması):**
   - v3'te `/12` opaklık ölçeğinde yok, bu yüzden sınıf **hiç CSS üretmiyordu** (main `dist` CSS'inde `.bg-success\/12` yok).
   - v4 her sayıyı kabul edip `color-mix` ile %12 yeşil zemin çiziyor. Bu fark tüm "Tamamlandı/Bağlı" rozetlerinde görünüyor; pixelmatch 0,1 eşiği açık tonların çoğunu saymıyor.
   - Kullanılan sınıfları v3 ve v4 CSS çıktısında karşılaştıran taramada fark eden tek sınıf buydu.
   - Kaldırmak v3 çıktısının birebir karşılığı. Tasarım niyeti açık yeşil zeminse ayrı bir görevde eklenmeli (mockup-freeze).
6. **`ManagementReport.tsx` `itemSorter={null}` (AC9 "yalnızca tip" ifadesinden sapma):**
   - recharts 3 legend'ı varsayılan olarak alfabetik sıralıyor: "Kırmızı Sarı Yeşil", "Açık iş Müşteri". Bu, görünür bir sıra değişikliği.
   - Plan §10.1 recharts satırı "gerekirse yalnızca prop ile eski sıraya dönülür; prop eklemek davranış değil görünüm korumasıdır" diyor; bu satıra dayanıldı.
7. **`tsconfig.app.json` `types: ["vitest/globals", "node"]`:**
   - Vitest 3'te `vitest/globals` `@types/node`'u dolaylı getiriyordu. Uygulama kodundaki `Array.prototype.at` (ES2022; `reports.ts:55`, `ContinuityTab.tsx:70`, `Phase2Tabs.tsx:42`) ve `store.test.tsx`'teki `node:fs` bu sayede tip kontrolünden geçiyordu.
   - Vitest 5 bunu yapmıyor. `"node"` açıkça eklenerek main'deki tip ortamı korundu; `lib`/`target` değişmedi.
   - Daha temiz alternatif `lib: ["ES2022", …]` olurdu; kapsam dışı (Öneriler).
8. **`vite.config.ts`/`vitest.config.ts` `__dirname` → `import.meta.dirname`:** Vite 8, `__dirname` için "native config loader'da desteklenmiyor" uyarısı veriyor. Plan "çalışmazsa" koşulu koyuyordu; çalışıyor ama uyarı verdiği için geçildi (Node 24'te mevcut).
9. **Diff boyutu:** codemod (32 dosya), lock ve silinen config hariç elle yazılan değişiklik yaklaşık 300 satır (`index.css` +164/−3, router import'ları 26+, config/tip ≈ 30, calendar +23/−19; not hariç). ≤ 400 sınırında kaldı; bölme gerekmedi.

10. **Gate round 1 düzeltmeleri (2026-10-09):**
    - **REV-01 / QA-01 — Sonner toast stili:** `ui/sonner.tsx`'e dokunulmadı (D3). `index.css`'te `@layer` dışında 4 kural: toast kökü (`background-color`, `color`, `border-color`, v3 `shadow-lg`), `[data-description]`, `[data-action]`, `[data-cancel]`. Seçiciler v3 `group-[.toaster]`/`group-[.toast]` utility'leriyle aynı (0,3,0) özgüllükte. Sonner `<style>`'ını `head` sonuna eklediği için eşitlikte v3'teki gibi Sonner kazanır (ör. action düğmesi; `description` `HandoverWorkspace.tsx:73`'te kullanılıyor (handover toast'ı); action/cancel kullanılmıyor). Katman dışı olma kontrolü: build CSS'inde 4 seçicinin `@layer` blok derinliği 0 (yeni test dosyası yazılmadı, plan §8.2; kontrol: build CSS'inde (`dist/assets/index-*.css`) bu 4 seçicinin `@layer` blok derinliği 0, yani hiçbir `@layer` bloğunun içinde değil).
    - **REV-03 / QA-03 — Tooltip sırası:** Plan §10.1 recharts satırı ("gerekirse yalnızca prop ile eski sıraya dönülür") dayanağıyla 3 `Tooltip`'e `itemSorter={() => 0}`. `null` Tooltip tipinde yok; sabit anahtar ve kararlı `sortBy` (es-toolkit) bildirim sırasını korur.
    - **QA-02 / REV-04 — Grafik klavye odağı:** Murat kararı (a): main davranışına dönüldü, `accessibilityLayer={false}`. Gerekçe: uygulama fare ile kullanım esaslı, erişilebilirlik öncelik değil (PHASES F9-04 notu). `components/ui/chart.tsx`'e dokunulmadı.
      - Prop Tab odağını kaldırdı, ama çubuk grafiğe tıklamadaki mavi çerçeve kaldı. Kaynağı recharts 3'ün z-index katmanları: `<g tabindex="-1">` (prop'la kapatılamıyor). `index.css`'te bu katmanlara `:focus { outline: none }` (`a6f46d8`). Odak yine bu katmana gidiyor ama çizilmiyor; main'de odak `body`'de kalıyordu. Görünür ya da klavye sırasını etkileyen bir fark yok (`tabindex=-1` Tab sırasına girmez).
      - Yeni test dosyası yazılmadı (plan §8.2). Mevcut L3 testleri grafik render etmiyor (jsdom'da `ResponsiveContainer` boyutsuz). Kanıt L5b-A bölümündeki betikli grafik davranışı tablosu.

## Öneriler (kapsam dışı)
- QA-03 için kalıcı L3/L4 testi (Radix Select jsdom kısıtı) → F0-06. Builder betiğindeki adımlar (Toplantıyı kaydet → taahhüt Karşılandı → kişi + not → kaydet) E2E senaryosuna doğrudan çevrilebilir.
- L5b-A betiği (Playwright + pixelmatch, 38 ekran tarifi) F0-06'da repo içi script'e çevrilebilir. Bu turdaki tarif, baseline boyutlarının çoğunu birebir üretiyor.
- `eslint-plugin-react-hooks` güncel sürüm lint farkı → F0-04 (paket yükseltilmedi).
- `tsconfig.app.json` `lib`/`target` ES2022 (`Array.at` için `@types/node`'a dayanmamak) → F0-04/F0-05.
- react-router 8 (React ≥19.2.7, Node ≥22.22) ve react-day-picker 10 (`@daypicker/react`) yayımlanmış; ileride ayrı görev.
- `index.html` `lang="en"` → F9-04 (plan §10.3 notu).
- `space-x/y` uyumluluk kuralı geçicidir. Modül bağlama sırasında ekranlar `flex/grid gap`'e taşınırsa kural kaldırılabilir.

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
| REV-01 / QA-01 (High) | Düzeltildi. `index.css`'te katmansız, (0,3,0) Sonner kuralları; iki toast çifti eşik 0'da 0 px, computed değerler main ile aynı | `79531b6` |
| REV-03 / QA-03 tooltip (Medium) | Düzeltildi. 3 `Tooltip`'e `itemSorter={() => 0}`; iki çubuk grafiğinde hover sırası main ile aynı | `33f74a3` |
| QA-02 / REV-04 (Medium / Low) | Düzeltildi (Murat kararı a). 4 grafik kökünde `accessibilityLayer={false}`; tıklama çerçevesi için recharts 3 z-index katmanlarına `outline: none`. Breaking change tablosu düzeltildi | `cf9f304`, `a6f46d8` |
| REV-02 (Medium) | Düzeltildi. L5b-A yeniden koşuldu (39 çift, eşik 0,1 + eşik 0 + ham bbox, nedenler); "Ekran ve akış davranışı" satırı güncellendi | `db255a0` |
| REV-06 (Low) | Düzeltildi. `index.css` yorumu ADR-0006 K2 (d)'ye bağlandı; Açık sorular 4'e karar yazıldı | `f573ea2` |
| REV-05 / QA-04 (Low) | Kod değişikliği yok (direktif). İlk render'da legend sırası main ile aynı; dönem değişimi qa-verifier'da tekrarlanmadı (QA-04) | — |
| QA-05 (Low) | Kod değişikliği yok. Eşik 0 farklarının nedenleri L5b-A tablosunda | `db255a0` |
| QA-06 (Low) | Kod değişikliği yok (main'de de var). Yığın hover ile açılarak ek çift çekildi: 0 px. Baseline karesi (D12) denetim işi | `db255a0` |
