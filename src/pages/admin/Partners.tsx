import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { deletePartner, listPartners, type Partner } from "@/lib/partners-api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export default function AdminPartners() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rows, setRows] = useState<Partner[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: Column<Partner>[] = [
    {
      key: "name",
      header: "Partner",
      render: (p) => (
        <div>
          <p className="font-medium text-foreground">{p.name}</p>
          <p className="text-xs text-muted-foreground">{p.id}</p>
        </div>
      ),
    },
    { key: "partnerType", header: "Partner Type", render: (p) => <span className="text-sm">{p.partnerType ?? "-"}</span> },
    {
      key: "onboarding",
      header: "Onboarding",
      render: (p) => {
        if (p.onboardingEnabled === false) {
          return <span className="text-sm text-muted-foreground">N/A</span>;
        }

        if (p.onboardingCompleted) {
          return <span className="text-sm font-medium text-success">Complated</span>;
        }

        return <span className="text-sm font-medium text-foreground">{p.onboardingCompletionPercent ?? 0}%</span>;
      },
    },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "date",
      header: "Joined",
      render: (p) => <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "w-16",
      render: (partner) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(partner);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (!token) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listPartners(token);
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load partners");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;

    setIsDeleting(true);
    try {
      await deletePartner(token, deleteTarget.id);
      setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
      toast.success("Partner deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Partner could not be deleted. You can deactivate this partner instead.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partners"
        subtitle="Manage your partner organizations"
        action={{ label: "Add Partner", onClick: () => navigate("/app/admin/partners/new"), icon: <Plus className="h-4 w-4" /> }}
      />

      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => window.location.reload()} /> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <EmptyState title="No partners" description="Create your first partner to get started." action={{ label: "Add Partner", onClick: () => navigate("/app/admin/partners/new") }} />
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search partners..."
          searchKey={(p) => `${p.name} ${p.partnerType ?? ""} ${p.partnerTier ?? ""}`}
          showCountLabel
          countLabel="partner"
          onRowClick={(p) => navigate(`/app/admin/partners/${p.id}`)}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        title="Delete Partner"
        description={`Delete "${deleteTarget?.name}"? This is a soft delete and will hide the partner from lists. If related users, leads, or deals exist, deletion will be blocked.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
