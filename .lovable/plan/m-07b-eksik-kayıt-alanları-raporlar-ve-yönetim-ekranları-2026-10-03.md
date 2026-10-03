# M-07b — Eksik kayıt alanları, raporlar ve yönetim ekranları

Ortak kurallar aynen uygulanır: demo kalır (veritabanı yok), her değişiklik store + audit, gerekçe zorunluluğu, enum'lara yalnızca ekleme, yetki yalnızca perm.ts, iş günü yalnızca business-days.ts, akış yalnızca flow.ts, uyarılar yalnızca alerts.ts, yeni paket yok, Türkçe / gg.aa.yyyy, AGENTS.md ve korunan dosyalara dokunulmaz. Depo sürümü 8, KEY `rabbitqa-demo-state-v8`; eski kayıt bulunursa demo verisi baştan yüklenir.

## Kullanıcının göreceği değişiklikler

1. **Risk ve karar** — Riskte Etki + Olasılık (Düşük/Orta/Yüksek) + Azaltma planı; kararda Tarih + İlgili toplantı. Toplantı detayında bağlı kararlar listelenir.
2. **Destek kaydı** — Tür (Teknik / Kullanım / Geliştirme talebi) kolonu ve filtresi; Çözüm metni ("Çözüldü"/"Kapandı" için zorunlu); geliştirme talebinde Product Kurulu kararı ve müşteriye bildirim tarihi.
3. **Go-Live müşteri onayı** — Onaylayan projenin müşteri kişilerinden seçilir + tarih; seçilmeden kaydedilemez. Gösterim: "Onaylayan: Kişi (Unvan) · gg.aa.yyyy · Kaydeden: Kullanıcı". Açık taahhüt uyarısı + gerekçe korunur.
4. **Süreklilik sekmesi** — Go-Live yanında: check-in toplantıları + "Check-in ekle", açık destek kayıtları (türe göre), KPI son ölçüm ve hedefe göre durum. Go-Live bitmemişse bilgi notu.
5. **Müşteriye görünür** — Aksiyon, toplantı, risk/karar ve KPI formlarında anahtar; listelerde göz ikonu. Varsayılanlar: aksiyon/KPI açık, toplantı/risk kapalı, aşama onayı aksiyonları kapalı.
6. **Haftalık müşteri raporu** — "Rapor oluştur" (hafta seçimi) taslağı dondurur; düzenlenebilir özet ve gelecek hafta; bölümler: sağlık, aşama ilerlemesi, tamamlananlar, açık aksiyonlar (Virgosol / müşteri), "Sizden beklenenler" (kaç iş günüdür), riskler ve kararlar, KPI hedef/mevcut. "Gönderildi olarak işaretle" sonrası düzenlenemez. Rapor arşivi (hafta, oluşturan, durum, gönderilme) ve snapshot görünümü. Yalnızca müşteriye görünür kayıtlar; iç sağlık gerekçesi asla girmez. "Rapor gönderilmedi" uyarısı bu kayıtlara göre kapanır.
7. **Yönetim raporu** — Dönem seçimi (Bu hafta / Bu ay / Son 3 ay / Özel aralık); KPI kartları; recharts grafikleri (sağlık dağılımı, gecikenlerin sahibe göre dağılımı, CSM başına müşteri + iş yükü); tabloya gecikme, baseline sapması, lisans uyumsuzluğu; müşteride bekleyen adımlar, yüksek etkili riskler, türe göre destek sayıları.
8. **Kullanıcı yönetimi (Admin > Kullanıcılar)** — Ekle (benzersiz e-posta), rol değiştir, pasifleştir/aktifleştir. Pasif kullanıcı giriş yapamaz ("Hesap pasif") ve yeni atamalarda seçilemez; son aktif admin korunur.
9. **Keşif soruları** — Tip (Metin / Modül çoklu seçim) ve yukarı/aşağı sıralama; modül sorusu çoklu seçimle cevaplanır ve istenen modüllerle senkron kalır.
10. **Küçük eksikler** — KPI kartında zaman grafiği + hedef çizgisi; toplantıda "Ekler" (liste + doküman ekle); Kick-off kaydında tek özet bildirim + "Müşteri geçmişinde gör".
11. **Örnek veri** — Olasılık/azaltma planlı risk, toplantıya bağlı karar, üç tür destek kaydı (biri planlanmış geliştirme talebi), İş Yatırım'da bir gönderilmiş + bir taslak rapor, bir pasif kullanıcı, farklı görünürlük değerleri.

## Teknik ayrıntılar

- `types.ts`: RiskDecision (probability, mitigation, meetingId, decidedAt), SupportTicket (type, resolution, boardDecision, customerNotifiedAt), Action/Meeting/RiskDecision/Kpi `isCustomerVisible`, User.active, DiscoveryQuestion (type, order), CustomerReport, Go-Live onayı alanları (approvedByContactId, approvedAt, recordedBy). RqState.customerReports; `reportsSent` kaldırılmaz ama artık kullanılmaz.
- `store.tsx`: v8 KEY, `approveGoLive(projectId, contactId, approvedAt, reason)`, `createCustomerReport`, `updateCustomerReport` (yalnızca taslak), `markReportSent`, `setConfig("users")` (son admin + benzersiz e-posta kontrolü), destek durum değişiminde çözüm doğrulaması, setKickoff dönüşünde değişiklik özeti. Hepsi audit yazar.
- `alerts.ts`: report_not_sent customerReports'a göre.
- `perm.ts`: canManageUsers, canEditReport, canMarkReportSent; aktif kullanıcı filtresi yardımcıları (`selectableUsers`).
- `auth-api.ts`: localStorage v8 state'teki users'ı okur, yoksa SEED_USERS; pasif → "Hesap pasif".
- Yeni dosyalar: `UsersAdmin.tsx`, `ContinuityTab.tsx`, `ReportArchive` bileşeni, `KpiChart.tsx`; düzenlenenler: Phase3Tabs, Phase2 sekmeleri (KPI, toplantı, kick-off, keşif), CustomerReport, ManagementReport, Admin, ProjectDetail, seed.
- Doğrulama: typecheck + Playwright ile kabul kriterleri (gizli aksiyonun raporda görünmemesi, gönder → uyarı kapanır, pasif kullanıcı girişi reddi, çözümsüz "Çözüldü" engeli, müşteri kişisiz Go-Live engeli).
