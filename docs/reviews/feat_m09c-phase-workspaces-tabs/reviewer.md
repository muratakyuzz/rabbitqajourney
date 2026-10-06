## reviewer — feat/m09c-phase-workspaces-tabs @ 9171430 (round 2)
**Karar:** APPROVE

Mod: Demo (Faz M). BE invariant'ları (INV-01…05 BE kısmı, 14–18, 21–24) uygulanmaz. `gh` CLI kurulu olmadığı için CI ve parity sonucu okunamadı; Faz M demo modunda bu engel sayılmaz. Reviewer rolü test çalıştırmadığı için 197/197 test sonucu doğrulanmadı, değişiklik notundaki beyana dayanıyor; komut kanıtı qa-verifier'ın işi.

Kapsam notu: Görev metni "REV-01…REV-21" diyor. m09c round 1 reviewer raporunda yalnızca REV-01…REV-11 var (`docs/reviews/feat_m09c-phase-workspaces-tabs/reviewer.md`). Değişiklik notunda geçen REV-08/10/15/16/18/19/20/21 numaraları m09b backlog ID'leri. Round 2'de m09c'nin REV-01…11 bulguları ve rules-reviewer'ın round 1'de verdiği RUL-01…06 düzeltme iddiaları doğrulandı.

### Round 1 bulgularının doğrulanması
| ID | Round 1 sev. | Durum | Kanıt |
|---|---|---|---|
| REV-01 / RUL-01 | High | **Kapandı** | `src/lib/rabbitqa/rules.ts:135-138`: On-prem dalında aşama `done` iken artık `cancelReviewAction(saas.id)` çağrılıyor, `ensureReviewAction` kaldırıldı. Test `completion.test.ts:824`: p_isyatirim'de On-prem→SaaS→On-prem→SaaS geçişleri yapılıyor. Aksiyon open → cancelled (status audit'i ve reason assert ediliyor) → aynı id ile tekrar open; aksiyon adedi 1, `saas_env` adedi 1. |
| REV-02 / RUL-02 | High | **Kapandı** | `src/lib/rabbitqa/store.tsx:336-366`: `phaseClosed` ile 05 `out_of_scope` iken yeni adım `out_of_scope` doğuyor. Create reason "…05 Uyarlama aşaması kapsam dışı". Aksiyon yalnızca `done` iken açılıyor; `adapt:general` dalı yalnızca `!phaseClosed` iken çalışıyor. Testler `store.test.tsx` "REV-02/RUL-02: 05 done …" ve "…05 out_of_scope …" (seed fixture'ı localStorage ile zorlanıyor). |
| REV-03 / RUL-03 | High | **Büyük ölçüde kapandı.** Kalan boşluklar Medium (REV-12). | (a) 05 done `addTeam`: store.test "REV-02/RUL-02: 05 done" (adım, create reason, owner/ball/title, 05 done kalıyor, ikinci çağrı no-op; `due` assert edilmiyor). (c) `completion.test.ts:853`, (d) :870, (e)/(f) :889, (g) :922, (i) :957 eklendi ve senaryoyu gerçekten sınıyor. (b)/(d-r1) saas_env create audit'i ve (h) ayırt edicilik için bkz. REV-12. |
| REV-04 / RUL-05 | Medium | Kapandı (kısmi; bkz. REV-13) | AC13/14/15 "kısmi" olarak işaretlendi, `STEP_CONDITIONS[` grep çıktısı eklendi, RUL-05 (m09a) kanıtı `store.test.tsx:208` olarak düzeltildi. RUL-02 (m09b) testi p_lojistik ile gerçek `pending` durumunu sınıyor (`expect(...).toBe("pending")`). RUL-06 (m09b) testi 4 anahtarın tekilliğini ve geçiş başına ≥3 audit'i assert ediyor. |
| REV-05 | Medium | Düzeltilmedi, BACKLOG'da | `docs/reviews/BACKLOG.md:97` satırında var. Medium olduğu için kabul edilebilir. |
| REV-06 | Low | Kapandı | `Phase2Tabs.tsx`: kullanılmayan import'lar ve `NONE` silindi. |
| REV-07 | Low | Kapandı | `AccessTab` sarmalayıcısı silindi. |
| REV-08 | Low | Kapandı | `AdaptationWorkspace.tsx:73-79`: ölü dal kaldırıldı, "Takım tanımlanmadı" EmptyState Genel kartın üstünde. |
| REV-09 | Low | Kapandı | `seed.ts:456`: `p6OutOfScopeKeys` artık `reqdoc` içeriyor. |
| REV-10 | Low | Kapandı | `rules.ts:20`: `ensureReviewAction(s, projectId, step, mk, reason)`. `store.tsx:338-339`: `Math.max(order)+1`. Test "REV-10: new team's order…". |
| REV-11 | Low | Kapandı | `ProjectDetail.tsx:312-314, 395-397`: tooltip satır satır gösteriliyor. `HandoverWorkspace.tsx:63`: `rule_review:` önekli aksiyonlar filtreleniyor. |
| RUL-04 | Low | Kapandı (testsiz; REV-12) | `rules.ts:123-124`: create reason "kurulum tipi SaaS — 03 … aşaması tamamlanmıştı" oldu, plan §6.2 madde 2 ile aynı. |
| RUL-06 | Low | Kapandı | `store.tsx:335` (`team.trim().toLowerCase() === "general"` reddi) ve `DiscoveryContent.tsx:31-34` (toast). Test "RUL-06: rejects 'general'…". |

Round 1'den açık kalan High veya Critical bulgu yok. 2cfb718..HEAD aralığında korunan dosyalara (AGENTS.md, CLAUDE.md, .claude/, .github/, .mcp.json), `package*.json`'a ve `components/ui`'ye dokunulmadı. Bileşenlere yeni rol karşılaştırması eklenmedi. Enum değerleri ve `STATE_VERSION` (11) değişmedi.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-12 | Medium | Plan AC19, §6.2 madde 2, §6.2 "LLM_ACTIONS… Uygulayıcı bunu bir testle sabitler"; INV-06 | `src/lib/rabbitqa/rules.ts:123-124`; `src/lib/rabbitqa/completion.test.ts:824-851, 933-955`; `src/lib/rabbitqa/store.test.tsx` (setInstallChoice blokları) | AC19 için kalan test boşlukları: **(1)** RUL-04 ile değişen `saas_env` create audit reason'ı ("Otomatik kural: kurulum tipi SaaS — 03 … aşaması tamamlanmıştı") hiçbir testte assert edilmiyor; grep sonucu `adım açıldı` / `aşaması tamamlanmıştı` için yalnızca addTeam assert'i var. REV-01 testi (:824) adımın `out_of_scope` doğduğuna bakıyor ama create audit'e bakmıyor. Metin yeniden bozulsa testler yakalamaz. **(2)** Test (h) (:933) iki mekanizmayı ayırt etmiyor: own'a geçişte aksiyonu `model_install` iptal yolu kapatıyor (yorum :948 bunu açıkça yazıyor), gpu'ya dönüşte `ensureReviewAction` açıyor. `LLM_ACTIONS` döngüsü `rule_review:*`'a dokunsa da sonuç aynı çıkar. Kod doğru (`rules.ts` LLM_ACTIONS üyelik filtresi), sabitleyen test yok. **(3)** Store seviyesinde aynı `setInstallChoice({installType})` çağrısının ikinci kez audit veya aksiyon üretmemesi test edilmiyor; yalnızca `llmChoice` için var (`store.test.tsx:668-670`). **(4)** 05 done `addTeam` testinde aksiyonun `due`'su assert edilmiyor. | (1) `completion.test.ts:824` testine `next.audit.find(kind==="create" && entityId===saasEnv.id).reason === "Otomatik kural: kurulum tipi SaaS — 03 <ad> aşaması tamamlanmıştı"` ekle. (2) Ayırt edici test: `rule_review:<reqdocId>` açıkken (`fixtureWithOutOfScopeReqdoc` + onprem) `applyLlmChoice` ile rabbitqa→own→rabbitqa yap ve bu aksiyonun status'ünün değişmediğini, entityId'si için yeni audit oluşmadığını assert et. (3) store.test'te `setInstallChoice(pid,{installType:"onprem"})` çağrısını iki kez yap, ikinci çağrıda audit ve aksiyon sayısı değişmesin. (4) `expect(action.due).toBe(addBusinessDays(todayISO(), 2))`. |
| REV-13 | Low | AGENTS §5.6 (değişiklik notu eksiksiz ve doğru), Demo kuralları | `docs/changes/feat_m09c-phase-workspaces-tabs.md:8, 67, 81, 101` | Değişiklik notunda round 2 sonrası güncellenmemiş veya fazla güçlü iddialar var. :8 "5 commit" diyor; fix commit'leri (dc7584c…9171430) "Ne değişti"de yok, yalnızca "Review düzeltmeleri" tablosunda. :101 "kural motorunda … değişiklik yapılmadı" diyor; dc7584c, 4d753b7 ve 9890b44 `rules.ts`'i değiştirdi. :81'deki `store.tsx:381-382` referansı artık eskimiş, gerçek satırlar `store.tsx:387-388`. :81 RUL-08'i "test düzeltme" ile kapanmış gösteriyor, oysa `store.test.tsx:322-331` testi hâlâ iki çağrıyı ayrı `act()` içinde yapıyor ve yine dıştaki `choiceErr` yolunu sınıyor. Değişen tek şey yorum. Test adı ("re-invoked with the updater's own cur") içeriğini yansıtmıyor. :67 AC19 satırı "(c)-(i) eklendi" diyor; (b) ve create audit kısmı eksik (REV-12). | "Ne değişti"ye fix commit'lerini ekle. :101'i düzelt. :81'deki satır referansını 387-388 yap ve RUL-08'i "kod kapalı; updater yeniden doğrulamasının testi yok, bkz. Açık sorular" olarak yaz. Test adını davranışına göre değiştir (ör. "rejects reasonless onprem→saas after onprem was set"). |
| REV-14 | Low | Kod/test kalitesi | `src/lib/rabbitqa/completion.test.ts:957` | Test (i)'nin adı "…on On-prem->SaaS and opens a review action for each" diyor, gövde ise `applyInstallType(scoped, pid, "onprem", …, "saas")` ile SaaS→On-prem yapıyor. | Adı "on SaaS->On-prem" olarak düzelt. |
| REV-15 | Low | Plan §6.2 / §315 toast metinleri | `src/pages/project/DiscoveryContent.tsx:36-40` | 05 `out_of_scope` iken takım eklenince toast "Takım eklendi, Uyarlama aşamasına adım açıldı" diyor. Oysa adım `out_of_scope` doğuyor (REV-02 düzeltmesi), kullanıcı kapsam dışı bir adım için "açıldı" mesajı görüyor. Plan bu durum için metin tanımlamıyor. | 05 `out_of_scope` için ayrı bir metin kullan (ör. "Takım eklendi; Uyarlama aşaması kapsam dışı olduğu için adım kapsam dışı") ya da açık soru olarak not et. |
| REV-16 | Low | Tutarlılık (INV-06 gerekçe metni) | `src/lib/rabbitqa/rules.ts:138` | SaaS→On-prem'de `saas_env` aksiyonu iptal edilirken sabit bir reason kullanılıyor: "kurulum tipi değişti, gözden geçirme gereksiz". Diğer tüm iptal çağrıları (`rules.ts:96, 111`, LLM dalı) `installTypeReasonText(...)` ya da LLM `reasonText` kullanıyor. Audit geçmişinde hangi geçişin iptali tetiklediği (from→to, aşama) bu satırda yazmıyor. Plan iptal metnini tanımlamıyor; bilgi eksik ama yanlış değil. | Tutarlılık için `installTypeReasonText(type, from, \`${phase.code} ${phase.name}\`)` kullan ve `completion.test.ts:842` assert'ini buna göre güncelle. Mevcut metin bilinçli bir seçimse değişiklik notuna sapma olarak yaz. |

### Kontrol özeti (round 2'de bulgu çıkmayanlar)
- **INV-05/06 (audit + gerekçe):** Yeni ve değişen tüm yazma yolları audit yazıyor. `addTeam` out_of_scope create reason'ı, `cancelReviewAction` status audit'i ve reopen için alan başına update audit'i mevcut. Bileşende doğrudan state değişikliği yok; DiscoveryContent yalnızca ön doğrulama ve toast yapıyor, yazma `addTeam` üzerinden geçiyor.
- **INV-07/08/09 (RUL-05 Seçenek A):** `done` aşamada adım durumu değişmiyor. REV-01 ve REV-02 senaryoları artık doğru, testleri de var. `out_of_scope` aşamada aksiyon açılmıyor.
- **INV-13:** Diff'teki tek tarih aritmetiği `addBusinessDays(todayISO(), 2, holidayDates(...))`, değişmedi.
- **INV-25:** 05 kapalıyken kalıcı kilitli adım üretilmiyor (REV-02).
- **RBAC / perm.ts:** Fix commit'leri yetki koduna dokunmuyor. `perm.ts` ve `workspaceAvailable` round 1'deki gibi.
- **Seed (REV-09):** p_perakende'de `reqdoc` artık `out_of_scope`. Seed invariant istisnası (`completion.test.ts:610-617`) yalnızca 01'i done olan On-prem projeler için anlamını koruyor.
- **Web:** Yeni `any`, `dangerouslySetInnerHTML` ya da `components/ui` değişikliği yok. Metinler Türkçe.

### Düzeltme direktifi
(Karar APPROVE. Aşağıdakiler BACKLOG'a alınabilir ya da istenirse aynı branch'te bir `/fix` turunda yapılabilir.)
1. **[REV-12]** `src/lib/rabbitqa/completion.test.ts:824`: saas_env create audit reason'ını birebir assert et ("Otomatik kural: kurulum tipi SaaS — 03 <phase.name> aşaması tamamlanmıştı"). `completion.test.ts`'e ayırt edici bir LLM_ACTIONS testi ekle: `fixtureWithOutOfScopeReqdoc()` + `applyInstallType(onprem)` ile `rule_review:<reqdocId>` açılsın, ardından `applyLlmChoice` rabbitqa→own→rabbitqa yapılsın; aksiyonun status'ü `open` kalsın, bu entityId için yeni audit oluşmasın. `store.test.tsx`'e installType idempotans testi ekle (aynı `setInstallChoice(pid,{installType:"onprem"})` iki kez çağrılır, audit ve aksiyon sayısı değişmez). 05 done `addTeam` testine `due` assert'i ekle.
2. **[REV-13]** `docs/changes/feat_m09c-phase-workspaces-tabs.md`: "Ne değişti"ye fix commit'lerini ekle. :101'deki "kural motorunda değişiklik yapılmadı" cümlesini düzelt. :81'deki `store.tsx:381-382` referansını `387-388` yap ve RUL-08 kanıtını "updater yeniden doğrulaması testsiz" olarak yaz. `store.test.tsx:322` testinin adını içeriğine uygun hale getir.
3. **[REV-14]** `completion.test.ts:957` test adındaki yönü "SaaS->On-prem" olarak düzelt.
4. **[REV-15]** `DiscoveryContent.tsx:36-40`: 05 `out_of_scope` için ayrı toast metni kullan.
5. **[REV-16]** `rules.ts:138`: iptal reason'ını `installTypeReasonText(...)` ile kur ya da sapmayı nota yaz.

### Açık sorular / öneriler (engelleyici değil)
- **BACKLOG'a eklenmesi gereken yeni bulgu (builder bildirdi, gate kaydetmeli):** Aynı `act()` ya da render döngüsünde `setInstallChoice` iki kez çağrılırsa ikinci çağrının dış kontrolü bayat closure `state`'ini görüyor. Updater değişikliği doğru şekilde reddediyor ama `runtimeError` updater render sırasında çalıştığı için dönüş değeri `error: null` geliyor (`src/lib/rabbitqa/store.tsx:377-389`). Sonuçta UI başarı toast'ı gösterebilir ama state değişmez. `store.test.tsx:316-320` yorumu bu kaydın BACKLOG.md'de olduğunu söylüyor, ama `docs/reviews/BACKLOG.md`'de yok (yalnızca eski RUL-08 satırı :84 var). Low/Medium, hedef F1 (API'ye geçişte senkron sunucu yanıtı bu sorunu kendiliğinden çözer).
- Round 1'deki açık sorular hâlâ geçerli ve BACKLOG'da kayıtlı: DevOps için `canSeeCredentials` kapsamı, admin'in panelleri düzenleyebilmesi, RUL-05 aksiyonunun açıldığı anda `action_due_soon` üretmesi, `todayISO()`'nun saat dilimi.
- REV-05 (Medium, sekme sırası ve panel içeriği assert'leri) bilinçli olarak backlog'a bırakıldı. Kaydı `docs/reviews/BACKLOG.md:97`'de duruyor.
- Medium bulgu REV-12 `docs/reviews/BACKLOG.md`'ye eklenmeli.

İlgili dosyalar:
- src/lib/rabbitqa/rules.ts
- src/lib/rabbitqa/store.tsx
- src/lib/rabbitqa/completion.test.ts
- src/lib/rabbitqa/store.test.tsx
- src/pages/project/DiscoveryContent.tsx
- docs/changes/feat_m09c-phase-workspaces-tabs.md
- docs/reviews/BACKLOG.md
