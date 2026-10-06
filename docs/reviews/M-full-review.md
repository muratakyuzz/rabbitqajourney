# reviewer — main (bütünsel, demo modu) @ 3727275

**Karar:** CHANGES_REQUESTED (yalnızca REV-01 nedeniyle; küçük bir düzeltme. Kalan bulgular Medium/Low.)

Kapsam: `.verify/main/src/` altındaki tüm kod; demo modu kuralları (AGENTS.md "Demo kuralları"). Backend invariant'ları (INV-01…05, 14–18, 21–24: pg, transaction, RLS, crypto, worker) uygulanmaz, blocker sayılmadı. BACKLOG'da zaten "F1'e bırakıldı" diye kayıtlı olan sapmalar yeni bulgu olarak yazılmadı, yalnızca referans verildi.

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-01 | High | INV-06, PRODUCT_SPEC:203, AGENTS demo kuralı | src/pages/project/Phase3Tabs.tsx:348-424; src/lib/rabbitqa/store.tsx:503 | `RiskDialog` risk/karar için durum ve termin değişikliğini gerekçe istemeden kaydediyor: `updateRisk(risk.id, d)` reason göndermiyor, store'da da reason opsiyonel. Arayüzden erişilebilen, gerekçesiz bir durum/tarih değişikliği yolu. Önceki üç gate'te yakalanmamış, Lovable'dan kalma. | `ActionDialog` deseni: `needsReason = !!risk && (d.status !== risk.status \|\| d.due !== risk.due)`, Textarea ekle, boşsa engelle, `updateRisk(id, d, reason.trim())`. |
| REV-02 | Medium | RBAC satır 4/6/14 | ProjectDetail.tsx:69; CustomerReport.tsx:27 | Proje detayı ve haftalık rapor `visibleProjects` kontrolü yapmadan açılıyor; atanmamış DevOps/Care/CSM URL ile her projeyi görebiliyor. | `perm.ts`'e `canViewProject` ekle, yetkisizse EmptyState. |
| REV-03 | Medium | RBAC satır 12 | perm.ts:59-60 | `canEditReport = canManageProject`; manager/admin rapor oluşturup gönderebiliyor. | F0-01/F1 RBAC matrisinde karara bağla. |
| REV-04 | Medium | RBAC satır 2-5,16 | perm.ts:6-12,49-54 | `canManageProject` manager+admin true; admin ayrıca flow/alert/ticket düzenleyebiliyor. Plan (manager düzenler) ile RBAC.md çelişiyor. | Murat karar versin: RBAC.md mi plan mı geçerli. |
| REV-05 | Medium | INV-25 | rules.ts:63-75; store.tsx:321,515 | `setStepByKey` kilit kontrolü yapmıyor; son taahhüt kapanınca kilitli `commit_check`/`customer_approval` akış motoru dışında `done` olabiliyor. | S6 kararına dahil et; rules-reviewer baksın. |
| REV-06 | Medium | INV-06/08 (store) | store.tsx:236-246,256-269,271,503 | Gerekçe/"done" kontrolleri yalnızca UI'da; store seviyesinde tutarsız. | Freeze'i engellemez; API_CONTRACT'ta netleştirilsin. |
| REV-07 | Low | M-09c S7 | store.tsx:482 | `addTicket` hâlâ no-op `setStepByKey(..., "support_track", ...)` çağırıyor. | Satırı kaldır. |
| REV-08 | Low | DATA_MODEL D13/D16 | types.ts:321; seed.ts:605 | `RqState.reportsSent` okunmuyor. | Kaldır veya açık soru olarak not düş. |
| REV-09 | Low | DATA_MODEL §4,D5 | store.tsx:173,462,487 | `projectId:"system"` sentinel, sabit `"auto"` id, takım=ad. | DATA_MODEL §9'a ekle. |
| REV-10 | Low | INV-13 | Overview.tsx:20-22,35; MyWork.tsx:25,28; vb. | `isOpenStep` kopyaları ve takvim günü aritmetiği `business-days.ts` dışında da var. | F6-01'de toplanacak. |
| REV-11 | Low | INV-12 | reports.ts:32,54 | `isCustomerVisible !== false` fail-open; risk `=== true` kullanıyor. | `=== true` kullan. |
| REV-12 | Low | Doküman tutarlılığı | AGENTS.md:28-29; AUDIT.md §5 | AGENTS.md "main @ 4bfa4cb, v8, Ctx 52" diyor; gerçek v11/51. AUDIT §5 tablosu v3'te kalmış. | Murat AGENTS.md'yi, denetim rolü AUDIT §5'i güncelleyecek. |

### Kontrol sonuçları
1. **INVARIANTS (demo):** Her mutasyon audit yazıyor. Kurulum/LLM, uyarı erteleme/kapatma, Go-Live gerekçeleri store'da zorlanıyor. Risk dışında (REV-01) adım/aşama/aksiyon/taahhüt gerekçeleri UI'da zorlanıyor. INV-07/08(UI)/25(REV-05 hariç)/26/27 tamam. INV-11/22 bilinçli düz metin.
2. **RBAC:** `perm.ts` dışında yetki amaçlı rol karşılaştırması 0 (doğrulandı). Matris sapmaları REV-02/03/04'te. Admin yazma/proje oluşturma/devops erişim bilgisi BACKLOG'da açık soru.
3. **DATA_MODEL:** Henüz şablon; F1-00'ı bloklayan çelişki yok. REV-08/09 not edilmeli; `AuditEntry.kind`'daki kullanılmayan `"delete"` (types.ts:172) F1-00'da çıkarılmalı.
4. **Kod sağlığı:** Lint 42 problem (14 hata/28 uyarı), v3'te 16/28'di — iyileşme, regresyon yok. En büyük dosyalar ProjectDetail 893 (1031'den düştü), store 837, seed 617, Phase3Tabs 538, Phase2Tabs 287 (512'den düştü). Kullanılmayan paketler aynı (xlsx, supabase-js, canvas-confetti, mcp-js, lovable-tagger), `bun.lockb` hâlâ repoda. Büyük sapma yok, tablo güncel değil (REV-12).
5. **M-09c kalkanlar (grep):** `TrainingSession`/`AdaptationSession`/`trainings`/`addTraining`/`updateTraining`/`saveAdaptation` — 0 eşleşme. `support_track` şablonda yok (tek kalıntı REV-07). `?tab=alerts/training/adaptation` üreten link yok, yalnızca geriye uyumlu okuma var (test edilmiş).

### Düzeltme direktifi
1. **REV-01** (zorunlu): `RiskDialog`'da durum/termin değişince gerekçe zorunlu kıl, store'a geçir, test ekle.
2. (İsteğe bağlı, aynı commit) REV-07: store.tsx:482'yi sil.

### Mockup-freeze sonucu
- **Freeze'i engelleyen tek madde REV-01** — arayüzden erişilebilen INV-06 açığı, freeze ile sözleşmeye girecek. ~10 satırlık `/fix` ile kapanır.
- Murat düzeltmeyi F-fazına bırakmayı seçerse, API_CONTRACT'taki risk güncelleme satırına "gerekçe zorunlu (durum/termin)" yazılarak freeze yapılabilir.
- REV-02…06 F0-01/F1 RBAC ve servis katmanı işleri; freeze'i engellemez, BACKLOG'a alınmalı.
- AUDIT.md §5 "`perm.ts` dışında rol kontrolü: 0" notu doğru; ama perm.ts'in RBAC.md ile tam uyumlu olduğu anlamına gelmiyor (REV-03/04).

### Açık sorular
- Manager'ın adım/aşama/toplantı düzenlemesi: RBAC.md (R) mi, M-09b planı (düzenler) mı geçerli?
- Kilitli bir adımın veri/kuralla önceden `done` olması (S6 + REV-05) için tek bir karar verilmeli.
