## reviewer — chore/f0-03a-upgrades @ 9ace149 (round 2)
**Karar:** APPROVE

Kapsam: `git diff 9b99ede..9ace149`, 7 commit. Dokunulan dosyalar: `src/index.css` (+38), `src/components/rq/KpiChart.tsx` (1 satır), `src/pages/ManagementReport.tsx` (6 satır), `docs/changes/chore_f0-03a-upgrades.md`. `package.json`, lock ve `components/ui` round 2'de değişmedi. Bu turda Critical, High ve Medium bulgu yok; yalnızca 5 Low bulgu var.

**CI:** Kaynak Murat'ın beyanı ve ekran görüntüsüyle yaptığı doğrulama. Yerelde `gh` olmadığı için bağımsız doğrulanamadı. Run #65 (9ace149): `app` yeşil, `check-migrations` yeşil, `secrets` yeşil. `parity` atlandı çünkü `migrations/` yok; F0 için bu beklenen durum.

**Komutlar:**
- Nerede: Worktree'de `node_modules` yoktu. Rol tanımı paket kurmayı yasakladığı için `npm ci` koşulmadı. Bunun yerine ana çalışma kopyasında koşuldu: HEAD = `9ace149`, temiz, `package-lock.json` 9ace149 ile birebir, `npm ls`'te sonner 1.7.4, recharts 3.10.1, tailwindcss 4.3.3, vite 8.3.4.
- Build çıktısı scratchpad'e alındı (`vite build --outDir <scratchpad>/dist`). İki çalışma ağacı da temiz kaldı (`git status --short` boş).

| Komut | Exit | Çıktı |
|---|---|---|
| `npm run typecheck` | 0 | `tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json` (çıktısız) |
| `npm run lint` | 0 | `✖ 21 problems (0 errors, 21 warnings)` |
| `npm test` | 0 | `Test Files 13 passed (13)` · `Tests 213 passed (213)` |
| `vite build` | 0 | `index-CDN67-XW.css 86.70 kB │ gzip: 14.29 kB`, `index-LqGeOgQ3.js 1,313.28 kB`. Hash'ler nottaki (`:400-401`) ve qa-branch build'iyle aynı |
| Build CSS katman denetimi (scratchpad'de küme parantezi derinliğini sayan küçük betik) | — | 4 Sonner seçicisi ve recharts seçicisi `depth 0 parents=[]`, yani `@layer` dışında. Karşılaştırma: `.group-\[\.toaster\]\:bg-background:is(:where(.group).toaster *)` `depth 1 parents=["@layer utilities"]` |

### Round 1 bulgularının durumu
| ID | Durum | Kanıt |
|---|---|---|
| REV-01 / QA-01 (High) | **Kapandı** | 79531b6, aşağıda (1) |
| REV-02 (Medium) | **Kapandı** (küçük not tutarsızlığı: REV2-03) | db255a0, aşağıda (5) |
| REV-03 / QA-03 tooltip (Medium) | **Kapandı** | 33f74a3, aşağıda (2) |
| REV-04 / QA-02 (Low/Medium) | **Kapandı** (Murat kararı a) | cf9f304 + a6f46d8, aşağıda (3)(4) |
| REV-05 (Low) | **Kapandı** | Kod değişikliği yok. QA-04 tekrarlanmadı; builder'ın `behav-final/behav.json` dosyasında 3 legend sırası iki tarafta aynı |
| REV-06 (Low) | **Kapandı** | f573ea2: `src/index.css:147-148` yorumu, ADR-0006 K2 (d) metniyle uyumlu. Not, Açık sorular 4'te "Karar: Kabul edildi" |

### Kontrol sonuçları

**(1) Direktif 1: Sonner kuralları (`src/index.css:284-310`)**

*Katman ve değerler*
- Kurallar `@layer` dışında; kaynakta da build çıktısında da derinlik 0 (yukarıdaki tablo).
- Değerler main (v3) build'i `index-CjfMyXEl.css` ile birebir:

| Öğe | v3 değeri |
|---|---|
| Toast kökü | `background-color:hsl(var(--background))`, `color:hsl(var(--foreground))`, `border-color:hsl(var(--border))`, `shadow-lg` = `0 10px 15px -3px rgb(0 0 0/.1), 0 4px 6px -4px rgb(0 0 0/.1)` (v3'teki ring değişkenleri `0 0 #0000` olduğu için görsel olarak aynı) |
| description | `hsl(var(--muted-foreground))` |
| action | `hsl(var(--primary))` / `hsl(var(--primary-foreground))` |
| cancel | `hsl(var(--muted))` / `hsl(var(--muted-foreground))` |

*Hangi elemanlara uygulanıyor*
- Sonner markup'ında (`node_modules/sonner/dist/index.mjs`) li, `classNames.toast`'ı (`group toast …`) ve `data-sonner-toast`'ı birlikte taşıyor.
- `ol` öğesi `data-sonner-toaster` ve `className="toaster group"` taşıyor.
- description öğesi `data-description` taşıyor; düğmelerde `data-button` ile birlikte `data-action` ya da `data-cancel` var.
- Sonuç: yeni seçiciler v3 `group-[.toaster]` / `group-[.toast]` seçicileriyle aynı eleman kümesine denk geliyor.

*Özgüllük karşılaştırması (v3 `.group.toaster .group-\[…\]` ve yeni kurallar, ikisi de (0,3,0))*

| Sonner kuralı | Özgüllük | Sonuç |
|---|---|---|
| `:where([data-sonner-toast][data-styled='true'])` (bg / border / color / shadow) | 0 | v3'te de şimdi de uygulama kazanır |
| `:where([data-sonner-toast]:focus-visible)` | 0 | Aynı şekilde uygulama kazanır |
| `:where(...) :where([data-description])` | 0 | Aynı şekilde uygulama kazanır |
| `[data-sonner-toast][data-styled='true'] [data-button]` | (0,3,0) | Eşit özgüllük. Production'da Sonner'ın `<style>`'ı `head` sonuna ekleniyor (`wt()` → `t.appendChild`); build `index.html`'inde CSS bir `<link>`. Bu yüzden Sonner kazanır; v3'te de aynıydı. action/cancel uygulamada kullanılmıyor (grep: `action:` / `cancel:` toast opsiyonu yok) |
| `[data-rich-colors='true'][data-sonner-toast][data-type=…]` | (0,3,0) | Uygulamaya yansımıyor: `src`'de `richColors`, `unstyled` ve `invert` yok. Toast çağrıları 52 `toast.error`, 39 `toast.success`, 1 `toast.info`; `data-type` yalnızca ikonu etkiliyor. Sonner'daki tüm `data-type` renk kuralları `data-rich-colors='true'` ile kapsamlı. v3'te de şimdi de toast'lar tema renginde |
| `[data-sonner-toaster][data-theme=dark] …` | — | Yalnızca değişken tanımlıyor ya da close button'a uygulanıyor (closeButton kapalı). `next-themes` ThemeProvider'ı yok; `theme="system"` olduğu için işletim sistemi koyuysa `data-theme=dark` geliyor, ama bg/fg/border iki sürümde de uygulama kuralıyla eziliyor |

- Sonuç: v3 ile aynı.

*Başka bileşenlere etkisi*
- Seçicilerin hepsi `[data-sonner-toast].toast` kapsamında; Radix `ui/toast.tsx` ve diğer bileşenler etkilenmiyor.
- `index.css`'teki tek diğer katmansız Sonner kuralı (`:278`) yalnızca close-button değişkenlerini tanımlıyor.

*"@layer dışında" kontrolü*
- Not `:403`'te sonuç yazılı ve reviewer bağımsız olarak doğruladı.
- Kontrol kalıcı bir test değil, betik de notta yok (REV2-01).

**(2) Direktif 2: `Tooltip itemSorter={() => 0}` (`ManagementReport.tsx:119,126,134`)**
- Tip geçerli: `TooltipItemSorter` fonksiyon dalı (`types/component/DefaultTooltipContent.d.ts:36`), typecheck exit 0.
- Çalışma zamanında `lodashLikeSortBy` → `es-toolkit/compat/sortBy` → `orderBy` (`DefaultTooltipContent.js:53-58`). Bu fonksiyon anahtar fonksiyonu kullanıyor; tüm anahtarlar 0 olduğu için karşılaştırıcı her zaman 0 döner. `Array.prototype.sort` ES2019'dan beri kararlı, dolayısıyla payload sırası korunur.
- `null` Tooltip tipinde yok; `undefined` verilirse varsayılan `'name'` devreye girer (`Tooltip.js:63`). Seçilen yol doğru.
- `itemSorter` Tooltip'in `useEffect` bağımlılıklarında ya da store'da yok (`Tooltip.js:114-122`). Satır içi fonksiyon her render'da yeniden dispatch üretmiyor.
- PieChart'ta tooltip tek öğeli; prop zararsız ve tutarlılık sağlıyor.

**(3) Direktif 3: `accessibilityLayer={false}`**
- 4 kökte var: `KpiChart.tsx:11`, `ManagementReport.tsx:115,123,131`.
- `src`'de başka recharts kökü yok. Grep: `LineChart|BarChart|PieChart|AreaChart|ComposedChart|RadarChart|ScatterChart|RadialBarChart|Treemap|FunnelChart|Sankey|SunburstChart`.
- `ChartContainer` yalnızca `ui/chart.tsx`'te tanımlı, kullanılmıyor.
- `components/ui/chart.tsx` round 2'de değişmedi (`git diff 9b99ede..9ace149 --stat -- src/components/ui` boş).

**(4) Direktif dışı a6f46d8 (`src/index.css:312-318`): koşullu kabul**
- **Kaynak:** recharts 3 `lib/zIndex/ZIndexPortal.js:34-38` her kayıtlı zIndex katmanı için koşulsuz `<g tabIndex={-1} className={"recharts-zIndex-layer_" + zIndex}>` render ediyor (kaynak yorumu: "should not be tabbable"). Bunu kapatan bir prop yok. `accessibilityLayer={false}` sonrasında bu katmanlar hâlâ tıklamayla odak alabiliyor.
- **Gereklilik:** Murat'ın kararı (a) ve direktif 3'ün beklentisi "tıklama odak çerçevesi açmaz (main ile aynı)". Yalnızca prop ile bu sağlanamıyor, kural gerekli. Kapsamı direktifin içinde.
- **Kapsam dar:**
  - `tabindex=-1` elemanlar Tab sırasına girmiyor, dolayısıyla klavye kullanıcısının ulaşabildiği bir odak göstergesi gizlenmiyor.
  - Seçici yalnızca `.recharts-wrapper` içindeki zIndex katmanlarına uygulanıyor; uygulamada `outline` / `focus` içeren başka katmansız kural yok.
  - Builder ölçümü (`behav-final/behav.json`): Tab durak sayısı main 4, branch 4.
- **Kırılganlık:** Sınıf adı hash'li değil, CSS modules değil; kaynakta düz string. Yine de recharts'ın iç sınıf adı; bir minor sürümde değişirse kural sessizce etkisiz kalır, sonuç yalnızca kozmetik (REV2-04).
- **Gerekçe:** Commit mesajında (body) ve notta `:358`, `:468` ile yazılmış. Görünmeyen fark (odak `body` yerine `g` katmanında kalıyor) açıkça belirtilmiş.
- **Koşul:** REV2-04'teki takip maddesi (F0-06 regresyon seti ya da ADR-0006 K2 kaydı).

**(5) Direktif 4: L5b-A tablosu**
- Eşik 0 sütunu, ham fark, bbox ve en büyük Δ eklenmiş (`docs/changes/…:282-326`). Sıfırdan büyük her satırda bbox ve neden var: care-overview, csm-tab-access-credentials, csm-tab-discovery-teams, manager-new-project-dialog, manager-reports, ayrıca ham farklı 2 satır.
- Değerler builder artefaktı `.verify/screens/f0-03a-fix/final/l5b-final.tsv` ile tutarlı.
- `:27`'deki eski ifade `:29`'da güncellenmiş.
- Round 1 qa tablosundaki "±1 kanal" sayıları (MCP çekimi) builder'ın deterministik headless çekiminde 0 çıkıyor. Bu yöntem farkı; kabul kanıtı qa-verifier'ın koşusu.
- Tek tutarsızlık KPI hover satırı (REV2-03).
- "Review düzeltmeleri" tablosu (`:480-490`) doğru commit'leri gösteriyor: 79531b6, 33f74a3, cf9f304 + a6f46d8, db255a0, f573ea2.

**(6) Direktif 5:** Kapandı (yukarıda REV-06).

**(7) Commit kuralı**
- 5 düzeltme ayrı commit'lerde, mesajlarında bulgu ID'si var.
- 9ace149 (Review düzeltmeleri tablosu) ID'siz; kabul edilebilir.
- REV-01/03/04'ün not kısımları db255a0'a `[REV-02]` etiketiyle toplanmış (REV2-05).

**(8) Invariant'lar ve demo kuralları**
- Backend, store ve iş kuralı dokunuşu yok.
- Yeni paket yok; `components/ui` round 2'de değişmedi.
- rules-reviewer tetikleyicisi yok.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV2-01 | Low | Direktif 1 (kanıt), AC13 | `docs/changes/chore_f0-03a-upgrades.md:465`; `src/pages/project/workspaces/HandoverWorkspace.tsx:71-73` | Not "description/action/cancel bugün kullanılmıyor" diyor, ama `description` kullanılıyor. "Kurulum tipi kaydedildi" / "LLM tercihi kaydedildi" toast'ı, özet ve "Müşteri geçmişinde gör" bağlantısıyla `description` taşıyor. Yani `[data-description]` kuralı (`index.css:298`) gerçekten çalışıyor. Seçici analizine göre v3'le eşdeğer: v3 (0,3,0) muted-foreground, şimdi de (0,3,0) muted-foreground; Sonner'ın kuralı `:where`, özgüllüğü 0. Ancak bu toast L5b-A setinde yok, görsel olarak doğrulanmamış. Aynı satırdaki "betik L5b-A bölümünde" ifadesi karşılıksız: katman kontrol betiği notta yok, yalnızca sonucu `:403`'te var. | Notta ifadeyi "description `HandoverWorkspace.tsx:72`'de kullanılıyor; action/cancel kullanılmıyor" diye düzelt. Katman kontrolünün tek satırlık tarifini (ör. derinlik sayımı ya da grep) nota ekle. qa-verifier kurulum tipi değişikliği toast'ında description rengini main ile karşılaştırsın. |
| REV2-02 | Low | Kod yorumu doğruluğu | `src/index.css:288-289` | Yorumdaki "sonner's `<style>` is appended after this file" yalnızca production'da doğru: `<link>` head'de, Sonner `appendChild` ile sonra geliyor. Dev'de `main.tsx:2-3` önce `App`'i, dolayısıyla Sonner'ı yüklüyor, `index.css` sonra geliyor; Vite `updateStyle` (`vite/dist/client/client.mjs:1290-1295`) `<style>`'ı head sonuna ekliyor. Bu yüzden dev'de eşitlikte `index.css` kazanır. "ties resolve as in v3" sonucu iki modda da doğru, çünkü `main.tsx` sırası main'le aynı. Pratik etkisi yok: tek eşitlik olan action/cancel kullanılmıyor. | Yorumu "in production sonner's `<style>` comes after this file (dev: before); the order is unchanged from v3, so ties resolve as in v3" şeklinde netleştir. Not `:465` için de aynı düzeltme. Bir sonraki dokunuşta yapılabilir. |
| REV2-03 | Low | REV-02 (notun kanıtla tutarlılığı) | `docs/changes/chore_f0-03a-upgrades.md:356,371` | Not, KPI hover tooltip'ini iki tarafta `18.09.2026 / Değer : 25 %` diye "aynı" gösteriyor. Builder'ın kendi artefaktında (`.verify/screens/f0-03a-fix/behav-final/behav.json`, ayrıca `behav/behav.json`) `"kpiTooltipOnHover": null` var, main'de de branch'te de: betik KPI tooltip'ini yakalayamamış. Değer round 1 qa-verifier gözleminden geliyor. Davranış büyük olasılıkla doğru, ama satır builder'ın ölçümüyle desteklenmiyor. | Satırı "KPI hover tooltip'i: betik yakalayamadı (null); round 1 qa-verifier gözlemi `18.09.2026 / Değer : 25 %`" diye düzelt ya da betiği düzeltip yeniden ölç. qa-verifier bu turda KPI hover'ını doğrulasın. |
| REV2-04 | Low | ADR-0006 K2, plan §10.1 (recharts satırı) | `src/index.css:316` | `[class*="recharts-zIndex-layer_"]` recharts'ın iç sınıf adına dayanıyor (`ZIndexPortal.js:37`, kamuya açık API değil). recharts 3.x bir minor sürümde adı ya da `tabIndex={-1}`'i değiştirirse kural sessizce etkisiz kalır ve tıklama çerçevesi geri gelir. Görünür ama zararsız bir regresyon olur. ADR-0006 K2, uyumluluk kurallarını (a)–(d) diye sayıyor; katmansız Sonner kuralları ve bu recharts kuralı orada yok. | Denetim (M2): ADR-0006 K2'ye "(e) 3. taraf katmansız CSS × Tailwind 4 `@layer` uyumluluğu (Sonner) ve recharts 3 zIndex odak kuralı" kaydı eklensin. F0-06 regresyon setine "rapor grafiğine tıklama → odak çerçevesi yok" adımı ve toast ekranları girsin. recharts yükseltmelerinde bu kural kontrol listesine alınsın. |
| REV2-05 | Low | AGENTS §7 (bulgu ID'si commit'te) | `docs/changes/chore_f0-03a-upgrades.md:20-22,113-116,464-469` | Direktif 1–3, not güncellemesini (Açık sorular ve Breaking change satırı) ilgili düzeltme commit'iyle istiyordu. Bu not satırları db255a0'a `[REV-02]` etiketiyle toplanmış (commit gövdesinde "record … the round 1 fixes" yazıyor). İzlenebilirlik biraz zayıflıyor; içerik doğru. | Değişiklik gerekmiyor. Sonraki turlarda not güncellemesi ilgili düzeltme commit'ine girsin ya da toplu commit tüm ID'leri taşısın. |

### Düzeltme direktifi
Engelleyici bulgu yok. İsteğe bağlı küçük not ve yorum düzeltmeleri, merge'den önce ya da F0-03b'nin ilk dokunuşunda tek commit'te yapılabilir: `docs: clarify sonner/recharts compat notes [REV2-01][REV2-02][REV2-03]`.
1. **REV2-01:** `docs/changes/chore_f0-03a-upgrades.md:465`
   - "description/action/cancel bugün kullanılmıyor" ifadesini "description `HandoverWorkspace.tsx:72`'de kullanılıyor; action/cancel kullanılmıyor" diye düzelt.
   - "betik L5b-A bölümünde" yerine katman kontrolünün tarifini yaz (build CSS'inde seçicilerin `@layer` blok derinliği 0).
2. **REV2-02:** `src/index.css:288-289` ve not `:465`
   - "appended after this file" ifadesini "production'da sonra, dev'de önce; sıra v3 ile aynı" diye netleştir.
3. **REV2-03:** `docs/changes/chore_f0-03a-upgrades.md:356,371`
   - KPI hover satırını betik çıktısıyla (`kpiTooltipOnHover: null`) uyumlu hale getir ya da yeniden ölç.
4. **REV2-04:** Denetim işi (M2), builder değil.
   - ADR-0006 K2 (e) kaydı.
   - F0-06 regresyon adımları.

### Açık sorular / öneriler (engelleyici değil)
- **qa-verifier'a** (gate orkestratörü tarafından iletildi):
  - (a) Kurulum tipi ya da LLM tercihi değişikliği toast'ında (`description`'lı) description rengi main ile aynı mı (REV2-01).
  - (b) KPI hover tooltip'i (REV2-03).
  - (c) Rapor çubuk grafiğine tıklamada çerçeve yok; Tab ile grafiğe yeni durak eklenmemiş (a6f46d8).
- **F0-06:** Round 1'deki "katmansız 3. taraf CSS × Tailwind 4 `@layer`" notu geçerli. Bu turda yapılan derinlik kontrolü kalıcı bir L3 ya da build-grep kontrolüne çevrilebilir: Sonner seçicilerinin `@layer` dışında kaldığını sınar.
- Round 1'de reviewer da "description kullanılmıyor" demişti. Bu tespit yanlıştı, REV2-01 ile düzeltildi.

**Bu gate'te kullanılan dosyalar:**
- `.verify/chore_f0-03a-upgrades/src/index.css`, `src/pages/ManagementReport.tsx`, `src/components/rq/KpiChart.tsx`, `src/components/ui/sonner.tsx`, `src/pages/project/workspaces/HandoverWorkspace.tsx`, `docs/changes/chore_f0-03a-upgrades.md`
- `node_modules/sonner/dist/index.mjs`, `node_modules/sonner/dist/styles.css`
- `node_modules/recharts/lib/zIndex/ZIndexPortal.js`, `recharts/lib/component/DefaultTooltipContent.js`, `recharts/lib/component/Tooltip.js`
- `node_modules/es-toolkit/dist/compat/array/orderBy.js`
- `node_modules/vite/dist/client/client.mjs`
- `.verify/qa-main/dist/assets/index-CjfMyXEl.css` (v3 referansı, yalnızca okundu)
- `.verify/screens/f0-03a-fix/final/l5b-final.tsv`, `.verify/screens/f0-03a-fix/behav-final/behav.json`
- Reviewer'ın kendi build'i ve betiği (oturum scratchpad'i, commit edilmedi): `dist/assets/index-CDN67-XW.css`, `layer.mjs`
