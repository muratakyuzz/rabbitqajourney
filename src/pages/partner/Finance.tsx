import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CircleDollarSign,
  Clock3,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const commissionData = [
  { deal: "D-003", customer: "InnoSoft SRL", revenue: 24000, commission: 4800, status: "Paid" as const, date: "2024-03-15" },
  { deal: "D-001", customer: "TechCorp GmbH", revenue: 48000, commission: 9600, status: "Pending" as const, date: "2024-04-15" },
  { deal: "D-004", customer: "NovaCloud BV", revenue: 36000, commission: 7200, status: "Paid" as const, date: "2024-04-28" },
  { deal: "D-002", customer: "SecureNet Ltd", revenue: 72000, commission: 14400, status: "Processing" as const, date: "2024-05-01" },
  { deal: "D-005", customer: "AtlasWare Inc", revenue: 18000, commission: 3600, status: "Pending" as const, date: "2024-05-10" },
];

const statusStyles: Record<string, string> = {
  Paid: "bg-success/12 text-success border-success/25",
  Pending: "bg-warning/12 text-warning border-warning/25",
  Processing: "bg-info/12 text-info border-info/25",
};

export default function PartnerFinance() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Paid" | "Pending" | "Processing">("ALL");

  const totalEarnings = useMemo(
    () => commissionData.filter((c) => c.status === "Paid").reduce((sum, c) => sum + c.commission, 0),
    [],
  );
  const pendingCommissions = useMemo(
    () => commissionData.filter((c) => c.status !== "Paid").reduce((sum, c) => sum + c.commission, 0),
    [],
  );
  const totalRevenue = useMemo(() => commissionData.reduce((sum, c) => sum + c.revenue, 0), []);
  const statusCounts = useMemo(
    () => ({
      ALL: commissionData.length,
      Paid: commissionData.filter((row) => row.status === "Paid").length,
      Pending: commissionData.filter((row) => row.status === "Pending").length,
      Processing: commissionData.filter((row) => row.status === "Processing").length,
    }),
    [],
  );
  const filteredRows = useMemo(
    () => commissionData.filter((row) => statusFilter === "ALL" || row.status === statusFilter),
    [statusFilter],
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Finance" subtitle="Payout overview, commission health, and detailed transaction timeline" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Pipeline Value</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">€{totalRevenue.toLocaleString()}</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-info/12 text-info">
                <Wallet className="h-4.5 w-4.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total Earnings</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">€{totalEarnings.toLocaleString()}</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
                <CircleDollarSign className="h-4.5 w-4.5" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Pending Commissions</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">€{pendingCommissions.toLocaleString()}</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-warning/12 text-warning">
                <Clock3 className="h-4.5 w-4.5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/70 bg-gradient-to-r from-muted/50 via-background to-background pb-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-lg">Commission History</CardTitle>
                <CardDescription>Filter payout records by status and review detailed transaction history.</CardDescription>
              </div>
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <TabsList className="h-auto bg-muted/80 p-1">
                  {(["ALL", "Paid", "Pending", "Processing"] as const).map((status) => (
                    <TabsTrigger key={status} value={status} className="rounded-md px-3 py-1.5 text-xs">
                      {status}
                      <span className="ml-1.5 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {statusCounts[status]}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[88px] text-[11px] uppercase tracking-[0.08em]">Deal</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.08em]">Customer</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.08em]">Revenue</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.08em]">Commission</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.08em]">Status</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-[0.08em]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow
                      key={row.deal}
                      className="border-b border-border/70 odd:bg-muted/[0.20] hover:bg-primary/[0.05] hover:shadow-[inset_3px_0_0_hsl(var(--primary))]"
                    >
                      <TableCell className="font-semibold text-foreground">{row.deal}</TableCell>
                      <TableCell className="text-foreground">{row.customer}</TableCell>
                      <TableCell className="font-medium text-foreground">€{row.revenue.toLocaleString()}</TableCell>
                      <TableCell className="font-semibold text-foreground">€{row.commission.toLocaleString()}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            statusStyles[row.status],
                          )}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">{row.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
