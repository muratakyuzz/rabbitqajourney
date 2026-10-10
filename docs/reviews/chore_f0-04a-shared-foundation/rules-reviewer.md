## rules-reviewer tur 2 (kısa tur): chore/f0-04a-shared-foundation @ 5d7e656 (007f47d..5d7e656)
**Karar:** APPROVE

Tur 1 raporu (@ 007f47d, APPROVE, RUL-01 Medium, RUL-02 Low): `git show 9045c0f:docs/reviews/chore_f0-04a-shared-foundation/rules-reviewer.md`.

RUL-01 ve RUL-02 kapandı, yeni bulgu yok. Builder'ın beyan ettiği 4 mutasyonun hepsi tekrarlandı ve kırmızı sayıları birebir tuttu (1/3/4/1). 3 ek mutasyon da kırmızı verdi.

**Mutasyonlar worktree'de yapılmadı.** Denetim rolü proje dosyalarına yazamadığı için `packages/shared/src`, `package.json` ve `vitest.config.ts` scratchpad'e kopyalandı, `node_modules` worktree'ye sembolik bağla bağlandı. `npm ci` çalıştırılmadı. Worktree'ye hiç yazılmadı:
- Kopyadaki orijinal `insight.ts` için `cmp` sonucu: worktree dosyasıyla aynı.
- `git -C <worktree> status --short | wc -l` sonucu `0`.
Hiçbir mutasyon commit'lenmedi.

### Kapsam
- Diff'te tek kod değişikliği `packages/shared/src/schemas/insight.test.ts` (+59). `insight.ts` ve `apps/` değişmemiş.
- Kaynaklar: `docs/API_CONTRACT.md:123` (#44), `:78` (#6 `ActionCreate`), `:103` (#31 `RiskDecisionCreate`), `packages/shared/src/enums/index.ts:12,24,88`.

### Kontrol sonuçları
1. **ALLOWED, #44 ile birebir aynı ve elle yazılmış** (`insight.test.ts:25-36`).
   - Update türleri:
     - `step_update`: status, due, ball, ownerId
     - `action_update`: status, due, ownerId
     - `health_change`: health, healthReason
     - `date_change`: phaseId, planEnd, goLiveDate
   - `action_create`: 7 alan, #6 ile aynı (title, ownerId, ball, due, priority, status, isCustomerVisible).
   - `RISK_DECISION_FIELDS`: 10 alan. #31'deki 12 alandan kind ve meetingId çıkarılmış hali.
   - Şemadan türetilmemiş:
     - `./insight`'tan yalnızca `InsightProposalSchema`, `InsightProposedSchemaByKind` ve `type InsightProposedAny` import ediliyor (`:3`).
     - Şemalar yalnızca `accepts()` içindeki `safeParse` için kullanılıyor; `.shape` ve `.keyof` hiçbir yerde yok.
   - `"%s samples cover exactly its #44 allowlist"` (`:99-101`), elle yazılmış `VALID` tablosunu `ALLOWED`'a bağlıyor.
2. **RUL-01 kapandı.**
   - `FOREIGN_FIELDS` (`:45-49`): her tür, başka türün izin verdiği her alanla deneniyor; değer o türün örnek değeri. Kapsam: yedi izin listesinin birleşimi olan 17 alan.
   - Her vaka iki biçimde red bekliyor: geçerli gövdeye eklenmiş ve tek başına (`:103-106`).
   - `date_change` `{phaseId, goLiveDate}` ve `{phaseId}` red (`:118-119`).
   - Pozitif testler:
     - Tek alan kabulü `date_change` hariç 6 türde (`:77-82`).
     - `date_change` için `{phaseId, planEnd}` ve `{goLiveDate}` (`:114-115`).
   - Kapsam dışında kalanlar:
     - Sunucunun atadığı alanlar (`source`, `ruleKey`, `insightId`, `meetingId`, `kind`) yalnızca create türlerinde açıkça test ediliyor (`:128-139`). Update türlerinde bu alanları yalnızca `.strict()` ve `foo` testi koruyor (Ö-4).
     - Yabancı değerler, alanın sahibi olan türün örneğinden geliyor. Bu yüzden alanı dar tiple ekleyen bir mutasyon daha az testi kırıyor (M3b). En az biri kırmızı olduğu için yeterli.
3. **RUL-02 kapandı.**
   - `STATUS_CASES` (`:51-64`): 5 tür × 10 durum = 50 vaka. Elle yazılmış listeler enum'larla aynı.
   - RiskStatus değerleri `step_update`, `action_update` ve `action_create`'de red; risk ve kararda kabul.
   - `cancelled`, `done`, `in_progress`, `pending`, `out_of_scope` ve `locked` risk ve kararda red.
   - `step_update` + `locked` kabul ediliyor. Bu V2 ile tutarlı (#5 `409`).
4. **Mutasyonlar.** Baz koşu `Tests  274 passed (274)`.

| # | Mutasyon (`insight.ts`, scratch kopya) | Kırmızı | Çıktıdan alıntı |
|---|---|---|---|
| M1 | `action_update` `.pick` + `ball: true` | 1 | `× action_update rejects ball = "customer" (allowed in step_update)` · `Tests  1 failed \| 273 passed (274)` |
| M2 | `step_update` + `title: z.string().min(1)` | 3 | `× step_update rejects title = "VPN bilgisi" (allowed in action_create)` (+ risk_create, decision_create) · `Tests  3 failed \| 271 passed (274)` |
| M3a | `health_change` + `status: z.string()` | 4 | `× health_change rejects status = "in_progress" / "done" / "open" / "accepted"` · `Tests  4 failed \| 270 passed (274)` |
| M3b | `health_change` + `status: StepStatusSchema` | 2 | `in_progress`, `done` · `Tests  2 failed \| 272 passed (274)` |
| M4 | `step_update` status `StepStatusSchema.or(z.literal("mitigated"))` | 1 | `× step_update status mitigated → accepted: false` · `Tests  1 failed \| 273 passed (274)` |
| M5 (ek) | `action_update` `.pick` + `priority: true` | 1 | `× action_update rejects priority = "high" (allowed in action_create)` |
| M6 (ek) | `date_change` goLiveDate dalına `phaseId: IdSchema.optional()` | 1 | `× date_change takes either { phaseId, planEnd } or { goLiveDate }, never a mix` |
| M7 (ek) | Risk/karar `omit` + `isCustomerVisible: true` (daraltma) | 4 | `× risk_create accepts all of its allowed fields` (+ decision_create, iki partial testi) |

   Builder'ın "health_change + status → 4" sayısı yalnızca `z.string()` ile tutuyor (M3a). Beyan doğru, ama hangi tiple yapıldığı yazılmamış.
5. **Gevşeme yok.** Şema ve izin listesi dosyalarına dokunulmamış. Diff yalnızca ekleme (`59 insertions(+)`). INV-21 ve INV-23 için çalışma zamanı davranışı değişmedi.

### Karar tablosu (tur 2 delta'sı; L1 Vitest, yalnızca şema katmanı)
| Girdi | #44'e göre beklenen | Şemadaki davranış | Test |
|---|---|---|---|
| `action_update` + `ball` | red | red | T:103-106 (M1) |
| `action_update` + `priority`/`title`/`isCustomerVisible` | red | red | T:103-106 (M5) |
| `step_update` + `title`/`health`/`priority`/`planEnd`… | red | red | T:103-106 (M2) |
| `health_change` + `status`/`goLiveDate`… | red | red | T:103-106 (M3) |
| create türleri + başka türün alanı | red | red | T:103-106 |
| `date_change` `{phaseId, goLiveDate}` / `{phaseId}` | red | red | T:118-119 (M6) |
| Her tür, kendi izinli alanı tek başına | kabul | kabul | T:77-82, T:114-115 |
| `step_update`/`action_update`/`action_create` status ∈ RiskStatus | red | red | T:108-111 (M4) |
| `risk_create`/`decision_create` status `cancelled`/`done`/`in_progress` | red | red | T:108-111 |
| `risk_create`/`decision_create` status `realized` | kabul | kabul | T:108-111 |
| `step_update` status `locked` | V2: şema kabul eder, #5 `409` döner | kabul | T:108-111 |
| Update türleri + `meetingId`/`source`/`insightId`/`ruleKey`/`kind` | red | red (strict) | yalnızca dolaylı (`foo`); Ö-4 |

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu | Öneri |
|---|---|---|---|---|---|
| — | — | — | — | Yeni bulgu yok. RUL-01 ve RUL-02 kapandı. | — |

### Açık sorular / öneriler (engelleyici değil)
- **Ö-4:** Sunucunun atadığı alanlar için red testini 7 türün hepsine genişlet (`insight.test.ts:128-139`). F8-03 öncesine uygun.
- **INV-12 (tur 1 açık sorusu) hâlâ açık:** `ALLOWED` artık `isCustomerVisible`'ı create türlerinde izinli olarak sabitliyor. Murat (a) seçeneğini seçerse bu tablo ve iki pozitif test bilerek güncellenmeli (M7). Test, bu kararın sessizce uygulanmasını engelliyor.
- Değişiklik notunda M3'ün tipi (`z.string()`) belirtilmeli ki beyan tekrarlanabilir olsun.
