# Gate çıktı formatı (tüm ajanlar)

Ajanlar dosya yazmaz; çıktıyı **yanıt olarak** döndürür. Ana oturum (`/gate`) bunu `docs/reviews/<branch>/<ajan>.md` olarak kaydeder.

```markdown
## <ajan> — <branch> @ <commit sha kısa>
**Karar:** APPROVE | CHANGES_REQUESTED | BLOCKED | UNVERIFIED

### Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu ve hata senaryosu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-01 | Critical | INV-16, RBAC | apps/api/src/modules/credentials/credentials.routes.ts:18 | `GET /projects/:id/credentials/:cid/reveal` `authorize()` çağırmıyor; Customer Care VPN şifresini okuyabilir | Route'a `authorize('credential:reveal')` ekle; care için 403 testi yaz |

### Düzeltme direktifi
(Numaralı, kopyala-yapıştır hazır; her madde bulgu ID'si + dosya + beklenen davranış + eklenecek test.)

### Açık sorular / öneriler (engelleyici değil)
```

## Karar kuralları
| Durum | Karar |
|---|---|
| Critical bulgu (invariant ihlali, yetkisiz erişim) | BLOCKED |
| High bulgu veya CI/parity kırmızı | CHANGES_REQUESTED |
| Yalnızca Medium/Low | APPROVE (Medium → `docs/reviews/BACKLOG.md`) |
| qa-verifier bir kontrolü çalıştıramadı / parity bitmedi | UNVERIFIED |

## Kanıt kuralı
- `reviewer` / `rules-reviewer`: her bulgu dosya:satır içerir; referanssız bulgu geçersiz.
- `qa-verifier`: her PASS komut çıktısı içerir; çıktısız PASS geçersiz.
- Ajanlar kod yazmaz; düzeltmeyi uygulama oturumu yapar.
