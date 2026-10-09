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
    - (e) recharts 3 iç katmanlarında odak çerçevesi kapatılır: `.recharts-wrapper [class*="recharts-zIndex-layer_"]:focus { outline: none }` (a6f46d8). recharts 3 `ZIndexPortal`, `accessibilityLayer={false}` olsa bile her katmanı `<g tabIndex={-1}>` olarak çiziyor; kural olmadan grafiğe tıklamak odak çerçevesi gösterir. Kural yalnızca `tabindex=-1` katmanlarını etkiler; Tab sırası main ile aynıdır. Dayanak: Murat'ın "uygulama fare esaslı kullanılır" kararı (F0-03a gate QA-02 (a); PHASES F9-04). **Risk:** seçici recharts'ın iç sınıf adına bağlı; recharts yükseltmesinde ad değişirse kural hata vermeden etkisiz kalır. Takip: F0-06 görsel regresyon setine grafik tıklaması → odak çerçevesi yok adımı (F0-03a gate REV2-04, `docs/reviews/BACKLOG.md`).
    - (f) Sonner toast stilleri `src/index.css`'te `@layer` dışında 4 kuralla v3 değerlerine döndürülür (79531b6): toast kökü (`[data-sonner-toaster] [data-sonner-toast].toast`: arka plan, metin, kenarlık rengi, v3 `shadow-lg`), `[data-description]`, `[data-action]`, `[data-cancel]`. **Neden `@layer` dışında:** Tailwind 4 utility'leri `@layer utilities` içinde. Sonner ise CSS'ini çalışma anında katmansız ekliyor. Katmansız kural, özgüllükten bağımsız olarak her katmanlı kuralı ezer. Bu yüzden `ui/sonner.tsx` classNames'i etkisiz kalıyordu (gate REV-01 / QA-01: eşik 0'da 19.451 px ve 8.665 px). Düzeltme de katmansız olmak zorunda. `ui/sonner.tsx`'e dokunulmadı (K3). **Özgüllük (0,3,0):** v3'teki `group-[.toaster]` / `group-[.toast]` utility'leriyle aynı özgüllük. Böylece Sonner'ın kendi kurallarıyla eşitlik durumu v3'teki gibi kaynak sırasıyla çözülür. Production'da Sonner `<style>`'ı bu dosyadan sonra eklenir ve eşitlikte Sonner kazanır (ör. action düğmesi). Dev'de sıra terstir, ama v3'te de aynıydı (gate REV2-02). Daha yüksek özgüllük ya da `!important` seçilmedi, çünkü v3'te Sonner'ın kazandığı noktaları değiştirirdi. **Risk:** kurallar Sonner'ın `data-sonner-*` özniteliklerine, `.toast` sınıfına ve çalışma anında eklenen `<style>`'ın konumuna bağlı. Tailwind'in katman düzeni de dayanaklardan biri. Sonner ya da Tailwind yükseltmesinde bunlardan biri değişirse kural hata vermeden etkisiz kalır ya da fazla etkili olur. Takip: F0-06 regresyon setine toast ekranları eşik 0 ile girer (description'lı handover toast'ı dahil). Build CSS'inde bu 4 seçicinin `@layer` blok derinliğinin 0 olduğunu sınayan bir kontrol de eklenir (F0-03a gate REV2-04, `docs/reviews/BACKLOG.md`).
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
  - F0-06: L5b script'i, QA-03 için kalıcı L3 testi, K2 (e) için grafik tıklaması regresyon adımı, K2 (f) için toast ekranları (eşik 0) ve build CSS `@layer` kontrolü.
  - F0-05: K6 shared tüketim biçiminin yeniden değerlendirilmesi.
