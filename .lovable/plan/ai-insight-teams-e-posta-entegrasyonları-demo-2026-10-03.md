# AI Insight + Teams / E-posta entegrasyonları (demo)

Hepsi demo olarak çalışacak: Teams, Microsoft 365, IMAP ya da herhangi bir yapay zekâ servisine gerçek bağlantı kurulmayacak. Bağlantı testi, mesaj dinleme ve AI analizi sahte (simüle) olacak, tüm veri tarayıcıda kalacak. Hiçbir AI önerisi onaylanmadan uygulanmayacak.

## Kullanıcının göreceği değişiklikler

1. **Sistem ayarları › Entegrasyonlar** (yalnızca admin, Modüller sekmesinden sonra)
   - Sohbet: Microsoft Teams kartı (Bağlan formu, bağlantı testi, bulunan kanalların listesi, bağlantıyı kesme) ve "Yakında" rozetli Slack kartı. Gerekli Graph izinleri bilgi kutusunda yazacak.
   - E-posta dinleme: aç/kapat, cs@rabbitqa.com, Microsoft 365 / IMAP alanları, bağlantı testi, gelen/giden e-posta ve domain eşleştirme seçenekleri, yok sayılan adresler/domainler, **Eşleşmeyen e-postalar** tablosu (Projeye ata, isteğe bağlı göndereni müşteri kişisi olarak ekle / Yok say).
   - AI ayarları: 7 öneri türü için aç/kapat, güven eşiği, alıntı uzunluğu, önerilerin geçerlilik süresi; proje + kaynak + metin girilip "Analiz et" ile test alanı.
   - Şifreler maskeli gösterilecek. "Göster"e basmak geçmişe kayıt düşecek. Şifre değerleri geçmişe hiç yazılmayacak.
2. **Proje detayı › Entegrasyonlar sekmesi** (Müşteri kişileri sekmesinden önce): Teams kanalı seçimi (her kanal tek bir projeye bağlanabilir), Aktif/Pasif, e-posta takibi ve ek domainler, projenin son 10 AI önerisi. Proje başlığında "3 AI önerisi" rozeti görünecek.
3. **Genel bakış**: KPI satırının altında **AI Insight** kartı (filtreler, en fazla 5 öneri, "Tümünü gör").
4. **Yeni sayfa: AI Insight** (menüde Genel bakış'ın altında, bekleyen öneri sayısıyla): Bekleyen / Geçmiş sekmeleri ve filtreler. Toplu reddetme olacak, toplu onay olmayacak.
   - Öneri kartı: kaynak, gönderen, zaman, proje, tür, kısa özet, güven yüzdesi, değişiklik farkı ("Termin: 05.10 → 12.10"), kaynak alıntısı ve AI gerekçesi.
   - İşlemler: Onayla, Düzenle ve onayla, Reddet. Sağlık ve tarih önerilerinde gerekçe zorunlu (AI gerekçesiyle dolu gelir). Öneriden sonra kayıt değiştiyse uyarı çıkacak.
5. **Bana atananlar**: önerilen sahibi siz olan bekleyen öneriler.
6. **Aksiyon tabloları**: AI kaynaklı aksiyonlarda "AI · Teams" / "AI · E-posta" rozeti, üzerine gelince alıntı ve onaylayan kişi görünecek. Düzenleme penceresinde "Kaynak mesaj" satırı olacak. Müşteri geçmişine "AI Insight" filtresi eklenecek.
7. **Örnek veriler**: Teams ve e-posta bağlı, her müşteri için bir kanal ve 2 boş kanal olacak. Her türden toplam yaklaşık 8 bekleyen öneri, 3 onaylanmış ve 2 reddedilmiş geçmiş kaydı, 3 eşleşmeyen e-posta eklenecek. En az bir projede takip pasif olacak.

## Kurallar
- Öneriyi, o projeyi görebilen herkes onaylayabilir veya reddedebilir. Projeyi göremeyen kullanıcı öneriyi hiçbir yerde görmez.
- Onaylanan öneri mevcut işlevlerle uygulanır ve geçmişe "AI Insight onaylandı (Teams|E-posta): …" gerekçesiyle yazılır. Reddedilen öneri hiçbir kaydı değiştirmez.
- Takibi pasif olan projeler için öneri üretilmez. Test alanında bunu açıklayan bir mesaj çıkar.
- Aynı kayıt için bekleyen bir öneri varsa yeni öneri açılmaz, mevcut öneriye eklenir.
- Mevcut ekranların görünümü ve davranışı değişmez.

## Teknik detaylar
- `types.ts`: ChatProvider, InsightKind/Status, AiInsight, ChatChannel, UnmatchedEmail, IntegrationConfig; `ActionSource` + "teams" | "email"; `Action.insightId?`; `Project.integrations`. SOURCE_LABEL'a yeni değerler eklenecek.
- Depo sürümü v5 (`rabbitqa-demo-state-v5`); eski kayıt varsa örnek veri yeniden yüklenir.
- Store: `setConfig("integrations")` (secret alanları sadece "değiştirildi" olarak kaydedilir), `testConnection` (800 ms mock), `disconnect`, `setProjectIntegration`, `approveInsight` (addAction/updateAction/updateStep/addRisk/updateProject/updatePhase), `rejectInsight`, `assignUnmatchedEmail`, `ignoreUnmatchedEmail`, `simulateIncoming`. Süresi geçen bekleyen öneriler görüntülemede "expired" sayılır.
- Saf fonksiyonlar: `src/lib/rabbitqa/ai-mock.ts` (anahtar kelime kuralları; tür ve eşik filtreleri), `src/lib/rabbitqa/email-match.ts` (adres → domain → kuyruk).
- `perm.ts`: canManageIntegrations, canSetProjectIntegration, canReviewInsight, canSeeSecrets.
- Yeni dosyalar: `src/pages/project/IntegrationsTab.tsx`, `src/pages/Insights.tsx`, `src/components/rq/InsightCard.tsx`, Admin entegrasyon bileşenleri. ProjectDetail'e yalnızca sekme ve rozet eklenecek. Aksiyon kaynağı hücreleri SOURCE_LABEL'ı kullanacak.
- Yeni paket eklenmeyecek. İstek üzerine AGENTS.md'ye dokunulmayacak; notlar `.lovable/` altına yazılacak.
- Doğrulama: admin ve CSM ile tarayıcıda test edilecek (entegrasyon sekmesinin görünürlüğü, öneri onay/ret akışı, pasif proje mesajı, AI rozeti).
