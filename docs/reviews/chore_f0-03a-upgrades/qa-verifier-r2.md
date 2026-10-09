# qa-verifier ROUND 2 — chore/f0-03a-upgrades @ 9ace149

**Karar: APPROVE**

Şiddet: Critical 0 · High 0 · Medium 0 · Low 0 · Info 4

Baz: origin/main @ 269bf44 (`.verify/qa-main`) ↔ branch 9ace149 (`.verify/qa-branch`). İkisi de production build + `vite preview` (portlar 8100–8105 main, 8110–8115 branch). İş bitince preview sunucuları kapatıldı (curl → 000) ve iki worktree `git worktree remove --force` ile kaldırıldı. Kaynak, test ve paket dosyalarına yazılmadı. `docs/reviews/.../screens/r2/` altına yalnızca kanıt görselleri ve `pixelmatch-table.txt` eklendi.

**CI kaynağı (Murat beyanı, qa-verifier okumadı):** run #65 (9ace149): app yeşil, check-migrations yeşil, secrets yeşil, parity atlandı (migration yok, F0). Murat ekran görüntüsüyle doğruladı. `gh` yerelde yok, bağımsız doğrulama yok. AC-NEG4 bu beyana dayanıyor.

**Yöntem sapması (açık beyan):** qa-verifier'ın araç setinde Playwright MCP `browser_evaluate` yok. Bu yüzden L5b-A seti (38 çift + ek toast çiftleri), computed stil okumaları, Tab/odak ölçümleri ve tıklama deneyleri **qa-verifier'ın kendi yazdığı Playwright betikleriyle** koşuldu (`playwright-core` 1.58.2, aynı Chromium; betikler scratchpad'de, repoya girmedi). Builder'ın betiği kullanılmadı. Çekim kuralları: `animations:'disabled'`, `document.fonts.ready`, 1,6 sn grafik beklemesi, main ve branch çiftleri ardışık. MCP ile ayrıca elle doğrulananlar: Yönetim raporu "CSM başına müşteri ve açık iş" ve "Gecikenler" hover tooltip'i (branch ve main, snapshot metni), branch KpiChart tıklaması (ekran görüntüsü). Bu kısmi bir sapmadır; kabul kanıtı yine qa-verifier'ın kendi ölçümüdür.

## Komut kanıtları

| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| branch: `npm ci` | 0 | `found 0 vulnerabilities` / `EXIT npm ci 0` |
| branch: `npm run lint` | 0 | `✖ 21 problems (0 errors, 21 warnings)` (round 1 ile aynı) |
| branch: `npm run typecheck` | 0 | çıktısız (`tsc --noEmit -p tsconfig.app.json && ... tsconfig.node.json`) |
| branch: `npm test` | 0 | `Test Files  13 passed (13)` · `Tests  213 passed (213)` |
| branch: `npm run build` | 0 | `✓ built in 777ms` (yalnız chunk-size uyarısı) |
| main: `npm ci` + `npm run build` | 0 / 0 | `index-CjfMyXEl.css 68.25 kB` · `index-Dcv2guIw.js 1,223.99 kB` · `✓ built in 9.37s` |
| build CSS kontrolü (branch) | — | `[data-sonner-toaster] [data-sonner-toast].toast{background-color:hsl(var(--background));color:hsl(var(--foreground));border-color:hsl(var(--border));box-shadow:0 10px 15px -3px #0000001a,0 4px 6px -4px #0000001a}`; kuralın bulunduğu yerde `{}` derinliği 0, yani `@layer` dışı (unlayered) |
| `git diff 9b99ede..9ace149 -- src` | 0 | 3 dosya: `KpiChart.tsx` (+`accessibilityLayer={false}`), `ManagementReport.tsx` (3 grafik `accessibilityLayer={false}`, 3 Tooltip `itemSorter={() => 0}`), `index.css` (+38 satır: sonner katmansız kuralları, recharts zIndex outline, K2 (d) yorumu) |
| L5b-A: 38 çift pixelmatch 0,1 / 0 | — | tablo aşağıda; 0,1 eşiğinde en yüksek: `manager-reports` 272 px (%0,01). 37 çiftte 0 px |
| Toast çiftleri (4 adet, 8 çekim) | — | tüm toast bbox'larında eşik 0 → 0 px (tablo aşağıda) |
| Konsol (tüm betik oturumları) | — | `CONSOLE main 0 branch 0`, `*_ac14_console: []`, `errs: []`. 404 ekranı denenmedi (round 1'de main ile aynı) |
| `gh run list` | — | okunamadı (`gh` yok). Murat beyanı: #65 app/check-migrations/secrets yeşil, parity atlandı |

## L5b-A: main ↔ branch, tam 38 çift (+ ek toast çiftleri)

Araç: `npx -y pixelmatch before after diff <eşik>`. Eşik 0,1 (AA hariç) ve eşik 0. Boyutlar 38/38 çiftte eşit. Oran = 0,1 eşiğindeki px / (genişlik×yükseklik). D4 eşiği (≤ %0,1) aşan çift yok.

Her çiftte eşik 0'da görülen **6 px** (mobil/login 0, dialog çiftlerinde 4) aynı konumdadır: bbox (24,74)–(64,74), sidebar logo ikonunun alt kenarı. Değerler ±1 kanal (ör. (202,197,255) ↔ (203,198,255)). Açıklama: sınır gölgesi/yuvarlama. Bu tabloda "6" yazan her çift için başka fark yoktur.

| Ekran | Boyut | Fark (0,1) | Oran | Eşik 0 | Açıklama |
|---|---|---|---|---|---|
| admin-overview | 1200×2790 | 0 | 0 | 6 | logo ±1 |
| admin-project-detail | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| admin-settings-audit-log | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| admin-settings-integrations | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| admin-settings-template | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| admin-settings-users | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| care-overview | 1200×2448 | 0 | 0 | 6 | logo ±1 |
| care-project-detail-mobile-390 | 390×2042 | 0 | 0 | 0 | tam eşit |
| care-project-detail-no-credentials-tab | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-customer-report | 1200×2208 | 0 | 0 | 6 | logo ±1 |
| csm-insights-step-update-edit-dialog-status-open | 1200×718 | 0 | 0 | 4 | logo ±1 |
| csm-insights | 1200×2124 | 0 | 0 | 6 | logo ±1 |
| csm-my-work | 1200×3789 | 0 | 0 | 6 | logo ±1 |
| csm-overview | 1200×2505 | 0 | 0 | 6 | logo ±1 |
| csm-phase00-handover-workspace | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-phase6-riskdialog-edit-default | 1200×1284 | 0 | 0 | 4 | logo ±1 |
| **csm-phase6-riskdialog-reason-error-toast** | 1200×1284 | 0 | 0 | 4 | toast bbox'ında (812,1198)–(1168,1252) 0 px; yalnız logo ±1 |
| csm-phase6-riskdialog-reason-field | 1200×1284 | 0 | 0 | 4 | logo ±1 |
| csm-project-detail-phases | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-projects-list | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-access-credentials | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-actions | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-contacts | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-continuity | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-discovery-teams | 1200×2470 | 1 | %0,00004 | 10 | bbox (362,2282): KPI çizgi grafiği tek nokta (recharts 3 AA) + logo 6 + 3 px çizgi kenarı |
| csm-tab-documents | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-golive | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-history | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| csm-tab-integrations | 1200×3028 | 0 | 0 | 6 | logo ±1 |
| csm-tab-meetings | 1200×2002 | 0 | 0 | 6 | logo ±1 |
| devops-overview | 1200×2443 | 0 | 0 | 6 | logo ±1 |
| devops-tab-access-credentials | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| login | 1200×1284 | 0 | 0 | 0 | tam eşit |
| manager-new-project-dialog | 1200×1284 | 0 | 0 | 61 | bbox (24,74)–(829,957): logo 6 + diyalog kenar/gölge ±1 kanal |
| manager-overview | 1200×2790 | 0 | 0 | 6 | logo ±1 |
| manager-project-detail-no-credentials-tab | 1200×1284 | 0 | 0 | 6 | logo ±1 |
| manager-reports | 1200×2198 | 272 | %0,01 | 278 | bbox (735,315)–(1135,473): "CSM başına müşteri ve açık iş" çubuklarının 1 px'lik dikey kenar sütunları (alt-piksel, recharts 3 çubuk genişliği yuvarlaması) ve Gecikenler çubuğunun sol kenarı; renk, legend, değer aynı. Kırpıntı: `screens/r2/manager-reports-diff-crop.png` (üst main, orta branch, alt diff) |
| **csm-golive-approval-success-toast (AC14, iki toast üst üste)** | 1200×1284 | 0 | 0 | 6 | toast bbox'ında 0 px |
| **csm-golive-approval-success-toast-expanded (üst üste binmiyor)** | 1200×1284 | 0 | 0 | 6 | toast bbox'ında 0 px |
| handover-install-type-toast-description (REV2-01) | 1200×1284 | 0 | 0 | 6 | toast bbox (812,1178,356×74) 0 px |
| golive-gonogo-toast | 1200×1284 | 0 | 0 | 6 | toast bbox 0 px |

Son 4 satır ek (38 set dışı) toast çiftidir. Tablo ham çıktısı: `docs/reviews/chore_f0-03a-upgrades/screens/r2/pixelmatch-table.txt`. Toast kareleri: `screens/r2/toast-*-main-vs-branch.png`. Round 1'e göre 466–19.451 px olan farklar 0'a indi. Boyutlar round 1'den 1–2 px farklı (`animations:'disabled'`), her çiftin iki yanı eşit.

**Not (Info, QA2-01):** Çıktıdaki `diff0` ve `before/after` ham PNG'ler `.verify/screens/f0-03a-gate-r2/` altında, commit edilmedi.

## Toast computed stil kanıtı (main ↔ branch, `getComputedStyle`)

Ölçülen: AC14 iki toast, risk hata toast'ı, handover `description` toast'ı, Go/No-Go toast'ı. Beş toast'ın hepsinde aynı sonuç.

| Özellik | main | branch |
|---|---|---|
| `border-color` | rgb(214, 221, 230) | rgb(214, 221, 230) |
| `color` | rgb(15, 23, 41) | rgb(15, 23, 41) |
| `background-color` | rgb(255, 255, 255) | rgb(255, 255, 255) |
| `border-width` | 1px | 1px |
| `box-shadow` | `rgba(0,0,0,0) 0 0 0 0, rgba(0,0,0,0) 0 0 0 0, rgba(0,0,0,0.1) 0 10px 15px -3px, rgba(0,0,0,0.1) 0 4px 6px -4px` | `rgba(0,0,0,0.1) 0 10px 15px -3px, rgba(0,0,0,0.1) 0 4px 6px -4px` |
| `[data-description]` `color` (REV2-01) | rgb(78, 94, 116) | rgb(78, 94, 116) |
| `[data-action]` / `[data-cancel]` | toast'larda yok (yalnız kod yolu; uygulama bu öğeleri kullanmıyor) | aynı |

**QA2-02 (Info):** `box-shadow` serileştirmesi farklı. Main'de iki ek şeffaf `0 0 0 0` ring katmanı var (Tailwind 3 `shadow-lg`), branch'te yok. Görsel etkisi sıfır, çünkü iki sürümde de çizilen gölge aynı ve toast bbox'ında eşik 0 → 0 px. Tailwind 4'te `shadow-lg` yerine yazılan kuralın doğal sonucu. İşlem gerekmez.

Toast bbox'ı, hover'sız (üst üste binen) karede main/branch eşit: `(812,1179,356×73)` ve `(821,1167,338×69)`. Genişletilmiş karede (fare toaster üzerinde) iki toast üst üste binmiyor: `(812,1169,356×73)` ve `(812,1102,356×54)`. Görüntü: `screens/r2/toast-csm-golive-approval-success-toast-expanded-main-vs-branch.png` ("Müşteri onayı kaydedildi" ve "Go-Live tamamlandı — Go-Live başladı, 0 adım açıldı" ikisi de tam görünür, iki tarafta aynı).

## AC14 (QA-03) akışı, csm Deniz Uzun, `p_isyatirim`
Adımlar main ve branch'te aynı uygulandı (Go/No-Go "Toplantıyı kaydet" → Satış Devri panelinde taahhüt "Karşılandı" + gerekçe → kişi seç + onay notu → "Müşteri onayını kaydet").

| Beklenen | main | branch |
|---|---|---|
| Toast "Müşteri onayı kaydedildi" | görüldü | görüldü |
| "Onaylayan: Sevcan Vural (Product Owner) · 09.10.2026 · Kaydeden: Deniz Uzun" | görüldü | görüldü |
| İlerleme | %88 | %88 |
| Konsol hatası | 0 | 0 |

## Tooltip sırası

| Grafik | main | branch |
|---|---|---|
| CSM başına müşteri ve açık iş (hover bar) | `Deniz Uzun / Müşteri : 6 / Açık iş : 23` | `Deniz Uzun / Müşteri : 6 / Açık iş : 23` (MCP snapshot: `listitem "Müşteri : 6"`, `"Açık iş : 23"`) |
| Gecikenler: Deniz Uzun çubuğu | `Deniz Uzun / Adım : 9 / Aksiyon : 1` | `Deniz Uzun / Adım : 9 / Aksiyon : 1` (MCP snapshot ile de) |
| Gecikenler: Mehmet Ertuğrul Elitop | `Adım : 0 / Aksiyon : 1` | `Adım : 0 / Aksiyon : 1` |
| Sağlık dağılımı pie (hover dilim) | `Sarı : 2` | `Sarı : 2` |
| KpiChart hover (REV2-03) | `25.09.2026 / Değer : 40 %` | `25.09.2026 / Değer : 40 %` |

Gecikenler grafiği round 1'de UNVERIFIED'dı. Bu turda veri mevcut (Deniz 9 adım + 1 aksiyon, Mehmet 1 aksiyon): çubuk `.recharts-bar-rectangle` DOM'dan tek tek hover edilerek karşılaştırıldı, sıralama aynı. Not: round 1 gözlemindeki `18.09.2026 / Değer : 25 %` bugünkü seed/tarihte `25.09.2026 / 40 %` olarak geliyor (tarih bağımlı veri), iki tarafta aynı. Görseller: `screens/r2/chart-hover-pie-*.png`, `kpi-hover-*.png`, `mcp-branch-reports-tooltip-viewport.png`, `mcp-branch-csm-bar-hover.png`.

## Odak davranışı

| Ölçüm | main | branch |
|---|---|---|
| `document.querySelectorAll('svg.recharts-surface[role=application]').length` (Yönetim raporu) | 0 | **0** |
| Aynısı KpiChart sayfasında | 0 | **0** |
| `.recharts-wrapper [tabindex="0"]` sayısı (rapor) | 1 (pie `g.recharts-pie`) | 1 (aynı pie `g`) |
| KpiChart `[tabindex="0"]` | 0 | 0 |
| `.recharts-wrapper [tabindex="-1"]` | 8 | 44 (recharts 3 `zIndex-layer` `g`'leri; klavye ile erişilmez) |
| Tab sırası, rapor sayfası 45 durak (element kimliği) | — | **main ile birebir aynı**; grafik durağı 2 (pie `g`), iki tarafta aynı konumda (10. ve 28.) |
| Tab sırası, KpiChart sayfası 60 durak | — | main ile aynı; grafik durağı 0 |
| Rapor çubuk/pie/gecikenler tıklaması | `activeElement=BODY`, tooltip yalnız CSM çubuğunda | aynı (`BODY`, aynı tooltip) |
| KpiChart tıklaması | `activeElement = DIV[role=tabpanel]`, çerçeve yok (`:focus-visible` false) | `activeElement = g.recharts-zIndex-layer_2000`, `outline: none 0px`, çerçeve yok |
| KpiChart tıklaması tooltip | yok | yok |

Not (QA2-03, Info): Tab sırası karşılaştırmasında yalnız `outline` hesaplanmış değeri farklı: main'de `solid 2px transparent`, branch'te `none 0px`. Tailwind 4'te `outline-hidden` yalnızca `forced-colors: active` iken `2px solid transparent` verir. Normal görünümde fark yok, yalnız Windows yüksek kontrast modunda davranış v3'ten ayrışabilir. Erişilebilirlik Murat kararıyla önceliksiz (F9-04), bilgi olarak bırakıldı.

KpiChart tıklamasında `document.activeElement` farklıdır (main: tabpanel, branch: `g` katmanı). Hiçbiri odak çerçevesi çizmiyor. Kullanıcıya görünür bir fark yok, bu yüzden bulgu değil. Görüntü: `screens/r2/mcp-branch-kpi-click.png`.

## Direktif dışı a6f46d8: `.recharts-wrapper [class*="recharts-zIndex-layer_"]:focus { outline: none; }`

Kural `document.styleSheets` üzerinden `deleteRule` ile devre dışı bırakılıp (silinen kural sayısı: 1) KpiChart'a ve rapor grafiklerine tıklandı.

| Durum | KpiChart tıklama sonrası `outline` | main ile fark (eşik 0, grafik kırpıntısı) |
|---|---|---|
| main | `none 0px` (odak `DIV.tabpanel`) | referans |
| branch, kural AKTİF | `none 0px` | **4 px** (çizgi AA) |
| branch, kural SİLİNMİŞ | **`auto 5px rgb(0, 95, 204)`** (mavi çerçeve, `g.recharts-zIndex-layer_2000` üzerinde) | **739 px** |

Görüntü: `screens/r2/kpi-click-main__branch-with-rule__branch-no-rule.png` (soldan sağa main, kuralla, kuralsız; sağdaki grafiği çevreleyen mavi dikdörtgen).

Sonuç: **kural gerekli.** Bu kural olmadan KpiChart tıklamasında focus ring çıkıyor, main'de çıkmıyor; kuralla çıkmıyor ve kuralla main'e eşit (4 px, AA). Rapor grafikleri bu kural olmadan da çerçeve çizmiyor (`activeElement=BODY`, kural silinince de farksız: 228/65/0 px, çubuk kenarı AA). Kapsam: seçici `.recharts-wrapper` altındaki `[class*="recharts-zIndex-layer_"]` ile sınırlı. Bu elemanlar `tabindex=-1` (Tab sırası main ile birebir aynı, yukarıda), yani klavye odağı yok, uygulamada grafik dışında hiçbir yerde klavye odak göstergesini gizlemiyor. Murat'ın "fare esaslı kullanım" kararının KpiChart tıklaması için tamamlayıcısı, REV/QA-02 kapanışı için gerekli.

## AC ↔ sonuç (round 2'de değişenler)

| AC | Doğrulama | Sonuç |
|---|---|---|
| AC4 | lint exit 0 (0 hata, 21 uyarı), typecheck exit 0, test 13/213, build exit 0 | PASS |
| AC12 | 38 çift, 0,1 eşiğinde en kötü %0,01 (`manager-reports`), AC14 çifti 0 px. Eşik 0'da tüm farklar açıklandı (logo ±1, recharts kenarı, diyalog gölgesi) | PASS |
| AC13 | toast kenarlık/renk/gölge/arka plan main ile aynı (computed ve eşik 0), diğer ekranlarda round 1'deki yerleşim farkı yok (38 çift eşit) | PASS |
| AC14 | akış iki tarafta aynı, toast çifti eşik 0 → 0 px, üst üste binmeyen kare dahil | PASS |
| AC-NEG4 | Murat beyanı (run #65), bağımsız doğrulanamadı | PASS (beyan, UNVERIFIED bağımsız) |

Round 1'de PASS verilen diğer AC'lere (AC1–AC3, AC5–AC11, AC15, AC16, NEG1–NEG3) bu turda dokunulmadı. Bu turdaki diff (`9b99ede..9ace149`) yalnız `KpiChart.tsx`, `ManagementReport.tsx`, `index.css` ve not dosyasıdır: AC-NEG1 yolları (`src/lib/rabbitqa`, `auth-api.ts`, `auth-context.tsx`) etkilenmedi.

## Round 1 bulguları: durum

| ID | Başlık | Durum | Kanıt |
|---|---|---|---|
| QA-01 (High) | Sonner toast stili | **KAPANDI** | Computed stil main ile aynı (tablo); 5 toast'ın bbox'larında eşik 0'da 0 px; kural build CSS'inde `@layer` dışında |
| QA-02 (Medium) | recharts 3 `accessibilityLayer` | **KAPANDI** | `role=application` sorgusu 0 (main ile aynı); Tab sırası main ile birebir; KpiChart/rapor tıklamasında çerçeve yok; a6f46d8 kuralı olmadan çerçeve çıkıyor, kuralla çıkmıyor |
| QA-03 (Medium, tooltip) | Tooltip sırası | **KAPANDI** | CSM, Gecikenler, pie, KPI hover main ile aynı |
| QA-04 (Low) | Dönem Select sonrası legend sırası | KAPANDI (round 1'de de tekrarlanmamıştı) | Dönem bu turda değiştirilmedi; legend sırası `itemSorter={null}` kodu round 1'deki gibi, `manager-reports` çifti 0,1 eşiğinde legend farkı yok |
| QA-05 (Low) | Eşik 0 kalan farklar | **KAPANDI** | Tablodaki tüm sıfırdan büyük farklar logo ±1, recharts alt-piksel kenarı veya diyalog gölgesi; round 1'deki 35 kanal farkı (insights diyaloğu) artık 4 px/logo |
| QA-06 (Low) | Üst üste binen toast'lar | **KAPANDI** | Genişletilmiş karede iki toast ayrı çiziliyor, eşik 0 → 0 px |
| QA-03 (AC14, BACKLOG) | Go-Live toast çifti %0,11 | **KAPANDI** | 0 px (0,1) / toast bbox'ında 0 px (eşik 0) |

## Ek istekler (reviewer round 2'den, orkestratör iletti)
1. **REV2-01** (description'lı toast): kapandı. HandoverWorkspace "Kurulum tipi kaydedildi" (`p_ornek`, null → SaaS) toast'ı: `[data-description]` `color` rgb(78,94,116) main ile aynı; toast kökü bg/border/color aynı, bbox (812,1178,356×74) 0 px (eşik 0). L5b-A setinde bu toast yoktu: yeni çift olarak eklendi.
2. **REV2-03** (KPI hover): kapandı (tablo yukarıda).
3. **Rapor çubuk grafiği tıklaması ve Tab**: kapandı. Tıklamada çerçeve yok (`BODY`, `outline none`); Tab sırasında yeni durak yok (45/45 aynı).

## Bulgular
Bu turda Critical/High/Medium/Low bulgu yok. Info:
- **QA2-01** Ham PNG/diff setinin yeri `.verify/screens/f0-03a-gate-r2/`, commit edilmedi. L5b-A'nın kalıcı hali F0-06'ya bırakıldı (SUMMARY ile uyumlu).
- **QA2-02** `box-shadow` serileştirmesi farkı (iki fazladan şeffaf ring katmanı), görsel etkisiz.
- **QA2-03** Tailwind 4 `outline-hidden` yüksek kontrast modu farkı, görsel etkisiz, erişilebilirlik Murat kararıyla önceliksiz.
- **QA2-04** Yöntem sapması: A seti `playwright-core` betiğiyle, hover/tıklama doğrulamalarının bir kısmı MCP ile yapıldı (`browser_evaluate` yok). Gerekirse gate orkestratörü A setini MCP ile yeniden istemeli.

## Eksikler ve UNVERIFIED
- CI: yalnız Murat beyanı (run #65). `gh` yok.
- AC10'un 37 ekranlık dev turu bu turda tekrarlanmadı (round 1'deki kısmi durum aynen).
- MCP ile 38 çiftin tamamı çekilmedi (yöntem sapması, yukarıda).
- Dönem Select (Bu hafta vb.) sonrası legend sırası bu turda yeniden ölçülmedi.

Kanıt dosyaları: `docs/reviews/chore_f0-03a-upgrades/screens/r2/` (toast çiftleri, `manager-reports-diff-crop.png`, `kpi-click-main__branch-with-rule__branch-no-rule.png`, hover/click kırpıntıları, `pixelmatch-table.txt`). Ham set: `.verify/screens/f0-03a-gate-r2/{before,after,diff,diff0}/` (commit edilmedi).
