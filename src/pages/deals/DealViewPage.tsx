import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  DollarSign,
  Mail,
  Package,
  Pencil,
  Phone,
  Sparkles,
  Tag,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { StatusBadge } from "@/components/StatusBadge";
import { DealQualificationCard, emptyDealQualification } from "@/components/DealQualificationCard";
import { DealStagePicker } from "@/components/DealStagePicker";
import { DealHistoryTimeline } from "@/components/DealHistoryTimeline";
import { addDealHistoryEntry } from "@/lib/deal-history";
import { DealNotesPanel } from "@/components/DealNotesPanel";
import { DiscountRequestDialog } from "@/components/DiscountRequestDialog";
import { useAuth } from "@/lib/auth-context";
import { approveLead, getLead, rejectLead, type Lead } from "@/lib/deals-flow-adapter";
import { buildDealDescription, parseDealDescription, readProductsConfig, type DealStage } from "@/lib/deal-payload";
import { BILLING_CYCLE_LABELS, formatAmount, formatPrice, normalizeBillingCycle, normalizeCurrency } from "@/lib/product-pricing";
import { updateLead } from "@/lib/deals-flow-adapter";
import { cn } from "@/lib/utils";

interface Props {
  role: "admin" | "partner";
}

export default function DealViewPage({ role }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const basePath = `/app/${role}/deals`;

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [stage, setStage] = useState<DealStage>("Identified");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [discountOpen, setDiscountOpen] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getLead(token, id);
        setLead(data);
        setRejectionReason(data.rejectionReason ?? "");
        const p = parseDealDescription(data.description ?? null);
        setStage(p.stage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deal");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, id]);

  const parsed = useMemo(() => parseDealDescription(lead?.description ?? null), [lead?.description]);
  const config = useMemo(() => readProductsConfig(), []);

  const handleStageChange = async (next: DealStage) => {
    if (!token || !id || !lead) return;
    const previous = stage;
    if (previous === next) return;
    setStage(next);
    try {
      const description = buildDealDescription({
        industry: parsed.industry,
        employeeCount: parsed.employeeCount,
        website: parsed.website,
        address: parsed.address,
        city: parsed.city,
        country: parsed.country,
        stage: next,
        contacts: parsed.contacts,
        products: parsed.products.map((p) => ({
          productName: p.productName,
          packageName: p.packageName,
          packagePrice: p.packagePrice,
          currency: p.currency,
          billingCycle: p.billingCycle,
          addons: p.addonNames.map((n) => ({ name: n, price: 0 })),
        })),
        notes: parsed.notes,
      });
      await updateLead(token, id, { title: lead.title, description });
      addDealHistoryEntry({
        dealId: id,
        type: "stage_changed",
        fromValue: previous,
        toValue: next,
        actorId: user?.id ?? null,
        actorName: user?.email ?? "Unknown",
        actorRole: role,
      });
      setHistoryVersion((v) => v + 1);
      if (next === "Won") toast.success("Deal won — congratulations! 🎉");
      else toast.success(`Stage updated to ${next}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    }
  };

  const productSummaries = useMemo(() => {
    const norm = (s: string) => s.trim().toLowerCase();
    const addonByName = new Map(config.addons.map((a) => [norm(a.name), a]));
    return parsed.products.map((p) => {
      const product = config.products.find((x) => norm(x.name) === norm(p.productName));
      const pkg = product?.packages.find((x) => norm(x.name) === norm(p.packageName));
      const pkgPrice = p.packagePrice ?? pkg?.price ?? 0;
      const currency = normalizeCurrency(p.currency || pkg?.currency);
      const billingCycle = normalizeBillingCycle(p.billingCycle || pkg?.billingCycle);
      const addonsTotal = p.addonNames.reduce((sum, n) => sum + (addonByName.get(norm(n))?.price ?? 0), 0);
      return {
        productName: p.productName,
        packageName: p.packageName,
        addonNames: p.addonNames,
        currency,
        billingCycle,
        unitPrice: pkgPrice,
        total: pkgPrice + addonsTotal,
      };
    });
  }, [parsed.products, config]);

  const totalPrice = productSummaries.reduce((sum, p) => sum + p.total, 0);
  const primaryCurrency = productSummaries[0]?.currency ?? "USD";

  const canEdit = role === "admin" || lead?.status === "DRAFT" || lead?.status === "REJECTED";
  const canDecide = role === "admin" && lead?.status === "SUBMITTED";

  const onApprove = async () => {
    if (!token || !id) return;
    setIsActing(true);
    try {
      await approveLead(token, id);
      toast.success("Deal approved");
      addDealHistoryEntry({
        dealId: id,
        type: "approved",
        toValue: "APPROVED",
        actorId: user?.id ?? null,
        actorName: user?.email ?? "Admin",
        actorRole: role,
      });
      setHistoryVersion((v) => v + 1);
      const updated = await getLead(token, id);
      setLead(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsActing(false);
    }
  };

  const onReject = async () => {
    if (!token || !id) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setIsActing(true);
    try {
      await rejectLead(token, id, rejectionReason.trim());
      toast.success("Deal rejected");
      addDealHistoryEntry({
        dealId: id,
        type: "rejected",
        toValue: "REJECTED",
        message: rejectionReason.trim(),
        actorId: user?.id ?? null,
        actorName: user?.email ?? "Admin",
        actorRole: role,
      });
      setHistoryVersion((v) => v + 1);
      const updated = await getLead(token, id);
      setLead(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error || !lead) return <ErrorState description={error ?? "Deal not found"} onRetry={() => window.location.reload()} />;

  const primaryContact = parsed.contacts[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate(basePath)} className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Deals
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{lead.title}</h1>
            <StatusBadge status={lead.status} />
            <DealStagePicker value={stage} onChange={handleStageChange} disabled={!canEdit} />
          </div>
          <div className="text-sm text-muted-foreground">
            {lead.partnerName ?? lead.partnerId} · Created {new Date(lead.createdAt).toLocaleDateString()} · Updated{" "}
            {new Date(lead.updatedAt).toLocaleDateString()}
          </div>
        </div>
        {canEdit ? (
          <Button type="button" onClick={() => navigate(`${basePath}/${lead.id}/edit`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit Deal
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile icon={<DollarSign className="h-4 w-4" />} label="Total Price" value={formatAmount(totalPrice, primaryCurrency)} />
        <KpiTile icon={<Package className="h-4 w-4" />} label="Products" value={String(productSummaries.length)} />
        <KpiTile icon={<Tag className="h-4 w-4" />} label="Add-ons" value={String(productSummaries.reduce((s, p) => s + p.addonNames.length, 0))} />
        <KpiTile icon={<User className="h-4 w-4" />} label="Contacts" value={String(parsed.contacts.length)} />
      </div>

      {/* Account + Primary contact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard icon={<Building2 className="h-4 w-4" />} title="Account">
          <DefList
            items={[
              { label: "Company", value: lead.title },
              { label: "Industry", value: parsed.industry || "—" },
              { label: "Employees", value: parsed.employeeCount || "—" },
              { label: "Website", value: parsed.website || "—" },
              { label: "Address", value: parsed.address || "—" },
              { label: "Location", value: [parsed.city, parsed.country].filter(Boolean).join(", ") || "—" },
            ]}
          />
        </SectionCard>

        <SectionCard icon={<User className="h-4 w-4" />} title="Primary Contact">
          {primaryContact ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center font-semibold">
                  {(primaryContact.firstName[0] ?? "") + (primaryContact.lastName[0] ?? "")}
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {primaryContact.firstName} {primaryContact.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">{primaryContact.jobTitle || "—"}</div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> <span className="text-foreground">{primaryContact.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> <span className="text-foreground">{primaryContact.mobileNo || "—"}</span>
                </div>
              </div>
              {parsed.contacts.length > 1 ? (
                <div className="text-xs text-muted-foreground">+{parsed.contacts.length - 1} more contact(s)</div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contacts.</p>
          )}
        </SectionCard>
      </div>

      {/* Products */}
      <SectionCard
        icon={<Package className="h-4 w-4" />}
        title="Products & Packages"
        action={
          productSummaries.length > 0 ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setDiscountOpen(true)}>
              <Tag className="h-4 w-4 mr-1" /> Ask Discount
            </Button>
          ) : null
        }
      >
        {productSummaries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products selected.</p>
        ) : (
          <div className="space-y-2">
            {productSummaries.map((p, i) => (
              <div key={i} className="flex items-start justify-between gap-4 rounded-md border bg-background/40 p-3">
                <div className="min-w-0">
                  <div className="font-medium text-foreground">{p.productName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Package · {p.packageName} · {BILLING_CYCLE_LABELS[p.billingCycle]} · {p.currency}
                  </div>
                  {p.addonNames.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.addonNames.map((a) => {
                        const addonCfg = config.addons.find((x) => x.name.trim().toLowerCase() === a.trim().toLowerCase());
                        return (
                          <span key={a} className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs">
                            {a}
                            {addonCfg && addonCfg.price > 0 ? (
                              <span className="text-foreground/70 font-medium">· {formatPrice(addonCfg.price, addonCfg.currency, addonCfg.billingCycle)}</span>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-semibold text-foreground tabular-nums">{formatAmount(p.total, p.currency)}</div>
                  <div className="text-[11px] text-muted-foreground">{formatPrice(p.unitPrice, p.currency, p.billingCycle)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <DiscountRequestDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        dealId={lead.id}
        items={productSummaries.map((p) => ({
          productName: p.productName,
          packageName: p.packageName,
          addonNames: p.addonNames,
          total: p.total,
          currency: p.currency,
        }))}
      />

      {/* Qualification */}
      <DealQualificationCard value={emptyDealQualification} onChange={() => {}} disabled />

      {/* Decision panel (admin only) */}
      {canDecide ? (
        <SectionCard icon={<CheckCircle className="h-4 w-4" />} title="Decision">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                rows={3}
                placeholder="Provide reason if rejecting"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => void onApprove()} className="bg-success hover:bg-success/90 text-success-foreground" disabled={isActing}>
                <CheckCircle className="h-4 w-4 mr-1" /> Approve Deal
              </Button>
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => void onReject()}
                disabled={isActing}
              >
                <XCircle className="h-4 w-4 mr-1" /> Reject Deal
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : null}
        </TabsContent>
        <TabsContent value="notes" className="space-y-4">
          <DealNotesPanel dealId={lead.id} readOnly={!canEdit} />
        </TabsContent>
        <TabsContent value="history" className="space-y-4">
          <SectionCard icon={<Sparkles className="h-4 w-4" />} title="Deal History">
            <DealHistoryTimeline dealId={lead.id} refreshKey={historyVersion} />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KpiTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground tabular-nums">{value}</div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function DefList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dt>
          <dd className={cn("mt-0.5 text-foreground", item.value === "—" && "text-muted-foreground")}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}