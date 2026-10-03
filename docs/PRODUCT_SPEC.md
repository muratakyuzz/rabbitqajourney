# RabbitQA Onboarding Tracker — Ürün Gereksinimleri

> Bu dosya ürün gereksinimlerinin **tek doğruluk kaynağıdır** (ilk sürüm 2026-09-28; Ek A ve Ek B 2026-10-03). Değişiklikler PR ile yapılır ve Architect onayı gerekir.

Virgosol onboarding ekibinin RabbitQA müşterilerinin onboarding sürecini uçtan uca takip ettiği bir iç web uygulaması. Uygulama her müşteri için onboarding aşamalarını takip eder, adımları ve aksiyonları planlar, pano içinde uyarı verir, rapor üretir ve tüm değişikliklerin geçmişini (history) tutar.

Arayüz dili Türkçe.

---

## Kullanıcılar ve roller

Uygulamayı yalnızca iç ekip kullanır, müşteri giriş yapmaz. Kullanıcılar e-posta ile giriş yapar.

| Rol | Yetki |
|---|---|
| Customer Success Manager (CSM) | Birden fazla CSM var. Her müşterinin tek bir CSM sahibi olur. CSM kendi müşterilerinin tüm aşamalarını yönetir; toplantı, adım, aksiyon ve taahhütleri girer, raporları üretir. |
| DevOps Specialist | Kurulum ve teknik süreci yürütür. Kendisine atanan adım ve aksiyonları görür ve günceller. VPN bilgilerini görebilir. |
| Customer Care | Kurulum sonrası platform testlerini ve hesap açılışlarını yapar. Kendisine atanan adım ve aksiyonları görür ve günceller. |
| Manager | Tüm CSM'lerin süreçlerini ve tüm müşterileri görür. Müşteriye CSM atar. İç yönetim raporunu görür. |
| Administrator | Tüm konfigürasyonu yapar: kullanıcılar ve roller, satışçı listesi, modül listesi, aşama/adım şablonu, keşif soruları, uyarı eşikleri. |

Satışçılar uygulamayı kullanmaz. Administrator'ın yönettiği bir satışçı listesi olur ve satış devrinde bu listeden seçilir.

---

## Temel yapı

- **Müşteri → Onboarding projesi → Aşama → Adım → Aksiyon**
- Proje oluşturulduğunda aşamalar ve adımlar şablondan kopyalanır. Şablon sonradan değişirse açık projeler etkilenmez.
- Her adımın: sorumlusu, **topun kimde olduğu** (Müşteri, CSM, DevOps, Customer Care), termini ve durumu (Bekliyor, Devam ediyor, Tamamlandı, Kapsam dışı) vardır.
- Toplantılardan ve kararlardan ek **aksiyonlar** oluşturulabilir. Aksiyonun başlığı, sahibi, topun kimde olduğu, termini, önceliği, durumu ve kaynağı (toplantı, otomatik kural, elle) olur.
- **Toplantılar** müşteri geçmişinin ana kaydıdır: tür, tarih, iç katılımcılar, müşteri katılımcıları, notlar, ekler, alınan kararlar ve doğan aksiyonlar.
- Müşteri tarafındaki kişiler (ad, unvan, e-posta, telefon, rol: sponsor / proje sorumlusu / teknik sorumlu) kaydedilir; toplantı katılımcısı ve aksiyon sahibi olabilirler.
- Dokümanlar (teklif, sözleşme, kurulum gereksinim dokümanı, onboarding sunumu, diğer) yüklenebilir ve projeye, toplantıya veya adıma bağlanabilir.

---

## Onboarding aşamaları

### 00 — Satış Devri
Kick-off öncesi satış ekibinden müşteri devri alınır.
- CSM ataması (Manager yapar)
- Hangi satışçıdan devir alındığı (satışçı listesinden seçilir)
- Müşterinin lisans modeli
- Satın alınan modüller
- Müşteriye verilen sözler ve taahhütler: her biri ayrı kayıt; metni, hangi aşamada karşılanacağı, durumu (Açık, Karşılandı, Karşılanamadı) ve notu
- Internal brif toplantısı (CSM + satışçı) kaydı
- Teklif dokümanının yüklenmesi
- Müşteri sözleşmesinin yüklenmesi

**Tamamlanma:** Brif toplantısı yapıldı, teklif ve sözleşme yüklendi, taahhütler girildi.

### 01 — Kick-off
- Kick-off toplantısı (tanışma) kaydı
- Onboarding sunumunun müşteriyle paylaşıldı işareti
- Kurulum tipi seçimi: **SaaS** veya **On-prem**
- On-prem ise: **Kurulum gereksinim dokümanı paylaşıldı / paylaşılmadı** işareti ve paylaşım tarihi
- LLM tercihi (üç seçenek):
  - RabbitQA'nın sağladığı LLM
  - Müşterinin kendi LLM'i
  - Müşteri GPU'lu sunucu verir, model kurulumunu Virgosol yapar
- Satın alınan modüllerin kaydı (modül listesi Administrator tarafından yönetilir)

**Tamamlanma:** Toplantı yapıldı, kurulum tipi ve LLM tercihi girildi, On-prem ise gereksinim dokümanı paylaşıldı.

### 02 — Keşif
Müşteriyle soru-cevap toplantısı yapılır ve onboarding map birlikte doldurulur.
- Keşif toplantısı kaydı
- Keşif formu (sorular Administrator tarafından düzenlenebilir; başlangıç soruları aşağıda)
- Takım listesi: takım adı, müşteri tarafı sorumlusu, kullanıcı sayısı
- KPI tanımı: ad, birim, başlangıç değeri, hedef değer, hedef tarih; sonradan ölçüm değerleri girilebilir

Başlangıç keşif soruları:
- **Şirket & Takım Yapısı**
  - Ürünü kullanacak kaç bağımsız agile takımınız var?
  - Takımlarda ürünü hangi rollerin daha aktif olarak kullanması bekleniyor?
- **Sprint & Geliştirme Profili**
  - RabbitQA'i kaç farklı yazılım ürünü veya dijital kanal kapsamında kullanmayı planlıyorsunuz?
- **Test Yönetimi & Otomasyon**
  - Regresyon setiniz bulunuyor mu? Varsa otomasyon ile mi veya manuel olarak mı koşum gerçekleştiriyorsunuz?
  - Kapsam dahilindeki ürün / kanal bazında mevcut regression test setinizde kaç test senaryosu bulunmaktadır?
- **Modül Tercihleri**
  - Kullanmayı planladığınız modüller hangileri? (modül listesinden çoklu seçim)
- Notlar
- KPI

**Tamamlanma:** Zorunlu sorular cevaplandı ve en az bir takım tanımlandı.

### 03 — Kurulum
Adımlar sırasıyla ve topun kimde olduğu ile takip edilir:
1. VPN erişiminin talep edilmesi (top: Müşteri)
2. VPN bilgilerinin alınması ve kaydedilmesi (top: CSM)
3. Müşterinin kurulum gereksinim dokümanına göre sunucuları oluşturup teslim etmesi (top: Müşteri)
4. Müşterinin DevOps ekibine devir toplantısı (top: Müşteri → DevOps). Bu toplantı müşteri geçmişinde tutulur. Toplantı kaydedildiğinde top DevOps'a geçer.
5. Ürün kurulumu (top: DevOps)
6. Model kurulumu — yalnızca LLM tercihi "Müşteri GPU'lu sunucu verir" ise (top: DevOps)
7. İlk platform testleri (top: Customer Care)
8. Örnek bir proje ile platforma veri doldurulması (top: Customer Care)
9. Müşteri hesaplarının açılması ve müşteriyle paylaşılması (top: Customer Care)

Adım 7, 8 ve 9 ayrı aksiyonlar olarak takip edilir.

VPN ve diğer erişim bilgileri (tür, sağlayıcı, kullanıcı adı, şifre, geçerlilik tarihi, not) şifreli saklanır. Yalnızca o müşterinin CSM'i ve DevOps görebilir. Her görüntüleme history'ye yazılır.

**Tamamlanma:** Müşteri hesapları açıldı ve müşteriyle paylaşıldı.

### 04 — Eğitim
Platformu kullanacak ekiplere tüm ürünlerin anlatıldığı eğitim.
- Bir müşteride 1 veya daha fazla eğitim session'ı olabilir. Aynı eğitim farklı gruplara ayrı session'larda verilebilir.
- Her session: tarih, eğitmen, katılımcılar, anlatılan modüller, kayıt linki, notlar.
- Her session müşteri geçmişinde tarih ve katılımcılarla birlikte görünür.

**Tamamlanma:** Planlanan tüm session'lar yapıldı.

### 05 — Uyarlama
Takım bazlı çalışma. Keşif'te kaç takım tanımlandıysa, her takım için ayrı bir uyarlama session'ı yürütülür.
Her takım için adımlar:
1. Proje oluşturma
2. Yüklenecek dokümanların belirlenmesi
3. Dokümanların RabbitQA'e yüklenmesi
4. AI'ın eğitilmesi
5. İlk örneklerin birlikte yapılması

Her session tarih, katılımcılar ve notlarla kaydedilir. Aşamanın ilerlemesi = tamamlanan takım sayısı / toplam takım sayısı.

**Tamamlanma:** Tüm takımların uyarlaması tamamlandı.

### 06 — Uygulama
Müşterinin ürünü kullandığı ve takıldığı yerlerde CS ekibinin desteğiyle ilerlediği aşama.
- Destek kayıtları: takılınan konu, tür (teknik destek, kullanım desteği, geliştirme talebi), durum, çözüm, tarih
- Geliştirme talepleri için Product Kurulu değerlendirme sonucu ve müşteriye bildirim tarihi
- CS check-in toplantıları
- KPI ölçümleri

### 07 — Go-Live
- Go/No-Go toplantısı
- Açık taahhütlerin kontrolü
- Müşteri onayı (onaylayan kişi ve tarih)

### 08 — Süreklilik
Go-Live sonrası takip modu.
- Periyodik check-in toplantıları
- Destek kayıtları
- Kullanım ve KPI takibi

---

## Otomatik kurallar

| Tetik | Sonuç |
|---|---|
| Yeni proje oluşturuldu | Tüm aşamalar ve adımlar şablondan oluşur; "CSM ataması" adımı Manager'a düşer |
| Kurulum tipi = On-prem | "Gereksinim dokümanı paylaşıldı" adımı ve Kurulum'daki VPN, sunucu ve DevOps devir adımları açılır |
| Kurulum tipi = SaaS | Bu adımlar "Kapsam dışı" olur; yerine "SaaS ortamının hazırlanması" adımı (DevOps) açılır |
| LLM = Müşteri GPU'lu sunucu verir | DevOps'a iki aksiyon açılır: "GPU gereksinimlerinin müşteriye iletilmesi" ve "Model kurulumu" |
| LLM = Müşterinin kendi LLM'i | "LLM endpoint ve erişim bilgisinin alınması" (top: Müşteri) ve "LLM entegrasyonu" (DevOps) aksiyonları açılır |
| Keşif'te takım eklendi | Uyarlama aşamasında o takım için session ve 5 alt adım oluşur |
| Eğitim session'ı eklendi | Session kaydı ve katılımcı girişi adımı oluşur |
| Toplantıda aksiyon yazıldı | Aksiyon toplantıya bağlı olarak oluşur ve sahibine atanır |

Bir seçim sonradan değişirse (ör. SaaS → On-prem) yeni adımlar açılır, eski adımlar silinmez, "Kapsam dışı" yapılır ve değişiklik gerekçesiyle history'ye yazılır.

Bir aşama, zorunlu adımları tamamlanmadan "Tamamlandı" yapılamaz. Aşama tamamlanırken onaylayan kişi ve tarih kaydedilir.

---

## Aşama durumu ve proje sağlığı

Aşama durumları: Başlamadı, Devam ediyor, Risk altında, Gecikti, Tamamlandı, Kapsam dışı. Her aşamanın plan başlangıç/bitiş ve gerçekleşen başlangıç/bitiş tarihleri vardır. Hedef tarih değiştirilirken gerekçe zorunludur; ilk plan (baseline) korunur.

Proje sağlığı: Yeşil, Sarı, Kırmızı. CSM günceller ve gerekçesini yazar.

---

## Pano içi uyarılar

Uyarılar yalnızca uygulama içinde gösterilir (e-posta/Slack yok). Uyarı ertelenebilir veya gerekçeyle kapatılabilir; ikisi de history'ye yazılır. Eşikler Administrator tarafından değiştirilebilir. İş günü hesabı Türkiye resmi tatillerini dışlar.

| Uyarı | Tetik | Seviye |
|---|---|---|
| Aşama gecikti | Plan bitişi geçti, aşama tamamlanmadı | Kırmızı |
| Aşama riskte | Plan bitişine ≤ 3 iş günü kaldı ve zorunlu adımların yarısından azı tamamlandı | Sarı |
| Aksiyon / adım gecikti | Termin geçti, açık | Kırmızı |
| Aksiyon yaklaşıyor | Termine ≤ 2 iş günü | Sarı |
| Müşteride bekleyen adım | Top 5 iş gününden uzun süredir müşteride | Sarı (10 iş günü: Kırmızı) |
| Gereksinim dokümanı paylaşılmadı | On-prem seçildi, Kick-off'tan 2 iş günü sonra hala paylaşılmadı | Sarı |
| Devir eksik | Satış Devri'nde teklif veya sözleşme yüklenmedi | Sarı |
| Açık taahhüt | Hedef aşaması geçmiş ve karşılanmamış taahhüt, veya Go-Live'a 5 iş günü kala açık taahhüt | Kırmızı |
| Keşif eksik | Zorunlu keşif sorusu cevapsız | Sarı |
| KPI ölçülemez | KPI'da başlangıç veya hedef değer yok | Sarı |
| Lisans uyumsuzluğu | Müşterinin kullanmak istediği modül satın alınan modüller arasında yok | Sarı |
| Erişim bilgisi süresi doluyor | VPN bilgisinin geçerliliği 7 gün içinde doluyor | Sarı |
| Rapor gönderilmedi | Haftalık müşteri raporu hafta sonuna kadar gönderildi olarak işaretlenmedi | Sarı |
| Sessiz proje | 10 iş günü boyunca projede hiç değişiklik yok | Sarı |

---

## History (değişiklik geçmişi)

- Her oluşturma, güncelleme ve silme işlemi kaydedilir: kim, ne zaman, hangi kayıt, hangi alan, eski değer → yeni değer.
- Kayıtlar fiziksel olarak silinmez; history kayıtları değiştirilemez ve silinemez.
- Tarih değişikliği, durum değişikliği, uyarı kapatma ve kurulum/LLM seçimi değişikliğinde gerekçe zorunludur.
- Topun el değiştirmesi history'ye yazılır.
- Her müşteri için toplantılar (tür, tarih, katılımcılar) ve tüm değişiklikler tek bir müşteri geçmişinde, tarih sırasıyla görülebilir; kayıt türüne, kullanıcıya ve tarihe göre filtrelenebilir.

---

## Raporlar

Raporlar verilerden otomatik doldurulur; CSM göndermeden önce serbest metin alanlarını düzenleyebilir. Üretilen her rapor arşivlenir ve PDF olarak indirilebilir.

**Müşteri haftalık durum raporu** (tek müşteri, son 7 gün):
- Proje sağlığı ve kısa özet
- Aşama ilerlemesi, bu hafta tamamlananlar, plan ve gerçekleşen tarihler
- Açık aksiyonlar (Virgosol tarafı ve müşteri tarafı), terminleri
- "Sizden beklenenler": topun müşteride olduğu adımlar ve bekleme süreleri
- Açık riskler ve bu haftanın kararları
- KPI hedef ve mevcut değer
- Gelecek hafta yapılacaklar

İç notlar, iç sağlık gerekçesi ve ticari bilgiler müşteri raporunda görünmez; her kayıtta "müşteriye görünür" işareti bulunur.

**İç yönetim raporu** (tüm müşteriler, seçilen dönem):
- Aktif proje sayısı, sağlık dağılımı, dönemde Go-Live olanlar
- Proje bazında aktif aşama, gecikme günü, baseline'dan sapma
- Geciken aksiyonların sahibe göre dağılımı
- Topun müşteride beklediği adımlar ve süreleri
- Yüksek etkili riskler
- Lisans uyumsuzlukları, destek kaydı sayıları
- CSM başına müşteri ve açık iş yükü

---

## Genel görünümler

- Tüm müşteri projelerinin listesi: müşteri, CSM, aktif aşama, ilerleme, sağlık, Go-Live tarihi, açık uyarı sayısı; CSM, sağlık ve aşamaya göre filtre
- Kullanıcıya atanmış adım, aksiyon ve uyarılar (bugün, bu hafta, geciken)
- Proje detayında: aşamalar ve adımlar, satış devri ve taahhütler, kurulum ve erişim bilgileri, keşif formu, takımlar, toplantılar, aksiyonlar, riskler ve kararlar, destek kayıtları, KPI'lar, dokümanlar, müşteri geçmişi, raporlar
- Administrator konfigürasyon alanı: kullanıcılar, satışçılar, modüller, aşama/adım şablonu, keşif soruları, uyarı eşikleri

---

## Başlangıç verisi

**Modüller:** SmartRequest, SmartPBI, Analyzer, SmartAPI, CaseWriter, TestPilot, AutoRunner, DataCrate, BrowserHub, MobileHub, Accessibility, Healthcheck, Reporter

**Kullanıcılar:**
- Deniz Uzun — CSM — deniz.uzun@virgosol.com
- Gençay Genç — Customer Care — gencay.genc@virgosol.com
- Çağla Kahriman — DevOps — cagla.kahriman@virgosol.com

**Örnek müşteri: İş Yatırım**
- Proje: RabbitQA Customer Onboarding
- CSM: Deniz Uzun
- Onboarding başlangıç tarihi: 28.08.2026, hedef Go-Live: 02.10.2026
- Satın alınan modüller: TestPilot, CaseWriter, DataCrate, AutoRunner
- Keşifte kullanılmak istenen modüller: CaseWriter, TestPilot, AutoRunner, MobileHub, DataCrate
- Aşama plan bitiş tarihleri: Kick-off 28.08.2026 · Keşif 28.08.2026 · Kurulum 04.09.2026 · Eğitim 11.09.2026 · Uyarlama 18.09.2026 · Uygulama 25.09.2026 · Go-Live 02.10.2026 · Süreklilik: Go-Live sonrası
- Takımlar: Herkese Borsa, Trade Master
- Keşif cevapları:
  - Takım sayısı: 2 takım mevcut. Herkese Borsa ve Trade Master. Bunların yanı sıra ayrı bir test ekibi de kurulabilme ihtimali var. Mehmet Ertuğrul Elitop ve Trademaster ezel sarıtepe herkese borsada Sevcan Vural.
  - Aktif roller: İş analistleri ve PO'lar
  - Ürün/kanal: Platform mobil, web + desktop (Trade Master)
  - Regresyon: Test senaryoları mevcut. İş analistleri ve PO'lar tarafından belirleniyor. Excel üzerinden takip ediliyor. Regresyon setleri mevcut.
  - Senaryo sayısı: (boş)
  - Notlar: Dedicated test ekipleri henüz yok.
  - KPI: Tüm senaryoları yüklemek ve koşumları gerçekleştirmek.

---

# Ek A — AI Insight ve iletişim entegrasyonları (2026-10-03)

> Kaynak: mockup (main @ 4bfa4cb) ve 2026-10-03 kararları. Ana spec ile çelişirse ana spec kazanır.

## A.1 Amaç
Müşteri bazlı Microsoft Teams kanalları ve CS posta kutusu (cs@rabbitqa.com) dinlenir. AI konuşmalardan proje güncellemesi **önerir**; öneriler "AI Insight" alanında kullanıcı onayına sunulur; onaylanınca mevcut işlemlerle uygulanır. İleride Slack eklenecek; sohbet entegrasyonu sağlayıcıdan bağımsız modellenir.

## A.2 Kurallar
- **Hiçbir AI önerisi onaysız uygulanmaz.** Toplu onay yoktur; toplu red vardır.
- Öneriyi projeyi görebilen herkes onaylayabilir, düzenleyip onaylayabilir veya reddedebilir.
- Onay, ilgili mevcut işlemle (aksiyon ekle/güncelle, adım güncelle, risk/karar ekle, proje sağlığı, Go-Live veya aşama tarihi) uygulanır; gerekçe her zaman "AI Insight onaylandı (Teams|E-posta): <AI gerekçesi>" + varsa kullanıcı notu. Sağlık ve tarih türlerinde gerekçe boş bırakılamaz.
- Hedef kayıt öneriden sonra değiştiyse onay öncesi uyarı gösterilir.
- Reddedilen öneri hiçbir kaydı değiştirmez. Bekleyen öneriler ayarlanan gün sonunda "süresi doldu" sayılır.
- Aynı hedef için bekleyen öneri varsa yeni öneri oluşturulmaz, mevcut önerinin kaynaklarına eklenir.
- Önerilebilecek türler: yeni aksiyon, aksiyon güncelleme, adım durumu, yeni risk, yeni karar, sağlık değişikliği, tarih değişikliği. Admin hangi türlerin açık olduğunu ve minimum güven eşiğini belirler.

## A.3 Entegrasyon ayarları (yalnızca Administrator)
- **Teams:** tenant ID, uygulama (client) ID, client secret, bot adı, dinleme sıklığı (1/5/15 dk), bağlantı testi, bulunan kanallar. Gerekli Graph izinleri: ChannelMessage.Read.All, Team.ReadBasic.All, Channel.ReadBasic.All (uygulama izni, yönetici onayı).
- **E-posta:** açık/kapalı, posta kutusu, Microsoft 365 veya IMAP, gelen/giden işleme, domain ile eşleştirme, yok sayılan adres ve domain'ler.
- **AI:** açık öneri türleri, minimum güven (%), alıntı uzunluğu, bekleyen önerinin süresi (gün).
- Secret'lar varsayılan maskeli; görüntüleme history'ye yazılır; değerleri history'de görünmez (yalnızca "değiştirildi").

## A.4 Proje entegrasyonu (projeyi yönetebilenler)
- Sohbet kanalı seçimi (bir kanal aynı anda tek projeye bağlanabilir), aktif/pasif.
- E-posta takibi aktif/pasif; eşleşmede kullanılan adresler proje kişilerinden gelir, ek domain eklenebilir.
- Pasif projeye ait mesajlardan öneri üretilmez.

## A.5 E-posta eşleştirme
Yok sayılan adres/domain'ler çıkarılır → kalan adresler proje kişilerinin e-postalarıyla tam eşleştirilir → bulunamazsa (açıksa) domain eşleştirmesi (kişi domain'leri + ek domain'ler) → birden fazla proje veya hiç proje çıkarsa "Eşleşmeyen e-postalar" kuyruğuna düşer. Admin kuyruktan projeye atayabilir (istenirse göndereni müşteri kişisi olarak ekler) veya yok sayabilir.

## A.6 Görünümler
- Genel bakış'ta AI Insight kartı (bekleyen sayısı, filtreler, ilk 5 öneri).
- /app/insights: Bekleyen ve Geçmiş (kim, ne zaman, not, uygulanan kayıt).
- Bana atananlar: önerilen sahibi ben olan bekleyen öneriler.
- Aksiyonlarda "AI · Teams / AI · E-posta" kaynak rozeti; müşteri geçmişinde "AI Insight" filtresi.

---

# Ek B — Akış, adım tamamlama ve mockup kararları (2026-10-03)

> Kaynak: mockup (main @ 4bfa4cb) ve Murat'ın 2026-10-03 kararları. M-09 ile gelecek maddeler "(M-09)" ile işaretlidir.

## B.1 Sıralı akış
- Şablonda her **aşama** ve **adım** ya **önceki tamamlanınca** ya da **bağımsız** başlar. Her adımın **süresi** iş günü olarak tanımlanır (varsayılan 2).
- Proje açılınca tüm aşama ve adımlar **"Sırası gelmedi" (kilitli)** oluşur; ilk aşama, bağımsız aşamalar ve bunlardaki ilk/bağımsız adımlar hemen açılır.
- Adım açıldığında termin = açıldığı gün + süre (iş günü; hafta sonu ve resmi tatil hariç). Termini geçen açık adım "Geciken" olur.
- Önceki adım/aşama "Kapsam dışı" ise geçilmiş sayılır. Açılmış adım, önceki adım sonradan tekrar açılsa da kilitlenmez.
- **Kilitli adım iş sayılmaz:** Bana atananlar'a, gecikmeye, müşteride beklemeye ve uyarılara girmez; durumu elle değiştirilemez.
- Aşama zorunlu adımları bitince proje CSM'ine "Aşama onayı bekliyor" aksiyonu açılır; aşama yalnızca CSM onayıyla tamamlanır.
- Proje açılışında aşama plan tarihleri şablondaki sürelerden tahmin edilir; baseline yalnızca boşsa yazılır.

## B.2 Adım tamamlama tipleri (M-09)
- Her adımın tamamlanma tipi kodda sabittir: **Veriyle** (ilgili alan dolunca kendiliğinden), **Toplantıyla** (o türde "Yapıldı" toplantı kaydedilince), **Elle**.
- Veriyle / toplantıyla tamamlanan adım elle "Tamamlandı" yapılamaz; yalnızca "Kapsam dışı" yapılabilir. Veri silinirse ve aşama tamamlanmamışsa adım tekrar açılır.
- Toplantıların durumu: Planlandı / Yapıldı / İptal. Toplantı adımını yalnızca "Yapıldı" tamamlar.
- Kurulum tipi ve LLM tercihi **Satış Devri**'nde girilir; "Henüz belli değil" seçilebilir, değer seçildikten sonra geri alınamaz; değer değişikliği gerekçelidir ve kuralları yeniden çalıştırır.
- Taahhüt yoksa "Taahhüt yok" işaretlenir.
- Eğitim session'ı = Eğitim türünde toplantı. Uyarlama: takım başına tek adım + 5 maddelik kontrol listesi + Uyarlama toplantıları; takım yoksa tek genel adım. Takım tanımlamak zorunlu değildir.
- Aşamanın verisi aşamanın çalışma alanında (sağ panel) girilir; eksik adıma tıklanınca eksik alan vurgulanır.

## B.3 Uyarılar (mockup'taki son hal)
- 14 tip state'ten hesaplanır; eşikler ve resmi tatiller Admin'den yönetilir; seviyeler Sarı / Kırmızı.
- Uyarı ertelenebilir (tarih + gerekçe) veya gerekçeyle kapatılır; kapatılan uyarı aynı kayıt için tekrar hesaplansa da kapalı kalır.
- Aşama durumu "Gecikti" / "Risk altında" elle seçilmez, uyarılardan türetilir.
- Uyarıyı projeyi yöneten (CSM/Manager) veya uyarının sahibi ele alabilir.

## B.4 Raporlar ve kayıtlar
- Haftalık müşteri raporu oluşturulduğu anda **snapshot** olarak dondurulur; CSM özet ve "gelecek hafta" alanlarını düzenler; "Gönderildi" işaretlenen rapor düzenlenemez ve arşivde kalır.
- Müşteri raporuna yalnızca "müşteriye görünür" kayıtlar girer (varsayılan: aksiyon ve KPI görünür; toplantı ve risk/karar görünmez; aşama onayı aksiyonları görünmez).
- Risk: etki, olasılık, azaltma planı. Karar: tarih, ilgili toplantı.
- Destek kaydı: tür (teknik / kullanım / geliştirme talebi), çözüm (kapatırken zorunlu), geliştirme talebinde Product Kurulu sonucu ve müşteriye bildirim tarihi. **Destek kayıtları Faz 2'ye ertelendi** (M-09 ile sekme pasif).
- Go-Live müşteri onayı: onaylayan **müşteri kişisi** ve tarih zorunlu; kaydeden iç kullanıcı ayrıca tutulur.

## B.5 Yönetim
- Kullanıcılar ve satışçılar silinmez, pasifleştirilir; pasif kayıt yeni atamada seçilemez, eski kayıtlarda adı görünür; pasif kullanıcı giriş yapamaz; son aktif admin pasifleştirilemez ve rolü değiştirilemez.
- Keşif sorusu tipi: metin veya modül çoklu seçim; modül cevabı projenin "kullanılmak istenen modüller" alanıyla senkron.
- Şablon değişiklikleri yalnızca yeni projeleri etkiler. Veriyle/toplantıyla tamamlanan sistem adımları şablondan silinemez (M-09).

