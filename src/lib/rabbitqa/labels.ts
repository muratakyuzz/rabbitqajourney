import type {
  ActionSource, ActionStatus, Ball, CommitmentStatus, ContactRole, Health, MeetingType, PhaseStatus, Priority, Role, StepStatus,
} from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  csm: "Customer Success Manager",
  devops: "DevOps Specialist",
  care: "Customer Care",
  manager: "Manager",
  admin: "Administrator",
};
export const ROLE_SHORT: Record<Role, string> = {
  csm: "CSM", devops: "DevOps", care: "Customer Care", manager: "Manager", admin: "Admin",
};
export const BALL_LABEL: Record<Ball, string> = {
  customer: "Müşteri", csm: "CSM", devops: "DevOps", care: "Customer Care",
};
export const STEP_STATUS_LABEL: Record<StepStatus, string> = {
  pending: "Bekliyor", in_progress: "Devam ediyor", done: "Tamamlandı", out_of_scope: "Kapsam dışı",
};
export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  not_started: "Başlamadı", in_progress: "Devam ediyor", at_risk: "Risk altında", late: "Gecikti", done: "Tamamlandı", out_of_scope: "Kapsam dışı",
};
export const HEALTH_LABEL: Record<Health, string> = { green: "Yeşil", yellow: "Sarı", red: "Kırmızı" };
export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  open: "Açık", in_progress: "Devam ediyor", done: "Tamamlandı", cancelled: "İptal",
};
export const PRIORITY_LABEL: Record<Priority, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" };
export const SOURCE_LABEL: Record<ActionSource, string> = { meeting: "Toplantı", rule: "Otomatik kural", manual: "Elle" };
export const CONTACT_ROLE_LABEL: Record<ContactRole, string> = { sponsor: "Sponsor", pm: "Proje sorumlusu", tech: "Teknik sorumlu" };
export const COMMIT_STATUS_LABEL: Record<CommitmentStatus, string> = { open: "Açık", met: "Karşılandı", unmet: "Karşılanamadı" };
export const MEETING_TYPE_LABEL: Record<MeetingType, string> = {
  brief: "Internal brif",
  kickoff: "Kick-off",
  discovery: "Keşif",
  devops_handover: "DevOps devir",
  training: "Eğitim",
  adaptation: "Uyarlama",
  checkin: "CS check-in",
  go_no_go: "Go/No-Go",
  other: "Diğer",
};
export const ENTITY_LABEL: Record<string, string> = {
  project: "Proje", phase: "Aşama", step: "Adım", action: "Aksiyon", meeting: "Toplantı", contact: "Kişi", commitment: "Taahhüt",
};

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d.length === 10 ? d + "T00:00:00" : d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function fmtDateTime(d: string) {
  return new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
