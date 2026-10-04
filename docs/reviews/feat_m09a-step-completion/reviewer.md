# reviewer — feat/m09a-step-completion @ c3048ec (2. tur)
**Karar:** APPROVE

İncelemeyi demo modunda (Faz M) yaptım. Backend'e ait invariant'lar (INV-01…05, 14–18 ve 21–24'ün BE kısmı) ile parity bu branch'e uygulanmıyor. CI'ı okuyamadım çünkü bu ortamda `gh` kurulu değil; demo modunda bu engel sayılmıyor. Testleri ve typecheck'i ben çalıştırmadım. "70/70 PASS" ve "tsc -p tsconfig.app.json 0 hata" iddialarını qa-verifier doğrulamalı. Ben yalnızca test sayısını saydım: completion 46 + store 23 + example 1 = 70, iddiayla tutarlı. Branch `origin/main`'in gerisinde değil (`git log HEAD..origin/main` boş). Korunan dosyalara (AGENTS.md, CLAUDE.md, .claude/, .github/, .mcp.json, package*) dokunulmamış. `docs/reviews/BACKLOG.md` değişikliği builder'dan değil, gate commit'i c3048ec'den geliyor.

**Round-1 bulgularını mevcut koddan baştan kontrol ettim:**
- **REV-01: düzeldi.** `completion: "manual"` şu dört yerde var: src/lib/rabbitqa/rules.ts:46 (`saas_env`), store.tsx:340 (`addTeam`), store.tsx:399 (`addTraining`) ve seed.ts:271 (`trainingSteps`). `buildFromTemplate` da seed.ts:171'de `?? "manual"` ile varsayılan veriyor. `activatedAt:` grep'iyle başka `Step` üreten yer bulamadım. Kontroller şu yerlerde pozitif yapılmış: completion.ts:120, ProjectDetail.tsx:345 ve :374. Regresyon testleri store.test.tsx'te var ve gerçekten sınıyor: `addTraining` testi `find(... completion === "manual")` ile adımı arıyor, yani düzeltmeden önce kırmızı olurdu.
- **REV-02: düzeldi (iddia düzeyinde).** Değişiklik notunun 51. ve 52. satırları artık gerçek komutu (`tsc -p tsconfig.app.json`) gösteriyor. 7fdd310'daki iki tip düzeltmesi (seed.ts:248 `Contact[]` ve test fixture'ı) doğru görünüyor. Çıktıyı qa-verifier doğrulamalı.
- **REV-03: büyük ölçüde düzeldi.**
  - AC16 değişmezi: completion.test.ts:415-423.
  - AC12 cancelled: store.test.tsx:139-149, anlamlı bir test.
  - AC10 out_of_scope → pending → settle: anlamlı bir test.
  - AC13 store testinin "adım done olur" kısmı hiçbir şeyi sınamıyor; ayrıntısı REV-07'de.
- **REV-04: düzeldi.** seed.ts:375-383, `createProject` (store.tsx:211-219) ile aynı `projectPlan` yöntemini kullanıyor. Yeni bir regresyon görmedim: `projectPlan` saf, adımlar `locked`, değerler `??` ile korunuyor.
- **REV-05: açık (Low).** `MkAudit` hâlâ üç yerde tanımlı: flow.ts:5, rules.ts:4, completion.ts:6. BACKLOG.md:10'a eklenmiş.
- **REV-06: düzeldi.** `m_disc_gar` artık 2026-09-30 tarihli (seed.ts:328). Bu tarih 02 aşamasının planEnd'inden (2026-10-09) önce ve bugünden önce.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-07 | Medium | Plan §10 AC13, AGENTS.md §6 (AC ↔ test), round-1 REV-03(c) | src/lib/rabbitqa/store.test.tsx:151-165; src/lib/rabbitqa/seed.ts:224-238 ve :256 | AC13 store testi `p_isyatirim` üzerinde çalışıyor. Bu projenin 03 aşaması seed'de `done` ve tüm adımları `done` yapılıyor (seed.ts:234-235). Ayrıca projede zaten `held` bir `m_devops_isy` toplantısı var (seed.ts:256). Bu yüzden `expect(afterHeld.status).toBe("done")` (satır 165) toplantı eklenmeden önce de doğru. "held'e çekilince adım completion ile done olur" iddiası sınanmıyor. Senaryo: `updateMeeting` held yolunda `devops_handover` adımı tamamlanmasa bile test yeşil kalır. Testin yalnızca top (`ball`) kısmı anlamlı. Bu da seed'deki bir tutarsızlığa dayanıyor: held devir toplantısı olduğu hâlde adımın topu `customer` kalmış (seed.ts:69'daki şablon topu). Genel "held → meeting adımı done" davranışı `brief` için store.test.tsx:103-113'te sınanıyor, bu yüzden Medium. | Testi, `devops_handover` adımı açık/kilitli olan ve held devir toplantısı bulunmayan bir projeye taşı. Örnek: `p_garanti` (03 aktif, `devops_handover` kilitli) ya da `p_ornek`. Önce `before.status !== "done"` doğrula, sonra planned → held ile `status === "done"` ve `ball === "devops"` kontrol et. İstersen İş Yatırım seed'inde `devops_handover` adımının topunu `devops` yap. |
| REV-08 | Low | INV-26, round-1 REV-01 önerisi (pozitif kontrol) | src/lib/rabbitqa/completion.ts:178; src/lib/rabbitqa/store.tsx:653 | REV-01 düzeltmesi kontrolleri yalnızca completion.ts:120 ve ProjectDetail.tsx:345/374'te pozitif yaptı. `manualStatusError` (`=== "manual"` ise null) ve `approveInsight` (`!== "manual"` ise reddet) `completion` alanı `undefined` olan bir adımı hâlâ "veri adımı" sayıyor. Motor ve UI ise aynı adımı "elle" sayıyor. Sonuç olarak bu iki katman `undefined` için zıt kararlar veriyor: UI tam durum listesini gösterir, store "Bu adım veriyle tamamlanır" der, motor da adımı hiç tamamlamaz ve adım takılır. Tip zorunlu olduğu ve tüm üretim yerleri doldurulduğu için bugün bu duruma ulaşılamıyor. Bu yalnızca savunma tutarlılığıyla ilgili. | Tek bir yardımcı ekle, örneğin `isAutoStep(s) = s.completion === "data" \|\| s.completion === "meeting"`. Dört yerde de bunu kullan; ya da completion.ts:178 ve store.tsx:653'ü aynı pozitif biçime çek. |
| REV-05 | Low | Plan §6.1 | src/lib/rabbitqa/completion.ts:6, src/lib/rabbitqa/rules.ts:4 | (Round 1'den açık) `MkAudit` üç kopya. BACKLOG.md:10'da M-09b'ye bırakılmış. | Değişiklik yok; M-09b'de `./flow`'dan import edilecek. |

### Kontrol listesi özeti (demo modu)
- **Veri değişikliği yalnızca store'dan ve audit'li:** Uyuyor.
  - `addCommitment` otomatik kuralı tek `setState` içinde ve gerekçeli (store.tsx:303-317).
  - `setNoCommitments` audit'i `patch` ile yazılıyor (store.tsx:325-331).
  - `applyMeetingHeldRules` her alan için `setStepByKey` audit'i yazıyor (rules.ts:121-134). İdempotent, çünkü değişiklik yoksa aynı referans dönüyor (rules.ts:23).
  - Otomatik tamamlama ve geri açılma "Otomatik kural: …" gerekçesiyle yazılıyor (completion.ts:134-155).
- **Gerekçe zorunlulukları:**
  - Kurulum tipi ve LLM değer değişikliği: rules.ts:105-119'daki `installChoiceError` store'da, state değişmeden önce çalışıyor (store.tsx:355-358).
  - İptal gerekçeli: store.tsx:289.
  - Planlandı → Yapıldı gerekçesiz; bu plan S4'teki varsayım.
- **Rol kontrolü:** Bileşenlerde yeni rol karşılaştırması yok. "Yapıldı olarak işaretle" (ProjectDetail.tsx:633, :646) ve "Taahhüt yok" `canManageProject` kullanıyor; StepDialog `canEditItem` / `canEditFlow` kullanıyor.
- **Yeni paket:** Yok; package*.json değişmemiş.
- **Enum değerleri:** Mevcut değerler değişmemiş. Yalnızca `StepCompletion` ve `MeetingStatus` tipleri ile `brief` / `devops_handover` etiket metinleri eklenmiş (labels.ts:34-37).
- **State sürümü:** KEY ve sürüm birlikte artmış: seed.ts:445 `version: 9`, store.tsx:21 ve :28.
- **Mantığın yeri:** Tamamlama yalnızca `completion.ts`'te. `flow.ts` değişmemiş; completion.ts:166 yalnızca `advanceFlow`'u çağırıyor. Uyarı değişikliği alerts.ts:67'de held filtresi. `setState` → `settleAll` (store.tsx:115) ve seed sonu (seed.ts:525).
- **Toplantı tüketicileri:**
  - `held` filtresi şu yerlerde var: completion.ts:97, alerts.ts:67, Phase2Tabs.tsx:42.
  - `cancelled` filtresi Overview.tsx:85'te var.
  - Toplantı oluşturan iki yer `status` gönderiyor: ProjectDetail.tsx:759 ve Phase3Tabs.tsx:469.
- **Kaldırılan `install_type` / `llm`:** `grep` sonucu yalnızca completion.test.ts:380'deki negatif testte eşleşme var. Değişiklik notu 67. satırdaki iddia doğru.
- **Plan uyumu:** Kapsam kayması görmedim. §8'deki UI maddeleri (StepDialog'un kısıtlı Select'i ve ✓/✗ listesi, MeetingDialog'un Durum/Takım alanları, "Henüz belli değil" seçeneğinin pasif olması, Admin'deki etiket ve silme koruması) kodda var.

### Düzeltme direktifi
(Engelleyici değil; Medium → BACKLOG ya da isteğe bağlı küçük bir fix commit'i.)
1. **[REV-07]** `src/lib/rabbitqa/store.test.tsx:151-165`'teki testi held devir toplantısı olmayan bir projeye taşı (`p_garanti` ya da `p_ornek`). Testin başına `expect(before.status).not.toBe("done")` ekle. Planned eklemeden sonra `ball` ve `status`'un değişmediğini, held'e çekince `ball === "devops"` ve `status === "done"` olduğunu doğrula.
2. **[REV-08]** `src/lib/rabbitqa/completion.ts:178` ve `src/lib/rabbitqa/store.tsx:653`'te kontrolü `completion === "data" || completion === "meeting"` biçimine getir, ya da tek bir yardımcı fonksiyona taşı. Test: `completion` alanı silinmiş bir adımda `manualStatusError(..., "done")` null döner.

### Açık sorular / öneriler (engelleyici değil)
- Plan §4 gereği, merge'den sonra ana oturum `docs/AUDIT.md`'yi (52 → 53 işlem, v8 → v9) ve AGENTS.md'deki "Mockup yapısı" bölümünde geçen "State v8 (`rabbitqa-demo-state-v8`) … 52 işlem" ifadesini (AGENTS.md:29) güncellemeli.
- Plan dosyası `main` yerine bu branch'ten geliyor (2bf2de9). Bu iş akışı açısından Murat'ın onayına bağlı.
- Phase2Tabs.tsx:450 ve Phase3Tabs.tsx:353'teki toplantı listeleri durumu göstermiyor; planlı ya da iptal toplantı "yapılmış" gibi listelenebilir. Bu, plan kapsamı dışında bir UI iyileştirmesi (M-09b).
- `updateMeeting` ve `setNoCommitments` render anındaki `state` closure'ını okuyor (store.tsx:286, :326). Bu mevcut desenle tutarlı. Aynı handler içinde `addMeeting` hemen ardından `updateMeeting` çağrılırsa "Toplantı bulunamadı" döner; bugün UI'da böyle bir akış yok.
