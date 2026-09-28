// Shared helpers for parsing & building the Deal description payload used by
// Lead / Deal pages. Mirrors the inline logic in DealDetail / DealNew.

export interface DealContact {
  id: string;
  jobTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  gender: "Male" | "Female" | "Other";
}

export interface ParsedDealProduct {
  productName: string;
  packageName: string;
  packagePrice: number | null;
  currency: string;
  billingCycle: string;
  addonNames: string[];
}

export interface ParsedDealDescription {
  industry: string;
  employeeCount: string;
  website: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  stage: DealStage;
  contacts: DealContact[];
  products: ParsedDealProduct[];
}

export const DEAL_STAGES = [
  "Identified",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const emptyParsedDescription = (): ParsedDealDescription => ({
  industry: "",
  employeeCount: "",
  website: "",
  address: "",
  city: "",
  country: "",
  notes: "",
  stage: "Identified",
  contacts: [],
  products: [],
});

export function parseDealDescription(description: string | null): ParsedDealDescription {
  const parsed = emptyParsedDescription();
  if (!description) return parsed;

  const lines = description.split("\n");
  const readPrefixed = (prefix: string) => {
    const line = lines.find((entry) => entry.startsWith(prefix));
    if (!line) return "";
    const value = line.slice(prefix.length).trim();
    return value === "N/A" ? "" : value;
  };

  parsed.industry = readPrefixed("Industry: ");
  parsed.employeeCount = readPrefixed("Employee Count: ");
  parsed.website = readPrefixed("Website: ");
  parsed.address = readPrefixed("Address: ");
  parsed.city = readPrefixed("City: ");
  parsed.country = readPrefixed("Country: ");
  const stageRaw = readPrefixed("Stage: ");
  if (stageRaw && (DEAL_STAGES as readonly string[]).includes(stageRaw)) {
    parsed.stage = stageRaw as DealStage;
  }

  const contactsStart = lines.findIndex((line) => line.trim() === "Contacts:");
  const productsStart = lines.findIndex((line) => line.trim() === "Products:");
  const notesStart = lines.findIndex((line) => line.trim() === "Notes:");

  if (contactsStart >= 0) {
    const sliceEnd = productsStart >= 0 ? productsStart : notesStart >= 0 ? notesStart : lines.length;
    parsed.contacts = lines
      .slice(contactsStart + 1, sliceEnd)
      .map((line, index) => {
        const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)$/);
        if (!match) return null;
        const fullName = match[1].trim();
        const [firstName, ...rest] = fullName.split(" ");
        return {
          id: (typeof crypto !== "undefined" && "randomUUID" in crypto) ? crypto.randomUUID() : `${Date.now()}-${index}`,
          firstName: firstName || "",
          lastName: rest.join(" ") || "",
          jobTitle: match[2] === "N/A" ? "" : match[2],
          email: match[3] === "N/A" ? "" : match[3],
          mobileNo: match[4] === "N/A" ? "" : match[4],
          gender: (match[5] || "Other") as DealContact["gender"],
        } satisfies DealContact;
      })
      .filter((c): c is DealContact => Boolean(c));
  }

  if (productsStart >= 0) {
    parsed.products = lines
      .slice(productsStart + 1, notesStart >= 0 ? notesStart : lines.length)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.toLowerCase() !== "no products")
      .map((line) => {
        const normalized = line.replace(/^\d+\.\s*/, "");
        const match = normalized.match(/^(.*?)\s*\|\s*(.*?)\s*(?:\|\s*Price:\s*([0-9]+(?:\.[0-9]+)?)(?:\s+([A-Za-z]{3}))?(?:\/([A-Za-z]+))?)?\s*\|\s*Add-ons:\s*(.*)$/i);
        if (!match) return null;
        const priceRaw = match[3]?.trim();
        const price = priceRaw ? Number(priceRaw) : NaN;
        const currency = (match[4] || "USD").toUpperCase();
        const billingCycle = (match[5] || "monthly").toLowerCase();
        const addonPart = match[6].trim();
        const addonNames = addonPart && addonPart.toLowerCase() !== "none"
          ? addonPart.split(",").map((entry) => entry.trim().replace(/\s*\([^)]*\)\s*$/, "")).filter(Boolean)
          : [];
        return {
          productName: match[1].trim(),
          packageName: match[2].trim(),
          packagePrice: Number.isFinite(price) ? price : null,
          currency,
          billingCycle,
          addonNames,
        } satisfies ParsedDealProduct;
      })
      .filter((p): p is ParsedDealProduct => Boolean(p));
  }

  if (notesStart >= 0) {
    const text = lines.slice(notesStart + 1).join("\n").trim();
    parsed.notes = text === "N/A" ? "" : text;
  }

  return parsed;
}

export interface BuildDescriptionInput {
  industry: string;
  employeeCount: string;
  website: string;
  address: string;
  city: string;
  country: string;
  stage?: DealStage;
  contacts: DealContact[];
  products: Array<{ productName: string; packageName: string; packagePrice: number | null; currency?: string; billingCycle?: string; addons: Array<{ name: string; price: number }> }>;
  notes: string;
}

export function buildDealDescription(input: BuildDescriptionInput): string {
  const productLines = input.products.length
    ? input.products
        .map((p, i) => {
          const addons = p.addons.length ? p.addons.map((a) => `${a.name} (${a.price})`).join(", ") : "None";
          const price = p.packagePrice ?? 0;
          const currency = (p.currency || "USD").toUpperCase();
          const cycle = (p.billingCycle || "monthly").toLowerCase();
          return `${i + 1}. ${p.productName} | ${p.packageName} | Price: ${price} ${currency}/${cycle} | Add-ons: ${addons}`;
        })
        .join("\n")
    : "No products";

  const contactLines = input.contacts.length
    ? input.contacts
        .map(
          (c, i) => `${i + 1}. ${c.firstName} ${c.lastName} | ${c.jobTitle || "N/A"} | ${c.email || "N/A"} | ${c.mobileNo || "N/A"} | ${c.gender || "Other"}`,
        )
        .join("\n")
    : "No contacts";

  return [
    `Industry: ${input.industry || "N/A"}`,
    `Employee Count: ${input.employeeCount || "N/A"}`,
    `Website: ${input.website.trim() || "N/A"}`,
    `Address: ${input.address.trim() || "N/A"}`,
    `City: ${input.city.trim() || "N/A"}`,
    `Country: ${input.country || "N/A"}`,
    `Stage: ${input.stage || "Identified"}`,
    "",
    "Contacts:",
    contactLines,
    "",
    "Products:",
    productLines,
    "",
    "Notes:",
    input.notes.trim() || "N/A",
  ]
    .join("\n")
    .slice(0, 2000);
}

// Read products config from localStorage (matches DealDetail behaviour)
export interface ProductsConfigPackage { id: string; name: string; price: number; description?: string; currency?: string; billingCycle?: string }
export interface ProductsConfigProduct { id: string; name: string; status: "active" | "inactive"; packages: ProductsConfigPackage[] }
export interface ProductsConfigAddon { id: string; name: string; price: number; description?: string; currency?: string; billingCycle?: string }

const PRODUCTS_CONFIG_STORAGE_KEY = "configure-products-v1";
const PRODUCTS_CONFIG_BASELINE_KEY = "configure-products-default-v1";

const FALLBACK_PRODUCTS: ProductsConfigProduct[] = [
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
const FALLBACK_ADDONS: ProductsConfigAddon[] = [
  { id: "ga1", name: "Devicer", price: 0 },
  { id: "ga2", name: "Accessibility", price: 0 },
  { id: "ga3", name: "Healthcheck", price: 0 },
];

export function readProductsConfig(): { products: ProductsConfigProduct[]; addons: ProductsConfigAddon[] } {
  if (typeof window === "undefined") return { products: FALLBACK_PRODUCTS, addons: FALLBACK_ADDONS };
  const raw = window.localStorage.getItem(PRODUCTS_CONFIG_STORAGE_KEY) ?? window.localStorage.getItem(PRODUCTS_CONFIG_BASELINE_KEY);
  if (!raw) return { products: FALLBACK_PRODUCTS, addons: FALLBACK_ADDONS };
  try {
    const parsed = JSON.parse(raw) as { products?: ProductsConfigProduct[]; globalAddons?: ProductsConfigAddon[] };
    return {
      products: Array.isArray(parsed.products) ? parsed.products : FALLBACK_PRODUCTS,
      addons: Array.isArray(parsed.globalAddons) ? parsed.globalAddons : FALLBACK_ADDONS,
    };
  } catch {
    return { products: FALLBACK_PRODUCTS, addons: FALLBACK_ADDONS };
  }
}