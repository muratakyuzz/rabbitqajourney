import { TR_HOLIDAY_DEFS, addBusinessDays, isBusinessDay } from "./business-days";
import { DEFAULT_THRESHOLDS, weekStartOf } from "./alerts";
import { settleAll } from "./completion";
import { projectPlan } from "./flow";
import { buildReportSnapshot } from "./reports";
import type { AuditEntry, Action, Adaptation, AiInsight, Ball, Contact, DocumentRec, IntegrationConfig, Kpi, Meeting, ProjectIntegrations, UnmatchedEmail, DiscoveryQuestion, Phase, PhaseTpl, Project, RqState, Salesperson, Step, StepTpl, User } from "./types";

export const SEED_USERS: User[] = [
  { id: "u_deniz", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com", role: "csm", active: true },
  { id: "u_gencay", name: "Gençay Genç", email: "gencay.genc@virgosol.com", role: "care", active: true },
  { id: "u_cagla", name: "Çağla Kahriman", email: "cagla.kahriman@virgosol.com", role: "devops", active: true },
  { id: "u_manager", name: "Örnek Manager", email: "manager@virgosol.com", role: "manager", active: true },
  { id: "u_admin", name: "Örnek Administrator", email: "admin@virgosol.com", role: "admin", active: true },
  { id: "u_emre", name: "Emre Yıldız (ayrıldı)", email: "emre.yildiz@virgosol.com", role: "csm", active: false },
];

export const SEED_MODULES = [
  "SmartRequest", "SmartPBI", "Analyzer", "SmartAPI", "CaseWriter", "TestPilot", "AutoRunner",
  "DataCrate", "BrowserHub", "MobileHub", "Accessibility", "Healthcheck", "Reporter",
];

export const SEED_SALESPEOPLE: Salesperson[] = [
  { id: "s_1", name: "Örnek Satışçı 1", active: true },
  { id: "s_2", name: "Örnek Satışçı 2", active: true },
  { id: "s_3", name: "Örnek Satışçı 3 (ayrıldı)", active: false },
];

export const SEED_QUESTIONS: DiscoveryQuestion[] = [
  { id: "q_teams", group: "Şirket & Takım Yapısı", text: "Ürünü kullanacak kaç bağımsız agile takımınız var?", required: true, type: "text", order: 0 },
  { id: "q_roles", group: "Şirket & Takım Yapısı", text: "Takımlarda ürünü hangi rollerin daha aktif olarak kullanması bekleniyor?", required: true, type: "text", order: 1 },
  { id: "q_channels", group: "Sprint & Geliştirme Profili", text: "RabbitQA'i kaç farklı yazılım ürünü veya dijital kanal kapsamında kullanmayı planlıyorsunuz?", required: true, type: "text", order: 2 },
  { id: "q_regression", group: "Test Yönetimi & Otomasyon", text: "Regresyon setiniz bulunuyor mu? Varsa otomasyon ile mi veya manuel olarak mı koşum gerçekleştiriyorsunuz?", required: true, type: "text", order: 3 },
  { id: "q_scenarios", group: "Test Yönetimi & Otomasyon", text: "Kapsam dahilindeki ürün / kanal bazında mevcut regression test setinizde kaç test senaryosu bulunmaktadır?", required: true, type: "text", order: 4 },
  { id: "q_modules", group: "Modül Tercihleri", text: "Kullanmayı planladığınız modüller hangileri?", required: false, type: "modules", order: 5 },
  { id: "q_notes", group: "Diğer", text: "Notlar", required: false, type: "text", order: 6 },
  { id: "q_kpi", group: "Diğer", text: "KPI", required: false, type: "text", order: 7 },
];


const S = (title: string, ball: Ball, required: boolean, dep: "B" | "Ö", durationDays: number, extra: Partial<StepTpl> = {}): StepTpl =>
  ({ title, ball, required, dependency: dep === "B" ? "independent" : "previous", durationDays, ...extra });

export const PHASE_TEMPLATE: PhaseTpl[] = [
  { code: "00", name: "Satış Devri", dependency: "previous", steps: [
    S("CSM ataması", "csm", true, "Ö", 1, { ownerRole: "manager", key: "csm", completion: "data" }),
    S("Satışçı ve lisans modelinin girilmesi", "csm", true, "Ö", 1, { key: "sales_license", completion: "data" }),
    S("Satın alınan modüllerin girilmesi", "csm", true, "B", 2, { key: "modules", completion: "data" }),
    S("Taahhütlerin girilmesi", "csm", true, "B", 2, { key: "commitments", completion: "data" }),
    S("Satış devri toplantısı", "csm", true, "Ö", 2, { key: "brief", completion: "meeting", meetingType: "brief" }),
    S("Kurulum tipi ve LLM tercihinin girilmesi", "csm", true, "B", 2, { key: "install_llm", completion: "data" }),
    S("Teklif dokümanının yüklenmesi", "csm", true, "B", 2, { key: "offer", completion: "data" }),
    S("Müşteri sözleşmesinin yüklenmesi", "csm", true, "B", 2, { key: "contract", completion: "data" }),
  ]},
  { code: "01", name: "Kick-off", dependency: "previous", steps: [
    S("Kick-off toplantısı", "csm", true, "Ö", 3, { key: "kickoff", completion: "meeting", meetingType: "kickoff" }),
    S("Kurulum gereksinim dokümanının paylaşılması", "csm", true, "Ö", 2, { key: "reqdoc", completion: "data" }),
    S("Onboarding sunumunun paylaşılması", "csm", false, "B", 2, { key: "presentation" }),
  ]},
  { code: "02", name: "Keşif", dependency: "previous", steps: [
    S("Keşif toplantısı", "csm", true, "Ö", 3, { key: "discovery", completion: "meeting", meetingType: "discovery" }),
    S("Keşif formunun doldurulması", "csm", true, "Ö", 3, { key: "discovery_form", completion: "data" }),
    S("Takım listesinin tanımlanması", "csm", false, "Ö", 2, { key: "teams", completion: "data" }),
    S("KPI tanımı", "csm", false, "B", 5, { key: "kpi", completion: "data" }),
  ]},
  { code: "03", name: "Kurulum", dependency: "previous", steps: [
    S("VPN erişiminin talep edilmesi", "customer", true, "Ö", 3, { key: "vpn_req" }),
    S("VPN bilgilerinin alınması ve kaydedilmesi", "csm", true, "Ö", 2, { key: "vpn_info", completion: "data" }),
    S("Sunucuların oluşturulup teslim edilmesi", "customer", true, "Ö", 5, { key: "servers" }),
    S("Müşterinin DevOps ekibine devir toplantısı", "customer", true, "Ö", 2, { key: "devops_handover", completion: "meeting", meetingType: "devops_handover" }),
    S("Ürün kurulumu", "devops", true, "Ö", 3),
    S("Model kurulumu", "devops", false, "Ö", 3, { key: "model_install" }),
    S("İlk platform testleri", "care", true, "Ö", 2),
    S("Örnek proje ile platforma veri doldurulması", "care", true, "Ö", 2),
    S("Müşteri hesaplarının açılması ve paylaşılması", "care", true, "Ö", 1),
  ]},
  { code: "04", name: "Eğitim", dependency: "previous", steps: [
    S("Eğitim session'larının planlanması", "csm", true, "Ö", 3, { key: "training_plan", completion: "data" }),
    S("Eğitim session'larının yapılması", "csm", true, "Ö", 10, { key: "training_done", completion: "data" }),
  ]},
  { code: "05", name: "Uyarlama", dependency: "previous", steps: [
    S("Uyarlama", "csm", true, "Ö", 10, { key: "adapt:general", completion: "data" }),
  ]},
  { code: "06", name: "Uygulama", dependency: "previous", steps: [
    S("CS check-in toplantıları", "csm", false, "B", 10),
    S("KPI ölçümleri", "csm", false, "B", 10),
  ]},
  { code: "07", name: "Go-Live", dependency: "previous", steps: [
    S("Go/No-Go toplantısı", "csm", true, "Ö", 3, { key: "gonogo" }),
    S("Açık taahhütlerin kontrolü", "csm", true, "Ö", 1, { key: "commit_check" }),
    S("Müşteri onayı", "customer", true, "Ö", 3, { key: "customer_approval" }),
  ]},
  { code: "08", name: "Süreklilik", dependency: "previous", steps: [
    S("Periyodik check-in toplantıları", "csm", false, "B", 20),
    S("Kullanım ve KPI takibi", "csm", false, "B", 20),
  ]},
];

export const DEFAULT_PROJECT_INTEGRATIONS: ProjectIntegrations = {
  chat: { provider: "teams", channelId: null, active: false, since: null },
  email: { active: false, extraDomains: [], since: null },
};

export const SEED_INTEGRATIONS: IntegrationConfig = {
  chat: {
    teams: { connected: true, tenantId: "3f2a9c1e-demo-tenant", clientId: "8b7d6e5f-demo-client", clientSecret: "demo-teams-secret", botName: "RabbitQA Insight", pollMinutes: 5, lastSyncAt: "2026-10-03T06:45:00.000Z", status: "connected", statusMessage: "" },
    slack: { connected: false },
  },
  email: {
    enabled: true, mailbox: "cs@rabbitqa.com", provider: "m365", tenantId: "3f2a9c1e-demo-tenant", clientId: "8b7d6e5f-demo-client", clientSecret: "demo-mail-secret",
    imapHost: "", imapPort: null, username: "", password: "", processIncoming: true, processOutgoing: true, matchByDomain: true,
    ignoredAddresses: ["noreply", "no-reply"], ignoredDomains: ["rabbitqa.com", "virgosol.com"], lastSyncAt: "2026-10-03T06:50:00.000Z", status: "connected", statusMessage: "",
  },
  ai: { enabledKinds: ["action_create", "action_update", "step_update", "risk_create", "decision_create", "health_change", "date_change"], minConfidence: 60, excerptMaxChars: 280, autoExpireDays: 14 },
};

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function prevWeek(iso: string) { return new Date(new Date(iso + "T00:00:00Z").getTime() - 7 * 86400000).toISOString().slice(0, 10); }
function prevBusinessDay(iso: string) {
  let d = new Date(iso + "T00:00:00Z");
  do { d = new Date(d.getTime() - 86400000); } while (!isBusinessDay(d.toISOString().slice(0, 10)));
  return d.toISOString().slice(0, 10);
}

export const STATE_VERSION = 11;
export const STATE_KEY = `rabbitqa-demo-state-v${STATE_VERSION}`;

const randomId = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;
let nextId = randomId;
export const uid = (p: string) => nextId(p);

export function ownerFor(ball: Ball, csmId: string | null, users: User[], ownerRole?: "manager") {
  if (ownerRole === "manager") return users.find((u) => u.role === "manager")?.id ?? null;
  if (ball === "devops") return users.find((u) => u.role === "devops")?.id ?? null;
  if (ball === "care") return users.find((u) => u.role === "care")?.id ?? null;
  return csmId;
}

/** Copies the phase/step template into a new project (template changes never affect existing projects). */
export function buildFromTemplate(project: Project, users: User[], planEnds: Record<string, string | null> = {}, template: PhaseTpl[] = PHASE_TEMPLATE, newId: (prefix: "ph" | "st") => string = uid) {
  const phases: Phase[] = [];
  const steps: Step[] = [];
  let prevEnd: string | null = project.startDate;
  template.forEach((pt, i) => {
    const end = planEnds[pt.code] ?? null;
    const phase: Phase = {
      id: newId("ph"), projectId: project.id, code: pt.code, name: pt.name, order: i,
      status: "locked", planStart: prevEnd, planEnd: end, baselineEnd: end,
      actualStart: null, actualEnd: null, approvedBy: null, approvedAt: null, dependency: pt.dependency ?? "previous", activatedAt: null,
    };
    if (end) prevEnd = end;
    phases.push(phase);
    const tpl = pt.code === "05" && project.teams.length > 0
      ? project.teams.map((t): StepTpl => ({ title: `Uyarlama: ${t}`, key: `adapt:${t}`, ball: "csm", required: true, dependency: "independent", durationDays: 10, completion: "data" }))
      : pt.steps;
    tpl.forEach((st, j) => {
      steps.push({
        id: newId("st"), projectId: project.id, phaseId: phase.id, title: st.title, required: st.required,
        ownerId: ownerFor(st.ball, project.csmId, users, (st as StepTpl).ownerRole), ball: st.ball,
        ballSince: project.createdAt, due: null, status: "locked", order: j, key: (st as StepTpl).key,
        dependency: st.dependency ?? "previous", durationDays: st.durationDays ?? 2, activatedAt: null,
        completion: (st as StepTpl).completion ?? "manual", meetingType: (st as StepTpl).meetingType,
      });
    });
  });
  return { phases, steps };
}

/** Seed ids are deterministic so web and API, each building the seed on its own, share the same ids. */
function seedIds(projectId: string) {
  const n = { ph: 0, st: 0 };
  return (prefix: "ph" | "st") => `${prefix}_${projectId.replace(/^p_/, "")}_${String(++n[prefix]).padStart(2, "0")}`;
}

/** Builds the demo state. Every id generated meanwhile (rule actions, audits) is sequential, so web and API get identical seeds. */
export function createSeed(): RqState {
  let n = 0;
  nextId = (p) => `${p}_seed${String(++n).padStart(4, "0")}`;
  try {
    return buildSeed();
  } finally {
    nextId = randomId;
  }
}

function buildSeed(): RqState {
  const users = SEED_USERS;
  const build = (p: Project, planEnds: Record<string, string | null> = {}) => buildFromTemplate(p, users, planEnds, PHASE_TEMPLATE, seedIds(p.id));
  const project: Project = {
    id: "p_isyatirim",
    customerName: "İş Yatırım",
    name: "RabbitQA Customer Onboarding",
    csmId: "u_deniz",
    salespersonId: "s_1",
    licenseModel: "Yıllık abonelik",
    purchasedModules: ["TestPilot", "CaseWriter", "DataCrate", "AutoRunner"],
    desiredModules: ["CaseWriter", "TestPilot", "AutoRunner", "MobileHub", "DataCrate"],
    startDate: "2026-08-28",
    goLiveDate: "2026-10-02",
    health: "yellow",
    healthReason: "Uygulama aşaması plan bitişini geçti.",
    teams: ["Herkese Borsa", "Trade Master"],
    discoveryAnswers: {
      q_teams: "2 takım mevcut. Herkese Borsa ve Trade Master. Bunların yanı sıra ayrı bir test ekibi de kurulabilme ihtimali var. Mehmet Ertuğrul Elitop ve Trademaster ezel sarıtepe herkese borsada Sevcan Vural.",
      q_roles: "İş analistleri ve PO'lar",
      q_channels: "Platform mobil, web + desktop (Trade Master)",
      q_regression: "Test senaryoları mevcut. İş analistleri ve PO'lar tarafından belirleniyor. Excel üzerinden takip ediliyor. Regresyon setleri mevcut.",
      q_scenarios: "Herkese Borsa için 180, Trade Master için 240 test senaryosu mevcut.",
      q_notes: "Dedicated test ekipleri henüz yok.",
      q_kpi: "Tüm senaryoları yüklemek ve koşumları gerçekleştirmek.",
    },
    teamInfo: {
      "Herkese Borsa": { contact: "Sevcan Vural", users: null },
      "Trade Master": { contact: "Ezel Sarıtepe", users: null },
    },
    installType: "onprem",
    llmChoice: "rabbitqa",
    createdAt: "2026-08-21T09:00:00.000Z",
    integrations: {
      chat: { provider: "teams", channelId: "ch_isy", active: true, since: "2026-08-28T09:00:00.000Z" },
      email: { active: true, extraDomains: [], since: "2026-08-28T09:00:00.000Z" },
    },
    noCommitments: false,
  };
  const { phases, steps } = build(project, {
    "00": "2026-08-27", "01": "2026-08-28", "02": "2026-08-28", "03": "2026-09-04", "04": "2026-09-11",
    "05": "2026-09-18", "06": "2026-09-25", "07": "2026-10-02", "08": null,
  });
  phases[0].planStart = "2026-08-21";
  const doneCodes = ["00", "01", "02", "03", "04", "05"];
  phases.forEach((ph) => {
    const ps = steps.filter((s) => s.phaseId === ph.id);
    if (doneCodes.includes(ph.code)) {
      ph.status = "done";
      ph.actualStart = ph.planStart;
      ph.actualEnd = ph.planEnd;
      ph.activatedAt = (ph.planStart ?? "2026-08-21") + "T09:00:00.000Z";
      ph.approvedBy = "u_deniz";
      ph.approvedAt = (ph.planEnd ?? "2026-08-28") + "T16:00:00.000Z";
      ps.forEach((s) => {
        s.status = s.title === "Model kurulumu" ? "out_of_scope" : "done";
        s.activatedAt = ph.activatedAt;
        s.due = ph.planEnd;
      });
    } else if (ph.code === "06") {
      ph.status = "in_progress";
      ph.actualStart = "2026-09-18";
      ph.activatedAt = "2026-09-18T09:00:00.000Z";
      ps.forEach((s) => { s.status = "pending"; s.activatedAt = ph.activatedAt; s.ballSince = ph.activatedAt!; s.due = addBusinessDays("2026-09-18", s.durationDays); });
      ps[0].status = "in_progress";
    }
  });

  const contacts: Contact[] = [
    { id: "c_1", projectId: project.id, name: "Sevcan Vural", title: "Product Owner", email: "sevcan.vural@isyatirim.com.tr", phone: "", role: "pm" as const },
    { id: "c_2", projectId: project.id, name: "Mehmet Ertuğrul Elitop", title: "İş Analisti", email: "mehmet.elitop@isyatirim.com.tr", phone: "", role: "tech" as const },
  ];
  const meetings: Meeting[] = [
    { id: "m_brief_isy", projectId: project.id, type: "brief" as const, date: "2026-08-25", internalIds: ["u_deniz"], contactIds: [], notes: "Satış devri toplantısı.", decisions: "Satış devri tamamlandı.", isCustomerVisible: false, status: "held" },
    { id: "m_1", projectId: project.id, type: "kickoff" as const, date: "2026-08-28", internalIds: ["u_deniz"], contactIds: ["c_1"], notes: "Tanışma ve onboarding planının paylaşılması.", decisions: "Kurulum tipi On-prem olarak belirlendi.", isCustomerVisible: true, status: "held" },
    { id: "m_2", projectId: project.id, type: "discovery" as const, date: "2026-08-28", internalIds: ["u_deniz"], contactIds: ["c_1", "c_2"], notes: "Keşif formu birlikte dolduruldu.", decisions: "İki takım ile başlanacak.", isCustomerVisible: false, status: "held" },
    { id: "m_devops_isy", projectId: project.id, type: "devops_handover" as const, date: "2026-09-02", internalIds: ["u_deniz", "u_cagla"], contactIds: [], notes: "DevOps devir toplantısı.", decisions: "Top DevOps'a geçti.", isCustomerVisible: false, status: "held" },
    { id: "m_tr_1", projectId: project.id, type: "training" as const, date: "2026-09-08", internalIds: ["u_deniz"], contactIds: ["c_1"], notes: "", decisions: "", isCustomerVisible: false, status: "held", training: { trainerId: "u_deniz", modules: ["TestPilot", "CaseWriter"], recordingUrl: "" } },
    { id: "m_tr_2", projectId: project.id, type: "training" as const, date: "2026-09-10", internalIds: ["u_deniz"], contactIds: ["c_2"], notes: "", decisions: "", isCustomerVisible: false, status: "held", training: { trainerId: "u_deniz", modules: ["TestPilot", "CaseWriter", "AutoRunner", "DataCrate"], recordingUrl: "" } },
    { id: "m_ad_1", projectId: project.id, type: "adaptation" as const, date: "2026-09-15", internalIds: ["u_deniz"], contactIds: ["c_1"], notes: "", decisions: "", isCustomerVisible: false, status: "held", teamId: "Herkese Borsa" },
    { id: "m_ad_2", projectId: project.id, type: "adaptation" as const, date: "2026-09-17", internalIds: ["u_deniz"], contactIds: ["c_2"], notes: "", decisions: "", isCustomerVisible: false, status: "held", teamId: "Trade Master" },
  ];
  const actions: Action[] = [
    { id: "a_1", projectId: project.id, title: "Trade Master için senaryo sayısının netleştirilmesi", ownerId: "c_2", ball: "customer" as const, due: "2026-09-30", priority: "medium" as const, status: "open" as const, source: "meeting" as const, meetingId: "m_2", createdAt: "2026-08-28T12:00:00.000Z", isCustomerVisible: true },
    { id: "a_2", projectId: project.id, title: "Go/No-Go toplantısının planlanması", ownerId: "u_deniz", ball: "csm" as const, due: "2026-09-29", priority: "high" as const, status: "open" as const, source: "manual" as const, meetingId: null, createdAt: "2026-09-20T09:00:00.000Z", isCustomerVisible: true },
    { id: "a_3", projectId: project.id, title: "İç değerlendirme: lisans genişletme teklifi hazırlığı", ownerId: "u_deniz", ball: "csm" as const, due: "2026-10-09", priority: "medium" as const, status: "open" as const, source: "manual" as const, meetingId: null, createdAt: "2026-09-25T09:00:00.000Z", isCustomerVisible: false },
  ];
  const commitments = [
    { id: "cm_1", projectId: project.id, text: "Mobil kanal için MobileHub demosu yapılacak", targetPhaseCode: "04", status: "open" as const, note: "" },
  ];
  const documents: DocumentRec[] = [
    { id: "d_1", projectId: project.id, type: "offer", name: "IsYatirim_Teklif.pdf", linkType: "project", linkId: null, addedAt: "2026-08-22T10:00:00.000Z" },
    { id: "d_2", projectId: project.id, type: "contract", name: "IsYatirim_Sozlesme.pdf", linkType: "project", linkId: null, addedAt: "2026-08-25T10:00:00.000Z" },
  ];
  const kpis: Kpi[] = [
    { id: "k_1", projectId: project.id, name: "Yüklenen regresyon senaryosu oranı", unit: "%", baseline: 0, target: 100, targetDate: "2026-10-02", measurements: [{ date: "2026-09-18", value: 25 }, { date: "2026-09-25", value: 40 }], isCustomerVisible: true },
  ];
  const adaptations: Adaptation[] = [
    { id: "ad_1", projectId: project.id, teamId: "Herkese Borsa", checklist: { projectCreated: true, docsIdentified: true, docsUploaded: true, aiTrained: true, firstSamples: true } },
    { id: "ad_2", projectId: project.id, teamId: "Trade Master", checklist: { projectCreated: true, docsIdentified: true, docsUploaded: true, aiTrained: true, firstSamples: true } },
  ];

  const pid = project.id;

  // İkinci örnek proje — entegrasyon takibi pasif
  const p2: Project = {
    id: "p_garanti", customerName: "Garanti Teknoloji", name: "RabbitQA Customer Onboarding", csmId: "u_deniz", salespersonId: "s_2",
    licenseModel: "Yıllık abonelik", purchasedModules: ["TestPilot", "CaseWriter"], desiredModules: ["TestPilot", "CaseWriter"],
    startDate: "2026-09-21", goLiveDate: "2026-11-20", health: "green", healthReason: "",
    teams: ["Mobil Bankacılık"],
    discoveryAnswers: {
      q_teams: "1 takım: Mobil Bankacılık.", q_roles: "İş analistleri", q_channels: "Mobil uygulama",
      q_regression: "Regresyon seti mevcut, manuel koşuluyor.", q_scenarios: "Mobil Bankacılık için 90 test senaryosu mevcut.",
      q_notes: "", q_kpi: "Otomasyon kapsamının artırılması.",
    },
    teamInfo: { "Mobil Bankacılık": { contact: "Burak Aydın", users: null } },
    installType: null, llmChoice: null, createdAt: "2026-09-18T09:00:00.000Z",
    integrations: {
      chat: { provider: "teams", channelId: null, active: false, since: null },
      email: { active: false, extraDomains: ["garantibbva.com.tr"], since: null },
    },
    noCommitments: true,
  };
  const b2 = build(p2, { "00": "2026-09-22", "01": "2026-10-02", "02": "2026-10-09", "03": "2026-10-20", "04": "2026-10-27", "05": "2026-11-05", "06": "2026-11-13", "07": "2026-11-20", "08": "2026-12-20" });
  {
    const today = localToday();
    const back = (n: number) => { let d = today; for (let k = 0; k < n; k++) d = prevBusinessDay(d); return d; };
    b2.phases.forEach((ph) => {
      const ps = b2.steps.filter((x) => x.phaseId === ph.id);
      if (["00", "01", "02"].includes(ph.code)) {
        ph.status = "done"; ph.actualStart = ph.planStart ?? "2026-09-18"; ph.actualEnd = ph.planEnd; ph.approvedBy = "u_deniz";
        ph.approvedAt = (ph.planEnd ?? "2026-09-22") + "T16:00:00.000Z"; ph.activatedAt = ph.actualStart + "T09:00:00.000Z";
        ps.forEach((x) => { x.status = "done"; x.activatedAt = ph.activatedAt; x.due = ph.planEnd; });
      }
      if (ph.code === "03") {
        const start = back(9);
        ph.planEnd = addBusinessDays(today, 2);
        ph.status = "in_progress"; ph.actualStart = start; ph.activatedAt = start + "T09:00:00.000Z";
        const at = (d: string) => d + "T09:00:00.000Z";
        const vpnReq = ps.find((x) => x.key === "vpn_req")!;
        Object.assign(vpnReq, { status: "done", activatedAt: at(start), due: addBusinessDays(start, 3) });
        const vpnInfo = ps.find((x) => x.key === "vpn_info")!;
        Object.assign(vpnInfo, { status: "pending", activatedAt: new Date().toISOString(), ballSince: new Date().toISOString(), due: addBusinessDays(today, 1) });
        const servers = ps.find((x) => x.key === "servers")!;
        Object.assign(servers, { dependency: "independent", status: "pending", activatedAt: at(start), ballSince: at(start), due: addBusinessDays(start, 5) });
        const model = ps.find((x) => x.key === "model_install");
        if (model) model.status = "out_of_scope";
      }
      if (ph.code === "06") ph.dependency = "independent";
    });
    p2.installType = "onprem"; p2.llmChoice = "rabbitqa";
  }
  phases.push(...b2.phases);
  steps.push(...b2.steps);
  meetings.push(
    { id: "m_brief_gar", projectId: p2.id, type: "brief" as const, date: "2026-09-21", internalIds: ["u_deniz"], contactIds: [], notes: "Satış devri toplantısı.", decisions: "Satış devri tamamlandı.", isCustomerVisible: false, status: "held" },
    { id: "m_3", projectId: p2.id, type: "kickoff" as const, date: "2026-09-24", internalIds: ["u_deniz"], contactIds: ["c_3"], notes: "Kick-off yapıldı.", decisions: "Kurulum tipi On-prem.", isCustomerVisible: false, status: "held" },
    { id: "m_disc_gar", projectId: p2.id, type: "discovery" as const, date: "2026-09-30", internalIds: ["u_deniz"], contactIds: ["c_3"], notes: "Keşif toplantısı yapıldı.", decisions: "Mobil Bankacılık takımı ile başlanacak.", isCustomerVisible: false, status: "held" },
  );

  // Üçüncü örnek proje — keşif aşamasında, uzun süredir hareketsiz
  const p3: Project = {
    id: "p_akbank", customerName: "Akbank Teknoloji", name: "RabbitQA Customer Onboarding", csmId: "u_deniz", salespersonId: "s_3",
    licenseModel: "Yıllık abonelik", purchasedModules: ["TestPilot"], desiredModules: ["TestPilot"],
    startDate: "2026-09-01", goLiveDate: "2026-12-15", health: "yellow", healthReason: "Müşteriden dönüş alınamıyor.", teams: [], discoveryAnswers: {}, teamInfo: {},
    installType: "onprem", llmChoice: "rabbitqa", createdAt: "2026-09-01T09:00:00.000Z",
    integrations: { chat: { provider: "teams", channelId: null, active: false, since: null }, email: { active: false, extraDomains: [], since: null } },
    noCommitments: false,
  };
  const b3 = build(p3, { "00": "2026-09-03", "01": "2026-09-08", "02": "2026-09-15" });
  b3.phases.forEach((ph) => {
    const ps = b3.steps.filter((x) => x.phaseId === ph.id);
    if (["00", "01"].includes(ph.code)) {
      ph.status = "done"; ph.actualStart = ph.planStart; ph.actualEnd = ph.planEnd; ph.approvedBy = "u_deniz";
      ph.approvedAt = ph.planEnd + "T16:00:00.000Z"; ph.activatedAt = ph.planStart + "T09:00:00.000Z";
      ps.forEach((x) => { x.status = "done"; x.activatedAt = ph.activatedAt; x.due = ph.planEnd; });
    }
    if (ph.code === "02") {
      ph.status = "in_progress"; ph.actualStart = "2026-09-08"; ph.activatedAt = "2026-09-08T09:00:00.000Z";
      ps.forEach((x) => { x.status = "pending"; x.activatedAt = ph.activatedAt; x.ballSince = ph.activatedAt!; x.due = "2026-09-15"; });
    }
  });
  phases.push(...b3.phases);
  steps.push(...b3.steps);

  contacts.push({ id: "c_3", projectId: p2.id, name: "Burak Aydın", title: "QA Lead", email: "burak.aydin@garantibbva.com.tr", phone: "", role: "tech" as const });
  contacts.push({ id: "c_4", projectId: p3.id, name: "Elif Yavuz", title: "IT Yöneticisi", email: "elif.yavuz@akbank.com", phone: "", role: "sponsor" as const });
  commitments.push({ id: "cm_2", projectId: p3.id, text: "Lisans genişletme değerlendirilecek", targetPhaseCode: "04", status: "open" as const, note: "" });
  documents.push(
    { id: "d_3", projectId: p2.id, type: "offer", name: "Garanti_Teklif.pdf", linkType: "project", linkId: null, addedAt: "2026-09-19T10:00:00.000Z" },
    { id: "d_4", projectId: p2.id, type: "contract", name: "Garanti_Sozlesme.pdf", linkType: "project", linkId: null, addedAt: "2026-09-20T10:00:00.000Z" },
    { id: "d_5", projectId: p3.id, type: "offer", name: "Akbank_Teklif.pdf", linkType: "project", linkId: null, addedAt: "2026-09-01T10:00:00.000Z" },
    { id: "d_6", projectId: p3.id, type: "contract", name: "Akbank_Sozlesme.pdf", linkType: "project", linkId: null, addedAt: "2026-09-02T10:00:00.000Z" },
  );
  kpis.push(
    { id: "k_2", projectId: p2.id, name: "Otomasyon kapsama oranı", unit: "%", baseline: 10, target: null, targetDate: null, measurements: [], isCustomerVisible: true },
    { id: "k_3", projectId: p2.id, name: "Yüklenen regresyon senaryosu oranı", unit: "%", baseline: 0, target: 100, targetDate: "2026-11-20", measurements: [], isCustomerVisible: true },
  );
  meetings.push(
    { id: "m_brief_akb", projectId: p3.id, type: "brief" as const, date: "2026-09-02", internalIds: ["u_deniz"], contactIds: [], notes: "Satış devri toplantısı.", decisions: "Satış devri tamamlandı.", isCustomerVisible: false, status: "held" },
    { id: "m_kickoff_akb", projectId: p3.id, type: "kickoff" as const, date: "2026-09-08", internalIds: ["u_deniz"], contactIds: ["c_4"], notes: "Kick-off yapıldı.", decisions: "Kurulum tipi On-prem.", isCustomerVisible: false, status: "held" },
  );

  // Dördüncü örnek proje — Satış Devri aşamasında, verisi eksik
  const todayS0 = localToday();
  const p4StartDate = (() => { let d = todayS0; for (let k = 0; k < 2; k++) d = prevBusinessDay(d); return d; })();
  const p4: Project = {
    id: "p_ornek", customerName: "Örnek Sigorta A.Ş.", name: "RabbitQA Customer Onboarding", csmId: "u_deniz", salespersonId: "s_1",
    licenseModel: "", purchasedModules: [], desiredModules: [], teams: [], discoveryAnswers: {}, teamInfo: {},
    startDate: p4StartDate, goLiveDate: addBusinessDays(p4StartDate, 60), health: "green", healthReason: "",
    installType: null, llmChoice: null, createdAt: new Date().toISOString(),
    integrations: { chat: { provider: "teams", channelId: null, active: false, since: null }, email: { active: false, extraDomains: [], since: null } },
    noCommitments: false,
  };
  const b4 = build(p4);
  const p4Plan = projectPlan(b4.phases, b4.steps, p4.startDate);
  b4.phases.forEach((ph) => {
    const d = p4Plan.phases[ph.id];
    if (!d) return;
    ph.planStart = ph.planStart ?? d.start;
    ph.planEnd = ph.planEnd ?? d.end;
    ph.baselineEnd = ph.baselineEnd ?? d.end;
  });
  phases.push(...b4.phases);
  steps.push(...b4.steps);
  meetings.push({ id: "m_brief_ornek", projectId: p4.id, type: "brief" as const, date: addBusinessDays(todayS0, 7), internalIds: ["u_deniz"], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "planned" });

  // Beşinci örnek proje — 01 Kick-off aktif, gereksinim dokümanı paylaşılmadı (reqdoc_not_shared)
  const reqDocDays = DEFAULT_THRESHOLDS.reqDocDays;
  const kickoffAgoDate = (() => { let d = localToday(); for (let k = 0; k < reqDocDays + 1; k++) d = prevBusinessDay(d); return d; })();
  const p5: Project = {
    id: "p_lojistik", customerName: "Örnek Lojistik A.Ş.", name: "RabbitQA Customer Onboarding", csmId: "u_deniz", salespersonId: "s_2",
    licenseModel: "Yıllık abonelik", purchasedModules: ["TestPilot", "CaseWriter"], desiredModules: ["TestPilot", "CaseWriter"],
    startDate: kickoffAgoDate, goLiveDate: addBusinessDays(kickoffAgoDate, 60), health: "green", healthReason: "",
    teams: [], discoveryAnswers: {}, teamInfo: {}, installType: "onprem", llmChoice: "rabbitqa", createdAt: kickoffAgoDate + "T09:00:00.000Z",
    integrations: { chat: { provider: "teams", channelId: null, active: false, since: null }, email: { active: false, extraDomains: [], since: null } },
    noCommitments: true,
  };
  const b5 = build(p5, { "00": kickoffAgoDate });
  b5.phases.forEach((ph) => {
    const ps = b5.steps.filter((x) => x.phaseId === ph.id);
    if (ph.code === "00") {
      ph.status = "done"; ph.actualStart = ph.planStart; ph.actualEnd = ph.planEnd; ph.approvedBy = "u_deniz";
      ph.approvedAt = (ph.planEnd ?? kickoffAgoDate) + "T16:00:00.000Z"; ph.activatedAt = (ph.planStart ?? kickoffAgoDate) + "T09:00:00.000Z";
      ps.forEach((x) => { x.status = "done"; x.activatedAt = ph.activatedAt; x.due = ph.planEnd; });
    }
    if (ph.code === "01") {
      ph.status = "in_progress"; ph.actualStart = kickoffAgoDate; ph.activatedAt = kickoffAgoDate + "T09:00:00.000Z";
      const kickoffStep = ps.find((x) => x.key === "kickoff")!;
      Object.assign(kickoffStep, { status: "done", activatedAt: ph.activatedAt, due: kickoffAgoDate });
      const reqdocStep = ps.find((x) => x.key === "reqdoc")!;
      Object.assign(reqdocStep, { status: "pending", activatedAt: ph.activatedAt, ballSince: ph.activatedAt, due: addBusinessDays(kickoffAgoDate, reqdocStep.durationDays) });
      const presStep = ps.find((x) => x.key === "presentation");
      if (presStep) Object.assign(presStep, { status: "pending", activatedAt: ph.activatedAt, ballSince: ph.activatedAt, due: addBusinessDays(kickoffAgoDate, presStep.durationDays) });
    }
  });
  phases.push(...b5.phases);
  steps.push(...b5.steps);
  documents.push(
    { id: "d_lj1", projectId: p5.id, type: "offer", name: "Lojistik_Teklif.pdf", linkType: "project", linkId: null, addedAt: kickoffAgoDate + "T10:00:00.000Z" },
    { id: "d_lj2", projectId: p5.id, type: "contract", name: "Lojistik_Sozlesme.pdf", linkType: "project", linkId: null, addedAt: kickoffAgoDate + "T10:00:00.000Z" },
  );
  contacts.push({ id: "c_5", projectId: p5.id, name: "Kemal Doğan", title: "Operasyon Direktörü", email: "kemal.dogan@ornek-lojistik.com", phone: "", role: "sponsor" as const });
  meetings.push(
    { id: "m_brief_lj", projectId: p5.id, type: "brief" as const, date: kickoffAgoDate, internalIds: ["u_deniz"], contactIds: [], notes: "Satış devri toplantısı.", decisions: "Satış devri tamamlandı.", isCustomerVisible: false, status: "held" },
    { id: "m_kickoff_lj", projectId: p5.id, type: "kickoff" as const, date: kickoffAgoDate, internalIds: ["u_deniz"], contactIds: ["c_5"], notes: "Kick-off yapıldı.", decisions: "Kurulum tipi On-prem.", isCustomerVisible: false, status: "held" },
  );

  // Altıncı örnek proje — 00-04 tamamlanmış, 05 Uyarlama aktif
  const p6StartDate = (() => { let d = localToday(); for (let k = 0; k < 40; k++) d = prevBusinessDay(d); return d; })();
  const p6: Project = {
    id: "p_perakende", customerName: "Örnek Perakende A.Ş.", name: "RabbitQA Customer Onboarding", csmId: "u_deniz", salespersonId: "s_1",
    licenseModel: "Yıllık abonelik", purchasedModules: ["TestPilot", "CaseWriter", "MobileHub"], desiredModules: ["TestPilot", "CaseWriter", "MobileHub"],
    startDate: p6StartDate, goLiveDate: addBusinessDays(p6StartDate, 60), health: "green", healthReason: "",
    teams: ["Mobil", "Web"],
    discoveryAnswers: {
      q_teams: "2 takım: Mobil ve Web.", q_roles: "İş analistleri ve PO'lar", q_channels: "Mobil uygulama ve web portalı",
      q_regression: "Regresyon seti mevcut, kısmen otomasyonlu.", q_scenarios: "Mobil için 60, Web için 80 test senaryosu mevcut.",
      q_notes: "", q_kpi: "Regresyon koşum süresinin kısaltılması.",
    },
    teamInfo: { "Mobil": { contact: "Aylin Kara", users: null }, "Web": { contact: "Serkan Us", users: null } },
    installType: "saas", llmChoice: "rabbitqa", createdAt: p6StartDate + "T09:00:00.000Z",
    integrations: { chat: { provider: "teams", channelId: null, active: false, since: null }, email: { active: false, extraDomains: [], since: null } },
    noCommitments: true,
  };
  const b6 = build(p6, {
    "00": p6StartDate, "01": addBusinessDays(p6StartDate, 5), "02": addBusinessDays(p6StartDate, 12), "03": addBusinessDays(p6StartDate, 22), "04": addBusinessDays(p6StartDate, 32),
  });
  const p6OutOfScopeKeys = new Set(["reqdoc", "vpn_req", "vpn_info", "servers", "devops_handover", "model_install"]);
  b6.phases.forEach((ph) => {
    const ps = b6.steps.filter((x) => x.phaseId === ph.id);
    if (["00", "01", "02", "03", "04"].includes(ph.code)) {
      ph.status = "done"; ph.actualStart = ph.planStart; ph.actualEnd = ph.planEnd; ph.approvedBy = "u_deniz";
      ph.approvedAt = (ph.planEnd ?? p6StartDate) + "T16:00:00.000Z"; ph.activatedAt = (ph.planStart ?? p6StartDate) + "T09:00:00.000Z";
      ps.forEach((x) => { x.status = p6OutOfScopeKeys.has(x.key ?? "") ? "out_of_scope" : "done"; x.activatedAt = ph.activatedAt; x.due = ph.planEnd; });
    }
    if (ph.code === "05") {
      ph.status = "in_progress"; ph.actualStart = localToday(); ph.activatedAt = localToday() + "T09:00:00.000Z";
      ps.forEach((x) => { x.status = "pending"; x.activatedAt = ph.activatedAt; x.ballSince = ph.activatedAt!; x.due = addBusinessDays(localToday(), x.durationDays); });
    }
  });
  phases.push(...b6.phases);
  steps.push(...b6.steps);
  contacts.push({ id: "c_6", projectId: p6.id, name: "Aylin Kara", title: "Mobil Takım Lideri", email: "aylin.kara@ornek-perakende.com", phone: "", role: "pm" as const });
  contacts.push({ id: "c_7", projectId: p6.id, name: "Serkan Us", title: "Web Takım Lideri", email: "serkan.us@ornek-perakende.com", phone: "", role: "pm" as const });
  documents.push(
    { id: "d_pk1", projectId: p6.id, type: "offer", name: "Perakende_Teklif.pdf", linkType: "project", linkId: null, addedAt: p6StartDate + "T10:00:00.000Z" },
    { id: "d_pk2", projectId: p6.id, type: "contract", name: "Perakende_Sozlesme.pdf", linkType: "project", linkId: null, addedAt: p6StartDate + "T10:00:00.000Z" },
  );
  const p6KpiDate = addBusinessDays(p6StartDate, 12);
  kpis.push({ id: "k_pk1", projectId: p6.id, name: "Regresyon koşum süresi", unit: "dk", baseline: 120, target: 60, targetDate: addBusinessDays(p6StartDate, 60), measurements: [], isCustomerVisible: true });
  adaptations.push(
    { id: "ad_pk1", projectId: p6.id, teamId: "Mobil", checklist: { projectCreated: true, docsIdentified: true, docsUploaded: false, aiTrained: false, firstSamples: false } },
    { id: "ad_pk2", projectId: p6.id, teamId: "Web", checklist: { projectCreated: true, docsIdentified: true, docsUploaded: true, aiTrained: true, firstSamples: true } },
  );
  meetings.push(
    { id: "m_brief_pk", projectId: p6.id, type: "brief" as const, date: p6StartDate, internalIds: ["u_deniz"], contactIds: [], notes: "Satış devri toplantısı.", decisions: "Satış devri tamamlandı.", isCustomerVisible: false, status: "held" },
    { id: "m_kickoff_pk", projectId: p6.id, type: "kickoff" as const, date: addBusinessDays(p6StartDate, 5), internalIds: ["u_deniz"], contactIds: ["c_6"], notes: "Kick-off yapıldı.", decisions: "Kurulum tipi SaaS.", isCustomerVisible: false, status: "held" },
    { id: "m_disc_pk", projectId: p6.id, type: "discovery" as const, date: p6KpiDate, internalIds: ["u_deniz"], contactIds: ["c_6", "c_7"], notes: "Keşif toplantısı yapıldı.", decisions: "Mobil ve Web takımları ile başlanacak.", isCustomerVisible: false, status: "held" },
    { id: "m_tr_pk1", projectId: p6.id, type: "training" as const, date: addBusinessDays(p6StartDate, 32), internalIds: ["u_deniz"], contactIds: ["c_6", "c_7"], notes: "", decisions: "", isCustomerVisible: false, status: "held", training: { trainerId: "u_deniz", modules: ["TestPilot", "CaseWriter"], recordingUrl: "" } },
    { id: "m_ad_pk1", projectId: p6.id, type: "adaptation" as const, date: addBusinessDays(localToday(), 5), internalIds: ["u_deniz"], contactIds: ["c_6"], notes: "", decisions: "", isCustomerVisible: false, status: "planned", teamId: "Mobil" },
    { id: "m_ad_pk2", projectId: p6.id, type: "adaptation" as const, date: localToday(), internalIds: ["u_deniz"], contactIds: ["c_6"], notes: "", decisions: "", isCustomerVisible: false, status: "held", teamId: "Mobil" },
    { id: "m_ad_pk3", projectId: p6.id, type: "adaptation" as const, date: localToday(), internalIds: ["u_deniz"], contactIds: ["c_7"], notes: "", decisions: "", isCustomerVisible: false, status: "held", teamId: "Web" },
  );

  const step = (title: string) => steps.find((x) => x.projectId === pid && x.title.toLowerCase().includes(title.toLowerCase()) && x.status !== "done");
  const stepAny = steps.find((x) => x.projectId === pid && (x.status === "pending" || x.status === "in_progress"));
  const supportStep = step("check-in") ?? stepAny;
  const now = Date.now();
  const ago = (h: number) => new Date(now - h * 3600000).toISOString();
  const base = { reviewedBy: null, reviewedAt: null, reviewNote: "", appliedEntityId: null };
  const ref = (source: "teams" | "email", title: string, from: string, h: number, excerpt: string, direction?: "in" | "out") =>
    ({ title, from, at: ago(h), excerpt, link: source === "teams" ? "https://teams.microsoft.com/l/channel/demo" : "#", direction });
  const insights: AiInsight[] = [
    { ...base, id: "ai_1", projectId: pid, source: "teams", kind: "action_create", status: "pending", createdAt: ago(2), targetId: null, current: null,
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Sevcan Vural", 2, "VPN erişim bilgilerini Çağla Hanım'a 10.10.2026 tarihine kadar göndereceğiz."),
      proposed: { title: "VPN erişim bilgilerinin gönderilmesi", ownerId: "c_1", due: "2026-10-10", priority: "high", ball: "customer" }, rationale: "Müşteri tarihli bir gönderim taahhüdü verdi.", confidence: 86 },
    { ...base, id: "ai_2", projectId: pid, source: "email", kind: "action_update", status: "pending", createdAt: ago(5), targetId: "a_1", current: { status: "open" },
      sourceRef: ref("email", "Trade Master senaryo listesi", "mehmet.elitop@isyatirim.com.tr", 5, "Trade Master için senaryo sayısını netleştirdik, listeyi ekte bulabilirsiniz. Bu iş yapıldı.", "in"),
      proposed: { status: "done" }, rationale: "Müşteri senaryo sayısının netleştirildiğini bildirdi.", confidence: 82 },
    { ...base, id: "ai_3", projectId: pid, source: "teams", kind: "step_update", status: "pending", createdAt: ago(8), targetId: supportStep?.id ?? null, current: { status: supportStep?.status ?? "pending" },
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Çağla Kahriman", 8, "Bu haftaki CS check-in toplantısı tamamlandı, açık konu kalmadı."),
      proposed: { status: "done" }, rationale: `Mesajda "${supportStep?.title ?? "adım"}" adımının tamamlandığı belirtiliyor.`, confidence: 72 },
    { ...base, id: "ai_4", projectId: pid, source: "email", kind: "risk_create", status: "pending", createdAt: ago(20), targetId: null, current: null,
      sourceRef: ref("email", "RE: Regresyon koşumları", "sevcan.vural@isyatirim.com.tr", 20, "Koşum sürelerinin uzaması konusunda endişemiz var, Go-Live öncesi çözülmezse sorun olabilir.", "in"),
      proposed: { title: "Koşum sürelerinin uzaması Go-Live'ı riske atıyor", description: "Müşteri koşum sürelerinden endişeli; Go-Live öncesi çözülmeli.", impact: "high" }, rationale: "Müşteri açıkça endişe belirtti.", confidence: 78 },
    { ...base, id: "ai_5", projectId: pid, source: "teams", kind: "decision_create", status: "pending", createdAt: ago(26), targetId: null, current: null,
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Sevcan Vural", 26, "MobileHub demosunu Go-Live sonrasına almak konusunda anlaştık."),
      proposed: { title: "MobileHub demosu Go-Live sonrasına alındı", description: "Taraflar MobileHub demosunun Go-Live sonrasında yapılmasında anlaştı.", impact: "medium" }, rationale: "Mesajda alınmış bir karar paylaşılıyor.", confidence: 74 },
    { ...base, id: "ai_6", projectId: pid, source: "email", kind: "health_change", status: "pending", createdAt: ago(30), targetId: pid, current: { health: "yellow" },
      sourceRef: ref("email", "Go-Live tarihi hk.", "sevcan.vural@isyatirim.com.tr", 30, "İç onay süreçlerimiz nedeniyle Go-Live bir hafta gecikecek.", "in"),
      proposed: { health: "red", healthReason: "Müşteri iç onay süreçleri nedeniyle Go-Live'ın gecikeceğini bildirdi." }, rationale: "Gecikme bildirimi ve mevcut sarı sağlık birlikte kırmızıyı işaret ediyor.", confidence: 68 },
    { ...base, id: "ai_7", projectId: pid, source: "email", kind: "date_change", status: "pending", createdAt: ago(30), targetId: pid, current: { goLiveDate: "2026-10-02" },
      sourceRef: ref("email", "Go-Live tarihi hk.", "sevcan.vural@isyatirim.com.tr", 30, "İç onay süreçlerimiz nedeniyle Go-Live bir hafta gecikecek, yeni hedef 09.10.2026.", "in"),
      proposed: { goLiveDate: "2026-10-09" }, rationale: "Müşteri yeni Go-Live tarihini paylaştı.", confidence: 80 },
    { ...base, id: "ai_8", projectId: pid, source: "teams", kind: "action_create", status: "pending", createdAt: ago(40), targetId: null, current: null,
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Deniz Uzun", 40, "Go/No-Go sunumunu Deniz hazırlayacak, 06.10 tarihine kadar paylaşacağız."),
      proposed: { title: "Go/No-Go sunumunun hazırlanması", ownerId: "u_deniz", due: "2026-10-06", priority: "medium", ball: "csm" }, rationale: "İç ekipten tarihli bir hazırlık taahhüdü.", confidence: 64 },
    { ...base, id: "ai_h1", projectId: pid, source: "teams", kind: "action_create", status: "approved", createdAt: ago(120), reviewedBy: "u_deniz", reviewedAt: ago(110), targetId: null, current: null, appliedEntityId: "a_ai1",
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Ezel Sarıtepe", 120, "Trade Master test kullanıcılarını yarına kadar açacağız."),
      proposed: { title: "Trade Master test kullanıcılarının açılması", ownerId: "c_2", due: "2026-10-01", priority: "medium", ball: "customer" }, rationale: "Müşteri taahhüdü.", confidence: 84 },
    { ...base, id: "ai_h2", projectId: pid, source: "email", kind: "risk_create", status: "approved", createdAt: ago(200), reviewedBy: "u_deniz", reviewedAt: ago(190), targetId: null, current: null, appliedEntityId: "r_1",
      sourceRef: ref("email", "Test ekibi", "sevcan.vural@isyatirim.com.tr", 200, "Dedicated test ekibimiz henüz yok, bu bir risk olabilir.", "in"),
      proposed: { title: "Dedicated test ekibi yok", description: "", impact: "medium" }, rationale: "Müşteri risk belirtti.", confidence: 77 },
    { ...base, id: "ai_h3", projectId: pid, source: "teams", kind: "step_update", status: "approved", createdAt: ago(300), reviewedBy: "u_cagla", reviewedAt: ago(290), targetId: null, current: null,
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Çağla Kahriman", 300, "Sunucu kurulumu tamamlandı."), proposed: { status: "done" }, rationale: "Kurulum tamamlandı bildirimi.", confidence: 88 },
    { ...base, id: "ai_h4", projectId: pid, source: "email", kind: "health_change", status: "rejected", createdAt: ago(150), reviewedBy: "u_deniz", reviewedAt: ago(140), reviewNote: "Gecikme sadece bir gün, sağlığı değiştirmeye gerek yok.", targetId: pid, current: { health: "yellow" },
      sourceRef: ref("email", "Toplantı ertelendi", "sevcan.vural@isyatirim.com.tr", 150, "Yarınki toplantıyı bir gün erteledik.", "in"), proposed: { health: "red", healthReason: "Toplantı ertelendi" }, rationale: "Erteleme bildirimi.", confidence: 61 },
    { ...base, id: "ai_h5", projectId: pid, source: "teams", kind: "action_create", status: "rejected", createdAt: ago(170), reviewedBy: "u_gencay", reviewedAt: ago(160), reviewNote: "Zaten destek kaydı olarak açık.", targetId: null, current: null,
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Mehmet Ertuğrul Elitop", 170, "Zaman aşımı sorununu inceleyeceğiz."), proposed: { title: "Zaman aşımı sorununun incelenmesi", ownerId: null, due: null, priority: "medium", ball: "care" }, rationale: "İnceleme taahhüdü.", confidence: 62 },
  ];
  actions.push({ id: "a_ai1", projectId: pid, title: "Trade Master test kullanıcılarının açılması", ownerId: "c_2", ball: "customer" as const, due: "2026-10-01", priority: "medium" as const, status: "done" as const, source: "teams" as const, meetingId: null, createdAt: ago(110), insightId: "ai_h1", isCustomerVisible: true });

  const todayS = localToday();
  const plusDays = (n: number) => { const d = new Date(todayS + "T00:00:00Z"); return new Date(d.getTime() + n * 86400000).toISOString().slice(0, 10); };
  const unmatchedEmails: UnmatchedEmail[] = [
    { id: "ue_1", from: "ali.kaya@yenifirma.com", to: ["cs@rabbitqa.com"], cc: [], subject: "RabbitQA demo talebi", at: ago(6), excerpt: "Merhaba, ekibimiz için RabbitQA demosu planlamak istiyoruz.", direction: "in", status: "open", assignedProjectId: null },
    { id: "ue_2", from: "proje.ofisi@ortakholding.com", to: ["cs@rabbitqa.com", "sevcan.vural@isyatirim.com.tr", "burak.aydin@garantibbva.com.tr"], cc: [], subject: "Ortak eğitim takvimi", at: ago(12), excerpt: "İki şirket için ortak eğitim takvimini paylaşıyoruz, tamamlandı bilgisini bekliyoruz.", direction: "in", status: "open", assignedProjectId: null },
    { id: "ue_3", from: "ezel.saritepe@gmail.com", to: ["cs@rabbitqa.com"], cc: [], subject: "Kişisel adresimden yazıyorum", at: ago(18), excerpt: "Trade Master senaryolarını 08.10 tarihine kadar göndereceğiz.", direction: "in", status: "open", assignedProjectId: null },
  ];

  const seedState: RqState = {
    version: STATE_VERSION,
    template: PHASE_TEMPLATE,
    users,
    salespeople: SEED_SALESPEOPLE,
    modules: SEED_MODULES,
    questions: SEED_QUESTIONS,
    projects: [project, p2, p3, p4, p5, p6],
    phases,
    steps,
    actions,
    meetings,
    contacts,
    commitments,
    kpis,
    adaptations,
    credentials: [
      { id: "cr_1", projectId: pid, type: "VPN", provider: "FortiClient", username: "virgosol.rabbitqa", password: "Demo-Sifre-123", validUntil: plusDays(5), note: "Örnek kayıt" },
    ],
    documents,
    alerts: [
      { id: "al_2", projectId: pid, title: "Go-Live tarihi yaklaşıyor", detail: "Hedef Go-Live: 02.10.2026. Go/No-Go toplantısı planlanmadı.", severity: "critical", status: "open", source: "rule", createdAt: "2026-09-28T08:00:00.000Z", resolvedAt: null, resolvedBy: null },
    ],
    tickets: [
      { id: "tk_1", projectId: pid, title: "TestPilot koşumunda zaman aşımı", description: "Trade Master regresyon setinde uzun süren senaryolar zaman aşımına uğruyor.", module: "TestPilot", priority: "high", status: "in_progress", ownerId: "u_gencay", openedAt: "2026-09-22T10:00:00.000Z", resolvedAt: null, type: "technical", resolution: "", boardDecision: null, customerNotifiedAt: null },
      { id: "tk_2", projectId: pid, title: "DataCrate içe aktarma hatası", description: "Excel şablonunda Türkçe karakterli başlıklar hata veriyor.", module: "DataCrate", priority: "medium", status: "resolved", ownerId: "u_gencay", openedAt: "2026-09-19T14:00:00.000Z", resolvedAt: "2026-09-21T09:30:00.000Z", type: "usage", resolution: "Şablon başlıkları UTF-8 olarak kaydedildi; müşteriye doğru şablon paylaşıldı.", boardDecision: null, customerNotifiedAt: null },
      { id: "tk_3", projectId: pid, title: "TestPilot için Jira Xray entegrasyonu talebi", description: "Müşteri koşum sonuçlarının Xray'e otomatik aktarılmasını istiyor.", module: "TestPilot", priority: "medium", status: "in_progress", ownerId: "u_gencay", openedAt: "2026-09-24T11:00:00.000Z", resolvedAt: null, type: "feature_request", resolution: "", boardDecision: "planned", customerNotifiedAt: "2026-09-30" },
    ],
    risks: [
      { id: "r_1", projectId: pid, kind: "risk", title: "Dedicated test ekibi yok", description: "Müşteride dedicated test ekibi bulunmuyor; senaryo bakımı PO'lara kalabilir.", impact: "medium", status: "open", ownerId: "u_deniz", due: "2026-10-15", createdAt: "2026-09-05T09:00:00.000Z", probability: "high", mitigation: "PO'lara haftalık senaryo bakım saati ayrılacak; Go-Live sonrası test ekibi kurulumu müşteriyle planlanacak.", meetingId: null, decidedAt: null, isCustomerVisible: true },
      { id: "r_2", projectId: pid, kind: "decision", title: "On-prem kurulum kararı", description: "Kick-off'ta kurulum tipi On-prem olarak belirlendi; VPN ve sunucu müşteride.", impact: "high", status: "accepted", ownerId: "u_deniz", due: null, createdAt: "2026-08-28T12:00:00.000Z", probability: "medium", mitigation: "", meetingId: "m_1", decidedAt: "2026-08-28", isCustomerVisible: true },
    ],
    audit: [
      { id: "au_seed", projectId: project.id, at: project.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: project.id, label: "Proje oluşturuldu" },
      { id: "au_seed2", projectId: p2.id, at: p2.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: p2.id, label: "Proje oluşturuldu" },
      { id: "au_seed3", projectId: p3.id, at: p3.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: p3.id, label: "Proje oluşturuldu" },
      { id: "au_seed5", projectId: p4.id, at: p4.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: p4.id, label: "Proje oluşturuldu" },
      { id: "au_seed6", projectId: p5.id, at: p5.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: p5.id, label: "Proje oluşturuldu" },
      { id: "au_seed7", projectId: p6.id, at: p6.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: p6.id, label: "Proje oluşturuldu" },
      { id: "au_seed4", projectId: pid, at: "2026-10-01T10:00:00.000Z", userId: "u_deniz", kind: "update", entity: "alert", entityId: "item_late:a_2", label: "Uyarı kapatıldı — Aksiyon gecikti: Go/No-Go toplantısının planlanması", field: "status", oldValue: "open", newValue: "closed", reason: "Toplantı müşteriyle telefonda planlandı, takvim daveti bekleniyor." },
    ],
    integrations: SEED_INTEGRATIONS,
    chatChannels: [
      { id: "ch_isy", provider: "teams", teamName: "Müşteriler", channelName: "İş Yatırım", webUrl: "https://teams.microsoft.com/l/channel/demo-isy" },
      { id: "ch_gar", provider: "teams", teamName: "Müşteriler", channelName: "Garanti Teknoloji", webUrl: "https://teams.microsoft.com/l/channel/demo-gar" },
      { id: "ch_new", provider: "teams", teamName: "Müşteriler", channelName: "Yeni Prospect", webUrl: "https://teams.microsoft.com/l/channel/demo-new" },
      { id: "ch_gen", provider: "teams", teamName: "Genel", channelName: "Duyurular", webUrl: "https://teams.microsoft.com/l/channel/demo-gen" },
    ],
    insights,
    unmatchedEmails,
    holidays: TR_HOLIDAY_DEFS.map((h) => ({ ...h })),
    alertThresholds: { ...DEFAULT_THRESHOLDS },
    alertStates: [
      { key: "item_late:a_2", status: "closed", snoozedUntil: null, reason: "Toplantı müşteriyle telefonda planlandı, takvim daveti bekleniyor.", by: "u_deniz", at: "2026-10-01T10:00:00.000Z" },
      { key: `report_not_sent:p_akbank:${weekStartOf(todayS)}`, status: "snoozed", snoozedUntil: plusDays(7), reason: "Müşteri bu hafta tatilde, rapor gelecek hafta birlikte gönderilecek.", by: "u_deniz", at: new Date().toISOString() },
    ],
    reportsSent: [],
    customerReports: [
      { id: "cr_r1", projectId: pid, weekStart: weekStartOf(prevWeek(todayS)), createdBy: "u_deniz", createdAt: prevWeek(todayS) + "T15:00:00.000Z", status: "sent", sentAt: prevWeek(todayS) + "T16:00:00.000Z", sentBy: "u_deniz",
        summary: "Uygulama aşaması devam ediyor; regresyon senaryolarının %40'ı yüklendi.", nextWeek: "Go/No-Go toplantısının yapılması; kalan senaryoların yüklenmesi.", snapshot: { legacy: true } },
      { id: "cr_r2", projectId: pid, weekStart: weekStartOf(todayS), createdBy: "u_deniz", createdAt: new Date().toISOString(), status: "draft", sentAt: null, sentBy: null,
        summary: "Go-Live hazırlıkları sürüyor.", nextWeek: "Müşteri onayının alınması.", snapshot: { legacy: true } },
    ],
  };
  const sysAudit = (e: Omit<AuditEntry, "id" | "at" | "userId">): AuditEntry => ({ ...e, id: uid("au"), at: new Date().toISOString(), userId: "system" });
  const advanced = settleAll(seedState, sysAudit);
  advanced.customerReports = advanced.customerReports.map((r) => ({ ...r, snapshot: buildReportSnapshot(advanced, r.projectId, r.weekStart, todayS) as unknown as Record<string, unknown> }));
  return advanced;
}
