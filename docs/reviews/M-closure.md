# Faz M kapanışı (M-06 mockup-freeze): GO/NO-GO

**Tarih:** 2026-10-06
**Kapsam:** main @ 3727275 (M-09a + M-09b + M-09c merge edilmiş). Girdiler: `docs/reviews/M-qa-regression.md` (qa-verifier, M-06 modu), `docs/reviews/M-full-review.md` (reviewer, demo modu, tüm kod), `docs/reviews/BACKLOG.md`, `docs/PHASES.md`, `docs/AUDIT.md`. Bunlara ek olarak `src/pages/project/Phase3Tabs.tsx:348-428` ve `src/lib/rabbitqa/store.tsx:79,503` doğrudan okundu.

## Karar: **NO-GO (koşullu, kısa yol)**

**Gerekçe:** Freeze geri alınamaz bir referans üretiyor: hem görsel baseline hem de F0-01'in kaynağı. REV-01 bu referansa gerekçesiz bir durum/termin değiştirme yolu bırakıyor. Bu, INV-06'yı ve AGENTS.md demo kuralını ihlal ediyor ve yaklaşık 10 satırla kapanıyor. Ayrıca M-06'nın tanımındaki baseline henüz yok. İki eksik kapanınca karar GO olur.

## Kanıt özeti

**qa-verifier: APPROVE.** Typecheck temiz. Vitest 11 dosya / 197 test yeşil. Lint 14 hata / 28 uyarı, referansla aynı, yani regresyon yok. Build başarılı (1,22 MB chunk uyarısı eskiden beri var). Playwright MCP ile şunlar görüldü: 13 sekme, "Destek kayıtları Faz 2" pasif, uyarı rozeti ve paneli çalışıyor, konsol hatası 0, AUDIT.md §4 ekranla birebir uyuşuyor. İşlevsel ya da görsel regresyon yok.

**reviewer: CHANGES_REQUESTED.** Tek High bulgu REV-01. REV-02…06 Medium, REV-07…12 Low.

**REV-01 doğrulandı.** `RiskDialog`'un Kaydet düğmesi `updateRisk(risk.id, d)` çağırıyor (Phase3Tabs.tsx:424). Gerekçe alanı yok. Store imzasında `reason?` opsiyonel (store.tsx:79, 503). Kullanıcı arayüzden bir riskin durumunu ya da terminini gerekçe girmeden değiştirebiliyor.

**M-06 tanımı eksik.** PHASES.md M-06 ve qa-verifier.md:65 "her ekran × ilgili rol" için `docs/reviews/M-06/baseline/` altında görsel referans istiyor. Bu dizin yok (Glob: 0 dosya). QA turu yalnızca csm ve admin rolleriyle yapıldı; ekran görüntüleri `.verify/screens/` altında kaldı. F0-03 ve F0-04'ün kabul kriteri ("baseline'a göre fark yok") bu dizine dayanıyor.

## REV-01 neden "F0-01 notu" değil de freeze blocker?

1. **Görsel baseline'a girer.** Dondurulan RiskDialog'da gerekçe alanı olmaz. F0-03 ve F0-04 "baseline'dan fark yok" ile kabul ediliyor. Alan sonradan eklenirse ya bu kabul kriterine istisna açmak ya da hatalı ekranı referans olarak taşımak gerekir.
2. **F0-01'in kaynağı store `Ctx`'idir.** `updateRisk(id, patch, reason?)` imzası sözleşmeye olduğu gibi aktarılma riski taşır. REV-06 (store'da kontrol yok ama UI'da var) bu yüzden freeze'i engellemiyor: orada en azından ekran doğru davranıyor. REV-01'de ise ne ekran ne store kuralı uyguluyor. Davranışın hiçbir katmanda doğru örneği yok.
3. **Demo kuralının açık ihlali.** AGENTS.md "Demo kuralları"nda "Gerekçe zorunlu: … tarih ve durum değişikliği" yazıyor. Faz M'nin kendi tanımına göre mockup tamamlanmış sayılmaz.
4. **Maliyet tutarsız.** Düzeltme yaklaşık 10 satır, state sürümü değişmiyor. Etiket ise kalıcı. "F0-01'de not düşeriz" yolu, düzeltmeden daha pahalı bir istisna takibi doğurur.

## Düzeltilecekler (uygulama oturumu, builder rolü)

**1. REV-01: `/fix` ile, `fix/m06-risk-reason` branch'inde.** Bulgu kaynağı `docs/reviews/M-full-review.md` REV-01.

Yapılacaklar:
- `RiskDialog`'da `needsReason = !!risk && (d.status !== risk.status || d.due !== risk.due)` koşulunu ekle.
- Koşul doğruysa "Gerekçe (zorunlu)" Textarea'sı göster; etiket `htmlFor`/`id` ile bağlı olsun.
- Gerekçe boşsa `toast.error` göster ve kaydetme.
- Kaydederken `updateRisk(risk.id, d, reason.trim())` çağır; audit kaydının reason alanı dolu olmalı.
- State sürümü ve enum'lar değişmez.

Kabul kriterleri:
- **AC1.** Given mevcut bir risk, When yalnızca durum değiştirilip gerekçe boş bırakılarak Kaydet'e basılır, Then `updateRisk` çağrılmaz ve hata gösterilir (L3 bileşen testi, negatif kriter).
- **AC2.** Given mevcut bir risk, When termin değiştirilip gerekçe girilir, Then risk güncellenir ve son audit kaydının reason'ı girilen metindir (L3).
- **AC3.** Given mevcut bir risk, When yalnızca başlık ya da açıklama değişir, Then gerekçe alanı görünmez ve kayıt yapılır (L3).
- **AC4.** Given yeni kayıt, Then gerekçe istenmez (L3).

İsteğe bağlı olarak aynı branch'te:
- REV-07: store.tsx:482'deki no-op `support_track` satırını sil.
- REV-11: reports.ts:32,54'te `isCustomerVisible === true` kullan. Bu, INV-12 fail-closed demek ve rapor davranışını değiştirir; o yüzden rules-reviewer'ın kapsamına girer.

`/gate fix/m06-risk-reason`: reviewer + qa-verifier + **rules-reviewer**. Gerekçe ve audit değiştiği için rules-reviewer tetikleniyor.

**2. M-06 baseline.** Merge sonrası `/phase-close M` yeniden çalıştırılır. Bu turda qa-verifier yalnızca M-06 modunda çalışır: her ekran × ilgili rol (csm, manager, admin, devops, care ve RBAC.md'deki diğer roller), RiskDialog'un yeni hali dahil. Ana oturum görüntüleri `docs/reviews/M-06/baseline/` altına kopyalar. Reviewer'ın tüm kod tabanını yeniden taraması gerekmez; fix branch'inin gate'i yeterli.

## Yeniden GO durumunda BACKLOG.md'ye taşınacaklar (şimdiden kaydedilebilir)

İnceleme sonucu: REV-02…12'nin ve mevcut BACKLOG maddelerinin hiçbiri mimari değişiklik gerektirmiyor. Hepsi üç türden birine giriyor: RBAC matris kararı, kural kararı (Murat), test boşluğu ya da belge/temizlik. Tümü F0/F1 ve sonraki fazlara taşınabilir.

| ID | Sev. | Hedef | Not |
|---|---|---|---|
| REV-01 | High | **Freeze öncesi /fix** | Ek olarak F0-01: API_CONTRACT'ta risk güncellemesi için "durum/termin değişirse reason zorunlu, yoksa 400" |
| REV-02 | Med | F1-05 (+F3-01) | `canViewProject`; proje detayı/rapor URL erişimi |
| REV-03 | Med | F0-01 → F1-05 | `canEditReport` rol kararı |
| REV-04 | Med | **F0-01 öncesi Murat kararı** → F1-05 | Manager/admin düzenleme yetkisi: RBAC.md mi, M-09b planı mı geçerli? |
| REV-05 | Med | Murat kararı (S6) → F0-01 notu, F4-01 | `setStepByKey` kilit kontrolü (INV-25); RUL-05/RUL-07 ile birlikte |
| REV-06 | Med | F0-01 + F1-02 | INV-06/08 kontrolleri sözleşmede ve servis katmanında; store'dan kopyalanmaz |
| REV-07 | Low | /fix (isteğe bağlı) veya F0-02 | no-op satır |
| REV-08 | Low | F1-00 | `reportsSent` tutulsun mu, çıkarılsın mı |
| REV-09 | Low | F1-00 | `"system"`/`"auto"` sentinel'leri, takımın adla tutulması → DATA_MODEL §9 |
| REV-10 | Low | F6-01 | `isOpenStep` kopyaları ve takvim günü aritmetiği tek kaynağa |
| REV-11 | Low | /fix (isteğe bağlı) veya F7-02 | `=== true`, fail-closed |
| REV-12 | Low | Hemen (belge) | AUDIT §5'i denetim rolü günceller; AGENTS.md:28-29'u Murat günceller |
| QA: 1,22 MB chunk | — | F0-02 / F9-03 | code-split |
| QA: e2e yok | — | F0-06 | Playwright altyapısı |

Mevcut BACKLOG'daki "M-09b / M-09c / M-09c fix" etiketli açık maddelerin hedefi artık geçersiz, çünkü o görevler kapandı. Yeni hedefler:
- **Test boşlukları → F4-01.** RUL-04/05/06/09/10/12, REV-07/08/11/15 (m09a/b), REV-12/RUL-07 (m09c r2), REV-14 (test adı). Kural mantığı taşınırken testleri de yeniden yazılır.
- **a11y → F9-04.** REV-08/19/20 (m09b).
- **UI kenar durumları → F3-02.** REV-09/21 `?ws=`, REV-10 highlight, REV-15 toast, REV-16 etiket.
- **Belge tutarsızlıkları → kapatılır.** REV-13/18 ve lint iddiası; değişiklik notları artık tarihsel.
- **Murat kararı gerekenler, F0-01'den önce.** RUL-05/RUL-07 (done aşamada `locked` + `reqdoc_not_shared`), S6, A11, REV-07 m09b (`approveInsight` out_of_scope), RUL-07 m09a (held toplantı type/date gerekçesi; INV-06 kapsamında, F3-05'te de geçerli).
- **RBAC → F1-05.** Admin yazma yetkisi, `canCreateProject`, `canSeeCredentials` (atanmış DevOps); ikincisi F4-04 ile ilgili.
- **Diğer.** REV-14 m09b `xlsx` → F0-02. `todayISO` Europe/Istanbul → F6-01. RUL-08 / `setInstallChoice` dönüş değeri → F1/F3-06. Aksiyonların açılışta sarı uyarı vermesi ve `ball` sıfırlama → F6-02/F3-03 açık soru.

## Teknik borç / ADR-0002

Parity job'ı henüz yok (Faz M'de DB yok), dolayısıyla pg-mem farkı gözlenmedi ve ADR-0002'yi yeniden değerlendirme koşulu oluşmadı. Bilinen borçlar F0-02'nin kapsamında: lint 14 hata, kullanılmayan paketler, `bun.lockb`, bundle boyutu.

## Sonraki adım

1. Uygulama oturumu (builder): `fix/m06-risk-reason` branch'inde REV-01'i düzelt (isteğe bağlı REV-07/11), ardından `/fix` ve değişiklik notu.
2. Denetim rolü, yeni sohbette: `/gate fix/m06-risk-reason` (reviewer + qa-verifier + rules-reviewer). APPROVE çıkarsa Murat merge eder.
3. `/phase-close M` yeniden çalıştırılır: qa-verifier M-06 modunda, tüm roller × ekranlar, baseline `docs/reviews/M-06/baseline/` altına. Planner bu turda GO verirse:
   - Murat: `git tag mockup-freeze && git push --tags`
   - Denetim rolü: `docs/PHASES.md`'de M-06 ve Faz M'yi ✅ yapar, BACKLOG'u yukarıdaki tabloyla günceller.
4. Bu kapanışta `docs/PHASES.md` **değiştirilmez**; Faz M 🟡 olarak kalır.
