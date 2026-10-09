# Gate Özeti — chore/f0-02-cleanup @ b936fb7 (round 2)

Tarih: 2026-10-09 · Kapsam: `7702f01..b936fb7` (6 commit: fb253e1, 10b0aa5, d419000, 5b85e7a, aee62be, b936fb7) · Plan: `docs/plans/F0-02-cleanup.md` · Değişiklik notu: `docs/changes/chore_f0-02-cleanup.md`

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 0 | 2 (REV2-01, REV2-02) |
| qa-verifier | APPROVE (komut kanıtları tablosu var, PASS satırları alıntılı; ilk teslim "placeholder" geldi, tam rapor yeniden istendi) | 0 | 0 | 0 | 0 + 2 Info (QA2-01, QA2-02) |
| rules-reviewer | APPROVE | 0 | 0 | 1 (RUL2-02, branch öncesinden kalma, backlog) | 2 (RUL2-01, RUL2-03) |
| CI (app / parity / secrets) | **Yeşil:** run #57 (b936fb7), Murat GitHub'da ekran görüntüsüyle doğruladı (`gh` yerelde yok, gate okuyamadı). Parity: F0, `migrations/*.sql` yok, atlanır | | | | |

**Genel karar:** MERGE'E HAZIR

Round 1 bulgularından builder'a düşenler (RUL-01, REV-02, REV-03) kapandı; reviewer ve rules-reviewer ayrı ayrı doğruladı. 7702f01 merge commit'i yalnızca main'deki `ci.yml` düzeltmesini (5c41bd2) getiriyor, elle çözülmüş çakışma yok. Uygulama koduna dokunulmadı (`src` farkı yalnızca 2 test dosyası).

## Bağımsız doğrulamalar
- **Date sabitleme (fb253e1):** qa-verifier, HEAD'i 2026-10-02 (cuma), 10-03 (cumartesi), 11-16 ve 2027-01-15'e sabitlenmiş saatle koştu: 2 dosya, 101/101 yeşil. Sabitlemesiz 7702f01 aynı tarihlerde kırmızı (1–2 failed). `npm test` ve `TZ=UTC npm test` 213/213, lint 0 hata, typecheck ve build exit 0. reviewer, seed tarihlerinin modül yüklenirken değil `createSeed()` çağrısında hesaplandığını doğruladı; sabitleme bu yüzden etkili.
- **`.gitleaksignore` (10b0aa5):** tek parmak izi (`3f28ad4…:.env:generic-api-key:2`), joker yok. Muaf tutulan değer `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_` önekli anon anahtar, secret değil). `.env` takipte değil. Yerel gitleaks yok; `secrets` job'ının yeşili CI #57'ye dayanıyor.

## Düzeltme direktifi
Bu branch için zorunlu düzeltme yok.

İsteğe bağlı (Low, merge'i engellemez):
1. **[REV2-01]** `docs/API_CONTRACT.md:315`: v1.3 geçmiş satırının sonuna "; #29/§2.2 `support_track` no-op kuralı kaldırıldı (RUL-01)" ekle. Test yok. Merge sonrası sonraki sözleşme turunda da yapılabilir.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki 'Review düzeltmeleri' tablosunu güncelle ve push et.

## Denetim / Murat'ın kayda alması gerekenler (builder işi değil)
- **[RUL2-02] Medium, F7-02 öncesi:** `src/lib/rabbitqa/reports.ts:28` `weekEnd = addBusinessDays(weekStart, 4)`. Cumartesi/pazar kayıtları hiçbir haftalık rapora girmiyor; tam gün tatilli haftada `weekEnd` sonraki pazartesiye kayıyor (2026-10-26 → 11-02) ve 02.11 kaydı iki rapora giriyor. Snapshot dondurulduğu için (INV-27) yanlış veri kalıcı oluyor. Sorun branch öncesinden kalma; round 1'deki AC18 cumartesi kırmızısı bunun belirtisiydi ve pazartesi sabitlemesi artık gizliyor. Karar: hafta takvim haftası mı (`weekEnd` = pazar)? Gate tespitini kodda doğruladı (reports.ts:28).
- **[RUL2-01] Low, F0-04 / F6-03:** `report_not_sent` için hiç test yok; cuma/hafta sonu dalı artık hiçbir testte koşmuyor. Açık `today` ile tarih matrisi testi önerildi.
- **[REV2-02 + RUL2-03] Low, denetim:** `docs/TEST_STRATEGY.md:49` §3 tek sabit saat (`2026-09-01T09:00:00+03:00`) yazıyor; mockup testleri `2026-10-05T09:00:00` yerel saat kullanıyor. §3'e mockup/API ayrımı ve "haftanın gününe bağlı kurallar açık `today` ile tarih matrisiyle test edilir" satırı eklenmeli (rules-reviewer'ın metin önerisi rules-reviewer.md'de). Ortak `MOCKUP_NOW` sabiti bir sonraki test altyapısı işine.

## Açık sorular / öneriler (engelleyici değil)
- §2.2 tablosunun üstündeki "her yol için `out_of_scope` kalır" cümlesi üstü çizili satırı da kapsıyor gibi okunabilir. Sonraki sözleşme turunda satır tablodan çıkarılıp altına not olarak yazılabilir (rules-reviewer Öneri 1).
- "seed produces reqdoc_not_shared only for p_lojistik" iddiayı seed anında değil 10-20'de sınıyor; `computeAlerts(s, "2026-10-05")` ile ek assert önerildi (rules-reviewer Öneri 2).
- Sahte Date dondurulmuş (`shouldAdvanceTime` yok). `ProjectDetail.tabs.test.tsx`'e ileride zaman damgası sıralaması assert'i eklenirse sıra belirsiz olur (reviewer).
- `.gitleaksignore` yorumundaki "proje durduruldu" iddiası repodan doğrulanamaz. Anahtar publishable olduğu için risk düşük; Murat'ın bilgisine.

---

# Round 1

# Gate Özeti — chore/f0-02-cleanup @ 980e65c

Tarih: 2026-10-07 · Plan: `docs/plans/F0-02-cleanup.md` · Değişiklik notu: `docs/changes/chore_f0-02-cleanup.md`

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 0 | 3 (REV-01, REV-02, REV-03) |
| qa-verifier | APPROVE (komut kanıtları tablosu var, PASS satırları alıntılı) | 0 | 0 | 0 | 1 (QA-01) + 2 Info |
| rules-reviewer | APPROVE | 0 | 0 | 0 | 2 (RUL-01, RUL-02) |
| CI (app / parity / secrets) | **Okunamadı** (`gh` kurulu değil). Parity: `migrations/*.sql` yok, job atlanır (F0) | | | | |

**Genel karar:** MERGE'E HAZIR — **koşullu:** merge'den önce Murat, GitHub web arayüzünde `chore/f0-02-cleanup` için `ci.yml` koşusunun yeşil olduğunu kontrol etmeli. Özellikle `secrets` job'ı (gitleaks, `fetch-depth: 0`) git geçmişindeki Supabase publishable anahtarını yakalayabilir (plan D10/M5, `.gitleaksignore` F0-07'ye bırakıldı). Kırmızıysa merge kararı Murat'ındır.

## Bağımsız doğrulamalar (Murat'ın notu)
- **AC2 (histogram diff):** reviewer ve qa-verifier ayrı ayrı doğruladı. `git diff --diff-algorithm=histogram origin/main...HEAD -- package-lock.json` → eklenen `"version"` satırı **0**, silinen 147. Yol bazında: `removed 147 added 0 versionChanged 0`, değişen yalnızca `dev` bayrağı (148 yol). Silinen yolların hepsi kaldırılan 7 paketin yetim bağımlılıkları. `npm audit fix`/update izi yok. (Myers diff d5abbb5'te 325 sahte `"version"` satırı gösteriyor; histogram 0.)
- **AC19 (baseline ekranlar, Playwright):** qa-verifier tarayıcı turu PASS — müşteri raporu, Go-Live sekmesi, insight listesi ve düzenle-onayla diyaloğu, risk diyaloğu + 3 rastgele ekran; baseline'a göre yalnızca tarih/zaman ve tur etkileşimi kaynaklı veri farkı. Rapor Kaydet/Gönderildi toast'ları, Go-Live hata dalı toast'ı, insight onayı doğrulandı. Konsol 0 hata. Ekranlar: `screens/` (14 PNG). Go-Live başarı dalı toast'ı ekranda doğrulanmadı (QA-03, Info).

## Doğrulanamayanlar (bloklayıcı değil)
- **AC14 mutasyon kanıtı (QA-01):** guard.mjs auditor rolünde `store.tsx`'e geçici yazmayı engelledi; plan bunu isteğe bağlı sayıyor. Builder'ın değişiklik notundaki mutasyon çıktısı ve testlerin assert'leri (reviewer + rules-reviewer) dolaylı kanıt.
- **CI:** yukarıda.

## Murat'ın kayda alması gerekenler (builder işi değil)
- **[REV-01]** `tailwindcss-animate` → `devDependencies` (84eeac9) plan dışı bir değişiklik; onay yalnızca değişiklik notunda. Teknik olarak doğru (yalnızca build'de kullanılıyor, sürüm aynı), ama `npm audit --omit=dev --audit-level=high`'ın 0 dönmesinin bir nedeni bu sınıflandırma (tailwind zincirindeki high'lar prod raporundan düşüyor). M7'de (PHASES/AUDIT F0-02) kalıcı kayda alınmalı.
- **[RUL-02]** M8: `docs/INVARIANTS.md:36` INV-28 (c) metni D8 = (a)'ya göre netleşmeli ("07 `done` iken 05'in durumundan bağımsız `409`"). F4-03 planından önce.

## Düzeltme direktifi (isteğe bağlı, Low — merge'i engellemez)
1. **[RUL-01]** `docs/API_CONTRACT.md:100` (#29) — `support_track` cümlesi "Mockup'taki no-op `support_track` kuralı F0-02'de kaldırıldı (REV-07); API'de karşılığı yok" olsun; `:138` §2.2 `addTicket → support_track` satırı silinsin ya da "kaldırıldı (F0-02, REV-07)" diye işaretlensin. Test yok; doğrulama: `grep -n support_track docs/API_CONTRACT.md` yalnızca "kaldırıldı" notunu gösterir.
2. **[REV-02]** `docs/changes/chore_f0-02-cleanup.md` — şablondaki eksik iki başlık: "## Mockup ↔ API (modül bağlama görevlerinde)" → "Uygulanmaz: bu görev modül bağlamıyor." ve "## Ekran görüntüleri" → "AC19, qa-verifier L6, `docs/reviews/chore_f0-02-cleanup/screens/`." Test yok.
3. **[REV-03]** `docs/API_CONTRACT.md:315` — v1.3 geçmiş satırı C2 maddelerini C1 commit'inde (4eed9a8) önceden listeliyor. Ya satırı son C commit'iyle hizala ya da değişiklik notunun "Açık sorular 3" maddesine "v1.3 geçmiş satırı C2 maddelerini önceden listeler; bir C2 commit'i geri alınırsa satır da düzeltilir" cümlesini ekle. Test yok.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki 'Review düzeltmeleri' tablosunu güncelle ve push et.

## Açık sorular (sonraki planlara)
- RR-F029 kapsamı: `goLiveApproval` varken `customer_approval` `done → out_of_scope` serbest mi `409` mu? Güvenli varsayım `409` — F5-05 planında netleşmeli.
- K19: yeniden kilitlenen aşamanın `activatedAt`'i korunur mu? Güvenli varsayım: korunur — F3-02 planına.
- `addTicket` `priority: "high"` yolunun koruma testi yok (rules-reviewer Öneri 2) — Faz 2 öncesi.
- `InsightProposedFields` (`& Record<string, unknown>`) şemaya kopyalanmamalı; F0-04'te `InsightProposal` zod şeması #44'teki tür başına izinli alanları zorlamalı (INV-19).
- Sözleşme/plandaki `store.tsx` satır başvuruları HEAD'de 1 satır kaydı (`main @ 7ba26ef`'e sabitli, yanlış değil) — sonraki sözleşme turunda.
- AC17 koruma testi seed'de `support_track` adımı olmadığı için regresyonu yakalamaz (plan §2.3 kabul ediyor).
- Değişiklik notundaki "74 `dev: true`" sayısı yalnızca 84eeac9 commit'ine ait; main…HEAD toplamı 147 (+1 kök girdi). Çelişki değil.
- guard.mjs, qa-verifier'ın mutasyon kanıtını (scratchpad kopyada bile) ve reviewer'ın `tsc -p tsconfig.app.json` komutunu engelliyor — kit değişikliği gerekirse Murat karar verir.
