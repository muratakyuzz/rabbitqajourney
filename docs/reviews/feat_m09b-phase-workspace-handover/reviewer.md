# reviewer — feat/m09b-phase-workspace-handover @ 4d67bd3 (round 3)
**Karar:** APPROVE

Bu tur demo modunda (Faz M, `feat/m09*`) yapıldı. BE invariant'ları (INV-01…05, 14–18, 21–24) bu modda uygulanmıyor ve parity kontrolü yapılmadı. **CI okunamadı, çünkü `gh` yok.** Bu demo modunda blocker değil, yalnızca not.

Kod `/Users/murat/Development/rabbitqajourney/.verify/feat_m09b-phase-workspace-handover` (HEAD 4d67bd3) üzerinden okundu. Diff `git diff origin/main...origin/feat/m09b-phase-workspace-handover` ile alındı: 26 dosya, 17 commit. Çalıştırılan komutlar:
- `npm audit --omit=dev`
- `npx tsc --noEmit -p tsconfig.app.json`: hata yok
- lock/package.json karşılaştırması (node ile salt okuma)

Testler qa-verifier'ın işi olduğu için çalıştırılmadı.

Kısa özet: Önceki iki turda "düzeltildi" denen her madde kodda doğrulandı. Yeni Critical, High ya da Medium bulgu yok; yalnızca 4 Low bulgu var.

## Önceki tur düzeltmelerinin doğrulanması
| ID | Sonuç | Kanıt |
|---|---|---|
| QA-01 (lock senkronu) | Doğru | Branch'te `package.json` değişmemiş. Branch lock'unun kök bağımlılıkları `package.json` ile 0 fark (lockfileVersion 3). Main'deki lock'ta ise 10 fark vardı, yani senkron gerçekten bu branch'te yapılmış. |
| REV-05 (label importları) | Doğru | `src/pages/project/MeetingDialog.tsx:16,59` `ACTION_STATUS_LABEL` kullanıyor. `HandoverWorkspace.tsx:17,182,308` `COMMIT_STATUS_LABEL` kullanıyor; yerel kopya yok. |
| REV-05 (MkAudit) | Doğru | Tek tanım `flow.ts`'te. `completion.ts:2,6` ve `rules.ts:1,5` oradan import edip tekrar export ediyor. |
| RUL-01 (CSM atama) | Doğru | `perm.ts:57` `canAssignCsm = u?.role === "manager"`. Bunu kullanan yerler: `Projects.tsx:18,134` (`isAllSeeing` importu kalkmış), `PhaseWorkspaceSheet.tsx:28`, `HandoverWorkspace.tsx:100-101` (`disabled = readOnly \|\| !csmEditable`). Testler: `Projects.test.tsx` (manager açık, admin `data-disabled`), `HandoverWorkspace.test.tsx:188-219`, `perm.test.ts`. Bileşenlerde yeni rol karşılaştırması yok; diff'te `role ===` yalnızca `perm.ts` ve testlerde geçiyor. |
| QA-02 (Sonner/BrowserRouter) | Doğru | `src/App.tsx:38-40`: `<Toaster/>` ve `<Sonner/>` artık `<BrowserRouter>` içinde. `RqProvider` dışarıda kalıyor, ama store'un `flowMsgs` toast'ları düz metin, `Link` içermiyor; sorun yok. Regresyon testi `HandoverWorkspace.toast-router.test.tsx` gerçek `App` ağacını render ediyor ve `window` "error" olaylarını topluyor. |
| QA-03 (AC4) | Doğru | `HandoverWorkspace.test.tsx:86-121` şunları doğruluyor: tür "Teklif" ve `data-disabled`, gerçek `File` ile yükleme, kutucukta dosya adı ve "Dokümanlar'da gör", "Yükle"nin kaybolması, tabloda adımın Tamamlandı olması. |
| REV-12 (tatil atlama) | Doğru | `completion.test.ts:491-494`: kick-off 27 Ekim iken 29 Ekim'de uyarı yok. `business-days.ts:21-22,43`'e göre 28 Ekim yarım gün ve sayılıyor, 29 Ekim tam gün tatil ve atlanıyor. |
| REV-13 (değişiklik notu) | Doğru | ActionFields iddiası düzeltilmiş, AC4/AC5 test adlarıyla eşlenmiş, açık sorular AC14 ile sınırlı. |

## Yeniden kontrol edilen alanlar (bulgu yok)
- **State v10:** `seed.ts:139-140` tek kaynak; `store.tsx` ve `auth-api.ts:1,26` aynı sabitleri kullanıyor.
- **Silinen alanlar:** `presentationShared`, `reqDocShared`, `reqDocSharedAt` yalnızca `ProjectDetail.tsx:814-815`'teki `FIELD_LABEL` içinde kalıyor (plan §3.2 öngörüyor).
- **Tamamlama/alert mantığı:** `addDocument` → `settleAll`; `completion.ts` plana uyuyor; `alerts.ts:68-69` `isOpenStep(reqdoc)` okuyor (INV-25 korunuyor).
- **`setInstallChoice`:** Hata varsa state değişmiyor; gerekçe hem store'da hem UI'da zorunlu.
- **`flowMessages`:** "Tamamlandı" toast'ı yalnızca otomatik adımlar için, `uniq` kopya üretmiyor.
- **`stepClickTarget`:** Plan §6.3'teki 9 satırlık tabloyla birebir aynı.
- **Dokunulmaması gerekenler:** `components/ui`, AGENTS.md, CLAUDE.md, `.claude/`, `.github/`, `.mcp.json` değişmemiş. Yeni npm paketi yok. `any`/`dangerouslySetInnerHTML` yok.
- **`npm audit --omit=dev`:** 10 açık (7 high, 3 moderate, `xlsx` dahil) — BACKLOG'daki REV-14 (Medium, F0 hedefli), yeni bulgu sayılmadı.

## Bulgular
| ID | Severity | Referans | Dosya:satır | Bulgu | Önerilen düzeltme |
|---|---|---|---|---|---|
| REV-18 | Low | AGENTS.md §5 | docs/changes/...md:61; tsconfig.json | Değişiklik notu "`npx tsc --noEmit` → temiz" diyor ama kök tsconfig `files: []`, hiçbir dosya derlenmiyor. Gerçek doğrulama `-p tsconfig.app.json` ile yapıldı (temiz), ama not metni yanıltıcı. | Notta komutu `npx tsc --noEmit -p tsconfig.app.json` yap; ayrı chore'da `typecheck` script'i eklensin. |
| REV-19 | Low | Plan §6.3 | PhaseWorkspaceSheet.tsx:57,72; ProjectDetail.tsx:335,339 | Manual/alansız adım panelde işlevsiz tıklanabilir `<button>` olarak çiziliyor. | `clickable` koşuluna `stepField(...) !== null` ekle; false ise `<span>` çiz. |
| REV-20 | Low | Erişilebilirlik | HandoverWorkspace.tsx:40-41; Phase2Tabs.tsx:355,359,366 | "Gerekçe (zorunlu)" ve DocumentUploadDialog etiketleri `htmlFor`/`id` ile bağlı değil. | `id`/`htmlFor` ekle, testlerde `getByLabelText` kullan. |
| REV-21 | Low | Plan §6.3 (`ws` param) | ProjectDetail.tsx:113,236-240,382-385 | `?ws=<kod>` çalışma alanı olmayan aşama için de boş panel açıyor. | Başlatıcıda `ph && PHASE_WORKSPACES[ph.code]` koşulu ekle. |

## Açık sorular / öneriler (engelleyici değil)
- Değişiklik notu round 1 tablosunda REV-06 "düzeltilmedi" görünüyor; BACKLOG.md'de RUL-01 ile kapandığı yazıyor — belge tutarsızlığı.
- `setInstallChoice`'ın `summary` değeri `setState` updater içinde atanıyor; React ertelerse toast açıklaması kaybolabilir (önceden var olan desen, F0'da düzeltilmeli).
- RUL-05, S6 teyidi, admin `canCreateProject` kararları Murat'ı bekliyor.
