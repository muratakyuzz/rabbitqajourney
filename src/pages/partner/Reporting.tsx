import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { listLeads, type Lead, type LeadStatus } from "@/lib/leads-api";
import { useAuth } from "@/lib/auth-context";

const leadStatuses: ("ALL" | LeadStatus)[] = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];
const packageOptions: ("ALL" | Lead["packageType"])[] = ["ALL", "SMALL", "MEDIUM", "LARGE"];

const commissionMap: Record<Lead["packageType"], number> = {
  SMALL: 2400,
  MEDIUM: 5600,
  LARGE: 10400,
};

export default function PartnerReporting() {
  const { token } = useAuth();
  const [rows, setRows] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState<"ALL" | LeadStatus>("ALL");
  const [packageFilter, setPackageFilter] = useState<"ALL" | Lead["packageType"]>("ALL");

  useEffect(() => {
    if (!token) return;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listLeads(token);
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reporting data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const filteredRows = useMemo(() => {
    return rows.filter((lead) => {
      if (leadFilter !== "ALL" && lead.status !== leadFilter) return false;
      if (packageFilter !== "ALL" && lead.packageType !== packageFilter) return false;
      return true;
    });
  }, [rows, leadFilter, packageFilter]);

  const totalLeadCount = filteredRows.length;
  const totalCommission = filteredRows.reduce((sum, lead) => sum + commissionMap[lead.packageType], 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Reporting" subtitle="Partner reporting dashboard" />

      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => window.location.reload()} /> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <EmptyState title="No reporting data" description="Create leads to see reporting dashboard values." />
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={leadFilter} onValueChange={(value) => setLeadFilter(value as "ALL" | LeadStatus)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                {leadStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "ALL" ? "All Statuses" : status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={packageFilter} onValueChange={(value) => setPackageFilter(value as "ALL" | Lead["packageType"])}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Package filter" />
              </SelectTrigger>
              <SelectContent>
                {packageOptions.map((pkg) => (
                  <SelectItem key={pkg} value={pkg}>
                    {pkg === "ALL" ? "All Packages" : pkg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Total Lead Count</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{totalLeadCount}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Commision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">€{totalCommission.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-2">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100/80">
                  <TableHead>Lead</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Commision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.title}</TableCell>
                    <TableCell>{lead.packageType}</TableCell>
                    <TableCell>{lead.status}</TableCell>
                    <TableCell>€{commissionMap[lead.packageType].toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
