# RabbitQA Onboarding Tracker — Faz 2

Faz 1 korunur. Hâlâ veritabanı yok: her şey örnek verilerle ve tarayıcıda saklanıyor. Proje detayına yeni sekmeler ve formlar eklenir, otomatik kurallar devreye girer.

## Yapılacaklar

1. **Kick-off formu** (yeni "Kick-off" sekmesi)
   - Onboarding sunumu paylaşıldı işareti.
   - Kurulum tipi: SaaS / On-prem.
   - On-prem seçilirse: gereksinim dokümanı paylaşıldı / paylaşılmadı ve paylaşım tarihi.
   - LLM tercihi: RabbitQA'nın LLM'i / Müşterinin kendi LLM'i / Müşteri GPU'lu sunucu verir.
   - Kurulum tipi veya LLM değiştirilirken gerekçe yazmak zorunlu.

2. **Otomatik kurallar**
   - **On-prem seçilirse:** gereksinim dokümanı adımı ile Kurulum'daki VPN, sunucu ve DevOps devir adımları açılır.
   - **SaaS seçilirse:** bu adımlar "Kapsam dışı" olur ve DevOps'a "SaaS ortamının hazırlanması" adımı açılır.
   - **Müşteri GPU'lu sunucu verirse:** DevOps'a iki aksiyon açılır ("GPU gereksinimlerinin müşteriye iletilmesi", "Model kurulumu"). Model kurulumu adımı da açılır.
   - **Müşterinin kendi LLM'i seçilirse:** iki aksiyon açılır. "LLM endpoint ve erişim bilgisinin alınması" müşteriye, "LLM entegrasyonu" DevOps'a düşer.
   - **Seçim sonradan değişirse:** eski adımlar silinmez, "Kapsam dışı" olur. Değişiklik gerekçesiyle birlikte geçmişe yazılır.
   - **DevOps devir toplantısı kaydedilirse:** ilgili adım tamamlanır ve top DevOps'a geçer.
   - Bu kurallarla açılan aksiyonlarda kaynak "Otomatik kural" olarak görünür.

3. **KPI'lar** (Keşif ve takımlar sekmesinde)
   - Her KPI'da ad, birim, başlangıç değeri, hedef değer ve hedef tarih bulunur.
   - KPI'lara zaman içinde ölçüm değerleri eklenebilir. Mevcut değer ile hedef arasındaki ilerleme gösterilir.
   - Takımlara müşteri tarafı sorumlusu ve kullanıcı sayısı eklenir.

4. **Eğitim session'ları** (yeni "Eğitim" sekmesi)
   - Her session'da tarih, eğitmen, katılımcılar, anlatılan modüller, kayıt linki ve notlar bulunur.
   - Session'lar planlandı / yapıldı olarak işaretlenir.
   - Her session müşteri geçmişinde görünür. Session eklenince "katılımcı girişi" adımı kendiliğinden açılır.

5. **Uyarlama session'ları** (yeni "Uyarlama" sekmesi)
   - Her takım için ayrı bir kart açılır. Kartta 5 alt adım, session tarihi, katılımcılar ve notlar bulunur.
   - Aşama ilerlemesi, tamamlanan takım sayısının toplam takım sayısına oranıyla hesaplanır.

6. **Erişim bilgileri** (yeni "Kurulum ve erişim" sekmesi)
   - Her kayıtta tür, sağlayıcı, kullanıcı adı, şifre, geçerlilik tarihi ve not bulunur.
   - Kayıtları yalnızca projenin CSM'i ve DevOps görebilir. Şifre gizli durur, "Göster" ile açılır ve her görüntüleme geçmişe yazılır.
   - Demo olduğu için bu bilgiler gerçek anlamda şifrelenmez.

7. **Dokümanlar** (yeni "Dokümanlar" sekmesi)
   - Doküman türleri: teklif, sözleşme, kurulum gereksinim dokümanı, onboarding sunumu, diğer.
   - Dokümanlar projeye, bir toplantıya veya bir adıma bağlanabilir.
   - Demo olduğu için dosyanın kendisi saklanmaz, yalnızca adı ve bilgileri kaydedilir.
   - Teklif veya sözleşme eklenince Satış Devri'ndeki ilgili adım tamamlanır.

8. **Örnek veri:** İş Yatırım projesine On-prem kurulum tipi, örnek bir KPI, iki eğitim session'ı, iki takımın uyarlama kayıtları, bir VPN kaydı ve teklif ile sözleşme dokümanları eklenir.

## Sonraki fazlar
- Faz 3: pano içi uyarılar, destek kayıtları, riskler/kararlar, Go-Live.
- Faz 4: raporlar (PDF), Administrator konfigürasyon ekranları.

## Teknik detaylar
- `types.ts`: Project'e `installType`, `llmChoice`, `presentationShared`, `reqDocShared`, `reqDocSharedAt` alanları eklenir. Yeni tipler: `Team` (string[] yerine nesne), `Kpi` + `KpiMeasurement`, `TrainingSession`, `AdaptationSession`, `Credential`, `DocumentRec`. Step'e kuralların adımları bulabilmesi için `key` alanı eklenir.
- State `version` 2'ye çıkar. Eski kayıt bulunursa seed yeniden yüklenir.
- Kurallar `src/lib/rabbitqa/rules.ts` içinde saf fonksiyonlar olur: `applyInstallType` ve `applyLlmChoice`, state'i ve audit kayıtlarını döndürür. Store bunları `setKickoff` içinde çağırır.
- Erişim bilgisinin görüntülenmesi `audit` kaydına `kind: "view"` olarak yazılır. Yetki kontrolü `perm.ts` içindeki `canSeeCredentials` ile yapılır.
- `ProjectDetail.tsx` büyüdüğü için sekmeler `src/pages/project/` altında ayrı dosyalara bölünür.
