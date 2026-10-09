# ADR-0006: F0-03 — stack yükseltmesi ve monorepo kararları

**Durum:** Kabul edildi
**Tarih:** 2026-10-09
**Hazırlayan:** planner · **Onaylayan:** Murat

## Bağlam
ADR-0001 hedef yığını belirledi: React 19, Vite 8 + plugin-react v6, Tailwind 4, react-router 7, recharts 3, date-fns 4 + @date-fns/tz, npm workspaces. F0-02, kalan 14 audit açığının hepsini bu yükseltmelere bağladı (`docs/plans/F0-02-cleanup.md` §2.4b).

Bu işi sınırlayan kısıtlar:
- Mockup dondurulmuş durumda (`mockup-freeze`); ekran ve davranış değişmemeli. Kabul ölçütü M-06 görsel referansıdır (37 PNG, `docs/reviews/M-06/baseline/`).
- Repo'da görsel karşılaştırma için eşik ya da araç tanımlı değil. Uygulama gerçek saati kullandığı için baseline'a karşı piksel eşitliği mümkün değil.
- AGENTS.md demo kuralı ("Yeni npm paketi yok") ve §3 ("`components/ui` elle değiştirilmez") yükseltmenin zorunlu kıldığı değişikliklerle çatışıyor.
- Bazı peer bağımlılıkları yükseltmeyi zorunlu kılıyor: react-day-picker 8 (`date-fns ^2||^3`), next-themes 0.3 ve vaul 0.9 (`react ≤18`), tailwind-merge 2 (TW3).

## Seçenekler
1. **Tek görev (monorepo + yükseltme):** Tek gate. Ama görsel farkın kaynağı ayrılamaz, CSS hash kıyası kullanılamaz ve diff çok büyük olur.
2. **İki görev: önce yükseltme (03a), sonra saf taşıma (03b):** Görsel risk 03a'da toplanır. 03b R100 ve CSS hash eşitliğiyle ucuz ve kesin doğrulanır. İki gate ve iki L5b koşusu gerekir.
3. **Önce taşıma, sonra yükseltme:** Config dosyaları iki kez elden geçer; taşıma, yükseltmenin değiştireceği dosyaları da taşımış olur.

## Karar
- **K1 — Bölme:** Seçenek 2. F0-03a (`chore/f0-03a-upgrades`) ve F0-03b (`chore/f0-03b-monorepo`) için ayrı plan, branch, gate ve L5b. 03b, 03a merge'ünden sonra açılır.
- **K2 — Tailwind 4 CSS-first:**
  - `tailwind.config.ts` kaldırılır. Token'lar `src/index.css`'te `@theme inline` ile tanımlanır.
  - `:root`/`.dark` HSL bileşen değişkenleri biçim olarak korunur; satır içi `hsl(var(--x))` kullanımları bunlara bağlı.
  - Kaynak taraması `src/**/*.{ts,tsx}` ile sınırlanır (v3 `content` eşdeğeri, cwd'den bağımsız).
  - `tailwindcss-animate` `@plugin` ile kalır.
  - v3 görünümünü koruyan uyumluluk kuralları eklenir:
    - (a) varsayılan kenarlık rengi;
    - (b) placeholder rengi;
    - (c) buton imleci;
    - (d) `space-x-*` / `space-y-*` v3 seçicisi (`> :not([hidden]) ~ :not([hidden])`, ilk çocuk hariç kenar boşluğu). v4'ün `:not(:last-child)` davranışı `mb-*`/`mt-*` taşıyan çocuklarda ve satır yüksekliğinde fark üretir; `gap`'e geçiş satır kutusunu değiştirdiği için seçilmedi. Kural yalnızca sayısal değerleri kapsar (`--value(number)`); `space-*-px` ve `space-*-[..]` v4 davranışını alır, kullanılmamalıdır (Murat, 2026-10-09; F0-03a gate REV-06).
  - Entegrasyon `@tailwindcss/vite`; peer uyumsuzluğunda `@tailwindcss/postcss`.
- **K3 — `components/ui` istisnası:** Yalnızca iki tür değişiklik yapılabilir:
  - (a) `@tailwindcss/upgrade` codemod'unun mekanik çıktısı;
  - (b) major sürümün zorunlu kıldığı uyarlama: `calendar.tsx` için react-day-picker 9, `chart.tsx` için recharts 3 tipleri.

  shadcn CLI ile yeniden üretim yapılmaz (yeni stil görsel fark üretir). Kullanılmayan bileşenler silinmez.
- **K4 — Paket istisnası (yalnızca F0-03):**
  - Eklenebilenler: `react-router`, `@date-fns/tz`, `@vitejs/plugin-react`, `@tailwindcss/vite` (ya da `@tailwindcss/postcss`), `react-is` (recharts 3 peer'i, React ile aynı major).
  - Yalnızca Vitest 5 zorunlu kılarsa: `jsdom` sürümü.
  - Peer'in zorunlu kıldığı major yükseltmeler: `react-day-picker` 9, `next-themes` 0.4, `vaul` 1, `tailwind-merge` 3.
  - Kaldırılanlar: `react-router-dom`, `@vitejs/plugin-react-swc`, `postcss`, `autoprefixer`.
  - `overrides`, `--legacy-peer-deps` ve `--force` yasak. AGENTS demo kuralı bu listeyle sınırlı istisna alır.
  - Hedef major npm'de stabil olarak yayımlanmamışsa (`npm view <paket> versions`; alpha/beta/rc/next/canary sayılmaz) paket en son stabil major'da kalır, sürüm varsayılmaz ve sapma değişiklik notuna yazılır (Murat, 2026-10-09).
- **K5 — L5b yöntemi ve eşiği:**
  - (A) Önce/sonra piksel karşılaştırması. Baz commit ve branch'in production build'i (`vite preview`), aynı makine, aynı oturum, Playwright MCP, baseline boyutunda viewport, aynı rol ve seed. Ekranlar çiftler halinde art arda çekilir. pixelmatch piksel eşiği 0,1, anti-alias hariç. **Kabul: çift başına ≤ %0,1 farklı piksel ve görüntü boyutları eşit.** Aşan fark ancak Murat'ın görüntü çiftiyle kabulüyle geçer.
  - (B) M-06 baseline ile yan yana gözle inceleme. Yalnızca tarih/saat kaynaklı farklar izinlidir.
  - F0-04 ve modül bağlama görevleri aynı yöntemi kullanır. F0-06 bunu repo içi script'e çevirir.
- **K6 — Workspace düzeni:**
  - Paketler: `rabbitqa` (kök), `@rabbitqa/web`, `@rabbitqa/api` (boş), `@rabbitqa/shared`.
  - Kök script'leri workspace'lere devreder; CI komutları değişmez. Lint kökte tek flat config ile yapılır.
  - `@rabbitqa/shared` TS kaynağını `exports` ile verir, build adımı yoktur. Bu karar **geçicidir**; F0-05'te API üretim build'iyle yeniden değerlendirilir.
  - `engines.node >=24`.
- **K7 — Audit hedefi:** F0-03a sonunda `npm audit` (tam) 0 açık. CI'daki `--omit=dev --audit-level=high` her koşulda 0. Kalan açık satır satır Murat kabulüne bağlıdır.

## Sonuçlar
- **Olumlu:**
  - F0-02'den kalan 14 açık kapanır.
  - Görsel kabul ilk kez nesnel bir eşikle yapılır.
  - 03b'nin doğruluğu R100 ve CSS hash eşitliğiyle kanıtlanır.
  - F0-04 için `packages/shared` hazır olur.
- **Olumsuz / kabul edilen riskler:**
  - Tailwind 4 tarayıcı tabanı yükselir (Safari 16.4+, Chrome 111+, Firefox 128+); iç ekip için kabul.
  - `components/ui` dosyaları shadcn'in güncel üretiminden sapar.
  - pixelmatch geçici olarak `npx` ile çalışır (repo bağımlılığı değil).
  - Vite 8, Vitest 5 ve plugin-react v6 rehber maddeleri uygulama sırasında doğrulanır.
- **Takip edilecek işler:**
  - PHASES F0-03 satırı 03a/03b olarak bölünür (vitest 5 eklenir).
  - ADR-0001 "Takip" satırı güncellenir.
  - AGENTS.md demo kuralına K4 istisnası, §1 yollarına `apps/web` eklenir.
  - TEST_STRATEGY §1 L5b'ye K5, §3 ve §5'e workspace yolları yazılır.
  - qa-verifier demo komutu güncellenir; guard yorumu güncellenir.
  - F0-06: L5b script'i ve QA-03 için kalıcı L3 testi.
  - F0-05: K6 shared tüketim biçiminin yeniden değerlendirilmesi.
