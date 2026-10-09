# F0-04: FE veri erişim katmanı (çerçeve) ve F0-04a: araç zemini, belge düzeltmeleri, enum'lar, InsightProposal

**Durum:** Onaylandı (2026-10-09, Murat: D1a D2b D3a D4b D5a D6a D7b D8a D9a D10a D11a; V1–V4 kabul; ADR-0007 "Kabul edildi")
**Spec referansı:** Yok, teknik görev. Dayanaklar:
- `docs/PHASES.md`: F0-04 satırı ve F0-03b kapanışı ("REV-04 → F0-04", "`envDir` gözlemi → F0-04")
- `docs/API_CONTRACT.md`: §6 ve #44 (tür başına izinli alanlar), #6, #31
- `docs/INVARIANTS.md`: INV-14, INV-19, INV-21, INV-23
- `docs/adr/0006-f0-03-upgrade-and-monorepo.md`: K4, K5, K6
- `docs/reviews/chore_f0-03b-monorepo/SUMMARY.md`: REV-01..04 ve `envDir`
- `docs/reviews/BACKLOG.md`: chore/f0-02-cleanup round 1 açık soru, "`InsightProposedFields` şemaya kopyalanmamalı"
- `docs/plans/F0-02-cleanup.md` §14: lint uyarıları

**Branch:** `chore/f0-04a-shared-foundation`
**Bağımlılıklar:** F0-03b (main @ 72872d6). ADR-0007 "Kabul edildi", PHASES F0-04a–h bölmesi ve AGENTS.md K2 istisnası main'de olmalı (§13).

---

## 0. Çerçeve: F0-04 neden bölünüyor

PHASES F0-04 dört iş içeriyor: `packages/shared` zod şemaları (types.ts'ten), modül bazlı TanStack Query hook'ları, `DataSource` arayüzü ile mock adaptörü, `VITE_DATA_<MODÜL>` anahtarı. Kabul ölçütü "ekranlar `useRq()` yerine hook'ları kullanır, görsel fark yok, tüm akışlar aynı".

Bugünkü durum:
- `useRq()` 28 dosyada 71 kez kullanılıyor.
- `types.ts` yaklaşık 400 satır, 33 enum ve 34 varlık içeriyor.
- Store `Ctx`'te 51 işlem var.

Görevin tamamı kabaca 3.000 satırın üzerinde. Planner kuralı "diff yaklaşık 400 satırı aşarsa böl" diyor. Kabul edilen bölme (D1 = (a)):

| Alt görev | İçerik | Ekranlar / dosyalar | Bağlanacağı "→ API" görevleri |
|---|---|---|---|
| **04a** (bu plan) | Murat'ın 5 maddesi: REV-01..03, REV-04, `envDir`, eslint-plugin-react-hooks, InsightProposal. Ayrıca bütün enum'lar ve öneri şemasının dayandığı iki istek şeması (`ActionCreate`, `RiskDecisionCreate`) | `types.ts` (yalnızca enum'lar), `InsightCard.tsx` / `store.tsx` (yalnızca tip) | — |
| 04b | Varlık şemaları: `types.ts`'teki bütün varlıklar mekanik olarak shared'a taşınır. `AiInsight` = `InsightProposal` + sunucu alanları. Seed uygunluk testi (L2c öncülü) | `types.ts` | — |
| 04c | Veri katmanı çekirdeği (ADR-0007 K7, 04c planında yazılır): `DataSource`, `DataError` (API hata kodları), mod çözücü (`VITE_DATA_<MODÜL>`), mock köprüsü (store'u saran adaptör), sorgu anahtarları, QueryClient varsayılanları. Pilot modüller: kullanıcılar, satışçılar, modüller | `UsersAdmin`, `Admin` (ilgili bölümler) | F2-01, F2-02 |
| 04d | Konfigürasyonun kalanı (şablon, keşif soruları, eşikler, tatiller, Değişiklikler), entegrasyon ayarları, eşleşmeyen e-postalar | `Admin`, `AlertsAdmin`, `IntegrationsAdmin` | F2-03..05, F8-01, F8-05 |
| 04e | Proje listesi ve oluşturma, Genel bakış, Bana atananlar, AppShell (zil, AI rozeti) | `Projects`, `Overview`, `MyWork`, `AppShell` | F3-01, F3-08 |
| 04f | Proje detayı çekirdeği: aşama/adım, aksiyon, toplantı, kişi, geçmiş | `ProjectDetail`, `MeetingDialog`, `PhaseWorkspaceSheet`, `MeetingStepSection` | F3-02..05, F7-01 |
| 04g | Çalışma alanları ve sekmeler: satış devri, doküman, keşif/takım/KPI, erişim, eğitim, uyarlama, risk/karar, Go-Live, süreklilik | `HandoverWorkspace`, `Phase2Tabs`, `Phase3Tabs`, `DiscoveryContent`, `Adaptation`/`TrainingWorkspace`, `ContinuityTab` | F3-06, F3-07, F4-03, F4-04, F5-01..05 |
| 04h | Uyarılar, raporlar, AI Insight, proje entegrasyonu | `AlertActionDialog`, `CustomerReport`, `ManagementReport`, `Insights`, `InsightCard`, `IntegrationsTab` | F6, F7-02, F7-03, F8-02, F8-03 |

Her alt görev kendi `/plan`'ıyla ayrıntılanır. 400 satırı aşan alt görev yeniden bölünür. PHASES'ta F0-04 ● işaretli olduğu için 04c–04h'de rules-reviewer zorunludur: mock adaptörü gerekçe, audit ve akış taşıyan store işlemlerini sarar. 04c'den itibaren ekran kodu değişeceği için L5b-A (ADR-0006 K5) zorunludur.

Bu dosyanın §1–§13 bölümleri **yalnızca F0-04a** içindir.

---

## 1. Amaç
Veri katmanına geçmeden önce zemini hazırlamak. F0-03b'den kalan belge, tsconfig ve `envDir` borçları kapanır. eslint-plugin-react-hooks güncel stabil sürüme çıkar. Enum'ların tek kaynağı `packages/shared` olur. Mockup'taki gevşek `InsightProposedFields` tipi kaldırılır; yerine API_CONTRACT #44'ün tür başına izin listesini kodlayan shared `InsightProposal` şemaları gelir (INV-19).

Mockup davranışı değişmez. Kanıtı, build çıktısının main ile bayt düzeyinde aynı olmasıdır.

## 2. Kapsam

Murat'ın 5 maddesinin bu plandaki karşılığı:

| Madde | Bölüm | AC |
|---|---|---|
| (1) `InsightProposedFields` şeması → shared (INV-19) | §2.6 | AC6, AC7, AC8 |
| (2) eslint-plugin-react-hooks (ADR-0006 K4 usulü) | §2.4 | AC4 |
| (3) REV-04 | §2.2 | AC2, AC-NEG1 |
| (4) `envDir` | §2.3 | AC3, AC-NEG2 |
| (5) REV-01..03, build'in ilk ve ayrı commit'i | §2.1 | AC1 |

### 2.1 Belge düzeltmeleri REV-01..03 (ilk commit, yalnızca bu üç dosya)
- **REV-01:** `docs/changes/chore_f0-03b-monorepo.md:28` → "52 çalışma zamanı bağımlılığı" yerine "50 çalışma zamanı bağımlılığı (+ `@rabbitqa/shared` = 51)".
- **REV-02:** `docs/changes/chore_f0-03a-upgrades.md:465`, iki değişiklik:
  - Katman kontrolü cümlesi tek kez geçer: "Katman dışı olma kontrolü: build CSS'inde (`dist/assets/index-*.css`) bu 4 seçicinin `@layer` blok derinliği 0, yani hiçbir `@layer` bloğunun içinde değil (yeni test dosyası yazılmadı, plan §8.2)."
  - "Sonner `<style>`'ını `head` sonuna eklediği için eşitlikte v3'teki gibi Sonner kazanır" ifadesi `apps/web/src/index.css:283-290` yorumuyla aynı anlama getirilir: "Sonner `<style>`'ı production'da bu dosyadan sonra, dev'de önce eklenir; sıra v3 ile aynı olduğundan eşitlik v3'teki gibi çözülür (production'da Sonner kazanır, ör. action düğmesi)".
- **REV-03:** `README.md:13` → "`packages/shared`: ortak şemalar ve enum'lar (F0-04), iş günü hesabı (F6-01) (`@rabbitqa/shared`); şimdilik boş." Bu cümle commit anındaki durum için doğrudur. §2.7'deki son belge commit'i "şimdilik boş" kısmını güncel duruma çevirir.

### 2.2 REV-04: shared tsconfig
- `packages/shared/tsconfig.json`: `"lib": ["ES2022"]`, `"types": []`. Test dosyaları bu programa girmez (`exclude: ["src/**/*.test.ts"]`).
- Testler için `packages/shared/tsconfig.test.json` eklenir (extends, `include` test dosyaları). Böylece vitest'in Node tip referansları ana programa sızmaz.
- `typecheck` script'i iki tsconfig'i de koşar.
- **Negatif kontrol dosyası:** `packages/shared/typecheck/no-runtime-globals.ts` (ana tsconfig'in `include`'unda; `src/index.ts`'ten export edilmez).
  - `window`, `document` ve `process` kullanımlarının her biri `// @ts-expect-error (REV-04)` ile işaretlenir.
  - `lib`'e DOM ya da `types`'a node eklenirse yönergeler "kullanılmayan @ts-expect-error" olur ve typecheck kırılır. Kontrol kendi kendini zorlar.

### 2.3 `envDir` (D5)
- `apps/web/vite.config.ts` → `envDir: path.resolve(import.meta.dirname, "../..")`, yani repo kökü. Tek `.env` web ve ileride API/işçi için ortak olur (F0-08).
- `envPrefix` değişmez (Vite varsayılanı `VITE_`).
- `apps/web/vitest.config.ts`'e `envDir` **eklenmez**. Testler geliştiricinin kök `.env`'inden bağımsız kalır.
- `.env.example` yorumu güncellenir:
  - Vite kökteki `.env`'i okur (F0-04a).
  - Web'e yalnızca `VITE_` önekli değişkenler girer, gizli değerlere `VITE_` öneki verilmez (INV-14).
  - `VITE_DATA_<MODÜL>=mock|http` anahtarlarının listesi 04c'de gelir; varsayılan `mock`.
- Bu alt görevde kodda `import.meta.env` kullanımı **yoktur**.

### 2.4 eslint-plugin-react-hooks (D3, D4)
- Önce `npm view eslint-plugin-react-hooks versions` çalıştırılır. En son **stabil** major seçilir (alpha/beta/rc/canary sayılmaz; ADR-0006 K4'ün sürüm kuralı). Peer'i `eslint ^9` ile uyumsuzsa uyumlu en son stabil major'da kalınır; sürüm varsayılmaz, sapma nota yazılır.
- Kök `package.json`'da tek satır değişir, lock güncellenir. `overrides`, `--legacy-peer-deps` ve `--force` yasak.
- `eslint.config.js` yeni sürümün flat config biçimine uyarlanır.
- Kural seti (D4 = (b)):
  - Güncel `recommended` kullanılır.
  - `rules-of-hooks` error, `exhaustive-deps` warn (bugünkü gibi).
  - Yeni gelen kuralların hepsi `warn`'a indirilir.
  - Hata sayısı 0 kalır.
  - Yeni uyarılar notta `dosya:satır:kural` olarak listelenir.
- `apps/web/src/**`'da lint kaynaklı kod değişikliği yapılmaz, `eslint-disable` eklenmez. Mevcut 6 `exhaustive-deps` uyarısı F0-02 §14 kararıyla, ilgili dosyayı hook'a geçiren alt görevde ele alınır.

### 2.5 Shared enum'lar
- `packages/shared/package.json`:
  - `dependencies: { "zod": "<apps/web ile aynı aralık, ^4.4.3> " }`
  - `devDependencies: { "vitest": "<apps/web ile aynı aralık, ^5.0.3>" }`
  - `scripts.test: "vitest run"`
  - `packages/shared/vitest.config.ts` (`environment: "node"`)
  - Ağaca yeni paket girmez (D8).
- `packages/shared/src/enums/`: API_CONTRACT §6'daki **33 enum**, değerleri `types.ts` ile birebir. Biçim D10: `export const RoleSchema = z.enum([...])` ve `export type Role = z.infer<typeof RoleSchema>`.
- Satır içi literal birleşimler (`AuditEntry.kind`, `DocumentRec.linkType` vb.) bu alt görevde enum'a çevrilmez; 04b'de varlık şemalarının içinde kalır.
- `apps/web/src/lib/rabbitqa/types.ts`: 33 enum tanımı kaldırılır, yerine `export type { … } from "@rabbitqa/shared"` gelir (D9: shim; diğer import'lar değişmez).
- **Eşitlik kanıtı (ara commit):**
  - Önce enum'lar eklenir. Ardından `apps/web/src/lib/rabbitqa/types.parity.ts` dosyası, mevcut `types.ts` literal tipleri ile shared tiplerinin her biri için katı tip eşitliği assertion'ı içerir. Typecheck bu dosyayla yeşil olmalıdır.
  - Sonraki commit'te `types.ts` shim'e çevrilir ve parity dosyası silinir (artık totolojiktir).

### 2.6 InsightProposal (D6 = (a): yalnızca şema ve tip; mockup davranışı değişmez)
- `packages/shared/src/schemas/`:
  - **`ActionCreateSchema`** (API_CONTRACT #6): title, ownerId (string | null), ball, due (tarih | null), priority, status, isCustomerVisible?
  - **`RiskDecisionCreateSchema`** (#31): kind, title, description, impact, probability, status, ownerId, due, mitigation, meetingId, decidedAt, isCustomerVisible
  - **Tür başına önerilen alan şemaları** (`InsightProposedSchemaByKind`), hepsi strict ve partial (#44). Elle ikinci bir alan listesi yazılmaz.

    | Tür | İzinli alanlar | Türetme |
    |---|---|---|
    | `step_update` | status (StepStatus), due, ball, ownerId | — |
    | `action_update` | status (ActionStatus), due, ownerId | — |
    | `health_change` | health, healthReason | — |
    | `date_change` | `{ phaseId, planEnd }` **ya da** `{ goLiveDate }` | İki strict nesnenin birleşimi; karışık alan reddedilir |
    | `action_create` | — | `ActionCreateSchema.partial().strict()` (sunucunun atadığı alanlar zaten şemada yok) |
    | `risk_create`, `decision_create` | — | `RiskDecisionCreateSchema.omit({ kind, meetingId }).partial().strict()` (`kind` öneri türünden gelir; §10 varsayım V1) |

  - `dependency`, `durationDays` ve `required` hiçbir türde yoktur.
  - **`InsightProposalSchema`** (INV-23'ün andığı şema, AI çıktısı): `kind` üzerinde ayrımlı birleşim. Alanlar: projectId, source, kind, sourceRef { title, from, at, excerpt, link, direction? }, targetId, current, proposed (türe göre), rationale, confidence (0–100, mockup ölçeği).
  - **`InsightProposedAny`**: tür başına şemaların çıktılarından **türetilen** birleşik tip (eşlemeli yardımcı tip). Düzenleme diyaloğu bunu kullanır. Elle alan listesi içermez; `& Record<string, unknown>` yoktur.
- Web:
  - `types.ts`'ten `InsightProposedFields` silinir.
  - `InsightCard.tsx:21,42,154` ve `store.tsx:13,671` tip annotasyonu `InsightProposedAny` olur. Yalnızca tip değişir; çalışma zamanı ifadesi değişmez (AC-NEG3). Dizinleme için `keyof InsightProposedAny` daraltması gerekirse yalnızca tip düzeyinde yapılır.
  - `AiInsight.proposed` bu alt görevde `Record<string, unknown>` kalır. Gelecek iş: 04b'de `AiInsight` = `InsightProposal` + sunucu alanları; çalışma zamanında parse 04h insights mock adaptöründe; API'de zorlama F8-03.

### 2.7 Son belgeler
- `README.md:13`: "`packages/shared`: ortak şemalar ve enum'lar (`@rabbitqa/shared`; enum'lar ve AI öneri şemaları F0-04a, varlık şemaları F0-04b), iş günü hesabı (F6-01)."
- `packages/shared/src/index.ts`: yorum ve export'lar.
- `docs/API_CONTRACT.md` §6 başlığının altına tek satır: "F0-04a: enum'lar, `ActionCreate`, `RiskDecisionCreate` ve `InsightProposal` (tür başına alan şemaları, #44) yazıldı; varlıklar F0-04b."
- Değişiklik notu.

### Kapsam dışı
- `DataSource`, hook'lar, mock/http adaptörleri, `VITE_DATA_*` kullanımı (04c).
- Varlık şemaları (04b).
- `ActionCreate` / `RiskDecisionCreate` dışındaki istek ve görünüm şemaları (ilgili alt görev).
- `AlertView`, `ReportSnapshot`, `ConditionResult`, `AuthUser`.
- Mock `approveInsight`'ta izin listesi zorlaması (D6 = (b) seçilmedikçe).
- `exhaustive-deps` ve `react-refresh` düzeltmeleri, yardımcıların ayrı modüle taşınması (modül alt görevleri).
- Workspace bazında ESLint (REV-05 → F0-05), Vitest `projects` (F0-06), MSW, `business-days` (F6-01), RBAC matrisi (F1-05).
- `ci.yml` (değişmemeli; gerekirse Murat).

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: yok. Migration yok. `pg-only`: yok.

## 4. API etkisi
Endpoint yok. Sözleşme davranışı değişmez. `docs/API_CONTRACT.md` §6'ya yalnızca §2.7'deki not eklenir.

## 5. Yetki etkisi (RBAC)
| Rol | İzin | Not |
|---|---|---|
| csm | değişmez | — |
| devops | değişmez | — |
| care | değişmez | — |
| manager | değişmez | — |
| admin | değişmez | — |

## 6. UI etkisi
- Ekranlar: değişiklik yok. Web'e yalnızca **tip** düzeyinde shared import girer. Beklenti: `apps/web/dist` JS ve CSS dosyaları main ile bayt düzeyinde aynı (AC9).
- Boş / yükleniyor / hata durumları: değişmez.

## 7. Kabul kriterleri

**Ön ölçüm (main @ `<sha>`, branch açılmadan; scratchpad'e, son commit'te nota):**
- `npm run build`: asset adları ve CSS/JS sha256
- `npm test`: 13 dosya / 213 test
- `npm run lint`: 0 hata / 21 uyarı (liste)
- `npm audit` ve `--omit=dev --audit-level=high`
- `npx tsc -p packages/shared/tsconfig.json --listFilesOnly | wc -l` (195 civarı)
- `npm view eslint-plugin-react-hooks versions`

**Kriterler:**
- **AC1 (REV-01..03, ilk commit):**
  - Given branch.
  - When `git log --reverse --format=%H main..HEAD` çıktısının ilk commit'i `git show --stat` ile incelenir.
  - Then:
    - Yalnızca `docs/changes/chore_f0-03b-monorepo.md`, `docs/changes/chore_f0-03a-upgrades.md` ve `README.md` değişmiştir.
    - Mesaj `[REV-01] [REV-02] [REV-03]` taşır.
    - :28'de "50 çalışma zamanı bağımlılığı (+ `@rabbitqa/shared` = 51)" yazar.
    - :465'te `@layer` derinliği cümlesi bir kez geçer ve "head sonuna eklediği için" ifadesi yoktur.
    - README:13, §2.1 REV-03 cümlesidir.
- **AC2 (REV-04):**
  - Given `packages/shared/tsconfig.json` içinde `lib: ["ES2022"]` ve `types: []` var.
  - When `npm run typecheck` çalışır.
  - Then:
    - Çıkış 0'dır.
    - `no-runtime-globals.ts`'teki `window`, `document` ve `process` satırlarının her biri `@ts-expect-error` ile karşılanır, kullanılmayan yönerge hatası yoktur.
    - `tsc -p packages/shared/tsconfig.json --listFilesOnly` çıktısında `lib.dom` ve `node_modules/@types/` yoktur.
- **AC-NEG1 (REV-04 mutasyonu):** When builder geçici olarak `lib`'e `"DOM"` **ya da** `types`'a `"node"` ekler, Then `npm run typecheck` başarısız olur. İki çıktı notta; değişiklik commit edilmez.
- **AC3 (envDir):** Given `apps/web/vite.config.ts`. When L1 test dosyayı Vite'ın `loadConfigFromFile` API'siyle yükler (`// @vitest-environment node`). Then `config.envDir` repo köküne çözülür ve `config.envPrefix` tanımsızdır (varsayılan `VITE_`).
- **AC-NEG2 (INV-14):**
  - `envPrefix` genişletilmemiştir.
  - `apps/web/vitest.config.ts`'te `envDir` yoktur.
  - `grep -rn "import.meta.env" apps/web/src` boştur.
  - `.env.example`'da değer yoktur, yalnızca yorum ve anahtar biçimi vardır.
- **AC4 (eslint-plugin-react-hooks):**
  - Sürüm = `npm view` çıktısındaki en son stabil major (ya da peer uyumlu en son stabil major; sapma notta).
  - Hiçbir `package.json`'da `overrides` yoktur.
  - Temiz `npm ci` 0 ile çıkar.
  - `npm audit` (tam) 0 ve `--omit=dev --audit-level=high` 0'dır.
  - `npm run lint` 0 hata verir. Main'deki 21 uyarı `dosya:satır:kural` olarak aynen vardır; yeni uyarılar (D4) notta listelidir.
  - `git diff main...HEAD -- apps/web/src` lint kaynaklı değişiklik ve `eslint-disable` içermez.
- **AC5 (enum'lar):**
  - Given `packages/shared/src/enums/`.
  - Then:
    - API_CONTRACT §6'daki 33 enum adının her biri `<Ad>Schema` ve `type <Ad>` olarak dışa aktarılır.
    - Ara commit'te (`types.parity.ts` varken) `npm run typecheck` yeşildir. Yani değerler `types.ts` ile birebir aynıdır.
    - Son durumda `types.ts`'te bu 33 adın `type`/`interface` tanımı yoktur, yalnızca `export type { … } from "@rabbitqa/shared"` vardır.
    - `types.parity.ts` silinmiştir.
- **AC6 (izin listesi, #44):**
  - When L1 tablo testi çalışır.
  - Then:
    - Her tür için izinli alanlar kabul edilir.
    - `dependency`, `durationDays` ve `required` 7 türün hepsinde reddedilir.
    - Bilinmeyen alan reddedilir.
    - `date_change` için `{phaseId, planEnd}` ve `{goLiveDate}` kabul edilir, `{goLiveDate, planEnd}` reddedilir.
    - `status: "cancelled"` `action_update`'te kabul, `step_update`'te red edilir.
    - `action_create`'te `source`, `ruleKey`, `insightId` ve `meetingId` reddedilir.
    - `risk_create`/`decision_create`'te `kind` ve `meetingId` reddedilir.
- **AC7 (mock verisi şemaya uyar):**
  - Given sabit saat (TEST_STRATEGY §3, `2026-10-05T09:00:00`).
  - When `createSeed().insights` ve `analyzeText` ile sabit metin kümesinden (7 türün hepsini üreten metinler) üretilen taslaklar `InsightProposalSchema` ile parse edilir.
  - Then hepsi geçer ve parse sonucu girdiye eşittir (`toEqual`, bilinmeyen alan da atılmamış olur).
- **AC8 (INV-19):**
  - `grep -rn "InsightProposedFields" apps/web/src packages/shared/src` boştur.
  - Web'deki öneri alan tipi shared'daki `InsightProposedAny`'dir.
  - Shared'da tür başına alan listesi tek yerdedir: `action_create`/`risk_create` alanları `ActionCreate`/`RiskDecisionCreate`'ten türetilir.
- **AC9 (davranış ve bundle eşitliği):** When `npm run build`, Then `apps/web/dist/assets/index-*.css` ve `index-*.js` dosyalarının adı ve sha256'sı ön ölçümle aynıdır. Farklıysa neden notta yazılır ve ADR-0006 K5 L5b-A (37 ekran + QA-03 çifti) koşulur.
- **AC10 (komutlar ve CI):**
  - Kökten `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` ve `npm run build` 0 ile çıkar.
  - `npm test` web'in 13 dosyasını ve yenilerini, ayrıca shared testlerini koşar.
  - `npm ls zod` tek sürüm gösterir (ya da sapma notta). `npm ls xlsx --all` boştur.
  - `.github/workflows/ci.yml` değişmemiştir. CI `app` ve `secrets` yeşildir.
- **AC11 (belgeler):** README:13, `packages/shared/src/index.ts` yorumu ve API_CONTRACT §6 notu §2.7'deki gibidir. API_CONTRACT'ta başka satır değişmemiştir.
- **AC-NEG3 (mockup davranışı):** `apps/web/src/**` diff'i yalnızca şunları içerir:
  - `types.ts` (enum shim, `InsightProposedFields` silme)
  - `InsightCard.tsx` ve `store.tsx`'te import ve tip annotasyonları
  - yeni test dosyaları

  Çalışma zamanı ifadesi değişmez (`git diff -w` incelemesi ve AC9 bayt eşitliği).
- **AC-NEG4 (shared saflığı):** `packages/shared/src` içinde `react`, `@/`, `apps/` import'u yoktur. Çalışma zamanı bağımlılığı yalnızca `zod`'dur (`package.json`). DOM ve Node global'i yoktur (AC2).

## 8. Test planı (seviyeler: `docs/TEST_STRATEGY.md`)
| AC | Seviye | Doğrulama / dosya |
|---|---|---|
| AC1, AC8, AC11, AC-NEG3, AC-NEG4 | Diff / dosya kontrolü (reviewer) | `git show --stat <ilk commit>`, `grep`, `git diff -w` |
| AC2 | L1 typecheck (self-enforcing fixture) | `packages/shared/typecheck/no-runtime-globals.ts`, `npm run typecheck`, `--listFilesOnly` |
| AC-NEG1 | Builder mutasyon kanıtı (notta) | Reviewer fixture'ı okur |
| AC3 | L1 | `apps/web/src/test/vite-env.test.ts` (node ortamı) |
| AC-NEG2 | Diff + grep | — |
| AC4, AC9, AC10 | Komut kontrolü (qa-verifier) | `npm ci`, `npm audit`, lint diff, sha256, `npm ls` |
| AC5 | Ara commit typecheck (qa-verifier, worktree'de ara commit) + grep | `types.parity.ts` (yalnızca ara commit) |
| AC6 | L1 | `packages/shared/src/schemas/insight.test.ts` |
| AC7 | L1 (L2c öncülü: mock çıktısı shared şemadan geçer) | `apps/web/src/lib/rabbitqa/insight-proposal.schema.test.ts` |
| Duman (smoke) | L6 (Playwright MCP) | Login, Genel bakış, Insights onay diyaloğu açılır, konsol 0 |

## 9. İlgili invariant maddeleri
- **INV-19:**
  - Enum'lar ve öneri şemaları tek kaynaktan gelir.
  - `types.ts` shim'i yeniden dışa aktarır, kopya tutmaz.
  - `InsightProposedFields` kalkar.
  - Varlıklar henüz `types.ts`'tedir; bunlar ikinci kaynak değildir, çünkü shared'da karşılıkları yok (04b'ye kadar).
- **INV-14:** `envDir` kök olur. Yalnızca `VITE_` öneki web'e girer; `envPrefix` değişmez (AC-NEG2). `.env` gitignore'da ve builder'a guard'lı.
- **INV-21, INV-23:** `InsightProposal` şekli ve #44 izin listesi şema olarak hazırdır. Tür açık mı, güven eşiği ve hedefin projeye ait olması gibi kontroller çalışma zamanında yapılır ve F8-03/F8-04'e aittir. Mock davranışı değişmez (D6).
- **INV-20:** Kural kodu taşınmaz ve değişmez.
- **INV-13:** `business-days` dokunulmaz; README düzeltmesi (REV-03) bunu netleştirir.

## 10. Riskler, karar noktaları ve açık sorular

### 10.1 Riskler
| Risk | Azaltma |
|---|---|
| Plugin'in yeni major'u geçişli bağımlılık getirir (babel, hermes vb.), audit açığı çıkabilir | AC4: audit 0 değilse dur, Murat'a sor. Sürüm varsayılmaz |
| Yeni React Compiler kuralları çok sayıda uyarı üretir | D4 (b): `warn`, kod değişmez, liste notta. Alt görevlerde dokunulan dosyada temizlenir |
| zod tip dosyaları DOM ya da Node referansı taşırsa (`/// <reference …>`) AC2 kırılır | Dur ve raporla. `lib`/`types` gevşetilmez |
| `z.infer` ile literal tipler arasında küçük fark (readonly, optional) | Ara commit parity kontrolü yakalar. Düzeltme şemada yapılır, `types.ts`'te değil |
| Tip-yalnız shim'e rağmen JS hash'i değişir | AC9: neden notta, L5b-A koşulur |
| Kökteki `.env`'de `VITE_` önekli eski değişkenler | Kodda `import.meta.env` yok (AC-NEG2); 04c'de ele alınır |
| Shared'a vitest eklenmesi F0-06 ile çakışır | Yalnızca tek script ve config. F0-06 `projects` kurarken birleştirir |

### 10.2 Karar tablosu (Murat seçer)
| # | Soru | Seçenekler | Öneri ve gerekçe |
|---|---|---|---|
| D1 | F0-04 nasıl bölünsün? | (a) §0'daki 8 alt görev (04a–04h). F0'da bütün ekranlar hook'a geçer, "→ API" görevleri yalnızca adaptör değiştirir · (b) 04a–04c F0'da yapılır, kalan ekranlar ilgili "→ API" görevinin ilk commit'inde hook'a geçer. F0 kısalır, ama PHASES "→ API" §2 ("ekran kodu değişmez") ve F0-04 kabul metni değişir · (c) Tek görev (3.000+ satır) | **(a).** PHASES ile uyumlu. Mockup donukken L5b karşılaştırması F0'da biter. Bağlama görevleri BE'ye odaklanır |
| D2 | 04a ile 04b birleşsin mi? | (a) Birleşik, yaklaşık 750 satır (450'si mekanik), tek gate · (b) Ayrı. 04a yaklaşık 400 satır (testlerle), 04b mekanik varlık taşıması | **(b).** 400 kuralına uyar. 04a Murat'ın 5 maddesini taşır, 04b tek tür işten oluşur ve parity ile seed testiyle hızlı denetlenir |
| D3 | Paket istisnasının dayanağı | (a) Yeni ADR-0007 K2 izin listesi (ADR-0006 K4 usulüyle) · (b) ADR-0006 K4'ü F0-04'e genişletmek | **(a).** ADR-0006 K4 metni "yalnızca F0-03" diyor ve eslint-plugin-react-hooks listede yok. Kabul edilmiş ADR'yi genişletmek yerine yeni karar izlenebilirliği korur. `AGENTS.md:25` demo kuralına "F0-04: ADR-0007 K2" eklenir (§13, Murat) |
| D4 | react-hooks kural seti | (a) Yalnızca klasik iki kural; lint çıktısı birebir aynı · (b) Güncel `recommended`, yeni kurallar `warn`, hata 0, liste notta, alt görevlerde dokunulan dosyada temizlenir · (c) `recommended` ve bütün bulgular 04a'da düzeltilir | **(b).** Yükseltmenin amacı yeni kuralları görmek. (c) dondurulmuş mockup kodunu davranış riskiyle değiştirir; (a) yükseltmeyi anlamsız kılar |
| D5 | `envDir` yeri | (a) Repo kökü, tek `.env` (F0-08'de API ile ortak); Vite yalnızca `VITE_` açar · (b) `apps/web` kalır; `apps/web/.env.example` ayrı dosya; kök `.env` yalnızca API/işçi için | **(a).** BACKLOG gözlemi bunu istiyor. `npm run dev` (F0-08) için tek dosya. INV-14 `envPrefix` ile korunur (AC-NEG2) |
| D6 | InsightProposal izin listesi mock'ta zorlansın mı? | (a) Yalnızca şema ve tip. Mock davranışı değişmez; zorlama 04h mock adaptöründe (parse) ve F8-03 API'de · (b) 04a'da mock `approveInsight` de zorlar. Davranış değişir, zod web bundle'ına girer, L5b-A gerekir | **(a).** F0-04 kabulü "tüm akışlar aynı". UI zaten yalnızca izinli alanları düzenliyor; AC7 seed ve ai-mock'un listeye uyduğunu kanıtlar |
| D7 | Şemalarda tarih ve ID katılığı | (a) `z.string()` · (b) Tarihler `z.iso.date()`, zaman damgaları `z.iso.datetime()`, ID'ler `z.string().min(1)` (mock ID'leri `p_…` uuid değil) | **(b).** API_CONTRACT §1 biçimine yakın. 04a'da yalnızca `due`, `decidedAt`, `planEnd`, `goLiveDate`, `sourceRef.at` etkilenir. Seed uymazsa builder durur ve sorar |
| D8 | Shared testleri nerede? | (a) `packages/shared`'da kendi `vitest run` (vitest devDep, web ile aynı aralık; yeni paket yok) · (b) Hepsi web'de | **(a).** TEST_STRATEGY L1 "saf mantık: `packages/shared` … zod şemaları". Mock verisi testi (AC7) web'de kalır, çünkü seed web'de |
| D9 | Web shared tiplerine nasıl erişsin? | (a) `types.ts` yeniden dışa aktarım shim'i; diğer import'lar değişmez · (b) 28+ dosyada import'lar `@rabbitqa/shared`'a | **(a).** Diff küçük, bundle bayt eşitliği korunur. Shim F9-01'de (mock kalkınca) ya da alt görevlerde kademeli kalkar |
| D10 | Şema adlandırma | (a) `<Ad>Schema` + `type <Ad>` · (b) Değer ve tip aynı adla (`Project`) | **(a).** Değer ve tip ayrımı okunur. API_CONTRACT §6 adları tip adı olarak korunur |
| D11 | `VITE_DATA_<MODÜL>` granülerliği (yön; 04c'de kesinleşir) | (a) "→ API" görevi başına modül (API_CONTRACT §2.1 "Modül / görev" sütunu) · (b) Faz grubu başına (`CONFIG`, `PROJECTS`, `ALERTS`, `REPORTS`, `INSIGHTS`) | **(a), karışık mod riskiyle.** http'deki modülün yazdığı veriyi mock'taki bir modül okuyorsa tutarlılık ilgili bağlama planında ele alınır (ör. F3 grubunda birlikte geçiş). 04a'da yalnızca `.env.example` yorumu etkilenir |

> **Murat cevapları (2026-10-09):** D1 (a) · D2 (b) · D3 (a) · D4 (b) · D5 (a) · D6 (a) · D7 (b) · D8 (a) · D9 (a) · D10 (a) · D11 (a). §10.3 V1–V4 kabul.

### 10.3 Açık sorular (güvenli varsayımla; karar gerektirirse Murat)
- **V1:** `risk_create`/`decision_create` önerisinde `kind` alanı kabul edilmez, öneri türünden türetilir. `meetingId` sunucu alanıdır (#44 "sunucunun atadığı alanlar"). Seed ve ai-mock bu alanları üretmiyor (AC7).
- **V2:** `step_update.status` şemada StepStatus'un tamamını kabul eder (`locked` dahil). Elle `locked`/`not_started` reddi şemanın değil servisin işidir (#5, `409`). UI zaten `locked`'ı listelemiyor.
- **V3:** `date_change`'te `phaseId` + `planEnd` birlikte zorunludur. Yalnızca `planEnd` reddedilir (#44 "hedef aşama, `phaseId`").
- **V4:** F0-02 round 1 QA-03 ("Go-Live 'Müşteri onayı kaydedildi' başarı toast'ı doğrulanmadı" → "F0-04 L5b turu") F0-03b qa-verifier AC11'de doğrulandı. BACKLOG'da kapatılması önerilir (§13).

## 11. Gerekli gate'ler
- [x] **reviewer:** ilk commit (AC1), shared tsconfig ve fixture (AC2, AC-NEG1 kanıtı), `envDir` ve INV-14 (AC3, AC-NEG2), paket ve lock farkı (yalnızca react-hooks plugin'i ve geçişlileri, shared'ın workspace girdileri), enum'ların 33/33 tamlığı, INV-19 grep'leri, AC-NEG3 `git diff -w`.
- [x] **qa-verifier:** temiz `npm ci` ve kök komutlar, audit, lint uyarı listesi farkı, AC9 sha256, ara commit typecheck'i (worktree'de `git checkout <ara commit>` ve `npm run typecheck`), AC6/AC7 test çıktıları, L6 duman testi. AC9 bayt eşitliği sağlanmazsa L5b-A.
- [x] **rules-reviewer: EVET.**
  - PHASES F0-04 ● işaretli.
  - Diff `approveInsight` (tip), `InsightProposal` ve ai-mock çıktılarını (AC7) kapsıyor; tetikleyici "AI Insight onay/uygulama", INV-21/23.
  - Kapsam dar:
    - Karar tablosu: 7 tür × (izinli alanlar / `dependency`, `durationDays`, `required` / bilinmeyen alan / karışık `date_change`), API_CONTRACT #44'e karşı.
    - V1–V3 varsayımlarının değerlendirilmesi.
    - Mock davranışının değişmediğinin teyidi (AC-NEG3, AC9).

## 12. Uygulama görev metni
```
AGENTS.md, docs/INVARIANTS.md, docs/RBAC.md, docs/DATA_MODEL.md ve docs/TEST_STRATEGY.md dosyalarını oku.
Ardından docs/plans/F0-04-fe-data-layer.md planının §1–§13 bölümlerini (yalnızca F0-04a) ve
docs/adr/0007-f0-04-fe-data-layer.md K1–K6'yı uygula. Kararlar §10.2 "Murat cevapları"nda; cevap yoksa ya da plan
"Onaylandı" değilse DUR ve sor. ADR-0007 main'de "Kabul edildi" değilse DUR.
Branch: chore/f0-04a-shared-foundation (main'den). PR açma.

0) ÖN ÖLÇÜM (main @ <sha>, scratchpad'e; nota son commit'te yazılır, commit ETME):
   npm ci; npm run build (asset adları + CSS/JS sha256); npm test (dosya/test); npm run lint (0 hata/21 uyarı listesi);
   npm audit + npm audit --omit=dev --audit-level=high; npx tsc -p packages/shared/tsconfig.json --listFilesOnly | wc -l;
   npm view eslint-plugin-react-hooks versions; npm view eslint-plugin-react-hooks@<seçilen> peerDependencies.

1) BUILD'İN İLK COMMIT'İ, AYRI VE YALNIZCA BELGE:
   docs: fix F0-03b gate doc findings [REV-01] [REV-02] [REV-03]
   Bu commit YALNIZCA şu üç dosyayı değiştirir, başka hiçbir dosya (kod, paket, not) bu commit'e girmez:
   - docs/changes/chore_f0-03b-monorepo.md:28 → "50 çalışma zamanı bağımlılığı (+ `@rabbitqa/shared` = 51)"
   - docs/changes/chore_f0-03a-upgrades.md:465 → plan §2.1 REV-02 (katman cümlesi tek kez; Sonner sırası: production'da sonra, dev'de önce, v3 ile aynı)
   - README.md:13 → plan §2.1 REV-03 cümlesi (aynen)
2) chore(shared): restrict shared tsconfig to ES2022 without ambient types [REV-04]
   lib ["ES2022"], types [], exclude test dosyaları; tsconfig.test.json; typecheck script iki tsconfig;
   packages/shared/typecheck/no-runtime-globals.ts (window/document/process, her biri @ts-expect-error).
   AC-NEG1 mutasyonunu (DOM / node ekle → typecheck kırmızı) koş, çıktıyı nota yaz, mutasyonu COMMIT ETME.
3) chore(web): read env from repo root (envDir)
   apps/web/vite.config.ts envDir = repo kökü; envPrefix DEĞİŞMEZ; vitest.config.ts'e envDir EKLEME.
   .env.example yorumu (plan §2.3). Test: apps/web/src/test/vite-env.test.ts (loadConfigFromFile, node ortamı).
   import.meta.env KULLANMA.
4) chore: upgrade eslint-plugin-react-hooks (ADR-0007 K2)
   En son stabil major (npm view; alpha/beta/rc/canary sayılmaz; peer eslint ^9 uyumsuzsa uyumlu en son stabil major; sürüm VARSAYMA).
   overrides / --legacy-peer-deps / --force YOK. eslint.config.js flat config uyarlaması; kural seti D4 cevabına göre.
   apps/web/src'de lint için kod değiştirme, eslint-disable ekleme. Lint uyarı listesini önce/sonra nota yaz.
   npm audit (tam) 0 değilse DUR, sor.
5) feat(shared): add enum schemas (+ geçici parity kontrolü)
   packages/shared/package.json: dependencies.zod (apps/web ile aynı aralık), devDependencies.vitest (aynı aralık), scripts.test "vitest run";
   packages/shared/vitest.config.ts (node). src/enums/: API_CONTRACT §6'daki 33 enum, değerler types.ts ile birebir,
   adlandırma D10. src/index.ts export'ları. apps/web/src/lib/rabbitqa/types.parity.ts: 33 enum için katı tip eşitliği
   assertion'ları (types.ts'teki mevcut tip ↔ shared tip). npm run typecheck yeşil olmalı. Bu commit'in SHA'sını nota yaz.
6) refactor(web): re-export enums from @rabbitqa/shared
   types.ts'te 33 enum tanımını kaldır → export type { … } from "@rabbitqa/shared". types.parity.ts'i SİL.
   Diğer import'lar DEĞİŞMEZ (D9).
7) feat(shared): InsightProposal schemas with per-kind field allowlist (API_CONTRACT #44)
   src/schemas/: ActionCreateSchema (#6), RiskDecisionCreateSchema (#31), InsightProposedSchemaByKind (plan §2.6 tablosu,
   strict + partial; action_create / risk_create / decision_create alanları .partial()/.omit() ile TÜRETİLİR, elle liste yazma),
   InsightProposalSchema (kind'a göre ayrımlı birleşim), türetilmiş InsightProposedAny tipi. Tarih/ID katılığı D7.
   Web: types.ts'ten InsightProposedFields'i SİL; InsightCard.tsx ve store.tsx'te yalnızca import ve tip annotasyonu
   InsightProposedAny olur. Çalışma zamanı ifadesi (??, ?., String(), if, varsayılan) EKLEME/DEĞİŞTİRME (AC-NEG3).
   Testler: packages/shared/src/schemas/insight.test.ts (AC6 tablo testi, negatifler dahil);
   apps/web/src/lib/rabbitqa/insight-proposal.schema.test.ts (AC7; vi.useFakeTimers + vi.setSystemTime('2026-10-05T09:00:00');
   seed insights + 7 türü üreten analyzeText girdileri; parse sonucu toEqual girdi).
   Seed ya da ai-mock bir şemaya uymazsa seed'i/ai-mock'u DEĞİŞTİRME — DUR, sor.
8) docs: README shared satırı (plan §2.7), packages/shared/src/index.ts yorumu, API_CONTRACT §6 tek satır not.

Bitiş:
- rm -rf node_modules apps/*/node_modules packages/*/node_modules apps/web/dist && npm ci &&
  npm run lint && npm run typecheck && npm test && npm run build → nota.
- npm audit; npm audit --omit=dev --audit-level=high; npm ls zod; npm ls eslint-plugin-react-hooks; npm ls xlsx --all → nota.
- npx tsc -p packages/shared/tsconfig.json --listFilesOnly → lib.dom ve @types/ yok (nota sayı ve grep).
- apps/web/dist/assets CSS ve JS sha256 → ön ölçümle aynı mı (AC9)? Farklıysa nedeni yaz ve ADR-0006 K5 L5b-A'yı koş (37 ekran + QA-03).
- git diff -w main...HEAD -- apps/web/src → yalnızca tip/import + yeni testler (AC-NEG3).
- npm run dev → login, Genel bakış, Insights "Düzenle ve onayla" diyaloğu açılıyor, konsol 0.
- Değişiklik notu (docs/changes/chore_f0-04a-shared-foundation.md): Ölçüm—main, commit listesi (1. commit belge, ara parity commit SHA'sı),
  AC ↔ kanıt, lint önce/sonra listesi, AC-NEG1 çıktıları, Eşleme, Açık sorular/sapmalar, Öneriler. Push et. PR açma.
Kurallar: docs/WORKFLOW.md şablon A. Yalnızca plan kapsamı. Yeni paket yok (ADR-0007 K2 listesi dışında).
Hedef major npm'de stabil yayımlanmamışsa en son stabil major'da kal; sapmayı nota yaz.
```

## 13. Denetim / Murat işleri (builder dışı)
- **`/build`'den önce** (2026-10-09 hazırlandı; Murat'ın commit'iyle main'e girer):
  - D1–D11 cevapları bu plana yazılır, plan "Onaylandı" olur. ✔
  - ADR-0007 "Kabul edildi" olarak main'e girer. ✔ (dosya)
  - `docs/PHASES.md` F0-04 satırı D1'e göre alt görevlere bölünür (04a–04h, her biri ●). ✔ (dosya)
  - `AGENTS.md:25` demo kuralına "F0-04: yalnızca ADR-0007 K2 izin listesi" eklenir (Murat, kit değişikliği). ✔ (dosya)
- **Merge sonrası:**
  - PHASES F0-04a tamamlandı olarak işaretlenir.
  - BACKLOG kapanışları:
    - REV-01, REV-02, REV-03, REV-04 (chore/f0-03b-monorepo)
    - `envDir` gözlemi
    - F0-02 round 1 açık sorusu "`InsightProposedFields` şemaya kopyalanmamalı": şema tarafı kapandı; çalışma zamanı zorlaması → 04h ve F8-03
    - F0-02 QA-03 (V4)
    - F0-03a not :474 (`eslint-plugin-react-hooks` → F0-04)
  - D4 = (b) seçildiyse yeni uyarı listesi BACKLOG'a "04c–04h, dokunulan dosyada" hedefiyle yazılır.
  - 04b planı (`/plan F0-04b`) bu çerçevenin §0 satırından başlar.
