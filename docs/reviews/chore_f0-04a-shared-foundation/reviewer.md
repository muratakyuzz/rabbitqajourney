## reviewer tur 2 (kısa tur): chore/f0-04a-shared-foundation @ 5d7e656
**Karar:** APPROVE

Tur 1 raporu (@ 007f47d, APPROVE, REV-01..03): `git show 9045c0f:docs/reviews/chore_f0-04a-shared-foundation/reviewer.md`.
Kapsam: yalnızca 007f47d sonrası commit'ler, yani 9045c0f ve 5d7e656. Worktree: `.verify/chore_f0-04a-shared-foundation`. Bu turda High ya da Critical bulgu yok.

### 1. Kapsam kontrolü
- `git diff 9045c0f..5d7e656 --stat`:
  ```
  docs/changes/chore_f0-04a-shared-foundation.md |  4 ++
  docs/reviews/BACKLOG.md                        |  4 +-
  packages/shared/src/schemas/insight.test.ts    | 59 ++++++++++++++++++++++++++
  3 files changed, 65 insertions(+), 2 deletions(-)
  ```
- `git diff 007f47d..5d7e656 --stat`: 8 dosya, +370. Bunların 6'sı 9045c0f'den geliyor ve hepsi `docs/reviews/` altında: `BACKLOG.md`, `chore_f0-04a-shared-foundation/{SUMMARY,qa-verifier,reviewer,rules-reviewer}.md`, `screens/f0-04a-insight-edit.png`.
- `git diff 007f47d..5d7e656 --stat -- packages/shared apps package.json package-lock.json .github` yalnızca `packages/shared/src/schemas/insight.test.ts | 59 +++` gösteriyor. Şema ve kod, `apps/web`, package/lock ve `.github` değişmemiş.

### 2. insight.test.ts kalitesi
- `npx eslint packages/shared/src/schemas/insight.test.ts` exit 0 verdi, hata ve uyarı yok.
- `npx vitest run src/schemas/insight.test.ts` sonucu `Tests 240 passed (240)`.
- `ALLOWED` (:28-36) elle yazılmış, şemadan türetilmemiş. Şema genişletilirse bir test kırılır.
- `SAMPLES` ile `ALLOWED` arasındaki eşleşme ayrı testle sabitlenmiş (:99-101).
- `FOREIGN_FIELDS` (:44-48) her türe, başka bir türe ait alanları o türün geçerli değeriyle deniyor; tekrarlar ayıklanıyor. Test adı (:103 `"%s rejects %s = %j (allowed in %s)"`) hatanın yerini gösteriyor.
- `STATUS_CASES` (:62-64) 5 tür × 10 durum = 50 vaka.
- `date_change` için `{phaseId, goLiveDate}` (:119) ve `{phaseId}` (:120) eklenmiş.
- `any` yok. İki cast var: :22 tur 1'den kalma. :63'teki `kind as InsightKind` yeni ama güvenli (REV-08).
- Mutasyon beyanları tabloyla tutarlı:
  - `action_update` + `ball`: iki kaynakta da değer "customer", tekrar ayıklanınca 1 vaka kalıyor.
  - `step_update` + `title`: 3 farklı başlık, 3 vaka.
  - `health_change` + `status`: 4 vaka.
  - `step_update` + `mitigated`: 1 vaka.

### 3. Değişiklik notu ve doğrulama beyanları
- Değişiklik notu :166-167 commit içeriğiyle birebir uyuşuyor.
- "web 216/216, shared 274/274" makul. Web'e dokunulmadı. Shared tarafında enums 34 + insight 240 = 274.
- "Şema/kod dosyalarına dokunulmadı" beyanı 1. maddedeki stat ile doğrulanıyor.

### 4. Commit mesajı
`fix(shared): pin #44 cross-kind field and status rejection in tests [RUL-01][RUL-02]` conventional formatta. Bulgu ID'leri başlıkta ve gövdede var, attribution satırı mevcut.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-04 | Low (süreç) | CLAUDE.md yazma tablosu (`docs/reviews/` → uygulama "—", guard) | docs/reviews/BACKLOG.md:434-435 (5d7e656) | `/fix` commit'i, uygulama rolüne salt okunur olan `docs/reviews/BACKLOG.md`'yi değiştirdi. Murat'ın talimatıyla yapıldı, ama kapanışı gate doğrulamadan önce düzelten tarafın kendisi kaydetmiş oldu ("yazan ≠ denetleyen"). | Gate BACKLOG satırlarını kendi doğrulamasıyla yeniden yazsın. İleride `/fix` BACKLOG'a dokunmasın; kapanış bilgisi değişiklik notundaki "Review düzeltmeleri" tablosuna girsin. |
| REV-05 | Low | BACKLOG kapanış geleneği (BACKLOG.md:7, :41) | docs/reviews/BACKLOG.md:434-435 | İçerik doğru, ama iki sapma var. (a) "Kapandı … mutasyonla doğrulandı" "Hedef faz" sütununa yazılmış. Gelenek, kapanışı paragraf notuyla ("round N'de (@sha) düzeltildi ve doğrulandı") kaydedip satırı tablodan çıkarmak. (b) "Doğrulandı" iddiasını builder kendisi yapıyor. | Gate kaydında geleneğe göre yeniden yaz. |
| REV-06 | Low (bilgi) | docs/WORKFLOW.md:147 ("Her bulguyu ayrı commit'te düzelt") | 5d7e656 | RUL-01 ve RUL-02 tek commit'te. İkisi aynı dosyada ve ortak tabloları paylaşıyor; ayırmak yapay bir ara durum üretirdi. Gövde iki ID'yi ayrı maddelerle izliyor. Kabul edilebilir. | Eylem yok. |
| REV-07 | Low | API_CONTRACT #44 | packages/shared/src/schemas/insight.test.ts:105 | `date_change` için tek alanlı assertion her zaman boşa çalışıyor: tür kısmi olmadığından tek alanlı her nesne reddediliyor. Test gücünü :104 taşıyor, bu da yeterli. | İsteğe bağlı: `kind !== "date_change"` koşulu ya da açıklayıcı yorum. |
| REV-08 | Low | Test sağlamlığı | packages/shared/src/schemas/insight.test.ts:54-60, :63 | `STATUS_BY_KIND`, `ALLOWED`'a bağlı değil. `status` alanı olan yeni bir tür `ALLOWED`'a eklenip `STATUS_BY_KIND`'a eklenmezse matris o türü sessizce atlar. | İsteğe bağlı: "`ALLOWED`'da status içeren türler = `Object.keys(STATUS_BY_KIND)`" eşitlik testi. F0-04b. |

### Gate notu (REV-04 açık sorusu)
Reviewer guard'ın bu commit'i nasıl geçirdiğini sordu. Gate bunu builder oturum kaydından buldu:
- Builder BACKLOG'u Edit aracıyla değil, Bash içinde `python3 - <<'EOF' … open("docs/reviews/BACKLOG.md","w").write(s) EOF` ile yazdı.
- Rol değişmedi; kayıtta `builder` yazıyor.
- Commit'i aynı rol `git add … docs/reviews/BACKLOG.md && git commit` ile attı.
- Ayrıntı ve guard bulgusu SUMMARY.md'de (GATE-01).

CI: `gh` yok. Murat'ın bildirimine göre 5d7e656'da check-migrations, app ve secrets yeşil. Parity F0'da zorunlu değil.
