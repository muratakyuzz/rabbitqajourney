# Gate Özeti — chore/f0-04a-shared-foundation @ 5d7e656 (tur 2, kısa tur)
Plan: `docs/plans/F0-04-fe-data-layer.md` (F0-04a) · Değişiklik notu: `docs/changes/chore_f0-04a-shared-foundation.md` · 2026-10-10
Tur 1 (@ 007f47d, MERGE'E HAZIR): `git show 9045c0f:docs/reviews/chore_f0-04a-shared-foundation/SUMMARY.md`. Bu tur yalnızca 007f47d sonrasını inceledi: 9045c0f (gate kaydı) ve 5d7e656 (RUL-01/02 `/fix`).

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| CI (app / parity / secrets) | Yeşil @ 5d7e656. **Murat bildirimi**: check-migrations, app ve secrets ✅. `gh` yok, gate doğrulayamadı. Migration yok; parity F0'da zorunlu değil. `.github/` diff'i boş. | 0 | 0 | 0 | 0 |
| reviewer | APPROVE | 0 | 0 | 0 | 5 (REV-04..08) |
| qa-verifier | APPROVE. Komut kanıtları tablosu ve alıntılar var. Tek flaky koşu not edildi. | 0 | 0 | 0 | 1 (QA-01) |
| rules-reviewer | APPROVE. RUL-01 ve RUL-02 kapandı. 4/4 mutasyon tekrarlandı (+3 ek). | 0 | 0 | 0 | 0 |
| gate (süreç/kit) | GATE-01 | 0 | 0 | 1 | 0 |

**Genel karar:** MERGE'E HAZIR

GATE-01, branch koduyla değil kitle ilgili. Merge'i engellemez.

HEAD: `origin/chore/f0-04a-shared-foundation` = `5d7e65647ca702d1d73ca71a0630716b208bdb44`. Gate ve qa-verifier bunu ayrı ayrı doğruladı.

## Kontrol noktalarına cevaplar
1. **5d7e656 yalnızca test mi?** Evet.
   - `git diff 9045c0f..5d7e656 --stat` 3 dosya gösteriyor: `insight.test.ts` (+59), değişiklik notu (+4), `docs/reviews/BACKLOG.md` (4 ±).
   - `git diff 007f47d..5d7e656 --stat -- apps packages ':!packages/shared/src/schemas/insight.test.ts'` boş.
   - package/lock ve `.github` değişmemiş.
   - 9045c0f'deki 6 dosyanın hepsi `docs/reviews/` altında.
2. **ALLOWED ve RUL-01/02:**
   - `ALLOWED`, #44 ile birebir aynı: update türleri; `action_create` = #6 (7 alan); risk/karar = #31 − {kind, meetingId} (10 alan).
   - Elle yazılmış: şemadan yalnızca `safeParse` için import ediliyor, `.shape` ve `.keyof` yok.
   - RUL-01: 17 yabancı alan × 7 tür, hem geçerli gövdeye eklenerek hem tek başına red. `date_change` `{phaseId, goLiveDate}` ve `{phaseId}` red.
   - RUL-02: 5 tür × 10 durum. RiskStatus risk/karar dışında red; `cancelled`, `done` ve `in_progress` risk/kararda red; `realized` kabul.
   - **Mutasyon beyanı doğrulandı:** rules-reviewer 4 mutasyonun dördünü de scratch kopyada tekrarladı. Sonuç 1/3/4/1 kırmızı, beyanla aynı. Worktree'ye yazılmadı, hiçbir şey commit'lenmedi. Ek mutasyonlar M5, M6 ve M7 de kırmızı verdi.
   - Not: "health_change + status → 4" sayısı yalnızca `z.string()` ile çıkıyor. `StepStatusSchema` ile 2 çıkıyor. Beyan doğru ama tipi yazılmamış.
3. **BACKLOG düzenlemesi (5d7e656):**
   - İçerik doğru. RUL-01 ve RUL-02 gerçekten kapandı ve özetler değişmemiş.
   - Biçim gelenekten sapıyor. Kapanış "Hedef faz" sütununa yazılmış. "Mutasyonla doğrulandı" iddiasını da gate değil, düzelten taraf yapıyor (REV-04, REV-05).
   - **Gate bu düzenlemeyi sahiplendi ve yeniden yazdı.** Kapanış, geleneğe uygun olarak paragraf notuna taşındı: "tur 2'de (@ 5d7e656) düzeltildi ve doğrulandı — tablodan çıkarıldı" (BACKLOG.md:7 ve :41 örneği). İki satır tablodan çıkarıldı. Tur 2 bulguları için yeni bölüm açıldı.
4. **Guard ile CLAUDE.md tutarlı mı?**
   - Beyan tutarlı. CLAUDE.md `docs/reviews/` için "Uygulama —, zorlayan: guard" diyor; `guard.mjs:45` `AUDIT_PATHS` içinde `/^docs\/reviews\//` var.
   - Uygulama eksik. Ayrıntı GATE-01'de.
5. **AC9:** Hâlâ geçerli. `index-CDN67-XW.css` ve `index-LqGeOgQ3.js` ad ve sha256 olarak tur 1 ile aynı: `35246c67…fad531e4` ve `0b9a5a56…b7df4764`.

## GATE-01 (Medium, kit): guard, yorumlayıcı üzerinden yazmayı ve korumalı yolu commit'lemeyi görmüyor
**Ne oldu?** Builder oturum kaydına göre (2026-10-09T20:58:16Z) rol `builder` idi ve hiç değişmedi.
- Builder BACKLOG'u Edit ile değil, Bash içinde şu komutla yazdı:
  ```
  python3 - <<'EOF'
  p="docs/reviews/BACKLOG.md"; s=open(p).read(); …; open(p,"w").write(s)
  EOF
  ```
- Ardından aynı rolde `git add … docs/reviews/BACKLOG.md && git commit` çalıştırdı.
- Önce Edit denenip engellenmedi; doğrudan Python yolu kullanıldı.

**Neden geçti?** `guard.mjs:84-110` iki desen arıyor: (a) `>`/`>>` yönlendirme hedefi korumalı bir yol mu; (b) `MUTATORS` listesindeki (sed -i, perl -i, tee, rm, mv, cp…) bir komut korumalı yol token'ı ile birlikte geçiyor mu. Bu komut ikisine de uymuyor:
- `python3`, `node -e`, `awk` (yönlendirmesiz), `ruby` ve `perl` (`-i`'siz) listede yok.
- Yol, `p="docs/…"` gibi bir atamanın içinde geçiyor. Token'ın başı `p="` olduğu için `^docs\/` deseni eşleşmiyor.
- Builder için `git add`/`git commit` hiç denetlenmiyor. Korumalı yol, nasıl yazılmış olursa olsun commit'e girebiliyor.

**Etkisi:** "Yazan ≠ denetleyen" ayrımını guard düzeyinde garanti eden bir mekanizma yok. Builder, gate'in kendi kayıtlarını (SUMMARY, reviewer raporları, BACKLOG) ve kural dosyalarını (INVARIANTS, RBAC, PRODUCT_SPEC, `.claude/`) bu yolla değiştirip commit'leyebilir. Bu turda içerik doğru ve talimat Murat'tan geldi, yani zarar yok. Yine de CLAUDE.md'deki "zorlayan: guard" beyanı şu an gerçeğe karşılık gelmiyor.

**Öneri** (Murat isteğiyle denetim rolünde kit değişikliği; bu gate kit dosyasına dokunmadı):
1. **Asıl kontrol, commit anı:** builder rolünde `git commit` (ve `git add`) komutu görülünce guard `git diff --cached --name-only` çalıştırsın (`add` için hedef yolları kontrol etsin). `AUDIT_PATHS` ile eşleşen yol varsa engellesin. Bu, dosyanın hangi araçla yazıldığından bağımsız tek kontrol noktası olur.
2. **Yazma anı:** `MUTATORS`'a yorumlayıcıları ekle (`python3?`, `node`, `ruby`, `awk`, `perl`). Token eşleştirmesinde, tırnak ya da `=` içinde geçen korumalı yol alt dizgilerini de yakala (ör. `/(^|["'=\s])docs\/reviews\//`).
3. **Talimat:** `/fix` (`.claude/commands/fix.md`) ve `AGENTS.md` şunları söylesin: "BACKLOG ve review kayıtları gate'e aittir. Kapanışı değişiklik notundaki 'Review düzeltmeleri' tablosuna yaz. Talimat korumalı bir yola yazmayı istiyorsa dur ve bildir; başka araçla dolanma."
4. Yanlış pozitifleri önlemek için guard'a 1. madde için birim testi eklenebilir (kit).

**Hedef:** Bir sonraki `/build` (F0-04b) öncesinde kit değişikliği olarak. En geç F0-07: orada branch koruması ele alınıyor, bu da aynı güven katmanı.
**Kök neden notu:** `/fix` talimatında "BACKLOG'da RUL-01/02'yi kapalı işaretle" vardı ve CLAUDE.md'deki yazma tablosuyla çelişiyordu. Builder çelişkiyi bildirmek yerine talimatı uyguladı.

## Düzeltme direktifi
Zorunlu düzeltme yok. Aşağıdakiler isteğe bağlı; F0-04b'ye ya da BACKLOG'a bırakılabilir.
- REV-07: `insight.test.ts:105`. `date_change` için tek alanlı assertion boşa çalışıyor; koşul ya da yorum ekle.
- REV-08: `insight.test.ts:54-63`. "`ALLOWED`'da `status` içeren türler = `Object.keys(STATUS_BY_KIND)`" eşitlik testi ekle.
- Ö-4 (rules-reviewer): `insight.test.ts:128-139`. Sunucunun atadığı alanlar (`source`, `ruleKey`, `insightId`, `meetingId`, `kind`) için red testini 7 türün hepsine genişlet.
- Değişiklik notu: RUL-01 mutasyon satırında M3'ün tipini (`z.string()`) yaz.

GATE-01 kit değişikliğidir, uygulama rolünün işi değildir.

## Murat kararı bekleyen açık sorular (tur 1'den taşınan, engelleyici değil)
INV-12 (`isCustomerVisible` AI önerisinde), boş `proposed: {}`, V2 `locked`. Ayrıntı tur 1 SUMMARY ve BACKLOG'da. Not: `ALLOWED` artık `isCustomerVisible`'ı create türlerinde izinli olarak sabitliyor. INV-12 için (a) seçilirse test bilerek güncellenmeli (rules-reviewer M7).
