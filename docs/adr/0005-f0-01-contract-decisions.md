# ADR-0005: F0-01 gate sonrası Murat kararları (K8–K20)

**Durum:** Kabul edildi
**Tarih:** 2026-10-06
**Hazırlayan:** planner (denetim oturumu) · **Onaylayan:** Murat

## Bağlam
`chore/f0-01-api-contract` gate round 1 (`docs/reviews/chore_f0-01-api-contract/`) sözleşmenin RBAC.md, INVARIANTS ve ADR-0004 ile çeliştiği ya da karar gerektirdiği noktaları buldu. Bunlar `docs/API_CONTRACT.md` §5'teki S-maddeleri ile REV-F001, RR-F001, RR-F002, RR-F004 ve RR-F007 bulgularıdır. Bu ADR, Murat'ın 2026-10-06 kararlarını tek yerde toplar. Hedef davranışı tanımlar: `docs/RBAC.md`, `docs/INVARIANTS.md` ve `docs/PRODUCT_SPEC.md` bu karara göre güncellendi. `docs/API_CONTRACT.md` builder `/fix` turunda bu ADR'ye göre düzeltilir (aşağıda "API_CONTRACT'a yansıtılacaklar").

Mockup dondurulmuştur ve değişmez (ADR-0004 bağlamı). Aşağıdaki kararlardan mockup'tan farklı olanlar yalnızca API'de uygulanır.

Numaralama: K8–K11 Murat'ın verdiği numaralardır. "K3 türevleri" bu ADR'de **K12**, "S8" de **K13** olarak numaralandı. Böylece BACKLOG'dan tek kimlikle referans verilebilir.

**Round 2 eki (2026-10-06):** Gate round 2 (@ 1d8f4d2) REV-F017 ile, sözleşmede "Murat onayı" dayanağı olmadan kapatılmış S10, S13, S15, S17 ve S18'i işaretledi. Murat bunları **K14–K18** olarak karara bağladı (aşağıda). Numaralar Murat'ındır.

**Round 3 eki (2026-10-07):** Gate round 3 (@ 4563ca2, MERGE'E HAZIR) iki denetçinin bağımsız bulduğu tek Medium bulguyu (REV-F023 = RR-F027) Murat kararına bıraktı. Murat seçenek (a)'yı seçti: **K19** (aşağıda). Aynı turun denetim oturumu işleri (REV-F026, REV-F027 / RR-F031) de bu ADR'de ve PRODUCT_SPEC'te kapatıldı. F0-02 planında (2026-10-07) Murat round 3 Low'u RR-F032'yi hedef davranış olarak onayladı: **K20**.

---

## K8 — S1: Manager'ın proje verisine yazması

**Bağlam:** RBAC.md Manager'a aşama, adım/aksiyon, toplantı/karar/risk, kişi, satış devri, KPI, doküman ve rapor satırlarında yalnızca R veriyordu. Mockup'ta ise `canManageProject` Manager'ı kapsıyor (`perm.ts:6-9`, `isAllSeeing`) ve Manager bu verilerin hepsini yazabiliyor (API_CONTRACT §5 S1, §4 "Manager yazma yetkisi").

**Karar:** Manager, ekibinin projelerinde CSM ile **aynı proje verisi yazma yetkisine** sahiptir. Bu, mockup davranışıdır.

**Kapsam yorumu (denetim notu — Murat onayladı, 2026-10-06):**
- **"Ekibinin projeleri" = tüm projeler.** Sistemde Manager–ekip eşlemesi yok. Spec "Manager tüm CSM'lerin süreçlerini ve tüm müşterileri görür" diyor, mockup da `isAllSeeing` ile tüm projeleri veriyor. İleride ekip modeli gelirse kapsam o zaman daraltılır.
- **Erişim bilgileri hariçtir.** Mockup Manager'a erişim bilgisi göstermiyor (`canSeeCredentials`), RBAC Karar 2 de Manager'ı saymıyor. "Mockup davranışı" kaydı bunu dışarıda bırakıyor.

**Sonuçlar:**
- Olumlu: Mockup ile RBAC.md arasındaki en geniş çelişki (S1) kapanır. Şu satırlarda Manager'a C/U gelir: aşama (onay ve yeniden açma dahil), adım/aksiyon, toplantı/karar/risk, kişiler, taahhüt/satış devri/lisans, doküman, KPI, destek kaydı, haftalık müşteri raporu, sağlık, keşif/takım/uyarlama, Go-Live onayı ve elle uyarı.
- Olumsuz / kabul edilen risk: Manager yazmaları audit'te ayrıca işaretlenmez, çünkü aktör rolü zaten `manager`. K3'teki "admin" işaretleme kuralı yalnızca Admin içindir.
- Takip: RBAC.md Manager kolonu güncellendi. PRODUCT_SPEC rol tablosu güncellendi.

**Etkilenen BACKLOG / bulgu:** API_CONTRACT §5 S1, Faz M REV-03 (Manager kısmı), REV-F002 (Manager artık `step:update` yetkisine de sahip; alan bazında yetki ayrımı yine de geçerli).

---

## K9 — REV-F001: DevOps'un erişim bilgisi oluşturması/güncellemesi

**Bağlam:** RBAC.md DevOps'a yalnızca "R(çözme endpoint'i) *atandığı proje*" veriyordu. Mockup'ta ise **her** DevOps erişim bilgisi ekleyebiliyor (`Phase2Tabs.tsx:178-182`, `perm.ts:29-32`). Sözleşme `credential:create`'i DevOps'a vermişti ve bu durum §4/§5'e yazılmamıştı (REV-F001, High).

**Karar:** DevOps erişim bilgisini **yalnızca atandığı projede** oluşturur ve günceller. Her işlem audit'lidir: oluşturma, güncelleme ve görüntüleme (değer audit'e yazılmaz, INV-11).

**Sonuçlar:**
- Olumlu: REV-F001 kapanır. Kurulumu yürüten DevOps, VPN/sunucu bilgisini kendisi girebilir. Kapsam "atandığı proje" ile sınırlı olduğu için mockup'taki "her DevOps" açığı (m09c round 1 açık sorusu) kapanır.
- Olumsuz / kabul edilen risk: Güncelleme ucu `Ctx`'te yok (§5 S12). Uç F4-04'te tanımlanır, yetki bu karara göre verilir.
- Takip: RBAC.md "Erişim bilgileri" satırı ve Karar 2 güncellendi. PRODUCT_SPEC 03 Kurulum ve rol tablosu güncellendi.

**Etkilenen BACKLOG / bulgu:** REV-F001, m09c round 1 açık soru (`canSeeCredentials` her DevOps), API_CONTRACT §5 S12 (yetki kısmı).

---

## K10 — RR-F007: Tamamlanmış aşamanın elle yeniden açılması

**Bağlam:** Mockup'ta `PATCH` ile `done → in_progress` yapılabiliyor (`ProjectDetail.tsx:569`), ama `approvedBy/approvedAt/actualEnd` eski değerleriyle kalıyor. Sonraki `completePhase` bu değerleri gerekçesiz eziyor (RR-F007). Gate güvenli varsayım olarak `409` önermişti.

**Karar:** Tamamlanmış aşama **elle yeniden açılabilir**.
- Yetki: CSM (*kendi*), Manager ve Admin.
- Gerekçe zorunludur (`400 REASON_REQUIRED`).
- Sonuçlar K2 ile aynıdır: sonraki aşamalar değişmez. Aşamanın tamamlanma onayı (`approvedBy`, `approvedAt`) ve tamamlanma tarihi (`actualEnd`) temizlenir, eski değerler audit'te kalır.

**Denetim notu (Murat onayladı, 2026-10-06):** Yeniden açma `done → in_progress` geçişidir. `done` aşamanın elle başka bir duruma (`not_started`, `out_of_scope`) geçirilmesi bu kararın kapsamında değildir. API'de güvenli varsayım olarak `409` döner (açık nokta, aşağıda).

**Sonuçlar:**
- Olumlu: RR-F007 kapanır. Kural kaynaklı (K2) ve elle yeniden açma tek bir değişmez kuralda toplanır (INV-28). Eskimiş onay verisi kalmaz.
- Olumsuz / kabul edilen risk: Gate direktifinin #9 maddesindeki "güvenli varsayım `409`" önerisi bu kararla geçersizleşir. API_CONTRACT #3 bu karara göre yazılır.
- Takip: INV-28 ve INV-06 güncellendi. RBAC.md "Aşama" satırı güncellendi. PRODUCT_SPEC "Aşama durumu" bölümü güncellendi.

**Etkilenen BACKLOG / bulgu:** RR-F007 (REV-F004 satırının yeniden açma kısmı).

---

## K11 — RR-F004: K2'de yeniden kapsama giren adımın akışı

**Bağlam:** ADR-0004 K2 ve INV-28, `done` aşamada kapsama yeniden giren adımın "`pending` olur (`locked` değil)" dediğini yazıyordu. Ancak INV-25'e göre adımı yalnızca akış motoru açar (bağlılık + iş günü termini). Aynı aşamada birden çok adım (ör. 03: `vpn_req`, `vpn_info`, `servers`, `devops_handover`) kapsama girdiğinde hepsinin birden `pending` olup olmayacağı belirsizdi (RR-F004, INV-25 ↔ INV-28 çatışması).

**Karar:** K2'yi netleştirir. Yeniden kapsama giren adım **normal akış kuralını** izler:
- Öncesindeki zorunlu adımlar tamamsa adım `pending` olur.
- Tamam değilse adım `locked` olur.

Aşama yeniden açıldığı (`in_progress`) için akış motoru adımı sırası gelince açar. Bu, bağlılık ve iş günü termini (`activatedAt`, `due`) ile normal açılıştır.

**Sonuçlar:**
- Olumlu: INV-25 ↔ INV-28 çatışması kalkar. Kapsama giren adımlar akış sırasını atlamaz. Açılan adımın termini her zaman iş günüyle hesaplanır (INV-13). `reqdoc_not_shared` ve öteki uyarılar adım açıldığında normal çalışır. Kilitliyken adım iş sayılmaz (INV-25).
- Olumsuz / kabul edilen risk: Yok. K2'nin "aşama yeniden açılır, onay temizlenir, sonraki aşamalar değişmez" sonuçları aynen geçerlidir.
- Takip: INV-28 ve ADR-0004 K2'ye netleştirme notu eklendi.

**Netleştirme (round 2, RR-F023 — Murat onayladı, 2026-10-06):** "Öncesindeki zorunlu adımlar tamamsa" ifadesi akış motorunun gerçek kuralı olarak okunur. Kapsama giren adım `locked` yapılır ve akış motoru aynı transaction'da normal kuralıyla açar: `independent` adım hemen; değilse aynı aşamada kendinden önceki, `out_of_scope` olmayan en yakın adım (zorunlu olsun olmasın) `done` ise ya da böyle bir adım yoksa. Termin akış motorunun iş günü kuralıyla hesaplanır (taban `max(startDate, bugün)`, `durationDays || 1`). Done aşama yolu, açık aşama yolu (INV-25) ve K16 aynı mekanizmayı kullanır. Bağlayıcı metin: INV-28.

**Etkilenen BACKLOG / bulgu:** RR-F004 (bağlılık sorusu), gate "Denetim oturumu / Murat" maddesi (INV-28 ↔ INV-25), RR-F023.

---

## K12 — K3 türevleri (S2, S3, S4): Admin'in rapor ve CSM ataması yetkisi

**Bağlam:** ADR-0004 K3, Admin'e proje verisinde tam yazma verdi. Ancak RBAC.md'de üç satır bununla uyumsuz kaldı:
- Haftalık müşteri raporu: Admin "—" (S2).
- İç yönetim raporu: yalnızca Manager (S3).
- CSM ataması: mockup'ta `canAssignCsm` yalnızca Manager'a izin veriyor; Admin proje oluştururken CSM seçemiyor (S4).

**Karar:** Admin şu yetkiler dahil tam yazma yetkisine sahiptir:
- Haftalık müşteri raporu oluşturma, düzenleme ve gönderildi işaretleme (S2).
- İç yönetim raporu (S3).
- CSM ataması, proje oluştururken CSM seçme dahil (S4).

**Sonuçlar:**
- Olumlu: K3 ile RBAC.md tutarlı hale gelir. Admin'in oluşturduğu projede CSM boş kalmaz.
- Olumsuz / kabul edilen risk: Mockup'tan fark: `canAssignCsm` Admin'i dışlıyor ve Admin `csmId: null` ile proje oluşturuyor. API'de Admin CSM atar.
- Takip: RBAC.md "Müşteri, proje", "Haftalık müşteri raporu" ve "İç yönetim raporu" satırları güncellendi.

**Etkilenen BACKLOG / bulgu:** API_CONTRACT §5 S2, S3, S4. Faz M REV-03 (`canEditReport` rol kararı; Manager kısmı K8 ile kapandı).

---

## K13 — S8: INV-06 kapsamı (plan tarihleri, Go-Live, sağlık)

**Bağlam:** INV-06 (ADR-0004 K1) gerekçe isteyen tarih alanları olarak `due`, `actualStart`/`actualEnd` ve `decidedAt`'i sayıyordu. Spec ise "Hedef tarih değiştirilirken gerekçe zorunlu" diyor. Mockup UI'ı `planStart`/`planEnd` ve sağlık değişikliği için gerekçe istiyor. `goLiveDate` yalnızca AI önerisiyle (gerekçeli) değişiyor (API_CONTRACT §5 S8).

**Karar:** Şu değişiklikler de gerekçe ister ve INV-06 / K1 kapsamına eklenir:
- Aşama plan tarihleri (`planStart`, `planEnd`).
- Go-Live tarihi (`goLiveDate`).
- Proje sağlığı (`health`).

K1'in oluşturma istisnası geçerlidir: kayıt oluşturulurken girilen ilk değer gerekçe istemez.

**Sonuçlar:**
- Olumlu: Rapora, baseline sapmasına ve uyarılara giren tüm tarih ve sağlık değişiklikleri history'de gerekçeli olur. Mockup UI'ı ile API aynı kuralı uygular (UI-only gerekçe → API zorlar).
- Olumsuz / kabul edilen risk: Yok.
- Takip: INV-06 güncellendi. PRODUCT_SPEC "Aşama durumu ve proje sağlığı" ile "History" güncellendi.

**Etkilenen BACKLOG / bulgu:** API_CONTRACT §5 S8, gate "Denetim oturumu / Murat" maddesi (INV-06 kapsamı: S8).

---

## K14 — S10: `commit_check` tek yönlüdür

**Bağlam:** `updateCommitment` (#12), projede açık taahhüt kalmayınca `commit_check` adımını `done` yapar. Taahhüt yeniden açılırsa adımın geri açılıp açılmayacağı sözleşmede "mockup davranışı korunur" diye, Murat onayı olmadan kapatılmıştı (API_CONTRACT §5 S10, REV-F017).

**Karar:** `commit_check` tek yönlüdür. Açık taahhüt kalmayınca adım `done` olur. Taahhüt yeniden açılsa da adım `done` kalır. Bu, ADR-0004 K6 ile tutarlıdır (`done` adıma kural dokunmaz).

**Sonuçlar:**
- Olumlu: Mockup davranışı; §4'te fark yok.
- Olumsuz / kabul edilen risk: Yeniden açılan taahhüt `commit_check` üzerinden görünmez. Go-Live'da açık taahhüt kontrolü #38'de ayrıca yapılır (mockup davranışı, store.tsx:517-518). `commit_check`'in açık taahhüt varken elle `done` yapılması API_CONTRACT §5 S22'dedir (S23 açılmadı, S22'ye katıldı; aşağıda "Açık kalanlar").
- Takip: API_CONTRACT §5 S10 dayanağı "ADR-0005 K14" olur (builder `/fix`).

**Etkilenen BACKLOG / bulgu:** REV-F017 (S10).

---

## K15 — S13: `updateContact` ucu

**Bağlam:** Mockup'ta `updateContact` işlemi var ama çağıran ekran yok (API_CONTRACT #10, §5 S13).

**Karar:** `PATCH /contacts/:id` sözleşmede tanımlıdır. Ekran F3-04'te eklenir.

**Sonuçlar:**
- Olumlu: Uç ve yetkisi (`contact:update`) baştan sözleşmede; F3-04 yalnızca ekranı ekler.
- Olumsuz / kabul edilen risk: Yok.
- Takip: API_CONTRACT §5 S13 dayanağı "ADR-0005 K15" olur (builder `/fix`). F3-04 planı ekranı kapsar.

**Etkilenen BACKLOG / bulgu:** REV-F017 (S13).

---

## K16 — S15: Tamamlanmış 05 (Uyarlama) aşamasına takım ekleme

**Bağlam:** `addTeam` (#14), 05 `done` iken yeni `adapt:<takım>` adımını `out_of_scope` oluşturup CSM'e `rule_review:<stepId>` "Gözden geçir" aksiyonu açıyor (mockup `ensureReviewAction`, rules.ts:19-21). Sözleşme bunu mockup gibi bırakmış ve dayanak olarak yanlışlıkla INV-28'i göstermişti (API_CONTRACT §5 S15, REV-F017).

**Karar:** Tamamlanmış 05 aşamasına takım eklenirse aşama **K2 gibi yeniden açılır**. Bu, INV-28'e üçüncü tetiktir. Bu durumda `rule_review` aksiyonu **açılmaz**.
- Yeni `adapt:<takım>` adımı kapsama giren adımdır ve K11 akış kuralını izler.
- Ortak sonuçlar INV-28 ile aynıdır: onay (`approvedBy`, `approvedAt`) ve `actualEnd` temizlenir, eski değerler audit'te kalır; sonraki aşamalar değişmez; proje kilidi altında (INV-08).
- Gerekçe sistemce yazılır, `Otomatik kural:` önekiyle (ör. "Takım eklendi: `<takım>`, `adapt:<takım>` kapsama girdi").
- **Proje canlıyken (Murat, 2026-10-06):** 07 `done` ise `addTeam` `409` döner; 05 yeniden açılmaz.
- 05 `out_of_scope` ise mockup gibi: adım `out_of_scope` oluşur, aşama açılmaz.

**Sonuçlar:**
- Olumlu: Tamamlanmış aşamaya iş eklenmesi tek mekanizmayla (INV-28) ele alınır. API'de `rule_review` üreten kural kalmaz.
- Olumsuz / kabul edilen risk: **Mockup'tan bilinçli fark** (mockup aşamayı açmaz, `rule_review` açar). Yalnızca API'de uygulanır; mockup değişmez.
- Takip: INV-28 tetik listesine (c) eklendi. API_CONTRACT #14, §4 (mockup farkları) ve §5 S15 bu karara göre yazılır (builder `/fix`). #16 ve §4'teki "`rule_review` üreten tek kural #14 `addTeam`" ifadeleri kalkar.

**Etkilenen BACKLOG / bulgu:** REV-F017 (S15).

---

## K17 — S17: CSM değişince açık işlerin sahipliği

**Bağlam:** CSM ataması (#2c) mockup'ta mevcut adım ve aksiyon sahiplerini yeni CSM'e aktarmıyor. Sözleşme bunu Murat onayı olmadan "mockup davranışı korunur" diye kapatmıştı (API_CONTRACT §5 S17, REV-F017).

**Karar:** Projenin CSM'i değişince, eski CSM'e ait **açık** adım ve aksiyonların sahibi yeni CSM olur.
- Açık: durumu `done` ya da `cancelled` olmayan kayıt.
- Tamamlanan (`done`/`cancelled`) kayıtların sahibi değişmez.
- Her aktarım audit'e yazılır (kayıt başına, `ownerId` eski → yeni).
- Aktarım, CSM atamasıyla aynı transaction'da yapılır.

**Sonuçlar:**
- Olumlu: CSM değişince eski CSM'in listelerinde öksüz iş kalmaz.
- Olumsuz / kabul edilen risk: **Mockup'tan bilinçli fark.** Yalnızca API'de uygulanır; mockup değişmez.
- Takip: API_CONTRACT #2c, §4 (mockup farkları) ve §5 S17 bu karara göre yazılır (builder `/fix`). Uygulama F3-01.

**Etkilenen BACKLOG / bulgu:** REV-F017 (S17).

---

## K18 — S18: Kural kaynaklı aksiyonların elle düzenlenmesi

**Bağlam:** Kural kaynaklı aksiyonlar (`phase_approval:*`, LLM `ruleKey`'leri vb.) mockup'ta elle düzenlenebiliyor. Sözleşme bunu Murat onayı olmadan kapatmıştı (API_CONTRACT #7, §5 S18, REV-F017).

**Karar:** Kural kaynaklı aksiyonlar elle düzenlenebilir: termin, sahip ve durum. Her değişiklik audit'lidir (INV-06 gereken alanlarda gerekçeli). Kural motoru idempotenttir ve aynı aksiyonu (`ruleKey`) çift açmaz.

**Sonuçlar:**
- Olumlu: Mockup davranışı; §4'te fark yok.
- Olumsuz / kabul edilen risk: Elle kapatılan kural aksiyonu, kural yeniden değerlendirildiğinde motorun kuralına göre yeniden açılabilir (ör. `phase_approval`); bu bilinçli ve idempotenttir.
- Takip: API_CONTRACT §5 S18 dayanağı "ADR-0005 K18" olur (builder `/fix`).

**Etkilenen BACKLOG / bulgu:** REV-F017 (S18).

---

## K19 — REV-F023 / RR-F027: Daha önce açılmış aşamanın kapsam dışından geri alınması

**Bağlam:** Round 2'de (REV-F013, RR-F020) `out_of_scope`'tan elle kapsama dönen aşamanın doğrudan açılmaması, `locked` olup akış motoruyla açılması kararlaştırıldı (API_CONTRACT §1, #3). Bu kural, daha önce açılmış (`activatedAt` dolu) bir aşamada yan etki üretiyor. Aşama `locked` olurken içindeki açık (`pending`/`in_progress`) adımlar açık kalıyor. Bu adımlar uyarı üretiyor ve iş listelerinde görünüyor, ama aşaması kilitli olduğu için sahipleri adımı elle değiştiremiyor (INV-25). Gate round 3 iki seçenek sundu (`docs/reviews/chore_f0-01-api-contract/SUMMARY.md`):
- **(a)** reviewer önerisi: aşama `locked` olur, içindeki açık adımlar da `locked` olur.
- **(b)** rules-reviewer önerisi: `activatedAt` dolu aşama doğrudan `in_progress` olur; `activatedAt` boş aşama `locked` olur ve akışla açılır.

**Karar (Murat, 2026-10-07): seçenek (a).** Daha önce açılmış (`activatedAt` dolu) aşama `out_of_scope`'tan elle kapsama dönünce (#3 `out_of_scope → in_progress`):
- Aşama `locked` olur.
- Aşamadaki açık (`pending`/`in_progress`; flow.ts:7 `isOpenStep`) adımlar aynı transaction'da `locked` olur. Adımların `activatedAt` ve `due` alanları temizlenir; eski değerler alan başına audit'te kalır (INV-03/INV-04). Gerekçe sistemce, `Otomatik kural:` önekiyle yazılır.
- `done` ve `out_of_scope` adımlar değişmez.
- Akış motoru aynı transaction'da, proje kilidi altında (INV-08) normal yüklemiyle çalışır: önceki aşama yoksa, aşama `independent` ise ya da önceki aşama geçilmişse (`done`/`out_of_scope`) aşamayı hemen açar (flow.ts:37; REV-F028b). Değilse aşama `locked` kalır ve sırası gelince açılır.
- **Yeniden açılış** akış motorunun normal açılışıdır, ayrı bir dal yoktur:
  - Aşama: `activatedAt = now`. `actualStart` korunur (flow.ts:38).
  - Adımlar: K11 ile aynı mekanizma. Adım normal akış kuralıyla açılır, `activatedAt = now` olur, `due` akış motorunun iş günü kuralıyla yeniden hesaplanır (taban `max(startDate, bugün)`, `durationDays || 1`; flow.ts:50, 61-62; INV-13). Eski `due` geri gelmez.
- `activatedAt` boş (hiç açılmamış) aşamada davranış değişmez: aşama `locked` olur ve akışla açılır. Adımları zaten `locked` ya da `out_of_scope`'tur.

**Reddedilen alternatif — (b) "doğrudan `in_progress`":**
- Aşama sırası atlanırdı. Önceki aşama açıkken, yalnızca geçmişte açılmış olduğu için aşama yeniden açılırdı. Bu, INV-25'in "adım/aşama yalnızca akış motoru açar (bağlılık)" ilkesiyle çelişir.
- Kapsama dönüş iki mekanizmayla işlerdi (`activatedAt`'e göre dal). Adımda (RR-F002, K11) ve hiç açılmamış aşamada kural "`locked` + akış"tır; (b) aşama için ayrı bir yol açardı.
- Adımlar eski `due` ile açık kalırdı. Aşama kapsam dışındayken geçen süre gecikme sayılır, dönüş anında "Geciken" ve uyarı üretilirdi.
- (b)'nin artıları kabul edildi ama belirleyici bulunmadı: INV-25 "açılmış adım tekrar kilitlenmez" ilkesine istisnasız uyum, completion.ts:198-206 emsali ve spec B.1'in değişmemesi.

**Sonuçlar:**
- Olumlu: REV-F023 / RR-F027 kapanır. Kilitli aşamada açık adım kalmaz. Kilitli adım iş sayılmadığı için (INV-25) uyarı, gecikme ve Bana Atananlar kaydı oluşmaz. "Elle değiştirilemeyen ama iş sayılan adım" çelişkisi kalkar. Aşama ve adımın kapsama dönüşü tek mekanizmayla (`locked` + akış) işler.
- Olumsuz / kabul edilen risk:
  - INV-25'in "açılmış adım tekrar kilitlenmez" ilkesine **tek istisna** gelir. Spec B.1 (:322) buna göre güncellendi.
  - Adımların eski `activatedAt`/`due` değerleri kaybolur (audit'te kalır). Yeniden açılan adımın termini, açıldığı güne göre yeniden hesaplanır.
  - **Mockup'tan bilinçli fark:** mockup aşamayı doğrudan `in_progress` yapar ve adımlara dokunmaz (store.tsx:236-245). Yalnızca API'de uygulanır; mockup değişmez.
  - Sonraki aşamalar geri kilitlenmez (ör. 03 geri alınınca, 03'ün `out_of_scope` olmasıyla açılmış 04 açık kalır). Bu bilinçli tercih F3-02 planına yazılır.
  - Kapsamda kalmayan iki konu bu kararın dışındadır: ters yön (aşama `in_progress → out_of_scope` olunca içindeki açık adımlar, alerts.ts:50, 61; F6 öncesi açık soru) ve aşama `out_of_scope` olunca açık `phase_approval` aksiyonunun kapanması (RR-F032 → K20).
- Takip:
  - INV-25'e istisna eklendi. PRODUCT_SPEC B.1 güncellendi.
  - API_CONTRACT §1 (:22), #3 (:74) ve §4 (:228) bu karara göre builder takip turunda yazılır. Yüklemde "önceki aşama yoksa" dalı yer alır (REV-F028b). #3 Doğrulama notu: 03 açıkken `vpn_req` `pending` → 03 `out_of_scope` → 02 K10 ile açılır → 03 geri alınır → 03 ve `vpn_req` `locked`, uyarı ve Bana Atananlar kaydı yok; 02 geçilince `vpn_req` yeni `activatedAt` ve iş günü termini ile `pending` olur. Ek: 00 geri alınınca hemen açılır.
  - Uygulama F3-02 (akış motoru).

**Etkilenen BACKLOG / bulgu:** REV-F023 / RR-F027, REV-F028b (yüklem kısmı).

---

## K20 — RR-F032: Aşama kapsam dışı olunca açık "Aşama onayı bekliyor" aksiyonu

**Bağlam:** Akış motoru, zorunlu adımları tamamlanan açık aşama için CSM'e `phase_approval:<phaseId>` ("Aşama onayı bekliyor") aksiyonu açar. Bu aksiyonu yalnızca iki durumda kapatır: aşama `done` olunca (`done`) ya da aşama açıkken zorunlu bir adım yeniden açılınca (`cancelled`) (flow.ts:83-84). Hazır bir aşama elle `out_of_scope` yapılınca bu iki koşul da tetiklenmez. Aşama artık aktif değildir (`isActivePhase` false), bu yüzden aksiyon `open` kalır (flow.ts:83-85; API_CONTRACT #3). Sonuç: kapsam dışı aşama için onay bekleyen bir aksiyon CSM'in iş listesinde, uyarılarda ve gecikmelerde görünmeye devam eder. K19 bu maddeyi kapsamı dışında bırakmıştı (RR-F032, gate round 3 Low).

**Karar (Murat, 2026-10-07):** Aşama `out_of_scope` yapılınca (#3 `→ out_of_scope`) aşamanın açık (`open`/`in_progress`) `phase_approval:<phaseId>` aksiyonu aynı transaction'da `cancelled` olur.
- Gerekçe sistemce yazılır: `Otomatik kural: aşama kapsam dışı`.
- Audit alan başına yazılır (`status`: eski → `cancelled`; INV-05).
- Proje kilidi altında yapılır (INV-08; #3 zaten kilit listesinde).
- Aşama daha sonra kapsama döner ve yeniden hazır olursa iptal edilen aksiyon geri açılmaz. Akış motoru **yeni** bir aksiyon açar (`ruleKey` ile idempotent; API_CONTRACT #3 RR-F025 ile aynı kural).
- `done` ya da `cancelled` olan `phase_approval` aksiyonlarına dokunulmaz.

**Sonuçlar:**
- Olumlu: RR-F032 kapanır. Kapsam dışı aşama için iş listesinde, uyarıda ve gecikmede onay işi kalmaz (INV-25 "iş sayılmaz" ilkesiyle tutarlı). K19 ile birlikte kapsam dışına çıkış ve kapsama dönüş, `phase_approval` açısından kendi içinde tutarlı olur: dönüşte aşama `locked` olur, aksiyon zaten kapanmıştır, aşama yeniden hazır olunca yeni aksiyon açılır.
- Olumsuz / kabul edilen risk: **Mockup'tan bilinçli fark** (mockup aksiyonu açık bırakır, flow.ts:83-85). Yalnızca API'de uygulanır; mockup değişmez. İptal edilen aksiyonun elle verilmiş termin/sahip bilgisi yeni aksiyona taşınmaz (eski kayıt ve audit'te kalır).
- Kapsam dışı (ayrı açık soru): aşama `out_of_scope` olunca içindeki açık **adımların** durumu (alerts.ts:50, 61; F6 öncesi). Bu karar yalnızca `phase_approval` aksiyonunu kapsar.

**Takip:**
- API_CONTRACT #3 (`→ out_of_scope` hedef davranışı + Doğrulama) ve §4 (mockup farkı satırı). Dayanak "ADR-0005 K20 (Murat onayı, 2026-10-07)". Builder F0-02 Bölüm C'de yazar; §5.1'de S26 açılmaz.
- Doğrulama (BE): hazır aşama (zorunlu adımlar tamam, `phase_approval` açık) `out_of_scope` yapılır → aksiyon `cancelled`, audit gerekçesi `Otomatik kural: aşama kapsam dışı`. Aşama geri alınıp yeniden hazır olunca yeni `phase_approval` açılır, iptal edilen `cancelled` kalır.
- Uygulama F3-02 (akış motoru).

**Etkilenen BACKLOG / bulgu:** RR-F032 (chore/f0-01-api-contract round 3), K19 "Sonuçlar" maddesindeki "(RR-F032, açık)".

---

## Bu ADR ile birlikte yapılan değişmez kural netleştirmeleri

Bunlar yeni karar değildir. Gate bulgularının mevcut kurallara göre netleştirilmesidir.
- **INV-25 (RR-F002):** Aşaması `locked` olan adımın durumu elle değişmez. Adımın kendisi `out_of_scope` olsa bile elle `pending`, `in_progress` veya `done` yapılamaz (`409`). `out_of_scope`'tan elle geri alınan adım K11'deki akış kuralına tabidir. AI `step_update` onayı da elle değişiklik sayılır (INV-21: mevcut servis üzerinden). *Yorum (Murat onayladı, 2026-10-06):* Kapsam dışından dönen ve sırası gelmediği için `locked` olan adım, "açılmış adım tekrar kilitlenmez" kuralının ihlali sayılmaz; bu yeni bir kapsama giriştir (K11 ile aynı mantık).
- **INV-08 (RR-F001):** Aşama tamamlama, aşama yeniden açma ve adım durumunu ya da `required` alanını değiştiren her yazma aynı proje kilidi altında çalışır: `projects` satırı `FOR UPDATE`, transaction'ın ilk kilidi. Kilit sırası INV-08'de yazılıdır.
  - *Round 2 eki (planner önerisi, Murat onayladı, 2026-10-06):* Aşamaya adım ekleyen yazmalar da (`addTeam` ile `adapt:<takım>`, `saas_env` oluşturma ve benzeri) aynı kilit altındadır. Gerekçe: `completePhase(05) ∥ addTeam` yarışında yeni zorunlu adım açıkken `done` aşama oluşabilir (K16 ile birlikte). INV-08 test sütununa bu yarış eklendi.
- **INV-28 / ADR-0004 K2 ters yön (RR-F003):** Önceki metin ters yönde "CSM'e Gözden geçir aksiyonu açılır" diyordu. Bu, mockup'ın davranışını yanlış anlatıyordu: kodda ters yönde aksiyon açılmıyor, yalnızca açık bir review aksiyonu varsa iptal ediliyor (`rules.ts:89-96, 134-138`). Kararın özü değişmedi ("tamamlanmış aşamaya dokunulmaz"). Metin koda göre düzeltildi: `done` aşamaya ve `done` adıma dokunulmaz, aksiyon açılmaz.
- **INV-28 round 2 (RR-F019, RR-F023 — Murat onayladı, 2026-10-06; planner önerisiyle):**
  - Tetikler: (a) kural, (b) elle (K10), (c) tamamlanmış 05'e takım ekleme (K16).
  - "done kalır" yalnızca yeniden açma işleminin kendisi içindir: bu işlem hiçbir adımın durumunu değiştirmez (kapsamdan çıkan `done` adımlar dahil, K6). Ardından aynı transaction'da INV-26 ve INV-25 normal çalışır. Manuel adımlar `done` kalır. Koşulu bozulmuş veri/toplantı adımı `activatedAt` doluysa `pending` olur ve termini eski `due` kalır (mockup gibi); boşsa `locked` olur. Yeniden açılmayan aşamalara dokunulmaz.
  - K11 yüklemi akış motorunun kuralıdır (K11 netleştirmesi).
  - API'de hiçbir kural `rule_review` üretmez.

## RBAC.md'ye eklenen satırlar (Murat onayladı, 2026-10-06)
Mockup davranışından türetilen beş satır onaylandı: elle uyarı ekleme (S5); keşif cevapları, takımlar, takım bilgisi (S6); uyarlama kontrol listesi (S6); Go-Live müşteri onayı (S7); oturum öncesi uçlar (S16). Ayrıntı: `docs/RBAC.md` Karar 9.

## Açık kalanlar (API_CONTRACT §5.1'de güvenli varsayımla)
Numaralar API_CONTRACT §5.1 ile aynıdır (REV-F026 ile hizalandı, 2026-10-07).
- **S20 — Kuralla atanan adım/aksiyon sahibi (RR-F012):** "Projenin DevOps'u" mu, yoksa "null + CSM'e atama aksiyonu" mu? Güvenli varsayım: `ownerId: null` + CSM'e "Sahip ata" aksiyonu. Her durumda yalnızca aktif kullanıcı atanır.
- **S21 — INV-06 durum geçişi istisnası (REV-F004, REV-F016):** Şu sekiz geçişin gerekçesiz olması henüz karara bağlanmadı: #4 `completePhase`, #34 `markReportSent`, #36 `updateUser.active`, #13 `noCommitments`, #41 `disconnect`, #43 takip `active` aç/kapa, #45/#46 öneri reddi, #48 eşleşmeyen e-posta `→ ignored`.
- **S22 — Go-Live manuel adımlarının hedefi (RR-F008, RR-F022):** `gonogo`: mockup gibi manual ve tek yönlü. `customer_approval`: yalnızca #38 ile `done`; elle `done` → `409`, `out_of_scope` serbest. `commit_check`: açık taahhüt varken elle `done` → `409`.
- **K10 kapsamı dışı:** `done` aşamanın elle `not_started` ya da `out_of_scope` yapılması. Güvenli varsayım: `409` (Murat bu varsayımı onayladı, 2026-10-06; ayrı karar gerekirse yeniden açılır).

**S-maddesi numaralandırma kaydı (Murat, 2026-10-06, F0-01 `/fix` oturumu; kaynak `docs/changes/chore_f0-01-api-contract.md:23`):**
- **S23** (RR-F022, gate round 2'de ayrılmıştı) açılmadı, S22'ye katıldı. Madde kapanmadı; S22'de güvenli varsayımla açık.
- **S25** (`not_started` elle seçilemez) açılmadı. INV-25'in sonucu olarak #3'e yazıldı (`409`).

## API_CONTRACT'a yansıtılacaklar (builder `/fix`, `docs/API_CONTRACT.md`)
Bu liste gate direktifinin (`SUMMARY.md`) ilgili maddelerini **geçersiz kılar**:
- **Direktif #1 (REV-F001):** `credential:create` (ve ileride `credential:update`) → CSM *kendi* · DevOps *atandığı proje* · Admin. Gate'in önerdiği "DevOps ekleyemez" varsayımı ve önerilen S20 maddesi **yazılmaz**. §4'e "mockup: her DevOps → API: yalnızca atandığı proje" farkı eklenir.
- **Direktif #9 (RR-F007):** #3'te `done` aşama için `409` yerine K10 yazılır: `done → in_progress` gerekçeli, yetki CSM *kendi*/Manager/Admin, onay/`actualEnd` temizlenir, sonraki aşamalar değişmez, proje kilidi altında. Öteki hedef durumlar `409` döner.
- **Direktif #14 (RR-F004):** Bağlılık için §5 maddesi açılmaz. K11 yazılır: kapsama giren adım akış kuralına göre `pending` (`activatedAt`, `due` iş günüyle) ya da `locked` olur.
- **§1.1 kataloğu ve §4/§5:**
  - S1 → K8: Manager tüm proje-içi yazma aksiyonlarında yer alır. Erişim bilgisi hariç.
  - S2, S3, S4 → K12.
  - S5, S6, S7, S16 → RBAC.md satırları.
  - S8 → K13.
  - §4'teki "Manager yazma yetkisi", "Haftalık müşteri raporu" ve "İç yönetim raporu" satırları "fark yok (mockup gibi)" olur.
  - §4'e yeni fark eklenir: "CSM ataması: mockup yalnızca Manager, API Manager + Admin (K12)".

## Round 2 — API_CONTRACT'a yansıtılacaklar (builder `/fix`)
Gate round 2 direktifinin (`SUMMARY.md`) madde 8'ini (REV-F017) **geçersiz kılar**. S10/S13/S15/S17/S18 §5.1'e geri taşınmaz:
- **S10, S13, S18:** §5.2'de (kapandı) kalır. Dayanak sütunu "Murat onayı, ADR-0005 K14 / K15 / K18 (2026-10-06)" olur.
- **S15:** Hedef davranış K16 yazılır (#14 `addTeam`: 05 `done` ise aşama INV-28 (c) ile yeniden açılır, `rule_review` açılmaz). Dayanaktaki eski INV-28 referansı "ADR-0005 K16, INV-28 (c)" olur. §4'e mockup farkı satırı eklenir. #16 ve §4'teki "`rule_review` üreten tek kural #14" ifadeleri kaldırılır.
- **S17:** Hedef davranış K17 yazılır (#2c: eski CSM'in açık adım/aksiyonları yeni CSM'e, kayıt başına audit). Dayanak "ADR-0005 K17" olur. §4'e mockup farkı satırı eklenir.
- **INV-28 metni** (RR-F019 "done kalır" kapsamı, RR-F023 K11 yüklemi): `docs/INVARIANTS.md` INV-28'deki güncel metin esas alınır. Gate direktifi madde 3 (RR-F019) bu metinle uyumludur; S24 açık madde olarak değil, §5.2'ye (kapandı) dayanağı "INV-28 (Murat onayı, 2026-10-06)" ile yazılır. Ek: yeniden açılan veri adımının termini eski `due` kalır. RR-F023 (Low) bu turda yazılır: #3, #16 ve §4'teki K11 yüklemi akış motoru kuralına bağlanır; #16'daki `addBusinessDays(bugün, durationDays)` ifadesi motorun tabanına (`max(startDate, bugün)`, `durationDays || 1`) göre düzeltilir.
- **#14 `addTeam` (K16):** proje kilidi listesine girer (INV-08 round 2 eki); `saas_env` oluşturan #16 yolu da öyle. 07 `done` ise `409`. Doğrulama: 05 done → takım ekle → 05 `in_progress`, `adapt:<takım>` `pending`, `rule_review` yok; 07 done → 409.

## Süreç notu — REV-F022 (Murat, 2026-10-06)
ADR-0005 ve bu ADR ile yapılan RBAC.md / INVARIANTS.md / PRODUCT_SPEC.md değişiklikleri `chore/f0-01-api-contract` branch'iyle birlikte merge edilir. Ayrı `chore/` branch'i açılmaz; Murat bu bağımlılığı kabul etti. REV-F022'nin CLAUDE.md denetim yazma listesi ve `guard.mjs` PRODUCT_SPEC kısmı F0-02'de yapılır (Murat, 2026-10-06).
