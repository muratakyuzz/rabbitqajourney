import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PendingCommission {
  id: string;
  deal: string;
  customer: string;
  unpaid: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: string | null;
  pending: PendingCommission[];
  onMarkPaid: (ids: string[], paymentDate: Date) => void;
}

export function ManageCommissionDialog({ open, onOpenChange, partner, pending, onMarkPaid }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setPaymentDate(new Date());
    }
  }, [open, partner]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allChecked = pending.length > 0 && selected.size === pending.length;
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(pending.map((p) => p.id)));
  };

  const total = useMemo(
    () => pending.filter((p) => selected.has(p.id)).reduce((s, p) => s + p.unpaid, 0),
    [pending, selected],
  );

  const handleMarkPaid = () => {
    onMarkPaid(Array.from(selected), paymentDate);
    toast({
      title: "Commissions marked as paid",
      description: `${selected.size} record${selected.size === 1 ? "" : "s"} updated for ${partner ?? ""}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage commission</DialogTitle>
          <DialogDescription>{partner ?? ""}</DialogDescription>
        </DialogHeader>

        {pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No pending commission for this partner.
          </div>
        ) : (
          <div className="rounded-lg border border-border/70">
            <div className="flex items-center gap-3 border-b border-border/70 bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Select all" />
              <div className="flex-1">Deal / Customer</div>
              <div className="w-28 text-right">Unpaid</div>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
              {pending.map((row) => {
                const checked = selected.has(row.id);
                return (
                  <label
                    key={row.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40",
                      checked && "bg-primary/5",
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(row.id)} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{row.deal}</div>
                      <div className="text-xs text-muted-foreground truncate">{row.customer}</div>
                    </div>
                    <div className="w-28 text-right font-medium tabular-nums">
                      ${row.unpaid.toLocaleString()}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Payment date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !paymentDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(d) => d && setPaymentDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Selected total</label>
            <div className="flex h-10 items-center justify-end rounded-md border border-border/70 bg-muted/30 px-3 text-lg font-semibold tabular-nums text-foreground">
              ${total.toLocaleString()}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMarkPaid} disabled={selected.size === 0 || pending.length === 0}>
            Mark as paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}