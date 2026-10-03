# Değişmez Kurallar (Invariants)

`reviewer` ve `rules-reviewer`'ın birincil kontrol listesidir. Her bulgu ilgili `INV-xx` kimliğini referans verir.
İhlal **her zaman** merge engelidir. Liste yalnızca PR + planner önerisi + Murat onayıyla değişir.
Mimari bağlam: `docs/adr/0002-pg-mem-and-postgres-parity.md` — kurallar uygulama katmanında zorlanır, DB yalnızca taşınabilir kısıtları taşır.

| ID | Kural | Nerede zorlanır | Nasıl doğrulanır |
|---|---|---|---|
| INV-01 | Şema yalnızca `migrations/` ile değişir; migration'lar numaralı, uygulanmış dosya değiştirilmez (checksum) | Migration runner | Runner checksum uyuşmazlığında durur; diff'te eski migration değişikliği yok |
| INV-02 | `migrations/` pg-mem **ve** PostgreSQL'de çalışır: trigger, PL/pgSQL, RLS, extension yok. PostgreSQL'e özgü olan yalnızca `migrations/pg-only/` | Süreç + CI | Unit testler pg-mem'de, parity job'ı PostgreSQL'de aynı migration'ları uygular |
| INV-03 | Fiziksel silme yok: iş tablolarında `deleted_at`; repository'lerde `DELETE FROM` yok; okuma sorguları varsayılan `deleted_at IS NULL` | Repository | `grep -rn "DELETE FROM" apps/api/src` boş; test |
| INV-04 | `audit_log` yalnızca eklenir: yazımı yalnızca `core/audit`; audit için update/delete fonksiyonu yok. PostgreSQL'de uygulama rolünün UPDATE/DELETE yetkisi `pg-only` ile kaldırılır | Kod + pg-only grant | grep + parity'de "UPDATE audit_log reddedilir" testi |
| INV-05 | Her create/update/delete aynı transaction içinde audit kaydı üretir: kim, ne zaman, tablo, kayıt, alan, eski → yeni, gerekçe | `core/audit` + transaction yardımcısı | Her yazma servisi için "audit satırı oluştu" entegrasyon testi |
| INV-06 | Gerekçe zorunlu: tarih değişikliği, durum değişikliği, uyarı kapatma/erteleme, kurulum tipi / LLM değişikliği | `packages/shared` zod + servis | Gerekçesiz isteğin 400 döndüğü API testi |
| INV-07 | Baseline korunur: ilk plan tarihleri ayrı kolonda, hiçbir akış üzerine yazmaz | Servis | Test |
| INV-08 | Aşama, zorunlu adımları tamamlanmadan "Tamamlandı" olamaz; onaylayan + tarih kaydedilir; kontrol satır kilidi (`FOR UPDATE`) ile | Servis | Unit + parity eşzamanlılık testi |
| INV-09 | Otomatik kurallar idempotent; seçim değişince eski adımlar silinmez → "Kapsam dışı" + gerekçe + audit | `core/rules` | Kuralı 2 kez çalıştıran test kopya üretmez; A→B→A testi |
| INV-10 | Şablon → proje kopyası bağımsız; şablon değişikliği açık projeleri etkilemez; proje hangi şablon sürümünden kopyalandığını tutar | Servis + şema | Test |
| INV-11 | Erişim bilgileri AES-256-GCM ile şifreli (anahtar ortam değişkeni / Key Vault); düz metin kolon yok; çözme yalnızca yetkili endpoint; her görüntüleme audit'e yazılır; liste yanıtlarında hiç dönmez; UI varsayılan maskeli | `core/crypto` + servis | Yetkisiz rol 403 testi, audit testi, DB'de düz metin yok testi |
| INV-12 | Müşteri raporuna yalnızca `is_customer_visible = true` kayıtlar girer; iç not, sağlık gerekçesi, ticari bilgi sorgu seviyesinde dışlanır | Rapor repository'si | Rapor verisi testi |
| INV-13 | İş günü, tatil ve saat dilimi (Europe/Istanbul) hesabı yalnızca `packages/shared/business-days` | Kod | grep: başka tarih aritmetiği yok; unit testler |
| INV-14 | Secret'lar repoya ve web paketine girmez; web yalnızca `VITE_` önekli, gizli olmayan değişkenleri görür | Kod + CI | gitleaks; build çıktısında secret taraması |
| INV-15 | Dosyalar private Azure Blob container'ında; erişim yalnızca proje yetkisi kontrol edildikten sonra üretilen kısa ömürlü (≤ 15 dk), salt-okuma, blob bazlı SAS ile; tür ve boyut sınırı | Servis | Yetkisiz rol testi; SAS parametre testi |
| INV-16 | Her endpoint `authorize(user, action, resource)` çağırır; matris `packages/shared/rbac` içinde ve `docs/RBAC.md` ile birebir | `core/auth` | Her rol × her endpoint için izinli + yasaklı API testi |
| INV-17 | Oturum: token yalnızca hash'i ile saklanır; cookie `httpOnly; Secure; SameSite=Lax`; durum değiştiren isteklerde CSRF kontrolü; parola bcrypt cost ≥ 12; login rate-limit | `core/auth` | Test + reviewer kontrolü |
| INV-18 | Repository'de motor kontrolü (`isPgMem` vb.) yok; DB erişimi yalnızca `db/` üzerinden | Kod | grep |
| INV-19 | Tek tip kaynağı: istek/yanıt şemaları ve enum'lar yalnızca `packages/shared`'da; web (mock ve http adaptörleri) ve API aynı şemayı kullanır; elle yazılmış ikinci tip yok | Kod | Sözleşme testleri (TEST_STRATEGY L2c); grep |
| INV-20 | Kural tek yerde yaşar: bir modül API'ye bağlandıktan sonra o modülün iş kuralı (audit, gerekçe, otomatik kural, yetki) yalnızca API'dedir; web'de kopyası kalmaz. Mock adaptör yalnızca F9-01'e kadar ve yalnızca dev/test için vardır | Kod | Reviewer: bağlanan modülde web tarafında kural kodu kaldırılmış mı |
| INV-21 | AI önerisi onaysız uygulanmaz: işçi süreci proje verisini değiştirmez; onay yalnızca API'den, `authorize()` + ilgili mevcut servis fonksiyonu + "AI Insight onaylandı…" gerekçeli audit ile uygulanır; toplu onay yok | `apps/worker` + insight servisi | Test: işçi çalışınca proje tablolarında değişiklik yok; onaysız uygulama yolu yok (grep) |
| INV-22 | Entegrasyon secret'ları (Teams/M365 client secret, IMAP şifresi, LLM anahtarı) `core/crypto` ile şifreli; API yanıtında yalnızca maskeli; düz değer yalnızca admin "göster" uç noktasıyla ve audit'li; audit'e değer yazılmaz ("değiştirildi") | Servis + crypto | Test: ayar yanıtında secret yok; audit'te değer yok |
| INV-23 | Dış mesaj içeriği güvenilmeyen veridir: AI çıktısı yalnızca `InsightProposal` şemasından geçerse, tür açıksa, güven eşiği üstündeyse ve hedef id o projeye aitse kaydedilir; alıntılar HTML olarak render edilmez | `AiAnalyzer` + insight servisi | Kötü niyetli/şemasız çıktı testleri |
| INV-24 | Mesaj gövdesi saklanmaz, yalnızca alıntı (admin ayarındaki uzunluk); her dış mesaj `external_id` ile bir kez işlenir; pasif projeye ait mesajdan öneri üretilmez | İşçi | Tekrar işleme ve pasif proje testleri |
| INV-25 | Sıralı akış: adım/aşama yalnızca akış motoru açar (bağlılık + iş günü termini); kilitli adım iş sayılmaz (atanan, geciken, müşteride bekleyen, uyarı); kilitli adım/aşamanın durumu elle değişmez; açılmış adım tekrar kilitlenmez; motor idempotent | `core/rules` (mockup `flow.ts`) | İki kez çalıştırma testi; kilitli adımın listelerde görünmediği testler |
| INV-26 | Veriyle / toplantıyla tamamlanan adım elle "Tamamlandı" yapılamaz (yalnızca "Kapsam dışı"); koşul bozulunca, aşama tamamlanmamışsa adım geri açılır; toplantı adımını yalnızca "Yapıldı" toplantı tamamlar | `core/rules` (mockup `completion.ts`, M-09a) | Koşul sağlanan/sağlanmayan, geri açılma, idempotans testleri |
| INV-27 | Haftalık müşteri raporu oluşturulduğu anda snapshot olarak dondurulur; "Gönderildi" işaretli rapor değiştirilemez | Rapor servisi (mockup `reports.ts`) | Gönderilmiş rapora PATCH → 409 testi |
