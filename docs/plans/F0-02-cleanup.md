# F0-02 — Temizlik (tek kilit dosyası, kullanılmayan paketler, lint, strict, sahte-yeşil testler, sözleşme takibi)

**Durum:** Onaylandı (Murat, 2026-10-07; kararlar §10.2 "Murat cevapları")
**Spec referansı:** Yok, teknik görev. Dayanaklar: `docs/adr/0001-stack.md` ("Kaldırılanlar"), `AGENTS.md` §2 ("Kullanılmaz: `xlsx`, Supabase"), `docs/PHASES.md` F0-02 satırı, `docs/reviews/BACKLOG.md` (F0-02 hedefli maddeler), `docs/reviews/chore_f0-01-api-contract/SUMMARY.md` (round 3 direktifi), `docs/adr/0005-f0-01-contract-decisions.md` K19 ve REV-F022 süreç notu.
**Branch:** `chore/f0-02-cleanup`
**Bağımlılıklar:** F0-01 ✅ (main @ 92231d2), `mockup-freeze` etiketi. Ön adımlar M1–M4 ve M9 (ADR-0005 K20) `/build`'den önce main'de olmalı (§13).

---

## 1. Amaç
Repoyu F0-03'e (monorepo ve yükseltme) temiz bir başlangıç olarak bırakmak. İşler şunlar:
- Tek kilit dosyası (npm), Lovable ve Supabase kalıntılarının ve kullanılmayan paketlerin kaldırılması.
- `.env` dosyasının repodan çıkması.
- Lint 0 error, gerçek bir `typecheck` script'i ve TS `strict`.
- Sahte-yeşil iki testin gerçek teste çevrilmesi.
- No-op `support_track` satırının kaldırılması.

Mockup davranışı değişmez. Ayrıca F0-01 gate round 3'ün takip maddeleri (K19 ve Low'lar) `docs/API_CONTRACT.md`'ye yazılır.

## 2. Kapsam

Plan üç bölümden oluşur. A ve B kod/repo işidir, C yalnızca dokümandır. Üçü aynı branch'te, ayrı commit gruplarında yapılır (karar D3).

**Bölüm A — Repo hijyeni**
- A1. `bun.lock` ve `bun.lockb` silinir. Tek kilit dosyası `package-lock.json` kalır. `.gitignore`'a `bun.lock`, `bun.lockb`, `yarn.lock` ve `pnpm-lock.yaml` eklenir. Mevcut tekrarlar (`dist`/`dist/`, `.idea`/`.idea/`) temizlenir.
- A2. Kullanılmayan paketler kaldırılır: `xlsx`, `@supabase/supabase-js`, `canvas-confetti`, `@types/canvas-confetti`, `@lovable.dev/mcp-js`, `lovable-tagger`. `@tailwindcss/typography` da kaldırılır (D5 = evet, Murat 2026-10-07). Paket başına kanıt §2.2'dedir.
- A3. `src/integrations/supabase/` (`client.ts`, `previewAuthStorage.ts`, `types.ts`) ve `supabase/config.toml` silinir. `previewAuthStorage.ts:38` `prefer-const` hatası dosyayla birlikte gider.
- A4. `vite.config.ts`'ten `componentTagger` (lovable-tagger) ve `mcpPlugin` (@lovable.dev/mcp-js) çıkarılır. Kalan `plugins: [react()]` olur. `server`, `resolve.alias` ve `dedupe` değişmez.
- A5. `.lovable/` klasörü (6 plan dosyası) silinir.
- A6. `README.md` Türkçe olarak yeniden yazılır, Lovable metni kalmaz (içerik §12'de).
- A7. `.env.example` oluşturulur. Yazan, M2 guard değişikliği yapıldıysa builder'dır, yapılmadıysa Murat (karar D11). `.env`'in repodan çıkması Murat'ın işidir (M4): builder'ın guard'ı `.env` yoluna `git rm` dahil her yazmayı engeller.
- A8. `eslint.config.js` `ignores` listesine `.verify`, `coverage`, `playwright-report` ve `test-results` eklenir. Gerekçe: `/gate` worktree'leri `.verify/` altında açılır ve `eslint .` onları da tarar.

**Bölüm B — Kalite kapıları ve testler**
- B1. Lint 14 error 0'a iner (dosya bazında talimat §12'de). Uyarılar (28) düzeltilmez, öneri olarak §14'tedir.
- B2. `package.json`'a `"typecheck": "tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json"` eklenir. Kök `tsconfig.json` `files: []` olduğu için `npx tsc --noEmit` hiçbir dosyayı derlemiyor (REV-18). CI zaten `npm run typecheck --if-present` çalıştırıyor (ci.yml:24).
- B3. TS strict açılır. `tsconfig.app.json`'da `strict: true` yapılır ve `noImplicitAny: false` satırı silinir. Kök `tsconfig.json`'dan `noImplicitAny: false` ve `strictNullChecks: false` silinir. Düzeltmeler yalnızca tip düzeyinde olur (eşik ve kurallar D2'de).
- B4. AC5/AC17 sahte-yeşil testleri düzeltilir (REV-M13-02 / RUL-02). İki test de `store.test.tsx:454-469` ve `:530-543`'te `if (!insight) return;` içeriyor. `ai-mock.ts:49` yalnızca açık **manual** adıma `step_update` önerisi ürettiği için bu öneri hiç oluşmuyor ve testler hiçbir assert çalıştırmadan geçiyor.
  - Yalnızca `if (!insight) return;` → `expect(insight).toBeDefined()` değişikliği yapılırsa testler **kırmızı** olur.
  - Doğru düzeltme: öneri `simulateIncoming` ile değil, mevcut `seedWithStepUpdateInsight` (store.test.tsx:472-489) desenindeki gibi localStorage'a seed'lenir. Ardından `expect(insight).toBeDefined()` yazılır ve tip daraltılır.
- B5. "Adım bulunamadı" testleri yazılır (RUL-03 m13).
  - (a) `updateStep` geçersiz id ile çağrılır (store.tsx:258).
  - (b) `approveInsight` `step_update` önerisini olmayan bir `targetId` ile uygular (store.tsx:689-690).
- B6. No-op `support_track` satırı (store.tsx:480) kaldırılır (REV-07 Faz M). Önce koruma testi yazılır, sonra satır silinir (davranış kanıtı §2.3'te).

**Bölüm C — Sözleşme takibi (`docs/API_CONTRACT.md` ve değişiklik notu)**
- C1. K19'un yansıması: §1 :22, #3 :74, §4 :228. REV-F028b yüklemi ("önceki aşama yoksa") ve ADR-0005 K19 "Takip" bölümündeki Doğrulama notu eklenir. Başlıkta (:3-4) sürüm v1.3, kararlar "K8–K20" olur.
- C2. Round 3 Low maddeleri, her biri ayrı commit'te: RR-F032 (D7), RR-F029, RR-F030 (D9), RR-F028 (D8), REV-F025, REV-F024, REV-F028a, QA3-F001 (metinler §12'de).

### 2.1 Kapsam ayrımı: F0-02 mi, F0-03 mü?
| İş | Öneri | Gerekçe |
|---|---|---|
| `bun.lock` + `bun.lockb` silme, `npm ci` | **F0-02** | Paket sürümüne dokunmuyor, salt silme |
| Kullanılmayan paketler (A2) | **F0-02** | Kullanılmadıkları kanıtlı. 5 audit açığını kapatır (§2.4) |
| `.lovable/`, README, Supabase dosyaları | **F0-02** | Salt silme, çalışma zamanına etkisi yok |
| `.env` çıkarma + `.env.example` + `.gitignore` | **F0-02** | INV-14. Supabase kalkınca uygulama hiç ortam değişkeni kullanmıyor (grep: `import.meta.env` yalnızca `client.ts:6-7`) |
| Lint 14 error | **F0-02** | QA-F001. Dönüşümler davranışı koruyor |
| `typecheck` script'i + TS strict | **F0-02** (eşikli, D2) | F0-03 dosyaları `apps/web`'e taşıyacak ve React 19 tipleri kendi hatalarını getirecek. Strict hatalarını yükseltmeden önce ayırmak hata kaynağını netleştirir |
| Lint uyarıları (28) | **F0-04** (öneri, §14) | `exhaustive-deps` düzeltmesi effect zamanlamasını değiştirir. F0-04 ekranları hook'lara taşırken bu kodu zaten yeniden yazacak |
| Code-split (bundle ~1,16–1,22 MB) | **F9-03** (D1) | `React.lazy` Suspense yükleme durumu ekler, ekran görüntüsü zamanlamasını ve L5b karşılaştırmasını etkiler. Vite 8 (Rolldown) chunk yapılandırma API'sini değiştirdiği için F0-03 öncesi `manualChunks` işi tekrar yapılır. PHASES F9-03 zaten code-split'i içeriyor |
| Majör yükseltmeler: vite 8, tailwind 4, react-router 7 | **F0-03** | PHASES F0-03 satırında var. Kabul ölçütü M-06 görsel referansı (L5b) |
| vitest 5 (+ `@vitest/*`, tinypool) | **F0-03** (PHASES satırına eklenmeli, M7) | Vite 8 ile uyum. 2 critical açık yalnızca test çalıştırıcıda, üretim paketinde değil |
| `@vitejs/plugin-react-swc` → `@vitejs/plugin-react` v6, React 19, recharts 3, date-fns 4 | **F0-03** | ADR-0001 |
| `package.json` `name` (`vite_react_shadcn_ts`), `engines` | **F0-03** | Kök `package.json` workspace köküne dönüşecek |
| Bugün import edilmeyen `date-fns`, `zod`, `@hookform/resolvers` | **Kaldırılmaz** | Hedef stack'te (ADR-0001), F0-03/F0-04'te kullanılacak |

### Kapsam dışı
- `npm audit fix` ve paket sürümü yükseltmesi (karar §2.4 / D6).
- `components/ui/*` dosyalarının elle düzenlenmesi (AGENTS.md §3; D4).
- Code-split, lint uyarıları, `.github/workflows/ci.yml` (builder yazamaz), `.claude/` ve `CLAUDE.md` (§13, Murat/denetim).
- Ekran, akış, store davranışı değişikliği (`mockup-freeze`).

### 2.2 Kullanılmayan paketlerin kanıtı (denetim ölçümü, main @ 92231d2)
| Paket | Kanıt (Grep) | Sonuç |
|---|---|---|
| `xlsx` | `src/`, `index.html`, `*.config.*`'te `'xlsx'` / `"xlsx"` yok. Geçtiği yerler: yalnızca `package.json:67`, `package-lock.json`, `bun.lock`, `.github/workflows/ci.yml:31` (yasak paket kontrolü) ve `AGENTS.md:43` (yasak notu) | Kullanılmıyor. ADR-0001 yasaklıyor |
| `@supabase/supabase-js` | Yalnızca `src/integrations/supabase/client.ts:2`. Bu dosyayı import eden yok: `integrations/supabase` yalnızca `client.ts:4` (iç import) ve `client.ts:35` (yorum) içinde geçiyor. `VITE_SUPABASE_*` yalnızca `client.ts:6-7`'de | Kullanılmıyor (ölü dosya ağacı) |
| `canvas-confetti`, `@types/canvas-confetti` | `src/` ve config dosyalarında hiç geçmiyor | Kullanılmıyor |
| `@lovable.dev/mcp-js` | Yalnızca `vite.config.ts:5,16` (`mcpPlugin()`), yani **config'te kullanılıyor**. Eklenti yalnızca `src/lib/mcp/index.ts` varsa Supabase Edge Function üretiyor (`node_modules/@lovable.dev/mcp-js/dist/stacks/supabase/vite.d.ts:4-47`). Bu dosya yok (Glob). Eklentide `transformIndexHtml` yok, sayfaya bir şey enjekte etmiyor | Etkisiz. Kaldırma `vite.config.ts` düzenlemesiyle aynı commit'te yapılır |
| `lovable-tagger` | Yalnızca `vite.config.ts:4,16`, `mode === "development"` koşuluyla | Build çıktısına etkisi yok. Dev'de DOM'a `data-lov-*` öznitelikleri ekliyor, görsel etkisi yok |
| `@tailwindcss/typography` (D5) | `tailwind.config.ts:114` `plugins` yalnızca `tailwindcss-animate`. `prose` sınıfı ve `typography` hiçbir kaynak dosyada yok | Kayıtlı değil, CSS çıktısına etkisi yok |

`.env` yalnızca `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY` ve `VITE_SUPABASE_URL` içeriyor. `supabase/config.toml` yalnızca `project_id`.

### 2.3 `support_track` no-op kanıtı (store.tsx:480)
1. `setStepByKey` (rules.ts:63-65) adım bulunamazsa `s`'i **aynı nesne** olarak döndürüyor. React aynı state'te yeniden çizim yapmıyor, audit yazılmıyor.
2. Şablonda ve seed'de `support_track` anahtarlı adım yok (completion.test.ts:585-589).
3. Bu anahtarla adım üreten bir yol da yok. Grep'te `support_track` yalnızca store.tsx:480 ve testte geçiyor. Admin şablon editöründe adım anahtarı girişi yok (Admin.tsx:142-143 yalnızca mevcut `key`'i okuyor).
4. `addTicket` ekrandan ulaşılmıyor: Destek kayıtları sekmesi "Faz 2" olarak pasif (AUDIT §7).

Sonuç: satırın kaldırılması davranışı değiştirmez. Koruma testi (AC17) kaldırmadan önce ve sonra yeşildir.

### 2.4 `npm audit` raporu ve yükseltme kararları (`npm audit fix` YAPILMAZ)
Denetim ölçümü (2026-10-07, main @ ae26604): 19 açık (2 critical, 9 high, 8 moderate).

**a) F0-02'deki kaldırmalarla kapananlar**
| Paket | Severity | Doğrudan mı | Kapanma yolu |
|---|---|---|---|
| `xlsx` | high | evet (dep) | kaldırma (A2) |
| `@lovable.dev/mcp-js` | high | evet (dep) | kaldırma (A2, A4) |
| `@modelcontextprotocol/sdk` | high | hayır (yalnızca mcp-js'in bağımlılığı, package-lock.json:908) | mcp-js ile |
| `lovable-tagger` | moderate | evet (dev) | kaldırma. Kendi iç `esbuild` ^0.25 kopyası da gider (package-lock.json:6297) |
| `@tailwindcss/typography` | moderate | evet (dev) | kaldırma (D5). Kendi `postcss-selector-parser@6.0.10` kopyası gider |

**Beklenen sonuç (D5 evetse):** 14 açık (2 critical, 6 high, 6 moderate). `npm audit --omit=dev` yalnızca `react-router` ve `react-router-dom` (2 moderate) gösterir. `npm audit --omit=dev --audit-level=high` 0 ile çıkar, yani CI `app` job'ının "Dependency audit" adımı yeşil olur. Builder gerçek çıktıyı yazar, sapma varsa açıklar.

**b) Kalanlar: her biri ayrı satır, karar Murat'ta (D6)**
| Paket | Sev. | Doğrudan | Mevcut | Önerilen | Majör | Risk | Mockup/baseline etkisi | Öneri |
|---|---|---|---|---|---|---|---|---|
| `vite` | high | evet (dev) | ^5.4.19 | 8.x | evet | Rolldown, `plugin-react` v6, config API değişir; açık yalnızca dev server'da | Yüksek (bundle, dev server) | F0-03 |
| `esbuild` | moderate | hayır (vite 5) | 0.21.x | vite 8 ile | evet (vite) | Dev server istek/dosya okuma | Yok | F0-03 |
| `vitest` | critical | evet (dev) | ^3.2.4 | 5.x | evet | Test API ve config; yalnızca test | Yok (üretim paketi değil) | F0-03 (PHASES F0-03 satırına eklenmeli) |
| `tinypool` | critical | hayır (vitest) | — | vitest 5 ile | evet | Prototype pollution → RCE, yalnızca yerel/CI test çalıştırıcısı | Yok | F0-03 |
| `@vitest/mocker` | moderate | hayır | — | vitest 5 ile | evet | Path traversal (test) | Yok | F0-03 |
| `tailwindcss` | high | evet (dev) | ^3.4.17 | 4.x | evet | CSS motoru yeniden yazıldı, CSS-first config, varsayılan border/ring/shadow değerleri değişir | **Yüksek görsel risk**, L5b şart | F0-03 |
| `chokidar` | high | hayır (tailwind 3) | 3.x | tailwind 4 ile | evet | Build zamanı | Yok | F0-03 (zincir kalkar) |
| `micromatch` | high | hayır | — | tailwind 4 ile | evet | ReDoS (build zamanı) | Yok | F0-03 |
| `braces` | high | hayır | — | tailwind 4 ile | evet | Stack exhaustion (build zamanı) | Yok | F0-03 |
| `postcss-selector-parser` | moderate | hayır | <7.1.6 | tailwind 4 ile | evet | Quadratic parse (build zamanı) | Yok | F0-03 |
| `fast-glob` | high | hayır | — | major olmayan fix var (yalnızca lock) | hayır | Build zamanı | Yok (lock-only) | D6: F0-03'te zincir kalkar (öneri) ya da hedefli `npm update fast-glob` |
| `postcss-nested` | moderate | hayır | — | major olmayan fix var (yalnızca lock) | hayır | Build zamanı | Yok | D6 (aynı) |
| `react-router-dom` | moderate | evet (dep) | ^6.30.1 | 7.x | evet | Open redirect, constructor injection. v7 API ve future flag'ler | Orta (rota/yönlendirme davranışı) | F0-03 |
| `react-router` | moderate | hayır | — | dom 7 ile | evet | Aynı | Aynı | F0-03 |

F0-03 ile ilişki: kalan 14 açığın hepsi F0-03'ün hedef sürümleriyle (vite 8, vitest 5, tailwind 4, react-router 7) kapanır. Bunlardan yalnızca vitest PHASES F0-03 satırında yok. F0-02'de yapılmamalarının nedeni şu: üçü görsel ve davranış riski taşıyor ve kabulleri M-06 görsel referansına (L5b) bağlı. L5b ise yalnızca M-06, F0-03 ve F0-04'te koşuyor (TEST_STRATEGY §1).

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: yok.

`pg-only` gereksinimi: yok.

## 4. API etkisi
Yeni ya da değişen endpoint yok (kod yok). Yalnızca `docs/API_CONTRACT.md` metni değişir (Bölüm C):

| Yer | Değişiklik | Kaynak |
|---|---|---|
| :3-4 | Sürüm v1.3 ("F0-01 takip: K19, K20, round 3 Low'ları"); kararlar "K8–K20" | — |
| §1 :12 | `401 UNAUTHENTICATED` | REV-F025 |
| §1 :17 | Yazım: "(#3 `done → in_progress`, #16 K2, #14 K16), adım durumunu…" | REV-F028a |
| §1 :22 | Aşamanın kapsama dönüşü: "önceki aşama yoksa" dalı + K19 istisnası; `out_of_scope → in_progress` adım sonucu | K19, REV-F028b, RR-F030 |
| §1.1 :58 | "RBAC.md satırı" sütunu → "Oturumlu, kaynağa bağlı olmayan uçlar" (RBAC.md:34) | REV-F024 |
| #3 :74 | K19 kapsama dönüş metni + yeni Doğrulama; `→ out_of_scope` iken açık `phase_approval` `cancelled` (hedef davranış) | K19, RR-F032 (ADR-0005 K20) |
| #5 :76 | `out_of_scope → in_progress` sonucu; `goLiveApproval` varken `customer_approval` `done`'dan çıkışı `409` | RR-F030, RR-F029 |
| #14 :85 | 07 `done` iken `409`'un 05'in durumundan bağımsız olduğu | RR-F028 |
| §3 :158 | Oturumsuz `GET /auth/me` → `401` | REV-F025 |
| §4 :228 (+ yeni RR-F032 satırı) | K19 farkı; yeni satır "Kapsam dışı aşamada aşama onayı aksiyonu" (mockup açık bırakır, API `cancelled`) | K19, RR-F032 (ADR-0005 K20) |

## 5. Yetki etkisi (RBAC)
Değişiklik yok. REV-F024 yalnızca RBAC.md:34'teki mevcut satıra referans verir.

| Rol | İzin | Not |
|---|---|---|
| csm | değişmez | — |
| devops | değişmez | — |
| care | değişmez | — |
| manager | değişmez | — |
| admin | değişmez | — |

## 6. UI etkisi
- Ekranlar/bileşenler: görsel ya da davranış değişikliği **yok**. Dokunulan dosyalar:
  - `CustomerReport.tsx:76-77` ve `Phase3Tabs.tsx:545`: ifade → `if/else`, aynı toast.
  - `InsightCard.tsx`: yalnızca tip.
  - `store.tsx`: :480 no-op satırı ve :672 tip.
  - `tailwind.config.ts:114`: `require` → `import`, CSS çıktısı aynı.
- Boş/yükleniyor/hata durumları: değişmez.

## 7. Kabul kriterleri

**Ön ölçüm (zorunlu, ilk iş):** Builder dalı açmadan önce main @ `<sha>` üzerinde şunları ölçer ve değişiklik notuna "Ölçüm — main" başlığıyla yazar:
- Lint özeti ve 42 problemin `dosya:satır:kural` listesi.
- `npx tsc --noEmit -p tsconfig.app.json` hata sayısı (mevcut ayarla) ve aynı komutun `--strict` ile hata sayısı.
- `npm test` dosya/test sayısı (beklenen 13/210).
- `npm run build` çıktısı (asset adları ve boyutları; CSS dosya adı içerik hash'ini taşır).
- `npm audit` özeti (`--json` → severity sayıları ve paket listesi) ile `npm audit --omit=dev` özeti.

**A — Repo hijyeni**
- **AC1** — Given branch'in temiz klonu, When `ls bun.lock bun.lockb` ve `rm -rf node_modules && npm ci` çalıştırılır, Then iki dosya da yoktur, `npm ci` 0 ile çıkar. `.gitignore` `bun.lock`, `bun.lockb`, `yarn.lock` ve `pnpm-lock.yaml`'ı yok sayar.
- **AC2** — Given branch, When `npm ls xlsx @supabase/supabase-js canvas-confetti @types/canvas-confetti @lovable.dev/mcp-js lovable-tagger @tailwindcss/typography` çalıştırılır, Then çıktı `(empty)` olur. `package.json`'da bu adlar geçmez. `git diff main -- package-lock.json` içinde eklenen (`+`) `"version"` satırı yoktur; kalan paketlerin sürümü değişmemiştir.
- **AC3** — Given her kaldırma commit'i, When değişiklik notu okunur, Then o paket için §12'deki kanıt komutlarının **kaldırmadan hemen önce** üretilmiş çıktısı, ölçüldüğü commit hash'iyle birlikte yer alır. Sonuç "0 kullanım" olur. Tek istisna, aynı commit'te silinen `vite.config.ts:4,5,16` satırlarıdır.
- **AC4** — Given branch build'i, When şu kontroller yapılır, Then hepsi sağlanır:
  - `src/integrations/`, `supabase/` ve `.lovable/` yoktur.
  - `grep -rni lovable --exclude-dir={node_modules,.git,docs} .` yalnızca `AGENTS.md` (tarihçe cümlesi) eşleşmesini verir.
  - `npm run build` sonrası `grep -ri supabase dist/` boştur (INV-14).
- **AC5** — Given `README.md`, Then Lovable metni ve linki yoktur. Dosya Türkçedir; §12'deki başlıkları ve komutları içerir.
- **AC6** — Given branch (M4 sonrası main'den açılmış), When `git ls-files .env .env.example` çalıştırılır, Then yalnızca `.env.example` listelenir. `.env.example`'da değer içeren satır yoktur, yalnızca yorum ve boş anahtar olabilir.

**B — Kalite kapıları**
- **AC7** — When `npm run lint`, Then **0 error**. Uyarı sayısı ≤ 28'dir ve main listesinde olmayan uyarı yoktur (karşılaştırmalı liste değişiklik notunda). `git diff main -- src tailwind.config.ts | grep -c eslint-disable` → 0.
- **AC8** — When `npm run typecheck`, Then 0 hata. `tsconfig.app.json`'da `"strict": true` vardır, `noImplicitAny` satırı yoktur. Kök `tsconfig.json`'da `noImplicitAny`/`strictNullChecks: false` yoktur. D2 eşiği aşılırsa AC8 şu şekilde karşılanır: `typecheck` script'i mevcut ayarla 0 hata verir, strict ölçümü değişiklik notundadır ve madde "Açık sorular"a girer.
- **AC9** — When `npm test`, Then tüm testler geçer. Test sayısı ≥ 213 olur (main 210 + B5'ten 2 + B6'dan 1), dosya sayısı ≥ 13.
- **AC10** — When `npm run build`, Then build başarılı olur. CSS asset dosya adı (içerik hash'i) main'deki ile **aynıdır**. Bu, `tailwind.config.ts` dönüşümünün ve typography kaldırmanın CSS'i değiştirmediğinin kanıtıdır. JS chunk boyutları önce/sonra değişiklik notuna yazılır.
- **AC11** — When `npm audit` ve `npm audit --omit=dev --audit-level=high` çalıştırılır, Then önce/sonra tablosu değişiklik notundadır, ikinci komut 0 ile çıkar ve sapmalar açıklanır. `npm audit fix` çalıştırılmamıştır (AC2'deki lock kanıtı).

**C — Sahte-yeşil testler ve "Adım bulunamadı"**
- **AC12 (AC17 düzeltmesi)** — Given `p_ornek`'te durumu `pending` olan bir `completion: "data"` adımı ve ona hedefli `step_update` (`proposed: { status: "done" }`) önerisi localStorage'a seed'lenmiş, When `approveInsight(id)` çağrılır, Then:
  - Dönüş `"Bu adım veriyle tamamlanır"` olur.
  - Adım durumu `pending` kalır, öneri `pending` kalır, audit sayısı değişmez.
  - Testte `expect(insight).toBeDefined()` ve ön koşul assert'i (`expect(step.status).toBe("pending")`, `expect(step.completion).toBe("data")`) vardır; erken `return` yoktur.
- **AC13 (AC5 düzeltmesi)** — AC12 ile aynı, hedef `completion: "meeting"` adımıdır. Beklenen dönüş yine `"Bu adım veriyle tamamlanır"`.
- **AC14 (mutasyon kanıtı)** — Given AC12/AC13 testleri, When builder store.tsx:261-262'deki `manualStatusError` kontrolünü **geçici olarak** devre dışı bırakıp testi koşar, Then iki test de kırmızıdır. Geri alınınca yeşildir. Çıktı değişiklik notuna yazılır, geçici değişiklik commit edilmez.
- **AC15** — Given seed, When `updateStep("st_missing", { status: "done" }, "x")` çağrılır, Then dönüş `"Adım bulunamadı"` olur; `state.steps` ve `state.audit.length` değişmez.
- **AC16** — Given `targetId: "st_missing"` olan bir `step_update` önerisi seed'lenmiş, When `approveInsight(id)` çağrılır, Then dönüş `"Adım bulunamadı"` olur, öneri `pending` kalır, audit sayısı değişmez (RUL-03 m13).
- **AC-NEG1** — `grep -n "if (!insight) return" src/lib/rabbitqa/store.test.tsx` boştur.

**D — No-op kaldırma**
- **AC17** — Given `p_ornek`, When `addTicket({ projectId, status: "open", priority: "medium", … })` çağrılır, Then `state.steps` çağrı öncesiyle `toEqual` olur ve gerekçesi `"Otomatik kural: destek kaydı açıldı"` olan audit kaydı yoktur.
  - Test önce ayrı bir commit'te eklenir ve yeşildir. Satır sonraki commit'te silinir, test yine yeşildir; iki koşu da değişiklik notunda.
  - Sonunda `grep -n support_track src/lib/rabbitqa/store.tsx` boştur.

**E — Mockup donması**
- **AC18** — `git diff --stat mockup-freeze..HEAD -- src/` yalnızca şu dosyaları içerir:
  - `src/integrations/supabase/*` (silinen)
  - `src/components/rq/InsightCard.tsx`
  - `src/lib/rabbitqa/store.tsx`
  - `src/lib/rabbitqa/store.test.tsx`
  - `src/lib/rabbitqa/types.ts` (yalnızca `InsightProposedFields` tipi)
  - `src/pages/CustomerReport.tsx`
  - `src/pages/project/Phase3Tabs.tsx`
  - B3 strict düzeltmesinin dokunduğu dosyalar. Her biri değişiklik notunda "yalnızca tip" notuyla listelenir.
- **AC-NEG2** — Lint `any` düzeltmeleri ve strict düzeltmeleri çalışma zamanı ifadesi eklemez. Bu commit'lerin diff'inde yeni `??`, `?.`, `if (`, `String(`, varsayılan değer ve `@ts-expect-error`/`@ts-ignore` yoktur. İzinli olanlar: tip tanımı, tip argümanı, `as` dönüşümü ve non-null `!`. Reviewer diff'te doğrular. Builder `!` kullandığı her yeri, olası hata olarak değişiklik notunun "Öneriler" bölümüne yazar.
- **AC19** — Given `/gate` sırasında qa-verifier (L6), When etkilenen ekranlar açılır, Then baseline PNG'lerle görsel fark yoktur ve davranış aynıdır:
  - Ekranlar: `csm-customer-report.png`, `csm-tab-golive.png`, `csm-insights.png`, `csm-insights-step-update-edit-dialog-status-open.png`, `csm-phase6-riskdialog-*.png` ve rastgele 3 ekran.
  - Davranış: rapor "Kaydet" ve "Gönderildi" toast'ları, Go-Live onay toast'ı, insight onay diyaloğu. Konsolda yeni hata yoktur.

**F — Sözleşme (Bölüm C)**
- **AC20** — `docs/API_CONTRACT.md`'de şunlar sağlanır:
  - §1 :22 ve #3 :74 "önceki aşama yoksa" dalını ve K19 istisnasını içerir.
  - #3 Doğrulama notu ADR-0005 K19 "Takip" senaryosunu (03/`vpn_req`/02 K10/00) içerir.
  - §4 :228 "ADR-0005 K19" dayanağını taşır.
  - Başlık v1.3 ve "K8–K20" olur.
  - Metin INV-25'in K19 istisnasıyla çelişmez (rules-reviewer karar tablosu).
- **AC21** — C2'deki her madde bulgu ID'li ayrı bir commit'tir. Değişiklik notunda "Sözleşme takibi" tablosu vardır (ID → durum → commit). Murat'ın kararları (2026-10-07; D7, D8, D9 hepsi (a)) metne şöyle yansır:
  - RR-F032: #3'te hedef davranış + Doğrulama ve §4'te mockup farkı satırı; dayanak "ADR-0005 K20 (Murat onayı, 2026-10-07)". `grep -n "S26" docs/API_CONTRACT.md` boştur.
  - RR-F028: 07 `done` → `409`, 05'in durumundan bağımsız.
  - RR-F030: adım açılırsa istenen durum uygulanır, açılmazsa `locked` kalır.
- **AC-NEG3** — Bölüm C commit'leri yalnızca `docs/API_CONTRACT.md` ve `docs/changes/chore_f0-01-api-contract.md` dosyalarına dokunur.

## 8. Test planı (seviyeler: docs/TEST_STRATEGY.md)
| AC | Seviye | Beklenen test / doğrulama |
|---|---|---|
| AC1, AC2, AC6, AC11 | Komut kontrolü (qa-verifier yeniden koşar) | `npm ci`, `npm ls`, `git ls-files`, `npm audit` çıktıları |
| AC3, AC4, AC5 | Belge/grep kontrolü (reviewer) | Değişiklik notundaki kanıt bölümü; grep çıktıları |
| AC7, AC8, AC9, AC10 | Komut kontrolü | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` |
| AC12, AC13, AC15, AC16, AC17, AC-NEG1 | L3 (Vitest + Testing Library, `RqProvider`) | `src/lib/rabbitqa/store.test.tsx`: `describe("approveInsight — step_update guard (AC17)")`, `"… (AC5)"`, yeni `describe("not found (RUL-03)")`, `describe("addTicket — support_track no-op (REV-07)")` |
| AC14 | Mutasyon kanıtı (lokal, commit edilmez) | Değişiklik notunda kırmızı/yeşil çıktı |
| AC18, AC-NEG2 | Diff kontrolü (reviewer) | `git diff --stat mockup-freeze..HEAD -- src/` |
| AC19 | L6 (qa-verifier, Playwright MCP) + baseline PNG karşılaştırması | `docs/reviews/chore_f0-02-cleanup/screens/` |
| AC20, AC21, AC-NEG3 | Belge kontrolü (reviewer + rules-reviewer karar tablosu) | `docs/API_CONTRACT.md` |

## 9. İlgili invariant maddeleri
- **INV-14** — `.env` repodan çıkar; build'de Supabase anahtarı kalmaz (AC4, AC6).
- **INV-21, INV-23** — AI `step_update` onayı mevcut servisten geçer; AC12/AC13/AC16 bunu mockup'ta gerçekten sınar.
- **INV-26** — Veri/toplantı adımı elle `done` yapılamaz (`manualStatusError`); AC12–AC14 ile kanıtlanır.
- **INV-25** — K19 istisnası sözleşmeye yazılır (C1); RR-F030 adım sonucu; RR-F032 (ADR-0005 K20): kapsam dışı aşamada `phase_approval` aksiyonu iş olarak kalmaz (`cancelled`, proje kilidi altında, INV-08).
- **INV-28** — RR-F028 (07 `done` → `409` kapsamı). D8 = (a) kabul edildi (Murat, 2026-10-07); INV-28 cümlesi denetimce netleştirilir (M8).
- **INV-16, INV-17** — REV-F025: oturumsuz istek `401` (`session:public` hariç).
- **INV-09** — Kural kodundan no-op satır kalkar; idempotans etkilenmez.
- **INV-19** — `InsightProposedFields` mockup'ta geçici tiptir; F0-04'te `packages/shared` `InsightProposal` şemasıyla değişir (ikinci tip kaynağı olarak kalmamalı).

## 10. Riskler ve açık sorular

### 10.1 Risk tablosu (madde × mockup/baseline etkisi)
| Madde | Mockup davranışı | Baseline etkisi | Doğrulama |
|---|---|---|---|
| A1 bun kilitleri | Yok | Yok | AC1 |
| A2/A3 Supabase, xlsx, confetti | Yok (hiç import edilmiyor) | Yok | AC2–AC4, build |
| A4 lovable-tagger / mcpPlugin | Build yok. Dev'de `data-lov-*` öznitelikleri kalkar | Yok (görsel değil) | AC10 CSS hash, AC19 |
| A2 typography (D5) | Yok (plugin kayıtlı değil) | Yok | AC10 CSS hash |
| A5/A6 `.lovable/`, README | Yok | Yok | AC4, AC5 |
| A7 `.env` | Yok (uygulama env kullanmıyor) | Yok | AC6, build |
| A8 eslint ignores | Yok | Yok | AC7 |
| `tailwind.config.ts:114` `require` → `import` | Aynı eklenti | Yok (CSS byte aynı) | AC10 |
| `CustomerReport.tsx:76-77` ifade → `if/else` | Aynı toast | `csm-customer-report.png`: yok | AC19 |
| `Phase3Tabs.tsx:545` ifade → `if/else` | Aynı toast | `csm-tab-golive.png`: yok | AC19 |
| `InsightCard.tsx` `any` → tip | Yalnızca tip | `csm-insights*.png`: yok | AC-NEG2, AC19, mevcut testler |
| `store.tsx:672` `any` → tip | Yalnızca tip | Yok | store testleri, AC-NEG2 |
| `components/ui` lint override (D4) | Kod değişmez | Yok | AC7 |
| B3 strict | Yalnızca tip | Yok | AC8, AC9, AC-NEG2 |
| B4/B5 testler | Yok | Yok | AC9, AC14 |
| B6 `support_track` | No-op (§2.3) | Yok | AC17 |
| C sözleşme | Yok (doküman) | Yok | AC20, AC21 |
| (F0-03'e kalanlar) vite 8 / tailwind 4 / react-router 7 | Davranış riski | **Yüksek**: L5b şart | F0-03 kabulü |

Diğer riskler:
- **Strict hata sayısı bilinmiyor.** AUDIT v3'teki "`tsc --strict` 0" ölçümü 4bfa4cb'de alındı. Sonraki gate'lerdeki "tsc 0" iddialarının bir kısmı kök tsconfig ile ölçüldü ve hiç dosya derlemedi (REV-18). İlk gerçek `typecheck` strict olmadan bile hata gösterebilir. Ön ölçüm bu yüzden zorunlu; eşik D2'de.
- **Diff boyutu.** Silinen üretilmiş dosyalar (`bun.lock` ≈1.300 satır, `bun.lockb`, `supabase/types.ts`, `.lovable/`, lock budaması) ≈400 satır kuralına sayılmaz. Kod/test/konfig/doküman değişikliği tahmini: lint ≈40, test ≈90, konfig ≈25, README ≈40, `.gitignore`/eslint ≈15, sözleşme ≈20 uzun satır, strict ≤150 (eşik). Toplam ≈380. Strict eşiği aşılırsa görev bölünür (D2).
- **gitleaks.** Supabase publishable anahtarı git geçmişinde kalır, CI `secrets` job'ı `fetch-depth: 0` ile tarar (D10).

### 10.2 Karar tablosu (Murat)

> **Murat cevapları (2026-10-07):**
> - D1–D12: "Öneri" sütunu kabul edildi. Tek fark **D7 = (a)**:
>   - Hedef davranış: aşama `out_of_scope` olunca açık `phase_approval:<phaseId>` aksiyonu `cancelled` olur, gerekçesi "Otomatik kural: aşama kapsam dışı".
>   - §4'e mockup farkı satırı eklenir.
>   - Dayanak "Murat onayı (2026-10-07)", kalıcı kaydı ADR-0005 K20 (M9). §5.1'de S26 **açılmaz**.
> - §10.3'teki iki madde: varsayılanlar geçerli. Strict kapalıyken çıkan `tsc` hataları B3 kurallarıyla düzeltilir ve D2 eşiğine dahildir. AGENTS.md/reviewer.md eskimeleri M6 kit işidir.
> - Plan durumu: Onaylandı.
| # | Soru | Seçenekler | Öneri (güvenli varsayım) |
|---|---|---|---|
| D1 | Code-split nerede? | (a) F9-03 · (b) F0-03 (Vite 8 sonrası) · (c) F0-02 `manualChunks` | **(a)**. PHASES F0-02 satırından çıkarılır (M7) |
| D2 | TS strict F0-02'de mi? | (a) F0-02, eşikli: strict hataları ≤ 30 **ve** düzeltme diff'i ≤ 150 satır ve yalnızca tip · (b) ayrı görev F0-02b · (c) F0-03 | **(a)**. Eşik aşılırsa builder strict'i açmaz, ölçümü yazar, (b) olur |
| D3 | Sözleşme takibi (Bölüm C) | (a) aynı branch, ayrı commit grubu · (b) ayrı branch `chore/f0-01b-contract-followups` | **(a)**. rules-reviewer kod tarafında da tetikleniyor (`approveInsight`, store kuralı), tek gate döngüsü yeter. Commit'ler yalnızca `docs/` dosyalarına dokunur, tek tek geri alınabilir |
| D4 | `no-empty-object-type` (`command.tsx:24`, `textarea.tsx:5`) | (a) `eslint.config.js`'te `src/components/ui/**` için kural `off` · (b) dosyaları `type X = Y`'ye çevir | **(a)**. AGENTS.md §3: `components/ui` elle değiştirilmez. F0-03'te shadcn bileşenleri yeniden üretilebilir |
| D5 | `@tailwindcss/typography` kaldırılsın mı? | evet / hayır | **Evet** (kanıt §2.2; CSS hash ile doğrulanır) |
| D6 | Audit yükseltmeleri | Satır satır §2.4 b | **Hiçbiri F0-02'de değil.** Majörler F0-03'e; vitest 5 PHASES F0-03 satırına eklenir. `fast-glob`/`postcss-nested` lock güncellemesi yapılmaz (tailwind 4 ile zincir kalkar) |
| D7 | RR-F032: aşama `out_of_scope` olunca açık `phase_approval` aksiyonu | (a) Murat onaylar → hedef davranış: aksiyon `cancelled` (`Otomatik kural: aşama kapsam dışı`), §4 satırı, dayanak "Murat onayı" · (b) onay yok → §5.1 **S26** açılır, güvenli varsayım = `cancelled` | **Karar: (a)** (Murat, 2026-10-07). Dayanak ADR-0005 K20 (M9); S26 açılmaz. (İlk öneri (b) idi; açık onayla geçersizleşti.) |
| D8 | RR-F028: 07 `done` iken `addTeam` `409` mu, 05'in durumundan bağımsız mı? | (a) bağımsız: 07 `done` → her durumda `409` · (b) 05 `out_of_scope` ise mockup gibi adım `out_of_scope` oluşur | **(a)**. Canlı projeye takım eklemek yeni iş açmamalı. INV-28 cümlesi denetimce netleşir (M8) |
| D9 | RR-F030: adımda `out_of_scope → in_progress` sonucu | (a) adım açılırsa istenen durum (`in_progress`) uygulanır, açılmazsa `locked` kalır (200) · (b) adım her zaman akış sonucu `pending` olur, istenen durum uygulanmaz | **(a)**. RR-F021'deki `out_of_scope → done` ile simetrik; tek fark `done` açılamazsa `409`. Aşamada akış açılışı zaten `in_progress` (flow.ts:38) |
| D10 | Lovable'ın Supabase projesi (`vpcaiosbjfbpvwkkjbgm`) ve geçmişteki anahtar | (a) projeyi Supabase/Lovable panelinden durdur/sil; geçmiş yeniden yazılmaz (force push yasak); gitleaks bulgusu F0-07'de `.gitleaksignore` ile kayda alınır · (b) dokunma | **(a)**. Publishable anahtar istemci için tasarlanmış ama proje artık kullanılmıyor |
| D11 | `.env.example`'ı kim yazar? | (a) guard'da builder'a `.env.example` istisnası (M2); F0-08 de buna ihtiyaç duyar · (b) Murat elle yazar | **(a)** |
| D12 | CLAUDE.md yazma listesi (REV-F022) | §13 M3'teki tablo | M3'teki metin |

### 10.3 Açık sorular (yukarıdakilere ek) — kapandı: Murat varsayılanları onayladı (2026-10-07)
- Ön ölçümde mevcut ayarla (`strict` kapalı) `tsc -p tsconfig.app.json` hata verirse? Güvenli varsayım: hatalar B3 kurallarıyla (yalnızca tip) düzeltilir ve D2 eşiğine dahil edilir.
- `AGENTS.md:28-29` ("state v8, 52 işlem") ve `docs/agents/reviewer.md` ("INV-01…27") hâlâ eski. Bunlar kit işi (M6), F0-02 builder kapsamında değil.

## 11. Gerekli gate'ler
- [x] reviewer: hijyen, lint dönüşümlerinin davranış eşdeğerliği, AC-NEG2 (yalnızca tip), testlerin gerçekliği, kanıt bölümü, sözleşme metni
- [x] qa-verifier:
  - Temiz klonda `npm ci`; lint/typecheck/test/build.
  - `npm audit` önce/sonra.
  - AC14 mutasyon kanıtının yeniden üretilmesi (isteğe bağlı).
  - L6 tarayıcı turu + baseline karşılaştırması (AC19).
- [x] **rules-reviewer: EVET.** Tetikleyiciler:
  - `approveInsight`, `step_update` (AI Insight onayı, INV-21/23): AC12–AC16.
  - Mockup kural kodu: `setStepByKey`/`support_track` (store.tsx:480).
  - Sözleşmedeki sıralı akış/kilit/kapsam metni: K19 (`locked`, `activatedAt`, `out_of_scope`, INV-25), RR-F028 (INV-28), RR-F029/RR-F032 (`phase_approval`, Go-Live).
  - Beklenen çıktı: K19 metninin INV-25 ile karar tablosu.

## 12. Uygulama görev metni
```
AGENTS.md, docs/INVARIANTS.md, docs/RBAC.md, docs/DATA_MODEL.md ve docs/TEST_STRATEGY.md dosyalarını oku.
Ardından docs/plans/F0-02-cleanup.md planını uygula. Kararlar §10.2'deki "Murat cevapları (2026-10-07)" bloğundadır: D1–D12 "Öneri" sütunu, D7 hariç (D7 = (a), dayanak ADR-0005 K20).

Ön koşul: main'de M1–M4 ve M9 commit'leri var (guard PRODUCT_SPEC + .env.example istisnası, CLAUDE.md, .env takipten çıkarıldı, ADR-0005 K20). `git ls-files .env` boş değilse ya da `grep -n "^## K20" docs/adr/0005-f0-01-contract-decisions.md` boşsa dur, Murat'a sor.
Branch: chore/f0-02-cleanup (main'den). PR açma.

0) ÖN ÖLÇÜM (main üzerinde, değişiklikten önce) → docs/changes/chore_f0-02-cleanup.md "Ölçüm — main @ <sha>":
   - npx eslint . → özet + 42 problemin dosya:satır:kural listesi
   - npx tsc --noEmit -p tsconfig.app.json (hata sayısı) ve aynı komut --strict ile (hata sayısı + dosya dağılımı)
   - npm test → dosya/test sayısı · npm run build → asset adları ve boyutları (CSS dosya adını ayrıca not et)
   - npm audit --json özeti (severity sayıları, paket listesi) · npm audit --omit=dev özeti

BÖLÜM A — Repo hijyeni (her madde ayrı commit, Conventional Commits)
A1 chore: remove bun lockfiles
   - git rm bun.lock bun.lockb
   - .gitignore'a bun.lock, bun.lockb, yarn.lock, pnpm-lock.yaml ekle; tekrarları temizle (dist/dist/, .idea/.idea/). .env, .env.*, !.env.example kalır.
A2–A4 Paket kaldırma. HER paket için kaldırmadan hemen önce kanıtı yeniden üret ve değişiklik notunun "Kanıt" bölümüne komut + çıktı + commit hash olarak yapıştır:
   - xlsx:        grep -rnE "['\"]xlsx['\"]" src index.html *.config.* tsconfig*.json ; npm ls xlsx
   - supabase:    grep -rn "@supabase/supabase-js" src index.html *.config.* ; grep -rn "integrations/supabase" src | grep -v "^src/integrations/supabase/" ; grep -rn "VITE_SUPABASE" src | grep -v "^src/integrations/supabase/"
   - confetti:    grep -rn "confetti" src index.html *.config.*
   - lovable:     grep -rnE "@lovable.dev|lovable-tagger|componentTagger|mcpPlugin" src index.html *.config.* ; ls src/lib/mcp
   - typography:  grep -rnE "typography|\bprose\b" src index.html *.config.*
   Beklenen: 0 eşleşme (lovable için yalnızca vite.config.ts:4,5,16; bunlar aynı commit'te silinir).
   - chore: remove unused supabase integration → git rm -r src/integrations/supabase supabase ; npm uninstall @supabase/supabase-js
   - chore: remove lovable vite plugins → vite.config.ts'ten iki import ve plugin çağrıları; plugins: [react()] ; npm uninstall @lovable.dev/mcp-js lovable-tagger
   - chore: remove unused packages [REV-14] → npm uninstall xlsx canvas-confetti @types/canvas-confetti @tailwindcss/typography (D5 = evet: typography dahil)
   - Kaldırmalardan sonra: git diff main -- package-lock.json içinde eklenen "version" satırı olmamalı (AC2). Olursa dur ve notla.
   - npm audit fix ÇALIŞTIRMA. Sürüm yükseltme YAPMA.
A5 chore: remove .lovable plans → git rm -r .lovable
A6 docs: rewrite README without Lovable → Türkçe başlıklar: "RabbitQA Onboarding Tracker" (1 paragraf: Virgosol iç ekibinin müşteri onboarding takip uygulaması; şu an dondurulmuş demo mockup, veri tarayıcıda), "Gereksinimler" (Node 24, npm), "Çalıştırma" (npm ci · npm run dev → http://localhost:8080 · demo giriş: store'daki kullanıcılar), "Kontroller" (npm run lint · npm run typecheck · npm test · npm run build), "Belgeler" (AGENTS.md, docs/PRODUCT_SPEC.md, docs/PHASES.md, docs/WORKFLOW.md). Lovable linki/metni yok.
A7 chore: add .env.example (yalnızca M2 guard istisnası varsa; yoksa atla, notta "Murat" yaz). İçerik yalnızca yorum:
   # RabbitQA — ortam değişkenleri örneği. Şu an (F0-02) uygulama ortam değişkeni kullanmıyor; demo veri tarayıcıda.
   # F0-04/F0-05/F0-08 ile eklenecek: VITE_DATA_<MODÜL>=mock|http, DB_DRIVER=pgmem|pg, DATABASE_URL, CREDENTIALS_KEY.
   # Web paketine yalnızca VITE_ önekli, gizli olmayan değişkenler girer (INV-14). Gerçek değerler .env'e yazılır, .env repoya girmez.
A8 chore(lint): ignore .verify, coverage, playwright-report, test-results in eslint.config.js

BÖLÜM B — Kalite kapıları ve testler
B4 test: seed step_update insights for AC17/AC5 instead of early return [REV-M13-02]
   - store.test.tsx:454-469 (AC17) ve :530-543 (AC5): simulateIncoming yolunu kaldır (ai-mock.ts:49 yalnızca açık manual adıma öneri üretir, öneri hiç oluşmaz).
   - Mevcut seedWithStepUpdateInsight desenini dosya düzeyinde genelleştir (ör. seedStepUpdateInsight({ completion, status, proposed, targetId? })). REV-13 AC1–AC3 testlerinin assert'leri değişmez.
   - AC17: completion "data" adım, AC5: completion "meeting" adım; ikisinde de status "pending", proposed { status: "done" }.
   - Her testte: ön koşul assert'leri (adım bulundu, completion ve status beklenen), expect(insight).toBeDefined() + daraltma (if (!insight) throw new Error("seed")), dönüş "Bu adım veriyle tamamlanır", adım durumu ve öneri "pending" kalır, audit.length değişmez. "if (!insight) return" kalmaz.
   - AC14: store.tsx:261-262'yi GEÇİCİ olarak yorum satırı yap → iki test kırmızı; geri al → yeşil. Çıktıyı nota yaz, geçici değişikliği commit ETME.
B5 test: cover "Adım bulunamadı" for updateStep and step_update approval [RUL-03]
   - updateStep("st_missing", { status: "done" }, "x") → "Adım bulunamadı"; steps ve audit.length değişmez.
   - targetId "st_missing" olan step_update önerisi seed → approveInsight → "Adım bulunamadı"; öneri pending; audit.length değişmez.
B6 iki commit:
   - test: addTicket leaves steps unchanged (support_track no-op guard) [REV-07] → p_ornek'e addTicket (open, medium); steps toEqual(önce); "Otomatik kural: destek kaydı açıldı" gerekçeli audit yok. Yeşil.
   - refactor: drop no-op support_track rule from addTicket [REV-07] → store.tsx:480 satırını sil; test yine yeşil. setStepByKey import'u başka yerde kullanılıyorsa kalır.
B1 Lint 14 → 0 [QA-F001] (kural grubu başına commit). eslint-disable YAZMA.
   - CustomerReport.tsx:76-77, Phase3Tabs.tsx:545: `e ? toast.error(e) : toast.success(...)` → `if (e) toast.error(e); else toast.success(...);` (metinler aynı).
   - tailwind.config.ts:114: dosya başına `import tailwindcssAnimate from "tailwindcss-animate";`, `plugins: [tailwindcssAnimate]`. Build sonrası CSS dosya adı main ile aynı olmalı (AC10). Farklıysa geri al ve dur.
   - no-explicit-any (InsightCard.tsx:42, 58-59, 152; store.tsx:672): src/lib/rabbitqa/types.ts'e
     `export type InsightProposedFields = { title?: string; description?: string; ownerId?: string | null; ball?: Ball; priority?: Priority; impact?: Priority; due?: string | null; status?: StepStatus | ActionStatus; health?: Health; healthReason?: string; phaseId?: string; planEnd?: string; goLiveDate?: string } & Record<string, unknown>;`
     ekle (yorum: "Mockup; F0-04'te packages/shared InsightProposal şemasıyla değişir"). Tip adlarını types.ts'teki gerçek adlarla eşle. `any` yerine bu tipi, `Record<string, unknown> | undefined` tipini ve `as` (gerekirse `as unknown as`) kullan. Çalışma zamanı ifadesi (??, ?., String(), if, varsayılan) EKLEME ve DEĞİŞTİRME (AC-NEG2).
   - no-empty-object-type (components/ui/command.tsx:24, textarea.tsx:5): D4 = (a) (Murat, 2026-10-07): eslint.config.js'e { files: ["src/components/ui/**/*.{ts,tsx}"], rules: { "@typescript-eslint/no-empty-object-type": "off" } } ekle; ui dosyalarına dokunma.
   - prefer-const (previewAuthStorage.ts:38): A3 ile dosya silindi.
   - Sonuç: 0 error; 28 uyarının dosya:satır:kural listesini nota yaz (düzeltme). Main listesinde olmayan uyarı olmamalı.
B2 chore: add typecheck script → "typecheck": "tsc --noEmit -p tsconfig.app.json && tsc --noEmit -p tsconfig.node.json"
B3 chore: enable TypeScript strict
   - tsconfig.app.json: "strict": true, "noImplicitAny": false satırını sil. Kök tsconfig.json: "noImplicitAny": false ve "strictNullChecks": false satırlarını sil.
   - Eşik (D2): ön ölçümde strict hatası > 30 ise ya da düzeltme diff'i 150 satırı aşacaksa strict'i AÇMA. B2 ile bitir, hata dağılımını nota yaz, "Açık sorular"a "F0-02b" yaz.
   - Düzeltmeler yalnızca tip: tip annotasyonu, generic, `as`, non-null `!`. ??/?./if/varsayılan/@ts-ignore/@ts-expect-error YOK. Her `!` kullanımını nota "olası hata (F3/F4'te bakılsın)" olarak yaz. Dokunulan her dosyayı nota listele (AC18).

BÖLÜM C — Sözleşme takibi (yalnızca docs/API_CONTRACT.md ve docs/changes/chore_f0-01-api-contract.md; her madde ayrı commit, mesajda bulgu ID)
C1 docs(api): reflect ADR-0005 K19 [REV-F023][RR-F027][REV-F028b]
   - :3-4 → v1.3 ("F0-01 takip: K19, K20, round 3 Low'ları"), "K8–K20"; :4 kaynak listesinde "docs/adr/0005-f0-01-contract-decisions.md (K8–K20)".
   - §1 :22 aşama cümlesi: kapsama dönen aşama locked olur; akış motoru aynı transaction'da, proje kilidi altında aşamayı ÖNCEKİ AŞAMA YOKSA, aşama independent ise ya da önceki aşama geçilmişse (done/out_of_scope) açar, değilse locked kalır. Daha önce açılmış (activatedAt dolu) aşamada içindeki açık (pending/in_progress) adımlar da aynı transaction'da locked olur, activatedAt ve due temizlenir (eski değerler alan başına audit'te, gerekçe "Otomatik kural:"). done ve out_of_scope adımlar değişmez. Yeniden açılış normal akış açılışıdır: aşamada activatedAt = now, actualStart korunur; adımlar akış kuralıyla activatedAt = now ve iş günü terminiyle açılır, eski due geri gelmez. Sonraki aşamalar geri kilitlenmez (INV-25 tek istisnası, ADR-0005 K19).
   - #3 :74 "Kapsama dönüş" paragrafı aynı içerikle. Doğrulama şununla değişir: "03 açıkken vpn_req pending → 03 out_of_scope → 02 K10 ile açılır → 03 geri alınır → 03 ve vpn_req locked, vpn_req activatedAt/due boş, eski değerler audit'te; uyarı ve Bana Atananlar kaydı yok; done adım done kalır; 02 geçilince vpn_req yeni activatedAt ve iş günü termini ile pending. Ek: 00 geri alınınca (önceki aşama yok) hemen açılır; 02 geçilmişse aynı istekle 03 akışla açılır; SaaS projede 03 geri alınınca ONPREM adımları out_of_scope olur."
   - §4 :228 API sütununa K19 (açık adımlar locked, activatedAt/due temizlenir, normal akış açılışı); mockup sütununa "aşamayı doğrudan in_progress yapar, adımlara dokunmaz (store.tsx:236-245)"; Gerekçe: "INV-25 (K19 istisnası), ADR-0005 K19, REV-F013, RR-F020".
C2 Low'lar (her biri ayrı commit):
   - [RR-F032] (D7 = (a), dayanak ADR-0005 K20 — kararın tam metni orada):
     · #3 :74 hedef davranış: "Aşama `out_of_scope` yapılınca açık (`open`/`in_progress`) `phase_approval:<phaseId>` aksiyonu aynı transaction'da, proje kilidi altında `cancelled` olur; gerekçe `Otomatik kural: aşama kapsam dışı`, audit alan başına. Aşama geri alınıp yeniden hazır olunca iptal edilen geri açılmaz, akış motoru yeni aksiyon açar (`ruleKey` ile idempotent). Dayanak: ADR-0005 K20 (Murat onayı, 2026-10-07)."
     · Doğrulama: "Hazır aşama (zorunlu adımlar tamam, `phase_approval` açık) `out_of_scope` yapılınca aksiyon `cancelled` olur ve audit gerekçesi `Otomatik kural: aşama kapsam dışı` olur; aşama geri alınıp yeniden hazır olunca yeni `phase_approval` açılır, eskisi `cancelled` kalır."
     · §4'e yeni satır: Konu "Kapsam dışı aşamada aşama onayı aksiyonu" | Mockup "Aşama `out_of_scope` olunca `phase_approval` açık kalır (flow.ts:83-85 yalnızca `done` ve aktif-hazır-değil durumunda kapatır)" | API "`cancelled`, `Otomatik kural: aşama kapsam dışı`, proje kilidi altında; yeniden hazır olunca yeni aksiyon" | Gerekçe "ADR-0005 K20, INV-25, INV-08 (RR-F032)".
     · §5.1'e S-maddesi AÇMA (S26 yok).
   - [RR-F029] #5 :76: projede goLiveApproval varken customer_approval'ın elle done'dan çıkışı 409 (§5 S22 güvenli varsayımının parçası). Doğrulama: #38 → 07 K10 ile açılır → PATCH pending → 409.
   - [RR-F030] #5 :76 ve §1 :22: D9'a göre adımda out_of_scope → in_progress sonucu (a: adım açılırsa istenen durum uygulanır, açılmazsa locked kalır).
   - [RR-F028] #14 :85: D8'e göre tek cümle (a: 07 done ise 05'in durumundan bağımsız 409). Doğrulamaya "05 out_of_scope + 07 done → 409" ekle.
   - [REV-F025] §1 :12: "401 UNAUTHENTICATED: oturum yok, süresi dolmuş ya da pasif kullanıcı (session:public uçları hariç)"; §3 :158 oturumsuz GET /auth/me → 401.
   - [REV-F024] §1.1 :58: "RBAC.md satırı" sütunu → "Oturumlu, kaynağa bağlı olmayan uçlar".
   - [REV-F028a] :17 → "(#3 `done → in_progress`, #16 K2, #14 K16), adım durumunu…".
   - [QA3-F001] docs/changes/chore_f0-01-api-contract.md: REV-F019 satırı (a) → "Denetim oturumunda yapıldı (4563ca2)"; AC5 satırında denetim commit'lerine 4563ca2 ekle.
   - Bu commit'ler docs/ dışına dokunmaz. INVARIANTS.md, RBAC.md, PRODUCT_SPEC.md ve ADR'ye yazma (guard engeller; gerekiyorsa "Açık sorular").

Bitiş:
- npm run lint && npm run typecheck && npm test && npm run build → çıktı özetleri nota (önce/sonra tablosu: lint, tsc, test sayısı, build boyutları + CSS dosya adı, npm audit ve npm audit --omit=dev --audit-level=high).
- git diff --stat mockup-freeze..HEAD -- src/ çıktısını nota yaz (AC18).
- docs/changes/_TEMPLATE.md → docs/changes/chore_f0-02-cleanup.md: AC ↔ test tablosu (dosya + test adı), Kanıt bölümü (A2–A4), lint uyarı listesi, "Sözleşme takibi" tablosu (ID → durum → commit), Öneriler (! kullanımları, lint uyarıları, code-split).
- Test çıktılarını commit etme. Branch'i push et. PR açma.
Kurallar: docs/WORKFLOW.md şablon A. Emin olmadığın iş kuralını tahmin etme; "Açık sorular"a yaz.
```

## 13. Denetim / Murat işi (builder dışı, builder görev metnine girmez)
Builder `.claude/`, `CLAUDE.md`, `AGENTS.md`, `docs/agents/`, `docs/INVARIANTS.md`, `docs/adr/` ve `.env*`'a yazamaz (guard.mjs:44-47). M1–M4 ve M9 (isteğe bağlı M6 ile birlikte) **`/build`'den önce** main'de olmalıdır:
- M1–M3 ve M9 **denetim oturumunda hazırlanır (2026-10-07), Murat commit'ler.**
- M4'ü (`git rm --cached .env`) Murat yapar.

Önerilen commit'ler:
- `chore(kit): guard PRODUCT_SPEC + .env.example, CLAUDE.md yazma listesi [REV-F022]`
- `chore: stop tracking .env`
- `docs(adr): ADR-0005 K20 — kapsam dışı aşamada phase_approval iptali [RR-F032]`

- **M1 [REV-F022]** `.claude/hooks/guard.mjs` `AUDIT_PATHS`'e `/^docs\/PRODUCT_SPEC\.md$/` eklenir. Böylece spec'i builder yazamaz. *Denetim oturumunda hazırlandı, Murat commit'ler.*
- **M2 (D11)** `AUDIT_PATHS`'teki `/^\.env/` → `/^\.env(?!\.example$)/` olur. Builder `.env.example`'ı yazabilir, `.env`'e yine dokunamaz. `APP_PATHS` değişmez (denetim hiçbir `.env*`'a yazamaz). Bash `MUTATORS` kontrolü `.env` token'ını korumaya devam eder. *Denetim oturumunda hazırlandı, Murat commit'ler.*
- **M3 [REV-F022]** `CLAUDE.md:24` satırı şu tabloyla değişir (D12). *Denetim oturumunda hazırlandı, Murat commit'ler.*
  | Dosya / klasör | Denetim | Uygulama | Zorlayan |
  |---|---|---|---|
  | `docs/plans/`, `docs/reviews/`, `docs/adr/` | ✔ | — | guard |
  | `docs/INVARIANTS.md`, `docs/RBAC.md`, `docs/PRODUCT_SPEC.md` | ✔ (Murat onayıyla) | — | guard |
  | `AGENTS.md`, `CLAUDE.md`, `docs/agents/`, `.claude/` (`.claude/role` hariç) | ✔ (yalnızca Murat'ın istediği kit değişikliği) | — | guard |
  | `docs/DATA_MODEL.md`, `docs/AUDIT.md`, `docs/PHASES.md` | ✔ | yalnızca plan gerektiriyorsa | kural |
  | `docs/API_CONTRACT.md`, `docs/changes/` | — (sözleşmeyi uygulama rolü yazar, gate denetler) | ✔ | kural |
  | `docs/TEST_STRATEGY.md`, `docs/WORKFLOW.md` | ✔ | yalnızca plan gerektiriyorsa | kural |
  | Uygulama kodu, paket/konfig dosyaları | — | ✔ | guard |
  | `.env` / `.env.example` | — / — | — / ✔ | guard |
  | `.github/workflows/`, `.claude/role` | — (Murat) | — (Murat) | guard |

  Not: `docs/API_CONTRACT.md` builder'a açık kalmalı. Bu görevin Bölüm C'si ve F0-04/F1 sözleşme güncellemeleri builder işidir.
- **M4 (Murat)** `git rm --cached .env` + commit. `.gitignore` zaten `.env`'i yok sayıyor. Yerel `.env` F0-02 merge'ünden sonra silinebilir, tüketeni kalmaz.
- **M5 (D10)** Lovable Supabase projesi `vpcaiosbjfbpvwkkjbgm` panelden durdurulur ya da silinir. Geçmiş yeniden yazılmaz. gitleaks geçmiş bulgusu F0-07'de `.gitleaksignore` ile kayda alınır.
- **M6 (isteğe bağlı, aynı kit commit'i)** `AGENTS.md:28-29` "main @ 4bfa4cb, state v8, `Ctx` 52 işlem" → "state v11, 51 işlem" (REV-12). `docs/agents/reviewer.md:8, :23` "INV-01…27" → "INV-01…28".
- **M7 (merge sonrası, denetim)**
  - `docs/PHASES.md`: F0-02 ✅. F0-02 satır metni gerçekleşene göre (code-split → F9-03; strict durumu). F0-03 satırına "vitest 5 (+ `@vitest/*`)" eklenir.
  - `docs/adr/0001-stack.md` "Takip: F0-02 yükseltme…" → F0-03.
  - `docs/AUDIT.md` §5'e F0-02 sütunu: `npm ci` ✅, lint 0 error, typecheck/strict, audit sayıları, `.env` repoda değil, kullanılmayan paket yok.
  - `docs/reviews/BACKLOG.md`'de kapanan ID'ler işaretlenir: QA-F001, REV-07 (Faz M), REV-14 (m09b), REV-M13-02/RUL-02, RUL-03 (m13), round 3 Low'ları, REV-F022.
- **M8 (denetim; D8 = (a), Murat 2026-10-07)** INV-28'deki "(c)'de 07 `done` ise … `409`" cümlesine "05'in durumundan bağımsız" eklenir. `/build`'den önce ya da merge'den sonra yapılabilir; builder'ın sözleşme metni (RR-F028) bu karara zaten uyar.
- **M9 (denetim, `/build`'den ÖNCE; D7 = (a))** `docs/adr/0005-f0-01-contract-decisions.md`'ye K19'dan sonra **K20 — RR-F032** bölümü eklenir (Bağlam / Karar / Sonuçlar / Takip / Etkilenen). Aynı commit'te başlık "(K8–K20)" olur, "Round 3 eki" paragrafına K20 cümlesi, K19 "Sonuçlar"daki "(RR-F032, açık)" yerine "(RR-F032 → K20)" yazılır. Builder'ın #3/§4 dayanağı "ADR-0005 K20" olduğu için K20 main'de olmadan `/build` başlamaz (§12 ön koşulu). INVARIANTS değişmez. Merge sonrası BACKLOG'da RR-F032 "Karar verildi → ADR-0005 K20" olarak işaretlenir (M7 ile birlikte).

## 14. Lint uyarıları için öneri (bu görevde düzeltilmez)
Builder 28 uyarının `dosya:satır:kural` listesini değişiklik notuna yazar. Öneriler:
- **`react-refresh/only-export-components` (22).** Etkisi yalnızca dev'deki Fast Refresh, üretime etkisi yok. Kaynakları:
  - shadcn `components/ui/*` dosyaları (variant ya da hook export eden: badge, button, form, navigation-menu, sidebar, sonner, toggle vb.).
  - Bileşenle birlikte yardımcı export eden dosyalar (ör. `InsightCard.tsx` `targetLabel`/`insightSummary`/`targetChanged`, store `useRq`).
  - Öneri: (a) `src/components/ui/**` için kuralı kapatan override (D4 ile aynı gerekçe) — F0-03'te; (b) yardımcıları ayrı modüle taşımak F0-04'te, ekranlar hook'lara geçerken.
- **`react-hooks/exhaustive-deps` (6).** Bağımlılık eklemek effect/memo zamanlamasını değiştirir, yani davranış riski taşır. Öneri: F0-04'te, `useRq()` → TanStack Query hook geçişi bu effect'lerin çoğunu yeniden yazarken her birine gerekçeli karar.
- **F0-03 notu:** `eslint-plugin-react-hooks` v5 → güncel sürüm yeni kurallar (React Compiler kuralları) getirebilir. F0-03 planı lint farkını ayrıca ölçmeli.
