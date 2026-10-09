## reviewer — chore/f0-03a-upgrades @ 0ccd22c
**Karar:** CHANGES_REQUESTED

**CI:** Okunamadı. Yerelde `gh` yok, Murat'ın notu da boş. AC-NEG4 bu yüzden "doğrulanamadı"; merge'den önce Murat'ın `app` ve `secrets` job'larının yeşil olduğunu görmesi gerekiyor. Destekleyici kanıtlar:
- Lock'ta Linux native binding'leri var: `@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu`, `@tailwindcss/oxide-linux-x64-gnu`.
- `ci.yml` Node 24 kullanıyor; Vite 8 ve Vitest 5'in Node gereksinimini karşılıyor.
- Parity job'u atlanır: worktree'de `migrations/` dizini yok, `check-migrations` false döner.

**rules-reviewer:** AC-NEG1'i bağımsız doğruladım. `git diff origin/main...origin/chore/f0-03a-upgrades -- src/lib/rabbitqa src/lib/auth-api.ts src/lib/auth-context.tsx` 0 satır. rules-reviewer'ın çalıştırılmaması yerinde.

| Severity | Sayı |
|---|---|
| Critical | 0 |
| High | 1 |
| Medium | 2 |
| Low | 3 |

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-01 | High | Plan §6 ve AC13 (renk, kenarlık, gölge farkı yok), ADR-0006 K2 (mockup-freeze), AGENTS "mevcut tema" | `src/components/ui/sonner.tsx:16`; düzeltme yeri `src/index.css:276` | **Tüm Sonner toast'larının görünümü değişti; L5b-A bunu yakalamadı.**<br>Sebep: Tailwind 4 utility'leri native `@layer utilities` içinde üretiliyor (`dist/assets/index-CgNYKflT.css`, `@layer utilities{` ofset 9240; `.group-\[\.toaster\]\:bg-background` ofset 47929). v3 çıktısında `@layer` yok (main CSS'te `grep -c @layer` = 0). Sonner 1.7.4 kendi CSS'ini çalışma anında katmansız `<style>` olarak ekliyor: `:where([data-sonner-toast][data-styled="true"]){background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);box-shadow:0 4px 12px #0000001a…}`.<br>v3'te `.group.toaster .group-\[\.toaster\]\:border-border` (0,3,0), özgüllüğü 0 olan Sonner kuralını yeniyordu. v4'te katmansız CSS her katmanlı kuralı yener, yani Sonner'ın varsayılanları geçerli oluyor.<br>Kanıt (`.verify/screens/f0-03a/{before,after}`, eşik 0, numpy ile):<br>- `csm-golive-approval-success-toast`: 18.826 px fark, bbox x799–1180, y1159–1274.<br>- `csm-phase6-riskdialog-reason-error-toast`: 8.642 px fark.<br>- Kenarlık rgb(214,221,230) (`--border`) → rgb(237,237,237) (Sonner gray4).<br>- Metin rgb(15,23,41) (`--foreground`) → rgb(23,23,23) (gray12).<br>- Alt gölge `shadow-lg` yerine Sonner gölgesi.<br>pixelmatch 0,1 iki ekran için de 0 raporladı. Etki: uygulamadaki 93 `toast(...)` çağrısının hepsi, ayrıca M-06 baseline ekranı `csm-phase6-riskdialog-reason-error-toast`. | `src/index.css`'te mevcut `[data-sonner-toaster]` bloğunun yanına **katmansız** bir v3 uyumluluk kuralı eklensin; ui dosyasına dokunulmasın. Örnek: `[data-sonner-toaster] [data-sonner-toast].toast { background-color: hsl(var(--background)); color: hsl(var(--foreground)); border-color: hsl(var(--border)); box-shadow: 0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1); }`. `description`, `actionButton` ve `cancelButton` sınıfları bugün kullanılmıyor ama aynı sebeple ezilir; eşdeğerlenmeleri önerilir. Diğer yol `sonner.tsx`'te `!` soneki; bu D3 istisnasının dışında kalır, Murat'ın kararı gerekir. |
| REV-02 | Medium | ADR-0006 K5, plan AC12/AC13, AC12 kanıt kuralı | `docs/changes/chore_f0-03a-upgrades.md:27,290,297` | Not "Ekran ve akış davranışı: değişiklik yok" diyor; iki toast ekranı için de "0 px" yazıyor. Ama eşik 0 ile gerçek fark 18.826 ve 8.642 px (REV-01). Builder pixelmatch 0,1'in açık tonları saymadığını kendi notunda yazmış (`:412`), yine de tam-eşik ikinci geçişi yapmamış.<br>Eşik 0 ile sıfırdan büyük diğer çiftler:<br>- `manager-new-project-dialog`: 863 px; yalnızca 3 px'in deltası 30'u aşıyor, köşe/ring kenarı AA.<br>- `csm-tab-integrations`: 36 px.<br>- `csm-phase6-riskdialog-reason-field`: 11 px.<br>- `csm-insights-step-update-edit-dialog-status-open`: 2 px.<br>- `csm-tab-discovery-teams`: 186 px.<br>- `manager-reports`: 1.176 px.<br>Toast dışındakiler kenar AA'sı ya da recharts kenarı gibi görünüyor ama notta açıklaması yok. | L5b-A tablosuna eşik 0 (tam eşitlik) sütunu eklensin. Sıfırdan büyük her çift için bbox ve neden yazılsın. Denetim: K5 ve qa-verifier yöntemine renk farklarını yakalayan tam-eşik geçişi eklenmesi (M2). |
| REV-03 | Medium | Plan §6 (mockup-freeze), §10.1 recharts satırı | `src/pages/ManagementReport.tsx:134` | recharts 3'te `Tooltip` varsayılan olarak `itemSorter: 'name'` kullanıyor (`node_modules/recharts/lib/component/Tooltip.js:63`); v2'de varsayılan sıralama yok (`DefaultTooltipContent.js:55`). "CSM başına müşteri ve açık iş" grafiğinde hover tooltip'i v2'de "Müşteri, Açık iş" sırasındaydı, v3'te "Açık iş, Müşteri" oluyor (alfabetik, 'A' < 'M'). Legend için aynı tür değişiklik düzeltilmiş, Tooltip atlanmış. Durağan ekran görüntüsü hover göstermediği için L5b-A bunu göremez. "Gecikenler" grafiğinde (`:126`) alfabetik sıra bildirim sırasıyla aynı (Adım < Aksiyon), pasta tooltip'i tek öğeli; bu ikisi etkilenmiyor. | `:134` (tutarlılık için `:119` ve `:126` da) `<Tooltip … itemSorter={() => 0} />`. `TooltipItemSorter` fonksiyonu tip olarak geçerli (`types/component/DefaultTooltipContent.d.ts:36`); `null` tipte yok. Sıralama kararlı olduğu için bildirim sırası korunur. Notta §10.1 gerekçesiyle anılsın. |
| REV-04 | Low | Plan §2.3-3, mockup-freeze | `src/components/rq/KpiChart.tsx:11`, `src/pages/ManagementReport.tsx:115,123,131` | recharts 3'te `accessibilityLayer` varsayılan `true` (`lib/chart/CartesianChart.js:31`, `PolarChart.js:39`); v2'de `false`. 4 grafik artık Tab ile odaklanıyor (`tabIndex=0`). Notta (`:111`) bu "Hayır (görsel)" diye geçiyor, oysa klavye davranışı değişti. | Değişiklik notuna davranış farkı olarak yazılsın. Murat seçsin: a11y iyileştirmesi olarak kabul, ya da 4 grafiğe `accessibilityLayer={false}`. qa-verifier Tab sırasına ve tıklamadan sonra odak çerçevesi çıkıp çıkmadığına baksın. |
| REV-05 | Low | AC9 | `src/pages/ManagementReport.tsx:119,126,134` | `itemSorter={null}` tip olarak geçerli (`Legend.d.ts:70`: `LegendItemSorter \| null`). Ancak recharts belgesi sıralama olmadan sıranın render'lar arasında değişebileceğini söylüyor (`Legend.d.ts:62-67`). L5b-A yalnızca ilk render'ı kapsıyor. | qa-verifier dönem seçimini değiştirdikten sonra (`:89` Select) legend sırasını v2 ile karşılaştırsın. Kod değişikliği gerekmiyor. |
| REV-06 | Low | ADR-0006 K2 (3 uyumluluk kuralı), plan §10.1 | `src/index.css:139-166` | `space-x/y` kuralı (d), K2'nin saydığı üç kuralın dışında. Plan §10.1 sayfa düzeyinde düzeltme öngörüyordu; resmi Tailwind rehberi de `gap`'e geçmeyi öneriyor, uyumluluk parçacığı vermiyor. Teknik olarak doğru (aşağıdaki doğrulamaya bakınız). Ancak `--value(number)` yalnızca çıplak sayıları kapsıyor: ileride biri `space-y-px` ya da `space-y-[..]` yazarsa sessizce v4 davranışını alır. | Murat'ın açık kabulü gerekiyor; denetim ADR-0006 K2'ye (d) maddesini eklesin (M2). Builder `index.css` yorumuna "yalnızca sayısal değerler" notunu ekleyebilir. |

### Sapma doğrulama
| # | Sapma | Karar | Kanıt |
|---|---|---|---|
| 1 | `space-x/y` v3 uyumluluk kuralı (`index.css:139-166`) | **Kabul** (koşul: REV-06, Murat onayı) | **Çıktı:** `dist` CSS'te kural v3 seçicisinin aynısını üretiyor: `.space-y-4>:not([hidden])~:not([hidden]){margin-top:calc(var(--spacing) * 4);margin-bottom:0}`. Özgüllük (0,3,0), v3 ile aynı.<br>**Sıfırlama:** `:where(.space-y-N>:not(:last-child)):not(tw-never){margin-block-end:0}` (0,0,1), çekirdeğin (0,0,0) `:where(...)` kuralını yeniyor, herhangi bir sınıfa (`mb-*`, 0,1,0) yeniliyor. Sonuç v3'le aynı: v3 ilk çocuğun `mb-*`'ına dokunmuyor, sonraki çocuklarda `margin-bottom:0` uyguluyordu; branch da öyle. Özel kural çekirdekten önce basılıyor (ofset 11304'e karşı 19530); yorum doğru.<br>**Kapsam:** src'deki 172 kullanımın hepsi sayısal (0, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8; `sm:` varyantları dahil). `sm:space-x-2`, `sm:space-y-0` ve `sm:space-x-4` media query içinde doğru üretiliyor.<br>**Resmi öneri:** Rehber yalnızca flex/grid `gap` öneriyor (eşdeğer uyumluluk parçacığı yok). Bu bir sapma, ama `gap` satır kutusu yüksekliğini değiştirdiği için builder'ın gerekçesi geçerli.<br>**Yan etki:** v4'ün performans için kaldırdığı `~` seçicisi geri geliyor; bu uygulamada önemsiz. Varsayılan rengi değişen `divide-y` tek yerde var (`Overview.tsx:127`, blok `li`), piksel eşit. |
| 2 | `Badges.tsx` `bg-success/12` kaldırıldı | **Kabul** | **v3:** Opaklık ölçeği 5'in katları; 12 yok. main `dist` CSS'inde `bg-success\/12` 0 kez geçiyor, yani sınıf hiç CSS üretmiyordu.<br>**v4:** `--color-success: hsl(var(--success))` (`@theme inline`) ile `color-mix(in oklab, … 12%, transparent)` üretecekti; color-mix desteklemeyen tarayıcıda opak `hsl(var(--success))` geri dönüşü var (aynı desen `bg-warning/15` çıktısında görülüyor).<br>**Kaldırmanın etkisi:** v3 çıktısıyla birebir aynı. `Pill` (`Badges.tsx:17`) başka bir bg sınıfı taşımıyor, twMerge etkileşimi yok.<br>**Benzer başka sınıf:** src'de 5'in katı olmayan başka opaklık değiştiricisi yok. main ile branch CSS'lerinin sınıf kümesi karşılaştırmasında, codemod yeniden adlandırmaları dışında yeni etkinleşen sınıf yok. |
| 3 | `ManagementReport.tsx` `itemSorter={null}` | **Kabul (Legend için)**, eksik: REV-03 | **Legend:** Tip geçerli (`Legend.d.ts:70`). v3 varsayılanı `'value'` (`Legend.js:183`, alfabetik); `null` verilince sıralamasız kalıyor (`legendSelectors.js:18`), bu da v2'deki çocuk/veri sırasına denk. Builder'ın ara koşusu: %0,071 → %0,0089. Plan §10.1 "yalnızca prop ile eski sıraya dönülür" maddesi bu sapmayı kapsıyor.<br>**Eksik kalan:** Aynı tür varsayılan değişiklik Tooltip'te de var (`'name'`) ve düzeltilmemiş (REV-03). Kararlılık uyarısı REV-05'te. |
| 4 | `npm install --prefer-dedupe` | **Kabul** | **Radix:** main ve branch lock'unda 54 `@radix-ui/*` girdisi birebir aynı (diff boş), iç içe Radix kopyası 0.<br>**Ağaç:** `npm ls --depth=0` ve `npm ls --all` exit 0; yalnızca platforma özgü UNMET OPTIONAL girdiler var.<br>**Yasaklar:** `package.json`'da overrides/resolutions yok, `.npmrc` yok.<br>**Peer kontrolü:** Bayrak yalnızca paketlerin nereye yerleşeceğini etkiliyor, peer doğrulamasını kapatmıyor; ERESOLVE görünür kalıyor (notta Vitest 3 + Vite 8 ERESOLVE'u kayıtlı).<br>**Tekrar üretilebilirlik:** `npm ci` lock'u birebir kurar, lock nasıl üretilmiş olursa olsun. Linux binding'leri lock'ta.<br>**Audit:** `npm audit` → 0 açık, `--omit=dev --audit-level=high` exit 0 (bu gate'te koştum).<br>**Risk (Low, bulgu değil):** Bayraksız yapılacak bir sonraki `npm install` Radix'i yeniden bölebilir. F0-03b notuna yazılsın. |
| 5 | Codemod sonrası elle düzeltmeler | **Kabul**, ama codemod'un kapsamadığı bir v4 farkı var: REV-01 | **Elle düzeltmeler (doğru):**<br>- `border-(--color-border)` → `border-color:var(--color-border)`, v3 `border-[--color-border]` ile aynı. Codemod'un `border-border` önerisi yanlıştı; builder bunu doğru düzeltmiş.<br>- `outline-hidden` = v3 `outline-none` (2px transparent + offset) artı forced-colors.<br>- `data-disabled`, `has-disabled` ve `data-active` aynı seçicileri üretiyor.<br>- `shadow-xs` (0 1px 2px 0 /.05) ve `backdrop-blur-sm` (8px) v3 değerleriyle aynı.<br>- `rounded-sm` iki build'de de `calc(var(--radius) - 4px)`. Tema `sm`'yi ezdiği için codemod yeniden adlandırmamış, doğru. Çıplak `rounded`/`shadow`/`ring`/`blur` kalmadı.<br>- Sidebar `--spacing(4)` → `calc(var(--sidebar-width-icon) + (calc(var(--spacing) * 4)))`, v3'teki `+ 1rem` ile aynı.<br>- `-left-(--sidebar-width)` → `calc(var(--sidebar-width) * -1)`.<br>- `PageHeader`, `pagination` ve `workspaces.test.ts` geri alınmış: diff boş, `outline-solid`/`ring-3` grep'i 0.<br>**Uyumluluk kuralları:** Kenarlık (a) ve imleç (c) resmi parçacıklarla birebir. Placeholder (b) `#9ca3af`, resmi `var(--color-gray-400)`'ten daha sadık. `:root`/`.dark` satırları değişmemiş (tek hunk, yalnızca ekleme).<br>**`hidden` özniteliği:** Yalnızca `sidebar.tsx:471`'de var; TooltipContent'te display sınıfı yok, etkisiz.<br>**ring varsayılan rengi:** v3 blue-500/50 → v4 currentColor. Yalnızca `toast.tsx:70` (Radix toast kapatma, `focus:ring-2`) etkilenir; Radix `toast()` ui dışında hiç çağrılmıyor, ulaşılamaz.<br>**Kaçan fark:** Cascade layers × katmansız Sonner CSS (REV-01). |
| 6 | L5b-A çekiminin MCP yerine betikle yapılması | **Kabul** (yalnızca builder öz-kontrolü olarak) | Plan §8.1 ve ADR-0006 K5'e göre kabul kanıtı qa-verifier'ın MCP koşusu; builder koşusu kabul yerine geçmiyor. Betik tekrar üretilebilirliği artırıyor ve artefaktlar tutarlı (`l5b-final.tsv` notla aynı, before/after 38'er dosya).<br>**Kanıt değeri sınırlı:** Aynı eşik (0,1) REV-01'i kaçırdı. qa-verifier tam-eşik geçişi de yapmalı (REV-02).<br>**AC13 için uyarı:** `csm-phase00-handover-workspace` (1284 / baseline 2277) ve `csm-my-work` boyutları baseline'dan farklı. qa-verifier AC13'ü baseline'ın çekim yöntemiyle yapmalı. |

### Kontrol listesi özeti
- **A. Invariant'lar:** Backend yok; INV-01…05, 15…18 ve 21…24 uygulanmaz.
  - INV-13: `src`'de date-fns veya `@date-fns/tz` importu yok (AC11 grep'i boş).
  - INV-14: `grep -rli supabase dist/` boş.
  - INV-19 ve INV-20: etkilenmiyor.
  - INV-12 ve INV-25…27: AC-NEG1 diff'i 0 satır.
- **B, C, D, G:** Uygulanmaz (endpoint, migration ve modül bağlama yok).
- **E. Web kalitesi:**
  - `components/ui` değişiklikleri D3 kapsamında: codemod çıktısı, `calendar.tsx` rdp 9 eşlemesi ve `chart.tsx` tipleri. Eşleme doğru: `month_caption`, `button_previous/next`, `month_grid`, `weekday(s)`, `week`, `day`/`day_button`, `Chevron`.
  - `chart.tsx:171` `as React.Key | undefined` ve `Partial<Pick<TooltipContentProps…>>` yalnızca tip; çalışma zamanı ifadesi eklemiyor.
  - Yeni `any`, `@ts-*`, `eslint-disable`, `.skip/.only/.todo` yok (diff grep'i boş).
- **F. Güvenlik:**
  - `npm audit` 0.
  - `npm ls xlsx --all` boş.
- **AC durumu:**
  - **Diff ile doğruladığım ve karşılananlar:** AC1 (`npm ls`), AC2, AC5, AC6, AC7 (gerekçeli sapmalarla), AC8 grep kısmı (`react-router-dom` 0; `future` `583d5db`'de eklenip `96982a3`'te kaldırılmış), AC11, AC15 (metin plan §4 ile birebir, yalnızca `:315`, commit'te `[REV2-01]`), AC16 (7 ui uyarısı düştü), AC-NEG1, AC-NEG2, AC-NEG3 (xlsx/supabase).
  - **Karşılanmayan:** AC13, iki toast ekranında (REV-01).
  - **qa-verifier'a kalanlar:** AC9, AC10, AC12, AC14 ve L6.
- **Test değişiklikleri:** 7 test dosyasında yalnızca import satırı değişmiş; `setup.ts`'te `jest-dom/vitest` (Vitest API). Assertion değişmemiş.
- **eslint:** `react-refresh/only-export-components: "off"` yalnızca `src/components/ui/**` override'ında. Gerekçe: dosyalar elle değiştirilmiyor ve `*Variants` export'ları shadcn deseni (F0-02 §14 (a)).
- **tsconfig:**
  - `tsconfig.node.json`'a `vitest.config.ts` eklendi.
  - `tsconfig.app.json`'a `types: [..., "node"]` eklendi. Vitest 3'teki dolaylı `@types/node` ile denk, main'e göre gerileme yok (Öneriler'de zaten var).
- **Commit'ler:**
  - 12 commit Conventional Commits biçiminde, sırası §2.3'e uygun.
  - 6 ve 7 birleşik; D9 ERESOLVE gerekçesi notta.
  - Commit başına dosya listesi plan tablosuyla tutarlı; React 19 commit'inde kaynak değişikliği yok.
- **Değişiklik notu:**
  - Eksiksiz; 9 sapma maddesi var (Murat'ın 6 maddesi bunların #1–#6'sı).
  - Yanlış satırlar: `:27`, `:290` ve `:297` (REV-02).

### Düzeltme direktifi
1. **REV-01:**
   - `src/index.css`'te `[data-sonner-toaster]` bloğunun (`:276`) yanına, `@layer` dışında kalacak şekilde bir v3 uyumluluk kuralı ekle. Toast kökü için `background-color: hsl(var(--background))`, `color: hsl(var(--foreground))`, `border-color: hsl(var(--border))` ve v3 `shadow-lg` değeri. Kısa bir yorum yaz: "Tailwind 4 utility'leri katmanlı; Sonner'ın eklediği katmansız CSS `ui/sonner.tsx` classNames'ini eziyor".
   - `description`, `actionButton` ve `cancelButton` için de v3 değerlerini eşdeğerle. `ui/sonner.tsx`'e dokunma; o yol D3 dışında, Murat'a sorulur.
   - Test: iki toast ekranı (`csm-golive-approval-success-toast`, `csm-phase6-riskdialog-reason-error-toast`) için L5b-A çiftini tam eşikle (0) yeniden karşılaştır; toast bbox'ında 0 px olmalı. DevTools'ta computed `border-color` rgb(214,221,230), `color` rgb(15,23,41) olmalı.
   - Commit: `fix(css): restore v3 sonner toast styles under Tailwind 4 layers [REV-01]`.
2. **REV-03:**
   - `src/pages/ManagementReport.tsx:134` (tutarlılık için `:119` ve `:126`) `Tooltip`'e `itemSorter={() => 0}` ekle.
   - Notun "Açık sorular" bölümünde §10.1 gerekçesiyle an.
   - Test: main ve branch'te "CSM başına müşteri ve açık iş" çubuğunda hover; tooltip sırası "Müşteri, Açık iş" olmalı.
   - Commit: `fix(reports): keep recharts 2 tooltip item order [REV-03]`.
3. **REV-02:**
   - Değişiklik notunun L5b-A tablosuna eşik 0 sütunu ekle; sıfırdan büyük her çift için bbox ve neden yaz.
   - `:27`'deki "değişiklik yok" ifadesini düzeltmeden sonraki gerçek durumla güncelle.
   - Commit: `docs: add exact-diff column to L5b-A table [REV-02]`.
4. **REV-04:**
   - Notun Breaking change tablosunda `:111` satırını "klavye odak davranışı değişti" diye düzelt.
   - Murat'ın kararını "Açık sorular"a yaz. `accessibilityLayer={false}` ancak Murat seçerse eklenir.
5. **REV-05:** Kod değişikliği yok. qa-verifier dönem değişiminden sonra legend sırasını doğrulasın.
6. **REV-06:** `index.css:139` yorumuna "yalnızca sayısal değerler (`--value(number)`)" notunu ekle. ADR-0006 K2'ye (d) maddesinin eklenmesi denetimin işi (M2).

### Açık sorular / öneriler (engelleyici değil)
- **qa-verifier'a:**
  - L5b-A'ya eşik 0 ikinci geçişi eklensin (REV-02).
  - REV-03, REV-04 ve REV-05 hover, Tab ve dönem değişimi adımlarıyla kontrol edilsin.
  - AC13 baseline'ın çekim yöntemiyle yapılsın (handover ve my-work boyut farkları).
- **Murat'a:**
  - REV-06'yı kabul ya da sayfa düzeyi düzeltme olarak karara bağla.
  - REV-04'te `accessibilityLayer` için a11y kazanımı mı, dondurulmuş davranış mı?
  - REV-01 düzeltmesi için `ui/sonner.tsx` yolunu seçersen D3 istisnasının genişletilmesi gerekir.
- **F0-03b notu:** `--prefer-dedupe` ile kurulmuş bir lock var; bayraksız yapılacak `npm install` Radix'i yeniden bölebilir. AC2 `.npmrc`'yi yasakladığı için kurulum talimatına yazılsın.
- **F0-06 notu:** Kalıcı görsel betik eşik 0 ve bbox raporu içersin. Sonner/Radix gibi katmansız üçüncü taraf CSS'i Tailwind 4'te utility'leri ezer; regresyon setine toast ekranları girsin.
- **Bulgu değil:** `toast.tsx:70` Radix toast kapatma düğmesindeki `focus:ring-2`'nin rengi v4'te currentColor'a döndü. Radix `toast()` hiç çağrılmadığı için ulaşılamaz.

Bu gate'te kullanılan dosyalar:
- `.verify/chore_f0-03a-upgrades/src/index.css`
- `.verify/chore_f0-03a-upgrades/src/components/ui/sonner.tsx`
- `.verify/chore_f0-03a-upgrades/src/pages/ManagementReport.tsx`
- `.verify/chore_f0-03a-upgrades/src/components/rq/KpiChart.tsx`
- `.verify/chore_f0-03a-upgrades/dist/assets/index-CgNYKflT.css`
- `.verify/main-f0-03a/dist/assets/index-CjfMyXEl.css`
- `.verify/screens/f0-03a/{before,after}/`
- `.verify/chore_f0-03a-upgrades/docs/changes/chore_f0-03a-upgrades.md`
