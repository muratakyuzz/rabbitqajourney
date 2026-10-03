# M-09 — Adım tamamlama motoru ve aşama çalışma alanları (demo, uygulama oturumu)

**Durum:** Onaylandı (Murat, 2026-10-03) · uygulanmadı
**Spec referansı:** `docs/PRODUCT_SPEC.md` → Ek B.2
**Sıra:** M-09a → M-09b → M-09c; her biri ayrı PR, bir öncekinin merge'ünden sonra. Ardından M-06 dondurma.
**Gate:** reviewer (**demo modu**) + qa-verifier (**demo modu**, tarayıcı kontrolü zorunlu); M-09a ve M-09c'de rules-reviewer (adım tamamlama ve akış kuralları).

## Tasarım kararları
- Adımların tamamlanma tipi kodda sabit: **veri** (alan dolunca kendiliğinden), **toplantı** (o türde "Yapıldı" toplantı kaydedilince), **elle**. Veri/toplantı adımı elle "Tamamlandı" yapılamaz. Admin'de form–adım eşleme ekranı yok.
- Toplantı adımında yön: toplantı kaydedilir → adım tamamlanır (tersi değil; boş toplantı kaydı oluşmasın).
- Aşama kartı = aşama çalışma alanı: aşamaya veya eksik adıma tıklayınca form sağ panelde açılır, eksik alan vurgulanır.
- Satış Devri: CSM, satışçı, lisans, modüller, **kurulum tipi + LLM** (Kick-off'tan taşındı, "Henüz belli değil" seçeneğiyle; değişince kurallar yeniden çalışır), taahhütler (**"Taahhüt yok"** seçeneği), teklif/sözleşme (Dokümanlar'a yazar), Satış devri toplantısı (= eski Internal brif).
- Kick-off: form yok; toplantı + gereksinim dokümanı (On-prem) + sunum paylaşımı adımları.
- Keşif: sekme kalır, aynı bileşen aşama panelinde de açılır. Takım tanımlamak zorunlu değil.
- Kurulum: sekme "Erişim bilgileri" olur (adım listesi aşamada).
- Eğitim: session = Eğitim türünde toplantı; sekme kalkar.
- Uyarlama: takım başına tek adım + 5 maddelik kontrol listesi (durumsuz) + Uyarlama türünde toplantılar (takım alanıyla); sekme kalkar. Takım yoksa tek genel adım.
- Uyarılar: sekme kalkar; proje başlığında rozet + panel, satırlarda ikon.
- Destek kayıtları: Faz 2, sekme pasif. Go-Live ve Süreklilik sonra değerlendirilecek.
- Son sekme listesi (13): Aşamalar ve adımlar · Aksiyonlar · Toplantılar · Keşif ve takımlar · Erişim bilgileri · Dokümanlar · Riskler ve kararlar · Go-Live · Süreklilik · Entegrasyonlar · Müşteri kişileri · Müşteri geçmişi · Destek kayıtları (pasif).

---

## §0 Bağlam — her Uygulama görev metninin başına ekleyin
```
BAĞLAM — RabbitQA Onboarding Tracker (Faz M, demo uygulama)
- AGENTS.md'yi oku (özellikle "Demo kuralları" bölümü).
- Uygulama hâlâ DEMO: backend, veritabanı, Supabase ekleme. Tüm veri src/lib/rabbitqa/ altındaki store (RqProvider/useRq) ve seed'de.
- Her veri değişikliği store fonksiyonu üzerinden yapılır ve audit kaydı üretir. Bileşende state'i doğrudan değiştirme.
- Kurulum tipi / LLM değişikliği, tarih ve durum değişikliği, uyarı kapatma/ertelemede gerekçe zorunlu (mevcut gerekçe diyaloğunu kullan).
- Mevcut enum değerlerini değiştirme veya yeniden adlandırma; yalnızca yeni değer ekle. types.ts'te model değişirse state version'ını bir artır ve store KEY'ini aynı sürüme çek (eski kayıt bulunursa seed yeniden yüklensin).
- Adım/aşama aktifleştirme yalnızca flow.ts (advanceFlow); adım tamamlama yalnızca completion.ts (applyStepCompletion; M-09a ile gelir). "Açık adım" filtresi için isOpenStep. Kilitli adım iş sayılmaz.
- Çalışma alanları M-09b'deki PHASE_WORKSPACES / PhaseWorkspaceSheet altyapısıyla eklenir.
- Yetki kontrolleri yalnızca perm.ts'te; bileşende rol karşılaştırması yazma.
- Yeni npm paketi ekleme.
- Arayüz tamamen Türkçe; tarih biçimi gg.aa.yyyy; mevcut AppShell, tema token'ları ve shadcn bileşenlerini (Sheet dahil) kullan.
- Dokunma: AGENTS.md, CLAUDE.md, docs/, .claude/, .github/, .mcp.json.
- Yazmaya başlamadan önce oku: src/lib/rabbitqa/ altındaki tüm dosyalar, src/pages/ProjectDetail.tsx ve sekme dosyaları (src/pages/project/), src/pages/Admin.tsx, rapor ekranları. Bu metindeki alan/fonksiyon adları tahminidir; koddaki gerçek adları kullan ve farkı PR'da "Eşleme" başlığında yaz.
- Emin olmadığın iş kuralını tahmin etme; PR'da "Açık sorular" altına yaz.

TESLİM
- Tek PR. Bitirmeden önce çalıştır ve çıktı özetini PR'a yapıştır: npm run lint && npx tsc --noEmit && npm test && npm run build. Lint hata sayısı mevcut durumdan artmasın.
- PR açıklaması: Ne değişti · Eşleme (metindeki ad → koddaki ad) · Kaldırılan/taşınan alanların kullanım yerleri · Kabul kriteri ↔ nasıl doğrulandı tablosu · Açık sorular.
```

---

## M-09a — Adım tamamlama motoru (veri / toplantı / elle)
**Branch:** `feat/m09a-step-completion`

```
[§0 BAĞLAM]

AMAÇ
Bugün adımlar elle işaretlenen bir checklist; formlardaki veriyle bağları yok (adım "Tamamlandı" ama form boş olabiliyor). Bu PR'da her adıma kodda sabit bir tamamlanma tipi veriyoruz. Veri ve toplantı adımları, veri girilince kendiliğinden tamamlanır ve elle "Tamamlandı" yapılamaz. Sekme yapısı bu PR'da DEĞİŞMEZ (M-09b ve M-09c yapacak); uygulama bu PR sonunda tamamen çalışır durumda olmalı.

1) VERİ MODELİ (types.ts, labels.ts)
- StepTpl ve Step'e:
  completion: "manual" | "data" | "meeting"   (varsayılan "manual")
  meetingType?: MeetingType                    (yalnızca completion "meeting" ise)
  Mevcut `key` alanı veri adımlarında koşul anahtarı olarak kullanılır.
- Meeting'e:
  status: "planned" | "held" | "cancelled"     (mevcut kayıtlar "held")
  teamId?: string | null                        (Uyarlama toplantıları için; bu PR'da yalnızca alan + form)
- MeetingType'a eksik olanları ekle: Satış devri, Kick-off, Keşif, DevOps devri, Eğitim, Uyarlama. Koddaki mevcut "Internal brif" türünün değerini değiştirme, etiketini "Satış devri" yap. Mevcut türleri yeniden kullan.
- Project'e: noCommitments: boolean (varsayılan false).
- Kurulum tipi ve LLM için "Henüz belli değil" = null (enum değişmez). Bir değer seçildikten sonra tekrar null yapılamaz.
- labels.ts: COMPLETION_LABEL = { manual: "Elle", data: "Veriyle", meeting: "Toplantıyla" }, MEETING_STATUS_LABEL = { planned: "Planlandı", held: "Yapıldı", cancelled: "İptal" }.

2) KOŞUL KATALOĞU — yeni saf dosya src/lib/rabbitqa/completion.ts
- STEP_CONDITIONS: Record<string, { label: string; check(state, projectId): { met: boolean; missing: { field: string; label: string }[] } }>
  missing: eksik alanların form anahtarı ve Türkçe adı. M-09b, formda bu alanı vurgulamak için `field`'ı kullanacak.
- Koşullar (key → koşul):
  csm            → projede CSM atanmış
  sales_license  → satışçı seçili VE lisans modeli boş değil
  modules        → satın alınan modüllerden en az biri seçili
  commitments    → en az bir taahhüt VAR veya noCommitments = true
  install_llm    → kurulum tipi null değil VE LLM tercihi null değil
  offer          → projede "teklif" türünde doküman var
  contract       → projede "sözleşme" türünde doküman var
  discovery_form → zorunlu keşif sorularının hepsi cevaplı
  teams          → en az bir takım
  kpi            → başlangıç ve hedef değeri dolu en az bir KPI
  vpn_info       → projede VPN türünde erişim bilgisi var
- Toplantı adımı koşulu (key gerekmez): projede meetingType'ı adımınkiyle aynı ve status "held" olan en az bir toplantı.
- stepConditionResult(state, step) yardımcı fonksiyonu: tipine göre { met, missing } döndürür (UI bunu kullanacak).
- applyStepCompletion(state, projectId, mkAudit, now): RqState — saf ve idempotent:
  a) completion "data" | "meeting" olan ve status done / out_of_scope OLMAYAN adımda koşul sağlanıyorsa → status "done" (kilitli adım da doğrudan done olabilir; akış oradan devam eder).
     Audit reason: "Otomatik kural: veri tamamlandı — <koşul etiketi>" veya "Otomatik kural: <tür> toplantısı kaydedildi".
  b) status "done" olan veri/toplantı adımında koşul artık sağlanmıyorsa VE adımın aşaması "done" değilse → activatedAt doluysa "pending" (due boşsa bugün + durationDays iş günü), değilse "locked" (due null).
     Audit reason: "Otomatik kural: veri eksildi — <koşul etiketi>". Aşama "done" ise adıma dokunma.
  c) out_of_scope adımlara hiç dokunma.
- Store'da advanceFlow'un çağrıldığı tek yerde, advanceFlow'dan ÖNCE applyStepCompletion çalışsın; ikisi değişiklik kalmayana kadar sırayla tekrar etsin (en fazla 5 tur).

3) STORE
- updateStep: completion "data" veya "meeting" olan adımda status'u elle "done"a çevirmek ya da "done"dan başka bir değere çevirmek hata döndürsün: "Bu adım veriyle tamamlanır". "Kapsam dışı" yapmak ve kapsam dışından geri almak serbest (mevcut gerekçe kuralıyla).
- setNoCommitments(projectId, value) — audit'li. Taahhüt eklenince noCommitments otomatik false olsun (audit'li).
- addMeeting status ve teamId alsın. updateMeeting(id, changes) Planlandı → Yapıldı / İptal geçişini desteklesin (audit'li).
- addMeeting'e bağlı mevcut kurallar (DevOps devri vb.) yalnızca status "held" olan toplantıda çalışsın; Planlandı → Yapıldı geçişinde de çalışsın.
- Kurulum tipi / LLM: null'dan bir değere geçiş gerekçesiz; bir değerden başka değere geçiş gerekçeli. applyInstallType / applyLlmChoice null değer için çalışmasın.

4) ŞABLON (seed.ts PHASE_TEMPLATE) — mevcut sıra, bağlılık ve süreler korunur; yalnızca aşağıdakiler değişir:
00 Satış Devri:
  CSM ataması                              → data, key csm (ownerRole manager kalır)
  Satışçı ve lisans modelinin girilmesi    → data, key sales_license
  Satın alınan modüllerin girilmesi        → data, key modules
  Taahhütlerin girilmesi                   → data, key commitments
  YENİ: Kurulum tipi ve LLM tercihinin girilmesi → data, key install_llm, bağımsız, 2 iş günü, zorunlu (Taahhütler'den hemen sonra)
  "Internal brif toplantısı"               → başlık "Satış devri toplantısı", meeting, meetingType Satış devri
  Teklif dokümanının yüklenmesi            → data, key offer
  Müşteri sözleşmesinin yüklenmesi         → data, key contract
01 Kick-off:
  Kick-off toplantısı                      → meeting, Kick-off
  "Kurulum tipi seçimi" ve "LLM tercihinin girilmesi" adımları KALDIRILIR (00'a taşındı). Bu adımları key ile (install_type, llm) arayan kural/uyarı/rapor/ai-mock kodu varsa install_llm'e yönlendir; kullanım yerlerini PR'da listele.
  Kurulum gereksinim dokümanının paylaşılması → manual (On-prem/SaaS kuralları aynen)
  Onboarding sunumunun paylaşılması        → manual
02 Keşif:
  Keşif toplantısı                         → meeting, Keşif
  Keşif formunun doldurulması              → data, key discovery_form
  Takım listesinin tanımlanması            → data, key teams, required: false
  KPI tanımı                               → data, key kpi
03 Kurulum:
  VPN bilgilerinin alınması ve kaydedilmesi → data, key vpn_info
  Müşterinin DevOps ekibine devir toplantısı → meeting, DevOps devri
  diğerleri manual
04–08: bu PR'da değişmez (M-09c).
- Admin > Sistem ayarları > Aşama şablonu: adım satırına salt okunur "Tamamlanma" etiketi (Elle / Veriyle: <koşul etiketi> / Toplantıyla: <tür>). Admin'in eklediği yeni adım "manual". Veri/toplantı adımları silinemez (sil düğmesi pasif, tooltip "Sistem adımı — veriyle tamamlanır"); başlık, süre, bağlılık ve sıra değişebilir.

5) EKRANLAR (yalnızca bunlar; sekme yapısı aynı kalır)
- Aşamalar ve adımlar tablosu: Durum hücresinin altında küçük gri etiket "Veriyle" / "Toplantıyla". Tamamlanmamış veri adımında tooltip: "Eksik: <missing etiketleri>"; toplantı adımında "<tür> toplantısı kaydedilince tamamlanır".
- StepDialog: veri/toplantı adımında Durum select'i pasif (yalnızca "Kapsam dışı" seçilebilir); altında koşul listesi (✓ / ✗ satırları, stepConditionResult'tan). Sorumlu, top, termin, başlangıç, süre düzenlenebilir kalır.
- Toplantı formu: Tür listesinde yeni türler; "Durum" alanı (Planlandı / Yapıldı / İptal; tarih bugünden sonraysa varsayılan Planlandı, değilse Yapıldı); tür Uyarlama ise "Takım" seçimi. Toplantılar listesinde durum rozeti ve Planlandı satırda "Yapıldı olarak işaretle".
- Satış devri sekmesi: Taahhütler kartında "Taahhüt yok" onay kutusu (en az bir taahhüt varken pasif).
- Kick-off sekmesi: kurulum tipi ve LLM seçimlerine "Henüz belli değil" seçeneği (değer seçildikten sonra pasif). Sekmenin geri kalanı M-09b'ye kadar aynı kalır.

6) SEED
- State version +1.
- Tamamlanmış aşamalardaki veri/toplantı adımlarının verisi gerçekten bulunsun (ör. İş Yatırım: Satış devri ve Kick-off türünde "held" toplantı, teklif + sözleşme dokümanı, en az bir taahhüt, kurulum tipi ve LLM dolu). Seed yüklendikten sonra applyStepCompletion hiçbir şeyi değiştirmemeli.
- Bir projede 00 Satış Devri aktif ve verisi eksik olsun: CSM atanmış, satışçı seçili, lisans modeli boş, modül yok, sözleşme yok, kurulum tipi null → ilgili adımlar açık, eksikler tooltip'te görünür.
- Bir projede noCommitments = true olsun.
- En az bir Planlandı (gelecek tarihli) toplantı olsun.

KABUL KRİTERLERİ
- Satış devri sekmesinde lisans modeli girilince (satışçı da seçiliyse) "Satışçı ve lisans modelinin girilmesi" adımı kendiliğinden Tamamlandı olur; Müşteri geçmişinde "Otomatik kural: veri tamamlandı" görünür; bağlı sonraki adım akışla açılır.
- Lisans modeli silinince adım (aşama tamamlanmamışsa) tekrar Bekliyor olur; aşama tamamlanmışsa değişmez.
- Veri/toplantı adımının durumu StepDialog'dan elle Tamamlandı yapılamaz; store da reddeder. Kapsam dışı yapılabilir.
- "Taahhüt yok" işaretlenince Taahhütler adımı tamamlanır; sonra taahhüt eklenince işaret kalkar ve adım tamamlı kalır.
- Satış devri türünde "Yapıldı" toplantı kaydedilince "Satış devri toplantısı" adımı tamamlanır; "Planlandı" kaydedilince tamamlanmaz, "Yapıldı"ya çekilince tamamlanır.
- Kurulum tipi "Henüz belli değil" iken On-prem/SaaS kuralları çalışmaz; On-prem seçilince çalışır; sonradan SaaS'a çevrilince gerekçe istenir ve kurallar yeniden çalışır.
- 01 Kick-off'ta kurulum tipi ve LLM adımları yok; 00'da "Kurulum tipi ve LLM tercihinin girilmesi" var.
- Kilitli bir veri adımının verisi girilirse adım doğrudan Tamamlandı olur.
- applyStepCompletion + advanceFlow iki kez çalıştırıldığında ikinci tur hiçbir şey değiştirmez.
- Birim testleri (src/lib/rabbitqa/completion.test.ts): her koşulun sağlanan / sağlanmayan hali, geri açılma, aşama done iken geri açılmama, kilitli adımın doğrudan done olması, out_of_scope'a dokunulmaması, idempotans.
```

---

## M-09b — Aşama çalışma alanı: Satış Devri ve Kick-off
**Branch:** `feat/m09b-phase-workspace-handover` · **Ön koşul:** M-09a merge edildi.

```
[§0 BAĞLAM]

AMAÇ
Aşamanın verisi aşamanın altında doldurulsun. Aşama kartına veya eksik bir adıma tıklayınca o aşamanın formu sağ panelde (Sheet) açılır; form doldukça adımlar (M-09a motoruyla) kendiliğinden tamamlanır. "Satış devri" ve "Kick-off" sekmeleri kalkar.

1) GENEL ALTYAPI (sonraki aşamalar da bunu kullanacak)
- src/pages/project/workspaces/ altında aşama kodu → çalışma alanı bileşeni eşlemesi: PHASE_WORKSPACES: Partial<Record<phaseCode, Component>>. Bu PR'da yalnızca "00".
- PhaseWorkspaceSheet: sağdan açılan Sheet (masaüstünde ~640px, mobilde tam ekran). Başlıkta aşama kodu + adı, durum rozeti ve "x/y adım". Panel üstünde aşamanın adımlarının kompakt listesi (✓ / ○ + başlık + sorumlu), store'dan canlı güncellenir; listedeki eksik adıma tıklamak aynı paneldeki ilgili alana kaydırır.
- Açma yolları:
  a) Çalışma alanı olan aşamanın kart başlığında "Formu aç" düğmesi.
  b) Adım satırının kendisine tıklama (kalem ikonu hariç):
     - completion "data", tamamlanmamış → çalışma alanını aç, stepConditionResult().missing'deki ilk alana kaydır, alanı 2 sn vurgula (ring) ve odakla. Form alanları data-field="<field>" ile işaretlensin.
     - completion "data", tamamlanmış → çalışma alanını aç (vurgu yok).
     - completion "meeting", tamamlanmamış → Toplantı formu açılsın: tür = adımın meetingType'ı, tarih bugün, durum Yapıldı, katılımcılarda proje CSM'i ön seçili. Kaydedince adım tamamlanır.
     - completion "meeting", tamamlanmış → ilgili toplantının detayı açılsın.
     - completion "manual" → mevcut StepDialog.
     - Kilitli adımda da açılır (veri erken girilebilir); tooltip "Sırası gelmedi — veri şimdiden girilebilir".
  c) Kalem ikonu her zaman StepDialog'u açar (değişmez).
- Yetki: mevcut perm.ts kuralları geçerli (canManageProject; CSM alanını yalnızca Manager değiştirir). Yetkisiz kullanıcı paneli salt okunur görür.
- Kayıt modeli: alan bazında store çağrısı (her değişiklik ayrı audit), ayrı "Kaydet" düğmesi yok — mevcut Satış devri sekmesindeki gibi.
- Toast: bir değişiklik adım tamamlattıysa "Tamamlandı: <adım>"; akış yeni adım açtıysa mevcut "Sıradaki adım açıldı" toast'ı.

2) 00 SATIŞ DEVRİ ÇALIŞMA ALANI
Mevcut HandoverTab içeriği bu bileşene TAŞINIR (kopya kalmasın). Bölümler sırayla, her bölüm başlığının yanında bağlı adımın durum Pill'i ve termini:
  a) Devir: CSM (yalnızca Manager) · Devir alınan satışçı · Lisans modeli · Satın alınan modüller (mevcut çoklu seçim grid'i)
  b) Kurulum ve LLM: Kurulum tipi (SaaS / On-prem / Henüz belli değil) · LLM tercihi (3 seçenek / Henüz belli değil). Mevcut Kick-off sekmesindeki mantık ve gerekçe diyaloğu buraya taşınır; değişince kuralların açtığı/kapattığı adım ve aksiyonlar toast'ta özetlenir (mevcut özet).
  c) Sözler ve taahhütler: mevcut liste + ekleme + düzenleme + "Taahhüt yok" kutusu.
  d) Dokümanlar: "Teklif" ve "Sözleşme" kutucukları. Doküman varsa ad + tarih + "Dokümanlar'da gör" bağlantısı; yoksa "Yükle" → mevcut doküman ekleme diyaloğu, tür önceden seçili ve kilitli, bağlantı ilgili adım. Veri Dokümanlar'da tutulur (tek kaynak).
  e) Satış devri toplantısı: kayıt varsa tarih + katılımcılar + "Toplantıyı gör"; yoksa "Toplantı kaydet" (1.b'deki ön dolu toplantı formu).

3) 01 KICK-OFF
- Çalışma alanı yok; "Formu aç" görünmez. Adımlar: Kick-off toplantısı (toplantı) · Kurulum gereksinim dokümanının paylaşılması (elle, yalnızca On-prem) · Onboarding sunumunun paylaşılması (elle).
- Kick-off sekmesi kaldırılır. İçindeki alanların yeni yeri:
  kurulum tipi, LLM                         → 00 Satış Devri çalışma alanı
  "onboarding sunumu paylaşıldı" işareti    → "Onboarding sunumunun paylaşılması" elle adımı; form alanı kaldırılır
  "gereksinim dokümanı paylaşıldı" + tarih  → "Kurulum gereksinim dokümanının paylaşılması" elle adımı; paylaşım tarihi = adımın tamamlanma tarihi
- Bu alanları okuyan her yer adım durumunu okuyacak şekilde güncellensin: alerts.ts ("Gereksinim dokümanı paylaşılmadı"), raporlardaki Kick-off özeti, ai-mock, Müşteri geçmişi. Kullanım yerlerini PR'da listele. Kullanılmayan alanlar types.ts'ten silinsin; state version +1; seed buna göre güncellensin.

4) SEKMELER
- "Satış devri" ve "Kick-off" sekmeleri kaldırılır. Eski sekme değeri URL/query'de gelirse "Aşamalar ve adımlar"a yönlensin ve 00 çalışma alanı açılsın.

KABUL KRİTERLERİ
- 00 Satış Devri kartında "Formu aç" ile panel açılır; panel açıkken lisans modeli girilince paneldeki ve tablodaki "Satışçı ve lisans modelinin girilmesi" satırı Tamamlandı olur.
- Eksik "Satın alınan modüllerin girilmesi" adımına tıklayınca panel açılır, modül alanına kayar ve alan vurgulanır.
- "Satış devri toplantısı" adımına tıklayınca toplantı formu Satış devri türüyle açılır; kaydedince adım tamamlanır, toplantı Toplantılar sekmesinde ve Müşteri geçmişinde görünür.
- Teklif kutucuğundan yüklenen doküman Dokümanlar sekmesinde "Teklif" türüyle görünür ve Teklif adımı tamamlanır.
- Kurulum tipi panelden On-prem → SaaS çevrilince gerekçe istenir; Kurulum aşamasındaki adımlar kurallara göre değişir ve toast'ta özetlenir.
- CSM rolü CSM alanını değiştiremez; Manager değiştirebilir; DevOps / Customer Care paneli salt okunur görür.
- Kick-off sekmesi yok; Kick-off aşamasında yukarıdaki 3 adım var; "Gereksinim dokümanı paylaşılmadı" uyarısı adım durumuna göre çalışır.
- Diğer sekmeler, akış ve uyarılar bozulmaz.
```

---

## M-09c — Keşif, Erişim, Eğitim, Uyarlama çalışma alanları + sekme düzeni
**Branch:** `feat/m09c-phase-workspaces-tabs` · **Ön koşul:** M-09b merge edildi.

```
[§0 BAĞLAM]

1) 02 KEŞİF
- Çalışma alanı = mevcut "Keşif ve takımlar" sekmesinin içeriği (keşif formu, takımlar, KPI). Tek bileşen; hem sekmede hem panelde aynı bileşen render edilir (kopya yok).
- data-field işaretleri: discovery_form (ilk cevapsız zorunlu soru), teams, kpi.
- Panelde "Keşif toplantısı" bölümü (M-09b'deki toplantı bölümü bileşeni).
- Takım tanımlamak zorunlu değil (teams adımı required: false).

2) 03 KURULUM
- Çalışma alanı = erişim bilgileri tablosu (mevcut bileşen: maskeli şifre, "Göster" ve audit'i, geçerlilik rozeti). Panel ve "Formu aç" yalnızca canSeeCredentials olanlara; diğerleri vpn_info adımına tıklayınca StepDialog görür.
- "Kurulum ve erişim" sekmesinin adı "Erişim bilgileri" olur; içindeki adım listesi kaldırılır (aşamada zaten var). Sekme yalnızca canSeeCredentials olanlara görünür (mevcut).

3) 04 EĞİTİM — eğitim session'ı = Eğitim türünde toplantı
- Meeting'e training?: { trainerId, modules: string[], recordingUrl } ekle. Toplantı formunda tür Eğitim ise bu alanlar görünür.
- Mevcut Training kayıtları Eğitim türünde toplantıya dönüştürülür (planlandı → planned, yapıldı → held). Training tipi, addTraining / updateTraining ve "Katılımcı girişi" adımını açan kural kaldırılır; kullanım yerleri (raporlar, Müşteri geçmişi, ai-mock, uyarılar) toplantıya yönlendirilir ve PR'da listelenir.
- Şablon (04):
  Eğitim session'larının planlanması → data, key training_plan: iptal edilmemiş en az bir Eğitim toplantısı (planned veya held)
  Eğitim session'larının yapılması   → data, key training_done: en az bir Eğitim toplantısı var VE iptal edilmemiş tüm Eğitim toplantıları held
- Çalışma alanı: Eğitim toplantıları listesi (tarih, eğitmen, modüller, katılımcı sayısı, durum, "Yapıldı olarak işaretle") + "Session ekle" (Eğitim türüyle ön dolu toplantı formu, varsayılan durum Planlandı).
- "Eğitim" sekmesi kaldırılır.

4) 05 UYARLAMA — takım başına tek adım + kontrol listesi + Uyarlama toplantıları
- Veri: takım başına Adaptation { projectId, teamId: string | null, checklist: { projectCreated, docsIdentified, docsUploaded, aiTrained, firstSamples } } (boolean). Mevcut saveAdaptation ve takım başına 5 alt adım yapısı buna dönüştürülür; mevcut session tarih/katılımcı/not verisi Uyarlama türünde toplantıya (teamId ile) taşınır.
- Kontrol listesi madde etiketleri: Proje oluşturuldu · Yüklenecek dokümanlar belirlendi · Dokümanlar RabbitQA'e yüklendi · AI eğitildi · İlk örnekler birlikte yapıldı. Maddelerin durumu, sorumlusu ve termini YOK; "Bana atananlar"a ve uyarılara girmez. İşaretleme audit'li.
- Kural (addTeam): takım eklenince Uyarlama aşamasına tek adım: "Uyarlama: <takım adı>", key adapt:<teamId>, completion data, bağımsız, 10 iş günü, zorunlu, sorumlu proje CSM'i, status locked (akış açar). Mevcut "takım başına 5 adım" kuralı kaldırılır.
- Takım yoksa: şablonda tek adım "Uyarlama", key adapt:general (data, önceki tamamlanınca, 10 iş günü, zorunlu) ve teamId null olan Adaptation kaydı. İlk takım eklendiğinde adapt:general adımı tamamlanmamışsa ve kontrol listesinde hiç işaret yoksa "Kapsam dışı" olur (audit: "Otomatik kural: takım tanımlandı"); işaret varsa dokunulmaz.
- Koşul adapt:*: ilgili kontrol listesinin 5 maddesi de işaretli.
- Çalışma alanı: takım kartları. Kartta: takım adı, müşteri tarafı sorumlusu, kullanıcı sayısı, 5 maddelik kontrol listesi (onay kutuları), o takımın Uyarlama toplantıları (tarih, katılımcılar, not özeti, durum) ve "+ Session ekle" (Uyarlama türü ve takım ön seçili toplantı formu; notlar toplantıda tutulur). Üstte ilerleme = kontrol listesi tamamlanan takım / toplam takım.
- "Uyarlama" sekmesi kaldırılır.

5) UYARILAR
- Proje detayındaki "Uyarılar" sekmesi kaldırılır.
- Proje başlığında rozet: "N açık uyarı" (kırmızı uyarı varsa kırmızı, yoksa sarı; 0 ise gizli). Tıklayınca sağ panel: projenin uyarı listesi; mevcut erteleme, gerekçeyle kapatma ve elle uyarı ekleme işlevleriyle (mevcut bileşen taşınır).
- Bir aşama veya adıma bağlı uyarı varsa o satırda küçük uyarı ikonu + tooltip (uyarı metni).
- Zil ve "Uyarılarım" aynen kalır.

6) SEKME DÜZENİ (son hali, bu sırayla)
Aşamalar ve adımlar · Aksiyonlar · Toplantılar · Keşif ve takımlar · Erişim bilgileri · Dokümanlar · Riskler ve kararlar · Go-Live · Süreklilik · Entegrasyonlar · Müşteri kişileri · Müşteri geçmişi · Destek kayıtları
- "Destek kayıtları" pasif: tıklanamaz, yanında "Faz 2" rozeti, tooltip "Faz 2'de gelecek". Veri ve kod silinmez.
- 06 Uygulama şablonundan "Destek kayıtlarının takibi" adımı kaldırılır; mevcut projelerde bu adım "Kapsam dışı" olur (gerekçe "Faz 2").
- Toplantılar sekmesine tür ve durum filtresi.
- Go-Live ve Süreklilik bu PR'da değişmez.

7) SEED
- State version +1.
- İş Yatırım (Eğitim ve Uyarlama tamamlanmış): 2 Eğitim toplantısı (ikisi de Yapıldı), 2 takım, her takımın kontrol listesi tam ve her takım için en az bir Uyarlama toplantısı.
- Bir projede Uyarlama aktif: bir takımın listesi yarım, diğerininki tam; bir Planlandı Uyarlama toplantısı.
- Takımsız bir projede adapt:general adımı.
- Seed yüklendikten sonra applyStepCompletion hiçbir şeyi değiştirmemeli.

KABUL KRİTERLERİ
- Keşif sekmesinde ve 02 panelinde aynı bileşen; birinde yapılan değişiklik diğerinde görünür ve ilgili adımlar tamamlanır.
- Eğitim türünde Planlandı toplantı eklenince "planlanması" tamamlanır; tümü Yapıldı olunca "yapılması" tamamlanır; aşama tamamlanmamışken yeni bir Planlandı Eğitim toplantısı eklenince "yapılması" tekrar açılır.
- Takım eklenince Uyarlama'da "Uyarlama: <takım>" adımı oluşur; 5 madde işaretlenince adım tamamlanır; bir madde kaldırılınca (aşama tamamlanmamışsa) geri açılır.
- Takımsız projede tek "Uyarlama" adımı var; ilk takım eklenince (işaret yoksa) Kapsam dışı olur.
- Uyarlama session'ı Toplantılar sekmesinde Uyarlama türü ve takım adıyla, Müşteri geçmişinde de görünür.
- Sekme listesi yukarıdaki 13 sekme; Destek kayıtları tıklanamaz; Satış devri, Kick-off, Eğitim, Uyarlama, Uyarılar sekmeleri yok.
- Proje başlığındaki rozet doğru sayıyı gösterir; panelden erteleme/kapatma gerekçeyle çalışır ve Müşteri geçmişine yazılır.
- Eğitim ve uyarlama bilgileri haftalık müşteri raporunda ve yönetim raporunda önceki gibi görünür.
- "Kilitli adım iş değildir" kuralı korunur: kilitli Uyarlama adımları Bana atananlar'a, gecikmeye ve uyarılara girmez.
```
