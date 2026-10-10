import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRq } from "@/lib/rabbitqa/store";
import { todayISO } from "@rabbitqa/shared/domain/labels";
import type { AlertView } from "@rabbitqa/shared/domain/alerts";

/** Uyarı erteleme / kapatma — gerekçe zorunlu. */
export function AlertActionDialog({ alert, mode, onClose }: { alert: AlertView; mode: "snooze" | "close"; onClose: () => void }) {
  const { snoozeAlert, closeAlert } = useRq();
  const [reason, setReason] = useState("");
  const [until, setUntil] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); });
  const submit = () => {
    if (!reason.trim()) return toast.error("Gerekçe zorunlu");
    const err = mode === "snooze" ? snoozeAlert(alert.key, until, reason) : closeAlert(alert.key, reason);
    if (err) return toast.error(err);
    toast.success(mode === "snooze" ? "Uyarı ertelendi" : "Uyarı kapatıldı");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mode === "snooze" ? "Uyarıyı ertele" : "Uyarıyı kapat"}</DialogTitle></DialogHeader>
        <p className="text-sm font-medium">{alert.title}</p>
        <div className="grid gap-3">
          {mode === "snooze" && (
            <div className="grid gap-2"><Label>Şu tarihe kadar ertele</Label><Input type="date" min={todayISO()} value={until} onChange={(e) => setUntil(e.target.value)} /></div>
          )}
          <div className="grid gap-2"><Label>Gerekçe (zorunlu)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          {mode === "close" && <p className="text-xs text-muted-foreground">Kapatılan uyarı, koşulu sürse de tekrar açılmaz.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Vazgeç</Button>
          <Button onClick={submit} disabled={!reason.trim()}>{mode === "snooze" ? "Ertele" : "Kapat"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
