# reviewer — main (bütünsel, demo modu) — round 2 @ 0c1193b

**Karar:** CHANGES_REQUESTED

Yeni bir blocker ihtimali var: **REV-13 (High, INV-25)**. Arayüzden ulaşılabiliyor ve kilitli olmayan bir adım elle "Sırası gelmedi" yapılabiliyor. Mimari bir sorun değil, düzeltmesi 3-5 satır. Round 1'de REV-01'i blocker yapan iki gerekçe burada da geçerli: kod görsel baseline'a giriyor ve F0-01'e kaynak oluyor. Freeze'den önce bir `/fix` turuyla kapatılması öneriliyor; nihai GO/NO-GO kararı planner'a ve Murat'a bırakılıyor. Kalan bulgular Medium/Low.

Kapsam: `.verify/main/src/` altındaki bütün kod tarandı: store `Ctx` (51 işlem), perm, flow, completion, rules, reports, ai-mock ve tüm ekranlar. Arayüzdeki her mutasyon çağrısı tek tek gezildi (`grep update*/complete*/set*`), her tarih girişi de kontrol edildi (`type="date"`). BE invariant'ları (INV-01…05, 14–18, 21–24) demo modunda uygulanmıyor, blocker sayılmadı. CI ve `gh` okunmadı; demo modunda bu engelleyici değil.

### Round 1'den kapanan: REV-01
UI (Phase3Tabs.tsx:357,418-423,432-434) ve store (store.tsx:506-508) durum ve termin için gerekçe istiyor. Testler: store.test.tsx:674-713, Phase3Tabs.RiskDialog.test.tsx. Açık kalan uzantılar: REV-M06-01/RUL-01 (`decidedAt`, Medium, Murat kararı), RUL-02 (Phase3Tabs.tsx:434), REV-M06-02/03, RUL-04 (Low) — bunlar BACKLOG'da.

### Yeni bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-13 | High | INV-25, AGENTS demo kuralı ("kilitli adımın durumu elle değişmez") | src/lib/rabbitqa/store.tsx:689-694; src/components/rq/InsightCard.tsx:157-161,187; src/lib/rabbitqa/labels.ts:18-20 | `approveInsight` `step_update` önerisini `updateStep` üzerinden değil, doğrudan `patch<Step>(...)` ile uyguluyor. Yalnızca `isAutoStep` kontrol ediliyor; `updateStep`'teki kilit kontrolleri (store.tsx:259-262, "Sırası gelmedi elle seçilemez") ve `ballSince` güncellemesi atlanıyor. "Düzenle ve onayla" diyaloğundaki Durum seçicisi tam `STEP_STATUS_LABEL` listesini kullanıyor, buna `locked: "Sırası gelmedi"` da dahil. **Senaryo:** Projeyi gören herhangi bir kullanıcı (`canReviewInsight`, DevOps/Care dahil) şu adımları izler: Insights → `step_update` önerisi → Düzenle ve onayla → Durum: "Sırası gelmedi" → Onayla. Açık bir manuel adım tekrar kilitlenir. Akış motoru adımı ancak önceki adım `done` ise yeniden açar (flow.ts:52-57). Önceki adım yeniden açılmışsa adım süresiz kilitli kalır: işten düşer, kimseye atanmaz, uyarı vermez. Önceki adım `done` ise motor adımı açar ama termini yeniden hesaplar (flow.ts:59), yani termin gerekçesiz değişir. Bu yolu kapsayan test yok; store.test.tsx:454 (AC17) yalnızca otomatik adımı kapsıyor. | (1) store.tsx:689-694'te `patch` yerine `const err = api.updateStep(ins.targetId, v as Partial<Step>, reason); if (err) return err;` kullan. `isAutoStep` kontrolü kalsın. (2) InsightCard.tsx:187'de `step_update` için `locked` değerini seçeneklerden çıkar (StepDialog ProjectDetail.tsx:466 ile aynı desen). (3) Test ekle: düzenlenmiş `{status:"locked"}` ile `approveInsight` hata döner, adım `pending` kalır, öneri `pending` kalır. |
| REV-14 | Medium | INV-06 ("tarih değişikliği"), REV-M06-01 ile aynı sınıf | src/pages/project/ProjectDetail.tsx:556,582,590-593 | `PhaseDialog`'da `needsReason` yalnızca durum, `planStart` ve `planEnd` değişikliklerini kapsıyor. "Gerçekleşen başlangıç" (`actualStart`) gerekçesiz değişiyor ve haftalık rapor snapshot'ına giriyor (reports.ts:41). Store'da da kontrol yok (REV-06). | REV-M06-01 (`decidedAt`) ile aynı Murat kararına bağla: INV-06'daki "tarih" gerçekleşen/karar tarihlerini de kapsıyorsa `needsReason`'a `|| (actualStart || null) !== phase.actualStart` eklenmeli. |
| REV-15 | Low | Ölü kod / INV-06 (Faz 2) | src/pages/project/Phase3Tabs.tsx:141-290 (283); src/pages/ProjectDetail.tsx:163-168 | `TicketsTab`/`TicketDialog` hiçbir `TabsContent` içinde render edilmiyor; sekme `disabled` ve `?tab=tickets` "phases" sekmesine düşüyor. Bu yüzden ulaşılamıyor, ama diyalog durum değişikliğini gerekçesiz kaydediyor (`updateTicket(ticket.id, d)`). Faz 2 bu kodu olduğu gibi canlandırırsa INV-06 açığı birlikte gelir. | F0-01 / API_CONTRACT'a "ticket durum değişikliği reason zorunlu" notunu düş. Faz 2 planında kabul kriteri olarak ekle. |

### Round 1 bulguları: yeniden doğrulama
| ID | Sev. | Durum @ 0c1193b | Kanıt |
|---|---|---|---|
| REV-02 | Med | Hâlâ geçerli, değişmedi | ProjectDetail.tsx:69 ve CustomerReport.tsx:27 `visibleProjects` kontrolü yapmıyor |
| REV-03 | Med | Hâlâ geçerli | perm.ts:59-60 |
| REV-04 | Med | Hâlâ geçerli | perm.ts:4-9 (`isAllSeeing` → `canManageProject`). Admin ayrıca AI onayıyla proje verisi yazabiliyor (store.tsx:708-711); RBAC kararı 1 ile tablonun AI satırı çelişiyor. |
| REV-05 | Med | Hâlâ geçerli | store.tsx:321, 523 → `setStepByKey` kilit kontrolü yapmıyor |
| REV-06 | Med | Hâlâ geçerli (yalnızca `updateRisk` düzeldi) | store.tsx:236-246, 256-269, 271, 317, 492-500: gerekçe kontrolü store'da değil, yalnızca UI'da |
| REV-07 | Low | Hâlâ geçerli | store.tsx:482 no-op `support_track` |
| REV-08 | Low | Hâlâ geçerli | types.ts:321, seed.ts:605 (`reportsSent` okunmuyor) |
| REV-09 | Low | Hâlâ geçerli | store.tsx:173, 487 (`"system"`, `"auto"`), 100 (`userId ?? "system"`) |
| REV-10 | Low | Hâlâ geçerli | Overview.tsx:35, MyWork.tsx:28,38 (`isOpenStep` kopyaları) |
| REV-11 | Low | Hâlâ geçerli | reports.ts:32,54 `isCustomerVisible !== false` (fail-open) |
| REV-12 | Low | Hâlâ geçerli | AGENTS.md:28-29 "main @ 4bfa4cb, v8, Ctx 52"; gerçek değerler v11 (seed.ts:127-128) ve 51 işlem (store.tsx:43-93). AUDIT.md §5 tablosu v3'te kalmış (AUDIT.md:51-63). |

### Kontrol sonuçları
1. **INV-06 taraması (tüm ekranlar):** Gerekçe istenen yerler: adım (ProjectDetail.tsx:461), aşama (556), aksiyon (657), taahhüt (HandoverWorkspace.tsx:269), risk (Phase3Tabs.tsx:357), sağlık (ProjectDetail.tsx:213), kurulum/LLM (HandoverWorkspace.tsx:31-46 + store), uyarı erteleme/kapatma (store.tsx:455,467), toplantı iptali ve held toplantının tür/tarih değişikliği (store.tsx:286-289), Go-Live (store.tsx:516), AI tarih/sağlık önerisi (InsightCard.tsx:153). Açık kalanlar: REV-14 (`actualStart`), REV-M06-01 (`decidedAt`), REV-15 (ulaşılamayan ticket). Planlandı→Yapıldı işaretlemesinin gerekçesiz olması bilinçli bir varsayım (BACKLOG S4, Murat kararı bekliyor).
2. **INV-25/26:** StepDialog ve PhaseDialog kilitli durumu doğru engelliyor. AI onay yolu kilidi atlıyor (REV-13). REV-05 açık.
3. **INV-07/08/27:** Baseline korunuyor (ProjectDetail.tsx:593, store.tsx:214). `completePhase` zorunlu adım kontrolü yapıyor (store.tsx:251). Gönderilmiş rapor düzenlenemiyor (store.tsx:557,570).
4. **Demo kuralları:** `perm.ts` dışında yetki amaçlı rol karşılaştırması yok. Kalan rol karşılaştırmaları atama varsayılanı (Phase3Tabs.tsx:210, rules.ts:12), son admin koruması (store.tsx:590-591) ve Overview'daki içerik ayrımı. Her mutasyon audit yazıyor. State sürümü ve KEY birlikte (v11). Fix commit'inde paket, tip ya da seed değişikliği yok (`git diff 3727275 0c1193b`). `dangerouslySetInnerHTML` yok. `as any` yalnızca InsightCard.tsx:58-59'da (Low, mevcut).
5. **DATA_MODEL / F0-01 kaynağı:** Engelleyici bir çelişki yok. F0-01'e taşınması gerekenler: `approveInsight`'ın mevcut servis fonksiyonlarını kullanması zorunlu (INV-21 ve REV-13; `step_update` bugün kullanmıyor). REV-06'daki gerekçe kontrolleri sözleşmede yer almalı. `"system"`/`"auto"` sentinel'leri REV-09'a göre DATA_MODEL §9'a yazılmalı.

### Düzeltme direktifi
1. **REV-13** (`/fix`, ör. `fix/m06-insight-step-lock`): store.tsx:689-694'te `step_update` dalını `api.updateStep(...)` üzerinden geçir, hata dönerse öneriyi onaylanmış işaretleme. InsightCard.tsx:187'de `step_update` için `locked` seçeneğini kaldır. store.test.tsx'e test ekle: "düzenlenmiş locked durumu reddedilir; adım ve öneri değişmez". Gate: reviewer + qa-verifier + rules-reviewer (akış kuralı değiştiği için).
2. (İsteğe bağlı, aynı tur) RUL-02 (Phase3Tabs.tsx:434): `needsReason ? reason.trim() : undefined` kullan. REV-07 (store.tsx:482): satırı sil.

### Açık sorular / öneriler (engelleyici değil)
- INV-06'daki "tarih değişikliği" hangi tarihleri kapsıyor: termin/plan mı, yoksa gerçekleşen/karar tarihleri de mi? Bu karar REV-14 ve REV-M06-01'i birlikte çözer.
- REV-13'ün freeze'i engelleyip engellemediğine planner karar versin. Reviewer önerisi: REV-01 ile aynı mantık geçerli, yani hatalı seçici baseline'a giriyor ve `patch` ile atlama F0-01'e kaynak oluyor; düzeltme maliyeti de düşük.
- Medium bulgular BACKLOG'a aktarılmalı: REV-14 ve hâlâ açık olan REV-02…06.
