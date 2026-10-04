# Gate Özeti — feat/m09a-step-completion @ c3048ec (round 2)

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 1 | 2 |
| qa-verifier | APPROVE | 0 | 0 | 0 | 0 |
| rules-reviewer | APPROVE | 0 | 0 | 1 | 3 |
| CI (app / parity / secrets) | okunamadı (gh yok) — demo modunda engel değil | — | — | — | — |

**Genel karar:** MERGE'E HAZIR

## Düzeltme direktifi

Bu round'da Critical veya High bulgu yok; aşağıdaki Medium bulgular merge'i engellemiyor ama önerilir, isteğe bağlı olarak ayrı commit'te düzeltilebilir. Tüm Medium/Low bulgular `docs/reviews/BACKLOG.md`'ye eklendi.

1. **[REV-07]** `src/lib/rabbitqa/store.test.tsx:151-165`'teki AC13 testi `p_isyatirim` üzerinde çalışıyor; bu projenin devir toplantısı zaten `held` ve adım zaten `done`, bu yüzden "planned→held geçişinde adım done olur" iddiası gerçekte sınanmıyor. Testi `devops_handover` adımı açık/kilitli olan ve held devir toplantısı olmayan bir projeye taşı (örn. `p_garanti`). Eklenecek test: önce `before.status !== "done"` doğrula, planned eklendiğinde `ball`/`status` değişmez, held'e çekince `ball === "devops"` ve `status === "done"`.

2. **[RUL-11]** `src/lib/rabbitqa/rules.ts:69-103`'teki `applyLlmChoice` (LLM tercihi: gpu/own geçişleri) için hiç test yok. Eklenecek test: gpu→own→gpu A→B→A senaryosu; ruleKey başına tek aksiyon; gpu aksiyonları cancelled↔open; `model_install` locked↔out_of_scope; her geçişte "Otomatik kural: LLM tercihi …" audit'i; aynı seçimle ikinci çağrı yeni audit üretmez.

Round 1'in tüm Critical/High/Medium bulguları (REV-01, REV-02, REV-03, REV-04, REV-06, RUL-01, RUL-02, RUL-03, RUL-08) bu round'da üç ajan tarafından da koddan baştan doğrulanarak düzeltilmiş kabul edildi. Kalan Low bulgular (REV-05, REV-08, RUL-04–07, RUL-09, RUL-10, RUL-12, RUL-13) ve açık sorular BACKLOG.md'de, M-09b/c'ye bırakıldı.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki "Review düzeltmeleri" tablosunu güncelle ve push et.
