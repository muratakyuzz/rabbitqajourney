// Mock data layer for PRM MVP

export type LeadStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type DealStatus = "OPEN" | "WON" | "LOST";
export type UserRole = "admin" | "partner";

export interface Partner {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  status: "active" | "inactive";
  createdAt: string;
  leadsCount: number;
  dealsCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  partnerId?: string;
  partnerName?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export interface Lead {
  id: string;
  title: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  estimatedValue: number;
  status: LeadStatus;
  partnerId: string;
  partnerName: string;
  notes: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  title: string;
  companyName: string;
  value: number;
  status: DealStatus;
  partnerId: string;
  partnerName: string;
  leadId?: string;
  notes: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  fileName: string;
  storageKey: string;
  category: string;
  uploadedBy: string;
  createdAt: string;
}

export const mockPartners: Partner[] = [
  { id: "p1", name: "Acme Solutions", contactEmail: "contact@acme.io", contactPhone: "+1 555-0101", website: "https://acme.io", status: "active", createdAt: "2024-01-15", leadsCount: 12, dealsCount: 4 },
  { id: "p2", name: "TechBridge Corp", contactEmail: "hello@techbridge.com", contactPhone: "+1 555-0202", website: "https://techbridge.com", status: "active", createdAt: "2024-02-20", leadsCount: 8, dealsCount: 2 },
  { id: "p3", name: "CloudNine Partners", contactEmail: "info@cloudnine.co", contactPhone: "+1 555-0303", website: "https://cloudnine.co", status: "inactive", createdAt: "2024-03-10", leadsCount: 3, dealsCount: 1 },
  { id: "p4", name: "DataFlow Inc", contactEmail: "sales@dataflow.dev", contactPhone: "+1 555-0404", website: "https://dataflow.dev", status: "active", createdAt: "2024-04-05", leadsCount: 15, dealsCount: 6 },
  { id: "p5", name: "NexGen Systems", contactEmail: "contact@nexgen.tech", contactPhone: "+1 555-0505", website: "https://nexgen.tech", status: "active", createdAt: "2024-05-12", leadsCount: 6, dealsCount: 3 },
];

export const mockUsers: User[] = [
  { id: "u0a", name: "Demo Admin", email: "admin.local@example.com", role: "admin", status: "active", createdAt: "2024-01-01" },
  { id: "u0p", name: "Demo Partner", email: "partner.local@example.com", role: "partner", partnerId: "p1", partnerName: "Acme Solutions", status: "active", createdAt: "2024-01-01" },
  { id: "u1", name: "Sarah Chen", email: "sarah@company.com", role: "admin", status: "active", createdAt: "2024-01-01" },
  { id: "u2", name: "Marcus Johnson", email: "marcus@company.com", role: "admin", status: "active", createdAt: "2024-01-01" },
  { id: "u3", name: "Alex Rivera", email: "alex@acme.io", role: "partner", partnerId: "p1", partnerName: "Acme Solutions", status: "active", createdAt: "2024-01-20" },
  { id: "u4", name: "Priya Patel", email: "priya@techbridge.com", role: "partner", partnerId: "p2", partnerName: "TechBridge Corp", status: "active", createdAt: "2024-02-25" },
  { id: "u5", name: "Jordan Kim", email: "jordan@dataflow.dev", role: "partner", partnerId: "p4", partnerName: "DataFlow Inc", status: "active", createdAt: "2024-04-10" },
  { id: "u6", name: "Elena Vasquez", email: "elena@cloudnine.co", role: "partner", partnerId: "p3", partnerName: "CloudNine Partners", status: "inactive", createdAt: "2024-03-15" },
];

export const mockLeads: Lead[] = [
  { id: "L-1001", title: "Enterprise CRM Migration", companyName: "GlobalTech Industries", contactName: "John Smith", contactEmail: "john@globaltech.com", contactPhone: "+1 555-1001", estimatedValue: 85000, status: "SUBMITTED", partnerId: "p1", partnerName: "Acme Solutions", notes: "Large enterprise looking to migrate from legacy CRM.", createdAt: "2024-06-01", updatedAt: "2024-06-05" },
  { id: "L-1002", title: "Cloud Infrastructure Setup", companyName: "StartupXYZ", contactName: "Maria Garcia", contactEmail: "maria@startupxyz.com", contactPhone: "+1 555-1002", estimatedValue: 32000, status: "APPROVED", partnerId: "p2", partnerName: "TechBridge Corp", notes: "Startup scaling from 50 to 500 employees.", createdAt: "2024-05-15", updatedAt: "2024-05-28" },
  { id: "L-1003", title: "Data Analytics Platform", companyName: "RetailMax", contactName: "David Lee", contactEmail: "david@retailmax.com", contactPhone: "+1 555-1003", estimatedValue: 120000, status: "DRAFT", partnerId: "p4", partnerName: "DataFlow Inc", notes: "Need real-time analytics for 200+ retail locations.", createdAt: "2024-06-10", updatedAt: "2024-06-10" },
  { id: "L-1004", title: "Security Audit & Compliance", companyName: "FinServe Bank", contactName: "Rachel Wong", contactEmail: "rachel@finserve.com", contactPhone: "+1 555-1004", estimatedValue: 65000, status: "REJECTED", partnerId: "p1", partnerName: "Acme Solutions", notes: "Annual security compliance review.", rejectionReason: "Partner does not have required security certifications for financial institutions.", createdAt: "2024-05-20", updatedAt: "2024-06-02" },
  { id: "L-1005", title: "Mobile App Development", companyName: "HealthPlus", contactName: "Tom Anderson", contactEmail: "tom@healthplus.io", contactPhone: "+1 555-1005", estimatedValue: 95000, status: "SUBMITTED", partnerId: "p5", partnerName: "NexGen Systems", notes: "Patient portal mobile application.", createdAt: "2024-06-08", updatedAt: "2024-06-12" },
  { id: "L-1006", title: "ERP Integration", companyName: "ManuCo", contactName: "Lisa Chen", contactEmail: "lisa@manuco.com", contactPhone: "+1 555-1006", estimatedValue: 150000, status: "DRAFT", partnerId: "p2", partnerName: "TechBridge Corp", notes: "Connect SAP with custom inventory system.", createdAt: "2024-06-14", updatedAt: "2024-06-14" },
  { id: "L-1007", title: "AI Chatbot Implementation", companyName: "ServiceFirst", contactName: "Mike Brown", contactEmail: "mike@servicefirst.com", contactPhone: "+1 555-1007", estimatedValue: 45000, status: "APPROVED", partnerId: "p4", partnerName: "DataFlow Inc", notes: "Customer service chatbot with NLP.", createdAt: "2024-04-20", updatedAt: "2024-05-10" },
];

export const mockDeals: Deal[] = [
  { id: "D-2001", title: "Acme CRM Implementation", companyName: "GlobalTech Industries", value: 82000, status: "OPEN", partnerId: "p1", partnerName: "Acme Solutions", leadId: "L-1002", notes: "Contract negotiation in progress.", createdAt: "2024-05-30", updatedAt: "2024-06-10" },
  { id: "D-2002", title: "TechBridge Cloud Setup", companyName: "StartupXYZ", value: 30000, status: "WON", partnerId: "p2", partnerName: "TechBridge Corp", leadId: "L-1002", notes: "Successfully closed. Implementation starting Q3.", closedAt: "2024-06-01", createdAt: "2024-05-28", updatedAt: "2024-06-01" },
  { id: "D-2003", title: "DataFlow Analytics POC", companyName: "RetailMax", value: 25000, status: "OPEN", partnerId: "p4", partnerName: "DataFlow Inc", notes: "Proof of concept phase.", createdAt: "2024-06-05", updatedAt: "2024-06-12" },
  { id: "D-2004", title: "NexGen Security Suite", companyName: "FinServe Bank", value: 110000, status: "LOST", partnerId: "p5", partnerName: "NexGen Systems", notes: "Client went with competitor.", closedAt: "2024-06-08", createdAt: "2024-05-15", updatedAt: "2024-06-08" },
  { id: "D-2005", title: "CloudNine Migration", companyName: "EduTech Corp", value: 55000, status: "WON", partnerId: "p3", partnerName: "CloudNine Partners", notes: "Migration completed ahead of schedule.", closedAt: "2024-05-20", createdAt: "2024-04-10", updatedAt: "2024-05-20" },
];

export const mockDocuments: Document[] = [
  { id: "doc1", fileName: "Partner Onboarding Guide v2.pdf", storageKey: "docs/partner-onboarding-v2.pdf", category: "Onboarding", uploadedBy: "Sarah Chen", createdAt: "2024-01-15" },
  { id: "doc2", fileName: "Sales Playbook Q2 2024.pdf", storageKey: "docs/sales-playbook-q2-2024.pdf", category: "Sales", uploadedBy: "Marcus Johnson", createdAt: "2024-04-01" },
  { id: "doc3", fileName: "Technical Integration Specs.docx", storageKey: "docs/tech-integration-specs.docx", category: "Technical", uploadedBy: "Sarah Chen", createdAt: "2024-03-20" },
  { id: "doc4", fileName: "Commission Structure 2024.xlsx", storageKey: "docs/commission-structure-2024.xlsx", category: "Finance", uploadedBy: "Marcus Johnson", createdAt: "2024-01-05" },
  { id: "doc5", fileName: "Brand Guidelines.pdf", storageKey: "docs/brand-guidelines.pdf", category: "Marketing", uploadedBy: "Sarah Chen", createdAt: "2024-02-10" },
  { id: "doc6", fileName: "API Documentation v3.1.pdf", storageKey: "docs/api-docs-v3.1.pdf", category: "Technical", uploadedBy: "Marcus Johnson", createdAt: "2024-05-15" },
];

// Current user mock
export const mockCurrentUser: User = mockUsers[0]; // Admin by default

// Stats
export const mockAdminStats = {
  totalPartners: mockPartners.length,
  activePartners: mockPartners.filter(p => p.status === "active").length,
  totalLeads: mockLeads.length,
  submittedLeads: mockLeads.filter(l => l.status === "SUBMITTED").length,
  totalDeals: mockDeals.length,
  openDeals: mockDeals.filter(d => d.status === "OPEN").length,
  pipelineValue: mockDeals.filter(d => d.status === "OPEN").reduce((s, d) => s + d.value, 0),
  wonValue: mockDeals.filter(d => d.status === "WON").reduce((s, d) => s + d.value, 0),
  totalDocuments: mockDocuments.length,
};

export const mockPartnerStats = (partnerId: string) => {
  const leads = mockLeads.filter(l => l.partnerId === partnerId);
  const deals = mockDeals.filter(d => d.partnerId === partnerId);
  return {
    totalLeads: leads.length,
    submittedLeads: leads.filter(l => l.status === "SUBMITTED").length,
    approvedLeads: leads.filter(l => l.status === "APPROVED").length,
    totalDeals: deals.length,
    openDeals: deals.filter(d => d.status === "OPEN").length,
    wonValue: deals.filter(d => d.status === "WON").reduce((s, d) => s + d.value, 0),
    totalDocuments: mockDocuments.length,
  };
};
