## reviewer — fix/m06-risk-reason @ 55dafe7
**Karar:** APPROVE

Demo modunda incelendi (Faz M, mockup kodu). Backend invariant'ları (INV-01…05, 14–18, 21–24) bu modda uygulanmıyor.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-M06-01 | Medium | INV-06 ("tarih değişikliği") | src/pages/project/Phase3Tabs.tsx:357, :384; src/lib/rabbitqa/store.tsx:506 | `needsReason` ve store kontrolü yalnızca `status` ve `due` alanlarına bakıyor. Bir **karar** kaydının "Karar tarihi" (`decidedAt`) alanı gerekçe istenmeden değiştirilebiliyor. Örnek: karar r_2'nin tarihi 2026-08-28'den 2026-09-15'e çekiliyor ve audit kaydında `reason` boş kalıyor. INV-06'nın "tarih değişikliği" maddesine kelimesi kelimesine uyulursa bu bir boşluk. REV-01'in istediği kapsam (status/due) tam karşılandı, o yüzden engelleyici değil. | Karar Murat'ın. Kapsama alınacaksa koşula `d.decidedAt !== risk.decidedAt` ekle; store'da da `p.decidedAt !== undefined && p.decidedAt !== old.decidedAt` ekle; ikisi için birer test yaz. Alınmayacaksa BACKLOG'a not düş. |
| REV-M06-02 | Low | Test kalitesi | src/pages/project/Phase3Tabs.RiskDialog.test.tsx:56-67 | AC2 testinin adı "…records it on the audit entry" diyor, ama test yalnızca `toast.success` çağrısını ve dialog'un kapandığını kontrol ediyor. Audit'teki `reason` alanı hiç kontrol edilmiyor. Bu davranışı L2 testi doğruluyor (store.test.tsx:696-704), yani gerçek bir boşluk yok; sorun test adının yanıltıcı olması. | Test adını düzelt, ya da `useRq` üzerinden audit kaydına bakan bir assert ekle. |
| REV-M06-03 | Low | Tutarlılık | src/lib/rabbitqa/store.tsx:509 | Store gerekçeyi kırpmadan (`reason`) `patch`'e geçiriyor. UI zaten kırpıyor (Phase3Tabs.tsx:434), ama UI dışından gelen bir çağrı baştaki/sondaki boşluklarla audit'e yazar. `snoozeAlert`/`closeAlert` gerekçeyi `reason.trim()` ile yazıyor (store.tsx:461-462, :473-474). `updateMeeting` ise kırpmıyor (store.tsx:291), yani mevcut kod da tutarlı değil. | `patch(..., reason?.trim() || undefined)`. Bu isteğe bağlı. |

### Kontrol edilen noktalar
1. **Store, mevcut desenle aynı mı:** `updateRisk` (store.tsx:503-511) `updateMeeting` (store.tsx:281-299) ve `updateStep` (store.tsx:256-269) ile aynı yapıda.
   - Kayıt bulunamazsa hata dönüyor ("Kayıt bulunamadı", `updateTicket` ile aynı mesaj, store.tsx:494).
   - Kural ihlalinde `patch` çağrılmadan erken dönüyor, yani state ve audit değişmiyor (testi: store.test.tsx:675-693).
   - Başarıda `null` dönüyor. Gerekçe kontrolü `!reason?.trim()` ile yapılıyor, `updateMeeting`:286/288 ile aynı.
   - `reason`, `patch` (store.tsx:149) üzerinden değişen her alanın audit kaydına yazılıyor (testi: store.test.tsx:696-704).
   - Dönüş tipinin `void`'den `string | null`'a değişmesi tek çağıranı (Phase3Tabs.tsx:434) etkiliyor, o çağrı da hatayı ele alıyor. Başka çağıran yok (`grep updateRisk` ile kontrol edildi).
   - Değişiklik notunda bir abartı var: `updateMeeting` ve `updateStep` durum değişikliğinde genel olarak gerekçe istemiyor (yalnızca iptal ve yapılmış toplantının tür/tarih değişikliğinde istiyor). Yani "aynı desen" ifadesi yapı için doğru, kural için tam değil. Bulgu değil.
2. **`needsReason` uç durumları:**
   - `due` değerleri `yyyy-MM-dd` biçiminde (seed.ts:578-579), `<input type="date">` de hep bu biçimde değer üretiyor (Phase3Tabs.tsx:412). `d.due` başlangıçta `risk.due`'dan kopyalanıyor, yani kullanıcı alana dokunmadıkça karşılaştırma birebir eşit. Saat/saniye farkından kaynaklı yanlış pozitif olmuyor.
   - Termini temizlemek (`null`) gerekçe istiyor. Bu doğru, çünkü tarih değişikliği sayılır.
   - Değeri değiştirip eski haline getirince gerekçe alanı kayboluyor. Bu da doğru.
   - Store'daki `!==` karşılaştırması ile `patch`'teki `str()` karşılaştırması `null`/`undefined` için farklı sonuç verebilir. UI'da `d.due` her zaman `risk.due`'dan geldiği için tetiklenmiyor.
3. **Yeni kayıt akışı:** `risk === null` olduğunda `needsReason` her zaman `false` (`!!risk`, Phase3Tabs.tsx:357). Akış `onCreate(d)`'e gidiyor ve `addRisk` gerekçe istemiyor (store.tsx:502). AC4 testi bunu doğruluyor (Phase3Tabs.RiskDialog.test.tsx:78-85).
4. **Kapsam:** Diff'te yalnızca 5 dosya var: değişiklik notu, store.tsx, Phase3Tabs.tsx ve 2 test dosyası. REV-07 (store.tsx:482'deki `support_track` satırı değişmemiş) ve REV-11 bu branch'e sızmamış. Yeni paket yok, enum değişmemiş, state sürümü/KEY değişmemiş (gerek de yok), korunan dosyalara dokunulmamış. Diff'te `perm.ts` dışında bir rol kontrolü yok; `manage` (Phase3Tabs.tsx:298) değişmemiş.
5. **CI:** Okunamadı, çünkü bu ortamda `gh` kurulu değil (`command not found: gh`). Parity job durumu bilinmiyor. Faz M demo modunda bu engelleyici değil. Builder'ın yazdığı yerel kontroller (typecheck temiz, 205 test yeşil, lint taban değerde) değişiklik notunda var, ama doğrulamak qa-verifier'ın işi.

Diğer kontroller: güvenlik açısından yeni bir yüzey yok (`dangerouslySetInnerHTML` yok, `any` yok). Gerekçe alanının label/id eşleşmesi doğru (`htmlFor="risk-dialog-reason"`). Metinler Türkçe.

### Düzeltme direktifi
Zorunlu madde yok. İsteğe bağlı olanlar:
1. REV-M06-01 (Murat karar verirse): src/pages/project/Phase3Tabs.tsx:357'deki `needsReason` koşuluna `|| d.decidedAt !== risk.decidedAt` ekle. src/lib/rabbitqa/store.tsx:506'ya `(p.decidedAt !== undefined && p.decidedAt !== old.decidedAt)` ekle. store.test.tsx'e r_2 için gerekçesiz `decidedAt` reddi testi, RiskDialog testine de L3 testi yaz.
2. REV-M06-02: Phase3Tabs.RiskDialog.test.tsx:56'daki test adını düzelt ya da audit'teki `reason` alanını kontrol eden bir assert ekle.
3. REV-M06-03: store.tsx:509'da `patch<RiskDecision>("risks", id, p, reason?.trim() || undefined)` kullan.

### Açık sorular / öneriler (engelleyici değil)
- INV-06'daki "tarih değişikliği" ifadesi karar tarihini (`decidedAt`) de kapsıyor mu? PRODUCT_SPEC/INVARIANTS'ta netleştirilmeli (bkz. REV-M06-01).
- CI ve parity durumu, `gh` olan bir ortamda ya da qa-verifier çıktısıyla teyit edilmeli.

**Karar cümlesi:** REV-01 (High) düzgün kapatılmış. Gerekçe kuralı hem UI'da hem store'da uygulanıyor, state değişmiyor, gerekçe audit'e yazılıyor, testleri var ve kapsam dışına taşan bir değişiklik yok. Yalnızca Medium/Low bulgular kaldığı için karar **APPROVE**; REV-M06-01 BACKLOG'a yazılmalı.
