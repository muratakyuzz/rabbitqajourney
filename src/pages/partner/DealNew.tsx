import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { FormSection } from "@/components/FormSection";
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
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { BILLING_CYCLE_LABELS, formatAmount, formatPrice, normalizeBillingCycle, normalizeCurrency } from "@/lib/product-pricing";
import { createLead, type PackageType } from "@/lib/deals-flow-adapter";
import { listLeads as listLeadRecords } from "@/lib/leads-api";
import { listDeals } from "@/lib/deals-api";
import { cn } from "@/lib/utils";
import { DealQualificationCard, emptyDealQualification, type DealQualification } from "@/components/DealQualificationCard";

type WizardStep = 0 | 1 | 2;

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
  currency?: string;
  billingCycle?: string;
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
  currency?: string;
  billingCycle?: string;
}

interface LeadProductSelection {
  uid: string;
  productId: string;
  packageId: string;
  addonIds: string[];
}

const STEP_LABELS = ["Account", "Contacts", "Product"] as const;
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
    const normalized = {
      products: Array.isArray(parsed.products) ? parsed.products : initialProducts,
      globalAddons: Array.isArray(parsed.globalAddons)
        ? parsed.globalAddons.map((a) => ({ ...a, currency: normalizeCurrency((a as Partial<GlobalAddon>).currency), billingCycle: normalizeBillingCycle((a as Partial<GlobalAddon>).billingCycle) }))
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

export default function PartnerDealNew() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [step, setStep] = useState<WizardStep>(0);
  const [isSaving, setIsSaving] = useState(false);
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
  const hasInitializedProductCollapseRef = useRef(false);
  const [notes, setNotes] = useState("");
  const [qualification, setQualification] = useState<DealQualification>(emptyDealQualification);

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

  const extractField = (description: string | null | undefined, fieldName: string) => {
    if (!description) {
      return "";
    }
    const match = description.match(new RegExp(`(?:^|\\n)\\s*${fieldName}:\\s*(.+)`, "i"));
    return match?.[1]?.trim() ?? "";
  };

  const parseContacts = (description: string | null | undefined): Contact[] => {
    if (!description) {
      return [];
    }

    const marker = description.indexOf("Contacts:");
    if (marker === -1) {
      return [];
    }

    const contactsStart = marker + "Contacts:".length;
    const nextSectionMarkers = ["\n\nProducts:", "\n\nNotes:"]
      .map((section) => description.indexOf(section, contactsStart))
      .filter((index) => index !== -1);
    const contactsEnd = nextSectionMarkers.length > 0 ? Math.min(...nextSectionMarkers) : description.length;
    const contactsBlock = description.slice(
      contactsStart,
      contactsEnd,
    );
    const lines = contactsBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed: Contact[] = [];
    for (const line of lines) {
      if (line.toLowerCase() === "no contacts") {
        continue;
      }
      const normalized = line.replace(/^\d+\.\s*/, "");
      const [fullName = "", jobTitle = "", email = "", mobileNo = "", gender = "Other"] = normalized.split("|").map((part) => part.trim());
      if (!fullName) {
        continue;
      }
      const [firstName, ...lastNameParts] = fullName.split(" ");
      parsed.push({
        id: crypto.randomUUID(),
        firstName: firstName ?? "",
        lastName: lastNameParts.join(" "),
        jobTitle: jobTitle === "N/A" ? "" : jobTitle,
        email: email === "N/A" ? "" : email,
        mobileNo: mobileNo === "N/A" ? "" : mobileNo,
        gender: (gender === "Male" || gender === "Female" || gender === "Other" ? gender : "Other"),
      });
    }

    return parsed;
  };

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
    setStep(1);
    toast.success(`${accountRecord.companyName} loaded · moved to Contacts step`);
  };

  const clearExistingCompanySelection = () => {
    setSelectedExistingCompany(null);
  };

  useEffect(() => {
    if (!token) {
      setExistingAccounts([]);
      return;
    }

    (async () => {
      try {
        const [leads, deals] = await Promise.all([listLeadRecords(token), listDeals(token)]);
        const map = new Map<string, ExistingAccount>();
        for (const lead of leads) {
          const value = lead.title?.trim();
          if (value) {
            const key = value.toLowerCase();
            const existing = map.get(key);
            const candidate: ExistingAccount = {
              companyName: value,
              account: {
                industry: extractField(lead.description, "Industry"),
                employeeCount: extractField(lead.description, "Employee Count"),
                website: extractField(lead.description, "Website"),
                address: extractField(lead.description, "Address"),
                city: extractField(lead.description, "City"),
                country: extractField(lead.description, "Country"),
              },
              contacts: parseContacts(lead.description),
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
        }
        for (const deal of deals) {
          const value = deal.name?.trim();
          if (value) {
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
        }
        setExistingAccounts(Array.from(map.values()).sort((a, b) => a.companyName.localeCompare(b.companyName)));
      } catch {
        setExistingAccounts([]);
      }
    })();
  }, [token]);

  useEffect(() => {
    const config = readProductsConfigFromStorage();
    setProducts(config.products);
    setGlobalAddons(config.globalAddons);
  }, []);

  useEffect(() => {
    if (!hasInitializedProductCollapseRef.current && leadProducts[0]) {
      setOpenProductUid(leadProducts[0].uid);
      hasInitializedProductCollapseRef.current = true;
    }
  }, [leadProducts]);

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

            return `${index + 1}. ${product.name} | ${selectedPackage.name} | Price: ${selectedPackage.price} ${(selectedPackage.currency||'USD').toUpperCase()}/${(selectedPackage.billingCycle||'monthly').toLowerCase()} | Add-ons: ${
              selectedAddonLabels.length > 0 ? selectedAddonLabels.join(", ") : "None"
            }`;
          })
          .join("\n")
      : "No products";

    const contactLines = contacts.length
      ? contacts
          .map(
            (contact, index) =>
              `${index + 1}. ${contact.firstName} ${contact.lastName} | ${contact.jobTitle} | ${contact.email} | ${contact.mobileNo || "N/A"} | ${contact.gender}`,
          )
          .join("\n")
      : "No contacts";

    return [
      `Industry: ${industry}`,
      `Employee Count: ${employeeCount}`,
      `Website: ${website.trim() || "N/A"}`,
      `Address: ${address.trim() || "N/A"}`,
      `City: ${city.trim() || "N/A"}`,
      `Country: ${country}`,
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
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [step, editingContactId]);

  const commitContactDraft = () => {
    if (!contactRequiredValid) {
      toast.error("First Name and Last Name are required");
      return false;
    }

    const nextContact = {
      id: editingContactId ?? crypto.randomUUID(),
      jobTitle: jobTitle.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      mobileNo: mobileNo.trim(),
      gender: gender as Contact["gender"],
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
    commitContactDraft();
  };

  const removeContact = (id: string) => {
    setContacts((current) => current.filter((contact) => contact.id !== id));
    if (editingContactId === id) {
      resetContactDraft();
    }
  };

  const startEditingContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setJobTitle(contact.jobTitle);
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setEmail(contact.email);
    setMobileNo(contact.mobileNo);
    setGender(contact.gender);
  };

  const addProductCard = () => {
    const nextProduct = newLeadProductSelection();
    setLeadProducts((current) => [...current, nextProduct]);
    setOpenProductUid(nextProduct.uid);
  };

  const removeProductCard = (uid: string) => {
    setLeadProducts((current) => current.filter((leadProduct) => leadProduct.uid !== uid));
    if (openProductUid === uid) {
      setOpenProductUid(null);
    }
  };

  const updateProductCard = (uid: string, patch: Partial<LeadProductSelection>) => {
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
    setStep((current) => Math.min(current + 1, 2) as WizardStep);
  };

  const moveNextFromContacts = () => {
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
      if (!committed) {
        return;
      }
    }

    setStep(2);
  };

  const moveBack = () => {
    setStep((current) => Math.max(current - 1, 0) as WizardStep);
  };

  const createLeadDraft = async () => {
    if (!token) {
      toast.error("Session expired. Please log in again.");
      navigate("/login");
      return;
    }
    if (!accountValid || !contactsValid) {
      toast.error("Please complete required account and contact information");
      return;
    }
    if (!productsValid) {
      toast.error("Please select product and package for each product row");
      return;
    }

    const firstSelectedProduct = leadProducts[0];
    const selectedProduct = activeProducts.find((item) => item.id === firstSelectedProduct?.productId);
    const selectedPackage = selectedProduct?.packages.find((item) => item.id === firstSelectedProduct?.packageId);
    const packageType = mapPackageNameToLegacyPackageType(selectedPackage?.name);
    const addons = selectedPackage?.addonsEnabled
      ? firstSelectedProduct.addonIds
          .map((addonId) => addonById[addonId]?.name)
          .filter((addonName): addonName is string => Boolean(addonName))
      : [];

    setIsSaving(true);
    try {
      const created = await createLead(token, {
        title: companyName.trim(),
        description: buildDescription(),
        packageType,
        addons,
      });
      toast.success("Deal created");
      navigate("/app/partner/deals", {
        state: {
          createdDealId: created.id,
          forceFilter: "ALL",
          forceReloadAt: Date.now(),
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create deal");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => navigate("/app/partner/deals")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to Deals
      </button>

      <PageHeader title="New Deal" subtitle="Create a deal with account, contacts, and product details" />

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
        <FormSection title="Account Information">
          {selectedExistingCompany ? (
            <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="flex-1">
                <p className="font-medium text-foreground">Existing company selected</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Account details loaded from <span className="font-medium text-foreground">{selectedExistingCompany}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearExistingCompanySelection();
                  setCompanyName("");
                  setCompanyQuery("");
                  setIndustry("");
                  setEmployeeCount("");
                  setWebsite("");
                  setAddress("");
                  setCountry("");
                  setCity("");
                  setContacts([]);
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
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
                    tabIndex={1}
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
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger tabIndex={2}><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Employee Count</Label>
              <Select value={employeeCount} onValueChange={setEmployeeCount}>
                <SelectTrigger tabIndex={3}><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_COUNTS.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://example.com" tabIndex={7} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} tabIndex={4} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger tabIndex={5}><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={city} onValueChange={setCity} disabled={!country}>
                <SelectTrigger tabIndex={6}>
                  <SelectValue placeholder={country ? "Select city" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {(COUNTRY_CITIES[country] ?? []).map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={moveNext}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </FormSection>
      ) : null}

      {step === 1 ? (
        <div ref={contactsStepRef}>
        <FormSection title="Contacts">
          {selectedExistingCompany ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="text-muted-foreground">
                Contacts loaded from <span className="font-medium text-foreground">{selectedExistingCompany}</span>. You can edit or add more.
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>First Name <span className="text-destructive">*</span></Label><Input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div>
            <div className="space-y-2"><Label>Last Name <span className="text-destructive">*</span></Label><Input value={lastName} onChange={(event) => setLastName(event.target.value)} /></div>
            <div className="space-y-2"><Label>Job Title</Label><Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <div className="space-y-2"><Label>Mobile No</Label><Input value={mobileNo} onChange={(event) => setMobileNo(event.target.value)} /></div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={(value) => setGender(value as Contact["gender"])}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={addContact} disabled={!contactRequiredValid}>
              {editingContactId ? "Save" : "Add Contact"}
            </Button>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Added Contacts ({contacts.length})</p>
            {contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts added yet.</p> : null}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {contacts.map((contact) => (
                <Card
                  key={contact.id}
                  data-contact-card
                  className={cn(
                    "border-border/60 transition-colors cursor-pointer",
                    editingContactId === contact.id && "border-primary bg-primary/5",
                  )}
                  onClick={() => startEditingContact(contact)}
                >
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-sm truncate">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.jobTitle || "No title"}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email || "No email"}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.mobileNo || "No phone"}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      data-contact-card-action
                      className="shrink-0"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeContact(contact.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={moveBack}><ChevronLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button type="button" onClick={moveNextFromContacts}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </FormSection>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          {selectedExistingCompany ? (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="text-muted-foreground">
                Account and contacts loaded from <span className="font-medium text-foreground">{selectedExistingCompany}</span>. Select products below.
              </p>
            </div>
          ) : null}

          <FormSection title="Products" description="Add one or more products. Each product row requires a package.">
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
                  ? `${product.name}${selectedPackage ? ` · ${selectedPackage.name}` : ""}${selectedPackage ? ` · ${formatPrice(selectedPackage.price, selectedPackage.currency, selectedPackage.billingCycle)}` : ""}`
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
                        disabled={leadProducts.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>

                    <CollapsibleContent>
                      <div className="px-4 pb-4 space-y-5 border-t pt-4">
                        <div className="space-y-2">
                          <Label>Product</Label>
                          <Select value={leadProduct.productId} onValueChange={(value) => selectProductForCard(leadProduct.uid, value)}>
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
                                    className={cn(
                                      "rounded-lg border p-4 text-left transition-all flex flex-col",
                                      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
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
                                      <span className="text-xs text-muted-foreground">{BILLING_CYCLE_LABELS[normalizeBillingCycle(item.billingCycle)]}</span>
                                      <span className="font-bold text-foreground text-sm">{formatAmount(item.price, item.currency)}</span>
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
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm text-foreground font-medium">{addon.name}</div>
                                        {addon.description ? <div className="text-xs text-muted-foreground truncate">{addon.description}</div> : null}
                                      </div>
                                      <span className="text-sm font-medium text-foreground shrink-0">{formatPrice(addon.price, addon.currency, addon.billingCycle)}</span>
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
                disabled={activeProducts.length > 0 && leadProducts.filter((item) => item.productId).length >= activeProducts.length}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-1" /> Add product
              </Button>
            </div>
          </FormSection>

          <DealQualificationCard value={qualification} onChange={setQualification} />

          <FormSection title="Notes">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={5}
              placeholder="Add context notes (optional)"
            />
          </FormSection>

          <div className="flex justify-between gap-2">
            <Button type="button" variant="outline" onClick={moveBack} disabled={isSaving}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button type="button" onClick={() => void createLeadDraft()} disabled={isSaving || !productsValid}>
              {isSaving ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
