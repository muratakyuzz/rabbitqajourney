# Geliştirme Akışı — Claude Code: uygulama oturumu + denetim oturumu

## Kim ne yapar?
| Kim | Yetki | Ne yapar | Ne yapmaz |
|---|---|---|---|
| **Murat** | — | Görev seçer, planı ve veri modelini onaylar, açık soruları cevaplar, oturumları başlatır, merge eder, test ortamına çıkar | — |
| **Uygulama oturumu** (`CLAUDE_ROLE=builder claude`) | Kod + test + commit/push + PR | `AGENTS.md`'yi okur, planı uygular (`/build`), test yazar, PR açar, gate bulgularını düzeltir (`/fix`) | Plan dışı kapsam eklemez; plan ve review dosyalarını değiştirmez; `main`'e push etmez, merge etmez, `/gate` çalıştırmaz |
| `planner` | Read/Grep/Glob | Plan, kabul kriterleri, Uygulama görev metni; F1-00'da `DATA_MODEL.md`; faz kapanışında GO/NO-GO | Dosya yazmaz, komut çalıştırmaz |
| `reviewer` | Salt okunur | Diff'i INVARIANTS + RBAC + DATA_MODEL + güvenlik + API/web kalitesine göre inceler; CI/parity sonucunu okur | Kod değiştirmez |
| `qa-verifier` | Test çalıştırır + tarayıcı | Vitest/Playwright koşar, AC ↔ test eşler, parity sonucunu okur, UI'yı Playwright MCP ile gezer; **çıktısız PASS vermez** | Kaynak koda ve teste yazamaz |
| `rules-reviewer` | Salt okunur | Kurallar, audit, iş günü/uyarılar, erişim bilgisi, rapor görünürlüğü, transaction/kilit için karar tablosu | Kod değiştirmez |

Neden bu yapı:
- **Yazan ≠ denetleyen:** aynı araç (Claude Code), ama iki ayrı oturum. Uygulama oturumu yazar; `/gate` uygulamanın bağlamını hiç görmemiş, yeni açılmış bir denetim oturumunda çalışır ve kodu yalnızca diff + testler + tarayıcı üzerinden değerlendirir.
- **Persona değil işlev:** tek `reviewer` tek kontrol listesiyle (INVARIANTS + RBAC + DATA_MODEL) tutarlı ve ucuz.
- **Kanıt zorunlu:** "testler geçti" ancak `qa-verifier`'ın komut çıktısıyla kabul edilir.
- **pg-mem güvenli kullanılır:** lokal hız pg-mem'den, doğruluk CI'daki parity job'ından (ADR-0002).
- **Teknik sınır:** `.claude/hooks/guard.mjs` denetim oturumunun uygulama koduna, paket dosyalarına, git geçmişine ve uzak veritabanına dokunmasını; uygulama oturumunun `main`'e/force push etmesini, merge etmesini, plan/review dosyalarını değiştirmesini ve uzak veritabanına bağlanmasını engeller.

## İki oturum
Antigravity'de iki terminal sekmesi açık tutulur, ikisi de repo kökünde:

| Sekme | Başlatma | Kullanım |
|---|---|---|
| **Uygulama** | `CLAUDE_ROLE=builder claude` | `/build <plan dosyası>` → kod, test, commit, PR · `/fix <branch>` → gate düzeltmeleri |
| **Denetim** | `claude` | `/plan <görev>` · `/gate <branch>` · `/phase-close <faz>` |

- Her `/gate` öncesi denetim sekmesinde `/clear` (veya oturumu kapatıp yeniden `claude`) — denetçi önceki konuşmaları taşımaz.
- Uygulama sekmesinde her yeni görev için `/clear`.
- İki oturum aynı klasördedir; `/gate` branch'i `.verify/` altındaki ayrı bir worktree'de incelediği için uygulama oturumunun çalışma ağacına dokunmaz.

## Ortamlar
| Ortam | Veritabanı | Kim kullanır | Nasıl |
|---|---|---|---|
| Lokal geliştirme | pg-mem (+ seed, isteğe bağlı snapshot) | Murat, uygulama oturumu | `npm run dev` |
| Otomatik testler (lokal + CI `app`) | pg-mem | uygulama oturumu, qa-verifier, CI | `npm test` |
| CI `parity` | PostgreSQL 17 (geçici container) | CI | her PR'da otomatik |
| Test ortamı | PostgreSQL 17 (kendi sunucumuz) | Murat, ekip | `main` → Docker imajları → deploy (F9-06 runbook) |

## Faz M — mockup'ın tamamlanması (demo)
Lovable ile yapılan mockup turları bitti; Lovable artık kullanılmaz. Kalan M-09a/b/c ve M-06 aşağıdaki döngünün aynısıyla yapılır; farkları:
- Plan hazır: `docs/plans/M-09-step-completion-workspaces.md` (alt görev planları `/plan M-09a` vb. ile üretilir, uygulama sekmesinde `/build` ile uygulanır).
- `/gate feat/m09…` reviewer ve qa-verifier'ı **demo modunda** çalıştırır (`AGENTS.md` → Demo kuralları; parity yok).
- M-09c merge edildikten sonra `/phase-close M` → görsel referans + `mockup-freeze` etiketi → F0 başlar.

## Tek görevin döngüsü
```
 /plan F3-02 ──▶ Murat onaylar ──▶ uygulama oturumu uygular ──▶ CI (app + parity + secrets) ──▶ /gate <branch> ──▶ Merge
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
Plan `docs/plans/F3-02-<slug>.md`'ye kaydedilir; açık sorular ve Uygulama görev metni gösterilir.

### 2. Onayla
Açık soruları cevapla, sonra: `git add docs && git commit -m "docs: plan F3-02" && git push`
(Denetim oturumu commit atamaz — commit'i sen atarsın ya da `/build` plan dosyasını branch'in ilk commit'ine ekler.)

### 3. Uygula (uygulama sekmesi)
```
CLAUDE_ROLE=builder claude
> /build docs/plans/F3-02-<slug>.md
```
Uygulama oturumu branch açar, planı uygular, lokal testleri koşar, push eder ve PR açar. Soru sorarsa cevapla.

### 4. CI'ı bekle
PR açılınca `app`, `parity`, `secrets` koşar. Parity bitmeden `/gate` sonucu "DOĞRULANAMADI" olur.

### 5. Gate
```
> /gate feat/f3-02-phase-completion
```
| Genel karar | Ne yaparsın |
|---|---|
| MERGE'E HAZIR | Merge |
| DÜZELTME GEREKLİ | Uygulama sekmesinde `/fix <branch>`, sonra denetim sekmesinde `/clear` + tekrar `/gate` |
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

## Uygulama oturumu metin şablonları
`/build` ve `/fix` komutları A ve B'yi otomatik uygular. Komut kullanmadan elle vermek gerekirse:

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
Branch: <branch>. docs/reviews/<branch>/SUMMARY.md dosyasındaki "Düzeltme direktifi"ni uygula.
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
4. Denetim oturumu kod yazmaz; uygulama oturumu kendi kodunu onaylamaz ve merge etmez.
5. Faz geçişi = `/phase-close` GO.
