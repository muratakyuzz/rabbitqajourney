# Değişiklik notu — chore/f0-01-api-contract
> `/build` doldurur, branch'in son commit'iyle birlikte push edilir; `/gate` bunu okur, `/fix` "Review düzeltmeleri" tablosunu günceller.

## Görev
- Plan: `docs/plans/F0-01-api-contract.md`
- Faz / görev kodu: F0-01

## Ne değişti
- `docs/API_CONTRACT.md` şablondan v1'e dolduruldu (yalnızca doküman; kod, şema, migration yok):
  - §1 Genel kurallar + hata kodları, `RuleEffects` yanıt sözleşmesi, kilit ayrımı (ADR-0004 K5) ve **§1.1 `authorize()` aksiyon kataloğu** (her aksiyon → `docs/RBAC.md` satırı).
  - §2.1 store `Ctx`'in **51 işleminin** her biri için satır (method & path, istek/yanıt şeması, authorize, audit, gerekçe, tetiklenen kural, görev kodu). `updateProject` (5 alt uç) ve `setConfig` (8 alt anahtar) alt satırlara bölündü. Kural kolonu `rules.ts`, `flow.ts`, `completion.ts`, `alerts.ts`, `reports.ts` ve store kodundan çıkarıldı.
  - §2.2 `setStepByKey` çağrı yollarının elle / veriye dayalı sınıflandırması (ADR-0004 K5, REV-05).
  - §2.3 `Ctx` dışındaki demo giriş uçları (`auth-api.ts`).
  - §3 AUDIT §2'deki her ekran, 13 proje sekmesi, aşama çalışma alanı panelleri, uyarı paneli ve 8 Admin sekmesi → okuma uçları, filtreler, yanıt şeması, authorize, DATA_MODEL erişim deseni (Q1–Q8).
  - §4 Mockup ↔ API bilinçli farkları (demo giriş, localStorage, istemcide uyarı/akış, şifresiz erişim bilgisi/secret, UI-only gerekçe, K1/K2/K3, INV-07/08, RBAC sapmaları vb.).
  - §5 RBAC.md'de karşılığı olmayan / çelişen noktalar, her birinde sözleşmenin güvenli varsayımı (v1: 19 nokta; v1.1 ve v1.2: 3 açık, S20–S22).
  - §6 `packages/shared` şema adları listesi (enum, varlık, istek, yanıt).
- **Gate round 1 düzeltmeleri (v1.1, `/fix`):** `main` merge edildi (zaten güncel, no-op). Sözleşme ADR-0005 (K8–K13), güncel `docs/RBAC.md` (Karar 7–9) ve `docs/INVARIANTS.md` (INV-06, INV-08, INV-25, INV-28) ile hizalandı. SUMMARY.md direktifi başındaki ADR-0005 notuna göre uygulandı: #1 K9'a göre (DevOps *atandığı proje*de oluşturur, S20 "DevOps ekleyemez" yazılmadı), #9'un RR-F007 kısmı K10'a göre (`409` yerine gerekçeli `done → in_progress`), #14'ün bağlılık kısmı K11'e göre (§5 maddesi açılmadı).
  - §1: proje kilidi protokolü, durum ön koşullu yazmalar + tekil kısıtlar, aşaması kilitli adım kuralı, daraltılmış `{ item, effects }` zarfı, yol parametresi/metot kuralı.
  - §1.1: Manager (K8), Admin (K12) ve RBAC Karar 9 satırları; erişim bilgisi aksiyonları ayrıldı; `session:authenticated`.
  - §5: **açık** yalnızca S20 (kuralla atanan sahip), S21 (INV-06 durum geçişi istisnası, REV-F004), S22 (`gonogo` hedefi); S1–S19 ve K10 kapsamı dışı geçiş **kapanan** tablosunda dayanağıyla.
- **Gate round 2 düzeltmeleri (v1.2, `/fix`):** SUMMARY.md direktifi, başındaki denetim notuna (ADR-0005 K14–K18, INV-28 ve INV-08'in yeni metinleri) göre uygulandı. Madde 8 (REV-F017) yerine ADR-0005 "Round 2 — API_CONTRACT'a yansıtılacaklar" uygulandı: S10/S13/S18 §5.2'de dayanak "Murat onayı, ADR-0005 K14/K15/K18"; S15 (K16) ve S17 (K17) **hedef davranış** olarak #14/#2c'ye yazıldı ve §4'e eklendi. Madde 3 INV-28'in yeni metnine göre yazıldı, S24 §5.2'ye (kapandı) girdi.
  - Murat kararı (bu `/fix` oturumu, 2026-10-06): §5.1'de yalnızca S20, S21, S22 açık kalır. Direktifin ayırdığı **S23** (RR-F022) S22'ye katıldı ("Go-Live manuel adımları: `gonogo`, `customer_approval`, `commit_check`"); **S25** (`not_started`) INV-25'in sonucu olarak #3'e yazıldı, S-maddesi açılmadı.
  - §1: kilit ayrımı adım/aşama olarak genelleştirildi; done aşamadaki adım `409`; manuel `out_of_scope → done`; proje kilidine adım ekleyen yazmalar ve #2a; kilit altında yeniden okuma.

## Kabul kriteri ↔ test
Doküman görevi; otomatik test yok — her AC için doğrulama yöntemi:
| AC | Karşılandı | Seviye | Doğrulama |
|---|---|---|---|
| AC1 | ✅ | belge kontrolü | `interface Ctx` (store.tsx:40-94) fonksiyon adları çıkarıldı (51, `state`/`userId` hariç) ve §2.1'de her biri için satır arandı → eksik 0 (komut aşağıda) |
| AC2 | ✅ | belge kontrolü | AUDIT §2 rotaları (/login, /forgot-password, /reset-password, overview, insights, projects, projects/:id + 13 sekme, report, my-work, reports, admin + 8 sekme) §3'te en az bir GET satırına bağlı |
| AC3 | ✅ | belge kontrolü | §2–§3'te kullanılan her `authorize` aksiyonu §1.1 kataloğunda ve RBAC.md satırına eşli; satırı olmayanlar (`alert:create`, `adaptation:update`, `session:public`, Go-Live onayı, keşif/takım) §5'te (S5, S6, S7, S16) |
| AC4 | ✅ (reviewer örneklemle doğrular) | rules-reviewer | Audit / gerekçe / kural kolonları store.tsx ve rules/flow/completion kodundan satır satır çıkarıldı; UI-only gerekçeler ayrıca işaretlendi |
| AC5 | ✅ | `git diff --stat main` | Yalnızca `docs/`; uygulama rolünün commit'leri yalnızca `docs/API_CONTRACT.md` ve bu not. Sözleşme dışı doküman değişiklikleri (RBAC.md, INVARIANTS.md, PRODUCT_SPEC.md, ADR-0004/0005, reviews) denetim commit'leri 4ee47d4 ve f5a29a6 |

AC1/AC3 kontrol komutu (özet): `sed -n '/^interface Ctx {/,/^}/p' src/lib/rabbitqa/store.tsx` → 51 ad; her biri `docs/API_CONTRACT.md` §2'de `| <no> | \`<ad>\`` satırında bulundu. §2–§3'teki `` `x:y` `` aksiyonlarının §1.1'de olmayanı: yalnızca `` `adapt:general` `` (adım anahtarı, yanlış pozitif).

## Veritabanı
- [x] Migration yok

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri (sözleşmeye hedef olarak yazıldı, kod yok): INV-05, INV-06, INV-07, INV-08, INV-09, INV-10, INV-11, INV-12, INV-15, INV-16, INV-17, INV-19, INV-21, INV-22, INV-23, INV-25, INV-26, INV-27, INV-28
- Kod değişikliği olmadığı için endpoint/audit/transaction kutuları uygulanmaz.

## Kontroller (çıktı özeti)
```
npm run lint       → 42 problems (14 errors, 28 warnings) — main ile aynı (yalnızca docs değişti)
npx tsc --noEmit   → 0 hata
npm test           → 13 dosya, 210/210 test geçti
npm run build      → başarılı (chunk boyutu uyarısı main'deki gibi, F0-02/F9-03)
npm run e2e        → uygulanmaz (UI/akış değişmedi)
```

## Eşleme (plandaki ad → koddaki ad)
- Şablondaki örnek satır `setKickoff` / `PUT /projects/:id/kickoff` → `Ctx`'te yok (M-09b ile kalktı); kick-off verisi `addMeeting`/`updateMeeting` (toplantı türü `kickoff`) ve `addDocument` (`req_doc`) ile. Örnek satırlar gerçek satırlarla değiştirildi.
- Şablondaki "v3'te 52 işlem" → gerçek sayı **51** (AUDIT §3 ve M-09c sonrası).
- Plan "`types.ts` tip adları (Project, Step, …)" → aynen kullanıldı; `types.ts`'te olmayan görünüm şemaları (`ProjectListItem`, `RuleEffects`, `CredentialMasked` vb.) §6'da "yeni" olarak ayrı listelendi.
- `DocumentRec` adı (types.ts) korunuyor; istek şeması `DocumentCreate`.
- `SupportTicket` → istek şemaları `SupportTicketCreate` / `SupportTicketPatch`; `RiskDecision` → `RiskDecisionCreate` / `RiskDecisionPatch` (`<Varlık>Create/Patch` kuralı tip adıyla uygulandı).

## Açık sorular / sapmalar
- **PR açılmadı:** plandaki görev metni (madde 4) "PR aç" diyor; `/build` ve AGENTS.md §5 "PR açılmaz" kuralına uyuldu, branch push edildi.
- **ADR-0004 K4 ↔ kod:** K4 "mockup bugün held toplantı tür/tarih değişikliğinde gerekçe istemiyor" diyor, ama `store.tsx:286-288` bunu zaten zorluyor → §4'te "fark yok" olarak yazıldı.
- **ADR-0004 K5 ↔ kod:** K5 `addDocument`/`setKickoff`'u `setStepByKey` yolu olarak anıyor; güncel kodda `setKickoff` yok, `addDocument` tamamlaması `applyStepCompletion` ile (out_of_scope'a dokunmuyor). §2.2'de gerçek `setStepByKey` çağıranları listelendi.
- ~~ADR-0004 K3 ↔ RBAC.md satırları (S2/S3)~~, ~~Manager yazma yetkisi (S1)~~, ~~INV-06 kapsamı (S8)~~: ADR-0005 K8, K12, K13 ile karara bağlandı; sözleşme v1.1'de hizalandı.
- **§5'te açık kalan (Murat kararı):** S20 kuralla atanan sahip (güvenli varsayım: yalnızca aktif kullanıcı, `ownerId: null` + CSM'e "Sahip ata" aksiyonu), S21 INV-06 durum geçişi istisnası (`completePhase`, `markReportSent`, `updateUser.active`, `noCommitments`, `disconnect`, takip `active`, öneri reddi, e-posta `ignored`; varsayım: gerekçesiz), S22 Go-Live manuel adımları (varsayım: `gonogo` manual ve tek yönlü; `customer_approval` yalnızca #38 ile `done`; açık taahhütte `commit_check` elle `done` `409`).
- ~~S10, S13, S17, S18 "sözleşme kararı" olarak kapatıldı~~: round 2'de (REV-F017) Murat onayıyla ADR-0005 K14–K18 olarak karara bağlandı; S15 ve S17 mockup'tan farklı hedef davranış.
- **S20 alternatifi** ("projenin DevOps'u") DATA_MODEL'de proje düzeyinde DevOps ataması gerektirir (F1-00).

## Öneriler (kapsam dışı)
- `docs/RBAC.md`: §5 S5 (uyarı oluşturma), S6 (keşif/takım/uyarlama), S7 (Go-Live onayı), S16 (oturum öncesi uçlar) için satır eklenmesi — denetim oturumu.
- `docs/INVARIANTS.md` INV-06: plan tarihleri, Go-Live tarihi ve sağlığın kapsama açıkça eklenmesi (S8).
- `docs/DATA_MODEL.md` §1: §3'te "—" ile işaretli yeni erişim desenleri (toplantılar, erişim bilgileri, dokümanlar, riskler, adaptasyonlar, konfigürasyon okumaları) F1-00'da eklenmeli.
- `AGENTS.md:29` "Mockup yapısı" hâlâ "state v8, `Ctx` 52 işlem" diyor; gerçek: state v11, 51 işlem (REV-12 ile aynı konu, Murat).

## Review düzeltmeleri
Doküman görevi: "test" yerine ilgili satırlara BE için **Doğrulama** notu yazıldı (RR-F001, RR-F002, RR-F004, RR-F005, RR-F006, RR-F010, REV-F001, K10). Lint/tsc/test/build main ile aynı: lint 42 problem (14 error, main'den miras), tsc 0, 210/210 test, build başarılı.

| Bulgu ID | Durum | Commit |
|---|---|---|
| REV-F001 | Düzeltildi — ADR-0005 K9'a göre (direktif #1 geçersiz: DevOps *atandığı proje*de oluşturur/günceller, S20 "DevOps ekleyemez" yazılmadı); §4 farkı eklendi | 6e48571 |
| RR-F001 | Düzeltildi — §1 proje kilidi + kilit sırası (INV-08), parity doğrulama notu | cf07f72 |
| RR-F002 | Düzeltildi — §1, #5, #44 (INV-25 netleştirmesi), §4 farkı | a3f0d90 |
| REV-F002 | Düzeltildi — alan bazında yetki | 952e8ff |
| REV-F008 | Düzeltildi — tür başına izinli alan listesi | 1c859ce |
| REV-F003 | Düzeltildi — Admin `/integrations/channels` + proje kapsamlı uç, `boundElsewhere`, 409 maskesi, §4 | 41e916e |
| REV-F005 | Düzeltildi — Go-Live/00 DevOps/Care davranışı, S19 genişletildi, §4 | acba5db |
| RR-F012 | Düzeltildi — yalnızca aktif kullanıcı; seçim §5 S20 (açık, güvenli varsayım) | 0ef82b8 |
| REV-F004 | Düzeltildi — "(ilk değer yazımı)" kaldırıldı; #4/#13/#34/#36 §5 S21 (açık) | a5e8f07 |
| RR-F007 | Düzeltildi — ADR-0005 K10'a göre (direktif #9'un `409` varsayımı geçersiz): gerekçeli `done → in_progress`, onay/`actualEnd` temizlenir; öteki geçişler `409` | a5e8f07 |
| RR-F006 | Düzeltildi — 07 kilitli/done/tekrar çağrı, alan başına audit, §4 | fbb1ecb |
| REV-F012 | Düzeltildi — #38 tekrar çağrı `409`; §3 "02 Keşif" satırı | fbb1ecb |
| RR-F009 | Düzeltildi | 68c091d |
| REV-F006 | Düzeltildi — POST + PATCH(`active`), §4, §6 şema adları | 7de6c7f |
| RR-F003 | Düzeltildi | 2821025 |
| RR-F004 | Düzeltildi — ADR-0005 K11'e göre (direktif #14'ün bağlılık sorusu §5'e eklenmedi) | a334400 |
| RR-F005 | Düzeltildi — §2.2 kapsam dışı koruması, #8/#12/#38, §4 | c7dd7dd |
| REV-F009 | Düzeltildi — RR-F005 ile; `gonogo` kısmı RR-F008'de | c7dd7dd |
| RR-F008 | Düzeltildi — #19 ve §2.2; hedef §5 S22 (açık) | ef8b605 |
| RR-F011 | Düzeltildi | 2ae1d8b |
| RR-F010 | Düzeltildi — §1; tekil kısıtlar F1-00'da DATA_MODEL'e girmeli | 8ccc9a7 |
| REV-F007 | Düzeltildi — §1 zarf kuralı daraltıldı | 11318ee |
| REV-F010 | Düzeltildi (Low) — #13/#15/#16/#21/#39g PATCH, `:projectId`, #16 `409` | 1d06d9d |
| REV-F011 | Düzeltildi (Low) | bbb333f |
| RR-F013 | Düzeltildi (Low) | 3b39d69 |
| RR-F014 | Düzeltildi (Low) | da5dd0b |
| RR-F015 | Düzeltildi (Low) | fd1ceae |
| RR-F016 | Düzeltildi (Low) | 3dbf210 |
| RR-F017 | Düzeltildi (Low) | 9bb210b |
| ADR-0005 hizalaması | §1.1 K8/K12/RBAC Karar 9, satır yetkileri, K13 gerekçeleri, §4 satırları, §5 açık/kapanan | 14e04a1, 68cee83 |

### Round 2 (gate @ 1d8f4d2)
Doküman görevi: "test" yerine ilgili satırlara BE için **Doğrulama** notu yazıldı (RR-F018, REV-F013/RR-F020, RR-F019, RR-F021, RR-F022, REV-F014, REV-F017 (K16, K17), REV-F020, RR-F023, RR-F024). Lint/tsc/test/build main ile aynı: lint 42 problem (14 error, main'den miras), tsc 0, 210/210 test, build başarılı.

| Bulgu ID | Durum | Commit |
|---|---|---|
| RR-F018 | Düzeltildi — §1, #5, #44, §4 | 1f3a107 |
| REV-F013 / RR-F020 | Düzeltildi — #3 kapsama dönüş `locked` + akış, kurallar yeniden uygulanır; `not_started` `409` INV-25 sonucu olarak yazıldı (Murat kararı: S25 açılmadı); §1, §4 | dbfe25a |
| REV-F015 / RR-F019 | Düzeltildi — INV-28 yeni metnine göre (#3, #16); S24 §5.2'de, dayanak "INV-28 (Murat onayı, 2026-10-06)" | dd84070 |
| RR-F021 / REV-F018 | Düzeltildi — §1, #5, §4 | b8b2fdf |
| RR-F022 | Düzeltildi — #5, #38, §4; Murat kararıyla S23 açılmadı, S22'ye katıldı | 71bbdfa |
| REV-F014 | Düzeltildi — §3, §4 | bdaf926 |
| REV-F016 | Düzeltildi — S21 listesi + genel soru; #41/#43/#45/#46/#48 gerekçe sütunu | 1af4327 |
| REV-F017 | Düzeltildi — denetim notuna göre (direktif madde 8 geçersiz): S10/S13/S18 dayanağı K14/K15/K18; S15 (K16) #14 ve S17 (K17) #2c'de hedef davranış, §4 satırları; #16 ve §4'teki "`rule_review` üreten tek kural" ifadeleri kaldırıldı | 06b5c43 |
| REV-F019 | (b) Düzeltildi — `adaptation:read` (Low). (a) Düzeltilmedi — RBAC.md satırı denetim oturumunun işi (uygulama rolü RBAC.md'ye yazmaz) | 880dda4 |
| REV-F020 | Düzeltildi (Low) — #2c doğrulaması, §4 | 8de2024 |
| REV-F021 | Düzeltildi (Low) | f7941f5 |
| RR-F023 | Düzeltildi (Low) — #16, #5, §4; termin tabanı `max(startDate, bugün)`, `durationDays \|\| 1` | bd90f8c |
| RR-F024 | Düzeltildi (Low) — §1 (INV-08 round 2 eki: #14, `saas_env`; #2a; yeniden okuma; parity doğrulamaları), #39c kilit sırası | 1bacd80 |
| RR-F025 | Düzeltildi (Low) | a24fb28 |
| RR-F026 | Düzeltildi (Low) — §4'e altı satır | b9e2086 |
| REV-F022 | Düzeltilmedi — uygulama rolü dışında: merge kısmı ADR-0005 süreç notuyla karara bağlandı, CLAUDE.md/guard kısmı F0-02 (Murat) | — |
| Sürüm notu | v1.2 | 36d6630 |
