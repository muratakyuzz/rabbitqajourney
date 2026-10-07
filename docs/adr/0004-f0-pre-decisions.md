# ADR-0004: F0-01 öncesi Murat kararları (K1–K7)

**Durum:** Kabul edildi · K2 ADR-0005 K11 ile netleştirildi; K2, K4, K5 metinleri 2026-10-06'da düzeltildi (ADR-0005)
**Tarih:** 2026-10-06
**Hazırlayan:** planner · **Onaylayan:** Murat

## Bağlam
`docs/reviews/BACKLOG.md` → "F0-01'den önce Murat kararı gerekenler" listesinde biriken açık sorular (REV-14, REV-M06-01, RUL-05/07, S4, S6, A11, REV-04, m09b REV-07, REV-M13-01) F0-01 (API sözleşmesi) başlamadan karara bağlanmalı; sözleşme bu kararları hedef davranış olarak yazacak. Mockup (main @ 4bfa4cb ve sonrası) dondurulmuş durumda ve değişmez; burada alınan kararlardan mockup'tan farklı olanlar API'de uygulanacak, mockup'ta düzeltilmeyecek.

Bu ADR yedi kararı (K1–K7) tek yerde toplar. Her karar aşağıda kendi bağlamı, kararı, sonuçları ve etkilediği BACKLOG kalemleriyle birlikte verilir.

---

## K1 — INV-06 tarih kapsamı

**Bağlam:** REV-14 ve REV-M06-01, `INV-06`'daki "tarih değişikliği" ifadesinin hangi tarih alanlarını kapsadığını netleştirmeyi istiyordu: `PhaseDialog`'da `actualStart` gerekçesiz değişebiliyor, karar kaydının `decidedAt`'i de öyle. Haftalık rapor kararları `decidedAt`'e göre seçtiği için (reports.ts:52) gerekçesiz değişiklik raporu etkileyebiliyordu.

**Karar:** Rapora veya SLA hesabına giren tarihler gerekçe ister: termin (`due`), aşama fiili başlangıç/bitiş (`actualStart`/`actualEnd`), karar tarihi (`decidedAt`). Bir kayıt **oluşturulurken** girilen ilk değer gerekçe istemez (henüz değişiklik yok); kayıt oluştuktan **sonra** bu alanlardan biri değişirse gerekçe zorunludur.

**Sonuçlar:**
- Olumlu: INV-06 artık hangi alanların kapsamda olduğunu açıkça listeler; create/update ayrımı netleşir, mevcut davranışla (plan tarihi, termin) tutarlı kalır.
- Olumsuz / kabul edilen risk: `actualStart`/`actualEnd`/`decidedAt` için gerekçe zorunluluğu F0-01 sözleşmesinde API katmanında yeni bir doğrulama olarak eklenecek; mockup bunu zorlamıyor (bilinçli fark, §4'e not edilir).
- Takip edilecek işler: `docs/INVARIANTS.md` INV-06 satırı güncellenir; F3-05 (karar düzenleme) ve F3 (PhaseDialog muadili) bu kuralı servis katmanında uygular.

**Etkilenen BACKLOG ID'leri:** REV-14, REV-M06-01/RUL-01, RUL-02 (m06), REV-M06-02/RUL-03, RUL-04 (m06).
**Hedef faz/görev:** F0-01 (sözleşmeye yazılır) → F3-05, F3 (PhaseDialog eşdeğeri), F4-01 (test boşlukları).

---

## K2 — RUL-05/RUL-07: tamamlanmış aşamada kapsama yeniden giren adım

**Bağlam:** Mockup'ta (`rules.ts`) bir adımın aşaması `done` iken kurulum tipi/LLM değişikliğiyle o adım tekrar kapsama girerse kural motoru adımı `out_of_scope → locked` yapıyor (RUL-05); bu adım akış motoru tarafından asla açılmadığı için sonsuza kadar kilitli kalıyor (INV-08 ihlali adayı). `reqdoc_not_shared` uyarısı da bu adım `locked` kaldığı sürece hiç üretilmiyor (RUL-07, m09b round 3). Bu, mockup'ın donmuş "Seçenek A" davranışıdır (bkz. `rules.ts:19` yorumu: "RUL-05 Seçenek A: step'in aşaması `done` iken aksiyon açar, idempotent").

**Karar:** İleri yön (adım kapsama giriyor) mockup'tan **bilinçli olarak farklı** hedef davranışla API'de uygulanır:
- Aşama `done` → `in_progress`'e döner (yeniden açılır).
- Adım `pending` olur (`locked` değil); `reqdoc_not_shared` uyarısı bu adım için normal çalışır.
  > **K11 ile netleştirildi (ADR-0005, 2026-10-06):** Kapsama yeniden giren adım normal akış kuralını izler. Öncesindeki zorunlu adımlar tamamsa `pending` olur (`activatedAt`, `due` iş günüyle), değilse `locked` olur. Aşama açık olduğu için akış motoru adımı sırası gelince açar. Uyarılar adım açıldığında normal çalışır.
- Aşamanın tamamlanma onayı/tarihi temizlenir; eski değerler audit'te kalır (silinmez, INV-03/INV-04). Audit gerekçesi sistem tarafından otomatik yazılır: "Kurulum tipi değişti: X→Y, `<adım>` kapsama girdi".
- Sonraki aşamaların durumu değişmez (geri kilitlenmez) — INV-25'teki "açılmış adım tekrar kilitlenmez" ilkesiyle tutarlı.

Ters yön (adım kapsamdan çıkıyor) **değişmez**: mockup'taki davranış kalır — `done` aşamaya ve `done` adıma dokunulmaz, aksiyon açılmaz.
> **Düzeltme (2026-10-06, ADR-0005, RR-F003):** Önceki metin "CSM'e `rule_review:<stepId>` ile 'Gözden geçir' aksiyonu açılır" diyordu. Bu mockup'ın davranışını yanlış anlatıyordu. Kodda `rule_review` yalnızca ileri yönde açılıyor; ters yönde açık bir review aksiyonu varsa yalnızca iptal ediliyor (`rules.ts:89-96, 134-138`). API'de ileri yön K2 ile aşamayı yeniden açtığı için kurulum/LLM kuralları `rule_review` üretmez.

**Sonuçlar:**
- Olumlu: INV-08 adayı açık kapatılır; `reqdoc_not_shared` boşluğu (RUL-07) kapanır; davranış INV-25/INV-26'nın "koşul bozulunca adım geri açılır" ilkesiyle hizalanır.
- Olumsuz / kabul edilen risk: Mockup'tan bilinçli sapma — mockup dondurulduğu için **değiştirilmez**; fark `docs/API_CONTRACT.md` §4'te ("bilinçli farklar") belgelenir. Aşama yeniden açılma + onay temizleme mantığı F0-01'de yalnızca sözleşme olarak yazılır, F1/F3 uygulama fazında servis katmanında gerçekleştirilir.
- Takip edilecek işler: `docs/INVARIANTS.md`'ye yeni INV satırı (aşama yeniden açılma kuralı); `docs/API_CONTRACT.md` kural kolonunda `applyInstallType`/`applyLlmChoice` hedef davranışı bu karara göre yazılır.

**Etkilenen BACKLOG ID'leri:** RUL-05 (m09b round 2), RUL-07 (m09b round 3), RUL-11 (m09a, idempotans testi), açık soru "A11" (m09b round 1: done ONPREM adımı SaaS'a geçince done kalıyor — bu K6'ya ait, K2 ile karıştırılmamalı).
**Hedef faz/görev:** F0-01 (sözleşmeye hedef davranış) → F1 (akış/kural servis katmanı), F3 (ilgili UI varsa).

---

## K3 — REV-04: Admin yetkisi

**Bağlam:** `docs/RBAC.md` Karar 1 "Admin tüm proje verisini **okur**; yazma yalnızca konfigürasyonda" diyor, ama mockup'ta `isAllSeeing` üzerinden admin 02/04/05 çalışma alanlarını fiilen düzenleyebiliyor ve AI önerisi onaylayabiliyor (REV-04, m09b/m09c round 1 açık soruları). Ayrıca Karar 4 "Proje oluşturma: CSM ve Manager" diyor, ama `canCreateProject` admin'e de izin veriyor.

**Karar:** Admin, proje verisinde **tam yazma yetkisine** sahiptir: çalışma alanları (aşama/adım/aksiyon/toplantı/risk/karar/doküman/erişim bilgisi vb.), AI öneri onayı, proje oluşturma dahil. Her admin yazması audit kaydında aktör rolü ayrıca "admin" olarak işaretlenir (actor role alanı zorunlu, mevcut aktör id'sine ek bilgi).

**Sonuçlar:**
- Olumlu: Mockup'ın fiili davranışı (REV-04, m09b/c round 1 açık soruları) ile RBAC.md artık çelişmiyor; "neden admin yazabiliyor" sorusu kapanır.
- Olumsuz / kabul edilen risk: Önceki "salt okuma" ilkesi bırakılıyor; audit'te aktör rolü ayrıca işaretlenmezse admin yazmaları diğer rollerden ayırt edilemez — bu nedenle işaretleme INV-05'e ek koşul olarak API_CONTRACT'a ve gerekirse INVARIANTS'a yazılmalı.
- Takip edilecek işler: `docs/RBAC.md` Karar 1 ve Karar 4 (ve ilgili satırlar: Müşteri/proje, Aşama, Adım/aksiyon vb. "Admin" kolonu R → R/C/U) güncellenir; F1-05 RBAC matris uygulamasında ve audit şemasında "actor role" alanı netleşir.

**Etkilenen BACKLOG ID'leri:** REV-04 (Faz M kapanış round 2-3), m09b round 1 açık soru ("Admin'in çalışma alanı yazma yetkisi RBAC.md Karar 1 ile çelişiyor"), m09b round 1 açık soru ("canCreateProject admin'e izin veriyor, RBAC Karar 4 ile uyumsuz"), m09c round 1 açık soru ("Admin isAllSeeing üzerinden 02/04/05 panellerini düzenleyebiliyor").
**Hedef faz/görev:** F0-01 (RBAC.md güncellemesi önkoşul) → F1-05 (RBAC matris uygulaması).

---

## K4 — S4: Toplantı Planlandı→Yapıldı ve held toplantı değişikliği

**Bağlam:** m09a RUL-07, `updateMeeting`'in `held` (Yapıldı) durumundaki bir toplantının `type`/`date` alanını gerekçesiz değiştirebildiğini işaretlemişti. Planlandı→Yapıldı geçişinin gerekçe isteyip istemediği de açık soruydu (m09c round 1: "istenen davranış mı, netleşmeli" — farklı konu, RUL-05 aksiyonu için; S4 burada toplantı durumuna özeldir).

**Karar:** Toplantı "Planlandı → Yapıldı" durum geçişi gerekçe **istemez** (bu bir ilerleme kaydı, geçmişe dönük değişiklik değil). Zaten "Yapıldı" (held) olan bir toplantının **tarihi veya türü** değişirse gerekçe **ister** (m09a RUL-07'nin işaret ettiği boşluk kapanır).

**Sonuçlar:**
- Olumlu: RUL-07 boşluğu kapanır; INV-06'nın "durum değişikliği" ve "tarih değişikliği" ayrımı toplantılar için netleşir.
- Olumsuz / kabul edilen risk: Yok. Mockup store bu kontrolü zaten zorluyor (`store.tsx:286-288`, testler `store.test.tsx:134, 154`). RUL-07 bulgusu kontrol eklenmeden önceki koda aitti. API_CONTRACT §4'te "fark yok" olarak yazılır.
  > **Düzeltme (2026-10-06, ADR-0005):** Önceki metin "Mockup bugün gerekçe istemiyor; API'de bilinçli fark" diyordu. Bu ifade koddan geride kalmıştı (gate round 1 reviewer/rules-reviewer notu).
- Takip edilecek işler: `docs/INVARIANTS.md` INV-06 satırına (veya ek satıra) toplantı tarih/tür değişikliği eklenir; F1/F3 (toplantı servis katmanı) uygular.

**Etkilenen BACKLOG ID'leri:** RUL-07 (m09a round 1).
**Hedef faz/görev:** F0-01 (sözleşme) → F1, F3 (toplantı güncelleme uç noktası).

---

## K5 — S6: Kilitli reqdoc adımının req_doc yüklenince tamamlanması

**Bağlam:** reviewer + rules-reviewer ortak açık sorusu (m09b round 1): kilitli `reqdoc` adımının `req_doc` dokümanı yüklenince doğrudan `done` olması mı, yoksa kilitli kalıp aşama açılınca mı tamamlanması gerektiği spec'ten çıkarılamıyordu. REV-05 (`setStepByKey` kilit kontrolü yapmıyor, Faz M kapanış) bu ayrımla bağlantılı.

**Karar:** Bugünkü davranış korunur: kilitli reqdoc adımı `req_doc` yüklenince hemen `done` olur. Ayrım şu şekilde netleşir: **veriye dayalı otomatik tamamlama** (ör. doküman yükleme, INV-26 "veriyle tamamlanan adım") kilidi **aşabilir**; **elle (manual)** bir değişiklik kilidi **aşamaz**. REV-05 (`setStepByKey` kilit kontrolü eksikliği) bu ayrıma göre not edilir: `setStepByKey` otomatik/veriye dayalı tamamlama yoluysa kilit kontrolü gerekmez, manuel bir yoldan çağrılıyorsa INV-25 ihlalidir.

**Sonuçlar:**
- Olumlu: S6 açık sorusu kapanır; INV-25 ("kilitli adımın durumu elle değişmez") ile INV-26 ("veriyle tamamlanan adım") arasındaki sınır API sözleşmesinde açık yazılır.
- Olumsuz / kabul edilen risk: Hangi tamamlama yollarının "veriye dayalı" sayılacağı F0-01'de fonksiyon bazında tek tek işaretlenmeli, yoksa ayrım belirsiz kalır. Bu yollar şunlardır: `addDocument` (`applyStepCompletion` üzerinden); `setStepByKey`'i çağıran `updateCommitment`, `approveGoLive`, `applyMeetingHeldRules` (`addMeeting`/`updateMeeting`), `addTeam`, `addTicket`, `applyInstallType`/`applyLlmChoice`. Tam liste API_CONTRACT §2.2'dedir. *(Düzeltme 2026-10-06, ADR-0005: önceki metin `setKickoff`'u anıyordu. Bu fonksiyon M-09b ile `Ctx`'ten kalktı.)*
- Takip edilecek işler: `docs/INVARIANTS.md`'ye INV-25/INV-26'ya ek açıklama veya yeni INV satırı ("kilit yalnızca elle değişikliği engeller, veriye dayalı otomatik tamamlamayı engellemez"); F0-01'de REV-05 notu; RUL-13 (m09a round 2: `addDocument`/`setKickoff` reqdoc'u `out_of_scope` kontrolü olmadan done yazıyor) bu ayrımla birlikte ele alınır. Bugün `setKickoff` yoktur. `addDocument` tamamlamayı `applyStepCompletion` ile yapar ve `out_of_scope` adımı atlar (`completion.ts:170`).

**Etkilenen BACKLOG ID'leri:** REV-05 (Faz M kapanış), RUL-13 (m09a round 2), m09b round 1 açık soru (S6), m09b round 1 açık soru ("Locked aşamada pending adım olabiliyor, INV-25'e yakın boşluk").
**Hedef faz/görev:** F0-01 (not + sözleşme) → F4-01 (`setStepByKey`).

---

## K6 — A11: Tamamlanmış adımın kurulum tipi değişince durumu

**Bağlam:** rules-reviewer açık soru (m09b round 1, "A11"): `done` olan ONPREM adımı (örn. `vpn_info`) SaaS'a geçince `done` kalıyor, ama `docs/PRODUCT_SPEC.md`'deki otomatik kurallar tablosu "Bu adımlar 'Kapsam dışı' olur" diyor — kod "tamamlanmış işi koru" davranışında, spec metniyle çelişiyor görünüyor.

**Karar:** Tamamlanmış (`done`) bir adım, kurulum tipi değişince `done` **kalır** — yapılmış iş silinmez/geri alınmaz. PRODUCT_SPEC'teki "Bu adımlar 'Kapsam dışı' olur" ifadesi yalnızca **henüz tamamlanmamış** (pending/in_progress/locked) adımlar için geçerlidir; `vpn_info` dahil, tamamlanmış herhangi bir adım bu kuraldan muaftır. PRODUCT_SPEC metni bu ayrımı netleştirecek şekilde düzeltilir.

**Sonuçlar:**
- Olumlu: A11 açık sorusu kapanır; kod davranışı (mockup'ın bugünkü hali) ile spec metni hizalanır, kod değişmez.
- Olumsuz / kabul edilen risk: Yok — bu, mevcut davranışın spec'e yazılmasıdır, API'de yeni bir kural gerekmez.
- Takip edilecek işler: `docs/PRODUCT_SPEC.md` "Otomatik kurallar" tablosundaki "Bu adımlar 'Kapsam dışı' olur" satırına "(henüz tamamlanmamış adımlar; done adım dokunulmaz)" notu eklenir.

**Etkilenen BACKLOG ID'leri:** m09b round 1 açık soru ("A11").
**Hedef faz/görev:** F0-01 öncesi (PRODUCT_SPEC düzeltmesi, bu ADR ile birlikte).

---

## K7 — m09b REV-07: Otomatik adımda AI önerisiyle out_of_scope

**Bağlam:** REV-07 (m09b round 1) `approveInsight`'ın otomatik adımdaki (`isAutoStep`) her `step_update`'i reddettiğini, `out_of_scope` önerisi dahil, işaretlemişti; bu, "AI önerisiyle otomatik adım kapsam dışı bırakılabilir mi" sorusunu açık bırakmıştı. REV-13 fix'i (fix/m06-insight-step-lock) sonrası `isAutoStep` erken reddi kaldırıldı ve kontrol `updateStep` → `manualStatusError`'a devredildi (REV-M13-01, "isAutoStep sapması").

**Karar:** REV-13 sonrası bugünkü davranış **kabul edilir**: otomatik adım AI önerisiyle `out_of_scope` yapılabilir, `done` yapılamaz (`manualStatusError` zaten `done` geçişini engelliyor, `out_of_scope`'u engellemiyor). REV-M13-01'in işaret ettiği sapma (davranış değişikliğinin değişiklik notunda belgelenmemiş olması) kabul edilmiştir; yalnızca belge notu olarak kapatılır, kod geri alınmaz.

**Sonuçlar:**
- Olumlu: m09b REV-07 ve REV-M13-01 açık soruları kapanır; `approveInsight`/`updateStep`/`StepDialog` arasında tek kural kaynağı (`manualStatusError`) olur (INV-20 ile tutarlı).
- Olumsuz / kabul edilen risk: Yok — mevcut kod davranışı onaylanıyor, değişiklik yok.
- Takip edilecek işler: `docs/reviews/BACKLOG.md`'de REV-M13-01/RUL-01 "planner kabul etti" notunun yanına "Murat onayı: ADR-0004 K7" eklenir.

**Etkilenen BACKLOG ID'leri:** REV-07 (m09b round 1), REV-M13-01/RUL-01 (fix/m06-insight-step-lock).
**Hedef faz/görev:** Belge (bu ADR) — kod değişikliği yok.
