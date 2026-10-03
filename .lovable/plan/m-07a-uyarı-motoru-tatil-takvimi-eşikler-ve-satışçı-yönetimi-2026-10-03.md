# M-07a: Uyarı motoru, tatil takvimi, eşikler ve satışçı yönetimi

Ortak kurallar geçerli: demo kalır, her değişiklik store + audit, gerekçe zorunlu, enum'lara yalnızca ekleme, yetki yalnızca perm.ts, iş günü yalnızca business-days.ts, akış yalnızca flow.ts, yeni paket yok, Türkçe / gg.aa.yyyy, AGENTS.md vb. dokunulmaz.

## Kullanıcının göreceği
- Uyarılar artık otomatik hesaplanır (14 tip), seviye "Sarı" / "Kırmızı". Elle eklenenler aynı listede.
- Proje > Uyarılar: seviye/tip/durum filtresi; her satırda "Ertele" (tarih + gerekçe) ve "Kapat" (gerekçe). Elle eklenenlerde de "Çözüldü" yerine "Kapat".
- Üst bardaki zil: gerçek açık uyarı sayısı; tıklayınca son 8 uyarı, ilgili projenin Uyarılar sekmesine gider. Uyarı yoksa rozet yok.
- Projeler listesinde "Açık uyarı" kolonu (sayı + en yüksek seviye rengi).
- Bana atananlar: yeni "Uyarılarım" bölümü.
- Aşama durumu türetilir: Gecikti / Risk altında / Devam ediyor; bu iki durum elle seçilemez.
- Sistem ayarları: yeni "Satışçılar" sekmesi (ekle, ad düzenle, pasifleştir/aktifleştir) ve "Uyarılar" sekmesi (8 eşik + resmi tatil listesi ekle/düzenle/sil). Yalnızca admin görür. Pasif satışçı yeni projede ve Satış devrinde seçilemez.

## Adımlar
1. types.ts: Holiday, AlertThresholds, AlertState, AlertType, ComputedAlert; Salesperson.active; RqState'e holidays, alertThresholds, alertStates, reportsSent.
2. business-days.ts: tüm fonksiyonlara opsiyonel `holidays` parametresi (varsayılan sabit liste, yarım günler iş günü). Tatillere ad eklenir, arifeler halfDay.
3. flow.ts ve store: hesaplarda state.holidays geçirilir.
4. alerts.ts (yeni, saf): computeAlerts(state, today) — 14 kural, eşikler state'ten; kilitli adım/aşama hariç; elle uyarılarla birleştiren ve alertStates'i uygulayan yardımcı (ertelenen tarihten sonra yeniden açık, kapatılan kalıcı kapalı); derivePhaseStatus.
5. Store: snoozeAlert(key, until, reason), closeAlert(key, reason) — gerekçe zorunlu, audit (Müşteri geçmişinde görünür); setConfig'e "salespeople" | "alertThresholds" | "holidays".
6. perm.ts: canAccessAdmin, canManageTickets, canHandleAlert; Admin.tsx, Phase3Tabs.tsx ve diğer bileşenlerdeki rol karşılaştırmaları bunlarla değiştirilir (Overview hariç).
7. Arayüz: Phase3Tabs Uyarılar sekmesi (filtre + Ertele/Kapat diyalogları), AppShell zil açılır listesi, Projects kolonu, MyWork "Uyarılarım", aşama durum rozetinde türetme, PhaseDialog kısıtı, labels'da Sarı/Kırmızı + 14 tip adı, satışçı seçicilerde pasif filtre, Admin iki yeni sekme.
8. Seed: holidays (adlarıyla), eşikler, satışçılardan biri pasif; İş Yatırım + Garanti verisine 14 tipin hepsini tetikleyecek eklemeler (süresi dolmak üzere VPN, cevapsız zorunlu keşif sorusu, hedefsiz KPI, lisans uyumsuzluğu, eksik devir dokümanı, sessiz proje, açık taahhüt vb.); bir ertelenmiş, bir gerekçeyle kapatılmış uyarı.
9. Depo sürümü 7, KEY `rabbitqa-demo-state-v7`; eski kayıt bulunursa demo verisi yeniden yüklenir.
10. Doğrulama: typecheck + Playwright — 14 tipin görünmesi, gerekçesiz kapatma/ertelemenin engellenmesi, Admin'de tatil ekleyince terminin kayması, admin dışı rolün sekmeleri görmemesi.

## Bilmeniz gerekenler
- Demo verisi baştan yüklenir; önceki denemeler silinir.
- "Rapor gönderilmedi" uyarısı için yalnızca altyapı (gönderim kaydı) eklenir; rapor arşivi ve "Gönderildi" düğmesi M-07b'de gelir. O zamana kadar bu uyarı cuma ve sonrasında seed'den tetiklenir.
