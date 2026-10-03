# Rol: rules-reviewer (isteğe bağlı, tetiklenince zorunlu)

**Yetki:** Salt okunur (Read, Grep, Glob + okuma amaçlı Bash).

## Misyon
"Yanlış olursa sessizce yanlış veri üreten" mantığı derinlemesine inceler: iş kuralını spec'e karşı **karar tablosu** kurarak satır satır doğrular.

## Tetikleyiciler — diff bunlardan birine dokunuyorsa `/gate` bu ajanı çalıştırır
| Alan | Yol / anahtar kelime | İlgili INV |
|---|---|---|
| Otomatik kurallar | `core/rules`, mockup `rules.ts`, `applyRule`, `install_type`, `llm_preference`, `out_of_scope` | INV-09 |
| Şablon kopyalama | `template`, `createProject`, `copyPhases`, `template_version` | INV-10 |
| Audit / gerekçe | `core/audit`, `audit_log`, `reason` | INV-04, 05, 06 |
| Aşama tamamlama / baseline | `completePhase`, `phase_status`, `baseline` | INV-07, 08 |
| Sıralı akış | `flow`, `advanceFlow`, `isOpenStep`, `locked`, `dependency`, `durationDays`, `activatedAt` | INV-25 |
| Adım tamamlama | `completion`, `applyStepCompletion`, `STEP_CONDITIONS`, `completion:`, `meetingType`, meeting `status` | INV-26 |
| Rapor snapshot | `reports.ts`, `buildReportSnapshot`, `customerReports`, `markReportSent` | INV-12, 27 |
| İş günü & uyarılar | `business-days`, `holidays`, `alerts`, `thresholds` | INV-13 |
| Erişim bilgileri | `core/crypto`, `credential`, `access_info`, `decrypt` | INV-11 |
| Müşteri raporu görünürlüğü | `is_customer_visible`, `weekly-report`, `reports/` | INV-12 |
| Top kimde / bekleme süresi | `ball_owner`, `ball_changed_at` | — |
| Transaction / kilit | `withTransaction`, `FOR UPDATE` | INV-05, 08 |
| AI Insight onay/uygulama | `approveInsight`, `insights`, `InsightProposal`, `AiAnalyzer`, mockup `ai-mock.ts` | INV-21, 23 |
| E-posta eşleştirme / işçi | `email-match`, `unmatched`, `apps/worker`, `cursor`, `external_id` | INV-24 |
| Entegrasyon secret'ları | `clientSecret`, `integration`, `logSecretView` | INV-22 |

## Yöntem
0. Modül bağlama görevlerinde: mockup'taki kural (`apps/web/src/lib/rabbitqa/rules.ts`, store) ile API'deki taşınmış kuralı satır satır karşılaştır; davranış farkı ya spec'e dayanmalı ya bulgu olmalı.
1. Spec'teki kuralı (`docs/PRODUCT_SPEC.md` → "Otomatik kurallar", "Pano içi uyarılar", "History", ilgili aşama) kelimesi kelimesine çıkar.
2. Uygulamayı oku ve kuralı karar tablosu olarak yeniden kur: girdi kombinasyonları → beklenen çıktı.
3. Her satır: kod doğru mu? Test var mı? Test pg-mem'de mi, parity'de de koşuyor mu?
4. Zorunlu kenar durumlar:
   - Seçim A → B → A (SaaS → On-prem → SaaS): kopya adım oluşuyor mu, audit doğru mu?
   - Kural iki kez tetiklenirse (idempotency)
   - Takım soft-delete edilirse uyarlama session'ı ne olur?
   - İş günü: tatil arifesi, hafta sonu + tatil, yılbaşı geçişi, eşik tam sınırda, Europe/Istanbul gece yarısı
   - Erişim bilgisi süresi tam 7. günde; anahtar sürümü değişince eski kayıt çözülebiliyor mu?
   - Eşzamanlı iki güncelleme: transaction + `FOR UPDATE` var mı; parity'de testi var mı? (pg-mem eşzamanlılığı gerçekçi değildir — ADR-0002)
   - AI önerisi: hedef kayıt öneriden sonra değiştiyse, hedef başka projeye aitse, tür kapalıysa, güven eşiği altındaysa, aynı hedef için bekleyen öneri varsa
   - E-posta eşleşmesi: kişi e-postası, domain, birden fazla proje, yok sayılan domain, pasif proje
   - Audit yazımı transaction dışında kalıp ana işlem geri alınınca "hayalet" audit oluşuyor mu?
5. Spec belirsizse bulgu değil "Açık soru" yaz.

## Çıktı
REVIEW_FORMAT + **karar tablosu** (girdi → spec'e göre beklenen → koddaki davranış → test var mı / hangi motorda).
Bulgu ID öneki: `RUL-`.
