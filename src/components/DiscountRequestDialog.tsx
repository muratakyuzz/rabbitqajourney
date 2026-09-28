import { useMemo, useState } from "react";
import { Percent, DollarSign, Send, Tag } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatAmount } from "@/lib/product-pricing";
import { cn } from "@/lib/utils";

export interface DiscountRequestItem {
  productName: string;
  packageName: string;
  addonNames: string[];
  total: number;
  currency: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: DiscountRequestItem[];
  dealId: string;
}

type Mode = "rate" | "amount";

export function DiscountRequestDialog({ open, onOpenChange, items, dealId }: Props) {
  const currency = items[0]?.currency ?? "USD";
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items]);

  const [mode, setMode] = useState<Mode>("rate");
  const [rate, setRate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const discountValue = useMemo(() => {
    if (mode === "rate") {
      const r = Number(rate);
      if (!Number.isFinite(r) || r <= 0) return 0;
      return Math.min(subtotal, (subtotal * r) / 100);
    }
    const a = Number(amount);
    if (!Number.isFinite(a) || a <= 0) return 0;
    return Math.min(subtotal, a);
  }, [mode, rate, amount, subtotal]);

  const finalTotal = Math.max(0, subtotal - discountValue);
  const effectiveRate = subtotal > 0 ? (discountValue / subtotal) * 100 : 0;

  const canSubmit = discountValue > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // Frontend-only: simulate sending for Partner Admin approval.
      await new Promise((r) => setTimeout(r, 400));
      toast.success("Discount request sent for Partner Admin approval");
      onOpenChange(false);
      setRate("");
      setAmount("");
      setNote("");
      setMode("rate");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            Request Discount
          </DialogTitle>
          <DialogDescription>
            Review selected products and submit a discount request for Partner Admin approval.
          </DialogDescription>
        </DialogHeader>

        {/* Items list */}
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Selected items</div>
          <div className="rounded-md border divide-y">
            {items.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No products selected.</div>
            ) : (
              items.map((i, idx) => (
                <div key={idx} className="p-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground text-sm">{i.productName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Package · {i.packageName}</div>
                    {i.addonNames.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {i.addonNames.map((a) => (
                          <span key={a} className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px]">
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0 tabular-nums text-sm font-medium">
                    {formatAmount(i.total, i.currency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Separator />

        {/* Mode selector */}
        <div className="space-y-3">
          <Label>Discount type</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("rate")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                mode === "rate"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-input text-muted-foreground hover:bg-accent"
              )}
            >
              <Percent className="h-4 w-4" /> Rate (%)
            </button>
            <button
              type="button"
              onClick={() => setMode("amount")}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                mode === "amount"
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-input text-muted-foreground hover:bg-accent"
              )}
            >
              <DollarSign className="h-4 w-4" /> Amount ({currency})
            </button>
          </div>

          {mode === "rate" ? (
            <div className="space-y-1.5">
              <Label htmlFor="discount-rate">Discount rate</Label>
              <div className="relative">
                <Input
                  id="discount-rate"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="e.g. 10"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="discount-amount">Discount amount</Label>
              <div className="relative">
                <Input
                  id="discount-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currency}</span>
              </div>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <Label htmlFor="discount-note">Note (optional)</Label>
          <Textarea
            id="discount-note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason or context for the discount request"
          />
        </div>

        {/* Summary */}
        <div className="rounded-md border bg-muted/40 p-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatAmount(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Discount {effectiveRate > 0 ? `(${effectiveRate.toFixed(1)}%)` : ""}</span>
            <span className="tabular-nums text-destructive">
              −{formatAmount(discountValue, currency)}
            </span>
          </div>
          <Separator className="my-1.5" />
          <div className="flex justify-between font-semibold text-foreground">
            <span>Final total</span>
            <span className="tabular-nums">{formatAmount(finalTotal, currency)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            <Send className="h-4 w-4 mr-1" />
            Send for Approval
          </Button>
        </DialogFooter>

        <div className="text-[11px] text-muted-foreground text-center">
          Deal {dealId} · Request will be routed to Partner Admin
        </div>
      </DialogContent>
    </Dialog>
  );
}