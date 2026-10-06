## qa-verifier — feat/m09c-phase-workspaces-tabs @ 9171430

**Karar:** APPROVE

Faz M (demo modu), round 2. `gh` CLI kurulu değil → CI/parity sonucu okunamadı, bu demo modunda beklenen davranış (UNVERIFIED değil, not olarak düşülür — PASS/FAIL kararı yerel komutlara dayandırıldı, talimata uygun).

### Komut kanıtları
| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| `npm ci` | 0 | "added 550 packages, and audited 551 packages in 7s" |
| `npm run lint` | 0 | "✖ 42 problems (14 errors, 28 warnings)" |
| `npx tsc --noEmit -p tsconfig.app.json` | 0 | (çıktı yok — temiz) |
| `npm test` (vitest) | 0 | "Test Files 11 passed (11)" · "Tests 197 passed (197)" |
| `npm run build` | 0 | "✓ built in 4.94s" (pre-existing chunk-size uyarısı dışında hata yok) |
| `npm run lint` (main @ b658431, karşılaştırma için ayrı worktree'de) | 0 | "✖ 44 problems (16 errors, 28 warnings)" |
| `gh run list --branch ... --workflow ci.yml` | — | `gh` CLI kurulu değil, parity/CI sonucu okunamadı (demo modunda beklenen, not düşüldü) |

**Not (REV-04 benzeri bulgu değil, Low gözlem):** Değişiklik notu "42 problems — main'deki sayıyla aynı" diyor. Gerçek main (`b658431`, kod tabanı `2997ee5` + yalnızca docs commit'i) lint'i **44 problems (16 errors, 28 warnings)** veriyor. Yani branch main'e göre **regresyon değil, iyileşme** (2 error daha az) — ama değişiklik notundaki "aynı" iddiası yanlış. Fonksiyonel etkisi yok. `docs/reviews/BACKLOG.md`'ye Low not düşülebilir.

### Kabul kriteri ↔ test (L6 — Playwright MCP, demo modu, roller: csm u_deniz, manager, care gencay.genc)
| AC | Kontrol | Sonuç | Ekran kanıtı |
|---|---|---|---|
| AC12 | 13 sekmelik düzen; Training/Adaptation/Alerts sekmeleri yok; "Destek kayıtları" disabled + "Faz 2" rozeti, tıklanınca URL/sekme değişmiyor | PASS | `.verify/screens/m09c-p_lojistik-phases.png` |
| AC4 | "Erişim bilgileri" sekmesi csm'de var, care'de ve manager'da (canSeeCredentials değilken) yok (12 sekme) | PASS | `.verify/screens/m09c-access-tab.png`, snapshot p_garanti (Gençay Genç / Care, 12 sekme) |
| AC4 | `?ws=03` yetkisiz (manager, canSeeCredentials false) kullanıcıda panel açılmıyor | PASS | `.verify/screens/m09c-manager-ws03-gated.png` |
| AC4 | care, `vpn_info` satırına tıklayınca hiçbir şey açılmıyor (`canEdit` false) | PASS | snapshot sonrası DOM'da dialog/panel yok |
| AC3b | "Kurulum özeti" kartı hem 03 panelinde hem "Erişim bilgileri" sekmesinde; yalnızca "Kurulum tipi" ve "LLM" satırları; adım listesi/StepStatusBadge yok; düzenleme kontrolü yok; panelde kart "Erişim bilgileri" kartının üstünde, tek sütun | PASS | `.verify/screens/m09c-csm-access-workspace.png` (panel), `.verify/screens/m09c-access-tab.png` (sekme, `lg:grid-cols-2`) |
| AC1/AC2 | 02 panelinde Keşif toplantısı bölümü + form tek sütun (`layout="panel"`) | PASS | `.verify/screens/m09c-discovery-panel-1280.png` |
| AC13 | Başlıkta "N açık uyarı" rozeti (3 açık uyarı / 6 açık uyarı projeye göre); tıklanınca sağ Sheet'te `ProjectAlertsPanel` açılıyor (filtreler, "Uyarı ekle", Ertele/Kapat) | PASS | `.verify/screens/m09c-alerts-panel.png` |
| AC13 | `?panel=alerts` ile sayfa yüklenince panel doğrudan açık geliyor | PASS | `.verify/screens/m09c-panel-alerts-deeplink.png` |
| AC14 | Aşama/adım satırlarında AlertTriangle uyarı ikonu (kırmızı, gecikmiş adımlarda) | PASS | `.verify/screens/m09c-p_lojistik-phases.png` ("Kurulum gereksinim dokümanının paylaşılması" ve "Onboarding sunumunun paylaşılması" satırlarında görünür); 03 Kurulum aşaması başlığında da ikon (`.verify/screens/m09c-manager-ws03-gated.png`) |
| AC15/AC21 | Toplantılar sekmesi Tür/Durum Select'leri gerçek DOM seçimiyle: Tür=Eğitim → 8 kayıttan 2'ye filtrelendi (doğru 2 Eğitim toplantısı); + Durum=Planlandı → 0 kayıt, "Filtreye uyan toplantı yok" boş durumu | PASS | snapshot'lar (p_isyatirim, csm iken Care ile; proje tüm rollere görünür) |
| AC21 (metin düzeltmesi) | GoLiveTab: "Taahhütleri 'Satış Devri' çalışma alanından güncelleyebilirsiniz" | PASS | snapshot p_garanti ?tab=golive |
| AC18 | Haftalık rapor ekranı (`/app/projects/p_isyatirim/report`) hatasız açılıyor | PASS | console 0 errors |
| AC21 | Konsolda hata yok (yalnızca beklenen `/logout` 404'ü — kendi hatalı navigasyonum, uygulama kodunun parçası değil) | PASS | `browser_console_messages` (6 mesaj, 0 gerçek hata) |
| AC21 (375/1280px) | 390px'te uyarı paneli tam genişlik; 1280px'te workspace panelleri 640px, tek sütun | PASS | `.verify/screens/m09c-mobile-alerts-panel.png`, `.verify/screens/m09c-discovery-panel-1280.png` |

### Değişiklik notu iddiaları ↔ gerçek çalıştırma
- "197 test tamamı geçti" → **doğrulandı** (gerçek çıktı: `Test Files 11 passed (11)`, `Tests 197 passed (197)`).
- "lint 42 problems, main'deki sayıyla aynı" → problem sayısı (42) doğru, ama "main'le aynı" iddiası **yanlış** (main 44). Low, regresyon yok.
- "tsc temiz" → doğrulandı (çıktı yok, exit 0).
- "build başarılı" → doğrulandı (`✓ built in 4.94s`).
- AC15/AC21'in builder tarafından "L6'da doğrulanmalı" olarak bırakılan kısmı bu gate turunda Playwright MCP ile uçtan uca doğrulandı.

### Bulgular
Yalnızca Low seviye, engelleyici olmayan bir gözlem (lint/main karşılaştırması). Critical/High/Medium bulgu yok.

### Açık sorular / öneriler (engelleyici değil)
- `docs/reviews/BACKLOG.md`'ye eklenebilir: değişiklik notundaki lint karşılaştırma iddiası yanlış (Low, dokümantasyon doğruluğu).
- `gh` CLI bu makinede kurulu değil; bir sonraki F-fazı gate'inde `gh` erişimi sağlanmalı.

### Diğer notlar
- Worktree: `.verify/feat_m09c-phase-workspaces-tabs` (commit `9171430`).
- Ekran kanıtları `.verify/screens/` altında (gitignore kapsıyor); kalıcı kanıt gerekiyorsa `docs/reviews/feat_m09c-phase-workspaces-tabs/screens/` altına kopyalanmalı.
