# Değişiklik notu — feat/m09a-step-completion

## Görev
- Plan: `docs/plans/M-09a-step-completion.md`
- Faz / görev kodu: M-09a

## Ne değişti
- Model: `Step.completion`, `StepTpl.completion`, `meetingType`, `Meeting.status`, `Meeting.teamId`, `Project.noCommitments`, state v8 → v9.
- Yeni `src/lib/rabbitqa/completion.ts`: koşul kataloğu (11 anahtar), `stepConditionResult`, `applyStepCompletion`, `settleProject`/`settleAll`, `manualStatusError`.
- `rules.ts`: `installChoiceError`, `applyMeetingHeldRules`.
- Store: `updateStep` manuel tamamlama koruması, `setNoCommitments`, `addCommitment` otomatik kuralı, `addMeeting`/`updateMeeting` durum desteği (yalnızca `held` toplantıda kural çalışır), `setKickoff` → `{error, summary}`, `addDocument`/`approveInsight` completion'a devir.
- Şablon: 00'a "Kurulum tipi ve LLM tercihinin girilmesi" (`install_llm`, data, bağımsız) eklendi; 01'den `install_type`/`llm` adımları kaldırıldı; "Internal brif" → "Satış devri toplantısı" (meeting/brief).
- Ekranlar: Aşamalar tablosunda Veriyle/Toplantıyla etiketi + "Eksik: …" tooltip; StepDialog'da kısıtlı durum + ✓/✗ koşul listesi; MeetingDialog'da Durum + Uyarlama için Takım alanı; MeetingsTab'da durum rozeti + "Yapıldı olarak işaretle"; HandoverTab'da "Taahhüt yok"; KickoffTab'da "Henüz belli değil"; Admin şablonunda "Tamamlanma" etiketi + sistem adımı silme koruması.
- Seed: `p_ornek` (Örnek Sigorta A.Ş.) yeni proje; İş Yatırım/Garanti/Akbank senaryoları plan §9'a göre güncellendi.

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Test (dosya › test adı) |
|---|---|---|---|
| AC1–AC9, AC15 | ✅ | L1 | `completion.test.ts` › `applyStepCompletion`, `STEP_CONDITIONS — met/unmet pairs`, `template` |
| AC16 | ✅ | L1 | `completion.test.ts` › `seed invariants (AC16)` › "every done data/meeting step in a done phase satisfies its condition (AC16 invariant, REV-03/RUL-03)" |
| AC10 (karar fonksiyonu) | ✅ | L1 | `completion.test.ts` › `manualStatusError` |
| AC13 | ✅ | L1 | `completion.test.ts` › `applyMeetingHeldRules` |
| AC14/AC-NEG3 (karar fonksiyonu) | ✅ | L1 | `completion.test.ts` › `installChoiceError` |
| AC17 (analyzeText), AC18 | ✅ | L1 | `completion.test.ts` › `AI / alerts interplay` › "analyzeText never proposes step_update for non-manual steps", "reqdoc_not_shared only counts held kickoff (RUL-02)" |
| AC10 (store) | ✅ | L3 | `store.test.tsx` › "updateStep — manual completion guard (AC10)" + "updateStep — out_of_scope reopens via settle (AC10, REV-03)" |
| AC11, AC-NEG1 | ✅ | L3 | `store.test.tsx` › "setNoCommitments / addCommitment (AC11, AC-NEG1)" |
| AC12, AC-NEG2 | ✅ | L3 | `store.test.tsx` › "addMeeting / updateMeeting (AC12, AC-NEG2)" incl. "cancelled meeting does not complete the step (AC12, REV-03)" |
| AC13 (store bağlantısı) | ✅ | L3 | `store.test.tsx` › "planned devops_handover does not move the ball; held moves ball to devops and completes the step (AC13, REV-03)" |
| AC14, AC-NEG3 | ✅ | L3 | `store.test.tsx` › "setKickoff (AC14, AC-NEG3)" incl. "SaaS -> On-prem -> SaaS …" (RUL-01) |
| AC17 (approveInsight) | ✅ | L3 | `store.test.tsx` › "approveInsight — step_update guard (AC17)" |
| REV-01 regresyonu | ✅ | L3 | `store.test.tsx` › "addTeam — adaptation steps are manual (REV-01)", "addTraining — participant step is manual (REV-01)", "setKickoff — SaaS step is manual (REV-01)" |
| AC19 | ✅ | L6 (manuel Playwright MCP doğrulaması bu oturumda yapıldı) | Tarayıcı kontrolü — bkz. "Ekran görüntüleri" |

## Mockup ↔ API (modül bağlama görevlerinde)
- Uygulanamaz — bu PR demo (Faz M) kapsamında, backend/API bağlaması yok.

## Veritabanı
- [x] Migration yok (demo; backend, veritabanı, Supabase yok)

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-05, INV-06, INV-09, INV-13, INV-21, INV-25, INV-26
- [x] Her otomatik değişiklik `Otomatik kural: …` gerekçeli audit üretir
- [x] Akış yalnızca `flow.ts`, adım tamamlama yalnızca `completion.ts` (M-09a)
- [x] AI önerisi veri/toplantı adımını tamamlayamaz (INV-21, `ai-mock.ts` filtresi + `approveInsight` koruması)
- [x] `reqdoc_not_shared` yalnızca `held` kick-off'u sayar (INV-13)
- Not: Trigger/PL/pgSQL/RLS ve `authorize()`/RBAC maddeleri bu demo PR'ında uygulanamaz (BE yok).

## Kontroller (çıktı özeti)
```
npm run lint                            → 16 error / 28 warning (main'deki mevcut durumla aynı sayı)
npx tsc -p tsconfig.app.json --noEmit   → 0 hata (kök tsconfig "files: []" kullandığı için gerçek derleme bu komutla yapılır; REV-02)
npx tsc -b                              → 0 hata (tüm proje referansları)
npx vitest run                          → 3 dosya, 70/70 test PASS (62 mevcut + 8 yeni regresyon: REV-01 ×3, REV-03 ×4, RUL-01 ×1)
npm run build                           → başarılı (vite build, mevcut chunk-size uyarısı dışında sorun yok)
```

## Ekran görüntüleri
Playwright MCP ile manuel olarak kontrol edildi (qa-verifier ayrıca tam L6 geçişini yapacak):
- Örnek Sigorta A.Ş. → Aşamalar: "CSM ataması" **Tamamlandı · Veriyle**, "Satışçı ve lisans modelinin girilmesi" **Bekliyor · Veriyle**, "Satış devri toplantısı" **Sırası gelmedi · Toplantıyla**, yeni "Kurulum tipi ve LLM tercihinin girilmesi" doğru sırada.
- StepDialog: Durum seçenekleri kısıtlı (Bekliyor + Kapsam dışı), "Tamamlanma koşulu" listesinde ✓ Satışçı / ✗ Lisans modeli.
- Toplantı: Planlı "Satış devri" toplantısına "Yapıldı olarak işaretle" → adım otomatik `done`, ilerleme %3 → %6.
- Admin > Aşama şablonu: "Veriyle: …" / "Toplantıyla: …" etiketleri, sistem adımlarında sil butonu pasif + "Sistem adımı — veriyle tamamlanır" tooltip.
- Konsolda hata yok (tüm gezinmelerde 0 error).

## Eşleme (plandaki ad → koddaki ad)
- Plan §3.1 ile birebir.
- `install_type`/`llm` kullanım yerleri grep doğrulaması: `grep -rn '"install_type"\|key === .llm.\|=== "llm"' src/` → yalnızca `completion.test.ts` içinde (adımların kaldırıldığını doğrulayan negatif test); üretim kodunda referans kalmadı.
- Plan §9 (`p_ornek`): `buildFromTemplate` planEnds vermeden çağrılıyordu (tüm aşamalar `planEnd: null`); REV-04 ile `createProject`'teki yöntemle (`projectPlan`) tahmini tarihler üretilip uygulandı.

## Açık sorular / sapmalar
- Plan §13 S1–S8'deki kararlar birebir uygulandı (S1: install_llm sırası, S3: teamId=takım adı, S8: 3 commit).
- `package-lock.json`: `npm install` ortamı kurarken regüle oldu ama bu PR'a dahil edilmedi (kapsam dışı, gereksiz gürültü).

## Öneriler (kapsam dışı)
- M-09b: sekme taşıma/kaldırma, çalışma alanı paneli, data-field vurgusu.
- M-09c: 04–08 aşamaları, Eğitim/Uyarlama dönüşümü, uyarı rozeti.

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
| REV-01 | Düzeltildi | `acccf02` |
| REV-02 | Düzeltildi | `7fdd310` |
| REV-03 | Düzeltildi | `9327561` |
| REV-04 | Düzeltildi | `91455c5` |
| REV-05 | Düzeltilmedi — Low, kapsam dışı; `docs/reviews/BACKLOG.md`'ye eklendi |
| REV-06 | Düzeltildi | `9988203` |
| RUL-01 | Düzeltildi | `117e3d6` |
| RUL-02 | Düzeltildi | `60ee10f` |
| RUL-03 | Düzeltildi | `9327561` |
| RUL-04, RUL-05, RUL-06, RUL-07, RUL-09 | Düzeltilmedi — Low/isteğe bağlı, kapsam dışı; `docs/reviews/BACKLOG.md`'ye eklendi (M-09b/c) |
| RUL-08 | Düzeltildi | `9988203` |
