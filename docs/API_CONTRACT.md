# API Sözleşmesi

> **Durum:** Şablon — F0-01'de dondurulmuş mockup'tan çıkarılır (planner + uygulama oturumu). BE bu sözleşmeye göre yazılır; FE `http` adaptörü bu sözleşmeyi tüketir.
> Kaynaklar: `apps/web` (mockup) → store `Ctx` arayüzü (M-09 sonrası; v3'te 52 işlem — `docs/AUDIT.md` §3), `types.ts`, `perm.ts`, `rules.ts`, ekranlar · `docs/PRODUCT_SPEC.md` · `docs/RBAC.md`.
> Şemaların tek kaynağı `packages/shared/src/schemas/` (INV-19). Bu doküman şemaları tekrar yazmaz; şema adına referans verir.

## 1. Genel kurallar
- Taban yol: `/api/v1`. JSON. Tarih: `YYYY-MM-DD`, zaman damgası: ISO 8601 (UTC).
- Kimlik: session cookie + `X-CSRF-Token` (durum değiştiren isteklerde).
- Hata gövdesi: `{ error: { code, message, details? } }` — `message` Türkçe, kullanıcıya gösterilebilir.
- Gerekçe gereken isteklerde gövdede `reason` (INV-06).
- Listeler: `?page&pageSize&sort` + filtreler; yanıt `{ items, total }`.

## 2. Store fonksiyonu → endpoint eşlemesi
| # | Mockup (store `Ctx`) | Method & path | İstek şeması | Yanıt şeması | authorize() aksiyonu | Audit | Gerekçe | Tetiklenen kural | Modül / görev |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `createProject` | POST /projects | `ProjectCreate` | `Project` | `project:create` | ✔ | — | şablondan aşama/adım kopyası | F3-01 |
| 2 | `updateStep` | PATCH /steps/:id | `StepPatch` | `Step` | `step:update` | ✔ | durum/tarih | top değişimi → `ballSince` | F3-02 |
| 3 | `completePhase` | POST /phases/:id/complete | — | `Phase` | `phase:approve` | ✔ | — | zorunlu adım kontrolü | F3-02 |
| 4 | `setKickoff` | PUT /projects/:id/kickoff | `KickoffInput` | `KickoffResult` (değişen adım/aksiyonlar) | `project:update` | ✔ | tip/LLM değişimi | SaaS/On-prem, LLM | F4-02 |
| … | | | | | | | | | |

## 3. Okuma uçları (ekran → sorgu)
| Ekran | Endpoint | Filtreler | Yanıt şeması | DATA_MODEL erişim deseni |
|---|---|---|---|---|
| Proje listesi | GET /projects | csm, health, phase, q | `ProjectListItem[]` | Q1 |
| … | | | | |

## 4. Mockup ile fark kararları
Mockup'ta olup API'de farklı yapılacak şeyler (ör. demo girişte şifresiz giriş, istemcide hesaplanan uyarılar → sunucuda).
| Konu | Mockup davranışı | API davranışı | Gerekçe |
|---|---|---|---|

## 5. Açık sorular
