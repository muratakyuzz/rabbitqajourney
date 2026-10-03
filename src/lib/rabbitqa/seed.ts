import type { AiInsight, Ball, IntegrationConfig, ProjectIntegrations, UnmatchedEmail, DiscoveryQuestion, Phase, PhaseTpl, Project, RqState, Salesperson, Step, StepTpl, User } from "./types";

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


export const PHASE_TEMPLATE: PhaseTpl[] = [
  { code: "00", name: "Satış Devri", steps: [
    { title: "CSM ataması", ball: "csm", required: true, ownerRole: "manager" },
    { title: "Satışçı ve lisans modelinin girilmesi", ball: "csm", required: true },
    { title: "Satın alınan modüllerin girilmesi", ball: "csm", required: true },
    { title: "Taahhütlerin girilmesi", ball: "csm", required: true },
    { title: "Internal brif toplantısı", ball: "csm", required: true },
    { key: "offer", title: "Teklif dokümanının yüklenmesi", ball: "csm", required: true },
    { key: "contract", title: "Müşteri sözleşmesinin yüklenmesi", ball: "csm", required: true },
  ]},
  { code: "01", name: "Kick-off", steps: [
    { title: "Kick-off toplantısı", ball: "csm", required: true },
    { key: "presentation", title: "Onboarding sunumunun paylaşılması", ball: "csm", required: false },
    { key: "install_type", title: "Kurulum tipi seçimi", ball: "csm", required: true },
    { key: "reqdoc", title: "Kurulum gereksinim dokümanının paylaşılması", ball: "csm", required: true },
    { key: "llm", title: "LLM tercihinin girilmesi", ball: "csm", required: true },
  ]},
  { code: "02", name: "Keşif", steps: [
    { title: "Keşif toplantısı", ball: "csm", required: true },
    { title: "Keşif formunun doldurulması", ball: "csm", required: true },
    { title: "Takım listesinin tanımlanması", ball: "csm", required: true },
    { title: "KPI tanımı", ball: "csm", required: false },
  ]},
  { code: "03", name: "Kurulum", steps: [
    { key: "vpn_req", title: "VPN erişiminin talep edilmesi", ball: "customer", required: true },
    { key: "vpn_info", title: "VPN bilgilerinin alınması ve kaydedilmesi", ball: "csm", required: true },
    { key: "servers", title: "Sunucuların oluşturulup teslim edilmesi", ball: "customer", required: true },
    { key: "devops_handover", title: "Müşterinin DevOps ekibine devir toplantısı", ball: "customer", required: true },
    { title: "Ürün kurulumu", ball: "devops", required: true },
    { key: "model_install", title: "Model kurulumu", ball: "devops", required: false },
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
    { key: "support_track", title: "Destek kayıtlarının takibi", ball: "care", required: false },
    { title: "KPI ölçümleri", ball: "csm", required: false },
  ]},
  { code: "07", name: "Go-Live", steps: [
    { key: "gonogo", title: "Go/No-Go toplantısı", ball: "csm", required: true },
    { key: "commit_check", title: "Açık taahhütlerin kontrolü", ball: "csm", required: true },
    { key: "customer_approval", title: "Müşteri onayı", ball: "customer", required: true },
  ]},
  { code: "08", name: "Süreklilik", steps: [
    { title: "Periyodik check-in toplantıları", ball: "csm", required: false },
    { title: "Kullanım ve KPI takibi", ball: "csm", required: false },
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
export function buildFromTemplate(project: Project, users: User[], planEnds: Record<string, string | null> = {}, template: PhaseTpl[] = PHASE_TEMPLATE) {
  const phases: Phase[] = [];
  const steps: Step[] = [];
  let prevEnd: string | null = project.startDate;
  template.forEach((pt, i) => {
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
        ballSince: project.createdAt, due: end, status: "pending", order: j, key: (st as StepTpl).key,
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
    teamInfo: {
      "Herkese Borsa": { contact: "Sevcan Vural", users: null },
      "Trade Master": { contact: "Ezel Sarıtepe", users: null },
    },
    installType: "onprem",
    llmChoice: "rabbitqa",
    presentationShared: true,
    reqDocShared: true,
    reqDocSharedAt: "2026-08-28",
    createdAt: "2026-08-21T09:00:00.000Z",
    integrations: {
      chat: { provider: "teams", channelId: "ch_isy", active: true, since: "2026-08-28T09:00:00.000Z" },
      email: { active: true, extraDomains: [], since: "2026-08-28T09:00:00.000Z" },
    },
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
    { id: "c_1", projectId: project.id, name: "Sevcan Vural", title: "Product Owner", email: "sevcan.vural@isyatirim.com.tr", phone: "", role: "pm" as const },
    { id: "c_2", projectId: project.id, name: "Mehmet Ertuğrul Elitop", title: "İş Analisti", email: "mehmet.elitop@isyatirim.com.tr", phone: "", role: "tech" as const },
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

  const pid = project.id;
  const trainingSteps: Step[] = ["2026-09-08", "2026-09-10"].map((d, i) => ({
    id: uid("st"), projectId: pid, phaseId: phases.find((p) => p.code === "04")!.id, title: `Katılımcı girişi — ${d.split("-").reverse().join(".")} session'ı`,
    required: false, ownerId: "u_deniz", ball: "csm", ballSince: project.createdAt, due: d, status: "done", order: 10 + i,
  }));
  steps.push(...trainingSteps);

  // İkinci örnek proje — entegrasyon takibi pasif
  const p2: Project = {
    id: "p_garanti", customerName: "Garanti Teknoloji", name: "RabbitQA Customer Onboarding", csmId: "u_deniz", salespersonId: "s_2",
    licenseModel: "Yıllık abonelik", purchasedModules: ["TestPilot", "CaseWriter"], desiredModules: ["TestPilot", "CaseWriter"],
    startDate: "2026-09-21", goLiveDate: "2026-11-20", health: "green", healthReason: "", teams: [], discoveryAnswers: {}, teamInfo: {},
    installType: null, llmChoice: null, presentationShared: false, reqDocShared: false, reqDocSharedAt: null, createdAt: "2026-09-18T09:00:00.000Z",
    integrations: {
      chat: { provider: "teams", channelId: null, active: false, since: null },
      email: { active: false, extraDomains: ["garantibbva.com.tr"], since: null },
    },
  };
  const b2 = buildFromTemplate(p2, users, { "00": "2026-09-22", "01": "2026-10-02", "02": "2026-10-09", "03": "2026-10-20", "04": "2026-10-27", "05": "2026-11-05", "06": "2026-11-13", "07": "2026-11-20", "08": "2026-12-20" });
  b2.phases.forEach((ph) => { if (ph.code === "00") { ph.status = "done"; ph.actualStart = "2026-09-18"; ph.actualEnd = "2026-09-22"; b2.steps.filter((x) => x.phaseId === ph.id).forEach((x) => { x.status = "done"; }); } if (ph.code === "01") { ph.status = "in_progress"; ph.actualStart = "2026-09-23"; } });
  phases.push(...b2.phases);
  steps.push(...b2.steps);
  contacts.push({ id: "c_3", projectId: p2.id, name: "Burak Aydın", title: "QA Lead", email: "burak.aydin@garantibbva.com.tr", phone: "", role: "tech" as const });

  const step = (title: string) => steps.find((x) => x.projectId === pid && x.title.toLowerCase().includes(title.toLowerCase()) && x.status !== "done");
  const stepAny = steps.find((x) => x.projectId === pid && (x.status === "pending" || x.status === "in_progress"));
  const supportStep = step("Destek") ?? stepAny;
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
      sourceRef: ref("teams", "Müşteriler › İş Yatırım", "Çağla Kahriman", 8, "Destek kayıtlarının takibi için haftalık kontrol tamamlandı, açık kayıt kalmadı."),
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
  actions.push({ id: "a_ai1", projectId: pid, title: "Trade Master test kullanıcılarının açılması", ownerId: "c_2", ball: "customer" as const, due: "2026-10-01", priority: "medium" as const, status: "done" as const, source: "teams" as const, meetingId: null, createdAt: ago(110), insightId: "ai_h1" } as typeof actions[number]);

  const unmatchedEmails: UnmatchedEmail[] = [
    { id: "ue_1", from: "ali.kaya@yenifirma.com", to: ["cs@rabbitqa.com"], cc: [], subject: "RabbitQA demo talebi", at: ago(6), excerpt: "Merhaba, ekibimiz için RabbitQA demosu planlamak istiyoruz.", direction: "in", status: "open", assignedProjectId: null },
    { id: "ue_2", from: "proje.ofisi@ortakholding.com", to: ["cs@rabbitqa.com", "sevcan.vural@isyatirim.com.tr", "burak.aydin@garantibbva.com.tr"], cc: [], subject: "Ortak eğitim takvimi", at: ago(12), excerpt: "İki şirket için ortak eğitim takvimini paylaşıyoruz, tamamlandı bilgisini bekliyoruz.", direction: "in", status: "open", assignedProjectId: null },
    { id: "ue_3", from: "ezel.saritepe@gmail.com", to: ["cs@rabbitqa.com"], cc: [], subject: "Kişisel adresimden yazıyorum", at: ago(18), excerpt: "Trade Master senaryolarını 08.10 tarihine kadar göndereceğiz.", direction: "in", status: "open", assignedProjectId: null },
  ];

  return {
    version: 5,
    template: PHASE_TEMPLATE,
    users,
    salespeople: SEED_SALESPEOPLE,
    modules: SEED_MODULES,
    questions: SEED_QUESTIONS,
    projects: [project, p2],
    phases,
    steps,
    actions,
    meetings,
    contacts,
    commitments,
    kpis: [
      { id: "k_1", projectId: pid, name: "Yüklenen regresyon senaryosu oranı", unit: "%", baseline: 0, target: 100, targetDate: "2026-10-02", measurements: [{ date: "2026-09-18", value: 25 }, { date: "2026-09-25", value: 40 }] },
    ],
    trainings: [
      { id: "t_1", projectId: pid, date: "2026-09-08", trainerId: "u_deniz", attendees: "Herkese Borsa ekibi (İş analistleri, PO'lar)", modules: ["TestPilot", "CaseWriter"], recordingUrl: "", notes: "", status: "done" },
      { id: "t_2", projectId: pid, date: "2026-09-10", trainerId: "u_deniz", attendees: "Trade Master ekibi", modules: ["TestPilot", "CaseWriter", "AutoRunner", "DataCrate"], recordingUrl: "", notes: "", status: "done" },
    ],
    adaptations: [
      { id: "ad_1", projectId: pid, team: "Herkese Borsa", date: "2026-09-15", participants: "Sevcan Vural", notes: "" },
      { id: "ad_2", projectId: pid, team: "Trade Master", date: "2026-09-17", participants: "Ezel Sarıtepe", notes: "" },
    ],
    credentials: [
      { id: "cr_1", projectId: pid, type: "VPN", provider: "FortiClient", username: "virgosol.rabbitqa", password: "Demo-Sifre-123", validUntil: "2026-10-06", note: "Örnek kayıt" },
    ],
    documents: [
      { id: "d_1", projectId: pid, type: "offer", name: "IsYatirim_Teklif.pdf", linkType: "project", linkId: null, addedAt: "2026-08-22T10:00:00.000Z" },
      { id: "d_2", projectId: pid, type: "contract", name: "IsYatirim_Sozlesme.pdf", linkType: "project", linkId: null, addedAt: "2026-08-25T10:00:00.000Z" },
    ],
    alerts: [
      { id: "al_1", projectId: pid, title: "Uygulama aşaması gecikti", detail: "Plan bitiş 25.09.2026 idi, aşama hâlâ açık.", severity: "warning", status: "open", source: "rule", createdAt: "2026-09-26T08:00:00.000Z", resolvedAt: null, resolvedBy: null },
      { id: "al_2", projectId: pid, title: "Go-Live tarihi yaklaşıyor", detail: "Hedef Go-Live: 02.10.2026. Go/No-Go toplantısı planlanmadı.", severity: "critical", status: "open", source: "rule", createdAt: "2026-09-28T08:00:00.000Z", resolvedAt: null, resolvedBy: null },
    ],
    tickets: [
      { id: "tk_1", projectId: pid, title: "TestPilot koşumunda zaman aşımı", description: "Trade Master regresyon setinde uzun süren senaryolar zaman aşımına uğruyor.", module: "TestPilot", priority: "high", status: "in_progress", ownerId: "u_gencay", openedAt: "2026-09-22T10:00:00.000Z", resolvedAt: null },
      { id: "tk_2", projectId: pid, title: "DataCrate içe aktarma hatası", description: "Excel şablonunda Türkçe karakterli başlıklar hata veriyor.", module: "DataCrate", priority: "medium", status: "resolved", ownerId: "u_gencay", openedAt: "2026-09-19T14:00:00.000Z", resolvedAt: "2026-09-21T09:30:00.000Z" },
    ],
    risks: [
      { id: "r_1", projectId: pid, kind: "risk", title: "Dedicated test ekibi yok", description: "Müşteride dedicated test ekibi bulunmuyor; senaryo bakımı PO'lara kalabilir.", impact: "medium", status: "open", ownerId: "u_deniz", due: "2026-10-15", createdAt: "2026-09-05T09:00:00.000Z" },
      { id: "r_2", projectId: pid, kind: "decision", title: "On-prem kurulum kararı", description: "Kick-off'ta kurulum tipi On-prem olarak belirlendi; VPN ve sunucu müşteride.", impact: "high", status: "accepted", ownerId: "u_deniz", due: null, createdAt: "2026-08-28T12:00:00.000Z" },
    ],
    audit: [
      { id: "au_seed", projectId: project.id, at: project.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: project.id, label: "Proje oluşturuldu" },
      { id: "au_seed2", projectId: p2.id, at: p2.createdAt, userId: "u_manager", kind: "create", entity: "project", entityId: p2.id, label: "Proje oluşturuldu" },
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
  };
}
