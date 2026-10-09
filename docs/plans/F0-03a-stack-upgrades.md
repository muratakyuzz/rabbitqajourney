# F0-03a — Stack yükseltmeleri (tek paket yapısında)

**Durum:** Onaylandı
**Spec referansı:** Yok, teknik görev. Dayanaklar şunlar:
- `docs/adr/0001-stack.md` (Frontend satırı)
- `docs/PHASES.md` F0-03 satırı
- `docs/plans/F0-02-cleanup.md` §2.1 ve §2.4b (F0-03'e bırakılanlar) ile §14
- `docs/reviews/BACKLOG.md` (REV2-01, QA-03)
- `docs/TEST_STRATEGY.md` §1 L5b
- `docs/agents/qa-verifier.md` "Görsel karşılaştırma (L5b)"
- Önerilen ADR-0006 (bu yanıtın sonunda)

**Branch:** `chore/f0-03a-upgrades`
**Bağımlılıklar:** F0-02 ✅ (main @ 3e08fe1 / 0532605), `mockup-freeze` etiketi, ADR-0006 kabulü. §13'teki M1 adımı `/build`'den önce main'de olmalı.

---

## 0. Bölme kararı
F0-03 iki göreve bölünür. Her birinin ayrı plan dosyası, ayrı branch'i, ayrı gate'i ve ayrı M-06 karşılaştırması vardır:
- **F0-03a (bu plan):** mevcut tek paket yapısında sürüm yükseltmeleri ile F0-03'e hedeflenmiş takip maddeleri.
- **F0-03b** (`docs/plans/F0-03b-monorepo.md`): `apps/web`, boş `apps/api` ve `packages/shared` için yalnızca taşıma ve workspace kablolaması. F0-03a main'e merge edildikten sonra açılır.

Gerekçe:
1. **Görsel farkın kaynağı ayrılır.** Görsel risk neredeyse tamamen 03a'dadır (Tailwind 4, recharts 3, Vite 8 ile CSS minify). 03b bir taşımadır ve doğru yapılırsa CSS asset adı (içerik hash'i) 03a'dakiyle **birebir aynı** kalır. 03b'nin kabulü bu yüzden ucuz ve kesin olur. İki iş aynı branch'te olsaydı CSS hash'i karşılaştırma aracı olarak kullanılamazdı.
2. **Diff kuralı (≈400 satır).** Elle yazılan değişiklik 03a'da yaklaşık 250–350 satırdır; codemod çıktısı, lock ve silinen config dosyaları bu sayıya girmez (F0-02 emsali). 03b ise neredeyse tamamen `git mv`'dir. İkisi birlikte gözden geçirilemez boyuta çıkar.
3. **Geri alınabilirlik.** Görsel bir regresyon çıkarsa 03a tek başına revert edilebilir; taşıma etkilenmez.

**Neden önce yükseltme?** Yükseltme config dosyalarını değiştiriyor ya da siliyor (`tailwind.config.ts`, `postcss.config.js`, `vite.config.ts`, `vitest.config.ts`). Önce yükseltilirse taşınacak dosya sayısı azalır ve 03b saf yeniden adlandırma (R100) olarak doğrulanabilir.

Plan dosyaları ayrıdır. `/build` tek plan dosyası alıyor, `/gate` ise planı branch'teki görev kodundan buluyor; tek dosya bu akışı bozardı.

## 1. Amaç
Web paketinin bağımlılıklarını ADR-0001'deki hedef sürümlere çıkarmak:
- React 19
- react-router 7
- recharts 3
- date-fns 4 + @date-fns/tz
- Vite 8 + @vitejs/plugin-react v6
- Vitest 5
- Tailwind 4 (+ tailwind-merge 3)

Hedefler: `npm audit` 0 açık, mockup davranışı ve görünümü değişmez. Kabul, M-06 görsel referansı ve önce/sonra piksel karşılaştırmasıdır (L5b).

## 2. Kapsam

### 2.1 Mevcut sürümler (package.json aralığı / package-lock.json'daki çözümlenmiş sürüm, main @ 0532605)
| Paket | Aralık | Lock | Hedef major | Not |
|---|---|---|---|---|
| react, react-dom | ^18.3.1 | 18.3.1 | 19 | |
| @types/react / @types/react-dom | ^18.3.23 / ^18.3.7 | 18.3.31 / 18.3.7 | 19 / 19 | |
| react-router-dom (+ react-router) | ^6.30.1 | 6.30.6 | `react-router` 7; `react-router-dom` kaldırılır | |
| recharts | ^2.15.4 | 2.15.4 (lock'ta "deprecated, bump to v3" notu var) | 3 | |
| react-is (geçişli) | — | 17.0.2 (kök) | 19 (doğrudan bağımlılık, §2.3-3) | recharts 3 peer'ı |
| date-fns | ^3.6.0 | 3.6.0 | 4 | Kodda import edilmiyor |
| @date-fns/tz | — | — | 1.x (yeni) | ADR-0001 |
| react-day-picker | ^8.10.1 | 8.10.2 | 9 (**zorunlu eşlik**) | peer `date-fns ^2 \|\| ^3` → date-fns 4 ile ERESOLVE |
| next-themes | ^0.3.0 | 0.3.0 | 0.4 (**zorunlu eşlik**) | peer `react ^16.8 \|\| ^17 \|\| ^18` |
| vaul | ^0.9.9 | 0.9.9 | 1.x (**zorunlu eşlik**) | peer `react … ^18.0` |
| vite | ^5.4.19 | 5.4.21 | 8 | |
| @vitejs/plugin-react-swc | ^3.11.0 | 3.11.0 | kaldırılır → `@vitejs/plugin-react` 6 | |
| vitest | ^3.2.4 | 3.2.7 | 5 | |
| tailwindcss | ^3.4.17 | 3.4.19 | 4 + `@tailwindcss/vite` 4 | |
| tailwind-merge | ^2.6.0 | 2.6.1 | 3 (**zorunlu eşlik**, v3 yalnızca TW4) | |
| tailwindcss-animate | ^1.0.7 (dev) | 1.0.7 | aynı, `@plugin` ile (D6) | |
| postcss / autoprefixer | ^8.5.6 / ^10.4.21 | 8.5.28 / 10.6.1 | kaldırılır (TW4 Vite eklentisi + Lightning CSS) | Başka tüketen yoksa |
| jsdom | ^20.0.3 | 20.0.3 | değişmez; yalnızca Vitest 5 zorunlu kılarsa | |
| typescript, eslint ve eklentileri, sonner 1.x, lucide-react, @radix-ui/*, @tanstack/react-query | — | — | **değişmez** | Peer'leri React 19'u kabul ediyor (sonner ^19, lucide ^19.0.0-rc) |

### 2.2 Etkilenen dosyalar (denetim taraması)
- **Tailwind 4:**
  - Silinecekler: `tailwind.config.ts`, `postcss.config.js`.
  - `src/index.css`: `@tailwind` direktifleri, tema, `@layer base`.
  - `components.json`: `tailwind.config` alanı.
  - `vite.config.ts`: Tailwind eklentisi.
  - `src/components/ui/**` (codemod). Kritik olanlar:
    - `sidebar.tsx:144,159,185,189-202,278,548`: `w-[--sidebar-width]`, `theme(spacing.4)`. **AppShell bunu kullandığı için tüm uygulama ekranları etkilenir.**
    - `select.tsx:82` ve `navigation-menu.tsx:83`: `[var(--…)]`.
    - `chart.tsx:185`: `border-[--color-border]`.
    - `toast.tsx:26`: tek varsayılan palet rengi (`red-*`), oklch'ye geçer.
  - Yeniden adlandırılan utility'leri içeren yaklaşık 30 ui dosyası (`shadow-sm`, `outline-none`, `rounded-sm`, çıplak `ring`/`shadow`/`rounded`; grep: 51 eşleşme / 30 dosya).
  - `src/pages/**` ve `src/components/**`: codemod yeniden adlandırmaları. `space-x/y-*` 171 kullanım / 39 dosya; seçici değiştiği için görsel risk taşır.
  - `src/pages/project/workspaces/highlight.ts:6`: `ring-2 ring-primary ring-offset-2 rounded-md`. Testler `ring-2`'yi assert ediyor (`workspaces.test.ts:121,124`, `HandoverWorkspace.test.tsx:61`, `PhaseWorkspaces.test.tsx:57`). `ring-2` v4'te aynı kalıyor.
  - `src/lib/utils.ts`: `cn`/`twMerge`, değişiklik beklenmez.
  - `src/App.css`: hiçbir yerden import edilmiyor, dokunulmaz.
- **react-router 7:** 26 dosya (19 kaynak, 7 test):
  - `App.tsx` (`BrowserRouter`, `Routes`, `Navigate`, `Outlet`, `useLocation`), `components/AppShell.tsx`, `components/NavLink.tsx` (`NavLinkProps`)
  - `pages/`: `Admin`, `NotFound`, `ResetPassword`, `ForgotPassword`, `Login`, `CustomerReport`, `MyWork`, `Overview`, `Insights`, `ManagementReport`, `Projects`, `ProjectDetail`
  - `pages/project/`: `MeetingDialog`, `IntegrationsTab`, `workspaces/HandoverWorkspace`
  - `components/rq/InsightCard`
  - Testler: `ProjectDetail.tabs.test`, `Projects.test`, `MyWork.test`, `InsightCard.test`, `Phase3Tabs.RiskDialog.test`, `PhaseWorkspaces.test`, `HandoverWorkspace.test`
  - Splat rota yalnızca `App.tsx:59` (`path="*"` → `NotFound`). `NotFound` göreli link kullanmıyor, dolayısıyla `v7_relativeSplatPath` etkisizdir.
- **recharts 3:**
  - `src/components/rq/KpiChart.tsx`: `Tooltip formatter={(v: number) => …}` → v3 `Formatter` tipi; `ReferenceLine` + `Line` z-sırası.
  - `src/pages/ManagementReport.tsx:115-135`: `PieChart`/`Pie`/`Cell`, yatay ve dikey `BarChart`, `Legend`, `Tooltip`.
  - `src/components/ui/chart.tsx`: shadcn, kullanılmıyor; yalnızca tipler.
- **date-fns 4 / react-day-picker 9:** `date-fns` hiçbir yerde import edilmiyor. `react-day-picker` yalnızca `src/components/ui/calendar.tsx`'te (kullanılmıyor).
- **React 19:** `src/main.tsx` (zaten `createRoot`, StrictMode yok). `next-themes` → `components/ui/sonner.tsx`, `vaul` → `components/ui/drawer.tsx` (kullanılmıyor). Grep sonucu: `useRef()` argümansız, global `JSX.`, `defaultProps`, `propTypes`, `react-dom/test-utils`, `ReactDOM.render`, `findDOMNode` **yok**. `forwardRef` 41 dosyada var ve React 19'da çalışıyor.
- **Vite 8 / plugin-react v6:** `vite.config.ts` (`@vitejs/plugin-react-swc`, `__dirname`, `resolve.alias`, `dedupe`), `vitest.config.ts` (aynı eklenti), `tsconfig.node.json` (yalnızca `vite.config.ts`'i içeriyor).
- **Vitest 5:** `vitest.config.ts`, `src/test/setup.ts`, sahte saat kullanan testler (`completion.test.ts`, `ProjectDetail.tabs.test.tsx`, `workspaces.test.ts`).
- **Takip maddeleri:** `docs/API_CONTRACT.md:315` (REV2-01), `eslint.config.js` (ui override).

### 2.3 Yükseltme sırası, breaking change listesi ve doğrulama
Kurallar:
- Her madde **ayrı commit**tir. Her commit'ten sonra `npm run lint && npm run typecheck && npm test && npm run build` çalıştırılır ve sonuç değişiklik notundaki "Commit tablosu"na yazılır.
- Peer'i zorunlu kılan eşlik paketleri aynı commit'e girer.
- **Vite 8 ile Vitest 5 tek başına yeşil olamıyorsa** (Vitest 3'ün Vite 8 ile uyumsuzluğu) 6 ve 7 birleştirilir ve gerekçesi not edilir (D9).

**Uyarı (planner):**
- Planner'ın sürüm bilgisi Vitest 4, Vite 7 ve plugin-react v5'e kadar kesindir.
- **Vite 8, plugin-react v6 ve Vitest 5'e özgü maddeleri** builder ön ölçümde resmi migration rehberlerinden çıkarır: vite.dev/guide/migration, vitest.dev/guide/migration, plugin-react CHANGELOG.
- Her maddeyi "Breaking change kontrol listesi"ne yazar: madde, etkiliyor/etkilemiyor, kanıt (grep ya da dosya:satır).
- Aynı liste Tailwind, router, recharts, React ve react-day-picker rehberleri için de doldurulur.

| # | Commit | Paketler | Breaking change'ler (bu koda göre) | Etkilenen dosyalar | Görsel risk |
|---|---|---|---|---|---|
| 1 | `chore(deps): upgrade react-day-picker to v9` | react-day-picker 9 | classNames anahtarları yeniden adlandırıldı (`caption`→`month_caption`, `nav_button_*`→`button_previous/next`, `head_cell`→`weekday`, `cell`/`day`→`day`/`day_button`, `day_selected`→`selected`…). `components.IconLeft/IconRight`→`Chevron`. `initialFocus`→`autoFocus`. date-fns kendi bağımlılığı oldu | `components/ui/calendar.tsx` (kullanılmıyor; D3 istisnası) | Yok |
| 2 | `chore(deps): upgrade date-fns to v4, add @date-fns/tz` | date-fns 4, @date-fns/tz | Tipler değişti, saat dilimi `in`/`TZDate` geldi. Kodda import yok | Yok (yalnızca package.json/lock) | Yok |
| 3 | `chore(deps): upgrade recharts to v3` | recharts 3, react-is (^18, React sürümüyle eşleşir) | Durum yönetimi yeniden yazıldı. `CategoricalChartState`/`Customized` prop'ları, `activeIndex` kalktı (kullanılmıyor). `accessibilityLayer` varsayılan `true`. Tooltip/Legend tipleri değişti (`TooltipProps`→`TooltipContentProps`, `payload` public prop değil). SVG katman (z) sırası değişti. Animasyon motoru değişti (react-smooth kalktı). `react-is` peer oldu: React sürümüyle aynı major olmalı, yoksa çocuk öğe tespiti bozulur ve grafik boş çizilir | `KpiChart.tsx` (formatter tipi), `ManagementReport.tsx` (tip gerekirse), `ui/chart.tsx` (tip) | **Orta**: `manager-reports.png`, KPI grafiği |
| 4 | `chore(deps): upgrade React to 19` | react, react-dom 19, @types/react(-dom) 19, react-is 19, next-themes 0.4, vaul 1.x | `element.ref` kalktı (eski Radix uyarı verir). `useRef` argüman ister (tip). Global `JSX` kalktı (tip). Fonksiyon bileşende `defaultProps`/`propTypes` yok. `react-dom/test-utils` kalktı. Hata raporlama değişti (`onUncaughtError`). `React.ElementRef` deprecated ama mevcut. Bunların hiçbiri kodda yok (grep); etki tip düzeyinde beklenir | Tip düzeltmesi gerekirse yalnızca tip (AC-NEG2) | Düşük |
| 5a | `refactor(router): opt into v7 future flags` | — | `BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`. Davranış değişimi paket değişiminden ayrılır | `App.tsx` | Düşük |
| 5b | `chore(deps): migrate react-router-dom 6 to react-router 7` | react-router 7; react-router-dom kaldırılır | Paketler birleşti (`react-router-dom` → `react-router`). Future flag'ler varsayılan oldu, `future` prop'u silinir. `json`/`defer` kalktı (kullanılmıyor). Node ≥20, React ≥18. `startTransition` nedeniyle testlerde `getBy` → `findBy` gerekebilir | §2.2'deki 26 dosya (yalnızca import satırı), `App.tsx` | Düşük |
| 6 | `chore(deps): upgrade Vite to 8 and @vitejs/plugin-react to v6` | vite 8, @vitejs/plugin-react 6; plugin-react-swc kaldırılır | Rolldown + Oxc. `build.rollupOptions`→`rolldownOptions`, `esbuild`→`oxc`, `optimizeDeps.esbuildOptions` (hiçbiri kullanılmıyor). CSS minify Lightning CSS. Node ≥20.19/22.12. Varsayılan build target `baseline-widely-available`. ESM config'te `__dirname` desteği doğrulanır; yoksa `import.meta.dirname`. plugin-react v6'da Babel yok (kullanılmıyor) | `vite.config.ts`, `vitest.config.ts` (eklenti importu), `tsconfig.node.json` (`include`'a `vitest.config.ts`) | Düşük–orta (CSS minify) |
| 7 | `chore(deps): upgrade Vitest to 5` | vitest 5 (+ yalnızca gerekirse jsdom) | v4: `workspace`→`projects`, `poolOptions` düzleşti, `environmentMatchGlobs`/`basic` reporter kalktı, `vi.fn`/`restoreAllMocks` semantiği değişti, coverage değişti. v5 maddeleri rehberden. `globals: true` + `vitest/globals` tipleri korunur | `vitest.config.ts`, gerekirse `src/test/setup.ts` | Yok |
| 8a | `chore(deps): upgrade Tailwind CSS to v4` | tailwindcss 4, @tailwindcss/vite 4; postcss/autoprefixer kaldırılır | Ayrıntı §2.4 | §2.2 Tailwind listesi | **Yüksek** |
| 8b | `chore(deps): upgrade tailwind-merge to v3` | tailwind-merge 3 | Yalnızca TW4 sınıflarını tanır. `extendTailwindMerge` tema anahtarları değişti (kullanılmıyor) | Yok (`cn` aynı) | Düşük |
| 9 | `chore(lint): disable react-refresh/only-export-components for components/ui` | — | F0-02 §14 önerisi (a) | `eslint.config.js` | Yok |
| 10 | `docs(api): note support_track removal in v1.3 history [REV2-01]` | — | — | `docs/API_CONTRACT.md:315` | Yok |

**Neden bu sıra?**
- Önce görsel riski sıfır olanlar (1–2).
- recharts 3, React 19'dan **önce** gelir. recharts 2 ile React 19'un ara commit'te `react-is` uyuşmazlığı yüzünden boş grafik üretmesi önlenir, ve recharts 3 React 18'i destekliyor.
- Router'ın davranış etkisi bayrak commit'iyle izole edilir.
- Vite 8, Tailwind'den önce gelir: Lightning CSS minify farkı Tailwind farkından ayrı ölçülür.
- Tailwind son gelir, görsel farkı en net atfedilebilir yerde.

### 2.4 Tailwind 4 geçişi (ADR-0006 K2)
1. `npx @tailwindcss/upgrade` temiz çalışma ağacında çalıştırılır. Çıktısı (değişen dosya listesi ve yeniden adlandırma türleri) değişiklik notuna yazılır. Codemod'un yaptığı sınıf yeniden adlandırmaları: `shadow-sm`→`shadow-xs`, `shadow`→`shadow-sm`, `rounded-sm`→`rounded-xs`, `rounded`→`rounded-sm`, `outline-none`→`outline-hidden`, `ring`→`ring-3`, `blur`→`blur-sm`, `w-[--x]`→`w-(--x)`, `theme(spacing.4)`→`--spacing(4)`/`calc(var(--spacing)*4)`. ui ve sayfa dosyalarına yalnızca bu tür mekanik değişiklikler girer (D3).
2. **Hedef: CSS-first.** `tailwind.config.ts` silinir; `@config` uyumluluk yolu kullanılmaz. Codemod config'i dönüştüremezse builder durur ve sorar.
3. `src/index.css`:
   - İlk satır Google Fonts `@import url(...)` olarak kalır, ardından `@import "tailwindcss"` gelir.
   - **Kaynak taraması v3 `content`'e eşdeğer olur.** Yalnızca `src/**/*.{ts,tsx}` taranır (ör. `@import "tailwindcss" source(none);` + `@source "./**/*.{ts,tsx}";` ya da eşdeğeri). Gerekçe: v4'ün otomatik taraması repo kökünden `docs/`, `.claude/` gibi yerleri de tarar. Docs'taki sınıf benzeri metinler CSS üretir ve F0-03b'de cwd değişince CSS de değişir.
   - `:root` ve `.dark` bloklarındaki HSL bileşen değişkenleri (`--primary: 246 86% 53%` …) **byte-byte aynı kalır**. Gerekçe: 20 satır içi `hsl(var(--x))` kullanımı var (`ManagementReport.tsx` 9, `KpiChart.tsx` 6, `AppShell.tsx` 2, `ui/sidebar.tsx` 2, `index.css` 1). oklch'ye ya da `hsl()` sarmalına çevirmek bunları bozar.
   - Renk, radius, font, keyframe, animation ve boxShadow token'ları `@theme inline` ile tanımlanır (`--color-primary: hsl(var(--primary));` …).
   - `darkMode: ["class"]` → `@custom-variant dark (&:is(.dark *));`.
   - `container` sınıfı kodda kullanılmıyor (grep 0); codemod'un ürettiği `@utility container` kalabilir ya da silinebilir.
   - `tailwindcss-animate` → `@plugin "tailwindcss-animate";` (D6).
   - **v3 görünümünü koruyan uyumluluk kuralları** (`@layer base`):
     - (a) Varsayılan kenarlık rengi bloğu (codemod üretir; `* { @apply border-border }` zaten var).
     - (b) `input::placeholder, textarea::placeholder { color: <v3 gray-400 #9ca3af>; }`.
     - (c) `button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer; }`. v4 butonlarda `default` imleç kullanır; bu bir UX farkıdır ve mockup-freeze gereği korunur.
   - Sonner yerleşim bloğu (`[data-sonner-toaster]`) aynen kalır.
4. `vite.config.ts`: `plugins: [react(), tailwindcss()]`. `@tailwindcss/vite` peer'i Vite 8'i kabul etmiyorsa `@tailwindcss/postcss` + `postcss.config.js` kullanılır; değişiklik notuna yazılır (D7).
5. `components.json`: `"tailwind": { "config": "" … }`. Diğer alanlar aynı kalır; shadcn CLI ile yeniden üretim **yapılmaz**.
6. Bilinen v4 farkları ve bu koddaki durumları:

| v4 farkı | Bu koddaki durum |
|---|---|
| `space-x/y` seçicisi değişti | 171 kullanım; piksel karşılaştırması gösterecek |
| `hover:` yalnızca hover destekleyen cihazda | Ekran görüntüsünü etkilemez |
| `[hidden]` önceliği | `sidebar.tsx:471` tooltip, sorun beklenmez |
| Varyant yığılma sırası soldan sağa | Codemod düzeltir |
| `transform` yerine `translate`/`scale` ayrı property | Diyalog animasyon ara karesi değişir, durağan kare aynı kalır |
| Varsayılan palet oklch | Yalnızca `toast.tsx` |
| Tarayıcı tabanı Safari 16.4+ / Chrome 111+ / Firefox 128+ | İç ekip için kabul (ADR-0006) |

### 2.5 F0-03'e hedeflenmiş takip maddeleri (tek tek)
| Kaynak | Madde | Bu planda |
|---|---|---|
| BACKLOG `chore/f0-02-cleanup` round 2 → "F0-03 (Murat, 2026-10-09)" | **REV2-01**: API_CONTRACT v1.3 geçmiş satırı `support_track` kaldırmasını (RUL-01, d419000) anmıyor | Commit 10 / AC15 |
| BACKLOG round 1 QA-03 (hedef F0-04 L5b → Murat'ın talimatıyla F0-03) | **QA-03**: Go-Live "Müşteri onayı kaydedildi" başarı toast'ı ekranda doğrulanmadı | AC14 (03a ve 03b gate'lerinde) |
| F0-02 plan §2.1, §2.4b, D6 | Majörler (vite 8, tailwind 4, react-router 7), vitest 5 (+ `@vitest/*`, tinypool), plugin-react-swc → plugin-react v6, React 19, recharts 3, date-fns 4 | §2.3 |
| F0-02 §2.4b / değişiklik notu :290 | Kalan 14 audit açığı: `@vitest/mocker`, `braces`, `chokidar`, `esbuild`, `fast-glob`, `micromatch`, `postcss-nested`, `postcss-selector-parser`, `react-router`, `react-router-dom`, `tailwindcss`, `tinypool`, `vite`, `vitest` | AC5 |
| F0-02 §14 (a) / değişiklik notu :315 | `react-refresh/only-export-components` için `src/components/ui/**` override'ı | Commit 9 / AC16 |
| F0-02 §14 "F0-03 notu" | `eslint-plugin-react-hooks` güncel sürüm lint farkı | **Kapsam dışı** (paket yükseltilmiyor). Öneri olarak yazılır, F0-04'te değerlendirilir |
| F0-02 D4 | "F0-03'te shadcn bileşenleri yeniden üretilebilir" | **Yapılmaz** (görsel risk). Yalnızca codemod ve zorunlu uyarlama yapılır (D3) |
| F0-02 §2.1 / değişiklik notu :317 | `package.json` `name` + `engines` | **F0-03b** (workspace kökü) |
| F0-02 D1 | Code-split (`manualChunks`) | **F9-03**, kapsam dışı |
| F0-02 M7 (yapılmamış) | PHASES F0-03 satırına vitest 5 eklenmesi; ADR-0001 "Takip: F0-02" → F0-03 | §13 M1 (denetim) |

### Kapsam dışı
- Monorepo taşıması, `name`/`engines`, `@types/node` 24 (F0-03b).
- Code-split (F9-03). `exhaustive-deps` uyarıları (F0-04). `eslint-plugin-react-hooks`, TypeScript, sonner 2, lucide, Radix majörleri.
- shadcn bileşenlerinin CLI ile yeniden üretilmesi. Kullanılmayan ui bileşenlerinin silinmesi (D8).
- `.github/workflows/ci.yml` (Murat). `docs/TEST_STRATEGY.md`, AGENTS/kit metinleri (§13, denetim).
- `@playwright/test` ve repo içi görsel karşılaştırma script'i (F0-06).
- Ekran, akış, store ya da kural davranışı değişikliği (`mockup-freeze`).

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: yok.

`pg-only` gereksinimi: yok.

## 4. API etkisi
Endpoint yok. Yalnızca `docs/API_CONTRACT.md:315` v1.3 geçmiş satırının sonuna şu metin eklenir: "; #29/§2.2 `support_track` no-op kuralı kaldırıldı (RUL-01, d419000)" (REV2-01). Yeni sürüm açılmaz.

## 5. Yetki etkisi (RBAC)
| Rol | İzin | Not |
|---|---|---|
| csm | değişmez | — |
| devops | değişmez | — |
| care | değişmez | — |
| manager | değişmez | — |
| admin | değişmez | — |

## 6. UI etkisi
- **Ekranlar ve bileşenler:** görsel ve davranış değişikliği **yok** (hedef). Dokunuş yalnızca mekanik (codemod, import) ve tip düzeyindedir.
- **Görsel risk haritası** (M-06 baseline adlarıyla):

| Risk | Ekranlar | Kaynak |
|---|---|---|
| Yüksek | Tüm `/app/*` ekranları | `ui/sidebar` arbitrary var + `theme()` |
| Yüksek | `csm-phase6-riskdialog-*`, `manager-new-project-dialog`, `csm-insights-step-update-edit-dialog-status-open` | Diyalog, `select` |
| Yüksek | `care-project-detail-mobile-390` | Sheet |
| Yüksek | `login` | Input placeholder |
| Orta | `manager-reports` | recharts: pie, iki bar, legend |
| Orta | `csm-tab-discovery-teams` | KPI grafiği |
| Orta | `csm-phase6-riskdialog-reason-error-toast` | Sonner group varyantları |

- **Boş, yükleniyor ve hata durumları:** değişmez.

## 7. Kabul kriterleri

**Ön ölçüm (zorunlu, ilk iş).** Builder branch'i açmadan önce main @ `<sha>` üzerinde aşağıdakileri ölçer ve değişiklik notuna "Ölçüm — main" başlığıyla yazar:
- `npm ls --depth=0`
- Lint özeti ve 28 uyarının `dosya:satır:kural` listesi
- `npm run typecheck`
- `npm test` (13 dosya / 213 test bekleniyor)
- `npm run build` asset adları ve boyutları (CSS `index-CjfMyXEl.css` 68,25 kB; JS 1.223,99 kB)
- `npm audit` (tam) ve `npm audit --omit=dev` özetleri
- "Önce" ekran seti (§8.1 yöntemi, `.verify/screens/f0-03a/before/`, commit edilmez)

**A — Paketler ve commit düzeni**
- **AC1** — Given branch HEAD, When `npm ls --depth=0` çalıştırılır, Then:
  - Çıkış 0'dır; `invalid`, `missing` ya da `ERESOLVE` yoktur.
  - Majörler §2.1'in "Hedef" sütunundaki gibidir. Hedef major npm'de stabil olarak yayımlanmamışsa (ön ölçümdeki `npm view <paket> versions` çıktısı) paket en son stabil major'dadır ve sapma değişiklik notunun "Açık sorular / sapmalar" bölümündedir (Murat cevapları, ek kural).
  - `react-router-dom`, `@vitejs/plugin-react-swc`, `autoprefixer` ve `postcss` (doğrudan bağımlılık olarak) listede yoktur.
  - Çözümlenen tam sürümler değişiklik notundadır.
- **AC2** — Given `git diff main -- package.json`, Then:
  - Eklenen bağımlılık adları yalnızca ADR-0006 K4 izin listesindendir: `react-router`, `@date-fns/tz`, `@vitejs/plugin-react`, `@tailwindcss/vite` (ya da D7 yolunda `@tailwindcss/postcss`), `react-is` ve gerekiyorsa `jsdom`.
  - `overrides`/`resolutions` yoktur, repoda `.npmrc` yoktur.
  - Değişiklik notunda `--legacy-peer-deps` / `--force` kullanılmadığı beyan edilir.
- **AC3** — Given `git log main..HEAD`, Then:
  - Commit'ler §2.3'teki sıradadır, her yükseltme ayrı commit'tir (D9 birleşimi açıklamalı).
  - Değişiklik notunda "Commit tablosu" vardır: sha → paketler → lint / typecheck / test (dosya/test) / build (CSS ve JS boyutu).
  - qa-verifier rastgele 2 ara commit'i ayrı worktree'de `npm ci && npm run typecheck && npm test && npm run build` ile yeniden koşar ve sonuç tablodakiyle aynıdır.

**B — Kalite kapıları**
- **AC4** — When temiz klonda `npm ci && npm run lint && npm run typecheck && npm test && npm run build` çalıştırılır, Then:
  - Hepsi 0 ile çıkar.
  - Lint 0 error verir. Uyarılar main listesinin alt kümesidir: yeni `kural:dosya` çifti yoktur, AC16 sonrası azalma beklenir.
  - Testler ≥ 213, dosya sayısı 13'tür.
  - Build boyutları önce/sonra tablosundadır; >500 kB uyarısı kabul edilir (F9-03).
- **AC5** — When `npm audit` çalıştırılır, Then `found 0 vulnerabilities` görülür (**tam denetim hedefi**). Ayrıca:
  - `npm audit --omit=dev --audit-level=high` 0 ile çıkar (CI adımı).
  - Önce/sonra tablosunda F0-02'den kalan 14 paketin her biri "kapandı" olarak görünür.
  - Yeni yayımlanmış ve düzeltmesi olmayan bir açık kalırsa: paket, severity, yol ve düzeltme durumu satır satır "Açık sorular"a yazılır; kabul Murat'ındır (D10).

**C — Paket bazlı doğrulama**
- **AC6 (Tailwind)** — Given branch, Then şunların hepsi sağlanır:
  - `tailwind.config.ts` ve `postcss.config.js` yoktur (D7 yolunda yalnızca `@tailwindcss/postcss`'li `postcss.config.js` olabilir).
  - `src/index.css`'te `@tailwind` direktifi yoktur. Font importundan sonra `@import "tailwindcss"` vardır.
  - Kaynak taraması `src`'ye sınırlıdır (§2.4-3).
  - `@custom-variant dark` ve `@plugin "tailwindcss-animate"` vardır.
  - §2.4-3'teki uyumluluk kuralları (a), (b), (c) vardır.
  - `git diff main -- src/index.css` içinde `:root { … }` ve `.dark { … }` değişken satırları değişmemiştir.
  - `components.json` `tailwind.config` alanı `""` olur.
- **AC7 (codemod sınırı)** — Given `git diff main -- src/components/ui src/pages src/components`, Then:
  - Değişiklikler yalnızca className dizgilerindeki codemod yeniden adlandırmaları, router import satırları ve D3 izin listesindeki dosyalardır (`calendar.tsx` rdp 9 uyarlaması, `chart.tsx` ve recharts kullanan dosyalarda yalnızca tip).
  - Değişiklik notunda yeniden adlandırma türü → sayı tablosu ve codemod komut çıktısı vardır.
- **AC8 (router)** — Given branch, Then:
  - `grep -rn "react-router-dom" src package.json` boştur.
  - `App.tsx` rota ağacı main'le aynıdır; diff yalnızca import satırı ve ara commit'teki `future` prop'udur, `future` son durumda yoktur.
  - L6 kontrolleri:
    - (a) Oturumsuz `/app/projects` → `/login`.
    - (b) Giriş → `/app/overview`.
    - (c) `/olmayan-yol` → NotFound.
    - (d) `ProjectDetail` `?tab=golive` ve `?ws=00` ile doğru sekme/paneli açar.
    - (e) Konsolda React Router future-flag uyarısı yoktur (F0-02 QA'da 2 uyarı vardı).
- **AC9 (recharts)** — Given `manager` ile `/app/reports` ve KPI ölçümü olan bir projenin Keşif sekmesi, Then:
  - Pasta, iki çubuk grafiği ve çizgi grafiği veriyle çizilir; boş SVG yoktur.
  - KPI tooltip metni `"<değer> <birim>"` / `"Değer"` biçimindedir.
  - Grafik dosyalarındaki diff yalnızca tip düzeyindedir (AC-NEG2).
- **AC10 (React 19)** — Given 37 baseline ekranının gezilmesi, When `browser_console_messages(level=error)` okunur, Then:
  - Error sayısı 0'dır.
  - Uyarılar "önce" turuyla karşılaştırılır; yeni uyarı (ör. Radix `element.ref`) listelenir ve D11'e göre ele alınır.
- **AC11 (date-fns / INV-13)** — Given branch, Then `git diff main -- src | grep -E "^\+.*from ['\"](date-fns|@date-fns/tz)"` boştur. İş günü ya da tarih hesabına yeni kütüphane girişi yoktur.

**D — Görsel kabul (L5b, §8.1)**
- **AC12 (L5b-A, önce/sonra piksel)** — Given main @ `<baz sha>` ve branch HEAD'in production build'i (`vite preview`), aynı makine, aynı oturum, aynı viewport, aynı rol ve aynı seed ile çekilmiş 37 ekran çifti (+ AC14 çifti), When her çifte pixelmatch (piksel eşiği 0,1, anti-alias hariç) uygulanır, Then:
  - Her çiftte görüntü boyutları eşittir.
  - Farklı piksel oranı **≤ %0,1**'dir.
  - Sıfırdan büyük her fark `diff.png` ile incelenmiş ve nedeni (font AA, saat metni) yazılmıştır.
  - Eşiği aşan ya da boyutu farklı çift **FAIL**'dir. FAIL ancak Murat'ın görüntü çiftiyle açıkça kabul ettiği fark listesinde yer alırsa geçer (D4).
- **AC13 (L5b-B, M-06 baseline)** — Given `docs/reviews/M-06/baseline/` altındaki 37 PNG, When aynı ekranlar baseline boyutlarında çekilip yan yana incelenir, Then yerleşim, boşluk, renk, tipografi, ikon, kenarlık, gölge ve radius farkı yoktur. Kabul edilen tek fark tarih/saat kaynaklı metin ve tarihe bağlı sayılardır (ör. "10 açık uyarı" / 9). Tablo: ekran → sonuç → fark açıklaması.
- **AC14 (QA-03)** — Given csm (Deniz Uzun), `p_isyatirim` → Go-Live sekmesi, When qa-verifier şu adımları uygular, Then:
  - Adımlar:
    - (1) "Toplantıyı kaydet" (Go/No-Go; `rules.ts:235` gonogo'yu `done` yapar).
    - (2) Açık taahhüt varsa 00 Satış Devri panelinden "Karşılandı" olarak işaretler.
    - (3) Kişi seçer, onay notu yazar.
    - (4) "Müşteri onayını kaydet"e basar.
  - Sonuç:
    - Toast "Müşteri onayı kaydedildi" görünür.
    - Kontrol listesinde "Müşteri onayı" "Tamamlandı" olur.
    - "Onaylayan: …" satırı görünür.
    - Konsolda hata yoktur.
  - Aynı adımlar "önce" (main) ortamında da yapılır ve çift AC12 yöntemiyle karşılaştırılır.

**E — Takip maddeleri**
- **AC15 (REV2-01)** — Given `docs/API_CONTRACT.md`, Then:
  - :315 v1.3 satırı "#29/§2.2 `support_track` no-op kuralı kaldırıldı (RUL-01, d419000)" ifadesini içerir.
  - `git diff main -- docs/API_CONTRACT.md` yalnızca bu satırı değiştirir.
  - Commit mesajında `[REV2-01]` vardır.
- **AC16** — Given `eslint.config.js`, Then `src/components/ui/**` override'ı `react-refresh/only-export-components: "off"` içerir. Lint uyarısı sayısı main'e göre azalır; yeni sayı ve liste nottadır.

**F — Negatif**
- **AC-NEG1 (mockup-freeze)** — `git diff main...HEAD -- src/lib/rabbitqa src/lib/auth-api.ts src/lib/auth-context.tsx` **boştur**. Kural, akış, uyarı, rapor, iş günü, perm ve store kodu değişmez. Tip uyumu için zorunlu bir değişiklik çıkarsa builder durur ve sorar; değişiklik kabul edilirse rules-reviewer zorunlu olur (§11).
- **AC-NEG2** — Diff'te yeni `@ts-ignore`, `@ts-expect-error`, `eslint-disable` ya da `as any` yoktur. Test silinmez; `.skip`/`.only`/`.todo` eklenmez. Test değişiklikleri yalnızca şu türlerdendir: import yolu, senkron sorgu → `findBy`/`waitFor`, Vitest API yeniden adlandırması. Assertion beklenen değerleri değişmez; değişiklik notunda test dosyası → değişiklik türü tablosu vardır. Tip düzeltmeleri çalışma zamanı ifadesi eklemez (F0-02 AC-NEG2 kuralı).
- **AC-NEG3** — `npm ls xlsx --all` boştur (CI "Forbidden packages"). `grep -ri supabase dist/` boştur (INV-14). `dist/` içinde `.env` değeri yoktur.
- **AC-NEG4** — Branch HEAD'de CI `app` ve `secrets` yeşildir (Murat ya da `gh run list` ile doğrulanır).

## 8. Test planı (seviyeler: docs/TEST_STRATEGY.md)

### 8.1 L5b yöntemi (ADR-0006 K5)
**Repo'daki durum:**
- Baseline `docs/reviews/M-06/baseline/` altında 37 PNG'dir. 2026-10-06'da Playwright MCP ile, demo seed'i ve 5 rolle çekilmiştir (`docs/reviews/M-06-qa-regression.md`).
- Repo'da tanımlı bir piksel eşiği ya da diff aracı **yoktur**. F0-02 karşılaştırması gözle yapıldı: "piksel diff aracı kullanılmadı" (`chore_f0-02-cleanup/qa-verifier.md:128`).
- Uygulama gerçek saati kullanıyor (`todayISO()`), dolayısıyla baseline'a karşı piksel eşitliği mümkün değil.

**Bu yüzden kabul iki katmandır:**

**A — Önce/sonra piksel karşılaştırması (nesnel):**
- Ortam:
  - İki worktree: baz commit (main) ve branch.
  - Her birinde `npm ci && npm run build && npx vite preview --host 127.0.0.1 --port <8090|8091> --strictPort`.
  - Playwright MCP (Chromium, `--isolated`, temiz localStorage = seed). Viewport baseline PNG'nin boyutundan okunur (`sips -g pixelWidth -g pixelHeight`); mobil ekran 390 genişliktir.
- Çekim kuralları:
  - Her ekran için "önce" ve "sonra" art arda çekilir; saat kaynaklı farkı en aza indirmek için çiftler aynı oturumda ve aynı gün çekilir.
  - Çekimden önce beklenecekler: hedef metin `browser_wait_for` ile görünmeli, `document.fonts.ready` tamamlanmalı, diyalog açık durumda olmalı, grafik ekranlarında animasyon sonu gelmeli. Elle çekimde süre beklemesi serbesttir; E2E testlerindeki `waitForTimeout` yasağı burada geçerli değildir.
- Ekranlar `.verify/screens/<görev>/{before,after}/<baseline-adı>.png` altına kaydedilir.
- Karşılaştırma: `npx -y pixelmatch before.png after.png diff.png 0.1`. Çıktıdaki "different pixels" sayısı toplam piksele bölünür. Eşdeğer bir araç kullanılırsa adı ve parametreleri rapora yazılır.
- **Eşik:** çift başına ≤ %0,1 ve boyutlar eşit.

**B — M-06 baseline'a karşı görsel inceleme:** 37 PNG yan yana incelenir. İzinli fark yalnızca tarih/saat kaynaklıdır (AC13).

Builder AC12 setini kendi kontrolü olarak 6. commit'ten (Vite) sonra, 8a'dan (Tailwind) sonra ve en sonda koşar; tabloyu değişiklik notuna yazar. Kabul kanıtı qa-verifier'ın bağımsız koşusudur. Saklanacak çiftleri gate `docs/reviews/<branch>/screens/` altına kopyalar.

### 8.2 AC ↔ seviye
| AC | Seviye | Doğrulama |
|---|---|---|
| AC1, AC2, AC5, AC-NEG3 | Komut kontrolü (qa-verifier yeniden koşar) | `npm ls`, `git diff package.json`, `npm audit`, `npm ls xlsx`, `grep dist` |
| AC3 | Komut kontrolü + 2 ara commit worktree koşusu | Commit tablosu |
| AC4 | Komut kontrolü; mevcut L1/L3 seti (13 dosya, ≥ 213 test) regresyon ağı | `npm run lint/typecheck/test/build` |
| AC6, AC7, AC11, AC15, AC16, AC-NEG1, AC-NEG2 | Diff/grep kontrolü (reviewer) | `git diff`, grep |
| AC8 | Mevcut L3 router testleri (`ProjectDetail.tabs.test.tsx` `?tab=`, `PhaseWorkspaces.test.tsx` `?ws=`, `HandoverWorkspace.toast-router.test.tsx`) + L6 (a–e) | — |
| AC9, AC10, AC14 | L6 (qa-verifier, Playwright MCP) | `docs/reviews/chore_f0-03a-upgrades/screens/` |
| AC12 | L5b-A | pixelmatch tablosu |
| AC13 | L5b-B | Baseline tablosu |
| AC-NEG4 | CI | `gh run list` / Murat |

Yeni test dosyası yazılmaz. Bu görevin kanıtı mevcut setin yükseltme sonrası da yeşil olması ve L5b'dir. QA-03 için kalıcı bir L3 testi önerilir ama kapsam dışıdır: Radix Select jsdom kısıtı nedeniyle F0-06'ya bırakılır (Öneriler).

## 9. İlgili invariant maddeleri
- **INV-13**: date-fns 4 / @date-fns/tz eklenir ama `src`'de kullanılmaz (AC11). İş günü hesabının tek kaynağı F6-01'de `packages/shared` olur.
- **INV-14**: Build çıktısında secret yoktur. Vite 8 env davranışı (`VITE_` öneki) aynı kalır (AC-NEG3).
- **INV-19**: İkinci tip kaynağı eklenmez. recharts ve React tip düzeltmeleri domain tipi üretmez.
- **INV-25 / 26 / 27 / 12**: Kural ve rapor kodu dokunulmaz (AC-NEG1).
- **INV-20**: Etkisi yoktur (modül bağlanmıyor).

## 10. Riskler ve açık sorular

### 10.1 Riskler
| Risk | Etki | Azaltma |
|---|---|---|
| Tailwind 4 `space-*` seçici farkı, preflight farkları | Piksel farkı | AC12 eşiği. Fark yerelse codemod sonrası sınıf düzeyinde eşdeğer düzeltme yapılır (ui dosyasında değil, sayfa dosyasında); düzeltilemezse D4 |
| `ui/sidebar` arbitrary var dönüşümü | Tüm ekranlarda yerleşim kırılması | Codemod. AC12'de tüm `/app` ekranları |
| recharts 3 z-sırası (KPI `ReferenceLine`), legend yerleşimi | Grafik piksel farkı | AC9, AC12. Gerekirse yalnızca prop ile (`zIndex` vb.) eski sıraya dönülür; prop eklemek davranış değil görünüm korumasıdır, notta gerekçelendirilir |
| `react-is` sürüm uyumsuzluğu | Boş grafik | §2.3 sırası; `react-is` doğrudan bağımlılık |
| `v7_startTransition` ve React 19 ile test zamanlaması | Kırmızı ya da flaky L3 (BACKLOG QA-F02-FLAKY adayları) | Yalnızca `findBy`/`waitFor` (AC-NEG2). Her test dosyası 3 kez koşulur |
| Vite 8 / Vitest 5 / plugin-react v6 rehber maddeleri planner'ca kesin bilinmiyor | Beklenmeyen config kırılması | Ön ölçümdeki "Breaking change kontrol listesi"; D9 birleşimi |
| `@tailwindcss/vite` ile Vite 8 peer uyumu | `npm ci` hatası | D7 (`@tailwindcss/postcss`) |
| Radix'in React 19 uyarıları | Konsol uyarısı | D11 |
| Google Fonts ağdan yükleniyor | Çevrimdışı çekimde font farkı | A katmanında iki taraf aynı koşulda; B için ağ zorunlu |
| Diff boyutu | Gate maliyeti | Elle yazılan ≤ 400 satır (codemod, lock ve silinen config hariç). Aşılırsa builder durur ve 03a1 (React, router, recharts, date-fns) / 03a2 (Vite, Vitest, Tailwind) bölünmesini sorar |

### 10.2 Karar tablosu (Murat)
| # | Soru | Seçenekler | Öneri (güvenli varsayım) |
|---|---|---|---|
| D1 | Bölme | (a) 03a + 03b, ayrı plan dosyası, branch, gate ve L5b · (b) tek görev | **(a)** (§0) |
| D2 | AGENTS.md "Yeni npm paketi yok" (demo kuralı, F0-04'e kadar) F0-03'e uygulanır mı? | (a) F0-03 için istisna: yalnızca ADR-0001 paketleri + K4 izin listesi · (b) kural geçerli | **(a)**, ADR-0006 K4. Kit metni M1 |
| D3 | `components/ui` "elle değiştirilmez" (AGENTS §3) | (a) İstisna: TW codemod çıktısı + major'ın zorunlu kıldığı uyarlamalar (`calendar.tsx` rdp 9, `chart.tsx` tip). shadcn CLI ile yeniden üretim yok · (b) ui'ya hiç dokunma | **(a)**. (b) uygulanamaz: `sidebar.tsx`'teki `w-[--sidebar-width]` v4'te geçersiz CSS üretir |
| D4 | Görsel kabul eşiği | (a) Çift başına ≤ %0,1 piksel (pixelmatch 0,1, AA hariç) + boyut eşit + baseline'a gözle inceleme; aşan fark Murat'ın görüntü çiftiyle kabulüne bağlı · (b) 0 piksel · (c) yalnızca gözle | **(a)**. (b) font AA yüzünden kırılgan; (c) F0-02'de yetersiz kaldı |
| D5 | Tailwind config | (a) CSS-first (`@theme inline`), `tailwind.config.ts` silinir · (b) `@config` ile JS config korunur | **(a)**. ADR-0001 hedefi; HSL değişkenleri korunur |
| D6 | Animasyon eklentisi | (a) `tailwindcss-animate`, `@plugin` ile · (b) `tw-animate-css` (yeni paket) | **(a)**. Aynı keyframe'ler, yeni paket yok. Build hatası olursa (b) ve not |
| D7 | Tailwind entegrasyonu | (a) `@tailwindcss/vite` · (b) `@tailwindcss/postcss` | **(a)**. Peer Vite 8'i kabul etmezse (b) |
| D8 | Kullanılmayan ui bileşenleri (`calendar`, `drawer`, `chart`, `carousel` …) | (a) Kalır, uyarlanır · (b) silinir | **(a)**. Silme kapsam dışı (F0-02 ilkesi); F9-01/F9-03'te değerlendirilir |
| D9 | Vite 8 ve Vitest 5 tek başına yeşil olamazsa | (a) Tek commit, gerekçeli · (b) dur, sor | **(a)** |
| D10 | `npm audit` tam hedef 0 sağlanamazsa | (a) Kalan açık satır satır Murat kabulüyle · (b) merge bloke | **(a)**. CI'daki `--omit=dev --audit-level=high` her durumda 0 |
| D11 | React 19'da Radix uyarısı çıkarsa | (a) Uyarı veren `@radix-ui/*` paketleri mevcut `^` aralığında güncellenir (`npm update <paket>`) · (b) uyarı kabul, Öneriler'e | **(a)**, yalnızca uyarı varsa. Lock farkı notta |
| D12 | QA-03'ün "önce" görüntüsü baseline'a eklensin mi? | (a) Evet, `csm-golive-approval-success-toast.png` (main'den çekilen, 38. PNG; QA-01 emsali, denetim kopyalar) · (b) hayır | **(a)** |

> **Murat cevapları (2026-10-09):**
> - D1–D12: "Öneri" sütunu kabul edildi.
>   - D1 = (a): 03a + 03b; ayrı plan, branch, gate ve L5b.
>   - D2 = (a): AGENTS demo kuralına F0-03 istisnası, ADR-0006 K4 izin listesiyle sınırlı.
>   - D3 = (a): `components/ui`'da yalnızca TW codemod çıktısı ile `calendar.tsx` (rdp 9) ve `chart.tsx` (tip) uyarlaması. shadcn CLI ile yeniden üretim yok.
>   - D4 = (a): çift başına ≤ %0,1 piksel (pixelmatch 0,1, AA hariç), boyutlar eşit, baseline'a gözle inceleme. Eşiği aşan fark yalnızca Murat'ın görüntü çiftiyle kabulüyle geçer.
>   - D5 = (a): CSS-first (`@theme inline`), `tailwind.config.ts` silinir.
>   - D6 = (a): `tailwindcss-animate`, `@plugin` ile.
>   - D7 = (a): `@tailwindcss/vite`; peer Vite 8'i kabul etmezse `@tailwindcss/postcss`.
>   - D8 = (a): kullanılmayan ui bileşenleri kalır ve uyarlanır.
>   - D9 = (a): Vite 8 ve Vitest 5 tek başına yeşil olamazsa tek commit, gerekçeli.
>   - D10 = (a): tam audit 0 sağlanamazsa kalan açıklar satır satır Murat kabulüne bağlı.
>   - D11 = (a): Radix uyarısı çıkarsa yalnızca uyarı veren `@radix-ui/*` paketleri mevcut `^` aralığında güncellenir.
>   - D12 = (a): QA-03'ün "önce" görüntüsü baseline'a 38. PNG olarak eklenir; denetim kopyalar.
> - **Ek kural (sürüm varsayma):** Builder §2.1'deki her hedef paket için ön ölçümde `npm view <paket> versions` çalıştırır. Hedef major npm'de stabil sürüm olarak yayımlanmamışsa paket en son stabil major'da kalır. Alpha, beta, rc, next ve canary sürümleri sayılmaz. Sapma değişiklik notunun "Açık sorular / sapmalar" bölümüne yazılır: paket, hedef major, kullanılan sürüm, `npm view` çıktısı.
> - **CI audit (§10.3):** `ci.yml` değişmez. `npm audit --omit=dev --audit-level=high` bloklayıcı adım olarak kalır. Tam `npm audit` bloklamayan bir rapor adımı olarak F0-07'ye not edilir.
> - Plan durumu: Onaylandı.

### 10.3 Açık sorular (yukarıdakilere ek)
- ~~CI'ın "Dependency audit" adımı tam denetime çevrilsin mi?~~ **Kapandı (Murat, 2026-10-09):** `ci.yml` değişmez; `npm audit --omit=dev --audit-level=high` bloklayıcı kalır. Tam `npm audit` bloklamayan rapor adımı olarak F0-07'ye not edilir (M2).
- `index.html` `lang="en"`. Kapsam dışı, F9-04 (a11y/Türkçe) için not.

## 11. Gerekli gate'ler
- [x] **reviewer**: commit düzeni, AC2 izin listesi, codemod sınırı (AC7), `index.css` token korunumu (AC6), tip düzeltmelerinin yalnızca tip olması, test değişiklik türleri (AC-NEG2), REV2-01 metni.
- [x] **qa-verifier**: temiz klonda komutlar, audit, 2 ara commit koşusu, L5b-A (37 + QA-03 çifti), L5b-B (37 baseline), L6 (AC8 a–e, AC9, AC10, AC14), 390 px.
- [ ] **rules-reviewer: HAYIR.** Kural, audit, iş günü, rapor ve transaction koduna dokunulmuyor (AC-NEG1, `src/lib/rabbitqa` diff boş). date-fns kullanılmıyor. Yalnızca `docs/API_CONTRACT.md`'deki tek geçmiş satırı değişiyor; kural metni değişmiyor. **Koşul:** AC-NEG1 ihlal edilir ve Murat kabul ederse, ya da `/gate` anahtar kelime eşleşmesi tetiklenirse rules-reviewer çalışır. Beklenen çıktı "davranış farkı yok" karar tablosudur.

## 12. Uygulama görev metni
```
AGENTS.md, docs/INVARIANTS.md, docs/RBAC.md, docs/DATA_MODEL.md ve docs/TEST_STRATEGY.md dosyalarını oku.
Ardından docs/plans/F0-03a-stack-upgrades.md planını ve docs/adr/0006-f0-03-upgrade-and-monorepo.md'yi oku ve uygula. Kararlar §10.2'deki "Murat cevapları" bloğundadır (yoksa dur, sor).
Ön koşul: main'de ADR-0006 (Kabul edildi) ve §13 M1 commit'i var; değilse dur.
Branch: chore/f0-03a-upgrades (main'den). PR açma.

0) ÖN ÖLÇÜM (main @ <sha>, değişiklikten önce) → docs/changes/chore_f0-03a-upgrades.md "Ölçüm — main":
   npm ls --depth=0 · npx eslint . (28 uyarının dosya:satır:kural listesi) · npm run typecheck · npm test (dosya/test) ·
   npm run build (asset adları/boyutları) · npm audit ve npm audit --omit=dev (özet + paket listesi).
   "Breaking change kontrol listesi": vite.dev/guide/migration (v6→v7→v8), @vitejs/plugin-react CHANGELOG (v6),
   vitest.dev/guide/migration (v4, v5), tailwindcss.com/docs/upgrade-guide, React 19 upgrade guide, React Router v6→v7 upgrade,
   recharts 3.0 migration guide, react-day-picker v9 upgrading, date-fns v4 changelog → her madde: etkiliyor/etkilemiyor + kanıt (grep/dosya:satır).
   "Önce" ekran seti: plan §8.1 yöntemiyle 37 baseline ekranı + QA-03 → .verify/screens/f0-03a/before/ (commit ETME).
   Hedef sürüm kontrolü: §2.1'deki her hedef paket için npm view <paket> versions → hedef major stabil yayımlanmış mı? (alpha/beta/rc/next/canary sayılmaz) Yayımlanmamışsa en son stabil major'da kal, sürüm VARSAYMA; paket, hedef, kullanılan sürüm ve çıktı "Açık sorular / sapmalar"a.

1..10) Commit'ler plan §2.3 tablosundaki sırayla, her biri ayrı (D9 birleşimi hariç). Her commit'ten sonra:
   npm run lint && npm run typecheck && npm test && npm run build → "Commit tablosu"na sha, paketler, sonuçlar, CSS/JS boyutu.
   - Paketleri npm install ile ekle/kaldır; --legacy-peer-deps / --force / overrides KULLANMA. ERESOLVE çıkarsa dur ve not et.
   - npm audit fix ÇALIŞTIRMA (sürümler yalnızca §2.1 hedefleri; hedef major yayımlanmamışsa ön ölçümdeki ek kurala göre en son stabil major).
   - 1: calendar.tsx'i react-day-picker 9 API'sine uyarla (classNames anahtarları, Chevron); dosya kullanılmıyor, görsel etkisi yok.
   - 3: recharts 3 + react-is (^18, React 18 ile aynı major) doğrudan bağımlılık. KpiChart formatter yalnızca tip:
        formatter={(v) => [`${v} ${kpi.unit}`, "Değer"]} gibi; metin aynı. ui/chart.tsx yalnızca tip.
   - 4: react, react-dom, @types/react, @types/react-dom → 19; react-is → 19; next-themes → 0.4; vaul → 1.x. Tip hatası varsa yalnızca tip düzeltmesi.
   - 5a: App.tsx BrowserRouter'a future={{ v7_startTransition: true, v7_relativeSplatPath: true }}; testler yeşil.
   - 5b: react-router 7 kur, react-router-dom kaldır; 26 dosyada import "react-router-dom" → "react-router"; future prop'unu sil.
        Testlerde gerekiyorsa yalnızca getBy→findBy/waitFor. Assertion değerlerine dokunma.
   - 6: vite 8 + @vitejs/plugin-react 6; @vitejs/plugin-react-swc kaldır; vite.config.ts ve vitest.config.ts'te import "@vitejs/plugin-react";
        tsconfig.node.json include'a "vitest.config.ts" ekle. __dirname çalışmazsa import.meta.dirname. server/alias/dedupe aynı.
   - 7: vitest 5; config'i rehbere göre güncelle (globals, jsdom, setupFiles, include aynı anlam). jsdom yalnızca zorunluysa.
   - 8a: Temiz ağaçta npx @tailwindcss/upgrade → çıktıyı nota yaz. Sonra plan §2.4'e göre son hal:
        index.css: font @import → @import "tailwindcss" (kaynak yalnızca src/**/*.{ts,tsx}) → @custom-variant dark (&:is(.dark *)) →
        @plugin "tailwindcss-animate" → @theme inline (renk/radius/font/keyframes/animation/boxShadow; renkler hsl(var(--x))) →
        :root ve .dark blokları BYTE-BYTE AYNI → @layer base uyumluluk: varsayılan border bloğu, placeholder #9ca3af, button cursor pointer →
        mevcut @layer base (border-border, body) ve [data-sonner-toaster] bloğu aynı.
        vite.config.ts plugins: [react(), tailwindcss()] (@tailwindcss/vite; peer Vite 8'i kabul etmezse @tailwindcss/postcss, D7).
        tailwind.config.ts ve postcss.config.js silinir (D7 yolunda postcss.config.js yalnızca @tailwindcss/postcss ile kalır); autoprefixer ve postcss bağımlılıkları kalkar.
        components.json "tailwind.config": "". shadcn CLI KULLANMA. ui dosyalarında codemod dışı değişiklik YOK (D3 istisnaları hariç).
        Builder kontrolü: §8.1 A seti (after-8a) → diff tablosu nota. Eşik aşan ekran varsa nedeni bul. Sınıf düzeyinde eşdeğer düzeltme sayfa dosyasında
        yapılabilir; ui'da yapılamaz; çözülemezse dur ve Murat'a görüntü çiftiyle sor (D4).
   - 8b: tailwind-merge 3.
   - 9: eslint.config.js'teki src/components/ui/** override'ına "react-refresh/only-export-components": "off".
   - 10: docs/API_CONTRACT.md:315 v1.3 satırının sonuna "; #29/§2.2 `support_track` no-op kuralı kaldırıldı (RUL-01, d419000)" [REV2-01]. Başka satır değişmez.

Bitiş:
- Temiz kurulum: rm -rf node_modules && npm ci && npm run lint && npm run typecheck && npm test && npm run build → nota.
- npm audit (tam) ve npm audit --omit=dev --audit-level=high → önce/sonra tablosu (14 paket satır satır). 0 değilse kalanları "Açık sorular"a (D10).
- git diff main...HEAD -- src/lib/rabbitqa src/lib/auth-api.ts src/lib/auth-context.tsx → BOŞ olmalı (AC-NEG1); değilse dur.
- §8.1 A setinin son koşusu (after/) → ekran → farklı piksel → oran → açıklama tablosu; ekranları commit ETME.
- Değişiklik notu (docs/changes/chore_f0-03a-upgrades.md): Ölçüm—main, Breaking change kontrol listesi, Commit tablosu, çözülen sürümler,
  codemod çıktısı + yeniden adlandırma türü→sayı, test değişiklik türleri tablosu, lint uyarı listesi (önce/sonra), audit tablosu, L5b-A tablosu,
  AC ↔ kanıt tablosu, Eşleme, Açık sorular/sapmalar, Öneriler (QA-03 L3 testi → F0-06; eslint-plugin-react-hooks → F0-04).
- Push et. PR açma.
Kurallar: docs/WORKFLOW.md şablon A. Ekran, akış, store davranışı değişmez (mockup-freeze). Emin olmadığın noktada dur ve sor.
```

## 13. Denetim / Murat işleri (builder dışı)
- **M1 (denetim, `/build`'den önce, Murat commit'ler):**
  - ADR-0006 "Kabul edildi".
  - `docs/PHASES.md` F0-03 satırı F0-03a / F0-03b olarak bölünür. F0-03a satırına "vitest 5 (+ `@vitest/*`)" eklenir (F0-02 M7'den kalan).
  - `docs/adr/0001-stack.md:54` "Takip: F0-02 …" → "F0-03 (ADR-0006)".
  - `AGENTS.md:25` demo kuralına F0-03 istisnası eklenir: "Yeni npm paketi yok (F0-03 hariç: ADR-0006 K4)". Bu kit değişikliği Murat onayıyla yapılır.
- **M2 (merge sonrası, denetim):**
  - BACKLOG'da kapatılır: REV2-01, QA-03 (03b'de de doğrulanır) ve F0-02 §2.4b'deki 14 audit açığı.
  - D12 = (a) ise `before/csm-golive-approval-success-toast.png` → `docs/reviews/M-06/baseline/` (baseline 38).
  - `AGENTS.md:33` "tema token'ları `src/index.css` / `tailwind.config.ts`'te" → "`src/index.css` (`@theme inline`)".
  - `docs/AUDIT.md` §5'e F0-02 ve F0-03a sütunları.
  - `docs/TEST_STRATEGY.md` §1 L5b satırına yöntem referansı (ADR-0006 K5).
  - F0-07 notu: CI'a tam `npm audit` için bloklamayan rapor adımı eklenecek; `--omit=dev --audit-level=high` bloklayıcı kalır (Murat, 2026-10-09; §10.3).
