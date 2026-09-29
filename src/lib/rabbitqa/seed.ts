import type { Ball, DiscoveryQuestion, Phase, Project, RqState, Salesperson, Step, User } from "./types";

export const SEED_USERS: User[] = [
  { id: "u_deniz", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com", role: "csm" },
  { id: "u_gencay", name: "Gençay Genç", email: "gencay.genc@virgosol.com", role: "care" },
  { id: "u_cagla", name: "Çağla Kahriman", email: "cagla.kahriman@virgosol.com", role: "devops" },
  { id: "u_manager", name: "Örnek Manager", email: "manager@virgosol.com", role: "manager" },
  { id: "u_admin", name: "Örnek Administrator", email: "admin@virgosol.com", role: "admin" },
];

export const SEED_MODULES = [
  "SmartRequest", "SmartPBI", "Analyzer", "SmartAPI", "CaseWriter", "TestPilot", "AutoRunner",
  "DataCrate", "BrowserHub", "MobileHub", "Accessibility", "Healthcheck", "Reporter",
];

export const SEED_SALESPEOPLE: Salesperson[] = [
  { id: "s_1", name: "Örnek Satışçı 1" },
  { id: "s_2", name: "Örnek Satışçı 2" },
];

export const SEED_QUESTIONS: DiscoveryQuestion[] = [
  { id: "q_teams", group: "Şirket & Takım Yapısı", text: "Ürünü kullanacak kaç bağımsız agile takımınız var?", required: true },
  { id: "q_roles", group: "Şirket & Takım Yapısı", text: "Takımlarda ürünü hangi rollerin daha aktif olarak kullanması bekleniyor?", required: true },
  { id: "q_channels", group: "Sprint & Geliştirme Profili", text: "RabbitQA'i kaç farklı yazılım ürünü veya dijital kanal kapsamında kullanmayı planlıyorsunuz?", required: true },
  { id: "q_regression", group: "Test Yönetimi & Otomasyon", text: "Regresyon setiniz bulunuyor mu? Varsa otomasyon ile mi veya manuel olarak mı koşum gerçekleştiriyorsunuz?", required: true },
  { id: "q_scenarios", group: "Test Yönetimi & Otomasyon", text: "Kapsam dahilindeki ürün / kanal bazında mevcut regression test setinizde kaç test senaryosu bulunmaktadır?", required: true },
  { id: "q_notes", group: "Diğer", text: "Notlar", required: false },
  { id: "q_kpi", group: "Diğer", text: "KPI", required: false },
];

interface StepTpl { title: string; ball: Ball; required: boolean; ownerRole?: "manager" }
interface PhaseTpl { code: string; name: string; steps: StepTpl[] }

export const PHASE_TEMPLATE: PhaseTpl[] = [
  { code: "00", name: "Satış Devri", steps: [
    { title: "CSM ataması", ball: "csm", required: true, ownerRole: "manager" },
    { title: "Satışçı ve lisans modelinin girilmesi", ball: "csm", required: true },
    { title: "Satın alınan modüllerin girilmesi", ball: "csm", required: true },
    { title: "Taahhütlerin girilmesi", ball: "csm", required: true },
    { title: "Internal brif toplantısı", ball: "csm", required: true },
    { title: "Teklif dokümanının yüklenmesi", ball: "csm", required: true },
    { title: "Müşteri sözleşmesinin yüklenmesi", ball: "csm", required: true },
  ]},
  { code: "01", name: "Kick-off", steps: [
    { title: "Kick-off toplantısı", ball: "csm", required: true },
    { title: "Onboarding sunumunun paylaşılması", ball: "csm", required: false },
    { title: "Kurulum tipi seçimi", ball: "csm", required: true },
    { title: "Kurulum gereksinim dokümanının paylaşılması", ball: "csm", required: true },
    { title: "LLM tercihinin girilmesi", ball: "csm", required: true },
  ]},
  { code: "02", name: "Keşif", steps: [
    { title: "Keşif toplantısı", ball: "csm", required: true },
    { title: "Keşif formunun doldurulması", ball: "csm", required: true },
    { title: "Takım listesinin tanımlanması", ball: "csm", required: true },
    { title: "KPI tanımı", ball: "csm", required: false },
  ]},
  { code: "03", name: "Kurulum", steps: [
    { title: "VPN erişiminin talep edilmesi", ball: "customer", required: true },
    { title: "VPN bilgilerinin alınması ve kaydedilmesi", ball: "csm", required: true },
    { title: "Sunucuların oluşturulup teslim edilmesi", ball: "customer", required: true },
    { title: "Müşterinin DevOps ekibine devir toplantısı", ball: "customer", required: true },
    { title: "Ürün kurulumu", ball: "devops", required: true },
    { title: "Model kurulumu", ball: "devops", required: false },
    { title: "İlk platform testleri", ball: "care", required: true },
    { title: "Örnek proje ile platforma veri doldurulması", ball: "care", required: true },
    { title: "Müşteri hesaplarının açılması ve paylaşılması", ball: "care", required: true },
  ]},
  { code: "04", name: "Eğitim", steps: [
    { title: "Eğitim session'larının planlanması", ball: "csm", required: true },
    { title: "Eğitim session'larının yapılması", ball: "csm", required: true },
  ]},
  { code: "05", name: "Uyarlama", steps: [] },
  { code: "06", name: "Uygulama", steps: [
    { title: "CS check-in toplantıları", ball: "csm", required: false },
    { title: "Destek kayıtlarının takibi", ball: "care", required: false },
    { title: "KPI ölçümleri", ball: "csm", required: false },
  ]},
  { code: "07", name: "Go-Live", steps: [
    { title: "Go/No-Go toplantısı", ball: "csm", required: true },
    { title: "Açık taahhütlerin kontrolü", ball: "csm", required: true },
    { title: "Müşteri onayı", ball: "customer", required: true },
  ]},
  { code: "08", name: "Süreklilik", steps: [
    { title: "Periyodik check-in toplantıları", ball: "csm", required: false },
    { title: "Kullanım ve KPI takibi", ball: "csm", required: false },
  ]},
];

export const ADAPTATION_STEPS = [
  "Proje oluşturma",
  "Yüklenecek dokümanların belirlenmesi",
  "Dokümanların RabbitQA'e yüklenmesi",
  "AI'ın eğitilmesi",
  "İlk örneklerin birlikte yapılması",
];

export const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

export function ownerFor(ball: Ball, csmId: string | null, users: User[], ownerRole?: "manager") {
  if (ownerRole === "manager") return users.find((u) => u.role === "manager")?.id ?? null;
  if (ball === "devops") return users.find((u) => u.role === "devops")?.id ?? null;
  if (ball === "care") return users.find((u) => u.role === "care")?.id ?? null;
  return csmId;
}

/** Copies the phase/step template into a new project (template changes never affect existing projects). */
export function buildFromTemplate(project: Project, users: User[], planEnds: Record<string, string | null> = {}) {
  const phases: Phase[] = [];
  const steps: Step[] = [];
  let prevEnd: string | null = project.startDate;
  PHASE_TEMPLATE.forEach((pt, i) => {
    const end = planEnds[pt.code] ?? null;
    const phase: Phase = {
      id: uid("ph"), projectId: project.id, code: pt.code, name: pt.name, order: i,
      status: "not_started", planStart: prevEnd, planEnd: end, baselineEnd: end,
      actualStart: null, actualEnd: null, approvedBy: null, approvedAt: null,
    };
    if (end) prevEnd = end;
    phases.push(phase);
    const tpl = pt.code === "05"
      ? project.teams.flatMap((t) => ADAPTATION_STEPS.map((s) => ({ title: `${t} — ${s}`, ball: "csm" as Ball, required: true })))
      : pt.steps;
    tpl.forEach((st, j) => {
      steps.push({
        id: uid("st"), projectId: project.id, phaseId: phase.id, title: st.title, required: st.required,
        ownerId: ownerFor(st.ball, project.csmId, users, (st as StepTpl).ownerRole), ball: st.ball,
        ballSince: project.createdAt, due: end, status: "pending", order: j,
      });
    });
  });
  return { phases, steps };
}

export function createSeed(): RqState {
  const users = SEED_USERS;
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
      q_scenarios: "",
      q_notes: "Dedicated test ekipleri henüz yok.",
      q_kpi: "Tüm senaryoları yüklemek ve koşumları gerçekleştirmek.",
    },
    createdAt: "2026-08-21T09:00:00.000Z",
  };
  const { phases, steps } = buildFromTemplate(project, users, {
    "00": "2026-08-27", "01": "2026-08-28", "02": "2026-08-28", "03": "2026-09-04", "04": "2026-09-11",
    "05": "2026-09-18", "06": "2026-09-25", "07": "2026-10-02", "08": null,
  });
  phases[0].planStart = "2026-08-21";
  const doneCodes = ["00", "01", "02", "03", "04", "05"];
  phases.forEach((ph) => {
    if (doneCodes.includes(ph.code)) {
      ph.status = "done";
      ph.actualStart = ph.planStart;
      ph.actualEnd = ph.planEnd;
      ph.approvedBy = "u_deniz";
      ph.approvedAt = (ph.planEnd ?? "2026-08-28") + "T16:00:00.000Z";
      steps.filter((s) => s.phaseId === ph.id).forEach((s) => {
        s.status = s.title === "Model kurulumu" ? "out_of_scope" : "done";
      });
    } else if (ph.code === "06") {
      ph.status = "late";
      ph.actualStart = "2026-09-19";
      const ps = steps.filter((s) => s.phaseId === ph.id);
      ps[0].status = "in_progress";
    }
  });

  const contacts = [
    { id: "c_1", projectId: project.id, name: "Sevcan Vural", title: "Product Owner", email: "", phone: "", role: "pm" as const },
    { id: "c_2", projectId: project.id, name: "Mehmet Ertuğrul Elitop", title: "İş Analisti", email: "", phone: "", role: "tech" as const },
  ];
  const meetings = [
    { id: "m_1", projectId: project.id, type: "kickoff" as const, date: "2026-08-28", internalIds: ["u_deniz"], contactIds: ["c_1"], notes: "Tanışma ve onboarding planının paylaşılması.", decisions: "Kurulum tipi On-prem olarak belirlendi." },
    { id: "m_2", projectId: project.id, type: "discovery" as const, date: "2026-08-28", internalIds: ["u_deniz"], contactIds: ["c_1", "c_2"], notes: "Keşif formu birlikte dolduruldu.", decisions: "İki takım ile başlanacak." },
  ];
  const actions = [
    { id: "a_1", projectId: project.id, title: "Trade Master için senaryo sayısının netleştirilmesi", ownerId: "c_2", ball: "customer" as const, due: "2026-09-30", priority: "medium" as const, status: "open" as const, source: "meeting" as const, meetingId: "m_2", createdAt: "2026-08-28T12:00:00.000Z" },
    { id: "a_2", projectId: project.id, title: "Go/No-Go toplantısının planlanması", ownerId: "u_deniz", ball: "csm" as const, due: "2026-09-29", priority: "high" as const, status: "open" as const, source: "manual" as const, meetingId: null, createdAt: "2026-09-20T09:00:00.000Z" },
  ];
  const commitments = [
    { id: "cm_1", projectId: project.id, text: "Mobil kanal için MobileHub demosu yapılacak", targetPhaseCode: "04", status: "open" as const, note: "" },
  ];

  return {
    version: 1,
    users,
    salespeople: SEED_SALESPEOPLE,
    modules: SEED_MODULES,
    questions: SEED_QUESTIONS,
    projects: [project],
    phases,
    steps,
    actions,
    meetings,
    contacts,
    commitments,
    audit: [
      { id: "au_seed", projectId: project.id, at: project.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: project.id, label: "Proje oluşturuldu" },
    ],
  };
}
