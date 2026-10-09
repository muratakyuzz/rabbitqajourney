## reviewer — chore/f0-02-cleanup @ b936fb7 (round 2, kapsam 7702f01..HEAD)
**Karar:** APPROVE

Round 1'deki bulgulardan builder'a düşenlerin hepsi kapandı (REV-02, REV-03, RUL-01). Test zaman sabitlemesi ve `.gitleaksignore` doğru. Engelleyici bulgu yok, iki Low var. CI: Murat, run #57'nin (b936fb7) GitHub'da yeşil olduğunu ekran görüntüsüyle doğruladı. `gh` yerelde yok, okunamadı. Faz F0'da migration yok, parity atlandı.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV2-01 | Low | RUL-01, API_CONTRACT değişiklik geçmişi | docs/API_CONTRACT.md:315 | d419000, #29'un (:100) ve §2.2'nin (:138) anlamını değiştirdi: `support_track` kuralı kaldırıldı. Geçmiş tablosunda bu değişiklik görünmüyor. v1.3 satırının görev sütunu "F0-02" ama içerik yalnızca K19, K20 ve round 3 Low'larını sayıyor. Sözleşmeyi geçmişten okuyan biri (ör. F5-03'te), `support_track`'in neden kaybolduğunu tabloda bulamaz. | İsteğe bağlı. v1.3 satırının sonuna "; #29/§2.2 `support_track` no-op kuralı kaldırıldı (RUL-01)" ekle. Ya da notun "Açık sorular 3" maddesine bunun bilerek yazılmadığını not et. Test yok. |
| REV2-02 | Low | TEST_STRATEGY §3 | docs/TEST_STRATEGY.md:49; src/pages/ProjectDetail.tabs.test.tsx:32; src/lib/rabbitqa/completion.test.ts:11 | TEST_STRATEGY sabit saati `2026-09-01T09:00:00+03:00` (ofsetli) olarak tanımlıyor ve "Gerçek saate bağlı test yok" diyor. Mockup testleri ise `2026-10-05T09:00:00` (ofsetsiz, yerel saat) kullanıyor. Yerel saat olarak parse edildiği için her TZ'de yerel tarih 10-05 kalıyor; davranışta sorun yok. Sapmanın gerekçesi notta açıkça yazılı (docs/changes/chore_f0-02-cleanup.md:343). Yine de strateji metni ile pratik ayrıştı. Ayrıca fb253e1'e kadar "gerçek saate bağlı test yok" iddiası yanlıştı. | Builder'a iş yok. Denetim (TEST_STRATEGY'nin sahibi) §3'e bir not eklesin: "API seed'i 2026-09-01+03:00; mockup seed testleri 2026-10-05T09:00:00 yerel (F0-02)". |

### Doğrulananlar (kanıt özeti)
**Merge 7702f01 (kapsam dışı olduğunun teyidi)**
- `git diff 7702f01^1 7702f01 --stat` yalnızca `.github/workflows/ci.yml` gösteriyor (14+, 2−).
- `7702f01^1..7702f01^2` yalnızca 5c41bd2'yi içeriyor.
- `git show --cc 7702f01` boş, yani elle çözülmüş çakışma yok.
- `git diff 5c41bd2 7702f01 -- .github` boş: branch'teki ci.yml, main'deki ile birebir aynı.
- Beklenmedik dosya yok.

**1. Test zaman sabitleme (fb253e1)**
- `ProjectDetail.tabs.test.tsx`:
  - :1'de `afterEach` import edilmiş.
  - :32'de `NOW` var. :35-36'da dosya genelindeki `beforeEach` içinde `useFakeTimers({ toFake: ["Date"] })` ve `setSystemTime` çağrılıyor. :42'de `afterEach(useRealTimers)` var.
  - Dosyada başka timer kullanımı yok. `findBy*` ve `vi.waitFor` (:127) gerçek `setTimeout`/`setInterval` ile çalışır; yalnızca Date sahte, çakışma yok.
- `completion.test.ts`:
  - :1'de `afterEach`, `beforeEach` ve `vi` import edilmiş.
  - :11'de `NOW = new Date("2026-10-05T09:00:00")` var, tabs dosyasındakiyle aynı değer.
  - Yeni bloklar :432-433 ve :983-984.
  - :699-700'deki bloklar önceden vardı (tam `vi.useFakeTimers()`). Ayrı bir describe'da duruyor ve kendi `useRealTimers`'ıyla kapanıyor, çakışma yok.
- Seed tarihleri modül yüklenirken hesaplanmıyor. Sabitleme bu yüzden etkili:
  - `localToday()`, `new Date()`, `Date.now()` ve `todayS` çağrılarının hepsi fonksiyon gövdelerinde: `createSeed` src/lib/rabbitqa/seed.ts:169-617 aralığında, `localToday` :116-119'da.
  - Modül seviyesindeki sabitler (`SEED_*`, `PHASE_TEMPLATE`, `STATE_*`, `uid`) tarih hesaplamıyor.
  - store.tsx:29'daki `createSeed()` çağrısı fonksiyon içinde, render sırasında çalışıyor (`beforeEach`'ten sonra).
  - `src` altında modül seviyesinde `new Date`/`Date.now` ataması yalnızca iki test dosyasındaki `NOW` sabitleri.
- Uygulama koduna dokunulmadı: `git diff --stat 7702f01..HEAD -- src ':!**/*.test.*'` boş.

**2. `.gitleaksignore` (10b0aa5)**
- Dosya repo kökünde. 1 yorum satırı ve 1 parmak izinden oluşuyor:
  - Parmak izi `3f28ad429be6587dec2b30d507ea6947b2d94bec:.env:generic-api-key:2`. Bu, gitleaks'in git modunda beklediği `<commit>:<file>:<rule-id>:<line>` formatı.
  - Tam SHA kullanılmış, sonda yeni satır var. Joker yok, yalnızca tek bulguyu muaf tutuyor.
- `3f28ad4:.env` satır 2'deki değişkenin adı `VITE_SUPABASE_PUBLISHABLE_KEY`. Değer `sb_publishable_` önekli; Supabase'in yeni format publishable (anon) anahtarı, service-role/secret (`sb_secret_`) değil. Değer rapora yazılmadı.
- `.env`'e dokunan commit'ler yalnızca 3f28ad4 (ekleme) ve 7ac811c (takipten çıkarma).
- `git ls-files '.env*'` → yalnızca `.env.example`.
- CI `secrets` job'ı (`ci.yml:86-94`, `gitleaks-action@v2`, `fetch-depth: 0`) değişmedi. Kökteki `.gitleaksignore`'u kendisi okur.

**3. Round 1 bulguları**
- RUL-01 kapandı:
  - :100'deki #29 cümlesi, rules-reviewer'ın önerdiği metinle birebir aynı.
  - :138'deki §2.2 satırı üstü çizili ve "Kaldırıldı" olarak işaretli.
  - `grep support_track docs/API_CONTRACT.md` yalnızca bu 2 satırı döndürüyor. `docs/` altında (plans/reviews/changes hariç) başka geçiş yok.
- REV-02 kapandı: değişiklik notunda :258 "Mockup ↔ API" ve :292 "Ekran görüntüleri" başlıkları var, metinleri round 1 direktifiyle aynı.
- REV-03 kapandı (ikinci seçenek): "Açık sorular 3" (:307) maddesine istenen cümle eklendi.

**4. Değişiklik notu ↔ diff**
- "Review düzeltmeleri" (:320-327) ve "CI düzeltmeleri" (:329-336) tablolarındaki commit SHA'ları ve içerikleri `git show --stat` ile tutarlı.
- QA-01 ve RUL-02 ID'leri round 1 kayıtlarında mevcut.
- "Uygulama koduna dokunulmadı" iddiası doğrulandı.
- Korumalı yollara dokunulmadı: `docs/plans`, `docs/reviews`, `docs/adr`, `.claude`, `AGENTS.md`, `CLAUDE.md`, `docs/agents`, `.github`, INVARIANTS/RBAC/PRODUCT_SPEC, `.env*` ve paket dosyaları için diff boş.
- Notun "Kontroller" çıktıları (213/213, `TZ=UTC`, build) reviewer tarafından koşulmadı; qa-verifier'ın işi. CI'ın yeşil olduğunu Murat doğruladı.

### Düzeltme direktifi
1. **[REV2-01]** (isteğe bağlı, uygulama rolü): `docs/API_CONTRACT.md:315`'teki v1.3 satırının sonuna şunu ekle: "; #29/§2.2 `support_track` no-op kuralı kaldırıldı (RUL-01)". Ayrı commit, mesajda `[REV2-01]`. Test yok.
2. **[REV2-02]** Builder'a iş yok. Denetim, `docs/TEST_STRATEGY.md:49`'u mockup seed testlerinin referans tarihiyle hizalasın (M-kaydı ya da faz kapanışı).

### Açık sorular / öneriler (engelleyici değil)
1. Sahte Date dondurulmuş durumda (`shouldAdvanceTime` yok). Bu yüzden `ProjectDetail.tabs.test.tsx` içindeki tüm audit/`createdAt` damgaları aynı ana düşer. Bugün bu damgalara göre sıralama assert'i yok. İleride bu dosyaya "son eklenen üstte" türü bir assert eklenirse sıralama belirsiz olur.
2. `.gitleaksignore`'daki "proje durduruldu" iddiası (Supabase projesinin kapatıldığı) repodan doğrulanamadı. Anahtar publishable olduğu için risk düşük; Murat'ın bilgisine.

---

# Round 1

## reviewer — chore/f0-02-cleanup @ 980e65c
**Karar:** APPROVE

Engelleyici bulgu yok. Üç Low bulgu var. CI durumu okunamadı (`gh` kurulu değil, aşağıda açık soru 1).

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-01 | Low | AGENTS.md §5.2 (yalnızca plandaki kapsam), plan §2 / D6 | package.json:82 (84eeac9) | **Ne yapıldı:** `tailwindcss-animate`, `dependencies`'ten `devDependencies`'e taşındı. Planda böyle bir iş yok.<br>**Teknik açıdan doğru:**<ul><li>Eklenti yalnızca build sırasında `tailwind.config.ts`'te kullanılıyor.</li><li>Sürüm aralığı aynı.</li><li>Lock'ta yalnızca 74 `"dev": true` bayrağı eklendi; yeni paket yolu ya da sürüm değişikliği yok.</li></ul>**Sorun:** AC11'deki `--omit=dev --audit-level=high` sonucunun 0 ile çıkması kısmen bu sınıflandırmadan geliyor. Tailwind zincirindeki high açıklar (tailwindcss, chokidar, braces, micromatch, fast-glob) artık prod raporunda görünmüyor. Gerekçe olarak gösterilen Murat onayı yalnızca builder'ın değişiklik notunda yazılı (`docs/changes/chore_f0-02-cleanup.md:17, :300`); planda ve §10.2'de iz yok. | Kod değişikliği gerekmiyor. Murat kararı gate SUMMARY'sinde teyit etsin ve kararı M7'de (PHASES/AUDIT F0-02 sütunu) kalıcı kayda alsın. Kayıtta şu not yer alsın: CI'daki "Dependency audit" adımının yeşile dönmesinin bir nedeni de bu sınıflandırmadır. |
| REV-02 | Low | WORKFLOW şablon A (`docs/changes/_TEMPLATE.md` "eksiksiz doldurulur") | docs/changes/chore_f0-02-cleanup.md:266-289 | Şablondaki iki başlık notta hiç yok:<ul><li>"Mockup ↔ API": bu görevde uygulanmaz ama bu söylenmemiş.</li><li>"Ekran görüntüleri": görev `CustomerReport.tsx` ve `Phase3Tabs.tsx`'e dokunuyor.</li></ul>Okuyan, bu bölümlerin unutulduğunu mu yoksa bilerek mi atlandığını ayırt edemez. | İki başlığı ekle:<ul><li>"Mockup ↔ API: uygulanmaz (modül bağlama değil)."</li><li>"Ekran görüntüleri: AC19 kapsamında qa-verifier, `docs/reviews/chore_f0-02-cleanup/screens/`."</li></ul> |
| REV-03 | Low | plan D3 ("commit'ler tek tek geri alınabilir"), AC21 | docs/API_CONTRACT.md:315 (4eed9a8) | **Ne yapıldı:** v1.3 değişiklik geçmişi satırı C1 commit'inde (4eed9a8) yazıldı. Satır K20'yi ve round 3 Low'larının hepsini (RR-F028, RR-F029, RR-F030, REV-F024, REV-F025, REV-F028a) listeliyor. Bu maddeler ise sonraki commit'lerde yazıldı.<br>**Senaryo:** C2 commit'lerinden biri tek başına geri alınırsa (ör. `git revert da86015`), geçmiş satırı yine RR-F028'i "yazıldı" gösterir. Sözleşme ile tarihçesi tutarsız kalır. AC21'in "her C2 maddesi ayrı commit" koşulu karşılanıyor; etkisi yalnızca geri alma senaryosunda. | İsteğe bağlı. Ya her C2 commit'i kendi ID'sini geçmiş satırına eklesin ya da satır son C commit'ine taşınsın. Değişiklik yapılmazsa notun "Açık sorular 3" maddesine bu bağımlılık yazılsın. |

### Doğrulananlar (kanıt özeti)
**AC2 — lock dosyası (Murat'ın özel talimatı)**
- `git diff --diff-algorithm=histogram origin/main...HEAD -- package-lock.json` sonuçları:
  - Eklenen `"version"` satırı: 0.
  - Silinen `"version"` satırı: 147.
  - Eklenen 148 satırın 147'si `"dev": true`, kalan 1'i kök `devDependencies`'teki `tailwindcss-animate` girdisi.
- `packages` haritasını yol bazında da karşılaştırdım (node betiği, salt okuma):
  - main'de 659 yol, branch'te 512 yol. Yeni yol 0.
  - Kalan yollarda `version`, `resolved` ya da `integrity` değişikliği 0.
  - Değişen alanlar yalnızca `dev` bayrağı (148 yol) ve `@types/node` / `undici-types` için `devOptional` → `dev`.
- Silinen 147 yolun hiçbiri, kaldırılan 7 kök paket dışarıda bırakılınca main'in bağımlılık grafiğinden erişilebilir değil. Branch lock'unda çözülemeyen bağımlılık 0.
- Silinen top-level `esbuild@0.27.7` (mcp-js zinciri) yerinde vite'ın kendi `vite/node_modules/esbuild@0.21.5` kopyası duruyor; o da değişmedi.
- Commit bazında: d5abbb5'te varsayılan (Myers) diff 325 sahte `"version"` satırı gösteriyor, histogram 0. Bu, notun "Açık sorular 1" maddesiyle örtüşüyor.
- **Beklenmedik sürüm değişikliği yok. `npm audit fix` ya da update yapıldığına dair iz yok.**

**AC3 — kaldırma kanıtı**
- Her ölçüm commit'i, kaldırma commit'inin ebeveyni (1da79f7→a3e03bc, a3e03bc→d5abbb5, d5abbb5→0fe9508).
- `git grep` ile ölçüm commit'lerinde aynı çıktıyı yeniden ürettim: supabase yalnızca `client.ts:2`, lovable yalnızca `vite.config.ts:4,5,16`, xlsx/confetti/typography 0 eşleşme.

**AC4 ve INV-14**
- HEAD'de `docs/` ve lock dışında `supabase` yalnızca `.claude/hooks/guard.mjs` ve `AGENTS.md`'de geçiyor. `lovable` yalnızca `AGENTS.md:16`.
- `git ls-files` çıktısında `.env` yok, yalnızca `.env.example` var ve o da yalnızca yorum içeriyor.

**AC11 — npm audit (salt okuma koşusu)**
- `npm audit --omit=dev --audit-level=high` 0 ile çıktı; yalnızca react-router ve react-router-dom'da 2 moderate kaldı.
- Toplam 14 açık (2 critical, 6 high, 6 moderate). Paket listesi notla ve plan §2.4 b ile aynı.

**Davranış eşdeğerliği**
- `CustomerReport.tsx:76-77` ve `Phase3Tabs.tsx:545`: ifade `if/else`'e çevrildi; toast metinleri ve sıra aynı, dönüş değeri kullanılmıyor.
- `tailwind.config.ts`: `require` → ESM `import`. CSS hash'inin aynı kaldığı iddiasını qa-verifier doğrulayacak (AC10).
- `vite.config.ts`: `plugins: [react()]`; `server`, `alias` ve `dedupe` değişmedi.

**AC-NEG2 — yalnızca tip düzeyi değişiklik**
- `src` altındaki test dışı diff'te yeni `??`, `?.`, `if (` ya da `String(` içeren satırlar iki türden:
  - `targetChanged`'in yeniden satırlanması: `??` sayısı önce de sonra da 3.
  - `approveInsight`'ın mevcut satırlarındaki `as` hedefinin değişmesi.
- Plana göre izinli `if/else` dönüşümleri (B1 ternary grubu) da bu listede.
- Yeni `!`, `@ts-*` ya da `eslint-disable` yok (sayım 0).
- `InsightProposedFields` denetlenmeyen bir `as` daraltması. Değişiklik notu bunu "Öneriler"de INV-19 kapsamında kaydetmiş.

**AC18 — dokunulan dosyalar**
- `git diff --stat mockup-freeze..HEAD -- src/` çıktısı nottakiyle aynı.
- Listede olmayan tek dosya `completion.test.ts:960`, yalnızca tip annotasyonu.

**Testlerin gerçekliği (AC12–AC17, AC-NEG1)**
- `if (!insight) return` kalıbı yok.
- AC12 ve AC13'te öneri seed'leniyor. Ön koşul assert'leri (completion, `pending`), `toBeDefined` ve `throw` ile daraltma var. Adım durumu, öneri durumu ve audit sayısı korunuyor.
- AC14 mutasyonu `store.tsx:261-262`'yi (manualStatusError) hedefliyor. Nottaki "expected null" çıktısı bu yolun sınandığını gösteriyor.
- AC15 ve AC16 `store.tsx:258` yolunu kapsıyor.
- AC17 koruma testi, plan §2.3'te kabul edildiği gibi satır silinmeden önce ve sonra yeşil. `support_track` artık yalnızca testlerde geçiyor.

**Bölüm C — sözleşme**
- AC20:
  - §1 (:22) ve #3 (:74) "önceki aşama yoksa" dalını ve K19 istisnasını içeriyor.
  - #3 Doğrulama notu ADR-0005 K19 "Takip" senaryosuyla birebir aynı.
  - §4'te K19 ve K20 satırları var. `store.tsx:236-245` ve `flow.ts:83-85` referansları doğru.
  - Başlık v1.3, kararlar "K8–K20". Metin INV-25'in K19 istisnasıyla aynı yüklemi kullanıyor.
- AC21:
  - 8 C2 maddesinin her biri bulgu ID'li ayrı bir commit ve içerikleri ID'leriyle uyumlu.
  - `S26` yok.
  - D7, D8 ve D9 (a) metne doğru yansımış.
- AC-NEG3: C commit'leri yalnızca `docs/API_CONTRACT.md` ve `docs/changes/chore_f0-01-api-contract.md` dosyalarına dokunuyor.

**Yazma yetkileri**
- Builder hiçbir korumalı yola dokunmamış: `docs/plans`, `docs/reviews`, `docs/adr`, `.claude/`, `AGENTS.md`, `CLAUDE.md`, `docs/agents/`, `.github/workflows/`, `.env`, `INVARIANTS.md`, `RBAC.md`, `PRODUCT_SPEC.md`.
- `.env.example`'ı yazması M2 istisnası kapsamında.

**Kontrol listesinde uygulanmayanlar**
- B, C, D ve G maddeleri uygulanmaz: endpoint, migration, SQL ya da adaptör yok.
- BE invariant'ları (INV-01…05, 15–18, 21–24'ün BE kısmı) uygulanmaz.
- E: `components/ui` değişmedi (D4 lint override'ı yalnızca `eslint.config.js`'te). `any` kaldırıldı, `dangerouslySetInnerHTML` eklenmedi.

### Düzeltme direktifi
1. **[REV-02]** `docs/changes/chore_f0-02-cleanup.md`'ye şablondaki iki başlığı ekle:
   - "## Mockup ↔ API (modül bağlama görevlerinde)": "Uygulanmaz: bu görev modül bağlamıyor."
   - "## Ekran görüntüleri": "AC19, qa-verifier L6, `docs/reviews/chore_f0-02-cleanup/screens/`."

   Test gerekmez. Commit: `docs: complete change note template sections [REV-02]`.
2. **[REV-03]** (isteğe bağlı) `docs/API_CONTRACT.md:315`'teki v1.3 satırını, maddeleri ekleyen commit'lerle hizala ya da notun "Açık sorular 3" maddesine şu cümleyi ekle: "v1.3 geçmiş satırı C2 maddelerini önceden listeler; bir C2 commit'i geri alınırsa satır da düzeltilir." Test gerekmez.
3. **[REV-01]** Builder'a iş yok. Murat ya da denetim, gate SUMMARY'sinde ve M7'de (PHASES/AUDIT F0-02) şunu kayda alsın: `tailwindcss-animate` → `devDependencies` (84eeac9) plan dışı bir karardır ve CI audit adımının yeşil olmasının bir nedenidir.

### Açık sorular / öneriler (engelleyici değil)
1. **CI okunamadı.** `gh` kurulu değil. Merge koşulu CI'ın yeşil olmasını istiyor (AGENTS.md §5.7). Murat kontrol etmeli. İki nokta:
   - `.github/workflows/ci.yml:76-80`'deki `secrets` job'ı (gitleaks, `fetch-depth: 0`), git geçmişindeki Supabase publishable anahtarını yakalayabilir. Plan D10/M5 bunu F0-07'deki `.gitleaksignore`'a bırakıyor. Job kırmızıysa merge'ün buna rağmen yapılıp yapılmayacağına Murat karar vermeli.
   - `parity` job'ı `migrations/*.sql` olmadığı için atlanır (`ci.yml:35`).
2. **typecheck bağımsız koşulamadı.** Worktree'de `tsc --noEmit` denemesi `guard.mjs` tarafından engellendi (komut `tsconfig.app.json` yolunu içeriyor). Strict açıkken typecheck'in 0 hata verdiği ve `useState<InsightProposedFields>({ ...i.proposed })` (`InsightCard.tsx:154`) atamasının derlendiği qa-verifier'ın `npm run typecheck` koşusuyla teyit edilmeli.
3. **INV-19.** `InsightProposedFields` (`src/lib/rabbitqa/types.ts:392-396`) denetlenmeyen bir `as` daraltması: AI önerisindeki değerler doğrulanmadan typed sayılıyor. F0-04'te `packages/shared` `InsightProposal` zod şemasıyla değiştirilmeli; not bunu "Öneriler"de kaydetmiş.
4. **AC17 testi gerçek bir regresyonu yakalamaz.** `src/lib/rabbitqa/store.test.tsx:585-601`'deki koruma testi, seed'de `support_track` adımı olmadığı için satır geri eklense de yeşil kalır. Plan §2.3 bunu kabul ediyor; bilgi için yazıyorum.
