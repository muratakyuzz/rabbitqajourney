# Repo Denetimi — v3 (main @ 4bfa4cb, 2026-10-03)

Lovable ile mockup geliştirmesi **bitti**; Lovable artık kullanılmaz. Bu sürüm mockup'ın son halini, spec kapsamasını ve BE'ye geçiş öncesi teknik durumu kaydeder. Önceki sürümler: v1 (77b938d), v2 (49976be).

## 1. Özet
- Demo uygulama (backend yok, veri localStorage'da) spec'in tamamını ve Ek A'yı (AI Insight + entegrasyonlar) ekranda karşılıyor. State sürümü **v11** (`rabbitqa-demo-state-v11`, M-09c main @ 48b6788), store'da **51 işlem**.
- Lovable'ın son turları: sıralı akış (bağlılık, iş günü süresi, kilitli adım), 14 tipli uyarı motoru, tatil takvimi ve eşikler, satışçı ve kullanıcı yönetimi, "müşteriye görünür" işareti, haftalık rapor arşivi (snapshot), yönetim raporu, Süreklilik sekmesi, risk/destek/Go-Live alanları.
- **M-09a + M-09b + M-09c main'de (tamamlandı).** M-09b ile "Satış devri" ve "Kick-off" sekmeleri kalktı; 00 Satış Devri artık aşama çalışma alanı panelinde (`PhaseWorkspaceSheet`/`HandoverWorkspace`), `reqdoc` adımı veriyle (`data`) tamamlanıyor. M-09c ile proje detayı **13 sekmeye** indi (Eğitim, Uyarlama, Uyarılar sekmeleri aşama çalışma alanına / başlık rozetine taşındı; Destek kayıtları "Faz 2" olarak pasif); `TrainingSession`/`AdaptationSession`/`trainings` koleksiyonu kalktı (Eğitim = `meetings.type: "training"`, Uyarlama = takım başına tek veri adımı + 5 maddelik kontrol listesi); RUL-05 Seçenek A (`ensureReviewAction`/`cancelReviewAction`, `rule_review:*` aksiyon ailesi) uygulandı.
- **Kalan mockup işi uygulama oturumunda:** M-06 dondurma (görsel referans + `mockup-freeze` etiketi). Planlar: `docs/plans/M-09-step-completion-workspaces.md`.
- Kit dosyaları (AGENTS.md, CLAUDE.md, `.claude/`, `docs/`, CI) artık repoda.

## 2. Ekranlar (son hal)
| Rota | Ekran |
|---|---|
| /login, /forgot-password, /reset-password | Demo giriş (store'daki kullanıcılar; pasif kullanıcı giremez) |
| /app/overview | Genel bakış: KPI kartları, AI Insight kartı, darboğazlar |
| /app/insights | AI Insight: Bekleyen / Geçmiş |
| /app/projects | Müşteri projeleri (açık uyarı kolonu) |
| /app/projects/:id | 13 sekme (M-09c ile son düzen): Aşamalar ve adımlar · Aksiyonlar · Toplantılar · Keşif ve takımlar · Erişim bilgileri (yalnızca `canSeeCredentials`) · Dokümanlar · Riskler ve kararlar · Go-Live · Süreklilik · Entegrasyonlar · Müşteri kişileri · Müşteri geçmişi · Destek kayıtları (pasif, "Faz 2"). 02 Keşif, 03 Erişim, 04 Eğitim, 05 Uyarlama artık aşama çalışma alanı panelinde (`PhaseWorkspaceSheet`); uyarılar başlık rozeti + sağ panelde (`ProjectAlertsPanel`) |
| /app/projects/:id/report | Haftalık müşteri raporu (oluştur, düzenle, gönderildi, arşiv, yazdır/PDF) |
| /app/my-work | Bana atananlar (+ Uyarılarım, Sıradaki işlerim, bana önerilen AI önerileri) |
| /app/reports | Yönetim raporu (dönem seçimi, grafikler) — manager, admin |
| /app/admin | Sistem ayarları: Aşama şablonu · Modüller · Entegrasyonlar · Keşif soruları · Kullanıcılar · Satışçılar · Uyarılar · Değişiklikler — admin |

M-09c tamamlandı: yukarıdaki satır bu halin sonucudur.

## 3. BE sözleşmesinin kaynağı
- **Store `Ctx` (51 işlem, M-09c ile 53 → 51):** proje/aşama/adım/aksiyon · toplantı/kişi/taahhüt · kick-off/takım/KPI/erişim/doküman · uyarı (ekle, ertele, kapat) · destek · risk/karar · Go-Live onayı · haftalık rapor (oluştur, güncelle, gönderildi) · kullanıcı (ekle, güncelle) · ayarlar (`setConfig`) · entegrasyon & AI (test, kes, secret göster, proje entegrasyonu, öneri onay/red, eşleşmeyen e-posta, simülasyon). M-09c ile `addTraining`/`updateTraining`/`saveAdaptation` kalktı, `setAdaptationCheck` eklendi (Uyarlama artık takım başına tek veri adımı + 5 maddelik kontrol listesi; Eğitim `meetings.type: "training"`).
- **Saf iş mantığı (BE'ye taşınacak, `packages/shared` veya `apps/api/core`):**
  | Dosya | İçerik | Hedef |
  |---|---|---|
  | `flow.ts` | `advanceFlow`, `projectPlan`, `isOpenStep` — kilitli adım, bağlılık, iş günü termini, "aşama onayı bekliyor" aksiyonu | `core/rules` (F4-01) |
  | `rules.ts` | Kurulum tipi / LLM kuralları | `core/rules` |
  | `alerts.ts` | 14 uyarı tipi, eşikler, Sarı/Kırmızı | F6 |
  | `business-days.ts` | İş günü + tatil listesi | `packages/shared/business-days` (F6-01) |
  | `reports.ts` | Haftalık rapor snapshot'ı | F7-02 |
  | `email-match.ts`, `ai-mock.ts` | E-posta eşleştirme, mock AI analizi | F8 |
  | `completion.ts` (M-09a ile geldi) | Veri/toplantı ile adım tamamlama | `core/rules` |

## 4. Spec kapsaması (son)
İlk spec: **31/31 karşılandı.** Ek A (AI Insight + entegrasyonlar): **7/7.** Mockup'ta bilinçli olarak yapılmayan ve **BE veri modeline (F1-00)** bırakılanlar:
| Konu | Mockup | Veri modelinde |
|---|---|---|
| Takım | `Project.teams: string[]` + `teamInfo` | `teams` tablosu |
| Aksiyon sahibi | `ownerId` kullanıcı veya kişi | `owner_type` |
| Eğitim / uyarlama katılımcıları | Serbest metin (M-09c ile toplantıya taşınır) | Toplantı katılımcıları |
| Şablon sürümü | Şablon state'te, proje sürüm tutmuyor | `template_versions` |
| Şifreler | Erişim bilgisi ve entegrasyon secret'ları düz metin | Şifreli (INV-11, INV-22) |

## 5. Teknik sağlık
| Kontrol | v1 (77b938d) | v2 (49976be) | v3 (4bfa4cb) |
|---|---|---|---|
| `npm ci` | ❌ | ❌ | ❌ kilit dosyası senkron değil |
| `tsc --strict` | 0 | 0 | 0 |
| Lint | 5 hata | 15 hata | **16 hata, 28 uyarı** |
| Test | 1 örnek | 1 örnek | 1 örnek |
| Build | 508 KB | 668 KB | **1.163 KB** (code-split yok) |
| `npm audit --omit=dev` | 13 high | 19 high | 19 high (22 toplam) |
| Yeni paket | — | yok | yok |
| `.env` repoda | evet | evet | evet |
| En büyük dosyalar | ProjectDetail 842 | 897 | **ProjectDetail 1031**, store 760, Phase3Tabs 537, Phase2Tabs 512 |
| Rol kontrolü `perm.ts` dışında | 2 | 2 | 0 (Overview'daki role göre içerik hariç) |
| Kullanılmayan | xlsx, supabase, confetti, mcp-js, lovable-tagger | aynı | aynı + `.lovable/` planları, README'deki Lovable metni |

**M-09b notu (main @ aee9657):** `npm ci` artık çalışıyor — `package-lock.json` senkronize edildi (QA-01). `bun.lockb` hâlâ repoda; kalkması F0-02'de.

## 6. Sonuç
1. Lovable'a bağlı hiçbir iş kalmadı. **M-09c tamamlandı** (main @ `48b6788`, 2026-10-06): state v11, 13 sekme, `trainings` koleksiyonu kalktı, `rule_review:*` aksiyon ailesi.
2. Sıradaki iş **M-06 dondurma**: görsel referans + `mockup-freeze` etiketi → F0 başlar.
3. F0-02 temizliği büyüdü: `.lovable/`, README, Supabase dosyaları, kullanılmayan paketler, `bun.lockb`, lint, bundle. `package-lock.json` senkronu M-09b'de tamamlandı.

## 7. M-09c sonrası durum (main @ `48b6788`, 2026-10-06)
- **State:** v10 → v11 (`rabbitqa-demo-state-v11`).
- **Sekmeler:** proje detayı 13 sekmeye indi. Eğitim/Uyarlama/Uyarılar sekmeleri kalktı; 02/03/04/05 aşama çalışma alanı paneline (`PhaseWorkspaceSheet`), uyarılar başlık rozeti + sağ panele (`ProjectAlertsPanel`) taşındı. "Destek kayıtları" `disabled` + "Faz 2" rozetiyle pasif (kod/veri silinmedi).
- **Yeni seed projeleri (v11):** `p_lojistik` (`reqdoc_not_shared` örneği — M-09b S2 devri) ve `p_perakende` (Uyarlama aktif örneği, "Mobil" takımı).
- **RUL-05 kararı (Seçenek A, S2):** Tamamlanmış aşamadaki adımların durumu otomatik kuralla (kurulum tipi, LLM tercihi, takım ekleme) değiştirilmez; bunun yerine CSM'e `rule_review:<stepId>` aksiyonu açılır (`ensureReviewAction`/`cancelReviewAction`, idempotent, A→B→A güvenli). Seçenek B (tamamlanmış aşamayı yeniden açma) seçilmedi.
- **Store `Ctx`:** 53 → 51 işlem (`addTraining`/`updateTraining`/`saveAdaptation` kalktı, `setAdaptationCheck` eklendi).
- Değişiklik notu: `docs/changes/feat_m09c-phase-workspaces-tabs.md`. Gate kayıtları: `docs/reviews/feat_m09c-phase-workspaces-tabs/`.
