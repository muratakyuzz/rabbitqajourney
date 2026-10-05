# Değişiklik notu — feat/m09b-phase-workspace-handover

## Görev
- Plan: `docs/plans/M-09b-phase-workspace-handover.md`
- Faz / görev kodu: M-09b

## Ne değişti
- **Aşama çalışma alanı altyapısı** (`src/pages/project/workspaces/`): `PHASE_WORKSPACES` eşlemesi, saf karar fonksiyonu `stepClickTarget` (plan §6.3'teki 9 satırlık karar tablosu), `highlightField` (DOM tabanlı vurgulama yardımcısı, React bağımsız), `PhaseWorkspaceSheet` (sağdan açılan panel kabuğu).
- **00 Satış Devri çalışma alanı** (`HandoverWorkspace.tsx`): eski `HandoverTab`, `CommitmentDialog` ve `KickoffTab`'ın kurulum tipi/LLM bölümü + "Otomatik açılan aksiyonlar" kartı buraya taşındı. Bölümler: Devir · Kurulum ve LLM (yeni `ChoiceReasonDialog` ile gerekçeli değişiklik) · Sözler ve taahhütler · Dokümanlar (Teklif/Sözleşme kutucukları, `DocumentUploadDialog` kullanır) · Satış devri toplantısı (`MeetingDialog`/`MeetingDetailDialog` kullanır).
- **Satış devri ve Kick-off sekmeleri kaldırıldı.** `?tab=handover` ve `?tab=kickoff` artık `tab=phases` + 00 panelini otomatik açar (`ws` parametresi de desteklenir).
- **01 Kick-off:** `KickoffTab` silindi. `reqdoc` adımı artık **veriyle** (`completion: "data"`) tamamlanıyor: `req_doc` türünde doküman yüklenince `STEP_CONDITIONS.reqdoc` koşuluyla kendiliğinden `done` olur. `presentation` adımı elle kalmaya devam ediyor.
- **Paylaşılan bileşenler çıkarıldı/taşındı:** `MeetingDialog` (+ `ActionFields`, `ActionDraft`, `EnumSelect`, `PersonSelect`, `NONE`) `ProjectDetail.tsx`'ten `src/pages/project/MeetingDialog.tsx`'e taşındı; yeni salt okunur `MeetingDetailDialog` eklendi; `DocumentsTab`'ın satır içi formu `DocumentUploadDialog`'a çıkarıldı (`lockedType`/`defaultLink` destekli).
- **Store:** `setKickoff` → `setInstallChoice(projectId, { installType?, llmChoice? }, reason?)` (yalnızca kurulum tipi/LLM; `presentationShared`/`reqDocShared`/`reqDocSharedAt` kalktı). `addDocument`'teki özel `reqdoc` kuralı silindi — tamamlamayı tek yerden `settleAll` yapıyor (RUL-13 yapısal olarak kapandı). `flowMessages` artık otomatik tamamlanan her adım için "Tamamlandı: &lt;adım&gt;" mesajı üretiyor; `setState` toast mesajlarını `uniq` ile biriktiriyor (önceki davranışta ikinci `setState` çağrısı ilk mesajı eziyordu).
- **State v9 → v10:** `STATE_VERSION`/`STATE_KEY` tek yerde (`seed.ts`) tanımlı; `auth-api.ts`'teki eski sabit `v8` anahtar hatası düzeltildi (Admin'den eklenen kullanıcılar artık giriş yapabiliyor).
- **Yetki:** `perm.ts`'e `canAssignCsm` eklendi (yalnızca Manager; admin'in CSM atama yetkisi bilinçli olarak kaldırıldı — S3).
- **`completion.ts`:** `isAutoStep` (REV-08), `latestHeldMeeting`, toplantı adımı geri açılma gerekçesi netleştirildi (RUL-09: "Otomatik kural: Yapıldı durumunda &lt;tür&gt; toplantısı kalmadı"). `MkAudit` tipi artık `flow.ts`'ten import ediliyor (REV-05), `rules.ts`'te de aynı değişiklik.
- **`alerts.ts`:** `reqdoc_not_shared` artık proje alanı yerine `reqdoc` adımının durumunu (`isOpenStep`) okuyor.

## Eşleme (plandaki ad → koddaki ad)
Plan §3.1'deki eşleme büyük ölçüde uygulandı; gate'te (reviewer REV-04) tespit edilen iki sapma:
- Plan §6.3'teki `PhaseWorkspaceSheet`'in kompakt adım listesinde "tıklanınca field" hesaplaması, `stepClickTarget` ile aynı mantığı kullanan ayrı bir `stepField()` yardımcı fonksiyonuyla yapıldı (plan bunu örtük olarak varsayıyordu, ayrı isimle netleştirildi).
- Eski `CommitmentDialog` → `HandoverWorkspace.tsx:294`'te `CommitmentEditDialog` olarak yeniden adlandırıldı (plan bunu isim değişikliği olarak belirtmiyordu). `ActionFields`'in satır içi etiket kullanımı REV-05 ile giderildi — `MeetingDialog.tsx:59` artık ortak `ACTION_STATUS_LABEL`'ı import ediyor.

### Silinen alanların ve reqdoc kuralının kullanım yerleri (grep kanıtı)
```
$ grep -rn "presentationShared\|reqDocShared\|reqDocSharedAt\|setKickoff\|KickoffTab\|HandoverTab" src/ --include="*.ts" --include="*.tsx"
src/pages/ProjectDetail.tsx:814:  installType: "Kurulum tipi", llmChoice: "LLM tercihi", presentationShared: "Sunum paylaşıldı", reqDocShared: "Gereksinim dokümanı paylaşıldı",
src/pages/ProjectDetail.tsx:815:  reqDocSharedAt: "Paylaşım tarihi", teamInfo: "Takım bilgisi", measurements: "KPI ölçümleri", participants: "Katılımcılar", date: "Tarih", notes: "Notlar", required: "Zorunlu",
```
Yalnızca `FIELD_LABEL` sözlüğünde kalıyorlar (plan §3.2'nin bilinçli kabul ettiği durum); `setKickoff`, `KickoffTab`, `HandoverTab` hiçbir yerde geçmiyor.
```
$ grep -rn 'setStepByKey.*"reqdoc"' src/ --include="*.ts" --include="*.tsx"
(sonuç yok)
```
`addDocument`/`setKickoff` artık reqdoc'u elle `setStepByKey` ile yazmıyor; tamamlama tek yerden `settleAll` üzerinden yürüyor (bkz. `store.test.tsx` → "f) no setStepByKey call referencing 'reqdoc' remains in store.tsx").

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Test (dosya › test adı) |
|---|---|---|---|
| AC1 | ✅ | L3 bileşen | `HandoverWorkspace.test.tsx` › "AC1 — Formu aç + live step completion" |
| AC2 | ✅ | L1 + L3 | `workspaces.test.ts` › "highlightField" (fake timers, bulunamayan alan); `HandoverWorkspace.test.tsx` › "AC2 — clicking a missing step highlights its field" |
| AC3 | ✅ | L3 bileşen | `HandoverWorkspace.test.tsx` › "AC3 — meeting step opens prefilled form and completes on save" |
| AC4 | ✅ | L3 bileşen | `HandoverWorkspace.test.tsx` › "AC4 — Teklif kutucuğu: dosya yükle, adım tamamlanır, kutucuk güncellenir" |
| AC5 | ✅ | L3 bileşen | `HandoverWorkspace.test.tsx` › "AC5 / AC-NEG1 / AC-NEG2 — kurulum tipi değişikliği gerekçeli" |
| AC6 | ✅ | L3 bileşen | `HandoverWorkspace.test.tsx` › "AC6 — role-based access" (devops salt okunur, csm düzenleyebilir) |
| AC7 | ✅ | L1 + L3 | `completion.test.ts` › "template" (reqdoc data, 01'in 3 adımı), "reqdoc_not_shared — reads step status…"; `HandoverWorkspace.test.tsx` › "AC7" |
| AC8 | ✅ | L3 bileşen | `HandoverWorkspace.test.tsx` › "AC8 — legacy tab param redirect" |
| AC9 | ✅ | L1 | `workspaces.test.ts` › "stepClickTarget — decision table" (9 satırın tamamı + plan örnekleri) |
| AC10 | ✅ | L3 store | `store.test.tsx` › "flowMessages — Tamamlandı toast (AC10)" |
| AC11 | ✅ | L3 store | `store.test.tsx` › "state v10 + login (AC11)" |
| AC12 | ✅ | L1 (settleAll) + L3 store | `completion.test.ts` › "AC12 — reqdoc completes via settleAll…"; `store.test.tsx` › "reqdoc — data-completed step, RUL-13 (AC12)" (a, b, c, e) |
| AC13 | ✅ | L1 + L3 store | `completion.test.ts` › "isAutoStep (REV-08)", "RUL-09…", "RUL-12…"; `store.test.tsx` › "RUL-10", "RUL-11" |
| AC14 | kısmen (bkz. Açık sorular) | — | — |
| AC-NEG1 | ✅ | L1 + L3 store | `store.test.tsx` › `setInstallChoice` AC-NEG testleri |
| AC-NEG2 | ✅ | L3 store | `store.test.tsx` › `setInstallChoice` "value -> null is rejected" |
| AC-NEG3 | ✅ | L1 + L3 bileşen | `workspaces.test.ts` › "row 5"; `HandoverWorkspace.test.tsx` › "AC-NEG3" |

## Kontroller (çıktı özeti — round 2 fix sonrası)
```
npm run lint       → 16 hata, 28 uyarı (main ile aynı — docs/AUDIT.md baseline'ı; regresyon yok)
npx tsc --noEmit   → temiz (hata yok)
npm test           → 8 dosya, 138 test — hepsi geçti
npm run build      → başarılı (vite build, ~5.7s)
```

## Review düzeltmeleri

`/gate` round 1 sonucu: DOĞRULANAMADI. Aşağıdaki bulgular `/fix`'te düzeltildi:

| Bulgu ID | Severity | Durum | Commit |
|---|---|---|---|
| QA-01 | Critical | Düzeltildi | `chore: sync package-lock with package.json [QA-01]` |
| REV-01 | High | Düzeltildi | `test: cover canAssignCsm and AC6 role matrix [REV-01]` |
| REV-02 | High | Düzeltildi | `test: assert saas_env relock and 29 Oct boundary [REV-02]` |
| REV-03 | Medium | Düzeltildi | `test: strengthen AC1/AC3/AC5/AC7/AC8 assertions [REV-03]` |
| REV-04 | Medium | Düzeltildi | `docs: add grep evidence and fix Eşleme section [REV-04]` |
| REV-05 | Medium | Düzeltildi | `refactor: import COMMIT_STATUS_LABEL/ACTION_STATUS_LABEL from labels [REV-05]` |
| RUL-01 | Medium | Düzeltildi | `fix: restrict NewProjectDialog CSM assignment to manager [RUL-01]` |
| REV-06…REV-11, RUL-02…RUL-04 | Low | Düzeltilmedi — `docs/reviews/BACKLOG.md`'ye eklendi, gate'i bloke etmiyor | — |

Not: REV-03 testlerini yazarken QA-01'in panel-başlık bulgusu (AC1/AC8'in yanlış elementle eşleşmesi) doğrulandı ve giderildi: `SheetTitle`, "00 Satış Devri" değil yalnızca "Satış Devri" render ediyor — "00 Satış Devri" ifadesi yalnızca kilitli-aşama tooltip metninde geçiyor. Testler artık panel içindeki H2 başlığını hedefliyor.

`/gate` round 2 sonucu: DÜZELTME GEREKLİ. Aşağıdaki bulgular bu `/fix` turunda düzeltildi:

| Bulgu ID | Severity | Durum | Commit |
|---|---|---|---|
| QA-02 | Critical | Düzeltildi | `fix: mount Toaster/Sonner inside BrowserRouter to prevent crash [QA-02]` |
| QA-03 | Medium | Düzeltildi | `test: cover AC4 offer document upload flow in HandoverWorkspace [QA-03]` |
| REV-12 | Medium | Düzeltildi | `test: assert reqdoc_not_shared skips the holiday itself [REV-12]` |
| REV-13 | Medium | Düzeltildi | Bu commit (değişiklik notu güncellemesi) |
| REV-14 | Medium | Düzeltilmedi — `docs/reviews/BACKLOG.md`'ye eklendi (F0 hedef, ayrı chore commit gerektiriyor), gate'i bloke etmiyor | — |
| RUL-05 | Medium | Düzeltilmedi — Murat'tan kural kararı gerekiyor, `docs/reviews/BACKLOG.md`'ye Açık soru olarak eklendi | — |
| REV-15, REV-16, REV-17, RUL-06 | Low | Düzeltilmedi — `docs/reviews/BACKLOG.md`'ye eklendi, gate'i bloke etmiyor | — |

Not: QA-02'nin kök nedeni (`App.tsx`'te `<Sonner/>`'ın `<BrowserRouter>` dışında monte edilmesi) bu PR'dan önce de vardı (eski `KickoffTab`'da aynı `Link`+`toast` deseni), ama bu PR AC5'in zorunlu mutlu yoluna taşıyarak tetiklenebilir hale getirdi. Düzeltme `App.tsx`'i kapsıyor (PR dosya listesine eklendi); regresyon testi gerçek `App` ağacını render edip `window` üzerindeki "error" event'ini yakalıyor (jsdom'da Sonner'ın toast portalı React ağacının senkron render akışı dışında çalıştığı için hata `render()`'dan senkron fırlamıyor).

## Ekran görüntüleri
Round 1'de uygulayıcı oturumunda yerel `npm run dev` ile manuel smoke test yapıldı. Round 2'de qa-verifier'ın gerçek tarayıcı taraması 8 ekran görüntüsü üretti; bunlar `docs/reviews/feat_m09b-phase-workspace-handover/screens/` altında kalıcı olarak saklanıyor (AC14 dar ekran kontrolleri dahil, AC5'in çökme/düzeltme-öncesi durumu dahil).

## Açık sorular / sapmalar
- **AC4/AC5 artık L3 testiyle kapsanıyor** (bkz. Kabul kriteri tablosu). Round 1'de bunlar jsdom'da güvenilmez sayılmıştı (dosya seçimi, Radix Select); round 2'de gerçek `File` nesnesiyle (`fireEvent.change` + `input[type=file]`) ve RadioGroup etkileşimiyle (Select değil) yazıldı ve geçti. **AC14** (640px panel genişlik kuralı) jsdom'da layout/CSS media query çözümlenmediği için hâlâ yalnızca tarayıcı kontrolüyle doğrulanabiliyor; qa-verifier bunu round 2'de PASS etti (ekran görüntüleri yukarıda).
- **S6 netleştirme notu (plan §11):** Plan, kilitli `reqdoc`'un `req_doc` yüklenince doğrudan `done` olmasının (locked'ta kalıp aşama açılınca tamamlanması değil) mevcut M-09a motor davranışıyla tutarlı olduğunu belirtiyor ve bunun Murat'a ayrıca teyit ettirilmesi gerektiğini not ediyor. Bu PR mevcut motor davranışını uyguladı (AC12 b); ayrı teyit/karar ana oturumun işidir, bu PR'ı değiştirmez.
- `docs/DATA_MODEL.md`, `docs/AUDIT.md`, `docs/PHASES.md`, `docs/plans/M-09-step-completion-workspaces.md` güncellemeleri plan §11'e göre **ana oturumun** işi; uygulama oturumu bunlara dokunmadı (guard zaten engelliyor).

## Öneriler (kapsam dışı)
- Plan §11 Risk notundaki gibi: `StepClickTarget`'e `{ kind: "document_upload"; type: DocType }` eklenmesi veya 01'e küçük bir çalışma alanı — 01'deki `reqdoc` satırına tıklamanın StepDialog yerine doğrudan doküman yükleme açması için (M-09c'ye bırakıldı, plan zaten böyle diyor).
