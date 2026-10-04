# Review Backlog (Medium/Low bulgular)

Bu dosya `/gate` çalıştırmalarından çıkan, merge'i engellemeyen Medium/Low bulguları biriktirir.

## feat/m09a-step-completion (@ 6253eb4, 2026-10-04 — round 1)

REV-01, REV-02, REV-03, REV-04, REV-06, RUL-01, RUL-02, RUL-03, RUL-08 round 2'de (@ c3048ec) düzeltildi ve doğrulandı — aşağıdaki tablodan çıkarıldı.

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-05 | Low | `MkAudit` tipi 3 yerde kopyalanmış, `./flow`'dan import edilmeli | src/lib/rabbitqa/completion.ts:6, rules.ts:4 | M-09b |
| RUL-04 | Low | `applyMeetingHeldRules` idempotans + SaaS out_of_scope testleri yok | src/lib/rabbitqa/completion.test.ts:330-352 | M-09b |
| RUL-05 | Low | AC10 out_of_scope→pending→done store seviyesinde uçtan uca test yok | src/lib/rabbitqa/store.test.tsx:17-44 | M-09b |
| RUL-06 | Low | `go_no_go` held kuralı akışı atlıyor (bilinçli, M-09c'de kaldırılacak) | src/lib/rabbitqa/rules.ts:130-132 | M-09c |
| RUL-07 | Low | `updateMeeting` held toplantının type/date'ini gerekçesiz değiştirebiliyor | src/lib/rabbitqa/store.tsx:285-301 | M-09b/c |
| RUL-09 | Low | Meeting adımı geri açılınca audit metni "veri eksildi" diyor (yanıltıcı) | src/lib/rabbitqa/completion.ts:145-146 | M-09b |

## feat/m09a-step-completion (@ c3048ec, 2026-10-04 — round 2)

| ID | Severity | Özet | Dosya | Hedef faz |
|---|---|---|---|---|
| REV-07 | Medium | AC13 store testi (`p_isyatirim`) zaten `done` olan bir adımı sınıyor, "held meeting → step done" iddiasını gerçekte test etmiyor | src/lib/rabbitqa/store.test.tsx:151-165 | M-09a fix (önerilir) |
| RUL-11 | Medium | `applyLlmChoice` (gpu→own→gpu, idempotans, model_install geçişleri) için hiç test yok | src/lib/rabbitqa/rules.ts:69-103 | M-09a fix (önerilir) |
| REV-08 | Low | `manualStatusError`/`approveInsight` kontrolleri negatif (`!== "manual"`) yazılmış; `completion` alanı tanımsız bir adımda motorla UI zıt karar verir (bugün ulaşılamıyor, savunma amaçlı) | src/lib/rabbitqa/completion.ts:178, store.tsx:653 | M-09b |
| RUL-10 | Low | SaaS→On-prem→SaaS testinin assert'leri dar (audit sayımı toplam, id/son durum kontrolü yok) | src/lib/rabbitqa/store.test.tsx:230-259 | M-09b |
| RUL-12 | Low | İş günü kenar durumları (tatil arifesi, tam sınır) hiç test edilmiyor | src/lib/rabbitqa/completion.ts:148, alerts.ts:68 | M-09b |
| RUL-13 | Low | `addDocument`/`setKickoff` reqdoc adımını `out_of_scope` durumunu kontrol etmeden done yazıyor (main'den kalma, bu diff satırı yeniden yazdı) | src/lib/rabbitqa/store.tsx:378, 420 | M-09b |

### Açık sorular (Murat kararı gerekiyor, backlog değil ama not edildi)
- Canlı keşif soruları: admin bir soruyu zorunlu yaparsa açık projelerde adım geri açılabilir mi? (rules-reviewer Açık soru 1)
- Geri açılmada eski `due` korunuyor, `ballSince` sıfırlanmıyor — spec net değil (rules-reviewer Açık soru 2)
- SaaS geçişinde done `vpn_info` adımı "Tamamlandı" kalıyor, spec "Kapsam dışı" diyor — done adımlar kural dışı mı? (rules-reviewer Açık soru 3)
- S4: Planlandı→Yapıldı gerekçesiz — plan varsayımı onay bekliyor (rules-reviewer Açık soru 4)
- `reqdoc` adımı `manual` kaldı, fiilen veriye dayalı (rules-reviewer Açık soru 6)
- Locked aşamada pending adım olabiliyor, INV-25'e yakın boşluk — F1 servis katmanında kapatılmalı (rules-reviewer Açık soru 7)
- Plan dosyasının `main` yerine branch üzerinden gelmesi (2bf2de9) — iş akışı onayı gerekiyor (reviewer notu)
- `package-lock.json` main'de de `npm ci` ile senkron değil (pre-existing, bu PR'a özgü değil) — ayrı kapsam dışı commit önerilir (qa-verifier notu)
