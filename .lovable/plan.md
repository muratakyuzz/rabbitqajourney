# RabbitQA Onboarding Tracker — Faz 1 (Temel)

Mevcut şablon (sol menü, üst bar, tema) korunur; demo giriş ve partner/admin sayfaları yerine RabbitQA'ya özel sayfalar gelir. Arayüz tamamen Türkçe.

## Faz 1'de yapılacaklar

1. **Gerçek giriş ve roller**
   - E-posta + şifre ile giriş, şifre sıfırlama sayfası.
   - 5 rol: CSM, DevOps, Customer Care, Manager, Administrator (ayrı rol tablosunda, güvenli kontrol).
   - Menü role göre değişir.

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

4. **Değişiklik geçmişi (history)**
   - Her ekleme/güncelleme otomatik kaydedilir: kim, ne zaman, alan, eski → yeni değer.
   - Kayıtlar silinmez; geçmiş değiştirilemez. Tarih ve durum değişikliğinde gerekçe zorunlu.

5. **Bana atananlar**: kullanıcının adım ve aksiyonları (bugün, bu hafta, geciken).

6. **Başlangıç verisi**: 13 modül, aşama/adım şablonu, keşif soruları ve örnek müşteri İş Yatırım (tarihler, modüller, takımlar dahil).

## Sonraki fazlar (bu planın dışında)

- Faz 2: Kick-off/Keşif formları, kurulum tipi ve LLM seçimine göre otomatik kurallar, takımlar, KPI, eğitim ve uyarlama session'ları, şifreli VPN bilgileri, doküman yükleme.
- Faz 3: Pano içi uyarılar (iş günü + TR tatilleri), destek kayıtları, riskler/kararlar, Go-Live.
- Faz 4: Haftalık müşteri raporu ve iç yönetim raporu (PDF), Administrator konfigürasyon ekranları.

## Kullanıcılar hakkında not

Deniz Uzun, Gençay Genç ve Çağla Kahriman hesapları için şifreyi kişiler kendileri "şifremi unuttum" ile belirleyebilir; ayrıca bir Administrator ve Manager hesabı için e-posta adresi sizden istenecek.

## Teknik detaylar

- Lovable Cloud: e-posta girişi açılır; `profiles`, `user_roles` (+ `has_role`), `customers`, `projects`, `phases`, `steps`, `actions`, `meetings`, `meeting_attendees`, `contacts`, `commitments`, `salespeople`, `modules`, `phase_templates`, `step_templates`, `audit_log` tabloları. Hepsinde GRANT + RLS.
- Proje oluşturulunca şablon kopyalama veritabanı fonksiyonuyla; genel audit trigger'ı `audit_log`'a yazar; `audit_log` üzerinde update/delete yasak. Silme yerine `deleted_at` (soft delete).
- RLS: CSM kendi müşterileri, Manager/Admin hepsi, DevOps/Customer Care kendilerine atanan adım/aksiyonlar.
- Demo auth (`auth-api.ts`) gerçek girişle değiştirilir; AGENTS.md buna göre güncellenir. Mevcut PageSkeleton rotaları yeni sayfalarla değiştirilir.
