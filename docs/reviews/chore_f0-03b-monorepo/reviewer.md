## reviewer — chore/f0-03b-monorepo @ 590529b
**Karar:** APPROVE

Engelleyici bulgu yok. Yalnızca Low bulgular var (6 adet). AC1, AC2, AC12, AC-NEG1, AC-NEG2 ve AC-NEG3'ün dosya tarafı diff üzerinden doğrulandı. Bilinen üç sapma (undici-types 6→7, `lib` ES2022, kök script'lerdeki `--`) beyan edildiği gibi.

**CI:** Bu makinede `gh` olmadığı için okuyamadım. Murat'ın beyanına göre CI #70 (590529b) yeşil. Faz F0 olduğu için parity zorunlu değil.

### Doğrulama özeti (kanıtlar)
| Kontrol | Sonuç | Kanıt |
|---|---|---|
| Taşıma commit'i `8692ac6` | Uygun | `git show -M --name-status 8692ac6`: 142 satırın hepsi `R100` |
| Branch düzeyi R100 dışı dosyalar | Uygun | 139 R100. R100 olmayanlar şunlar: `src/index.css` → R097 (REV2-02 yorumu), `tsconfig.app.json` → R097 (`lib`), `apps/web/tsconfig.json` → A (içeriği main'deki kök `tsconfig.json` ile birebir; `git diff origin/main:tsconfig.json origin/<br>:apps/web/tsconfig.json` boş). Kalanlar yeni dosyalar ve plandaki kök dosyalar |
| `'*rabbitqa*'` (rules-reviewer tetik kontrolü) | Uygun | 16/16 `R100` |
| AC-NEG1 / `index.css` | Uygun (BACKLOG direktifiyle) | `apps/web/src/index.css:285-291` içinde yalnızca `/* */` yorum bloğu değişti. Bunu main'deki BACKLOG `docs/reviews/BACKLOG.md:398` istiyor ("F0-03b, taşıma commit'inden ayrı commit"). `42696b9` ayrı commit ve mesajında üç ID var. CSS hash'inin aynı kaldığını qa-verifier doğrulayacak |
| `lib` ES2022 (`d95469e`) | Uygun | `apps/web/tsconfig.app.json:7`'de tek satır değişti, `target` ES2020'de kaldı. `@types/node` 24.19.2'de `RelativeIndexable` yok (grep boş). `.at(-1)` kullanılan yerler: `reports.ts:55`, `ContinuityTab.tsx:70`, `Phase2Tabs.tsx:42` |
| Bağımlılık aralıkları (AC4'ün dosya tarafı) | Uygun | main'deki 50 dep ve 19 devDep ile branch'teki kök ve `apps/web` birleşimi karşılaştırıldı. Farklar yalnızca `@types/node ^22.16.5→^24.19.2` ve eklenen `@rabbitqa/shared: *`. Dep ile devDep sınıfları korunmuş, aynı paket iki yerde tanımlı değil |
| `package-lock.json` | Uygun | Fark yalnızca kök adı, workspace girdileri, 3 `link: true`, `@types/node` 24.19.2 ve `undici-types` 7.24.6 (`>=7.24.0 <7.24.7`). Başka sürüm farkı yok |
| Script devri | Uygun | `apps/web/package.json:6-14`: main'deki 7 script aynen var. Kökteki `package.json` script'leri plan §2'deki gibi; `dev`, `preview` ve `test:watch` sonundaki `--` (`d5fad3c`) dışında fark yok |
| tsconfig references | Uygun | Kök `tsconfig.json`'da `files: []` ve `./apps/web` ile `./packages/shared` referansları var (D5) |
| ESLint yolları | Uygun | `eslint.config.js:8`'de `**/dist` var, `eslint.config.js:28`'deki yol `apps/web/src/components/ui/**` |
| AC1 / AC-NEG2 | Uygun | `git ls-tree`: `apps/api` altında yalnızca `README.md` ve `package.json` var, `dependencies` ya da `scripts` yok. `packages/shared` altında yalnızca 3 dosya var, `src/index.ts` yalnızca `export {};` ve yorum içeriyor. Kökte taşınan dosyalardan hiçbiri kalmamış. `@rabbitqa/` web'de import edilmiyor (grep boş) |
| AC-NEG3 | Uygun | Dört `package.json`'da da `overrides` yok (grep boş) |
| AC12 | Uygun | README'ye +6 satırlık "Yapı" bölümü ve demo giriş yolu eklendi. `docs/API_CONTRACT.md:7`'de tek satır not var |
| Korunan yollar | Uygun | `.github`, `.claude`, `AGENTS.md`, `CLAUDE.md`, `docs/agents`, `docs/INVARIANTS.md`, `docs/RBAC.md`, `docs/plans`, `docs/reviews`, `docs/adr`, `.mcp.json`, `.gitignore`, `.gitleaksignore` ve `.env.example` için diff boş. `ci.yml` değişmemiş |
| guard.mjs | Etki yok | `.claude/hooks/guard.mjs:31` `^apps\//` ve `^packages\//` yeni yerleri koruyor. `:37-38` kök `package*.json`, `tsconfig*.json` ve `eslint.config.js`'i hâlâ koruyor. `:33` `^src/`, `^public/` ve `^index\.html$` artık boşta, zararsız (plan §13) |
| CI etkisi | Etki yok | `ci.yml:22-31` komutlarının hepsi kökte çalışıp workspace'lere devrediliyor. `.gitignore`'daki `dist/` deseni her derinlikte eşleşiyor |
| INV-19 / INV-13 / INV-14 | Korunuyor | `shared` boş, tip ya da şema kopyası yok. `business-days` web'de, değişmedi. `.env*` kökte ve kodda `import.meta.env` ya da `process.env` kullanımı yok (grep boş). Vite `envDir` web'e kaydığı için gizli bilgi açığa çıkma riski azaldı |

Kontrol listesi uygulanabilirliği: A'dan yalnızca INV-13, INV-14, INV-19 ve INV-20 bu görevi ilgilendiriyor, diğer maddeler kodun içeriği değişmediği için uygulanmaz. B, C, D ve G uygulanmaz çünkü endpoint, migration ve modül bağlama yok. E uygulanmaz çünkü UI kodu yalnızca taşındı. F: `xlsx` yok, `npm audit` sonucu qa-verifier'da. H: kapsamın dışına çıkılmadı. Plan dışı değişiklikler BACKLOG ya da Murat kararlarıyla belgelenmiş.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-01 | Low | Plan AC4, değişiklik notunun doğruluğu | docs/changes/chore_f0-03b-monorepo.md:28 | Notta "52 çalışma zamanı bağımlılığı" yazıyor. Gerçekte main'de 50 runtime dep var, `apps/web/package.json:15-67`'de `@rabbitqa/shared` ile birlikte 51. AC4 kanıtını okuyan biri sayıları tutturamaz | "50 çalışma zamanı bağımlılığı (+ `@rabbitqa/shared` = 51)" olarak düzelt |
| REV-02 | Low | BACKLOG:398 (REV2-01, REV2-02) | docs/changes/chore_f0-03a-upgrades.md:465 | REV2-01 düzeltmesinden sonra katman kontrolü cümlesi aynı paragrafta iki kez geçiyor ("…`@layer` blok derinliği 0 (… kontrol: build CSS'inde … `@layer` blok derinliği 0 …)"). Aynı satırda "Sonner `<style>`'ını `head` sonuna eklediği için" ifadesi de duruyor. Bu, REV2-02'nin `index.css`'te yalnızca production için doğru diye düzelttiği iddianın aynısı; not ile kod yorumu birbirini tutmuyor | Parantezdeki tekrarı tek cümleye indir. "head sonuna eklediği için" ifadesini "production'da bu dosyadan sonra, dev'de önce eklenir; sıra v3 ile aynı" diye düzelt |
| REV-03 | Low | Plan §9 (INV-13), AC12 | README.md:13 | README'de "ortak şemalar, enum'lar ve iş günü hesabı … şimdilik boş, F0-04'te dolar" yazıyor. Plan §9 ve `packages/shared/src/index.ts:2`'ye göre business-days F6-01'de geliyor. README, iş günü hesabının F0-04'te shared'a taşınacağını ima ediyor | "Şemalar ve enum'lar F0-04'te, iş günü hesabı F6-01'de" yaz |
| REV-04 | Low | INV-19 (sertleştirme), değişiklik notu Açık sorular 5 | packages/shared/tsconfig.json:2-10 | `lib` ve `types` tanımlı değil. Bu yüzden `tsc -p packages/shared --listFilesOnly` 195 dosya yüklüyor: `lib.dom.d.ts` ile kökte hoist edilen bütün `@types` paketleri (66 `@types/node`, react, react-dom, chai, d3 vb.). F0-04'te shared'a `window`, `document` ya da `process` kullanan bir şema yazılırsa typecheck geçer, ama kod API'de ya da web'de çalışma anında kırılır. Notun "skipLibCheck ile @types/node gereksiz koşmasın" gerekçesi yalnızca kontrolü kapatıyor, global tipler yine görünür | F0-04 planına ekle: `"lib": ["ES2022"]`, `"types": []`. Bu dalda düzeltme gerekmez |
| REV-05 | Low | ADR-0001 (API Node), F0-05 hazırlığı | eslint.config.js:11-22 | `files: ["**/*.{ts,tsx}"]` ile `globals.browser` ve react-hooks/react-refresh kuralları artık `packages/shared/**` ile ileride gelecek `apps/api/**` ve `apps/worker/**` dosyalarına da uygulanıyor. Node kodunda `process` gibi globaller lint'te tanımsız sayılır, tarayıcı globalleri ise sessizce geçer | F0-05 planında ESLint'i workspace bazında ayır: web için browser ve react, api/worker için `globals.node`, shared için yalnızca ES |
| REV-06 | Low | Kit etkisi (plan §13), branch dışı | .claude/commands/build.md:30; docs/agents/qa-verifier.md:63 | Yedek komut olarak geçen `npx tsc --noEmit` kökte hiçbir dosyayı kontrol etmiyor (`tsc --noEmit --listFilesOnly` → 0 dosya, exit 0); sonuç yanlış yeşil. Bu main'de de böyleydi, ama kök artık tamamen bir solution dosyası. `qa-verifier.md:63`'teki `npx vite --host … --port 8090` kökte artık `index.html` bulamıyor. Plan §13 yalnızca preview kısmını düzeltiyor | §13 kit güncellemesine ekle: iki dosyada da `npx tsc --noEmit` yerine `npm run typecheck`, `npm install` yerine `npm ci` kullanılsın. Bunu denetim tarafı Murat onayıyla yapar; builder bu dosyalara yazamaz (guard) |

### Düzeltme direktifi
Merge için zorunlu bir madde yok. Builder isterse aynı branch'te düzeltebileceği maddeler:
1. **REV-01**: `docs/changes/chore_f0-03b-monorepo.md:28`'de "52 çalışma zamanı bağımlılığı" yerine "50 çalışma zamanı bağımlılığı (+ `@rabbitqa/shared`)" yaz. Test gerekmez.
2. **REV-02**: `docs/changes/chore_f0-03a-upgrades.md:465`'te iki şey değişecek:
   - Katman kontrolü cümlesini tek kez geçecek şekilde sadeleştir.
   - "Sonner `<style>`'ını `head` sonuna eklediği için" ifadesini `apps/web/src/index.css:288-290` yorumuyla aynı anlama getir: production'da sonra, dev'de önce, sıra v3 ile aynı.
3. **REV-03**: `README.md:13`'ü şöyle yaz: "`packages/shared`: ortak şemalar ve enum'lar (F0-04), iş günü hesabı (F6-01) (`@rabbitqa/shared`); şimdilik boş."

Sonraki planlara taşınacak maddeler (BACKLOG):
4. **REV-04** → F0-04 planı: `packages/shared/tsconfig.json`'a `"lib": ["ES2022"]` ve `"types": []` eklenmesi. Bunu doğrulamak için shared'da `window` kullanımının typecheck'te hata verdiğini gösteren negatif kontrol eklenmeli.
5. **REV-05** → F0-05 planı: ESLint'in workspace bazında ayrılması (web: browser ve react, api/worker: node).
6. **REV-06** → plan §13 kit güncellemesi (denetim, Murat onayıyla): `.claude/commands/build.md:30` ve `docs/agents/qa-verifier.md:63`'teki `npx tsc --noEmit`, `npx vite`, `npm install` kullanımları kök workspace komutlarına çevrilmeli.

### Açık sorular / öneriler (engelleyici değil)
- **Murat'ın kabul ettiği sapmalar beyan edildiği gibi:**
  - `undici-types` 7.24.6'yı yalnızca `@types/node` 24.19.2 çekiyor (lock diff).
  - `lib` değişikliği ayrı bir commit (`d95469e`), `target` değişmedi.
  - `--` yalnızca `dev`, `preview` ve `test:watch`'ta (`d5fad3c`), plan §13'teki qa-verifier komutuyla tutarlı.
- **Commit sırası:** `d95469e` (lib ES2022), `@types/node`'u 24'e çeken `65a140a`'dan önce gelmiş. Mesajdaki gerekçe o commit anında henüz geçerli değil. Squash merge yapılacağı için etkisi yok.
- **Yalnızca INV-14 gözlemi (bulgu değil):** Vite `envDir` artık `apps/web`. F0-04'te `VITE_DATA_<MODÜL>` kök `.env`'e yazılırsa web onu göremez. Notun "Öneriler" bölümündeki `envDir` → F0-08 maddesi F0-04'e çekilmeli.
- **Kökten argüman geçişi:** `npm test` workspace'lere devrettiği için `--` almıyor. Kökten `npm test -- --reporter=…` gibi bayraklar vitest'e ulaşmaz. Plan bunu istemiyordu; F0-06 Vitest `projects` kurulurken bakılabilir.
- **qa-verifier'a kalanlar:** AC3–AC11, CSS hash eşitliği (BACKLOG:398, "gate doğrular") ve CI #70'in `app` ile `secrets` job'larının yeşil olduğunun teyidi.
