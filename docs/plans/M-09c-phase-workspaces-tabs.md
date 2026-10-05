# M-09c — Keşif, Erişim, Eğitim ve Uyarlama çalışma alanları; uyarı rozeti ve paneli; 13 sekmelik son düzen

**Durum:** Hazır. Tüm açık sorular (S1–S7, RUL-05 dahil) 2026-10-05'te Murat tarafından cevaplandı. Kararlar §11'de. **S2 (RUL-05):** Seçenek A + ekler. **S6:** güvenli varsayımın tersi, "Kurulum özeti" kartı kalır. `/build` başlayabilir.
**Spec referansı:** `docs/PRODUCT_SPEC.md`
- Ek B.2 (tamamlanma tipleri; Eğitim = toplantı; Uyarlama: takım başına tek adım + kontrol listesi; çalışma alanı)
- Ek B.1 (kilitli adım iş sayılmaz)
- B.3 (uyarılar), B.4 (Destek kayıtları Faz 2)
- 04 Eğitim, 05 Uyarlama, "Otomatik kurallar" tablosu (satır 151–162)

**Üst plan:** `docs/plans/M-09-step-completion-workspaces.md` → M-09c. Bu doküman o görev metnini main'deki gerçek M-09a + M-09b koduna (main @ 2997ee5) göre eşler ve test edilebilir hale getirir. İkisi çelişirse bu doküman geçerlidir.
**Branch:** `feat/m09c-phase-workspaces-tabs` (main'den). S1 kararı: tek branch, 5 ayrı commit (§11).
**Bağımlılıklar:** M-09a ✅ ve M-09b ✅ main'de. M-09b altyapısı kullanılır: `PHASE_WORKSPACES`, `PhaseWorkspaceSheet`, `stepClickTarget`, `highlightField`, `MeetingDialog`, `MeetingDetailDialog`, `DocumentUploadDialog`.
**Mod:** Demo (Faz M). Backend, DB, migration ve API yok.

## 1. Amaç
02 Keşif, 03 Kurulum, 04 Eğitim ve 05 Uyarlama aşamalarının verisi aşama çalışma alanında (sağ panel) girilir.

- **Eğitim:** session'lar artık Eğitim türünde toplantıdır.
- **Uyarlama:** takım başına tek veri adımı + 5 maddelik kontrol listesi + Uyarlama toplantıları.
- **Uyarılar:** sekme kalkar; proje başlığında rozet + panel gelir.
- **Sekmeler:** proje detayı 13 sekmelik son düzene iner. "Destek kayıtları" pasif olur (Faz 2).

Bu PR'la mockup M-06 dondurmasına hazır hale gelir.

## 2. Kapsam
- **Model ve store**
  - `TrainingSession` ve `AdaptationSession` tipleri, `trainings` koleksiyonu, `addTraining` / `updateTraining` / `saveAdaptation` ve "Katılımcı girişi" kuralı kalkar.
  - Yeni alanlar: `Meeting.training`, yeni `Adaptation` (kontrol listesi), `setAdaptationCheck`.
  - `addTeam` kuralı yeniden yazılır.
  - 04/05/06 şablon değişiklikleri.
  - State **v10 → v11**.
- **Koşullar (`completion.ts`):** `training_plan`, `training_done`, `adapt:<teamId>` ve `adapt:general`. Önek anahtarı için `conditionFor(key)` yardımcısı eklenir.
- **Çalışma alanları:** 02 Keşif, 03 Erişim (yalnızca `canSeeCredentials`), 04 Eğitim, 05 Uyarlama.
- **Paylaşılan bileşen çıkarımları** (taşıma; kopya kalmaz):
  - `MeetingStepSection`: M-09b `HandoverWorkspace` bölüm e'den çıkarılır.
  - `DiscoveryContent`: `ProjectDetail` `DiscoveryTab`'tan çıkarılır.
  - `CredentialsSection`: `Phase2Tabs` `AccessTab`'tan çıkarılır. "Kurulum özeti" kartı (kurulum tipi ve LLM satırları) bileşenin içinde **kalır** ve 03 panelinde de görünür. Kartın içindeki 03 adım listesi kalkar (S6 kararı, §6.3).
  - `ProjectAlertsPanel`: `Phase3Tabs` `AlertsTab`'tan çıkarılır.
- **Uyarılar**
  - Sekme kalkar.
  - Başlıkta "N açık uyarı" rozeti; tıklanınca sağ panel açılır.
  - Aşama/adım satırında uyarı ikonu + tooltip.
  - Uyarı derin bağlantıları (`MyWork`, `Projects`, `AppShell`) yeni parametreye geçer.
- **Sekme düzeni:** 13 sekme. Destek kayıtları pasif ("Faz 2"). Toplantılar sekmesine tür ve durum filtresi gelir. Eski sekme parametreleri yönlendirilir.
- **Seed**
  - v11.
  - İş Yatırım eğitim/uyarlama verisi toplantıya ve kontrol listesine dönüştürülür.
  - 2 yeni örnek proje (S5 kararı): `reqdoc_not_shared` örneği (M-09b S2 devri) ve Uyarlama aktif örneği.
  - `support_track` adımı hiçbir projede oluşmaz (S7 kararı).
- **RUL-05 kuralı (S2, Seçenek A + ekler):** Tamamlanmış aşamadaki adımların durumu değişmez. Bunun yerine CSM'e "Gözden geçir" aksiyonu açılır (§6.2 "rules.ts — RUL-05"). RUL-07 (m09b r3) bu davranışla "kabul edildi" olarak kapanır ve testlenir.
- **Bu PR'ın dokunduğu satırlardaki backlog maddeleri:** bkz. §6.9.
- L1, L3 store ve L3 bileşen testleri.

### Kapsam dışı
- Go-Live ve Süreklilik ekranları ile davranışı. `RUL-06 (m09a)` go_no_go held kuralı backlog'da kalır.
  - Tek istisna: GoLiveTab'daki kopuk metin ("Taahhütleri 'Satış devri' sekmesinden…") "…Satış Devri çalışma alanından…" olur. Bu yalnızca metin değişikliğidir.
- Destek kayıtları kodu ve verisi silinmez. `addTicket` ve `TicketsTab` dokunulmadan kalır (sekme pasif).
- 01 Kick-off için çalışma alanı veya `document_upload` tıklama hedefi (M-09b önerisi).
- Toplantı silme ve düzenleme ekranı.
- REV-07 (approveInsight), REV-14 (xlsx), `business-days.ts` kenar durum testleri (m09b rules-reviewer direktif 3) ve BACKLOG'daki M-09b S6 teyidi (kilitli `reqdoc`'un `req_doc` yüklenince doğrudan `done` olması; bu plandaki S6 ile ilgisi yok) backlog'da kalır.
- Takım yeniden adlandırma ve silme (bkz. S3).
- DevOps'un erişim bilgisi ekleme yetkisinin değiştirilmesi (S4 kararı: davranış aynı kalır).
- "Kurulum özeti" kartında kurulum tipi / LLM düzenleme. Kart salt gösterimdir; seçim 00 panelinde yapılır.
- RUL-05 Seçenek B (tamamlanmış aşamayı yeniden açma). Seçilmedi, uygulanmaz.

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: **yok** (demo store).
- **F1-00 D15 için notlar.** Ana oturum bunları `docs/DATA_MODEL.md` §9 "Açık sorular"a ekler:
  - `trainings` tablosu **yok**. Eğitim = `meetings.type = 'training'` + eğitim alanları. `meetings` kolonları mı (`trainer_id`, `modules`, `recording_url`), yoksa 1:1 `meeting_training` tablosu mu?
  - `adaptations` tablosu: `project_id`, `team_id NULL` (genel), 5 boolean. UNIQUE `(project_id, team_id)`. NULL'lı UNIQUE için pg-mem riski var.
  - **Takım kimliği:** demo'da takım = ad (`project.teams: string[]`, S3 kararı). `Meeting.teamId` ve `adapt:<teamId>` takım adını taşır. F1'de `teams` tablosu (id, project_id, ad, `deleted_at`) gerekir. Rules-reviewer'ın zorunlu kenar durumu "takım soft-delete edilirse uyarlama session'ı ne olur" orada çözülür.
  - `steps.key` önekli anahtar (`adapt:<teamId>`) mı, yoksa `steps.team_id` kolonu mu?
  - **RUL-05 gözden geçirme aksiyonu:** `actions.rule_key = 'rule_review:<step_id>'`. Değişmez: aynı `(project_id, rule_key)` için en fazla bir `open`/`in_progress` kayıt. Kısmi UNIQUE index (`WHERE status IN ('open','in_progress')`) mi, yoksa uygulama kontrolü mü? Kısmi index için pg-mem desteği ADR-0002'ye göre doğrulanmalı.
  - **`support_track` (S7):** şablondan kalkar. F1'de canlı veride mevcut projelerdeki adım için migration notu: `out_of_scope` + gerekçe "Faz 2".
- `pg-only` gereksinimi: yok.

### 3.1 Eşleme (brief'teki ad → main @ 2997ee5'teki gerçek ad)
| Brief | Kod | Not |
|---|---|---|
| `teamId` | Takım **adı** (string) | `MeetingDialog` `teamId`'ye zaten `project.teams`'teki adı yazıyor (MeetingDialog.tsx:108). Takım id'si yok (S3 kararı: ad = kimlik) |
| data-field `discovery_form` | `discovery:<questionId>` | completion.ts:79. Her zorunlu sorunun sarmalayıcısı kendi `data-field`'ını taşır. Soru yoksa `discovery` |
| data-field `kpi` | `kpis` | completion.ts:91 |
| data-field `teams` | `teams` | aynı |
| vpn_info alanı | `credential:vpn` | completion.ts:95 |
| "M-09b'deki toplantı bölümü bileşeni" | **Yok.** `HandoverWorkspace.tsx:244` içinde satır içi `<section data-field="meeting:brief">` | `MeetingStepSection`'a çıkarılır (§6.3) |
| "Kurulum ve erişim sekmesi … yalnızca canSeeCredentials olanlara görünür (mevcut)" | **Değil.** Sekme bugün herkese görünüyor; yetkisize "yalnızca CSM ve DevOps görebilir" metni çıkıyor (Phase2Tabs.tsx:292) | Sekme tetikleyicisi `canSeeCredentials` ile gizlenir (AC4) |
| "Kurulum ve erişim" içindeki adım listesi | `AccessTab` "Kurulum özeti" kartı (Phase2Tabs.tsx:274–287): "Kurulum tipi" ve "LLM" satırları (277–278) + 03 adım listesi (`installSteps`, 266 ve 279–285) | Yalnızca adım listesi kalkar. Kart, kurulum tipi ve LLM satırlarıyla `CredentialsSection` içinde kalır; sekmede ve 03 panelinde görünür (S6 kararı: kalsın) |
| Uyarılar sekmesi bileşeni | `Phase3Tabs.tsx` `AlertsTab` | `ProjectAlertsPanel` olarak taşınır |
| Uyarı derin bağlantıları | `MyWork.tsx:62`, `Projects.tsx:120`, `AppShell.tsx:156` → `?tab=alerts` | `?panel=alerts` olur. Eski `tab=alerts` de yönlendirilir |
| Training kullanım yerleri (raporlar, geçmiş, ai-mock, uyarılar) | `reports.ts`, `ai-mock.ts`, `alerts.ts` ve rapor ekranları `trainings`/`adaptations` **okumuyor**. Okuyanlar: `Overview.tsx:65,86,87`, `Phase2Tabs.tsx` (Training/AdaptationTab), `store.tsx`, `seed.ts`, `store.test.tsx:280–307` | §6.1 tablosu. Uygulayıcı grep çıktısını değişiklik notuna koyar |
| "Mevcut Training kayıtları dönüştürülür" | `load()` sürüm farkında seed'i yeniden yükler (store.tsx:26) | Dönüşüm yalnızca **seed verisinde** yapılır. Çalışma zamanı göçü yok |
| "06'da mevcut projelerde Destek adımı Kapsam dışı" | Demo'da kalıcı "mevcut proje" yok (v11 → yeniden seed) | Adım şablondan kalkar; seed'de hiçbir projede oluşmaz (S7 kararı). F1 için migration notu (§3) |
| `PHASE_TEMPLATE` 05 | `steps: []` + `buildFromTemplate` 05 özel dalı (seed.ts:165–166, `ADAPTATION_STEPS`/`ADAPTATION_FLOW`) | §6.2 |
| Admin şablon etiketi | `Admin.tsx:30` `STEP_CONDITIONS[s.key]` | `conditionFor(s.key)` olur (adapt:general için) |
| RUL-05 "bugün" | `todayISO()` (labels.ts:76) | Termin `addBusinessDays(todayISO(), 2)` (business-days.ts:64). Tatil listesi parametresiz çağrıda `state.holidays`'ten gelir (`setActiveHolidays`) |
| RUL-05 aksiyonu "geciken aksiyon uyarısı" | `alerts.ts:51–58`: `open`/`in_progress` aksiyonlar `due` doluysa `item_late` / `action_due_soon` üretir | Yeni uyarı kodu yok; `due` dolu olduğu için mevcut mekanizma çalışır |

## 4. API etkisi
Yok (demo). F0-01 için store `Ctx` notları:
- **Kalkan işlemler:** `addTraining`, `updateTraining`, `saveAdaptation`.
- **Yeni işlem:** `setAdaptationCheck(projectId: string, teamId: string | null, item: AdaptationItem, value: boolean) => string | null`.
- **Değişenler:**
  - `addMeeting` / `updateMeeting` `training` alanını taşır.
  - `updateMeeting`, held toplantıda tür/tarih değişikliği için gerekçe ister (RUL-07 m09a).
  - `addTeam` kural sonucu değişir. 05 `done` ise adım `out_of_scope` doğar ve RUL-05 aksiyonu açılır.
  - `setInstallChoice` imzası değişmez. Yan etkisi değişir: tamamlanmış aşamada adım durumu yerine RUL-05 aksiyonu açılır veya iptal edilir.
  - `addCredential` değişmez; yetki kontrolü bugünkü gibi `canSeeCredentials` (S4 kararı).
- **F0-01 sözleşme notu:** Yeni otomatik aksiyon ailesi `ruleKey: "rule_review:<stepId>"` (`source: "rule"`, `isCustomerVisible: false`). Kural sunucuda, setInstallChoice/addTeam transaction'ının içinde çalışır.
- İşlem sayısı **53 → 51**.
- **Ana oturum** (merge sonrası) `docs/AUDIT.md`'ye şunları yazar: state v11, Ctx 51, 13 sekme, `trainings` koleksiyonunun kalktığı, `rule_review:*` aksiyon ailesi.

## 5. Yetki etkisi (RBAC)
Yeni `perm.ts` fonksiyonu yok. Bileşende rol karşılaştırması yazılmaz.

| Rol | 02 / 04 / 05 paneli | 03 paneli ve "Erişim bilgileri" sekmesi (Kurulum özeti kartı dahil) | Uyarı rozeti ve paneli |
|---|---|---|---|
| csm (kendi projesi) | Düzenler | Görür; "Formu aç" var | Görür; erteler ve kapatır (`canHandleAlert`) |
| devops | Salt okunur (`canManageProject` false) | Görür (`canSeeCredentials`). Ekleme bugünkü davranışla kalır (S4 kararı) | Görür; yalnızca sahibi olduğu uyarıyı ele alır |
| care | Salt okunur | **Görmez.** 03'te "Formu aç" yok; sekme yok; `vpn_info` satırı `canEdit` ise StepDialog, değilse hiçbir şey | devops ile aynı |
| manager | Düzenler | **Görmez** (`canSeeCredentials` manager'ı kapsamıyor; RBAC satır 16 ile uyumlu) | Tümünü ele alır |
| admin | Düzenler (mevcut `isAllSeeing`; m09b açık sorusu, F1) | Görmez | Görür; `canManageProject` ile ele alır (mevcut) |

`workspaceAvailable(code, user, project)` (§6.3) 03 için `canSeeCredentials`'ı çağırır. Diğer aşamalar için `true` döner.

Not (S6): "Kurulum özeti" kartı `CredentialsSection` içinde kaldığı için yalnızca `canSeeCredentials` olanlara görünür. Bugün kart sekmede herkese görünüyordu. Kurulum tipi ve LLM bilgisi 00 panelinde (Satış Devri) tüm rollere görünmeye devam eder; bilgi kaybı yok.

RUL-05 aksiyonu proje CSM'ine atanır. Aksiyon üzerindeki işlemler mevcut aksiyon yetkileriyle yapılır; yeni yetki kuralı yok.

## 6. Tasarım

### 6.1 Dosyalar ve kullanım yerleri
| Dosya | Değişiklik |
|---|---|
| `src/lib/rabbitqa/types.ts` | `TrainingSession`, `AdaptationSession` silinir. `Meeting.training?: MeetingTraining`. Yeni `Adaptation`, `AdaptationItem`. `RqState.trainings` silinir; `adaptations: Adaptation[]` |
| `src/lib/rabbitqa/labels.ts` | `ADAPTATION_ITEM_LABEL` eklenir |
| `src/lib/rabbitqa/completion.ts` | Yeni koşullar, `conditionFor`, `adaptationCondition` |
| `src/lib/rabbitqa/rules.ts` | RUL-05 Seçenek A: tamamlanmış aşama koruması, `ensureReviewAction` / `cancelReviewAction`, `applyInstallType`/`applyLlmChoice` eski değer parametresi (§6.2) |
| `src/lib/rabbitqa/store.tsx` | Ctx (−3/+1), `addTeam`, `updateMeeting`, `Coll`/`ENTITY`'den `trainings` kalkar, RUL-08, `setInstallChoice` kurallara eski değeri geçirir |
| `src/lib/rabbitqa/seed.ts` | `STATE_VERSION = 11`, şablon 04/05/06, `buildFromTemplate` 05, `ADAPTATION_STEPS`/`ADAPTATION_FLOW` silinir, seed verisi (§7) |
| `src/pages/project/workspaces/index.ts` | `PHASE_WORKSPACES` += 02/03/04/05; `workspaceAvailable` |
| `src/pages/project/workspaces/MeetingStepSection.tsx` | yeni (HandoverWorkspace bölüm e'den taşınır) |
| `src/pages/project/workspaces/{Discovery,Access,Training,Adaptation}Workspace.tsx` | yeni |
| `src/pages/project/workspaces/HandoverWorkspace.tsx` | Bölüm e → `MeetingStepSection`. REV-16. REV-20 (ChoiceReasonDialog etiketi) |
| `src/pages/project/workspaces/PhaseWorkspaceSheet.tsx` | REV-08/19 (manual satır button değil) |
| `src/pages/project/workspaces/highlight.ts` | REV-10 |
| `src/pages/project/Phase2Tabs.tsx` | `TrainingTab` ve `AdaptationTab` silinir. `AccessTab` → `CredentialsSection` (export). "Kurulum özeti" kartı kurulum tipi ve LLM satırlarıyla bileşende **kalır**; yalnızca `installSteps` hesaplaması ve kart içindeki adım listesi kalkar (S6 kararı). REV-20 (DocumentUploadDialog etiketleri) |
| `src/pages/project/Phase3Tabs.tsx` | `AlertsTab` → `ProjectAlertsPanel` (içerik aynı, kabuk Sheet'e uygun) |
| `src/pages/project/MeetingDialog.tsx` | Eğitim alanları; `defaultStatus?`, `defaultTeamId?` prop'ları; `MeetingDetailDialog`'da eğitim/takım bilgisi |
| `src/pages/ProjectDetail.tsx` | Sekmeler, başlık rozeti + uyarı paneli, `DiscoveryTab` → `DiscoveryContent` (export), satır uyarı ikonu, Toplantılar filtresi, `ws` doğrulaması (REV-09/21), metinler (satır 306, 755), geçmişte Uyarlama toplantısının takım adı |
| `src/pages/Overview.tsx` | 65/86/87: `trainings`/`adaptations` → `meetings` (type training/adaptation, status ≠ cancelled) |
| `src/pages/MyWork.tsx`, `src/pages/Projects.tsx`, `src/components/AppShell.tsx` | `?tab=alerts` → `?panel=alerts` |
| `src/pages/Admin.tsx` | 05 açıklaması (satır 97, 112), `conditionFor` (satır 30) |

### 6.2 Model, store ve kurallar (src/lib/rabbitqa)

**types.ts**
```ts
export interface MeetingTraining { trainerId: string | null; modules: string[]; recordingUrl: string }
// Meeting'e:
training?: MeetingTraining;          // yalnızca type === "training"
export type AdaptationItem = "projectCreated" | "docsIdentified" | "docsUploaded" | "aiTrained" | "firstSamples";
export interface Adaptation { id: string; projectId: string; teamId: string | null; checklist: Record<AdaptationItem, boolean> }
```
- Enum değerleri değişmez; `MeetingType`'ta `training` ve `adaptation` zaten var.
- `Action` tipine alan eklenmez. RUL-05 gerekçesi aksiyon başlığında ve create audit'inin `reason`'ında taşınır (aşağıda).

**labels.ts:** `ADAPTATION_ITEM_LABEL`, sırasıyla:
1. "Proje oluşturuldu"
2. "Yüklenecek dokümanlar belirlendi"
3. "Dokümanlar RabbitQA'e yüklendi"
4. "AI eğitildi"
5. "İlk örnekler birlikte yapıldı"

**completion.ts**
- `STEP_CONDITIONS`'a iki koşul eklenir:
  - `training_plan`
    - Label: "Eğitim session'larının planlanması".
    - Check: `{ field: "training:sessions", label: "Planlanmış veya yapılmış Eğitim toplantısı" }`.
    - Sağlanır: projede `type === "training"` ve `status !== "cancelled"` olan en az bir toplantı varsa.
  - `training_done`
    - Label: "Eğitim session'larının yapılması".
    - İki check:
      - `{ field: "training:sessions", label: "En az bir Eğitim toplantısı" }`
      - `{ field: "training:pending", label: "Tüm Eğitim toplantıları Yapıldı" }`
    - Sağlanır: iptal edilmemiş Eğitim toplantıları ≥ 1 ve hepsi `held` ise.
- Yeni dışa açık fonksiyonlar:
  - `export function adaptationCondition(state, projectId, teamId: string | null): ConditionResult`
    - Kayıt: `state.adaptations.find(a => a.projectId === projectId && a.teamId === teamId)`. Kayıt yoksa 5 madde de `false` sayılır.
    - Her madde ayrı bir check'tir. `field = "adapt:<teamId ?? 'general'>:<item>"`, label = `ADAPTATION_ITEM_LABEL[item]`.
  - `export function conditionFor(key: string | undefined): StepCondition | undefined`
    - Önce `STEP_CONDITIONS[key]` aranır.
    - Bulunmazsa ve `key.startsWith("adapt:")` ise:
      - `rest = key.slice(6)`
      - `teamId = rest === "general" ? null : rest`
      - Label: teamId null ise "Uyarlama kontrol listesi", değilse "Uyarlama kontrol listesi — <takım>"
      - Check: `adaptationCondition(...)`
- Kullanım yerleri: `stepConditionResult` ve `applyStepCompletion` içindeki iki etiket araması (`STEP_CONDITIONS[step.key]`, satır 111, 133, 149) `conditionFor` kullanır. Admin.tsx:30 da öyle.
- `applyStepCompletion` mantığı **değişmez**. Geri açılma, kilitli adımın doğrudan `done` olması ve `out_of_scope` atlama aynen geçerlidir.

**rules.ts — RUL-05 (Seçenek A + Murat'ın ekleri)**

*Temel kural:* Bir otomatik kural (kurulum tipi, LLM tercihi, takım ekleme), aşaması `done` olan bir adımı yeniden gerekli kılacaksa adımın durumu değişmez. Proje CSM'ine bir "Gözden geçir" aksiyonu açılır.

- **Tamamlanmış aşama koruması.** `applyInstallType` ve `applyLlmChoice` içindeki her adım değişikliğinden önce adımın aşaması bulunur (`phaseOf(step)`).
  - Aşama `done` ise adımın durumu **iki yönde de** değiştirilmez:
    - `out_of_scope → locked` yapılmaz (On-prem'e geçiş: `reqdoc`, `vpn_req`, `vpn_info`, `servers`, `devops_handover`; SaaS'a geçiş: `saas_env`; LLM gpu: `model_install`).
    - `→ out_of_scope` da yapılmaz.
  - Aşama `out_of_scope` ise adım durumu değişmez ve aksiyon **açılmaz**. Kapsam dışı aşamada iş yoktur.
  - Diğer aşama durumlarında bugünkü davranış aynen kalır.
- **Aksiyon açan durumlar.** Aşama `done` iken aşağıdaki her adım için `ensureReviewAction` çağrılır:
  1. Normalde `out_of_scope → locked` olacak mevcut adım (yukarıdaki anahtarlar).
  2. `applyInstallType` SaaS'ta `saas_env` adımı yoksa ve 03 aşaması `done` ise: adım bugünkü alanlarla oluşturulur ama `status: "out_of_scope"` olur. Create audit reason'ı `Otomatik kural: kurulum tipi SaaS — <03 kod ad> aşaması tamamlanmıştı`. Ardından aksiyon açılır.
  3. `addTeam` 05 `done` iken (aşağıda, store.tsx).
- **Aksiyonu iptal eden durumlar.** Tersi seçim adımı yeniden gereksiz kılarsa `cancelReviewAction` çağrılır. Örnekler: On-prem → SaaS'ta `ONPREM_KEYS` adımları; SaaS → On-prem'de `saas_env`; LLM gpu dışına geçişte `model_install`. `addTeam` için iptal yolu yok (takım silme demo'da yok, S3).
- **`ensureReviewAction(s, projectId, step, phase, trigger, mk, reason)`.** Saf fonksiyon, `RqState` döner.
  - `ruleKey = "rule_review:<step.id>"`.
  - **İdempotans:** Projede bu `ruleKey` ile `open` veya `in_progress` aksiyon varsa hiçbir şey yapılmaz (aksiyon ve audit eklenmez). Aynı adım için ikinci açık aksiyon **asla** oluşmaz.
  - Yoksa ve aynı `ruleKey` ile `cancelled` aksiyon varsa (A→B→A): en yeni `cancelled` kayıt yeniden açılır. `status: "open"`, `due` yeniden hesaplanır, `ownerId` güncel CSM'e, `title` yeni gerekçeye güncellenir. Değişen her alan için bir `update` audit'i yazılır.
  - Yoksa (hiç kayıt yok ya da yalnızca `done` kayıt var) yeni aksiyon oluşturulur. Önceki gözden geçirme tamamlanmışsa yeni tetikleme yeni bir iştir.
  - Yeni aksiyonun alanları:
    - `title`: `Gözden geçir: <adım başlığı> — <gerekçe>`
    - `ownerId: project.csmId`, `ball: "csm"`. CSM atanmamışsa `ownerId: null` olur; aksiyon yine açılır.
    - `due: addBusinessDays(todayISO(), 2)` (yalnızca `business-days.ts`; tarih aritmetiği yazılmaz). Bugün iş günü değilse sayım bir sonraki iş gününden başlar (mevcut `addBusinessDays` sözleşmesi).
    - `priority: "medium"`, `status: "open"`, `source: "rule"`, `meetingId: null`, `isCustomerVisible: false`, `ruleKey: "rule_review:<step.id>"`.
  - Create audit: `entity: "action"`, label `<title> — aksiyon açıldı`, `reason: "Otomatik kural: <gerekçe>"`.
- **`cancelReviewAction(s, projectId, stepId, mk, reason)`.** Bu `ruleKey`'deki `open`/`in_progress` aksiyon `cancelled` olur ve `status` audit'i yazılır. `done` aksiyona dokunulmaz. Kayıt yoksa no-op.
- **Gerekçe metni.** Hangi kuralın, hangi değişiklikle tetiklediği ve hangi aşamanın tamamlanmış olduğu açıkça yazar. Aşama adı `<phase.code> <phase.name>`:
  - Kurulum tipi: `Kurulum tipi <eski>→<yeni> değişti; <kod ad> tamamlanmıştı`. Örnek: `Kurulum tipi SaaS→On-prem değişti; 03 Kurulum tamamlanmıştı`. `reqdoc` için 01 aşaması: `…; 01 Kick-off tamamlanmıştı`.
  - İlk seçimde (eski değer `null`): `Kurulum tipi On-prem seçildi; <kod ad> tamamlanmıştı`.
  - LLM: `LLM tercihi <eski etiket>→<yeni etiket> değişti; <kod ad> tamamlanmıştı`. Etiketler `applyLlmChoice`'taki etiketlerdir.
  - Takım: `Takım eklendi: <takım>; 05 Uyarlama tamamlanmıştı`.
  - SaaS/On-prem gösterimi `applyInstallType`'taki mevcut gösterimle aynıdır.
- **Eski değer.** `applyInstallType(s, projectId, type, mk, reason, from?: InstallType | null)` ve `applyLlmChoice(s, projectId, choice, mk, reason, from?: LlmChoice | null)` sona opsiyonel `from` parametresi alır. `setInstallChoice` çağrıda projenin eski değerini (`cur`) geçirir. Mevcut çağıranlar ve testler bozulmaz.
- **Mevcut LLM aksiyon döngüsü.** `applyLlmChoice`'taki `LLM_ACTIONS` iptal/yeniden açma döngüsü yalnızca `LLM_ACTIONS` anahtarlarına bakar; `rule_review:*` aksiyonlarına dokunmaz. Uygulayıcı bunu bir testle sabitler.
- **Sonuçlar (bilinçli olarak kabul edildi):**
  - Adım "Kapsam dışı" kalır. Fiilen gerekli olup olmadığına CSM aksiyonla karar verir.
  - Aksiyon tamamlanınca adım durumu otomatik değişmez.
  - `reqdoc_not_shared` bu senaryoda üretilmez. Sinyal gözden geçirme aksiyonudur: aksiyon "Bana atananlar"a düşer, termini yaklaşınca `action_due_soon`, geçince `item_late` üretilir (`alerts.ts:51–58`, mevcut mekanizma).

**store.tsx**
- `Coll` ve `ENTITY`'den `trainings` çıkar. `adaptations` kalır (yeni şekil).
- **`setAdaptationCheck(projectId, teamId, item, value)`**
  - Proje yoksa → `"Proje bulunamadı"`.
  - `teamId !== null` ve takım `project.teams`'te yoksa → `"Takım bulunamadı"`.
  - Kayıt yoksa oluşturulur: `add` + `create` audit, label `Uyarlama: <takım|Genel>`.
  - Ardından madde güncellenir. Tek audit yazılır:
    - `entity: "adaptation"`, `field: "checklist.<item>"`, `oldValue`/`newValue` `"true"`/`"false"`
    - label `Uyarlama: <takım|Genel> — <madde etiketi>`
  - Değer aynıysa hiçbir şey yapılmaz.
  - Adımı `settleAll` tamamlar veya geri açar.
- **`addTeam(projectId, team)`**: 5 adımlı kural silinir. Yerine:
  - Takım listeye eklenir (mevcut).
  - Yeni adım:
    - Başlık `Uyarlama: <team>`, `key: "adapt:<team>"`
    - `completion: "data"`, `dependency: "independent"`, `durationDays: 10`, `required: true`
    - `ownerId: project.csmId`, `ball: "csm"`
    - `status: "locked"`, `due: null`, `activatedAt: null`
    - `order` = aşamadaki en büyük `order` + 1
  - Audit label: `Takım eklendi: <team> — Uyarlama aşamasına adım açıldı (otomatik kural)`.
  - `adapt:general` adımı varsa, `done`/`out_of_scope` değilse ve genel kaydın kontrol listesinde **hiç işaret yoksa** → `setStepByKey(..., "adapt:general", { status: "out_of_scope" }, mk, "Otomatik kural: takım tanımlandı")`. İşaret varsa adıma dokunulmaz.
  - **05 aşaması `done` ise (RUL-05 Seçenek A, S2-b):**
    - Adım yukarıdaki alanlarla ama `status: "out_of_scope"` ile oluşturulur. Create audit reason'ı `Otomatik kural: takım eklendi — 05 Uyarlama aşaması tamamlanmıştı`.
    - Ardından `ensureReviewAction` çağrılır: gerekçe `Takım eklendi: <team>; 05 Uyarlama tamamlanmıştı`, CSM, termin `addBusinessDays(todayISO(), 2)`, idempotent.
    - `adapt:general` bu durumda zaten `done`/`out_of_scope` olduğu için dokunulmaz.
    - 05 `out_of_scope` ise adım `out_of_scope` doğar, aksiyon açılmaz.
  - Aynı adla ikinci çağrı hiçbir şey yapmaz (mevcut `includes` kontrolü). İkinci adım, aksiyon veya audit üretmez.
- **`addTraining`, `updateTraining`, `saveAdaptation`** Ctx'ten ve implementasyondan silinir.
- **`updateMeeting` (RUL-07 m09a):** `old.status === "held"` iken `type` ya da `date` değişiyorsa ve `reason` boşsa → `"Yapılmış toplantının tür/tarih değişikliğinde gerekçe zorunlu"`.
- **`setInstallChoice` (RUL-08):** `setState` updater içinde `installChoiceError(cur, kp, reason)` yeniden çalıştırılır. Hata varsa `s` döner, `error` değişkeni doldurulur.
- **`setInstallChoice` RUL-05:** updater içinde `cur.installType` / `cur.llmChoice`, `applyInstallType` / `applyLlmChoice`'a `from` olarak geçirilir. Kural davranışı yukarıdaki "rules.ts — RUL-05" bölümündedir. Aynı settle zincirinde (`settleAll`) çalışır.
- **`addCredential`:** değişmez (S4 kararı).

**seed.ts — şablon**
```
04 Eğitim:
  S("Eğitim session'larının planlanması", "csm", true, "Ö", 3,  { key: "training_plan", completion: "data" })
  S("Eğitim session'larının yapılması",   "csm", true, "Ö", 10, { key: "training_done", completion: "data" })
05 Uyarlama:
  S("Uyarlama", "csm", true, "Ö", 10, { key: "adapt:general", completion: "data" })
06 Uygulama: "Destek kayıtlarının takibi" (support_track) satırı silinir (S7 kararı).
```
- **`buildFromTemplate` 05 dalı:**
  - `project.teams` boşsa şablon olduğu gibi kopyalanır (`adapt:general`).
  - Doluysa genel adım **kopyalanmaz**. Her takım için `addTeam`'deki şekilde bir adım üretilir: `independent`, 10 iş günü, `order` = sıra.
- `ADAPTATION_STEPS` ve `ADAPTATION_FLOW` silinir. Kullanım yerleri: store.tsx:8, 336–338; seed.ts:166.

### 6.3 Çalışma alanları (src/pages/project/workspaces)

**index.ts**
```ts
export const PHASE_WORKSPACES = { "00": HandoverWorkspace, "02": DiscoveryWorkspace, "03": AccessWorkspace, "04": TrainingWorkspace, "05": AdaptationWorkspace };
export function workspaceAvailable(code: string, user: AuthUser | null, project: Project): boolean; // !!PHASE_WORKSPACES[code] && (code !== "03" || canSeeCredentials(user, project))
```
- `PhasesTab` ve `?ws=` okuması `hasWorkspace = workspaceAvailable(...)` kullanır.
- `?ws=<kod>` yalnızca `workspaceAvailable` true ise paneli açar; aksi halde yok sayılır (REV-09/REV-21).
- `stepClickTarget` **değişmez**. 02/04/05 artık `hasWorkspace = true` olduğu için veri adımları satır 1/2'ye düşer. 03 `vpn_info` yetkisiz kullanıcıda satır 3'e düşer (StepDialog ya da hiçbir şey).

**MeetingStepSection.tsx**
- İmza: `{ project; stepKey: string; type: MeetingType; title: string; readOnly: boolean; teamId?: string | null }`.
- `HandoverWorkspace` bölüm e'nin mantığı aynen buraya taşınır:
  - `latestHeldMeeting` → "Toplantıyı gör"
  - planlanmış toplantılar → "Yapıldı olarak işaretle"
  - held yoksa "Toplantı kaydet"
- `data-field="meeting:<type>"`. `HandoverWorkspace` bunu `type="brief"` ile kullanır; davranış değişmez.

**DiscoveryWorkspace (02)**
- `ProjectDetail.DiscoveryTab` içeriği `DiscoveryContent({ project, readOnly, layout: "tab" | "panel" })` olarak `ProjectDetail.tsx`'ten export edilir. Yer: aynı dosya ya da `src/pages/project/DiscoveryContent.tsx`; uygulayıcı seçer, kopya kalmaz.
- `layout="panel"` tek sütundur (`lg:grid-cols-3` uygulanmaz). Panel 640px'tir ama `lg` viewport'a bakar.
- `data-field` işaretleri:
  - her zorunlu soru sarmalayıcısında `discovery:<q.id>`
  - Takımlar kartında `teams`
  - KPI kartında `kpis`
- Workspace sırası: `MeetingStepSection` (Keşif toplantısı, `discovery`) → `DiscoveryContent layout="panel"`.
- Sekme `DiscoveryContent layout="tab"` render eder. `readOnly = !canManageProject` her iki yerde de aynıdır.
- Takım ekleme toast'ı: "Takım eklendi, Uyarlama aşamasına adım açıldı". 05 `done` iken (RUL-05): "Takım eklendi; Uyarlama tamamlandığı için gözden geçirme aksiyonu açıldı".

**AccessWorkspace (03)**
- `CredentialsSection({ project, layout: "tab" | "panel" })`. `AccessTab`'ın iki kartı bugünkü sırayla taşınır:
  1. **"Kurulum özeti" kartı — kalır (S6 kararı).**
     - "Kurulum tipi: <`INSTALL_LABEL[installType]` | "Seçilmedi">" ve "LLM: <`LLM_LABEL[llmChoice]` | "Seçilmedi">" satırları bugünkü gibi gösterilir.
     - Salt gösterimdir; düzenleme yok (seçim 00 panelinde, `setInstallChoice` ile).
     - Kartın içindeki 03 adım listesi (`installSteps` ve `StepStatusBadge` satırları, Phase2Tabs.tsx:266, 279–285) kaldırılır. 03 adımları panelin adım listesinde ve "Aşamalar ve adımlar" sekmesinde zaten görünür.
  2. **"Erişim bilgileri" kartı.** Maskeli şifre, "Göster" + `logCredentialView`, "Süresi doluyor" rozeti ve ekleme formu taşınır.
- Ekleme formu sarmalayıcısı `data-field="credential:vpn"`.
- `layout="tab"` bugünkü `lg:grid-cols-2` düzenini korur. `layout="panel"` tek sütundur: önce Kurulum özeti, altında Erişim bilgileri. Gerekçe `DiscoveryContent` ile aynı: `lg` viewport'a bakar.
- Sekme `layout="tab"`, panel `layout="panel"` ile aynı bileşeni kullanır. Ekleme yetkisi bugünkü gibi `canSeeCredentials` (S4 kararı).
- Bileşen içindeki `!allowed` dalı ("yalnızca projenin CSM'i ve DevOps görebilir") savunma amaçlı kalır. Sekme ve panel yetkisize gösterilmediği için normalde erişilmez.

**TrainingWorkspace (04)**
- Üst satır: "x/y session yapıldı" (iptaller hariç).
- Liste (`data-field="training:sessions"`), Eğitim toplantıları tarih sırasıyla. Her satırda:
  - tarih
  - eğitmen (`personName`)
  - modül Pill'leri
  - katılımcı sayısı (`internalIds.length + contactIds.length`)
  - durum Pill'i
  - kayıt linki
  - planlanmış satırda, `readOnly` değilse "Yapıldı olarak işaretle" (`updateMeeting(id, { status: "held" })`)
- Liste ve satırlar `data-field="training:pending"` taşır.
- "Session ekle" (`readOnly` değilse): `MeetingDialog defaultType="training" defaultStatus="planned"`.
- Boş durum: "Eğitim session'ı yok — ilk session'ı planlayın."

**AdaptationWorkspace (05)**
- Üstte ilerleme: "x/y takım" + Progress. x = kontrol listesi tam olan takım sayısı.
- Takım kartları (`project.teams`). Her kartta:
  - takım adı
  - müşteri sorumlusu ve kullanıcı sayısı (`teamInfo`, salt gösterim)
  - 5 onay kutusu: `data-field="adapt:<team>:<item>"`, `disabled = readOnly`, `onCheckedChange → setAdaptationCheck`
  - bağlı adımın `StepStatusBadge`'i
  - o takımın Uyarlama toplantıları: tarih, katılımcılar, not özeti (80 karakter), durum
  - "+ Session ekle": `MeetingDialog defaultType="adaptation" defaultTeamId=<team>`
- Takım yoksa tek "Genel" kart (`teamId null`, alanlar `adapt:general:<item>`).
- `adapt:general` `out_of_scope` ve genel kayıtta işaret yoksa genel kart gizlenir.

**MeetingDialog**
- Yeni prop'lar: `defaultStatus?: MeetingStatus`. Verilirse başlangıç durumu odur ve `statusTouched = true` olur. Ayrıca `defaultTeamId?: string | null`.
- `type === "training"` ise üç alan görünür:
  - "Eğitmen" (`selectableUsers`)
  - "Anlatılan modüller" (`state.modules` checkbox grid)
  - "Kayıt linki"
- Kayıtta `training` yalnızca Eğitim türünde yazılır.
- `MeetingDetailDialog` ve `MeetingsTab` kartları eğitim bilgisini (eğitmen, modüller, kayıt linki) ve Uyarlama toplantısında takım adını gösterir.

### 6.4 Uyarılar
- **Rozet** (`ProjectDetail` başlığı, AI önerisi Pill'inin yanında):
  - `open = useAlertViews().filter(a => a.projectId === project.id && a.status === "open")`.
  - `open.length === 0` ise gizli.
  - Metin `"{n} açık uyarı"`. Ton: herhangi biri `level === "red"` ise `danger`, değilse `warning`.
  - `button` olarak çizilir; tıklanınca uyarı paneli açılır.
- **Panel:** `Sheet side="right"` (`w-full sm:max-w-[640px]`), içinde `ProjectAlertsPanel({ project })`.
  - `AlertsTab`'ın içeriği aynen taşınır: filtreler, "Uyarı ekle", Ertele/Kapat → `AlertActionDialog`.
  - URL `?panel=alerts` ilk render'da paneli açar.
- **Satır ikonu** (PhasesTab):
  - Aşama başlığında `entity === "phase" && entityId === ph.id` olan açık uyarılar için `AlertTriangle` ikonu.
  - Adım satırı başlığının yanında `entity === "step" && entityId === s.id` olanlar için aynı ikon.
  - Renk: kırmızı uyarı varsa `text-destructive`, değilse `text-warning`.
  - Tooltip: uyarı başlıkları, satır satır.
  - Yalnızca `status === "open"` olanlar sayılır.
- Zil (`AppShell`) ve "Uyarılarım" aynen kalır; yalnızca bağlantı parametresi değişir.

### 6.5 Sekmeler (`ProjectTabs`)
- Sıra:
  1. Aşamalar ve adımlar (`phases`)
  2. Aksiyonlar
  3. Toplantılar
  4. Keşif ve takımlar
  5. **Erişim bilgileri** (`access`; yalnızca `canSeeCredentials`; içerik `CredentialsSection layout="tab"`: Kurulum özeti + Erişim bilgileri kartları)
  6. Dokümanlar
  7. Riskler ve kararlar
  8. Go-Live
  9. Süreklilik
  10. Entegrasyonlar
  11. Müşteri kişileri
  12. Müşteri geçmişi
  13. **Destek kayıtları** (pasif)
- **Destek kayıtları:** `TabsTrigger value="tickets" disabled` + `Pill "Faz 2"`. Tooltip "Faz 2'de gelecek"; pasif öğede tooltip çalışsın diye `span` sarmalayıcıyla. `TabsContent value="tickets"` render edilmez. `TicketsTab` export'u kalır.
- **Parametre eşlemesi:**

| `?tab=` | Sonuç |
|---|---|
| `handover`, `kickoff` | `phases` + `ws=00` (mevcut) |
| `training` | `phases` + `ws=04` |
| `adaptation` | `phases` + `ws=05` |
| `alerts` | `phases` + uyarı paneli açık |
| `tickets` | `phases` |
| `access` (yetkisiz) | `phases` |
| `?panel=alerts` | Hangi sekme olursa olsun uyarı paneli açık |

- **Toplantılar sekmesi:**
  - "Tür" Select: "Tüm türler" + `MEETING_TYPE_LABEL`.
  - "Durum" Select: "Tüm durumlar" + `MEETING_STATUS_LABEL`.
  - Filtreye uyan kayıt yoksa boş durum: "Filtreye uyan toplantı yok".

### 6.6 Overview
- Care radar'ı: "Eğitim oturumu" satırları `meetings.filter(type === "training" && status === "planned")`.
- `events` listesinden `trainings` ve `adaptations` satırları silinir. Toplantı satırı zaten training/adaptation türlerini `MEETING_TYPE_LABEL` ile kapsıyor.

### 6.7 Admin
- 05 açıklaması: "Takım başına tek adım (bağımsız, 10 iş günü) ve 5 maddelik kontrol listesi. Takım yoksa genel 'Uyarlama' adımı."
- "≈ takıma göre" metni kalır. "Adım ekle" 05'te gizli kalır.
- `adapt:general` veri adımı olduğu için silinemez (M-09a kuralı).

### 6.8 Boş, yükleniyor ve hata durumları
- Store senkron çalıştığı için yükleniyor durumu yok.
- Boş durumlar:
  - "Eğitim session'ı yok"
  - "Henüz Uyarlama toplantısı yok"
  - "Takım tanımlanmadı — genel uyarlama kontrol listesi"
  - "Erişim bilgisi yok"
  - "Filtreye uyan toplantı yok"
  - "Uyarı yok"
- Kurulum özeti kartında seçim yapılmamışsa satırlar "Seçilmedi" gösterir (mevcut davranış).
- Hatalar store'un dönüş mesajlarıyla `toast.error` olarak gösterilir.

### 6.9 Bu PR'a alınan backlog maddeleri (`docs/reviews/BACKLOG.md`)
Not: BACKLOG'da aynı ID iki farklı gate'te kullanılmış. Gate etiketi parantez içinde.

| ID | Yapılacak |
|---|---|
| RUL-05 (m09b r2, Medium) | Seçenek A + ekler (§6.2 "rules.ts — RUL-05", AC19) |
| RUL-07 (m09b r3, Medium) | "Kabul edildi" olarak kapanır. L1 testi: 01 `done` + SaaS→On-prem + `req_doc` yok + eşik aşılmış durumda `reqdoc_not_shared` üretilmez ve `rule_review:<reqdocId>` aksiyonu vardır. Aksiyon termini geçince `item_late` üretilir |
| RUL-06 (m09b r2, Low) | RUL-11 testine: her geçişte audit, `ruleKey` tekilliği (`gpu_model`/`llm_integration`), AC12 e ara durumları |
| RUL-07 (m09a, Low) | `updateMeeting`: held toplantıda tür/tarih için gerekçe |
| RUL-08 (m09b r3, Low) | `setInstallChoice` updater'da `cur` ile yeniden doğrulama |
| RUL-05 (m09a, Low) | store.test.tsx:174 testi bunu karşılıyorsa değişiklik notunda belirtilir ve kapatılır; karşılamıyorsa test eklenir |
| RUL-02 / RUL-03, REV-11 (m09b) | `pending → done` reqdoc L3 testi; v10 kaydı → v11 seed yeniden yükleme testi doğru `STATE_KEY` biçimiyle (`rabbitqa-demo-state-v10`) |
| REV-08 / REV-19 (m09b) | Manual ve alansız adımlar panelde `button` değil `div` olarak çizilir. `rowClickable=false` başlık `button` değil `span` olur |
| REV-09 / REV-21 (m09b) | `?ws` doğrulaması (§6.3) |
| REV-10 (m09b) | `highlightField` odak seçicisi `:not(:disabled):not([data-disabled])` |
| REV-15 (m09b) | `HandoverWorkspace.test.tsx`: audit sayımı state'ten yapılır; AC3 toast ve tür ön değeri doğrulanır |
| REV-16 (m09b) | `HandoverWorkspace.tsx:165` `ACTION_STATUS_LABEL` |
| REV-18 (m09b) | Kontrol komutu `npx tsc --noEmit -p tsconfig.app.json` |
| REV-20 (m09b) | ChoiceReasonDialog ve DocumentUploadDialog `Label htmlFor` / `id` |

S6 kararı (Kurulum özeti kartı kalır) bir backlog maddesi değildir; §6.3'te tanımlıdır. BACKLOG'daki M-09b S6 açık sorusu (kilitli `reqdoc`) bu PR'ın kapsamı dışındadır.

## 7. Seed (v11)
- `STATE_VERSION = 11`.
- **İş Yatırım** (04 ve 05 tamamlanmış):
  - `trainings` t_1/t_2 → `m_tr_1` (2026-09-08) ve `m_tr_2` (2026-09-10). İkisi de `type: "training"`, `status: "held"`, `internalIds: ["u_deniz"]`, `contactIds` uygun müşteri kişileri, `training: { trainerId: "u_deniz", modules: <mevcut>, recordingUrl: "" }`.
  - `trainingSteps` ("Katılımcı girişi" ×2) silinir.
  - `adaptations` ad_1/ad_2 → `m_ad_1` / `m_ad_2`: `type: "adaptation"`, `teamId` takım adı, `held`, tarihler aynı, `contactIds` uygun kişi.
  - Her iki takım için `Adaptation` kaydı, kontrol listesi tam (5/5).
  - 05'te `Uyarlama: Herkese Borsa` ve `Uyarlama: Trade Master` `done`.
- **Garanti:** takım "Mobil Bankacılık" → 05'te kilitli `adapt:Mobil Bankacılık`.
- **Akbank ve p_ornek:** takım yok → kilitli `adapt:general` (takımsız örnek).
- **Yeni projeler (S5 kararı: ikisi de eklenir; proje sayısı 4 → 6).**
- **Yeni proje A — `p_lojistik` "Örnek Lojistik A.Ş."** (M-09b S2 devri)
  - On-prem, LLM `rabbitqa`.
  - 00 tamamlanmış ve verisi gerçek: CSM, satışçı, lisans, modül, `noCommitments` veya bir taahhüt, teklif + sözleşme dokümanı, held `brief`.
  - 01 aktif:
    - held `kickoff` toplantısı bugünden `reqDocDays + 1` iş günü önce
    - `reqdoc` açık (`pending`, `activatedAt` dolu)
    - `req_doc` dokümanı yok
  - Sonuç: `computeAlerts(seed)` bu projede `reqdoc_not_shared:p_lojistik` üretir.
- **Yeni proje B — `p_perakende` "Örnek Perakende A.Ş."** (Uyarlama aktif)
  - 00–04 tamamlanmış, verisi gerçek: 02 keşif cevapları + KPI, 04 en az bir held Eğitim toplantısı. Kurulum tipi seçimi uygulayıcıya bırakılır; seed'i sade tutmak için SaaS önerilir.
  - Takımlar "Mobil" ve "Web". "Mobil" kontrol listesi 2/5, `Uyarlama: Mobil` `pending`. "Web" 5/5, `Uyarlama: Web` `done`.
  - Bir planlanmış Uyarlama toplantısı ("Mobil", gelecek tarih) ve takım başına en az bir held Uyarlama toplantısı.
- **ai_3 insight:** hedefi "Destek" adımı olduğu için 06'daki başka bir açık adıma ("CS check-in toplantıları") yönlendirilir; `excerpt` ve `rationale` metni buna uyarlanır.
- **Değişmezler**
  - `settleAll(createSeed()) === createSeed()` sonucu; ikinci tur referansı değişmez.
  - Seed'de `support_track` adımı yok (S7 kararı; `out_of_scope` "Faz 2" örneği de yok).
  - `reqdoc_not_shared` **yalnızca** `p_lojistik`'te üretilir.
  - M-09b AC7'deki "seed'de hiçbir projede üretilmez" testi buna göre güncellenir.
  - Seed'de `rule_review:*` aksiyonu yok (seed kural tetiklemez).

## 8. Kabul kriterleri
**Ortak test kurulumu:**
- L1: `createSeed()` + sabit `now` + sahte `mk`. RUL-05 testlerinde termin için sistem saati sabitlenir (`vi.setSystemTime`), çünkü `todayISO()` kullanılır.
- L3: M-09b §8 kurulumu: `vi.mock("@/lib/auth-context")`, `MemoryRouter` + `Routes`, `RqProvider`, `TooltipProvider`, `vi.mock("sonner")`, `localStorage.clear()`.

- **AC1 — Keşif sekmede ve panelde aynı bileşen**
  - Given: manager, `p_akbank` (02 aktif, keşif cevapsız).
  - When: 02 panelinde (Formu aç) `q_teams` cevaplanıp blur edilir.
  - Then: "Keşif ve takımlar" sekmesinde aynı cevap görünür.
  - When: tüm zorunlu sorular cevaplanır.
  - Then: "Keşif formunun doldurulması" adımı tabloda ve panel listesinde Tamamlandı'dır. Audit reason `Otomatik kural: veri tamamlandı — Keşif formu`.
- **AC2 — Keşif eksik alan vurgusu**
  - Given: manager, `p_akbank`.
  - When: "Keşif formunun doldurulması" satırına tıklanır.
  - Then: panel açılır ve `[data-field="discovery:q_teams"]` `ring-2` taşır.
  - "KPI tanımı" satırı için aynı davranış `[data-field="kpis"]` ile gerçekleşir.
  - Panelde `[data-field="meeting:discovery"]` bölümü vardır.
- **AC3 — Erişim paneli tamamlama**
  - Given: csm u_deniz, `p_garanti` (`vpn_info` `pending`).
  - When: 03 panelinde tür "VPN" ile erişim bilgisi eklenir.
  - Then: `vpn_info` Tamamlandı olur. Kayıt "Erişim bilgileri" sekmesinde de görünür.
- **AC3b — Kurulum özeti kartı kalır (S6 kararı)**
  - Given: csm u_deniz, `p_garanti`.
  - Then: 03 panelinde ve "Erişim bilgileri" sekmesinde "Kurulum özeti" kartı görünür. Kartta "Kurulum tipi: <`INSTALL_LABEL[project.installType]`>" ve "LLM: <`LLM_LABEL[project.llmChoice]`>" satırları projenin seed değerleriyle yer alır (seçilmemişse "Seçilmedi").
  - Kartta 03 adım listesi yoktur: kart içinde `StepStatusBadge` ve 03 adım başlıkları bulunmaz.
  - Kartta düzenleme kontrolü (input, select, düğme) yoktur.
  - 03 panelinde "Kurulum özeti" kartı "Erişim bilgileri" kartının üstündedir; panel tek sütundur.
- **AC4 — Erişim yetkisi**
  - csm (kendi projesi) ve devops: 03'te "Formu aç" var. "Erişim bilgileri" sekmesi var; sekmede "Kurulum özeti" kartı (kurulum tipi ve LLM satırları) görünür ve adım listesi içermez.
  - care, manager, admin: 03'te "Formu aç" yok; "Erişim bilgileri" sekmesi yok (dolayısıyla Kurulum özeti kartını da görmezler; kurulum tipi/LLM 00 panelinde görünmeye devam eder).
  - care, `vpn_info` satırına tıklar: `canEdit` değilse hiçbir şey açılmaz (L1 `stepClickTarget` satır 3).
  - `?tab=access` ile açılırsa "Aşamalar ve adımlar" aktiftir.
  - `?ws=03` ile açılırsa panel açılmaz.
- **AC5 — Eğitim adımları (L1 + L3 store)**
  - Given: 04 aşaması tamamlanmamış bir fixture.
  - When: planlanmış Eğitim toplantısı eklenir.
  - Then: `training_plan` `done`; `training_done` `done` değil.
  - When: toplantı `held` yapılır.
  - Then: `training_done` `done`.
  - When: yeni bir planlanmış Eğitim toplantısı eklenir.
  - Then: `training_done` geri açılır (`activatedAt` doluysa `pending`), reason `Otomatik kural: veri eksildi — Eğitim session'larının yapılması`.
  - Aynı adım 04 aşaması `done` iken geri açılmaz.
- **AC-NEG1 — İptal edilen Eğitim toplantısı sayılmaz**
  - Yalnızca `cancelled` Eğitim toplantısı varken `training_plan` ve `training_done` sağlanmaz.
  - `manualStatusError(training_done, "done")` → `"Bu adım veriyle tamamlanır"`.
- **AC6 — Eğitim modeli ve formu**
  - `RqState`'te `trainings` yok.
  - `useRq()`'da `addTraining`, `updateTraining`, `saveAdaptation` yok.
  - Seed İş Yatırım'da `type "training"`, `held`, `training.trainerId === "u_deniz"` olan 2 toplantı var.
  - Hiçbir projede "Katılımcı girişi" adımı yok.
  - L3: `TrainingWorkspace` "Session ekle" → form tür "Eğitim", durum "Planlandı" ile açılır ve Eğitmen / Anlatılan modüller / Kayıt linki alanları görünür.
  - Kaydedilen toplantı Toplantılar sekmesinde eğitmen ve modüllerle görünür.
- **AC7 — `addTeam` kuralı**
  - Given: `p_garanti` (05 kilitli).
  - When: `addTeam("Web")`.
  - Then: tam olarak bir yeni adım oluşur. Alanlar:
    - `title "Uyarlama: Web"`, `key "adapt:Web"`
    - `completion "data"`, `dependency "independent"`, `durationDays 10`, `required true`
    - `ownerId` proje CSM'i
    - `status "locked"`
  - Aynı adla ikinci çağrı yeni adım ya da audit üretmez.
  - 05 aktif bir projede adım akışla hemen `pending` olur.
  - 05 kilitli veya aktifken `rule_review:*` aksiyonu açılmaz.
- **AC8 — Kontrol listesi tamamlama ve geri açılma**
  - Given: `p_perakende`, "Mobil" (2/5).
  - When: kalan 3 madde işaretlenir.
  - Then: `Uyarlama: Mobil` `done`. Her işaret ayrı bir `entity "adaptation"` audit'idir.
  - When: bir madde kaldırılır (05 aktif).
  - Then: adım `pending` olur, reason `Otomatik kural: veri eksildi — Uyarlama kontrol listesi — Mobil`.
  - L1: 05 `done` iken madde kaldırılınca adım `done` kalır.
- **AC9 — Takımsız proje ve genel adım**
  - Given: `p_akbank`.
  - Then: 05'te tek adım "Uyarlama" (`adapt:general`) var.
  - When: ilk takım eklenir (genel listede işaret yok).
  - Then: `adapt:general` `out_of_scope` olur, reason `Otomatik kural: takım tanımlandı`.
- **AC-NEG2 — İşaretli genel listeye dokunulmaz:** genel kontrol listesinde en az bir işaret varken ilk takım eklenince `adapt:general` durumu değişmez.
- **AC-NEG3 — Salt okunur kontrol listesi**
  - devops ve care 05 panelinde onay kutularını `disabled` görür. "+ Session ekle" yoktur.
  - `setAdaptationCheck` bilinmeyen takım için `"Takım bulunamadı"` döner ve state değişmez.
- **AC10 — Uyarlama toplantısı görünürlüğü**
  - 05 panelinde "Mobil" kartından "+ Session ekle" ile form tür "Uyarlama" ve takım "Mobil" ön seçili açılır.
  - Kaydedilen toplantı Toplantılar sekmesinde "Uyarlama" türü ve "Takım: Mobil" ile, Müşteri geçmişinde takım adıyla görünür.
- **AC11 — Kilitli uyarlama adımı iş değildir**
  - `p_garanti`'nin kilitli `adapt:*` adımı u_deniz'in Bana atananlar listesinde yoktur.
  - `computeAlerts` bu adım için `item_late` / `action_due_soon` / `waiting_customer` üretmez.
  - L1 ve L3 (MyWork).
- **AC12 — Sekme düzeni**
  - Manager için `TabsTrigger` metinleri §6.5'teki 13 sekmeyle aynı sırada. Manager `canSeeCredentials` değilse "Erişim bilgileri" yok, bu durumda 12 sekme.
  - csm u_deniz kendi projesinde 13 sekmenin tamamını görür.
  - "Destek kayıtları" `disabled`'dır ve "Faz 2" rozetini taşır.
  - "Satış devri", "Kick-off", "Eğitim", "Uyarlama", "Uyarılar" sekmeleri yok.
  - `?tab=training` ve `?tab=adaptation` ilgili paneli, `?tab=alerts` uyarı panelini açar.
- **AC13 — Uyarı rozeti ve paneli**
  - Given: `p_lojistik`.
  - Then: rozet "N açık uyarı" sayısı `allAlerts(...)` açık sayısına eşittir. Kırmızı uyarı varsa `danger`, yoksa `warning` tonundadır.
  - Açık uyarısı olmayan bir fixture'da rozet yoktur.
  - Rozete tıklanınca panel açılır.
  - "Kapat" + gerekçe sonrası uyarı kapalıdır ve Müşteri geçmişinde `Uyarı kapatıldı — …` gerekçesiyle görünür.
- **AC-NEG4 — Gerekçesiz uyarı işlemi:** panelde gerekçe boşken kapatma ve erteleme reddedilir (`"Gerekçe zorunlu"`) ve `alertStates` değişmez.
- **AC14 — Satır uyarı ikonu**
  - Gecikmiş açık bir adıma (`item_late`) sahip fixture'da o adımın satırında uyarı ikonu vardır; tooltip uyarı başlığını içerir.
  - Uyarı kapatıldıktan sonra ikon kaybolur.
- **AC15 — Toplantılar filtresi**
  - İş Yatırım'da Tür = Eğitim seçilince yalnızca 2 Eğitim toplantısı listelenir.
  - Durum = Planlandı seçilince yalnızca planlanmış toplantılar listelenir.
  - Eşleşme yoksa boş durum metni görünür.
- **AC16 — 06 şablonu (S7 kararı)**
  - `PHASE_TEMPLATE` 06'da `support_track` yok.
  - Yeni oluşturulan projede ve seed'de `key "support_track"` adımı yok.
- **AC17 — Seed v11**
  - `createSeed().version === 11`.
  - Seed'de 6 proje var; `p_lojistik` ve `p_perakende` dahil (S5 kararı).
  - Değişmezler §7'deki gibi.
  - localStorage'da v10 kaydı (`rabbitqa-demo-state-v10`) varken `RqProvider` seed'i yeniden yükler (REV-11 / RUL-03).
- **AC18 — Raporlar**
  - L1 `buildReportSnapshot`: `p_perakende`'de bu hafta tamamlanan `Uyarlama: Mobil` `completed` listesinde başlığıyla yer alır.
  - `phases` 04 ve 05 satırlarını doğru durumla içerir.
  - İş Yatırım haftalık rapor ve yönetim raporu ekranları hatasız açılır (L6).
- **AC19 — RUL-05, Seçenek A + ekler** (L1 + L3 store; Seçenek B **uygulanmaz** ve testlenmez)
  - **Kurulum tipi, tamamlanmış aşama**
    - Fixture: 01 `done`, kurulum tipi SaaS (`reqdoc` `out_of_scope`), `req_doc` yok, held kick-off eşikten eski. Sistem saati sabit, bugün iş günü.
    - When: `setInstallChoice(pid, { installType: "onprem" }, "gerekçe")`.
    - Then:
      - `reqdoc` `out_of_scope` kalır; 01 aşaması `done` kalır. `actualEnd`, `approvedBy`, `approvedAt` değişmez.
      - Projede `ruleKey "rule_review:<reqdocId>"` olan **tam olarak bir** `open` aksiyon vardır. Alanları:
        - `ownerId === project.csmId`, `ball "csm"`, `source "rule"`, `isCustomerVisible false`
        - `due === addBusinessDays(todayISO(), 2)`
        - `title` `Gözden geçir: ` ile başlar ve `Kurulum tipi SaaS→On-prem değişti; 01 Kick-off tamamlanmıştı` metnini içerir. Aşama adı fixture'daki `phase.name` ile kurulur.
      - Create audit'i vardır: `entity "action"`, `reason` `Otomatik kural: Kurulum tipi SaaS→On-prem değişti; 01 Kick-off tamamlanmıştı`.
      - `computeAlerts`: `reqdoc_not_shared:<pid>` üretilmez.
    - Aynı tamamlanmış aşamadaki diğer `ONPREM_KEYS` adımları (aşaması `done` olanlar) için de birer aksiyon açılır ve durumları değişmez. Aşaması aktif olan adımlar bugünkü gibi `locked` olur, aksiyon açılmaz.
  - **İdempotans**
    - Aynı `setInstallChoice` çağrısının tekrarı ikinci aksiyon ya da audit üretmez.
    - `ensureReviewAction` doğrudan iki kez çağrılınca da aksiyon sayısı 1 kalır (L1).
    - Açık aksiyon `in_progress` iken yeniden tetikleme yeni aksiyon açmaz.
  - **A→B→A**
    - SaaS'a dönüşte aksiyon `cancelled` olur (status audit'i var). `reqdoc` yine `out_of_scope` kalır.
    - Tekrar On-prem'e geçişte **aynı** aksiyon `open` olur. `due` yeniden hesaplanır, toplam `rule_review:<reqdocId>` aksiyon sayısı 1'dir.
    - Aksiyon `done` yapıldıktan sonra SaaS→On-prem yeniden tetiklenirse yeni bir `open` aksiyon açılır. `done` kayıt değişmez.
  - **LLM gpu, 03 `done`**
    - `model_install` `out_of_scope` ve 03 `done` iken `llmChoice: "gpu"`.
    - Then: `model_install` `out_of_scope` kalır. Gerekçesi `LLM tercihi <eski>→Müşteri GPU'lu sunucu değişti; 03 <ad> tamamlanmıştı` olan bir `rule_review:<modelInstallId>` aksiyonu açılır.
    - gpu dışına dönüşte aksiyon `cancelled` olur.
    - `LLM_ACTIONS` döngüsü (`gpu_req`/`gpu_model`) `rule_review:*` aksiyonuna dokunmaz.
  - **SaaS'a geçiş, 03 `done`, `saas_env` yok**
    - `saas_env` `out_of_scope` olarak oluşturulur (create audit'li) ve onun için aksiyon açılır.
  - **`addTeam`, 05 `done` (S2-b)**
    - `adapt:<team>` adımı `status "out_of_scope"` ile oluşur. Create audit reason'ı `Otomatik kural: takım eklendi — 05 Uyarlama aşaması tamamlanmıştı`.
    - 05 aşaması `done` kalır.
    - `rule_review:<yeniAdımId>` aksiyonu açılır: CSM, `due === addBusinessDays(todayISO(), 2)`, gerekçe `Takım eklendi: <team>; 05 Uyarlama tamamlanmıştı`.
    - Aynı adla ikinci `addTeam` ikinci adım ya da aksiyon üretmez.
  - **Kapsam dışı aşama:** Aşama `out_of_scope` iken kural tetiklenirse adım durumu değişmez ve aksiyon açılmaz.
  - **Görünürlük ve gecikme**
    - L3 (MyWork): aksiyon CSM'in "Bana atananlar" listesinde görünür.
    - L1: sistem saati terminden sonraya alınınca `computeAlerts` bu aksiyon için `item_late` (kırmızı) üretir. Terminden önce, `dueSoonDays` eşiği içinde `action_due_soon` üretir.
  - Mevcut RUL-11 testindeki `not.toBe("out_of_scope")` gevşek assert'i kesin beklenen durumla değiştirilir (RUL-06 m09b). Aktif aşamada `locked`, tamamlanmış aşamada `out_of_scope` + aksiyon.
- **AC-NEG5 — Held toplantıda gerekçe (RUL-07 m09a):**
  - `updateMeeting(heldId, { date: "<başka>" })` gerekçesiz → `"Yapılmış toplantının tür/tarih değişikliğinde gerekçe zorunlu"`; state değişmez.
  - Gerekçeyle çağrı kabul edilir ve audit'te `reason` vardır.
- **AC20 — Backlog:** §6.9'daki her madde için değişiklik notunda test adı veya grep kanıtı bulunur.
- **AC21 — Gerileme yok + tarayıcı kontrolü**
  - Mevcut testler yeni adlarla geçer.
  - Güncellenecek mevcut testler:
    - `workspaces.test.ts` "Akbank 02 discovery_form → step_dialog" örneği: 02 artık çalışma alanlı, yeni beklenen `workspace` + `discovery:q_teams`.
    - `store.test.tsx:280–307` (addTeam/addTraining) yeniden yazılır.
    - `store.test.tsx:436` civarındaki On-prem'e dönüş testi: aşama aktifse beklenti değişmez. Fixture'da aşama `done` ise beklenti AC19'a göre güncellenir.
  - L6: 00 paneli, akış, Dokümanlar, Go-Live, Süreklilik check-in formu çalışır.
  - Konsolda hata yok.
  - Paneller 375 / 1280 px'te M-09b AC14 kuralına uyar: 640px altında tam genişlik, üstünde 640px.
  - 02 ve 03 panelleri tek sütundur.

## 9. Test planı
| AC | Seviye | Dosya |
|---|---|---|
| AC5, AC-NEG1 (koşul), AC7–AC9, AC-NEG2, AC11 (`computeAlerts`), AC16, AC17, AC18, AC19 (rules seviyesi: `applyInstallType`/`applyLlmChoice`/`ensureReviewAction`/`cancelReviewAction`, `computeAlerts` gecikme), RUL-07 m09b r3 testi | L1 | `src/lib/rabbitqa/completion.test.ts` (rules testleri ayrı `rules.test.ts`'e de konabilir; uygulayıcı seçer) |
| AC4 (`workspaceAvailable`, `stepClickTarget` satır 3), AC21 (karar tablosu güncellemesi), REV-10 | L1 | `src/pages/project/workspaces/workspaces.test.ts` |
| AC5, AC6 (store), AC7, AC8, AC-NEG3 (store yarısı), AC-NEG5, AC17 (v10 → seed), AC19 (`setInstallChoice` / `addTeam` uçtan uca, idempotans, A→B→A), RUL-06, RUL-08, RUL-02 | L3 store | `src/lib/rabbitqa/store.test.tsx` |
| AC1–AC4, AC3b, AC6 (form), AC8 (UI), AC10, AC-NEG3 (UI) | L3 bileşen | `src/pages/project/workspaces/PhaseWorkspaces.test.tsx` (yeni) |
| AC12–AC15, AC-NEG4, AC3b (sekme tarafı) | L3 bileşen | `src/pages/ProjectDetail.tabs.test.tsx` (yeni) |
| AC11 (MyWork), AC19 (Bana atananlar) | L3 bileşen | `src/pages/MyWork.test.tsx` (yeni) |
| REV-15, REV-16, REV-20 | L3 bileşen | `src/pages/project/workspaces/HandoverWorkspace.test.tsx` |
| AC1, AC3, AC3b, AC4, AC8, AC10, AC12, AC13, AC18, AC21 | L6 (qa-verifier, Playwright MCP, demo modu) | Roller manager, csm, devops, care. Projeler `p_akbank`, `p_garanti`, `p_perakende`, `p_lojistik`. Viewport 375 / 1280 |

Radix Select jsdom'da zor çalışır. Toplantı filtresi ve tür seçimi L3'te değer/`disabled` kontrolüyle yetinir; seçim L6'da doğrulanır.

## 10. İlgili invariant maddeleri
- **INV-26**
  - Yeni veri koşulları (`training_*`, `adapt:*`) yalnızca `completion.ts`'te tanımlanır.
  - Kontrol listesi ve toplantı yalnızca veri yazar.
  - Geri açılma ve aşama `done` istisnası aynen geçerlidir.
  - Elle "Tamamlandı" yasağı devam eder.
- **INV-25**
  - Kilitli `adapt:*` adımı iş sayılmaz (AC11).
  - Takım adımı `locked` doğar, akış açar.
  - RUL-05 Seçenek A ile tamamlanmış aşamada `locked` adım üretilmez; adım `out_of_scope` kalır veya doğar. Böylece "kilitli adım kalıcı kalmaz" sağlanır. Açılmış adım tekrar kilitlenmez.
- **INV-09**
  - `addTeam` idempotent.
  - `adapt:general` silinmez, `out_of_scope` + gerekçe alır.
  - RUL-05 A→B→A testleri.
  - `rule_review:<stepId>` için en fazla bir açık aksiyon.
- **INV-08:** RUL-05 Seçenek A tamamlanmış aşamayı yeniden açmaz. `actualEnd`, `approvedBy` ve `approvedAt` korunur. Tamamlanmış aşamada açık zorunlu adım oluşmaz.
- **INV-07:** Baseline ve gerçekleşen bitiş RUL-05 tarafından değiştirilmez.
- **INV-05 / INV-06**
  - Kontrol listesi maddesi başına audit.
  - Held toplantı tür/tarih değişikliğinde gerekçe.
  - Uyarı erteleme/kapatma gerekçesi (panel taşınır, kural aynı).
  - RUL-05 aksiyonunun açılması, iptali ve yeniden açılması audit'li ve gerekçelidir.
- **INV-11 (demo karşılığı):** Erişim bilgisi yalnızca `canSeeCredentials` ile görünür; "Göster" audit'lidir. Bileşen taşınır, davranış değişmez. `CredentialsSection` içinde kalan "Kurulum özeti" kartı erişim bilgisi içermez (yalnızca kurulum tipi ve LLM).
- **INV-12 / INV-27:** Rapor snapshot mantığı değişmez. Yeni adım başlıkları `completed` listesine audit'ten girer. RUL-05 aşama durumunu değiştirmediği için raporlardaki aşama tablosu oynamaz.
- **INV-13:** Termin hesabı yalnızca `business-days.ts`. RUL-05 aksiyon termini `addBusinessDays(todayISO(), 2)`; yeni kodda tarih aritmetiği yok.
- **INV-16 (demo):** Yetki yalnızca `perm.ts`; `workspaceAvailable` `canSeeCredentials`'ı çağırır.

## 11. Kararlar, riskler ve açık sorular

Bu planın tüm açık soruları (S1–S7, S2-b dahil) 2026-10-05'te Murat tarafından karara bağlandı. Açık soru kalmadı. Sorular kayıt için aşağıda duruyor; her birinin altında kararı yazılı.

### Kararlar (Murat)

**S2 — RUL-05: tamamlanmış (`done`) aşamadaki bir adımı kural motoru yeniden gerekli kılarsa ne olur?** (Medium; BACKLOG m09b r2 + bağlı RUL-07 m09b r3)
**Karar (2026-10-05): Seçenek A (+ ekler).** Seçenek B aşağıda yalnızca referans olarak durur; **seçilmedi, uygulanmaz.**

*Bugünkü davranış ve sorun:*
- `rules.ts` `applyInstallType` (satır 31–36, 38–41) ve `applyLlmChoice` (satır 98–102), `out_of_scope` adımı aşamasının durumuna **bakmadan** `locked` yapıyor (`due: null, activatedAt: null`). Örnekler:
  - SaaS → On-prem: `reqdoc`, `vpn_req`, `vpn_info`, `servers`, `devops_handover`
  - On-prem → SaaS: `saas_env`
  - LLM → gpu: `model_install`
- Akış motoru (`flow.ts:47,52`) yalnızca **aktif** aşamadaki kilitli adımları açar. Aşama `done` ise adım **kalıcı olarak kilitli** kalır:
  - iş sayılmaz (INV-25)
  - kimseye düşmez
  - uyarı üretmez
  - aşama "Tamamlandı" görünür
- Somut sonuç (RUL-07 m09b r3): 01 Kick-off SaaS'la onaylanmış bir proje On-prem'e çevrilirse `reqdoc` kalıcı kilitli kalır. `reqdoc_not_shared` artık adım durumuna (`isOpenStep`) baktığı için **hiç üretilmez**: paylaşılmayan gereksinim dokümanı sessiz kalır. M-09b öncesi kod bu durumda uyarı veriyordu.
- Mevcut RUL-11 testi bu durumu `not.toBe("out_of_scope")` gibi gevşek bir assert'le kabul ediyor.
- **Aynı soru M-09c'de yeni bir yerde doğuyor:** 05 Uyarlama `done` iken `addTeam` → yeni `Uyarlama: <takım>` adımı `locked` doğar ve aynı şekilde kalıcı kilitli kalır.
- Spec iki şey söylüyor ama tamamlanmış aşamada nasıl uzlaşacaklarını tanımlamıyor:
  - "seçim değişirse yeni adımlar açılır" (satır 162)
  - "aşama zorunlu adımlar tamamlanmadan Tamamlandı olamaz" (INV-08)

*Seçenek A — Tamamlanmış aşamaya dokunma, CSM'e gözden geçirme aksiyonu aç* — **SEÇİLDİ**
- Davranış (ayrıntılı tanım §6.2 "rules.ts — RUL-05"):
  - `applyInstallType` / `applyLlmChoice`, aşaması `done` veya `out_of_scope` olan adımların **durumunu iki yönde de değiştirmez**.
  - Aşama `done` iken normalde adımı yeniden gerekli kılacak (`out_of_scope → locked` ya da tamamlanmış aşamaya yeni adım) her adım için bir "Gözden geçir" aksiyonu açılır. Aşama `out_of_scope` ise aksiyon açılmaz.
  - **Murat'ın ekleri:**
    1. **Atama:** Aksiyon proje CSM'ine atanır (`ownerId: project.csmId`, `ball: "csm"`).
    2. **Termin:** Bugünden 2 iş günü sonrası, `addBusinessDays(todayISO(), 2)` ile (`business-days.ts`, tatiller dahil).
    3. **Gerekçe:** Hangi kuralın tetiklediği açıkça yazar. Örnek: "Kurulum tipi SaaS→On-prem değişti; 03 Kurulum tamamlanmıştı". Metin aksiyon başlığında (`Gözden geçir: <adım> — <gerekçe>`) ve create audit'inin `reason`'ında yer alır. Kalıplar §6.2'de.
    4. **Görünürlük ve gecikme:** Termin dolu olduğu için aksiyon "Bana atananlar"da görünür. Termin yaklaşınca `action_due_soon`, geçince `item_late` uyarısı mevcut mekanizmayla (`alerts.ts`) üretilir. Yeni uyarı kodu yok.
    5. **İdempotans:** Aynı adım için (`ruleKey: "rule_review:<stepId>"`) zaten `open`/`in_progress` aksiyon varsa ikincisi açılmaz ve audit yazılmaz.
  - Diğer alanlar: `isCustomerVisible: false`, `source: "rule"`, `priority: "medium"`.
  - Tersi seçimde açık aksiyon `cancelled` olur. A→B→A'da aynı aksiyon yeniden `open` olur ve termini yeniden hesaplanır. Önceki aksiyon `done` ise yeni tetikleme yeni aksiyon açar.
- Etkiler:
  - (+) Onaylı aşama, baseline ve gerçekleşen bitiş korunur (INV-07/08).
  - (+) Rapor geçmişi ve aşama durumu oynamaz.
  - (+) Kalıcı kilitli adım oluşmaz.
  - (+) İş sessiz kalmaz: aksiyon CSM'in Bana atananlar listesine termini ile düşer, gecikirse uyarı üretir.
  - (+) İdempotans sayesinde tekrar eden seçim değişiklikleri aksiyon yığını üretmez.
  - (−) Adım "Kapsam dışı" kalır ama fiilen gerekli olabilir; veri anlamı yanlış olabilir. Karar CSM'in gözden geçirmesine bırakılır.
  - (−) `reqdoc_not_shared` yine **üretilmez**; sinyal yalnızca aksiyon ve onun gecikme uyarısıdır. RUL-07 "kabul edildi" olarak kapanır.
  - (−) Yeni bir kural ve aksiyon türü (`rule_review:*`) gelir; F0-01 sözleşmesine girer (§4, §3 F1 notu).
  - Diff: ~90 satır + test (ekler dahil).

*Seçenek B — Aşamayı yeniden aç; adım akışla açılsın* — **SEÇİLMEDİ (yalnızca referans; uygulanmaz)**
- Davranış:
  - Kural, `done` aşamadaki bir adımı `out_of_scope → locked` yaparken (ya da `addTeam` `done` 05'e adım eklerken) aşamayı `in_progress`'e çeker:
    - `actualEnd`, `approvedBy` ve `approvedAt` null olur
    - eski değerler audit'te kalır, reason "Otomatik kural: kurulum tipi On-prem — tamamlanmış aşamada adım yeniden gerekli"
  - Aynı settle'da akış adımı `pending` yapar (termin bugünden, iş günüyle).
  - Aşama yeniden ancak CSM onayıyla kapanır; "Aşama onayı bekliyor" aksiyonu yeniden açılır.
  - `out_of_scope` (kapsam dışı) aşamalara yine dokunulmaz.
- Etkiler:
  - (+) Spec'in "yeni adımlar açılır" ifadesine birebir uyar.
  - (+) İş görünür olur: Bana atananlar, gecikme, uyarılar.
  - (+) `reqdoc_not_shared` yeniden çalışır; RUL-07 yapısal olarak çözülür.
  - (+) Yeni kavram yok.
  - (−) Onaylanmış aşama geri açılır; onay kaydı sıfırlanır (INV-08 açısından yeniden onay gerekir).
  - (−) Aşamanın `planEnd`'i geçmişte kaldığı için **hemen kırmızı "Aşama gecikti"** uyarısı çıkar; kick-off eskiyse `reqdoc_not_shared` da hemen çıkar. CSM'in plan tarihini gerekçeyle güncellemesi gerekir (baseline korunur, INV-07).
  - (−) Sonraki aşamalar zaten başlamış olduğundan aynı anda iki aktif aşama olur; bu mümkün, mevcut akış izin veriyor.
  - (−) Müşteri raporundaki aşama tablosunda aşama "Devam ediyor"a döner (yeni snapshot'larda; gönderilmiş rapor değişmez, INV-27).
  - Diff: ~50 satır + test.

*Değerlendirilmeyen varyant:* Aşamayı `done` bırakıp adımı doğrudan `pending` yapmak. Bu, "tamamlanmış aşamada açık zorunlu adım" üretir ve INV-08'in değişmezini bozar. Bu yüzden seçenek olarak sunulmadı.

*Kararla birlikte yapılacaklar:*
- AC19 testleri (yalnızca Seçenek A) yazılır.
- RUL-11 testindeki gevşek assert kesinleşir (RUL-06 m09b).
- "01 done + SaaS→On-prem + `req_doc` yok + eşik aşıldı" L1 testi eklenir (RUL-07 m09b r3). Beklenti: `reqdoc_not_shared` üretilmez, `rule_review:<reqdocId>` aksiyonu açılır, termin geçince `item_late` üretilir.

**S2-b — `addTeam` 05 `done` iken.** **Karar: Seçenek A (+ ekler), S2 ile aynı.**
- Adım `Uyarlama: <takım>` (`key: "adapt:<takım>"`) `status: "out_of_scope"` ile oluşturulur. Create audit reason'ı: "Otomatik kural: takım eklendi — 05 Uyarlama aşaması tamamlanmıştı".
- 05 aşaması `done` kalır; onay ve bitiş alanları değişmez.
- Aynı tür "Gözden geçir" aksiyonu açılır:
  - `ruleKey: "rule_review:<adımId>"`, proje CSM'ine atanır
  - termin `addBusinessDays(todayISO(), 2)`
  - gerekçe "Takım eklendi: <takım>; 05 Uyarlama tamamlanmıştı"
  - `isCustomerVisible: false`
- İdempotans: aynı adla ikinci `addTeam` no-op'tur (adım, aksiyon ve audit yok). Aynı adım için açık aksiyon varken ikincisi açılmaz.
- 05 `out_of_scope` ise adım `out_of_scope` doğar ve aksiyon açılmaz.
- (Seçenek B karşılığı — 05'i yeniden açmak — seçilmedi.)

### Önceki açık sorular — tümü karara bağlandı (Murat, 2026-10-05)

**S1 — Diff boyutu ve bölme.**
- Tahmin: ~1400–1700 satır (taşınan kod ve testler dahil; net yeni mantık ~500). Planner kuralı ~400'ü aşınca bölmeyi öneriyor.
- **Seçenek 1 (M-09b S1 emsali):** tek branch, 5 ayrık commit:
  1. model, store, completion, rules (RUL-05), seed + L1/L3 store testleri
  2. paylaşılan bileşen çıkarımları (`MeetingStepSection`, `DiscoveryContent`, `CredentialsSection`, `ProjectAlertsPanel`), davranış değişmez (S6: Kurulum özeti kartı `CredentialsSection`'a kurulum tipi/LLM satırlarıyla taşınır; yalnızca kart içindeki adım listesi kalkar)
  3. 02/03/04/05 çalışma alanları + `workspaceAvailable` + L3
  4. sekmeler, uyarı rozeti/paneli, satır ikonları, Toplantılar filtresi, eski parametreler, Overview + L3
  5. backlog maddeleri
- **Seçenek 2:** iki branch, sırayla.
  - `feat/m09c1-training-adaptation`: commit 1 + 04/05 alanları + sekmelerinin kaldırılması.
  - `feat/m09c2-workspaces-tabs-alerts`: 02/03, uyarılar, son sekme düzeni, backlog.
  - Her biri ayrı `/gate`'ten geçer.
- Güvenli varsayım: Seçenek 1 (emsal onaylı).
- **Karar (2026-10-05): Seçenek 1.** Tek branch `feat/m09c-phase-workspaces-tabs`, yukarıdaki sırayla 5 ayrı commit, tek `/gate`.

**S3 — Takım kimliği = takım adı.**
- Demo'da `project.teams: string[]`. `Meeting.teamId` bugün zaten adı tutuyor. Bu yüzden `Adaptation.teamId` ve `adapt:<teamId>` takım adını kullanır.
- Takım yeniden adlandırma ve silme demo'da yok. F1'de `teams` tablosu gelir (§3).
- Güvenli varsayım: ad = kimlik.
- **Karar: onaylandı.** Demo'da tek mantıklı seçenek olduğu için ayrıca sorulmadı; güvenli varsayım kabul edildi. Plan değişmez.

**S4 — DevOps'un erişim bilgisi eklemesi.**
- Bugün `AccessTab`'da `canSeeCredentials` olan herkes (DevOps dahil) ekleyebiliyor. RBAC.md satır 16 DevOps'a yalnızca R veriyor.
- Güvenli varsayım: davranış değişmez (bileşen taşınır); uyumsuzluk F1 RBAC matrisinde netleşir.
- DevOps'un panelde ekleyememesi isteniyorsa belirtin.
- **Karar: onaylandı.** Davranış aynı kalır, dokunulmaz. DevOps sekmede ve 03 panelinde bugünkü gibi ekleyebilir. RBAC.md ile uyumsuzluk F1 RBAC matrisinde ele alınır.

**S5 — Seed'e 2 yeni örnek müşteri** (`p_lojistik`, `p_perakende`).
- Mevcut projeler başka demolara bağlı:
  - `p_garanti`: 03 VPN örneği
  - `p_akbank`: keşif ve sessiz proje örneği
  - `p_ornek`: M-09b testleri
- Bu yüzden yeni proje önerildi. Proje sayısı 4'ten 6'ya çıkar. Kabul mü?
- **Karar: onaylandı.** `p_lojistik` ve `p_perakende` ikisi de eklenir (§7, AC17).

**S6 — "Kurulum özeti" kartı kalkıyor mu?**
- Plan taslağı: adım listesiyle birlikte kurulum tipi/LLM satırları da Erişim bilgileri sekmesinden kalkar; bu bilgi 00 panelinde duruyor.
- Güvenli varsayım (taslak): tamamen kalkar.
- **Karar (2026-10-05): kalsın. Güvenli varsayımın tersi.**
  - Gerekçe: Murat'ın tercihi.
  - Uygulama:
    - Kart, kurulum tipi ve LLM satırlarıyla `CredentialsSection` içine taşınır ve silinmez.
    - Kart hem "Erişim bilgileri" sekmesinde hem 03 (AccessWorkspace) panelinde görünür.
    - Kart salt gösterimdir; seçim 00 panelinde yapılır.
  - Kart içindeki 03 adım listesi (`installSteps`) yine kalkar. Brief bu listenin kalkmasını ayrıca istiyor, 03 adımları panelin adım listesinde ve Aşamalar sekmesinde zaten görünüyor, AC4 de "adım listesi içermez" diyor. Murat'ın kararı kartın kendisini ve kurulum tipi/LLM satırlarını kapsıyor. Adım listesinin de kalması isteniyorsa bu ayrıca belirtilmeli; plan buna göre değil.
  - Yansıdığı yerler: §2, §3.1, §5 notu, §6.1, §6.3 AccessWorkspace, §6.5, §6.8, AC3b, AC4, AC21, §9, §10 INV-11, §12, §13.

**S7 — 06 "Destek kayıtlarının takibi".**
- Brief "mevcut projelerde Kapsam dışı (gerekçe 'Faz 2')" diyor. Demo'da v11 ile seed yeniden yüklendiği için kalıcı "mevcut proje" yok.
- Plan adımı şablondan kaldırıyor ve seed'de hiçbir projede oluşturmuyor.
- F1'de canlı veri için migration notu olarak kalır. Seed'de İş Yatırım'da `out_of_scope` "Faz 2" örneği görmek isterseniz belirtin.
- **Karar: onaylandı.** `support_track` şablondan kalkar ve seed'de hiçbir projede oluşmaz; `out_of_scope` örneği de yok (§6.2, §7, AC16). F1 migration notu §3'te.

### Riskler ve notlar
- **`DiscoveryContent` ve `CredentialsSection` panelde `lg` kırılımı:** panel 640px olsa da `lg:` viewport'a göre çalışır. İki bileşende de `layout="panel"` prop'u zorunludur; qa-verifier 1280px'te 02 ve 03 panellerinin tek sütun olduğunu doğrular.
- **Önekli koşul anahtarı (`adapt:`)** `STEP_CONDITIONS` doğrudan indekslenen her yerde `conditionFor`'a geçmezse etiket boş kalır. Uygulayıcı `grep "STEP_CONDITIONS\["` çıktısını değişiklik notuna koyar.
- **Uyarı panelinin açık tutulması:** Sheet modal'dır (uyarı paneli içinden `AlertActionDialog` açılır). Escape önce diyaloğu kapatır, sonra paneli (L6).
- **Kurulum özeti kartının görünürlüğü (S6):** Kart artık yalnızca `canSeeCredentials` olanlara görünür (sekme ve 03 paneli). Bugün sekmede tüm rollere görünüyordu. Manager/care/admin için kurulum tipi ve LLM 00 panelinde görünmeye devam eder. Bu bilinçli bir değişikliktir ve değişiklik notunda belirtilir.
- **Kurulum özeti adım listesinin kaldırılması ve lint:** `installSteps` ve kart içindeki `StepStatusBadge` kullanımı kalkınca `Phase2Tabs.tsx`'te kullanılmayan import kalabilir. Lint hata sayısı artmamalı.
- **RUL-05 termini ve "Termin yaklaşıyor" uyarısı:** Termin 2 iş günü sonra olduğu için `dueSoonDays` eşiği 2 veya daha büyükse aksiyon açıldığı anda sarı `action_due_soon` uyarısı üretir. Bu beklenen davranıştır; AC19 testleri buna göre yazılır.
- **RUL-05 ve `todayISO()`:** Kural fonksiyonları termin için `todayISO()` kullanır (mevcut `new Date()` kullanımıyla aynı). L1/L3 testleri sistem saatini sabitler. Aksi halde testler tatil ve hafta sonuna göre değişir.
- **RUL-05 ve CSM'siz proje:** `project.csmId` null ise aksiyon `ownerId: null` ile açılır ve kimsenin Bana atananlar listesine düşmez. Demo seed'inde tüm projelerde CSM var; F1'de CSM zorunluluğu (00 devri) bunu engeller.
- **RUL-05 başlık uzunluğu:** Gerekçe başlıkta taşındığı için aksiyon başlıkları uzun olabilir. Liste görünümleri mevcut kesme davranışıyla gösterir; L6'da 375px'te kontrol edilir.
- **Ana oturum notları (merge sonrası):**
  - `docs/AUDIT.md`: v11, Ctx 51, 13 sekme, `trainings` yok, `rule_review:*` aksiyon ailesi.
  - `docs/PHASES.md`: M-09c ✅.
  - `docs/DATA_MODEL.md` §9: §3 notları (RUL-05 kısmi UNIQUE notu ve `support_track` migration notu dahil).
  - `docs/reviews/BACKLOG.md`: §6.9 maddeleri düşülür. RUL-05 m09b r2 "çözüldü (Seçenek A)", RUL-07 m09b r3 "kabul edildi".

## 12. Gerekli gate'ler
Bölme yok (S1 kararı). Tek branch `feat/m09c-phase-workspaces-tabs`, tek `/gate`. Gate'ler 5 commit'in tamamını birlikte denetler.

- [x] **reviewer** (demo modu)
  - Taşınan bileşenlerde (`MeetingStepSection`, `DiscoveryContent`, `CredentialsSection`, `ProjectAlertsPanel`) kopya kalmadığını doğrular.
  - `CredentialsSection`'da "Kurulum özeti" kartının kurulum tipi ve LLM satırlarıyla kaldığını, yalnızca adım listesinin kalktığını doğrular (S6).
- [x] **qa-verifier** (demo modu, **tarayıcı kontrolü zorunlu**)
  - AC: AC1, AC3, AC3b, AC4, AC8, AC10, AC12, AC13, AC18, AC21.
  - Roller: manager, csm, devops, care.
  - Viewport 375 / 1280 px, ekran görüntüleriyle.
  - 03 paneli ve "Erişim bilgileri" sekmesinde "Kurulum özeti" kartının göründüğü, panelde tek sütun olduğu ekran görüntüsüyle kanıtlanır.
- [x] **rules-reviewer: evet.** Diff şu tetikleyicilere dokunuyor:
  - Otomatik kurallar: `rules.ts` RUL-05 Seçenek A (tamamlanmış aşama koruması, `rule_review:*` aksiyonu, idempotans, iptal/yeniden açma), `addTeam` kuralı, `adapt:general` → `out_of_scope` (INV-09)
  - Adım tamamlama: `completion.ts` yeni koşullar ve `conditionFor`, meeting `status` ile Eğitim koşulu (INV-26)
  - Sıralı akış: kilitli takım adımı, `activatedAt`. Tamamlanmış aşamada `locked` adım üretilmemesi; aşama yeniden açılmaz (INV-25, INV-08)
  - İş günü: RUL-05 aksiyon termini `addBusinessDays(todayISO(), 2)` (INV-13)
  - Şablon kopyalama: `PHASE_TEMPLATE` 04/05/06 (`support_track` kaldırılması, S7), `buildFromTemplate` (INV-10)
  - Uyarılar: `reqdoc_not_shared` (RUL-07, kabul edildi), RUL-05 aksiyonunun `item_late`/`action_due_soon` üretmesi, uyarı paneli erteleme/kapatma (INV-13, INV-06)
  - Audit/gerekçe: `updateMeeting` held gerekçesi, `setAdaptationCheck` audit'i, RUL-05 aksiyon create/cancel/reopen audit'i (INV-05/06)
  - Rapor snapshot: yeni adım başlıklarının `completed`'a girişi (INV-12/27)
  - Erişim bilgileri: `CredentialsSection` taşıması; ekleme yetkisi değişmez (S4); Kurulum özeti kartı içinde kalır ve erişim bilgisi içermez (S6) (INV-11)
- **Zorunlu kenar durumlar:**
  - A→B→A (kurulum tipi ve LLM, tamamlanmış aşamada; RUL-05): aynı aksiyon cancel → reopen, toplam açık aksiyon 1
  - RUL-05 idempotans: aynı çağrı iki kez; açık aksiyon `in_progress` iken yeniden tetikleme; önceki aksiyon `done` iken yeniden tetikleme (yeni aksiyon)
  - RUL-05 termini: bugün hafta sonu veya tatil iken (`addBusinessDays` sözleşmesi), termin geçince `item_late`
  - RUL-05 aşama `out_of_scope` iken aksiyon açılmaması
  - `addTeam` iki kez, `addTeam` 05 `done` iken (adım `out_of_scope` + aksiyon)
  - Kontrol listesi aşama `done` iken madde kaldırma
  - Eğitim: yalnızca iptal / planlı + held karışık
  - Kilitli takım adımının uyarı ve Bana atananlar dışında kalması
  - `reqdoc_not_shared` iş günü eşiği (`p_lojistik` seed'i, tatil içeren tarih)

## 13. Uygulama görev metni
```
BAĞLAM — RabbitQA Onboarding Tracker (Faz M, demo uygulama)
- Önce oku: AGENTS.md ("Demo kuralları"), docs/INVARIANTS.md (INV-05, 06, 07, 08, 09, 10, 11, 12, 13, 25, 26, 27), docs/RBAC.md, docs/TEST_STRATEGY.md ve bu planın tamamı: docs/plans/M-09c-phase-workspaces-tabs.md. Plan ile bu metin çelişirse plan geçerlidir.
- Tüm açık sorular karara bağlandı (plan §11, 2026-10-05): S1 tek branch + 5 commit; S2/S2-b RUL-05 Seçenek A + ekler (Seçenek B UYGULANMAZ); S3 takım kimliği = ad; S4 DevOps erişim ekleme davranışı aynı kalır; S5 p_lojistik ve p_perakende eklenir; S6 "Kurulum özeti" kartı KALIR (kurulum tipi + LLM satırları; yalnızca kart içindeki adım listesi kalkar); S7 support_track şablondan kalkar, seed'de hiç oluşmaz.
- DEMO: backend, DB, Supabase, migration yok. Veri src/lib/rabbitqa/ store'unda (RqProvider/useRq). Her değişiklik store fonksiyonundan geçer ve audit yazar.
- Akış yalnızca flow.ts; tamamlama yalnızca completion.ts (settleAll); uyarılar yalnızca alerts.ts; iş günü yalnızca business-days.ts; yetki yalnızca perm.ts (bileşende rol karşılaştırması yok).
- Enum değerleri değişmez. Yeni npm paketi yok. components/ui elle değiştirilmez. Arayüz Türkçe, tarih gg.aa.yyyy.
- Dokunma: AGENTS.md, CLAUDE.md, docs/ (docs/changes/<branch>.md hariç), .claude/, .github/, .mcp.json.
- Kod taşınır, kopyalanmaz: HandoverWorkspace toplantı bölümü → MeetingStepSection; DiscoveryTab → DiscoveryContent; AccessTab (Kurulum özeti kartı + Erişim bilgileri kartı) → CredentialsSection; AlertsTab → ProjectAlertsPanel.

1) MODEL / STORE / KURALLAR (plan §6.2) — commit 1
- types.ts: TrainingSession, AdaptationSession ve RqState.trainings silinir. Yeni: MeetingTraining { trainerId, modules, recordingUrl }; Meeting.training?; AdaptationItem; Adaptation { id, projectId, teamId: string | null, checklist }; RqState.adaptations: Adaptation[]. Action tipine alan eklenmez.
- labels.ts: ADAPTATION_ITEM_LABEL (5 madde, plan §6.2 sırası).
- completion.ts:
  - STEP_CONDITIONS.training_plan (field "training:sessions") ve training_done (fields "training:sessions", "training:pending"); iptaller sayılmaz.
  - export adaptationCondition(state, projectId, teamId): 5 check, field "adapt:<teamId|general>:<item>"; kayıt yoksa hepsi false.
  - export conditionFor(key): STEP_CONDITIONS[key] ya da "adapt:" öneki. stepConditionResult, applyStepCompletion etiket aramaları ve Admin.tsx:30 bunu kullanır. applyStepCompletion mantığı değişmez.
- store.tsx:
  - addTraining, updateTraining, saveAdaptation SİL (Ctx + implementasyon). Coll/ENTITY'den "trainings" çıkar.
  - setAdaptationCheck(projectId, teamId, item, value) => string | null: takım doğrulaması, kayıt yoksa create audit, madde başına tek update audit (field "checklist.<item>").
  - addTeam: tek adım "Uyarlama: <team>", key "adapt:<team>" (takım adı = kimlik, S3), completion data, independent, 10 iş günü, required, owner CSM, locked. adapt:general açık/kilitli ve genel listede hiç işaret yoksa → out_of_scope, reason "Otomatik kural: takım tanımlandı".
    - 05 done ise: adım aynı alanlarla ama status "out_of_scope" doğar (reason "Otomatik kural: takım eklendi — 05 Uyarlama aşaması tamamlanmıştı"); ensureReviewAction ile gerekçesi "Takım eklendi: <team>; 05 Uyarlama tamamlanmıştı" olan aksiyon açılır. 05 out_of_scope ise adım out_of_scope, aksiyon yok. Aynı adla ikinci çağrı no-op.
  - updateMeeting: held toplantıda type/date değişikliği gerekçesizse "Yapılmış toplantının tür/tarih değişikliğinde gerekçe zorunlu" (RUL-07 m09a).
  - setInstallChoice: updater içinde installChoiceError(cur, …) ile yeniden doğrula (RUL-08). cur.installType / cur.llmChoice'u applyInstallType / applyLlmChoice'a yeni opsiyonel "from" parametresi olarak geçir.
  - addCredential: DEĞİŞMEZ (S4).
- rules.ts — RUL-05 Seçenek A + ekler (plan §6.2 "rules.ts — RUL-05"; Seçenek B UYGULANMAZ):
  - applyInstallType / applyLlmChoice: adımın aşaması done veya out_of_scope ise adım durumunu iki yönde de DEĞİŞTİRME (out_of_scope→locked yok, →out_of_scope yok). Diğer aşamalarda bugünkü davranış aynen kalır.
  - Aşama done iken adım normalde yeniden gerekli olacaksa (ONPREM_KEYS On-prem'e geçişte, saas_env SaaS'a geçişte, model_install gpu'ya geçişte) ensureReviewAction çağır. 03 done iken SaaS'a geçişte saas_env yoksa adımı out_of_scope olarak oluştur (create audit) ve aksiyon aç. Aşama out_of_scope ise aksiyon açma.
  - Tersi seçimde (adım yeniden gereksiz) cancelReviewAction: open/in_progress → cancelled + audit; done aksiyona dokunma.
  - ensureReviewAction(s, projectId, step, phase, gerekçe, mk, reason):
    - ruleKey "rule_review:<step.id>".
    - Bu ruleKey ile open/in_progress aksiyon varsa NO-OP (aksiyon ve audit yok).
    - Yoksa ve cancelled kayıt varsa en yenisini yeniden aç: status open, due yeniden hesapla, ownerId güncel CSM, title güncelle; her değişen alan için update audit.
    - Yoksa (kayıt yok ya da yalnızca done) yeni aksiyon: title "Gözden geçir: <adım başlığı> — <gerekçe>", ownerId project.csmId, ball "csm", due addBusinessDays(todayISO(), 2), priority "medium", status "open", source "rule", meetingId null, isCustomerVisible false. Create audit: entity "action", label "<title> — aksiyon açıldı", reason "Otomatik kural: <gerekçe>".
  - Gerekçe kalıpları: "Kurulum tipi <eski>→<yeni> değişti; <kod> <ad> tamamlanmıştı" (eski null ise "Kurulum tipi <yeni> seçildi; …"), "LLM tercihi <eski etiket>→<yeni etiket> değişti; <kod> <ad> tamamlanmıştı", "Takım eklendi: <takım>; 05 Uyarlama tamamlanmıştı". Aşama adı phase.code + phase.name'den kurulur.
  - Termin yalnızca business-days.ts addBusinessDays ile; tarih aritmetiği yazma.
  - LLM_ACTIONS iptal/yeniden açma döngüsü rule_review:* aksiyonlarına dokunmamalı; bunu testle sabitle.
- seed.ts:
  - STATE_VERSION = 11.
  - PHASE_TEMPLATE: 04 training_plan / training_done (data); 05 tek "Uyarlama" adımı (adapt:general, data, Ö, 10, zorunlu); 06'dan support_track silinir (S7).
  - buildFromTemplate 05: takım varsa genel adım yok, takım başına adım; yoksa genel adım.
  - ADAPTATION_STEPS / ADAPTATION_FLOW silinir.
  - Seed verisi plan §7 (İş Yatırım dönüşümü, p_lojistik ve p_perakende — S5, ai_3 yeniden hedefleme). Proje sayısı 6.
  - Değişmez: settleAll(seed) aynı referansı döner; reqdoc_not_shared yalnızca p_lojistik'te; seed'de rule_review:* aksiyonu yok; seed'de support_track adımı yok (out_of_scope örneği de yok).

2) PAYLAŞILAN BİLEŞENLER (plan §6.3; davranış değişmez) — commit 2
- workspaces/MeetingStepSection.tsx ({ project, stepKey, type, title, readOnly, teamId? }); HandoverWorkspace bölüm e bunu kullanır.
- DiscoveryContent({ project, readOnly, layout: "tab" | "panel" }) ProjectDetail DiscoveryTab'tan; data-field discovery:<qId> (zorunlu sorular), teams, kpis. Takım toast'ı "Takım eklendi, Uyarlama aşamasına adım açıldı"; 05 done iken "Takım eklendi; Uyarlama tamamlandığı için gözden geçirme aksiyonu açıldı".
- CredentialsSection({ project, layout: "tab" | "panel" }) AccessTab'tan. İki kart, bugünkü sırayla:
  - "Kurulum özeti" kartı KALIR (S6): "Kurulum tipi: <INSTALL_LABEL | Seçilmedi>" ve "LLM: <LLM_LABEL | Seçilmedi>" satırları, salt gösterim. Kart içindeki 03 adım listesi (installSteps + StepStatusBadge satırları) kaldırılır.
  - "Erişim bilgileri" kartı: maskeli şifre, "Göster" + logCredentialView, "Süresi doluyor" rozeti, ekleme formu; ekleme formu sarmalayıcısında data-field "credential:vpn".
  - layout "tab" bugünkü lg:grid-cols-2 düzeni; layout "panel" tek sütun (önce Kurulum özeti, sonra Erişim bilgileri).
  - Ekleme yetkisi bugünkü gibi canSeeCredentials (S4; DevOps dahil).
- ProjectAlertsPanel({ project }) AlertsTab'tan.
- MeetingDialog: defaultStatus?, defaultTeamId? prop'ları; tür training ise Eğitmen / Anlatılan modüller / Kayıt linki alanları ve meeting.training. MeetingDetailDialog ile MeetingsTab kartı eğitim bilgisini ve takım adını gösterir.

3) ÇALIŞMA ALANLARI (plan §6.3) — commit 3
- index.ts: PHASE_WORKSPACES += "02" Discovery, "03" Access, "04" Training, "05" Adaptation. export workspaceAvailable(code, user, project) (03 → canSeeCredentials). PhasesTab hasWorkspace ve ?ws okuması bunu kullanır; geçersiz/yetkisiz ws yok sayılır (REV-09/21).
- DiscoveryWorkspace: MeetingStepSection (discovery) + DiscoveryContent layout="panel".
- AccessWorkspace: CredentialsSection layout="panel" (Kurulum özeti kartı + Erişim bilgileri kartı).
- TrainingWorkspace: "x/y session yapıldı"; Eğitim toplantıları listesi (tarih, eğitmen, modüller, katılımcı sayısı, durum, kayıt linki, "Yapıldı olarak işaretle"); data-field training:sessions / training:pending; "Session ekle" → MeetingDialog defaultType training defaultStatus planned.
- AdaptationWorkspace: "x/y takım" ilerlemesi; takım kartları (ad, sorumlu, kullanıcı sayısı, 5 onay kutusu data-field adapt:<team>:<item>, StepStatusBadge, Uyarlama toplantıları, "+ Session ekle" → MeetingDialog defaultType adaptation defaultTeamId). Takım yoksa "Genel" kart.
- readOnly'de tüm girdiler disabled; ekle/işaretle düğmeleri gizli.

4) SEKMELER, UYARILAR, DİĞER EKRANLAR (plan §6.4–6.7) — commit 4
- ProjectTabs: 13 sekme (plan §6.5 sırası). "Kurulum ve erişim" → "Erişim bilgileri" (yalnızca canSeeCredentials; içerik CredentialsSection layout="tab", Kurulum özeti kartı dahil). Destek kayıtları disabled + "Faz 2" Pill + tooltip "Faz 2'de gelecek"; TabsContent yok. Eğitim, Uyarlama, Uyarılar sekmeleri silinir; TrainingTab ve AdaptationTab silinir.
- Parametre eşlemesi plan §6.5 tablosu (training→ws 04, adaptation→ws 05, alerts→uyarı paneli, tickets→phases, yetkisiz access→phases, ?panel=alerts).
- Başlık rozeti "N açık uyarı" (kırmızı varsa danger, 0 ise gizli) → Sheet + ProjectAlertsPanel.
- PhasesTab: aşama ve adım satırlarında açık uyarı ikonu + tooltip (plan §6.4).
- Toplantılar sekmesi: tür ve durum filtreleri, boş durum.
- MyWork.tsx:62, Projects.tsx:120, AppShell.tsx:156 → ?panel=alerts.
- Overview.tsx 65/86/87 → meetings (training/adaptation).
- Admin.tsx 05 metni.
- ProjectDetail 306/755 metinleri.
- HistoryTab: Uyarlama toplantısında takım adı.
- GoLiveTab metni "…Satış Devri çalışma alanından…".

5) BACKLOG (plan §6.9) — commit 5: RUL-05 m09b (Seçenek A), RUL-07 m09b r3 (kabul edildi + L1 testi), RUL-06 m09b, RUL-08, RUL-07 m09a, RUL-05 m09a (store.test.tsx:174 yeterliyse not), RUL-02/RUL-03/REV-11, REV-08/19, REV-09/21, REV-10, REV-15, REV-16, REV-20. Commit mesajına ID ekle (ör. "fix: require reason for held meeting date change [RUL-07]").

6) TESTLER (plan §8–9; her commit kendi testleriyle gelir)
- completion.test.ts (veya rules.test.ts): AC5, AC-NEG1, AC7–AC9, AC-NEG2, AC11, AC16–AC18; AC19 rules seviyesi (tamamlanmış aşama koruması, aksiyon alanları, due = addBusinessDays(todayISO(), 2), gerekçe metni, idempotans, A→B→A cancel/reopen, done sonrası yeni aksiyon, out_of_scope aşamada aksiyon yok, LLM gpu, saas_env oluşturma, LLM_ACTIONS döngüsünün rule_review'a dokunmaması, termin sonrası item_late); RUL-07 m09b r3: reqdoc_not_shared üretilmez + rule_review aksiyonu var; seed değişmezleri (6 proje, support_track yok); "seed'de reqdoc_not_shared yok" testi → "yalnızca p_lojistik". Sistem saati vi.setSystemTime ile sabitlenir.
- workspaces.test.ts: workspaceAvailable; Akbank discovery_form örneği artık workspace + "discovery:q_teams"; REV-10.
- store.test.tsx: setAdaptationCheck, addTeam (eski 5 adım testi yeniden yazılır; 05 done → out_of_scope + aksiyon; ikinci çağrı no-op), addTraining testi silinir/yerine Eğitim toplantısı testi; AC19 setInstallChoice uçtan uca; AC-NEG5; RUL-06/08/02; v10 kaydı → v11 seed (doğru anahtar). RUL-11 gevşek assert'i kesinleştir.
- Yeni: src/pages/project/workspaces/PhaseWorkspaces.test.tsx (AC1–AC4, AC3b Kurulum özeti kartı panelde: kurulum tipi + LLM satırları var, adım listesi ve düzenleme kontrolü yok; AC6 form, AC8 UI, AC10, AC-NEG3), src/pages/ProjectDetail.tabs.test.tsx (AC12–AC15, AC-NEG4, AC3b sekme tarafı), src/pages/MyWork.test.tsx (AC11, AC19 Bana atananlar).
- HandoverWorkspace.test.tsx: REV-15/16/20.

TESLİM
- Branch feat/m09c-phase-workspaces-tabs (S1 kararı: tek branch, bölme yok). 5 commit, bu sırayla: (1) model/store/rules/seed + testler → (2) paylaşılan bileşen çıkarımları → (3) çalışma alanları → (4) sekmeler/uyarılar → (5) backlog. Conventional Commits.
- Push'tan önce: npm run lint && npx tsc --noEmit -p tsconfig.app.json && npm test && npm run build. Lint hata sayısı mevcut durumdan (16) artmasın (Phase2Tabs'te kullanılmayan import kalmasın).
- docs/changes/feat_m09c-phase-workspaces-tabs.md:
  - Ne değişti
  - Eşleme (plan §3.1'den sapma varsa)
  - Kaldırılan alan ve işlemlerin kullanım yerleri (grep: trainings|TrainingSession|AdaptationSession|addTraining|updateTraining|saveAdaptation|ADAPTATION_STEPS|support_track|tab=alerts|STEP_CONDITIONS\[)
  - S6 notu: Kurulum özeti kartı CredentialsSection'da kaldı; kart içi adım listesi kalktı; kart artık yalnızca canSeeCredentials olanlara görünür
  - AC ↔ test tablosu
  - Backlog maddeleri ↔ commit
  - Sapmalar ve açık sorular
