# F0-01 — API sözleşmesinin dondurulmuş mockup'tan çıkarılması

**Durum:** Onaylandı (M-06 dondurma sonrası başlar)
**Spec referansı:** docs/PRODUCT_SPEC.md → tümü (Ek A, Ek B dahil) · docs/AUDIT.md
**Branch:** chore/f0-01-api-contract
**Bağımlılıklar:** M-06 (mockup dondurma)

## 1. Amaç
BE'nin mockup'a göre yazılabilmesi için mockup'ın örtük sözleşmesini açık hale getirmek: hangi ekran hangi veriyi okur, hangi işlem hangi veriyi değiştirir, hangi kuralı tetikler, kim yapabilir. **Uygulama kodu değişmez.**

## 2. Kapsam
- `src/lib/rabbitqa/store.tsx` → `Ctx` arayüzündeki her fonksiyon için yazma uç noktası
- Saf iş mantığı dosyaları (`flow.ts`, `completion.ts`, `rules.ts`, `alerts.ts`, `reports.ts`, `email-match.ts`) → hangi uç noktada, hangi BE modülünde çalışacağı
- Her ekranın okuduğu veri → okuma uç noktası ve filtreler
- `types.ts` → `packages/shared` şema adları listesi (şemaların kendisi F0-04'te yazılır)
- `perm.ts` → her uç noktanın `authorize()` aksiyonu ve `docs/RBAC.md` satırı
- `rules.ts` + store içindeki kural mantığı → uç nokta başına tetiklenen kurallar
- Mockup ile API arasında bilinçli farklar (demo giriş, istemcide hesaplanan uyarılar vb.)

### Kapsam dışı
- Kod, şema dosyası, migration

## 7. Kabul kriterleri
- **AC1** — `docs/API_CONTRACT.md` §2'de store `Ctx` arayüzündeki **her** fonksiyonun bir satırı var (eksik fonksiyon = başarısız).
- **AC2** — `docs/AUDIT.md` §2'deki her ekran ve sekme §3'te en az bir okuma uç noktasına bağlı.
- **AC3** — Her uç noktanın `authorize()` aksiyonu `docs/RBAC.md`'de bir satıra karşılık geliyor; karşılığı olmayanlar §5 "Açık sorular"da.
- **AC4** — Audit / gerekçe / kural kolonları store'daki gerçek davranışla tutarlı (reviewer örneklemle doğrular).
- **AC5** — `git diff --stat` yalnızca `docs/` altında değişiklik gösterir.

## 11. Gerekli gate'ler
- [x] reviewer (AC1–AC5; store ile tablo karşılaştırması)
- [ ] qa-verifier — uygulanmaz (kod değişmiyor)
- [x] rules-reviewer — kural kolonunun doğruluğu (rules.ts ↔ tablo)

## 12. Uygulama görev metni
```
AGENTS.md, docs/PRODUCT_SPEC.md, docs/RBAC.md ve docs/AUDIT.md dosyalarını oku.
Ardından docs/plans/F0-01-api-contract.md planını uygula.

Bu bir SADECE DOKÜMANTASYON görevidir. docs/ dışında hiçbir dosyayı değiştirme.

1. Branch aç: chore/f0-01-api-contract
2. docs/API_CONTRACT.md şablonunu doldur:
   - §2: src/lib/rabbitqa/store.tsx içindeki Ctx arayüzünün HER fonksiyonu için bir satır
     (method & path, istek/yanıt şema adı, authorize aksiyonu, audit, gerekçe, tetiklenen kural, hedef görev kodu — docs/PHASES.md).
     Kural kolonunu rules.ts ve store'daki gerçek koddan çıkar; tahmin etme.
   - §3: her ekran (src/pages/**) için okuduğu veriler → okuma uç noktası, filtreler, yanıt şeması.
   - §4: mockup ile API arasında farklı olacak davranışlar (demo giriş, istemcide hesaplanan uyarılar, localStorage, şifrelenmemiş erişim bilgisi vb.).
   - §5: RBAC.md'de karşılığı olmayan veya spec ile çelişen her nokta.
   Şema adları için types.ts'teki tip adlarını kullan (Project, Step, ...); İstek şemaları <Varlık>Create / <Varlık>Patch adlandırmasıyla.
3. Yalnızca docs/API_CONTRACT.md'yi commit et: "docs: F0-01 API contract from frozen mockup"
4. PR aç, şablonu doldur.
```
