# Değişiklik notu — chore/f0-04a-shared-foundation

## Görev
- Plan: `docs/plans/F0-04-fe-data-layer.md` (§1–§13, yalnızca F0-04a); ADR-0007 K1–K6
- Faz / görev kodu: F0-04a

## Ön ölçüm (main @ `7bea9ed`)
| Ölçüm | Sonuç |
|---|---|
| `npm ci` | 0 |
| `npm run build` | `index-CDN67-XW.css` `35246c672c5582faeb38172444dc6ce819795efb764ee4256077d217fad531e4` · `index-LqGeOgQ3.js` `0b9a5a56f8d5f5485285c9229cc7b526ce38b0384589e4f738f11498b7df4764` |
| `npm test` | 13 dosya / 213 test |
| `npm run lint` | 0 hata / 21 uyarı (liste aşağıda) |
| `npm audit` · `--omit=dev --audit-level=high` | 0 · 0 |
| `tsc -p packages/shared/tsconfig.json --listFilesOnly` | 195 dosya; 87'si `lib.dom*` ya da `node_modules/@types/` |
| `npm view eslint-plugin-react-hooks versions` | stabil major'lar: … 5.2.0, 6.0.0, 6.1.1, 7.0.0, 7.1.0, **7.1.1** (`latest`); geri kalanlar canary/rc/beta/experimental |
| `npm view eslint-plugin-react-hooks@7.1.1 peerDependencies` | `eslint: ^3 … ^9.0.0 \|\| ^10.0.0` → eslint 9.39.5 ile uyumlu |

## Commit listesi
| # | SHA | Commit |
|---|---|---|
| 1 | `7be6093` | docs: fix F0-03b gate doc findings [REV-01] [REV-02] [REV-03] — yalnızca 3 belge dosyası |
| 2 | `c1ad370` | chore(shared): restrict shared tsconfig to ES2022 without ambient types [REV-04] |
| 3 | `236eac1` | chore(web): read env from repo root (envDir) |
| 4 | `12148d6` | chore: upgrade eslint-plugin-react-hooks to 7.1.1 (ADR-0007 K2) |
| 5 | **`f1ad137`** | feat(shared): add enum schemas with temporary types.ts parity check — **ara parity commit'i** (AC5) |
| 6 | `b9b6a66` | refactor(web): re-export enums from @rabbitqa/shared |
| 7 | `62c9452` | feat(shared): InsightProposal schemas with per-kind field allowlist (API_CONTRACT #44) |
| 8 | `1f1a3e0` | docs: shared package notes for F0-04a (README, index.ts, API_CONTRACT §6) |
| 9 | — | docs: change note (bu dosya) |

## Ne değişti
- **REV-01..03 (commit 1):** `chore_f0-03b-monorepo.md:28` "50 çalışma zamanı bağımlılığı (+ `@rabbitqa/shared` = 51)"; `chore_f0-03a-upgrades.md:465` katman cümlesi tek kez, Sonner sırası `index.css:283-290` yorumuyla aynı anlamda; `README.md:13` plan §2.1 REV-03 cümlesi.
- **REV-04:** `packages/shared/tsconfig.json` → `lib: ["ES2022"]`, `types: []`, `include: ["src", "typecheck"]`, `exclude: ["src/**/*.test.ts"]`. Yeni `tsconfig.test.json` (extends; `src` + `vitest.config.ts`, test dosyaları dahil). `typecheck` script'i iki tsconfig'i koşar. `typecheck/no-runtime-globals.ts`: `window`, `document`, `process` her biri `// @ts-expect-error (REV-04)`.
- **envDir:** `apps/web/vite.config.ts` → `envDir: path.resolve(import.meta.dirname, "../..")`. `envPrefix` yok (varsayılan `VITE_`). `vitest.config.ts` değişmedi. `.env.example` yorumu güncellendi (değer yok).
- **eslint-plugin-react-hooks 5.2.0 → 7.1.1:** kök `package.json`'da tek satır; `eslint.config.js` `reactHooks.configs.flat.recommended`'ı `extends`'e alır, kurallar bu config'ten türetilir: `rules-of-hooks` error, diğer 15 kural (exhaustive-deps dahil) warn.
- **Enum'lar:** `packages/shared/src/enums/index.ts` — 33 enum, `<Ad>Schema = z.enum([...])` + `type <Ad> = z.infer<…>`; değerler ve sıra `types.ts` ile aynı. `packages/shared/package.json`: `dependencies.zod ^4.4.3`, `devDependencies.vitest ^5.0.3`, `scripts.test`; `vitest.config.ts` (node).
- **Shim:** `types.ts`'teki 33 enum tanımı kaldırıldı → `export type { … } from "@rabbitqa/shared"` (+ dosya içi kullanım için `import type`). `types.parity.ts` commit 5'te eklendi, commit 6'da silindi.
- **InsightProposal:** `packages/shared/src/schemas/` → `common.ts` (`IdSchema`, `IsoDateSchema`, `IsoDateTimeSchema`), `action.ts` (`ActionCreateSchema`, #6), `risk-decision.ts` (`RiskDecisionCreateSchema`, #31), `insight.ts` (`InsightProposedSchemaByKind`, `InsightProposalSchema`, `InsightProposedAny`, `InsightProposedByKind`, `InsightSourceRefSchema`). Web: `InsightProposedFields` silindi; `InsightCard.tsx` ve `store.tsx`'te yalnızca import ve tip annotasyonu `InsightProposedAny` oldu.
- **Belgeler:** README:13 (§2.7), `packages/shared/src/index.ts` yorumu, API_CONTRACT §6 başlığı altında tek satır.

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Kanıt |
|---|---|---|---|
| AC1 | ✅ | Diff | `git show --stat 7be6093` → yalnızca `README.md`, `docs/changes/chore_f0-03a-upgrades.md`, `docs/changes/chore_f0-03b-monorepo.md`; mesajda `[REV-01] [REV-02] [REV-03]`; `grep -c "head\` sonuna eklediği"` = 0, `@layer\` blok derinliği` 1 kez |
| AC2 | ✅ | L1 typecheck | `npm run typecheck` 0; `no-runtime-globals.ts` 3 yönerge kullanılıyor; `--listFilesOnly` 160 dosya, `lib.dom` / `node_modules/@types/` = 0 (main'de 87) |
| AC-NEG1 | ✅ | Mutasyon (commit edilmedi) | Aşağıda "AC-NEG1 çıktıları" |
| AC3 | ✅ | L1 | `apps/web/src/test/vite-env.test.ts` › "reads env from the repo root with the default VITE_ prefix" (mutasyonla doğrulandı: `envDir` silinince ve `envPrefix: ["VITE_", "DB_"]` eklenince kırmızı) |
| AC-NEG2 | ✅ | Diff + grep | `envPrefix` yok; `grep envDir apps/web/vitest.config.ts` boş; `grep -rn "import.meta.env" apps/web/src` boş; `.env.example` yalnızca yorum |
| AC4 | ✅ | Komut | 7.1.1 = en son stabil major, peer uyumlu; `overrides` yok; temiz `npm ci` 0; `npm audit` 0 / `--omit=dev --audit-level=high` 0; lint 0 hata, main'deki 21 uyarı aynen var (`comm` farkı boş), 6 yeni uyarı aşağıda; `apps/web/src` diff'inde `eslint-disable` yok |
| AC5 | ✅ | Ara commit typecheck + L1 | `f1ad137`'de `npm run typecheck` yeşil (`types.parity.ts` 33 `Assert<Equal<…>>`; `Ball`'dan bir değer silinince TS2344 ile kırmızı olduğu denendi); `packages/shared/src/enums/enums.test.ts` › "covers the 33 API_CONTRACT §6 enums and nothing else" + 33 × "accepts its values and rejects unknown ones"; son durumda `types.ts`'te 33 adın tanımı yok, `types.parity.ts` yok |
| AC6 | ✅ | L1 | `packages/shared/src/schemas/insight.test.ts` › "InsightProposedSchemaByKind (#44)": izinli alanlar (7 tür), tek tek alanlar (partial), `dependency`/`durationDays`/`required` × 7 tür, bilinmeyen alan × 7 tür, `date_change` karışımı ve yalnızca `planEnd` (V3), `cancelled` action ✔ / step ✘, `action_create` `source`/`ruleKey`/`insightId`/`meetingId` ✘, `risk_create`/`decision_create` `kind`/`meetingId` ✘, tarih/ID katılığı (D7); "InsightProposalSchema" türe göre `proposed`, bilinmeyen tür, güven aralığı, ISO zaman damgası |
| AC7 | ✅ | L1 (L2c öncülü) | `apps/web/src/lib/rabbitqa/insight-proposal.schema.test.ts` › "every seed insight parses unchanged" (13 seed önerisi) ve "analyzeText drafts of all 7 kinds parse unchanged" (sabit saat `2026-10-05T09:00:00`; 7 türün hepsi üretildiği ayrıca doğrulanıyor) |
| AC8 | ✅ | grep + L1 tip testi | `grep -rn "InsightProposedFields" apps/web/src packages/shared/src` boş; web `InsightProposedAny` kullanıyor; `insight.test.ts` › "InsightProposedAny" (`expectTypeOf`: anahtar kümesi, `dependency`/`durationDays`/`required` ve index signature yok); `action_create`/`risk_create`/`decision_create` `ActionCreateSchema`/`RiskDecisionCreateSchema`'dan `.partial()`/`.omit()`/`.pick()` ile türetiliyor |
| AC9 | ✅ | Komut | Temiz kurulum sonrası build: `index-CDN67-XW.css` ve `index-LqGeOgQ3.js` adları ve sha256'ları ön ölçümle **aynı** → L5b-A gerekmez (ADR-0007 K6) |
| AC10 | ✅ (CI push sonrası) | Komut | Kökten `npm ci`, `lint`, `typecheck`, `test`, `build` 0; `npm test` web 15 dosya / 216 test + shared 2 dosya / 91 test; `npm ls zod` tek sürüm (4.6.5); `npm ls xlsx --all` boş; `.github/workflows/ci.yml` değişmedi |
| AC11 | ✅ | Diff | README:13, `index.ts` yorumu, API_CONTRACT §6 tek satır; API_CONTRACT'ta başka satır değişmedi |
| AC-NEG3 | ✅ | `git diff -w` + AC9 | `apps/web/src` diff'i: `types.ts` (shim, `InsightProposedFields` silme), `InsightCard.tsx` (import, 2 tip annotasyonu, `sel` parametre tipi), `store.tsx` (import, 1 tip annotasyonu), 2 yeni test dosyası. Çalışma zamanı ifadesi değişmedi; bundle bayt eşit |
| AC-NEG4 | ✅ | grep | `packages/shared/src`'de `react`, `@/`, `apps/` import'u yok; çalışma zamanı bağımlılığı yalnızca `zod`; DOM/Node global'i yok (AC2) |
| Duman | ✅ | L6 (Playwright MCP, `npm run dev`) | Giriş (Deniz Uzun) → Genel bakış → Insights → "Düzenle ve onayla" diyaloğu açıldı (başlık, sahip, top, öncelik, termin dolu); konsol 0 hata / 0 uyarı |

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-19, INV-14, INV-21, INV-23 (yalnızca şema), INV-13 (dokunulmadı), INV-20 (kural kodu değişmedi)
- [x] Endpoint yok; RBAC değişmedi
- [x] Mock davranışı değişmedi (D6 = a); `approveInsight` yalnızca tip
- [x] Enum ve öneri şemalarının tek kaynağı `packages/shared`; `types.ts` kopya tutmuyor
- [x] Trigger / PL/pgSQL / RLS / motor kontrolü yok

## Veritabanı
- [x] Migration yok

## Kontroller (çıktı özeti — temiz `rm -rf node_modules … && npm ci` sonrası)
```
npm ci             → 0, found 0 vulnerabilities
npm run lint       → 0 (✖ 27 problems (0 errors, 27 warnings))
npm run typecheck  → 0 (web app + node, shared main + test)
npm test           → 0 · web: Test Files 15 passed, Tests 216 passed · shared: Test Files 2 passed, Tests 91 passed
npm run build      → 0 · dist/assets sha256 = ön ölçüm
npm audit          → found 0 vulnerabilities
npm audit --omit=dev --audit-level=high → found 0 vulnerabilities
npm ls zod         → zod@4.6.5 (shared, web deduped, react-hooks deduped)
npm ls eslint-plugin-react-hooks → 7.1.1
npm ls xlsx --all  → (empty)
tsc -p packages/shared/tsconfig.json --listFilesOnly → 160 dosya, lib.dom / @types = 0
```

### AC-NEG1 çıktıları (mutasyonlar geri alındı, commit edilmedi)
```
# lib: ["ES2022", "DOM"]
typecheck/no-runtime-globals.ts(8,5): error TS2578: Unused '@ts-expect-error' directive.
typecheck/no-runtime-globals.ts(10,5): error TS2578: Unused '@ts-expect-error' directive.
→ npm run typecheck -w @rabbitqa/shared exit 2

# types: ["node"]
typecheck/no-runtime-globals.ts(12,5): error TS2578: Unused '@ts-expect-error' directive.
→ npm run typecheck -w @rabbitqa/shared exit 2
```

### Lint uyarıları
Main'deki 21 uyarı (önce = sonra, `dosya:satır:kural`):
```
apps/web/src/components/rq/Badges.tsx:47:react-refresh/only-export-components
apps/web/src/components/rq/InsightCard.tsx:36:react-refresh/only-export-components
apps/web/src/components/rq/InsightCard.tsx:41:react-refresh/only-export-components
apps/web/src/components/rq/InsightCard.tsx:55:react-refresh/only-export-components
apps/web/src/components/rq/InsightCard.tsx:237:react-refresh/only-export-components
apps/web/src/components/rq/InsightCard.tsx:239:react-refresh/only-export-components
apps/web/src/lib/auth-context.tsx:50:react-hooks/exhaustive-deps
apps/web/src/lib/auth-context.tsx:89:react-hooks/exhaustive-deps
apps/web/src/lib/auth-context.tsx:95:react-refresh/only-export-components
apps/web/src/lib/rabbitqa/store.tsx:158:react-hooks/exhaustive-deps
apps/web/src/lib/rabbitqa/store.tsx:169:react-hooks/exhaustive-deps
apps/web/src/lib/rabbitqa/store.tsx:758:react-hooks/exhaustive-deps
apps/web/src/lib/rabbitqa/store.tsx:763:react-refresh/only-export-components
apps/web/src/lib/rabbitqa/store.tsx:770:react-refresh/only-export-components
apps/web/src/lib/rabbitqa/store.tsx:774:react-refresh/only-export-components
apps/web/src/lib/rabbitqa/store.tsx:779:react-refresh/only-export-components
apps/web/src/lib/rabbitqa/store.tsx:785:react-refresh/only-export-components
apps/web/src/lib/rabbitqa/store.tsx:792:react-refresh/only-export-components
apps/web/src/lib/rabbitqa/store.tsx:796:react-refresh/only-export-components
apps/web/src/pages/ProjectDetail.tsx:237:react-refresh/only-export-components
apps/web/src/pages/project/DiscoveryContent.tsx:24:react-hooks/exhaustive-deps
```
Yeni uyarılar (D4 = b; 04c–04h'de dokunulan dosyada temizlenir):
```
apps/web/src/components/ui/carousel.tsx:96:react-hooks/set-state-in-effect
apps/web/src/components/ui/sidebar.tsx:536:react-hooks/purity
apps/web/src/hooks/use-mobile.tsx:14:react-hooks/set-state-in-effect
apps/web/src/lib/rabbitqa/store.tsx:131:react-hooks/refs
apps/web/src/pages/CustomerReport.tsx:89:react-hooks/set-state-in-effect
apps/web/src/pages/Projects.tsx:35:react-hooks/preserve-manual-memoization
```

### Paket / lock farkı
- Değişen: `eslint-plugin-react-hooks` 5.2.0 → 7.1.1.
- Eklenen 32 geçişli paket (hepsi plugin'in bağımlılıkları): `@babel/compat-data`, `@babel/core` (+ iç `semver@6.3.1`), `@babel/generator`, `@babel/helper-compilation-targets` (+ iç `semver@6.3.1`), `@babel/helper-globals`, `@babel/helper-module-imports`, `@babel/helper-module-transforms`, `@babel/helper-string-parser`, `@babel/helper-validator-option`, `@babel/helpers`, `@babel/parser`, `@babel/template`, `@babel/traverse`, `@babel/types`, `baseline-browser-mapping`, `browserslist`, `caniuse-lite`, `convert-source-map`, `electron-to-chromium`, `escalade`, `gensync`, `hermes-estree`, `hermes-parser`, `jsesc`, `json5`, `lru-cache@5`, `node-releases`, `update-browserslist-db`, `yallist@3`, `zod-validation-error@4.0.2`. Kaldırılan yok.
- `packages/shared` workspace girdisi: `dependencies.zod ^4.4.3`, `devDependencies.vitest ^5.0.3` (ağaçta zaten olan sürümler; yeni paket yok).

## Eşleme (plandaki ad → koddaki ad)
- Plan "`InsightCard.tsx:21,42,154`, `store.tsx:13,671`" → aynı satırlar; ek olarak `InsightCard.tsx:160` `sel` parametresi `k: string` → `k: keyof InsightProposedAny` (plan §2.6'nın izin verdiği tip düzeyinde daraltma; `v[k]` dizinlemesi için).
- Plan "AC7: `createSeed().insights` parse edilir ve sonuç girdiye eşittir" → seed önerilerinin sunucu alanları (`id`, `status`, `createdAt`, `reviewedBy`, `reviewedAt`, `reviewNote`, `appliedEntityId`) çıkarılarak (`InsightDraft` şekli) parse ediliyor ve `toEqual` bu nesneyle karşılaştırılıyor. Sunucu alanları `InsightProposal`'da yok (04b'de `AiInsight` = `InsightProposal` + sunucu alanları).
- Plan "Güncel `recommended`" → `reactHooks.configs.flat.recommended` (7.1.1'de `recommended` ile aynı kurallar; `recommended-latest` ek olarak `void-use-memo` içeriyor, seçilmedi).
- Ek dışa aktarımlar: `IdSchema`, `IsoDateSchema`, `IsoDateTimeSchema` (`schemas/common.ts`), `InsightSourceRefSchema`, `InsightProposedByKind`, `ActionCreate`, `RiskDecisionCreate`, `InsightProposal` tipleri.

## Açık sorular / sapmalar
- **AC3 testi node ortamında değil, varsayılan jsdom ortamında koşuyor.** `// @vitest-environment node` ile `src/test/setup.ts:3` (`Object.defineProperty(window, …)`) setup aşamasında `ReferenceError: window is not defined` veriyor. `setup.ts`'i değiştirmek AC-NEG3 kapsamı dışında kalıyordu; `loadConfigFromFile` jsdom'da sorunsuz çalışıyor ve test mutasyonlarla doğrulandı. Not: test yorumunda yönerge metnini yazmak bile vitest'in onu yönerge olarak okumasına yol açıyor, bu yüzden yorumda geçmiyor.
- **Shim'de `export type { … } from` yanında `import type { … } from "@rabbitqa/shared"` da var.** `types.ts`'teki arayüzler (`User.role: Role` vb.) bu tipleri dosya içinde kullanıyor; yalnızca yeniden dışa aktarım yerel kapsama ad getirmiyor. Kopya tanım yok.
- **`InsightProposedAny` shim üzerinden de dışa aktarılıyor** (`types.ts`): web tiplere shim üzerinden erişir (ADR-0007 K3, D9), bu yüzden `InsightCard`/`store` import satırlarında yalnızca ad değişti.
- **`InsightProposedAny.status`** artık `StepStatus | ActionStatus | RiskStatus`. Eski elle yazılmış tip `StepStatus | ActionStatus` idi; `RiskStatus`, `risk_create`/`decision_create`'in `RiskDecisionCreate`'ten türetilen `status` alanından geliyor. Yalnızca tip; UI ve mock bu türlerde `status` göndermiyor.
- **`date_change` `partial` değil:** plan §2.6 "hepsi strict ve partial" diyor, ama V3 (`phaseId` + `planEnd` birlikte zorunlu) ve "karışık alan reddedilir" kuralı yüzünden iki dal da strict ve alanları zorunlu; `{}` reddediliyor.
- **`confidence`** `z.number().min(0).max(100)`; tamsayı zorunlu değil (mock tamsayı üretiyor; LLM ondalık üretebilir). F8'de karar verilebilir.
- **Shared'a `src/enums/enums.test.ts` eklendi** (planda yok): commit 5'te shared `vitest run` test dosyası olmadan kırmızı olurdu; test ayrıca AC5'in "33 adın her biri dışa aktarılır" maddesini koşuyor.
- **`--listFilesOnly` sayısı 195 → 160:** düşüş `lib.dom*` ve `@types/*` dosyalarının çıkmasından; artış zod tip dosyalarından.
- **6 yeni uyarının 2'si `components/ui/`'da** (shadcn, elle değiştirilmez). Bu dosyalar için kural kapatılmadı (D4: yalnızca `warn`); karar 04c+ planlarında verilebilir.
- **CI (`app`, `secrets`):** push sonrası durum aşağıdaki çıktıda / `/gate`'te okunmalı.

## Öneriler (kapsam dışı)
- F0-06: `src/test/setup.ts`'te `window` erişimini `typeof window !== "undefined"` ile korumak; node ortamlı web testleri (`// @vitest-environment node`) mümkün olur.
- F0-06: sabit saat için ortak `MOCKUP_NOW` (RUL2-03); yeni AC7 testi de kendi `NOW`'unu tanımlıyor.
- BACKLOG: 6 yeni react-hooks uyarısı "04c–04h, dokunulan dosyada" hedefiyle; `components/ui` için ayrıca karar (`off` mu, `warn` mı).
- 04h / F8-03: `approveInsight`'ta `InsightProposedSchemaByKind[kind].parse({ ...proposed, ...edited })` zorlaması (D6'nın ertelenen kısmı).

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
| RUL-01 | Düzeltildi — `insight.test.ts`: #44 izin listesi elle yazılmış tablo (`ALLOWED`); her tür × başka türe ait her alan (o türün geçerli değeriyle) tek `it.each` ile red (`FOREIGN_FIELDS`, örn. `action_update`+`ball`, `step_update`+`title`, `health_change`+`status`). `date_change` `{phaseId, goLiveDate}` ve `{phaseId}` red. Mutasyon (geçici, commit'lenmedi): `action_update` `.pick` + `ball` → 1 kırmızı; `step_update` + `title` → 3; `health_change` + `status` → 4 | `fix: … [RUL-01][RUL-02]` (bu commit) |
| RUL-02 | Düzeltildi — `STATUS_CASES`: durum alanı olan 5 tür × tüm durum değerleri (Step ∪ Action ∪ Risk) tablo testi; `RiskStatus` (`mitigated`/`accepted`/`realized`) risk/karar dışında red, risk/karar `cancelled`/`done`/`in_progress` red, `realized` kabul. Mutasyon: `step_update` status'a `mitigated` eklemek → 1 kırmızı | aynı commit |

Doğrulama: `npm run lint` 0 hata (27 uyarı, önceden var; `insight.test.ts` temiz) · `npm run typecheck` temiz · `npm test` web 216/216, shared 274/274. Şema/kod dosyalarına dokunulmadı.
