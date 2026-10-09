# ADR-0007: F0-04 — FE veri erişim katmanı: bölme, paket istisnası ve shared şema kuralları

**Durum:** Kabul edildi (2026-10-09; D1a D2b D3a D4b D5a D6a D7b D8a D9a D10a D11a; K7 04c planıyla eklenir)
**Tarih:** 2026-10-09
**Hazırlayan:** planner · **Onaylayan:** Murat (2026-10-09)

## Bağlam
PHASES F0-04 şunları istiyor:
- `packages/shared` zod şemaları (types.ts'ten)
- Modül bazlı TanStack Query hook'ları ve `DataSource` arayüzü
- Mevcut store'un mock adaptörü olması
- Modül başına `VITE_DATA_<MODÜL>=mock|http` anahtarı
- Ekranların `useRq()` yerine hook'ları kullanması

Kabul: görsel referansa göre fark yok, akışlar aynı.

Durum: `useRq()` 28 dosyada 71 kez kullanılıyor. `types.ts` yaklaşık 400 satır, 33 enum ve 34 varlık içeriyor. Store'da 51 işlem var. Tahmini diff 3.000 satırın üzerinde.

F0-03b gate'inden F0-04'e kalanlar:
- REV-04: shared tsconfig'de DOM ve Node global'leri görünüyor.
- `envDir` gözlemi: Vite artık `apps/web`'i okuyor, kök `.env` web'e ulaşmıyor.
- REV-01..03: belge düzeltmeleri.

F0-02'den kalan: gevşek `InsightProposedFields` tipi (INV-19, API_CONTRACT #44).

F0-02 ve F0-03a'dan kalan: `eslint-plugin-react-hooks` güncel sürüm değerlendirmesi.

ADR-0006 K4'ün paket istisnası "yalnızca F0-03" için geçerli ve eslint-plugin-react-hooks bu listede yok. AGENTS.md demo kuralı ("yeni npm paketi yok") yalnızca ADR-0006 K4'e istisna tanıyor.

## Seçenekler
1. **Tek görev:** 400 satır kuralını yaklaşık 8 kat aşar. Görsel farkın kaynağı ayrıştırılamaz.
2. **Zemin + varlıklar + çekirdek + modül grupları (04a–04h):** Her alt görev kendi gate'inden geçer. Ekran değişiklikleri modül grubu başına L5b-A ile doğrulanır.
3. **Zemin + çekirdek F0'da, kalan ekranlar "→ API" görevlerinde:** F0 kısalır. Bağlama görevleri büyür ve "ekran kodu değişmez" ilkesi bozulur.

## Karar
- **K1 — Bölme (D1, D2):**
  - Seçenek 2.
    - **04a:** zemin. REV-01..04, `envDir`, eslint-plugin-react-hooks, 33 enum, `ActionCreate`, `RiskDecisionCreate`, `InsightProposal`.
    - **04b:** varlık şemaları.
    - **04c:** veri katmanı çekirdeği ve pilot modüller.
    - **04d–04h:** modül grupları (plan §0 tablosu).
  - Her alt görev ayrı plan, branch ve gate alır. PHASES ● her alt göreve uygulanır (rules-reviewer).
- **K2 — Paket istisnası (yalnızca F0-04; D3):**
  - **Yükseltilebilen:** `eslint-plugin-react-hooks`, en son stabil major'a. `npm view <paket> versions` ile bakılır; alpha/beta/rc/next/canary sayılmaz. Peer `eslint ^9` ile uyumsuzsa uyumlu en son stabil major seçilir. Sürüm varsayılmaz, sapma değişiklik notuna yazılır.
  - **Workspace bağımlılığı olarak eklenebilen (ağaçta zaten var, aynı aralık):**
    - `zod` → `@rabbitqa/shared` `dependencies`
    - `vitest` → `@rabbitqa/shared` `devDependencies`
  - **Yasak:** `overrides`, `--legacy-peer-deps`, `--force`.
  - **Audit hedefi:** `npm audit` (tam) 0. CI'daki `--omit=dev --audit-level=high` 0.
  - 04c–04h'de yeni paket beklenmiyor (TanStack Query zaten var). İhtiyaç çıkarsa (ör. MSW) F0-06'ya ya da bu ADR'ye ek karara bağlanır.
  - AGENTS.md demo kuralı bu listeyle sınırlı istisna alır.
- **K3 — Shared şema kuralları (D7–D10):**
  - Konum: `packages/shared/src/enums/`, `packages/shared/src/schemas/` (AGENTS §3, API_CONTRACT §6).
  - Adlandırma: `<Ad>Schema` + `type <Ad> = z.infer<…>`. Tip adları `types.ts` ve API_CONTRACT §6 ile aynı.
  - Enum değerleri mockup ile birebir aynıdır. Enum değiştirilmez, yalnızca yeni değer eklenir.
  - Tarihler `z.iso.date()`, zaman damgaları `z.iso.datetime()`. ID'ler `z.string().min(1)`; mock ID'leri uuid değil, API ve mock aynı şemadan geçer.
  - Nesneler `z.object` olur (bilinmeyen alanı atar). Mock uygunluk testleri parse sonucunun girdiye eşit olduğunu ayrıca doğrular.
  - Alan listeleri türetilir (`pick` / `omit` / `partial` / `extend`). Elle ikinci liste yazılmaz (INV-19).
  - Shared'ın `tsconfig`'i `lib: ["ES2022"]` ve `types: []` kullanır. DOM ve Node global'i yoktur; bu, kendi kendini zorlayan bir typecheck fixture'ıyla korunur (REV-04).
  - Testler ayrı tsconfig'de type-check edilir.
  - Web tiplere `apps/web/src/lib/rabbitqa/types.ts` shim'i üzerinden erişir: yalnızca `export type … from "@rabbitqa/shared"` ve mock'a özgü `RqState`. Shim F9-01'e kadar ya da alt görevlerde kademeli olarak kalkar.
  - ADR-0006 K6 (TS kaynağı `exports` ile, build yok) değişmez.
- **K4 — Ortam değişkenleri (D5, INV-14):**
  - Web `envDir` = repo kökü; F0-08 ile tek `.env`.
  - `envPrefix` Vite varsayılanında (`VITE_`) kalır, genişletilmez. Gizli değerlere `VITE_` öneki verilmez.
  - Vitest `envDir` tanımlamaz; testler geliştiricinin `.env`'inden bağımsızdır.
  - `VITE_DATA_<MODÜL>` anahtarlarının listesi ve varsayılanı (`mock`) 04c'de K7 ile belirlenir. Granülerlik yönü D11: "→ API" görevi başına modül.
- **K5 — InsightProposal (D6):**
  - Shared'da `InsightProposalSchema` (AI çıktısı, `kind` üzerinde ayrımlı birleşim) ve `InsightProposedSchemaByKind` (API_CONTRACT #44 izin listesi) yer alır.
  - Tür başına izinli alanlar:
    - `step_update`: status, due, ball, ownerId
    - `action_update`: status, due, ownerId
    - `health_change`: health, healthReason
    - `date_change`: `{ phaseId, planEnd }` ya da `{ goLiveDate }`
    - `action_create`: `ActionCreate` alanları
    - `risk_create`, `decision_create`: `RiskDecisionCreate` − { kind, meetingId }
  - `dependency`, `durationDays` ve `required` hiçbir türde yoktur.
  - Mockup'ın `InsightProposedFields` tipi kaldırılır. Yerine şemalardan türetilen `InsightProposedAny` gelir.
  - Mock davranışı 04a'da değişmez. Çalışma zamanı zorlaması 04h mock adaptöründe ve F8-03 API'de yapılır. Bağlam kontrolleri (tür açık mı, güven eşiği, hedefin projeye ait olması) F8'dedir (INV-23).
- **K6 — Görsel kabul:**
  - Web build çıktısı (JS ve CSS sha256) main ile bayt düzeyinde aynıysa L5b-A gerekmez (F0-03b emsali).
  - Değilse, ve ekran kodu değişen bütün alt görevlerde (04c–04h), ADR-0006 K5 yöntemi ve eşiği uygulanır.

## Sonuçlar
- **Olumlu:**
  - F0-03b borçları kapanır.
  - Enum ve öneri şemalarının tek kaynağı oluşur.
  - #44 izin listesi API yazılmadan önce test edilebilir hale gelir.
  - 04c'deki veri katmanı tipli bir zemine oturur.
  - Her alt görev küçük kalır ve bayt eşitliği ya da L5b ile doğrulanabilir.
- **Olumsuz / kabul edilen riskler:**
  - F0-04 sekiz gate döngüsü sürer.
  - `types.ts` shim'i geçici bir dolaylılık katmanıdır.
  - Yeni lint kuralları `warn` olarak birikir; alt görevlerde temizlenir.
  - eslint-plugin-react-hooks yeni geçişli bağımlılıklar getirir (audit hedefiyle sınırlı).
  - `VITE_DATA` karışık modu (bazı modüller http, bazıları mock) veri tutarsızlığı doğurabilir; bağlama planlarında ele alınır.
- **Takip edilecek işler:**
  - PHASES F0-04 satırı 04a–04h olarak bölünür.
  - AGENTS.md demo kuralına K2 istisnası eklenir.
  - 04c planı bu ADR'ye **K7**'yi ekler: `DataSource` biçimi, `DataError` (API_CONTRACT §1 hata kodları), mock köprüsü (RqProvider'ı saran adaptör), mod çözücü, sorgu anahtarları ve invalidation, `http` modu için adaptör yokken davranış.
  - 04b: `AiInsight` = `InsightProposal` + sunucu alanları.
  - F0-05: REV-05, workspace bazında ESLint.
  - F0-06: shared vitest'in `projects` yapısına katılması.
