# Gate Özeti — feat/m09c-phase-workspaces-tabs @ 9171430 (round 2)

Faz M (demo modu) — parity/pg-mem kontrolü uygulanmaz. `gh` CLI kurulu değil, CI sonucu okunamadı (demo modunda engel değil).

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 1 (REV-12) | 5 (REV-13…16, lint notu) |
| qa-verifier | APPROVE | 0 | 0 | 0 | 1 (lint/main karşılaştırma notu) |
| rules-reviewer | APPROVE | 0 | 0 | 1 (RUL-07) | 2 (RUL-08, RUL-09) |
| CI (app / parity / secrets) | okunamadı (`gh` yok) | — | — | — | — |

**Genel karar: MERGE'E HAZIR**

Round 1'in tüm High/Critical bulguları (REV-01/02/03, RUL-01/02/03) kodda doğru düzeltildi ve her biri gerçek testle sabitlendi. Kalan bulgular test boşlukları ve belge doğruluğu düzeltmeleri — davranış değişikliği gerektirmiyor, merge'i engellemiyor.

## Düzeltme direktifi (BACKLOG'a alındı, engelleyici değil)

1. **[REV-12 / RUL-09]** `completion.test.ts`: `saas_env` create audit reason'ını birebir assert et; LLM_ACTIONS döngüsünün `rule_review:*`'a dokunmadığını ayırt edici bir testle sabitle (`rule_review:<reqdocId>` açıkken LLM geçişi yap, aksiyon değişmemeli); A→B→A testinde due/title audit'lerini farklı sistem saati/gerekçeyle tetikleyip assert et. `store.test.tsx`: `setInstallChoice` idempotans testi ekle; 05 done `addTeam` testine `due` assert'i ekle.
2. **[RUL-07]** `store.test.tsx`: `addTeam`'in 05 aktif (`in_progress`, `p_perakende` fixture'ı) durumunu test et — adım `pending` olmalı, aksiyon açılmamalı. Ayrıca "takım eklenince işaretsiz `adapt:general` → `out_of_scope`" kuralını ve "işaretliyse dokunulmaz" korumasını en az iki testle sabitle.
3. **[REV-13]** Değişiklik notuna fix commit'lerini ("Ne değişti") ekle; ":101 kural motorunda değişiklik yapılmadı" cümlesini düzelt; `store.tsx` satır referanslarını güncelle (387-388).
4. **[REV-14]** `completion.test.ts:957` test adını "SaaS->On-prem" olarak düzelt.
5. **[REV-15]** `DiscoveryContent.tsx`: 05 `out_of_scope` durumunda toast metnini adımın gerçek durumuna uygun hale getir.
6. **[REV-16 / RUL-08]** `rules.ts:138`: SaaS→On-prem `saas_env` iptal reason'ını `installTypeReasonText(...)` ile kur (hangi geçiş, hangi aşama bilgisini taşısın).
7. Değişiklik notundaki lint karşılaştırma iddiasını düzelt (main 44, branch 42 — iyileşme, "aynı" değil).

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki "Review düzeltmeleri" tablosunu güncelle ve push et.
