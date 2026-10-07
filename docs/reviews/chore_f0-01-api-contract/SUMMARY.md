# Gate Özeti — chore/f0-01-api-contract @ 4563ca2 (round 3)

Faz F0, yalnızca doküman görevi (`docs/API_CONTRACT.md` v1.2; kod/şema/migration yok, diff'te `docs/` dışı dosya 0). `gh` CLI kurulu değil, CI sonucu okunamadı. CI F0-07'de kurulacak, migration yok, parity uygulanmıyor; bu nedenle engel sayılmadı. Round 1 (@ d9e7644) kayıtları eb41f60'ta, round 2 (@ 1d8f4d2) kayıtları 4563ca2'de (git geçmişi).

| Gate | Karar | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| reviewer | APPROVE | 0 | 0 | 1 | 5 |
| qa-verifier | APPROVE | 0 | 0 | 0 | 1 |
| rules-reviewer | APPROVE | 0 | 0 | 1 | 4 |
| CI (app / parity / secrets) | okunamadı (`gh` yok; F0-07 öncesi, parity uygulanmaz) | — | — | — | — |

**Genel karar: MERGE'E HAZIR**

**Round 2 kapanışı.** Round 2'deki 19 bulgunun (REV-F013…F022, RR-F018…F026) hepsi kapandı. REV-F022'nin CLAUDE.md/guard kısmı Murat kararıyla F0-02'ye bırakıldı. Denetim notundaki kararların hepsi sözleşmeye yansımış ve iki denetçi tarafından tek tek doğrulanmış: ADR-0005 K14–K18, INV-28'in yeni metni, K16 eki ve INV-08 eki. §5.1'de yalnızca S20, S21 ve S22 açık. S23'ün S22'ye katılması ve S25'in INV-25 sonucu olarak yazılması tutarlı bulundu. Bu iki karar şimdilik yalnızca değişiklik notunda kayıtlı (REV-F026).

qa-verifier mekanik kontrolleri yeniden çalıştırdı:
- AC1: 51/51 işlem.
- AC2: rota ve sekme eşleşmesi tam.
- AC3: 64/64 aksiyon katalogda; `session:authenticated` RBAC.md:34'te.
- AC5: `docs/` dışı dosya 0.
- Round 2 tablosundaki 17 commit hash'inin hepsi branch'te ve bulgu ID'li.
- tsc 0 hata, 210/210 test, build başarılı. Lint 42 problem (14 error); main ile aynı, miras.

**Kalanlar (engelleyici değil).** Tek Medium bulgu var; iki denetçi aynı sorunu bağımsız olarak buldu (REV-F023 = RR-F027). Round 2'deki "kapsama dönen aşama `locked` olur" kuralı, API'de yalnızca daha önce açılmış bir aşamada tetikleniyor. Sonuç: kilitli bir aşamanın içinde açık (`pending`) adımlar kalıyor. Bu adımlar uyarı üretiyor ve iş listesinde görünüyor, ama sahipleri elle değiştiremiyor. Denetçiler iki farklı çözüm öneriyor. Seçim Murat'ın:
- **(a) reviewer önerisi:** Aşama `locked` olur, içindeki açık adımlar da `locked` olur; `activatedAt` ve `due` temizlenir.
- **(b) rules-reviewer önerisi:** `activatedAt` dolu aşama doğrudan `in_progress` olur; `activatedAt` boş aşama `locked` olur ve akışla açılır. Bu seçenek INV-25 "açılmış … tekrar kilitlenmez" ilkesiyle ve completion.ts:198-206 emsaliyle uyumlu. (a) ise spec :322 ile çelişiyor.

Merge'ü beklemesi gerekmiyor: sözleşme v1.2'de davranış tanımsız, ama kod yok. F3 (akış motoru) planından önce karara bağlanmalı. Medium ve Low bulguların hepsi BACKLOG'a girdi.

## Düzeltme direktifi

Karar MERGE'E HAZIR; aşağıdakiler **isteğe bağlı** bir takip turu içindir (bu branch'te ya da ayrı bir `chore/f0-01b-contract-followups` branch'inde). Yapılmazsa hepsi `docs/reviews/BACKLOG.md`'de kalır. Tümü `docs/API_CONTRACT.md` üzerinde yapılır; satır numaraları 4563ca2'ye göredir. Doküman görevi olduğu için "test" yerine ilgili satıra BE için **Doğrulama** notu yazılır.

### Medium
1. **[REV-F023 / RR-F027 + REV-F028b]** §1 :22, #3 :74, §4 :228 — **önce Murat kararı ((a) ya da (b), yukarıda).**
   - Karar çıkmazsa güvenli varsayım olarak (b) yazılır ve §5.1'e yeni bir S-maddesi açılır.
   - Her iki seçenekte yüklem "önceki aşama yoksa, `independent` ise ya da önceki aşama geçilmişse (`done`/`out_of_scope`)" olarak yazılır. Böylece 00 Satış Devri geri alındığında açılır (flow.ts:37 `!prev`).
   - #3'teki Doğrulama notu yeniden yazılır. Önceki ön koşul gerçekçi değil ("adımları açılmaz"), çünkü bu senaryoda adımlar zaten açık. Yeni not şu senaryoyu sınar: 03 açıkken `vpn_req` `pending` → 03 `out_of_scope` yapılır → 02 K10 ile açılır → 03 geri alınır. Beklenen sonuç: (b)'de 03 `in_progress` olur ve `vpn_req` `pending` kalır; (a)'da 03 `locked` olur, `vpn_req` `locked` olur ve uyarı üretmez. Ek olarak: 00 geri alınınca açılır.

### Low
2. **[RR-F032]** #3 :74: Aşama `out_of_scope` yapılınca açık `phase_approval` aksiyonu `cancelled` olur (`Otomatik kural:`). §4'e satır eklenir. Doğrulama: hazır aşama `out_of_scope` yapılınca aksiyon `cancelled` olur.
3. **[RR-F029]** #5 :76: Projede `goLiveApproval` varken `customer_approval`'ın elle `done`'dan çıkışı `409` döner. Doğrulama: #38 → 07 K10 ile açılır → PATCH `pending` → 409.
4. **[RR-F030]** #5 :76, §1 :22: `out_of_scope → in_progress` isteğinin sonuç durumu açıkça yazılır: adım açılırsa istenen `in_progress` mi uygulanır, yoksa `pending` mi açılır.
5. **[RR-F028]** #14 :85: 07 `done` iken `409`'un 05'in durumundan bağımsız olup olmadığı tek cümleyle yazılır. Doğrulamaya "05 `out_of_scope` + 07 `done`" eklenir.
6. **[REV-F025]** §1 :12: `401 UNAUTHENTICATED` eklenir: oturum yok, süresi dolmuş ya da pasif kullanıcı (`session:public` uçları hariç). :158'e oturumsuz `GET /auth/me` yanıtı yazılır.
7. **[REV-F024]** §1.1 :58: "RBAC.md satırı" sütunu "Oturumlu, kaynağa bağlı olmayan uçlar" yapılır.
8. **[REV-F028a]** :17: "(#3 `done → in_progress`, #16 K2, #14 K16), adım durumunu…" (virgül ve K16).
9. **[QA3-F001]** Değişiklik notu: REV-F019 (a) satırı "Denetim oturumunda yapıldı (4563ca2)" olarak, AC5 satırı denetim commit'lerine 4563ca2 eklenerek güncellenir.

### Uygulama rolü dışında (denetim oturumu / Murat)
- **REV-F023 / RR-F027 seçimi:** Murat kararı. ADR-0005'e K19 olarak yazılır.
- **[REV-F026 / RR-F031] ADR ve spec hizalaması:**
  - ADR-0005 :142: "S23 güvenli varsayımı" → "açık taahhüt kontrolü mockup davranışı (store.tsx:517-518); elle `commit_check` kuralı §5 S22".
  - ADR-0005 "Açık kalanlar" (:235, :237) §5.1 S20–S22 ile hizalanır (S22: `gonogo`, `customer_approval`, `commit_check`; S21: 8 geçiş).
  - S23 → S22 ve S25 kararları Murat onayıyla ADR-0005'e birer satır olarak eklenir.
  - BACKLOG'daki "F0-01 fix (S23)" ifadesi güncellenir.
- **[REV-F027 / RR-F031] PRODUCT_SPEC ve ADR-0004:**
  - PRODUCT_SPEC :166 ve ADR-0004 :37'deki "öncesindeki zorunlu adımlar tamamsa" ifadesi INV-28 / akış motoru kuralına göre düzeltilir.
  - Spec'e K16 tetiği (05'e takım ekleme aşamayı yeniden açar) ve K17 (CSM değişince açık işlerin aktarımı) eklenir.
  - İsteğe bağlı: :172'ye "'Başlamadı' elle seçilemez (API)" notu.
- **Açık sorular (Murat; F3/F5/F6 planlarından önce):**
  - Canlı projede (07 `done`) K2 kurulum tipi değişikliği 03'ü yeniden açıyor; K16'daki 409 koruması K2 için yok. Bilinçli mi?
  - "Onaysız Go-Live" yolu: `customer_approval` `out_of_scope` yapılabiliyor, `gonogo` `out_of_scope` iken #38 hep 409 dönüyor. S22'de açıkça kabul edilecek mi?
  - Kapsam dışı aşamanın açık adımları iş sayılmaya devam ediyor (alerts.ts:50, 61). INV-25 "iş sayılmaz" kapsamı F6 öncesinde netleşmeli. Bu, REV-F023'ün ters yönü; aynı kararla tanımlanabilir.
  - Kapsama dönen 03 `locked` olunca 04 açık kalıyor. F3-02 planında bilinçli tercih olarak yazılmalı.
  - `customer_approval` "`out_of_scope` serbest" kuralı ile RR-F018 (done aşama 409) arasındaki öncelik → F5-05 planı.
  - Round 2'den devam: öneri sonrası tür kapatma/hedef değişimi; #32/#43 `ON CONFLICT` ve kısmi index pg-mem desteği (F1-00); `step_update.ownerId` onayı (F8-03).
- **Kit:** `docs/agents/reviewer.md:8, :23` "INV-01…27" → INV-28; AGENTS.md:29 "state v8 / 52 işlem" → state v11 / 51 işlem.

Her düzeltmeyi ayrı commit'te, mesajında bulgu ID'si ile yap. Bitince lint/typecheck/test/build çalıştır, değişiklik notundaki 'Review düzeltmeleri' tablosunu güncelle ve push et.
