## qa-verifier tur 2: chore/f0-04a-shared-foundation @ 5d7e656

Tur 1 raporu (@ 007f47d, APPROVE): `git show 9045c0f:docs/reviews/chore_f0-04a-shared-foundation/qa-verifier.md`.
Kapsam: yalnızca 007f47d sonrası (9045c0f gate kaydı + 5d7e656 RUL-01/02 `/fix`). UI değişikliği olmadığı için tarayıcı kontrolü yapılmadı.

**Karar: APPROVE.** Tek not: ilk `npm test` koşusunda 2 web testi zaman aşımına uğradı (flaky, aşağıda).

### Komut kanıtları
| Komut | Sonuç | Çıktı alıntısı |
|---|---|---|
| `git rev-parse HEAD` (worktree `.verify/chore_f0-04a-shared-foundation`) | exit 0 | `5d7e65647ca702d1d73ca71a0630716b208bdb44` |
| `npm ci` | exit 0 | `found 0 vulnerabilities` |
| `npm run lint` | exit 0 | 0 hata, yalnızca uyarı var (react-refresh/only-export-components, react-hooks) |
| `npm run typecheck` | exit 0 | shared: `tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.test.json` hatasız |
| `npm test`, koşu 1 | exit 1 | web `Tests 2 failed \| 214 passed (216)`: `HandoverWorkspace.test.tsx` (AC1 "opens the 00 panel…") ve `HandoverWorkspace.toast-router.test.tsx` (QA-02 regresyonu) için `Test timed out in 5000ms`. shared `274 passed (274)` |
| `npm run test -w @rabbitqa/web`, yeniden koşu | exit 0 | `Test Files 15 passed (15)`, `Tests 216 passed (216)` |
| `npm test`, 2 tam tekrar | geçti | İki koşuda da web `15 passed (15)` / `216 passed (216)`, shared `2 passed (2)` / `274 passed (274)`. Pipe yüzünden çıkış kodu alınamadı, kanıt sayılar. |
| `npm run build` | exit 0 | `dist/assets/index-CDN67-XW.css 86.70 kB`, `dist/assets/index-LqGeOgQ3.js 1,313.28 kB`, `✓ built in 768ms` |
| `shasum -a 256 apps/web/dist/assets/index-*` | exit 0 | Değerler AC9 tablosunda |
| `git diff 007f47d..5d7e656 --stat -- apps packages ':!packages/shared/src/schemas/insight.test.ts'` | exit 0 | Çıktı boş |
| `git status --short` (build ve test sonrası) | exit 0 | Çıktı boş |

### AC9: bundle eşitliği
| Dosya | Tur 1 sha256 | Şimdi sha256 | Aynı mı |
|---|---|---|---|
| `index-CDN67-XW.css` | `35246c67…a531e4` | `35246c672c5582faeb38172444dc6ce819795efb764ee4256077d217fad531e4` | evet |
| `index-LqGeOgQ3.js` | `0b9a5a56…7df4764` | `0b9a5a56f8d5f5485285c9229cc7b526ce38b0384589e4f738f11498b7df4764` | evet |

Dosya adları da aynı. Bundle bayt düzeyinde eşit.

### Kabul kriteri ↔ kanıt (tur 2 kapsamı)
| Kriter | Kanıt | Sonuç |
|---|---|---|
| AC9 | Hash tablosu | PASS |
| AC10 (lint, typecheck, test, build) | Komut kanıtları | PASS (lokal). CI kullanıcı beyanı, doğrulanamadı |
| Tur 2'de kod değişikliği yalnızca test dosyası | Hariç tutmalı diff boş; `insight.test.ts` +59 | PASS |
| #44 tür-dışı alan ve durum reddi testleri koşuyor | shared 274/274 | PASS |
| Temiz çalışma ağacı | `git status --short` boş | PASS |

### Not (bloklamaz)
İlk `npm test` koşusunda iki HandoverWorkspace testi 5000 ms'de zaman aşımına uğradı. Koşu, soğuk worktree'de `npm ci`'nin hemen ardından yapıldı. Bu dosyalar bu turda değişmedi. Sonraki 3 koşu temiz geçti. Zaman duyarlı flaky test olarak kaydedildi (BACKLOG QA-01 → F0-06).
