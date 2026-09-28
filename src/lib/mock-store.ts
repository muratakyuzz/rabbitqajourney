// ─────────────────────────────────────────────────────────────────────────────
// Centralized in-memory mock store for the entire frontend.
// All *-api.ts modules read/write through this store. Resets on page refresh.
// ─────────────────────────────────────────────────────────────────────────────

import type { Partner } from "@/lib/partners-api";
import type { UserRecord } from "@/lib/users-api";
import type { ContactRecord } from "@/lib/contacts-api";
import type { Lead } from "@/lib/leads-api";
import type { Deal } from "@/lib/deals-api";
import type { DocumentItem } from "@/lib/documents-api";
import type { OnboardingStep } from "@/lib/onboarding-config-api";
import type { PartnerOnboardingTask } from "@/lib/partner-onboarding-api";
import type { PartnerNote } from "@/lib/partner-notes-api";
import type { DashboardSummary } from "@/lib/dashboard-api";

// ── ID + delay helpers ─────────────────────────────────────────────────────
let idCounter = 1000;
export function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).slice(2, 6)}`;
}
export const nowIso = () => new Date().toISOString();
export const delay = (ms = 120) => new Promise((res) => setTimeout(res, ms));

// ── Demo seed users (admin + partner logins) ───────────────────────────────
export const seedAuthUsers = [
  { id: "u-admin-1", email: "admin.local@example.com", role: "ADMIN" as const, partnerId: null, status: "ACTIVE" as const, firstName: "Demo", lastName: "Admin" },
  { id: "u-admin-2", email: "sarah@company.com", role: "ADMIN" as const, partnerId: null, status: "ACTIVE" as const, firstName: "Sarah", lastName: "Chen" },
  { id: "u-admin-3", email: "marcus@company.com", role: "ADMIN" as const, partnerId: null, status: "ACTIVE" as const, firstName: "Marcus", lastName: "Johnson" },
  { id: "u-partner-1", email: "partner.local@example.com", role: "PARTNER_USER" as const, partnerId: "p1", status: "ACTIVE" as const, firstName: "Demo", lastName: "Partner" },
  { id: "u-partner-2", email: "alex@acme.io", role: "PARTNER_USER" as const, partnerId: "p1", status: "ACTIVE" as const, firstName: "Alex", lastName: "Rivera" },
  { id: "u-partner-3", email: "priya@techbridge.com", role: "PARTNER_USER" as const, partnerId: "p2", status: "ACTIVE" as const, firstName: "Priya", lastName: "Patel" },
  { id: "u-partner-4", email: "jordan@dataflow.dev", role: "PARTNER_USER" as const, partnerId: "p4", status: "ACTIVE" as const, firstName: "Jordan", lastName: "Kim" },
  { id: "u-partner-5", email: "elena@cloudnine.co", role: "PARTNER_USER" as const, partnerId: "p3", status: "INACTIVE" as const, firstName: "Elena", lastName: "Vasquez" },
];

// ── Partners ───────────────────────────────────────────────────────────────
export const partners: Partner[] = [
  { id: "p1", name: "Acme Solutions", partnerType: "Reseller", partnerTier: "Gold", website: "https://acme.io", country: "USA", city: "San Francisco", address: "123 Market St", status: "ACTIVE", createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-05-20T10:00:00Z", onboardingEnabled: true, onboardingTotal: 5, onboardingDone: 5, onboardingCompleted: true, onboardingCompletionPercent: 100 },
  { id: "p2", name: "TechBridge Corp", partnerType: "Technology", partnerTier: "Platinum", website: "https://techbridge.com", country: "Germany", city: "Berlin", address: "Alexanderplatz 1", status: "ACTIVE", createdAt: "2024-02-20T09:00:00Z", updatedAt: "2024-04-10T09:00:00Z", onboardingEnabled: true, onboardingTotal: 5, onboardingDone: 3, onboardingCompleted: false, onboardingCompletionPercent: 60 },
  { id: "p3", name: "CloudNine Partners", partnerType: "Referral", partnerTier: null, website: "https://cloudnine.co", country: "UK", city: "London", address: "10 Downing St", status: "INACTIVE", createdAt: "2024-03-10T08:00:00Z", updatedAt: "2024-03-15T08:00:00Z", onboardingEnabled: false, onboardingTotal: 0, onboardingDone: 0, onboardingCompleted: false, onboardingCompletionPercent: null },
  { id: "p4", name: "DataFlow Inc", partnerType: "Reseller", partnerTier: "Silver", website: "https://dataflow.dev", country: "USA", city: "Austin", address: "200 Congress Ave", status: "ACTIVE", createdAt: "2024-04-05T11:00:00Z", updatedAt: "2024-06-01T11:00:00Z", onboardingEnabled: true, onboardingTotal: 5, onboardingDone: 2, onboardingCompleted: false, onboardingCompletionPercent: 40 },
  { id: "p5", name: "NexGen Systems", partnerType: "Technology", partnerTier: "Gold", website: "https://nexgen.tech", country: "Canada", city: "Toronto", address: "1 Front St", status: "ACTIVE", createdAt: "2024-05-12T12:00:00Z", updatedAt: "2024-06-12T12:00:00Z", onboardingEnabled: true, onboardingTotal: 5, onboardingDone: 4, onboardingCompleted: false, onboardingCompletionPercent: 80 },
  { id: "p6", name: "QuantumLeap LLC", partnerType: "Referral", partnerTier: null, website: "https://quantumleap.io", country: "USA", city: "New York", address: "350 5th Ave", status: "ACTIVE", createdAt: "2024-06-01T13:00:00Z", updatedAt: "2024-06-08T13:00:00Z", onboardingEnabled: true, onboardingTotal: 5, onboardingDone: 1, onboardingCompleted: false, onboardingCompletionPercent: 20 },
];

// ── Users ──────────────────────────────────────────────────────────────────
function mkUser(seed: typeof seedAuthUsers[number]): UserRecord {
  const partner = seed.partnerId ? partners.find((p) => p.id === seed.partnerId) : null;
  return {
    id: seed.id,
    email: seed.email,
    role: seed.role,
    partnerId: seed.partnerId,
    status: seed.status,
    firstName: seed.firstName,
    lastName: seed.lastName,
    phone: null,
    jobTitle: seed.role === "ADMIN" ? "Administrator" : "Partner Manager",
    gender: null,
    partnerName: partner?.name ?? null,
    partnerStatus: partner?.status ?? null,
    lastLoginAt: nowIso(),
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: nowIso(),
  };
}
export const users: UserRecord[] = seedAuthUsers.map(mkUser);

// ── Contacts ───────────────────────────────────────────────────────────────
export const contacts: ContactRecord[] = [
  { id: "c1", email: "john@acme.io", partnerId: "p1", status: "ACTIVE", firstName: "John", lastName: "Walker", phone: "+1 555-1100", jobTitle: "VP Sales", loginPortalEnabled: true, linkedUserId: null, partnerName: "Acme Solutions", partnerStatus: "ACTIVE", lastLoginAt: null, createdAt: "2024-02-01T10:00:00Z", updatedAt: "2024-02-01T10:00:00Z" },
  { id: "c2", email: "maria@techbridge.com", partnerId: "p2", status: "ACTIVE", firstName: "Maria", lastName: "Garcia", phone: "+49 30 1234567", jobTitle: "Director", loginPortalEnabled: false, linkedUserId: null, partnerName: "TechBridge Corp", partnerStatus: "ACTIVE", lastLoginAt: null, createdAt: "2024-02-25T10:00:00Z", updatedAt: "2024-02-25T10:00:00Z" },
  { id: "c3", email: "david@dataflow.dev", partnerId: "p4", status: "ACTIVE", firstName: "David", lastName: "Lee", phone: "+1 555-3300", jobTitle: "CTO", loginPortalEnabled: true, linkedUserId: null, partnerName: "DataFlow Inc", partnerStatus: "ACTIVE", lastLoginAt: null, createdAt: "2024-04-15T10:00:00Z", updatedAt: "2024-04-15T10:00:00Z" },
];

// ── Deals (canonical record; leads-api adapts via metadata) ───────────────
export const deals: Deal[] = [
  { id: "D-2001", partnerId: "p1", partnerName: "Acme Solutions", leadId: null, createdByUserId: "u-partner-2", createdByEmail: "alex@acme.io", name: "GlobalTech CRM Migration", status: "OPEN", expectedRevenueAmount: 82000, createdAt: "2024-05-30T10:00:00Z", updatedAt: "2024-06-10T10:00:00Z" },
  { id: "D-2002", partnerId: "p2", partnerName: "TechBridge Corp", leadId: null, createdByUserId: "u-partner-3", createdByEmail: "priya@techbridge.com", name: "StartupXYZ Cloud Setup", status: "WON", expectedRevenueAmount: 30000, createdAt: "2024-05-28T10:00:00Z", updatedAt: "2024-06-01T10:00:00Z" },
  { id: "D-2003", partnerId: "p4", partnerName: "DataFlow Inc", leadId: null, createdByUserId: "u-partner-4", createdByEmail: "jordan@dataflow.dev", name: "RetailMax Analytics POC", status: "OPEN", expectedRevenueAmount: 25000, createdAt: "2024-06-05T10:00:00Z", updatedAt: "2024-06-12T10:00:00Z" },
  { id: "D-2004", partnerId: "p5", partnerName: "NexGen Systems", leadId: null, createdByUserId: "u-admin-2", createdByEmail: "sarah@company.com", name: "FinServe Security Suite", status: "LOST", expectedRevenueAmount: 110000, createdAt: "2024-05-15T10:00:00Z", updatedAt: "2024-06-08T10:00:00Z" },
  { id: "D-2005", partnerId: "p3", partnerName: "CloudNine Partners", leadId: null, createdByUserId: "u-partner-5", createdByEmail: "elena@cloudnine.co", name: "EduTech Migration", status: "WON", expectedRevenueAmount: 55000, createdAt: "2024-04-10T10:00:00Z", updatedAt: "2024-05-20T10:00:00Z" },
  { id: "D-2006", partnerId: "p1", partnerName: "Acme Solutions", leadId: null, createdByUserId: "u-partner-2", createdByEmail: "alex@acme.io", name: "Acme Reseller — HealthPlus Mobile", status: "OPEN", expectedRevenueAmount: 95000, createdAt: "2024-06-08T10:00:00Z", updatedAt: "2024-06-14T10:00:00Z" },
  { id: "D-2007", partnerId: "p6", partnerName: "QuantumLeap LLC", leadId: null, createdByUserId: "u-admin-1", createdByEmail: "admin.local@example.com", name: "QuantumLeap — ERP Integration", status: "OPEN", expectedRevenueAmount: 150000, createdAt: "2024-06-14T10:00:00Z", updatedAt: "2024-06-14T10:00:00Z" },
];

// Lead-flow metadata keyed by deal id (used by deals-flow-adapter)
export type DealFlowMeta = {
  description?: string | null;
  packageType?: "SMALL" | "MEDIUM" | "LARGE";
  addons?: string[];
  status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
};
export const dealFlowMeta: Record<string, DealFlowMeta> = {
  "D-2001": { packageType: "LARGE", addons: ["Devicer"], status: "SUBMITTED", description: "Products:\n1. RabbitQA | Large | Add-ons: Devicer\nNotes:\nKey enterprise migration." },
  "D-2002": { packageType: "MEDIUM", addons: [], status: "APPROVED", description: "Products:\n1. RabbitQA | Medium | Add-ons: none\nNotes:\nClosed cleanly." },
  "D-2003": { packageType: "SMALL", addons: ["Healthcheck"], status: "DRAFT", description: "Products:\n1. RabbitQA | Small | Add-ons: Healthcheck\nNotes:\nPOC negotiation." },
  "D-2004": { packageType: "LARGE", addons: ["Accessibility"], status: "REJECTED", rejectionReason: "Lost to competitor", description: "Products:\n1. RabbitQA | Large | Add-ons: Accessibility\nNotes:\n—" },
  "D-2005": { packageType: "MEDIUM", addons: [], status: "APPROVED", description: "Products:\n1. RabbitQA | Medium | Add-ons: none\nNotes:\nDelivered ahead of schedule." },
  "D-2006": { packageType: "MEDIUM", addons: ["Devicer", "Healthcheck"], status: "SUBMITTED", description: "Products:\n1. RabbitQA | Medium | Add-ons: Devicer, Healthcheck\nNotes:\nMobile patient portal." },
  "D-2007": { packageType: "LARGE", addons: [], status: "DRAFT", description: "Products:\n1. RabbitQA | Large | Add-ons: none\nNotes:\nERP integration scope." },
};

// ── Direct Leads (separate from deals; leads-api uses these directly) ─────
export const leads: Lead[] = [
  { id: "L-1001", partnerId: "p1", partnerName: "Acme Solutions", createdByUserId: "u-partner-2", createdByEmail: "alex@acme.io", title: "Enterprise CRM Migration", description: "Large enterprise looking to migrate from legacy CRM.", packageType: "LARGE", addons: ["Devicer"], status: "SUBMITTED", rejectionReason: null, createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-05T10:00:00Z" },
  { id: "L-1002", partnerId: "p2", partnerName: "TechBridge Corp", createdByUserId: "u-partner-3", createdByEmail: "priya@techbridge.com", title: "Cloud Infrastructure Setup", description: "Startup scaling from 50 to 500 employees.", packageType: "MEDIUM", addons: [], status: "APPROVED", rejectionReason: null, createdAt: "2024-05-15T10:00:00Z", updatedAt: "2024-05-28T10:00:00Z" },
  { id: "L-1003", partnerId: "p4", partnerName: "DataFlow Inc", createdByUserId: "u-partner-4", createdByEmail: "jordan@dataflow.dev", title: "Data Analytics Platform", description: "Real-time analytics for 200+ retail locations.", packageType: "LARGE", addons: ["Healthcheck"], status: "DRAFT", rejectionReason: null, createdAt: "2024-06-10T10:00:00Z", updatedAt: "2024-06-10T10:00:00Z" },
  { id: "L-1004", partnerId: "p1", partnerName: "Acme Solutions", createdByUserId: "u-partner-2", createdByEmail: "alex@acme.io", title: "Security Audit & Compliance", description: "Annual security compliance review.", packageType: "MEDIUM", addons: ["Accessibility"], status: "REJECTED", rejectionReason: "Partner does not have required security certifications.", createdAt: "2024-05-20T10:00:00Z", updatedAt: "2024-06-02T10:00:00Z" },
  { id: "L-1005", partnerId: "p5", partnerName: "NexGen Systems", createdByUserId: "u-admin-2", createdByEmail: "sarah@company.com", title: "Mobile App Development", description: "Patient portal mobile application.", packageType: "MEDIUM", addons: ["Devicer"], status: "SUBMITTED", rejectionReason: null, createdAt: "2024-06-08T10:00:00Z", updatedAt: "2024-06-12T10:00:00Z" },
  { id: "L-1006", partnerId: "p2", partnerName: "TechBridge Corp", createdByUserId: "u-partner-3", createdByEmail: "priya@techbridge.com", title: "ERP Integration", description: "Connect SAP with custom inventory system.", packageType: "LARGE", addons: [], status: "DRAFT", rejectionReason: null, createdAt: "2024-06-14T10:00:00Z", updatedAt: "2024-06-14T10:00:00Z" },
  { id: "L-1007", partnerId: "p4", partnerName: "DataFlow Inc", createdByUserId: "u-partner-4", createdByEmail: "jordan@dataflow.dev", title: "AI Chatbot Implementation", description: "Customer service chatbot with NLP.", packageType: "SMALL", addons: ["Healthcheck"], status: "APPROVED", rejectionReason: null, createdAt: "2024-04-20T10:00:00Z", updatedAt: "2024-05-10T10:00:00Z" },
  { id: "L-1008", partnerId: "p6", partnerName: "QuantumLeap LLC", createdByUserId: "u-admin-1", createdByEmail: "admin.local@example.com", title: "Logistics Optimization", description: "Fleet routing optimization platform.", packageType: "LARGE", addons: ["Devicer", "Accessibility"], status: "SUBMITTED", rejectionReason: null, createdAt: "2024-06-12T10:00:00Z", updatedAt: "2024-06-15T10:00:00Z" },
];

// ── Documents ──────────────────────────────────────────────────────────────
export const documents: DocumentItem[] = [
  { id: "doc1", fileName: "Partner Onboarding Guide v2.pdf", description: "Step-by-step onboarding manual.", storageKey: "documents/partner-onboarding-v2.pdf", contentType: "application/pdf", fileSizeBytes: 1_200_000, uploadedByUserId: "u-admin-2", uploadedByEmail: "sarah@company.com", createdAt: "2024-01-15T10:00:00Z", updatedAt: "2024-01-15T10:00:00Z" },
  { id: "doc2", fileName: "Sales Playbook Q2 2024.pdf", description: "Q2 sales motions & talk tracks.", storageKey: "documents/sales-playbook-q2-2024.pdf", contentType: "application/pdf", fileSizeBytes: 2_500_000, uploadedByUserId: "u-admin-3", uploadedByEmail: "marcus@company.com", createdAt: "2024-04-01T10:00:00Z", updatedAt: "2024-04-01T10:00:00Z" },
  { id: "doc3", fileName: "Technical Integration Specs.docx", description: "API & webhook integration details.", storageKey: "documents/tech-integration-specs.docx", contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", fileSizeBytes: 540_000, uploadedByUserId: "u-admin-2", uploadedByEmail: "sarah@company.com", createdAt: "2024-03-20T10:00:00Z", updatedAt: "2024-03-20T10:00:00Z" },
  { id: "doc4", fileName: "Commission Structure 2024.xlsx", description: "Tier-based commission table.", storageKey: "documents/commission-structure-2024.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileSizeBytes: 88_000, uploadedByUserId: "u-admin-3", uploadedByEmail: "marcus@company.com", createdAt: "2024-01-05T10:00:00Z", updatedAt: "2024-01-05T10:00:00Z" },
  { id: "doc5", fileName: "Brand Guidelines.pdf", description: "Logos, colors, typography.", storageKey: "documents/brand-guidelines.pdf", contentType: "application/pdf", fileSizeBytes: 4_100_000, uploadedByUserId: "u-admin-2", uploadedByEmail: "sarah@company.com", createdAt: "2024-02-10T10:00:00Z", updatedAt: "2024-02-10T10:00:00Z" },
  { id: "doc6", fileName: "API Documentation v3.1.pdf", description: "REST API reference.", storageKey: "documents/api-docs-v3.1.pdf", contentType: "application/pdf", fileSizeBytes: 1_700_000, uploadedByUserId: "u-admin-3", uploadedByEmail: "marcus@company.com", createdAt: "2024-05-15T10:00:00Z", updatedAt: "2024-05-15T10:00:00Z" },
  { id: "doc7", fileName: "Acme Contract Signed.pdf", description: "Signed reseller agreement.", storageKey: "partners/p1/documents/acme-contract.pdf", contentType: "application/pdf", fileSizeBytes: 320_000, uploadedByUserId: "u-admin-2", uploadedByEmail: "sarah@company.com", createdAt: "2024-02-01T10:00:00Z", updatedAt: "2024-02-01T10:00:00Z" },
  { id: "doc8", fileName: "TechBridge NDA.pdf", description: "Mutual NDA.", storageKey: "partners/p2/documents/techbridge-nda.pdf", contentType: "application/pdf", fileSizeBytes: 210_000, uploadedByUserId: "u-admin-2", uploadedByEmail: "sarah@company.com", createdAt: "2024-02-26T10:00:00Z", updatedAt: "2024-02-26T10:00:00Z" },
];

// ── Onboarding configuration (admin-side) ─────────────────────────────────
export const onboardingConfig = {
  enabled: true,
  steps: [
    { id: "ob1", order: 1, title: "Company Profile", description: "Provide company name, address, and contact details.", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
    { id: "ob2", order: 2, title: "Sign Partnership Agreement", description: "Review and sign the standard partnership agreement.", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
    { id: "ob3", order: 3, title: "Complete Sales Training", description: "Watch the sales playbook training videos.", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
    { id: "ob4", order: 4, title: "Technical Certification", description: "Pass the technical certification quiz.", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
    { id: "ob5", order: 5, title: "First Lead Submission", description: "Submit your first qualified lead.", createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" },
  ] as OnboardingStep[],
};

// ── Per-partner onboarding tasks ───────────────────────────────────────────
function buildPartnerTasks(partnerId: string, doneCount: number): PartnerOnboardingTask[] {
  return onboardingConfig.steps.map((step, idx) => ({
    id: `${partnerId}-${step.id}`,
    partnerId,
    order: step.order,
    title: step.title,
    description: step.description,
    status: idx < doneCount ? "DONE" : idx === doneCount ? "CURRENT" : "TODO",
    createdAt: step.createdAt,
    updatedAt: step.updatedAt,
  }));
}
export const partnerOnboardingTasks: Record<string, PartnerOnboardingTask[]> = {
  p1: buildPartnerTasks("p1", 5),
  p2: buildPartnerTasks("p2", 3),
  p3: [],
  p4: buildPartnerTasks("p4", 2),
  p5: buildPartnerTasks("p5", 4),
  p6: buildPartnerTasks("p6", 1),
};

// ── Partner notes ──────────────────────────────────────────────────────────
export const partnerNotes: Record<string, PartnerNote[]> = {
  p1: [
    { id: "pn1", partnerId: "p1", content: "Strong Q2 performance — recommend Platinum upgrade.", createdBy: "sarah@company.com", createdAt: "2024-06-01T10:00:00Z", updatedAt: "2024-06-01T10:00:00Z" },
  ],
  p2: [],
  p3: [],
  p4: [
    { id: "pn2", partnerId: "p4", content: "Onboarding stalled at certification — schedule training session.", createdBy: "marcus@company.com", createdAt: "2024-05-25T10:00:00Z", updatedAt: "2024-05-25T10:00:00Z" },
  ],
  p5: [],
  p6: [],
};

// ── Dashboard summary computed on the fly ─────────────────────────────────
export function computeDashboardSummary(): DashboardSummary {
  const totalLeads = leads.length;
  const activeDeals = deals.filter((d) => d.status === "OPEN").length;
  const expectedRevenue = deals
    .filter((d) => d.status === "OPEN")
    .reduce((sum, d) => sum + (d.expectedRevenueAmount ?? 0), 0);

  const recentActivity: DashboardSummary["recentActivity"] = [
    { occurredAt: "2024-06-15T09:30:00Z", userId: "u-partner-2", user: "Alex Rivera", action: "submitted a lead for", partnerId: "p1", target: "Acme Solutions", targetType: "PARTNER" },
    { occurredAt: "2024-06-14T14:10:00Z", userId: "u-admin-2", user: "Sarah Chen", action: "approved deal", partnerId: "p2", target: "TechBridge Corp", targetType: "PARTNER" },
    { occurredAt: "2024-06-13T11:00:00Z", userId: "u-partner-4", user: "Jordan Kim", action: "uploaded document for", partnerId: "p4", target: "DataFlow Inc", targetType: "PARTNER" },
    { occurredAt: "2024-06-12T08:45:00Z", userId: "u-partner-3", user: "Priya Patel", action: "completed onboarding step for", partnerId: "p2", target: "TechBridge Corp", targetType: "PARTNER" },
    { occurredAt: "2024-06-11T16:20:00Z", userId: "u-admin-3", user: "Marcus Johnson", action: "added partner", partnerId: "p6", target: "QuantumLeap LLC", targetType: "PARTNER" },
  ];

  return { totalLeads, activeDeals, expectedRevenue, recentActivity };
}

// ── Helpers ────────────────────────────────────────────────────────────────
export function refreshPartnerOnboardingStats(partnerId: string) {
  const tasks = partnerOnboardingTasks[partnerId] ?? [];
  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) return;
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  partner.onboardingTotal = total;
  partner.onboardingDone = done;
  partner.onboardingCompletionPercent = total > 0 ? Math.round((done / total) * 100) : null;
  partner.onboardingCompleted = total > 0 && done === total;
  partner.updatedAt = nowIso();
}
