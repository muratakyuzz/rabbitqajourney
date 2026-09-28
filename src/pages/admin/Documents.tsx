import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Plus, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  deleteDocument,
  formatDocumentSizeMb,
  getDocumentDownloadMetadata,
  getDocumentTypeLabel,
  isPartnerScopedStorageKey,
  listDocuments,
  type DocumentItem,
} from "@/lib/documents-api";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

export default function AdminDocuments() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rows, setRows] = useState<DocumentItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listDocuments(token);
        setRows(data.filter((document) => !isPartnerScopedStorageKey(document.storageKey)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const triggerDownload = async (documentId: string) => {
    if (!token) return;
    try {
      const metadata = await getDocumentDownloadMetadata(token, documentId);
      if (metadata.downloadUrl) {
        window.open(metadata.downloadUrl, "_blank", "noopener,noreferrer");
        toast.success("Download opened");
        return;
      }

      toast.success(`Download metadata ready: ${metadata.storageKey}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to access download metadata");
    }
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteDocument(token, deleteTarget.id);
      setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
      toast.success("Document deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<DocumentItem>[] = [
    {
      key: "name",
      header: "File Name",
      render: (document) => <p className="font-medium text-foreground">{document.fileName}</p>,
    },
    { key: "description", header: "Description", render: (document) => <span className="text-sm text-muted-foreground">{document.description || "—"}</span> },
    {
      key: "type",
      header: "Type",
      render: (document) => <span className="text-xs text-muted-foreground">{getDocumentTypeLabel(document)}</span>,
    },
    {
      key: "size",
      header: "Size",
      render: (document) => <span className="text-xs text-muted-foreground">{formatDocumentSizeMb(document.fileSizeBytes)}</span>,
    },
    { key: "date", header: "Date", render: (document) => <span className="text-xs text-muted-foreground">{new Date(document.createdAt).toLocaleDateString()}</span> },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (document) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(event) => {
              event.stopPropagation();
              triggerDownload(document.id);
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              setDeleteTarget(document);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Hub"
        subtitle="Manage shared document metadata and storage references"
        action={{ label: "Upload Document", onClick: () => navigate("/app/admin/documents/upload"), icon: <Plus className="h-4 w-4" /> }}
      />

      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => window.location.reload()} /> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <EmptyState
          title="No collateral uploaded"
          description="Upload shared collateral files that all partners can access."
          action={{ label: "Upload Document", onClick: () => navigate("/app/admin/documents/upload") }}
        />
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <DataTable
          data={rows}
          columns={columns}
          searchPlaceholder="Search collateral..."
          searchKey={(document) => `${document.fileName} ${document.description ?? ""}`}
          showCountLabel
          countLabel="collateral file"
        />
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Collateral File"
        description={`Are you sure you want to delete "${deleteTarget?.fileName}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </div>
  );
}
