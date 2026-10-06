## qa-verifier — fix/m06-insight-step-lock @ 2940e56

**Karar: APPROVE**

Çalışma dizini: `.verify/fix_m06-insight-step-lock` (worktree, detached HEAD @ 2940e56). Faz M demo modu uygulandı (`docs/agents/qa-verifier.md` → "Demo modu"): backend/parity yok, `npm ci` + lint + tsc + test + build + Playwright MCP ile canlı UI kontrolü.

### Komut kanıtları
| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| `npm ci` | 0 | `added 550 packages, and audited 551 packages in 6s` |
| `npm run lint` | 1 | `✖ 42 problems (14 errors, 28 warnings)` — iddia edilen "14 hata / 28 uyarı" ile birebir eşleşiyor. Not: komut gerçek exit kodu `1`'dir (14 pre-existing hata nedeniyle); bu round 2 baseline'ının aynısıdır, bu branch'ten kaynaklanan bir regresyon değildir. |
| `npx tsc --noEmit` | 0 | Çıktı yok (temiz) |
| `npm test` | 0 | `Test Files  13 passed (13)` · `Tests  210 passed (210)` |
| `npm run build` | 0 | `✓ built in 9.65s`, `dist/assets/index-l0omCwOO.js   1,224.09 kB` (bilinen 1.22 MB chunk uyarısı, regresyon yok) |
| `gh run list --branch fix/m06-insight-step-lock --workflow ci.yml --limit 1` | — | `command not found: gh` → CI/parity sonucu okunamadı. Faz M demo modunda bu bir engel değildir (plan dokümanı bunu zaten belirtmişti); F1+ için bu `UNVERIFIED` olurdu. |

Hedeflenen testler ayrıca `--reporter=verbose` ile tek tek çalıştırılıp tam isimleriyle eşleştirildi (tümü PASS, `Test Files 2 passed (2)` / `Tests 52 passed (52)` alt kümesinde):
- `src/lib/rabbitqa/store.test.tsx > approveInsight — step_update goes through updateStep's lock rules (REV-13) > AC1: rejects an edited step_update proposing 'locked' on an open manual step — step and insight stay unchanged`
- `... > AC2: rejects approving (no edit) a step_update whose target step is now locked — step and insight stay unchanged`
- `... > AC3 (regression): approves a step_update to 'done' on an open manual step`
- `... > AC5 (regression): still rejects a step_update insight targeting an auto-completed (data) step`
- `src/components/rq/InsightCard.test.tsx > InsightCard — ApproveDialog step_update status options (REV-13, AC4) > does not offer 'Sırası gelmedi' as a status option, and keeps the other four`

### Kabul kriteri ↔ test
| AC | Test | Sonuç | Not |
|---|---|---|---|
| AC1 | `store.test.tsx › AC1: rejects an edited step_update proposing 'locked' ...` | PASS | Assertion `stepLockError`'ın "\"Sırası gelmedi\" elle seçilemez" mesajını, adım durumunun `pending` kaldığını, insight'ın `pending` kaldığını ve audit sayısının değişmediğini kontrol ediyor — sahte geçen test değil. |
| AC2 | `store.test.tsx › AC2: rejects approving (no edit) ... now locked ...` | PASS | Hedef adım kilitliyken onay reddi, mesaj `"Adımın sırası gelmedi; durumu elle değiştirilemez"`, adım/insight/audit değişmediği doğrulanıyor. |
| AC3 (regresyon) | `store.test.tsx › AC3 (regression): approves a step_update to 'done' ...` | PASS | Başarı yolunda adım `done`, insight `approved`, `appliedEntityId` doğru, audit `reason` `/^AI Insight onaylandı/` ile eşleşiyor. |
| AC4 | `InsightCard.test.tsx › does not offer 'Sırası gelmedi' ...` | PASS | Gerçek açılır menüyü DOM'da açıp 4 seçeneği (`Bekliyor`, `Devam ediyor`, `Tamamlandı`, `Kapsam dışı`) doğruluyor, `queryByRole("option", { name: "Sırası gelmedi" })` null bekliyor. |
| AC5 (regresyon) | `store.test.tsx › AC5 (regression): still rejects a step_update insight targeting an auto-completed (data) step` | PASS | Değişiklik notunda belirtildiği gibi mevcut AC17 testiyle (satır 454-469) örtüşüyor — kasıtlı yineleme, kusur değil. |

Kod incelemesi (okuma amaçlı, değiştirilmedi): `src/lib/rabbitqa/completion.ts:239` `stepLockError(step, next)` ortak yardımcı fonksiyonu; `src/lib/rabbitqa/store.tsx:259` `updateStep` bunu çağırıyor; `store.tsx:687-692` `approveInsight`'ın `step_update` dalı artık `api.updateStep(...)` üzerinden geçiyor ve hata dönerse erken çıkıyor (önerinin "approved" işaretlenmesi engelleniyor). `src/components/rq/InsightCard.tsx:164,189` `stepStatusOptions` `locked`'ı filtreliyor ve yalnızca `step_update` türünde kullanılıyor. Değişiklik notundaki açıklamayla birebir uyumlu.

### Tarayıcı kontrolü (UI değiştiyse)
`npx vite --host 127.0.0.1 --port 8091` ile canlı sunucu başlatıldı, csm (Deniz Uzun) ile giriş yapıldı, Insights sayfasında seed'deki mevcut "Adım durumu: CS check-in toplantıları" step_update önerisinde "Düzenle ve onayla" açıldı.

| Kontrol | Rol | Sonuç | Kanıt |
|---|---|---|---|
| ApproveDialog Durum açılır menüsü "Sırası gelmedi" sunmuyor, 4 seçenek duruyor | csm | PASS | `fix_m06-insight-step-lock-ac4-status-dropdown.png` — listbox: `Bekliyor`, `Devam ediyor`, `Tamamlandı` (seçili), `Kapsam dışı`; `Sırası gelmedi` yok. |
| Konsol hatası / 4xx-5xx ağ isteği yok | csm | PASS | `browser_console_messages`: 0 error, yalnızca 2 ön-var React Router future-flag uyarısı (bu branch'ten bağımsız). `browser_network_requests`: listelenen isteklerde hata yok. |

Dev server işi bitince durduruldu (`pkill`), `ps aux` ile artık çalışmadığı doğrulandı.

### Genel değerlendirme
Tüm komutlar değişiklik notunda iddia edilen sayılarla birebir eşleşti (lint 14/28 baseline, tsc temiz, 13 dosya/210 test, build başarılı). Hedeflenen 5 AC testi tam isimleriyle bulundu ve PASS; assertion'lar gerçek davranışı (hata mesajı, değişmeyen state, audit sayısı, onaylanmış insight) doğruluyor, sahte geçen test yok. UI değişikliği (ApproveDialog Durum seçenekleri) canlı tarayıcıda doğrulandı, ekran kanıtı kaydedildi. Tek eksik: `gh` CLI yokluğundan CI/parity sonucu okunamadı — bu Faz M demo modunda plan dokümanınca zaten beklenen ve engelleyici olmayan bir durum, karar bundan etkilenmiyor.

**Karar: APPROVE**

### İlgili dosya yolları
- src/lib/rabbitqa/completion.ts
- src/lib/rabbitqa/store.tsx
- src/components/rq/InsightCard.tsx
- src/lib/rabbitqa/store.test.tsx
- src/components/rq/InsightCard.test.tsx
- docs/changes/fix_m06-insight-step-lock.md
- Ekran kanıtı: docs/reviews/fix_m06-insight-step-lock/screens/fix_m06-insight-step-lock-ac4-status-dropdown.png
