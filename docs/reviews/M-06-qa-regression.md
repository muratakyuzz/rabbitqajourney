# qa-verifier — main (M-06 kapanış, round 2) @ 0c1193b

**Karar:** APPROVE (regresyon + M-06 baseline tamamlandı; demo modu, backend yok)

Çalışma dizini: `/Users/murat/Development/rabbitqajourney/.verify/main` (main @ 0c1193b, fix/m06-risk-reason merge edilmiş hali). Kaynak koda, teste veya pakete yazılmadı — `.verify/main` içinde `git status --short` boş.

### Komut kanıtları
| Komut | Exit | Özet (çıktıdan alıntı) |
|---|---|---|
| `npm ci` | 0 | "added 550 packages, and audited 551 packages" (17 vuln — bilinen, referansla aynı sınıf) |
| `npx tsc --noEmit` | 0 | çıktı yok (temiz) |
| `npm run lint` | 1 (lint kuralı: hata varsa non-zero) | "✖ 42 problems (14 errors, 28 warnings)" — round 1 referansıyla (M-closure.md: "14 hata/28 uyarı") **birebir aynı, regresyon yok** |
| `npm test -- --run` | 0 | "Test Files 12 passed (12)" · "Tests 205 passed (205)" — round 1 referansı 11 dosya/197 testti; **+1 dosya (`Phase3Tabs.RiskDialog.test.tsx`), +8 test** (REV-01 fix'inin AC1-AC4 testleri + store.test.tsx eklemeleri) |
| `npm run build` | 0 | "✓ built in 4.98s" · `dist/assets/index-*.js 1,224.05 kB` (bilinen ~1.22 MB uyarısı, regresyon yok) |

RiskDialog testi dosya içinde doğrulandı: `src/pages/project/Phase3Tabs.RiskDialog.test.tsx (4 tests)` → "RiskDialog — status/due reason guard (REV-01, INV-06, AC1-AC4)" başlığı altında 4 test, hepsi PASS.

### Kabul kriteri ↔ test (REV-01 fix, M-closure.md'deki AC'ler)
| AC | Test | Sonuç |
|---|---|---|
| AC1 (durum değişir, gerekçe boş → engellenir) | `Phase3Tabs.RiskDialog.test.tsx` › "AC1: blank reason on a status change blocks save and shows an error" | PASS |
| AC2 (termin değişir, gerekçe girilir → kaydedilir, audit reason dolu) | aynı dosya, 4 testten biri (AC2) | PASS (dosya genelinde 4/4 PASS) |
| AC3 (başlık/açıklama değişir → gerekçe istenmez) | aynı dosya (AC3) | PASS |
| AC4 (yeni kayıt → gerekçe istenmez) | aynı dosya (AC4) | PASS |

### Tarayıcı kontrolü (Playwright MCP, demo modu — backend yok, gerçek API çağrısı yapılmadı)
Sunucu: `npx vite --host 127.0.0.1 --port 8090` (arka planda başlatıldı, iş bitince `pkill` ile kapatıldı — kapatma doğrulandı: `curl` 000 döndü).

| Kontrol | Rol | Sonuç | Kanıt |
|---|---|---|---|
| RiskDialog'da durum değişince "Gerekçe (zorunlu)" alanı görünüyor | csm | PASS | `docs/reviews/M-06/baseline/csm-phase6-riskdialog-reason-field.png` |
| Gerekçe boş + Kaydet → "Gerekçe zorunlu" toast, dialog açık kalır, veri değişmez | csm | PASS | `docs/reviews/M-06/baseline/csm-phase6-riskdialog-reason-error-toast.png`; snapshot sonrası tablo "Açık" durumunda kaldı (mutasyon olmadı) |
| 13 sekme (Destek kayıtları "Faz 2" pasif) | csm/devops/care | PASS | `csm-project-detail-phases.png` |
| Erişim bilgileri sekmesi: atanmış DevOps görür | devops | PASS | `devops-tab-access-credentials.png` |
| Erişim bilgileri sekmesi: Customer Care görmez (RBAC satır 16) | care | PASS | `care-project-detail-no-credentials-tab.png` (tab listesinde "Erişim bilgileri" yok) |
| Admin tüm proje verisini okur (yazma yalnızca config) | admin | PASS | `admin-project-detail.png`, `admin-settings-*.png` |
| Manager'da Erişim bilgileri yok (RBAC) | manager | PASS | `manager-project-detail-no-credentials-tab.png` |
| Konsol hatası yok (tüm roller, tüm ekranlar) | hepsi | PASS | `browser_console_messages` her ekranda "Errors: 0" |
| Dar ekran (390px) layout kırılmıyor | care | PASS | `care-project-detail-mobile-390.png`, konsol hatası 0 |

### M-06 görsel baseline (`docs/reviews/M-06/baseline/`, 35 PNG)
Roller: csm (Deniz Uzun), manager (Örnek Manager), admin (Örnek Administrator), devops (Çağla Kahriman), care (Gençay Genç) — RBAC.md'deki 5 rolün tamamı.

Kapsanan ekranlar: login, csm genel bakış/insights/my-work/projeler listesi/müşteri raporu, proje detayının 13 sekmesinin tamamı (Aşamalar ve adımlar, Aksiyonlar, Toplantılar, Keşif ve takımlar, Erişim bilgileri, Dokümanlar, Riskler ve kararlar — RiskDialog gerekçe alanı dahil 3 varyant, Go-Live, Süreklilik, Entegrasyonlar, Müşteri kişileri, Müşteri geçmişi), 00 Satış Devri çalışma alanı paneli, manager yeni proje diyaloğu + yönetim raporu, admin sistem ayarları (Aşama şablonu, Kullanıcılar, Entegrasyonlar, Değişiklikler/audit log), devops ve care'in proje detayında Erişim bilgileri sekmesinin varlık/yokluk farkı, mobil (390px) görünüm.

Dosya listesi (`ls docs/reviews/M-06/baseline/`): admin-overview, admin-project-detail, admin-settings-audit-log, admin-settings-integrations, admin-settings-template, admin-settings-users, care-overview, care-project-detail-mobile-390, care-project-detail-no-credentials-tab, csm-customer-report, csm-insights, csm-my-work, csm-overview, csm-phase00-handover-workspace, csm-phase6-riskdialog-edit-default, csm-phase6-riskdialog-reason-error-toast, csm-phase6-riskdialog-reason-field, csm-project-detail-phases, csm-projects-list, csm-tab-access-credentials, csm-tab-actions, csm-tab-contacts, csm-tab-continuity, csm-tab-discovery-teams, csm-tab-documents, csm-tab-golive, csm-tab-history, csm-tab-integrations, csm-tab-meetings, devops-overview, devops-tab-access-credentials, login, manager-new-project-dialog, manager-overview, manager-project-detail-no-credentials-tab, manager-reports.png.

### Not: AUDIT §4 son kontrolü
AUDIT.md §2'deki ekran listesi (13 sekme, admin alt ekranları) ile üretilen baseline birebir örtüşüyor; fark yok.

### Açık sorular / öneriler (engelleyici değil)
- Reviewer'ın round 2 bütünsel incelemesi (`docs/reviews/M-full-review.md`) yeni bulgu REV-13 (High) buldu: `approveInsight` kilitli adımı elle açabiliyor (INV-25). Bu bulgu qa-verifier kapsamının (M-06 QA) dışında; REV-13 High olduğu için M-06 freeze kararını etkileyebilir — planner'a bildirilir.
- Lint hata sayısı (14) hâlâ referansla aynı; bunlar F0-02 kapsamında kalan bilinen borç, M-06'yı etkilemiyor.

### Kapatma
Dev sunucusu (port 8090) kapatıldı ve doğrulandı (`curl` → bağlantı yok). `.verify/main` içinde hiçbir kaynak/test/paket dosyası değişmedi.
