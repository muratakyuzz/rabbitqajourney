# Değişiklik notu — fix/m06-insight-step-lock

## Görev
- Direktif: `docs/reviews/M-closure.md` (REV-13 bölümü), ayrıntı: `docs/reviews/M-full-review.md` (REV-13)
- Faz / görev kodu: Faz M kapanış round 2 — `/fix`

## Ne değişti
- `approveInsight`'ın `step_update` dalı artık hedef adımı `patch<Step>(...)` ile doğrudan değiştirmiyor; `api.updateStep(ins.targetId, v, reason)` çağırıyor ve hata dönerse öneriyi onaylanmış işaretlemeden erken dönüyor (`src/lib/rabbitqa/store.tsx:689-693`).
- Kilit kontrolü (`updateStep`'in daha önce satır içi yazdığı iki kural: "kilitli adımın durumu elle değişmez" ve "'Sırası gelmedi' elle seçilemez") `src/lib/rabbitqa/completion.ts`'e `stepLockError(step, next)` adıyla ortak bir yardımcı fonksiyona taşındı; `updateStep` da bu yardımcıyı çağırıyor (`src/lib/rabbitqa/store.tsx:256-260`). Artık kural tek yerde ve `approveInsight` onu kopyalamadan `updateStep` üzerinden devralıyor.
- `InsightCard.tsx`'teki `ApproveDialog`'da `step_update` önerileri için Durum seçeneklerinden `locked` ("Sırası gelmedi") kaldırıldı; `ProjectDetail.tsx`'teki StepDialog deseniyle aynı yaklaşım (`Object.entries(...).filter(([k]) => k !== "locked")`) kullanıldı (`src/components/rq/InsightCard.tsx:163-164,188`).

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Test (dosya › test adı) |
|---|---|---|---|
| AC1 | ✅ | L2 | `src/lib/rabbitqa/store.test.tsx` › "AC1: rejects an edited step_update proposing 'locked' on an open manual step — step and insight stay unchanged" |
| AC2 | ✅ | L2 | `src/lib/rabbitqa/store.test.tsx` › "AC2: rejects approving (no edit) a step_update whose target step is now locked — step and insight stay unchanged" |
| AC3 | ✅ | L2 | `src/lib/rabbitqa/store.test.tsx` › "AC3 (regression): approves a step_update to 'done' on an open manual step" |
| AC4 | ✅ | L3 | `src/components/rq/InsightCard.test.tsx` › "does not offer 'Sırası gelmedi' as a status option, and keeps the other four" |
| AC5 | ✅ | L2 | `src/lib/rabbitqa/store.test.tsx` › "AC5 (regression): still rejects a step_update insight targeting an auto-completed (data) step" (mevcut store.test.tsx:454 AC17 testiyle aynı senaryo, ek olarak yinelendi) |

## Mockup ↔ API (modül bağlama görevlerinde)
- Kapsam dışı (demo modu, backend bağlama görevi değil).

## Veritabanı
- [x] Migration yok

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-25 ("kilitli adımın durumu elle değişmez" / "açılmış adım tekrar kilitlenmez"), INV-21 (AI onayı mevcut servis fonksiyonunu çağırır)
- [x] Gerekçe zorunlu işlemler shared zod şeması + servis ile zorlanıyor — N/A (bu görev gerekçe kuralını değiştirmiyor; gerekçe REV-01'de zaten zorunlu, burada yalnızca kilit kontrolü ekleniyor)
- [x] Trigger / PL/pgSQL / RLS / motor kontrolü yok

## Kontroller (çıktı özeti)
```
npm run lint       → 14 hata / 28 uyarı (M-closure.md round 2 baseline'ıyla aynı, regresyon yok)
npx tsc --noEmit   → temiz
npm test           → 13 dosya / 210 test yeşil (round 2 baseline 205 + bu görevin 5 testi)
npm run build      → başarılı (bilinen 1,22 MB chunk uyarısı duruyor)
```

## Ekran görüntüleri
- UI değişikliği `ApproveDialog`'un Durum açılır menüsünün seçenek listesiyle sınırlı (menü açılmadan görünmüyor). M-closure.md §Baseline etkisi'ne göre mevcut 35 PNG etkilenmiyor; ek PNG (`csm-insights-step-update-edit-dialog-status-open.png`) qa-verifier tarafından `/gate` sırasında üretilecek.

## Eşleme (plandaki ad → koddaki ad)
- Direktifteki "ortak yardımcı" → `stepLockError` (`src/lib/rabbitqa/completion.ts`)

## Açık sorular / sapmalar
- Yok. Direktifteki isteğe bağlı maddeler (RUL-02, REV-M06-02, REV-07, PLN-01) bu turun kapsamına alınmadı; REV-13 dışına çıkmamak için bilinçli olarak atlandı.

## Öneriler (kapsam dışı)
- F0-01: API_CONTRACT'a (a) insight onayının ilgili servis fonksiyonunu çağırıp hatasını yaydığı (INV-21), (b) adım güncellemesinde `locked` hedefi veya kilitli kaynak için 409/400 döndüğü notu eklenmeli (M-closure.md BACKLOG tablosu, REV-13 satırı).

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
| REV-13 | Düzeltildi | (bu branch'in commit'i) |
