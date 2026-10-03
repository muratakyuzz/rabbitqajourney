## Görev
- Plan: `docs/plans/<FAZ>-<NO>-<slug>.md`
- Faz / görev kodu: F_-__

## Ne değişti
- …

## Kabul kriteri ↔ test
| AC | Karşılandı | Seviye | Test (dosya › test adı) |
|---|---|---|---|
| AC1 | ✅ | L2 | `apps/api/src/modules/.../x.int.test.ts` › "…" |

## Mockup ↔ API (modül bağlama görevlerinde)
- API_CONTRACT satırları: #__, #__
- [ ] `VITE_DATA_<MODÜL>=http` ile ekranlar mock moddakiyle aynı (qa-verifier L5b)
- [ ] Sözleşme testi (L2c) API yanıtına ve mock adaptöre uygulanıyor
- [ ] Bu modülün kural kodu web'den kaldırıldı (INV-20)

## Veritabanı
- [ ] Migration yok
- [ ] Migration var: `migrations/00NN_….sql` — pg-mem'de uygulanıyor (`npm test` yeşil)
- [ ] `docs/DATA_MODEL.md` güncellendi (sürüm: v_)
- [ ] `migrations/pg-only/` değişikliği var (gerekçe: …)
- [ ] Yeni tablo: ortak kolonlar + soft delete + audit kapsamında

## Invariant öz-kontrol (docs/INVARIANTS.md)
- Etkilenen INV maddeleri: INV-__, INV-__
- [ ] Yeni/değişen endpoint'ler `authorize()` çağırıyor ve RBAC testleri var (izinli + yasaklı)
- [ ] Yazma işlemleri `core/audit` ile aynı transaction'da
- [ ] Gerekçe zorunlu işlemler shared zod şeması + servis ile zorlanıyor
- [ ] Trigger / PL/pgSQL / RLS / motor kontrolü yok

## Kontroller (çıktı özetini yapıştır)
```
npm run lint       →
npm run typecheck  →
npm test           →
npm run build      →
npm run e2e        → (UI/akış değiştiyse)
```

## Ekran görüntüleri
<UI değiştiyse>

## Açık sorular
- …

## Öneriler (kapsam dışı)
- …

## Review düzeltmeleri
| Bulgu ID | Durum | Commit |
|---|---|---|
