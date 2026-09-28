import { delay, nextId, nowIso, partners } from "@/lib/mock-store";
import { seedAuthUsers } from "@/lib/mock-store";

export interface Partner {
  id: string;
  name: string;
  partnerType: string | null;
  partnerTier: string | null;
  website: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  onboardingTotal?: number;
  onboardingDone?: number;
  onboardingCompletionPercent?: number | null;
  onboardingCompleted?: boolean;
  onboardingEnabled?: boolean;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface UpsertPartnerInput {
  name: string;
  partnerType?: string | null;
  partnerTier?: string | null;
  website?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
}

function partnerIdFromToken(token: string): string | null {
  const id = token.replace(/^mock-token::/, "");
  const u = seedAuthUsers.find((x) => x.id === id);
  return u?.partnerId ?? null;
}

export async function listPartners(_token: string, status?: "ACTIVE" | "INACTIVE") {
  await delay();
  return status ? partners.filter((p) => p.status === status) : [...partners];
}

export async function getPartner(_token: string, partnerId: string) {
  await delay();
  const p = partners.find((x) => x.id === partnerId);
  if (!p) throw new Error("Partner not found");
  return p;
}

export async function getMyPartner(token: string) {
  const pid = partnerIdFromToken(token);
  if (!pid) throw new Error("No partner associated with current user");
  return getPartner(token, pid);
}

export async function createPartner(_token: string, input: UpsertPartnerInput) {
  await delay();
  const partner: Partner = {
    id: nextId("p"),
    name: input.name,
    partnerType: input.partnerType ?? null,
    partnerTier: input.partnerTier ?? null,
    website: input.website ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    address: input.address ?? null,
    status: "ACTIVE",
    onboardingEnabled: true,
    onboardingTotal: 0,
    onboardingDone: 0,
    onboardingCompletionPercent: 0,
    onboardingCompleted: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  partners.unshift(partner);
  return partner;
}

export async function updatePartner(_token: string, partnerId: string, input: Partial<UpsertPartnerInput>) {
  await delay();
  const p = partners.find((x) => x.id === partnerId);
  if (!p) throw new Error("Partner not found");
  Object.assign(p, input, { updatedAt: nowIso() });
  return p;
}

export async function updateMyPartner(token: string, input: Partial<UpsertPartnerInput>) {
  const pid = partnerIdFromToken(token);
  if (!pid) throw new Error("No partner associated with current user");
  return updatePartner(token, pid, input);
}

export async function deactivatePartner(token: string, partnerId: string) {
  return updatePartner(token, partnerId, { /* noop */ } as Partial<UpsertPartnerInput>).then((p) => {
    p.status = "INACTIVE";
    p.updatedAt = nowIso();
    return p;
  });
}

export async function reactivatePartner(token: string, partnerId: string) {
  return updatePartner(token, partnerId, {} as Partial<UpsertPartnerInput>).then((p) => {
    p.status = "ACTIVE";
    p.updatedAt = nowIso();
    return p;
  });
}

export async function deletePartner(_token: string, partnerId: string) {
  await delay();
  const idx = partners.findIndex((x) => x.id === partnerId);
  if (idx < 0) throw new Error("Partner not found");
  const [removed] = partners.splice(idx, 1);
  return removed;
}
