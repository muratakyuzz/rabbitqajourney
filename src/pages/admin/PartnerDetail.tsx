import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import {
  deactivatePartner,
  getPartner,
  reactivatePartner,
  updatePartner,
  type Partner as ApiPartner,
} from "@/lib/partners-api";
import { listLeads, type Lead as ApiLead } from "@/lib/leads-api";
import { listDeals, type Deal as ApiDeal } from "@/lib/deals-api";
import {
  deleteDocument,
  getDocumentDownloadMetadata,
  isStorageKeyForPartner,
  listDocuments,
  uploadDocumentViaProxy,
  type DocumentItem,
} from "@/lib/documents-api";
import {
  createContact,
  deleteContact,
  listContacts,
  type ContactRecord,
  updateContact,
} from "@/lib/contacts-api";
import {
  createPartnerNote,
  deletePartnerNote,
  listPartnerNotes,
  type PartnerNote,
} from "@/lib/partner-notes-api";
import {
  listPartnerOnboardingTasks,
  updatePartnerOnboardingTaskStatus,
  type PartnerOnboardingTask,
  type PartnerOnboardingStatus,
} from "@/lib/partner-onboarding-api";
import { StatusBadge } from "@/components/StatusBadge";
import { FormSection } from "@/components/FormSection";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  isPartnerTypeConfigurationEnabled,
  isPartnerTierConfigurationEnabled,
  getAllowedPartnerTierOptions,
  getPartnerTypeOptions,
  isPartnerTierAllowedForType,
  isPartnerTierEnabledType,
} from "@/lib/partner-options";
import { getEffectiveRebate, REBATE_PERIOD_OPTIONS } from "@/lib/partner-config-store";
import { Badge } from "@/components/ui/badge";
import OnboardingChecklist from "@/components/OnboardingChecklist";
import {
  ArrowLeft,
  Check,
  Download,
  FileText,
  Flag,
  FolderOpen,
  Globe,
  Map,
  MapPin,
  Plus,
  Pencil,
  Upload,
  StickyNote,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface PartnerDocument {
  id: string;
  fileName: string;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  storageKey: string;
}

interface PartnerForm {
  name: string;
  status: "active" | "inactive";
  partnerType: string;
  partnerTier: string;
  website: string;
  country: string;
  city: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  loginPortalEnabled: boolean;
}

interface AccountRow {
  id: string;
  companyName: string;
  industry: string;
  country: string;
}

const COUNTRY_CITY_MAP: Record<string, string[]> = {
  "United States": ["New York", "Austin", "San Francisco"],
  "United Kingdom": ["London", "Manchester", "Bristol"],
  Germany: ["Berlin", "Munich", "Hamburg"],
  France: ["Paris", "Lyon", "Marseille"],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  Australia: ["Sydney", "Melbourne", "Brisbane"],
  Netherlands: ["Amsterdam", "Rotterdam", "Utrecht"],
  Spain: ["Madrid", "Barcelona", "Valencia"],
  Italy: ["Milan", "Rome", "Turin"],
  Japan: ["Tokyo", "Osaka", "Nagoya"],
  India: ["Bengaluru", "Mumbai", "Pune"],
  Brazil: ["Sao Paulo", "Rio de Janeiro", "Curitiba"],
  Singapore: ["Central Region", "North Region", "West Region"],
};

const countries = Object.keys(COUNTRY_CITY_MAP);

function extractLeadField(description: string | null | undefined, fieldName: string) {
  if (!description) {
    return null;
  }

  const match = description.match(new RegExp(`(?:^|\\n)\\s*${fieldName}:\\s*(.+)`, "i"));
  return match?.[1]?.trim() ?? null;
}

function buildAccountsFromLeads(leads: ApiLead[]): AccountRow[] {
  return leads.map((lead) => ({
    id: lead.id,
    companyName: lead.title?.trim() || "—",
    industry: extractLeadField(lead.description, "Industry") ?? "—",
    country: extractLeadField(lead.description, "Country") ?? "—",
  }));
}

function toDateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatContactName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function getDocumentType(fileName: string) {
  const extension = fileName.split(".").pop()?.trim();
  return extension ? extension.toUpperCase() : "FILE";
}

function mapContactToForm(contact: ContactRecord): ContactForm {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone ?? "",
    jobTitle: contact.jobTitle ?? "",
    loginPortalEnabled: contact.loginPortalEnabled,
  };
}

function mapDocumentToPartnerDocument(document: DocumentItem): PartnerDocument {
  return {
    id: document.id,
    fileName: document.fileName,
    type: getDocumentType(document.fileName),
    uploadDate: document.createdAt,
    uploadedBy: document.uploadedByEmail ?? document.uploadedByUserId,
    storageKey: document.storageKey,
  };
}

function mapPartnerNote(note: PartnerNote): Note {
  return {
    id: note.id,
    content: note.content,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    createdBy: note.createdBy,
  };
}

function partnerToForm(partner: ApiPartner | null): PartnerForm {
  return {
    name: partner?.name ?? "",
    status: partner?.status === "ACTIVE" ? "active" : "inactive",
    partnerType: partner?.partnerType ?? "",
    partnerTier: partner?.partnerTier ?? "",
    website: partner?.website ?? "",
    country: partner?.country ?? "",
    city: partner?.city ?? "",
    address: partner?.address ?? "",
    createdAt: toDateInputValue(partner?.createdAt),
    updatedAt: toDateInputValue(partner?.updatedAt),
  };
}

function RebateSummary({
  enabled,
  percent,
  periodLabel,
  source,
}: {
  enabled: boolean;
  percent: number;
  periodLabel: string;
  source: "tier" | "type" | "none";
}) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground">Rebate</p>
          {enabled ? (
            <p className="text-sm font-medium text-foreground">
              {percent}% · {periodLabel}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (from {source === "tier" ? "Partner Tier" : "Partner Type"})
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Not enabled</p>
          )}
        </div>
        <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Active" : "Disabled"}</Badge>
      </div>
    </div>
  );
}

function normalizeNullableString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function contactToInput(form: ContactForm, partnerId: string) {
  return {
    partnerId,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    phone: normalizeNullableString(form.phone),
    jobTitle: normalizeNullableString(form.jobTitle),
    loginPortalEnabled: form.loginPortalEnabled,
  };
}

export default function AdminPartnerDetail() {
  const { partnerId } = useParams();
  const navigate = useNavigate();
  const { token, isLoading: authLoading } = useAuth();

  const [partner, setPartner] = useState<ApiPartner | null>(null);
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [deals, setDeals] = useState<ApiDeal[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [onboardingTasks, setOnboardingTasks] = useState<PartnerOnboardingTask[]>([]);
  const [isOnboardingEnabled, setIsOnboardingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(false);
  const [updatingOnboardingTaskId, setUpdatingOnboardingTaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isContactSaving, setIsContactSaving] = useState(false);
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [isContactDeleteOpen, setIsContactDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [contactDialogMode, setContactDialogMode] = useState<"create" | "edit">("create");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactEditingId, setContactEditingId] = useState<string | null>(null);
  const [contactDeleting, setContactDeleting] = useState<ContactRecord | null>(null);
  const [contactFormError, setContactFormError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteFormError, setNoteFormError] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    jobTitle: "",
    loginPortalEnabled: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [partnerForm, setPartnerForm] = useState<PartnerForm>(() => partnerToForm(null));
  const [savedForm, setSavedForm] = useState<PartnerForm>(partnerForm);

  useEffect(() => {
    setLeads([]);
    setDeals([]);
    setContacts([]);
    setDocuments([]);
    setNotes([]);
    setOnboardingTasks([]);
    setIsOnboardingEnabled(true);
    setContactsError(null);
    setNotesError(null);
    setDocumentsError(null);
    setOnboardingError(null);
    setIsEditing(false);
    setContactDialogOpen(false);
    setContactDeleting(null);
    setContactFormError(null);
    setContactEditingId(null);
    setContactDialogMode("create");
    setUploadDialogOpen(false);
    setUploadFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setNoteContent("");
    setNoteFormError(null);
  }, [partnerId]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token || !partnerId) {
      setIsLoading(false);
      setError("Authentication required");
      return;
    }

    let isActive = true;

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPartner(token, partnerId);
        if (!isActive) {
          return;
        }

        setPartner(data);
        const form = partnerToForm(data);
        setPartnerForm(form);
        setSavedForm(form);
      } catch (err) {
        if (!isActive) {
          return;
        }

        if (err instanceof ApiClientError && err.status === 404) {
          setError("Partner not found.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to load partner");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [authLoading, partnerId, token]);

  const loadDocuments = useCallback(async () => {
    if (!token || !partnerId || !partner) {
      return;
    }

    try {
      const documentsResult = await listDocuments(token, { partnerId });
      const partnerDocuments = documentsResult.filter((document) => isStorageKeyForPartner(document.storageKey, partnerId));
      setDocuments(partnerDocuments.map(mapDocumentToPartnerDocument));
      setDocumentsError(null);
    } catch (err) {
      setDocuments([]);
      setDocumentsError(err instanceof Error ? err.message : "Documents could not be loaded from the backend.");
    }
  }, [partner, partnerId, token]);

  useEffect(() => {
    if (authLoading || !token || !partnerId || !partner) {
      return;
    }

    let isActive = true;

    (async () => {
      const [leadResult, dealResult] = await Promise.allSettled([
        listLeads(token, { partnerId }),
        listDeals(token, { partnerId }),
      ]);

      if (!isActive) {
        return;
      }

      const nextLeads = leadResult.status === "fulfilled" ? leadResult.value : [];
      const nextDeals = dealResult.status === "fulfilled" ? dealResult.value : [];

      setLeads(nextLeads);
      setDeals(nextDeals);
    })();

    void loadDocuments();

    return () => {
      isActive = false;
    };
  }, [authLoading, loadDocuments, partner, partnerId, token]);

  const loadNotes = useCallback(async () => {
    if (!token || !partnerId || !partner) {
      return;
    }

    setIsNotesLoading(true);
    setNotesError(null);

    try {
      const nextNotes = await listPartnerNotes(token, partnerId);
      setNotes(nextNotes.map(mapPartnerNote));
    } catch (err) {
      setNotes([]);
      setNotesError(err instanceof Error ? err.message : "Notes could not be loaded from the backend.");
    } finally {
      setIsNotesLoading(false);
    }
  }, [partner, partnerId, token]);

  const loadContacts = useCallback(async () => {
    if (!token || !partnerId || !partner) {
      return;
    }

    setIsContactsLoading(true);
    setContactsError(null);

    try {
      const nextContacts = await listContacts(token, { partnerId });
      setContacts(nextContacts);
    } catch (err) {
      setContacts([]);
      setContactsError(err instanceof Error ? err.message : "Contacts could not be loaded from the backend.");
    } finally {
      setIsContactsLoading(false);
    }
  }, [partner, partnerId, token]);

  const loadOnboardingTasks = useCallback(async () => {
    if (!token || !partnerId || !partner) {
      return;
    }

    setIsOnboardingLoading(true);
    setOnboardingError(null);

    try {
      const onboarding = await listPartnerOnboardingTasks(token, partnerId);
      setIsOnboardingEnabled(onboarding.enabled);
      setOnboardingTasks(onboarding.tasks);
    } catch (err) {
      setOnboardingTasks([]);
      setIsOnboardingEnabled(true);
      setOnboardingError(err instanceof Error ? err.message : "Onboarding tasks could not be loaded.");
    } finally {
      setIsOnboardingLoading(false);
    }
  }, [partner, partnerId, token]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    void loadOnboardingTasks();
  }, [loadOnboardingTasks]);

  const accounts = useMemo(() => buildAccountsFromLeads(leads), [leads]);

  const handleOnboardingStatusChange = async (taskId: string, status: PartnerOnboardingStatus) => {
    if (!token || !partnerId) {
      return;
    }

    setUpdatingOnboardingTaskId(taskId);
    try {
      const updated = await updatePartnerOnboardingTaskStatus(token, partnerId, taskId, { status });
      setOnboardingTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      toast.success("Onboarding task status updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update onboarding status");
    } finally {
      setUpdatingOnboardingTaskId(null);
    }
  };

  if (isLoading || authLoading) {
    return <LoadingState variant="detail" />;
  }

  if (error || !partner) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <ErrorState title="Partner unavailable" description={error ?? "Partner not found."} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const currentPartnerType = isEditing ? partnerForm.partnerType : savedForm.partnerType;
  const currentPartnerTier = isEditing ? partnerForm.partnerTier : savedForm.partnerTier;
  const isPartnerTypeEnabled = isPartnerTypeConfigurationEnabled();
  const isPartnerTierEnabled = isPartnerTierConfigurationEnabled();
  const partnerTypeOptions = getPartnerTypeOptions();
  const isTierEnabledType = isPartnerTierEnabledType(currentPartnerType);
  const allowedTiers = getAllowedPartnerTierOptions(currentPartnerType);
  const displayPartnerType = currentPartnerType || "N/A";
  const displayPartnerTier = isTierEnabledType ? (currentPartnerTier || "N/A") : "N/A";
  const effectiveRebate = getEffectiveRebate(currentPartnerType, isTierEnabledType ? currentPartnerTier : null);
  const rebatePeriodLabel = REBATE_PERIOD_OPTIONS.find((o) => o.value === effectiveRebate.period)?.label ?? effectiveRebate.period;

  const handleEditToggle = () => {
    if (isEditing) {
      setPartnerForm(savedForm);
    }
    setIsEditing((current) => !current);
  };

  const handleSave = async () => {
    if (!token || !partnerId || !partner) {
      return;
    }

    setIsSaving(true);

    try {
      let nextPartner = partner;
      const canEditClassification = isPartnerTypeEnabled;
      const canEditTier = isPartnerTypeEnabled && isPartnerTierEnabled;
      const nextPartnerType = canEditClassification ? partnerForm.partnerType || null : partner.partnerType ?? null;
      const nextPartnerTier = canEditTier && isPartnerTierAllowedForType(partnerForm.partnerType, partnerForm.partnerTier)
        ? partnerForm.partnerTier || null
        : partner.partnerTier ?? null;
      const trimmedName = partnerForm.name.trim();

      const supportedFieldsChanged =
        nextPartner.name !== trimmedName ||
        (canEditClassification && (nextPartner.partnerType ?? "") !== (nextPartnerType ?? "")) ||
        (canEditTier && (nextPartner.partnerTier ?? "") !== (nextPartnerTier ?? "")) ||
        (nextPartner.website ?? "") !== partnerForm.website.trim() ||
        (nextPartner.country ?? "") !== partnerForm.country.trim() ||
        (nextPartner.city ?? "") !== partnerForm.city.trim() ||
        (nextPartner.address ?? "") !== partnerForm.address.trim();

      if (supportedFieldsChanged) {
        nextPartner = await updatePartner(token, partnerId, {
          name: trimmedName,
          partnerType: canEditClassification ? nextPartnerType : undefined,
          partnerTier: canEditTier ? nextPartnerTier : undefined,
          website: normalizeNullableString(partnerForm.website),
          country: normalizeNullableString(partnerForm.country),
          city: normalizeNullableString(partnerForm.city),
          address: normalizeNullableString(partnerForm.address),
        });
      }

      const desiredStatus = partnerForm.status === "active" ? "ACTIVE" : "INACTIVE";
      if (nextPartner.status !== desiredStatus) {
        nextPartner = desiredStatus === "ACTIVE"
          ? await reactivatePartner(token, partnerId)
          : await deactivatePartner(token, partnerId);
      }

      setPartner(nextPartner);
      const refreshedForm = partnerToForm(nextPartner);
      setPartnerForm(refreshedForm);
      setSavedForm(refreshedForm);
      setIsEditing(false);
      toast.success("Partner details saved to backend");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save partner details");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (field: keyof PartnerForm, value: string) => {
    setPartnerForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChange = (checked: boolean) => {
    setPartnerForm((prev) => ({
      ...prev,
      status: checked ? "active" : "inactive",
    }));
  };

  const handleCountryChange = (value: string) => {
    setPartnerForm((prev) => ({
      ...prev,
      country: value,
      city: COUNTRY_CITY_MAP[value]?.includes(prev.city) ? prev.city : "",
    }));
  };

  const handlePartnerTypeChange = (value: string) => {
    setPartnerForm((prev) => ({
      ...prev,
      partnerType: value,
      partnerTier: isPartnerTierAllowedForType(value, prev.partnerTier) ? prev.partnerTier : "",
    }));
  };

  const handleContactFieldChange = (field: keyof Omit<ContactForm, "loginPortalEnabled">, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
    if (contactFormError) {
      setContactFormError(null);
    }
  };

  const handleLoginPortalChange = (checked: boolean) => {
    setContactForm((prev) => ({ ...prev, loginPortalEnabled: checked }));
    if (contactFormError) {
      setContactFormError(null);
    }
  };

  const openCreateContactDialog = () => {
    setContactDialogMode("create");
    setContactEditingId(null);
    setContactForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      loginPortalEnabled: false,
    });
    setContactFormError(null);
    setContactDialogOpen(true);
  };

  const openEditContactDialog = (contact: ContactRecord) => {
    setContactDialogMode("edit");
    setContactEditingId(contact.id);
    setContactForm(mapContactToForm(contact));
    setContactFormError(null);
    setContactDialogOpen(true);
  };

  const handleContactDialogOpenChange = (open: boolean) => {
    setContactDialogOpen(open);
    if (!open) {
      setContactDialogMode("create");
      setContactEditingId(null);
      setContactFormError(null);
    }
  };

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    if (!token || !partnerId) {
      return;
    }

    if (!contactForm.firstName.trim() || !contactForm.lastName.trim() || !contactForm.email.trim()) {
      setContactFormError("First name, last name, and email are required.");
      return;
    }

    setIsContactSaving(true);
    setContactFormError(null);

    try {
      const input = contactToInput(contactForm, partnerId);

      if (contactDialogMode === "create") {
        await createContact(token, input);
        toast.success("Contact created");
      } else if (contactEditingId) {
        await updateContact(token, contactEditingId, input);
        toast.success("Contact updated");
      }

      await loadContacts();
      setContactDialogOpen(false);
      setContactEditingId(null);
      setContactDialogMode("create");
      setContactForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: "",
        loginPortalEnabled: false,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save contact");
    } finally {
      setIsContactSaving(false);
    }
  };

  const handleNoteContentChange = (value: string) => {
    setNoteContent(value);
    if (noteFormError) {
      setNoteFormError(null);
    }
  };

  const handleAddNote = async () => {
    if (!token || !partnerId) {
      return;
    }

    if (!noteContent.trim()) {
      setNoteFormError("Note content is required.");
      return;
    }

    setIsNoteSaving(true);
    setNoteFormError(null);

    try {
      await createPartnerNote(token, partnerId, { content: noteContent.trim() });
      toast.success("Note added");
      setNoteContent("");
      await loadNotes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!token || !partnerId) {
      return;
    }

    setIsNoteSaving(true);

    try {
      await deletePartnerNote(token, partnerId, noteId);
      toast.success("Note deleted");
      await loadNotes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setIsNoteSaving(false);
    }
  };

  const requestDeleteContact = (contact: ContactRecord) => {
    setContactDeleting(contact);
    setIsContactDeleteOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!token || !contactDeleting) {
      return;
    }

    setIsContactSaving(true);

    try {
      await deleteContact(token, contactDeleting.id);
      toast.success("Contact deleted");
      setIsContactDeleteOpen(false);
      setContactDeleting(null);
      await loadContacts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contact");
    } finally {
      setIsContactSaving(false);
    }
  };

  const handleDownloadDocument = async (documentId: string) => {
    if (!token) {
      return;
    }

    try {
      const metadata = await getDocumentDownloadMetadata(token, documentId);
      if (metadata.downloadUrl) {
        window.open(metadata.downloadUrl, "_blank", "noopener,noreferrer");
        toast.success("Download opened");
        return;
      }

      toast.success(`Download metadata ready: ${metadata.storageKey}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to access download metadata");
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!token) {
      return;
    }

    try {
      await deleteDocument(token, documentId);
      setDocuments((prev) => prev.filter((document) => document.id !== documentId));
      toast.success("Document deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete document");
    }
  };

  const openUploadDocumentDialog = () => {
    setUploadDialogOpen(true);
    setUploadFile(null);
    setUploadProgress(0);
  };

  const handleUploadDialogOpenChange = (open: boolean) => {
    if (isUploading) {
      return;
    }

    setUploadDialogOpen(open);
    if (!open) {
      setUploadFile(null);
      setUploadProgress(0);
    }
  };

  const handleUploadStart = async () => {
    if (!token || !uploadFile || !partnerId) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(45);
      const createdDocument = await uploadDocumentViaProxy(token, uploadFile, { partnerId });
      if (!isStorageKeyForPartner(createdDocument.storageKey, partnerId)) {
        await deleteDocument(token, createdDocument.id).catch(() => undefined);
        throw new Error("Partner document upload scope is misconfigured. Please restart backend and try again.");
      }
      setUploadProgress(80);
      await loadDocuments();

      setUploadProgress(100);
      setUploadDialogOpen(false);
      setUploadFile(null);
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-7xl space-y-6">
      <button onClick={() => navigate("/app/admin/partners")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Partners
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">{isEditing ? partnerForm.name || partner.name : savedForm.name}</h1>
          <StatusBadge status={isEditing ? partnerForm.status : savedForm.status} />
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleEditToggle} disabled={isSaving}>
                <X className="mr-1 h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || !partnerForm.name.trim()}>
                <Check className="mr-1 h-4 w-4" /> {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={handleEditToggle}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-lg border bg-card p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">Organization Details</h3>
              </div>
              <div className="flex items-center gap-3 lg:ml-auto lg:justify-end">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{partnerForm.status === "active" ? "Active" : "Inactive"}</p>
                    <Switch
                      checked={partnerForm.status === "active"}
                      onCheckedChange={handleStatusChange}
                      disabled={isSaving}
                      aria-label="Partner status"
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Company Name</Label>
                  <Input id="name" value={partnerForm.name} onChange={(e) => handleFormChange("name", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={partnerForm.website} onChange={(e) => handleFormChange("website", e.target.value)} placeholder="Enter website" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    rows={2}
                    value={partnerForm.address}
                    onChange={(e) => handleFormChange("address", e.target.value)}
                    placeholder="Enter address"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Country</Label>
                  <Select value={partnerForm.country || undefined} onValueChange={handleCountryChange}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={partnerForm.city || undefined}
                    onValueChange={(value) => handleFormChange("city", value)}
                    disabled={!partnerForm.country}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder={partnerForm.country ? "Select city" : "Select country first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(COUNTRY_CITY_MAP[partnerForm.country] ?? []).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { icon: Globe, label: "Website", value: savedForm.website || "—" },
                  { icon: MapPin, label: "Address", value: savedForm.address || "—" },
                  { icon: Flag, label: "Country", value: savedForm.country || "—" },
                  { icon: Map, label: "City", value: savedForm.city || "—" },
                ].map((field) => (
                  <div key={field.label} className="flex items-start gap-3">
                    <field.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{field.label}</p>
                      <p className="text-sm font-medium text-foreground">{field.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end border-t border-border/60 pt-3">
              <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                <span>
                  Joined on <span className="font-medium text-foreground">{formatDate(savedForm.createdAt || partnerForm.createdAt)}</span>
                </span>
                <span>
                  Last profile update <span className="font-medium text-foreground">{formatDate(savedForm.updatedAt || partnerForm.updatedAt)}</span>
                </span>
              </div>
            </div>
          </div>

          {isPartnerTypeEnabled ? (
            <FormSection title="Partner Classification">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="partnerType">Partner Type</Label>
                    <Select value={partnerForm.partnerType} onValueChange={handlePartnerTypeChange} disabled={partnerTypeOptions.length === 0}>
                      <SelectTrigger id="partnerType">
                        <SelectValue placeholder={partnerTypeOptions.length === 0 ? "Partner type is disabled in Configure" : "Select partner type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {partnerTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isPartnerTierEnabled ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="partnerTier">Partner Tier</Label>
                      <Select
                        value={partnerForm.partnerTier}
                        onValueChange={(value) => handleFormChange("partnerTier", value)}
                        disabled={!isPartnerTierEnabledType(partnerForm.partnerType)}
                      >
                        <SelectTrigger id="partnerTier">
                          <SelectValue placeholder={isPartnerTierEnabledType(partnerForm.partnerType) ? "Select partner tier" : "Tier available for Reseller and Technology only"} />
                        </SelectTrigger>
                        <SelectContent>
                          {allowedTiers.map((tier) => (
                            <SelectItem key={tier} value={tier}>
                              {tier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  </div>
                  <RebateSummary
                    enabled={effectiveRebate.enabled}
                    percent={effectiveRebate.percent}
                    periodLabel={rebatePeriodLabel}
                    source={effectiveRebate.source}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Partner Type</p>
                    <p className="text-sm font-medium text-foreground">{displayPartnerType}</p>
                  </div>
                  {isPartnerTierEnabled ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Partner Tier</p>
                      <p className="text-sm font-medium text-foreground">{displayPartnerTier}</p>
                    </div>
                  ) : null}
                  </div>
                  <RebateSummary
                    enabled={effectiveRebate.enabled}
                    percent={effectiveRebate.percent}
                    periodLabel={rebatePeriodLabel}
                    source={effectiveRebate.source}
                  />
                </div>
              )}
            </FormSection>
          ) : null}
        </div>

        <div className="xl:sticky xl:top-20 h-fit">
          {isOnboardingEnabled ? (
            <OnboardingChecklist
              tasks={onboardingTasks.map((task) => ({
                id: task.id,
                title: task.title,
                description: task.description,
                status: task.status,
              }))}
              loading={isOnboardingLoading}
              editable
              showFallbackWhenEmpty={false}
              updatingTaskId={updatingOnboardingTaskId}
              onStatusChange={handleOnboardingStatusChange}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h3 className="text-base font-semibold text-card-foreground">Onboarding</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                N/A - Onboarding is disabled in Configure.
              </p>
            </div>
          )}
          {onboardingError ? <p className="mt-2 text-xs text-destructive">{onboardingError}</p> : null}
        </div>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
          {[
            { value: "accounts", label: `Accounts (${accounts.length})`, icon: Zap },
            { value: "contacts", label: `Contacts (${contacts.length})`, icon: Users },
            { value: "notes", label: `Notes (${notes.length})`, icon: StickyNote },
            { value: "documents", label: `Documents (${documents.length})`, icon: FolderOpen },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-3 text-left font-medium text-muted-foreground">Company Name</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Industry</th>
                      <th className="p-3 text-left font-medium text-muted-foreground">Country</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-10 text-center text-sm text-muted-foreground">
                          No account records yet.
                        </td>
                      </tr>
                    ) : (
                      accounts.map((account) => (
                        <tr key={account.id} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium text-foreground">{account.companyName}</td>
                          <td className="p-3 text-muted-foreground">{account.industry}</td>
                          <td className="p-3 text-muted-foreground">{account.country}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={openCreateContactDialog}
              disabled={isContactSaving || isContactsLoading}
            >
              <Users className="mr-1 h-4 w-4" /> Add contact
            </Button>
          </div>

          {contactsError ? <ErrorState title="Contacts unavailable" description={contactsError} /> : null}

          {isContactsLoading ? (
            <Card className="shadow-card">
              <CardContent className="p-4 text-sm text-muted-foreground">Loading contacts...</CardContent>
            </Card>
          ) : null}

          {!contactsError && !isContactsLoading ? (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Phone</th>
                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-10 text-center">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-foreground">No contact add yet</p>
                              <p className="text-sm text-muted-foreground">
                                Create the first partner contact to get started.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        contacts.map((contact) => (
                          <tr key={contact.id} className="border-b border-border last:border-0">
                            <td className="p-3">
                              <div className="space-y-0.5">
                                <p className="font-medium text-foreground">{formatContactName(contact.firstName, contact.lastName)}</p>
                                <p className="text-xs text-muted-foreground">{contact.jobTitle ?? "—"}</p>
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">{contact.email}</td>
                            <td className="p-3 text-muted-foreground">{contact.phone ?? "—"}</td>
                            <td className="space-x-1 p-3 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => openEditContactDialog(contact)}
                                disabled={isContactSaving || isContactsLoading}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => requestDeleteContact(contact)}
                                disabled={isContactSaving || isContactsLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <Dialog open={contactDialogOpen} onOpenChange={handleContactDialogOpenChange}>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <DialogHeader>
                <DialogTitle>{contactDialogMode === "create" ? "Add contact" : "Edit contact"}</DialogTitle>
                <DialogDescription>
                  {contactDialogMode === "create"
                    ? "Create a new contact for this partner using the backend contacts API."
                    : "Update the contact profile fields stored in the backend contacts API."}
                </DialogDescription>
              </DialogHeader>

              {contactFormError ? (
                <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {contactFormError}
                </p>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-first-name">First Name</Label>
                  <Input
                    id="contact-first-name"
                    value={contactForm.firstName}
                    onChange={(event) => handleContactFieldChange("firstName", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-last-name">Last Name</Label>
                  <Input
                    id="contact-last-name"
                    value={contactForm.lastName}
                    onChange={(event) => handleContactFieldChange("lastName", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactForm.email}
                    onChange={(event) => handleContactFieldChange("email", event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-phone">Phone</Label>
                  <Input
                    id="contact-phone"
                    value={contactForm.phone}
                    onChange={(event) => handleContactFieldChange("phone", event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-job-title">Job Title</Label>
                  <Input
                    id="contact-job-title"
                    value={contactForm.jobTitle}
                    onChange={(event) => handleContactFieldChange("jobTitle", event.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div className="space-y-1">
                      <Label htmlFor="contact-login-portal">Login Portal</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow this contact to have a linked partner portal login.
                      </p>
                    </div>
                    <Switch
                      id="contact-login-portal"
                      checked={contactForm.loginPortalEnabled}
                      onCheckedChange={handleLoginPortalChange}
                      aria-label="Login portal access"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleContactDialogOpenChange(false)}
                  disabled={isContactSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isContactSaving}>
                  {isContactSaving ? "Saving..." : contactDialogMode === "create" ? "Create contact" : "Save contact"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isContactDeleteOpen}
          onOpenChange={(open) => {
            setIsContactDeleteOpen(open);
            if (!open) {
              setContactDeleting(null);
            }
          }}
          title="Delete contact?"
          description={
            contactDeleting
              ? `This will remove ${formatContactName(contactDeleting.firstName, contactDeleting.lastName) || contactDeleting.email} from the partner contacts list.`
              : "This will remove the selected contact from the partner contacts list."
          }
          confirmLabel={isContactSaving ? "Deleting..." : "Delete"}
          variant="destructive"
          onConfirm={handleDeleteContact}
        />

        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              <Textarea
                placeholder="Write a note..."
                value={noteContent}
                onChange={(event) => handleNoteContentChange(event.target.value)}
                rows={3}
              />
              {noteFormError ? <p className="text-sm text-destructive">{noteFormError}</p> : null}
              <Button onClick={() => void handleAddNote()} disabled={isNoteSaving || isNotesLoading || !noteContent.trim()} size="sm">
                <Plus className="mr-1 h-4 w-4" /> {isNoteSaving ? "Saving..." : "Add Note"}
              </Button>
            </CardContent>
          </Card>

          {notesError ? <ErrorState title="Notes unavailable" description={notesError} /> : null}

          {isNotesLoading ? (
            <Card className="shadow-card">
              <CardContent className="p-4 text-sm text-muted-foreground">Loading notes...</CardContent>
            </Card>
          ) : null}

          {!notesError && !isNotesLoading && notes.length === 0 ? (
            <EmptyState
              icon={<StickyNote className="h-8 w-8 text-muted-foreground" />}
              title="No notes yet"
              description="Add notes to keep track of important partner context."
            />
          ) : null}

          {!notesError && !isNotesLoading && notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <Card key={note.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm text-foreground">{note.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {note.createdBy} · {formatDateTime(note.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void handleDeleteNote(note.id)}
                        disabled={isNoteSaving}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openUploadDocumentDialog}>
              <Upload className="mr-1 h-4 w-4" /> Upload Document
            </Button>
          </div>

          {documents.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-8 w-8 text-muted-foreground" />}
              title="No documents uploaded"
              description="Upload documents that should only be visible in this partner record."
            />
          ) : (
            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="p-3 text-left font-medium text-muted-foreground">File Name</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Type</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Upload Date</th>
                        <th className="p-3 text-left font-medium text-muted-foreground">Uploaded By</th>
                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr key={document.id} className="border-b border-border last:border-0">
                          <td className="p-3 font-medium text-foreground">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p>{document.fileName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">{document.type}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(document.uploadDate)}</td>
                          <td className="p-3 text-muted-foreground">{document.uploadedBy}</td>
                          <td className="space-x-1 p-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleDownloadDocument(document.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteDocument(document.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={uploadDialogOpen} onOpenChange={handleUploadDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Select a file to upload it to storage and save the document record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload-document-file">Select File</Label>
              <Input
                id="upload-document-file"
                type="file"
                disabled={isUploading}
                onChange={(event) => {
                  setUploadFile(event.target.files?.[0] ?? null);
                  setUploadProgress(0);
                }}
                className="cursor-pointer"
              />
            </div>

            {uploadFile ? (
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{uploadFile.name}</span>
              </p>
            ) : null}

            {isUploading ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium text-foreground">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setUploadFile(null);
                setUploadProgress(0);
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleUploadStart()} disabled={!uploadFile || isUploading}>
              <Upload className="mr-1 h-4 w-4" /> Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
