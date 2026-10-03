# Geliştirme Akışı — Claude denetiminde Codex ile

## Kim ne yapar?
| Kim | Yetki | Ne yapar | Ne yapmaz |
|---|---|---|---|
| **Murat** | — | Görev seçer, planı ve veri modelini onaylar, açık soruları cevaplar, Codex'e direktif verir, merge eder, test ortamına çıkar | — |
| **Codex** | Tam (repo) | `AGENTS.md`'yi okur, planı uygular, test yazar, PR açar, bulguları düzeltir | Plan dışı kapsam eklemez |
| `planner` | Read/Grep/Glob | Plan, kabul kriterleri, Codex görev metni; F1-00'da `DATA_MODEL.md`; faz kapanışında GO/NO-GO | Dosya yazmaz, komut çalıştırmaz |
| `reviewer` | Salt okunur | Diff'i INVARIANTS + RBAC + DATA_MODEL + güvenlik + API/web kalitesine göre inceler; CI/parity sonucunu okur | Kod değiştirmez |
| `qa-verifier` | Test çalıştırır + tarayıcı | Vitest/Playwright koşar, AC ↔ test eşler, parity sonucunu okur, UI'yı Playwright MCP ile gezer; **çıktısız PASS vermez** | Kaynak koda ve teste yazamaz |
| `rules-reviewer` | Salt okunur | Kurallar, audit, iş günü/uyarılar, erişim bilgisi, rapor görünürlüğü, transaction/kilit için karar tablosu | Kod değiştirmez |

Neden bu yapı:
- **Yazan ≠ denetleyen:** Codex yazar, Claude denetler.
- **Persona değil işlev:** tek `reviewer` tek kontrol listesiyle (INVARIANTS + RBAC + DATA_MODEL) tutarlı ve ucuz.
- **Kanıt zorunlu:** "testler geçti" ancak `qa-verifier`'ın komut çıktısıyla kabul edilir.
- **pg-mem güvenli kullanılır:** lokal hız pg-mem'den, doğruluk CI'daki parity job'ından (ADR-0002).
- **Teknik sınır:** `.claude/hooks/guard.mjs` Claude'un uygulama koduna, paket dosyalarına, git geçmişine ve uzak veritabanına dokunmasını engeller.

## Ortamlar
| Ortam | Veritabanı | Kim kullanır | Nasıl |
|---|---|---|---|
| Lokal geliştirme | pg-mem (+ seed, isteğe bağlı snapshot) | Murat, Codex | `npm run dev` |
| Otomatik testler (lokal + CI `app`) | pg-mem | Codex, qa-verifier, CI | `npm test` |
| CI `parity` | PostgreSQL 17 (geçici container) | CI | her PR'da otomatik |
| Test ortamı | PostgreSQL 17 (kendi sunucumuz) | Murat, ekip | `main` → Docker imajları → deploy (F9-06 runbook) |

## Faz M — mockup'ın tamamlanması (demo)
Lovable ile yapılan mockup turları bitti; Lovable artık kullanılmaz. Kalan M-09a/b/c ve M-06 aşağıdaki döngünün aynısıyla yapılır; farkları:
- Plan hazır: `docs/plans/M-09-step-completion-workspaces.md` (§0 Bağlam + görev metni Codex'e verilir; `/plan` gerekmez).
- `/gate feat/m09…` reviewer ve qa-verifier'ı **demo modunda** çalıştırır (`AGENTS.md` → Demo kuralları; parity yok).
- M-09c merge edildikten sonra `/phase-close M` → görsel referans + `mockup-freeze` etiketi → F0 başlar.

## Tek görevin döngüsü
```
 /plan F3-02 ──▶ Murat onaylar ──▶ Codex uygular ──▶ CI (app + parity + secrets) ──▶ /gate <branch> ──▶ Merge
  (planner)     (açık soruları     (PR açar)                                          reviewer          (Murat)
                  cevaplar)            ▲                                               qa-verifier
                                       │                                               [rules-reviewer]
                                       └──────────────── düzeltme direktifi ──────────────┘
```

### 0. (Bir kez) Veri modeli — F1-00
```
> /plan F1-00
```
`planner` `docs/DATA_MODEL.md`'yi doldurur: erişim desenleri, ERD, tablolar, D1–D10 kararları, index planı, pg-mem riskleri. Onaylayıp commit edersin. Sonraki her şema değişikliği önce bu dosyada yapılır.

### 1. Planla
```
claude
> /plan F3-02
```
Plan `docs/plans/F3-02-<slug>.md`'ye kaydedilir; açık sorular ve Codex görev metni gösterilir.

### 2. Onayla
Açık soruları cevapla, sonra: `git add docs && git commit -m "docs: plan F3-02" && git push`
(Hook Claude'un commit atmasını engeller — commit'i sen atarsın.)

### 3. Codex uygular
Planın "Codex görev metni"ni Codex'e yapıştır (şablon A). Codex branch açar, uygular, lokal testleri koşar, PR açar.

### 4. CI'ı bekle
PR açılınca `app`, `parity`, `secrets` koşar. Parity bitmeden `/gate` sonucu "DOĞRULANAMADI" olur.

### 5. Gate
```
> /gate feat/f3-02-phase-completion
```
| Genel karar | Ne yaparsın |
|---|---|
| MERGE'E HAZIR | Merge |
| DÜZELTME GEREKLİ | Direktifi Codex'e ver (şablon B), sonra tekrar `/gate` |
| BLOKE | Aynı; gerekirse `/plan` ile planı revize et |
| DOĞRULANAMADI | Parity bitmemiş veya bir komut koşamamış — CI'ı bekle / ortamı düzelt, tekrar `/gate` |

### 6. Merge
Squash merge. `docs/reviews/` ve `docs/PHASES.md` değişikliklerini commit et.

### Faz sonu
```
> /phase-close F3
```
GO olmadan sonraki faza geçilmez.

### Test ortamına çıkış
`main` yeşil ve faz GO ise: F9-06 runbook'u (imaj build → migration'ları `--pg-only` ile uygula → deploy → elle kısa kontrol). Migration'lar test ortamına **yalnızca runbook ile** uygulanır.

---

## Codex'e verilecek metin şablonları

### A) Yeni görev
```
AGENTS.md, docs/INVARIANTS.md, docs/RBAC.md, docs/DATA_MODEL.md ve docs/TEST_STRATEGY.md dosyalarını oku.
Ardından docs/plans/<PLAN-DOSYASI>.md planını uygula.

Kurallar:
- Branch: feat/<faz>-<no>-<slug> (main'den)
- Yalnızca plandaki kapsam. Kapsam dışı fikirleri PR'da "Öneriler" altına yaz.
- Şema değişikliği: önce docs/DATA_MODEL.md'yi güncelle, sonra migrations/ altında yeni numaralı .sql.
  Migration pg-mem ve PostgreSQL'de çalışmalı; trigger/PL/pgSQL/RLS/extension yok. PostgreSQL'e özgü olan migrations/pg-only/ altına.
- Her yazma işlemi core/audit ile aynı transaction'da; her endpoint authorize() çağırır.
- Plandaki her kabul kriteri (negatifler dahil) için TEST_STRATEGY'deki doğru seviyede test yaz;
  PR'da "Kabul kriteri ↔ test" tablosunu dosya + test adıyla doldur.
- Bitirmeden önce çalıştır ve çıktı özetini PR'a yapıştır:
  npm run lint && npm run typecheck && npm test && npm run build
  (UI veya akış değiştiyse: npm run e2e)
- Test çıktılarını (test-results/, playwright-report/, coverage/) commit etme.
- .github/pull_request_template.md'yi eksiksiz doldurarak PR aç.
- Emin olmadığın iş kuralını tahmin etme; "Açık sorular"a yaz.
```

### B) Gate düzeltmesi
```
Branch: <branch>. docs/reviews/<branch>/SUMMARY.md dosyasındaki "Codex düzeltme direktifi"ni uygula.
- Critical ve High zorunlu; Medium'ları da yap, Low'ları yalnızca küçükse.
- Her bulguyu ayrı commit'te düzelt, mesajına bulgu ID'sini ekle: fix: ... [REV-01]
- "MISSING" kabul kriterleri için test yaz. Parity kırmızıysa CI logunu oku ve düzelt (pg-mem'e özel çözüm yazma).
- Katılmadığın bulguyu düzeltme; PR'a gerekçeli yorum yaz.
- Testleri çalıştır, PR'daki "Review düzeltmeleri" tablosunu güncelle, push et.
```

### C) Hata / küçük iş (plansız, ≤ 50 satır)
```
AGENTS.md ve docs/INVARIANTS.md'yi oku. Hata: <açıklama, adımlar, beklenen/gerçekleşen>.
Branch: fix/<slug>. Önce hatayı yeniden üreten bir test yaz (kırmızı), sonra düzelt (yeşil). PR aç.
```

---

## Altın kurallar
1. Plansız kod yok (şablon C hariç). DATA_MODEL'siz şema yok.
2. `reviewer` ve `qa-verifier` hiçbir PR'da atlanmaz; parity kırmızıyken merge yok.
3. Çıktısız PASS yok; referanssız bulgu yok.
4. Claude kod yazmaz, Codex kendi kodunu onaylamaz.
5. Faz geçişi = `/phase-close` GO.
