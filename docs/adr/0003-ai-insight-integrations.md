# ADR-0003: AI Insight ve iletişim entegrasyonlarının mimarisi

**Durum:** Önerildi — F8 başlamadan önce kabul edilmeli (açık sorular §6)
**Tarih:** 2026-10-03
**Hazırlayan:** planner · **Onaylayan:** Murat

## Bağlam
Spec Ek A (`docs/PRODUCT_SPEC.md`): Teams kanalları ve CS posta kutusu dinlenecek, AI mesajlardan proje güncellemesi önerecek, kullanıcı onaylayacak. Mockup'ta bağlantı, dinleme ve AI analizi simüle (`ai-mock.ts`, `email-match.ts`). BE'de dış sistemlere bağlanan, periyodik çalışan ve AI çağıran bir bileşen gerekiyor.

## Karar (önerilen)

### 1. Ayrı işçi süreci: `apps/worker`
- API'den ayrı bir Node 24 süreci; aynı `packages/shared` ve `db/` katmanını kullanır. Üçüncü Docker imajı.
- Görevler: Teams kanal mesajlarını çekme, posta kutusunu çekme, e-posta eşleştirme, AI analizi, süresi dolan önerileri işaretleme.
- Zamanlama: basit aralıklı döngü (ayardaki dinleme sıklığı). İlk sürümde **tek işçi örneği** — böylece pg-mem'in desteklemediği `FOR UPDATE SKIP LOCKED` iş kuyruğuna ihtiyaç olmaz (ADR-0002).
- İlerleme imleci: `integration_cursors` tablosu (kanal/posta kutusu başına son delta token veya son mesaj zamanı). Her mesaj dış kimliğiyle (`external_id`) bir kez işlenir (idempotent).
- **İşçi iş verisini doğrudan değiştirmez:** yalnızca `ai_insights`, `unmatched_emails`, `integration_cursors` ve bağlantı durumu yazar. Proje kayıtları yalnızca kullanıcı onayıyla, API üzerinden değişir (INV-21).

### 2. Dış sistem bağlantıları — adaptör arayüzü
```
ChatSource   { listChannels(), fetchMessages(channel, cursor) }   → TeamsGraphSource, (ileride) SlackSource, MockChatSource
MailSource   { fetchMessages(mailbox, cursor) }                   → GraphMailSource, ImapMailSource, MockMailSource
AiAnalyzer   { analyze(message, projectContext) → InsightProposal[] } → LlmAnalyzer, MockAnalyzer (mockup ai-mock.ts'ten taşınır)
```
- Lokal geliştirme ve testlerde **Mock** adaptörler kullanılır (ağ isteği yok); gerçek adaptörler yalnızca ortam değişkeniyle açılır.
- Teams: Microsoft Graph kanal mesajları (delta sorgusu). Uygulama izinleriyle kanal mesajı okumanın Microsoft tarafında ek onay/koşul gerektirip gerektirmediği ve alternatif olarak Teams uygulaması + kaynağa özel izin (RSC) yaklaşımı **F8-00'da doğrulanmalı**.
- E-posta: Microsoft 365 için Graph Mail (posta kutusu erişimi yalnızca cs@ kutusuyla sınırlandırılmalı); IMAP seçeneği için OAuth2 desteği doğrulanmalı.

### 3. AI analizi
- Girdi: mesaj alıntısı (admin ayarındaki uzunluk sınırıyla) + projenin küçük bağlamı (açık aksiyon/adım başlıkları ve id'leri, kişiler, tarihler). Tam proje verisi gönderilmez.
- Çıktı: `packages/shared` içindeki `InsightProposal` şemasına uyan yapılandırılmış veri. Şemaya uymayan, açık olmayan türdeki veya güven eşiğinin altındaki çıktı atılır.
- Hedef kayıt id'leri (aksiyon/adım) o projeye ait mi diye sunucuda doğrulanır.
- Dış mesaj içeriği **güvenilmeyen veridir** (prompt injection): AI çıktısı yalnızca öneridir; hiçbir zaman komut çalıştırmaz, yetki kontrolünü atlamaz, kendiliğinden uygulanmaz (INV-23).

### 4. Veri ve gizlilik
- Mesajın tam gövdesi saklanmaz; yalnızca alıntı, gönderen, zaman, bağlantı (INV-24).
- Alıntılar ve eşleşmeyen e-postalar için saklama süresi (öneri: 180 gün; KVKK değerlendirmesi gerekir).
- Entegrasyon secret'ları `core/crypto` ile şifreli (INV-22); API yanıtlarında maskeli.

## Alternatifler
| Seçenek | Artı | Eksi |
|---|---|---|
| İşçiyi API sürecinde çalıştırmak (setInterval) | Tek imaj | API yeniden başlarken dinleme durur; birden çok API örneğinde mesajlar iki kez işlenir |
| Hazır iş kuyruğu (Redis/BullMQ) | Ölçeklenir | Yeni altyapı; ilk sürüm için gereksiz |
| Webhook (Graph change notifications) | Gecikme düşük | Herkese açık uç nokta, abonelik yenileme; ilk sürüm için karmaşık |

## Sonuçlar
- Yeni klasör `apps/worker`, yeni Docker imajı, yeni ortam değişkenleri (Graph kimlikleri, LLM anahtarı).
- Testlerde yalnızca Mock adaptörler; gerçek bağlantı testleri F8-00 deneme ortamında elle.

## 6. Açık sorular (F8-00'da kapanmalı)
1. **AI sağlayıcısı:** Azure OpenAI (Azure Blob ile aynı bulut, veri yerleşimi), Anthropic Claude API, RabbitQA'nın kendi LLM'i?
2. Teams'e erişim modeli: uygulama izinleri mi, Teams uygulaması + RSC mi? Virgosol M365 yöneticisinin onayı.
3. E-posta: Graph Mail mi, IMAP mi? IMAP ise OAuth2.
4. Alıntı ve e-posta saklama süresi (KVKK).
5. Slack ne zaman? (Şimdilik yalnızca arayüzde "Yakında".)
