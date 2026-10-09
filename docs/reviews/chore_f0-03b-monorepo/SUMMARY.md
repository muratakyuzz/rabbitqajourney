# Gate Özeti — chore/f0-03b-monorepo @ 590529b
Plan: `docs/plans/F0-03b-monorepo.md` · Değişiklik notu: `docs/changes/chore_f0-03b-monorepo.md` · 2026-10-09

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| CI (app / parity / secrets) | Yeşil: CI #70 @ 590529b, **Murat bildirimi** (Actions sayfası). `gh` yok, gate doğrulayamadı. Parity F0'da zorunlu değil. `ci.yml` diff'i boş | 0 | 0 | 0 | 0 |
| reviewer | APPROVE | 0 | 0 | 0 | 6 |
| qa-verifier | APPROVE (komut kanıtları tablosu ve alıntılar var) | 0 | 0 | 0 | 2 (bilgi/süreç) |
| rules-reviewer | Çalıştırılmadı | — | — | — | — |

**rules-reviewer gerekçesi:** Tetik anahtar kelimeleri (`reports.ts`, `business-days`, `alerts`, `flow`) yalnızca yeniden adlandırmalarda geçiyor. Plan §165'in tek kontrolü sağlandı: `git diff -M100% --name-status origin/main...origin/chore/f0-03b-monorepo -- '*rabbitqa*'` → 16/16 `R100`.

**Bağımsız doğrulananlar:**
- **qa-verifier:**
  - Temiz `npm ci`; lint 0 hata / 21 uyarı; typecheck 0; test 13 dosya / 213 test; build 0.
  - CSS ve JS bundle'larının adı ve sha256'sı main ile aynı. REV2-02 yorumu build CSS'ine girmiyor.
  - 3 workspace bağlı. `xlsx` yok, audit high 0.
  - Kökten `npm run preview -- …` çalışıyor.
  - Login ve QA-03 akışı geçti, konsol 0. L5b-B `csm-overview` baseline ile uyumlu.
- **reviewer:**
  - Taşıma commit'indeki 142 dosyanın hepsi R100.
  - Bağımlılık aralıkları main ile aynı; farklar yalnızca `@types/node` ve `@rabbitqa/shared`.
  - Lock farkı yalnızca beyan edilenler.
  - Korunan yollara ve CI'a dokunulmamış. INV-13/14/19 korunuyor.

**Bilinen sapmalar:** Murat kabul etti; beyan edildiği gibi oldukları doğrulandı.
- `undici-types` 7 (D4)
- `lib` ES2022 (`d95469e`)
- Kök script'lerde `--` (`d5fad3c`)

**Yeniden üretilmeyen builder ölçümleri:** AC4 (`npm ls` set farkı) ve AC9 (L5b-A, 39 çift). Bundle hash eşitliği bu ölçümleri dolaylı olarak destekliyor.

**Genel karar:** MERGE'E HAZIR (CI yeşili Murat bildirimine dayanıyor)

## Düzeltme direktifi
Merge için zorunlu madde yok. Hepsi Low ve `docs/reviews/BACKLOG.md`'ye işlendi.

İsteğe bağlı: merge'den önce aynı branch'te `/fix` ile yapılabilecek, yalnızca belge değişiklikleri.
1. **REV-01** — `docs/changes/chore_f0-03b-monorepo.md:28`: "52 çalışma zamanı bağımlılığı" yerine "50 çalışma zamanı bağımlılığı (+ `@rabbitqa/shared` = 51)". Test gerekmez.
2. **REV-02** — `docs/changes/chore_f0-03a-upgrades.md:465`, iki değişiklik:
   - Tekrarlanan `@layer` derinliği cümlesini tek cümleye indir.
   - "Sonner `<style>`'ını `head` sonuna eklediği için" ifadesini `apps/web/src/index.css:288-290` yorumuyla aynı anlama getir: production'da sonra, dev'de önce, sıra v3 ile aynı.
3. **REV-03** — `README.md:13`: "`packages/shared`: ortak şemalar ve enum'lar (F0-04), iş günü hesabı (F6-01) (`@rabbitqa/shared`); şimdilik boş."

Sonraki planlara taşınanlar:
- REV-04 → F0-04: shared `tsconfig`'e `lib: ["ES2022"]` ve `types: []`, ayrıca `window` negatif kontrolü.
- REV-05 → F0-05: ESLint workspace bazında.
- REV-06 → kit §13 (denetim, Murat onayıyla): `build.md:30` ve `qa-verifier.md:63` komutları.
- Gözlem → F0-04: `envDir`.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki 'Review düzeltmeleri' tablosunu güncelle ve push et.
