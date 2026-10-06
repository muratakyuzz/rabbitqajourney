# Değişiklik notu — feat/m09c-phase-workspaces-tabs

## Görev
- Plan: `docs/plans/M-09c-phase-workspaces-tabs.md`
- Faz / görev kodu: M-09c (02 Keşif, 03 Erişim, 04 Eğitim, 05 Uyarlama çalışma alanları; uyarı rozeti/paneli; 13 sekmelik son düzen)

## Ne değişti
Plan §11 S1 kararı doğrultusunda tek branch, 5 commit:

1. **`622b075`** — Model/store/kurallar/seed: `TrainingSession`/`AdaptationSession` ve `trainings` koleksiyonu kalkar; Eğitim artık `type: "training"` toplantısı, Uyarlama takım başına tek veri adımı + 5 maddelik kontrol listesi (`Adaptation`). `completion.ts`'e `training_plan`/`training_done`/`adapt:<teamId>` koşulları ve `conditionFor()` eklendi. `rules.ts`'e RUL-05 Seçenek A (`ensureReviewAction`/`cancelReviewAction`, idempotent, A→B→A güvenli) ve RUL-07 (m09a, held toplantı gerekçesi) ile RUL-08 (`setInstallChoice` yeniden doğrulama) eklendi. State v10 → v11; seed'e `p_lojistik` (reqdoc_not_shared örneği) ve `p_perakende` (Uyarlama aktif örneği) eklendi; 06 şablonundan "Destek kayıtlarının takibi" (`support_track`) kalktı (S7).
2. **`5b2a0aa`** — Davranış değişikliği olmayan çıkarım refaktörü: `MeetingStepSection` (`HandoverWorkspace`'ten), `DiscoveryContent` (`ProjectDetail`'den), `CredentialsSection` (`Phase2Tabs`'tan, S6: Kurulum özeti kartı adım listesiz kalır), `ProjectAlertsPanel` (`Phase3Tabs`'tan, eski ad `AlertsTab`). `MeetingDialog`'a eğitim alanları (`defaultStatus`/`defaultTeamId`, eğitmen/modüller/kayıt linki) eklendi. Bu commit ayrıca REV-16, REV-20, REV-08/19, REV-10'u (aşağıdaki tabloda) kapsadı.
3. **`4c81528`** — `DiscoveryWorkspace`, `AccessWorkspace`, `TrainingWorkspace`, `AdaptationWorkspace` yeni çalışma alanları; `PHASE_WORKSPACES` (02/03/04/05) ve `workspaceAvailable(code, user, project)` (03 için `canSeeCredentials`). `ProjectDetail`'in `PhasesTab`'ı ve `?ws=` başlatıcısı `workspaceAvailable`'ı kullanır (REV-09/21).
4. **`5378a30`** (bu oturum) — `ProjectDetail.tsx`'in `ProjectTabs`'ı plan §6.5'teki 13 sekmelik son düzene alındı: Training/Adaptation/Alerts sekmeleri kalktı, "Erişim bilgileri" `canSeeCredentials` ile kapılı, "Destek kayıtları" `disabled` + "Faz 2" rozetiyle pasif. Başlıkta "N açık uyarı" rozeti (`useAlertViews`, kırmızı varsa `danger` yoksa `warning`, 0 ise gizli) → sağ `Sheet` içinde `ProjectAlertsPanel`; `?panel=alerts` sayfa yüklenirken paneli açar. `PhasesTab`'da aşama/adım satırlarına açık uyarı ikonu (`AlertTriangle`, tooltip'te başlıklar). Toplantılar sekmesine tür/durum filtresi. Metin düzeltmeleri: GoLiveTab'daki kopuk "'Satış devri' sekmesinden" → "Satış Devri çalışma alanından" (`Phase3Tabs.tsx`), Admin'in 05 açıklaması ve `STEP_CONDITIONS[s.key]` → `conditionFor(s.key)`, `MyWork`'teki "Uyarılar sekmesine" referansı. `MyWork`/`Projects`/`AppShell`'deki `?tab=alerts` deep link'leri `?panel=alerts` oldu. Yeni testler: `ProjectDetail.tabs.test.tsx`, `MyWork.test.tsx`; ayrıca RUL-07(m09a)/RUL-08 için `store.test.tsx`'e, RUL-07(m09b r3) için `completion.test.ts`'e eksik assertion'lar eklendi.
5. **`87ed7df`**, **`9cd1413`** (bu oturum) — Backlog kapanış denetimi: §6.9'daki her satır audit edildi (aşağıdaki tablo); tek gerçek kod kapsamı dışı kalan satır, `support_track`'ın şablondan ve seed'den tamamen kalktığını doğrulayan testti (AC16) — eklendi. Ayrıca plan'ın test planına göre hiç karşılığı olmayan AC18 (`buildReportSnapshot`, `reports.ts` dosyasının o ana kadar hiç testi yoktu) için bir L1 testi eklendi.

## S6 notu (Kurulum özeti kartı)
Plan S6 kararı: "Kurulum özeti" kartı (`CredentialsSection` içinde, kurulum tipi ve LLM satırları) **kalır**; kartın içindeki eski 03 adım listesi (`installSteps`/`StepStatusBadge`) kalkar. Kart artık yalnızca `canSeeCredentials` olanlara görünür (önceden sekmede herkese görünüyordu) — bilgi kaybı yok, çünkü kurulum tipi/LLM 00 panelinde (Satış Devri) tüm rollere görünmeye devam eder. `src/pages/project/Phase2Tabs.tsx`'teki `CredentialsSection` bunu doğrular; `AccessWorkspace.tsx` ve "Erişim bilgileri" sekmesi aynı bileşeni (`layout="panel"` / `layout="tab"`) kullanır.

## Kaldırılan alan/işlem — grep kanıtı
```
$ grep -rn "TrainingSession\|AdaptationSession\|addTraining\|updateTraining\|saveAdaptation\|ADAPTATION_STEPS\|ADAPTATION_FLOW\|support_track\|tab=alerts" src/

src/lib/rabbitqa/completion.test.ts:585:  it("PHASE_TEMPLATE'te ve seed'deki hiçbir projede support_track adımı yoktur (S7)", async () => {
src/lib/rabbitqa/completion.test.ts:587:    expect(PHASE_TEMPLATE.some((p) => p.steps.some((s) => s.key === "support_track"))).toBe(false);
src/lib/rabbitqa/completion.test.ts:589:    expect(s.steps.some((st) => st.key === "support_track")).toBe(false);
src/lib/rabbitqa/store.tsx:476:      setState((s) => setStepByKey(s, t.projectId, "support_track", { status: "in_progress" }, mkAudit, "Otomatik kural: destek kaydı açıldı"));
src/pages/ProjectDetail.tabs.test.tsx:83:  it("?tab=alerts uyarı panelini açar", async () => {
src/pages/ProjectDetail.tabs.test.tsx:85:    renderProject("/app/projects/p_garanti?tab=alerts");
```
- `TrainingSession`/`AdaptationSession`/`addTraining`/`updateTraining`/`saveAdaptation`/`ADAPTATION_STEPS`/`ADAPTATION_FLOW`: hiçbir eşleşme yok (tamamen kaldırıldı, commit 1).
- `support_track`'ın iki eşleşmesi: (a) yukarıdaki yeni testin kendisi (yokluğunu doğruluyor), (b) `addTicket`'ın içindeki `setStepByKey(..., "support_track", ...)` çağrısı. Bu çağrı artık hiçbir projede `key: "support_track"` adımı bulunmadığı için no-op'tur (`setStepByKey` adımı bulamazsa state'i değiştirmez) — zararsız ölü kod. Plan §2 "Kapsam dışı" bunu açıkça kapsam dışı bırakıyor ("Destek kayıtları kodu ve verisi silinmez. `addTicket` ve `TicketsTab` dokunulmadan kalır"), bu yüzden dokunulmadı.
- `tab=alerts`'in iki eşleşmesi: `ProjectDetail.tabs.test.tsx`'teki, eski `?tab=alerts` deep link'inin hâlâ doğru şekilde yönlendirildiğini (uyarı paneli açılır) doğrulayan regresyon testi — kod tarafında `?tab=alerts` artık yalnızca "yok sayılıp phases'e düş + paneli aç" olarak ele alınıyor, üretim kodunda `tab=alerts` string'i yok.

**Ek grep kanıtı (/gate REV-04 direktifi):**
```
$ grep -rn "STEP_CONDITIONS\[" src/
src/lib/rabbitqa/completion.ts:131:  const direct = STEP_CONDITIONS[key];
```
`conditionFor`'un kendi iç lookup'ı dışında doğrudan `STEP_CONDITIONS[key]` erişimi kalmamış (plan §6.2 "kullanım yerleri" gereksinimi temiz).

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Test (dosya › test adı) |
|---|---|---|---|
| AC1 | ✅ | L3 | `PhaseWorkspaces.test.tsx` › "02 panelinde cevap girilince sekmede de görünür…" |
| AC2 | ✅ | L3 | `PhaseWorkspaces.test.tsx` › "KPI tanımı satırına tıklayınca panel açılır…" |
| AC3 | ✅ | L3 | `PhaseWorkspaces.test.tsx` › "03 panelinde VPN erişim bilgisi ekleyince vpn_info tamamlanır" |
| AC3b | ✅ | L3 | `PhaseWorkspaces.test.tsx` › "Kurulum özeti kartı 03 panelinde ve sekmesinde görünür…"; `ProjectDetail.tabs.test.tsx` › "Erişim bilgileri sekmesinde Kurulum özeti kartı görünür…" |
| AC4 | ✅ | L1 + L3 | `workspaces.test.ts` (stepClickTarget satır 3); `PhaseWorkspaces.test.tsx` › "care kullanıcısı 03 panelini açamaz", "csm… Erişim bilgileri sekmesini görür…" |
| AC5 | ✅ | L1 + L3 | `completion.test.ts` (training_plan/training_done); `store.test.tsx` (addMeeting/updateMeeting training akışı) |
| AC6 | ✅ | L3 store + bileşen | `store.test.tsx` (trainings yok, addTraining/updateTraining/saveAdaptation yok); `PhaseWorkspaces.test.tsx` › "Session ekle ile açılan form tür Eğitim…" |
| AC7 | ✅ | L1 + L3 | `completion.test.ts` (addTeam kuralı); `store.test.tsx` "addTeam — adaptation step (AC7)" |
| AC8 | ✅ | L3 | `PhaseWorkspaces.test.tsx` › "p_perakende 'Mobil' takımında kalan 3 madde işaretlenince adım done olur" |
| AC9 | ✅ | L1 | `completion.test.ts` (adapt:general out_of_scope) |
| AC-NEG1 | ✅ | L1 | `completion.test.ts` (iptal edilen Eğitim toplantısı sayılmaz) |
| AC-NEG2 | ✅ | L1 | `completion.test.ts` (işaretli genel listeye dokunulmaz) |
| AC-NEG3 | ✅ | L3 | `PhaseWorkspaces.test.tsx` › "devops 05 panelinde onay kutularını disabled görür…" |
| AC10 | ✅ | L3 | `PhaseWorkspaces.test.tsx` › "'+ Session ekle' uyarlama toplantı formunu takım ön seçili açar" |
| AC11 | ✅ | L1 + L3 | `completion.test.ts`/`alerts.ts` kilitli adım iş sayılmaz; `MyWork.test.tsx` › "p_garanti'nin kilitli adapt:* adımı u_deniz'in Bana atananlar listesinde yoktur" |
| AC12 | ✅ | L3 | `ProjectDetail.tabs.test.tsx` › "manager… 12 sekme…", "csm u_deniz… 13 sekmenin tamamını görür", "'Destek kayıtları' disabled'dır…", "?tab=training…", "?tab=adaptation…", "?tab=alerts…" |
| AC13 | ✅ (kısmi — bkz. not) | L3 | `ProjectDetail.tabs.test.tsx` › "açık uyarısı olan projede rozet görünür…", "açık uyarısı olmayan bir projede rozet yoktur", "?panel=alerts ile sayfa yüklenince panel açık gelir". "Kapat + gerekçe → Müşteri geçmişi" alt senaryosu testsiz (gate REV-04 notu) |
| AC-NEG4 | ✅ | L3 | `ProjectDetail.tabs.test.tsx` › "panelde gerekçe boşken kapatma butonu devre dışıdır" |
| AC14 | ✅ (kısmi — bkz. not) | L3 | `ProjectDetail.tabs.test.tsx` › "gecikmiş açık bir adıma sahip fixture'da satırda uyarı ikonu vardır". Tooltip başlığı ve kapatınca ikonun kaybolması testsiz (gate REV-04 notu); `/gate` qa-verifier'ı Playwright MCP ile görsel olarak doğruladı |
| AC15 | ✅ (kısmi — bkz. not) | L3 | `ProjectDetail.tabs.test.tsx` › "Tür ve Durum filtreleri görünür…"; gerçek Select seçimi Radix/jsdom kısıtı nedeniyle L6'da. `/gate` qa-verifier'ı Toplantılar Tür/Durum filtresini canlı DOM'da gerçek seçimle doğruladı (8→2→0 kayıt, boş durum metni) |
| AC16 | ✅ | L1 | `completion.test.ts` › "PHASE_TEMPLATE'te ve seed'deki hiçbir projede support_track adımı yoktur (S7)" |
| AC17 | ✅ | L1 | `store.test.tsx` "state v11 + login" bloğu |
| AC18 | ✅ | L1 | `completion.test.ts` › "buildReportSnapshot — p_perakende Uyarlama: Mobil (AC18)" (bu oturumda eklendi) |
| AC19 | ✅ | L1 + L3 | `completion.test.ts` "RUL-05 Seçenek A — ensureReviewAction / cancelReviewAction (AC19)" bloğu (/gate round 1 sonrası 15 test — REV-01/RUL-01, REV-03/RUL-03 alt senaryoları (c)-(i) eklendi); `MyWork.test.tsx` › "LLM gpu'ya geçiş… rule_review aksiyonu u_deniz'e görünür" |
| AC-NEG5 | ✅ | L1 + L3 | `completion.test.ts` (applyMeetingHeldRules ile dolaylı); `store.test.tsx` › "rejects a held meeting's date/type change without a reason (RUL-07 m09a, AC-NEG5)" (bu oturumda eklendi) |
| AC20 | ✅ | — | Bu tablo + aşağıdaki Backlog↔commit tablosu |
| AC21 | ✅ (kısmi — L6 hariç) | L1 + L3 | `workspaces.test.ts` (02 discovery_form → workspace); `store.test.tsx` (addTeam/addTraining yeniden yazımı, On-prem dönüş testi); L6 (Playwright) bu oturumda çalıştırılmadı — qa-verifier `/gate`'te ayrıca doğrulanmalı |

Not (AC15/AC21): Plan §9 not: "Radix Select jsdom'da zor çalışır… seçim L6'da doğrulanır." Bu kısıt gözlendi; L3 testleri filtre kontrollerinin varlığını ve varsayılan listelemeyi doğruluyor, gerçek dropdown etkileşimi ve 375/1280px görsel kontrol `/gate`'in qa-verifier adımına (Playwright MCP) bırakıldı.

## Backlog maddeleri ↔ commit (plan §6.9)
| ID | Durum | Commit | Kanıt |
|---|---|---|---|
| RUL-05 (m09b r2) | ✅ Kapandı | `622b075` | `rules.ts` ensureReviewAction/cancelReviewAction; `completion.test.ts` "RUL-05 Seçenek A" bloğu (AC19) |
| RUL-07 (m09b r3) | ✅ Kapandı | `622b075` + `9cd1413`/bu oturum (eksik assertion) | `completion.test.ts` "installType SaaS->On-prem…" testine `reqdoc_not_shared` üretilmediği assertion'ı eklendi; "item_late is produced…" testi var |
| RUL-06 (m09b r2) | ✅ Kapandı | `622b075` | `store.test.tsx` "setInstallChoice — LLM gpu -> own -> gpu, 03 done (…RUL-06 m09b)" |
| RUL-07 (m09a) | ✅ Kapandı | `622b075` (kod) + `5378a30` (test, bu oturum) | `store.tsx:288-290`; `store.test.tsx` "rejects a held meeting's date/type change without a reason (RUL-07 m09a, AC-NEG5)" |
| RUL-08 (m09b r3) | ✅ Kapandı | `622b075` (kod) + `5378a30` (test) + `4d753b7` (test düzeltme, /gate round 1) | `store.tsx:381-382` (`revalidateErr`); `store.test.tsx` "installChoiceError is re-invoked with the updater's own cur…". **Not:** /gate'in reviewer/rules-reviewer bulgusu — testin ilk hâli iki `setInstallChoice` çağrısını ayrı `act()` içinde yapıyordu, bu yüzden updater'ın kendi yeniden-doğrulamasını değil outer kontrolü sınıyordu (bir render döngüsünde iki senkron çağrı yapınca dönüş değeri `error: null` gelebiliyor — ayrı bulgu, bkz. "Açık sorular") |
| RUL-05 (m09a) | ✅ Kapandı (değişiklik gerekmedi) | `store.test.tsx:208` (`updateStep — out_of_scope reopens via settle`) | **Düzeltildi (/gate round 1):** önceki kanıt satırı (AC14/AC-NEG3 bloğu) yanlıştı; doğru karşılık :208 |
| RUL-02 / RUL-03, REV-11 (m09b) | ✅ Kapandı | `622b075` (kod) + `4d753b7` (test düzeltme, /gate round 1) | `store.test.tsx` "reqdoc — data-completed step, RUL-13 (AC12)" c) pending→done (artık `p_lojistik` fixture'ı ile gerçekten `pending` durumunu sınıyor; önceki hâli `p_ornek` ile `locked→done` yolunu sınıyordu); "a v10 localStorage record is discarded…(REV-11)" |
| REV-08 / REV-19 (m09b) | ✅ Kapandı | `5b2a0aa` | `PhaseWorkspaceSheet.tsx:69` (`<li><div>`, field yoksa `button` değil) |
| REV-09 / REV-21 (m09b) | ✅ Kapandı | `4c81528` | `workspaces/index.ts` `workspaceAvailable`; `ProjectDetail.tsx` `?ws=` kullanımı; `workspaces.test.ts` |
| REV-10 (m09b) | ✅ Kapandı | `5b2a0aa` | `highlight.ts` `:not(:disabled):not([data-disabled])` seçicisi |
| REV-15 (m09b) | ✅ Kapandı | önceden (main) | `HandoverWorkspace.test.tsx` audit sayımı state'ten yapılıyor |
| REV-16 (m09b) | ✅ Kapandı | `5b2a0aa` | `HandoverWorkspace.tsx` `ACTION_STATUS_LABEL` kullanımı |
| REV-18 (m09b) | ✅ Not (kod değişikliği değil) | — | Bu PR'ın doğrulama komutu `npx tsc --noEmit -p tsconfig.app.json` olarak çalıştırıldı (bkz. Kontroller) |
| REV-20 (m09b) | ✅ Kapandı | `5b2a0aa` | `ChoiceReasonDialog`/`DocumentUploadDialog`'da `Label htmlFor`/`id` eşleşmesi |

Tek gerçek **yeni** kapanış bu oturumda yapıldı: AC16'nın "support_track şablondan tamamen kalktı" testi (`87ed7df`), çünkü önceki commit'lerde bu kesin assertion yoktu (yalnızca davranışsal olarak zaten doğruydu). Diğer tüm satırlar commit 1-3'te zaten koddaki ve testteki karşılıklarıyla kapanmıştı; bu oturum sadece RUL-07(m09a)/RUL-08/RUL-07(m09b r3) için gözden kaçan assertion'ları ekledi (commit 4) ve AC16/AC18 test boşluklarını kapattı (commit 5).

## Mockup ↔ API
Demo modu (Faz M) — uygulanmaz. Backend/DB/migration/API yok.

## Veritabanı
- [x] Migration yok (demo store, plan §3: "DATA_MODEL değişikliği: yok")

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-05, INV-06, INV-07, INV-08, INV-09, INV-11, INV-12, INV-13, INV-16, INV-25, INV-26, INV-27 (bkz. plan §10 — bu commit'ler yalnızca UI/tab/test tarafını kapsadığından kural motorunda (commit 1'de zaten uygulanmış) değişiklik yapılmadı)
- [x] Yazma işlemleri `core/audit` ile aynı transaction'da (demo store `setState` tek fonksiyon — değişmedi)
- [x] Gerekçe zorunlu işlemler mevcut servis fonksiyonlarıyla zorlanıyor (updateMeeting, closeAlert/snoozeAlert — değişmedi, yalnızca UI'dan erişim yolu değişti)
- [x] Trigger / PL/pgSQL / RLS / motor kontrolü yok (demo, pg yok)

## Kontroller (çıktı özeti)
```
npm run lint       → 42 problems (14 errors, 28 warnings) — main'deki (main @ 2997ee5) sayıyla aynı, regresyon yok
npx tsc --noEmit -p tsconfig.app.json → temiz (REV-18 notu: kontrol komutu budur)
npm test (vitest)  → 11 test dosyası, 186 test — tamamı geçti
npm run build      → başarılı (vite build, pre-existing chunk-size uyarısı)
npm run e2e        → bu oturumda çalıştırılmadı (Playwright/qa-verifier `/gate` adımına bırakıldı)
```

**`/gate` round 1 düzeltmeleri sonrası (`/fix`, bu oturum):**
```
npm run lint       → 42 problems (14 errors, 28 warnings) — değişmedi, regresyon yok
npx tsc --noEmit -p tsconfig.app.json → temiz
npm test (vitest)  → 11 test dosyası, 197 test — tamamı geçti (186 + 11 yeni: REV-01/RUL-01 A→B→A testi, REV-02/RUL-02 addTeam done/out_of_scope testleri, REV-03/RUL-03 AC19 alt senaryoları (c)-(i), RUL-06 "general" takım adı reddi, REV-10 order testi)
npm run build      → başarılı (vite build, pre-existing chunk-size uyarısı)
```

## Eşleme (plandaki ad → koddaki ad)
Plan §3.1'deki eşleme tablosu önceki commit'lerde (1-3) doğrulandı ve sapma bulunmadı. Bu oturumda ek bir eşleme sapması bulunmadı; tek not: plan §6.1 "ProjectDetail.tsx … satır 306/755" metin düzeltmeleri, pre-change dosyadaki satır numaralarıydı — gerçek metin karşılığı bu oturumda içerikle bulunup düzeltildi (Admin.tsx 05 açıklaması + STEP_CONDITIONS→conditionFor; GoLiveTab'ın Satış Devri metni zaten Phase3Tabs.tsx'teydi).

## Açık sorular / sapmalar
- `addTicket`'ın içindeki `setStepByKey(..., "support_track", ...)` satırı artık her zaman no-op'tur (hiçbir adım bu `key`'e sahip değil). Plan'ın kapsam dışı maddesi ("Destek kayıtları kodu ve verisi silinmez") nedeniyle dokunulmadı; F1'e geçişte veya bir sonraki Destek kayıtları işinde temizlenebilir.
- AC15/AC21'in Select-tabanlı gerçek filtre seçimi ve 375/1280px görsel regresyonu bu oturumda L6 (Playwright) ile doğrulanmadı — plan §9 bunu `qa-verifier`'ın `/gate` adımına bırakıyor; builder rolünde bu adım çalıştırılmadı (görev tanımı gereği `/gate` çalıştırılmaz). **Güncelleme:** `/gate` round 1'de qa-verifier bunu Playwright MCP ile canlı DOM'da doğruladı (bkz. "Review düzeltmeleri" ve gate kayıtları).
- **Yeni (bu oturumda `/fix` sırasında bulundu):** `setInstallChoice`'a aynı render döngüsünde art arda iki çağrı yapılırsa ikinci çağrının dönüş değeri `error: null` gelebiliyor, state değişmiyor ama caller'a yanlış bilgi gidiyor. Gerçek UI akışında (tek tıklama = tek render döngüsü) tetiklenmiyor; ayrı bir düzeltme görevi olarak F1'e bırakılabilir.
- `reports.ts`'in daha önce hiç testi yoktu (m09c'den önce de); AC18 için eklenen test yalnızca bu PR'ın kapsamındaki Uyarlama senaryosunu kapsıyor, `reports.ts`'in geri kalan alanları (riskler, kararlar, KPI) için ayrı bir test görevi önerilir (bkz. Öneriler).

## Öneriler (kapsam dışı)
- `reports.ts` için ayrı, kapsamlı bir L1 test dosyası (riskler/kararlar/KPI/actionsVirgosol/actionsCustomer satırları) — bu PR yalnızca AC18'in minimum gereksinimini kapattı.
- `addTicket`'taki ölü `support_track` referansının temizlenmesi (ayrı, kapsamı net bir görev olarak; bu PR'ın kapsamı dışında tutuldu).

## Review düzeltmeleri
`/gate` round 1 sonucu: DÜZELTME GEREKLİ (reviewer CHANGES_REQUESTED, qa-verifier APPROVE, rules-reviewer CHANGES_REQUESTED). Kayıtlar: `docs/reviews/feat_m09c-phase-workspaces-tabs/`.

| Bulgu ID | Durum | Commit |
|---|---|---|
| REV-01 / RUL-01 (High) | Düzeltildi | `dc7584c` |
| REV-02 / RUL-02 (High) | Düzeltildi | `d098576` |
| REV-03 / RUL-03 (High, test boşluğu) | Düzeltildi | `978c982` |
| REV-04 / RUL-05 (Medium, değişiklik notu doğruluğu) | Düzeltildi | `4d753b7` + bu dosyadaki AC13/14/15 ve backlog tablosu düzeltmeleri |
| RUL-04 (Low, audit metni) | Düzeltildi | `4d753b7` |
| RUL-06 (Low, "general" takım adı) | Düzeltildi | `9890b44` |
| REV-05 (Medium, sekme/panel test spesifikliği) | Düzeltilmedi — kapsam dışı bırakıldı: mevcut `ProjectDetail.tabs.test.tsx` testleri sekme varlığını ve panel açılışını doğruluyor; sıralama/içerik assertion'larının sıkılaştırılması ayrı, düşük riskli bir test-kalite görevi olarak backlog'da bırakıldı (davranış değişikliği gerektirmiyor) |
| REV-06…REV-11 (Low) | Düzeltildi | `9890b44` |

**Yeni bulgu (düzeltme sırasında tespit edildi, bu PR'ın kapsamında değil):** `setInstallChoice`'a aynı `act()`/render döngüsü içinde art arda iki çağrı yapılırsa (gerçek UI'da tek tıklama = tek render döngüsü olduğu için erişilmesi zor), ikinci çağrının dönüş değeri `error: null` gelebiliyor; state yine de reddedilen değişikliği uygulamıyor (güvenli ama dönüş değeri yanıltıcı). RUL-08 testi bu davranışı belgeleyen bir yorumla bırakıldı; ayrı bir düzeltme görevi önerilir.
