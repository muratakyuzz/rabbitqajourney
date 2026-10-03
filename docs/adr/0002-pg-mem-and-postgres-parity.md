# ADR-0002: Lokalde pg-mem, test/canlıda PostgreSQL — parity stratejisi

**Durum:** Kabul edildi
**Tarih:** 2026-10-02
**Hazırlayan:** planner · **Onaylayan:** Murat

## Bağlam
Geliştirici lokalde Docker/PostgreSQL kurmadan, bellekte çalışan **pg-mem** ile geliştirmek istiyor. Test ve canlı ortam **PostgreSQL 17**.

pg-mem gerçek PostgreSQL değil, bir taklittir:
- Trigger, Row Level Security, native extension (pgcrypto vb.) yok; PL/pgSQL desteği kısmi.
- SQL ayrıştırıcısı kendi yazımıdır; bazı geçerli PostgreSQL sözdizimleri hata verir veya farklı davranır.
- Eşzamanlılık/izolasyon davranışı PostgreSQL ile aynı değildir.
- Veri bellekte durur; süreç yeniden başlayınca kaybolur (`tsx watch` her dosya kaydında süreci yeniden başlatır).

## Karar

### 1. İş kuralları uygulama katmanında
Audit, zorunlu gerekçe, aşama tamamlama, otomatik kurallar, şablon kopyalama, yetki ve şifreleme **TypeScript servis katmanında** uygulanır; trigger, PL/pgSQL fonksiyonu veya RLS **kullanılmaz**. Böylece pg-mem'de ve PostgreSQL'de aynı kod çalışır.

### 2. Veritabanı yalnızca taşınabilir kısıtları taşır
PK, FK, NOT NULL, CHECK, UNIQUE, DEFAULT, index. Hepsi `migrations/` altında ve **her iki motorda da** çalışmak zorunda.

### 3. Yalnızca PostgreSQL'e özgü olanlar ayrı klasörde
`migrations/pg-only/` — uygulama rolü ve yetkileri (ör. `audit_log` üzerinde UPDATE/DELETE yetkisini geri alma), extension'lar, gerekirse performans index'leri. pg-mem'de çalıştırılmaz; bunlara bağlı iş mantığı yazılamaz (savunma katmanıdır, birincil kontrol değildir).

### 4. Parity kapısı (CI)
Her PR'da GitHub Actions, PostgreSQL 17 service container üzerinde:
1. `migrations/` + `migrations/pg-only/` sıfırdan uygulanır.
2. API entegrasyon test seti (`*.int.test.ts`) **aynen** gerçek PostgreSQL'e karşı koşar.
3. Kritik sorgular gerçekçi hacimde örnek veriyle `EXPLAIN (ANALYZE, BUFFERS)` ile ölçülür; plan çıktısı artifact olarak saklanır.
Parity job'ı kırmızıysa merge yok. Böylece pg-mem'de geçip PostgreSQL'de bozulan her şey test ortamına gitmeden yakalanır.

### 5. Lokal veri kalıcılığı
- Her başlangıçta deterministik seed (`apps/api/src/db/seed.ts`): spec'teki modüller, kullanıcılar, şablon, İş Yatırım örneği.
- İsteğe bağlı dev snapshot: `DEV_SNAPSHOT=1` iken süreç kapanırken tablolar `.data/pgmem-snapshot.json`'a yazılır, açılışta geri yüklenir. `.data/` git'e girmez. Snapshot yalnızca dev kolaylığıdır; şema değişince silinir.

### 6. Tek veri erişim noktası
`apps/api/src/db/index.ts` ortam değişkenine göre pool döndürür: `DB_DRIVER=pgmem` → pg-mem'in node-postgres adaptörü, `DB_DRIVER=pg` → gerçek `pg.Pool`. Repository'ler hangi motorda çalıştığını bilmez; motor kontrolü (`if pgmem`) yazmak yasaktır.

## Kabul edilen riskler
| Risk | Azaltma |
|---|---|
| pg-mem'de geçen sorgu PostgreSQL'de farklı sonuç verir | Parity job (aynı test seti gerçek PG'de) |
| Eşzamanlılık hataları lokalde görünmez | Eşzamanlılığa duyarlı işlemler (aşama tamamlama, kural tetikleme) için parity'de koşan ayrı test; satır kilidi (`SELECT … FOR UPDATE`) kullanımı reviewer kontrolünde |
| DB seviyesinde değiştirilemezlik yok (lokalde) | Audit yazımı tek servis üzerinden; repository'de `audit_log` için update/delete fonksiyonu yok; PG'de `pg-only` grant'ları |
| Performans sorunları lokalde görünmez | Parity job'ında EXPLAIN ölçümü + `DATA_MODEL.md` erişim desenleri |
| Lokal veri kaybı | Seed + dev snapshot |

## Yeniden değerlendirme koşulu
pg-mem kaynaklı parity hatası bir fazda 3'ten fazla görülürse veya pg-mem gerekli bir SQL özelliğini desteklemezse, lokalde PGlite veya Docker PostgreSQL'e geçiş yeniden değerlendirilir.
