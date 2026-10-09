## qa-verifier — chore/f0-03b-monorepo @ 590529b
**Karar:** APPROVE (CI satırı Murat bildirimi; gh ile doğrulanamadı. Faz F0 olduğu için parity zorunlu değil)

Worktree: `.verify/chore_f0-03b-monorepo` (HEAD `590529bb0236c19a9aad1d7148800468028ecc50`, `git rev-parse` ile doğrulandı).

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu | Önerilen düzeltme |
|---|---|---|---|---|---|
| QA-01 | Low (bilgi) | AC10, plan §7 | docs/reviews/M-06/baseline | Baseline klasöründe 37 PNG var. Plan "D12 kabul edildiyse 38" diyor. Karşılaştırma 37 üzerinden yapıldı. | Yok. Reviewer D12 durumunu doğrulayabilir. |
| QA-02 | Low (süreç) | guard.mjs | — | Denetim rolünde `rm -rf apps/*/node_modules` ve `rm` içeren komutlar guard tarafından engellendi. Worktree'de zaten node_modules yoktu. `npm ci` doğrudan koşturuldu ve temiz kurulum sayıldı. | Yok. |

Engelleyici bulgu yok.

### Komut kanıtları
| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| `git rev-parse HEAD` | 0 | `590529bb0236c19a9aad1d7148800468028ecc50` |
| `npm ci` (worktree'de node_modules yoktu) | 0 | `added 389 packages, and audited 393 packages` · `found 0 vulnerabilities` (ikinci koşu da exit 0) |
| `npm run lint` (kök) | 0 | `✖ 21 problems (0 errors, 21 warnings)` (builder'ın ölçümüyle aynı: 0 hata / 21 uyarı) |
| `npm run typecheck` (kök) | 0 | `@rabbitqa/web … tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json`, ardından `@rabbitqa/shared … tsc --noEmit -p tsconfig.json`, hata yok |
| `npm test` (kök) | 0 | `RUN v5.0.3 apps/web` · `Test Files 13 passed (13)` · `Tests 213 passed (213)` |
| `npm run build` (kök) | 0 | `dist/assets/index-LqGeOgQ3.js 1,313.28 kB │ gzip: 370.05 kB`; yalnızca mevcut >500 kB uyarısı var |
| `ls apps/web/dist/assets` | 0 | `index-CDN67-XW.css`, `index-LqGeOgQ3.js` |
| `shasum -a 256` CSS | 0 | `35246c672c5582faeb38172444dc6ce819795efb764ee4256077d217fad531e4  index-CDN67-XW.css` (main ölçümüyle aynı ad ve hash) |
| `shasum -a 256` JS | 0 | `0b9a5a56f8d5f5485285c9229cc7b526ce38b0384589e4f738f11498b7df4764  index-LqGeOgQ3.js` (main ölçümüyle aynı ad ve hash) |
| `npm ls --workspaces --depth=0` | 0 | `@rabbitqa/api@0.0.0 -> ./apps/api`, `@rabbitqa/shared@0.0.0 -> ./packages/shared`, `@rabbitqa/web@0.0.0 -> ./apps/web` |
| `npm ls @rabbitqa/shared` | 0 | `@rabbitqa/web@0.0.0 -> ./apps/web` altında `@rabbitqa/shared@0.0.0 deduped -> ./packages/shared` |
| `npm ls --depth=0` | 0 | çıkış 0 |
| `npm ls xlsx --all` | 1 | `` `-- (empty)``. Boş sonuç `npm ls`'te 1 verir. `ci.yml:31` bunu doğru okur (`if npm ls xlsx --all …; then exit 1`), yani CI için geçer. |
| `npm audit --omit=dev --audit-level=high` | 0 | `found 0 vulnerabilities` |
| `grep -l overrides package.json apps/*/package.json packages/*/package.json` | 1 | çıktı yok, override yok |
| `git diff --stat main...HEAD -- .github` | 0 | boş, `ci.yml` değişmemiş |
| `git diff --name-status -M100% main...HEAD` (durum sayımı) | 0 | `139 R100`, `10 A`, `7 M`, `2 D`. Nottaki dağılımla uyumlu (R097 istisnaları `-M100%` ile A+D görünür). |
| `npm run preview -- --host 127.0.0.1 --port 8092 --strictPort` (kökten) | 0 (başladı) | `> vite preview --host 127.0.0.1 --port 8092 --strictPort` · `Local: http://127.0.0.1:8092/` (plan §13'teki komut kökten çalışıyor) |
| `gh run list` (CI #70) | — | Bu makinede `gh` yok. **Murat bildirimi: CI #70 (590529b) yeşil. gh ile doğrulanamadı.** Parity F0'da uygulanmaz. |
| `npm run e2e` | — | Tanımlı değil (F0-06). Plan "yeni test yazılmaz" diyor. |

### Kabul kriteri ↔ test
| AC | Test / kanıt | Sonuç |
|---|---|---|
| AC1 (yapı) | Worktree'de kök `ls`: `AGENTS.md CLAUDE.md README.md apps docs eslint.config.js package-lock.json package.json packages tsconfig.json`. Kökte `src/`, `public/`, `index.html` vb. yok. | PASS (dosya düzeyi). `apps/api` ve `packages/shared` içerik listesi reviewer kapsamında, nottaki `git ls-files` ile uyumlu. |
| AC2 / AC-NEG1 (saf taşıma) | 139 R100. R097 istisnaları (`tsconfig.app.json` lib, `index.css` REV2-02 yorumu) nottaki gerekçeyle. Satır içeriğini reviewer doğrular. | PASS (sayım) |
| AC3 (workspace) | `npm ci` 0 · `npm ls --workspaces --depth=0` 3 workspace · `npm ls @rabbitqa/shared` workspace bağı · `npm ls --depth=0` 0 | PASS |
| AC4 (sürüm eşitliği) | Kendim koşmadım. Ön ölçüm main'in temiz kurulumundan alınmıştı, ben yeniden üretmedim. Not: tek fark `undici-types` 6.21.0→7.24.6, Murat'ın kabul ettiği sapma. Branch `npm ls` çıktımda `@types/node` 24 ile tutarlı. | UNVERIFIED (builder ölçümü; kabul edilmiş sapma). Karar etkisi yok. |
| AC5 (komutlar) | lint 0 (21 uyarı) · typecheck 0 · test 0 · build 0 · `ci.yml` diff boş · `npm ls xlsx --all` empty | PASS. CI yeşili: Murat bildirimi. |
| AC6 (build eşitliği) | CSS adı `index-CDN67-XW.css` ve sha256 aynı. JS adı `index-LqGeOgQ3.js` ve sha256 aynı (fark %0). | PASS |
| AC7 (test eşitliği) | `Test Files 13 passed (13)`, `Tests 213 passed (213)` | PASS |
| AC8 (dev/preview) | Kökten preview 8092'de ayağa kalktı. Playwright: `/` → `/login` (başlık "Hoş geldiniz"), CSM giriş → `/app/overview`. `npm run dev` (8080) ayrıca koşturulmadı, preview ile doğrulandı. | PASS (preview). dev builder kontrolü. |
| AC10 (L5b-B) | `csm-overview` baseline'a gözle karşılaştırıldı. Aşağıdaki tabloya bak. | PASS (örneklem: 1 ekran, bkz. not) |
| AC11 (QA-03) | Deniz Uzun, `p_isyatirim`. Akış aşağıdaki tabloda. | PASS |
| AC12 (belgeler) | Reviewer kapsamı; kendim doğrulamadım. | UNVERIFIED (reviewer) |
| AC-NEG2 | `packages/shared`/`apps/api` içeriğini reviewer doğrular. | UNVERIFIED (reviewer) |
| AC-NEG3 | `grep overrides` boş · audit 0 | PASS |
| AC9 (L5b-A pixelmatch) | Builder 39/39 çift, eşik 0'da 0 px dedi. Ben yeniden çekmedim. Bayt düzeyinde aynı bundle (CSS+JS hash) bunu destekliyor. | UNVERIFIED (builder ölçümü), bundle hash eşitliğiyle dolaylı destek |

### Tarayıcı kontrolü
Sunucu: kökten `npm run preview` (production build), `127.0.0.1:8092`, rol: csm (Deniz Uzun), viewport 1200 genişlik.

| Kontrol | Rol | Sonuç | Kanıt |
|---|---|---|---|
| `/` → `/login` yönlendirmesi, login formu ve demo kullanıcı listesi | — | PASS | URL `…/login`, "Hoş geldiniz" |
| CSM girişi → `/app/overview` | csm | PASS | URL `http://127.0.0.1:8092/app/overview` |
| Konsol (giriş ve tüm QA-03 akışı boyunca) | csm | PASS | `Total messages: 0 (Errors: 0, Warnings: 0)` |
| L5b-B `csm-overview` vs baseline | csm | PASS | `screens/csm-overview.png` (1200×2507) ve `docs/reviews/M-06/baseline/csm-overview.png` (1200×2505). Yerleşim, boşluk, renk, tipografi, ikon, kenarlık ve gölge aynı. Fark yalnızca tarih kaynaklı: baseline 06.10.2026, bugün 09.10.2026. Bu yüzden uyarı sayısı (33→39), bildirim rozeti, "Rolüme göre radar" tarihi ve uyarı akışı satırları farklı. 2 px boy farkı bu içerikten geliyor. |
| QA-03 adım 1: Go/No-Go "Toplantıyı kaydet" | csm | PASS | Go/No-Go "Tamamlandı" |
| QA-03 adım 2: Satış Devri → "Taahhütlerin girilmesi" → taahhüt Karşılandı | csm | PASS | Not: "Karşılandı" seçiminde "Gerekçe (zorunlu)" alanı çıkıyor ve boşken kayıt `Gerekçe zorunlu` toast'ıyla reddediliyor (iş kuralı çalışıyor). Gerekçe girilince "Açık taahhütlerin kontrolü" Tamamlandı oldu. |
| QA-03 adım 3-4: kişi seç, onay notu, "Müşteri onayını kaydet" | csm | PASS | Toast metni `Müşteri onayı kaydedildi` (ayrıca `Go-Live tamamlandı — Go-Live başladı, 0 adım açıldı`). Kontrol listesinde "Müşteri onayı" Tamamlandı. "Onaylayan: Sevcan Vural (Product Owner) · 09.10.2026 · Kaydeden: Deniz Uzun" satırı görünüyor. Ekran: `screens/qa03-toast.png` |
| Ağ istekleri (4xx/5xx) | csm | PASS | `browser_network_requests` filtreli çıktı: hata yanıtı yok (backend yok, yalnızca 9 statik istek) |

Kapsam sınırları:
- L5b-B yalnızca `csm-overview` ekranı için gözle yapıldı. Kalan 36 baseline PNG tek tek karşılaştırılmadı.
- AC9'un 39 çiftlik tablosunu builder üretti, ben yeniden üretmedim.
- Bu iki noktada kanıt: bundle'lar main ile bayt düzeyinde aynı (CSS ve JS sha256 eşit), yani render farkı beklenmiyor.
- Yetkisiz rol kontrolleri, 390 px genişlik ve diğer roller bu görevde UI değişikliği olmadığı için koşulmadı.

### Düzeltme direktifi
Yok.

### Açık sorular / öneriler (engelleyici değil)
1. AC4: `undici-types` 6→7 sapması Murat tarafından kabul edildi (D4 geçişli sonucu). Sapma notta kayıtlı.
2. `npm ls xlsx --all` boş sonuçta exit 1 veriyor. Bu `ci.yml`'deki mantıkla uyumlu ve sorun değil. Gelecekte kontrolü okuyan biri için not düşülebilir.
3. L5b-A betiğinde metin rasterleştirme belirsizliği önerisi (builder notunda) F0-06'ya taşınmalı.
4. Sunucu kapatıldı (`lsof -i :8092`: dinleyen süreç yok).

Ekran görüntüleri (gate sonrası kopyalandı): `docs/reviews/chore_f0-03b-monorepo/screens/csm-overview.png`, `docs/reviews/chore_f0-03b-monorepo/screens/qa03-toast.png`
