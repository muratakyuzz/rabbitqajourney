import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, Columns3, Search, ChevronLeft, ChevronRight, DollarSign, TrendingUp, CheckCircle2, Wallet, Coins, Info, ExternalLink, BadgeDollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { ManageCommissionDialog, type PendingCommission } from "@/components/ManageCommissionDialog";

// ── Partner Performance (Summary) ──
const partnerPerformance = [
  { partner: "TechVision Ltd.", leads: 28, deals: 12, revenue: "$485,000", trend: "up" as const },
  { partner: "CloudNet Solutions", leads: 22, deals: 9, revenue: "$362,000", trend: "up" as const },
  { partner: "DataBridge Corp.", leads: 18, deals: 6, revenue: "$198,000", trend: "down" as const },
  { partner: "InnoSoft Inc.", leads: 15, deals: 8, revenue: "$310,000", trend: "up" as const },
  { partner: "SmartEdge Tech", leads: 12, deals: 4, revenue: "$145,000", trend: "down" as const },
];

type SummaryColumnKey = "partner" | "leads" | "deals" | "revenue" | "trend";
const allSummaryColumns: { key: SummaryColumnKey; label: string }[] = [
  { key: "partner", label: "Partner" },
  { key: "leads", label: "Leads" },
  { key: "deals", label: "Deals" },
  { key: "revenue", label: "Revenue" },
  { key: "trend", label: "Trend" },
];

// ── Transaction Details ──
interface Transaction {
  id: string;
  date: string;
  partner: string;
  type: "Lead" | "Deal";
  description: string;
  company: string;
  amount: string;
  status: string;
}

const transactionDetails: Transaction[] = [
  { id: "TXN-001", date: "2025-04-12", partner: "TechVision Ltd.", type: "Deal", description: "Enterprise CRM License", company: "GlobalTech Industries", amount: "$82,000", status: "Won" },
  { id: "TXN-002", date: "2025-04-10", partner: "CloudNet Solutions", type: "Lead", description: "Cloud Migration Assessment", company: "StartupXYZ", amount: "$32,000", status: "Approved" },
  { id: "TXN-003", date: "2025-04-08", partner: "DataBridge Corp.", type: "Deal", description: "Analytics Platform POC", company: "RetailMax", amount: "$25,000", status: "Open" },
  { id: "TXN-004", date: "2025-04-06", partner: "InnoSoft Inc.", type: "Lead", description: "Mobile App Development", company: "HealthPlus", amount: "$95,000", status: "Submitted" },
  { id: "TXN-005", date: "2025-04-04", partner: "SmartEdge Tech", type: "Deal", description: "Security Suite Deployment", company: "FinServe Bank", amount: "$110,000", status: "Lost" },
  { id: "TXN-006", date: "2025-04-02", partner: "TechVision Ltd.", type: "Lead", description: "ERP Integration Project", company: "ManuCo", amount: "$150,000", status: "Draft" },
  { id: "TXN-007", date: "2025-03-30", partner: "CloudNet Solutions", type: "Deal", description: "Cloud Infrastructure Setup", company: "EduTech Corp", amount: "$55,000", status: "Won" },
  { id: "TXN-008", date: "2025-03-28", partner: "InnoSoft Inc.", type: "Lead", description: "AI Chatbot Implementation", company: "ServiceFirst", amount: "$45,000", status: "Approved" },
  { id: "TXN-009", date: "2025-03-25", partner: "DataBridge Corp.", type: "Deal", description: "Data Warehouse Migration", company: "LogiCorp", amount: "$78,000", status: "Open" },
  { id: "TXN-010", date: "2025-03-22", partner: "SmartEdge Tech", type: "Lead", description: "IoT Monitoring Platform", company: "AgriTech Solutions", amount: "$62,000", status: "Rejected" },
];

type DetailColumnKey = "id" | "date" | "partner" | "type" | "description" | "company" | "amount" | "status";
const allDetailColumns: { key: DetailColumnKey; label: string }[] = [
  { key: "id", label: "Transaction ID" },
  { key: "date", label: "Date" },
  { key: "partner", label: "Partner" },
  { key: "type", label: "Type" },
  { key: "description", label: "Description" },
  { key: "company", label: "Company" },
  { key: "amount", label: "Amount" },
  { key: "status", label: "Status" },
];

// ── Finance KPI data ──
type PeriodFilter = "all" | "monthly" | "quarterly" | "yearly";

// ── Per-partner commission history (mock) ──
export interface CommissionRecord {
  id: string;
  partner: string;
  deal: string;
  customer: string;
  unpaid: number;
  paid: number;
  status: "Pending" | "Paid";
  date: string;
}

const initialCommissionRecords: CommissionRecord[] = [
  { id: "C-1001", partner: "TechVision Ltd.", deal: "Enterprise CRM License", customer: "GlobalTech Industries", unpaid: 8200, paid: 0, status: "Pending", date: "2025-04-12" },
  { id: "C-1002", partner: "TechVision Ltd.", deal: "ERP Integration Project", customer: "ManuCo", unpaid: 15000, paid: 0, status: "Pending", date: "2025-04-02" },
  { id: "C-1003", partner: "TechVision Ltd.", deal: "Analytics Add-on", customer: "GlobalTech Industries", unpaid: 0, paid: 3200, status: "Paid", date: "2025-02-18" },
  { id: "C-2001", partner: "CloudNet Solutions", deal: "Cloud Migration Assessment", customer: "StartupXYZ", unpaid: 3200, paid: 0, status: "Pending", date: "2025-04-10" },
  { id: "C-2002", partner: "CloudNet Solutions", deal: "Cloud Infrastructure Setup", customer: "EduTech Corp", unpaid: 5500, paid: 0, status: "Pending", date: "2025-03-30" },
  { id: "C-3001", partner: "DataBridge Corp.", deal: "Analytics Platform POC", customer: "RetailMax", unpaid: 2500, paid: 0, status: "Pending", date: "2025-04-08" },
  { id: "C-3002", partner: "DataBridge Corp.", deal: "Data Warehouse Migration", customer: "LogiCorp", unpaid: 7800, paid: 0, status: "Pending", date: "2025-03-25" },
  { id: "C-4001", partner: "InnoSoft Inc.", deal: "Mobile App Development", customer: "HealthPlus", unpaid: 9500, paid: 0, status: "Pending", date: "2025-04-06" },
  { id: "C-4002", partner: "InnoSoft Inc.", deal: "AI Chatbot Implementation", customer: "ServiceFirst", unpaid: 0, paid: 4500, status: "Paid", date: "2025-03-01" },
  { id: "C-5001", partner: "SmartEdge Tech", deal: "Security Suite Deployment", customer: "FinServe Bank", unpaid: 11000, paid: 0, status: "Pending", date: "2025-04-04" },
  { id: "C-5002", partner: "SmartEdge Tech", deal: "IoT Monitoring Platform", customer: "AgriTech Solutions", unpaid: 6200, paid: 0, status: "Pending", date: "2025-03-22" },
];

interface PeriodMetrics {
  totalRev: [number | null, number | null];
  unqPipeline: [number | null, number | null];
  qPipeline: [number | null, number | null];
  paidCom: [number | null, number | null];
  estCom: [number | null, number | null];
  periodLabel: string;
  progress: number;
  periodStartLabel: string;
  daysRemaining: number;
}

const FINANCE_DATA: Record<PeriodFilter, PeriodMetrics> = {
  all: {
    totalRev: [6200, 2200],
    unqPipeline: [11000, 0],
    qPipeline: [0, 1400],
    paidCom: [0, 0],
    estCom: [396, 132],
    periodLabel: "Active periods",
    progress: 74,
    periodStartLabel: "Avg cycle",
    daysRemaining: 0,
  },
  monthly: {
    totalRev: [3600, 1200],
    unqPipeline: [11000, 0],
    qPipeline: [0, 0],
    paidCom: [0, 0],
    estCom: [396, 132],
    periodLabel: "June 2026",
    progress: 74,
    periodStartLabel: "Jun 1",
    daysRemaining: 8,
  },
  quarterly: {
    totalRev: [0, 0],
    unqPipeline: [0, 0],
    qPipeline: [1950, 1400],
    paidCom: [0, 0],
    estCom: [0, 0],
    periodLabel: "Q2 2026",
    progress: 88,
    periodStartLabel: "Apr 1",
    daysRemaining: 11,
  },
  yearly: {
    totalRev: [null, null],
    unqPipeline: [null, null],
    qPipeline: [null, null],
    paidCom: [null, null],
    estCom: [null, null],
    periodLabel: "FY2026",
    progress: 45,
    periodStartLabel: "Jan 1",
    daysRemaining: 203,
  },
};

const FILTERS: { key: PeriodFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "yearly", label: "Yearly" },
];

const ACCENTS: Record<PeriodFilter, { bar: string; badge: string; text: string }> = {
  monthly: { bar: "bg-[#3266AD]", badge: "bg-[#3266AD]/10 text-[#3266AD]", text: "text-[#3266AD]" },
  quarterly: { bar: "bg-[#1D9E75]", badge: "bg-[#1D9E75]/10 text-[#1D9E75]", text: "text-[#1D9E75]" },
  yearly: { bar: "bg-[#BA7517]", badge: "bg-[#BA7517]/10 text-[#BA7517]", text: "text-[#BA7517]" },
  all: { bar: "bg-muted-foreground/40", badge: "bg-muted text-muted-foreground", text: "text-muted-foreground" },
};

function fmtUSD(v: number | null) {
  if (v === null) return "—";
  return `$${v.toLocaleString()}`;
}
function fmtEUR(v: number | null) {
  if (v === null) return "—";
  return `€${v.toLocaleString()}`;
}

function CurrencyRow({ tag, value, accent }: { tag: "USD" | "EUR"; value: string; accent?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
      <span className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground/70">{tag}</span>
      <span className={cn("text-[22px] font-medium leading-none tabular-nums tracking-tight", accent ?? "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  icon: Icon,
  usd,
  eur,
}: {
  label: string;
  icon: typeof DollarSign;
  usd: number | null;
  eur: number | null;
}) {
  return (
    <Card className="group relative rounded-2xl border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-border hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)]">
      <CardContent className="p-5">
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <div className="divide-y divide-border/40">
          <CurrencyRow tag="USD" value={fmtUSD(usd)} />
          <CurrencyRow tag="EUR" value={fmtEUR(eur)} />
        </div>
      </CardContent>
    </Card>
  );
}

function EstCommissionCard({
  filter,
  metrics,
  isPastYear,
}: {
  filter: PeriodFilter;
  metrics: PeriodMetrics;
  isPastYear: boolean;
}) {
  const accent = ACCENTS[filter];
  const filterLabel = FILTERS.find((f) => f.key === filter)?.label ?? "All";
  return (
    <Card
      className={cn(
        "group relative overflow-hidden rounded-2xl border-border/60 bg-card shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)]",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-[3px]", accent.bar)} />
      <div className={cn("pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-[0.06] blur-2xl", accent.bar)} />
      <CardContent className="relative p-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", accent.badge)}>
              <Coins className="h-3.5 w-3.5" />
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Est. Commission
            </span>
          </div>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", accent.badge)}>
            {filterLabel}
          </span>
        </div>
        <div className={cn("mb-3 ml-9 text-[11px] font-medium", accent.text)}>{metrics.periodLabel}</div>
        <div className="divide-y divide-border/40">
          <CurrencyRow tag="USD" value={fmtUSD(metrics.estCom[0])} accent={accent.text} />
          <CurrencyRow tag="EUR" value={fmtEUR(metrics.estCom[1])} accent={accent.text} />
        </div>
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn("h-full rounded-full transition-all", accent.bar)}
              style={{ width: `${isPastYear ? 100 : metrics.progress}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
            <span>{metrics.periodStartLabel}</span>
            <span className={cn(accent.text)}>
              {isPastYear ? "100%" : `${metrics.progress}%`}
              {!isPastYear && metrics.daysRemaining > 0 ? ` · ${metrics.daysRemaining}d left` : ""}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceKpiBar({ paidOverrideUsd, estOverrideUsd }: { paidOverrideUsd: number; estOverrideUsd: number }) {
  const currentYear = new Date().getFullYear();
  const [filter, setFilter] = useState<PeriodFilter>("all");
  const [year, setYear] = useState<number>(currentYear);
  const isPastYear = year < currentYear;
  const base = FINANCE_DATA[filter];
  const metrics: PeriodMetrics = {
    ...base,
    paidCom: [paidOverrideUsd, base.paidCom[1]],
    estCom: [estOverrideUsd, base.estCom[1]],
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="inline-flex items-center gap-1 rounded-full border border-border p-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full"
            onClick={() => setYear((y) => Math.max(currentYear - 1, y - 1))}
            disabled={year <= currentYear - 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="px-2 text-sm font-medium tabular-nums">{year}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full"
            onClick={() => setYear((y) => Math.min(currentYear, y + 1))}
            disabled={year >= currentYear}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {isPastYear ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          Viewing archived data for {year}. Card values reflect finalized totals.
        </div>
      ) : null}

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Revenue" icon={DollarSign} usd={metrics.totalRev[0]} eur={metrics.totalRev[1]} />
        <MetricCard label="Unqualified Pipeline" icon={TrendingUp} usd={metrics.unqPipeline[0]} eur={metrics.unqPipeline[1]} />
        <MetricCard label="Qualified Pipeline" icon={CheckCircle2} usd={metrics.qPipeline[0]} eur={metrics.qPipeline[1]} />
        <div className="sm:col-span-2 lg:col-span-1">
          <EstCommissionCard filter={filter} metrics={metrics} isPastYear={isPastYear} />
        </div>
        <MetricCard
          label={isPastYear ? "Paid Commissions" : "Paid Commissions"}
          icon={Wallet}
          usd={metrics.paidCom[0]}
          eur={metrics.paidCom[1]}
        />
      </div>
    </div>
  );
}

// ── Status badge helper ──
function StatusBadgeInline({ status }: { status: string }) {
  const map: Record<string, string> = {
    Won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    Open: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Submitted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    Draft: "bg-muted text-muted-foreground border-border",
    Lost: "bg-red-500/10 text-red-600 border-red-500/20",
    Rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
}

// ── Reusable filtered table with column toggle ──
function FilterableTable<K extends string>({
  data,
  allColumns,
  rowMenu,
}: {
  data: Record<string, unknown>[];
  allColumns: { key: K; label: string }[];
  rowMenu?: (row: Record<string, unknown>) => React.ReactNode;
}) {
  const [visibleColumns, setVisibleColumns] = useState<Set<K>>(
    new Set(allColumns.map((c) => c.key))
  );
  const [filters, setFilters] = useState<Record<string, string>>({});

  const toggleColumn = (key: K) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    return data.filter((row) => {
      for (const key of Object.keys(filters)) {
        const q = filters[key]?.toLowerCase();
        if (!q) continue;
        const val = String(row[key] ?? "").toLowerCase();
        if (!val.includes(q)) return false;
      }
      return true;
    });
  }, [data, filters]);

  const activeColumns = allColumns.filter((c) => visibleColumns.has(c.key));

  return (
    <>
      <div className="flex justify-end mb-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Toggle columns</p>
            {allColumns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  checked={visibleColumns.has(col.key)}
                  onCheckedChange={() => toggleColumn(col.key)}
                />
                {col.label}
              </label>
            ))}
          </PopoverContent>
        </Popover>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {activeColumns.map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
          </TableRow>
          <TableRow className="hover:bg-transparent border-b">
            {activeColumns.map((col) => (
              <TableHead key={`filter-${col.key}`} className="py-1.5 px-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Filter..."
                    value={filters[col.key] || ""}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, [col.key]: e.target.value }))
                    }
                    className="h-7 pl-7 text-xs"
                  />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={activeColumns.length} className="text-center py-12 text-muted-foreground">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((row, idx) => (
              rowMenu ? (
                <DropdownMenu key={idx}>
                  <DropdownMenuTrigger asChild>
                    <TableRow className="cursor-pointer">
                      {renderCells(row, activeColumns)}
                    </TableRow>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {rowMenu(row)}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <TableRow key={idx}>{renderCells(row, activeColumns)}</TableRow>
              )
            ))
          )}
        </TableBody>
      </Table>
    </>
  );

  function renderCells(row: Record<string, unknown>, cols: { key: K; label: string }[]) {
    return cols.map((col) => {
                  const val = String(row[col.key] ?? "");
                  // Special renderers
                  if (col.key === "trend") {
                    return (
                      <TableCell key={col.key} className="text-right">
                        {val === "up" ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> Rising
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20">
                            <ArrowDownRight className="h-3 w-3 mr-1" /> Declining
                          </Badge>
                        )}
                      </TableCell>
                    );
                  }
                  if (col.key === "status" && col.label === "Status") {
                    return (
                      <TableCell key={col.key}>
                        <StatusBadgeInline status={val} />
                      </TableCell>
                    );
                  }
                  if (col.key === "type") {
                    return (
                      <TableCell key={col.key}>
                        <Badge variant="outline">{val}</Badge>
                      </TableCell>
                    );
                  }
                  const isNumeric = ["leads", "deals", "revenue", "amount"].includes(col.key);
                  return (
                    <TableCell
                      key={col.key}
                      className={isNumeric ? "text-right tabular-nums font-medium" : col.key === "id" ? "font-mono text-xs" : ""}
                    >
                      {val}
                    </TableCell>
                  );
    });
  }
}

// ── Main Component ──
export default function Reporting() {
  const navigate = useNavigate();
  const [commissionRecords, setCommissionRecords] = useState<CommissionRecord[]>(initialCommissionRecords);
  const [manageOpen, setManageOpen] = useState(false);
  const [managedPartner, setManagedPartner] = useState<string | null>(null);

  const paidTotal = useMemo(
    () => commissionRecords.reduce((s, r) => s + r.paid, 0),
    [commissionRecords],
  );
  const pendingTotal = useMemo(
    () => commissionRecords.filter((r) => r.status === "Pending").reduce((s, r) => s + r.unpaid, 0),
    [commissionRecords],
  );

  const pendingForPartner: PendingCommission[] = useMemo(() => {
    if (!managedPartner) return [];
    return commissionRecords
      .filter((r) => r.partner === managedPartner && r.status === "Pending")
      .map((r) => ({ id: r.id, deal: r.deal, customer: r.customer, unpaid: r.unpaid }));
  }, [commissionRecords, managedPartner]);

  const handleMarkPaid = (ids: string[], paymentDate: Date) => {
    const iso = paymentDate.toISOString().slice(0, 10);
    setCommissionRecords((prev) =>
      prev.map((r) =>
        ids.includes(r.id) && r.status === "Pending"
          ? { ...r, paid: r.paid + r.unpaid, unpaid: 0, status: "Paid" as const, date: iso }
          : r,
      ),
    );
  };

  const openManage = (partner: string) => {
    setManagedPartner(partner);
    setManageOpen(true);
  };

  const goToDeals = (partner: string) => {
    navigate(`/app/admin/deals?partner=${encodeURIComponent(partner)}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        subtitle="Partner ecosystem finance and commission reporting"
      />

      <FinanceKpiBar paidOverrideUsd={paidTotal} estOverrideUsd={pendingTotal} />

      {/* Tabs for two reports */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Partner Performance</TabsTrigger>
          <TabsTrigger value="details">Transaction Details</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partner Performance Report</CardTitle>
              <CardDescription>Click a row to view deals or manage commission</CardDescription>
            </CardHeader>
            <CardContent>
              <FilterableTable
                data={partnerPerformance as unknown as Record<string, unknown>[]}
                allColumns={allSummaryColumns}
                rowMenu={(row) => {
                  const partner = String(row.partner ?? "");
                  return (
                    <>
                      <DropdownMenuItem onSelect={() => goToDeals(partner)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Show deals
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => openManage(partner)}>
                        <BadgeDollarSign className="mr-2 h-4 w-4" />
                        Manage commission
                      </DropdownMenuItem>
                    </>
                  );
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Details Report</CardTitle>
              <CardDescription>Individual lead and deal transactions across all partners</CardDescription>
            </CardHeader>
            <CardContent>
              <FilterableTable
                data={transactionDetails as unknown as Record<string, unknown>[]}
                allColumns={allDetailColumns}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ManageCommissionDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        partner={managedPartner}
        pending={pendingForPartner}
        onMarkPaid={handleMarkPaid}
      />
    </div>
  );
}
