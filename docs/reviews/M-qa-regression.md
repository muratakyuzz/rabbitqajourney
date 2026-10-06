# qa-verifier — main (M-06 regresyon) @ 3727275

**Karar:** APPROVE

Kapsam: Faz M dondurma öncesi son regresyon (M-06 modu). Çalışma dizini `.verify/main` (main @ 3727275, M-09a+M-09b+M-09c merge edilmiş hali). Kaynak kod/test/paket dosyası değiştirilmedi; yalnızca komut çalıştırıldı ve tarayıcıda gezildi.

### Komut kanıtları
| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| `npm ci` | 0 | `added 550 packages, and audited 551 packages in 4s` — kilit dosyası senkron |
| `npx tsc --noEmit -p tsconfig.app.json` | 0 | Çıktı yok — tip hatası yok |
| `npm run lint` | 1 (beklenen, hata var) | `✖ 42 problems (14 errors, 28 warnings)` |
| `npm test -- --run` (Vitest) | 0 | `Test Files 11 passed (11)` · `Tests 197 passed (197)` · Duration ~4s |
| `npm run build` | 0 | `✓ 2597 modules transformed` · `✓ built in 5.09s` · `dist/assets/index-BzmF3kY9.js 1,223.47 kB │ gzip: 344.45 kB` · `dist/assets/index-CjfMyXEl.css 68.25 kB │ gzip: 11.83 kB` |
| `npm run e2e` | — (yok) | `package.json`'da `e2e` script'i yok, `e2e/` dizini ve Playwright config yok. Faz M'de API/E2E altyapısı henüz kurulmadı (AGENTS.md: Demo modunda backend/DB yok). Atlandı — qa-verifier demo modu prosedürüne uygun |
| `npx vite --host 127.0.0.1 --port 8090` (arka plan) | başlatıldı, iş bitince `pkill` ile kapatıldı | `curl` 200 → sonra `000` (kapatma doğrulandı) |

**Lint regresyon kontrolü:** main @ 4bfa4cb'de 16 hata/28 uyarı → sonraki commit'lerde 14 hata/28 uyarı olarak not edilmişti. Şu an **14 hata / 28 uyarı** — tam eşleşiyor, regresyon yok.

### Kabul kriteri ↔ test (M-06 regresyon — faz sonu kriterleri)
| AC | Kaynak | Sonuç | Kanıt |
|---|---|---|---|
| Tüm Vitest paketleri yeşil | `npm test` | PASS | 11 dosya / 197 test, 0 başarısız |
| Typecheck temiz | `tsc --noEmit` | PASS | çıktı yok, exit 0 |
| Lint regresyon yok | `npm run lint` | PASS | 14/28, önceki not edilen sayıyla aynı |
| Build başarılı | `npm run build` | PASS | exit 0, bundle 1.22MB JS / 68KB CSS (500KB chunk uyarısı var ama mevcut davranış, regresyon değil) |
| 13 sekme görünüyor, Destek kayıtları pasif | Playwright MCP, `/app/projects/p_isyatirim` | PASS | `tab "Destek kayıtları Faz 2" [disabled]`, toplam 13 sekme |
| Uyarı rozeti ve paneli çalışıyor | Playwright MCP | PASS | `button "9 açık uyarı"` → Sheet açıldı, filtreler/liste doğru; satırda uyarı ikonu |
| /app/overview, /app/projects, proje detayı, /app/my-work, /app/reports, /app/admin düzgün render oluyor | Playwright MCP (csm + admin) | PASS | Tam sayfa ekran görüntüsü, konsol hatası yok |
| AUDIT.md §4 / proje detayı kapsama tablosu ekrana karşı doğrulandı | docs/AUDIT.md vs ekran | PASS | Sekme sırası, "Faz 2" rozeti, state v11/Ctx 51/13 sekme/`trainings` kalkışı/`rule_review:*` ailesi dokümanla birebir eşleşiyor |

### Tarayıcı kontrolü
Login, Overview (csm), Projects (csm), Project Detail (13 sekme + Destek kayıtları pasif + uyarı rozeti/paneli), My Work, Customer Report, Management Report (admin), Admin — tümü PASS, konsol hatası 0 (yalnızca 2 bilinen React Router future-flag uyarısı, zararsız). Ekran kanıtları `.verify/screens/*.png`.

### Bulgular
Yok. Critical/High/Medium bulgu tespit edilmedi.

### Açık sorular / öneriler (engelleyici değil)
- Build'de 500kB+ chunk uyarısı (1.22MB tek JS chunk) — regresyon değil, F1+ code-splitting önerisi.
- `npm run e2e` / `e2e/` dizini yok — Faz M'de beklenen, F1-00 sonrası ilk API bağlanınca kurulmalı.

### Sonuç
Tüm komutlar yeşil, lint sayısı referansla birebir eşleşti, 197 test geçti, build başarılı, kritik ekranlar konsol hatasız ve AUDIT.md §4 ile tutarlı. Mockup, M-06 dondurması için görsel referans olarak hazır.
