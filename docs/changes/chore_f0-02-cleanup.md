# Değişiklik notu — chore/f0-02-cleanup
> `/build` doldurur, branch'in son commit'iyle birlikte push edilir; `/gate` bunu okur, `/fix` "Review düzeltmeleri" tablosunu günceller. Dosya adı: `docs/changes/<branch, / → _>.md`.

## Görev
- Plan: `docs/plans/F0-02-cleanup.md`
- Faz / görev kodu: F0-02

## Ne değişti
**Bölüm A — Repo hijyeni**
- `bun.lock`, `bun.lockb` silindi; `.gitignore` diğer paket yöneticilerinin kilit dosyalarını yok sayıyor, `dist`/`.idea` tekrarları temizlendi (1da79f7).
- `src/integrations/supabase/`, `supabase/config.toml` ve `@supabase/supabase-js` kaldırıldı (a3e03bc).
- `vite.config.ts`'ten `componentTagger` ve `mcpPlugin` çıkarıldı (`plugins: [react()]`); `@lovable.dev/mcp-js`, `lovable-tagger` kaldırıldı (d5abbb5).
- `xlsx`, `canvas-confetti`, `@types/canvas-confetti`, `@tailwindcss/typography` kaldırıldı (0fe9508).
- `.lovable/` silindi (f9c5856). README Türkçe ve Lovable'sız yeniden yazıldı (0388131).
- `.env.example` eklendi; yalnızca yorum içeriyor (2312aa3). M2 guard istisnası main'de olduğu için builder yazdı.
- `eslint.config.js` `ignores`: `.verify`, `coverage`, `playwright-report`, `test-results` (50b7c60).
- **Plan dışı (Murat kararı, 2026-10-07):** `tailwindcss-animate` `devDependencies`'e taşındı, sürüm değişmedi (84eeac9). Ayrıntı "Açık sorular / sapmalar" 2'de.

**Bölüm B — Kalite kapıları ve testler**
- AC17/AC5 sahte-yeşil testleri seed'lenmiş öneriyle gerçek teste çevrildi; `seedWithStepUpdateInsight` dosya düzeyinde `seedStepUpdateInsight`'a genelleştirildi (8205cad).
- "Adım bulunamadı" testleri (806951d).
- `support_track` koruma testi (840baa1), ardından no-op satırın silinmesi (e13a4c7).
- Lint 14 error → 0. Commit'ler: if/else adfeb66, tailwind `import` 32bd466, `InsightProposedFields` bcd2af9, shadcn override e7208cf.
- `typecheck` script'i (1f5f2eb), TS `strict` (27c4704).

**Bölüm C — Sözleşme takibi** (`docs/API_CONTRACT.md` v1.3 ve F0-01 değişiklik notu): ayrıntı "Sözleşme takibi" tablosunda.

## Ölçüm — main @ 7ac811c (değişiklikten önce)
```
npx eslint .                                  → 42 problems (14 errors, 28 warnings)
npx tsc --noEmit -p tsconfig.app.json         → 0 hata (mevcut ayar)
npx tsc --noEmit -p tsconfig.app.json --strict → 1 hata: src/lib/rabbitqa/completion.test.ts(963,77) TS2345
  (--strict --noImplicitAny ile de 1 hata, aynı satır; tsconfig.node.json 0 hata)
npm test                                      → Test Files 13 passed (13) · Tests 210 passed (210)
npm run build                                 → dist/assets/index-CjfMyXEl.css 68.25 kB (gzip 11.83)
                                                dist/assets/index-l0omCwOO.js 1,224.09 kB (gzip 344.62)
npm audit                                     → 19 (critical 2, high 9, moderate 8)
npm audit --omit=dev                          → 14 (high 9, moderate 5); --audit-level=high çıkış 1
```

Lint — main'deki 42 problem (`dosya:satır:kural`):
```
src/components/rq/Badges.tsx:47:react-refresh/only-export-components (warning)
src/components/rq/InsightCard.tsx:36:react-refresh/only-export-components (warning)
src/components/rq/InsightCard.tsx:41:react-refresh/only-export-components (warning)
src/components/rq/InsightCard.tsx:42:@typescript-eslint/no-explicit-any (error)
src/components/rq/InsightCard.tsx:55:react-refresh/only-export-components (warning)
src/components/rq/InsightCard.tsx:58:@typescript-eslint/no-explicit-any (error)
src/components/rq/InsightCard.tsx:58:@typescript-eslint/no-explicit-any (error)
src/components/rq/InsightCard.tsx:59:@typescript-eslint/no-explicit-any (error)
src/components/rq/InsightCard.tsx:59:@typescript-eslint/no-explicit-any (error)
src/components/rq/InsightCard.tsx:152:@typescript-eslint/no-explicit-any (error)
src/components/rq/InsightCard.tsx:235:react-refresh/only-export-components (warning)
src/components/rq/InsightCard.tsx:237:react-refresh/only-export-components (warning)
src/components/ui/badge.tsx:29:react-refresh/only-export-components (warning)
src/components/ui/button.tsx:47:react-refresh/only-export-components (warning)
src/components/ui/command.tsx:24:@typescript-eslint/no-empty-object-type (error)
src/components/ui/form.tsx:129:react-refresh/only-export-components (warning)
src/components/ui/navigation-menu.tsx:111:react-refresh/only-export-components (warning)
src/components/ui/sidebar.tsx:636:react-refresh/only-export-components (warning)
src/components/ui/sonner.tsx:27:react-refresh/only-export-components (warning)
src/components/ui/textarea.tsx:5:@typescript-eslint/no-empty-object-type (error)
src/components/ui/toggle.tsx:37:react-refresh/only-export-components (warning)
src/integrations/supabase/previewAuthStorage.ts:38:prefer-const (error)
src/lib/auth-context.tsx:50:react-hooks/exhaustive-deps (warning)
src/lib/auth-context.tsx:89:react-hooks/exhaustive-deps (warning)
src/lib/auth-context.tsx:95:react-refresh/only-export-components (warning)
src/lib/rabbitqa/store.tsx:158:react-hooks/exhaustive-deps (warning)
src/lib/rabbitqa/store.tsx:169:react-hooks/exhaustive-deps (warning)
src/lib/rabbitqa/store.tsx:672:@typescript-eslint/no-explicit-any (error)
src/lib/rabbitqa/store.tsx:759:react-hooks/exhaustive-deps (warning)
src/lib/rabbitqa/store.tsx:764:react-refresh/only-export-components (warning)
src/lib/rabbitqa/store.tsx:771:react-refresh/only-export-components (warning)
src/lib/rabbitqa/store.tsx:775:react-refresh/only-export-components (warning)
src/lib/rabbitqa/store.tsx:780:react-refresh/only-export-components (warning)
src/lib/rabbitqa/store.tsx:786:react-refresh/only-export-components (warning)
src/lib/rabbitqa/store.tsx:793:react-refresh/only-export-components (warning)
src/lib/rabbitqa/store.tsx:797:react-refresh/only-export-components (warning)
src/pages/CustomerReport.tsx:76:@typescript-eslint/no-unused-expressions (error)
src/pages/CustomerReport.tsx:77:@typescript-eslint/no-unused-expressions (error)
src/pages/ProjectDetail.tsx:237:react-refresh/only-export-components (warning)
src/pages/project/DiscoveryContent.tsx:24:react-hooks/exhaustive-deps (warning)
src/pages/project/Phase3Tabs.tsx:545:@typescript-eslint/no-unused-expressions (error)
tailwind.config.ts:114:@typescript-eslint/no-require-imports (error)
```

## Kanıt — kullanılmayan paketler (A2–A4, kaldırmadan hemen önce)
### supabase — ölçüm @ 1da79f7 (kaldırma: a3e03bc)
```
$ grep -rn "@supabase/supabase-js" src index.html *.config.*
src/integrations/supabase/client.ts:2:import { createClient } from '@supabase/supabase-js';
$ grep -rn "integrations/supabase" src | grep -v "^src/integrations/supabase/"
(çıkış: 1)
$ grep -rn "VITE_SUPABASE" src | grep -v "^src/integrations/supabase/"
(çıkış: 1)
$ npm ls @supabase/supabase-js --depth=0
`-- @supabase/supabase-js@2.117.2
```
Tek eşleşme, aynı commit'te silinen ölü dosya ağacının içinde. Ağaç dışında 0 kullanım.

### lovable — ölçüm @ a3e03bc (kaldırma: d5abbb5)
```
$ grep -rnE "@lovable.dev|lovable-tagger|componentTagger|mcpPlugin" src index.html *.config.*
vite.config.ts:4:import { componentTagger } from "lovable-tagger";
vite.config.ts:5:import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";
vite.config.ts:16:  plugins: [react(), mcpPlugin(), mode === "development" && componentTagger()].filter(Boolean),
$ ls src/lib/mcp
ls: src/lib/mcp: No such file or directory
$ npm ls @lovable.dev/mcp-js lovable-tagger --depth=0
+-- @lovable.dev/mcp-js@0.20.1
`-- lovable-tagger@1.3.5
```
Yalnızca `vite.config.ts:4,5,16`; üçü de aynı commit'te silindi (AC3 istisnası).

### xlsx, confetti, typography — ölçüm @ d5abbb5 (kaldırma: 0fe9508)
```
$ grep -rnE "['\"]xlsx['\"]" src index.html *.config.* tsconfig*.json
(çıkış: 1)
$ npm ls xlsx
`-- xlsx@0.18.5
$ grep -rn "confetti" src index.html *.config.*
(çıkış: 1)
$ npm ls canvas-confetti @types/canvas-confetti
+-- @types/canvas-confetti@1.9.0
`-- canvas-confetti@1.9.4
$ grep -rnE "typography|\bprose\b" src index.html *.config.*
(çıkış: 1)
$ npm ls @tailwindcss/typography
`-- @tailwindcss/typography@0.5.20
```
Sonuç: üçü için de 0 kullanım.

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Test / doğrulama |
|---|---|---|---|
| AC1 | ✅ | Komut | `ls bun.lock bun.lockb` → ikisi de yok; `rm -rf node_modules && npm ci` → çıkış 0 ("added 453 packages"); `git check-ignore -v bun.lock bun.lockb yarn.lock pnpm-lock.yaml` → `.gitignore:11-14` |
| AC2 | ✅ (sapma 1) | Komut | `npm ls xlsx @supabase/supabase-js canvas-confetti @types/canvas-confetti @lovable.dev/mcp-js lovable-tagger @tailwindcss/typography` → `(empty)`; `package.json`'da adlar yok (grep 0). Lock: sürüm değişikliği yok (yol/sürüm karşılaştırması, "Açık sorular / sapmalar" 1) |
| AC3 | ✅ | Belge | "Kanıt" bölümü (ölçüm commit'i + kaldırma commit'i) |
| AC4 | ✅ | Grep | `src/integrations`, `supabase/`, `.lovable/` yok; `grep -rni lovable --exclude-dir={node_modules,.git,docs} .` → yalnızca `AGENTS.md:16`; build sonrası `grep -ril supabase dist/` → boş (çıkış 1) |
| AC5 | ✅ | Belge | `README.md`: Türkçe; başlıklar RabbitQA Onboarding Tracker / Gereksinimler / Çalıştırma / Kontroller / Belgeler; Lovable yok |
| AC6 | ✅ | Komut | `git ls-files .env .env.example` → yalnızca `.env.example`; yorum dışı satır yok (`grep -vE '^\s*#\|^\s*$'` çıkış 1) |
| AC7 | ✅ | Komut | `npm run lint` → 0 error, 28 warning; main'de olmayan uyarı yok (karşılaştırma aşağıda); `git diff main -- src tailwind.config.ts \| grep -c eslint-disable` → 0 |
| AC8 | ✅ | Komut | `npm run typecheck` → çıkış 0; `tsconfig.app.json` `"strict": true`, `noImplicitAny` yok; kök `tsconfig.json`'da `noImplicitAny`/`strictNullChecks` yok |
| AC9 | ✅ | Komut | `npm test` → 13 dosya, 213 test (210 + B5'ten 2 + B6'dan 1) |
| AC10 | ✅ | Komut | `npm run build` → `index-CjfMyXEl.css` (main ile aynı hash); JS 1,224.09 → 1,223.99 kB |
| AC11 | ✅ (sapma 2) | Komut | `npm audit` 19 → 14; `npm audit --omit=dev --audit-level=high` → çıkış 0. `npm audit fix` çalıştırılmadı |
| AC12 | ✅ | L3 | `src/lib/rabbitqa/store.test.tsx` › "approveInsight — step_update guard (AC17)" › "rejects applying a step_update insight targeting a pending data step — step, insight and audit stay unchanged" |
| AC13 | ✅ | L3 | `store.test.tsx` › "approveInsight — step_update goes through updateStep's lock rules (REV-13)" › "AC5 (regression): still rejects a step_update insight targeting an auto-completed (meeting) step" |
| AC14 | ✅ | Mutasyon (lokal) | Aşağıda "AC14 mutasyon kanıtı" |
| AC15 | ✅ | L3 | `store.test.tsx` › "not found (RUL-03)" › "updateStep with an unknown id returns 'Adım bulunamadı' — steps and audit stay unchanged" |
| AC16 | ✅ | L3 | `store.test.tsx` › "not found (RUL-03)" › "approving a step_update whose target step does not exist returns 'Adım bulunamadı' — insight stays pending, audit unchanged" |
| AC-NEG1 | ✅ | Grep | `grep -n "if (!insight) return" src/lib/rabbitqa/store.test.tsx` → boş |
| AC17 | ✅ | L3 | `store.test.tsx` › "addTicket — support_track no-op (REV-07)" › "opening a ticket leaves steps unchanged and writes no 'destek kaydı açıldı' rule audit". Satır silinmeden önce (840baa1) ve sonra (e13a4c7) yeşil; `grep -n support_track src/lib/rabbitqa/store.tsx` → boş |
| AC18 | ✅ | Diff | `git diff --stat mockup-freeze..HEAD -- src/` aşağıda; listede olmayan tek dosya `completion.test.ts`. Bu dosya B3 strict düzeltmesi, yalnızca tip |
| AC-NEG2 | ✅ | Diff | bcd2af9 ve 27c4704'te yeni `??`, `?.`, `if (`, `String(`, `@ts-*` yok (word-diff aşağıda). Kod tarafında yeni `!` yok |
| AC19 | — | L6 | qa-verifier `/gate` sırasında koşar |
| AC20 | ✅ | Belge | §1 ve #3 "önceki aşama yoksa" dalı ve K19 istisnasını içeriyor; #3 Doğrulama K19 "Takip" senaryosunu (03/`vpn_req`/02 K10/00) içeriyor; §4 "Kapsam dışı aşamanın geri alınması" satırında "ADR-0005 K19"; başlık v1.3, "K8–K20" |
| AC21 | ✅ | Belge | "Sözleşme takibi" tablosu; `grep -n "S26" docs/API_CONTRACT.md` → boş |
| AC-NEG3 | ✅ | Diff | C commit'leri yalnızca `docs/API_CONTRACT.md` (4eed9a8, 544daa4, d1e402e, a7d9111, da86015, d1caaee, 6f46c81, 0bd3261) ve `docs/changes/chore_f0-01-api-contract.md` (7155508) |

### AC14 mutasyon kanıtı (geçici değişiklik commit edilmedi)
`store.tsx:261-262` (`manualStatusError` kontrolü) yorum satırı yapıldı:
```
$ npx vitest run src/lib/rabbitqa/store.test.tsx -t "auto-completed \(meeting\)|pending data step"
   × approveInsight — step_update guard (AC17) > rejects applying a step_update insight targeting a pending data step — step, insight and audit stay unchanged
   × approveInsight — step_update goes through updateStep's lock rules (REV-13) > AC5 (regression): still rejects a step_update insight targeting an auto-completed (meeting) step
AssertionError: expected null to be 'Bu adım veriyle tamamlanır' // Object.is equality
      Tests  2 failed | 49 skipped (51)
```
Dosya geri alındı (`git diff --quiet src/lib/rabbitqa/store.tsx` temiz):
```
 ✓ src/lib/rabbitqa/store.test.tsx (51 tests | 49 skipped)
      Tests  2 passed | 49 skipped (51)
```

### AC17 koşuları
```
840baa1 (satır var):    Tests  1 passed | 53 skipped (54)
e13a4c7 (satır silindi): Tests  1 passed | 53 skipped (54)
```

### AC18 — `git diff --stat mockup-freeze..HEAD -- src/`
```
 src/components/rq/InsightCard.tsx               |  12 +-
 src/integrations/supabase/client.ts             |  46 -------
 src/integrations/supabase/previewAuthStorage.ts |  93 --------------
 src/integrations/supabase/types.ts              | 155 ------------------------
 src/lib/rabbitqa/completion.test.ts             |   2 +-
 src/lib/rabbitqa/store.test.tsx                 | 139 +++++++++++++++------
 src/lib/rabbitqa/store.tsx                      |   7 +-
 src/lib/rabbitqa/types.ts                       |   6 +
 src/pages/CustomerReport.tsx                    |   4 +-
 src/pages/project/Phase3Tabs.tsx                |   2 +-
 10 files changed, 119 insertions(+), 347 deletions(-)
```
B3 strict düzeltmesinin dokunduğu dosya: `src/lib/rabbitqa/completion.test.ts`, yalnızca tip (`const onpremKeys: (string | undefined)[]`).

### AC-NEG2 — `git show bcd2af9 --word-diff=plain -- src`
Diff'te `??` ve `if (` geçen satırlar, mevcut satırlardaki tip değişiklikleri. İfadeler main'de de vardı; değişen yalnızca `as` hedefi:
```
  const p = i.proposed as [-Record<string, any>;-]{+InsightProposedFields;+}
    (state.actions.find((a) => a.id === i.targetId) as [-any)-]{+unknown as Record<string, unknown> | undefined)+} ??
    (state.steps.find((s) => s.id === i.targetId) as [-any)-]{+unknown as Record<string, unknown> | undefined)+} ??
    (state.phases.find((p) => p.id === i.targetId) as [-any)-]{+unknown as Record<string, unknown> | undefined)+} ??
    (state.projects.find((p) => p.id === i.targetId) as [-any);-]{+unknown as Record<string, unknown> | undefined);+}
  const [v, setV] = [-useState<Record<string, any>>({-]{+useState<InsightProposedFields>({+} ...i.proposed });
      const v = { ...ins.proposed, ...(edited ?? {}) } as [-Record<string, any>;-]{+InsightProposedFields;+}
        case "action_update": if (ins.targetId) api.updateAction(ins.targetId, [-v,-]{+v as Partial<Action>,+} reason); break;
```
27c4704'te `src` değişikliği yalnızca `completion.test.ts` tip annotasyonudur; grep eşleşmesi yok.

### Lint uyarıları — branch (28; main'e göre yalnızca satır kayması)
Main'e göre fark yalnızca satır numarasında: `InsightCard.tsx` 235/237 → 237/239 (`targetChanged` 2 satır uzadı) ve `store.tsx` 759–797 → 758–796 (`support_track` satırı silindi). Dosya ve kural bazında yeni uyarı yok.
```
src/components/rq/Badges.tsx:47:react-refresh/only-export-components
src/components/rq/InsightCard.tsx:36:react-refresh/only-export-components
src/components/rq/InsightCard.tsx:41:react-refresh/only-export-components
src/components/rq/InsightCard.tsx:55:react-refresh/only-export-components
src/components/rq/InsightCard.tsx:237:react-refresh/only-export-components
src/components/rq/InsightCard.tsx:239:react-refresh/only-export-components
src/components/ui/badge.tsx:29:react-refresh/only-export-components
src/components/ui/button.tsx:47:react-refresh/only-export-components
src/components/ui/form.tsx:129:react-refresh/only-export-components
src/components/ui/navigation-menu.tsx:111:react-refresh/only-export-components
src/components/ui/sidebar.tsx:636:react-refresh/only-export-components
src/components/ui/sonner.tsx:27:react-refresh/only-export-components
src/components/ui/toggle.tsx:37:react-refresh/only-export-components
src/lib/auth-context.tsx:50:react-hooks/exhaustive-deps
src/lib/auth-context.tsx:89:react-hooks/exhaustive-deps
src/lib/auth-context.tsx:95:react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:158:react-hooks/exhaustive-deps
src/lib/rabbitqa/store.tsx:169:react-hooks/exhaustive-deps
src/lib/rabbitqa/store.tsx:758:react-hooks/exhaustive-deps
src/lib/rabbitqa/store.tsx:763:react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:770:react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:774:react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:779:react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:785:react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:792:react-refresh/only-export-components
src/lib/rabbitqa/store.tsx:796:react-refresh/only-export-components
src/pages/ProjectDetail.tsx:237:react-refresh/only-export-components
src/pages/project/DiscoveryContent.tsx:24:react-hooks/exhaustive-deps
```

## Sözleşme takibi
| ID | Durum | Commit |
|---|---|---|
| REV-F023 / RR-F027 / REV-F028b (K19) | Yazıldı: §1, #3 (kapsama dönüş + Doğrulama), §4 satırı; başlık v1.3, K8–K20; değişiklik geçmişine v1.3 satırı | 4eed9a8 |
| RR-F032 (D7 = (a), ADR-0005 K20) | Yazıldı: #3 hedef davranış + Doğrulama; §4 yeni satır "Kapsam dışı aşamada aşama onayı aksiyonu"; S26 açılmadı | 544daa4 |
| RR-F029 | Yazıldı: #5 `goLiveApproval` varken `customer_approval` `done`'dan çıkış `409` + Doğrulama | d1e402e |
| RR-F030 (D9 = (a)) | Yazıldı: §1 ve #5, adım açılırsa istenen durum uygulanır, açılmazsa `locked` kalır (`200`) | a7d9111 |
| RR-F028 (D8 = (a)) | Yazıldı: #14 07 `done` → `409`, 05'in durumundan bağımsız; Doğrulamaya "05 `out_of_scope` + 07 `done` → `409`" | da86015 |
| REV-F025 | Yazıldı: §1 `401 UNAUTHENTICATED`; §3 oturumsuz `GET /auth/me` → `401` | d1caaee |
| REV-F024 | Yazıldı: §1.1 `session:authenticated` → "Oturumlu, kaynağa bağlı olmayan uçlar" | 6f46c81 |
| REV-F028a | Yazıldı: §1 "(#3 `done → in_progress`, #16 K2, #14 K16), adım durumunu…" | 0bd3261 |
| QA3-F001 | Yazıldı: F0-01 notu REV-F019 (a) "Denetim oturumunda yapıldı (4563ca2)", AC5 satırına 4563ca2 | 7155508 |

## Mockup ↔ API (modül bağlama görevlerinde)
Uygulanmaz: bu görev modül bağlamıyor.

## Veritabanı
- [x] Migration yok

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-14 (`.env` repoda yok, build'de Supabase yok), INV-21/INV-23/INV-26 (AC12–AC16 testleri), INV-09 (no-op kural satırı kalktı), INV-25/INV-28/INV-08/INV-16/INV-17 (yalnızca sözleşme metni), INV-19 (`InsightProposedFields` geçici mockup tipi, aşağıda Öneriler)
- [x] Trigger / PL/pgSQL / RLS / motor kontrolü yok
- Endpoint, audit yazıcısı ve zod şeması değişikliği yok (kod yok, mockup)

## Kontroller (çıktı özeti)
Temiz kurulumdan sonra (`rm -rf node_modules && npm ci` → çıkış 0):
```
npm run lint       → ✖ 28 problems (0 errors, 28 warnings)
npm run typecheck  → çıkış 0 (tsconfig.app.json strict + tsconfig.node.json)
npm test           → Test Files 13 passed (13) · Tests 213 passed (213)
npm run build      → çıkış 0
npm run e2e        → script yok (UI/akış değişmedi; AC19 qa-verifier L6)
```

| Ölçüm | main @ 7ac811c | branch |
|---|---|---|
| Lint | 42 (14 error, 28 warning) | 28 (0 error, 28 warning) |
| tsc app (mevcut ayar / strict) | 0 / 1 | strict açık: 0 |
| Test | 13 dosya / 210 | 13 dosya / 213 |
| CSS asset | `index-CjfMyXEl.css` 68.25 kB (gzip 11.83) | `index-CjfMyXEl.css` 68.25 kB (gzip 11.83) |
| JS asset | `index-l0omCwOO.js` 1,224.09 kB (gzip 344.62) | `index-Dcv2guIw.js` 1,223.99 kB (gzip 344.57) |
| `npm audit` | 19: critical 2, high 9, moderate 8 | 14: critical 2, high 6, moderate 6 |
| `npm audit --omit=dev` | 14: high 9, moderate 5 | 2: moderate 2 (`react-router`, `react-router-dom`) |
| `npm audit --omit=dev --audit-level=high` | çıkış 1 | çıkış 0 |

Branch'te kalan 14 açık: `@vitest/mocker`, `braces`, `chokidar`, `esbuild`, `fast-glob`, `micromatch`, `postcss-nested`, `postcss-selector-parser`, `react-router`, `react-router-dom`, `tailwindcss`, `tinypool`, `vite`, `vitest`. Plan §2.4 b ile aynı liste; hepsi F0-03 hedef sürümleriyle kapanır.

## Ekran görüntüleri
AC19, qa-verifier L6, `docs/reviews/chore_f0-02-cleanup/screens/`.

## Eşleme (plandaki ad → koddaki ad)
- Plan §8 `describe("… (AC5)")` → AC5 testi mevcut `describe("approveInsight — step_update goes through updateStep's lock rules (REV-13)")` içinde kaldı, test adı "AC5 (regression): … (meeting) step".
- `seedStepUpdateInsight({ completion, status, proposed, targetId? })`: `targetId` verilirse seed'deki adımlara dokunulmaz (AC16 için).
- Planın "store.tsx:672" ve "InsightCard.tsx:42, 58-59, 152" satırları koddaki `approveInsight` `v`, `insightSummary`, `targetChanged` ve `ApproveDialog` `useState` satırlarıdır.
- `vite.config.ts`: `defineConfig(({ mode }) => …)` → `defineConfig(() => …)`; `mode` yalnızca `componentTagger` için kullanılıyordu.

## Açık sorular / sapmalar
1. **AC2 lock kanıtı, diff algoritması.** Lovable kaldırması (d5abbb5) sonrasında `git diff main -- package-lock.json` varsayılan (Myers) algoritmayla 325 eklenen `"version"` satırı gösterdi. Plan bu durumda "dur ve notla" diyor. Durdum ve inceledim; gerçek bir sürüm değişikliği yok:
   - `--diff-algorithm=histogram|patience|minimal` ile eklenen `"version"` satırı 0. Eklenen satırların hepsi `"dev": true` (74 satır: vite, esbuild vb. artık yalnızca dev zincirinde).
   - Yol bazında karşılaştırma (main ↔ branch, `packages`): yeni yol 0, aynı yolda farklı sürüm 0, main'de olmayan `name@version` 0; 147 yol silindi.
   - Gate için öneri: AC2 kontrolü `git diff --diff-algorithm=histogram main -- package-lock.json | grep -cE '^\+\s*"version"'` ile yapılsın (→ 0).
2. **AC11, plan dışı paket sınıflandırması (Murat, 2026-10-07).** Planın beklentisinin aksine `npm audit --omit=dev --audit-level=high` kaldırmalardan sonra da 1 ile çıktı. Neden: `tailwindcss-animate` `dependencies`'teydi ve `tailwindcss`'e peer bağımlılığı var. npm bu yüzden tailwindcss'i ve zincirini (chokidar, micromatch, braces, fast-glob, postcss-*) prod sayıyordu (`npm explain tailwindcss`). Murat'a soruldu, karar: `tailwindcss-animate` → `devDependencies` (84eeac9). Sürüm aralığı aynı (`^1.0.7`). Lock'ta yalnızca 74 `"dev": true` satırı eklendi, yeni yol ya da sürüm yok. Eklenti yalnızca `tailwind.config.ts`'te build sırasında kullanılıyor; CSS hash'i aynı kaldı.
3. **API_CONTRACT değişiklik geçmişi.** Planda açıkça yoktu; başlık v1.3 olduğu için "Değişiklik geçmişi" tablosuna v1.3 satırı eklendi (4eed9a8). v1.3 geçmiş satırı C2 maddelerini önceden listeler; bir C2 commit'i geri alınırsa satır da düzeltilir.
4. **RR-F029 hata metni.** Plan `409` diyor, mesaj vermiyor. Sözleşmeye mesajsız `409` yazıldı. Mesaj F4-01/F5-05 planında belirlenebilir.
5. **RR-F028, #14 metni.** "05 `out_of_scope` ise mockup gibi `out_of_scope`" cümlesine "(07 `done` değilken)" eklendi, böylece yeni `409` cümlesiyle çelişmiyor. INV-28 (c) cümlesinin netleştirmesi M8'dir (denetim).
6. **B3 strict, eşik altında.** Strict hatası 1 (eşik 30), düzeltme diff'i 1 satır. Non-null `!` kullanılmadı, tip annotasyonu yeterli oldu.

## Öneriler (kapsam dışı)
- **`!` kullanımı:** Bu branch'te kod tarafına (`src/**` test dışı) yeni `!` eklenmedi. Testlerde mevcut desenle `step!`, `find(...)!` kullanıldı.
- **INV-19:** `InsightProposedFields` (`types.ts`) geçici mockup tipidir. F0-04'te `packages/shared` `InsightProposal` şemasıyla değiştirilmeli; ikinci tip kaynağı olarak kalmamalı.
- **Lint uyarıları (28):** plan §14. `react-refresh/only-export-components` (22) için `src/components/ui/**` override'ı F0-03'te; yardımcıları ayrı modüle taşımak F0-04'te. `react-hooks/exhaustive-deps` (6) F0-04'te, hook geçişinde gerekçeli.
- **Code-split:** JS bundle 1,22 MB (>500 kB uyarısı). D1'e göre F9-03.
- **package.json:** `name: vite_react_shadcn_ts` ve `engines` F0-03'te (workspace kökü).
- **CI:** `npm audit --omit=dev --audit-level=high` artık 0 ile çıkıyor; CI "Dependency audit" adımının yeşile döndüğü gate'te teyit edilmeli.

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
| RUL-01 | Düzeltildi: #29 cümlesi "kaldırıldı (F0-02, REV-07); API'de karşılığı yok", §2.2 satırı "Kaldırıldı" olarak işaretlendi. `grep -n support_track docs/API_CONTRACT.md` → 2 satır, ikisi de kaldırıldı notu | d419000 |
| REV-02 | Düzeltildi: "Mockup ↔ API" (uygulanmaz) ve "Ekran görüntüleri" (AC19, `screens/`) başlıkları eklendi | 5b85e7a |
| REV-03 | Düzeltildi (ikinci seçenek): "Açık sorular 3" maddesine v1.3 geçmiş satırı notu eklendi | aee62be |
| REV-01, RUL-02 | Builder işi değil (gate: Murat kayda alır — M7 / M8) | — |
| QA-01 | Builder işi değil (auditor rolündeki doğrulama kısıtı; plan isteğe bağlı sayıyor) | — |

## CI düzeltmeleri
Gate direktifi dışı; Murat'ın ek talimatı (2026-10-09). Uygulama koduna dokunulmadı.

| # | Konu | Ne yapıldı | Commit |
|---|---|---|---|
| 1 | `ci.yml` main'de düzeltildi (5c41bd2) | `git merge origin/main` (rebase/force yok) | 7702f01 |
| 2 | Tarihe bağlı testler | Date `2026-10-05T09:00:00`'a sabitlendi: `vi.useFakeTimers({ toFake: ["Date"] })` + `vi.setSystemTime`, `afterEach`'te `vi.useRealTimers()` | fb253e1 |
| 3 | gitleaks (`secrets` job) | Repo köküne `.gitleaksignore`: yalnızca `3f28ad4…:.env:generic-api-key:2` parmak izi, yorumlu. Yeni bulgular engellenmeye devam eder | 10b0aa5 |

**Sabitlenen testler** (hepsi tarih taramasıyla doğrulandı, aşağıda):
- `src/pages/ProjectDetail.tabs.test.tsx` — dosya geneli `beforeEach`. Kırmızı olan: AC13 "açık uyarısı olmayan bir projede rozet yoktur". Neden: `report_not_sent` cuma günleri `p_perakende` için açılıyor (2026-10-02, 10-09, 10-16 kırmızı). Aynı dosyadaki AC13/AC-NEG4/AC14 testleri de uyarı ve termine bağlı olduğu için dosya geneli sabitlendi.
- `src/lib/rabbitqa/completion.test.ts` — iki `describe`'a `beforeEach`/`afterEach` (component testi değil ama aynı sınıf hata):
  - "buildReportSnapshot — p_perakende Uyarlama: Mobil (AC18)": `todayISO()` kullanıyor; cumartesi (2026-10-03) kırmızı.
  - "reqdoc_not_shared … (AC7, M-09b)" → "seed produces reqdoc_not_shared only for p_lojistik": `createSeed()` gerçek tarihe göre, `computeAlerts` sabit `2026-10-20` ile; ileri tarihlerde (2026-11-16, 2027-01-15) kırmızı.

**Referans tarih.** `2026-10-05T09:00:00` (pazartesi, yerel saat): M-09a planındaki seed fixture notu ve `completion.test.ts` `NOW` ile aynı. `docs/TEST_STRATEGY.md` §3'teki `2026-09-01T09:00:00+03:00` API seed'i (Faz 1+) için yazılmış; mockup seed'inin mutlak tarihleri ekim başına göre kurulu olduğu için kullanılmadı. Strateji metninin hizalanması denetim kararıdır.

**Nasıl bulundu.** Geçici bir vitest config'i (scratchpad, repoya girmedi) bir setup dosyasıyla Date'i verilen güne sabitleyip tüm suite'i koşturdu: 2026-09-15, 09-28, 10-02, 10-03, 10-05, 10-06, 10-07, 10-08, 10-09, 10-12, 10-16, 11-16, 2027-01-15. Sabitlemeden önce kırmızı olanlar yukarıdaki 3 test. Sabitlemeden sonra (10-02, 10-09, 11-16, 2027-01-15, sıralı koşu) tarih kaynaklı kırmızı yok.
- Elenenler (tarihe bağlı değil): `HandoverWorkspace.test.tsx` AC1 ve `HandoverWorkspace.toast-router.test.tsx` QA-02 yalnızca 3 suite paralel koşarken kırmızıydı (yük/zaman aşımı); sabitlemesiz, tek başına 2026-10-09 ve 2027-01-15'te yeşil. `workspaces.test.ts` highlightField probe'un kendi sahte saatiyle çakışıyor (dosya zaten `vi.useFakeTimers()` kullanıyor). Bunlara dokunulmadı.
- MyWork, Projects, PhaseWorkspaces, RiskDialog, InsightCard, store testleri taranan tarihlerin hiçbirinde kırmızı olmadı.

**Kontroller** (merge + düzeltmelerden sonra):
```
npm run lint       → ✖ 28 problems (0 errors, 28 warnings)
npm run typecheck  → çıkış 0
npm test           → Test Files 13 passed (13) · Tests 213 passed (213)
TZ=UTC npm test    → Test Files 13 passed (13) · Tests 213 passed (213)
npm run build      → çıkış 0 (index-CjfMyXEl.css 68.25 kB, index-Dcv2guIw.js 1,223.99 kB)
```
`gitleaks` yerelde kurulu değil; `.gitleaksignore` CI'daki `secrets` job'ında doğrulanacak. CI sonucu okunamadı (`gh` yok).
