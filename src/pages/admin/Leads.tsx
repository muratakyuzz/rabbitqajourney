import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { listLeads, type Lead, type LeadStatus } from "@/lib/leads-api";
import { exportLeadsToXlsx } from "@/lib/leads-export";
import { useAuth } from "@/lib/auth-context";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ExcelIcon } from "@/components/icons/ExcelIcon";

const allStatuses: ("ALL" | LeadStatus)[] = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];
const PRODUCTS_CONFIG_STORAGE_KEY = "configure-products-v1";
const PRODUCTS_CONFIG_BASELINE_KEY = "configure-products-default-v1";

interface ProductPackage {
  id: string;
  name: string;
  price: number;
}

interface Product {
  id: string;
  name: string;
  status: "active" | "inactive";
  packages: ProductPackage[];
}

interface GlobalAddon {
  id: string;
  name: string;
  price: number;
}

interface ParsedLeadProduct {
  productName: string;
  packageName: string;
  packagePrice: number | null;
  addonItems: Array<{ name: string; price: number | null }>;
}

const initialProducts: Product[] = [
  {
    id: "p1",
    name: "RabbitQA",
    status: "active",
    packages: [
      { id: "pk1", name: "Small", price: 1800 },
      { id: "pk2", name: "Medium", price: 4100 },
      { id: "pk3", name: "Large", price: 11000 },
    ],
  },
];

const initialGlobalAddons: GlobalAddon[] = [
  { id: "ga1", name: "Devicer", price: 0 },
  { id: "ga2", name: "Accessibility", price: 0 },
  { id: "ga3", name: "Healthcheck", price: 0 },
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
    return {
      products: Array.isArray(parsed.products) ? parsed.products : initialProducts,
      globalAddons: Array.isArray(parsed.globalAddons) ? parsed.globalAddons : initialGlobalAddons,
    };
  } catch {
    return { products: initialProducts, globalAddons: initialGlobalAddons };
  }
}

function mapPackageNameToLegacyPackageType(name?: string): Lead["packageType"] {
  if (!name) {
    return "MEDIUM";
  }
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("small")) {
    return "SMALL";
  }
  if (normalized.includes("large")) {
    return "LARGE";
  }
  return "MEDIUM";
}

function parseLeadProducts(description: string | null | undefined): ParsedLeadProduct[] {
  if (!description) {
    return [];
  }

  const lines = description.split("\n");
  const productsStart = lines.findIndex((line) => line.trim() === "Products:");
  if (productsStart < 0) {
    return [];
  }

  const notesStart = lines.findIndex((line) => line.trim() === "Notes:");
  const productLines = lines.slice(productsStart + 1, notesStart >= 0 ? notesStart : lines.length);

  return productLines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.toLowerCase() !== "no products")
    .map((line) => {
      const normalized = line.replace(/^\d+\.\s*/, "");
      const match = normalized.match(/^(.*?)\s*\|\s*(.*?)\s*(?:\|\s*Price:\s*([0-9]+(?:\.[0-9]+)?))?\s*\|\s*Add-ons:\s*(.*)$/i);
      if (!match) {
        return null;
      }

      const packagePriceRaw = match[3]?.trim();
      const packagePriceCandidate = packagePriceRaw ? Number(packagePriceRaw) : Number.NaN;
      const packagePrice = Number.isFinite(packagePriceCandidate) ? packagePriceCandidate : null;

      const addonPart = match[4].trim();
      const addonItems = addonPart && addonPart.toLowerCase() !== "none"
        ? addonPart
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((entry) => {
              const addonMatch = entry.match(/^(.*?)\s*\(([-+]?[0-9]+(?:\.[0-9]+)?)\)\s*$/);
              if (!addonMatch) {
                return { name: entry, price: null };
              }
              return {
                name: addonMatch[1].trim(),
                price: Number(addonMatch[2]),
              };
            })
        : [];

      return {
        productName: match[1].trim(),
        packageName: match[2].trim(),
        packagePrice,
        addonItems,
      } satisfies ParsedLeadProduct;
    })
    .filter((entry): entry is ParsedLeadProduct => Boolean(entry));
}

function computeLeadCommercials(lead: Lead, products: Product[], globalAddons: GlobalAddon[]) {
  const activeProducts = products.filter((product) => product.status === "active");
  const normalize = (value: string) => value.trim().toLowerCase();
  const addonPriceByName = new Map(globalAddons.map((addon) => [normalize(addon.name), addon.price]));
  const parsedProducts = parseLeadProducts(lead.description);

  if (parsedProducts.length > 0) {
    const productNames: string[] = [];
    let totalPrice = 0;

    for (const row of parsedProducts) {
      const product = activeProducts.find((item) => normalize(item.name) === normalize(row.productName));
      if (!product) {
        continue;
      }
      productNames.push(product.name);

      const selectedPackage = product.packages.find((item) => normalize(item.name) === normalize(row.packageName));
      if (row.packagePrice !== null) {
        totalPrice += row.packagePrice;
      } else if (selectedPackage) {
        totalPrice += selectedPackage.price;
      }

      for (const addon of row.addonItems) {
        if (addon.price !== null) {
          totalPrice += addon.price;
          continue;
        }
        totalPrice += addonPriceByName.get(normalize(addon.name)) ?? 0;
      }
    }

    const uniqueProductNames = Array.from(new Set(productNames));
    return {
      productLabel: uniqueProductNames.length > 0 ? uniqueProductNames.join(", ") : "—",
      totalPrice: uniqueProductNames.length > 0 ? totalPrice : null,
    };
  }

  const fallbackProduct = activeProducts[0];
  if (!fallbackProduct) {
    return { productLabel: "—", totalPrice: null };
  }

  const selectedPackage = fallbackProduct.packages.find(
    (pkg) => mapPackageNameToLegacyPackageType(pkg.name) === lead.packageType,
  );

  const addonsTotal = lead.addons.reduce((sum, addonName) => sum + (addonPriceByName.get(normalize(addonName)) ?? 0), 0);
  const packagePrice = selectedPackage?.price ?? 0;

  return {
    productLabel: fallbackProduct.name,
    totalPrice: packagePrice + addonsTotal,
  };
}

export default function AdminLeads() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rows, setRows] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productsConfig, setProductsConfig] = useState(() => readProductsConfigFromStorage());

  useEffect(() => {
    setProductsConfig(readProductsConfigFromStorage());
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listLeads(token, filter === "ALL" ? undefined : { status: filter as LeadStatus });
        setRows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leads");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, filter]);

  const rowNumberById = useMemo(() => {
    return new Map(rows.map((lead, index) => [lead.id, index + 1]));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((lead) => {
      return [lead.title, lead.status, lead.partnerName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search]);

  const hasActiveFilters = filter !== "ALL" || search.trim().length > 0;
  const countText =
    search.trim().length > 0
      ? `${filteredRows.length} ${filteredRows.length === 1 ? "lead" : "leads"} found`
      : `${rows.length} ${rows.length === 1 ? "lead" : "leads"} total`;

  const columns: Column<Lead>[] = [
    {
      key: "id",
      header: "ID",
      render: (lead) => <span className="text-sm font-semibold text-muted-foreground">{rowNumberById.get(lead.id) ?? "—"}</span>,
      className: "w-16",
    },
    {
      key: "companyName",
      header: "Company Name",
      render: (lead) => <p className="font-medium text-foreground">{lead.title}</p>,
    },
    {
      key: "partner",
      header: "Partner",
      render: (lead) => <span className="text-sm text-muted-foreground">{lead.partnerName ?? lead.partnerId}</span>,
    },
    { key: "status", header: "Status", render: (lead) => <StatusBadge status={lead.status} /> },
    {
      key: "lastUpdated",
      header: "Last Updated",
      render: (lead) => <span className="text-xs text-muted-foreground">{new Date(lead.updatedAt).toLocaleDateString()}</span>,
    },
    {
      key: "createdDate",
      header: "Created Date",
      render: (lead) => <span className="text-xs text-muted-foreground">{new Date(lead.createdAt).toLocaleDateString()}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle="Review and manage partner-submitted leads"
        action={{ label: "New Lead", onClick: () => navigate("/app/admin/leads/new"), icon: <Plus className="h-4 w-4" /> }}
      />

      {isLoading ? <LoadingState /> : null}
      {error ? <ErrorState description={error} onRetry={() => window.location.reload()} /> : null}
      {!isLoading && !error && rows.length === 0 ? (
        <EmptyState
          title="No leads"
          description="Create a lead on behalf of a partner to start the review pipeline."
          action={{ label: "New Lead", onClick: () => navigate("/app/admin/leads/new") }}
        />
      ) : null}

      {!isLoading && !error && rows.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search company name..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
              {hasActiveFilters ? (
                <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Filtered</span>
              ) : null}

              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setFilter("ALL");
                }}
                disabled={!hasActiveFilters}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-muted-foreground">{countText}</div>
            <Button
              type="button"
              onClick={() => exportLeadsToXlsx(filteredRows, "admin-leads")}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <ExcelIcon className="h-4 w-4" />
              Excel Export
            </Button>
          </div>

          <DataTable data={filteredRows} columns={columns} onRowClick={(lead) => navigate(`/app/admin/leads/${lead.id}`)} />
        </div>
      ) : null}
    </div>
  );
}
