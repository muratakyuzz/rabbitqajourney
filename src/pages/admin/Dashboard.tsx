import { useState, type ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Users,
  Handshake,
  Coins,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  ShieldAlert,
  Trophy,
  CheckCircle2,
  CreditCard,
  AlertCircle,
} from "lucide-react";

// ───────────────────────────────────────────────────────────────────────────────
// Color tokens (strict semantics)
// ───────────────────────────────────────────────────────────────────────────────
const C = {
  blue: "#3266AD",
  green: "#1D9E75",
  amber: "#BA7517",
  red: "#E24B4A",
  purple: "#7F77DD",
  gray: "#94A3B8",
};

type Tier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Certified";
type PType = "Reseller" | "Referral" | "Certified";

function TierBadge({ tier }: { tier: Tier }) {
  const map: Record<Tier, string> = {
    Bronze: "bg-[#BA7517]/10 text-[#8a5611] ring-[#BA7517]/20 dark:text-[#E0A24A]",
    Silver: "bg-slate-400/10 text-slate-600 ring-slate-400/30 dark:text-slate-300",
    Gold: "bg-[#E0A93C]/15 text-[#8a6310] ring-[#E0A93C]/30 dark:text-[#F0C76A]",
    Platinum: "bg-[#7F77DD]/12 text-[#5b54a8] ring-[#7F77DD]/25 dark:text-[#B5AEEC]",
    Certified: "bg-[#1D9E75]/10 text-[#0f6b4d] ring-[#1D9E75]/25 dark:text-[#5BCFA3]",
  };
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset", map[tier])}>
      {tier}
    </span>
  );
}

function TypeBadge({ type }: { type: PType }) {
  const map: Record<PType, string> = {
    Reseller: "bg-[#3266AD]/10 text-[#244e85] ring-[#3266AD]/20 dark:text-[#8FB4E5]",
    Referral: "bg-[#7F77DD]/10 text-[#5b54a8] ring-[#7F77DD]/20 dark:text-[#B5AEEC]",
    Certified: "bg-[#1D9E75]/10 text-[#0f6b4d] ring-[#1D9E75]/20 dark:text-[#5BCFA3]",
  };
  return (
    <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset", map[type])}>
      {type}
    </span>
  );
}

type PillTone = "blue" | "green" | "amber" | "red" | "purple" | "gray";
function Pill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  const map: Record<PillTone, string> = {
    blue: "bg-[#3266AD]/10 text-[#3266AD] ring-[#3266AD]/20",
    green: "bg-[#1D9E75]/10 text-[#1D9E75] ring-[#1D9E75]/20",
    amber: "bg-[#BA7517]/10 text-[#BA7517] ring-[#BA7517]/20",
    red: "bg-[#E24B4A]/10 text-[#E24B4A] ring-[#E24B4A]/20",
    purple: "bg-[#7F77DD]/12 text-[#7F77DD] ring-[#7F77DD]/25",
    gray: "bg-muted text-muted-foreground ring-border",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset", map[tone])}>
      {children}
    </span>
  );
}

function Card({
  children,
  accent,
  className,
}: {
  children: ReactNode;
  accent?: PillTone;
  className?: string;
}) {
  const accentColor =
    accent === "blue" ? C.blue : accent === "green" ? C.green : accent === "amber" ? C.amber : accent === "red" ? C.red : accent === "purple" ? C.purple : undefined;
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      {accentColor && <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: accentColor }} />}
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: PillTone;
}) {
  const subColor =
    tone === "red" ? "text-[#E24B4A]" :
    tone === "amber" ? "text-[#BA7517]" :
    tone === "green" ? "text-[#1D9E75]" :
    "text-muted-foreground";
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</div>
        {sub && <p className={cn("text-xs mt-1", subColor)}>{sub}</p>}
      </div>
    </Card>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="h-3 w-3" />—</span>;
  if (value > 0) return <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: C.green }}><ArrowUpRight className="h-3 w-3" />{value}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: C.red }}><ArrowDownRight className="h-3 w-3" />{Math.abs(value)}%</span>;
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Tabs
// ───────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Genel Bakış" },
  { id: "pipeline", label: "Pipeline & Performans" },
  { id: "commission", label: "Komisyon Yönetimi" },
  { id: "risk", label: "Risk Radar" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function AdminDashboard() {
  const [tab, setTab] = useState<TabId>("overview");

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="B2B partner ekosistem yönetimi" />

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative pb-3 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {active && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full" style={{ background: C.blue }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div key={tab} className="animate-in fade-in duration-200">
        {tab === "overview" && <OverviewTab />}
        {tab === "pipeline" && <PipelineTab />}
        {tab === "commission" && <CommissionTab />}
        {tab === "risk" && <RiskTab />}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// TAB 1 — Overview
// ───────────────────────────────────────────────────────────────────────────────
function OverviewTab() {
  const types = [
    { name: "Reseller" as PType, count: 14, pct: 58, color: C.blue },
    { name: "Referral" as PType, count: 7, pct: 29, color: C.purple },
    { name: "Certified" as PType, count: 3, pct: 13, color: C.green },
  ];
  const leaders = [
    { rank: 1, name: "Acme Corp", tier: "Gold" as Tier, deals: 8, win: 62, pipeline: "€84.200", delta: 12 },
    { rank: 2, name: "Northwind GmbH", tier: "Silver" as Tier, deals: 6, win: 40, pipeline: "€61.500", delta: 5 },
    { rank: 3, name: "Globex Ltd", tier: "Certified" as Tier, deals: 5, win: 55, pipeline: "€48.900", delta: null },
    { rank: 4, name: "Initech BV", tier: "Silver" as Tier, deals: 4, win: 28, pipeline: "€37.100", delta: -8 },
    { rank: 5, name: "Contoso SA", tier: "Bronze" as Tier, deals: 3, win: 33, pipeline: "€22.800", delta: 3 },
  ];
  const feed: { dot: string; text: ReactNode; time: string }[] = [
    { dot: C.green, text: <><b>Acme Corp</b> — "Northwind Power" deal <span style={{ color: C.green }}>Won</span> · €18.000</>, time: "12 dk önce" },
    { dot: C.blue, text: <><b>Globex</b> — yeni lead "TechStart AG" oluşturuldu</>, time: "1 sa önce" },
    { dot: C.red, text: <><b>Litware Inc</b> — 21 gündür sıfır aktivite ⚠</>, time: "2 sa önce" },
    { dot: C.amber, text: <><b>Fabrikam</b> — sertifika 7 gün içinde doluyor</>, time: "3 sa önce" },
    { dot: C.purple, text: <><b>Contoso SA</b> — "Blue Ocean" Proposal stage'ine taşındı</>, time: "5 sa önce" },
    { dot: C.green, text: <><b>VanArsdel</b> — Q1 komisyonu onaylandı · €2.400</>, time: "1 gün önce" },
    { dot: C.red, text: <><b>Trey Research</b> — onboarding 14 gündür durdu</>, time: "1 gün önce" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Kpi label="Toplam Partner" value="24" sub="↑3 bu ay" icon={Users} tone="green" />
        <Kpi label="Aktif Deal'lar" value="47" sub="€284.500 pipeline" icon={Handshake} />
        <Kpi label="Est. Komisyon Q2" value="€38.200" sub="19 gün kaldı" icon={Coins} tone="amber" />
        <Kpi label="Bekleyen Ödeme" value="€12.400" sub="4 partner · Q1" icon={Clock} tone="amber" />
        <Kpi label="Riskli Partner" value="6" sub="↑2 bu hafta" icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1 — Ecosystem */}
        <Card>
          <div className="p-5">
            <SectionHeader title="Ekosistem dağılımı" subtitle="Partner tipi bazlı" />
            <div className="space-y-3">
              {types.map((t) => (
                <div key={t.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={t.name} />
                      <span className="text-sm text-foreground">{t.count} partner</span>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{t.pct}%</span>
                  </div>
                  <Bar pct={t.pct} color={t.color} />
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-3">Tier dağılımı (Reseller)</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { tier: "Bronze" as Tier, count: 5 },
                  { tier: "Silver" as Tier, count: 6 },
                  { tier: "Gold" as Tier, count: 3 },
                ].map((t) => (
                  <div key={t.tier} className="rounded-lg border border-border p-3 text-center">
                    <div className="text-xl font-semibold tabular-nums text-foreground">{t.count}</div>
                    <div className="mt-1.5 flex justify-center"><TierBadge tier={t.tier} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Column 2 — Pipeline leaders */}
        <Card>
          <div className="p-5">
            <SectionHeader
              title="Pipeline liderleri"
              subtitle="En yüksek aktif pipeline değeri"
              action={<button className="text-xs text-muted-foreground hover:text-foreground">Tümü →</button>}
            />
            <div className="space-y-3">
              {leaders.map((l) => (
                <div key={l.rank} className="flex items-center gap-3 py-1.5">
                  <span
                    className={cn(
                      "w-5 text-sm font-semibold tabular-nums",
                      l.rank <= 2 ? "text-[#BA7517]" : "text-muted-foreground",
                    )}
                  >
                    {l.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{l.name}</span>
                      <TierBadge tier={l.tier} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.deals} deal · win {l.win}%</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium tabular-nums text-foreground">{l.pipeline}</div>
                    <div className="mt-0.5"><Delta value={l.delta} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Column 3 — Activity */}
        <Card>
          <div className="p-5">
            <SectionHeader
              title="Son aktiviteler"
              subtitle="Tüm partner ekosistemi"
              action={<button className="text-xs text-muted-foreground hover:text-foreground">Tümü →</button>}
            />
            <div className="space-y-3.5">
              {feed.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: f.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug">{f.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{f.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// TAB 2 — Pipeline & Performance
// ───────────────────────────────────────────────────────────────────────────────
function PipelineTab() {
  const stages = [
    { name: "Identified", deals: 12, value: "€68.400", pct: 100, color: C.gray, group: "active" },
    { name: "Qualified", deals: 10, value: "€74.200", pct: 84, color: C.blue, group: "active" },
    { name: "Proposal", deals: 9, value: "€62.100", pct: 75, color: C.purple, group: "active" },
    { name: "Negotiation", deals: 6, value: "€48.300", pct: 58, color: C.amber, group: "active" },
    { name: "Won", deals: 10, value: "€62.800", pct: 72, color: C.green, group: "closed" },
    { name: "Lost", deals: 5, value: "€31.200", pct: 38, color: C.red, group: "closed" },
  ];

  const topWon = [
    { rank: 1, name: "Acme Corp", tier: "Gold" as Tier, deals: 5, win: 62, value: "€31.400" },
    { rank: 2, name: "Globex Ltd", tier: "Certified" as Tier, deals: 3, win: 55, value: "€18.200" },
    { rank: 3, name: "Northwind GmbH", tier: "Silver" as Tier, deals: 2, win: 40, value: "€13.200" },
    { rank: 4, name: "Contoso SA", tier: "Bronze" as Tier, deals: 1, win: 33, value: "€6.800" },
  ];

  type Health = { name: string; badge: ReactNode; pct: number; ago: string; tone: "green" | "blue" | "amber" | "red" };
  const active: Health[] = [
    { name: "Acme Corp", badge: <TierBadge tier="Gold" />, pct: 98, ago: "12 dk önce", tone: "green" },
    { name: "Globex Ltd", badge: <TierBadge tier="Certified" />, pct: 95, ago: "1 sa önce", tone: "green" },
    { name: "Northwind", badge: <TierBadge tier="Silver" />, pct: 88, ago: "5 sa önce", tone: "green" },
    { name: "Contoso SA", badge: <TierBadge tier="Bronze" />, pct: 72, ago: "2 gün önce", tone: "blue" },
  ];
  const slowing: Health[] = [
    { name: "Trey Research", badge: <TypeBadge type="Referral" />, pct: 35, ago: "9 gün önce", tone: "amber" },
  ];
  const inactive: Health[] = [
    { name: "Litware Inc", badge: <TierBadge tier="Silver" />, pct: 12, ago: "21 gün önce", tone: "red" },
    { name: "Woodgrove", badge: <TierBadge tier="Silver" />, pct: 20, ago: "15 gün önce", tone: "red" },
  ];

  const toneColor = { green: C.green, blue: C.blue, amber: C.amber, red: C.red } as const;

  const renderHealthList = (items: Health[]) => (
    <div className="space-y-2.5">
      {items.map((h) => (
        <div key={h.name}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-foreground truncate">{h.name}</span>
              {h.badge}
            </div>
            <span className="text-[11px] tabular-nums" style={{ color: toneColor[h.tone] }}>{h.ago}</span>
          </div>
          <Bar pct={h.pct} color={toneColor[h.tone]} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Toplam Pipeline" value="€284.500" sub="47 aktif deal" icon={Handshake} />
        <Kpi label="Bu Dönem Won" value="€62.800" sub="↑18% geçen çeyrek" icon={TrendingUp} tone="green" />
        <Kpi label="Ortalama Win Rate" value="%38" sub="tüm partnerler" icon={Activity} />
        <Kpi label="Hareketsiz Deal" value="8" sub="14+ gün güncellenmedi" icon={AlertTriangle} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stage distribution */}
        <Card accent="blue">
          <div className="p-5">
            <SectionHeader title="Stage dağılımı" subtitle="Aktif & kapanan deal'lar" />
            <div className="space-y-3">
              {stages.map((s, i) => (
                <div key={s.name}>
                  {i === 4 && <div className="my-3 border-t border-border" />}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                      <span className="text-sm text-foreground">{s.name}</span>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{s.deals} deal · {s.value}</span>
                  </div>
                  <Bar pct={s.pct} color={s.color} />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top Won */}
        <Card accent="green">
          <div className="p-5">
            <SectionHeader title="En çok Won" subtitle="Bu dönem · deal değeri & win rate" />
            <div className="space-y-4">
              {topWon.map((p) => (
                <div key={p.rank} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-semibold tabular-nums text-muted-foreground">
                    {p.rank === 1 ? <Trophy className="h-4 w-4" style={{ color: C.amber }} /> : p.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                      <TierBadge tier={p.tier} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground tabular-nums w-16">{p.deals} won · {p.win}%</span>
                      <div className="flex-1"><Bar pct={p.win} color={C.green} /></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium tabular-nums text-foreground">{p.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Activity health */}
        <Card accent="purple">
          <div className="p-5">
            <SectionHeader title="Partner aktivite sağlığı" subtitle="Son aktivite — gün bazlı" />
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: C.green }}>Aktif partnerler</p>
                {renderHealthList(active)}
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: C.amber }}>Yavaşlayan partnerler</p>
                {renderHealthList(slowing)}
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: C.red }}>Hareketsiz partnerler</p>
                {renderHealthList(inactive)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// TAB 3 — Commission
// ───────────────────────────────────────────────────────────────────────────────
function CommissionTab() {
  const typeRows = [
    { type: "Reseller" as PType, count: 14, rate: "%10–20", amount: "€21.400", share: 56, tone: "blue" as PillTone, color: C.blue },
    { type: "Certified" as PType, count: 3, rate: "%25", amount: "€12.800", share: 34, tone: "green" as PillTone, color: C.green },
    { type: "Referral" as PType, count: 7, rate: "%10", amount: "€4.000", share: 10, tone: "purple" as PillTone, color: C.purple },
  ];

  const tierRows = [
    { tier: "Gold" as Tier, count: 3, rate: "%20", share: 50, amount: "€10.800", color: C.amber },
    { tier: "Silver" as Tier, count: 6, rate: "%15", share: 33, amount: "€7.200", color: C.gray },
    { tier: "Bronze" as Tier, count: 5, rate: "%10", share: 16, amount: "€3.400", color: "#BA7517" },
  ];

  type PeriodDef = {
    accent: PillTone;
    accentHex: string;
    badge: string;
    name: string;
    partners: string;
    daysLeft: string;
    progressPct: number;
    progressLabel: string;
    progressEnd: string;
    wonValue: string;
    wonDeals: string;
    estValue: string;
    estSub: string;
    estTone: PillTone;
    paidValue: string;
    paidSub: string;
    paidTone: PillTone;
    unpaidValue: string;
    unpaidSub: string;
    unpaidTone: PillTone;
  };

  const periods: PeriodDef[] = [
    {
      accent: "blue",
      accentHex: C.blue,
      badge: "Aylık",
      name: "Haziran 2026",
      partners: "9 partner",
      daysLeft: "19 gün kaldı",
      progressPct: 74,
      progressLabel: "Ay başı",
      progressEnd: "%74 geçti",
      wonValue: "€18.400",
      wonDeals: "6 deal closed",
      estValue: "€8.400",
      estSub: "Dönem sonu ödenecek",
      estTone: "amber",
      paidValue: "€5.200",
      paidSub: "Önceki ay komisyonu",
      paidTone: "green",
      unpaidValue: "€3.200",
      unpaidSub: "2 partner bekliyor",
      unpaidTone: "red",
    },
    {
      accent: "green",
      accentHex: C.green,
      badge: "Çeyreklik",
      name: "Q2 2026",
      partners: "11 partner",
      daysLeft: "19 gün kaldı",
      progressPct: 88,
      progressLabel: "Q2 başı",
      progressEnd: "%88 geçti",
      wonValue: "€31.200",
      wonDeals: "11 deal closed",
      estValue: "€21.400",
      estSub: "Dönem sonu ödenecek",
      estTone: "amber",
      paidValue: "€14.200",
      paidSub: "Q1 komisyonu ödendi",
      paidTone: "green",
      unpaidValue: "€7.300",
      unpaidSub: "3 partner bekliyor",
      unpaidTone: "red",
    },
    {
      accent: "amber",
      accentHex: C.amber,
      badge: "Yıllık",
      name: "FY2026",
      partners: "4 partner",
      daysLeft: "203 gün kaldı",
      progressPct: 45,
      progressLabel: "Yıl başı",
      progressEnd: "%45 geçti",
      wonValue: "€13.200",
      wonDeals: "3 deal closed",
      estValue: "€8.400",
      estSub: "Yıl sonu ödenecek",
      estTone: "gray",
      paidValue: "—",
      paidSub: "Yıl kapanmadı",
      paidTone: "gray",
      unpaidValue: "—",
      unpaidSub: "Yıl kapanmadı",
      unpaidTone: "gray",
    },
  ];

  function MetricCell({
    icon: Icon,
    label,
    value,
    sub,
    valueColor,
    muted = false,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub: string;
    valueColor: string;
    muted?: boolean;
  }) {
    return (
      <div
        className={cn(
          "rounded-lg p-3 flex flex-col gap-1.5",
          muted ? "bg-muted/40" : "bg-muted/60"
        )}
      >
        <div className="flex items-center gap-1.5">
          <Icon
            className={cn(
              "h-3.5 w-3.5",
              muted ? "text-muted-foreground/50" : "text-muted-foreground"
            )}
          />
          <span
            className={cn(
              "text-[10px] font-medium uppercase tracking-wider",
              muted ? "text-muted-foreground/50" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </div>
        <div
          className={cn(
            "text-base font-semibold tabular-nums",
            muted && "text-muted-foreground/40"
          )}
          style={muted ? undefined : { color: valueColor }}
        >
          {value}
        </div>
        <span
          className={cn(
            "text-[11px]",
            muted ? "text-muted-foreground/40" : "text-muted-foreground"
          )}
        >
          {sub}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Est. Komisyon Q2" value="€38.200" sub="Dönem sonu ödenecek" icon={Coins} tone="amber" />
        <Kpi label="Bekleyen Q1" value="€12.400" sub="4 partner · işlem bekliyor" icon={Clock} tone="red" />
        <Kpi label="Ödendi YTD" value="€64.800" sub="2026 yılı toplamı" icon={TrendingUp} tone="green" />
        <Kpi label="Gecikmiş Ödeme" value="€4.200" sub="1 partner · 12 gün gecikti" icon={AlertTriangle} tone="red" />
      </div>

      {/* Period cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {periods.map((p) => (
          <Card key={p.badge} accent={p.accent}>
            <div className="p-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Pill tone={p.accent}>{p.badge}</Pill>
                  <span className="text-sm font-medium text-foreground">{p.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-foreground">{p.partners}</div>
                  <div className="text-[11px] text-muted-foreground">{p.daysLeft}</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-muted-foreground">{p.progressLabel}</span>
                  <span className="text-[11px] font-medium tabular-nums" style={{ color: p.accentHex }}>
                    {p.progressEnd}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${p.progressPct}%`, background: p.accentHex }}
                  />
                </div>
              </div>

              {/* 2x2 metric grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <MetricCell
                  icon={CheckCircle2}
                  label="Won"
                  value={p.wonValue}
                  sub={p.wonDeals}
                  valueColor={C.green}
                />
                <MetricCell
                  icon={Clock}
                  label="Tahmini kom."
                  value={p.estValue}
                  sub={p.estSub}
                  valueColor={p.estTone === "gray" ? C.gray : C.amber}
                  muted={p.estTone === "gray"}
                />
                <MetricCell
                  icon={CreditCard}
                  label="Ödenen"
                  value={p.paidValue}
                  sub={p.paidSub}
                  valueColor={C.green}
                  muted={p.paidTone === "gray"}
                />
                <MetricCell
                  icon={AlertCircle}
                  label="Ödenmemiş"
                  value={p.unpaidValue}
                  sub={p.unpaidSub}
                  valueColor={C.red}
                  muted={p.unpaidTone === "gray"}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Type + Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Type-based */}
        <Card accent="blue">
          <div className="p-5">
            <SectionHeader title="Tip bazlı komisyon" subtitle="Q2 2026 tahmini" />
            <div className="space-y-3">
              {typeRows.map((r) => (
                <div key={r.type} className="flex items-center justify-between py-1.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><TypeBadge type={r.type} /><span className="text-sm text-foreground">{r.count} partner</span></div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.rate} rebate</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium tabular-nums text-foreground">{r.amount}</span>
                    <Pill tone={r.tone}>{r.share}%</Pill>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Toplam Q2</span>
              <span className="text-base font-semibold tabular-nums text-foreground">€38.200</span>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full rounded-full overflow-hidden flex">
                {typeRows.map((r) => (
                  <div key={r.type} style={{ width: `${r.share}%`, background: r.color }} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {typeRows.map((r) => (
                  <div key={r.type} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />
                    <span className="text-[11px] text-muted-foreground">{r.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Tier-based */}
        <Card accent="amber">
          <div className="p-5">
            <SectionHeader title="Tier bazlı komisyon" subtitle="Reseller · Q2 2026" />
            <div className="space-y-4">
              {tierRows.map((r) => (
                <div key={r.tier}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={r.tier} />
                      <span className="text-sm text-foreground">{r.count} partner</span>
                      <span className="text-[11px] text-muted-foreground">· {r.rate}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] tabular-nums text-muted-foreground">{r.share}%</span>
                      <span className="text-sm font-medium tabular-nums text-foreground">{r.amount}</span>
                    </div>
                  </div>
                  <Bar pct={r.share} color={r.color} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// TAB 4 — Risk Radar
// ───────────────────────────────────────────────────────────────────────────────
function RiskTab() {
  type Risk = { name: string; badge: ReactNode; signals: string[]; pillCount: number };

  const critical: Risk[] = [
    {
      name: "Litware Inc",
      badge: <TierBadge tier="Silver" />,
      pillCount: 3,
      signals: [
        "⛔ Seller sertifikası 45 gün önce doldu — komisyon bloku aktif",
        "⛔ 21 gündür sıfır aktivite — pipeline çürüme riski",
        "⛔ Q1 ödemesi 12 gün gecikmiş · €4.200",
      ],
    },
    {
      name: "Trey Research",
      badge: <TypeBadge type="Referral" />,
      pillCount: 2,
      signals: [
        "⛔ Onboarding 14 gündür durdu — aktivasyon riski",
        "⛔ Q1 komisyon ödemesi bekliyor · €3.100",
      ],
    },
  ];

  const moderate: Risk[] = [
    {
      name: "Fabrikam",
      badge: <TierBadge tier="Bronze" />,
      pillCount: 2,
      signals: ["⚠ Sertifika 7 gün içinde doluyor", "⚠ Q1 ödemesi bekliyor · €2.800"],
    },
    {
      name: "Initech BV",
      badge: <TierBadge tier="Silver" />,
      pillCount: 2,
      signals: [
        "⚠ Pipeline %8 düştü · 3 deal 14+ gün hareketsiz",
        "⚠ Silver tier kaybı riski — gelir hedefinin %18 altında",
      ],
    },
    {
      name: "Bellows Co.",
      badge: <TierBadge tier="Gold" />,
      pillCount: 1,
      signals: ["⚠ Yıllık SW geliri Gold hedefinin %18 gerisinde — tier düşme riski"],
    },
    {
      name: "Woodgrove",
      badge: <TierBadge tier="Silver" />,
      pillCount: 1,
      signals: ["⚠ Win rate %15'e geriledi · son 3 deal Lost"],
    },
  ];

  const RiskCard = ({ r, tone }: { r: Risk; tone: "red" | "amber" }) => {
    const bg = tone === "red" ? "bg-[#E24B4A]/5 border-[#E24B4A]/25" : "bg-[#BA7517]/5 border-[#BA7517]/25";
    return (
      <div className={cn("rounded-xl border p-4", bg)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{r.name}</span>
            {r.badge}
          </div>
          <Pill tone={tone}>{r.pillCount} sinyal</Pill>
        </div>
        <ul className="space-y-1.5">
          {r.signals.map((s, i) => (
            <li key={i} className="text-sm text-foreground/90 leading-snug">{s}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Kritik Risk" value="2" sub="Acil müdahale" icon={ShieldAlert} tone="red" />
        <Kpi label="Orta Risk" value="4" sub="Takip gerekiyor" icon={AlertTriangle} tone="amber" />
        <Kpi label="Süresi Dolan Sertifika" value="5" sub="30 gün içinde" icon={Clock} tone="amber" />
        <Kpi label="Tier Kaybı Riski" value="2" sub="Gelir hedefinin altında" icon={TrendingUp} tone="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card accent="red">
          <div className="p-5">
            <SectionHeader title="Kritik riskler" subtitle="Hemen aksiyon gerekiyor" />
            <div className="space-y-3">
              {critical.map((r) => <RiskCard key={r.name} r={r} tone="red" />)}
            </div>
          </div>
        </Card>

        <Card accent="amber">
          <div className="p-5">
            <SectionHeader title="Orta riskler" subtitle="Proaktif takip önerilen" />
            <div className="space-y-3">
              {moderate.map((r) => <RiskCard key={r.name} r={r} tone="amber" />)}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}