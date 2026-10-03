# <FAZ>-<NO> — <Görev adı>

**Durum:** Taslak | Onaylandı | Uygulanıyor | Tamamlandı
**Spec referansı:** docs/PRODUCT_SPEC.md → <bölüm>
**Branch:** feat/<faz>-<no>-<slug>
**Bağımlılıklar:** <önceki görevler>

## 1. Amaç
<1–3 cümle>

## 2. Kapsam
- …
### Kapsam dışı
- …

## 3. Veri modeli etkisi
- DATA_MODEL değişikliği: yok | var → `docs/DATA_MODEL.md` §… (sürüm vX → vY)
| Tablo | Değişiklik | Migration | pg-mem riski |
|---|---|---|---|

`pg-only` gereksinimi: yok | var → <ne ve neden>

## 4. API etkisi
| Method | Path | authorize() aksiyonu | Girdi şeması (shared) | Audit | Gerekçe zorunlu |
|---|---|---|---|---|---|

## 5. Yetki etkisi (RBAC)
| Rol | İzin | Not |
|---|---|---|
| csm | | |
| devops | | |
| care | | |
| manager | | |
| admin | | |

## 6. UI etkisi
- Ekranlar / bileşenler:
- Boş / yükleniyor / hata durumları:

## 7. Kabul kriterleri
- **AC1** — Given … When … Then …
- **AC2** — …
- **AC-NEG1** — (yetkisiz rol / gerekçesiz değişiklik / eksik veri / başka projenin kaydı)

## 8. Test planı (seviyeler: docs/TEST_STRATEGY.md)
| AC | Seviye (L1 unit / L2 int / L3 bileşen / L4 e2e / L5 parity) | Beklenen test dosyası |
|---|---|---|

## 9. İlgili invariant maddeleri
- INV-xx — <nasıl etkileniyor>

## 10. Riskler ve açık sorular
- …

## 11. Gerekli gate'ler
- [x] reviewer
- [x] qa-verifier (UI değişiyorsa tarayıcı kontrolü dahil)
- [ ] rules-reviewer — <evet/hayır + gerekçe>

## 12. Codex görev metni
```
AGENTS.md, docs/INVARIANTS.md, docs/RBAC.md, docs/DATA_MODEL.md ve docs/TEST_STRATEGY.md dosyalarını oku.
Ardından docs/plans/<bu-dosya>.md planını uygula.
<göreve özel net talimatlar: migration numarası/adı, modül ve dosya yolları, fonksiyon imzaları, shared şemalar>
Kurallar: docs/WORKFLOW.md şablon A.
```
