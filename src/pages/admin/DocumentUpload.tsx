import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { FormSection } from "@/components/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { uploadDocumentViaProxy } from "@/lib/documents-api";

type UploadStep = "idle" | "uploading-file";

export default function AdminDocumentUpload() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<UploadStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const isSubmitting = step !== "idle";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
    if (nextFile && !fileName.trim()) {
      setFileName(nextFile.name);
    }
    setError(null);
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError("Session expired. Please log in again.");
      return;
    }

    if (!selectedFile) {
      setError("Please choose a file to upload.");
      return;
    }

    if (!fileName.trim()) {
      setError("Please enter a file name.");
      return;
    }

    setError(null);
    setStep("uploading-file");

    try {
      await uploadDocumentViaProxy(token, selectedFile, {
        fileName: fileName.trim(),
        description: description.trim() || undefined,
      });

      toast.success("Collateral uploaded");
      navigate("/app/admin/documents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload document");
      toast.error(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setStep("idle");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button onClick={() => navigate("/app/admin/documents")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Content Hub
      </button>
      <PageHeader title="Upload Collateral" subtitle="Upload a shared file for all partners" />

      <form onSubmit={onSubmit}>
        <FormSection title="Collateral Upload" description="Choose a file and upload it to shared collateral storage.">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document-name">File Name</Label>
              <Input
                id="document-name"
                value={fileName}
                disabled={isSubmitting}
                onChange={(event) => {
                  setFileName(event.target.value);
                  if (error) {
                    setError(null);
                  }
                }}
                placeholder="Enter display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-description">Description</Label>
              <Textarea
                id="document-description"
                value={description}
                disabled={isSubmitting}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Enter description (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document-file">File</Label>
              <Input id="document-file" type="file" disabled={isSubmitting} onChange={handleFileChange} />
            </div>

            {selectedFile ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFile.type || "Unknown type"} {selectedFile.size ? `| ${Math.max(1, Math.round(selectedFile.size / 1024))} KB` : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No file selected yet.</p>
            )}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            {isSubmitting ? (
              <p className="text-sm text-muted-foreground">
                {step === "uploading-file" ? "Uploading file..." : "Preparing upload..."}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !selectedFile || !fileName.trim()}>
              <Upload className="h-4 w-4 mr-1" />
              {isSubmitting ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}
