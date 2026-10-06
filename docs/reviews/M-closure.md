# Faz M kapanışı (M-06 mockup-freeze): GO/NO-GO, round 2

**Tarih:** 2026-10-06
**Kapsam:** main @ 0c1193b (round 1 kapsamına ek olarak `fix/m06-risk-reason` merge edildi). Girdiler: `docs/reviews/M-06-qa-regression.md` (qa-verifier, M-06 round 2), `docs/reviews/M-full-review.md` (reviewer, round 2, tüm kod), `docs/reviews/fix_m06-risk-reason/SUMMARY.md`, `docs/reviews/BACKLOG.md`, `docs/PHASES.md`, `docs/INVARIANTS.md` (INV-06/21/25/26). Ayrıca şu kod satırları doğrudan okundu: `src/lib/rabbitqa/store.tsx:256-269` (`updateStep`), `:671-719` (`approveInsight`), `src/components/rq/InsightCard.tsx:150-209` (`ApproveDialog`), `src/lib/rabbitqa/labels.ts:18-20`, `src/lib/rabbitqa/perm.ts:37-39`, `src/lib/rabbitqa/seed.ts:508`, `src/lib/rabbitqa/ai-mock.ts:49-51`.

Round 1 kararı (NO-GO, REV-01 ve eksik baseline) git geçmişinde duruyor (62a8f90). Bu belge onun yerini alıyor.

## Karar: **NO-GO (koşullu, kısa yol, round 1 ile aynı desen)**

**Gerekçe:** Round 1'in iki eksiği kapandı. REV-01 düzeltildi ve üç gate'ten APPROVE aldı. M-06 baseline'ı 5 rolün tamamıyla 35 PNG olarak `docs/reviews/M-06/baseline/` altında. Ancak round 2'de yeni bir bulgu çıktı: REV-13. Bu bulgu round 1'de REV-01'i blocker yapan ölçütlerin tamamını karşılıyor:

- arayüzden erişilebilir,
- INV-25'i iki ayrı cümlesinden ihlal ediyor,
- hiçbir katmanda doğru bir örnek yok,
- F0-01'in kaynağına giriyor,
- düzeltmesi birkaç satır.

Tutarlılık gereği karar NO-GO. Düzeltme dar kapsamlı ve mevcut baseline'ı geçersiz kılmıyor (aşağıda §Baseline etkisi). Bu yüzden bir sonraki tur hafif olacak.

## Kanıt özeti

**qa-verifier: APPROVE.**
- `tsc --noEmit` temiz.
- Vitest 12 dosya / 205 test yeşil. Round 1'e göre +1 dosya ve +8 test, bunlar REV-01'in AC1-AC4 testleri.
- Lint 14 hata / 28 uyarı. Round 1 referansıyla aynı, regresyon yok.
- Build başarılı, bilinen 1,22 MB chunk uyarısı duruyor.
- Playwright MCP ile 5 rol (csm, manager, admin, devops, care) gezildi. 13 sekme, Erişim bilgileri sekmesinin role göre görünürlüğü (RBAC), RiskDialog gerekçe alanı ve boş gerekçe hatası, 390px görünüm kontrol edildi. Konsol hatası 0.
- AUDIT.md §2 ekran listesi baseline ile birebir örtüşüyor.
- **M-06'nın görsel baseline şartı karşılandı.**

**reviewer: CHANGES_REQUESTED.**
- REV-01 kapandı (UI Phase3Tabs.tsx:357,418-434 + store.tsx:506-508 + testler).
- Yeni bulgular: REV-13 (High), REV-14 (Medium), REV-15 (Low).
- REV-02…12 hâlâ geçerli, hiçbiri blocker değil.
- INV-06 taraması tüm ekranlarda yapıldı. Açık kalanlar REV-14, REV-M06-01 ve REV-15.

**REV-13 doğrulandı (planner kod okuması):**
- `approveInsight`'ın `step_update` dalı (store.tsx:689-694) yalnızca `isAutoStep`'e bakıyor, sonra doğrudan `patch<Step>(...)` çağırıyor. `updateStep`'teki iki kilit kuralını (store.tsx:259-262) atlıyor:
  - "Adımın sırası gelmedi; durumu elle değiştirilemez"
  - "\"Sırası gelmedi\" elle seçilemez"
- `ballSince` güncellemesini de atlıyor (store.tsx:266).
- `ApproveDialog`'un Durum seçicisi (InsightCard.tsx:188; reviewer 187 demiş) `step_update` için `STEP_STATUS_LABEL`'ın tamamını listeliyor. Bu liste `locked: "Sırası gelmedi"`'yi de içeriyor (labels.ts:19).
- `canReviewInsight` (perm.ts:37-39) projeyi gören herkese açık. Yani DevOps ve Care rolleri de bu yola ulaşabiliyor.
- Seed'de bu yol hazır: `ai_3` (seed.ts:508), `pending` durumda, `step_update`, `proposed: { status }`. "Düzenle ve onayla" ile doğrudan erişilebiliyor.
- İkinci senaryo: öneri üretildikten sonra hedef adım kilitlenirse bekleyen öneri hâlâ onaylanabiliyor. Bu durumda "Onayla ve uygula" (düzenlemeden, `proposed: done`) **kilitli** bir adımı `done` yapar. Adımın kilitlenmesi M-09b/c kural motoruyla mümkün, bkz. RUL-05 `out_of_scope→locked`. Bu, INV-25'in "kilitli adımın durumu elle değişmez" cümlesinin ihlali. `updateStep` üzerinden geçmek bu senaryoyu da kapatıyor.

## REV-13 neden "F0-01 notu" değil de freeze blocker?

Round 1'deki dört ölçüt tek tek uygulandı.

1. **Davranışın hiçbir katmanda doğru örneği yok.** REV-01'i REV-06'dan ayıran ölçüt buydu. REV-06'da store eksik ama ekran doğru davranıyor. REV-13'te ise hem ekran (seçici `locked` sunuyor) hem store (`patch` ile kilit atlanıyor) yanlış. Ayrıca INV-25 bu konuda yoruma kapalı: hem "kilitli adımın durumu elle değişmez" hem "açılmış adım tekrar kilitlenmez" diyor. REV-14 ve REV-M06-01'de ise INV-06'daki "tarih" kelimesinin kapsamı belirsiz ve Murat kararı bekleniyor. Bu yüzden onlar blocker değil, REV-13 blocker.
2. **F0-01'in kaynağı.** F0-01 `Ctx` işlemlerinden ve saf mantıktan sözleşme çıkaracak. INV-21 ise "onay … ilgili mevcut servis fonksiyonu ile uygulanır" diyor. Bugünkü `approveInsight` bunun karşı örneği. Sözleşmeye "insight onayı servis fonksiyonunu çağırır" diye yazılsa bile referans kod tersini gösterecek. F3/F5'te bu dal taşınırken `patch` kısayolunun kopyalanma riski kalıcı olur.
3. **Etki sessiz ve kalıcı.** Tekrar kilitlenen adım INV-25 gereği "iş sayılmaz": kimseye atanmaz, uyarı üretmez, gecikmez. Önceki adım `done` değilse akış motoru (flow.ts:52-57) bu adımı hiç açmaz. Açarsa da termini yeniden hesaplar (flow.ts:59), yani termin gerekçesiz değişir. Kullanıcı hiçbir şey görmez. Bu, gerekçesiz bir durum değişikliğinden (REV-01) daha ağır bir sonuç.
4. **Maliyet tutarsızlığı aynı.** Düzeltme yaklaşık 3-5 satır kod ve 2-3 test. State sürümü, tip, enum ve seed değişmiyor. İstisna takibi bundan daha pahalı.

**REV-05 (`setStepByKey`) neden blocker değil:** Bu fonksiyon kullanıcı seçimiyle değil, kural motorunun iç çağrılarıyla çalışıyor ve S6/RUL-05 kararına bağlı. Arayüzde kullanıcıya "Sırası gelmedi" seçtiren bir yol yok. Medium olarak kalıyor.

## Baseline etkisi

Düzeltme yalnızca iki şeyi değiştiriyor: `ApproveDialog` açılır menüsünün **seçenek listesi** (menü açılmadan görünmüyor) ve store davranışı. Mevcut 35 PNG'nin hiçbiri açık durum menüsünü göstermiyor (`csm-insights` liste görünümü). Bu yüzden **mevcut baseline geçerli kalıyor ve yeniden çekilmiyor.** Fix gate'inde qa-verifier tek bir ek görüntü üretiyor: `csm-insights-step-update-edit-dialog-status-open.png` (seçenekler açık, "Sırası gelmedi" yok). Ana oturum bunu baseline'a ekliyor ve toplam 36 PNG oluyor.

## Düzeltilecekler (uygulama oturumu, builder rolü)

**1. REV-13: `/fix` ile, `fix/m06-insight-step-lock` branch'inde.** Bulgu kaynağı `docs/reviews/M-full-review.md` REV-13.

Yapılacaklar:
- `store.tsx` `approveInsight` → `case "step_update"`:
  - `isAutoStep` kontrolü olduğu gibi kalır.
  - Ardından `patch<Step>(...)` yerine `const err = api.updateStep(ins.targetId, v as Partial<Step>, reason); if (err) return err;` gelir.
  - Hata dönerse öneri `pending` kalır ve insight audit'i yazılmaz. Bu, fonksiyonun sonundaki `setState`'e hiç ulaşılmaması demek; erken `return` bunu zaten sağlıyor.
- `InsightCard.tsx` `ApproveDialog`: `step_update` için durum seçeneklerinden `locked` çıkarılır, ör. `Object.fromEntries(Object.entries(STEP_STATUS_LABEL).filter(([k]) => k !== "locked"))`. StepDialog'daki desen (ProjectDetail.tsx:466) izlenir.
- Değişmeyenler: state sürümü (v11), tipler, enum'lar, seed, `Ctx` imzası.

Kabul kriterleri:
- **AC1 (negatif).** Given `pending` durumda manuel bir adımı hedefleyen `pending` bir `step_update` önerisi. When `approveInsight(id, { status: "locked" })` çağrılır. Then hata metni döner, adım `pending` kalır, öneri `pending` kalır, yeni audit kaydı yazılmaz. Seviye L2 (store.test.tsx).
- **AC2 (negatif).** Given hedef adımı öneri oluşturulduktan sonra `locked` durumuna geçmiş `pending` bir `step_update` önerisi. When `approveInsight(id)` düzenleme olmadan (`proposed: done`) çağrılır. Then hata döner, adım `locked` kalır, öneri `pending` kalır. Seviye L2.
- **AC3 (pozitif, regresyon).** Given açık manuel bir adım. When `step_update` `{ status: "done" }` ile onaylanır. Then adım `done` olur, adım audit'inin reason'ı "AI Insight onaylandı" ile başlar, öneri `approved` olur ve `appliedEntityId` adım id'sidir. Seviye L2.
- **AC4.** Given "Düzenle ve onayla" diyaloğu bir `step_update` önerisi için açık. When Durum seçicisi açılır. Then "Sırası gelmedi" seçeneği yoktur, diğer dört durum vardır. Seviye L3 (InsightCard bileşen testi).
- **AC5 (regresyon).** Mevcut store.test.tsx:454 testi (AC17, otomatik adım reddi) değişmeden yeşil kalır.

İsteğe bağlı olarak aynı branch'te (diff küçük kalsın, rapor davranışını değiştiren hiçbir şey eklenmesin):
- **RUL-02** (Phase3Tabs.tsx:434): `needsReason ? reason.trim() : undefined`.
- **REV-M06-02** (Phase3Tabs.RiskDialog.test.tsx:56-67): AC2 testine audit.reason assert'i.
- **REV-07** (store.tsx:482): no-op `support_track` satırını sil.
- **PLN-01** (yeni, Low): `approveInsight`'ın `date_change` dalı `api.updatePhase`'in dönüş değerini yok sayıyor (store.tsx:710). Bugün yalnızca "Aşama bulunamadı" ile tetiklenebiliyor. İstenirse aynı desenle `if (err) return err;` eklenir.
- REV-11 (fail-closed rapor) bu tura **alınmaz**. Rapor davranışını değiştirir, F7-02'de kalır.

`/gate fix/m06-insight-step-lock`: reviewer + qa-verifier + **rules-reviewer**. Akış ve kilit kuralı ile AI onay yolu (INV-21/25) değiştiği için rules-reviewer tetikleniyor. qa-verifier bu gate'te iki iş daha yapar: §Baseline etkisi'ndeki tek ek görüntüyü üretir ve mevcut 35 görüntünün etkilenmediğini teyit eder.

## GO durumunda BACKLOG.md'ye taşınacaklar (şimdiden kaydedilebilir)

İnceleme sonucu: REV-13 dışındaki açık maddelerin hiçbiri mimari değişiklik gerektirmiyor. Hepsi dört türden birine giriyor: Murat'ın kural kararı, RBAC matris kararı, test boşluğu ya da belge/temizlik.

| ID | Sev. | Hedef | Not |
|---|---|---|---|
| REV-13 | High | **Freeze öncesi /fix** | Ek olarak F0-01: API_CONTRACT'a iki not. (a) insight onayı ilgili servis fonksiyonunu çağırır ve hatasını yayar (INV-21). (b) adım güncellemesinde `locked` hedefi veya kilitli kaynak → 409/400. |
| REV-14 | Med | **Murat kararı (INV-06 "tarih" kapsamı)** → F0-01, F3 | `PhaseDialog` `actualStart` gerekçesiz. Karar REV-M06-01 ile ortak verilir. |
| REV-M06-01 / RUL-01 | Med | Aynı Murat kararı → F0-01, F3-05 | Karar kaydının `decidedAt` alanı gerekçesiz değişebiliyor; reports.ts:52'yi etkiliyor. |
| REV-15 | Low | Faz 2 planı + F0-01 notu | Ulaşılamayan `TicketDialog` gerekçesiz durum değişikliği yapıyor; Faz 2 kabul kriteri olur. |
| REV-02 | Med | F1-05 (+F3-01) | `canViewProject`; URL ile proje detayına ve rapora erişim. |
| REV-03 | Med | F0-01 → F1-05 | `canEditReport` için rol kararı. |
| REV-04 | Med | **F0-01 öncesi Murat kararı** → F1-05 | Admin yazma yetkisi (`isAllSeeing`) ve AI onayıyla proje verisi yazması (store.tsx:708-711). RBAC.md Karar 1 ile çelişiyor. |
| REV-05 | Med | Murat kararı (S6) → F0-01 notu, F4-01 | `setStepByKey` kilit kontrolü yapmıyor; RUL-05/RUL-07 ile birlikte ele alınır. |
| REV-06 | Med | F0-01 + F1-02 | INV-06/08 kontrolleri sözleşmeye ve servis katmanına girer; store'dan kopyalanmaz. |
| REV-07 | Low | /fix (isteğe bağlı) veya F0-02 | No-op satır. |
| REV-08 | Low | F1-00 | `reportsSent` tutulsun mu, çıkarılsın mı. |
| REV-09 | Low | F1-00 | `"system"`/`"auto"` sentinel'leri ve takımın adla tutulması → DATA_MODEL §9. |
| REV-10 | Low | F6-01 | `isOpenStep` kopyaları ve takvim günü aritmetiği tek kaynağa. |
| REV-11 | Low | F7-02 | `=== true` ile fail-closed (INV-12); rules-reviewer kapsamında. |
| REV-12 | Low | Hemen (belge) | AUDIT §5'i denetim rolü günceller; AGENTS.md:28-29'u (v11, 51 işlem) Murat günceller. |
| RUL-02 | Low | /fix (isteğe bağlı) veya F3-05 | Bayat gerekçe gönderiliyor. |
| REV-M06-02 / RUL-03 | Low | /fix (isteğe bağlı) veya F4-01 | AC2 testi audit.reason'ı assert etmiyor. |
| REV-M06-03 | Low | F1-02 | Gerekçe store'da trim edilmiyor; servis katmanında tek noktadan trim yapılmalı. |
| RUL-04 (m06) | Low | F4-01 | Boşluktan oluşan gerekçe, çift audit ve null termin için negatif testler. |
| PLN-01 | Low | /fix (isteğe bağlı) veya F0-01 notu | `date_change` dalı `updatePhase` dönüşünü yok sayıyor. |
| — (m06 not) | Low | Kapatılır | Değişiklik notunda `npm run typecheck` yazıyor; belge tarihsel. |
| QA: 1,22 MB chunk | — | F0-02 / F9-03 | Code-split. |
| QA: lint 14 hata | — | F0-02 | Bilinen borç. |
| QA: e2e yok | — | F0-06 | Playwright altyapısı. |

Mevcut BACKLOG'daki "M-09a / M-09b / M-09c / M-09c fix / M-06 fix" etiketli açık maddelerin hedefleri round 1'deki gibi yeniden atanır:
- **Test boşlukları → F4-01.** RUL-04/05/06/09/10/12 ve REV-07/08/11/15 (m09a/b); REV-12, RUL-07 ve RUL-09 (m09c r2); REV-14 (test adı); RUL-11 (m09a r2).
- **a11y → F9-04.** REV-08/19/20 (m09b).
- **UI kenar durumları → F3-02.** REV-09/21 `?ws=`, REV-10 highlight, REV-15/16 toast ve etiket.
- **Belge tutarsızlıkları → kapatılır.** REV-13/18 (m09b/c), lint iddiaları, değişiklik notu satır referansları. Bu notlar artık tarihsel.
- **F0-01'den önce Murat kararı gerekenler:**
  - INV-06 "tarih" kapsamı (REV-14, REV-M06-01)
  - RUL-05/RUL-07 (done aşamada `locked` + `reqdoc_not_shared`)
  - S4 (Planlandı→Yapıldı gerekçesiz)
  - S6 ve A11
  - REV-07 m09b (`approveInsight` otomatik adımda `out_of_scope`)
  - RUL-07 m09a (held toplantı type/date gerekçesi)
- **RBAC → F1-05.** Admin yazma yetkisi, `canCreateProject`, `canSeeCredentials` (atanmış DevOps; F4-04 ile bağlantılı).
- **Diğer.**
  - REV-14 m09b `xlsx` → F0-02.
  - `todayISO` Europe/Istanbul → F6-01.
  - RUL-08 / `setInstallChoice` dönüş değeri → F1/F3-06.
  - RUL-13 (reqdoc `out_of_scope` kontrolü) → F4-01.
  - RUL-06 m09c (`adapt:general` çakışması) → F1-00 D15.
  - Aksiyonların açılışta sarı uyarı vermesi ve `ball` sıfırlama → F6-02/F3-03 açık soru.

## Teknik borç / ADR-0002

Parity job'ı hâlâ yok (Faz M'de DB yok). Bu yüzden pg-mem farkı gözlenmedi ve ADR-0002'yi yeniden değerlendirme koşulu oluşmadı. Bilinen borçlar F0-02'nin kapsamında: lint 14 hata, kullanılmayan paketler ve `xlsx`, `bun.lockb`, bundle boyutu, `package-lock` senkronu.

## Sonraki adım

1. Uygulama oturumu (builder): `fix/m06-insight-step-lock` branch'inde REV-13'ü düzelt, AC1-AC5'i yaz (isteğe bağlı olarak RUL-02, REV-M06-02, REV-07, PLN-01), ardından `/fix` ve değişiklik notu.
2. Denetim rolü, yeni sohbette: `/gate fix/m06-insight-step-lock` (reviewer + qa-verifier + rules-reviewer). qa-verifier ek baseline görüntüsünü üretir. APPROVE çıkarsa Murat merge eder ve ana oturum görüntüyü `docs/reviews/M-06/baseline/` altına ekler.
3. `/phase-close M` round 3 hafif yapılır:
   - qa-verifier yalnızca merge sonrası main'de regresyon çalıştırır (tsc, test, lint referansı, build) ve baseline'ın 36 PNG olduğunu teyit eder. Baseline yeniden çekilmez.
   - Reviewer'ın tüm kod tabanını yeniden taraması **gerekmez**; fix branch'inin gate'i yeterli.
   - Planner bu turda yeni bir High bulgu yoksa GO verir. Ardından:
     - Murat: `git tag mockup-freeze && git push --tags`
     - Denetim rolü: `docs/PHASES.md`'de M-06 ve Faz M'yi ✅ yapar, BACKLOG'u yukarıdaki tabloyla günceller.
4. Bu kapanışta `docs/PHASES.md` **değiştirilmez**; Faz M 🟡 olarak kalır. BACKLOG'a şimdiden eklenebilecek tek bölüm "M kapanış round 2" başlığıyla REV-14, REV-15 ve PLN-01'dir. REV-13 High olduğu için BACKLOG'a girmez, `/fix`'e gider.
