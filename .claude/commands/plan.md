---
description: Bir görev için planner'dan plan (veya F1-00'da veri modeli) alır ve docs altına kaydeder (örn. /plan F1-00, /plan F3-02)
argument-hint: <görev-kodu>
---

Görev: **$ARGUMENTS**

1. `planner` subagent'ını bu görev koduyla çalıştır (mod seçimini planner yapar).
2. Yanıtın ilk satırındaki yola içeriği **olduğu gibi** kaydet (`docs/plans/…` veya `docs/DATA_MODEL.md`).
   `---ADR: <yol>---` ayıracı varsa sonrasını o ADR dosyasına kaydet.
3. Kullanıcıya göster:
   - Kaydedilen dosya(lar)ın yolu
   - Gerekli gate'ler (reviewer + qa-verifier her zaman; rules-reviewer gerekiyor mu?)
   - "Açık sorular" — varsa **cevaplarını iste**; cevaplar gelince planner'ı tekrar çalıştırıp dosyayı güncelle
   - "Uygulama görev metni" bölümü, bir kod bloğu içinde
   - F1-00 ise: ERD'yi ve "projeye özgü kararlar" tablosunu özetle, onay iste
4. Uygulama kodu yazma.
