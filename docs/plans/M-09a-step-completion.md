# M-09a — Adım tamamlanma tipi (veri / toplantı / elle) ve otomatik tamamlanma

**Durum:** Tamamlandı
**Spec referansı:** docs/PRODUCT_SPEC.md → Ek B.2 (adım tamamlama tipleri), B.1 (sıralı akış), B.5 (sistem adımları silinemez)
**Üst plan:** docs/plans/M-09-step-completion-workspaces.md → M-09a (bu doküman o görev metnini koddaki gerçek adlarla eşler ve test edilebilir hale getirir)
**Branch:** feat/m09a-step-completion (main'den)
**Bağımlılıklar:** yok (M-09b ve M-09c buna bağlı)
**Mod:** Demo (Faz M). Backend, DB, migration, API yok.

## 1. Amaç
Bugün adımlar elle işaretlenen bir checklist ve formdaki veriyle bağları yok. Bu PR'da her adıma kodda sabit bir tamamlanma tipi veriliyor (`manual` / `data` / `meeting`). Veri ve toplantı adımları, veri girilince ya da "Yapıldı" toplantı kaydedilince kendiliğinden tamamlanır. Veri silinirse ve aşama tamamlanmamışsa adım geri açılır. Bu adımlar elle "Tamamlandı" yapılamaz. Sekme yapısı değişmez. PR sonunda uygulama tamamen çalışır olmalı.

## 2. Kapsam
- Model: `Step.completion`, `StepTpl.completion`, `meetingType`, `Meeting.status`, `Meeting.teamId`, `Project.noCommitments`, state v8 → v9.
- Yeni saf dosya `src/lib/rabbitqa/completion.ts`: koşul kataloğu, `stepConditionResult`, `applyStepCompletion`, `settleProject` / `settleAll` (completion + akış döngüsü), store koruyucuları (`manualStatusError`).
- Store: `updateStep` koruması, `setNoCommitments`, `addCommitment` otomatik kuralı, `addMeeting` / `updateMeeting` durum desteği, toplantı kurallarının yalnızca `held` toplantıda çalışması, `setKickoff` null/gerekçe kuralları, `addDocument` teklif/sözleşme kuralının completion'a devri, `approveInsight` koruması.
- Şablon (00–03) değişiklikleri: `install_type` ve `llm` adımları kaldırılıyor, 00'a `install_llm` ekleniyor.
- Ekranlar: Aşamalar tablosu etiket ve tooltip, StepDialog, Toplantı formu ve listesi, Satış devri "Taahhüt yok", Kick-off "Henüz belli değil", Admin şablon etiketi ve silme koruması.
- Seed senaryoları ve birim/bileşen testleri.

### Kapsam dışı
- Sekme taşıma/kaldırma, çalışma alanı paneli, `data-field` vurgusu (M-09b).
- 04–08 aşamaları, Eğitim/Uyarlama dönüşümü, uyarı rozeti (M-09c).
- Toplantı silme veya `held` → başka durum geçişi.
- Tamamlanan adımlar için yeni toast'lar (M-09b'de geliyor). Mevcut "Sıradaki adım açıldı" toast'ı aynen çalışır.

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: **yok**. Demo store değişikliği. BE karşılığı `docs/DATA_MODEL.md` D15 kararında (F1-00) ele alınacak; bu PR D15 için girdi üretir.
- `pg-only` gereksinimi: yok.

### 3.1 Eşleme (brief'teki ad → koddaki gerçek ad)
| Brief | Kod (main @ a05dcce) | Not |
|---|---|---|
| StepTpl / Step | `src/lib/rabbitqa/types.ts` → `StepTpl` (satır 294), `Step` (94) | `completion` ve `meetingType` eklenir |
| `key` (koşul anahtarı) | `Step.key?: string`, `StepTpl.key?` | Mevcut; `vpn_info` ve `devops_handover` anahtarları zaten var (`rules.ts` `ONPREM_KEYS` de kullanıyor) |
| MeetingType "Satış devri, Kick-off, Keşif, DevOps devri, Eğitim, Uyarlama" | `"brief" \| "kickoff" \| "discovery" \| "devops_handover" \| "training" \| "adaptation"` | **Hepsi zaten var; yeni enum değeri eklenmez.** Değişen yalnızca etiketler: `brief` "Internal brif" → "Satış devri", `devops_handover` "DevOps devir" → "DevOps devri" |
| Meeting.teamId | `Meeting` (types.ts 129) | **Kodda takım id'si yok:** `Project.teams: string[]` takım adlarını tutar. `teamId` bu PR'da **takım adını** taşır (bkz. Açık soru S3) |
| Project.noCommitments | `Project` (types.ts 50) | Yeni alan |
| CSM | `Project.csmId` | |
| Satışçı / lisans modeli | `Project.salespersonId`, `Project.licenseModel` (string; boş = `""`) | |
| Satın alınan modüller | `Project.purchasedModules` | |
| Taahhüt | `RqState.commitments` (`Commitment.projectId`) | |
| Kurulum tipi / LLM | `Project.installType: InstallType \| null`, `Project.llmChoice: LlmChoice \| null` | "Henüz belli değil" = `null`, mevcut tiple uyumlu |
| Teklif / sözleşme dokümanı | `DocumentRec.type === "offer" \| "contract"` | |
| Zorunlu keşif soruları | `state.questions` (`required`), `Project.discoveryAnswers[q.id]` | Modül tipli soruların cevabı da `discoveryAnswers`'a yazılıyor (ProjectDetail 837/860) |
| Takım | `Project.teams` | |
| KPI | `state.kpis` (`baseline`, `target`) | |
| VPN erişim bilgisi | `state.credentials` (`Credential.type` serbest metin, varsayılan "VPN") | Karşılaştırma `type.trim().toLowerCase() === "vpn"` |
| advanceFlow'un çağrıldığı tek yer | `store.tsx` `setState` → `advanceAll(n, mkRef.current)` (satır 113). Ayrıca `seed.ts` `createSeed` sonunda `advanceAll` | İkisi de `settleAll`'a geçer |
| addMeeting kuralları | `store.tsx` `addMeeting` (272): `devops_handover` → adım done + top DevOps; `go_no_go` → `gonogo` done | Yalnızca `held` toplantıda çalışacak |
| updateMeeting | `store.tsx` 286: generic `patch` (ContinuityTab `MeetingExtras` görünürlük switch'i kullanıyor) | İmza genişler, dönüş `string \| null` olur |
| Kurulum tipi / LLM kaydı | `store.tsx` `setKickoff` (319), UI `src/pages/project/Phase2Tabs.tsx` `KickoffTab` | `applyInstallType` / `applyLlmChoice` → `rules.ts` |
| Gerekçe mekanizması | Ayrı bir dialog yok. Formda koşullu `Textarea` (`needsReason`) + store'a `reason` parametresi; store `patch(..., reason)` ile audit'e yazar | Yeni gerekçeler aynı desenle |
| Audit | `mkAudit` (store) / `MkAudit` tipi (`flow.ts`); `AuditEntry { entity, entityId, field, oldValue, newValue, reason }` | Otomatik kural gerekçeleri `"Otomatik kural: …"` önekiyle |
| StepDialog | `src/pages/ProjectDetail.tsx` `StepDialog` (348) | |
| Aşamalar ve adımlar tablosu | `ProjectDetail.tsx` `PhasesTab` (229) | |
| Toplantı formu / listesi | `ProjectDetail.tsx` `MeetingDialog` (617, dışa açık; ContinuityTab de kullanıyor), `MeetingsTab` (576) | |
| Satış devri sekmesi | `ProjectDetail.tsx` `HandoverTab` (692) | |
| Kick-off sekmesi | `Phase2Tabs.tsx` `KickoffTab` (30) | |
| Admin > Aşama şablonu | `src/pages/Admin.tsx` `TemplateEditor` (73) | Silme düğmesi bugün `!!s.key` ile pasif (130) |
| İzin | `perm.ts` `canManageProject`, `canEditItem`, `canEditFlow` | Yeni izin fonksiyonu gerekmiyor |

### 3.2 Model değişiklikleri (types.ts, labels.ts)
```ts
export type StepCompletion = "manual" | "data" | "meeting";
export type MeetingStatus = "planned" | "held" | "cancelled";

interface Step    { …; completion: StepCompletion; meetingType?: MeetingType }   // zorunlu alan
interface StepTpl { …; completion?: StepCompletion; meetingType?: MeetingType }  // yoksa "manual"
interface Meeting { …; status: MeetingStatus; teamId?: string | null }
interface Project { …; noCommitments: boolean }
```
- `meetingType` yalnızca `completion === "meeting"` ise dolu olur.
- labels.ts:
  - `COMPLETION_LABEL: Record<StepCompletion,string> = { manual: "Elle", data: "Veriyle", meeting: "Toplantıyla" }`
  - `MEETING_STATUS_LABEL: Record<MeetingStatus,string> = { planned: "Planlandı", held: "Yapıldı", cancelled: "İptal" }`
  - `MEETING_TYPE_LABEL.brief = "Satış devri"`, `MEETING_TYPE_LABEL.devops_handover = "DevOps devri"` (değerler aynı kalır)
- State sürümü: `seed.ts` `version: 9`; `store.tsx` `KEY = "rabbitqa-demo-state-v9"` ve `load()` içinde `s.version === 9`. Eski kayıt yeniden seed'lenir.
- `Step` üreten **tüm** yerler `completion` alanını doldurur:
  - `seed.ts` `buildFromTemplate` (`completion: st.completion ?? "manual"`, `meetingType: st.meetingType`; Uyarlama adımları `"manual"`)
  - `seed.ts` `trainingSteps`
  - `store.tsx` `addTeam`, `addTraining`
  - `rules.ts` `applyInstallType` (saas_env)
  - Hepsi `"manual"`.

## 4. API etkisi
Yok (demo). F0-01 için not: store `Ctx` değişiyor.
- Yeni: `setNoCommitments`.
- İmzası değişen: `updateMeeting(id, patch, reason?) => string | null` ve `setKickoff(...) => { error: string | null; summary: string | null }`.
- `docs/AUDIT.md` §3'teki işlem sayısı (52 → 53) ana oturum tarafından güncellenmeli.

## 5. Yetki etkisi (RBAC)
Yeni izin fonksiyonu yok. Mevcut `perm.ts` fonksiyonları kullanılır.
| Rol | İzin | Not |
|---|---|---|
| csm | Kendi projesinde: "Taahhüt yok", toplantı kaydı ve "Yapıldı olarak işaretle", kurulum tipi/LLM | `canManageProject` |
| devops | Sahibi olduğu adımı StepDialog'da düzenler (veri/toplantı adımında yalnızca Kapsam dışı) | `canEditItem` |
| care | Aynı (sahibi olduğu adım) | `canEditItem` |
| manager | Tüm projeler + CSM ataması | `isAllSeeing` |
| admin | Tüm projeler + şablon ("Tamamlanma" salt okunur) | `canAccessAdmin` |

## 6. Tasarım

### 6.1 `src/lib/rabbitqa/completion.ts` (yeni, saf, React importu yok)
```ts
import type { MkAudit } from "./flow";
export interface ConditionCheck { field: string; label: string; met: boolean }
export interface ConditionResult { met: boolean; missing: { field: string; label: string }[]; checks: ConditionCheck[] }
export interface StepCondition { label: string; check(state: RqState, projectId: string): ConditionResult }
export const STEP_CONDITIONS: Record<string, StepCondition>;
export function stepConditionResult(state: RqState, step: Step): ConditionResult | null; // manual → null
export function applyStepCompletion(state: RqState, projectId: string, mk: MkAudit, now?: Date): RqState;
export function settleProject(state: RqState, projectId: string, mk: MkAudit, now?: Date): RqState;
export function settleAll(state: RqState, mk: MkAudit, now?: Date): RqState;
export function manualStatusError(step: Step, nextStatus: StepStatus | undefined): string | null;
```
`checks` brief'teki `{met, missing}` şekline eklenen bir alandır. StepDialog'daki ✓/✗ listesi sağlanan alt koşulları da göstermek zorunda. `met = checks.every(c => c.met)`, `missing = checks.filter(c => !c.met)`.

**Koşul kataloğu.** `field` değerleri M-09b'de `data-field` olarak kullanılacak; şimdiden sabitlenir.
| key | label | checks (field → label → koşul) |
|---|---|---|
| `csm` | CSM ataması | `csmId` → "CSM" → `csmId !== null` |
| `sales_license` | Satışçı ve lisans modeli | `salespersonId` → "Satışçı" → `!== null`; `licenseModel` → "Lisans modeli" → `licenseModel.trim() !== ""` |
| `modules` | Satın alınan modüller | `purchasedModules` → "Satın alınan modül" → `length > 0` |
| `commitments` | Taahhütler | `commitments` → "Taahhüt veya 'Taahhüt yok'" → projede ≥1 taahhüt `\|\|` `noCommitments` |
| `install_llm` | Kurulum tipi ve LLM tercihi | `installType` → "Kurulum tipi" → `!== null`; `llmChoice` → "LLM tercihi" → `!== null` |
| `offer` | Teklif dokümanı | `doc:offer` → "Teklif dokümanı" → projede `type === "offer"` doküman |
| `contract` | Sözleşme | `doc:contract` → "Sözleşme dokümanı" → projede `type === "contract"` doküman |
| `discovery_form` | Keşif formu | Her `required` soru için `discovery:<q.id>` → `q.text` → `(discoveryAnswers[q.id] ?? "").trim() !== ""`. Zorunlu soru yoksa tek check `discovery` → "Keşif formu" → `true` |
| `teams` | Takım listesi | `teams` → "Takım" → `teams.length > 0` |
| `kpi` | KPI tanımı | `kpis` → "Başlangıç ve hedef değeri dolu KPI" → projede `baseline !== null && target !== null` olan ≥1 KPI |
| `vpn_info` | VPN erişim bilgisi | `credential:vpn` → "VPN erişim bilgisi" → projede `type.trim().toLowerCase() === "vpn"` kayıt |

- Toplantı adımı (key gerekmez): tek check `meeting:<meetingType>` → `"<MEETING_TYPE_LABEL> toplantısı (Yapıldı)"` → projede `type === step.meetingType && status === "held"` toplantı.
- Tanımsız `key` ya da `meetingType`: `{ met: false }` ve tek check `unknown` → "Tanımsız koşul". Bu durumda adım **asla** otomatik tamamlanmaz.

**`applyStepCompletion` karar tablosu.** Yalnızca `projectId` projesinin `completion !== "manual"` adımlarına bakar.
| # | Adım durumu | Aşama durumu | Koşul | Sonuç | Audit reason |
|---|---|---|---|---|---|
| a1 | locked / pending / in_progress | done değil, out_of_scope değil | sağlandı | `status: "done"` (diğer alanlar aynı) | data: `Otomatik kural: veri tamamlandı — <condition.label>`; meeting: `Otomatik kural: <tür> toplantısı kaydedildi` |
| a2 | locked / pending / in_progress | done | sağlandı | `done` (zararsız) | aynı |
| a3 | locked / pending / in_progress | herhangi | sağlanmadı | değişiklik yok | — |
| b1 | done, `activatedAt` dolu | done değil, out_of_scope değil | sağlanmadı | `status: "pending"`; `due` boşsa `addBusinessDays(today, durationDays \|\| 1, holidayDates(state.holidays))` | `Otomatik kural: veri eksildi — <label>` (status ve gerekirse due için ayrı satır) |
| b2 | done, `activatedAt` null | done değil, out_of_scope değil | sağlanmadı | `status: "locked"`, `due: null` (akış aynı turda tekrar açabilir) | aynı |
| b3 | done | done **veya out_of_scope** | sağlanmadı | dokunma | — |
| c | out_of_scope | herhangi | herhangi | dokunma | — |
| d | herhangi | out_of_scope | herhangi | dokunma (bkz. S2) | — |

- Audit satırı: `entity: "step"`, `field: "status"`, `oldValue`, `newValue` dolu.
- `today` = `now`'ın yerel tarihi (`flow.ts`'teki `localISO` ile aynı yöntem).
- Değişiklik yoksa **aynı referansı** döndürür. İdempotans testi buna dayanır.

**`settleProject` / `settleAll`.** `cur` üzerinde en fazla 5 tur: `next = advanceFlow(applyStepCompletion(cur, pid, mk, now), pid, mk, now)`. `next === cur` olunca durur. `settleAll`, `state.projects` üzerinde reduce eder. Akış kodu `flow.ts`'te kalır, completion.ts yalnızca çağırır.

**`manualStatusError(step, next)`.** `next` undefined ya da `step.status` ile aynıysa veya `completion === "manual"` ise `null` döner. Aksi halde:
| Mevcut → istenen | Sonuç |
|---|---|
| herhangi → `done` | `"Bu adım veriyle tamamlanır"` |
| `done` → `pending` / `in_progress` | `"Bu adım veriyle tamamlanır"` |
| herhangi (locked hariç; locked kontrolü mevcut kodda önce gelir) → `out_of_scope` | `null` (gerekçe kuralı mevcut StepDialog'daki gibi) |
| `out_of_scope` → `pending` / `in_progress` | `null`; sonraki settle koşul sağlanıyorsa adımı done yapar |
| `pending` ↔ `in_progress` | `null` |

### 6.2 rules.ts eklemeleri
- `export function installChoiceError(old: Pick<Project,"installType"|"llmChoice">, next: Partial<Pick<Project,"installType"|"llmChoice">>, reason?: string): string | null`
  - değer → `null`: `"Kurulum tipi seçildikten sonra 'Henüz belli değil' yapılamaz"` (LLM için `"LLM tercihi seçildikten sonra 'Henüz belli değil' yapılamaz"`)
  - değer → farklı değer ve `!reason?.trim()`: `"Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu"`
  - `null` → değer: `null` (gerekçesiz)
- `export function applyMeetingHeldRules(s: RqState, m: Meeting, mk: MkAudit): RqState`. `m.status !== "held"` ise `s`'i döndürür.
  - `devops_handover`: `devops_handover` anahtarlı adım `out_of_scope` değilse `setStepByKey(..., { ball: "devops", ballSince: now })`, reason `"Otomatik kural: DevOps devir toplantısı yapıldı, top DevOps'a geçti"`. **`status` buradan kaldırılır**, completion yapar. Mevcut kod SaaS projede kapsam dışı adımı bile done yapıyordu; bu hata da böylece kapanır.
  - `go_no_go`: `setStepByKey(..., "gonogo", { status: "done" }, mk, "Otomatik kural: Go/No-Go toplantısı kaydedildi")`. Bugünkü davranış korunur; `gonogo` M-09c'ye kadar manual.
- `applyInstallType` / `applyLlmChoice` imzaları zaten null kabul etmiyor. Çağıran tarafta `null` için çağrılmaz.

### 6.3 Store değişiklikleri (store.tsx)
| İşlem | Değişiklik |
|---|---|
| `setState` | `advanceAll(n, mkRef.current)` → `settleAll(n, mkRef.current)` |
| `createProject` | `noCommitments: false`. Proje açılışında koşulu sağlanan veri adımları (ör. CSM, satışçı+lisans, modüller) settle ile hemen done olur |
| `updateStep` | Mevcut locked kontrollerinden sonra `const e = manualStatusError(old, p.status); if (e) return e;` |
| `setNoCommitments(projectId: string, value: boolean): string \| null` (yeni, Ctx'e eklenir) | `value === true` ve projede taahhüt varsa `"Taahhüt varken 'Taahhüt yok' işaretlenemez"`. Aksi halde `patch("projects", id, { noCommitments: value })` (audit: field `noCommitments`) |
| `addCommitment` | Tek `setState`: taahhüt ekle + create audit. Proje `noCommitments` ise false yap + audit (`field: "noCommitments"`, reason `"Otomatik kural: taahhüt eklendi"`) |
| `addMeeting(m, actions)` | `m` tipi `status` (zorunlu) ve `teamId?` içerir. Toplantı ekle, sonra `setState(s => applyMeetingHeldRules(s, meeting, mkAudit))`. Doğrudan `setStepByKey` çağrıları kaldırılır |
| `updateMeeting(id, p, reason?) => string \| null` | `p.status` verilmiş ve farklıysa: mevcut status `planned` değilse `"Yalnızca Planlandı toplantının durumu değiştirilebilir"`; hedef `cancelled` ise ve `!reason?.trim()` ise `"İptal için gerekçe zorunlu"`. Geçerliyse `patch(..., reason)` ve hedef `held` ise `applyMeetingHeldRules`. `p.status` yoksa mevcut davranış (görünürlük switch'i) |
| `setKickoff(projectId, kp, reason?) => { error: string \| null; summary: string \| null }` | Önce `installChoiceError(project, kp, reason)`; hata varsa state değişmez, `{ error, summary: null }` döner. `install_type` ve `llm` `setStepByKey` satırları (335, 339) **silinir**. `applyInstallType` / `applyLlmChoice` yalnızca yeni değer non-null ve farklıysa çalışır (mevcut koşul). `presentation` ve `reqdoc` satırları aynen kalır |
| `addDocument` | `offer` / `contract` için `setStepByKey` kaldırılır (completion yapar). `req_doc` → `reqdoc` aynen kalır (manual adım) |
| `approveInsight` `step_update` | Hedef adım `completion !== "manual"` ise `return "Bu adım veriyle tamamlanır"`. Öneri pending kalır, hiçbir şey yazılmaz |

### 6.4 ai-mock.ts
- `step_update` aday filtresine `x.completion === "manual"` eklenir. Veri/toplantı adımı için öneri üretilmez (INV-21/26).

### 6.5 alerts.ts
- `reqdoc_not_shared` (satır 67): kick-off toplantısı aranırken `m.status === "held"` filtresi eklenir. İptal edilen ya da planlanan kick-off süre saymaz. Başka uyarı değişmez.

## 7. Şablon (seed.ts `PHASE_TEMPLATE`)
Sıra, bağlılık, süre ve top kimde korunur. Yalnızca aşağıdakiler değişir (`S(...)` helper'ının `extra`'sı ile):
| Aşama | Adım | completion | key / meetingType | Not |
|---|---|---|---|---|
| 00 | CSM ataması | data | `csm` | ownerRole manager kalır |
| 00 | Satışçı ve lisans modelinin girilmesi | data | `sales_license` | |
| 00 | Satın alınan modüllerin girilmesi | data | `modules` | |
| 00 | Taahhütlerin girilmesi | data | `commitments` | |
| 00 | "Internal brif toplantısı" → **"Satış devri toplantısı"** | meeting | `brief` | Bağlılığı DEĞİŞMEZ (Taahhütler'e bağlı kalır, kararlaştırıldı: S1) |
| 00 | **YENİ** Kurulum tipi ve LLM tercihinin girilmesi | data | `install_llm` | `S(…, bağımsız, "B", 2, …)`, Satış devri toplantısından sonra, Teklif'ten önce (kararlaştırıldı: S1) |
| 00 | Teklif dokümanının yüklenmesi | data | `offer` | |
| 00 | Müşteri sözleşmesinin yüklenmesi | data | `contract` | |
| 01 | Kick-off toplantısı | meeting | `kickoff` | |
| 01 | ~~Kurulum tipi seçimi~~ (`install_type`) | — | — | **Kaldırılır** |
| 01 | Kurulum gereksinim dokümanının paylaşılması | manual | `reqdoc` | On-prem/SaaS kuralları aynen |
| 01 | ~~LLM tercihinin girilmesi~~ (`llm`) | — | — | **Kaldırılır** |
| 01 | Onboarding sunumunun paylaşılması | manual | `presentation` | |
| 02 | Keşif toplantısı | meeting | `discovery` | |
| 02 | Keşif formunun doldurulması | data | `discovery_form` | |
| 02 | Takım listesinin tanımlanması | data | `teams` | **`required: false`** |
| 02 | KPI tanımı | data | `kpi` | |
| 03 | VPN bilgilerinin alınması ve kaydedilmesi | data | `vpn_info` | |
| 03 | Müşterinin DevOps ekibine devir toplantısı | meeting | `devops_handover` (key de kalır) | `ONPREM_KEYS` ve top kuralı key'i kullanıyor |
| 03 | diğerleri | manual | | |
| 04–08 | değişmez | manual | | |

### 7.1 Kaldırılan `install_type` / `llm` adımlarının tüm kullanım yerleri (grep: `install_type|"llm"|installType|llmChoice`)
| Yer | Kullanım | Yapılacak |
|---|---|---|
| `src/lib/rabbitqa/seed.ts:54,56` | Şablon adımları | Silinir; 00'a `install_llm` |
| `src/lib/rabbitqa/store.tsx:335` | `setStepByKey(…, "install_type", done)` | Silinir (completion `install_llm`'i yönetir) |
| `src/lib/rabbitqa/store.tsx:339` | `setStepByKey(…, "llm", done)` | Silinir |
| `src/lib/rabbitqa/alerts.ts:68` | `p.installType === "onprem"` (proje alanı, adım değil) | Değişmez (yalnızca held filtresi, §6.5) |
| `src/pages/Overview.tsx:60` | `!p.llmChoice` → "LLM seçimi bekleniyor" (proje alanı) | Değişmez |
| `src/pages/Overview.tsx:173`, `Phase2Tabs.tsx:380-381`, `ProjectDetail.tsx:944,964-965` | Proje alanının gösterimi | Değişmez |
| `src/lib/rabbitqa/ai-mock.ts`, `reports.ts` | Adım anahtarına referans yok | Değişmez (ai-mock: §6.4 filtresi) |
| `src/pages/Admin.tsx:130` | Generic `!!s.key` silme koruması | §8'de genişler |
| `src/lib/rabbitqa/rules.ts` | `install_type` / `llm` anahtarına referans yok (kurallar proje alanından tetikleniyor) | Değişmez |

Codex PR'da bu tabloyu grep çıktısıyla doğrular.

## 8. UI etkisi
- **PhasesTab (Aşamalar ve adımlar):** `completion !== "manual"` adımda Durum hücresinde badge'in altında `text-xs text-muted-foreground` etiket `COMPLETION_LABEL[...]`. Etiketin Tooltip'i:
  - data ve status `done` / `out_of_scope` değil: `"Eksik: " + missing.map(l => l.label).join(", ")`
  - meeting ve tamamlanmamış: `"<MEETING_TYPE_LABEL> toplantısı kaydedilince tamamlanır"`
  - Tamamlanmış ya da kapsam dışı: tooltip yok.
  - Kilitli adımın mevcut akış tooltip'i aynen kalır.
- **StepDialog:** `completion !== "manual"` ise:
  - Durum `EnumSelect` yerine seçenekleri kısıtlı Select: mevcut durum + `out_of_scope`; mevcut `out_of_scope` ise `pending` ("Bekliyor") da eklenir. Altında açıklama: "Bu adım <veriyle/toplantıyla> tamamlanır; elle yalnızca Kapsam dışı yapılabilir."
  - Altında "Tamamlanma koşulu" listesi: `stepConditionResult().checks` → her satırda ✓ (yeşil, `Check` ikonu) ya da ✗ (kırmızı, `X` ikonu) + label.
  - Locked adımda da liste görünür.
  - Sorumlu, top, termin, başlangıç ve süre mevcut kurallarla düzenlenebilir.
  - Kaydet `updateStep` hatasını toast'lar (mevcut).
- **MeetingDialog:**
  - Tür listesi `MEETING_TYPE_LABEL` (yeni etiketlerle).
  - Yeni "Durum" Select (`MEETING_STATUS_LABEL`). Kullanıcı elle değiştirmedikçe değer tarihe bağlı: `date > todayISO()` ise `planned`, değilse `held` (`statusTouched` flag).
  - Tür `adaptation` ise "Takım" Select: `project.teams` + "Takım seçilmedi" (null). Takım yoksa "Önce Keşif'te takım ekleyin" notu.
  - `addMeeting`'e `status` ve `teamId` gönderilir. Toast metni durumuna göre "Toplantı kaydedildi" / "Toplantı planlandı".
- **MeetingsTab:** her kartta `Pill` durum rozeti (planned: info, held: success, cancelled: muted). `adaptation` ise "Takım: <ad>". `planned` kartta `canManageProject` ise "Yapıldı olarak işaretle" düğmesi → `updateMeeting(id, { status: "held" })`, hata toast'lanır.
- **Diğer toplantı kullanıcıları:**
  - `Phase3Tabs.tsx:469` GoLive hızlı kayıt → `status: "held"`.
  - `Phase2Tabs.tsx:42` KickoffTab "Kick-off toplantısı" metni yalnızca `held` toplantıyı arar.
  - `Overview.tsx:85` yaklaşan toplantılar `cancelled` olanları hariç tutar.
  - `ProjectDetail.tsx` HistoryTab meeting satırına `held` değilse durum etiketi eklenir. `FIELD` etiketlerine `noCommitments: "Taahhüt yok"` ve `teamId: "Takım"` eklenir.
- **HandoverTab:** "Sözler ve taahhütler" kartında Checkbox "Taahhüt yok". `checked = project.noCommitments`, `disabled = !manage || commitments.length > 0` (tooltip "Taahhüt varken işaretlenemez"). Değişince `setNoCommitments`, hata toast'lanır.
- **KickoffTab:**
  - Kurulum tipi RadioGroup'una "Henüz belli değil" (`__none` → `null`), LLM RadioGroup'una aynı seçenek. İkisi de `project.installType` / `project.llmChoice` kayıtlı bir değere sahipse `disabled`.
  - `save` yeni dönüşü kullanır: `error` varsa toast.error ve çık; yoksa mevcut başarı toast'ı.
  - Not: alanlar M-09b'ye kadar Kick-off sekmesinde kalır ama 00'daki `install_llm` adımını tamamlar.
- **Admin TemplateEditor:**
  - Her adım satırında salt okunur `Pill`/metin "Tamamlanma": `Elle` · `Veriyle: <STEP_CONDITIONS[key]?.label>` · `Toplantıyla: <MEETING_TYPE_LABEL[meetingType]>`.
  - Silme: `completion` data/meeting ise disabled + title `"Sistem adımı — veriyle tamamlanır"`; değilse mevcut `!!s.key` kuralı ve mesajı.
  - "Adım ekle" `completion: "manual"` ile ekler. Başlık, süre, bağlılık ve sıra düzenlenebilir kalır.
- Boş/yükleniyor/hata: demo store senkron; hata durumları store dönüş mesajlarıyla toast.

## 9. Seed senaryoları (seed.ts)
- `version: 9`. Sonda `advanceAll` → `settleAll(seedState, sysAudit)`.
- Tüm toplantılara `status: "held"` (planlı olan hariç). Tüm projelere `noCommitments`.
- **İş Yatırım (`p_isyatirim`, 00–05 done):**
  - Eklenenler: `brief` held (2026-08-25), `devops_handover` held (2026-09-02).
  - `discoveryAnswers.q_scenarios` doldurulur (bugün boş, zorunlu soru).
  - Zaten olanlar: kickoff/discovery held, offer + contract dokümanı, `cm_1`, install onprem + llm rabbitqa, VPN `cr_1`, `k_1` (baseline/target dolu), 2 takım.
- **Garanti (`p_garanti`, 00–02 done, 03 aktif):**
  - Eklenenler: `brief` held (2026-09-21), `discovery` held (≤ 02 bitişi), offer + contract dokümanı.
  - **`noCommitments: true`** (taahhüt yok).
  - Zorunlu keşif cevapları doldurulur.
  - `teams: ["Mobil Bankacılık"]` + `teamInfo` **`buildFromTemplate`'ten önce** set edilir (05'te 5 uyarlama adımı kilitli oluşur).
  - Baseline+target dolu ek KPI `k_3` (mevcut `k_2` KPI-ölçülemez uyarısı için kalır).
  - 03'teki `vpn_info` pending kalır (VPN credential yok), `devops_handover` kilitli kalır.
- **Akbank (`p_akbank`, 00–01 done, 02 aktif):**
  - Eklenenler: `brief` held, `kickoff` held, offer + contract dokümanı, 1 taahhüt.
  - `installType: "onprem"`, `llmChoice: "rabbitqa"`, `reqDocShared: true`, `reqDocSharedAt: "2026-09-08"` (yeni `reqdoc_not_shared` uyarısı doğmasın).
  - 02 adımları açık ve verisi eksik kalır (keşif toplantısı yok, cevap yok, takım yok, KPI yok).
- **YENİ `p_ornek` ("Örnek Sigorta A.Ş.", 00 aktif, verisi eksik):**
  - Veri: `csmId: "u_deniz"`, `salespersonId: "s_1"`, `licenseModel: ""`, `purchasedModules: []`, `installType: null`, `llmChoice: null`, `noCommitments: false`.
  - Taahhüt yok, doküman yok, `startDate` = bugünden 2 iş günü önce, `goLiveDate` ≈ +3 ay. Faz bitişleri `projectPlan` ile ya da `createProject`'teki gibi tahmin edilir.
  - **Planlandı** `brief` toplantısı, tarihi bugün + 7 gün (toplantı adımı tamamlanmaz).
  - Beklenen settle sonucu: CSM ataması done ("Otomatik kural: veri tamamlandı — CSM ataması"). Satışçı+lisans pending (eksik: Lisans modeli). Modüller, Taahhütler, Kurulum+LLM pending. Satış devri toplantısı kilitli. Teklif ve Sözleşme pending.
- **Değişmezler (testle doğrulanır):**
  - Seed sonrası her proje için `applyStepCompletion(seed, pid, mk) === seed` ve `settleAll(seed, mk) === seed`.
  - Durumu `done` olan aşamalardaki her `done` veri/toplantı adımı için `stepConditionResult(...).met === true`.

## 10. Kabul kriterleri
Fixture notu: L1 testleri `createSeed()` üzerinde, sabit bir `now` (`new Date("2026-10-05T09:00:00")`) ve sahte `mk` ile çalışır. `p_ornek`'in tarihleri bugüne göre hesaplandığı için testler tarihe değil duruma bakar.

- **AC1**
  - Given `p_ornek` (Satışçı+lisans adımı pending, satışçı seçili)
  - When `licenseModel` "Yıllık abonelik" yapılıp settle çalışır
  - Then "Satışçı ve lisans modelinin girilmesi" `done` olur ve audit'te `entity: "step"`, `field: "status"`, `newValue: "done"`, reason `"Otomatik kural: veri tamamlandı — Satışçı ve lisans modeli"` kaydı oluşur.
- **AC2** (bağlı adım akışla açılır)
  - Given `csmId: null` ile oluşturulmuş yeni proje (CSM ataması pending, Satışçı+lisans kilitli)
  - When `csmId` atanır
  - Then CSM ataması `done` olur ve aynı settle'da "Satışçı ve lisans modelinin girilmesi" `pending` olur, `activatedAt` ve `due` dolar (akış audit'i "önceki adım tamamlandı").
  - Ek: Taahhütler done olunca "Satış devri toplantısı" (Ö) açılır; `install_llm` bağımsızdır, hiçbir adımı açmaz.
- **AC3** (geri açılma)
  - Given AC1 sonrası (00 aktif, adımın `activatedAt` dolu)
  - When `licenseModel` "" yapılır
  - Then adım `pending` olur, `due` korunur (boşsa bugün + süre iş günü) ve reason `"Otomatik kural: veri eksildi — Satışçı ve lisans modeli"` olur.
- **AC4** (aşama tamamlanmışsa geri açılmaz)
  - Given İş Yatırım (00 done)
  - When `licenseModel` "" yapılır
  - Then adım `done` kalır ve bu adım için yeni audit yoktur.
- **AC5** (kilitli adım doğrudan done)
  - Given `p_ornek` (03 kilitli, `vpn_info` locked)
  - When projeye `type: "VPN"` credential eklenir
  - Then `vpn_info` `locked` → `done` olur.
- **AC6** (kilitliyken tamamlanıp veri eksilirse)
  - Given AC5 sonrası `activatedAt: null` olan `done` adım
  - When koşul bozulur (test fixture'ında credential kaldırılır)
  - Then adım `locked` ve `due: null` olur (aşama kilitliyken akış açmaz).
- **AC7** (out_of_scope'a dokunulmaz)
  - Given `out_of_scope` yapılmış bir veri adımı
  - When koşulu sağlanır
  - Then durum `out_of_scope` kalır, audit yok.
- **AC8** (idempotans)
  - Given herhangi bir state
  - When `settleProject` iki kez çalışır
  - Then ikinci çağrı aynı referansı döndürür; seed üzerinde `applyStepCompletion` ve `settleAll` aynı referansı döndürür.
- **AC9** (her koşulun iki hali): `STEP_CONDITIONS`'taki 11 anahtarın her biri ve toplantı koşulu için sağlanan ve sağlanmayan fixture → `met` ve `missing[].field` beklenen değerde.
- **AC10** (elle tamamlama reddi)
  - Given veri adımı pending
  - When `updateStep(id, { status: "done" }, "x")`
  - Then dönüş `"Bu adım veriyle tamamlanır"` olur ve state değişmez.
  - `done` → `pending` de reddedilir. `pending` → `out_of_scope` (gerekçeli) kabul edilir. `out_of_scope` → `pending` kabul edilir, koşul sağlanıyorsa settle done yapar.
- **AC11** ("Taahhüt yok")
  - Given `p_ornek`, When `setNoCommitments(p, true)`, Then Taahhütler adımı `done` olur.
  - When ardından `addCommitment`, Then `noCommitments === false` olur, reason `"Otomatik kural: taahhüt eklendi"` olan audit oluşur ve adım `done` kalır.
- **AC-NEG1:** taahhüdü olan projede `setNoCommitments(p, true)` → `"Taahhüt varken 'Taahhüt yok' işaretlenemez"`, state aynı.
- **AC12** (toplantı adımı)
  - `brief` türünde `held` toplantı eklenince "Satış devri toplantısı" `done` olur (adım kilitliyken bile).
  - `planned` eklenince tamamlanmaz.
  - `updateMeeting(id, { status: "held" })` sonrası tamamlanır.
  - `cancelled` toplantı tamamlamaz.
- **AC-NEG2:** `held` toplantıda `updateMeeting(id, { status: "cancelled" })` → `"Yalnızca Planlandı toplantının durumu değiştirilebilir"`. `planned` → `cancelled` gerekçesiz → `"İptal için gerekçe zorunlu"`.
- **AC13** (toplantı kuralları yalnızca held)
  - `devops_handover` `planned` eklenince adımın topu değişmez.
  - `held`'e çekilince top `devops` olur ve adım (completion ile) `done` olur.
  - `go_no_go` `planned` → `gonogo` değişmez.
- **AC14** (kurulum tipi kuralları)
  - Given `p_ornek` (`installType: null`): `saas_env` yok, ONPREM adımları kapsam dışı değil.
  - When `setKickoff` ile `installType: "onprem"` gerekçesiz, Then `error: null` döner ve `"Otomatik kural: kurulum tipi On-prem"` audit'i oluşur.
  - When ardından `"saas"` gerekçesiz, Then `error: "Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu"` ve state aynı.
  - When gerekçeyle, Then ONPREM adımları `out_of_scope` olur ve `saas_env` oluşur.
- **AC-NEG3:** `installType` dolu projede `installType: null` → `error` (`"…'Henüz belli değil' yapılamaz"`). LLM için de aynısı.
- **AC15** (şablon)
  - `PHASE_TEMPLATE` 01'de `install_type` / `llm` anahtarlı adım yok.
  - 00'ın 6. adımı (`index 5`; sıra: csm 0, sales_license 1, modules 2, commitments 3, Satış devri toplantısı 4, install_llm 5, offer 6, contract 7) `{ key: "install_llm", completion: "data", dependency: "independent", durationDays: 2, required: true }`.
  - §7 tablosundaki her adımın `completion` / `key` / `meetingType` değeri eşleşir. Takım listesi `required: false`.
- **AC16** (seed doğruluğu): §9'daki iki değişmez ve senaryolar.
  - Garanti `noCommitments === true`.
  - Gelecek tarihli ≥1 `planned` toplantı var.
  - `p_ornek`'te Satışçı+lisans adımının `missing` alanında `licenseModel` var, Kurulum+LLM adımında `installType` ve `llmChoice` var.
- **AC17** (AI)
  - `analyzeText` "…tamamlandı" metni için veri/toplantı adımına `step_update` üretmez.
  - Veri adımını hedefleyen bekleyen `step_update` önerisi onaylanınca `approveInsight` hata döner, adım değişmez.
- **AC18** (uyarı): yalnızca `planned` ya da `cancelled` kick-off'u olan On-prem projede `reqdoc_not_shared` üretilmez; `held` kick-off ile eşik aşılınca üretilir.
- **AC19** (UI, tarayıcı)
  - Aşamalar tablosunda "Veriyle" / "Toplantıyla" etiketleri ve "Eksik: Lisans modeli" tooltip'i görünür (`p_ornek`).
  - StepDialog'da veri adımının Durum seçenekleri yalnızca mevcut durum + Kapsam dışı; koşul listesi ✓/✗.
  - Toplantı formunda gelecek tarih → varsayılan Planlandı, bugün → Yapıldı. Uyarlama → Takım alanı.
  - Listede durum rozeti ve "Yapıldı olarak işaretle".
  - HandoverTab'da "Taahhüt yok" taahhüt varken pasif.
  - KickoffTab'da "Henüz belli değil" değer kayıtlıyken pasif.
  - Admin şablonunda "Tamamlanma" etiketi; veri/toplantı adımında sil pasif ve tooltip "Sistem adımı — veriyle tamamlanır".
  - Diğer sekmeler ve konsol hatasız.

## 11. Test planı (docs/TEST_STRATEGY.md)
| AC | Seviye | Test dosyası |
|---|---|---|
| AC1–AC9, AC15, AC16 | L1 | `src/lib/rabbitqa/completion.test.ts` |
| AC10 (karar fonksiyonu), AC14 / AC-NEG3 (karar fonksiyonu), AC13 (`applyMeetingHeldRules`) | L1 | `completion.test.ts` (`manualStatusError`, `installChoiceError`, `applyMeetingHeldRules`) |
| AC17 (analyzeText), AC18 | L1 | `completion.test.ts` ya da `src/lib/rabbitqa/rules-misc.test.ts` |
| AC10, AC11, AC-NEG1, AC12, AC-NEG2, AC14, AC17 (approveInsight) — store kablolaması | L3 | `src/lib/rabbitqa/store.test.tsx`: `vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" } }) }))` + `renderHook(() => useRq(), { wrapper: RqProvider })` + `act`; her testten önce `localStorage.clear()` |
| AC19 | L6 (qa-verifier, Playwright MCP, demo modu) | Tarayıcı kontrolü |

## 12. İlgili invariant maddeleri
- **INV-26:** Bu PR'ın konusu. Elle tamamlama reddi, geri açılma, yalnızca held toplantı.
- **INV-25:** Akış çağrı noktası `settleAll` oluyor. Kilitli adım iş sayılmaz kuralı korunur. `locked`'a dönüş yalnızca hiç aktifleşmemiş (`activatedAt` null) adım için; "açılmış adım tekrar kilitlenmez" ile tutarlı.
- **INV-09:** `applyInstallType` / `applyLlmChoice` null'da çalışmaz. Kural tekrarında (A→B→A) kopya yok (mevcut). `applyMeetingHeldRules` idempotent.
- **INV-05 / INV-06:** Her otomatik değişiklik `Otomatik kural: …` gerekçeli audit üretir. Kurulum tipi/LLM değer değişikliği ve toplantı iptali gerekçeli.
- **INV-21:** AI önerisi veri/toplantı adımını tamamlayamaz.
- **INV-13:** `reqdoc_not_shared` held filtresi.

## 13. Riskler ve açık sorular
- **S1 — `install_llm` yeri — KARARLAŞTIRILDI.** Akış "önceki tamamlanınca" adımı **hemen önceki** adıma bağlar (`flow.ts` `previousStep`). Brief'teki sıra (Taahhütler'den hemen sonra) "Satış devri toplantısı"nın bağlılığını Taahhütler'den `install_llm`'e kaydırırdı. Murat'ın kararı: mevcut bağlılık önceliklidir — Satış devri toplantısı Taahhütler'e bağlı **kalır**; `install_llm` toplantıdan sonra, Teklif'ten önce eklenir (bağımsız, 2 iş günü, zorunlu). §7 tablosu ve Codex görev metni bu sırayla güncellendi.
- **S2 — Aşaması `out_of_scope` olan adımlar.** Brief yalnızca "aşama done ise dokunma" diyor. **Varsayım:** `out_of_scope` aşamadaki adımlara da dokunulmaz (kural d). Atlanan aşamada iş doğmasın diye.
- **S3 — `teamId` — KARARLAŞTIRILDI.** Kodda takım varlığı yok (`Project.teams: string[]`). Murat'ın kararı: bu PR'da `teamId` takım adını taşır (string). Gerçek id'ye geçiş F1-00 `Team` tablosu / M-09c Adaptation-takım bağlantısı kararında ele alınır.
- **S4 — Toplantı durum geçişinde gerekçe.** INV-06 "durum değişikliği" diyor. **Varsayım:** Planlandı → Yapıldı gerekçesiz (bir olgunun kaydı, toplantı eklemeye eşdeğer), Planlandı → İptal gerekçeli. UI bu PR'da yalnızca "Yapıldı olarak işaretle" sunar; iptal store'da desteklenir, UI düğmesi yok.
- **S5 — "Bağlı sonraki adım akışla açılır" (Satışçı+lisans).** Şablonda Satışçı+lisans'a "önceki tamamlanınca" bağlı adım yok (sonraki Modüller bağımsız). AC2 bu davranışı CSM → Satışçı+lisans ve Taahhütler → Satış devri toplantısı zincirleriyle doğrular.
- **S6 — Hata mesajı.** Toplantı adımında da brief'teki `"Bu adım veriyle tamamlanır"` mesajı kullanılır (tek mesaj, test deterministik). İstenirse `"Bu adım toplantıyla tamamlanır"`'a ayrılabilir.
- **S7 — Gelecek tarihli "Yapıldı" toplantı.** Store engellemez (brief'te yok). Form varsayılanı tarihe göre.
- **S8 — Diff boyutu — KARARLAŞTIRILDI.** Tahmini 700–900 satır (test dosyaları dahil). Murat'ın kararı: tek PR, 3 ayrı commit (1: model + completion.ts + L1 testleri, 2: store + rules + seed + L3 testleri, 3: UI). M-09 üst planının "PR sonunda uygulama tam çalışır" şartıyla uyumlu.
- **Risk — kickoffSummary.** `setKickoff` özeti settle öncesi hesaplanır. `install_llm` tamamlanması özette "adım tamamlandı" olarak görünmeyebilir. Kabul edilebilir; toast iyileştirmesi M-09b'de.
- **Risk — proje açılışı.** Proje açılışında koşulu sağlanan veri adımları (CSM, satışçı+lisans, modüller) anında tamamlanır; zorunlu keşif sorusu yoksa `discovery_form` da açılışta tamamlanır. Beklenen davranış.

## 14. Gerekli gate'ler
- [x] reviewer (demo modu)
- [x] qa-verifier (demo modu, tarayıcı kontrolü zorunlu: AC19)
- [x] rules-reviewer: **evet.** Diff şu tetikleyicilere dokunuyor:
  - Adım tamamlama: `completion`, `applyStepCompletion`, `STEP_CONDITIONS`, `meetingType`, meeting `status` (INV-26)
  - Sıralı akış: `advanceFlow` çağrı noktası, `locked`, `activatedAt`, `durationDays` (INV-25)
  - Otomatik kurallar: `rules.ts`, `install_type`, `out_of_scope` (INV-09)
  - Audit/gerekçe: `reason` (INV-05/06)
  - AI: `ai-mock.ts`, `approveInsight` (INV-21)
  - Uyarılar: `alerts.ts` (INV-13)
  - Karar tablosunun zorunlu kenar durumları: A→B→A (SaaS→On-prem→SaaS), değer→null reddi, iki kez settle, kilitli adımın tamamlanıp veri eksilmesi, aşama done/out_of_scope iken geri açılmama, held olmayan toplantıda kural çalışmaması.

## 15. Codex Görev Metni
```
BAĞLAM — RabbitQA Onboarding Tracker (Faz M, demo uygulama)
- Önce oku: AGENTS.md (özellikle "Demo kuralları"), docs/INVARIANTS.md (INV-05, 06, 09, 21, 25, 26), docs/RBAC.md, docs/TEST_STRATEGY.md ve bu planın tamamı: docs/plans/M-09a-step-completion.md. Plan ile bu metin çelişirse plan geçerlidir.
- Uygulama DEMO: backend, veritabanı, Supabase, migration EKLEME. Tüm veri src/lib/rabbitqa/ store'u (RqProvider/useRq) ve seed'de.
- Her veri değişikliği store fonksiyonundan geçer ve audit yazar; bileşende state'i doğrudan değiştirme.
- Gerekçe zorunlu: kurulum tipi/LLM değer değişikliği, tarih ve durum değişikliği, uyarı kapatma/erteleme, toplantı iptali (mevcut koşullu Textarea + store reason deseni).
- Enum DEĞERLERİNİ değiştirme/yeniden adlandırma. MeetingType'a yeni değer EKLEME (brief, kickoff, discovery, devops_handover, training, adaptation zaten var); yalnızca etiket değişir.
- Akış yalnızca flow.ts (advanceFlow, isOpenStep); adım tamamlama yalnızca completion.ts; uyarılar yalnızca alerts.ts; iş günü yalnızca business-days.ts; yetki yalnızca perm.ts (bileşende rol karşılaştırması yok).
- Yeni npm paketi yok. Arayüz Türkçe, tarih gg.aa.yyyy, mevcut shadcn bileşenleri.
- Dokunma: AGENTS.md, CLAUDE.md, docs/, .claude/, .github/, .mcp.json.
- Sekme yapısı DEĞİŞMEZ (M-09b/c). PR sonunda uygulama tam çalışır olmalı.

1) MODEL — src/lib/rabbitqa/types.ts, labels.ts
- Ekle: export type StepCompletion = "manual" | "data" | "meeting"; export type MeetingStatus = "planned" | "held" | "cancelled".
- Step: completion: StepCompletion (zorunlu); meetingType?: MeetingType.
- StepTpl: completion?: StepCompletion; meetingType?: MeetingType (yoksa "manual").
- Meeting: status: MeetingStatus; teamId?: string | null (takım ADI taşır; Project.teams string[]).
- Project: noCommitments: boolean.
- labels.ts: COMPLETION_LABEL = { manual: "Elle", data: "Veriyle", meeting: "Toplantıyla" }; MEETING_STATUS_LABEL = { planned: "Planlandı", held: "Yapıldı", cancelled: "İptal" }; MEETING_TYPE_LABEL.brief = "Satış devri"; MEETING_TYPE_LABEL.devops_handover = "DevOps devri".
- Step üreten her yerde completion doldur: seed.ts buildFromTemplate (completion: st.completion ?? "manual", meetingType: st.meetingType; uyarlama adımları "manual"), seed.ts trainingSteps, store.tsx addTeam ve addTraining, rules.ts applyInstallType (saas_env) → "manual".
- State sürümü: seed version 9; store KEY "rabbitqa-demo-state-v9"; load() version === 9.

2) YENİ DOSYA — src/lib/rabbitqa/completion.ts (saf, React importu yok)
Dışa aç:
  interface ConditionCheck { field: string; label: string; met: boolean }
  interface ConditionResult { met: boolean; missing: { field: string; label: string }[]; checks: ConditionCheck[] }
  STEP_CONDITIONS: Record<string, { label: string; check(state: RqState, projectId: string): ConditionResult }>
  stepConditionResult(state, step): ConditionResult | null   // manual → null; meeting → toplantı koşulu; data → STEP_CONDITIONS[step.key]
  applyStepCompletion(state, projectId, mk: MkAudit, now = new Date()): RqState
  settleProject(state, projectId, mk, now = new Date()): RqState
  settleAll(state, mk, now = new Date()): RqState
  manualStatusError(step: Step, next: StepStatus | undefined): string | null
- Koşullar ve field/label değerleri: plan §6.1 tablosu birebir (csm, sales_license, modules, commitments, install_llm, offer, contract, discovery_form, teams, kpi, vpn_info). VPN: credential.type.trim().toLowerCase() === "vpn". discovery_form: her required soru için ayrı check (field "discovery:<id>", label soru metni); zorunlu soru yoksa tek check met=true.
- Toplantı koşulu: projede type === step.meetingType && status === "held" toplantı; check field "meeting:<type>", label "<MEETING_TYPE_LABEL> toplantısı (Yapıldı)".
- Tanımsız key/meetingType → met false, check { field: "unknown", label: "Tanımsız koşul", met: false }.
- applyStepCompletion karar tablosu (plan §6.1 a1–d):
  * completion manual → atla. Adım out_of_scope → atla. Aşaması out_of_scope → atla.
  * Durum done değil ve koşul sağlanıyor → status "done" (locked dahil; aşama done olsa da). Audit: entity "step", field "status", oldValue, newValue "done", reason data için "Otomatik kural: veri tamamlandı — <condition.label>", meeting için "Otomatik kural: <MEETING_TYPE_LABEL> toplantısı kaydedildi".
  * Durum done, koşul sağlanmıyor, aşama done DEĞİL → activatedAt doluysa status "pending" (due boşsa addBusinessDays(today, durationDays || 1, holidayDates(state.holidays))), activatedAt null ise status "locked" ve due null. Reason "Otomatik kural: veri eksildi — <label>"; due değişirse ayrı audit satırı.
  * Değişiklik yoksa AYNI referansı döndür. today = now'ın yerel tarihi (flow.ts localISO yöntemi).
- settleProject: en fazla 5 tur { next = advanceFlow(applyStepCompletion(cur, pid, mk, now), pid, mk, now); if (next === cur) break; cur = next }.
- settleAll: projeler üzerinde reduce.
- manualStatusError (yalnızca completion data/meeting için; aksi halde null): next undefined veya aynıysa null; → "done" ise "Bu adım veriyle tamamlanır"; done → pending/in_progress ise "Bu adım veriyle tamamlanır"; → out_of_scope null; out_of_scope → pending/in_progress null; pending ↔ in_progress null.

3) rules.ts
- installChoiceError(old: Pick<Project,"installType"|"llmChoice">, next: Partial<Pick<Project,"installType"|"llmChoice">>, reason?: string): string | null
  değer → null: "Kurulum tipi seçildikten sonra 'Henüz belli değil' yapılamaz" / "LLM tercihi seçildikten sonra 'Henüz belli değil' yapılamaz"; değer → farklı değer ve gerekçe boş: "Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu"; null → değer: null.
- applyMeetingHeldRules(s: RqState, m: Meeting, mk: MkAudit): RqState — m.status !== "held" ise s'i döndür.
  devops_handover: "devops_handover" anahtarlı adım out_of_scope değilse setStepByKey(..., { ball: "devops", ballSince: new Date().toISOString() }, mk, "Otomatik kural: DevOps devir toplantısı yapıldı, top DevOps'a geçti"). STATUS'U BURADA DEĞİŞTİRME (completion yapar).
  go_no_go: setStepByKey(..., "gonogo", { status: "done" }, mk, "Otomatik kural: Go/No-Go toplantısı kaydedildi").

4) STORE — src/lib/rabbitqa/store.tsx
- setState içinde advanceAll → settleAll (completion.ts). flowMessages aynen.
- createProject: noCommitments: false.
- updateStep: mevcut locked kontrollerinden sonra manualStatusError(old, p.status) hata dönerse onu döndür.
- YENİ setNoCommitments(projectId: string, value: boolean): string | null — Ctx'e ekle. value true ve projede taahhüt varsa "Taahhüt varken 'Taahhüt yok' işaretlenemez"; aksi halde patch("projects", id, { noCommitments: value }).
- addCommitment: tek setState ile taahhüdü ekle (create audit) ve proje noCommitments true ise false yap + audit (entity "project", field "noCommitments", oldValue "true", newValue "false", reason "Otomatik kural: taahhüt eklendi").
- addMeeting: parametre tipi status (zorunlu) ve teamId? içerir; toplantıyı ekle, ardından setState(s => applyMeetingHeldRules(s, meeting, mkAudit)). Eski doğrudan setStepByKey çağrılarını sil.
- updateMeeting(id, p, reason?) => string | null: p.status verilmiş ve farklıysa → mevcut status "planned" değilse "Yalnızca Planlandı toplantının durumu değiştirilebilir"; hedef "cancelled" ve gerekçe boşsa "İptal için gerekçe zorunlu"; geçerliyse patch(..., reason) ve hedef "held" ise applyMeetingHeldRules. p.status yoksa mevcut davranış. ContinuityTab çağrısı derlenmeye devam etmeli.
- setKickoff(projectId, kp, reason?) => { error: string | null; summary: string | null }: önce installChoiceError(project, kp, reason); hata varsa state değişmeden { error, summary: null }. "install_type" ve "llm" setStepByKey satırlarını SİL. applyInstallType/applyLlmChoice yalnızca yeni değer non-null ve farklıysa. presentation/reqdoc satırları aynen.
- addDocument: offer/contract için setStepByKey'i kaldır (completion yapar); req_doc → reqdoc aynen kalsın.
- approveInsight case "step_update": hedef adım completion !== "manual" ise return "Bu adım veriyle tamamlanır" (öneri pending kalır, hiçbir şey yazılmaz).

5) ai-mock.ts: step_update aday filtresine x.completion === "manual" ekle.
6) alerts.ts: reqdoc_not_shared'da kick-off toplantısını m.status === "held" ile filtrele. Başka değişiklik yok.

7) ŞABLON — seed.ts PHASE_TEMPLATE (sıra, bağlılık, süre, top korunur): plan §7 tablosunu birebir uygula.
- 00: csm, sales_license, modules, commitments data; "Internal brif toplantısı" → "Satış devri toplantısı" { completion: "meeting", meetingType: "brief" } (bağlılığı DEĞİŞMEZ, Taahhütler'e bağlı kalır); YENİ S("Kurulum tipi ve LLM tercihinin girilmesi", bağımsız, "B", 2, { key: "install_llm", completion: "data" }) Satış devri toplantısından SONRA, Teklif'ten ÖNCE eklenir (S1 kararı); offer/contract data.
- 01: Kick-off toplantısı meeting/kickoff; "Kurulum tipi seçimi" ve "LLM tercihinin girilmesi" SİL; reqdoc ve presentation manual.
- 02: Keşif toplantısı meeting/discovery; discovery_form data; Takım listesi data/teams ve required: false; KPI tanımı data/kpi.
- 03: vpn_info data; DevOps devir toplantısı meeting/devops_handover (key "devops_handover" KALIR); diğerleri manual.
- 04–08 değişmez.
- PR'da install_type/llm kullanım yerlerini grep çıktısıyla listele (plan §7.1).

8) EKRANLAR (plan §8)
- ProjectDetail.tsx PhasesTab: completion ≠ manual adımda Durum altında gri COMPLETION_LABEL etiketi; Tooltip: data ve tamamlanmamışsa "Eksik: <missing label'ları, virgülle>", meeting ve tamamlanmamışsa "<tür> toplantısı kaydedilince tamamlanır". Kilitli adımın mevcut tooltip'i kalsın.
- StepDialog: completion ≠ manual ise Durum seçenekleri = mevcut durum + "Kapsam dışı" (mevcut out_of_scope ise + "Bekliyor"); açıklama metni; altında "Tamamlanma koşulu" listesi (stepConditionResult().checks; ✓ yeşil / ✗ kırmızı, lucide Check/X). Diğer alanlar mevcut kurallarla.
- MeetingDialog: Durum Select (MEETING_STATUS_LABEL); kullanıcı elle seçmedikçe date > todayISO() → "planned", değilse "held"; tür "adaptation" ise Takım Select (project.teams + "Takım seçilmedi" = null; takım yoksa not); addMeeting'e status ve teamId gönder.
- MeetingsTab: durum Pill'i (planned info, held success, cancelled muted); adaptation'da "Takım: <ad>"; planned kartta canManageProject ise "Yapıldı olarak işaretle" → updateMeeting(id, { status: "held" }), hata toast.
- Phase3Tabs.tsx GoLive hızlı kayıt addMeeting → status "held". Phase2Tabs.tsx KickoffTab kick-off metni yalnızca held toplantı. Overview.tsx yaklaşan toplantılar cancelled hariç. HistoryTab meeting satırında held değilse durum etiketi; FIELD'e noCommitments: "Taahhüt yok", teamId: "Takım".
- HandoverTab: Taahhütler kartında Checkbox "Taahhüt yok" (checked project.noCommitments; disabled !manage || commitments.length > 0, title "Taahhüt varken işaretlenemez"); setNoCommitments, hata toast.
- KickoffTab: Kurulum tipi ve LLM RadioGroup'larına "Henüz belli değil" (null); kayıtlı değer varsa bu seçenek disabled. save: setKickoff dönüşünde error varsa toast.error ve çık.
- Admin.tsx TemplateEditor: adım satırında salt okunur "Tamamlanma": Elle / "Veriyle: <STEP_CONDITIONS[key]?.label>" / "Toplantıyla: <MEETING_TYPE_LABEL[meetingType]>". completion data/meeting ise sil disabled + title "Sistem adımı — veriyle tamamlanır"; değilse mevcut !!s.key kuralı. "Adım ekle" completion: "manual" ile.

9) SEED (plan §9 birebir)
- version 9; tüm toplantılara status "held"; tüm projelere noCommitments; sonda advanceAll yerine settleAll(seedState, sysAudit).
- İş Yatırım: brief held (2026-08-25) ve devops_handover held (2026-09-02) toplantıları; discoveryAnswers.q_scenarios doldur.
- Garanti: brief held + discovery held toplantıları; offer + contract dokümanı; noCommitments: true; zorunlu keşif cevapları; teams ["Mobil Bankacılık"] + teamInfo (buildFromTemplate'TEN ÖNCE); ek KPI k_3 (baseline + target dolu; k_2 kalsın).
- Akbank: brief held + kickoff held toplantıları; offer + contract dokümanı; 1 taahhüt; installType "onprem", llmChoice "rabbitqa", reqDocShared true, reqDocSharedAt "2026-09-08".
- YENİ p_ornek "Örnek Sigorta A.Ş.": csmId "u_deniz", salespersonId "s_1", licenseModel "", purchasedModules [], installType null, llmChoice null, noCommitments false, taahhüt/doküman yok, startDate bugünden 2 iş günü önce, goLive ≈ +3 ay, faz plan tarihleri projectPlan ile; bugün + 7 gün tarihli planned brief toplantısı.

10) TESTLER
- src/lib/rabbitqa/completion.test.ts (L1; createSeed + sabit now + sahte mk):
  * 11 koşul + toplantı koşulu için sağlanan/sağlanmayan hal (met ve missing[].field).
  * a1 tamamlanma + audit reason; kilitli adımın doğrudan done olması (p_ornek vpn_info + VPN credential).
  * Geri açılma (activatedAt dolu → pending, due korunur / boşsa hesaplanır); activatedAt null → locked + due null.
  * Aşama done iken geri açılmama (İş Yatırım licenseModel ""); aşama out_of_scope iken dokunmama; out_of_scope adıma dokunmama.
  * CSM → Satışçı+lisans akış zinciri ve Taahhütler → Satış devri toplantısı zinciri (settleProject).
  * İdempotans: settleProject iki kez → aynı referans; seed'de applyStepCompletion ve settleAll aynı referans.
  * Seed değişmezleri: done aşamalardaki done veri/toplantı adımlarının koşulu sağlanıyor; Garanti noCommitments; gelecek tarihli planned toplantı var; p_ornek missing alanları.
  * Şablon: 01'de install_type/llm yok; 00 index 5 install_llm (data, independent, 2, required), index 4 Satış devri toplantısı; §7 tablosu.
  * manualStatusError tablosu; installChoiceError (null→değer, değer→değer gerekçesiz/gerekçeli, değer→null); applyMeetingHeldRules (planned → no-op, held devops_handover → ball devops, go_no_go → gonogo done).
  * analyzeText veri/toplantı adımı için step_update üretmez; computeAlerts reqdoc_not_shared yalnızca held kick-off ile.
- src/lib/rabbitqa/store.test.tsx (L3): vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" } }) })); renderHook(() => useRq(), { wrapper: RqProvider }); her testten önce localStorage.clear().
  * updateStep red / kabul (done reddi, done→pending reddi, out_of_scope kabulü).
  * setNoCommitments + addCommitment işareti kaldırır, adım done kalır; taahhüt varken setNoCommitments(true) hata.
  * addMeeting planned/held + updateMeeting planned→held tamamlar; held→cancelled hata; planned→cancelled gerekçesiz hata.
  * setKickoff null→onprem gerekçesiz OK, onprem→saas gerekçesiz error ve state aynı, gerekçeli ONPREM adımları out_of_scope + saas_env, değer→null error.
  * approveInsight veri adımı hedefli step_update → hata.

TESLİM
- Tek PR, branch feat/m09a-step-completion. Commit'ler ayrık: (1) model + completion.ts + L1 testleri, (2) store + rules + seed + L3 testleri, (3) UI. Conventional Commits.
- Bitirmeden çalıştır ve özetini PR'a yapıştır: npm run lint && npx tsc --noEmit && npm test && npm run build. Lint hata sayısı mevcut durumdan artmasın.
- PR açıklaması: Ne değişti · Eşleme (plan §3.1'den farklı bir şey yaptıysan) · install_type/llm kullanım yerleri (grep çıktısıyla) · Kabul kriteri (AC1–AC19, AC-NEG1–3) ↔ test adı / doğrulama tablosu · Açık sorular (plan §13'teki varsayımlardan saptıysan ya da yeni belirsizlik bulduysan).
```
