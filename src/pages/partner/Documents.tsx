import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Download, FileText, FileSpreadsheet, Grid3X3, List, Presentation, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ViewMode = "grid" | "list";

function inferProduct(document: DocumentItem) {
  const source = `${document.fileName} ${document.description ?? ""} ${document.storageKey}`.toLowerCase();
  if (source.includes("rabbitqa")) return "RabbitQA";
  if (source.includes("platform")) return "Platform";
  return "General";
}

function formatUpdatedDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function getIconForType(type: string) {
  const normalized = type.trim().toLowerCase();
  if (normalized === "pdf" || normalized === "text" || normalized === "word") return FileText;
  if (normalized === "video") return Video;
  if (normalized === "powerpoint") return Presentation;
  if (normalized === "excel") return FileSpreadsheet;
  return FileText;
}

export default function PartnerDocuments() {
  const { token } = useAuth();
  const [rows, setRows] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");

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

  const onDownload = async (documentId: string) => {
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

  const availableTypes = useMemo(
    () => Array.from(new Set(rows.map((document) => getDocumentTypeLabel(document)))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const availableProducts = useMemo(
    () => Array.from(new Set(rows.map((document) => inferProduct(document)))).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((document) => {
      const type = getDocumentTypeLabel(document);
      const product = inferProduct(document);
      if (typeFilter !== "all" && type !== typeFilter) return false;
      if (productFilter !== "all" && product !== productFilter) return false;
      return true;
    });
  }, [rows, typeFilter, productFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Content Hub" subtitle="Access shared sales and marketing files" />

      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => window.location.reload()} /> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <EmptyState title="No content available" description="No shared collateral files are available yet." />
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {availableProducts.map((product) => (
                    <SelectItem key={product} value={product}>
                      {product}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1 rounded-md border p-0.5">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("grid")}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setView("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <EmptyState title="No matching content" description="Try changing filters to see more files." />
          ) : null}

          {filteredRows.length > 0 && view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredRows.map((document) => {
                const typeLabel = getDocumentTypeLabel(document);
                const Icon = getIconForType(typeLabel);
                return (
                  <Card key={document.id}>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="outline">{typeLabel}</Badge>
                      </div>
                      <h3 className="mb-1 text-sm font-medium">{document.fileName}</h3>
                      <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{document.description || "No description"}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDocumentSizeMb(document.fileSizeBytes)} · {formatUpdatedDate(document.updatedAt)}
                        </span>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onDownload(document.id)}>
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : null}

          {filteredRows.length > 0 && view === "list" ? (
            <Card>
              <CardContent className="divide-y p-0">
                {filteredRows.map((document) => {
                  const typeLabel = getDocumentTypeLabel(document);
                  const Icon = getIconForType(typeLabel);
                  return (
                    <div key={document.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{document.fileName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {typeLabel} · {formatDocumentSizeMb(document.fileSizeBytes)} · {formatUpdatedDate(document.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => onDownload(document.id)}>
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
