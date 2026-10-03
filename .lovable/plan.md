# Sıralı onboarding akışı (bağlılık + iş günü süresi)

Ortak kurallar bu ve sonraki tüm değişikliklerde geçerli: demo kalır (backend yok), her değişiklik store + audit üzerinden, gerekçe zorunlulukları, enum'lara yalnızca ekleme, yetki yalnızca perm.ts'te, yeni paket yok, Türkçe arayüz ve gg.aa.yyyy, AGENTS.md / docs / .claude vb. dokunulmaz, notlar yalnızca .lovable/ altına.

## Kullanıcının göreceği
- Yeni projede yalnızca ilk aşama (ve bağımsız aşamalar) açık; adımlar sırası gelince "Bekliyor" olur, termin açıldığı günden itibaren süre kadar iş günü (hafta sonu + resmi tatil atlanır).
- Sırası gelmeyen adım/aşama gri, kilit ikonlu "Sırası gelmedi" rozetiyle görünür; iş listelerinde, gecikenlerde, müşteride bekleyenlerde sayılmaz.
- Adım bitince sıradaki adım açılır, sahibine düşer, toast gösterilir; zorunlu adımlar bitince CSM'e "Aşama onayı bekliyor" aksiyonu açılır.
- Termini geçen adım kırmızı "X iş günü gecikti"; son 1 iş gününde açılanlar "Yeni".
- Sistem ayarları > Aşama şablonu: aşama/adım başlangıç seçimi, süre (1–60), yukarı/aşağı taşıma, akış ikonları (↳ / ∥), tahmini "≈ N iş günü", uyarı notları.
- Bana atananlar: yeni katlanabilir "Sıradaki işlerim" bölümü.

## Adımlar
1. `business-days.ts` (yeni): isBusinessDay, addBusinessDays, businessDaysBetween; 2026–2027 resmi tatil sabit listesi (Ramazan 2026: 20–22 Mart, Kurban 2026: 27–30 Mayıs; Ramazan 2027: 9–11 Mart, Kurban 2027: 16–19 Mayıs; arifeler iş günü).
2. types/labels/Badges: Dependency tipi, "locked" durumları, yeni alanlar, DEPENDENCY_LABEL, kilit rozeti.
3. `flow.ts` (yeni, saf): isOpenStep, isPassed, advanceFlow (idempotent, sabit noktaya kadar tekrar; aşama aktifleştirme, adım aktifleştirme, onay aksiyonu aç/kapat/iptal), projectPlan.
4. Store/rules: buildFromTemplate her şeyi kilitli kurar, createProject plan tarihlerini doldurur + akışı başlatır; adım/aşama değiştiren her işlemin sonunda tek yardımcıdan advanceFlow. Kural kaynaklı geri açılan adımlar "locked"; SaaS, takım (2-2-3-3-3) ve katılımcı girişi adımlarına bağlılık/süre. Kilitli adım/aşamada elle durum değişikliği ve aşama tamamlama engellenir ("Aşamanın sırası gelmedi").
5. perm.ts: canEditFlow (canManageProject ile aynı).
6. Admin şablon editörü: yukarıdaki alanlar; Uyarlama (05) için açıklama notu.
7. Proje detayı: kilitli aşama bilgisi, aktif aşamalar varsayılan açık, yeni kolonlar (Başlangıç, Süre, Aktifleşti), termin hücresi kuralları, StepDialog'da başlangıç/süre alanları, toast'lar.
8. Listeler: MyWork, Overview, Projects ("Aktif aşama" + "+N"), ManagementReport, CustomerReport, ai-mock — açık adım filtresi isOpenStep.
9. Seed: şablona verilen bağlılık/süreler; İş Yatırım 00–05 bitmiş, 06 aktif (18.09.2026, bir adım gecikmiş), 07–08 kilitli; Garanti 03 aktif (biri bitti, biri bugün açıldı, biri gecikmiş, kalanı kilitli), 06 bağımsız; bir projede "onay bekleyen" aşama.
10. Depo sürümü bir artırılır (v5 → v6); eski kayıt varsa demo verisi yeniden yüklenir.
11. Doğrulama: typecheck + Playwright (yeni proje akışı, adım tamamlama → sıradaki açılır, SaaS/On-prem geçişi, aşama onayı, Bana atananlar).

## Bilmeniz gerekenler
- Bu güncellemeyle demo verisi baştan yüklenir; önceki denemeler silinir.
- Tatil listesi kod içinde sabit; sonraki görevde (M-07) ayarlara taşınacak.
- Geri alma yok: açılmış bir adım, öncekisi tekrar açılsa da kilitlenmez.
