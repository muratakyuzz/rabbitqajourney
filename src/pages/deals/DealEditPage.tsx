import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Eye, MessageSquare, Package, Plus, Save, Sparkles, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DealQualificationCard,
  emptyDealQualification,
  type DealQualification,
} from "@/components/DealQualificationCard";
import { DealStagePicker } from "@/components/DealStagePicker";
import { DealNotesPanel } from "@/components/DealNotesPanel";
import { useAuth } from "@/lib/auth-context";
import { getLead, updateLead, type Lead } from "@/lib/deals-flow-adapter";
import { addDealHistoryEntry } from "@/lib/deal-history";
import {
  buildDealDescription,
  parseDealDescription,
  readProductsConfig,
  type DealContact,
  type DealStage,
  type ProductsConfigAddon,
  type ProductsConfigProduct,
} from "@/lib/deal-payload";
import { cn } from "@/lib/utils";

interface Props {
  role: "admin" | "partner";
}

interface ProductRow {
  uid: string;
  productId: string;
  packageId: string;
  addonIds: string[];
}

const SECTIONS = [
  { id: "account", label: "Account", icon: Building2 },
  { id: "contacts", label: "Contacts", icon: User },
  { id: "products", label: "Products", icon: Package },
  { id: "qualification", label: "Qualification", icon: Sparkles },
];

const newRowUid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `row-${Date.now()}-${Math.random()}`;

export default function DealEditPage({ role }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const basePath = `/app/${role}/deals`;

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("account");

  // Account
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  // Contacts
  const [contacts, setContacts] = useState<DealContact[]>([]);

  // Products
  const [products, setProducts] = useState<ProductsConfigProduct[]>([]);
  const [globalAddons, setGlobalAddons] = useState<ProductsConfigAddon[]>([]);
  const [rows, setRows] = useState<ProductRow[]>([]);

  // Qualification & Notes
  const [qualification, setQualification] = useState<DealQualification>(emptyDealQualification);
  const [stage, setStage] = useState<DealStage>("Identified");

  const activeProducts = useMemo(() => products.filter((p) => p.status === "active"), [products]);

  useEffect(() => {
    if (!token || !id) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getLead(token, id);
        const cfg = readProductsConfig();
        setProducts(cfg.products);
        setGlobalAddons(cfg.addons);
        setLead(data);

        // Partner permission
        if (role === "partner" && data.status !== "DRAFT" && data.status !== "REJECTED") {
          toast.info("Read-only — submitted deals cannot be edited");
          navigate(`${basePath}/${id}/view`, { replace: true });
          return;
        }

        const parsed = parseDealDescription(data.description ?? null);
        setCompanyName(data.title);
        setIndustry(parsed.industry);
        setEmployeeCount(parsed.employeeCount);
        setWebsite(parsed.website);
        setAddress(parsed.address);
        setCity(parsed.city);
        setCountry(parsed.country);
        setContacts(parsed.contacts);
        setStage(parsed.stage);

        const norm = (s: string) => s.trim().toLowerCase();
        const addonByName = new Map(cfg.addons.map((a) => [norm(a.name), a]));
        const initialRows: ProductRow[] = parsed.products.map((p) => {
          const product = cfg.products.find((x) => norm(x.name) === norm(p.productName));
          const pkg = product?.packages.find((x) => norm(x.name) === norm(p.packageName));
          const addonIds = p.addonNames.map((n) => addonByName.get(norm(n))?.id).filter((x): x is string => Boolean(x));
          return {
            uid: newRowUid(),
            productId: product?.id ?? "",
            packageId: pkg?.id ?? "",
            addonIds,
          };
        });
        setRows(initialRows.length > 0 ? initialRows : [{ uid: newRowUid(), productId: "", packageId: "", addonIds: [] }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load deal");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, id, role, navigate, basePath]);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isLoading]);

  const totalPrice = useMemo(() => {
    return rows.reduce((sum, r) => {
      const product = activeProducts.find((p) => p.id === r.productId);
      const pkg = product?.packages.find((p) => p.id === r.packageId);
      const addonsSum = r.addonIds.reduce((s, aid) => s + (globalAddons.find((a) => a.id === aid)?.price ?? 0), 0);
      return sum + (pkg?.price ?? 0) + addonsSum;
    }, 0);
  }, [rows, activeProducts, globalAddons]);

  const handleSave = async () => {
    if (!token || !id) return;
    if (!companyName.trim()) {
      toast.error("Company name is required");
      setActiveSection("account");
      return;
    }
    setIsSaving(true);
    try {
      const productsPayload = rows
        .map((r) => {
          const product = activeProducts.find((p) => p.id === r.productId);
          const pkg = product?.packages.find((p) => p.id === r.packageId);
          if (!product || !pkg) return null;
          return {
            productName: product.name,
            packageName: pkg.name,
            packagePrice: pkg.price,
            addons: r.addonIds
              .map((aid) => globalAddons.find((a) => a.id === aid))
              .filter((a): a is ProductsConfigAddon => Boolean(a))
              .map((a) => ({ name: a.name, price: a.price })),
          };
        })
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      const description = buildDealDescription({
        industry,
        employeeCount,
        website,
        address,
        city,
        country,
        stage,
        contacts,
        products: productsPayload,
        notes: "",
      });

      const firstAddons = productsPayload[0]?.addons.map((a) => a.name) ?? [];
      const firstPkg = productsPayload[0]?.packageName?.toLowerCase() ?? "";
      const packageType: "SMALL" | "MEDIUM" | "LARGE" = firstPkg.includes("small")
        ? "SMALL"
        : firstPkg.includes("large")
          ? "LARGE"
          : "MEDIUM";

      await updateLead(token, id, {
        title: companyName.trim(),
        description,
        packageType,
        addons: firstAddons,
      });
      const prevStage = parseDealDescription(lead?.description ?? null).stage;
      if (prevStage !== stage) {
        addDealHistoryEntry({
          dealId: id,
          type: "stage_changed",
          fromValue: prevStage,
          toValue: stage,
          actorId: user?.id ?? null,
          actorName: user?.email ?? "Unknown",
          actorRole: role,
        });
      }
      addDealHistoryEntry({
        dealId: id,
        type: "deal_updated",
        message: "Deal details updated",
        actorId: user?.id ?? null,
        actorName: user?.email ?? "Unknown",
        actorRole: role,
      });
      toast.success("Deal updated");
      navigate(`${basePath}/${id}/view`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error || !lead) return <ErrorState description={error ?? "Deal not found"} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-background/85 backdrop-blur border-b">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`${basePath}/${id}/view`)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Editing Deal</div>
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base font-semibold text-foreground truncate">{lead.title}</h1>
                <StatusBadge status={lead.status} />
                <DealStagePicker value={stage} onChange={setStage} size="sm" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`${basePath}/${id}/view`)}>
              <Eye className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="notes">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" /> Notes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </a>
              );
            })}
            <Separator className="my-3" />
            <div className="rounded-md border bg-card p-3">
              <div className="text-xs text-muted-foreground">Estimated total</div>
              <div className="text-xl font-semibold tabular-nums text-foreground">${totalPrice.toLocaleString()}</div>
            </div>
          </nav>
        </aside>

        {/* Sections */}
        <div className="space-y-6 min-w-0">
          {/* Account */}
          <section id="account" className="scroll-mt-24 rounded-lg border bg-card p-6 shadow-sm">
            <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Account" subtitle="Company information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company Name" required>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </Field>
              <Field label="Industry">
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
              </Field>
              <Field label="Employee Count">
                <Input value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} />
              </Field>
              <Field label="Website">
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
              </Field>
              <Field label="Address" className="md:col-span-2">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <Field label="City">
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </Field>
              <Field label="Country">
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Contacts */}
          <section id="contacts" className="scroll-mt-24 rounded-lg border bg-card p-6 shadow-sm">
            <SectionTitle icon={<User className="h-4 w-4" />} title="Contacts" subtitle="Account contacts" />
            <div className="space-y-3">
              {contacts.map((c, idx) => (
                <div key={c.id} className="rounded-md border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Contact #{idx + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setContacts((prev) => prev.filter((x) => x.id !== c.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="First name"
                      value={c.firstName}
                      onChange={(e) => setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, firstName: e.target.value } : x)))}
                    />
                    <Input
                      placeholder="Last name"
                      value={c.lastName}
                      onChange={(e) => setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, lastName: e.target.value } : x)))}
                    />
                    <Input
                      placeholder="Job title"
                      value={c.jobTitle}
                      onChange={(e) => setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, jobTitle: e.target.value } : x)))}
                    />
                    <Select
                      value={c.gender}
                      onValueChange={(v) =>
                        setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, gender: v as DealContact["gender"] } : x)))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Email"
                      value={c.email}
                      onChange={(e) => setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, email: e.target.value } : x)))}
                    />
                    <Input
                      placeholder="Mobile"
                      value={c.mobileNo}
                      onChange={(e) => setContacts((prev) => prev.map((x) => (x.id === c.id ? { ...x, mobileNo: e.target.value } : x)))}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  setContacts((prev) => [
                    ...prev,
                    {
                      id: newRowUid(),
                      jobTitle: "",
                      firstName: "",
                      lastName: "",
                      email: "",
                      mobileNo: "",
                      gender: "Other",
                    },
                  ])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add contact
              </Button>
            </div>
          </section>

          {/* Products */}
          <section id="products" className="scroll-mt-24 rounded-lg border bg-card p-6 shadow-sm">
            <SectionTitle icon={<Package className="h-4 w-4" />} title="Products" subtitle="Selected products and packages" />
            <div className="space-y-3">
              {rows.map((r) => {
                const usedElsewhere = new Set(rows.filter((x) => x.uid !== r.uid && x.productId).map((x) => x.productId));
                const available = activeProducts.filter((p) => p.id === r.productId || !usedElsewhere.has(p.id));
                const product = activeProducts.find((p) => p.id === r.productId);
                return (
                  <div key={r.uid} className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                        <Select
                          value={r.productId}
                          onValueChange={(v) =>
                            setRows((prev) => prev.map((x) => (x.uid === r.uid ? { ...x, productId: v, packageId: "", addonIds: [] } : x)))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {available.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={r.packageId}
                          onValueChange={(v) => setRows((prev) => prev.map((x) => (x.uid === r.uid ? { ...x, packageId: v } : x)))}
                          disabled={!product}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select package" />
                          </SelectTrigger>
                          <SelectContent>
                            {product?.packages.map((pk) => (
                              <SelectItem key={pk.id} value={pk.id}>
                                {pk.name} — ${pk.price.toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={rows.length === 1}
                        onClick={() => setRows((prev) => prev.filter((x) => x.uid !== r.uid))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {globalAddons.length > 0 ? (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Add-ons</div>
                        <div className="flex flex-wrap gap-2">
                          {globalAddons.map((a) => {
                            const checked = r.addonIds.includes(a.id);
                            return (
                              <label
                                key={a.id}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 cursor-pointer text-xs transition-colors",
                                  checked
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/40",
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() =>
                                    setRows((prev) =>
                                      prev.map((x) =>
                                        x.uid === r.uid
                                          ? {
                                              ...x,
                                              addonIds: checked ? x.addonIds.filter((i) => i !== a.id) : [...x.addonIds, a.id],
                                            }
                                          : x,
                                      ),
                                    )
                                  }
                                  className="h-3 w-3"
                                />
                                <span>{a.name}</span>
                                {a.price > 0 ? <span className="opacity-70">+${a.price}</span> : null}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setRows((prev) => [...prev, { uid: newRowUid(), productId: "", packageId: "", addonIds: [] }])}
              >
                <Plus className="h-4 w-4 mr-1" /> Add product
              </Button>
            </div>
          </section>

          {/* Qualification */}
          <section id="qualification" className="scroll-mt-24">
            <DealQualificationCard value={qualification} onChange={setQualification} />
          </section>

          {/* Footer save */}
          <div className="flex justify-end gap-2 pt-4 pb-12">
            <Button type="button" variant="outline" onClick={() => navigate(`${basePath}/${id}/view`)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
          </div>
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <DealNotesPanel dealId={id!} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        {subtitle ? <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
    </div>
  );
}