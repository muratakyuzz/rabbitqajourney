# RabbitQA Onboarding Tracker — Faz 1 (Demo, örnek verilerle)

Veritabanı kullanılmaz. Tüm veriler uygulama içindeki örnek verilerden gelir; yapılan değişiklikler tarayıcıda saklanır ve istenirse "Demo verisini sıfırla" ile başa döner. Mevcut sol menü, üst bar ve tema korunur. Arayüz tamamen Türkçe.

## Faz 1'de yapılacaklar

1. **Demo giriş ve roller**
   - Giriş ekranında hazır demo kullanıcılar; şifre alanına ne yazılırsa girer:
     - Deniz Uzun — CSM — deniz.uzun@virgosol.com
     - Gençay Genç — Customer Care — gencay.genc@virgosol.com
     - Çağla Kahriman — DevOps — cagla.kahriman@virgosol.com
     - Manager — manager@virgosol.com (örnek)
     - Administrator — admin@virgosol.com (örnek)
   - Menü ve yetkiler role göre değişir.

2. **Müşteri projeleri listesi**
   - Müşteri, CSM, aktif aşama, ilerleme, sağlık (Yeşil/Sarı/Kırmızı), Go-Live tarihi.
   - CSM, sağlık ve aşamaya göre filtre. Yeni müşteri/proje oluşturma.

3. **Proje detayı** (sekmeler)
   - **Aşamalar ve adımlar:** 00–08 aşamaları şablondan otomatik oluşur. Her adımda sorumlu, topun kimde olduğu, termin, durum. Aşama plan/gerçekleşen tarihleri; zorunlu adımlar bitmeden aşama tamamlanamaz.
   - **Aksiyonlar:** başlık, sahip, top kimde, termin, öncelik, durum, kaynak.
   - **Toplantılar:** tür, tarih, iç/müşteri katılımcıları, notlar, kararlar, toplantıdan aksiyon oluşturma.
   - **Müşteri kişileri:** ad, unvan, e-posta, telefon, rol.
   - **Satış devri ve taahhütler:** satışçı, lisans modeli, modüller, taahhüt kayıtları.
   - **Müşteri geçmişi:** tüm değişiklikler ve toplantılar tarih sırasıyla, filtrelenebilir.

4. **Değişiklik geçmişi**
   - Her ekleme/güncelleme kaydedilir: kim, ne zaman, alan, eski → yeni değer. Kayıtlar silinmez.
   - Tarih ve durum değişikliğinde gerekçe zorunlu.

5. **Bana atananlar**: kullanıcının adım ve aksiyonları (bugün, bu hafta, geciken).

6. **Örnek veri**: 13 modül, aşama/adım şablonu, keşif soruları, örnek satışçılar ve İş Yatırım projesi (tarihler, modüller, takımlar, keşif cevapları dahil).

## Sonraki fazlar

- Faz 2: Kick-off/Keşif formları, kurulum tipi ve LLM seçimine göre otomatik kurallar, takımlar, KPI, eğitim ve uyarlama session'ları, VPN bilgileri, doküman ekleme.
- Faz 3: Pano içi uyarılar (iş günü + TR tatilleri), destek kayıtları, riskler/kararlar, Go-Live.
- Faz 4: Haftalık müşteri raporu ve iç yönetim raporu (PDF), Administrator konfigürasyon ekranları.

## Not

Manager ve Administrator için isim/e-posta verilmediğinden örnek hesaplar oluşturuldu; gerçek isimleri iletirseniz güncellerim. Demo olduğu için VPN şifreleri gerçek anlamda korunmaz.

## Teknik detaylar

- Veri katmanı: `src/lib/rabbitqa/` altında tipler, seed verisi ve localStorage tabanlı bir store (React context + hook'lar). Her mutasyon merkezi bir `audit` kaydı üretir.
- Demo auth (`auth-api.ts`) rolleri `csm | devops | care | manager | admin` olacak şekilde genişletilir; `AppShell` menüsü rollere göre yeniden tanımlanır. Partner/admin PageSkeleton rotaları yeni sayfalarla değiştirilir.
- Proje oluşturmada şablon kopyası store fonksiyonuyla yapılır; şablon değişikliği açık projeleri etkilemez.
- AGENTS.md ve template memory'si "mock veri kullanılmaz" kuralı artık geçerli olmadığı için güncellenir.
