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
  pending: "Bekliyor", in_progress: "Devam ediyor", done: "Tamamlandı", out_of_scope: "Kapsam dışı", locked: "Sırası gelmedi",
};
export const PHASE_STATUS_LABEL: Record<PhaseStatus, string> = {
  not_started: "Başlamadı", in_progress: "Devam ediyor", at_risk: "Risk altında", late: "Gecikti", done: "Tamamlandı", out_of_scope: "Kapsam dışı", locked: "Sırası gelmedi",
};
export const DEPENDENCY_LABEL = { previous: "Önceki tamamlanınca", independent: "Bağımsız" } as const;
export const HEALTH_LABEL: Record<Health, string> = { green: "Yeşil", yellow: "Sarı", red: "Kırmızı" };
export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  open: "Açık", in_progress: "Devam ediyor", done: "Tamamlandı", cancelled: "İptal",
};
export const PRIORITY_LABEL: Record<Priority, string> = { low: "Düşük", medium: "Orta", high: "Yüksek" };
export const SOURCE_LABEL: Record<ActionSource, string> = { meeting: "Toplantı", rule: "Otomatik kural", manual: "Elle", teams: "AI · Teams", email: "AI · E-posta" };
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
  kpi: "KPI", training: "Eğitim", adaptation: "Uyarlama", credential: "Erişim bilgisi", document: "Doküman",
  alert: "Uyarı", ticket: "Destek kaydı", risk: "Risk/Karar", insight: "AI Insight", integration: "Entegrasyon",
};
export const ALERT_SEVERITY_LABEL = { info: "Bilgi", warning: "Uyarı", critical: "Kritik" } as const;
export const ALERT_STATUS_LABEL = { open: "Açık", resolved: "Çözüldü" } as const;
export const TICKET_STATUS_LABEL = {
  open: "Açık", in_progress: "İşleniyor", waiting_customer: "Müşteri bekleniyor", resolved: "Çözüldü", closed: "Kapatıldı",
} as const;
export const RISK_KIND_LABEL = { risk: "Risk", decision: "Karar" } as const;
export const RISK_STATUS_LABEL = { open: "Açık", mitigated: "Azaltıldı", accepted: "Kabul edildi", realized: "Gerçekleşti" } as const;

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

export const INSTALL_LABEL = { saas: "SaaS", onprem: "On-prem" } as const;
export const LLM_LABEL = {
  rabbitqa: "RabbitQA'nın sağladığı LLM",
  own: "Müşterinin kendi LLM'i",
  gpu: "Müşteri GPU'lu sunucu verir, model kurulumunu Virgosol yapar",
} as const;
export const DOC_TYPE_LABEL = {
  offer: "Teklif", contract: "Sözleşme", req_doc: "Kurulum gereksinim dokümanı", presentation: "Onboarding sunumu", other: "Diğer",
} as const;

export const INSIGHT_KIND_LABEL = {
  action_create: "Yeni aksiyon", action_update: "Aksiyon güncelleme", step_update: "Adım durumu", risk_create: "Yeni risk",
  decision_create: "Yeni karar", health_change: "Sağlık değişikliği", date_change: "Tarih değişikliği",
} as const;
export const INSIGHT_STATUS_LABEL = { pending: "Bekliyor", approved: "Onaylandı", rejected: "Reddedildi", expired: "Süresi doldu" } as const;
export const INSIGHT_SOURCE_LABEL = { teams: "Teams", email: "E-posta" } as const;
export const CONN_STATUS_LABEL = { disconnected: "Bağlı değil", connected: "Bağlı", error: "Hata" } as const;
