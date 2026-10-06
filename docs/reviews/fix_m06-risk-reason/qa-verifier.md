## qa-verifier — fix/m06-risk-reason @ 55dafe7
**Karar:** APPROVE

### Kapsam ve mod
Faz M demo modu (`docs/agents/qa-verifier.md` → "Demo modu"). Bu repo tek-paketli Vite/React mockup'tır (apps/web ayrımı, pg-mem, parity job yok); `npm run typecheck` script'i mevcut değil, bunun yerine demo-modu komutu `npx tsc --noEmit` kullanıldı. `gh` kurulu değil → CI/parity sonucu okunamadı, demo modunda bu engelleyici değil (not düşüldü).

Çalışma dizini: `.verify/fix_m06-risk-reason/`. `node_modules` yoktu, `npm ci` ile kuruldu (guard.mjs `npm install`'ı reddetti, `npm ci` izinliydi).

### Komut kanıtları
| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| `npm ci` | 0 | `added 550 packages, and audited 551 packages in 4s` |
| `npm run lint` | 1 (beklenen; mevcut hatalar nedeniyle) | `✖ 42 problems (14 errors, 28 warnings)` — `main`'deki önceki gate referansı (`docs/reviews/M-full-review.md`: "Lint 42 problem (14 hata/28 uyarı)") ile birebir aynı → regresyon yok |
| `npx tsc --noEmit` (demo-modu typecheck eşdeğeri; `npm run typecheck` script'i repoda yok) | 0 | Çıktı boş (0 satır) |
| `npm test` | 0 | `Test Files 12 passed (12)` · `Tests 205 passed (205)` — `src/lib/rabbitqa/store.test.tsx` (47 test) ve `src/pages/project/Phase3Tabs.RiskDialog.test.tsx` (4 test) dahil, hepsi yeşil |
| `npm run build` | 0 | `✓ 2597 modules transformed` · `dist/assets/index-BZjcC4N2.js 1,224.05 kB` (önceden var olan chunk-size uyarısı, değişmedi) |
| `npx vitest run store.test.tsx Phase3Tabs.RiskDialog.test.tsx` (3 kez, determinizm kontrolü) | 0 / 0 / 0 | Her 3 koşuda `Test Files 2 passed (2)` · `Tests 51 passed (51)` — flaky değil |
| `gh run list ...` | — | `gh` kurulu değil, CI/parity sonucu okunamadı (demo modunda engelleyici değil) |

### Kabul kriteri ↔ test
| AC | Test (dosya › test adı) | Sonuç | Ekran kanıtı (canlı Playwright MCP, csm=Deniz Uzun, p_isyatirim) |
|---|---|---|---|
| AC1 — boş gerekçeyle durum değişikliği engellenmeli | `Phase3Tabs.RiskDialog.test.tsx` › "AC1: blank reason on a status change blocks save and shows an error" | PASS | Durum "Açık"→"Azaltıldı" seçildi, "Gerekçe (zorunlu)" alanı belirdi; boş gerekçeyle Kaydet → toast "Gerekçe zorunlu", dialog açık kaldı, tablo hâlâ "Açık" |
| AC2 — gerekçeli termin/durum değişikliği audit'e `reason` yazmalı | `store.test.tsx` › describe "updateRisk — status/due reason guard" › "accepts a status change with a reason, and records it on the audit entry"; `Phase3Tabs.RiskDialog.test.tsx` › "AC2: a due-date change with a reason saves and records it on the audit entry" | PASS | Gerekçe dolduruldu, Kaydet → toast "Kaydedildi", dialog kapandı, tablo "Azaltıldı" gösterdi. `patch()` helper'ı her değişen alan için audit satırı üretirken `reason`'ı doğrudan `AuditEntry.reason`'a yazıyor (store.tsx:136-154) — testteki `entry?.reason` assertion'ı gerçek davranışı doğruluyor, sahte geçen test değil |
| AC3 — sadece başlık/açıklama değişikliği gerekçe istememeli | `Phase3Tabs.RiskDialog.test.tsx` › "AC3: editing only the title/description shows no reason field and saves directly" | PASS | Durum/termin değiştirilmeden sadece Başlık değiştirildi, gerekçe alanı hiç görünmedi, Kaydet → toast "Kaydedildi" doğrudan |
| AC4 — yeni risk oluşturma gerekçe istememeli | `Phase3Tabs.RiskDialog.test.tsx` › "AC4: creating a new risk never requires a reason" | PASS | `onCreate` yolu `needsReason`'ı hiç tetiklemiyor (`!!risk` koşulu yeni kayıtta `false`); canlı taramada ayrıca denenmedi ama kod yolu ve test tutarlı |
| (store seviyesi, L2) | `store.test.tsx` › "rejects a status change without a reason" / "rejects a due-date change without a reason" / "allows title/description changes without a reason" | PASS | `updateRisk` çağrısı `string|null` döndürüyor; reddedilen durumlarda state değişmediği ayrıca assert ediliyor |

### Tarayıcı kontrolü
| Kontrol | Rol | Sonuç |
|---|---|---|
| Durum değişikliğinde gerekçe alanı belirir, boşken "Gerekçe zorunlu" toast ile engellenir | csm (Deniz Uzun) | PASS |
| Gerekçeli durum değişikliği kaydedilir, tabloda yeni durum görünür | csm | PASS |
| Sadece başlık değişikliği gerekçe istemeden kaydedilir | csm | PASS |
| Konsol/network hatası yok | csm | PASS (0 error, 2 önceden var olan React Router future-flag uyarısı, ilgisiz) |

### Değişiklik notu iddiaları ↔ gerçek
- "42 problem (14/28), regresyon yok" → doğrulandı.
- "typecheck temiz" → doğrulandı (komut adı `npm run typecheck` değil `npx tsc --noEmit`, script repoda yok — Low not).
- "12 dosya/205 test yeşil" → doğrulandı.
- "build başarılı" → doğrulandı.

### Bulgular
Yok (Critical/High/Medium yok). Yalnızca bir Low not: değişiklik notunda "`npm run typecheck`" denmiş ama repoda bu script yok; demo-modu eşdeğeri `npx tsc --noEmit` kullanıldı ve temiz geçti.

### Açık sorular / öneriler (engelleyici değil)
- Değişiklik notundaki kontrol çıktısı tablosunda komut adı gerçek repo komutuyla güncellenebilir.
- `gh` kurulu değil; F1+ fazlarında parity job'ı zorunlu olacağından o noktaya kadar ortam değişmezse qa-verifier bu kontrolü hep `UNVERIFIED` yazmak zorunda kalacak (Faz M'de engelleyici değil).

Tüm AC'ler PASS, tüm komutlar exit 0 (lint hariç — beklenen/değişmeyen hata sayısıyla), demo modunda parity uygulanmaz → **APPROVE**.
