import { Fragment, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, GripVertical, Settings2, Users, Package, ClipboardList, ChevronDown, ChevronRight, X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  type PartnerTierConfig,
  type PartnerTypeConfig,
  type RebateConfig,
  type RebatePeriod,
  REBATE_PERIOD_OPTIONS,
  readPartnerConfigState,
  writePartnerConfigState,
} from "@/lib/partner-config-store";
import {
  createOnboardingStep,
  deleteOnboardingStep,
  getOnboardingConfig,
  type OnboardingStep,
  updateOnboardingConfig,
  updateOnboardingStep,
} from "@/lib/onboarding-config-api";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  BILLING_CYCLES, BILLING_CYCLE_LABELS, CURRENCIES, formatPrice, getCurrencySymbol,
  normalizeBillingCycle, normalizeCurrency,
  type BillingCycle, type CurrencyCode,
} from "@/lib/product-pricing";

// ─── Partner Config Types ────────────────────────────────────
type PartnerType = PartnerTypeConfig;
type PartnerTier = PartnerTierConfig;

// ─── Product Types ───────────────────────────────────────────
interface PackageMetric {
  id: string;
  label: string;
  value: string;
}

interface ProductPackage {
  id: string;
  name: string;
  price: number;
  description: string;
  metrics: PackageMetric[];
  addonsEnabled: boolean;
  availableAddonIds: string[];
  currency: CurrencyCode;
  billingCycle: BillingCycle;
}

interface GlobalAddon {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
}

interface Product {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive";
  packages: ProductPackage[];
  addonIds: string[];
}

function genId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

const PRODUCTS_CONFIG_STORAGE_KEY = "configure-products-v1";
const PRODUCTS_CONFIG_BASELINE_KEY = "configure-products-default-v1";

const initialProducts: Product[] = [
  {
    id: "p1",
    name: "RabbitQA",
    category: "SaaS",
    status: "active",
    packages: [
      {
        id: "pk1",
        name: "Small",
        price: 1800,
        description: "Ideal for small teams.",
        metrics: [
          { id: "m1", label: "Team Size", value: "5-10" },
          { id: "m2", label: "Requirements", value: "15" },
          { id: "m3", label: "PBI Generation", value: "40" },
          { id: "m4", label: "Analysis", value: "20" },
          { id: "m5", label: "Test Cases Generation", value: "200" },
          { id: "m6", label: "Test Automation", value: "80" },
          { id: "m7", label: "Test Run", value: "200" },
          { id: "m8", label: "Storage (GB)", value: "15" },
        ],
        addonsEnabled: true,
        availableAddonIds: ["ga1", "ga2", "ga3"],
        currency: "USD",
        billingCycle: "monthly",
      },
      {
        id: "pk2",
        name: "Medium",
        price: 4100,
        description: "Balanced package for growing organizations.",
        metrics: [
          { id: "m9", label: "Team Size", value: "10-20" },
          { id: "m10", label: "Requirements", value: "35" },
          { id: "m11", label: "PBI Generation", value: "90" },
          { id: "m12", label: "Analysis", value: "50" },
          { id: "m13", label: "Test Cases Generation", value: "450" },
          { id: "m14", label: "Test Automation", value: "180" },
          { id: "m15", label: "Test Run", value: "450" },
          { id: "m16", label: "Storage (GB)", value: "40" },
        ],
        addonsEnabled: true,
        availableAddonIds: ["ga1", "ga2", "ga3"],
        currency: "USD",
        billingCycle: "monthly",
      },
      {
        id: "pk3",
        name: "Large",
        price: 11000,
        description: "Enterprise package for large scale teams.",
        metrics: [
          { id: "m17", label: "Team Size", value: "20+" },
          { id: "m18", label: "Requirements", value: "100" },
          { id: "m19", label: "PBI Generation", value: "250" },
          { id: "m20", label: "Analysis", value: "150" },
          { id: "m21", label: "Test Cases Generation", value: "1200" },
          { id: "m22", label: "Test Automation", value: "500" },
          { id: "m23", label: "Test Run", value: "1200" },
          { id: "m24", label: "Storage (GB)", value: "120" },
        ],
        addonsEnabled: true,
        availableAddonIds: ["ga1", "ga2", "ga3"],
        currency: "USD",
        billingCycle: "monthly",
      },
    ],
    addonIds: ["ga1", "ga2", "ga3"],
  },
];

const initialGlobalAddons: GlobalAddon[] = [
  { id: "ga1", name: "Devicer", description: "Device testing bundle.", price: 0, currency: "USD", billingCycle: "monthly" },
  { id: "ga2", name: "Accessibility", description: "Accessibility coverage add-on.", price: 0, currency: "USD", billingCycle: "monthly" },
  { id: "ga3", name: "Healthcheck", description: "Continuous health monitoring add-on.", price: 0, currency: "USD", billingCycle: "monthly" },
];

function readProductsConfigFromStorage() {
  if (typeof window === "undefined") {
    return { products: initialProducts, globalAddons: initialGlobalAddons };
  }

  const raw = window.localStorage.getItem(PRODUCTS_CONFIG_STORAGE_KEY)
    ?? window.localStorage.getItem(PRODUCTS_CONFIG_BASELINE_KEY);
  if (!raw) {
    return { products: initialProducts, globalAddons: initialGlobalAddons };
  }

  try {
    const parsed = JSON.parse(raw) as { products?: Product[]; globalAddons?: GlobalAddon[] };
    const products = Array.isArray(parsed.products)
      ? parsed.products.map((p) => ({
          ...p,
          packages: (p.packages ?? []).map((pkg) => ({
            ...pkg,
            currency: normalizeCurrency(pkg.currency),
            billingCycle: normalizeBillingCycle(pkg.billingCycle),
          })),
        }))
      : initialProducts;
    const normalized = {
      products,
      globalAddons: Array.isArray(parsed.globalAddons)
        ? parsed.globalAddons.map((a) => ({
            ...a,
            currency: normalizeCurrency((a as Partial<GlobalAddon>).currency),
            billingCycle: normalizeBillingCycle((a as Partial<GlobalAddon>).billingCycle),
          }))
        : initialGlobalAddons,
    };
    if (typeof window !== "undefined" && !window.localStorage.getItem(PRODUCTS_CONFIG_BASELINE_KEY)) {
      window.localStorage.setItem(PRODUCTS_CONFIG_BASELINE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return { products: initialProducts, globalAddons: initialGlobalAddons };
  }
}

// ─── Reusable empty row ──────────────────────────────────────
function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center py-8 text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  );
}

// ─── Rebate sub-form ─────────────────────────────────────────
function RebateFields({
  rebate,
  onChange,
}: {
  rebate: RebateConfig;
  onChange: (next: RebateConfig) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <Checkbox
          id="rebate-enabled"
          checked={rebate.enabled}
          onCheckedChange={(c) => onChange({ ...rebate, enabled: c === true })}
          className="mt-0.5"
        />
        <div className="space-y-0.5 leading-tight">
          <Label htmlFor="rebate-enabled" className="cursor-pointer">Enable Rebate</Label>
          <p className="text-xs text-muted-foreground">Pay a periodic rebate based on a percentage rate.</p>
        </div>
      </div>
      {rebate.enabled ? (
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Period</Label>
            <Select
              value={rebate.period}
              onValueChange={(value) => onChange({ ...rebate, period: value as RebatePeriod })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REBATE_PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rate (%)</Label>
            <div className="relative">
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={Number.isFinite(rebate.percent) ? rebate.percent : 0}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  onChange({ ...rebate, percent: Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0 });
                }}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatRebateBadge(rebate?: RebateConfig | null) {
  if (!rebate?.enabled) return null;
  const label = REBATE_PERIOD_OPTIONS.find((o) => o.value === rebate.period)?.label ?? rebate.period;
  return `${rebate.percent}% / ${label}`;
}

// ═════════════════════════════════════════════════════════════
// TAB 1 — Onboarding Settings
// ═════════════════════════════════════════════════════════════
function OnboardingTab() {
  const { token } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OnboardingStep | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    if (!token) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const config = await getOnboardingConfig(token);
        setEnabled(config.enabled);
        setSteps(config.steps);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load onboarding settings");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const handleEnabledChange = async (checked: boolean) => {
    if (!token) return;
    const previous = enabled;
    setEnabled(checked);
    setIsSaving(true);
    try {
      await updateOnboardingConfig(token, { enabled: checked });
      toast({ title: checked ? "Onboarding enabled" : "Onboarding disabled" });
    } catch (err) {
      setEnabled(previous);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update onboarding status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "" });
    setDialogOpen(true);
  };

  const openEdit = (step: OnboardingStep) => {
    setEditing(step);
    setForm({ title: step.title, description: step.description });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!token || !form.title.trim() || !form.description.trim()) return;
    setIsSaving(true);
    try {
      if (editing) {
        const updated = await updateOnboardingStep(token, editing.id, {
          title: form.title,
          description: form.description,
        });
        setSteps((prev) => prev.map((s) => (s.id === editing.id ? updated : s)));
        toast({ title: "Step updated" });
      } else {
        const created = await createOnboardingStep(token, {
          title: form.title,
          description: form.description,
        });
        setSteps((prev) => [...prev, created].sort((a, b) => a.order - b.order));
        toast({ title: "Step added" });
      }
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save onboarding step",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    setIsSaving(true);
    try {
      await deleteOnboardingStep(token, id);
      const config = await getOnboardingConfig(token);
      setEnabled(config.enabled);
      setSteps(config.steps);
      toast({ title: "Step removed" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete onboarding step",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-base">Onboarding Flow</CardTitle>
            <CardDescription>Enable or disable the partner onboarding wizard.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="onb-toggle" className="text-sm text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch id="onb-toggle" checked={enabled} onCheckedChange={handleEnabledChange} disabled={!token || isLoading || isSaving} />
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* Steps table */}
      {enabled && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Onboarding Steps</CardTitle>
              <CardDescription>{steps.length} step{steps.length !== 1 && "s"} configured</CardDescription>
            </div>
            <Button size="sm" onClick={openAdd} disabled={!token || isLoading || isSaving}>
              <Plus className="h-4 w-4 mr-1" /> Add Step
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.length === 0 ? (
                  <EmptyRow cols={4} text="No onboarding steps yet." />
                ) : (
                  steps.map((step) => (
                    <TableRow key={step.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GripVertical className="h-3.5 w-3.5" />
                          <span className="font-mono text-xs">{step.order}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{step.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">
                        {step.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(step)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => void remove(step.id)} disabled={isSaving}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Step" : "Add Step"}</DialogTitle>
            <DialogDescription>Define the onboarding step details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Company Profile" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What happens in this step?" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={() => void save()} disabled={isSaving}>
              {isSaving ? "Saving..." : editing ? "Save Changes" : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TAB 2 — Partner Types & Tiers
// ═════════════════════════════════════════════════════════════
function PartnerConfigTab() {
  const initialConfig = readPartnerConfigState();
  const [partnerTypeEnabled, setPartnerTypeEnabled] = useState<boolean>(initialConfig.partnerTypeEnabled ?? true);
  const [partnerTierEnabled, setPartnerTierEnabled] = useState<boolean>(initialConfig.partnerTierEnabled ?? true);
  const [types, setTypes] = useState<PartnerType[]>(initialConfig.types);
  const [tiers, setTiers] = useState<PartnerTier[]>(initialConfig.tiers);

  // Type dialog
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<PartnerType | null>(null);
  const [typeForm, setTypeForm] = useState<{ name: string; description: string; tierEnabled: boolean; allowedTierIds: string[]; rebate: RebateConfig }>({
    name: "",
    description: "",
    tierEnabled: false,
    allowedTierIds: [],
    rebate: { enabled: false, period: "monthly", percent: 0 },
  });

  // Tier dialog
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PartnerTier | null>(null);
  const [tierForm, setTierForm] = useState<{ name: string; minRevenue: string; benefits: string; rebate: RebateConfig }>({
    name: "",
    minRevenue: "",
    benefits: "",
    rebate: { enabled: false, period: "monthly", percent: 0 },
  });

  const openAddType = () => {
    setEditingType(null);
    setTypeForm({ name: "", description: "", tierEnabled: false, allowedTierIds: [], rebate: { enabled: false, period: "monthly", percent: 0 } });
    setTypeDialogOpen(true);
  };
  const openEditType = (t: PartnerType) => {
    setEditingType(t);
    setTypeForm({
      name: t.name,
      description: t.description,
      tierEnabled: t.tierEnabled,
      allowedTierIds: t.allowedTierIds ?? [],
      rebate: { ...(t.rebate ?? { enabled: false, period: "monthly", percent: 0 }) },
    });
    setTypeDialogOpen(true);
  };
  const saveType = () => {
    if (!typeForm.name.trim()) return;
    const normalized = {
      ...typeForm,
      allowedTierIds: typeForm.tierEnabled ? typeForm.allowedTierIds : [],
    };
    if (editingType) {
      setTypes((p) => p.map((t) => (t.id === editingType.id ? { ...t, ...normalized } : t)));
    } else {
      setTypes((p) => [...p, { id: `pt${Date.now()}`, ...normalized }]);
    }
    setTypeDialogOpen(false);
    toast({ title: editingType ? "Type updated" : "Type added" });
  };
  const removeType = (id: string) => { setTypes((p) => p.filter((t) => t.id !== id)); toast({ title: "Type removed" }); };
  const toggleAllowedTier = (tierId: string, checked: boolean) => {
    setTypeForm((f) => ({
      ...f,
      allowedTierIds: checked
        ? Array.from(new Set([...f.allowedTierIds, tierId]))
        : f.allowedTierIds.filter((id) => id !== tierId),
    }));
  };

  const openAddTier = () => {
    setEditingTier(null);
    setTierForm({ name: "", minRevenue: "", benefits: "", rebate: { enabled: false, period: "monthly", percent: 0 } });
    setTierDialogOpen(true);
  };
  const openEditTier = (t: PartnerTier) => {
    setEditingTier(t);
    setTierForm({
      name: t.name,
      minRevenue: t.minRevenue,
      benefits: t.benefits,
      rebate: { ...(t.rebate ?? { enabled: false, period: "monthly", percent: 0 }) },
    });
    setTierDialogOpen(true);
  };
  const saveTier = () => {
    if (!tierForm.name.trim()) return;
    if (editingTier) {
      setTiers((p) => p.map((t) => (t.id === editingTier.id ? { ...t, ...tierForm } : t)));
    } else {
      setTiers((p) => [...p, { id: `tr${Date.now()}`, ...tierForm }]);
    }
    setTierDialogOpen(false);
    toast({ title: editingTier ? "Tier updated" : "Tier added" });
  };
  const removeTier = (id: string) => {
    setTiers((p) => p.filter((t) => t.id !== id));
    setTypes((p) => p.map((type) => ({ ...type, allowedTierIds: type.allowedTierIds.filter((tierId) => tierId !== id) })));
    toast({ title: "Tier removed" });
  };

  const hasTierEnabledType = types.some((t) => t.tierEnabled);
  const tierNameById = useMemo(() => Object.fromEntries(tiers.map((tier) => [tier.id, tier.name])), [tiers]);

  useEffect(() => {
    writePartnerConfigState({ partnerTypeEnabled, partnerTierEnabled, types, tiers });
  }, [partnerTierEnabled, partnerTypeEnabled, tiers, types]);

  useEffect(() => {
    if (!partnerTypeEnabled && partnerTierEnabled) {
      setPartnerTierEnabled(false);
    }
  }, [partnerTierEnabled, partnerTypeEnabled]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Partner Type</CardTitle>
            <CardDescription>Enable or disable partner type configuration.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">{partnerTypeEnabled ? "Enabled" : "Disabled"}</Label>
            <Switch
              checked={partnerTypeEnabled}
              onCheckedChange={(checked) => {
                setPartnerTypeEnabled(checked);
                if (!checked) {
                  setPartnerTierEnabled(false);
                }
              }}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Partner Types */}
      {partnerTypeEnabled ? <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Partner Types</CardTitle>
            <CardDescription>Define categories for your partners.</CardDescription>
          </div>
          <Button size="sm" onClick={openAddType}><Plus className="h-4 w-4 mr-1" /> Add Type</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Tier Enabled</TableHead>
                <TableHead>Allowed Tiers</TableHead>
                <TableHead>Rebate</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.length === 0 ? <EmptyRow cols={6} text="No partner types." /> : types.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{t.description}</TableCell>
                  <TableCell>
                    <Badge variant={t.tierEnabled ? "default" : "secondary"}>{t.tierEnabled ? "Yes" : "No"}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.tierEnabled ? (
                      t.allowedTierIds.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">None selected</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {t.allowedTierIds.map((id) => (
                            <Badge key={id} variant="outline" className="text-xs">
                              {tierNameById[id] ?? "Unknown"}
                            </Badge>
                          ))}
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {t.rebate?.enabled ? (
                      <Badge variant="outline" className="text-xs">{formatRebateBadge(t.rebate)}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditType(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeType(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card> : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Partner Tier</CardTitle>
            <CardDescription>Enable or disable partner tier configuration.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">{partnerTierEnabled ? "Enabled" : "Disabled"}</Label>
            <Switch
              checked={partnerTierEnabled}
              onCheckedChange={setPartnerTierEnabled}
              disabled={!partnerTypeEnabled}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Partner Tiers — only shown when at least one type has tiers enabled */}
      {partnerTypeEnabled && partnerTierEnabled && hasTierEnabledType && <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Partner Tiers</CardTitle>
            <CardDescription>Define performance tiers and their benefits.</CardDescription>
          </div>
          <Button size="sm" onClick={openAddTier}><Plus className="h-4 w-4 mr-1" /> Add Tier</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier</TableHead>
                <TableHead>Min Revenue</TableHead>
                <TableHead className="hidden md:table-cell">Benefits</TableHead>
                <TableHead>Rebate</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers.length === 0 ? <EmptyRow cols={5} text="No tiers defined." /> : tiers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-sm">{t.minRevenue}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-xs truncate">{t.benefits}</TableCell>
                  <TableCell>
                    {t.rebate?.enabled ? (
                      <Badge variant="outline" className="text-xs">{formatRebateBadge(t.rebate)}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTier(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTier(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>}

      {/* Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit Partner Type" : "Add Partner Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name</Label><Input value={typeForm.name} onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Reseller" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={typeForm.description} onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="flex items-center gap-3">
              <Switch
                checked={typeForm.tierEnabled}
                onCheckedChange={(checked) => setTypeForm((f) => ({ ...f, tierEnabled: checked, allowedTierIds: checked ? f.allowedTierIds : [] }))}
                disabled={!partnerTierEnabled}
              />
              <Label>Enable Tier System</Label>
            </div>
            {!partnerTierEnabled ? (
              <p className="text-xs text-muted-foreground">Partner Tier is globally disabled in Configure.</p>
            ) : null}
            {partnerTierEnabled && typeForm.tierEnabled && (
              <div className="space-y-2 rounded-md border p-3">
                <div className="space-y-0.5">
                  <Label>Allowed Tiers</Label>
                  <p className="text-xs text-muted-foreground">
                    Select which tiers can be assigned to partners of this type.
                  </p>
                </div>
                {tiers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No tiers defined yet. Add tiers below to enable selection.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {tiers.map((tier) => {
                      const checked = typeForm.allowedTierIds.includes(tier.id);
                      return (
                        <label
                          key={tier.id}
                          htmlFor={`type-tier-${tier.id}`}
                          className="flex items-start gap-2 cursor-pointer rounded-sm hover:bg-muted/50 p-1 -mx-1"
                        >
                          <Checkbox
                            id={`type-tier-${tier.id}`}
                            checked={checked}
                            onCheckedChange={(c) => toggleAllowedTier(tier.id, c === true)}
                            className="mt-0.5"
                          />
                          <div className="space-y-0.5 leading-tight">
                            <div className="text-sm font-medium">{tier.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {tier.minRevenue} · {tier.benefits}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <RebateFields rebate={typeForm.rebate} onChange={(r) => setTypeForm((f) => ({ ...f, rebate: r }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveType}>{editingType ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTier ? "Edit Partner Tier" : "Add Partner Tier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Tier Name</Label><Input value={tierForm.name} onChange={(e) => setTierForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Gold" /></div>
            <div className="space-y-2"><Label>Minimum Revenue</Label><Input value={tierForm.minRevenue} onChange={(e) => setTierForm((f) => ({ ...f, minRevenue: e.target.value }))} placeholder="e.g. $50,000" /></div>
            <div className="space-y-2"><Label>Benefits</Label><Textarea value={tierForm.benefits} onChange={(e) => setTierForm((f) => ({ ...f, benefits: e.target.value }))} rows={2} /></div>
            <RebateFields rebate={tierForm.rebate} onChange={(r) => setTierForm((f) => ({ ...f, rebate: r }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTier}>{editingTier ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// TAB 3 — Products
// ═════════════════════════════════════════════════════════════
function ProductsTab() {
  const [products, setProducts] = useState<Product[]>(() => readProductsConfigFromStorage().products);
  const [globalAddons, setGlobalAddons] = useState<GlobalAddon[]>(() => readProductsConfigFromStorage().globalAddons);
  const addonById = useMemo(() => Object.fromEntries(globalAddons.map((a) => [a.id, a])), [globalAddons]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activePackageTab, setActivePackageTab] = useState<string>("");

  const [form, setForm] = useState<{
    name: string;
    category: string;
    status: "active" | "inactive";
    packages: ProductPackage[];
    addonIds: string[];
  }>({ name: "", category: "", status: "active", packages: [], addonIds: [] });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", category: "", status: "active", packages: [], addonIds: [] });
    setActivePackageTab("");
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      category: product.category,
      status: product.status,
      packages: product.packages.map((pkg) => ({
        ...pkg,
        metrics: pkg.metrics.map((metric) => ({ ...metric })),
        availableAddonIds: [...pkg.availableAddonIds],
      })),
      addonIds: [...product.addonIds],
    });
    setActivePackageTab(product.packages[0]?.id ?? "");
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }

    const cleanedPackages: ProductPackage[] = form.packages
      .filter((pkg) => pkg.name.trim())
      .map((pkg) => ({
        ...pkg,
        name: pkg.name.trim(),
        price: Number(pkg.price) || 0,
        description: pkg.description.trim(),
        metrics: pkg.metrics.filter((metric) => metric.label.trim() || metric.value.trim()),
        availableAddonIds: pkg.availableAddonIds.filter((id) => form.addonIds.includes(id)),
      }));

    if (editing) {
      setProducts(
        products.map((product) =>
          product.id === editing.id
            ? {
                ...product,
                name: form.name.trim(),
                category: form.category.trim(),
                status: form.status,
                packages: cleanedPackages,
                addonIds: form.addonIds,
              }
            : product,
        ),
      );
    } else {
      setProducts([
        ...products,
        {
          id: genId("p"),
          name: form.name.trim(),
          category: form.category.trim(),
          status: form.status,
          packages: cleanedPackages,
          addonIds: form.addonIds,
        },
      ]);
    }

    setDialogOpen(false);
    toast({ title: editing ? "Product updated" : "Product added" });
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id));
    toast({ title: "Product removed" });
  };

  const toggleStatus = (id: string) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, status: product.status === "active" ? "inactive" : "active" } : product)));
  };

  const addPackageRow = () =>
    setForm((current) => {
      const newPackage: ProductPackage = {
        id: genId("pk"),
        name: "",
        price: 0,
        description: "",
        metrics: [],
        addonsEnabled: false,
        availableAddonIds: [],
        currency: "USD",
        billingCycle: "monthly",
      };
      setActivePackageTab(newPackage.id);
      return {
        ...current,
        packages: [...current.packages, newPackage],
      };
    });

  const updatePackage = (id: string, patch: Partial<ProductPackage>) =>
    setForm((current) => ({
      ...current,
      packages: current.packages.map((pkg) => (pkg.id === id ? { ...pkg, ...patch } : pkg)),
    }));

  const removePackage = (id: string) =>
    setForm((current) => {
      const nextPackages = current.packages.filter((pkg) => pkg.id !== id);
      if (activePackageTab === id) {
        setActivePackageTab(nextPackages[0]?.id ?? "");
      }
      return { ...current, packages: nextPackages };
    });

  const addMetric = (pkgId: string) =>
    updatePackage(pkgId, {
      metrics: [
        ...(form.packages.find((pkg) => pkg.id === pkgId)?.metrics ?? []),
        { id: genId("m"), label: "", value: "" },
      ],
    });

  const updateMetric = (pkgId: string, metricId: string, patch: Partial<PackageMetric>) => {
    const pkg = form.packages.find((item) => item.id === pkgId);
    if (!pkg) {
      return;
    }
    updatePackage(pkgId, {
      metrics: pkg.metrics.map((metric) => (metric.id === metricId ? { ...metric, ...patch } : metric)),
    });
  };

  const removeMetric = (pkgId: string, metricId: string) => {
    const pkg = form.packages.find((item) => item.id === pkgId);
    if (!pkg) {
      return;
    }
    updatePackage(pkgId, {
      metrics: pkg.metrics.filter((metric) => metric.id !== metricId),
    });
  };

  const togglePackageAddon = (pkgId: string, addonId: string) => {
    const pkg = form.packages.find((item) => item.id === pkgId);
    if (!pkg) {
      return;
    }
    const next = pkg.availableAddonIds.includes(addonId)
      ? pkg.availableAddonIds.filter((id) => id !== addonId)
      : [...pkg.availableAddonIds, addonId];
    updatePackage(pkgId, { availableAddonIds: next });
  };

  const toggleProductAddon = (addonId: string) => {
    setForm((current) => {
      const exists = current.addonIds.includes(addonId);
      const addonIds = exists ? current.addonIds.filter((id) => id !== addonId) : [...current.addonIds, addonId];
      const packages = exists
        ? current.packages.map((pkg) => ({
            ...pkg,
            availableAddonIds: pkg.availableAddonIds.filter((id) => id !== addonId),
          }))
        : current.packages;
      return { ...current, addonIds, packages };
    });
  };

  const saveAddon = (payload: { id?: string; name: string; description: string; price: number; currency: CurrencyCode; billingCycle: BillingCycle }) => {
    if (payload.id) {
      setGlobalAddons(
        globalAddons.map((addon) => (addon.id === payload.id ? { ...addon, name: payload.name, description: payload.description, price: payload.price, currency: payload.currency, billingCycle: payload.billingCycle } : addon)),
      );
      toast({ title: "Add-on updated" });
      return;
    }

    setGlobalAddons([...globalAddons, { id: genId("ga"), name: payload.name, description: payload.description, price: payload.price, currency: payload.currency, billingCycle: payload.billingCycle }]);
    toast({ title: "Add-on added" });
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      PRODUCTS_CONFIG_STORAGE_KEY,
      JSON.stringify({ products, globalAddons }),
    );
    window.localStorage.setItem(
      PRODUCTS_CONFIG_BASELINE_KEY,
      JSON.stringify({ products, globalAddons }),
    );
  }, [globalAddons, products]);

  const removeAddon = (addonId: string) => {
    setGlobalAddons(globalAddons.filter((addon) => addon.id !== addonId));
    setProducts(
      products.map((product) => ({
        ...product,
        addonIds: product.addonIds.filter((id) => id !== addonId),
        packages: product.packages.map((pkg) => ({
          ...pkg,
          availableAddonIds: pkg.availableAddonIds.filter((id) => id !== addonId),
        })),
      })),
    );
    setForm((current) => ({
      ...current,
      addonIds: current.addonIds.filter((id) => id !== addonId),
      packages: current.packages.map((pkg) => ({
        ...pkg,
        availableAddonIds: pkg.availableAddonIds.filter((id) => id !== addonId),
      })),
    }));
    toast({ title: "Add-on removed", description: "Removed from all products & packages that referenced it." });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Products</CardTitle>
            <CardDescription>Manage products, packages and add-ons available for lead submissions.</CardDescription>
          </div>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Packages</TableHead>
                <TableHead>Add-ons</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <EmptyRow cols={7} text="No products configured." />
              ) : (
                products.map((product) => {
                  const isOpen = expanded === product.id;
                  return (
                    <Fragment key={product.id}>
                      <TableRow className="cursor-pointer" onClick={() => setExpanded(isOpen ? null : product.id)}>
                        <TableCell>{isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{product.category || "—"}</TableCell>
                        <TableCell className="text-sm">{product.packages.length}</TableCell>
                        <TableCell className="text-sm">{product.addonIds.length}</TableCell>
                        <TableCell>
                          <Badge
                            variant={product.status === "active" ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleStatus(product.id);
                            }}
                          >
                            {product.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeProduct(product.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isOpen ? (
                        <TableRow key={`${product.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell colSpan={6} className="py-4">
                            <div className="space-y-4">
                              <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Packages</div>
                                {product.packages.length === 0 ? (
                                  <p className="text-sm italic text-muted-foreground">No packages.</p>
                                ) : (
                                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {product.packages.map((pkg) => (
                                      <div key={pkg.id} className="space-y-1.5 rounded-lg border bg-background p-3">
                                        <div className="flex items-baseline justify-between gap-2">
                                          <span className="text-sm font-semibold text-foreground">{pkg.name}</span>
                                          <span className="text-sm font-medium text-foreground">{formatPrice(pkg.price, pkg.currency, pkg.billingCycle)}</span>
                                        </div>
                                        {pkg.description ? <p className="text-xs leading-snug text-muted-foreground">{pkg.description}</p> : null}
                                        {pkg.metrics.length > 0 ? (
                                          <div className="text-xs text-muted-foreground">{pkg.metrics.map((metric) => `${metric.label}: ${metric.value}`).join(" · ")}</div>
                                        ) : null}
                                        <div className="text-xs">
                                          {pkg.addonsEnabled ? (
                                            <span className="text-primary">Add-ons enabled · {pkg.availableAddonIds.length}</span>
                                          ) : (
                                            <span className="text-muted-foreground">Add-ons disabled</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available Add-ons</div>
                                {product.addonIds.length === 0 ? (
                                  <p className="text-sm italic text-muted-foreground">No add-ons.</p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {product.addonIds.map((id) => {
                                      const addon = addonById[id];
                                      if (!addon) {
                                        return null;
                                      }
                                      return (
                                        <span key={id} className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs">
                                          {addon.name}
                                          <span className="ml-1.5 text-muted-foreground">{formatPrice(addon.price, addon.currency, addon.billingCycle)}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <GlobalAddonsSection addons={globalAddons} onSave={saveAddon} onDelete={removeAddon} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
            <DialogDescription>Configure product details, packages, and available add-ons.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Cloud Suite Pro" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="e.g. SaaS" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.status === "active"} onCheckedChange={(checked) => setForm((current) => ({ ...current, status: checked ? "active" : "inactive" }))} />
              <Label>Active</Label>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <div>
                <Label>Available Add-ons for this Product</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Select globally-defined add-ons for this product. Packages can enable a subset of these.
                </p>
              </div>
              {globalAddons.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">No global add-ons defined yet. Add some below first.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 pt-1 md:grid-cols-2">
                  {globalAddons.map((addon) => {
                    const checked = form.addonIds.includes(addon.id);
                    return (
                      <label key={addon.id} className="flex cursor-pointer items-start gap-2 rounded-md border bg-background p-2 hover:bg-muted/30">
                        <Checkbox checked={checked} onCheckedChange={() => toggleProductAddon(addon.id)} className="mt-0.5" />
                        <div className="min-w-0 flex-1 space-y-0.5 leading-tight">
                          <div className="flex items-baseline justify-between gap-2 text-sm font-medium">
                            <span className="truncate">{addon.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{formatPrice(addon.price, addon.currency, addon.billingCycle)}</span>
                          </div>
                          {addon.description ? <div className="truncate text-xs text-muted-foreground">{addon.description}</div> : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Packages</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addPackageRow} className="h-7 px-2 text-primary hover:text-primary">
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add package
                </Button>
              </div>
              {form.packages.length === 0 ? (
                <p className="px-1 text-sm italic text-muted-foreground">No packages yet.</p>
              ) : (
                <Tabs
                  value={activePackageTab || form.packages[0]?.id}
                  onValueChange={setActivePackageTab}
                  className="space-y-3"
                >
                  <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto bg-muted/40 p-1">
                    {form.packages.map((pkg, index) => (
                      <TabsTrigger key={pkg.id} value={pkg.id} className="whitespace-nowrap">
                        {pkg.name.trim() || `Package ${index + 1}`}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {form.packages.map((pkg) => (
                    <TabsContent key={pkg.id} value={pkg.id}>
                      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
                        <div className="flex items-start gap-2">
                          <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-4">
                            <Input className="md:col-span-2" placeholder="Package name (e.g. Small)" value={pkg.name} onChange={(event) => updatePackage(pkg.id, { name: event.target.value })} />
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {getCurrencySymbol(pkg.currency)}
                              </span>
                              <Input
                                type="number"
                                className="pl-9"
                                placeholder="Price"
                                value={pkg.price || ""}
                                onChange={(event) => updatePackage(pkg.id, { price: Number(event.target.value) })}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Select
                                value={pkg.currency}
                                onValueChange={(value) => updatePackage(pkg.id, { currency: normalizeCurrency(value) })}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {CURRENCIES.map((code) => (
                                    <SelectItem key={code} value={code}>{code}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={pkg.billingCycle}
                                onValueChange={(value) => updatePackage(pkg.id, { billingCycle: normalizeBillingCycle(value) })}
                              >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {BILLING_CYCLES.map((cycle) => (
                                    <SelectItem key={cycle} value={cycle}>{BILLING_CYCLE_LABELS[cycle]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removePackage(pkg.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          rows={2}
                          placeholder="Description (e.g. Ideal for small teams up to 10 people.)"
                          value={pkg.description}
                          onChange={(event) => updatePackage(pkg.id, { description: event.target.value })}
                        />

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">Metrics / Specs</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => addMetric(pkg.id)} className="h-6 px-2 text-xs text-primary hover:text-primary">
                              <Plus className="mr-1 h-3 w-3" /> Add metric
                            </Button>
                          </div>
                          {pkg.metrics.length === 0 ? (
                            <p className="text-xs italic text-muted-foreground">No metrics.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {pkg.metrics.map((metric) => (
                                <div key={metric.id} className="flex items-center gap-2">
                                  <Input className="h-8 text-sm" placeholder="Label (e.g. Team Size)" value={metric.label} onChange={(event) => updateMetric(pkg.id, metric.id, { label: event.target.value })} />
                                  <Input className="h-8 text-sm" placeholder="Value (e.g. 5-10)" value={metric.value} onChange={(event) => updateMetric(pkg.id, metric.id, { value: event.target.value })} />
                                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeMetric(pkg.id, metric.id)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 border-t pt-3">
                          <div className="flex items-center gap-2">
                            <Switch checked={pkg.addonsEnabled} onCheckedChange={(checked) => updatePackage(pkg.id, { addonsEnabled: checked })} />
                            <Label className="text-sm">Enable add-ons for this package</Label>
                          </div>
                          {pkg.addonsEnabled ? (
                            form.addonIds.length === 0 ? (
                              <p className="text-xs italic text-muted-foreground">Select product-level add-ons above to make them selectable here.</p>
                            ) : (
                              <div className="grid grid-cols-1 gap-1.5 pl-1 md:grid-cols-2">
                                {form.addonIds.map((id) => {
                                  const addon = addonById[id];
                                  if (!addon) {
                                    return null;
                                  }
                                  return (
                                    <label key={id} className="flex cursor-pointer items-center gap-2 text-sm">
                                      <Checkbox checked={pkg.availableAddonIds.includes(id)} onCheckedChange={() => togglePackageAddon(pkg.id, id)} />
                                      <span className="truncate">{addon.name}</span>
                                      <span className="ml-auto text-xs text-muted-foreground">{formatPrice(addon.price, addon.currency, addon.billingCycle)}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )
                          ) : (
                            <p className="pl-1 text-xs text-muted-foreground">Add-ons are disabled for this package.</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GlobalAddonsSection({
  addons,
  onSave,
  onDelete,
}: {
  addons: GlobalAddon[];
  onSave: (payload: { id?: string; name: string; description: string; price: number; currency: CurrencyCode; billingCycle: BillingCycle }) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GlobalAddon | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; price: string; currency: CurrencyCode; billingCycle: BillingCycle }>({ name: "", description: "", price: "", currency: "USD", billingCycle: "monthly" });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", currency: "USD", billingCycle: "monthly" });
    setOpen(true);
  };

  const openEdit = (addon: GlobalAddon) => {
    setEditing(addon);
    setForm({ name: addon.name, description: addon.description, price: String(addon.price), currency: normalizeCurrency(addon.currency), billingCycle: normalizeBillingCycle(addon.billingCycle) });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast({ title: "Add-on name is required", variant: "destructive" });
      return;
    }
    const price = Number(form.price.replace(/[^0-9.]/g, "")) || 0;
    onSave({ id: editing?.id, name: form.name.trim(), description: form.description.trim(), price, currency: form.currency, billingCycle: form.billingCycle });
    setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Add-ons</CardTitle>
          <CardDescription>Globally reusable add-ons. Assign per product and per package.</CardDescription>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Add-on
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.length === 0 ? (
              <EmptyRow cols={4} text="No add-ons defined." />
            ) : (
              addons.map((addon) => (
                <TableRow key={addon.id}>
                  <TableCell className="font-medium">{addon.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{addon.description || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{formatPrice(addon.price, addon.currency, addon.billingCycle)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(addon)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(addon.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Add-on" : "Add Add-on"}</DialogTitle>
            <DialogDescription>Define a globally reusable add-on.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. HealthCheck" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What this add-on does" />
            </div>
            <div className="space-y-2">
              <Label>Price</Label>
              <Input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(value) => setForm((current) => ({ ...current, currency: value as CurrencyCode }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>{getCurrencySymbol(code)} {code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={form.billingCycle} onValueChange={(value) => setForm((current) => ({ ...current, billingCycle: value as BillingCycle }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BILLING_CYCLES.map((cycle) => (
                      <SelectItem key={cycle} value={cycle}>{BILLING_CYCLE_LABELS[cycle]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function Configure() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configure"
        subtitle="Manage platform settings, onboarding, partner configuration, and products."
      />

      <Tabs defaultValue="onboarding" className="space-y-6">
        <TabsList className="bg-muted/60 backdrop-blur-sm">
          <TabsTrigger value="onboarding" className="gap-1.5">
            <ClipboardList className="h-4 w-4" /> Onboarding
          </TabsTrigger>
          <TabsTrigger value="partners" className="gap-1.5">
            <Users className="h-4 w-4" /> Partner Types & Tiers
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-1.5">
            <Package className="h-4 w-4" /> Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding"><OnboardingTab /></TabsContent>
        <TabsContent value="partners"><PartnerConfigTab /></TabsContent>
        <TabsContent value="products"><ProductsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
