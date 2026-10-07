# qa-verifier — chore/f0-01-api-contract @ 4563ca2 (gate round 3)

**Karar: APPROVE** (Critical 0, High 0, Medium 0, Low 1)

Çalışma dizini: `/Users/murat/Development/rabbitqajourney/.verify/chore_f0-01-api-contract`. `git rev-parse HEAD` = `4563ca2a65912fa68a41289ae7c7847db5d057a6`. `git status --short` boş. `node_modules` yoktu. `npm ci` exit 0 ile kuruldu.

## Komut kanıtları

| Komut | Sonuç | Çıktı alıntısı |
|---|---|---|
| `git diff --name-only origin/main...HEAD` ; `... \| grep -v '^docs/' \| wc -l` (AC5) | PASS | 12 dosya, hepsi `docs/` altında (`docs/API_CONTRACT.md`, `docs/INVARIANTS.md`, `docs/PRODUCT_SPEC.md`, `docs/RBAC.md`, `docs/adr/0004…`, `docs/adr/0005…`, `docs/changes/…`, `docs/reviews/…`). `docs/` dışı sayısı: `0`. `git diff origin/main...HEAD -- src package.json package-lock.json \| wc -l` = `0`. |
| `awk '/interface Ctx/,/^}/' src/lib/rabbitqa/store.tsx` → `state`/`userId` hariç ad sayısı (AC1) | PASS | `wc -l` = `51`. API_CONTRACT §2.1 başlığı "Tablo (51 işlem)". Her ad `\| \`<ad>\`` kalıbıyla §2.1'de arandı. Eksik çıkan tek ad `setConfig`. Gerçekte §2.1'de 39a–39h satırları var (`\| 39a \| \`setConfig("template")\``, 39b modules, 39c questions, 39d salespeople, 39e alertThresholds, 39f holidays, 39g integrations, 39h users). Kalıp farkı yüzünden çıkan yanlış eksik, satır mevcut. Gerçek eksik: 0. |
| AUDIT §2 rotaları ↔ API_CONTRACT §3 (AC2) | PASS | `sed -n 12,26p docs/AUDIT.md` ile rotalar okundu. Her rotanın §3'te GET satırı var. `/login, /forgot-password, /reset-password` → `GET /auth/me`. `/app/overview` → `GET /overview`. `/app/insights` → `GET /insights`. `/app/projects` → `GET /projects`. `/app/projects/:id` → 13 sekme (Aşamalar ve adımlar, Aksiyonlar, Toplantılar, Keşif ve takımlar, Erişim bilgileri, Dokümanlar, Riskler ve kararlar, Go-Live, Süreklilik, Entegrasyonlar, Müşteri kişileri, Müşteri geçmişi, Destek kayıtları) + 02/03/04/05/00 panelleri. `/app/projects/:id/report` → `GET /projects/:projectId/reports`. `/app/my-work` → `GET /me/work`. `/app/reports` → `GET /reports/management`. `/app/admin` → 8 sekme (Aşama şablonu, Modüller, Entegrasyonlar, Keşif soruları, Kullanıcılar, Satışçılar, Uyarılar, Değişiklikler). |
| §1.1 kataloğu ↔ §2–§3 kullanılan `x:y` aksiyonları (AC3) | PASS | Katalog (satır 24–59) 64 benzersiz aksiyon. §2–§3 (satır 61–203) 64 benzersiz `x:y`. `comm -13 cat used` çıktısı yalnızca `adapt:general`. Bu bir adım anahtarı (#14 `addTeam`, §2.2), authorize aksiyonu değil, yanlış pozitif. Katalogda `adaptation:read` ve `session:authenticated` var (`grep -xE` ile ikisi de bulundu). |
| `grep -n 'session:authenticated\|adaptation:read' docs/RBAC.md` (REV-F019a, 4563ca2) | PASS | `34:\| Oturumlu, kaynağa bağlı olmayan uçlar (\`GET /auth/me\`, \`POST /auth/logout\`; \`session:authenticated\`) \| ✔ (oturumlu) \| ✔ (oturumlu) \| ✔ (oturumlu) \| ✔ (oturumlu) \| ✔ (oturumlu)`. Beş rolün hepsi ✔. `adaptation:read` RBAC.md'de aksiyon adıyla geçmiyor. Uyarlama satırı katalogda "Uyarlama kontrol listesi" olarak eşli. İstenen kontrol `session:authenticated` idi. |
| §5.1 / §5.2 (`sed -n 260,296p docs/API_CONTRACT.md`) | PASS | §5.1 satırları: yalnızca `S20`, `S21`, `S22`. §5.2 dayanakları: S10 "Murat onayı, ADR-0005 K14 (2026-10-06)". S13 "Murat onayı, ADR-0005 K15". S15 "Murat onayı, ADR-0005 K16, INV-28 (c)". S17 "Murat onayı, ADR-0005 K17". S18 "Murat onayı, ADR-0005 K18". S24 "INV-28 (Murat onayı, 2026-10-06)". Altta: "S10, S13, S15, S17 ve S18 gate round 2'de (REV-F017) Murat onayıyla ADR-0005 K14–K18 olarak karara bağlandı". |
| Değişiklik notu "Round 2" tablosundaki commit hash'leri (`git log --format='%h %s' origin/main..HEAD \| grep -E '^(…)'`) | PASS | Tablodaki 17 hash'in 17'si branch'te (`1f3a107, dbfe25a, dd84070, b8b2fdf, 71bbdfa, bdaf926, 1af4327, 06b5c43, 880dda4, 8de2024, f7941f5, bd90f8c, 1bacd80, a24fb28, b9e2086, 36d6630` + REV-F019 `880dda4`) ve mesajlarda bulgu ID'si var. Örnekler: `1f3a107 … [RR-F018]`, `dbfe25a … [REV-F013] [RR-F020]`, `dd84070 … [REV-F015] [RR-F019]`, `b8b2fdf … [RR-F021] [REV-F018]`, `06b5c43 … [REV-F017]`, `880dda4 … [REV-F019]`, `bd90f8c … [RR-F023]`, `1bacd80 … [RR-F024]`, `a24fb28 … [RR-F025]`, `b9e2086 … [RR-F026]`, `f7941f5 … [REV-F021]`. `36d6630 docs: API_CONTRACT v1.2 sürüm notu (gate round 2, ADR-0005 K14–K18)` sürüm notu, bulgu ID'si beklenmiyor. `71bbdfa … [RR-F022]`, `bdaf926 … [REV-F014]`, `1af4327 … [REV-F016]`, `8de2024 … [REV-F020]` da doğrulandı. REV-F022 satırında hash yok ("—"), tutarlı. Ek: `4563ca2 docs(rbac): REV-F019a oturumlu uçlar satırı` ve `6e48571 … [REV-F001]` branch'te. |
| `npm run lint` | FAIL, main ile aynı (miras) | exit=1. `✖ 42 problems (14 errors, 28 warnings)`. Örnek: `tailwind.config.ts 114:13 error A \`require()\` style import is forbidden`. Main değeri round 2'de `git archive origin/main` (7ba26ef) çıktısında ölçülmüş: `✖ 42 problems (14 errors, 28 warnings)`. `src`, `package.json` ve lockfile diff'i 0 satır, yani main ile birebir aynı kod. |
| `npx tsc --noEmit` | PASS | exit=0, çıktı boş. |
| `npm test` | PASS | exit=0. `Test Files  13 passed (13)` / `Tests  210 passed (210)` / `Duration  9.21s`. |
| `npm run build` | PASS | exit=0. `✓ built in 9.53s`. Chunk boyutu uyarısı main'deki gibi (`index-l0omCwOO.js 1,224.09 kB`). |

## Kabul kriteri ↔ test

Doküman görevi, otomatik test yok. Doğrulama belge kontrolüdür.

| AC | Doğrulama | Sonuç | Kanıt |
|---|---|---|---|
| AC1 | `interface Ctx` adları ↔ §2.1 | PASS | 51 ad, gerçek eksik 0 (`setConfig` 39a–39h satırlarında). |
| AC2 | AUDIT §2 rotaları ↔ §3 GET | PASS | Tüm rotalar ve 13 + 8 sekme eşli. |
| AC3 | `x:y` aksiyonları ↔ §1.1 ↔ RBAC | PASS | 64/64 katalogda. `session:authenticated` RBAC.md:34'te. |
| AC4 | audit / gerekçe / kural kolonları | UNVERIFIED (bu oturumun kapsamı dışı) | Görev listesinde yoktu. rules-reviewer ve reviewer örneklemle doğrular. |
| AC5 | `docs/` dışı 0 | PASS | `grep -v '^docs/' \| wc -l` = 0. |

## Tarayıcı kontrolü

Uygulanmaz. Faz F0, yalnızca doküman görevi. `src`, `package.json` ve lockfile diff'i 0 satır, UI ve akış değişmedi. Playwright MCP ile gözle kontrol ve `npm run e2e` gerekmez.

## Bulgular

| ID | Önem | Bulgu |
|---|---|---|
| QA3-F001 | Low | Değişiklik notu (`docs/changes/chore_f0-01-api-contract.md`) "Round 2" tablosunda REV-F019 satırı "(a) Düzeltilmedi — RBAC.md satırı denetim oturumunun işi" diyor. `4563ca2` ile (a) artık yapıldı (RBAC.md:34). Not bayat. Merge'i engellemez. Denetim sonrası hizalanabilir, uygulama oturumu notu günceller. |

## Notlar

- **CI:** `gh` yok, CI durumu okunamadı. CI F0-07'de kurulacak. Migration yok (parity uygulanmaz). Bunlar engel değil.
- **Lint:** 14 error main'den miras, bu branch'in getirdiği yeni sorun yok. FAIL etiketi yalnızca "main'den farklı değil" anlamında.
- **Araç notu:** İlk hash döngüsü zsh word-splitting nedeniyle boş çıktı verdi. Doğru sonuç yukarıdaki `grep -E` komutundan alındı.
- **Çalıştırılamayan:** yok (AC4 kapsam dışı olduğu için yukarıda UNVERIFIED olarak işaretli).
- **Arka plan sunucu:** başlatılmadı.
