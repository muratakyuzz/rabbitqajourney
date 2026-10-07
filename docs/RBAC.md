# Yetki Matrisi (RBAC)

Kaynak: `docs/PRODUCT_SPEC.md` → "Kullanıcılar ve roller". Uygulamadaki karşılığı `packages/shared/src/rbac/` matrisidir ve API'de `authorize()` ile zorlanır (INV-16). Bu tablo ile kod birebir aynı olmalıdır; RBAC testleri her rol × endpoint için bu tablodan üretilir.
Kısaltmalar: **R** okuma · **C** oluşturma · **U** güncelleme · **—** erişim yok · *kendi* = sahibi olduğu müşteri / kendisine atanan kayıt · **✔ (kimliksiz)** = oturum gerekmez, rolden bağımsız. **✔ (oturumlu)** = geçerli oturumu olan her aktif kullanıcı, kaynak kapsamı yok.
Hiçbir rolde DELETE yoktur (INV-03).

| Kaynak | CSM (`csm`) | DevOps (`devops`) | Customer Care (`care`) | Manager (`manager`) | Admin (`admin`) |
|---|---|---|---|---|---|
| Müşteri, proje | C (kendisi CSM olarak) · R/U *kendi* | R *atandığı proje* | R *atandığı proje* | R/U tümü, C proje, U CSM ataması | R/C/U tümü (CSM ataması dahil; proje oluştururken CSM seçer) |
| Aşama | R/U *kendi* (onay ve gerekçeli yeniden açma dahil) | R *atandığı proje* | R *atandığı proje* | R/U tümü (onay ve yeniden açma dahil) | R/U tümü (onay ve yeniden açma dahil) |
| Adım, aksiyon | R/C/U *kendi* | R *atandığı proje*, U *kendisine atanan* | R *atandığı proje*, U *kendisine atanan* | R/C/U tümü | R/C/U tümü |
| Toplantı, karar, risk | R/C/U *kendi* | R *atandığı proje* | R *atandığı proje* | R/C/U tümü | R/C/U tümü |
| Müşteri kişileri | R/C/U *kendi* | R *atandığı proje* | R *atandığı proje* | R/C/U tümü | R/C/U tümü |
| Taahhütler, satış devri, lisans | R/C/U *kendi* | — | — | R/C/U tümü | R/C/U tümü |
| Keşif cevapları, takımlar, takım bilgisi | R/C/U *kendi* | R *atandığı proje* | R *atandığı proje* | R/C/U tümü | R/C/U tümü |
| Uyarlama kontrol listesi | R/U *kendi* | R *atandığı proje* | R *atandığı proje* | R/U tümü | R/U tümü |
| Go-Live müşteri onayı | R/C *kendi* | R *atandığı proje* | R *atandığı proje* | R/C tümü | R/C tümü |
| Dokümanlar | R/C *kendi* | R *atandığı proje* | R *atandığı proje* | R/C tümü | R/C tümü |
| **Erişim bilgileri (VPN vb.)** | R(çözme endpoint'i)/C/U *kendi* | R(çözme endpoint'i)/C/U *atandığı proje* | — | — | R(çözme endpoint'i)/C/U tümü |
| KPI | R/C/U *kendi* | R *atandığı proje* | R *atandığı proje* | R/C/U tümü | R/C/U tümü |
| Destek kayıtları (**Faz 2**, mockup'ta pasif) | R/C/U *kendi* | R *atandığı proje* | R/C/U *atandığı proje* | R/C/U tümü | R/C/U tümü |
| Uyarılar (erteleme/kapatma, gerekçeli) | R/U *kendi* | R *atandığı proje* · U *sahibi olduğu* | R *atandığı proje* · U *sahibi olduğu* | R/U tümü | R/U tümü |
| Elle uyarı ekleme | C *kendi* | — | — | C tümü | C tümü |
| Haftalık müşteri raporu (oluştur, düzenle, gönderildi) | R/C/U *kendi* | — | — | R/C/U tümü | R/C/U tümü |
| İç yönetim raporu | — | — | — | R/C | R/C |
| audit_log | R *kendi müşterileri* | R *atandığı proje* | R *atandığı proje* | R tümü | R tümü |
| Konfigürasyon (kullanıcı, satışçı, modül, şablon, keşif soruları, uyarı eşikleri, tatiller) | R | R | R | R | R/C/U (silme yok, pasifleştirme; son aktif admin korunur) |
| Proje içi akış ayarı (adımın bağlılığı ve süresi) | U *kendi* | — | — | U tümü | U tümü |
| Sistem entegrasyonları (Teams, e-posta, AI ayarları) | — | — | — | — | R/C/U (secret'lar maskeli, göster = audit) |
| Eşleşmeyen e-postalar (ata / yok say) | — | — | — | — | R/U |
| Proje entegrasyonu (kanal, e-posta takibi, ek domain) | R · U *kendi* | R *atandığı proje* | R *atandığı proje* | R/U tümü | R/U tümü |
| AI önerileri (onayla / düzenle ve onayla / reddet) | R/U *kendi* | R/U *atandığı proje* | R/U *atandığı proje* | R/U tümü | R/U tümü |
| Oturum öncesi uçlar (giriş, şifremi unuttum, şifre sıfırlama) | ✔ (kimliksiz) | ✔ (kimliksiz) | ✔ (kimliksiz) | ✔ (kimliksiz) | ✔ (kimliksiz) |
| Oturumlu, kaynağa bağlı olmayan uçlar (`GET /auth/me`, `POST /auth/logout`; `session:authenticated`) | ✔ (oturumlu) | ✔ (oturumlu) | ✔ (oturumlu) | ✔ (oturumlu) | ✔ (oturumlu) |

Admin'in proje verisindeki her yazması (C/U) audit kaydında aktör rolü "admin" olarak ayrıca işaretlenir (ADR-0004 K3).

## Kararlar (2026-10-02 ve 2026-10-06, mockup davranışı + Murat onayı)
1. **Admin**, proje verisinde **tam yazma yetkisine** sahiptir (mockup `isAllSeeing` davranışı). Buna çalışma alanları, AI öneri onayı, proje oluşturma, haftalık müşteri raporu, iç yönetim raporu ve CSM ataması dahildir. Her admin yazması audit'te aktör rolü "admin" olarak ayrıca işaretlenir. *(2026-10-06 güncelleme: ADR-0004 K3, ADR-0005 K12. Önceki karar "yazma yalnızca konfigürasyonda" idi. REV-04 ve m09b/m09c round 1 açık soruları mockup'ın fiili davranışıyla çelişkiyi işaretlemişti.)*
2. **Erişim bilgisini** projenin CSM'i, o projeye **atanmış** DevOps ve **Admin** görür; oluşturma ve güncelleme yetkisi de bu üç role aittir. DevOps yalnızca atandığı projede oluşturur/günceller. Oluşturma, güncelleme ve görüntüleme işlemlerinin hepsi audit'e yazılır; değer audit'e yazılmaz (INV-11). Manager ve Customer Care erişim bilgisine erişemez. Mockup'ta proje DevOps'a ancak atanmışsa görünür; Admin K3 ile tam yetkilidir. *(2026-10-06 güncelleme: ADR-0005 K9, REV-F001. Önceki satır DevOps'a yalnızca çözme yetkisi veriyordu.)*
3. **"Atandığı proje"** = projede kullanıcıya atanmış en az bir adım veya aksiyon olması (mockup `visibleProjects`). F1-00'da bunun türetilmiş sorgu mu, `project_members` tablosu mu olacağına DATA_MODEL karar verir; davranış aynı kalır.
4. **Proje oluşturma:** CSM (kendisi CSM olarak), Manager (CSM atayarak) ve Admin (CSM atayarak). *(2026-10-06 güncelleme: ADR-0004 K3, ADR-0005 K12. Önceki karar admin'i kapsam dışı bırakıyordu. Mockup'ta Admin CSM seçemiyor, API'de seçer.)*
5. **AI önerisi** projeyi görebilen herkes tarafından onaylanır/reddedilir (Ek A). Onay, ilgili kaydı değiştirme yetkisini **ayrıca** gerektirmez; ancak uygulanan değişiklik onaylayanın adıyla audit'e yazılır. *(Açık soru: DevOps'un onayıyla başka birinin aksiyonunun değişmesi istenen davranış mı? F8 planında Murat onayı.)*
6. **Customer Care destek kayıtlarını** atandığı projede yönetir (mockup `Phase3Tabs.tsx`; `perm.ts`'e taşınmalı).
7. **Manager**, projelerde CSM ile **aynı proje verisi yazma yetkisine** sahiptir (mockup `canManageProject` davranışı). Manager'ın ekibi tüm CSM'lerdir, bu yüzden kapsam "tümü"dür. Erişim bilgileri hariçtir (Karar 2). (Her iki yorum Murat onaylı, ADR-0005.) Manager yazmaları audit'e kendi rolüyle yazılır. *(2026-10-06: ADR-0005 K8, API_CONTRACT §5 S1. Önceki matris Manager'a proje verisinde yalnızca okuma veriyordu.)*
8. **Tamamlanmış aşamayı yeniden açma** (`done → in_progress`) CSM *kendi*, Manager ve Admin içindir; gerekçe zorunludur. Onay ve tamamlanma tarihi temizlenir (audit'te kalır), sonraki aşamalar değişmez (INV-28). *(2026-10-06: ADR-0005 K10.)*
9. **Mockup davranışından eklenen satırlar** *(2026-10-06, API_CONTRACT §5 S5, S6, S7, S16; Murat onayladı — ADR-0005. Kararlarla çelişen yerde kararlar geçerlidir.)*:
   - **Elle uyarı ekleme** (`alert:create`, S5): mockup `ProjectAlertsPanel` `canManageProject` ile açıyor. Yetki: CSM *kendi*, Manager, Admin. DevOps/Care ekleyemez.
   - **Keşif cevapları, takımlar, takım bilgisi** (S6, `project:update` alt kapsamı): mockup `DiscoveryContent`/`TeamRow` `canManageProject` ile açıyor. Yetki: CSM *kendi*, Manager (K8), Admin. DevOps/Care yalnızca okur. Takım silme yoktur.
   - **Uyarlama kontrol listesi** (`adaptation:update`, S6): mockup `AdaptationWorkspace` `readOnly = !canManageProject`. Yetki aynıdır: CSM *kendi*, Manager (K8), Admin.
   - **Go-Live müşteri onayı** (`phase:approve` kapsamı, S7): mockup `GoLiveTab` `canManageProject` ile açıyor. Yetki: CSM *kendi*, Manager (K8), Admin. Onay kaydının güncellenmesi tanımlı değil (U yok); tekrar çağrının davranışı API_CONTRACT #38'de yazılır.
   - **Oturum öncesi uçlar** (S16): giriş, şifremi unuttum ve şifre sıfırlama oturumsuzdur. Bu uçlarda `authorize()` `session:public` aksiyonuyla **çağrılır** ve kimliksiz isteğe izin verir. Bu INV-16'nın istisnası değil, matristeki bir satırıdır.

Rol değerleri mockup ile aynıdır: `csm`, `devops`, `care`, `manager`, `admin` (`packages/shared/enums`).
