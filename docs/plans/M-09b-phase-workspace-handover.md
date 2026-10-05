# M-09b — Aşama çalışma alanı altyapısı ve 00 Satış Devri paneli; Satış devri ve Kick-off sekmeleri kalkar

**Durum:** Tamamlandı (main'e merge edildi, main @ aee9657, 2026-10-05). Onaylandı (Murat, 2026-10-04 — S1–S8 cevapları §11'de karar olarak işlendi)
**Spec referansı:** docs/PRODUCT_SPEC.md → Ek B.2 (son madde: "Aşamanın verisi aşamanın çalışma alanında (sağ panel) girilir; eksik adıma tıklanınca eksik alan vurgulanır"), Ek B.2 tamamlanma tipleri (satır 324–325), B.1 (kilitli adım iş sayılmaz), 00 Satış Devri, 01 Kick-off
**Üst plan:** docs/plans/M-09-step-completion-workspaces.md → M-09b. Bu doküman o görev metnini main'deki gerçek M-09a koduna (main @ f9bc25f) göre eşler ve test edilebilir hale getirir. İkisi çelişirse bu doküman geçerlidir.
**Branch:** feat/m09b-phase-workspace-handover (main'den)
**Bağımlılıklar:** M-09a (main'de, tamamlandı). M-09c bu PR'ın altyapısını (`PHASE_WORKSPACES`, `PhaseWorkspaceSheet`, `highlightField`, `MeetingDetailDialog`, `DocumentUploadDialog`) kullanacak.
**Mod:** Demo (Faz M). Backend, DB, migration ve API yok.

## 1. Amaç
Aşamanın verisi aşamanın altında girilsin. Aşama kartından ya da eksik bir adıma tıklayınca o aşamanın formu sağdan açılan panelde (Sheet) açılır. Form doldukça adımlar M-09a motoruyla kendiliğinden tamamlanır. "Satış devri" ve "Kick-off" sekmeleri kalkar.

Kick-off'a özgü üç proje alanı (`presentationShared`, `reqDocShared`, `reqDocSharedAt`) silinir. Yerlerini adımlar alır:
- **Kurulum gereksinim dokümanı** (`reqdoc`) artık **veriyle** tamamlanan bir adım. `req_doc` türünde doküman yüklenince kendiliğinden tamamlanır.
- **Onboarding sunumu** (`presentation`) elle tamamlanan adım olarak kalır.

## 2. Kapsam
- **Genel altyapı:** `PHASE_WORKSPACES` eşlemesi, `PhaseWorkspaceSheet`, `data-field` vurgulama yardımcısı, adım satırı tıklama yönlendirmesi (`stepClickTarget`), "Formu aç" düğmesi, eski sekme parametresinin yönlendirilmesi.
- **00 Satış Devri çalışma alanı.** `HandoverTab` ve `KickoffTab`'ın kurulum tipi/LLM bölümü buraya **taşınır**, kopya kalmaz. Bölümler: Devir · Kurulum ve LLM · Taahhütler · Dokümanlar (Teklif/Sözleşme kutucukları) · Satış devri toplantısı.
- **Paylaşılan bileşenler:**
  - `MeetingDialog`, `ProjectDetail.tsx`'ten ayrı dosyaya taşınır (döngüsel import olmasın diye).
  - Yeni salt okunur `MeetingDetailDialog`.
  - `DocumentsTab`'daki satır içi ekleme formu `DocumentUploadDialog`'a çıkarılır. DocumentsTab da aynı bileşeni kullanır.
- **01 Kick-off:** çalışma alanı yok. Kick-off sekmesi ve `KickoffTab` silinir. `presentationShared`, `reqDocShared` ve `reqDocSharedAt` alanları `types.ts`'ten çıkar. `reqdoc_not_shared` uyarısı adım durumunu okur.
- **`reqdoc` adımı veriyle tamamlanır (S5):**
  - `PHASE_TEMPLATE`'te `completion: "data"` olur.
  - `STEP_CONDITIONS`'a `reqdoc` koşulu eklenir (`doc:req_doc`).
  - `addDocument`'taki `req_doc` → `reqdoc` özel kuralı silinir; tamamlamayı `settleAll` yapar.
  - Bu, RUL-13'ü yapısal olarak kapatır: motor `out_of_scope` adımı ve aşamayı atlar.
- **Store:**
  - `setKickoff` → `setInstallChoice` (yalnızca kurulum tipi/LLM).
  - "Tamamlandı: <adım>" toast'ı (`flowMessages`).
  - Toast mesajları birikir, kaybolmaz.
- **State v9 → v10:** sürüm sabiti tek yerde tutulur. `auth-api.ts`'deki eski `v8` anahtarı düzeltilir. Bu, M-09a'dan kalan bir hata: Admin'den eklenen kullanıcılar giriş yapamıyor.
- **Yetki:** `perm.ts`'e `canAssignCsm` eklenir (yalnızca Manager, S3).
- **Bu PR'ın dokunduğu satırlardaki backlog maddeleri (`docs/reviews/BACKLOG.md`):**
  - REV-05, REV-08, RUL-09, RUL-10, RUL-11
  - RUL-12 (yalnızca reqdoc sınırı)
  - RUL-13
  - BACKLOG satır 34 ("`reqdoc` adımı `manual` kaldı", rules-reviewer Açık soru 6)
- Birim (L1) ve bileşen/store (L3) testleri.

### Kapsam dışı
- 02 Keşif, 03 Kurulum, 04 Eğitim, 05 Uyarlama çalışma alanları; Uyarılar sekmesinin kaldırılması; 13 sekmelik son düzen; Destek kayıtlarının pasifliği (M-09c).
- Seed'e `reqdoc_not_shared` örnek projesi eklemek. M-09c'ye devredildi (S2, §7).
- Adıma `completedAt` alanı eklemek. Paylaşım tarihi audit kaydından okunur (S4).
- 01'deki `reqdoc` satırından doğrudan doküman yükleme diyaloğu açmak. Bu PR'da satır StepDialog'u açar; bkz. §11 Risk.
- Backlog'daki RUL-04, RUL-05, REV-07 (yalnızca test) ve RUL-07 (held toplantının tür/tarih değişikliği → M-09c). Bunlar backlog'da kalır.
- Toplantı silme veya düzenleme ekranı. `MeetingDetailDialog` salt okunurdur.

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: **yok** (demo store).
- **F1-00 D15 için notlar:**
  - `projects` tablosuna `presentation_shared`, `req_doc_shared` ve `req_doc_shared_at` kolonları **girmez**. Bu bilgiler adım durumundan gelir.
  - `reqdoc` şablon adımının tamamlanma tipi `data`. Koşulu: projede `type = 'req_doc'` olan bir doküman.
- **DATA_MODEL.md düzenlemesi (ana oturum yapar; bu plan yalnızca not düşer):** `docs/DATA_MODEL.md` → "## 9. Açık sorular" bölümüne F1-00 için şu madde eklenir: "`steps.completed_at` alanı gerekli mi? (M-09b S4: demo'da paylaşım/tamamlanma tarihi audit kaydından okunuyor — `entity: step`, `field: status`, `newValue: done`.)"
- `pg-only` gereksinimi: yok.

### 3.1 Eşleme (M-09 brief'indeki ad → main @ f9bc25f'teki gerçek ad)
| Brief | Kod | Not |
|---|---|---|
| `stepConditionResult().missing[].field` | `completion.ts` `STEP_CONDITIONS` | 00'ın alanları: `csmId`, `salespersonId`, `licenseModel`, `purchasedModules`, `commitments`, `installType`, `llmChoice`, `doc:offer`, `doc:contract`. Toplantı: `meeting:brief`. 01'de yeni: `doc:req_doc` |
| Satış devri toplantısı adımı | `key: "brief"`, `completion: "meeting"`, `meetingType: "brief"` | 00'da index 4; `install_llm` index 5 (M-09a S1 kararı) |
| Kurulum gereksinim dokümanı adımı | `seed.ts:56` `S("Kurulum gereksinim dokümanının paylaşılması", "csm", true, "Ö", 2, { key: "reqdoc" })`. Bugün `completion` verilmediği için `buildFromTemplate` `"manual"` yazıyor | `{ key: "reqdoc", completion: "data" }` olur (S5). Koşul: `STEP_CONDITIONS.reqdoc` (§6.2) |
| `req_doc` yüklenince reqdoc tamamlanır | `store.tsx:420` `addDocument` içinde `setStepByKey(..."reqdoc", { status: "done" }...)` | **Silinir.** Tamamlamayı `settleAll` (store `setState` → `settleAll`, store.tsx:115) yapar |
| HandoverTab | `ProjectDetail.tsx` `HandoverTab` (771–867) + `CommitmentDialog` (869–893) | Çalışma alanına taşınır |
| Kick-off sekmesindeki kurulum tipi/LLM mantığı | `Phase2Tabs.tsx` `KickoffTab` (30–131) | Kurulum/LLM bölümü ve "Otomatik açılan aksiyonlar" kartı taşınır; geri kalanı silinir |
| "Mevcut gerekçe diyaloğu" | **Yok.** KickoffTab'da koşullu `Textarea` + Kaydet düğmesi var | Alan bazında kayıt için yeni küçük `ChoiceReasonDialog` (§6.6 b) |
| "Mevcut doküman ekleme diyaloğu" | **Yok.** `DocumentsTab` (Phase2Tabs 445–515) içinde satır içi form | `DocumentUploadDialog`'a çıkarılır (§6.4) |
| "İlgili toplantının detayı" | **Yok.** Yalnızca `MeetingsTab` kartları | Yeni `MeetingDetailDialog` (§6.4) |
| Toplantı formu | `ProjectDetail.tsx` `MeetingDialog` (671–768). `defaultType`, varsayılan tarih bugün, durum `held`, CSM ön seçili | Ön doldurma için yalnızca `defaultType` yeterli. Dosya taşınır |
| setKickoff | `store.tsx` 354–383. `Pick<Project,"presentationShared"\|"installType"\|"llmChoice"\|"reqDocShared"\|"reqDocSharedAt">` | `setInstallChoice` olur (§6.2) |
| kickoffSummary | `store.tsx` 788 | `installChoiceSummary` olarak yeniden adlandırılır, mantık aynı |
| "Sıradaki adım açıldı" toast'ı | `store.tsx` `flowMessages` (767–785), `flowMsgs` ref + `useEffect` | "Tamamlandı: …" buraya eklenir |
| CSM alanını yalnızca Manager değiştirir | Bugün `isAllSeeing(user)` (manager **ve** admin) | `canAssignCsm` = yalnızca manager (RBAC.md satır 9; S3) |
| Raporlardaki Kick-off özeti, ai-mock | **Yok.** `reports.ts`, `ai-mock.ts`, `CustomerReport.tsx` ve `ManagementReport.tsx` bu üç alanı okumuyor | Değişiklik yok; uygulayıcı grep çıktısıyla doğrular |
| Sekme değeri | `ProjectDetail.tsx` 130: `Tabs key/defaultValue = searchParams.get("tab") ?? "phases"` | `handover` / `kickoff` → `phases` + `ws=00` |

### 3.2 Silinen alanların ve kuralın tüm kullanım yerleri (grep `presentationShared|reqDocShared|reqDocSharedAt|"reqdoc"`)
| Yer | Yapılacak |
|---|---|
| `types.ts:70-72` | Silinir |
| `store.tsx:60` (Ctx `setKickoff` imzası), `:207` (`createProject`), `:377-378` (presentation/reqdoc `setStepByKey`) | `setInstallChoice`'a dönüşür; alanlar ve iki satır silinir |
| `store.tsx:420` (`addDocument` → `setStepByKey(... "reqdoc" ...)`) | Satır silinir (S5). `setStepByKey` importu başka yerde kullanılmıyorsa importu da kalkar (lint) |
| `seed.ts:56` | `completion: "data"` eklenir |
| `seed.ts:209-211, 287, 321, 336, 371` | Alanlar silinir |
| `alerts.ts:68` | Adım durumuna geçer (§6.5) |
| `Phase2Tabs.tsx:36-38, 48-50, 69-94` | `KickoffTab` silinir |
| `ProjectDetail.tsx:1032-1033` `FIELD_LABEL` | **Kalır.** Geçmiş audit kayıtlarını etiketler |
| `store.test.tsx:191-309` (`setKickoff` çağrıları) | `setInstallChoice` ile yeniden yazılır |
| `completion.test.ts:362-374` (Garanti `reqDocShared=false` fixture'ı) | Adım durumlu fixture'la yeniden yazılır (§8 AC7) |
| `rules.ts:6` `ONPREM_KEYS` (`"reqdoc"`) | **Kalır.** Kurulum tipi kuralı reqdoc'u `out_of_scope` / `locked` yapmaya devam eder |

## 4. API etkisi
Yok (demo). F0-01 için store `Ctx` notları:
- `setKickoff` silinir. Yerine şu gelir: `setInstallChoice(projectId, patch: Partial<Pick<Project,"installType"|"llmChoice">>, reason?) => { error: string | null; summary: string | null }`.
- `addDocument` imzası değişmez; yalnızca yan etkisi (reqdoc kuralı) kalkar.
- İşlem sayısı değişmez (53).
- Ana oturum `docs/AUDIT.md`'yi günceller: state **v10**, Ctx **53** işlem (AUDIT.md bugün hâlâ v8/52 diyor). Ayrıca `reqdoc` artık veriyle tamamlanan adım.

## 5. Yetki etkisi (RBAC)
`perm.ts`'e tek yeni fonksiyon eklenir: `export const canAssignCsm = (u: AuthUser | null) => u?.role === "manager";` (S3: onaylandı). Diğer kontroller mevcut fonksiyonlarla yapılır.

| Rol | Panel | Not |
|---|---|---|
| csm (kendi projesi) | Açar; tüm alanları düzenler. **CSM alanı pasif** | `canManageProject` true, `canAssignCsm` false |
| devops | Projeyi görüyorsa açar, **salt okunur**. Yükle / Toplantı kaydet / Ekle düğmeleri yok. Tamamlanmamış toplantı adımına tıklamak bir şey yapmaz | `canManageProject` false |
| care | devops ile aynı | |
| manager | Tüm alanlar, CSM dahil | `canManageProject` + `canAssignCsm` |
| admin | Tüm alanlar; **CSM alanı pasif** (S3: admin'in bugünkü yetkisi bilinçli olarak daraltılıyor) | `canManageProject` true (isAllSeeing), `canAssignCsm` false |

Bileşende rol karşılaştırması yazılmaz: `readOnly = !canManageProject(user, project)`, `csmEditable = canAssignCsm(user)`.

## 6. Tasarım

### 6.1 Dosyalar
| Dosya | Durum | İçerik |
|---|---|---|
| `src/pages/project/workspaces/index.ts` | yeni | `WorkspaceProps`, `PHASE_WORKSPACES`, `stepClickTarget` |
| `src/pages/project/workspaces/highlight.ts` | yeni; DOM kullanır, React yok | `highlightField` |
| `src/pages/project/workspaces/PhaseWorkspaceSheet.tsx` | yeni | Panel kabuğu |
| `src/pages/project/workspaces/HandoverWorkspace.tsx` | yeni | 00 içeriği (HandoverTab + CommitmentDialog + KickoffTab kurulum/LLM + kural aksiyonları **taşınır**) |
| `src/pages/project/MeetingDialog.tsx` | yeni (taşıma) | `MeetingDialog`, yeni `MeetingDetailDialog` ve bağımlılıkları (`ActionFields`, `ActionDraft`, `EnumSelect`, `PersonSelect`, `NONE`). `ProjectDetail.tsx` ve `ContinuityTab` buradan import eder |
| `src/pages/project/Phase2Tabs.tsx` | değişir | `KickoffTab` silinir; `DocumentUploadDialog` export edilir, `DocumentsTab` onu kullanır |
| `src/pages/ProjectDetail.tsx` | değişir | Sekmeler, PhasesTab satır tıklama, "Formu aç", Sheet bağlama; HandoverTab/CommitmentDialog/MeetingDialog çıkar |
| `src/lib/rabbitqa/{types,seed,store,alerts,completion,rules,perm}.ts(x)`, `src/lib/auth-api.ts` | değişir | §6.2–6.5 |

### 6.2 Store / model (src/lib/rabbitqa)
- **types.ts:** `Project`'ten `presentationShared`, `reqDocShared` ve `reqDocSharedAt` silinir.
- **seed.ts:**
  - `export const STATE_VERSION = 10;` ve `export const STATE_KEY = \`rabbitqa-demo-state-v${STATE_VERSION}\`;`
  - `createSeed` içinde `version: STATE_VERSION`.
  - `PHASE_TEMPLATE` 01: `S("Kurulum gereksinim dokümanının paylaşılması", "csm", true, "Ö", 2, { key: "reqdoc", completion: "data" })`. `presentation` adımı elle kalır.
  - Üç alan tüm projelerden silinir (§3.2).
  - Başka seed değişikliği yok. Seed'de `req_doc` dokümanı yok (d_1–d_6 yalnızca offer/contract). Bu yüzden:
    - İş Yatırım, Garanti ve Akbank'ta 01 aşaması `done`, reqdoc adımı `done` kalır (aşama done olduğu için geri açılmaz).
    - `p_ornek`'te reqdoc `locked` kalır (koşul sağlanmıyor).
    - Seed sonrası `settleAll(seed) === seed` değişmezi korunur.
- **completion.ts:**
  - **Yeni koşul (S5).** `STEP_CONDITIONS`'a, mevcut `offer` / `contract` deseniyle aynı biçimde eklenir:
    ```ts
    reqdoc: {
      label: "Kurulum gereksinim dokümanı",
      check: (state, projectId) => fromChecks([{ field: "doc:req_doc", label: "Kurulum gereksinim dokümanı", met: state.documents.some((d) => d.projectId === projectId && d.type === "req_doc") }]),
    },
    ```
    `field` adı `doc:<DocType>` kuralına uyar (`doc:offer`, `doc:contract`). `stepConditionResult` değişmez: `completion === "data"` ve `key === "reqdoc"` → bu koşul.
  - **Sonuçlar** (mevcut `applyStepCompletion` mantığından, ek kod yok):
    - Açık ya da **kilitli** reqdoc + `req_doc` dokümanı → `done`. Audit reason: `Otomatik kural: veri tamamlandı — Kurulum gereksinim dokümanı`. Kilitli adımın doğrudan `done` olması M-09a a1 / M-09a AC5 davranışıdır (S6).
    - `out_of_scope` reqdoc ya da `out_of_scope` 01 aşaması → dokunulmaz (RUL-13).
    - Aşama tamamlanmamışken doküman kalkarsa adım geri açılır (INV-26). Demo'da doküman silme yok; kural yine de L1'de test edilir.
    - `manualStatusError(reqdoc, "done")` → `"Bu adım veriyle tamamlanır"`. StepDialog ve AI `step_update` onayı reqdoc'u elle "Tamamlandı" yapamaz; yalnızca "Kapsam dışı" yapılabilir.
  - REV-05: `MkAudit` `./flow`'dan import edilir, yerel tanım silinir. `rules.ts`'te de aynısı.
  - REV-08: `export const isAutoStep = (s: Pick<Step,"completion">) => s.completion === "data" || s.completion === "meeting";`. `manualStatusError`'ın ilk satırı `if (!isAutoStep(step)) return null;` olur. `store.tsx` `approveInsight` `targetStep && isAutoStep(targetStep)` kullanır.
  - RUL-09: geri açılan **toplantı** adımının gerekçesi `Otomatik kural: Yapıldı durumunda <tür> toplantısı kalmadı`. Veri adımının metni aynı kalır (`Otomatik kural: veri eksildi — <label>`).
  - Yeni yardımcı: `export function latestHeldMeeting(state: RqState, projectId: string, type: MeetingType): Meeting | null`. `status === "held"` olanlar arasında tarihi en büyük olanı döner. UI'daki "Toplantıyı gör" ve tamamlanmış toplantı adımına tıklama bunu kullanır.
- **store.tsx:**
  - `KEY` yerine `STATE_KEY`; `load()` `s.version === STATE_VERSION` kontrol eder.
  - `createProject` üç alanı yazmaz.
  - **`setInstallChoice(projectId, kp, reason?)`:**
    - `setKickoff`'un yerine geçer. Gövde aynı; audit `label: "Kurulum ve LLM"`.
    - `installChoiceError` hata dönerse state değişmez.
    - `applyInstallType` / `applyLlmChoice` yalnızca yeni değer non-null ve farklıysa çalışır.
    - `presentation` / `reqdoc` satırları silinir.
    - Özet: `installChoiceSummary(prev, next, projectId)` (eski `kickoffSummary`, mantık aynı).
    - SaaS → On-prem dönüşünde reqdoc `locked` olur (`rules.ts`). Projede `req_doc` dokümanı varsa aynı `setState` içindeki `settleAll` reqdoc'u hemen `done` yapar. Bu beklenen davranıştır, AC12 e'de test edilir.
  - **`addDocument`:** yalnızca `add("documents", …)`. `req_doc` özel kuralı **silinir** (S5). reqdoc'u `settleAll` tamamlar; `out_of_scope` atlanır (RUL-13); kilitli adım engellenmez (S6). `offer` / `contract` / `req_doc` için store'da kural kalmaz.
  - **`flowMessages(prev, next)`, en başa:** var olan projelerde `completion`'ı `data` ya da `meeting` olan, `prev` durumu `done` olmayıp `next` durumu `done` olan her adım için `Tamamlandı: <adım başlığı>`. Bu reqdoc'u da kapsar ("Tamamlandı: Kurulum gereksinim dokümanının paylaşılması"). Mevcut aşama mesajları ve "Sıradaki adım açıldı" mesajları bundan sonra gelir. Elle adımlar için mesaj yok (StepDialog zaten "Adım güncellendi" diyor).
  - **`setState`:** `flowMsgs.current = flowMessages(s, next)` yerine `flowMsgs.current = uniq([...flowMsgs.current, ...flowMessages(s, next)])`.
    - Sebep 1: `addMeeting` aksiyonlarla birlikte birden çok `setState` çağırıyor; sonraki çağrı ilk mesajı eziyordu.
    - Sebep 2: `uniq`, StrictMode'da updater'ın iki kez çalışmasından doğan kopyaları engeller.
    - `useEffect` mesajları gösterip diziyi boşaltır (mevcut davranış).
- **auth-api.ts:**
  - `STATE_KEY` / `STATE_VERSION` `seed.ts`'ten import edilir; `"rabbitqa-demo-state-v8"` ve `s.version === 8` kalkar.
  - Düzeltilen hata: M-09a'dan beri state v9'da tutuluyor ama giriş v8 anahtarını okuyor. Bu yüzden Admin'den eklenen kullanıcı giriş yapamıyor, pasifleştirilen kullanıcı girebiliyor.
- **rules.ts:** yalnızca REV-05 (MkAudit import). `ONPREM_KEYS` değişmez.
- **perm.ts:** `canAssignCsm` (§5).

### 6.3 Altyapı (src/pages/project/workspaces)
**`index.ts`**
```ts
export interface WorkspaceProps { project: Project; phase: Phase; readOnly: boolean; csmEditable: boolean }
export const PHASE_WORKSPACES: Partial<Record<string, ComponentType<WorkspaceProps>>> = { "00": HandoverWorkspace };
export type StepClickTarget =
  | { kind: "workspace"; field: string | null }   // field null → vurgu yok
  | { kind: "meeting_form"; type: MeetingType }
  | { kind: "meeting_detail"; meetingId: string }
  | { kind: "step_dialog" }
  | { kind: "none" };
export function stepClickTarget(state: RqState, step: Step, ctx: { hasWorkspace: boolean; canManage: boolean; canEdit: boolean }): StepClickTarget;
```
Saf fonksiyondur, React importu yoktur. Karar tablosu:

| # | completion | Adım durumu | Koşul | Sonuç |
|---|---|---|---|---|
| 1 | data | done veya out_of_scope değil (locked dahil) | hasWorkspace | `workspace`, `field = stepConditionResult(...).missing[0]?.field ?? null` |
| 2 | data | done veya out_of_scope | hasWorkspace | `workspace`, `field: null` |
| 3 | data | herhangi | !hasWorkspace | canEdit ise `step_dialog`, değilse `none` |
| 4 | meeting | done veya out_of_scope değil (locked dahil) | canManage | `meeting_form`, `type = step.meetingType` |
| 5 | meeting | done veya out_of_scope değil | !canManage | `none` |
| 6 | meeting | done | `latestHeldMeeting` var | `meeting_detail` |
| 7 | meeting | done | held toplantı yok (ulaşılmaz kenar durum) | canEdit ise `step_dialog`, değilse `none` |
| 8 | meeting | out_of_scope | — | canEdit ise `step_dialog`, değilse `none` |
| 9 | manual | herhangi | — | canEdit ise `step_dialog`, değilse `none` |

01'in `reqdoc` adımı artık `data`. 01'de çalışma alanı olmadığı için **satır 3**'e düşer. StepDialog'da "Tamamlandı" seçeneği `manualStatusError` ile reddedilir; adım Dokümanlar'dan `req_doc` yüklenince tamamlanır. PhasesTab'daki M-09a tooltip'i "Eksik: Kurulum gereksinim dokümanı" yazar. Satır 9'un 01'deki örneği `presentation` adımıdır.

**`highlight.ts`**
```ts
export function highlightField(root: ParentNode, field: string, ms = 2000): boolean
```
- `root.querySelector('[data-field="<field>"]')` öğe bulamazsa `false` döner.
- Bulursa:
  - `el.scrollIntoView?.({ block: "center", behavior: "smooth" })` çağırır (jsdom'da `scrollIntoView` yok; çağrı opsiyonel).
  - `ring-2 ring-primary ring-offset-2 rounded-md` sınıflarını ekler, `ms` sonra kaldırır.
  - İçindeki ilk etkin `input, textarea, button, [role="radio"], [role="checkbox"], [role="combobox"]` öğesine `focus()` yapar.
  - `true` döner.

**`PhaseWorkspaceSheet.tsx`**
```ts
export function PhaseWorkspaceSheet(props: { project: Project; phase: Phase; focus: { field: string | null; nonce: number }; onClose: () => void })
```
- **Kök** (S8: onaylandı): `<Sheet open modal={false} onOpenChange={(o) => !o && onClose()}>`.
  - `SheetContent side="right" className="w-full sm:max-w-[640px] overflow-y-auto"` ve `onInteractOutside={(e) => e.preventDefault()}`.
  - **Genişlik kuralı:** 640px'in altındaki ekranda (`sm` kırılımı altı) panel **tam ekran genişliğindedir** (`w-full`). 640px ve üstünde en fazla 640px'tir ve arkadaki tablo görünür kalır. Uygulayıcı `SheetContent`'in varsayılan `sm:max-w-sm` sınıfının `sm:max-w-[640px]` ile ezildiğini (tailwind-merge) tarayıcıda doğrular. qa-verifier bunu AC14'te **zorunlu** olarak kontrol eder.
  - Overlay yok; arkadaki tablo görünür ve tıklanabilir. Panel yalnızca X ya da Escape ile kapanır.
  - `components/ui` değiştirilmez; yalnızca prop kullanılır.
- **Başlık:**
  - Mono `phase.code` ve `phase.name`.
  - `PhaseStatusBadge status={derivePhaseStatus(phase, useComputedAlerts())}`.
  - `"{done}/{counted} adım"`: PhasesTab'daki hesap; out_of_scope sayılmaz.
- **Kompakt adım listesi:** aşamanın adımları `order` sırasıyla, store'dan canlı okunur.
  - Her satırda önce durum işareti: `done` → yeşil `Check`, `out_of_scope` → soluk "Kapsam dışı", diğerleri → `Circle`. Ardından başlık ve `personName(ownerId)`.
  - `done` ya da `out_of_scope` olmayan satır `button` olarak çizilir. Tıklanınca `highlightField(contentRef, field)` çağrılır. `field`:
    - data adımı: `missing[0].field`
    - meeting adımı: `meeting:<meetingType>`
    - manual adım: tıklanamaz
- **Gövde:**
  - `const W = PHASE_WORKSPACES[phase.code]`; `<W project phase readOnly={!canManageProject(user, project)} csmEditable={canAssignCsm(user)} />`.
  - `readOnly` ise başlığın altında `text-xs text-muted-foreground` not gösterilir: "Bu paneli yalnızca görüntüleyebilirsiniz."
- **Vurgu:** `useEffect([focus.nonce])`. `focus.field` doluysa `setTimeout(() => highlightField(contentRef.current, focus.field), 150)` (Sheet açılış animasyonu için). Cleanup'ta timeout temizlenir.

**PhasesTab (ProjectDetail.tsx) değişiklikleri**
- **Yeni state:**
  - `ws: { phaseId: string; field: string | null; nonce: number } | null`
  - `meetingFormType: MeetingType | null`
  - `meetingDetailId: string | null`
- **Prop:** `initialWorkspace?: string` (aşama kodu). Değer verilmişse ilk render'da `ws` o aşamaya kurulur (`field: null`).
- **"Formu aç"** (S7: onaylandı):
  - `PHASE_WORKSPACES[ph.code]` varsa AccordionContent'in üst araç satırına, mevcut "Aşamayı düzenle" düğmesinin soluna `<Button size="sm" variant="outline"><PanelRight/>Formu aç</Button>` konur.
  - Projeyi gören herkese görünür.
  - AccordionTrigger bir `button` olduğu için düğme başlığın içine konmaz (iç içe button olur).
- **Adım satırı:**
  - `TableRow onClick` → `stepClickTarget(...)` → ilgili state. `kind: "none"` ise imleç varsayılan kalır, tıklama hiçbir şey yapmaz.
  - Başlık hücresi klavye erişimi için `<button type="button" className="text-left hover:underline">` olur.
  - Kalem düğmesi `e.stopPropagation()` ile StepDialog'u açar (değişmez).
- **Kilitli adım:** data/meeting adımı `locked` ise başlığın Tooltip'i "Sırası gelmedi — veri şimdiden girilebilir" olur. Durum hücresindeki mevcut akış tooltip'i aynen kalır.
- **Render:**
  - `ws` doluysa `<PhaseWorkspaceSheet …/>`.
  - `meetingFormType` doluysa `<MeetingDialog defaultType={meetingFormType} …/>`.
  - `meetingDetailId` doluysa `<MeetingDetailDialog …/>`.
- **Aynı aşamada ikinci tıklama** `nonce`'u artırır. Panel açıkken başka bir eksik adıma tıklanınca alan yeniden kaydırılır.

**ProjectDetail sekmeleri**
- `handover` ve `kickoff` TabsTrigger/TabsContent silinir. `KickoffTab` importu kalkar.
- Sekme parametresi şöyle okunur: `const raw = searchParams.get("tab"); const legacy = raw === "handover" || raw === "kickoff"; const tab = legacy ? "phases" : raw ?? "phases"; const ws = legacy ? "00" : searchParams.get("ws");`
- `<PhasesTab project initialWorkspace={ws ?? undefined} />`. `ws` parametresi M-09c'de de kullanılabilir.

### 6.4 Paylaşılan diyaloglar
**MeetingDialog** (taşınır):
- İmza: `{ project; onClose; defaultType?: MeetingType; onSaved?: (meetingId: string) => void }`.
- Davranış değişmez: tarih bugün, durum tarihe bağlı, CSM ön seçili.
- `onSaved` kayıttan sonra çağrılır.

**MeetingDetailDialog** (yeni, salt okunur):
- İmza: `{ meetingId: string; onClose: () => void }`.
- İçerik MeetingsTab kartındaki bilgilerin aynısı: tür, durum Pill'i, tarih, iç ve müşteri katılımcıları (`personName`), notlar, kararlar, doğan aksiyonlar.
- Altta "Toplantılar sekmesinde gör" bağlantısı → `?tab=meetings`.

**DocumentUploadDialog** (Phase2Tabs'tan export edilir):
- İmza: `{ project; lockedType?: DocType; defaultLink?: { linkType: "project"|"meeting"|"step"; linkId: string|null }; onClose; onSaved?: () => void }`.
- Alanlar DocumentsTab'daki satır içi formun aynısı: dosya (yalnızca ad), tür, bağla.
- `lockedType` verilmişse tür Select'i o değerde ve `disabled` olur.
- `defaultLink` verilmişse "Bağla" ön seçili gelir.
- Kayıtta `addDocument` çağrılır, toast "Doküman eklendi" gösterilir. Tür `req_doc` ise reqdoc adımını `settleAll` tamamlar ve ayrıca "Tamamlandı: …" toast'ı gelir.
- `DocumentsTab`: satır içi form kaldırılır. Yerine "Doküman ekle" düğmesi bu diyaloğu açar (yalnızca `canManageProject`). Kopya form kalmaz.

### 6.5 alerts.ts — `reqdoc_not_shared`
```ts
const reqdoc = steps.find((s) => s.key === "reqdoc");
if (p.installType === "onprem" && reqdoc && isOpenStep(reqdoc) && kickoff && bd(kickoff.date, today) >= t.reqDocDays) { /* aynı push */ }
```
- Uyarı adım durumunu okur, dokümanları doğrudan okumaz. reqdoc artık `completion: "data"` olduğu için `req_doc` yüklenince adım `done` olur ve uyarı dolaylı olarak kapanır. Tek kaynak adım durumudur.
- Uyarı `entity: "project"`, `entityId: pid` olarak **kalır**. Böylece anahtar `reqdoc_not_shared:<pid>` değişmez ve mevcut erteleme/kapatma kayıtları geçerli kalır.
- Metin aynı. Kilitli, `done` ya da `out_of_scope` reqdoc adımı uyarı üretmez (INV-25).

### 6.6 00 Satış Devri çalışma alanı (`HandoverWorkspace.tsx`)
Her bölüm bir `<section>`'dır. Başlık satırında bölüme bağlı adım(lar) için `StepMini` gösterilir: `StepStatusBadge` + `fmtDate(due)`; adım `key` ile bulunur. Alan sarmalayıcıları `data-field` taşır.

**a) Devir**
- **CSM** (`data-field="csmId"`, StepMini `csm`): Select. `disabled = readOnly || !csmEditable`. `csmEditable` değilse etiket "CSM (Manager atar)".
- **Devir alınan satışçı** (`salespersonId`, StepMini `sales_license`).
- **Lisans modeli** (`licenseModel`; uncontrolled Input + `onBlur`, mevcut).
- **Satın alınan modüller** (`purchasedModules`, StepMini `modules`; mevcut checkbox grid'i).
- Hepsi `updateProject` çağırır; `disabled = readOnly`.

**b) Kurulum ve LLM** (StepMini `install_llm`)
- **Kurulum tipi** RadioGroup (`data-field="installType"`) ve **LLM tercihi** RadioGroup (`data-field="llmChoice"`).
  - Değer `project` alanından gelir (controlled; yerel state yok).
  - "Henüz belli değil" (`__none`) seçeneği, değer null değilse `disabled`.
  - `readOnly` ise RadioGroup `disabled`.
- **Değişiklik:**
  - Mevcut değer null ise → `setInstallChoice(pid, { installType: v })` hemen, gerekçesiz çağrılır.
  - Mevcut değer dolu ve yeni değer farklıysa → `ChoiceReasonDialog` açılır:
    - Başlık "Kurulum tipi değişikliği" / "LLM tercihi değişikliği"; "Gerekçe (zorunlu)" Textarea.
    - Not: "Eski adımlar silinmez, "Kapsam dışı" yapılır; yeni adım ve aksiyonlar açılır."
    - Gerekçe boşken "Kaydet" `disabled`. Onaylanınca `setInstallChoice(pid, { installType: v }, reason)`.
    - Vazgeç → çağrı yapılmaz; radio eski değerde kalır.
  - `ChoiceReasonDialog` aynı dosyada, yerel bir bileşendir.
- **Sonuç:**
  - `error` doluysa → `toast.error(error)`.
  - Değilse `toast.success("Kurulum tipi kaydedildi" | "LLM tercihi kaydedildi", { description: summary ? <>{summary}. <Link to="?tab=history">Müşteri geçmişinde gör</Link></> : undefined, duration: summary ? 8000 : undefined })`. Mevcut KickoffTab deseni.
- **"Bu seçimlere bağlı otomatik aksiyonlar":** KickoffTab'daki kural aksiyonları kartının içeriği buraya taşınır (kompakt liste).

**c) Sözler ve taahhütler** (`data-field="commitments"`, StepMini `commitments`)
- Mevcut liste, ekleme satırı, `CommitmentDialog` (taşınır) ve "Taahhüt yok" kutusu. Mevcut kurallar aynen geçerli.

**d) Dokümanlar:** iki kutucuk: "Teklif" (`data-field="doc:offer"`, StepMini `offer`) ve "Sözleşme" (`data-field="doc:contract"`, StepMini `contract`).
- **Projede o türde doküman varsa:** en son eklenenin adı, `fmtDate(addedAt)` ve "Dokümanlar'da gör" bağlantısı (`?tab=documents`).
- **Yoksa:**
  - `readOnly` değilse "Yükle" → `DocumentUploadDialog lockedType="offer"|"contract" defaultLink={{ linkType: "step", linkId: <offer/contract adımının id'si> }}`.
  - `readOnly` ise "Yüklenmedi".
- Veri yalnızca `state.documents`'ta tutulur (tek kaynak).

**e) Satış devri toplantısı** (`data-field="meeting:brief"`, StepMini `brief`)
- **`latestHeldMeeting(state, pid, "brief")` varsa:** tarih, katılımcılar ve "Toplantıyı gör" (`MeetingDetailDialog`).
- **Planlandı durumundaki `brief` toplantıları:** "Planlandı · <tarih>" Pill'i. `readOnly` değilse "Yapıldı olarak işaretle" → `updateMeeting(id, { status: "held" })`; hata toast'lanır (MeetingsTab'daki gibi).
- **Held toplantı yoksa ve `readOnly` değilse:** "Toplantı kaydet" → `MeetingDialog defaultType="brief"`.

Boş/yükleniyor/hata durumları:
- Store senkron çalıştığı için yükleniyor durumu yok.
- Boş durum metinleri: "Taahhüt girilmedi.", "Yüklenmedi", "Henüz kaydedilmedi".
- Hatalar store'un dönüş mesajlarıyla toast'lanır.

## 7. Seed
- State sürümü **10**. Üç alan silinir. Şablonda `reqdoc` `completion: "data"` olur. Başka veri değişmez.
- Sonuç olarak seed'deki hiçbir projede `reqdoc_not_shared` uyarısı üretilmez:
  - Garanti'nin 01 aşaması tamamlanmış ve `reqdoc` adımı `done`.
  - Bu, rules-reviewer'ın M-09a'da not ettiği tutarsızlığı spec lehine kapatır.
  - Uyarı L1 fixture'larıyla doğrulanır (S2: kabul edildi).
- **M-09c'ye devredilen not (S2, kalıcı):** "`reqdoc_not_shared` uyarısı için seed'e örnek proje eklensin: On-prem, 01 aşaması aktif, `reqdoc` adımı açık, `req_doc` dokümanı yok, held kick-off'u `reqDocDays` iş gününden eski." M-09c planı bu maddeyi kapsamına alır. Ana oturum aynı notu `docs/plans/M-09-step-completion-workspaces.md` → "M-09c" bölümüne ekler (§11).
- Değişmez: seed sonrası her proje için `settleAll(seed) === seed`. 01'i done olan projelerde reqdoc'un `req_doc` dokümanı olmadan `done` olması, aşama done olduğu için geri açılmaya yol açmaz.

## 8. Kabul kriterleri
Fixture: L1 testleri `createSeed()` + sabit `now` + sahte `mk` ile çalışır. L3 testlerinin kurulumu:
- `vi.mock("@/lib/auth-context")` (test başına değiştirilebilir kullanıcı)
- `MemoryRouter initialEntries={["/app/projects/p_ornek?tab=phases"]}` + `<Routes><Route path="/app/projects/:id" element={<ProjectDetail/>}/></Routes>`
- `RqProvider` + `TooltipProvider`
- `vi.mock("sonner")`
- Her testten önce `localStorage.clear()`

- **AC1** (Formu aç + canlı güncelleme)
  - Given manager, `p_ornek` (00 aktif, lisans modeli boş)
  - When 00'da "Formu aç" tıklanır ve paneldeki Lisans modeli alanına "Yıllık abonelik" yazılıp blur edilir
  - Then panel açıktır ve başlığı "00 Satış Devri"dir. Paneldeki adım listesinde ve tablodaki "Satışçı ve lisans modelinin girilmesi" satırında durum Tamamlandı'dır.
- **AC2** (eksik adıma tıklama → vurgu)
  - Given manager, `p_ornek`
  - When tablodaki "Satın alınan modüllerin girilmesi" satırına tıklanır
  - Then panel açılır ve `[data-field="purchasedModules"]` öğesi `ring-2` sınıfını taşır.
  - Ek, `highlightField` L1 testi:
    - bulunan öğeye sınıf eklenir ve `ms` sonra kaldırılır (fake timers)
    - ilk girdi odaklanır
    - olmayan alan için `false` döner
- **AC3** (toplantı adımı → ön dolu form → tamamlanma)
  - Given manager, `p_ornek` ("Satış devri toplantısı" adımı tamamlanmamış)
  - When adım satırına tıklanır
  - Then toplantı formu şu değerlerle açılır: Tür = "Satış devri", Tarih = bugün, Durum = "Yapıldı", iç katılımcılarda Deniz Uzun işaretli.
  - When Kaydet'e basılır
  - Then:
    - adım `done` olur
    - toplantı `state.meetings`'te `type "brief"`, `status "held"` ile yer alır
    - toplantı Toplantılar sekmesinde ve Müşteri geçmişinde görünür (L6)
    - `toast.success` "Tamamlandı: Satış devri toplantısı" ile çağrılır.
- **AC4** (Teklif kutucuğu)
  - Given manager, `p_ornek`
  - When panelde Teklif kutucuğunda "Yükle" → dosya adı → Kaydet
  - Then:
    - diyalogda tür "Teklif"tir ve `disabled`dır
    - yeni doküman `type "offer"`, `linkType "step"`, `linkId` = teklif adımının id'si olur
    - teklif adımı `done` olur
    - kutucukta dosya adı ve "Dokümanlar'da gör" görünür
    - Dokümanlar sekmesinde tür "Teklif" görünür.
- **AC5** (kurulum tipi değişikliği gerekçeli)
  - Given manager, `p_ornek` (`installType: null`)
  - When panelde On-prem seçilir
  - Then diyalog açılmadan kaydedilir.
  - When ardından SaaS seçilir
  - Then `ChoiceReasonDialog` açılır; gerekçe boşken Kaydet pasiftir.
  - When gerekçe girilip kaydedilir
  - Then ONPREM anahtarlı adımlar (`reqdoc` dahil) `out_of_scope` olur, `saas_env` adımı oluşur ve `toast.success` özet description'ıyla çağrılır.
- **AC-NEG1:**
  - AC5'teki diyalogda Vazgeç'e basılınca `installType` "onprem" kalır, yeni audit oluşmaz.
  - Store'da gerekçesiz `setInstallChoice(pid, { installType: "saas" })` → `error: "Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu"`, state aynı kalır.
- **AC-NEG2:**
  - Kayıtlı değer varken "Henüz belli değil" radyosu `disabled`dır.
  - `setInstallChoice(pid, { installType: null })` → `"Kurulum tipi seçildikten sonra 'Henüz belli değil' yapılamaz"`.
- **AC6** (yetki, L3, `p_ornek`, CSM = u_deniz)
  - csm u_deniz: CSM Select `disabled`, Lisans modeli etkin.
  - manager: CSM Select etkin.
  - admin: CSM Select `disabled`.
  - devops (u_cagla):
    - "Formu aç" görünür
    - paneldeki tüm girdiler `disabled`
    - "Yükle", "Toplantı kaydet" ve taahhüt "Ekle" yok
    - "Bu paneli yalnızca görüntüleyebilirsiniz." görünür.
  - care: devops ile aynı.
- **AC-NEG3** (yetkisiz toplantı tıklaması): devops kullanıcısı tamamlanmamış "Satış devri toplantısı" satırına tıklayınca toplantı formu açılmaz. L1 `stepClickTarget` satır 5 → `none`.
- **AC7** (Kick-off ve uyarı)
  - Sekme listesinde "Kick-off" ve "Satış devri" yok.
  - 01 aşamasında tam olarak 3 adım var:
    - Kick-off toplantısı (Toplantıyla)
    - Kurulum gereksinim dokümanının paylaşılması (**Veriyle**)
    - Onboarding sunumunun paylaşılması (Elle)
  - 01'de "Formu aç" yok.
  - `PHASE_TEMPLATE` 01 `reqdoc` → `completion === "data"`; `stepConditionResult` eksikse `missing[0].field === "doc:req_doc"` döner.
  - L1 `computeAlerts`:
    - Garanti fixture'ında `reqdoc` adımı `pending` + held kick-off + eşik aşıldı → `reqdoc_not_shared:p_garanti` üretilir.
    - Aynı fixture'da adım `done`, `out_of_scope` ya da `locked` → üretilmez.
    - Aynı fixture'a `req_doc` dokümanı eklenip `settleAll` çalıştırılınca adım `done` olur ve uyarı üretilmez.
    - Kick-off yalnızca `planned` → üretilmez.
    - Seed'in kendisinde hiçbir projede üretilmez.
- **AC8** (eski sekme parametresi): `?tab=handover` ve `?tab=kickoff` ile açılan proje sayfasında "Aşamalar ve adımlar" sekmesi aktiftir ve 00 paneli açıktır.
- **AC9** (satır tıklama karar tablosu, L1 `stepClickTarget`): §6.3 tablosunun 9 satırının her biri test edilir. Örnekler:
  - `p_ornek` kilitli `offer` adımı → `workspace` + `doc:offer`
  - İş Yatırım `done` `brief` adımı → `meeting_detail` (`m_brief_isy`)
  - Akbank 02 `discovery_form` (çalışma alanı yok), manager → `step_dialog`
  - `p_ornek` 01 `reqdoc` adımı (data, çalışma alanı yok), `canEdit` true → `step_dialog`; `canEdit` false → `none` (satır 3)
  - `p_ornek` 01 `presentation` adımı (manual), `canEdit` false → `none` (satır 9)
- **AC10** (Tamamlandı toast'ı, L3 store)
  - `updateProject(p_ornek, { licenseModel: "X" })` sonrası `toast.success` "Tamamlandı: Satışçı ve lisans modelinin girilmesi" ile çağrılır.
  - Aksiyonlu `addMeeting` (brief, held, 1 aksiyon) sonrası "Tamamlandı: Satış devri toplantısı" mesajı kaybolmaz ve bir kez gösterilir.
- **AC11** (state v10 + giriş)
  - `createSeed().version === 10`.
  - `localStorage`'da v9 kaydı varken `RqProvider` seed'i yeniden yükler.
  - L3: `addUser({ name: "Yeni Kişi", email: "yeni@virgosol.com", role: "csm" })` sonrası `loginApi("yeni@virgosol.com", "x")` başarılı döner.
  - Pasifleştirilen kullanıcı için `loginApi` "Hesap pasif" hatası verir.
- **AC12** (reqdoc veriyle tamamlanma + RUL-13, S5/S6; L1 + L3 store)
  - a) **Kapsam dışı (RUL-13):** SaaS'a çevrilmiş projede (`reqdoc` `out_of_scope`) `addDocument({ type: "req_doc", … })` sonrası `reqdoc` `out_of_scope` kalır. Adım için yeni audit yoktur. Doküman `state.documents`'a eklenmiştir.
  - b) **Kilitli (S6):** `p_ornek` (installType null, 01 kilitli, `reqdoc` `locked`) üzerinde `addDocument({ type: "req_doc", … })` sonrası:
    - doküman kaydedilir; ekleme engellenmez
    - `reqdoc` `done` olur (M-09a a1: kilitli veri adımı doğrudan tamamlanır — bkz. §11 S6 notu)
    - audit reason `Otomatik kural: veri tamamlandı — Kurulum gereksinim dokümanı`
    - `toast.success` "Tamamlandı: Kurulum gereksinim dokümanının paylaşılması" ile çağrılır
    - 01 aşaması kilitli kalır (aşama açılması akışın işi)
  - c) **Açık:** On-prem projede `pending` reqdoc aynı işlemle `done` olur.
  - d) **Elle tamamlama yasak:** `manualStatusError(reqdoc, "done")` → `"Bu adım veriyle tamamlanır"`; `manualStatusError(reqdoc, "out_of_scope")` → `null`.
  - e) **A→B→A:** `req_doc` dokümanı olan On-prem projede SaaS → On-prem dönüşünde `reqdoc` önce `out_of_scope` olur, sonra `locked` olur ve aynı `setState` içinde `settleAll` ile `done` olur.
  - f) **Eski kural yok:** `store.tsx`'te `"reqdoc"` geçen `setStepByKey` çağrısı kalmaz (grep, değişiklik notunda).
- **AC13** (backlog, L1/L3)
  - REV-08: `completion` alanı tanımsız bir adımda `manualStatusError` `null` döner.
  - RUL-09: held toplantısı kalmayan `done` toplantı adımının geri açılma gerekçesi `Otomatik kural: Yapıldı durumunda <tür> toplantısı kalmadı` olur. Fixture'da toplantının tipi değiştirilir.
  - RUL-11: `setInstallChoice` ile LLM gpu → own → gpu:
    - `ruleKey` başına tek aksiyon
    - gpu aksiyonları `cancelled` → `open`
    - `model_install` `locked` ↔ `out_of_scope`
    - her geçişte "Otomatik kural: LLM tercihi" audit'i
    - aynı seçimle ikinci çağrı yeni audit üretmez
  - RUL-10: SaaS → On-prem → SaaS testinde:
    - her geçişte "Otomatik kural: kurulum tipi …" audit sayısı artar
    - son durumda `saas_env.status === "locked"`
    - `saas_env` id'si ilk oluşturulanla aynı
  - RUL-12: `reqdoc_not_shared` için `bd = reqDocDays − 1` iken uyarı yok, `bd = reqDocDays` iken var. Fixture tarihleri 29 Ekim tatilini içerir; beklenen iş günü sayısı test yorumunda elle hesaplanır.
  - RUL-13: AC12 a.
- **AC14** (gerileme yok + tarayıcı kontrolü)
  - Mevcut `completion.test.ts` ve `store.test.tsx` testleri (yeni adlarla) geçer. Şablondaki veri adımı sayısını ya da `STEP_CONDITIONS` anahtarlarını sayan test varsa `reqdoc` eklenerek güncellenir.
  - Seed sonrası `settleAll(seed) === seed`.
  - L6: diğer sekmeler, akış, uyarılar, Toplantılar ve Dokümanlar sekmeleri ve ContinuityTab'daki check-in toplantı formu çalışır.
  - Konsolda hata yok.
  - **Dar ekran (S8, zorunlu L6 kontrolü):**
    - 375px ve 640px'in hemen altındaki (ör. 639px) viewport'ta panel tam ekran genişliğindedir. `SheetContent` genişliği viewport genişliğine eşittir; yatay kaydırma çubuğu yoktur.
    - 1280px viewport'ta panel genişliği 640px'tir ve arkadaki adım tablosu görünür ve tıklanabilir kalır.
    - qa-verifier her genişlik için ekran görüntüsü alır.
  - Panel açıkken açılan toplantı formu kaydedilince panel açık kalır. Escape önce üstteki diyaloğu kapatır, sonra paneli kapatır.

## 9. Test planı (docs/TEST_STRATEGY.md)
| AC | Seviye | Dosya |
|---|---|---|
| AC2 (highlightField), AC7 (şablon + koşul + computeAlerts), AC9, AC11 (version), AC12 a–d (settleAll / manualStatusError seviyesi), AC13 (REV-08, RUL-09, RUL-12) | L1 | `src/lib/rabbitqa/completion.test.ts` (alerts ve completion), `src/pages/project/workspaces/workspaces.test.ts` (`stepClickTarget`, `highlightField`) |
| AC10, AC11 (giriş), AC12 a, b, c, e (store `addDocument` / `setInstallChoice` + toast), AC13 (RUL-10, RUL-11), AC-NEG1/NEG2 store yarısı | L3 store | `src/lib/rabbitqa/store.test.tsx` (`setKickoff` testleri `setInstallChoice`'a dönüşür) |
| AC1, AC2, AC3, AC4, AC5, AC6, AC7 (sekmeler + 01 adımları ve tamamlanma etiketleri), AC8, AC-NEG1/NEG2/NEG3 UI yarısı | L3 bileşen | `src/pages/project/workspaces/HandoverWorkspace.test.tsx` |
| AC1, AC3 (Toplantılar ve Müşteri geçmişi), AC4 (Dokümanlar sekmesi), AC5 toast, AC12 b (Dokümanlar'dan req_doc yükleyince 01 tablosunda reqdoc Tamamlandı), AC14 (**dar ekran zorunlu**) | L6 (qa-verifier, Playwright MCP, demo modu) | Tarayıcı kontrolü: `p_ornek` ile uçtan uca; manager, csm ve devops rolleriyle giriş; viewport 375 / 639 / 1280 px |

Radix Select jsdom'da zor çalışır. L3'te Select etkileşimi gerekiyorsa `disabled` / değer kontrolüyle yetinilir; Select seçimi L6'da doğrulanır.

## 10. İlgili invariant maddeleri
- **INV-26:**
  - Panel yalnızca veri yazar. Tamamlama `settleAll` / `completion.ts`'te kalır.
  - `reqdoc` artık veriyle tamamlanır: elle "Tamamlandı" yapılamaz, yalnızca "Kapsam dışı" yapılabilir (AC12 d). Store'daki özel tamamlama kuralı silinir; tamamlamanın tek yeri `completion.ts`.
  - `isAutoStep` savunması (REV-08) ve toplantı geri açılma metni (RUL-09) bu PR'da.
- **INV-25:**
  - Kilitli adıma tıklanınca panel açılır; veri erken girilebilir (M-09a a1).
  - Kilitli reqdoc'a `req_doc` yüklenirse adımı tamamlayan elle bir işlem değil, motordur (M-09a AC5 ile aynı). Bu yüzden "kilitli adımın durumu elle değişmez" kuralı korunur.
  - `reqdoc_not_shared` kilitli adımda üretilmez (`isOpenStep`).
- **INV-09:**
  - `setInstallChoice` aynı kuralları çağırır. A→B→A ve LLM gpu→own→gpu testleri (RUL-10/11).
  - Kapsam dışı reqdoc'a `req_doc` yüklense de adım değişmez (RUL-13; motorun `out_of_scope` atlaması).
  - SaaS→On-prem→reqdoc yeniden tamamlanma testi AC12 e'de.
- **INV-05 / INV-06:** Alan bazında her değişiklik ayrı audit üretir. Kurulum tipi/LLM değer değişikliği gerekçe diyaloğundan geçer. Store reddi korunur.
- **INV-13:** `reqdoc_not_shared` iş günü sınır testi (RUL-12). Tarih aritmetiği yalnızca `business-days.ts`'te yapılır.
- **INV-16 (demo karşılığı):** Yetki yalnızca `perm.ts`'te tanımlıdır (`canManageProject`, `canEditItem`, yeni `canAssignCsm`).

## 11. Kararlar, riskler ve notlar
Murat'ın 2026-10-04 cevapları. Açık soru kalmadı.

- **S1 — Diff boyutu. Karar: tek branch, 4 ayrık commit** (öneri aynen onaylandı). Tahmin ~950–1150 satır (taşınan kod ve testler dahil; net yeni mantık ~420).
  1. model + store + alerts + completion (reqdoc koşulu dahil) + auth-api + L1/L3 store testleri
  2. paylaşılan diyalogların taşınması/çıkarılması (davranış değişmez)
  3. workspace altyapısı + HandoverWorkspace + sekme değişiklikleri + L3 bileşen testleri
  4. backlog testleri (RUL-10, RUL-11, RUL-12)
- **S2 — Seed'de `reqdoc_not_shared` örneği kalmıyor. Karar: kabul.**
  - Uyarı L1 fixture'larıyla doğrulanır (AC7, AC13 RUL-12).
  - **M-09c'ye devredildi:** "`reqdoc_not_shared` uyarısı için seed'e örnek proje eklensin" (ayrıntı §7).
  - Ana oturum bu notu `docs/plans/M-09-step-completion-workspaces.md` → "M-09c" bölümüne ekler. M-09c planı bunu kapsamına almak zorundadır.
- **S3 — CSM atamasını kim yapar? Karar: yalnızca Manager.**
  - `canAssignCsm = (u) => u?.role === "manager"`.
  - Admin'in bugünkü yetkisinin daralması kabul edildi (RBAC.md satır 9 ile uyumlu; RBAC.md değişmez).
- **S4 — Paylaşım tarihi. Karar: audit kaydından okunur.**
  - Kaynak: `entity: "step"`, `field: "status"`, `newValue: "done"`, Müşteri geçmişi. Ekranda ayrı gösterim yok. `Step`'e `completedAt` eklenmez.
  - **Ana oturum düzenlemesi:** `docs/DATA_MODEL.md` → "## 9. Açık sorular" bölümüne F1-00 için "`steps.completed_at` alanı gerekli mi?" sorusu eklenir (§3).
- **S5 — `reqdoc` tamamlanma tipi. Karar: `data`.** Adım, `req_doc` dokümanı yüklenince kendiliğinden tamamlanır.
  - `PHASE_TEMPLATE`'te `completion: "data"`.
  - `STEP_CONDITIONS.reqdoc` (`field: "doc:req_doc"`).
  - `addDocument`'taki özel kural silinir.
  - `reqdoc_not_shared` adım durumunu okumaya devam eder.
  - Etkilenen bölümler: §2, §3, §3.1, §3.2, §6.2, §6.3, §6.5, §7, AC7, AC9, AC12, AC13, §9, §10, §12, §13.
- **S6 — Kilitli reqdoc'a `req_doc` yüklenmesi. Karar: engellenmez; doküman her zaman kaydedilir** (orijinal varsayım onaylandı; S5 ile birlikte `data` tipi üzerinden işler).
  - **ÖNEMLİ NETLEŞTİRME — planner'ın tespit ettiği çelişki:** Murat'ın cevabında "adım kilitliyse locked kalır, aşama açıldığında settle ile tamamlanır" ifadesi geçiyor. Ancak main'deki M-09a motoru (`applyStepCompletion`, `completion.ts` satır 131–139 ve M-09a AC5) kilitli veri adımını koşul sağlandığı anda **doğrudan `done`** yapıyor — `locked` kalmıyor. "Orijinal varsayım aynen" ve "M-09a ile tutarlı" onayları da bu davranışı işaret ediyor; bu nedenle plan şimdilik **mevcut motor davranışını** esas aldı: kilitli reqdoc, `req_doc` yüklenince hemen `done` olur (AC12 b), 01 aşaması kilitli kalır.
  - **Bu nokta Murat'a ayrıca teyit ettirilmeli** (ana oturumun bir sonraki adımı): "Locked kalıp aşama açılınca tamamlansın" isteniyorsa bu, yalnızca reqdoc'u değil **tüm veri/toplantı adımlarını** etkileyen bir motor değişikliği olur (M-09a AC5'i tersine çevirir) ve ayrı bir görev gerektirir — bu PR'a girmez.
- **S7 — "Formu aç" yerleşimi. Karar: AccordionContent'in üst araç satırında** (tasarım onaylandı). Kapalı aşamada önce aşama açılır.
- **S8 — Panel modal değil. Karar: `modal={false}`** + `onInteractOutside` engeli (onaylandı).
  - Ek koşul: 640px'in altındaki ekranda panel tam genişlikte açılır (`w-full sm:max-w-[640px]`, §6.3).
  - qa-verifier bunu tarayıcıda 375 / 639 / 1280 px viewport'larında **mutlaka** doğrular (AC14).
  - Panelin içinden açılan modal diyaloglar (toplantı, doküman, gerekçe) üst üste çalışır. Escape ve odak davranışı da tarayıcıda doğrulanır.
- **Risk — 01'de reqdoc'a tıklama StepDialog'u açar.** 01'in çalışma alanı olmadığı için `req_doc` yükleme yolu Dokümanlar sekmesidir. M-09a tooltip'i ("Eksik: Kurulum gereksinim dokümanı") bunu gösterir. StepDialog'da "Tamamlandı" seçilirse store "Bu adım veriyle tamamlanır" der.
  - M-09c için öneri: `StepClickTarget`'e `{ kind: "document_upload"; type: DocType }` eklenmesi ya da 01'e küçük bir çalışma alanı. Bu PR'da yapılmaz.
- **Risk — 01'i tamamlanmış seed projelerinde reqdoc `done`, `req_doc` dokümanı yok.** Aşama `done` olduğu için motor geri açmaz; seed değişmezi korunur. Demo verisi tutarsızlığı kabul edilir. M-09c seed çalışmasında istenirse bu projelere `req_doc` dokümanı eklenebilir.
- **Risk — toast birikimi.** `flowMsgs` ekleme + `uniq` ile birikir. Aynı metinli iki gerçek olay (aynı başlıklı iki adım) tek toast'a düşer. Kabul edilebilir.
- **Risk — `ws` parametresi.** Panel kapandıktan sonra URL'de `tab=handover` kalırsa yeniden render paneli tekrar açmaz (yalnızca ilk state'te okunur). Sayfa yenilenirse panel yeniden açılır. Kabul edilebilir.
- **Not (ana oturum), merge sonrası:**
  - `docs/AUDIT.md`: state v10, Ctx 53, reqdoc veriyle tamamlanır.
  - `docs/PHASES.md`: M-09b ✅.
  - `docs/DATA_MODEL.md` §9: `steps.completed_at` sorusu (S4).
  - `docs/plans/M-09-step-completion-workspaces.md` M-09c: seed'e `reqdoc_not_shared` örnek projesi notu (S2).
  - `docs/reviews/BACKLOG.md`'den REV-05, REV-08, RUL-09, RUL-10, RUL-11, RUL-12, RUL-13 ve satır 34 ("`reqdoc` adımı `manual` kaldı") düşülür.

## 12. Gerekli gate'ler
- [x] reviewer (demo modu)
- [x] qa-verifier (demo modu, **tarayıcı kontrolü zorunlu**):
  - AC1, AC3, AC4, AC5, AC6, AC12 b, AC14
  - roller: manager, csm, devops
  - **dar ekran zorunlu:** 375 / 639 / 1280 px, ekran görüntüleriyle
- [x] rules-reviewer: **evet.** Diff şu tetikleyicilere dokunuyor:
  - Uyarılar: `alerts.ts` `reqdoc_not_shared` adım durumuna geçiyor (INV-13, INV-25)
  - Otomatik kurallar: `setInstallChoice` → `applyInstallType` / `applyLlmChoice`, `out_of_scope`; `addDocument(req_doc)` kuralının silinmesi (INV-09)
  - Adım tamamlama: `reqdoc`'un `data` tipine geçmesi ve `STEP_CONDITIONS.reqdoc`; `completion.ts` (`isAutoStep`, RUL-09 metni, `latestHeldMeeting`); meeting `status` (INV-26)
  - Audit/gerekçe: `reason`, gerekçe diyaloğu (INV-05/06)
  - AI: `approveInsight` (`isAutoStep`; reqdoc'a AI `step_update` → done artık reddedilir) (INV-21)

  Zorunlu kenar durumlar:
  - A→B→A (kurulum tipi ve LLM; `req_doc` varken SaaS→On-prem'de reqdoc'un yeniden `done` olması)
  - `reqdoc` kilitli / kapsam dışı / tamamlanmış iken hem uyarı hem `req_doc` yüklemesi
  - iş günü sınırı (tatil)
  - toast birikiminin aynı olayı iki kez göstermemesi
  - eski sekme parametresi

## 13. Uygulama görev metni
```
BAĞLAM — RabbitQA Onboarding Tracker (Faz M, demo uygulama)
- Önce oku: AGENTS.md ("Demo kuralları"), docs/INVARIANTS.md (INV-05, 06, 09, 13, 21, 25, 26), docs/RBAC.md, docs/TEST_STRATEGY.md ve bu planın tamamı: docs/plans/M-09b-phase-workspace-handover.md (Durum: Onaylandı). Plan ile bu metin çelişirse plan geçerlidir.
- DEMO: backend, DB, Supabase, migration yok. Veri src/lib/rabbitqa/ store'unda (RqProvider/useRq). Her değişiklik store fonksiyonundan geçer ve audit yazar.
- Akış yalnızca flow.ts; tamamlama yalnızca completion.ts (settleAll); uyarılar yalnızca alerts.ts; iş günü yalnızca business-days.ts; yetki yalnızca perm.ts (bileşende rol karşılaştırması yok).
- Enum değerleri değişmez. Yeni npm paketi yok. components/ui elle değiştirilmez (yalnızca prop). Arayüz Türkçe, tarih gg.aa.yyyy.
- Dokunma: AGENTS.md, CLAUDE.md, docs/, .claude/, .github/, .mcp.json.
- Kod taşınır, kopyalanmaz: HandoverTab, CommitmentDialog, KickoffTab'ın kurulum/LLM bölümü ve kural aksiyonları kartı, MeetingDialog, DocumentsTab ekleme formu.

1) MODEL / STORE (plan §6.2)
- types.ts: Project'ten presentationShared, reqDocShared, reqDocSharedAt alanlarını sil.
- seed.ts:
  - export STATE_VERSION = 10 ve STATE_KEY = `rabbitqa-demo-state-v${STATE_VERSION}`; createSeed içinde version: STATE_VERSION.
  - PHASE_TEMPLATE 01 reqdoc: { key: "reqdoc", completion: "data" } (S5). presentation elle kalır.
  - Üç alanı tüm projelerden sil (plan §3.2 satırları). Başka seed verisi değişmez; settleAll(seed) === seed korunmalı.
- completion.ts:
  - STEP_CONDITIONS.reqdoc ekle: label "Kurulum gereksinim dokümanı", tek check { field: "doc:req_doc", label: "Kurulum gereksinim dokümanı", met: projede type === "req_doc" doküman var }. Desen offer/contract ile aynı.
  - MkAudit'i ./flow'dan import et (REV-05; rules.ts'te de).
  - export isAutoStep(s) = completion === "data" || completion === "meeting"; manualStatusError'ın ilk satırı `if (!isAutoStep(step)) return null;` (REV-08).
  - Toplantı adımının geri açılma gerekçesi "Otomatik kural: Yapıldı durumunda <MEETING_TYPE_LABEL> toplantısı kalmadı" (RUL-09).
  - export latestHeldMeeting(state, projectId, type): Meeting | null (held olanlardan en yeni tarihli).
- store.tsx:
  - KEY → STATE_KEY; load() version === STATE_VERSION kontrol eder; createProject üç alanı yazmaz.
  - setKickoff'u SİL. Yerine setInstallChoice(projectId, kp: Partial<Pick<Project,"installType"|"llmChoice">>, reason?) => { error, summary } gelir (Ctx'te de).
    Gövde setKickoff ile aynı (installChoiceError → applyInstallType/applyLlmChoice). Audit label "Kurulum ve LLM". presentation/reqdoc setStepByKey satırları yok. kickoffSummary → installChoiceSummary.
  - addDocument: req_doc → reqdoc setStepByKey satırını SİL (S5). Yalnızca add("documents", …) kalır; reqdoc'u settleAll tamamlar.
    out_of_scope atlanır (RUL-13). Kilitli reqdoc doğrudan done olur (S6, M-09a a1). Kullanılmayan import kalırsa kaldır.
  - flowMessages'ın başına: var olan projelerde completion data|meeting olup prev'de done olmayan ve next'te done olan her adım için "Tamamlandı: <başlık>".
  - setState: flowMsgs.current = uniq([...flowMsgs.current, ...flowMessages(s, next)]).
  - approveInsight: isAutoStep(targetStep) ise "Bu adım veriyle tamamlanır".
- auth-api.ts: STATE_KEY / STATE_VERSION'ı seed.ts'ten import et; v8 sabitlerini kaldır.
- alerts.ts reqdoc_not_shared: `const reqdoc = steps.find(s => s.key === "reqdoc"); if (p.installType === "onprem" && reqdoc && isOpenStep(reqdoc) && kickoff && bd(kickoff.date, today) >= t.reqDocDays)`. entity, entityId ve metin aynı kalır.
- perm.ts: export const canAssignCsm = (u) => u?.role === "manager".

2) PAYLAŞILAN DİYALOGLAR (plan §6.4)
- src/pages/project/MeetingDialog.tsx:
  - MeetingDialog'u ve bağımlılıklarını (ActionFields, ActionDraft, EnumSelect, PersonSelect, NONE) ProjectDetail.tsx'ten TAŞI; MeetingDialog'a onSaved?(meetingId) ekle.
  - Yeni MeetingDetailDialog({ meetingId, onClose }), salt okunur: tür, durum Pill, tarih, katılımcılar, notlar, kararlar, doğan aksiyonlar, "Toplantılar sekmesinde gör" (?tab=meetings).
  - ProjectDetail ve ContinuityTab buradan import eder.
- Phase2Tabs.tsx:
  - KickoffTab'ı SİL.
  - DocumentsTab'ın satır içi formunu export DocumentUploadDialog({ project, lockedType?, defaultLink?, onClose, onSaved? })'a çıkar (lockedType varsa tür Select disabled).
  - DocumentsTab "Doküman ekle" düğmesiyle bu diyaloğu kullanır.

3) ALTYAPI — src/pages/project/workspaces/ (plan §6.3)
- index.ts: WorkspaceProps { project, phase, readOnly, csmEditable }; PHASE_WORKSPACES = { "00": HandoverWorkspace }; StepClickTarget tipi; saf stepClickTarget(state, step, { hasWorkspace, canManage, canEdit }) — plan §6.3 karar tablosu birebir (9 satır). 01 reqdoc artık data → satır 3 (çalışma alanı yok: canEdit ? step_dialog : none).
- highlight.ts: highlightField(root, field, ms = 2000): boolean
  - [data-field] öğesini bul; scrollIntoView?.({block:"center"}).
  - "ring-2 ring-primary ring-offset-2 rounded-md" ekle, ms sonra kaldır.
  - İlk etkin input/textarea/button/[role=radio|checkbox|combobox] öğesine focus.
- PhaseWorkspaceSheet.tsx:
  - <Sheet open modal={false}> + SheetContent side="right" className="w-full sm:max-w-[640px] overflow-y-auto" onInteractOutside={e => e.preventDefault()}.
  - 640px altında panel TAM GENİŞLİK, üstünde en fazla 640px (S8). Varsayılan sm:max-w-sm'nin ezildiğini tarayıcıda kontrol et.
  - Başlık: kod, ad, PhaseStatusBadge(derivePhaseStatus), "x/y adım".
  - Kompakt adım listesi (✓ / ○ / Kapsam dışı + başlık + sorumlu). Açık adım tıklanınca highlightField (data: missing[0].field; meeting: "meeting:<type>").
  - Gövde PHASE_WORKSPACES[phase.code] (readOnly = !canManageProject, csmEditable = canAssignCsm). readOnly notu "Bu paneli yalnızca görüntüleyebilirsiniz.".
  - focus {field, nonce} değişince 150 ms sonra highlightField.
- ProjectDetail.tsx PhasesTab:
  - ws / meetingFormType / meetingDetailId state; initialWorkspace prop.
  - PHASE_WORKSPACES'ta olan aşamada içerik araç satırında "Formu aç" (herkese görünür).
  - TableRow onClick → stepClickTarget; başlık <button>; kalem stopPropagation ile StepDialog.
  - Kilitli data/meeting adımın başlık tooltip'i "Sırası gelmedi — veri şimdiden girilebilir".
- ProjectDetail sekmeleri: "Satış devri" ve "Kick-off" sekmelerini kaldır. tab=handover|kickoff → tab "phases" + ws "00"; ayrıca ?ws=<kod> desteklenir; PhasesTab initialWorkspace'e geçir.

4) 00 ÇALIŞMA ALANI — HandoverWorkspace.tsx (plan §6.6)
- Bölüm sırası:
  a) Devir: csmId [disabled = readOnly || !csmEditable], salespersonId, licenseModel [uncontrolled + onBlur], purchasedModules.
  b) Kurulum ve LLM:
     - installType ve llmChoice RadioGroup'ları controlled; "Henüz belli değil" değer varsa disabled.
     - null → değer: setInstallChoice hemen çağrılır.
     - değer → başka değer: ChoiceReasonDialog (gerekçe zorunlu, boşken Kaydet pasif, Vazgeç değişiklik yapmaz).
     - Sonuç toast'ı summary + "Müşteri geçmişinde gör"; kural aksiyonları listesi.
  c) Sözler ve taahhütler: liste, ekle, CommitmentDialog, "Taahhüt yok".
  d) Teklif / Sözleşme kutucukları:
     - doküman varsa ad + tarih + "Dokümanlar'da gör"
     - yoksa "Yükle" → DocumentUploadDialog lockedType ve defaultLink { linkType: "step", linkId: adım id }
     - readOnly'de "Yüklenmedi"
  e) Satış devri toplantısı:
     - latestHeldMeeting varsa tarih + katılımcılar + "Toplantıyı gör"
     - planned brief'ler "Yapıldı olarak işaretle" ile
     - held yoksa "Toplantı kaydet" → MeetingDialog defaultType "brief"
- data-field: csmId, salespersonId, licenseModel, purchasedModules, installType, llmChoice, commitments, doc:offer, doc:contract, meeting:brief.
- Her bölüm/alan başlığında bağlı adımın StepStatusBadge'i + termini (key: csm, sales_license, modules, install_llm, commitments, offer, contract, brief).
- readOnly'de tüm girdiler disabled; Yükle / Toplantı kaydet / Ekle / Yapıldı olarak işaretle görünmez.

5) TESTLER (plan §8–9)
- src/lib/rabbitqa/completion.test.ts:
  - PHASE_TEMPLATE reqdoc completion "data"; stepConditionResult reqdoc → missing[0].field "doc:req_doc".
  - reqdoc_not_shared fixture'ları: pending + held kickoff + eşik → var; done / out_of_scope / locked → yok; req_doc eklenip settleAll → adım done, uyarı yok; planned kickoff → yok; seed'de hiçbiri yok.
  - settleAll seviyesinde AC12: out_of_scope reqdoc req_doc ile değişmez; locked ve pending reqdoc done olur, audit reason "Otomatik kural: veri tamamlandı — Kurulum gereksinim dokümanı".
  - manualStatusError(reqdoc, "done") → "Bu adım veriyle tamamlanır"; "out_of_scope" → null.
  - RUL-12 sınırı (bd = eşik−1 yok, = eşik var, 29 Ekim tatilli tarihler); REV-08; RUL-09.
  - createSeed().version === 10; settleAll(seed) === seed.
  - Şablon veri adımı sayısını veya STEP_CONDITIONS anahtarlarını sayan mevcut test varsa reqdoc ile güncelle.
- src/pages/project/workspaces/workspaces.test.ts: stepClickTarget 9 satır (plan AC9 örnekleri; reqdoc → satır 3, presentation → satır 9); highlightField (fake timers).
- src/lib/rabbitqa/store.test.tsx:
  - setKickoff testlerini setInstallChoice'a çevir.
  - RUL-10: her geçişte audit artışı, saas_env locked + id aynı.
  - RUL-11: gpu→own→gpu.
  - AC10 toast (vi.mock("sonner")).
  - AC11: addUser → loginApi başarılı; pasif kullanıcı "Hesap pasif".
  - AC12:
    a) SaaS projede req_doc → reqdoc out_of_scope, adım audit'i yok, doküman eklendi
    b) p_ornek kilitli reqdoc → done + "Tamamlandı: Kurulum gereksinim dokümanının paylaşılması" toast'ı; 01 kilitli kalır
    c) pending reqdoc → done
    e) req_doc varken SaaS → On-prem → reqdoc done
- src/pages/project/workspaces/HandoverWorkspace.test.tsx: AC1–AC8 ve AC-NEG1–3 (MemoryRouter + Routes + RqProvider + TooltipProvider; auth-context mock'unda rol değiştirilebilir; localStorage.clear()). AC7'de 01 adımlarının tamamlanma etiketleri: Toplantıyla / Veriyle / Elle.

TESLİM
- Branch feat/m09b-phase-workspace-handover. 4 ayrık commit (plan §11 S1):
  (1) model/store/alerts/completion (reqdoc data dahil)/auth-api + L1/L3 store testleri
  (2) diyalog taşıma/çıkarma
  (3) workspace altyapısı + HandoverWorkspace + sekmeler + L3 bileşen testleri
  (4) backlog testleri
  Conventional Commits; backlog maddelerinde ID'yi commit mesajına ekle (ör. "feat: complete reqdoc step from req_doc document [RUL-13]").
- Push'tan önce: npm run lint && npx tsc --noEmit && npm test && npm run build. Lint hata sayısı artmasın.
- docs/changes/feat_m09b-phase-workspace-handover.md:
  - Ne değişti
  - Eşleme (plan §3.1'den sapma varsa)
  - Silinen alanların ve reqdoc kuralının kullanım yerleri (grep çıktısıyla, plan §3.2; store.tsx'te "reqdoc" geçen setStepByKey kalmadığının grep'i)
  - AC ↔ test tablosu
  - Sapmalar (plan §11 kararlarından saptıysan)
```
</content>
