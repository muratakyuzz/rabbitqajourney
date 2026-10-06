## rules-reviewer — fix/m06-insight-step-lock @ 2940e56
**Karar:** APPROVE

Kısaca: REV-13 kapandı. Kilit kuralı artık tek yerde, `stepLockError` içinde (`src/lib/rabbitqa/completion.ts:238-244`). `updateStep` bu kuralı çağırıyor (`store.tsx:259-260`). `approveInsight`'ın `step_update` dalı (`store.tsx:687-692`) kuralı kopyalamıyor, `api.updateStep` üzerinden devralıyor. Hata dönerse fonksiyon sondaki `setState`'e ulaşmadan çıkıyor: öneri `pending` kalıyor, insight audit'i yazılmıyor. INV-21 ("ilgili mevcut servis fonksiyonu ile uygulanır") bu dal için sağlanmış oldu. Yalnızca Low bulgular var.

Testleri ben çalıştırmadım (salt okunur rol). Test sonuçları değişiklik notundaki beyana (210 test yeşil) dayanıyor; doğrulaması qa-verifier'da.

### Kapsam ve yöntem
- Bu branch'te `origin/main` üzerine tek commit var (2940e56). Değişen kod dosyaları: `completion.ts`, `store.tsx`, `InsightCard.tsx` ve bunların testleri. Paket, tip, seed ya da state sürümü değişmemiş.
- Kural metni INV-25'ten alındı: "kilitli adım/aşamanın durumu elle değişmez; açılmış adım tekrar kilitlenmez". INV-26: "Veriyle / toplantıyla tamamlanan adım elle Tamamlandı yapılamaz (yalnızca Kapsam dışı)". INV-21 ve INV-23 de bu açıdan okundu.
- `src/` içinde tarama yapıldı (`elle seçilemez`, `durumu elle değiştirilemez`, `stepLockError`). Adım kilidi için başka satır içi kopya kalmamış. `store.tsx:240-241`'deki kontrol aşama (`updatePhase`) kilidi, bu kapsamın dışında. `setStepByKey` için açık olan REV-05 (Medium) değişmedi.
- Hata kullanıcıya iki yoldan ulaşıyor. `quickApprove` (`InsightCard.tsx:84-85`) ve `ApproveDialog` (`InsightCard.tsx:206-207`) dönen hatayı `toast.error` ile gösteriyor; arayüz hatayı yutmuyor.
- Pg-mem / parity: bu bir demo store'u, DB yok. Tüm testler Vitest/jsdom'da (L2 store, L3 bileşen) koşuyor. Parity sorusu API taşımasına kalıyor (Açık soru 1).

### Karar tablosu
| # | Girdi (hedef adım durumu / önerilen veya düzenlenen status) | Spec'e göre beklenen | Koddaki davranış @ 2940e56 | Test |
|---|---|---|---|---|
| 1 | manuel `pending` → `locked` (Düzenle ve onayla) | Red (INV-25: açılmış adım tekrar kilitlenmez); adım, öneri ve audit değişmez | `stepLockError` "\"Sırası gelmedi\" elle seçilemez" döndürüyor; erken return | Var, store.test.tsx:490-500 (AC1). Adım `pending`, öneri `pending` ve audit sayısı aynı diye assert ediliyor. L2 |
| 2 | `locked` → `done` (öneri üretildikten sonra adım kilitlenmiş; düzenlemeden onay) | Red (INV-25: kilitli adım elle değişmez) | "Adımın sırası gelmedi; durumu elle değiştirilemez" döndürüyor; erken return | Var, store.test.tsx:502-512 (AC2). L2 |
| 3 | manuel `pending` → `done` | Uygulanır; adım audit'inin reason'ı "AI Insight onaylandı…" ile başlar; öneri `approved`, `appliedEntityId` = adım | `updateStep` → `patch(reason)`; ardından insight `approved` | Var, store.test.tsx:514-526 (AC3). L2 |
| 4 | Arayüz: `step_update` için Durum seçici | "Sırası gelmedi" sunulmaz; diğer dört durum sunulur | `InsightCard.tsx:164,189`'da `locked` filtreleniyor (StepDialog deseni) | Var, InsightCard.test.tsx (AC4). L3 |
| 5 | manuel `done` → `locked` | Red | `next === "locked"` olduğu için reddediliyor | Doğrudan test yok; #1 ile aynı dal |
| 6 | `locked` → `locked` (düzenlenmiş değer aynı; yalnızca API ile, arayüzde seçenek yok) | Değişiklik yok | `next === step.status` olduğu için null dönüyor. `patch` alan farkı görmediği için audit yazmıyor (`store.tsx:146-153`), öneri `approved` oluyor. Adım durumu değişmiyor, INV-25 ihlali yok | Yok (zararsız) |
| 7 | `locked` adım, status içermeyen öneri | INV-25 yalnızca durum için konuşuyor | `next === undefined` olduğu için null dönüyor. ai-mock `step_update`'i yalnızca `{status}` ile üretiyor (ai-mock.ts:51), bu yüzden pratikte ulaşılamıyor | Yok |
| 8 | `targetId` geçersiz (adım silinmiş ya da yok) | Uygulanamaz; öneri onaylanmış sayılmamalı | `updateStep` "Adım bulunamadı" döndürüyor; erken return. Önceden `patch` sessizce no-op yapıyor ve öneri `approved` işaretleniyordu, şimdi bu düzeldi | **Yok** (RUL-03) |
| 9 | `targetId` null | Uygulanacak hedef yok | `if (!ins.targetId) break;`: öneri hiçbir şey uygulanmadan `approved` oluyor (önceden de böyleydi, bu diff değiştirmedi) | Yok. Önceden var olan durum, Açık soru 3 |
| 10 | Otomatik (data/meeting) adım → `done` | Red (INV-26) | `manualStatusError` "Bu adım veriyle tamamlanır" döndürüyor (completion.ts:233) | Test sahte-yeşil: AC5/AC17'de `if (!insight) return;` var ve ai-mock otomatik adıma öneri üretmiyor (RUL-02) |
| 11 | Otomatik adım → `in_progress` / `out_of_scope` (düzenlenmiş) | INV-26 yalnızca elle `done`'ı yasaklıyor; `updateStep`/StepDialog bu geçişlere izin veriyor | **Davranış değişti.** Önceden `isAutoStep` her durum değişikliğini reddediyordu, şimdi izin veriliyor. Bu `updateStep` ile tutarlı (tek kaynak) ama direktiften sapma ve değişiklik notunda belgelenmemiş (RUL-01) | Yok |
| 12 | Otomatik `done` → `pending`/`in_progress` | Red (INV-26) | `manualStatusError` reddediyor | Yok (önceden de vardı) |
| 13 | `ball` önerisi / düzenlemesi | `ballSince` güncellenir | Artık `updateStep` üzerinden güncelleniyor (REV-13'ün yan maddesi kapandı). ai-mock `ball` üretmiyor | Yok |
| 14 | Hata dönünce insight audit'i | Yazılmaz ("hayalet" audit olmaz) | Erken return, `setState` (store.tsx:713-717) hiç çalışmıyor | Var, AC1/AC2'de audit sayısı assert'i |
| 15 | Onay sonrası akış motoru (idempotans) | Motor kilitli adımı yeniden açmaz/kilitlemez | `setState` → `settleAll` (store.tsx:111). Kilit kuralının motor yolu bu diff'te değişmedi | Mevcut flow testleri |

AI önerileri için zorunlu kenar durumlar (rules-reviewer.md §4):
- **Hedef öneriden sonra değişti:** #2 bunu kapsıyor (kilitlenme). Diğer değişikliklerde `targetChanged` onay diyaloğunu zorunlu kılıyor (InsightCard.tsx:83).
- **Hedef başka projeye ait:** `updateStep` `projectId` karşılaştırması yapmıyor. Hedef ai-mock tarafından aynı projeden seçiliyor (ai-mock.ts:49), yani INV-23 kayıt anında sağlanıyor. Bu diff ile değişmedi, Açık soru 2.
- **Tür kapalı / güven eşiği / aynı hedef için bekleyen öneri:** Bu diff'in dokunduğu bir yol değil, değişmedi.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| RUL-01 | Low | M-closure.md REV-13 direktifi ("`isAutoStep` kontrolü olduğu gibi kalır"); INV-26 | src/lib/rabbitqa/store.tsx:687-692 | Direktif `isAutoStep` erken reddinin korunmasını istiyordu, builder bu kontrolü kaldırdı. Değişiklik notu §"Açık sorular / sapmalar" ise "Yok" diyor. Sonuç: otomatik bir adıma yönelik `step_update` artık `in_progress`/`out_of_scope`/`pending` (done'dan geri dönüş hariç) olarak onaylanabiliyor (tablo #11). Bu `updateStep`/StepDialog ile aynı ve INV-26 metnine aykırı değil; tek kaynak ilkesi açısından tercih edilebilir bile. Ancak belgelenmemiş bir davranış değişikliği. ai-mock otomatik adıma öneri üretmediği için bugün pratikte ulaşılamıyor. | Kodu değiştirme. Değişiklik notunun sapmalar bölümüne şunu ekle: "isAutoStep erken reddi kaldırıldı; otomatik adım kuralı `updateStep` → `manualStatusError` üzerinden devralınıyor, `done` dışındaki geçişlerde davranış StepDialog ile hizalandı". Planner/Murat bu sapmayı onaylasın. |
| RUL-02 | Low | INV-26, TEST_STRATEGY (sahte-yeşil test) | src/lib/rabbitqa/store.test.tsx:530-541 (AC5), :454-468 (AC17) | İki test de `if (!insight) return;` içeriyor. ai-mock yalnızca manuel adımlara `step_update` ürettiği için (ai-mock.ts:49) `approveInsight` hiç çağrılmıyor ve test hiçbir şeyi assert etmeden yeşil geçiyor. `isAutoStep` kontrolü kaldırıldığından otomatik adım reddi artık yalnızca `manualStatusError` dalına dayanıyor ve bu dal `approveInsight` üzerinden hiç test edilmiyor. | AC1'deki gibi localStorage'a doğrudan otomatik (data) adımı hedefleyen bir `step_update` insight'ı yaz. Sonra `approveInsight` → "Bu adım veriyle tamamlanır" ile adım ve öneri değişmedi diye assert et. `if (!insight) return;` korumasını kaldır. |
| RUL-03 | Low | INV-21 (hata yayılımı) | src/lib/rabbitqa/store.tsx:689-690 | Geçersiz `targetId` için yeni davranış doğru: "Adım bulunamadı" dönüyor ve öneri `pending` kalıyor (tablo #8). Önceden öneri sessizce `approved` işaretleniyordu, bu davranış farkı da hiç test edilmiyor. | Test ekle: var olmayan `targetId`'li `step_update` → `approveInsight` "Adım bulunamadı" döner, öneri `pending` kalır, audit sayısı değişmez. |

### Düzeltme direktifi
Hiçbiri engelleyici değil; ya bu branch'te ya da BACKLOG'da ele alınabilir.
1. **RUL-01:** `docs/changes/fix_m06-insight-step-lock.md` → "Açık sorular / sapmalar" bölümüne `isAutoStep` kaldırma sapmasını ve gerekçesini yaz. Kod değişikliği yok.
2. **RUL-02:** `src/lib/rabbitqa/store.test.tsx`: AC5 testini (ve isterseniz AC17'yi) localStorage'a enjekte edilen ve otomatik adımı hedefleyen insight ile yeniden yaz; erken `return` korumasını kaldır. Assert'ler: hata "Bu adım veriyle tamamlanır", adım durumu aynı, öneri `pending`.
3. **RUL-03:** `src/lib/rabbitqa/store.test.tsx`'e "geçersiz targetId → 'Adım bulunamadı', öneri pending, audit sayısı aynı" testini ekle.

### Açık sorular / öneriler (engelleyici değil)
1. **F0-01 / API taşıması (INV-05, INV-25):** `updateStep` kontrolü render anındaki `state` closure'ı üzerinde yapıyor, `patch` ise en güncel `s` üzerinde uyguluyor (store.tsx:256-263, 137-155). Demoda tek iş parçacıklı UI olduğu için sorun yok. API'de ise insight onayında adım güncellemesi aynı transaction içinde ve adım satırında `FOR UPDATE` ile yapılmalı (kontrol ile uygulama arasında akış motoru adımı kilitleyebilir). Eşzamanlılık testi parity'de koşmalı (ADR-0002). Bunu API_CONTRACT'taki REV-13 notuna eklemeyi öneririm.
2. **INV-23 (hedef proje):** Servis katmanında insight onayı `step.projectId === insight.projectId` doğrulamasını açıkça yapmalı. Demo `updateStep` bunu yapmıyor; bugün yalnızca ai-mock'un hedef seçimiyle sağlanıyor. Bu diff değiştirmedi; F0-01 notu olarak düşülmeli.
3. **Alan beyaz listesi (INV-23):** `approveInsight` `v`'nin tamamını `Partial<Step>` olarak `updateStep`'e geçiriyor. Şemasız ya da kötü niyetli bir `proposed` (ör. `phaseId`, `completion`) adımın keyfi alanlarını değiştirebilir. Bu önceden de vardı. API'de `step_update` için yalnızca `status` (ve gerekirse `ball`/`due`) kabul eden bir zod şeması olmalı.
4. **`targetId` null olan `step_update`** (store.tsx:688): Hiçbir şey uygulanmadan öneri `approved` oluyor. Bu da önceden vardı. PLN-01 (`date_change` dönüş değeri yok sayılıyor) ile birlikte ele alınabilir.

İlgili dosyalar:
- src/lib/rabbitqa/completion.ts
- src/lib/rabbitqa/store.tsx
- src/components/rq/InsightCard.tsx
- src/lib/rabbitqa/store.test.tsx
- src/components/rq/InsightCard.test.tsx
- src/lib/rabbitqa/ai-mock.ts
- docs/changes/fix_m06-insight-step-lock.md
