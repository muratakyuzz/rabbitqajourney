## rules-reviewer — fix/m06-risk-reason @ 55dafe7
**Karar:** APPROVE

Düzeltme REV-01'i hem store'da hem arayüzde kapatıyor. Gerekçesiz durum veya termin değişikliği store seviyesinde reddediliyor ve state değişmiyor. Gerekçe her değişen alanın audit kaydına `patch` helper'ı üzerinden yazılıyor. High veya Critical bulgu yok. Bir Medium (RUL-01, `decidedAt`) var ve kapsamı spec'te belirsiz, bu yüzden açık soruya da bağlandı. Kalan üç bulgu Low.

Not: Faz M demo modunda backend, DB, pg-mem ve parity yok. Testler Vitest + jsdom üzerinde koşuyor (store L2, bileşen L3). Karar tablosundaki "motor" sütunu bu yüzden pg-mem/parity değil, bu iki katmanı gösteriyor. Testleri bu ajan çalıştırmadı. Sonuçlar değişiklik notundan alındı (205 yeşil), doğrulaması qa-verifier'da.

### Spec kaynağı (kelimesi kelimesine)
- INV-06: "Gerekçe zorunlu: tarih değişikliği, durum değişikliği, uyarı kapatma/erteleme, kurulum tipi / LLM değişikliği"
- PRODUCT_SPEC:203: "Tarih değişikliği, durum değişikliği, uyarı kapatma ve kurulum/LLM seçimi değişikliğinde gerekçe zorunludur."
- PRODUCT_SPEC:341: "Risk: etki, olasılık, azaltma planı. Karar: tarih, ilgili toplantı."
- INV-05 (demo karşılığı, AGENTS.md): her değişiklik store fonksiyonundan geçer ve audit yazar (kim, ne zaman, alan, eski → yeni, gerekçe).

### Karar tablosu
| # | Girdi (mevcut kayıt üzerinde) | Spec'e göre beklenen | Koddaki davranış | Test / motor |
|---|---|---|---|---|
| 1 | Durum değişti, gerekçe yok (`undefined`) | Reddet, state değişmesin | store.tsx:506-507 hata döner, `patch` çağrılmaz. UI: Phase3Tabs.tsx:432 toast verir, dialog açık kalır | Var: store.test.tsx "rejects a status change without a reason" (state=open kontrolü) + RiskDialog AC1 / Vitest jsdom |
| 2 | Termin değişti, gerekçe yok | Reddet | store.tsx:506 `p.due !== undefined && p.due !== old.due` yakalar | Var: store "rejects a due-date change…" / Vitest |
| 3 | Termin null'dan tarihe ya da tarihten null'a (temizleme) | Gerekçe iste (tarih değişikliği) | Store'da `null !== "2026-…"` doğru yakalanıyor. UI'da `e.target.value || null` ile `risk.due` karşılaştırılıyor, doğru | Test yok (Low, RUL-04) |
| 4 | Durum değişti, gerekçe yalnızca boşluk | Reddet | Store'da `!reason?.trim()` reddeder. UI'da `!reason.trim()` engeller | Test yok, store testleri yalnızca `undefined` deniyor (RUL-04) |
| 5 | Durum değişti, gerekçe geçerli | Kaydet, audit'te reason olsun | `patch` her değişen alan için `mkAudit({... reason})` yazar (store.tsx:145-151) | Var: store "accepts a status change…" (`entry.reason` kontrolü) / Vitest |
| 6 | Termin değişti, gerekçe geçerli | Kaydet, audit'te reason olsun | Satır 5 ile aynı yol | Kısmen: AC2 bileşen testi adına rağmen audit'i doğrulamıyor, yalnızca toast ve dialog kapanmasına bakıyor (RUL-03) |
| 7 | Durum ve termin aynı anda değişti, tek gerekçe | Tek gerekçe yeterli, her iki alan audit'lensin | `patch` iki ayrı audit kaydı yazar (field=status, field=due), ikisinde de aynı `reason` var. ActionDialog ve StepDialog ile aynı desen | Test yok (Low, RUL-04) |
| 8 | Yalnızca başlık veya açıklama değişti | Gerekçe istenmez | `needsReason=false`, alan gösterilmez, store kabul eder | Var: store "allows title/description…" + AC3 / Vitest |
| 9 | Yalnızca sahip, etki, olasılık, azaltma planı, müşteriye görünür ya da ilgili toplantı değişti | Spec bu alanlar için gerekçe istemiyor (INV-06 listesinde yok) | Gerekçe istenmiyor, doğru | Doğrudan test yok, mantık satır 8 ile aynı |
| 10 | Karar kaydında `decidedAt` (Karar tarihi) değişti | Belirsiz. INV-06 "tarih değişikliği" diyor ve spec:341 kararın tarihini alan olarak sayıyor | Gerekçe istenmiyor, audit'e reason'sız yazılıyor | Yok (Medium, RUL-01) |
| 11 | Tür risk'ten karara (ya da tersi) değişti | Spec sessiz | `decidedAt` örtük olarak bugüne ya da null'a setleniyor, gerekçe istenmiyor | Yok (RUL-01 kapsamında) |
| 12 | Yeni kayıt (`onCreate` → `addRisk`) | Oluşturma bir "değişiklik" değil, gerekçe yok | `needsReason = !!risk && …` olduğundan risk=null iken false. `addRisk` reason parametresi almıyor, create audit'i yazılıyor | Var: AC4 / Vitest |
| 13 | Gerekçesiz çağrıda state'in değişmemesi | Değişmemeli | Erken `return` `patch`ten önce geliyor, `setState` çağrılmıyor, audit eklenmiyor | Var: satır 1 ve 2 testleri state'i doğruluyor. Audit sayısı kontrolü yok (önemsiz) |
| 14 | Bilinmeyen id | Hata | "Kayıt bulunamadı" (updateTicket ile aynı mesaj) | Test yok, önemsiz |
| 15 | Hiçbir alan değişmedi ya da Kaydet'e çift tıklandı | Kopya audit yazılmasın | `patch` içinde `!entries.length` ise `return s`, son state'e göre fonksiyonel karşılaştırma yapılıyor. İdempotent | Yok, mevcut helper davranışı |
| 16 | Kullanıcı durumu değiştirip gerekçe yazıyor, sonra durumu geri alıp yalnızca başlığı değiştiriyor | Başlık kaydına gerekçe düşmemeli | Gerekçe alanı gizleniyor ama `reason` state'te kalıyor ve `reason.trim() || undefined` ile gönderiliyor, bu yüzden title audit kaydına bayat gerekçe yazılıyor | Yok (Low, RUL-02) |

### Mevcut desenle karşılaştırma (updateMeeting / updateStep / ActionDialog)
- Store tarafı: `updateMeeting` (store.tsx:281-299) ile aynı yapı. Önce `state` closure'ından `old` bulunuyor, `!reason?.trim()` kontrolü yapılıyor, sonra `patch(…, reason)` çağrılıp `null` dönülüyor. `updateStep` store'da gerekçe zorlamıyor (yalnızca UI'da, REV-06), yani risk artık adımdan daha sıkı. Tutarsızlık sayılmaz, REV-06 yönünde bir iyileşme.
- UI tarafı: `needsReason` ifadesi ActionDialog (ProjectDetail.tsx:656) ile birebir aynı. Fark şu: PhaseDialog (ProjectDetail.tsx:558) plan başlangıcını ve bitişini de, yani tüm tarih alanlarını sayıyor. RiskDialog ise `decidedAt`i saymıyor (RUL-01).
- Trim: store gelen `reason`i trim etmeden audit'e yazıyor (UI trimli gönderiyor). `updateMeeting` da aynı şekilde trim etmiyor; `snoozeAlert` ve `closeAlert` ediyor. Bu mevcut tutarsızlık bu branch'te büyümedi, yeni bulgu olarak yazılmadı.
- Diğer çağıranlar: `updateRisk`in tek üretim çağıranı Phase3Tabs.tsx:434. AI Insight akışı riskleri yalnızca oluşturuyor (store.tsx:703), güncellemiyor. Dönüş tipinin `void`ten `string | null`a dönmesi başka bir çağıranı kırmıyor.
- Transaction ve "hayalet" audit: demo'da durum ile audit aynı `setState` içinde atomik yazılıyor. Ret yolunda audit yazılmıyor.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RUL-01 | Medium | INV-06, PRODUCT_SPEC:203, :341 | src/pages/project/Phase3Tabs.tsx:357, :365, :384; src/lib/rabbitqa/store.tsx:506 | Karar kaydının tarihi (`decidedAt`) gerekçesiz değiştirilebiliyor. Tablonun "Termin / Tarih" sütununda kararlar için gösterilen tarih bu (Phase3Tabs.tsx:332). Haftalık müşteri raporu kararları `inWeek(r.decidedAt …)` ile seçiyor (reports.ts:52). Yani gerekçesiz bir tarih düzenlemesi kararı müşteri raporuna sokup çıkarabiliyor. Tür değişikliğinde de `decidedAt` örtük olarak değişiyor. | Spec onaylarsa `needsReason` ifadesine ve store koşuluna `decidedAt` ekle (`p.decidedAt !== undefined && p.decidedAt !== old.decidedAt`). Store testine "decidedAt gerekçesiz reddedilir" senaryosunu ekle. Karar Murat'ta (Açık soru 1). |
| RUL-02 | Low | INV-05 (audit doğruluğu) | src/pages/project/Phase3Tabs.tsx:434 | Gerekçe yazılıp durum geri alındığında alan gizleniyor ama gerekçe yine gönderiliyor. Bayat gerekçe, gerekçe gerektirmeyen alanların audit kaydına yazılıyor. | `updateRisk(risk.id, d, needsReason ? reason.trim() : undefined)` kullan. |
| RUL-03 | Low | Test/AC eşlemesi | src/pages/project/Phase3Tabs.RiskDialog.test.tsx:56-67 | AC2 testinin adı "records it on the audit entry" ama audit'i doğrulamıyor. Termin için audit.reason hiçbir testte kontrol edilmiyor. | Store testine termin + gerekçe → `audit.find(field==="due").reason` kontrolünü ekle, ya da AC2 testinin adını düzelt. |
| RUL-04 | Low | INV-06 kenar durumları | src/lib/rabbitqa/store.test.tsx:674-713 | Eksik negatif testler: (a) yalnızca boşluktan oluşan gerekçe, (b) durum ve termin aynı anda değişince iki audit kaydına da aynı gerekçenin yazılması, (c) terminin null'a çekilmesi. Kod üçünü de doğru ele alıyor, yalnızca test yok. | Üç senaryo için store testi ekle. |

### Düzeltme direktifi
(Hiçbiri merge'i engellemiyor. Aynı branch'te yapılırsa:)
1. RUL-02: Phase3Tabs.tsx:434'te gerekçeyi yalnızca `needsReason` doğruyken gönder.
2. RUL-03 ve RUL-04: store.test.tsx'teki "updateRisk — status/due reason guard" bloğuna dört test ekle: `updateRisk(id, {status:"mitigated"}, "   ")` hata döner ve state değişmez; `{status, due}` + gerekçe iki audit kaydı yazar ve ikisinde de aynı reason olur; `{due:null}` gerekçesiz reddedilir; termin + gerekçe sonrası `field==="due"` audit kaydında reason olur.
3. RUL-01: Murat'ın kararını bekliyor. Onaylanırsa store koşuluna ve `needsReason`a `decidedAt` eklenir, test yazılır. Onaylanmazsa `docs/reviews/BACKLOG.md`ye ve API_CONTRACT'taki risk güncelleme satırına "gerekçe: status, due (decidedAt hariç)" diye not düşülür.

### Açık sorular / öneriler (engelleyici değil)
1. INV-06'daki "tarih değişikliği" kararın kayıt tarihini (`decidedAt`) de kapsıyor mu, yoksa yalnızca hedef ve plan tarihlerini mi (PRODUCT_SPEC:170 "Hedef tarih")? Varsayım: REV-01 kapsamı status ve due ile sınırlı tutuldu. Bu, freeze için kabul edilebilir.
2. F-fazında API'ye taşınırken bu kural `packages/shared` zod şemasına girmeli (INV-06 doğrulama yöntemi: gerekçesiz istekte 400) ve gerekçe trim edilip öyle saklanmalı.
3. Sahip, etki ve olasılık değişikliğinde gerekçe istenmemesi spec'e uygun. INV-06 listesinde bu alanlar yok.
