# Gate Özeti — chore/f0-03a-upgrades @ 9ace149 (round 2)

Tarih: 2026-10-09 · Kapsam: `9b99ede..9ace149` (7 commit: 79531b6, 33f74a3, cf9f304, f573ea2, a6f46d8, db255a0, 9ace149) · Dosyalar: `src/index.css`, `src/components/rq/KpiChart.tsx`, `src/pages/ManagementReport.tsx`, `docs/changes/chore_f0-03a-upgrades.md` · Raporlar: `reviewer-r2.md`, `qa-verifier-r2.md`, kanıt `screens/r2/`

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 0 | 5 (REV2-01 … REV2-05) |
| qa-verifier | APPROVE (komut kanıtları tablosu var, PASS satırları alıntılı; yöntem sapması QA2-04, aşağıda) | 0 | 0 | 0 | 0 + 4 Info |
| rules-reviewer | Çalıştırılmadı: round 2 kaynak farkında tetikleyici yol/anahtar kelime yok (eşleşmeler yalnızca değişiklik notunda) | | | | |
| CI (app / parity / secrets) | **Yeşil (Murat beyanı)**: run #65 @ 9ace149, app ✔, check-migrations ✔, secrets ✔, parity atlandı (F0, `migrations/` yok). Murat ekran görüntüsüyle doğruladı; `gh` yerelde yok, gate bağımsız okumadı | | | | |

**Genel karar:** MERGE'E HAZIR, ancak QA2-04'teki yöntem sapmasını Murat'ın kabul etmesi gerekiyor.

Round 1'in 5 direktif maddesi kapandı; kanıtlar iki gate'te bağımsız:
- **REV-01 / QA-01 (sonner toast):** Kural build CSS'inde `@layer` dışında. Beş toast'ta computed bg, border, color ve description rengi main ile aynı. Toast bbox'larında eşik 0'da 0 px; buna AC14 Go-Live çifti ve üst üste binmeyen kare de dahil.
- **REV-03 / QA-03 (tooltip sırası):** CSM, Gecikenler, Pie ve KPI hover'ı main ile aynı. Gecikenler round 1'de doğrulanamamıştı, bu turda doğrulandı.
- **QA-02 / REV-04 (karar a):** `role=application` sayısı 0. Tab sırası main ile birebir (45/45 ve 60/60). Tıklamada odak çerçevesi yok.
- **REV-02:** L5b-A tablosuna eşik 0 sütunu eklendi.
- **REV-06:** K2 (d) yorumu eklendi.
- **L5b-A tekrarı (qa-verifier'ın kendi koşusu):** 38 çiftte eşik 0,1'de en kötü sonuç `manager-reports` 272 px (%0,01; recharts 3 çubuk kenarında alt-piksel fark). Eşik 0'da her farkın bbox'ı ve nedeni var (logo ±1 kanal, diyalog gölgesi, recharts AA). D4 aşımı yok.

**Direktif dışı a6f46d8 (`.recharts-wrapper [class*="recharts-zIndex-layer_"]:focus { outline: none }`): kabul, Murat'ın QA-02 (a) "fare esaslı kullanım" kararı kapsamında.**
- recharts 3 `ZIndexPortal`, `accessibilityLayer={false}` olsa bile her katmanı koşulsuz `<g tabIndex={-1}>` olarak çiziyor.
- qa-verifier kuralı `deleteRule` ile devre dışı bıraktı. Sonuç: KpiChart tıklamasında mavi `auto 5px` çerçeve çıkıyor (739 px fark). Kural etkinken main ile fark 4 px (AA).
- Yani yalnızca prop ile main davranışına dönülemiyor; kural direktif 3'ün beklentisini tamamlıyor.
- Kapsamı dar: yalnızca `tabindex=-1` katmanlarını etkiliyor, Tab sırası main ile birebir, grafik dışında hiçbir odak göstergesini gizlemiyor.
- Koşul: REV2-04 takibi. Kural recharts'ın iç sınıf adına dayanıyor; recharts yükseltmesinde sessizce etkisiz kalabilir. ADR-0006 K2 (e) kaydı açılmalı ve F0-06 regresyonuna tıklama adımı eklenmeli.

**Yöntem sapması (QA2-04), Murat'ın kararı gerekiyor:**
- Murat'ın talimatı "§8.1 A setini Playwright MCP ile kendisi koşsun" idi. qa-verifier A setini (38 çift + 4 ek toast çifti) ve computed stil, Tab ve tıklama ölçümlerini **kendi yazdığı `playwright-core` betikleriyle** koştu: aynı Chromium, `animations:'disabled'`, betikler builder'ınkinden bağımsız.
- MCP yalnızca tooltip hover'ı ve KpiChart tıklaması için kullanıldı.
- Gerekçe: ajan tanımındaki MCP araç listesinde `browser_evaluate` yok. Bu, computed stil ve DOM ölçümleri için geçerli bir gerekçe. Ekran çekimi ise `browser_take_screenshot` ile MCP üzerinden de yapılabilirdi.
- Talimatın asıl amacı karşılandı: kabul kanıtı builder'ın betiği değil, qa-verifier'ın kendi bağımsız çekimi. Harfiyen karşılanmadı.
- Murat sapmayı kabul ederse karar MERGE'E HAZIR. MCP koşusunda ısrar ederse karar DOĞRULANAMADI olur ve A seti MCP ile yeniden çekilir.
- Kit önerisi (Murat isterse, denetim rolü): `.claude/agents/qa-verifier.md` araç listesine `mcp__playwright__browser_evaluate` eklenmeli. Eklenirse bu sapma bir daha gerekmez.

## Düzeltme direktifi (round 2)
Engelleyici bulgu yok. Aşağıdakiler isteğe bağlı Low düzeltmelerdir; merge'den önce tek commit'te ya da F0-03b'nin ilk dokunuşunda yapılabilir:
1. **REV2-01:** `docs/changes/chore_f0-03a-upgrades.md:465`
   - "description/action/cancel bugün kullanılmıyor" yerine "description `HandoverWorkspace.tsx:72`'de kullanılıyor; action/cancel kullanılmıyor" yaz. qa-verifier description rengini main ile aynı ölçtü.
   - "betik L5b-A bölümünde" yerine katman kontrolünün tarifini yaz: build CSS'inde seçicilerin `@layer` blok derinliği 0.
2. **REV2-02:** `src/index.css:288-289` ve not `:465`
   - "sonner's `<style>` is appended after this file" ifadesini "production'da sonra, dev'de önce; sıra v3 ile aynı" diye netleştir.
3. **REV2-03:** `docs/changes/chore_f0-03a-upgrades.md:356,371`
   - KPI hover satırı builder betiğinde `kpiTooltipOnHover: null` çıkıyor. Satırı qa-verifier r2 ölçümüyle değiştir (`25.09.2026 / Değer : 40 %`, iki tarafta aynı; veri tarihe bağlı) ya da "betik yakalayamadı" diye düzelt.
4. Commit: `docs: clarify sonner/recharts compat notes [REV2-01][REV2-02][REV2-03]`.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki 'Review düzeltmeleri' tablosunu güncelle ve push et.

## Murat / denetim işleri (round 2)
- **QA2-04:** Yöntem sapmasını kabul et ya da A setinin MCP ile yeniden koşulmasını iste. Kit için önerilen değişiklik: qa-verifier araç listesine `browser_evaluate`.
- **REV2-04 (M2):** ADR-0006 K2 (e) kaydını aç. İçeriği: katmansız 3. taraf CSS × Tailwind 4 `@layer` (Sonner) ve recharts 3 zIndex odak kuralı. F0-06 regresyon setine şunlar eklensin: grafik tıklaması → çerçeve yok; toast ekranları (description'lı handover toast'ı dahil); build CSS'inde Sonner seçicilerinin `@layer` dışında kaldığını sınayan kontrol.
- **REV2-05:** Bundan sonra not güncellemeleri ilgili düzeltme commit'ine girsin ya da toplu commit tüm ID'leri taşısın.
- QA2-01 … QA2-03 Info: işlem gerekmez (ayrıntı `qa-verifier-r2.md`'de).

---

# Gate Özeti — chore/f0-03a-upgrades @ 0ccd22c (round 1)

Tarih: 2026-10-09 · Kapsam: `269bf44..0ccd22c` (12 commit: 7b130a1 … 0ccd22c) · Plan: `docs/plans/F0-03a-stack-upgrades.md` · Değişiklik notu: `docs/changes/chore_f0-03a-upgrades.md`

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | CHANGES_REQUESTED | 0 | 1 (REV-01) | 2 (REV-02, REV-03) | 3 (REV-04, REV-05, REV-06) |
| qa-verifier | CHANGES_REQUESTED (komut kanıtları tablosu var, PASS satırları alıntılı; Playwright MCP ile kendi L5b-A/B çekimi) | 0 | 1 (QA-01) | 2 (QA-02, QA-03 tooltip) | 3 (QA-04, QA-05, QA-06) + 3 Info |
| rules-reviewer | Çalıştırılmadı: tetikleyici yok (AC-NEG1 diff'i 0 satır, reviewer ve qa-verifier bağımsız doğruladı; tek anahtar kelime eşleşmesi CSS `cursor:` özelliği; insight/entegrasyon/rapor dosyalarında yalnızca import yolu ve `itemSorter`) | | | | |
| CI (app / parity / secrets) | **Okunamadı.** `gh` yerelde yok; Murat'ın notundaki CI alanı doldurulmamış. Parity: F0, `migrations/` yok, atlanır. Lock'ta Linux native binding'leri var (reviewer) | | | | |

**Genel karar:** DÜZELTME GEREKLİ

İki gate de CHANGES_REQUESTED. Asıl bulgu (REV-01 = QA-01): Tailwind 4 utility'leri `@layer` içinde; Sonner'ın çalışma anında eklediği katmansız CSS `ui/sonner.tsx` classNames'ini eziyor. Uygulamadaki tüm toast'ların kenarlık, metin rengi ve gölgesi değişti. Builder'ın pixelmatch 0,1 kontrolü bunu gizledi. Eşik 0'da fark 19.451 px ve 8.665 px; Go-Live onay toast çifti 0,1'de bile %0,11 ile D4 eşiğini aşıyor. AC12 ve AC13 FAIL. CI sonucu bir sonraki gate turunda Murat'tan alınmalı (F0-02 emsali).

**Murat'ın 6 sapması — bağımsız doğrulama:**

| # | Sapma | Sonuç |
|---|---|---|
| 1 | `space-x/y` v3 uyumluluk kuralı | **Kabul**: üretilen seçici ve özgüllük v3 ile aynı, 172 kullanımın hepsi sayısal, piksel eşit. Murat kabul etti (2026-10-09) → ADR-0006 K2 (d) eklendi; `--value(number)` sınırı yorumda yazılacak (REV-06) |
| 2 | `Badges.tsx` `bg-success/12` kaldırıldı | **Kabul**: v3'te sınıf hiç CSS üretmiyordu; kaldırmak v3 çıktısıyla birebir, rozetler 0 px |
| 3 | `ManagementReport.tsx` `itemSorter={null}` | **Legend için kabul**: legend sırası iki tarafta aynı, dönem değişince de (QA-04). **Eksik:** Tooltip'te de aynı varsayılan değişikliği var, düzeltilmemiş (REV-03 / QA-03 tooltip) |
| 4 | `npm install --prefer-dedupe` | **Kabul**: 54 Radix girdisi lock'ta birebir aynı, `npm ci` + `npm ls` exit 0, overrides/`.npmrc` yok, audit 0 |
| 5 | Codemod sonrası elle düzeltmeler | **Kabul**: tek tek doğru (`border-(--color-border)`, `outline-hidden`, `data-disabled`, `shadow-xs`, `rounded-sm`, sidebar `--spacing`). Ama codemod'un kapsamadığı cascade-layer farkı kaçmış (REV-01) |
| 6 | L5b-A'nın betikle çekilmesi | **Yalnızca builder öz-kontrolü olarak kabul**: kabul kanıtı qa-verifier'ın MCP koşusu. Betik REV-01'i 0,1 eşiği yüzünden kaçırdı; notun "38/38 0 px" iddiası eşik 0'da tutmuyor (REV-02) |

## Düzeltme direktifi

1. **[High] REV-01 + QA-01 — Sonner toast stilini v3 görünümüne geri getir.**
   - Dosya: `src/index.css` (mevcut `[data-sonner-toaster]` bloğunun yanı, ~`:276`). Kural **`@layer` dışında** olmalı. `ui/sonner.tsx`'e dokunma; `!` soneki yolu D3 istisnasının dışında kalır, Murat'a sorulur.
   - Beklenen: toast kökünde `background-color: hsl(var(--background))`, `color: hsl(var(--foreground))`, `border-color: hsl(var(--border))` ve v3 `shadow-lg` (`0 10px 15px -3px rgb(0 0 0 / .1), 0 4px 6px -4px rgb(0 0 0 / .1)`). Aynı nedenle ezilen `description`, `actionButton` ve `cancelButton` için de v3 değerleri. Kısa yorum: "Tailwind 4 utility'leri katmanlı; Sonner'ın eklediği katmansız CSS `ui/sonner.tsx` classNames'ini eziyor".
   - Test ve kanıt: `csm-golive-approval-success-toast` ve `csm-phase6-riskdialog-reason-error-toast` çiftleri main ↔ branch **eşik 0** ile karşılaştırılır; toast bbox'ında 0 px. Computed değerler: `border-color` rgb(214,221,230), `color` rgb(15,23,41). Mümkünse üretilen CSS'te bu kuralın `@layer` dışında olduğunu sınayan hafif bir kontrol (qa-verifier önerisi; L3 ya da build çıktısı grep'i, değişiklik notunda belirt).
   - Commit: `fix(css): restore v3 sonner toast styles under Tailwind 4 layers [REV-01][QA-01]`.
2. **[Medium] REV-03 + QA-03 (tooltip) — recharts 3 tooltip sırasını v2'ye eşitle.**
   - Dosya: `src/pages/ManagementReport.tsx:134` (tutarlılık için `:119`, `:126`). `Tooltip`'e `itemSorter={() => 0}` (fonksiyon tipi geçerli, `null` Tooltip tipinde yok).
   - Beklenen: "CSM başına müşteri ve açık iş" hover'ı `Deniz Uzun / Müşteri : 6 / Açık iş : 23` (main ile aynı). "Gecikenler" grafiğinde de sıra main ile aynı kalmalı (qa-verifier bunu doğrulayamadı).
   - Notun "Açık sorular" bölümünde plan §10.1 gerekçesiyle an.
   - Commit: `fix(reports): keep recharts 2 tooltip item order [REV-03][QA-03]`.
3. **[Medium] QA-02 + REV-04 — recharts 3 `accessibilityLayer` varsayılanı: grafikler Tab ile odaklanıyor, tıklamada odak çerçevesi ve tooltip çıkıyor.**
   - **Murat kararı (2026-10-09): (a) main davranışına dön.** Gerekçe: uygulama fare ile kullanım esaslı, erişilebilirlik öncelik değil (PHASES F9-04'e not düşüldü).
   - Dosyalar: `src/components/rq/KpiChart.tsx:11`, `src/pages/ManagementReport.tsx:115,123,131`. 4 grafik bileşenine (`LineChart`/`BarChart`/`PieChart` kökleri) `accessibilityLayer={false}` eklenir. `components/ui/chart.tsx`'e dokunulmaz.
   - Beklenen: `svg.recharts-surface[role=application][tabindex=0]` branch'te de eşleşmez; Tab grafiklere odaklanmaz; KpiChart'a tıklamak odak çerçevesi ve tooltip açmaz (main ile aynı). Hover tooltip'i çalışmaya devam eder.
   - Test: mevcut L3 testlerinde grafik render'ı varsa `role="application"` bulunmadığını sınayan bir assert eklenebilir; yoksa kanıt qa-verifier L6 (Tab + tıklama, main ↔ branch).
   - Değişiklik notu: Breaking change tablosundaki `:111` satırı "recharts 3 `accessibilityLayer` varsayılan `true` → `false` ile v2 davranışı korundu (Murat kararı)" diye düzeltilir; "Açık sorular"a karar ve gerekçe yazılır.
   - Commit: `fix(charts): disable recharts 3 accessibility layer to keep v2 behaviour [QA-02][REV-04]`.
4. **[Medium] REV-02 — Değişiklik notunun L5b-A kanıtı yanlış.**
   - Dosya: `docs/changes/chore_f0-03a-upgrades.md:27,290,297`.
   - Beklenen: L5b-A tablosuna eşik 0 sütunu eklenir; sıfırdan büyük her çift için bbox ve neden yazılır (saat metni, recharts kenarı, ±1 kanal AA, diyalog karesi; qa-verifier tablosu referans). `:27`'deki "Ekran ve akış davranışı: değişiklik yok" ifadesi, 1–3 düzeltmelerinden sonraki gerçek durumla güncellenir. Builder'ın betikle çekimi kalacaksa eşik 0 geçişi betiğe eklenir.
   - Commit: `docs: add exact-diff column to L5b-A table [REV-02]`.
5. **[Low, aynı turda yapılır] REV-06** — **Murat kararı (2026-10-09): `space-x/y` v3 uyumluluk kuralı kabul; ADR-0006 K2'ye (d) olarak eklendi (denetim).** Builder kuralı olduğu gibi bırakır; yalnızca `src/index.css:139` yorumuna "ADR-0006 K2 (d); yalnızca sayısal değerler (`--value(number)`); `space-*-px` / `space-*-[..]` v4 davranışını alır" notu eklenir. Değişiklik notunun "Açık sorular / sapmalar" 1. maddesine "Kabul edildi → ADR-0006 K2 (d)" yazılır.
   - Commit: `docs(css): reference ADR-0006 K2 (d) in space-x/y compat rule [REV-06]`.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki 'Review düzeltmeleri' tablosunu güncelle ve push et.

## Sonraki gate turu için
- CI: Murat `/gate` notunda düzeltme HEAD'i için `app` / `secrets` sonucunu (run numarasıyla) yazsın.
- qa-verifier: toast çiftleri eşik 0, tooltip hover sırası (iki grafik), Tab/tıklama odak davranışı main ile aynı (karar a), L5b-A tam set yeniden.

## Murat kararları (2026-10-09)
- **QA-02 / REV-04 → (a)** `accessibilityLayer={false}`; grafikler main davranışına döner. Gerekçe: uygulama fare ile kullanım esaslı, erişilebilirlik öncelik değil. PHASES F9-04'e "kapsam daraltılabilir" notu düşüldü; BACKLOG güncellendi.
- **REV-06 → kabul.** `space-x/y` v3 uyumluluk kuralı ADR-0006 K2'ye (d) olarak eklendi (sınır: yalnızca sayısal değerler).

## Murat / denetim işleri (builder dışı)
- ~~QA-02/REV-04 kararı~~ → verildi (yukarıda).
- ~~REV-06: ADR-0006 K2 (d)~~ → eklendi.
- F0-06: kalıcı görsel betik eşik 0 + bbox raporu içersin; regresyon setine toast ekranları girsin (katmansız 3. taraf CSS × Tailwind 4 `@layer`). ADR-0006 K5 / plan §8.1 yöntemine tam-eşik geçişi eklenmesi (M2).
- F0-03b: `--prefer-dedupe` ile üretilmiş lock var; bayraksız `npm install` Radix'i yeniden bölebilir, kurulum talimatına yazılsın.
- D12 (baseline 38): `csm-golive-approval-success-toast` baseline'a ancak REV-01 düzeldikten sonra ve iki toast'un üst üste binmediği bir kareyle eklenmeli (QA-06).
