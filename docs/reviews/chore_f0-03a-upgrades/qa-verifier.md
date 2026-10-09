# qa-verifier — chore/f0-03a-upgrades @ 0ccd22c

**Karar: CHANGES_REQUESTED**

Şiddet sayıları: Critical 0 · High 1 · Medium 2 · Low 3 · Info 3

Baz: `origin/main` @ `269bf44` (ayrı worktree, iş bitince `git worktree remove --force` ile kaldırıldı). Branch worktree: `.verify/chore_f0-03a-upgrades` @ `0ccd22c` (`git diff 269bf44..HEAD`: 12 commit). Çalışma yeri: `.verify/` altı. Kaynak, test ve paket dosyalarına yazılmadı. Açılan tüm sunucular (8090–8095) kapatıldı (`lsof` → 0 dinleyici).

**CI: okunamadı** (`gh` yok, Murat'ın notu boş). AC-NEG4 = UNVERIFIED.

Özet:
- Komut kapıları, audit, AC1–AC5, AC8–AC11, AC15, AC16 ve NEG1–NEG3 geçti.
- **AC12 ve AC13 geçmedi.** Toast bileşeni Tailwind 4 geçişinde görünür biçimde değişmiş (QA-01). Pixelmatch 0,1 eşiği bunu gizliyor, eşik 0 ile görünüyor.
- QA-03 (AC14) akışı iki tarafta da çalışıyor. Ancak AC14'ün "çift AC12 yöntemiyle karşılaştırılır" şartı %0,11 ile eşiği aşıyor.
- recharts 3'ün davranış değişiklikleri (QA-02, QA-03) planın "görsel ve davranış değişikliği yok" hedefine aykırı.

> Not (gate orkestratörü): Bu rapordaki `QA-03` bulgu ID'si (tooltip sırası), BACKLOG'daki round 1 **QA-03** maddesiyle (Go-Live başarı toast'ı, plan AC14) aynı adı taşır. Raporda "QA-03 (AC14) akışı" başlığı BACKLOG maddesini, "**QA-03 (Medium)**" bulgusu tooltip sırasını anlatır. SUMMARY'de bulgu `QA-03 (tooltip)` diye anılır.

## Komut kanıtları

| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| main: `rm -rf node_modules && npm ci` | 0 | `EXIT npm ci 0`; `14 vulnerabilities (2 critical, 6 high, 6 moderate)` |
| branch: `rm -rf node_modules && npm ci` (`--prefer-dedupe` yok) | 0 | `found 0 vulnerabilities` / `EXIT npm ci 0` |
| branch: `npm ls --depth=0` | 0 | `react@19.3.0`, `react-router@7.18.4`, `recharts@3.10.1`, `vite@8.3.4`, `vitest@5.0.3`, `tailwindcss@4.3.3`, `@tailwindcss/vite@4.3.3`, `@vitejs/plugin-react@6.1.2`, `date-fns@4.4.0`, `tailwind-merge@3.7.0`; `invalid`/`missing`/`ERESOLVE` yok; `react-router-dom`, `plugin-react-swc`, `autoprefixer`, `postcss` listede yok |
| main: `npx eslint .` | 0 | `✖ 28 problems (0 errors, 28 warnings)` |
| branch: `npm run lint` | 0 | `✖ 21 problems (0 errors, 21 warnings)`. Main listesinin alt kümesi: yalnız silinen `react-refresh/only-export-components` satırları var, yeni satır yok |
| main / branch: `npm run typecheck` | 0 / 0 | `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json` çıktısız |
| main: `npm test` | 0 | `Test Files 13 passed (13)` · `Tests 213 passed (213)` |
| branch: `npm test` | 0 | `Test Files 13 passed (13)` · `Tests 213 passed (213)` |
| main: `npm run build` | 0 | `index-CjfMyXEl.css 68.25 kB` · `index-Dcv2guIw.js 1,223.99 kB` |
| branch: `npm run build` | 0 | `index-CgNYKflT.css 86.12 kB (gzip 14.17)` · `index-BXBNZ0Nv.js 1,313.14 kB`. CSS +26 %, JS +7 % |
| `npm audit` (main) | 1 | `14 vulnerabilities (6 moderate, 6 high, 2 critical)`; `--omit=dev`: `2 moderate` |
| `npm audit` (branch) | 0 | `found 0 vulnerabilities` |
| `npm audit --omit=dev --audit-level=high` (branch) | 0 | `found 0 vulnerabilities` |
| `grep -rn "react-router-dom" src package.json` | 1 | boş |
| `git diff 269bf44 -- package.json` | — | Eklenenler: `@date-fns/tz`, `react-is`, `react-router`, `@tailwindcss/vite`, `@vitejs/plugin-react`. `overrides`/`resolutions` yok. `.npmrc`, `tailwind.config.ts`, `postcss.config.js` yok |
| `git diff 269bf44...HEAD --stat -- src/lib/rabbitqa src/lib/auth-api.ts src/lib/auth-context.tsx` | 0 | boş (AC-NEG1) |
| `git diff 269bf44 -- src \| grep -E "^\+.*from ['\"](date-fns\|@date-fns/tz)"` | 1 | boş (AC11) |
| `git diff 269bf44 -- src \| grep -E "^\+.*(@ts-ignore\|@ts-expect-error\|eslint-disable\|as any\|\.skip\|\.only\|\.todo)"` | 1 | boş (AC-NEG2) |
| `git diff 269bf44 -- '*.test.*'` | 0 | 7 dosya, 7+/7−; hepsi `react-router-dom` → `react-router` import satırı |
| `npm ls xlsx --all` | 1 | `` `-- (empty) `` (AC-NEG3) |
| `grep -ri supabase dist/` | 1 | boş (AC-NEG3) |
| `:root`/`.dark` blokları md5 (main vs branch `src/index.css`) | — | ikisi de `875219a569ed559fa8f3a810c627af0f` |
| AC3: `b858e97` (React 19) için `npm ci && typecheck && test && build` | 0 | `13 passed / 213 passed`; `index-CjfMyXEl.css 68.25 kB`; `index-CVOht6ze.js 1,314.72 kB`. Nottaki satırla aynı |
| AC3: `96982a3` (router 7) için aynı komutlar | 0 | `13 / 213`; `68.25 kB`; `1,331.44 kB`. Nottaki satırla aynı |
| `git diff 269bf44 -- docs/API_CONTRACT.md` | 0 | tek satır, v1.3 satırına `#29/§2.2 support_track no-op kuralı kaldırıldı (RUL-01, d419000)` eklenmiş (AC15) |
| Dev, branch (`vite` :8095): oturumsuz `/app/projects` → `/login`; giriş → `/app/overview`; `?tab=golive` Go-Live sekmesi; `?ws=00` "Satış Devri" paneli; csm 11 sekme + RiskDialog + Insight diyaloğu + rapor, admin 8 sekme, yeni proje diyaloğu | — | konsol: `Errors: 0, Warnings: 0` |
| Dev, main (`vite` :8094) `/login` | — | `Console: 0 errors, 2 warnings`: `v7_startTransition`, `v7_relativeSplatPath` (AC8-e kıyası) |
| Dev, branch `/olmayan-yol` | — | NotFound görünür. `[ERROR] 404 Error: User attempted to access non-existent route`: `NotFound.tsx:8` `console.error`, main'de de aynı |
| Production konsolu: bu oturumun 18 MCP konsol günlüğü (her iki taraf, 37 ekran taraması) | — | 0 ERROR, 0 WARNING; yalnız `[VERBOSE] [DOM] ... autocomplete` |
| `gh run list` | — | okunamadı → **UNVERIFIED** |

## AC ↔ sonuç

| AC | Doğrulama | Sonuç |
|---|---|---|
| AC1 | `npm ls --depth=0` exit 0, majörler hedefle aynı | PASS |
| AC2 | `package.json` diff'i (yukarıda). `--legacy-peer-deps`/`--force` beyanı notta | PASS |
| AC3 | iki ara commit yeniden koşuldu, tablodakiyle aynı | PASS |
| AC4 | lint 0 hata (28→21), testler 13/213, build exit 0 | PASS |
| AC5 | 14 → 0; `--omit=dev --audit-level=high` exit 0 | PASS |
| AC6 | config dosyaları yok, `@tailwind` yok, `:root`/`.dark` md5 aynı, `components.json` `"config": ""`, `@source`/`@custom-variant dark`/`@plugin "tailwindcss-animate"` var. §2.4-3 (a)(b)(c) kural içeriği bana ait değil (reviewer) | PASS (kontrol ettiğim kısım) |
| AC7 | reviewer kapsamı. Test diff'i yalnız import satırı | — |
| AC8 a–e | dev ortamında a, b, c, d, e hepsi gözlendi (komut tablosu). Main'de 2 uyarı, branch'te 0 | PASS |
| AC9 | pasta, iki çubuk, KPI çizgi grafiği dolu. KPI tooltip `18.09.2026 / Değer : 25 %`. "Yalnızca tip düzeyi" ifadesi için QA-02 ve QA-03 | PASS (çizim) / bkz. QA-02, QA-03 |
| AC10 | production 37 ekran taramasında 0 error, 0 warning. Dev'de csm+admin turunda 0/0, Radix `element.ref` uyarısı yok (D11 tetiklenmedi). 37 ekranın tamamı dev'de gezilmedi (kısmi) | PASS (kısmi dev) |
| AC11 | grep boş | PASS |
| **AC12** | 38 çiftin 37'si ≤ %0,03. **`csm-golive-approval-success-toast` %0,11 (> %0,1)**. Tablo aşağıda | **FAIL** (QA-01) |
| **AC13** | Tüm ekranlarda yerleşim ve boşluk aynı. Toast rengi/kenarlığı farklı | **FAIL** (QA-01) |
| AC14 | Adımlar iki tarafta uygulandı (QA-03 bölümü). Davranış PASS, görsel çift %0,11 | davranış PASS / çift FAIL |
| AC15 | tek satır diff | PASS |
| AC16 | lint 28 → 21 | PASS |
| AC-NEG1 | boş | PASS |
| AC-NEG2 | grep boş, test diff'i yalnız import | PASS |
| AC-NEG3 | `xlsx` boş, `supabase` boş | PASS |
| AC-NEG4 | CI okunamadı | UNVERIFIED |

## Bulgular

**QA-01 (High)** — Sonner toast stili Tailwind 4'te değişmiş. Reviewer REV-01'i bağımsız doğruladım.
- Kanıt: `screens/crops/toast-before.png` ve `toast-after.png` (main/branch yan yana). Aynı ekran `csm-phase6-riskdialog-reason-error-toast` ve `csm-golive-approval-success-toast` çiftleri (`screens/toast/`).
- `browser_evaluate` yok. Computed style okuyamadım, değerleri toast bölgesinden piksel örnekleyerek ölçtüm. Reviewer'ın değerleriyle birebir uyuşuyor:

| Ölçüm | main | branch |
|---|---|---|
| Toast kenarlık pikseli | rgb(214, 221, 230) | rgb(237, 237, 237) |
| En koyu metin pikseli | rgb(15, 23, 41) | rgb(23, 23, 23) |
| Üst kenar gradyanı | 132,135,140 → 234,238,242 | 144,144,144 → 246,246,246 |
| Gölge alt pikselleri | 46…50 | 48…51 |

- Etki: main'de mavi-gri tonlu `border-border`/`text-foreground`, branch'te Sonner'ın varsayılan nötr gri/siyahı. Görünüm düştü, AC13 ("renk, kenarlık, gölge farkı yok") ihlal.
- Pixelmatch 0,1'de gizleniyor: `csm-phase6-riskdialog-reason-error-toast` 0 px, ama eşik 0'da 8.665 px (diyalog sayfalarının taban gürültüsü ≈ 550). `csm-golive-approval-success-toast` 0,1'de 1.686 px = %0,11, eşik 0'da 19.451 px.
- Önerilen düzeltme yönü (uygulama oturumu karar verir): Sonner'ın katmansız CSS'i ile `@layer` içindeki Tailwind utility'lerinin çakışması.
- Bu durumda main'in toast bileşeni için bir L3 testi ya da `ui/sonner.tsx` `classNames`'inin üretilen CSS'te etkin olduğunu gösteren kontrol eklenmeli.

**QA-02 (Medium)** — recharts 3 `accessibilityLayer` varsayılanı: grafikler klavye odaklanabilir oldu. REV-04'ü doğruladım.
- Branch: `svg.recharts-surface[role=application][tabindex=0]` (hata mesajındaki DOM). Main: aynı seçici eşleşmiyor.
- ManagementReport "CSM başına müşteri ve açık iş" grafiğinde Shift+Tab/Tab ile odaklanınca mavi odak çerçevesi ve imleç/tooltip çıkıyor: `crops/branch-reports-chart-tab-focus.png`.
- KpiChart'ta tıklayınca odak çerçevesi ve tooltip çıkıyor: `crops/branch-kpi-chart-focus.png`. Main'de aynı tıklama hiçbir şey göstermiyor: `crops/main-kpi-chart-click.png`.
- Plan "görsel ve davranış değişikliği yok" diyor, `accessibilityLayer={false}` ile main davranışı korunur (karar uygulama oturumunun).

**QA-03 (Medium)** — ManagementReport "CSM başına müşteri ve açık iş" tooltip sırası ters. REV-03'ü doğruladım.
- main: `Deniz Uzun / Müşteri : 6 / Açık iş : 23`.
- branch: `Deniz Uzun / Açık iş : 23 / Müşteri : 6` (`crops/branch-csm-bar-hover.png`, `crops/main-csm-bar-hover.png`).
- Legend sırası aynı (aşağıda). `Tooltip itemSorter` ayrıca verilmemiş.
- "Gecikenler" grafiğinde tooltip sırasını aynı bar üzerinde kıyaslamadım. DOM bar sırası main ve branch'te farklı olduğu için eşleşen bar'ı seçemedim: UNVERIFIED.

**QA-04 (Low)** — REV-05 (dönem Select'i sonrası legend sırası) **tekrarlanmadı**.
- "Bu ay" → "Bu hafta" sonrası iki tarafta da: `Yeşil, Sarı, Kırmızı` / `Adım, Aksiyon` / `Müşteri, Açık iş`.
- Ekran kanıtı: `crops/main-reports-bu-hafta.png`, `crops/branch-reports-bu-hafta.png`. Diğer dönem seçenekleri denenmedi.

**QA-05 (Low)** — Kalan eşik-0 farkları (QA-01 dışı): ±1–2 kanal seviyesi kart/tab-list gölge ve kenarlık yuvarlaması, recharts 3 çubuk/dilim kenarında 1–2 px. İstisna: `csm-insights-step-update-edit-dialog-status-open` eşik 0'da en büyük kanal farkı 35, `manager-new-project-dialog` 10. Bunlar diyalog animasyon karesi ya da odak halkası olabilir, nedenini kesinleştiremedim. 0,1'de sırasıyla 3 ve 0 px olduğu için engelleyici değil.

**QA-06 (Low)** — AC14 başarı toast'ı görsel olarak sınırlı.
- "Müşteri onayı kaydedildi" metni iki tarafta da `browser_wait_for` ile DOM'da görüldü.
- Aynı eylem hemen ardından "Go-Live tamamlandı — Go-Live başladı, 0 adım açıldı" toast'ını da tetikliyor. İkincisi öne geçiyor, ilki arkada kalıyor. Sonner üst üste bindiriyor.
- `browser_hover` ile açılma kareye bağlı olduğu için tam açılmadı. Branch'te yalnız soluk "Müşteri onayı…" yazısı görünüyor (`after/csm-golive-approval-success-toast.png`), main'de yalnız ikinci toast'ın kenarı.
- Ekran kanıtı yarım. Toast'ın tam görünmesi için ikinci toast'ı ayrıştıran kalıcı bir L3/L6 testi önerilir.
- Bu main'de de var, branch regresyonu değil.

**QA-07 (Info)** — Ölçüm yöntemi uyarısı: Playwright MCP tarayıcısında CSS animasyonları ekran görüntüsü karelerine bağlı ilerliyor.
- `AppShell` içeriği `animate-fade-in` ile açılıyor. `browser_wait_for` süre beklemesi animasyonu bitirmiyor.
- İlk turdaki ekranlar (3 s bekleme ile alınan) soluk çıktı ve piksel karşılaştırmasında sahte %0,35–%4,3 fark üretti. Onları attım.
- Nihai set için her sayfayı yüklemeden sonra viewport ekran görüntüleriyle "ısıttım", `fullPage` kareyi sonra aldım. Soluklık doğrulaması: başlık bölgesindeki en koyu piksel rgb(15,23,41) olmalı (betik `.verify/chk.py`).
- SPA içi gezinme (sidebar/sekme tıklaması) tekrar animasyon tetiklemediği için çoğu ekranı bu yolla aldım. Çiftler (main/branch) aynı yöntemle alındı.
- Builder'ın "38/38 0 px"ı toast çiftinde ve eşik-0'da tutmuyor (QA-01).

**QA-08 (Info)** — Baseline ile yöntem farkları (branch'ten kaynaklanmıyor, main de aynı):
- `csm-tab-access-credentials`: baseline'da Aşamalar paneli açık, benim çekimimde Erişim bilgileri paneli.
- `csm-phase6-riskdialog-reason-error-toast`: baseline'da toast görünmüyor.
- `manager-reports`: baseline'da çubuklar animasyon ortasında.
- `csm-phase00-handover-workspace`: baseline 2277 px, ben 1284 px. Çekim yöntemi baseline gibi tam sayfa, ama sheet açıkken sayfa kaydırma kilidi nedeniyle iki tarafta da 1284 çıkıyor (builder'ın tespitiyle aynı).
- `csm-my-work`: baseline 3868 px, branch/main 3780 px. Tarih ve veriden gelen fark.
- Tarih: baseline 06.10.2026, bugün 09.10.2026 (uyarı sayıları 33 → 39, "9 açık uyarı" → "11/10 açık uyarı", gecikme günleri). Tümü AC13'ün izinli farkı.

**QA-09 (Info)** — Bundle: CSS 68,25 → 86,12 kB (+%26). Notun commit tablosunda var, AC4 buna izin veriyor. Sonner/utility sorunu (QA-01) ile ilgisi araştırılabilir.

## L5b-A: main (8090/8092) ↔ branch (8091/8093) pixelmatch

Araç: `npx -y pixelmatch before after diff 0.1` (eşik 0,1, AA hariç). Eşik 0 sütunu `pixelmatch … 0`. Yüzde, 0,1 eşiğindeki farklı piksel / (genişlik×yükseklik). Tarayıcı: Playwright MCP, viewport 1200×1284, mobil 390×844, insights diyaloğu 1200×718, `fullPage` ekran görüntüsü (diyalog hariç). Aynı makine, aynı oturum, çiftler birkaç dakika arayla. Her rol için temiz localStorage (ayrı origin). Boyutlar 38 çiftte de eşit.

| Ekran | Boyut | Fark (0,1) | Oran | Eşik 0 | Açıklama |
|---|---|---|---|---|---|
| admin-overview | 1200×2792 | 474 | %0,01 | 1114 | AI öneri satırlarındaki saat metni (12:05 vs 12:08), dakika değişimi |
| admin-project-detail | 1200×1284 | 0 | 0 | 34 | ±1 kanal |
| admin-settings-audit-log | 1200×1284 | 0 | 0 | 104 | ±1 kanal |
| admin-settings-integrations | 1200×1284 | 0 | 0 | 304 | ±1 kanal |
| admin-settings-template | 1200×1284 | 0 | 0 | 124 | ±1 kanal |
| admin-settings-users | 1200×1284 | 0 | 0 | 101 | ±1 kanal |
| care-overview | 1200×2450 | 474 | %0,02 | 1114 | saat metni |
| care-project-detail-mobile-390 | 390×2042 | 0 | 0 | 175 | ±1 kanal |
| care-project-detail-no-credentials-tab | 1200×1284 | 0 | 0 | 34 | ±1 kanal |
| csm-customer-report | 1200×2208 | 0 | 0 | 8 | ±1 kanal |
| **csm-golive-approval-success-toast (QA-03)** | 1200×1284 | **1686** | **%0,11** | 19451 | **toast kenarlık/metin rengi (QA-01)** + yığın karesi. Eşiği aşıyor → FAIL |
| csm-insights-step-update-edit-dialog-status-open | 1200×718 | 3 | %0 | 3500 | diyalog kare/odak; QA-05 |
| csm-insights | 1200×2128 | 850 | %0,03 | 1821 | saat metni (12:05/12:08) |
| csm-my-work | 1200×3780 | 86 | %0 | 223 | saat metni, tek satır |
| csm-overview | 1200×2507 | 474 | %0,02 | 1114 | saat metni |
| csm-phase00-handover-workspace | 1200×1284 | 0 | 0 | 4779 | ±1 kanal (sheet gölgesi) |
| csm-phase6-riskdialog-edit-default | 1200×1284 | 0 | 0 | 550 | ±1 kanal |
| **csm-phase6-riskdialog-reason-error-toast** | 1200×1284 | 0 | 0 | **8665** | toast kenarlık/metin rengi (QA-01), 0,1 eşiği gizliyor |
| csm-phase6-riskdialog-reason-field | 1200×1284 | 0 | 0 | 557 | ±1 kanal |
| csm-project-detail-phases | 1200×1284 | 0 | 0 | 39 | ±1 kanal |
| csm-projects-list | 1200×1284 | 0 | 0 | 14 | ±1 kanal |
| csm-tab-access-credentials | 1200×1284 | 0 | 0 | 63 | ±1 kanal |
| csm-tab-actions | 1200×1284 | 0 | 0 | 40 | ±1 kanal |
| csm-tab-contacts | 1200×1284 | 0 | 0 | 45 | ±1 kanal |
| csm-tab-continuity | 1200×1284 | 0 | 0 | 58 | ±1 kanal |
| csm-tab-discovery-teams | 1200×2470 | 57 | %0 | 154 | KPI çizgi grafiği kenarı (recharts 3) |
| csm-tab-documents | 1200×1284 | 0 | 0 | 40 | ±1 kanal |
| csm-tab-golive | 1200×1284 | 0 | 0 | 60 | ±1 kanal |
| csm-tab-history | 1200×1284 | 64 | %0 | 190 | saat metni, tek satır (y 435–442) |
| csm-tab-integrations | 1200×3034 | 1176 | %0,03 | 2280 | AI öneri saatleri (12:xx) |
| csm-tab-meetings | 1200×2003 | 0 | 0 | 351 | ±1–2 kanal |
| devops-overview | 1200×2445 | 474 | %0,02 | 1114 | saat metni |
| devops-tab-access-credentials | 1200×1284 | 0 | 0 | 55 | ±1 kanal |
| login | 1200×1284 | 0 | 0 | 0 | tam eşit |
| manager-new-project-dialog | 1200×1284 | 0 | 0 | 539 | ±10 kanal (diyalog) |
| manager-overview | 1200×2792 | 474 | %0,01 | 1116 | saat metni |
| manager-project-detail-no-credentials-tab | 1200×1284 | 0 | 0 | 37 | ±1 kanal |
| manager-reports | 1200×2198 | 466 | %0,02 | 570 | pasta dilim ucu ve çubuk kenarı 1–2 px (recharts 3); legend ve renkler aynı |

Eşiği (≤%0,1) geçen çift sayısı 37/38. FAIL tek çift: `csm-golive-approval-success-toast` (%0,11).

Önceki turdan kalan tek ek dosya: `before/extra-127-csm-golive-approval-stacked-toast.png`. Bir önceki mutasyonlu origin'den çekildi, karşılaştırmaya girmedi.

Eşik 0 sütunundaki `saat metni` açıklamaları diff görüntüsünden doğrulandı: `crops/ins1.png` (`12:05` ↔ `12:08`), `crops/int2.png`. recharts için `crops/rep1.png`.

## L5b-B: 37 M-06 baseline PNG ↔ branch (yan yana)

Gözle inceleme yöntemi: `montage/m00…m18.png` (soldaki baseline, sağdaki branch, 0,4 ölçek). Yerleşim, boşluk, tipografi, ikon ve radius farkı yok. Renk/kenarlık/gölge için QA-01 notu aşağıda.

| Ekran | Sonuç | Fark açıklaması |
|---|---|---|
| admin-overview | PASS | tarih (06.10 → 09.10), uyarı sayısı 33 → 39 |
| admin-project-detail | PASS | "9 açık uyarı" → "11", gecikme günleri |
| admin-settings-audit-log | PASS | aynı |
| admin-settings-integrations | PASS | aynı |
| admin-settings-template | PASS | aynı |
| admin-settings-users | PASS | aynı |
| care-overview | PASS | tarih/sayı |
| care-project-detail-mobile-390 | PASS | 390×2042 ikisinde de |
| care-project-detail-no-credentials-tab | PASS | tarih/sayı |
| csm-customer-report | PASS | hafta tarihi 06.10 → 09.10 |
| csm-insights-step-update-edit-dialog-status-open | PASS | |
| csm-insights | PASS | saat/tarih |
| csm-my-work | PASS | 3868 → 3780 px, tarih bağımlı satır sayısı |
| csm-overview | PASS | tarih/sayı |
| csm-phase00-handover-workspace | PASS | baseline 2277 px, yöntem farkı (QA-08) |
| csm-phase6-riskdialog-edit-default | PASS | |
| csm-phase6-riskdialog-reason-error-toast | **FAIL (QA-01)** | baseline'da toast yok. main ↔ branch'te toast rengi farkı |
| csm-phase6-riskdialog-reason-field | PASS | |
| csm-project-detail-phases | PASS | tarih bağımlı gecikme günü |
| csm-projects-list | PASS | uyarı sayıları |
| csm-tab-access-credentials | PASS* | baseline Aşamalar paneli gösteriyor (QA-08) |
| csm-tab-actions | PASS | tarih |
| csm-tab-contacts | PASS | |
| csm-tab-continuity | PASS | |
| csm-tab-discovery-teams | PASS | |
| csm-tab-documents | PASS | |
| csm-tab-golive | PASS | tarih |
| csm-tab-history | PASS | tarih/saat |
| csm-tab-integrations | PASS | saat |
| csm-tab-meetings | PASS | |
| devops-overview | PASS | tarih/sayı |
| devops-tab-access-credentials | PASS | |
| login | PASS | tam eşit |
| manager-new-project-dialog | PASS | başlangıç tarihi 06.10 → 09.10 |
| manager-overview | PASS | tarih/sayı |
| manager-project-detail-no-credentials-tab | PASS | tarih/sayı |
| manager-reports | PASS | baseline çubukları animasyon ortasında |

## QA-03 (AC14) akışı: csm Deniz Uzun, `p_isyatirim` → Go-Live

Temiz origin'lerde (main `localhost:8092`, branch `localhost:8093`) aynı adımlar:
1. "Toplantıyı kaydet": "Go/No-Go toplantısı" → Tamamlandı.
2. 00 Satış Devri panelinden "Mobil kanal için MobileHub demosu yapılacak" → Karşılandı (gerekçe "Demo yapıldı (QA-03)"). "Açık taahhütlerin kontrolü" → Tamamlandı.
3. Kişi seçildi (Sevcan Vural), onay notu yazıldı.
4. "Müşteri onayını kaydet".

| Beklenen sonuç | main | branch |
|---|---|---|
| Toast "Müşteri onayı kaydedildi" | `browser_wait_for` ile görüldü, DOM'da | aynı |
| Kontrol listesi "Müşteri onayı" Tamamlandı | PASS | PASS |
| "Onaylayan: Sevcan Vural (Product Owner) · 09.10.2026 · Kaydeden: Deniz Uzun" | görüldü | görüldü |
| İlerleme | %88 | %88 |
| Konsol hatası | 0 | 0 |

Ekran: `before/csm-golive-approval-success-toast.png`, `after/csm-golive-approval-success-toast.png` (metni arkada kalan toast için QA-06). Çift %0,11 → AC12 sınırı aşılıyor.

## Murat'ın 6 sapması ve REV ek soruları

| Konu | Sonuç |
|---|---|
| `space-x/y` uyumluluk kuralı | login 0 px, handover 0 px (eşik 0,1). Boşluk farkı yok |
| `bg-success/12` rozet | "Tamamlandı/Bağlı" rozetleri phases, integrations, golive'da 0 px. main ile aynı |
| `itemSorter={null}` legend sırası | iki tarafta aynı. Dönem değişince de aynı (QA-04). Tooltip sırası ters (QA-03) |
| codemod düzeltmeleri | diyaloglar, select, sheet, mobil 390: 0 px (eşik 0,1). Toast bileşeni için QA-01 |
| `--prefer-dedupe` | `npm ci` exit 0, `npm ls --depth=0` exit 0, `invalid`/`missing` yok |
| 390 px mobil | `care-project-detail-mobile-390`: 0 px, yerleşim kırılmadı |
| REV-01 | doğrulandı (QA-01) |
| REV-02 | eşik 0 sütunu yukarıda |
| REV-03 | doğrulandı (QA-03) |
| REV-04 | doğrulandı (QA-02) |
| REV-05 | tekrarlanmadı (QA-04) |

## Ekran yolları

Tam set `.verify/screens/f0-03a-gate/` altında (commit edilmez):
- `before/<ad>.png` (main), `after/<ad>.png` (branch): 38'er adet (+ `before/extra-127-…`).
- `diff/<ad>.png` (eşik 0,1), `diff0/<ad>.png` (eşik 0).
- `montage/m00.png … m18.png`: baseline ↔ branch yan yana.

Gate kaydına kopyalanan alt küme (`docs/reviews/chore_f0-03a-upgrades/screens/`):
- `crops/`: `toast-before.png`, `toast-after.png`, `branch-csm-bar-hover.png`, `main-csm-bar-hover.png`, `branch-reports-chart-tab-focus.png`, `branch-reports-chart-click-focus.png`, `branch-kpi-chart-focus.png`, `main-kpi-chart-click.png`, `main-reports-bu-hafta.png`, `branch-reports-bu-hafta.png`, `rep1.png`, `ins1.png`, `int2.png`, `kpi-main-vs-branch.png`, `phases-top.png` (+ çalışma kırpıntıları).
- `toast/`: iki toast ekranının `before`/`after`/`diff0` üçlüsü.

Yardımcı betikler (`.verify/chk.py`, `cmp.sh`, `bbox.py`) yalnız `.verify/` altında. Ham MCP günlükleri `.verify/screens/console-*.log`.

## Eksikler ve UNVERIFIED

- CI `app`/`secrets` (AC-NEG4).
- Computed `border-color`/`color`/`box-shadow` stringleri (`browser_evaluate` yok): piksel örneklemesiyle doğrulandı.
- AC10 dev turu 37 ekranın tamamı değil, csm 11 sekme + diyaloglar + admin 8 sekme + yeni proje + rapor.
- "Gecikenler" tooltip sırası (QA-03).
- §2.4-3 uyumluluk kuralı (a)(b)(c) içeriği ve AC7 codemod sınırı (reviewer).
- Başarı toast'ının görsel kanıtı (QA-06).
