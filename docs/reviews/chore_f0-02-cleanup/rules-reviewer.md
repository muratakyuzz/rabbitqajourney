## rules-reviewer — chore/f0-02-cleanup @ b936fb7 (round 2, kapsam 7702f01..HEAD)
**Karar:** APPROVE

Engelleyen bulgu yok. RUL-01 kapandı. Round 2 diff'i hiçbir kuralın davranışını değiştirmiyor. Ancak Date sabitlemesi, daha önce tesadüfen görünen iki kural boşluğunu artık gizliyor: biri Medium (BACKLOG'a), biri Low. Referans tarih için bir Low öneri daha var.

**Kapsam:** `git diff 7702f01..HEAD` (6 commit). İncelenen dosyalar:
- `docs/API_CONTRACT.md`: #29 ve §2.2
- `completion.test.ts` ve `ProjectDetail.tabs.test.tsx`: sabitleme diff'i
- Bağlam için: `alerts.ts` (`computeAlerts` §6 ve §13, `weekStartOf`), `reports.ts:26-57`, `business-days.ts` (`addBusinessDays`), `seed.ts` (`localToday`, `kickoffAgoDate`, mutlak tarihler), değişiklik notunun "CI düzeltmeleri" bölümü

`.gitleaksignore` bu ajanın alanı değil. Testler koşulmadı (salt okunur); 213/213 ve `TZ=UTC` sonuçları builder notundan alındı, qa-verifier bağımsız koştu. DB yok, bu yüzden pg-mem ve parity bu branch'te geçerli değil.

### 1. RUL-01 doğrulaması
| Kontrol | Beklenen | Durum |
|---|---|---|
| `grep -rn support_track src/` | Uygulama kodunda yok | ✔ Yalnızca iki koruma testi: `store.test.tsx:585` (AC17 no-op guard) ve `completion.test.ts:589-593` (S7, şablonda ve seed'de yok). `store.tsx` boş |
| #29 (`API_CONTRACT.md:100`) | Kodla ve REV-07 ile tutarlı | ✔ "Mockup'taki no-op `support_track` kuralı F0-02'de kaldırıldı (REV-07); API'de karşılığı yok". `high` öncelik → `Alert` cümlesi korunmuş |
| §2.2 satırı (`:138`) | Tablonun anlamı bozulmamalı | ✔ Kabul edilebilir. Satır "—" sütunlarla ve "Kaldırıldı" notuyla ayrışıyor, okuyucuyu yanıltmıyor. Küçük bir pürüz var, öneri 1'e bakın |
| `PRODUCT_SPEC.md`, `INVARIANTS.md`, `DATA_MODEL.md`, `AUDIT.md`, `PHASES.md` | Eskimiş `support_track` atfı olmamalı | ✔ 0 eşleşme. Kalan atıflar plan, review ve eski değişiklik notlarında; bunlar tarihsel kayıt |
| M-09c planı (`:74`, `:855`) DATA_MODEL §9'a "`support_track` F1 migration notu" öngörmüştü | — | DATA_MODEL'de yok. F1 boş DB ile başlıyor, taşınacak canlı veri yok; mockup state v11 localStorage'ı zaten sıfırlıyor. Aksiyon gerekmez |

### 2. Karar tablosu: Date sabitlemesi ve kural kenar durumları
NOW = `2026-10-05T09:00:00`, pazartesi, yerel saat.

| # | Girdi | Spec'e göre beklenen | Koddaki davranış | Sabitlemeden önce | Sabitlemeden sonra | Kapsayan test |
|---|---|---|---|---|---|---|
| T1 | `report_not_sent`, pzt–per | Uyarı yok | `alerts.ts:150` `wd ∈ {5,6,0}` değil → yok | tabs AC13 p_perakende "rozet yok" pzt–per yeşil | Hep pazartesi → yeşil | Dolaylı (tabs AC13) |
| T2 | `report_not_sent`, cuma/cmt/paz, `sent` rapor yok, 07 `done` değil | Sarı uyarı (spec:201 "hafta sonuna kadar") | Uyarı açılır, `entityId = pid:weekStart` | AC13 kırmızı (doğru ürün davranışı, yanlış test varsayımı) | Hiçbir test bu dalı koşmuyor | **Yok → RUL2-01** |
| T3 | Aynı, o hafta `sent` rapor var | Uyarı yok | `:152` | — | — | **Yok → RUL2-01** |
| T4 | Aynı, 07 `done` | Uyarı yok | `:151` `!goLiveDone` | — | — | **Yok → RUL2-01** |
| T5 | Seed `report_not_sent:p_akbank:<ws>` snooze anahtarı | Hesaplanan anahtarla eşleşmeli | `seed.ts:603`, `weekStartOf(todayS)` | — | — | **Yok → RUL2-01** |
| T6 | `reqdoc_not_shared`, p_garanti (mutlak kickoff 2026-08-28), değerlendirme 10-20 | Durumu açıksa uyarı; done, oos veya locked ise yok | `alerts.ts:79-82` | Saatten bağımsız | Değişmedi | ✔ `completion.test.ts:436-473`. Bu testler için sabitleme gereksiz ama zararsız |
| T7 | Seed "yalnızca p_lojistik" (S5/AC17) | Seed anında yalnızca p_lojistik | `kickoffAgoDate` = NOW'dan 3 iş günü önce = 2026-09-30, `bd(09-30, 10-20) = 14 ≥ 2` | Seed tarihi 10-20'den sonra olunca kırmızı (kickoff gelecekte kalıyor) | Tutarlı: seed bugünü (10-05) < değerlendirme (10-20) | ✔ `:476-480`. İddia seed anında değil 15 gün sonra sınanıyor → öneri 2 |
| T8 | `reqdoc_not_shared` eşik sınırı ve tatil (27→28 yarım gün, 29 tam gün, 30) | bd=1 → yok, bd=2 → var | `:79` | Mutlak tarihler | Sabitlenmedi, gerek yok | ✔ RUL-12 `:483-504` |
| T9 | `buildReportSnapshot`, pazartesi tamamlanan adım | `completed` listesinde | `inWeek`: `[weekStart, addBusinessDays(weekStart, 4)]` | ✔ | ✔ | ✔ AC18 `:985-1010` |
| T10 | `buildReportSnapshot`, cumartesi/pazar tamamlanan adım | Spec:220 "son 7 gün" → raporda olmalı | weekEnd cuma, pazartesi yeni hafta başlıyor → **hiçbir haftalık raporda yok** | AC18 cumartesi kırmızıydı (builder notu); bu gerçek sinyaldi | Pazartesi sabitlemesi maskeliyor | **Yok → RUL2-02** |
| T11 | `buildReportSnapshot`, içinde tam gün tatil olan hafta (2026-10-26) | Hafta 26.10–01.11 | `addBusinessDays("2026-10-26", 4)` = 27(1), 28 arife(2), 29 atlanır, 30(3), 02.11(4) → weekEnd **2026-11-02** (sonraki haftanın pazartesisi) | — | — | **Yok → RUL2-02**: 02.11 tamamlanması/kararı iki raporda; `expected.waitingDays` `until` sınırı da kayıyor |
| T12 | `computeAlerts` sabit `2026-10-20` ↔ seed NOW | Değerlendirme ≥ seed bugünü | 10-20 > 10-05; göreli kickoff geçmişte | — | ✔ | — |
| T13 | Saat dilimi | Europe/Istanbul (INV-13) | `todayISO`/`localToday` yerel getter kullanıyor; NOW offset'siz yerel string | — | Her TZ'de yerel tarih 10-05 (builder ve qa-verifier `TZ=UTC` ile koştu) | ✔ Seçim doğru, öneri 3'e bakın |

**Sonuç:** Sabitleme hiçbir testin assert'ini değiştirmiyor. Kural testlerinin kendi kenar durumları (T6, T8) mutlak tarihlerle sınanıyor ve etkilenmiyor. Sabitlemeden önceki kırmızılar ise iki gerçek boşluğu gösteriyordu: T2–T5 testsiz, T10–T11 hatalı. Sabitleme bunları artık gizliyor. Kaynağı bu branch değil (önceden vardı); round 2 kapsamı dışında, backlog'a gidiyor.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RUL2-01 | Low | Spec "Pano içi uyarılar" (PRODUCT_SPEC.md:201), API #34, INV-13 | `src/lib/rabbitqa/alerts.ts:148-155`; `src/pages/ProjectDetail.tabs.test.tsx:30-36` | `report_not_sent` için hiçbir yerde test yok (`grep -rn report_not_sent src` sonucunda yalnızca tabs testinin yorumu çıkıyor). Cuma/hafta sonu dalını yalnızca tabs AC13 tesadüfen koşuyordu, o da kırmızı olarak. Pazartesi sabitlemesiyle bu dal hiç koşulmuyor. Senaryo: F6-03 veya F7-02'de gün hesabı ya da `sent` filtresi bozulursa (ör. `getUTCDay` ↔ yerel gün, `weekStartOf` kayması, snooze anahtarı uyuşmazlığı) hiçbir test kırmızıya dönmez | Saate bağlı olmayan bir L1 testi: `computeAlerts`'e açık `today` geçilir. Matris: per 2026-10-08 → yok; cuma 10-09, cmt 10-10, paz 10-11 → var, `entityId = p:2026-10-05`; pzt 10-12 → yok. O haftanın `sent` raporu → yok; `draft` → var; 07 `done` → yok. Seed snooze anahtarı (`seed.ts:603`) hesaplanan `key` ile eşit olmalı. Faz M kodu olduğu için F0-04 veya F6-03 planına alınabilir |
| RUL2-02 | Medium | Spec "Raporlar" (PRODUCT_SPEC.md:220 "son 7 gün"), INV-27, INV-13; API #32 | `src/lib/rabbitqa/reports.ts:28-29` | `weekEnd = addBusinessDays(weekStart, 4)`. Bunun iki sonucu var. (a) Cumartesi/pazar tamamlanan adım, aksiyon ve kararlar hiçbir haftalık rapora girmiyor. (b) Tam gün tatil içeren haftada weekEnd sonraki pazartesiye kayıyor (2026-10-26 haftası → 2026-11-02): 02.11 kayıtları iki rapora giriyor ve rapor başlığındaki `weekEnd` yanlış görünüyor. Snapshot dondurulduğu için (INV-27) yanlış veri kalıcı oluyor. AC18'in cumartesi kırmızısı (a)'nın belirtisiydi; pazartesi sabitlemesi maskeliyor. Sözleşme #32 "Snapshot `buildReportSnapshot` ile" dediği için F7-02 bu davranışı aynen taşır | Builder işi değil, bu branch'te düzeltme yok. BACKLOG: "F7-02 öncesi". Karar Murat ya da planner'da: hafta `[pazartesi, pazar]` takvim haftası mı (`weekEnd = weekStart + 6 gün`, shared `business-days`'te `weekEndOf`)? Önerilen bu. Testler (açık `today`, sabit saate dayanmadan): cumartesi tamamlanan adım o haftanın raporunda; 2026-10-26 haftasında `weekEnd = 2026-11-01`; 02.11 kaydı yalnızca 11-02 haftasında |
| RUL2-03 | Low | TEST_STRATEGY §3, INV-13 | `docs/TEST_STRATEGY.md:49`; `src/lib/rabbitqa/completion.test.ts:11`; `src/pages/ProjectDetail.tabs.test.tsx:32` | Builder'ın bıraktığı soru. §3 tek sabit saat yazıyor (`2026-09-01T09:00:00+03:00`). Mockup testleri ise 2026-10-05 yerel saat kullanıyor ve bu sabit iki dosyada ayrı ayrı tanımlı. 09-01 mockup için uygun değil: seed'in mutlak tarihleri (kickoff 08-28, 09-08, 09-24; `lastSyncAt` 10-03; RUL-12 tatil haftası) ekim başına göre kurulu. 09-01'de p_akbank (09-08) ve p_garanti'nin (09-24) held kickoff'u seed bugününden sonraya düşer ve senaryo tutarsızlaşır. `+03:00` offset'i de mockup'ta daha kırılgan: `todayISO` yerel getter kullandığı için UTC-7 makinede `2026-10-05T06:00Z` → 10-04 pazar olur ve `report_not_sent` açılır | Denetim (TEST_STRATEGY denetim yazar), Murat onayıyla. §3'e satır: "Mockup (`src/`) testleri: `2026-10-05T09:00:00` (pazartesi, offset'siz yerel saat; mockup seed'inin mutlak tarihleri). API testleri (`apps/api`): `2026-09-01T09:00:00+03:00` (deterministik API seed'i ve fabrikalar). Haftanın gününe bağlı kurallar sistem saatine değil açık `today` parametresine dayanarak tarih matrisiyle test edilir." Uygulama tarafı (F0-04 veya test altyapısı görevi): tek sabit, ör. `src/test/clock.ts` `MOCKUP_NOW`, iki dosya bunu import eder. "Gerçek saate bağlı test yok" ilkesi için `src/test/setup.ts`'te global sabitleme değerlendirilir |

### Düzeltme direktifi
Bu branch için zorunlu düzeltme yok. Merge'ü engelleyen bir şey bulunmadı.
1. **[RUL2-02]** (denetim / Murat): BACKLOG'a Medium olarak "F7-02 öncesi" girer. Hafta tanımı kararı (takvim haftası, `weekEnd` pazar) F7-02 planında verilir. Testler bulgu satırında.
2. **[RUL2-01]** (Low, BACKLOG): `report_not_sent` tarih matrisi testi. F0-04 ya da F6-03 planına.
3. **[RUL2-03]** (Low, denetim): `docs/TEST_STRATEGY.md` §3'e mockup/API ayrımı ve "açık `today` ile tarih matrisi" kuralı eklenir. Ortak `MOCKUP_NOW` sabiti bir sonraki test altyapısı işine.

### Açık sorular / öneriler (engelleyici değil)
- **Öneri 1 (§2.2):** Tablonun üstündeki "Doğrulama: aşağıdaki her yol için `out_of_scope` adım `out_of_scope` kalır" cümlesi, harfi harfine okunursa kaldırılan satırı da kapsıyor. Sonraki sözleşme turunda üstü çizili satır tablodan çıkarılıp tablonun altına tek satır not olarak yazılabilir: "`addTicket` → `support_track` F0-02'de kaldırıldı (REV-07)."
- **Öneri 2 (T7):** "seed produces reqdoc_not_shared only for p_lojistik" testi S5/AC17 iddiasını seed anında değil 15 gün sonra (10-20) sınıyor. Mevcut assert'e ek olarak `computeAlerts(s, "2026-10-05")` (NOW) ile aynı beklenti eklenirse iddia birebir sınanır.
- **Gözlem:** "reqdoc_not_shared … (AC7)" describe'ındaki 5 testten yalnızca biri (`:476`) saate bağlı. Diğerleri p_garanti'nin mutlak kickoff'unu kullanıyor. Describe genelinde sabitleme zararsız. Sabitlenmemiş "RUL-02" (`:413`) ve "RUL-12" (`:483`) testleri de mutlak tarihlerle çalıştığı için doğru şekilde dışarıda bırakılmış.
- **Gözlem:** `toFake: ["Date"]` seçimi `waitFor`/`findBy`'ı gerçek timer'da bırakıyor, `afterEach`'te `useRealTimers` var, sızıntı yok. AC19 describe'ındaki (`:699`) tam `useFakeTimers()` önceden vardı, diff'te değil.

---

# Round 1

## rules-reviewer — chore/f0-02-cleanup @ 980e65c
**Karar:** APPROVE

Engelleyen bulgu yok. İki Low bulgu var, ikisi de BACKLOG'a. Ayrıca açık sorular ve öneriler aşağıda.

Kapsam:
- Kod tarafında `store.tsx`, `types.ts`, `InsightCard.tsx`, `store.test.tsx` ve `completion.test.ts` diff'ini satır satır okudum. Yanlarına `flow.ts`, `completion.ts:230-244` ve `rules.ts:63-75`'i de okudum.
- Sözleşme tarafında `docs/API_CONTRACT.md` diff'ini (word-diff) şunlarla karşılaştırdım: INV-25, INV-28, INV-08, INV-19, INV-21, INV-23, ADR-0005 K19/K20, plan §10.2 D7–D9 ve F0-01 round 3 rules-reviewer bulguları.
- Testleri ben koşmadım (salt okunur). Test ve mutasyon çıktıları builder'ın değişiklik notundan alındı; yeniden üretilmeleri qa-verifier'ın işi.
- pg-mem ve parity bu branch'te geçerli değil: DB yok, sözleşmedeki davranışların hepsi F3-02 ve F4-01'in BE hedefi.

### Karar tablosu 1 — K19 sözleşme metni ve INV-25 (AC20 son maddesi)
Kaynak: `docs/INVARIANTS.md:33` (INV-25, "Tek istisna" kısmı), `docs/adr/0005-f0-01-contract-decisions.md` K19. Sözleşme yerleri: §1 `API_CONTRACT.md:27`, #3 `:43`, §4 `:69`.

| # | Girdi | INV-25 / K19'a göre beklenen | Sözleşme (§1 / #3 / §4) | Mockup (bilinçli fark) | Test / motor |
|---|---|---|---|---|---|
| K1 | Daha önce açılmış (`activatedAt` dolu) aşama `out_of_scope → in_progress`; önceki aşama açık (03, 02 K10 ile açılmış) | Aşama `locked` olur. Açık (`pending`/`in_progress`) adımlar `locked` olur, `activatedAt`/`due` temizlenir, eski değerler alan başına audit'e yazılır, gerekçe `Otomatik kural:` | ✔ / ✔ / ✔ | Aşama doğrudan `in_progress`, adımlara dokunulmuyor (store.tsx:236-245). §4'te yazılı | Yok. BE F3-02, proje kilidi parity'de |
| K2 | Aynı istek; önceki aşama yok (00) | Akış motoru aşamayı hemen açar | ✔ ("önceki aşama yoksa", REV-F028b) / ✔ (Doğrulama "00 geri alınınca hemen açılır") / ✔ | flow.ts:37 `!prev` | Yok (F3-02) |
| K3 | Aynı istek; aşama `independent` | Hemen açılır | ✔ / ✔ / ✔ | flow.ts:37 | Yok (F3-02) |
| K4 | Aynı istek; önceki aşama `done`/`out_of_scope` | Hemen açılır | ✔ / ✔ ("02 geçilmişse aynı istekle 03 akışla açılır") / ✔ | flow.ts:37 `isPassed` | Yok (F3-02) |
| K5 | Hiç açılmamış aşama (`activatedAt` boş) | `locked` olur, akışla açılır, adımlar zaten kilitli | ✔ (§1 genel kural; #3 adım kilitlemeyi "daha önce açılmış" ile sınırlıyor) | — | Yok (F3-02) |
| K6 | Dönen aşamada `done` adım | Değişmez | ✔ / ✔ / ✔ (yalnızca "açık adımlar" kilitleniyor) | — | Yok (F3-02) |
| K7 | Dönen aşamada `out_of_scope` adım | Değişmez | ✔ / ✔ / ✔ | — | Yok (F3-02) |
| K8 | Yeniden açılışta adım termini | `activatedAt = now`, `due` iş günüyle (taban `max(startDate, bugün)`, `durationDays \|\| 1`), eski `due` geri gelmez | ✔ (formül yok, akış kuralına bağlanmış) / ✔ (formül var) / ✔ | flow.ts:50, 61 doğrulandı | Yok (F3-02) |
| K9 | Yeniden açılışta aşama `actualStart` | Korunur | ✔ / ✔ ("(boşsa bugün)" eki flow.ts:38 ile aynı, çelişki değil) / — | flow.ts:38 `ph.actualStart ?? today` | Yok (F3-02) |
| K10 | Sonraki aşamalar (03 kapsam dışıyken açılan 04) | Geri kilitlenmez | ✔ / ✔ / ✔ | — | Yok (F3-02) |
| K11 | Kilitlenen adım için uyarı ve Bana Atananlar | Oluşmaz (kilitli adım iş sayılmaz) | — / ✔ (Doğrulama) / — | — | Yok (F3-02) |
| K12 | SaaS projede 03 geri alınır | `applyInstallType` yeniden uygulanır, ONPREM adımları `out_of_scope` olur (INV-09) | — / ✔ / ✔ (Gerekçe: INV-09) | — | Yok (F3-02) |
| K13 | Akış motoru iki kez çalışır | Değişiklik yok (idempotent) | ✔ (§1 "akış motoru … idempotent") | `pass` aynı state'i döner | Yok (F3-02) |
| K14 | "Tek istisna" ifadesi | INV-25 ve K19 | ✔ "INV-25'in tek istisnası, ADR-0005 K19" / ✔ / ✔ "INV-25 (K19 istisnası)" | — | Belge |
| K15 | Eşzamanlılık | Proje kilidi altında (INV-08) | ✔ / ✔ ("proje kilidi altında (§1)") / ✔ | — | Parity gerekli (F3-02) |

**Sonuç: AC20 son maddesi sağlanıyor.** Sözleşme metni INV-25'in K19 istisnasıyla hiçbir satırda çelişmiyor. Tek fark #3'teki "(boşsa bugün)" eki; bu da flow.ts:38'in davranışını yazıyor.

### Karar tablosu 2 — K20 / RR-F032 (`phase_approval`, kapsam dışı aşama)
| Girdi | ADR-0005 K20'ye göre beklenen | Sözleşme #3 / §4 | Mockup | Test |
|---|---|---|---|---|
| Hazır aşama (`phase_approval` `open`/`in_progress`) `→ out_of_scope` | Aynı transaction'da, proje kilidi altında `cancelled`. Gerekçe `Otomatik kural: aşama kapsam dışı`. Audit alan başına | ✔ / ✔ (yeni satır) | Açık kalıyor. flow.ts:83-85 doğrulandı | Yok (F3-02, parity) |
| `done` ya da `cancelled` `phase_approval` | Dokunulmaz | ✔ / — | — | Yok |
| Aşama geri alınır (K19), sonra yeniden hazır olur | İptal edilen geri açılmaz; `ruleKey` ile idempotent yeni aksiyon açılır | ✔ (Doğrulama dahil) / ✔ | — | Yok |
| K19 ile birlikte: dönüşte aşama `locked` | Açık aksiyon yok (K20 zaten iptal etti); `isActivePhase` false olduğu için yeni aksiyon da açılmıyor | Tutarlı | flow.ts:80-85 | — |
| Proje kilidi listesi | #3 `→ out_of_scope` akış tetikliyor, yani §1 "kural/akış tetikleyen tüm satırlar" kapsamında | ✔ (`API_CONTRACT.md:22`) | — | — |
| `grep -n "S26" docs/API_CONTRACT.md` | Boş | ✔ (§5.1'de S26 yok) | — | Belge |

### Karar tablosu 3 — RR-F028 / RR-F029 / RR-F030
| Girdi | Beklenen (karar) | Sözleşme | INV ile uyum | Test |
|---|---|---|---|---|
| `addTeam`: 05 `done`, 07 `done` değil | 05 yeniden açılır (K16, INV-28 (c)) | ✔ #14 | ✔ | Yok (F4-03) |
| `addTeam`: 05 `out_of_scope`, 07 `done` değil | Adım `out_of_scope` oluşur, aşama açılmaz | ✔ "(07 `done` değilken)" | ✔ | Yok |
| `addTeam`: 05 `out_of_scope`, 07 `done` | `409`, 05'in durumundan bağımsız (D8 = (a)) | ✔ (Doğrulama dahil) | INV-28:36'nın harfi harfine okunuşu farklı (M8 yapılmadı) → **RUL-02** | Yok |
| `addTeam`: 05 K10 ile `in_progress`, 07 `done` | `409` | ✔ ("05'in durumundan bağımsız") | Aynı (RUL-02) | Yok |
| `goLiveApproval` var, `customer_approval` `done → pending` (PATCH ya da AI) | `409` (RR-F029, S22) | ✔ #5 (Doğrulama: #38 → 07 K10 → PATCH `pending` → `409`) | ✔ | Yok (F5-05) |
| `goLiveApproval` var, `customer_approval` `done → out_of_scope` | Belirsiz: "`out_of_scope` serbest" mi, "`done`'dan çıkış `409`" mu? | İki cümle de var | → Açık soru 1 | Yok |
| Açık aşamada adım `out_of_scope → in_progress`, önceki adım `done` | Adım açılır ve istenen `in_progress` uygulanır, `200` (D9 = (a)) | ✔ §1 ve #5 | INV-25 "akış motoru `pending` yapar" diyor; ardından istenen durumun uygulanması RR-F021 emsaliyle tutarlı, çelişki yok | Yok (F3-02) |
| Aynı istek, önceki adım açık | `locked` kalır, `200` | ✔ | ✔ | Yok |
| Aynı istek, aşama `locked` | `409 "Aşamanın sırası gelmedi"` (RR-F002) | ✔ (§1'de önce geliyor; #5 Doğrulama) | ✔ | Yok |

### Karar tablosu 4 — Mockup kodu: AI Insight onayı (INV-21/23/26) ve `support_track` (INV-09)
| Girdi | Beklenen | Kod (HEAD) | Test (L3 Vitest, `RqProvider`; DB yok) |
|---|---|---|---|
| `step_update`; `completion: "data"` adım `pending`; önerilen `{status:"done"}` | `"Bu adım veriyle tamamlanır"`; adım, öneri ve audit değişmez | `approveInsight` → `api.updateStep` (store.tsx:686-689) → `manualStatusError` (:261-262) hata verip `patch`'ten önce dönüyor; öneri `setState`'ine ulaşılmıyor | ✔ AC12 `store.test.tsx:478-498`. Ön koşul assert'leri var, erken `return` yok. Mutasyon kanıtı (AC14) notta: kontrol kapatılınca 2 test kırmızı, geri alınınca yeşil |
| Aynısı, `completion: "meeting"` adım | Aynı | Aynı yol | ✔ AC13 `:540-558`, mutasyonda kırmızı |
| Manuel adım `pending`, `done` önerisi | Onaylanır; audit gerekçesi `AI Insight onaylandı…` (INV-21) | Değişmedi | ✔ Mevcut REV-13 AC3 (`seedStepUpdateInsight`'a taşındı, assert'ler aynı) |
| `step_update`, `targetId: "st_missing"` | `"Adım bulunamadı"`; öneri `pending`; audit değişmez (sözleşme #44 "uygulanan işlem hata verirse öneri `pending` kalır" ile aynı) | store.tsx:258-259 | ✔ AC16 `:574-584` |
| `updateStep("st_missing", …)` | `"Adım bulunamadı"`; adımlar ve audit değişmez | :258-259 | ✔ AC15 `:562-572` |
| `addTicket` (open, medium) | Adımlar değişmez; `"Otomatik kural: destek kaydı açıldı"` gerekçeli audit yok | Satır kaldırıldı (e13a4c7) | ✔ AC17 `:585-602`. Silmeden önce ve sonra yeşil (840baa1 / e13a4c7, notta) |
| `support_track` satırı vardı, eşdeğerlik | `setStepByKey` anahtar yoksa aynı `s`'i döndürüyor (rules.ts:64-65): state ve audit değişmez. Şablonda ve seed'de anahtar yok (completion.test.ts:585-589). Anahtar üreten yol yok: adım `key`'leri yalnızca seed.ts şablonundan geliyor, `addTeam` `adapt:` önekli | Eşdeğer. `setStepByKey` import'u :319, :365, :520'de hâlâ kullanılıyor | INV-09 etkilenmiyor (kural yoktu) |
| `addTicket` high priority | Uyarı ve audit (değişmedi) | Silinen updater aynı `s`'i döndürdüğü için sonraki updater'ı etkileyemez | Test yok (önceden de yoktu) → Öneri 2 |
| `InsightProposedFields` (types.ts:392-396) ve INV-19 | Geçici mockup tipi; `packages/shared` henüz yok, bu yüzden ikinci kaynak değil. F0-04'te `InsightProposal` ile değişmeli | Yorumla işaretli. Yalnızca `as` ve tip annotasyonu var, çalışma zamanı ifadesi değişmemiş (`approveInsight` :671, :685; InsightCard :42, :58-61, :154) | Mevcut testler + typecheck. Tip `& Record<string, unknown>` ile #44'teki tür başına izinli alan listesinden geniş; mockup için zararsız, F0-04'e not (Öneri 3) |

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RUL-01 | Low | INV-09, INV-20, REV-07 | `docs/API_CONTRACT.md:100` (#29), `:138` (§2.2 tablosu) | Mockup'taki `support_track` kuralı bu branch'te silindi (e13a4c7, store.tsx:480). Sözleşme ise #29'da hâlâ "`support_track` adımı `in_progress` (… no-op, REV-07)" diyor. §2.2 "`setStepByKey` çağrı yolları" tablosu da artık var olmayan bir `addTicket → support_track → in_progress` yolunu sayıyor. Senaryo: Faz 2'de destek kayıtlarını yazan BE geliştiricisi bu satırı hedef kural sanıp `core/rules`'a, karşılığı olmayan bir kural taşıyabilir. §2.2'nin "her yol" iddiası da yanlışlanmış olur. Plan bu satırları kapsamamıştı; builder'ın sapması değil, plan boşluğu. | #29'daki cümleyi şöyle değiştir: "Mockup'taki no-op `support_track` kuralı F0-02'de kaldırıldı (REV-07); API'de karşılığı yok." §2.2'deki `addTicket` satırını sil ya da "kaldırıldı (F0-02, REV-07)" diye işaretle. Commit: `docs(api): drop removed support_track rule from contract [RUL-01]`. Test yok; doğrulama: `grep -n support_track docs/API_CONTRACT.md` yalnızca "kaldırıldı" notunu göstermeli. |
| RUL-02 | Low | INV-28 (c), RR-F028, plan D8/M8 | `docs/INVARIANTS.md:36`; `docs/API_CONTRACT.md:53` (#14) | Sözleşme D8 = (a)'yı doğru yazıyor: 07 `done` iken 05'in durumundan bağımsız `409`. INV-28 ise hâlâ "(c)'de 07 `done` ise `409`; 05 `out_of_scope` ise mockup gibi adım `out_of_scope` oluşur" diyor. Harfi harfine okunursa "05 `out_of_scope` + 07 `done`" için INV ile sözleşme farklı sonuç veriyor (201 + `out_of_scope` adım ya da `409`). M8 main'de yapılmamış: `origin/main` INVARIANTS'ta "05'in durumundan bağımsız" 0 eşleşme. Plan M8'in merge'den sonra yapılmasına izin veriyor; builder'ın işi değil. | Denetim / Murat (M8): INV-28 (c) cümlesine "05'in durumundan bağımsız (05 `out_of_scope` olsa bile)" eklenir, "05 `out_of_scope` ise …" cümlesi "(07 `done` değilken)" ile sınırlanır. F4-03 planından önce kapatılmalı. Eklenecek test (F4-03, API entegrasyon + parity): "05 `out_of_scope` + 07 `done` → `addTeam` `409`, adım oluşmaz, audit yok". |

### Düzeltme direktifi
1. **[RUL-01]** (uygulama rolü, isteğe bağlı; Low, merge'ü engellemez): `docs/API_CONTRACT.md:100`'deki #29 "Tetiklenen kural" hücresinde `support_track` cümlesini "Mockup'taki no-op `support_track` kuralı F0-02'de kaldırıldı (REV-07); API'de karşılığı yok" yap. `:138`'deki §2.2 `addTicket` satırını sil ya da "kaldırıldı" diye işaretle. Ayrı commit, mesajda `[RUL-01]`. Değişiklik notunun "Review düzeltmeleri" tablosuna ekle. Kod ve test değişikliği yok.
2. **[RUL-02]** (denetim / Murat, builder değil): M8. `docs/INVARIANTS.md:36` INV-28 (c) metni D8 = (a)'ya göre netleştirilir. BACKLOG'a "F4-03 öncesi" diye girer.

### Açık sorular / öneriler (engelleyici değil)
- **Açık soru 1 (RR-F029 kapsamı):** `goLiveApproval` varken `customer_approval` için `done → out_of_scope` serbest mi (`API_CONTRACT.md:45` "`out_of_scope` serbest"), yoksa `409` mu ("`done`'dan çıkışı → `409`")? API'de `customer_approval` yalnızca #38 ile `done` olabildiği için her `done` adımın onay kaydı var, dolayısıyla pratikte bu durum hep `409` okunur. Güvenli varsayım: `409` (onay kaydıyla tutarlılık). F5-05 planında tek ifadeyle netleşmeli (ör. "`done → out_of_scope` dahil").
- **Açık soru 2 (K19):** Yeniden kilitlenen aşamanın kendi `activatedAt` alanı aşama `locked` beklerken temizlenir mi, korunur mu? INV-25, K19 ve sözleşme bunu söylemiyor; yalnızca yeniden açılışta `activatedAt = now` diyor. Güvenli varsayım: korunur (K19 "daha önce açılmış" tespiti için gerekli). F3-02 planına yazılmalı.
- **Öneri 1:** INV-25 metni RR-F030 ve RR-F021'in "adım açılırsa istenen durum uygulanır" kuralını anmıyor. Çelişki yok, ama denetim INV-25'e tek cümle ekleyerek sözleşmeyle hizalayabilir.
- **Öneri 2:** `addTicket` `priority: "high"` yolunun (otomatik uyarı ve `Otomatik kural: yüksek öncelikli ticket` audit'i) testi yok. Silinen satırın hemen altında bulunuyor; eşdeğerlik koddan kanıtlı, ama Faz 2 öncesi bir koruma testi faydalı olur.
- **Öneri 3 (INV-19):** `InsightProposedFields` `& Record<string, unknown>` ile her anahtarı kabul ediyor. F0-04'te `InsightProposal` ve `InsightApproveInput` şemaları #44'teki tür başına izinli alan listesini (`step_update` → status, due, ball, ownerId; `dependency`/`durationDays`/`required` yasak) zorlamalı; bu tip şemaya kopyalanmamalı. Değişiklik notundaki Öneriler bunu zaten içeriyor.
- **Öneri 4 (reviewer alanı):** Satır kayması. `store.tsx:480` silindiği için sözleşmedeki `store.tsx:510-541` (`API_CONTRACT.md:231`), `:733-734` (`:125`, `:239`) ve plandaki `store.tsx:689-690` başvuruları HEAD'de 1 satır geride kaldı (ör. `approveGoLive` artık :509'da). Sözleşme başlığı kaynağı `main @ 7ba26ef` olarak sabitlediği için yanlış değiller. Sonraki sözleşme turunda HEAD'e göre güncellenmeleri ya da başvurunun commit'e sabitlendiğinin belirtilmesi önerilir.
