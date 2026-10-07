## reviewer — chore/f0-01-api-contract @ 4563ca2 (round 3)
**Karar:** APPROVE

Round 2'deki 10 reviewer bulgusunun (REV-F013…REV-F022) hepsi kapandı. REV-F022'nin CLAUDE.md/guard kısmı Murat kararıyla F0-02'ye bırakıldı. Denetim notundaki ADR-0005 K14–K18, INV-28'in yeni metni, K16 eki ve INV-08 eki sözleşmeye doğru yansımış. Round 3'te Critical ya da High bulgu yok. Bir Medium (REV-F023) ve beş Low var:
- **REV-F023 (Medium):** REV-F013 düzeltmesinin yan etkisi. Önceden açılmış bir aşama yeniden `locked` olabiliyor. Bu durumda aşamanın içindeki açık adımlar için kural tanımsız.
- **Low'lar:** Üçü uygulama rolüne ait sözleşme metni düzeltmeleri (REV-F024, REV-F025, REV-F028). İkisi denetim rolüne ait doküman tutarlılığı işleri (REV-F026, REV-F027).

**Bağlam**
- **CI:** okunamadı (`gh` kurulu değil). CI F0-07'de kurulacak. Faz F0, yalnızca doküman görevi; migration yok, parity uygulanmıyor. CI engel sayılmadı.
- **Satır numaraları:** aksi belirtilmedikçe `docs/API_CONTRACT.md` @ 4563ca2 içindir. İnceleme dizini: `/Users/murat/Development/rabbitqajourney/.verify/chore_f0-01-api-contract`.
- **AC5 (yalnızca `docs/`):** `docs/` dışında değişen dosya 0 (`git diff origin/main...HEAD -- . ':!docs'` boş).
- **Commit sınırları:**
  - Uygulama rolünün round 3 commit'leri (1f3a107…fcc509e) yalnızca `docs/API_CONTRACT.md` ve değişiklik notuna dokunuyor.
  - RBAC.md, INVARIANTS.md, ADR ve reviews değişiklikleri yalnızca denetim commit'lerinde: 4ee47d4, f5a29a6, 9a2268b, eb41f60, 4563ca2.
- **Commit hash kontrolü (görev 5):** değişiklik notundaki tüm hash'ler branch'te.
  - Round 1: 27 hash + 4ee47d4.
  - Round 2: 16 hash.
  - `fix:` commit'lerinin hepsinin mesajında bulgu ID'si var. Örnekler: dbfe25a `[REV-F013] [RR-F020]`, dd84070 `[REV-F015] [RR-F019]`, 880dda4 `[REV-F019]`, f7941f5 `[REV-F021]`.
  - ID'siz olanlar yalnızca 36d6630 (sürüm notu) ve fcc509e (değişiklik notu). İkisi de düzeltme değil, ID'siz olmaları kabul edilebilir.
- **Denetim notu uyumu (görev 1):**
  - **K14/K15/K18:** S10 :282, S13 :285, S18 :290. Dayanak "Murat onayı, ADR-0005 K14/K15/K18 (2026-10-06)", §5.2'de. Direktif madde 8 yerine ADR-0005:253-259 uygulanmış. Doğru.
  - **K16:**
    - #14 :85: 05 `done` → INV-28 (c), `rule_review` yok, 07 `done` → `409`, 05 `out_of_scope` → mockup gibi, proje kilidi.
    - Ayrıca §4 :221 ve S15 :287'ye yansımış.
    - "`rule_review` üreten tek kural" ifadesi kalmamış (grep). :87 ve :220'de "API'de hiçbir kural `rule_review` üretmez" yazıyor.
  - **K17:** #2c :71 (açık = `done`/`cancelled` değil, kayıt başına audit, aynı transaction), §4 :222, S17 :289.
  - **INV-28 yeni metni:**
    - "done kalır" kapsamı #3 :74 ve #16 :87'de INVARIANTS.md:36 ile kelimesi kelimesine uyumlu: `activatedAt` doluysa `pending` ve eski `due`, boşsa `locked`.
    - K11 yüklemi #16 :87 ve §4 :220'de: `previousStep`, `max(startDate, bugün)`, `durationDays || 1`. flow.ts:15-19, :50, :61 ile birebir.
    - S24 §5.2 :292'de, dayanak "INV-28 (Murat onayı, 2026-10-06)".
  - **INV-08 eki:**
    - §1 :17 kilit listesinde #14 `addTeam` ve #16 `saas_env` var.
    - :18'de `completePhase(05) ∥ addTeam` doğrulaması var.
    - INVARIANTS.md:16 ile tutarlı.
- **S23/S25 kararları (görev 2):**
  - §5.1 :266-268'de yalnızca S20, S21 ve S22 açık. :261 numara notu doğru.
  - **S23 → S22:** Taşınan madde (RR-F022) kapanmadı. S22'nin (açık) içinde güvenli varsayımla duruyor (:268, #5 :76, #38 :109, §4 :231). Yani onaysız "kapandı" yok; bu yalnızca numaralandırma kararı. ADR-0005 "Açık kalanlar" maddeleriyle (:235-238) içerik olarak çelişmiyor. Kalan atıflar REV-F026'da.
  - **S25:** `not_started` `409` (#3 :74, §1 :22, §4 :228) INV-25 "adım/aşama yalnızca akış motoru açar" kuralıyla tutarlı. Mockup kodunu da kontrol ettim:
    - Akış motoru aşamayı `not_started` değil, `in_progress` açıyor (flow.ts:38).
    - `not_started` yalnızca elle seçimle oluşuyor (store.tsx:236-245; `not_started`'ı başka yazan yer yok).
    - Dolayısıyla API'de enum değeri erişilemez kalıyor ama silinmiyor. Bu, enum kuralına uygun.
- **REV-F019a (görev 4):** RBAC.md:34'teki "Oturumlu, kaynağa bağlı olmayan uçlar (`GET /auth/me`, `POST /auth/logout`; `session:authenticated`)" satırı ve :4'teki "✔ (oturumlu) = geçerli oturumu olan her aktif kullanıcı" tanımı sözleşmeyle eşleşiyor: §1.1 :58, §2.3 :149 (logout), §3 :158-159 (`/auth/me`). Uçlar, aksiyon adı ve "aktif kullanıcı" kapsamı aynı. Tek kopukluk: kataloğun "RBAC.md satırı" sütunu hâlâ "—" diyor (REV-F024).
- **Mockup referansları doğrulandı:**
  - flow.ts:37: aşama açma koşulu `!prev || independent || isPassed(prev)`. §1 :22 ve #3 :74 bununla uyumlu; yalnızca "önceki aşama yok" durumu yazılmamış (REV-F028).
  - store.tsx:517-518: #38'deki açık taahhüt `409` kontrolü mockup davranışı.
  - alerts.ts:50-52: adım gecikme uyarısı aşama durumuna bakmıyor (REV-F023'ün dayanağı).

### Round 2 bulgularının kapanışı
| ID | Önem (R2) | Durum | Kanıt (commit → satır @ 4563ca2) |
|---|---|---|---|
| REV-F013 | High | Kapandı | dbfe25a → §1 :22 (adım/aşama kilit ayrımı), #3 :74 (`out_of_scope → in_progress` = `locked` + akış, proje kilidi altında; `applyInstallType`/`applyLlmChoice` yeniden uygulanır; `not_started` `409`; doğrulama notu), §4 :228. Akış koşulu flow.ts:37 ile uyumlu. Yan etki: REV-F023 |
| REV-F014 | Medium | Kapandı | bdaf926 → :177 (yalnızca bağlı olmayan kanallar ve bu projeye bağlı kanal; doğrulama: tek projeli Care), §4 :254. #43 :121'deki 409 maskesi korunmuş |
| REV-F015 | Medium | Kapandı | dd84070 → #3 :74, #16 :87, S24 §5.2 :292. INVARIANTS.md:36 INV-28 "done kalır" kapsamıyla birebir (eski `due` dahil) |
| REV-F016 | Medium | Kapandı | 1af4327 → S21 :267 (8 geçiş + genel soru). Gerekçe sütunlarında "— (§5 S21)": #41 :119, #43 :121, #45 :123, #46 :124, #48 :126 |
| REV-F017 | Medium | Kapandı (ADR-0005 "Round 2 — API_CONTRACT'a yansıtılacaklar"a göre; direktif madde 8 geçersiz) | 06b5c43 → S10 :282, S13 :285, S15 :287, S17 :289, S18 :290, :295. #14 :85, #2c :71, #7 :78, #12 :83, §4 :221-222 |
| REV-F018 | Low | Kapandı | b8b2fdf → §1 :22, #5 :76 (`locked` + akış; açılmazsa `409`, transaction geri alınır), §4 :227 |
| REV-F019 | Low | Kapandı | (a) 4563ca2 → RBAC.md:4, :34 (denetim). (b) 880dda4 → :46 `adaptation:read`, :186. Kalan küçük kopukluk: REV-F024 |
| REV-F020 | Low | Kapandı | 8de2024 → #2c :71 (`null` → `400`, pasif ya da `csm` dışı rol → `409`), §4 :245 |
| REV-F021 | Low | Kapandı | f7941f5 → değişiklik notu :16 ("v1: 19 nokta; v1.1 ve v1.2: 3 açık"), :34 (AC5). Not: 4563ca2 bu satırdan sonra geldiği için AC5 listesinde yok; engel değil |
| REV-F022 | Low | Kapandı (bu branch kapsamı) | ADR-0005:261-262: merge bağımlılığını Murat kabul etti. CLAUDE.md:24 ve guard PRODUCT_SPEC kısmı F0-02'de; BACKLOG.md'deki REV-F022 satırında kayıtlı |

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-F023 | Medium | INV-25 ("kilitli adım iş sayılmaz", "aşaması kilitli adımın durumu elle değişmez"), REV-F013 düzeltmesinin yan etkisi | docs/API_CONTRACT.md:74 (#3 kapsama dönüş + doğrulama "03 `locked` kalır ve adımları açılmaz"), :22; src/lib/rabbitqa/flow.ts:37-38, :52; src/lib/rabbitqa/alerts.ts:50-52 | **Neden yeni:** Round 3 öncesinde akış motoru aşamayı yeniden kilitlemediği için `locked` bir aşamanın adımları hep `locked` idi. Şimdi `out_of_scope → in_progress` isteği önceden açılmış bir aşamayı `locked` yapıyor. Aşama `out_of_scope` yapılabilmek için önce açık olmak zorunda (kilitli aşama `409`), bu yüzden akış motoru o sırada ilk/bağımsız adımlarını zaten `pending` yapmıştır.<br>**Senaryo:** 02 `done` → 03 açılır, `vpn_req` `pending` olur → 03 gerekçeyle `out_of_scope` yapılır → 02 K10 ile yeniden açılır → CSM 03'ü `in_progress` ister → 03 `locked` olur. Bu noktada:<br>• `vpn_req` hâlâ `pending` ve terminli.<br>• Gecikme ve "termin yaklaşıyor" uyarıları üretiyor (alerts.ts:50-52 aşamaya bakmıyor) ve Bana Atananlar'da iş olarak görünüyor.<br>• Sahibi durumu değiştiremiyor: §1 :22, aşaması kilitli adım → `409 "Aşamanın sırası gelmedi"`.<br>• #3'teki doğrulama notu ("adımları açılmaz") gerçekçi ön koşulda yanlış beklenti veriyor.<br>Sözleşme, aşama `out_of_scope` ya da yeniden `locked` olduğunda içindeki açık adımlara ne olacağını hiç tanımlamıyor. | #3'e kural ekle. Öneri, K11 ve INV-25'teki "kapsam dışından dönüş yeni bir kapsama giriştir" ilkesiyle aynı:<br>• Aşama kapsama dönüşte `locked` olurken içindeki açık (`pending`/`in_progress`) adımlar da `locked` olur; `activatedAt` ve `due` temizlenir, audit'lenir.<br>• `done` ve `out_of_scope` adımlar olduğu gibi kalır.<br>• Aşama açılınca akış motoru adımları normal kuralıyla açar.<br>Alternatif: "aşaması `locked`/`out_of_scope` olan açık adım iş sayılmaz" (uyarı ve iş listesi dışı). Hangisinin seçileceği akış motoru kararı; rules-reviewer teyidi gerekir, gerekirse §5'te güvenli varsayımla açılır.<br>Doğrulama notunu düzelt: "03 `locked` kalır; önceden açılmış `pending` adımları `locked` olur, uyarı üretmez". |
| REV-F024 | Low | AC3, RBAC.md:34 | docs/API_CONTRACT.md:58 | 4563ca2 ile RBAC.md'ye `session:authenticated` satırı eklendi. Ancak §1.1 kataloğunun "RBAC.md satırı" sütunu hâlâ "— (oturum gerektiren, kaynağa bağlı olmayan uçlar)" diyor. `packages/shared/rbac` matrisi bu iki dokümandan üretilecek; eşleme sözleşme tarafında kopuk görünüyor. | :58'deki sütunu "Oturumlu, kaynağa bağlı olmayan uçlar (RBAC.md)" yap (uygulama rolü). |
| REV-F025 | Low | INV-16, INV-17, RBAC.md:4 "✔ (oturumlu)" | docs/API_CONTRACT.md:12, :58, :158 | Hata kodu listesinde (:12) kimliksiz istek için kod yok (`401` hiç geçmiyor; grep boş). `session:authenticated` ve tüm proje uçları oturumsuz istekte ne dönecek, tanımsız. :158'de `/login` ekranı `GET /auth/me`'yi "oturum varsa yönlendirme" için çağırıyor; oturumsuz yanıt bu akışın parçası. F1-01 `403` ile `401` arasında seçim yapmak zorunda kalır. Etkisi: FE `http` adaptörünün oturum düşmesini 403'ten ayırt edememesi. | §1 :12'ye `401 UNAUTHENTICATED` ekle: oturum yok, süresi dolmuş ya da pasif kullanıcı (`session:public` uçları hariç). `/auth/me` için oturumsuz yanıtı yaz (uygulama rolü). |
| REV-F026 | Low | İzlenebilirlik (ADR ↔ §5) | docs/adr/0005-f0-01-contract-decisions.md:142, :235, :237; docs/reviews/BACKLOG.md:253; docs/changes/chore_f0-01-api-contract.md:23 | S23 ve S25 kararı yalnızca uygulama rolünün yazdığı değişiklik notunda (:23) "Murat kararı" olarak kayıtlı. ADR ve SUMMARY bunu bilmiyor:<br>• ADR-0005:142 (K14) "#38'de … (S23 güvenli varsayımı)" diyor. S23 yok (:261). Ayrıca #38'deki açık taahhüt kontrolü varsayım değil, mockup davranışı (store.tsx:517-518).<br>• ADR "Açık kalanlar" listesi §5.1'den dar: :235 yalnızca `gonogo`'yu sayıyor, S22 artık `customer_approval` ve `commit_check`'i de kapsıyor; :237 dört geçiş sayıyor, S21 sekiz.<br>• BACKLOG.md:253 "F0-01 fix (S23)" diyor. | Denetim: ADR-0005:142'yi "#38'deki açık taahhüt kontrolü (mockup davranışı; elle `commit_check` kuralı §5 S22)" yap. "Açık kalanlar"ı §5.1 S20–S22 ile hizala. S23→S22 ve S25 kararını Murat onayıyla ADR-0005'e ya da SUMMARY denetim notuna bir satırla ekle. BACKLOG:253'ü güncelle. |
| REV-F027 | Low | PRODUCT_SPEC tek doğruluk kaynağı (AGENTS.md:10), INV-28, ADR-0005 K11 netleştirmesi, K16, K17 | docs/PRODUCT_SPEC.md:166, :172 | :166 "öncesindeki zorunlu adımlar tamamsa hemen" diyor. INV-28 (INVARIANTS.md:36) ve K11 netleştirmesi (ADR-0005:87) ise "önceki, `out_of_scope` olmayan en yakın adım (zorunlu olsun olmasın) `done`" diyor. Senaryo: öndeki zorunlu olmayan adım açıkken spec "aç" der, INV-28 "`locked` kalır" der. Spec ayrıca K16 (05'e takım ekleme yeniden açar) ve K17 (CSM değişince açık işlerin aktarımı) hedeflerini içermiyor. | Denetim: :166'yı INV-28 metnine göre düzelt, K16 tetiğini ekle. K17'yi CSM ataması bölümüne ekle. İsteğe bağlı: :172'ye "'Başlamadı' elle seçilemez (API)" notu. |
| REV-F028 | Low | Metin doğruluğu | docs/API_CONTRACT.md:17, :22, :74 | (a) :17: "aşama yeniden açma (#3 `done → in_progress`, #16 K2) adım durumunu…" ifadesinde virgül eksik. Parantez K16'yı (#14) yeniden açma olarak saymıyor; #14 aynı cümlede "adım ekleyen yazmalar" altında geçiyor, anlam kaybı yok ama okuması zor. (b) :22 ve :74: aşama açma koşulu "önceki aşama geçilmişse ya da `independent` ise" olarak yazılmış. flow.ts:37'deki "önceki aşama yoksa" (00) dalı eksik; 00 `out_of_scope`'tan dönerse metne göre `locked` kalır, koda göre açılır. | (a) "…#16 K2, #14 K16), adım durumunu…" yap. (b) "önceki aşama yoksa, geçilmişse (`done`/`out_of_scope`) ya da aşama `independent` ise" yap (uygulama rolü). |

### Düzeltme direktifi
APPROVE: Medium ve Low bulgular `docs/reviews/BACKLOG.md`'ye girer. Bu turda yapılırsa:
1. **REV-F023 (Medium)** — `docs/API_CONTRACT.md` #3 :74, §1 :22:
   - Kapsama dönen aşama `locked` olurken içindeki açık (`pending`/`in_progress`) adımlar da `locked` olur; `activatedAt` ve `due` temizlenir, audit'lenir.
   - `done` ve `out_of_scope` adımlar değişmez. Aşama açılınca adımları akış motoru açar.
   - Seçim rules-reviewer ve Murat ile teyit edilecek; karar çıkmazsa §5'e güvenli varsayımla yazılır.
   - Doğrulama notu: "02 açıkken 03 `out_of_scope → in_progress` → 03 `locked`; önceden `pending` olan 03 adımı `locked` olur, gecikme uyarısı ve Bana Atananlar'da kaydı oluşmaz; 02 geçilince adımlar akışla, yeni iş günü termini ile açılır."
2. **REV-F024** — :58'deki "RBAC.md satırı" sütunu → "Oturumlu, kaynağa bağlı olmayan uçlar".
3. **REV-F025** — §1 :12'ye `401 UNAUTHENTICATED` eklenir (oturum yok, süresi dolmuş ya da pasif kullanıcı; `session:public` hariç). :158'e oturumsuz `/auth/me` yanıtı yazılır.
4. **REV-F028** — :17 virgül ve #14 K16. :22 ve :74'te "önceki aşama yoksa" dalı.
5. **Denetim oturumu (uygulama rolü dışında):** REV-F026 (ADR-0005:142, :235, :237; BACKLOG:253; S23/S25 kararının kaydı) ve REV-F027 (PRODUCT_SPEC.md:166, K16/K17).

### Açık sorular / öneriler (engelleyici değil)
- REV-F023 rules-reviewer'ın alanıyla örtüşüyor (akış motoru). Tersi yön de mockup'tan beri tanımsız: aşama `in_progress → out_of_scope` olunca içindeki açık adımlar iş sayılmaya devam ediyor (alerts.ts:50-52). Bu yön de aynı kararla tanımlanmalı.
- Akış tarafında: önceden açılmış bir aşama (03) kapsama dönüşte `locked` olunca, onun `out_of_scope` olmasıyla açılmış sonraki aşama (04) açık kalıyor. Bu, "açılmış aşama tekrar kilitlenmez" ilkesiyle tutarlı, ama F3-02 planında bilinçli tercih olarak yazılmalı.
- #5 :76'da `customer_approval` için "`out_of_scope` serbest" kuralı ile RR-F018 kuralı ("aşaması `done` olan adımda elle değişiklik `409`") arasındaki öncelik yazılmamış. 07 `done` ise `409` beklenir; F5-05 planında netleştirilsin.
- Değişiklik notu AC5 satırı (:34) denetim commit'i 4563ca2'yi (RBAC.md) saymıyor. Commit nottan sonra geldiği için doğal; bir sonraki `/fix` turunda eklenebilir.
- Önceki turdan devam edenler: `docs/agents/reviewer.md:8` ve :23 hâlâ "INV-01…27" diyor (INV-28 var); AGENTS.md:29 "state v8 / 52 işlem" eskimiş. İkisi de BACKLOG'da, denetim/Murat işi.

| Severity | Sayı |
|---|---|
| Critical | 0 |
| High | 0 |
| Medium | 1 |
| Low | 5 |
