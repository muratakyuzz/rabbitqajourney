# Yetki Matrisi (RBAC)

Kaynak: `docs/PRODUCT_SPEC.md` → "Kullanıcılar ve roller". Uygulamadaki karşılığı `packages/shared/src/rbac/` matrisidir ve API'de `authorize()` ile zorlanır (INV-16). Bu tablo ile kod birebir aynı olmalıdır; RBAC testleri her rol × endpoint için bu tablodan üretilir.
Kısaltmalar: **R** okuma · **C** oluşturma · **U** güncelleme · **—** erişim yok · *kendi* = sahibi olduğu müşteri / kendisine atanan kayıt.
Hiçbir rolde DELETE yoktur (INV-03).

| Kaynak | CSM (`csm`) | DevOps (`devops`) | Customer Care (`care`) | Manager (`manager`) | Admin (`admin`) |
|---|---|---|---|---|---|
| Müşteri, proje | C (kendisi CSM olarak) · R/U *kendi* | R *atandığı proje* | R *atandığı proje* | R tümü, C proje, U CSM ataması | R tümü |
| Aşama | R/U *kendi* (onay dahil) | R *atandığı proje* | R *atandığı proje* | R tümü | R tümü |
| Adım, aksiyon | R/C/U *kendi* | R *atandığı proje*, U *kendisine atanan* | R *atandığı proje*, U *kendisine atanan* | R tümü | R tümü |
| Toplantı, karar, risk | R/C/U *kendi* | R *atandığı proje* | R *atandığı proje* | R tümü | R tümü |
| Müşteri kişileri | R/C/U *kendi* | R *atandığı proje* | R *atandığı proje* | R tümü | R tümü |
| Taahhütler, satış devri, lisans | R/C/U *kendi* | — | — | R tümü | R tümü |
| Dokümanlar | R/C *kendi* | R *atandığı proje* | R *atandığı proje* | R tümü | R tümü |
| **Erişim bilgileri (VPN vb.)** | R(çözme endpoint'i)/C/U *kendi* | R(çözme endpoint'i) *atandığı proje* | — | — | — |
| KPI | R/C/U *kendi* | R *atandığı proje* | R *atandığı proje* | R tümü | R tümü |
| Destek kayıtları (**Faz 2**, mockup'ta pasif) | R/C/U *kendi* | R *atandığı proje* | R/C/U *atandığı proje* | R tümü | R tümü |
| Uyarılar (erteleme/kapatma, gerekçeli) | R/U *kendi* | R *atandığı proje* · U *sahibi olduğu* | R *atandığı proje* · U *sahibi olduğu* | R/U tümü | R tümü |
| Haftalık müşteri raporu (oluştur, düzenle, gönderildi) | R/C/U *kendi* | — | — | R tümü | — |
| İç yönetim raporu | — | — | — | R/C | — |
| audit_log | R *kendi müşterileri* | R *atandığı proje* | R *atandığı proje* | R tümü | R tümü |
| Konfigürasyon (kullanıcı, satışçı, modül, şablon, keşif soruları, uyarı eşikleri, tatiller) | R | R | R | R | R/C/U (silme yok, pasifleştirme; son aktif admin korunur) |
| Proje içi akış ayarı (adımın bağlılığı ve süresi) | U *kendi* | — | — | U tümü | — |
| Sistem entegrasyonları (Teams, e-posta, AI ayarları) | — | — | — | — | R/C/U (secret'lar maskeli, göster = audit) |
| Eşleşmeyen e-postalar (ata / yok say) | — | — | — | — | R/U |
| Proje entegrasyonu (kanal, e-posta takibi, ek domain) | R · U *kendi* | R *atandığı proje* | R *atandığı proje* | R/U tümü | R/U tümü |
| AI önerileri (onayla / düzenle ve onayla / reddet) | R/U *kendi* | R/U *atandığı proje* | R/U *atandığı proje* | R/U tümü | R/U tümü |

## Kararlar (2026-10-02, mockup davranışı + Murat onayı)
1. **Admin** tüm proje verisini **okur** (mockup `isAllSeeing`); yazma yalnızca konfigürasyonda.
2. **Erişim bilgisini** projenin CSM'i ve o projeye **atanmış** DevOps görür (mockup: proje DevOps'a ancak atanmışsa görünür).
3. **"Atandığı proje"** = projede kullanıcıya atanmış en az bir adım veya aksiyon olması (mockup `visibleProjects`). F1-00'da bunun türetilmiş sorgu mu, `project_members` tablosu mu olacağına DATA_MODEL karar verir; davranış aynı kalır.
4. **Proje oluşturma:** CSM (kendisi CSM olarak) ve Manager (CSM atayarak). Mockup ile aynı.

5. **AI önerisi** projeyi görebilen herkes tarafından onaylanır/reddedilir (Ek A). Onay, ilgili kaydı değiştirme yetkisini **ayrıca** gerektirmez; ancak uygulanan değişiklik onaylayanın adıyla audit'e yazılır. *(Açık soru: DevOps'un onayıyla başka birinin aksiyonunun değişmesi istenen davranış mı? F8 planında Murat onayı.)*
6. **Customer Care destek kayıtlarını** atandığı projede yönetir (mockup `Phase3Tabs.tsx`; `perm.ts`'e taşınmalı).

Rol değerleri mockup ile aynıdır: `csm`, `devops`, `care`, `manager`, `admin` (`packages/shared/enums`).
