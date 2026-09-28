import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FormSection } from "@/components/FormSection";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Plus, Save, Send, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getLead, listLeads, submitLead, updateLead, type Lead, type PackageType } from "@/lib/leads-api";
import { listDeals } from "@/lib/deals-api";
import { cn } from "@/lib/utils";

type WizardStep = 0 | 1;

interface Contact {
  id: string;
  jobTitle: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  gender: "Male" | "Female" | "Other";
}

interface ExistingAccount {
  companyName: string;
  account: {
    industry: string;
    employeeCount: string;
    website: string;
    address: string;
    city: string;
    country: string;
  };
  contacts: Contact[];
}

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
}

interface Product {
  id: string;
  name: string;
  category: string;
  status: "active" | "inactive";
  packages: ProductPackage[];
}

interface GlobalAddon {
  id: string;
  name: string;
  description: string;
  price: number;
}

interface LeadProductSelection {
  uid: string;
  productId: string;
  packageId: string;
  addonIds: string[];
}

interface ParsedLeadProduct {
  productName: string;
  packageName: string;
  addonNames: string[];
}

const STEP_LABELS = ["Account", "Contacts"] as const;
const INDUSTRIES = ["Technology", "Finance", "Retail", "Healthcare", "Education", "Manufacturing", "Other"] as const;
const EMPLOYEE_COUNTS = ["1-10", "10-50", "50-200", "200-500", "500+"] as const;
const COUNTRIES = ["Turkey", "United States", "United Kingdom", "Germany", "France", "Netherlands", "UAE", "Other"] as const;
const COUNTRY_CITIES: Record<string, string[]> = {
  Turkey: ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"],
  "United States": ["New York", "San Francisco", "Los Angeles", "Chicago", "Austin"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Bristol"],
  Germany: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
  France: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"],
  Netherlands: ["Amsterdam", "Rotterdam", "Utrecht", "The Hague", "Eindhoven"],
  UAE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"],
  Other: ["Other"],
};

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
      },
    ],
  },
];

const initialGlobalAddons: GlobalAddon[] = [
  { id: "ga1", name: "Devicer", description: "Device testing bundle.", price: 0 },
  { id: "ga2", name: "Accessibility", description: "Accessibility coverage add-on.", price: 0 },
  { id: "ga3", name: "Healthcheck", description: "Continuous health monitoring add-on.", price: 0 },
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
    const normalized = {
      products: Array.isArray(parsed.products) ? parsed.products : initialProducts,
      globalAddons: Array.isArray(parsed.globalAddons) ? parsed.globalAddons : initialGlobalAddons,
    };
    if (typeof window !== "undefined" && !window.localStorage.getItem(PRODUCTS_CONFIG_BASELINE_KEY)) {
      window.localStorage.setItem(PRODUCTS_CONFIG_BASELINE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return { products: initialProducts, globalAddons: initialGlobalAddons };
  }
}

function newLeadProductSelection(): LeadProductSelection {
  return {
    uid: `lp_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    productId: "",
    packageId: "",
    addonIds: [],
  };
}

function mapPackageNameToLegacyPackageType(name?: string): PackageType {
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

function parseLeadDescription(description: string | null) {
  const parsed = {
    industry: "",
    employeeCount: "",
    website: "",
    address: "",
    city: "",
    country: "",
    notes: "",
    contacts: [] as Contact[],
    products: [] as ParsedLeadProduct[],
  };

  if (!description) {
    return parsed;
  }

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

  const contactsStart = lines.findIndex((line) => line.trim() === "Contacts:");
  const productsStart = lines.findIndex((line) => line.trim() === "Products:");
  const notesStart = lines.findIndex((line) => line.trim() === "Notes:");

  if (contactsStart >= 0) {
    const contactLines = lines.slice(contactsStart + 1, productsStart >= 0 ? productsStart : notesStart >= 0 ? notesStart : lines.length);
    parsed.contacts = contactLines
      .map((line, index) => {
        const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)$/);
        if (!match) return null;

        const fullName = match[1].trim();
        const [firstName, ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");

        return {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${index}`,
          firstName: firstName || "",
          lastName: lastName || "",
          jobTitle: match[2] === "N/A" ? "" : match[2],
          email: match[3] === "N/A" ? "" : match[3],
          mobileNo: match[4] === "N/A" ? "" : match[4],
          gender: (match[5] || "Other") as Contact["gender"],
        } satisfies Contact;
      })
      .filter((entry): entry is Contact => Boolean(entry));
  }

  if (productsStart >= 0) {
    const productLines = lines.slice(productsStart + 1, notesStart >= 0 ? notesStart : lines.length);
    parsed.products = productLines
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && line.toLowerCase() !== "no products")
      .map((line) => {
        const normalized = line.replace(/^\d+\.\s*/, "");
        const match = normalized.match(/^(.*?)\s*\|\s*(.*?)\s*(?:\|\s*Price:\s*([0-9]+(?:\.[0-9]+)?))?\s*\|\s*Add-ons:\s*(.*)$/i);
        if (!match) {
          return null;
        }

        const addonPart = match[4].trim();
        const addonNames = addonPart && addonPart.toLowerCase() !== "none"
          ? addonPart
              .split(",")
              .map((item) => item.trim().replace(/\s*\([^)]*\)\s*$/, ""))
              .filter(Boolean)
          : [];

        return {
          productName: match[1].trim(),
          packageName: match[2].trim(),
          addonNames,
        } satisfies ParsedLeadProduct;
      })
      .filter((entry): entry is ParsedLeadProduct => Boolean(entry));
  }

  if (notesStart >= 0) {
    parsed.notes = lines.slice(notesStart + 1).join("\n").trim();
    if (parsed.notes === "N/A") {
      parsed.notes = "";
    }
  }

  return parsed;
}

function buildInitialLeadProducts(
  parsedProducts: ParsedLeadProduct[],
  fallbackPackageType: PackageType,
  fallbackAddons: string[],
  products: Product[],
  globalAddons: GlobalAddon[],
): LeadProductSelection[] {
  const activeProducts = products.filter((product) => product.status === "active");
  const addonNameToId = new Map(globalAddons.map((addon) => [addon.name.trim().toLowerCase(), addon.id]));

  const normalize = (value: string) => value.trim().toLowerCase();

  const mappedFromDescription = parsedProducts
    .map((entry) => {
      const product = activeProducts.find((item) => normalize(item.name) === normalize(entry.productName));
      if (!product) {
        return null;
      }

      const selectedPackage = product.packages.find((item) => normalize(item.name) === normalize(entry.packageName));
      if (!selectedPackage) {
        return null;
      }

      const addonIds = selectedPackage.addonsEnabled
        ? entry.addonNames
            .map((addonName) => addonNameToId.get(normalize(addonName)) ?? null)
            .filter((addonId): addonId is string => Boolean(addonId) && selectedPackage.availableAddonIds.includes(addonId))
        : [];

      return {
        uid: newLeadProductSelection().uid,
        productId: product.id,
        packageId: selectedPackage.id,
        addonIds,
      } satisfies LeadProductSelection;
    })
    .filter((entry): entry is LeadProductSelection => Boolean(entry));

  if (mappedFromDescription.length > 0) {
    return mappedFromDescription;
  }

  const firstProduct = activeProducts[0];
  if (!firstProduct) {
    return [newLeadProductSelection()];
  }

  const selectedPackage = firstProduct.packages.find(
    (pkg) => mapPackageNameToLegacyPackageType(pkg.name) === fallbackPackageType,
  ) ?? firstProduct.packages[0];

  if (!selectedPackage) {
    return [newLeadProductSelection()];
  }

  const fallbackAddonIds = selectedPackage.addonsEnabled
    ? fallbackAddons
        .map((addonName) => addonNameToId.get(addonName.trim().toLowerCase()) ?? null)
        .filter((addonId): addonId is string => Boolean(addonId) && selectedPackage.availableAddonIds.includes(addonId))
    : [];

  return [
    {
      uid: newLeadProductSelection().uid,
      productId: firstProduct.id,
      packageId: selectedPackage.id,
      addonIds: fallbackAddonIds,
    },
  ];
}

export default function PartnerLeadDetail() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [lead, setLead] = useState<Lead | null>(null);
  const [step, setStep] = useState<WizardStep>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedExistingCompany, setSelectedExistingCompany] = useState<string | null>(null);
  const [existingAccounts, setExistingAccounts] = useState<ExistingAccount[]>([]);

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");
  const [gender, setGender] = useState<Contact["gender"] | "">("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const contactsStepRef = useRef<HTMLDivElement | null>(null);

  const [products, setProducts] = useState<Product[]>(() => readProductsConfigFromStorage().products);
  const [globalAddons, setGlobalAddons] = useState<GlobalAddon[]>(() => readProductsConfigFromStorage().globalAddons);
  const [leadProducts, setLeadProducts] = useState<LeadProductSelection[]>(() => [newLeadProductSelection()]);
  const [openProductUid, setOpenProductUid] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const canEdit = lead?.status === "DRAFT" || lead?.status === "REJECTED";
  const canSubmit = canEdit;

  const accountValid = Boolean(companyName.trim());
  const contactRequiredValid = Boolean(firstName.trim() && lastName.trim());
  const contactDraftHasData = Boolean(
    jobTitle.trim() || firstName.trim() || lastName.trim() || email.trim() || mobileNo.trim() || gender,
  );
  const contactsValid = contacts.length > 0;

  const activeProducts = useMemo(() => products.filter((product) => product.status === "active"), [products]);
  const addonById = useMemo(
    () => Object.fromEntries(globalAddons.map((addon) => [addon.id, addon])),
    [globalAddons],
  );
  const productsValid = useMemo(
    () => leadProducts.length > 0 && leadProducts.every((leadProduct) => leadProduct.productId && leadProduct.packageId),
    [leadProducts],
  );

  const selectExistingCompany = (accountRecord: ExistingAccount) => {
    setCompanyName(accountRecord.companyName);
    setCompanyQuery(accountRecord.companyName);
    setIndustry(accountRecord.account.industry);
    setEmployeeCount(accountRecord.account.employeeCount);
    setWebsite(accountRecord.account.website);
    setAddress(accountRecord.account.address);
    setCountry(accountRecord.account.country);
    setCity(accountRecord.account.city);
    setContacts(accountRecord.contacts);
    if (accountRecord.contacts.length > 0) {
      const [firstContact] = accountRecord.contacts;
      setEditingContactId(firstContact.id);
      setJobTitle(firstContact.jobTitle);
      setFirstName(firstContact.firstName);
      setLastName(firstContact.lastName);
      setEmail(firstContact.email);
      setMobileNo(firstContact.mobileNo);
      setGender(firstContact.gender);
    } else {
      resetContactDraft();
    }
    setSelectedExistingCompany(accountRecord.companyName);
    setCompanyOpen(false);
    toast.success(`${accountRecord.companyName} loaded into form`);
  };

  const clearExistingCompanySelection = () => {
    setSelectedExistingCompany(null);
  };

  useEffect(() => {
    if (!token || !leadId) return;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getLead(token, leadId);
        const config = readProductsConfigFromStorage();
        setProducts(config.products);
        setGlobalAddons(config.globalAddons);

        setLead(data);
        setCompanyName(data.title);
        setCompanyQuery(data.title);

        const parsed = parseLeadDescription(data.description ?? null);
        setIndustry(parsed.industry);
        setEmployeeCount(parsed.employeeCount);
        setWebsite(parsed.website);
        setAddress(parsed.address);
        setCity(parsed.city);
        setCountry(parsed.country);
        setNotes(parsed.notes);
        setContacts(parsed.contacts);

        const nextLeadProducts = buildInitialLeadProducts(
          parsed.products,
          data.packageType,
          data.addons,
          config.products,
          config.globalAddons,
        );
        setLeadProducts(nextLeadProducts);
        setOpenProductUid(nextLeadProducts[0]?.uid ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load lead");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token, leadId]);

  useEffect(() => {
    if (!token) {
      setExistingAccounts([]);
      return;
    }

    (async () => {
      try {
        const [leads, deals] = await Promise.all([listLeads(token), listDeals(token)]);
        const map = new Map<string, ExistingAccount>();

        for (const leadItem of leads) {
          const value = leadItem.title?.trim();
          if (!value) continue;
          const key = value.toLowerCase();
          const existing = map.get(key);
          const parsed = parseLeadDescription(leadItem.description ?? null);
          const candidate: ExistingAccount = {
            companyName: value,
            account: {
              industry: parsed.industry,
              employeeCount: parsed.employeeCount,
              website: parsed.website,
              address: parsed.address,
              city: parsed.city,
              country: parsed.country,
            },
            contacts: parsed.contacts,
          };

          if (!existing) {
            map.set(key, candidate);
          } else {
            map.set(key, {
              companyName: existing.companyName || candidate.companyName,
              account: {
                industry: existing.account.industry || candidate.account.industry,
                employeeCount: existing.account.employeeCount || candidate.account.employeeCount,
                website: existing.account.website || candidate.account.website,
                address: existing.account.address || candidate.account.address,
                city: existing.account.city || candidate.account.city,
                country: existing.account.country || candidate.account.country,
              },
              contacts: existing.contacts.length > 0 ? existing.contacts : candidate.contacts,
            });
          }
        }

        for (const deal of deals) {
          const value = deal.name?.trim();
          if (!value) continue;
          const key = value.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              companyName: value,
              account: {
                industry: "",
                employeeCount: "",
                website: "",
                address: "",
                city: "",
                country: "",
              },
              contacts: [],
            });
          }
        }

        setExistingAccounts(Array.from(map.values()).sort((a, b) => a.companyName.localeCompare(b.companyName)));
      } catch {
        setExistingAccounts([]);
      }
    })();
  }, [token]);

  useEffect(() => {
    const availableCities = COUNTRY_CITIES[country] ?? [];
    if (!country) {
      setCity("");
      return;
    }
    if (city && !availableCities.includes(city)) {
      setCity("");
    }
  }, [country, city]);

  const filteredCompanyNames = useMemo(() => {
    const query = companyQuery.trim().toLowerCase();
    if (!query) {
      return existingAccounts;
    }
    return existingAccounts.filter((item) => item.companyName.toLowerCase().includes(query));
  }, [companyQuery, existingAccounts]);

  const hasExactCompanyMatch = useMemo(
    () => existingAccounts.some((item) => item.companyName.toLowerCase() === companyQuery.trim().toLowerCase()),
    [companyQuery, existingAccounts],
  );

  const buildDescription = () => {
    const productLines = leadProducts.length
      ? leadProducts
          .map((leadProduct, index) => {
            const product = activeProducts.find((item) => item.id === leadProduct.productId);
            const selectedPackage = product?.packages.find((item) => item.id === leadProduct.packageId);
            const selectedAddonLabels = leadProduct.addonIds
              .map((addonId) => addonById[addonId])
              .filter((addon): addon is GlobalAddon => Boolean(addon))
              .map((addon) => `${addon.name} (${addon.price})`);

            if (!product || !selectedPackage) {
              return `${index + 1}. Product not selected`;
            }

            return `${index + 1}. ${product.name} | ${selectedPackage.name} | Price: ${selectedPackage.price} | Add-ons: ${
              selectedAddonLabels.length > 0 ? selectedAddonLabels.join(", ") : "None"
            }`;
          })
          .join("\n")
      : "No products";

    const contactLines = contacts.length
      ? contacts
          .map(
            (contact, index) =>
              `${index + 1}. ${contact.firstName} ${contact.lastName} | ${contact.jobTitle || "N/A"} | ${contact.email || "N/A"} | ${contact.mobileNo || "N/A"} | ${contact.gender || "Other"}`,
          )
          .join("\n")
      : "No contacts";

    return [
      `Industry: ${industry || "N/A"}`,
      `Employee Count: ${employeeCount || "N/A"}`,
      `Website: ${website.trim() || "N/A"}`,
      `Address: ${address.trim() || "N/A"}`,
      `City: ${city.trim() || "N/A"}`,
      `Country: ${country || "N/A"}`,
      "",
      "Contacts:",
      contactLines,
      "",
      "Products:",
      productLines,
      "",
      "Notes:",
      notes.trim() || "N/A",
    ]
      .join("\n")
      .slice(0, 2000);
  };

  const resetContactDraft = () => {
    setJobTitle("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setMobileNo("");
    setGender("");
    setEditingContactId(null);
  };

  useEffect(() => {
    if (step !== 1 || !editingContactId) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const clickedInsideContacts = contactsStepRef.current?.contains(target);
      const clickedRadixPortal = Boolean(target.closest("[data-radix-popper-content-wrapper]"));

      if (!clickedInsideContacts && !clickedRadixPortal) {
        resetContactDraft();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [step, editingContactId]);

  const commitContactDraft = () => {
    if (!contactRequiredValid) {
      toast.error("First Name and Last Name are required");
      return false;
    }

    const nextContact: Contact = {
      id: editingContactId ?? (crypto.randomUUID?.() ?? `${Date.now()}`),
      jobTitle: jobTitle.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      mobileNo: mobileNo.trim(),
      gender: (gender || "Other") as Contact["gender"],
    };

    setContacts((current) => {
      if (!editingContactId) {
        return [...current, nextContact];
      }
      return current.map((contact) => (contact.id === editingContactId ? nextContact : contact));
    });

    resetContactDraft();
    return true;
  };

  const addContact = () => {
    if (!canEdit) return;
    commitContactDraft();
  };

  const removeContact = (id: string) => {
    if (!canEdit) return;
    setContacts((current) => current.filter((contact) => contact.id !== id));
    if (editingContactId === id) {
      resetContactDraft();
    }
  };

  const startEditingContact = (contact: Contact) => {
    if (!canEdit) return;
    setEditingContactId(contact.id);
    setJobTitle(contact.jobTitle);
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setEmail(contact.email);
    setMobileNo(contact.mobileNo);
    setGender(contact.gender);
  };

  const addProductCard = () => {
    if (!canEdit) return;
    const nextProduct = newLeadProductSelection();
    setLeadProducts((current) => [...current, nextProduct]);
    setOpenProductUid(nextProduct.uid);
  };

  const removeProductCard = (uid: string) => {
    if (!canEdit) return;
    setLeadProducts((current) => current.filter((leadProduct) => leadProduct.uid !== uid));
    if (openProductUid === uid) {
      setOpenProductUid(null);
    }
  };

  const updateProductCard = (uid: string, patch: Partial<LeadProductSelection>) => {
    if (!canEdit) return;
    setLeadProducts((current) =>
      current.map((leadProduct) => (leadProduct.uid === uid ? { ...leadProduct, ...patch } : leadProduct)),
    );
  };

  const selectProductForCard = (uid: string, productId: string) => {
    updateProductCard(uid, { productId, packageId: "", addonIds: [] });
  };

  const selectPackageForCard = (uid: string, packageId: string) => {
    updateProductCard(uid, { packageId });
  };

  const toggleAddonForCard = (uid: string, addonId: string) => {
    if (!canEdit) return;
    setLeadProducts((current) =>
      current.map((leadProduct) =>
        leadProduct.uid === uid
          ? {
              ...leadProduct,
              addonIds: leadProduct.addonIds.includes(addonId)
                ? leadProduct.addonIds.filter((id) => id !== addonId)
                : [...leadProduct.addonIds, addonId],
            }
          : leadProduct,
      ),
    );
  };

  const moveNext = () => {
    if (step === 0 && !accountValid) {
      toast.error("Please complete required account fields");
      return;
    }
    if (step === 1 && !contactsValid) {
      toast.error("Add at least one contact");
      return;
    }
    setStep((current) => Math.min(current + 1, 1) as WizardStep);
  };

  const moveNextFromContacts = () => {
    if (!canEdit) {
      void saveDraft();
      return;
    }

    if (!contactsValid && !contactDraftHasData) {
      toast.error("Add at least one contact");
      return;
    }

    if (contactDraftHasData) {
      if (!contactRequiredValid) {
        toast.error("First Name and Last Name are required");
        return;
      }
      const committed = commitContactDraft();
      if (!committed) return;
    }

    void saveDraft();
  };

  const moveBack = () => {
    setStep((current) => Math.max(current - 1, 0) as WizardStep);
  };

  const getLegacyFields = () => ({ packageType: "MEDIUM" as PackageType, addons: [] as string[] });

  const saveDraft = async () => {
    if (!token || !leadId || !canEdit) return;
    const { packageType, addons } = getLegacyFields();

    setIsSaving(true);
    try {
      const updated = await updateLead(token, leadId, {
        title: companyName.trim(),
        description: buildDescription(),
        packageType,
        addons,
      });
      setLead(updated);
      toast.success("Draft saved");
      navigate("/app/partner/leads");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save lead");
    } finally {
      setIsSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!token || !leadId || !canSubmit) return;
    const { packageType, addons } = getLegacyFields();

    setIsSaving(true);
    try {
      await updateLead(token, leadId, {
        title: companyName.trim(),
        description: buildDescription(),
        packageType,
        addons,
      });

      const submitted = await submitLead(token, leadId);
      setLead(submitted);
      toast.success("Lead submitted for review");
      navigate("/app/partner/leads");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit lead");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingState variant="detail" />;
  }

  if (!lead || error) {
    return <ErrorState description={error ?? "Lead not found."} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate("/app/partner/leads")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </button>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">{companyName || lead.title}</h1>
        <StatusBadge status={lead.status} />
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-mono">{lead.id}</span> · Updated {new Date(lead.updatedAt).toLocaleDateString()}
      </p>

      {lead.rejectionReason ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-destructive">Rejection Reason</p>
                <p className="text-sm text-foreground mt-1">{lead.rejectionReason}</p>
                <p className="text-xs text-muted-foreground mt-2">You can edit and re-submit this lead.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, index) => {
            const isActive = step === index;
            const isDone = step > index;
            return (
              <div key={label} className={cn("flex items-center min-w-0", index < STEP_LABELS.length - 1 && "flex-1")}>
                <span className="relative inline-flex h-9 w-9 items-center justify-center shrink-0">
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full border",
                      isActive ? "border-primary/35 ring-2 ring-primary/20" : isDone ? "border-primary/25" : "border-border",
                    )}
                  />
                  <span
                    className={cn(
                      "relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                      isDone && "bg-primary text-primary-foreground",
                      isActive && "bg-primary text-primary-foreground",
                      !isDone && !isActive && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                </span>
                <span className={cn("ml-2 text-sm font-semibold whitespace-nowrap", isActive || isDone ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {index < STEP_LABELS.length - 1 ? (
                  <span className={cn("ml-3 h-px flex-1", step > index ? "bg-primary/70" : "bg-border")} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {step === 0 ? (
        <FormSection title="Account Information" description={canEdit ? "Edit account info" : "Read-only view"}>
          {selectedExistingCompany ? (
            <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="flex-1">
                <p className="font-medium text-foreground">Existing company selected</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Account and contacts loaded from <span className="font-medium text-foreground">{selectedExistingCompany}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearExistingCompanySelection();
                  setCompanyQuery(companyName);
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
                disabled={!canEdit || isSaving}
              >
                Clear
              </button>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Company Name <span className="text-destructive">*</span></Label>
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyOpen}
                    className="w-full justify-between font-normal"
                    disabled={!canEdit || isSaving}
                  >
                    <span className={cn("truncate", !companyName && "text-muted-foreground")}>
                      {companyName || "Search or enter company name"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Type company name..."
                      value={companyQuery}
                      onValueChange={(value) => {
                        setCompanyQuery(value);
                        if (selectedExistingCompany && value !== selectedExistingCompany) {
                          clearExistingCompanySelection();
                        }
                        setCompanyName(value);
                      }}
                    />
                    <CommandList>
                      {filteredCompanyNames.length > 0 ? (
                        <CommandGroup heading="Existing companies">
                          {filteredCompanyNames.map((item) => (
                            <CommandItem
                              key={item.companyName}
                              value={item.companyName}
                              onSelect={() => {
                                selectExistingCompany(item);
                              }}
                            >
                              <span className="truncate">{item.companyName}</span>
                              <span className="ml-2 shrink-0 text-xs text-muted-foreground">{item.contacts.length} contact{item.contacts.length === 1 ? "" : "s"}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ) : null}
                      {companyQuery.trim() && !hasExactCompanyMatch ? (
                        <CommandGroup heading="Create new">
                          <CommandItem
                            value={`__new__${companyQuery}`}
                            onSelect={() => {
                              const trimmed = companyQuery.trim();
                              setCompanyName(trimmed);
                              setCompanyQuery(trimmed);
                              setCompanyOpen(false);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Use "<span className="font-medium">{companyQuery.trim()}</span>" as new company
                          </CommandItem>
                        </CommandGroup>
                      ) : null}
                      {filteredCompanyNames.length === 0 && !companyQuery.trim() ? (
                        <CommandEmpty>Start typing to search or create.</CommandEmpty>
                      ) : null}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={setIndustry} disabled={!canEdit || isSaving}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee Count</Label>
              <Select value={employeeCount} onValueChange={setEmployeeCount} disabled={!canEdit || isSaving}>
                <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_COUNTS.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} disabled={!canEdit || isSaving} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry} disabled={!canEdit || isSaving}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={city} onValueChange={setCity} disabled={!country || !canEdit || isSaving}>
                <SelectTrigger><SelectValue placeholder={country ? "Select city" : "Select country first"} /></SelectTrigger>
                <SelectContent>
                  {(COUNTRY_CITIES[country] ?? []).map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Website</Label>
              <Input value={website} onChange={(event) => setWebsite(event.target.value)} disabled={!canEdit || isSaving} placeholder="https://example.com" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={moveNext}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </FormSection>
      ) : null}

      {step === 1 ? (
        <FormSection title="Contacts" description={canEdit ? "Manage contacts" : "Read-only contacts"}>
          <div ref={contactsStepRef} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name <span className="text-destructive">*</span></Label><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={!canEdit || isSaving} /></div>
              <div className="space-y-2"><Label>Last Name <span className="text-destructive">*</span></Label><Input value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={!canEdit || isSaving} /></div>
              <div className="space-y-2"><Label>Job Title</Label><Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} disabled={!canEdit || isSaving} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!canEdit || isSaving} /></div>
              <div className="space-y-2"><Label>Mobile No</Label><Input value={mobileNo} onChange={(event) => setMobileNo(event.target.value)} disabled={!canEdit || isSaving} /></div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={(value) => setGender(value as Contact["gender"])} disabled={!canEdit || isSaving}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {canEdit ? (
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={addContact} disabled={!contactRequiredValid || isSaving}>
                  {editingContactId ? "Save" : "Add Contact"}
                </Button>
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="text-sm font-medium">Added Contacts ({contacts.length})</p>
              {contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts added yet.</p> : null}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {contacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className={cn(
                      "border-border/60",
                      canEdit && "cursor-pointer hover:border-primary/50 transition-colors",
                      editingContactId === contact.id && "border-primary bg-primary/5",
                    )}
                    onClick={() => startEditingContact(contact)}
                  >
                    <CardContent className="p-3 flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.jobTitle || "No title"}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.email || "No email"}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.mobileNo || "No phone"}</p>
                      </div>
                      {canEdit ? (
                        <Button type="button" variant="ghost" size="icon" data-contact-card-action onClick={(event) => { event.stopPropagation(); removeContact(contact.id); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={moveBack}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button type="button" onClick={moveNextFromContacts} disabled={isSaving || !canEdit}>
              <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </FormSection>
      ) : null}

      {false ? (
        <div className="space-y-6">
          <FormSection title="Products" description={canEdit ? "Add one or more products. Each product row requires a package." : "Read-only product view"}>
            <div className="space-y-3">
              {leadProducts.map((leadProduct) => {
                const product = activeProducts.find((item) => item.id === leadProduct.productId);
                const selectedPackage = product?.packages.find((item) => item.id === leadProduct.packageId);
                const isOpen = openProductUid === leadProduct.uid;

                const usedElsewhere = new Set(
                  leadProducts
                    .filter((item) => item.uid !== leadProduct.uid && item.productId)
                    .map((item) => item.productId),
                );
                const availableProducts = activeProducts.filter(
                  (item) => item.id === leadProduct.productId || !usedElsewhere.has(item.id),
                );

                const summary = product
                  ? `${product.name}${selectedPackage ? ` · ${selectedPackage.name}` : ""}${selectedPackage ? ` · $${selectedPackage.price.toLocaleString()}/mo` : ""}`
                  : "Untitled product — select one";

                return (
                  <Collapsible
                    key={leadProduct.uid}
                    open={isOpen}
                    onOpenChange={(nextOpen) => setOpenProductUid(nextOpen ? leadProduct.uid : null)}
                    className="rounded-lg border bg-card overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 px-4 py-3">
                      <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-left">
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", !isOpen && "-rotate-90")} />
                        <span className={cn("text-sm", product ? "font-medium text-foreground" : "text-muted-foreground italic")}>
                          {summary}
                        </span>
                      </CollapsibleTrigger>
                      <button
                        type="button"
                        onClick={() => removeProductCard(leadProduct.uid)}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded transition-colors"
                        disabled={leadProducts.length === 1 || !canEdit || isSaving}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-5 border-t pt-4">
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select value={leadProduct.productId} onValueChange={(value) => selectProductForCard(leadProduct.uid, value)} disabled={!canEdit || isSaving}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.length === 0 ? (
                                <div className="py-2 px-3 text-sm text-muted-foreground">No products available</div>
                              ) : (
                                availableProducts.map((item) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name}
                                    {item.category ? <span className="text-muted-foreground"> · {item.category}</span> : null}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {product && product.packages.length > 0 ? (
                          <div className="space-y-2">
                            <Label>Package</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {product.packages.map((item) => {
                                const selected = leadProduct.packageId === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectPackageForCard(leadProduct.uid, item.id)}
                                    disabled={!canEdit || isSaving}
                                    className={cn(
                                      "rounded-lg border p-4 text-left transition-all flex flex-col",
                                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                                      (!canEdit || isSaving) && "cursor-default",
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="font-semibold text-foreground text-sm">{item.name}</h4>
                                      <div
                                        className={cn(
                                          "h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5",
                                          selected ? "border-primary bg-primary" : "border-muted-foreground/40",
                                        )}
                                      >
                                        {selected ? <Check className="h-2.5 w-2.5 text-primary-foreground" /> : null}
                                      </div>
                                    </div>
                                    {item.description ? (
                                      <p className="text-xs text-muted-foreground mb-3 leading-snug">{item.description}</p>
                                    ) : null}
                                    {item.metrics.length > 0 ? (
                                      <div className="space-y-1 text-xs">
                                        {item.metrics.map((metric) => (
                                          <div key={metric.id} className="grid grid-cols-[minmax(0,1fr)_5.5ch] items-center gap-x-3">
                                            <span className="text-muted-foreground pr-2 truncate">{metric.label}</span>
                                            <span className="font-medium text-foreground text-right tabular-nums whitespace-nowrap">{metric.value}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                    <div className="border-t mt-3 pt-2 flex justify-between items-baseline">
                                      <span className="text-xs text-muted-foreground">Monthly</span>
                                      <span className="font-bold text-foreground text-sm">${item.price.toLocaleString()}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}

                        {product && selectedPackage?.addonsEnabled ? (
                          <div className="space-y-2">
                            <Label>Add-ons</Label>
                            <div className="space-y-2">
                              {selectedPackage.availableAddonIds
                                .map((addonId) => addonById[addonId])
                                .filter((addon): addon is GlobalAddon => Boolean(addon))
                                .map((addon) => {
                                  const checked = leadProduct.addonIds.includes(addon.id);
                                  return (
                                    <label
                                      key={addon.id}
                                      className={cn(
                                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                                        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                          checked ? "border-primary bg-primary" : "border-muted-foreground/40",
                                        )}
                                      >
                                        {checked ? <Check className="h-2.5 w-2.5 text-primary-foreground" /> : null}
                                      </div>
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={() => toggleAddonForCard(leadProduct.uid, addon.id)}
                                        className="sr-only"
                                        disabled={!canEdit || isSaving}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-foreground font-medium">{addon.name}</div>
                                        {addon.description ? <div className="text-xs text-muted-foreground truncate">{addon.description}</div> : null}
                                      </div>
                                      <span className="text-sm font-medium text-foreground shrink-0">${addon.price.toLocaleString()}/mo</span>
                                    </label>
                                  );
                                })}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}

              <Button
                type="button"
                variant="outline"
                onClick={addProductCard}
                disabled={!canEdit || isSaving || (activeProducts.length > 0 && leadProducts.filter((item) => item.productId).length >= activeProducts.length)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" /> Add product
              </Button>
            </div>
          </FormSection>

          <FormSection title="Notes">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} placeholder="Add context notes (optional)" disabled={!canEdit || isSaving} />
          </FormSection>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={moveBack} disabled={isSaving}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {canEdit ? (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => void saveDraft()} disabled={isSaving || !productsValid}>
                  <Save className="h-4 w-4 mr-1" /> {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                <Button type="button" onClick={() => void submitForReview()} disabled={isSaving || !canSubmit || !productsValid}>
                  <Send className="h-4 w-4 mr-1" /> {isSaving ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
