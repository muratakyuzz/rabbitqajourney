import { delay, partnerOnboardingTasks, partners, refreshPartnerOnboardingStats, seedAuthUsers, nowIso } from "@/lib/mock-store";

export type PartnerOnboardingStatus = "TODO" | "CURRENT" | "DONE";

export interface PartnerOnboardingTask {
  id: string;
  partnerId: string;
  order: number;
  title: string;
  description: string;
  status: PartnerOnboardingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerOnboardingPayload {
  enabled: boolean;
  tasks: PartnerOnboardingTask[];
}

function partnerIdFromToken(token: string): string | null {
  const id = token.replace(/^mock-token::/, "");
  const u = seedAuthUsers.find((x) => x.id === id);
  return u?.partnerId ?? null;
}

export async function listPartnerOnboardingTasks(_token: string, partnerId: string): Promise<PartnerOnboardingPayload> {
  await delay();
  const partner = partners.find((p) => p.id === partnerId);
  return {
    enabled: partner?.onboardingEnabled !== false,
    tasks: [...(partnerOnboardingTasks[partnerId] ?? [])].sort((a, b) => a.order - b.order),
  };
}

export async function listMyPartnerOnboardingTasks(token: string): Promise<PartnerOnboardingPayload> {
  const pid = partnerIdFromToken(token);
  if (!pid) return { enabled: false, tasks: [] };
  return listPartnerOnboardingTasks(token, pid);
}

export async function updatePartnerOnboardingTaskStatus(
  _token: string,
  partnerId: string,
  taskId: string,
  input: { status: PartnerOnboardingStatus },
) {
  await delay();
  const list = partnerOnboardingTasks[partnerId] ?? [];
  const t = list.find((x) => x.id === taskId);
  if (!t) throw new Error("Task not found");
  t.status = input.status;
  t.updatedAt = nowIso();
  refreshPartnerOnboardingStats(partnerId);
  return t;
}
