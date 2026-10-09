import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { adaptationCondition, applyStepCompletion, conditionFor, isAutoStep, latestHeldMeeting, manualStatusError, settleAll, settleProject, stepConditionResult, STEP_CONDITIONS } from "./completion";
import { applyInstallType, applyLlmChoice, cancelReviewAction, ensureReviewAction, installChoiceError, applyMeetingHeldRules } from "./rules";
import { analyzeText } from "./ai-mock";
import { computeAlerts } from "./alerts";
import { addBusinessDays } from "./business-days";
import { buildFromTemplate, createSeed, PHASE_TEMPLATE } from "./seed";
import { todayISO } from "./labels";
import type { AuditEntry, RqState } from "./types";

const NOW = new Date("2026-10-05T09:00:00");

function mkMk() {
  const audit: Omit<AuditEntry, "id" | "at" | "userId">[] = [];
  const mk = (e: Omit<AuditEntry, "id" | "at" | "userId">) => {
    audit.push(e);
    return { ...e, id: `au_${audit.length}`, at: NOW.toISOString(), userId: "test" } as AuditEntry;
  };
  return { mk, audit };
}

function seed() {
  return createSeed();
}

describe("STEP_CONDITIONS — met/unmet pairs", () => {
  it("csm", () => {
    const s = seed();
    const p = s.projects.find((x) => x.id === "p_ornek")!;
    expect(STEP_CONDITIONS.csm.check(s, p.id).met).toBe(true);
    const unset = { ...s, projects: s.projects.map((x) => (x.id === p.id ? { ...x, csmId: null } : x)) };
    const r = STEP_CONDITIONS.csm.check(unset, p.id);
    expect(r.met).toBe(false);
    expect(r.missing.map((m) => m.field)).toContain("csmId");
  });

  it("sales_license", () => {
    const s = seed();
    const pid = "p_isyatirim";
    expect(STEP_CONDITIONS.sales_license.check(s, pid).met).toBe(true);
    const unset = { ...s, projects: s.projects.map((x) => (x.id === pid ? { ...x, licenseModel: "" } : x)) };
    const r = STEP_CONDITIONS.sales_license.check(unset, pid);
    expect(r.met).toBe(false);
    expect(r.missing.map((m) => m.field)).toContain("licenseModel");
  });

  it("modules", () => {
    const s = seed();
    expect(STEP_CONDITIONS.modules.check(s, "p_isyatirim").met).toBe(true);
    expect(STEP_CONDITIONS.modules.check(s, "p_ornek").met).toBe(false);
  });

  it("commitments", () => {
    const s = seed();
    expect(STEP_CONDITIONS.commitments.check(s, "p_isyatirim").met).toBe(true);
    expect(STEP_CONDITIONS.commitments.check(s, "p_garanti").met).toBe(true); // noCommitments
    expect(STEP_CONDITIONS.commitments.check(s, "p_ornek").met).toBe(false);
  });

  it("install_llm", () => {
    const s = seed();
    expect(STEP_CONDITIONS.install_llm.check(s, "p_isyatirim").met).toBe(true);
    const r = STEP_CONDITIONS.install_llm.check(s, "p_ornek");
    expect(r.met).toBe(false);
    expect(r.missing.map((m) => m.field)).toEqual(["installType", "llmChoice"]);
  });

  it("offer / contract", () => {
    const s = seed();
    expect(STEP_CONDITIONS.offer.check(s, "p_isyatirim").met).toBe(true);
    expect(STEP_CONDITIONS.contract.check(s, "p_isyatirim").met).toBe(true);
    expect(STEP_CONDITIONS.offer.check(s, "p_ornek").met).toBe(false);
    expect(STEP_CONDITIONS.contract.check(s, "p_ornek").met).toBe(false);
  });

  it("discovery_form", () => {
    const s = seed();
    expect(STEP_CONDITIONS.discovery_form.check(s, "p_isyatirim").met).toBe(true);
    expect(STEP_CONDITIONS.discovery_form.check(s, "p_ornek").met).toBe(false);
  });

  it("teams", () => {
    const s = seed();
    expect(STEP_CONDITIONS.teams.check(s, "p_garanti").met).toBe(true);
    expect(STEP_CONDITIONS.teams.check(s, "p_ornek").met).toBe(false);
  });

  it("kpi", () => {
    const s = seed();
    expect(STEP_CONDITIONS.kpi.check(s, "p_isyatirim").met).toBe(true);
    expect(STEP_CONDITIONS.kpi.check(s, "p_ornek").met).toBe(false);
  });

  it("vpn_info", () => {
    const s = seed();
    expect(STEP_CONDITIONS.vpn_info.check(s, "p_isyatirim").met).toBe(true);
    expect(STEP_CONDITIONS.vpn_info.check(s, "p_ornek").met).toBe(false);
  });

  it("meeting condition (brief, held)", () => {
    const s = seed();
    const step = s.steps.find((x) => x.projectId === "p_isyatirim" && x.key === "brief")!;
    const r = stepConditionResult(s, step);
    expect(r?.met).toBe(true);
    const stepOrnek = s.steps.find((x) => x.projectId === "p_ornek" && x.key === "brief")!;
    const r2 = stepConditionResult(s, stepOrnek);
    expect(r2?.met).toBe(false); // planned, not held
  });

  it("unknown key never auto-completes", () => {
    const s = seed();
    const step = { ...s.steps.find((x) => x.key === "csm")!, key: "nope" };
    const r = stepConditionResult(s, step);
    expect(r?.met).toBe(false);
    expect(r?.checks[0].field).toBe("unknown");
  });
});

describe("applyStepCompletion", () => {
  it("AC1 — data step completes with audit reason", () => {
    const s = seed();
    const pid = "p_ornek";
    const step = s.steps.find((x) => x.projectId === pid && x.key === "sales_license")!;
    expect(step.status).not.toBe("done");
    const withLicense: RqState = { ...s, projects: s.projects.map((p) => (p.id === pid ? { ...p, licenseModel: "Yıllık abonelik" } : p)) };
    const { mk, audit } = mkMk();
    const next = applyStepCompletion(withLicense, pid, mk, NOW);
    const updated = next.steps.find((x) => x.id === step.id)!;
    expect(updated.status).toBe("done");
    const entry = audit.find((a) => a.entityId === step.id);
    expect(entry?.reason).toBe("Otomatik kural: veri tamamlandı — Satışçı ve lisans modeli");
  });

  it("AC5 — locked step completes directly when condition is met", () => {
    const s = seed();
    const pid = "p_ornek";
    const vpnStep = s.steps.find((x) => x.projectId === pid && x.key === "vpn_info")!;
    expect(vpnStep.status).toBe("locked");
    const withCred: RqState = { ...s, credentials: [...s.credentials, { id: "cr_test", projectId: pid, type: "VPN", provider: "Test", username: "u", password: "p", validUntil: null, note: "" }] };
    const { mk } = mkMk();
    const next = applyStepCompletion(withCred, pid, mk, NOW);
    expect(next.steps.find((x) => x.id === vpnStep.id)!.status).toBe("done");
  });

  it("AC6 — done-but-never-activated step reverts to locked with due null when condition breaks", () => {
    const s = seed();
    const pid = "p_ornek";
    const vpnStep = s.steps.find((x) => x.projectId === pid && x.key === "vpn_info")!;
    const withCred: RqState = { ...s, credentials: [...s.credentials, { id: "cr_test", projectId: pid, type: "VPN", provider: "Test", username: "u", password: "p", validUntil: null, note: "" }] };
    const { mk } = mkMk();
    const done = applyStepCompletion(withCred, pid, mk, NOW);
    const doneStep = done.steps.find((x) => x.id === vpnStep.id)!;
    expect(doneStep.activatedAt).toBeNull();
    const removed: RqState = { ...done, credentials: done.credentials.filter((c) => c.id !== "cr_test") };
    const back = applyStepCompletion(removed, pid, mk, NOW);
    const reverted = back.steps.find((x) => x.id === vpnStep.id)!;
    expect(reverted.status).toBe("locked");
    expect(reverted.due).toBeNull();
  });

  it("AC3 — done step with activatedAt reverts to pending, due computed if missing", () => {
    const s = seed();
    const pid = "p_ornek";
    const { mk: mk1 } = mkMk();
    const licensed: RqState = { ...s, projects: s.projects.map((p) => (p.id === pid ? { ...p, licenseModel: "Yıllık abonelik" } : p)) };
    const activated = applyStepCompletion(licensed, pid, mk1, NOW);
    const step = activated.steps.find((x) => x.projectId === pid && x.key === "sales_license")!;
    expect(step.status).toBe("done");
    const withActivation: RqState = { ...activated, steps: activated.steps.map((x) => (x.id === step.id ? { ...x, activatedAt: NOW.toISOString(), due: null } : x)) };
    const reverted: RqState = { ...withActivation, projects: withActivation.projects.map((p) => (p.id === pid ? { ...p, licenseModel: "" } : p)) };
    const { mk: mk2, audit } = mkMk();
    const back = applyStepCompletion(reverted, pid, mk2, NOW);
    const result = back.steps.find((x) => x.id === step.id)!;
    expect(result.status).toBe("pending");
    expect(result.due).not.toBeNull();
    const entry = audit.find((a) => a.entityId === step.id && a.field === "status");
    expect(entry?.reason).toBe("Otomatik kural: veri eksildi — Satışçı ve lisans modeli");
  });

  it("AC4 — done step stays done when phase is done, no new audit", () => {
    const s = seed();
    const pid = "p_isyatirim";
    const step = s.steps.find((x) => x.projectId === pid && x.key === "sales_license")!;
    expect(step.status).toBe("done");
    const removed: RqState = { ...s, projects: s.projects.map((p) => (p.id === pid ? { ...p, licenseModel: "" } : p)) };
    const { mk, audit } = mkMk();
    const next = applyStepCompletion(removed, pid, mk, NOW);
    expect(next.steps.find((x) => x.id === step.id)!.status).toBe("done");
    expect(audit.find((a) => a.entityId === step.id)).toBeUndefined();
  });

  it("AC7 — out_of_scope step is never touched", () => {
    const s = seed();
    const pid = "p_ornek";
    const step = s.steps.find((x) => x.projectId === pid && x.key === "sales_license")!;
    const oos: RqState = { ...s, steps: s.steps.map((x) => (x.id === step.id ? { ...x, status: "out_of_scope" as const } : x)) };
    const licensed: RqState = { ...oos, projects: oos.projects.map((p) => (p.id === pid ? { ...p, licenseModel: "Yıllık abonelik" } : p)) };
    const { mk, audit } = mkMk();
    const next = applyStepCompletion(licensed, pid, mk, NOW);
    expect(next.steps.find((x) => x.id === step.id)!.status).toBe("out_of_scope");
    expect(audit.length).toBe(0);
  });

  it("phase out_of_scope — step not touched (S2)", () => {
    const s = seed();
    const pid = "p_ornek";
    const step = s.steps.find((x) => x.projectId === pid && x.key === "sales_license")!;
    const oosPhase: RqState = { ...s, phases: s.phases.map((p) => (p.id === step.phaseId ? { ...p, status: "out_of_scope" as const } : p)) };
    const licensed: RqState = { ...oosPhase, projects: oosPhase.projects.map((p) => (p.id === pid ? { ...p, licenseModel: "Yıllık abonelik" } : p)) };
    const { mk, audit } = mkMk();
    const next = applyStepCompletion(licensed, pid, mk, NOW);
    expect(next.steps.find((x) => x.id === step.id)!.status).not.toBe("done");
    expect(audit.length).toBe(0);
  });

  it("AC8 — idempotant: second settleProject call returns same reference", () => {
    const s = seed();
    const pid = "p_ornek";
    const { mk } = mkMk();
    const once = settleProject(s, pid, mk, NOW);
    const twice = settleProject(once, pid, mk, NOW);
    expect(twice).toBe(once);
  });

  it("AC8 — seed is already settled (applyStepCompletion / settleAll are no-ops)", () => {
    const s = seed();
    const { mk } = mkMk();
    for (const p of s.projects) {
      expect(applyStepCompletion(s, p.id, mk, NOW)).toBe(s);
    }
    expect(settleAll(s, mk, NOW)).toBe(s);
  });
});

describe("AC12 — reqdoc completes via settleAll when a req_doc document is added (S5/S6)", () => {
  const withReqDoc = (s: RqState, pid: string): RqState => ({
    ...s,
    documents: [...s.documents, { id: "d_test", projectId: pid, type: "req_doc" as const, name: "Gereksinim.pdf", linkType: "project" as const, linkId: null, addedAt: NOW.toISOString() }],
  });

  it("a) out_of_scope reqdoc (RUL-13): settleAll leaves it out_of_scope, no new audit for that step", () => {
    const s = seed();
    const pid = "p_ornek";
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const oos: RqState = { ...s, steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "out_of_scope" as const } : x)) };
    const withDoc = withReqDoc(oos, pid);
    const { mk, audit } = mkMk();
    const next = settleAll(withDoc, mk, NOW);
    expect(next.steps.find((x) => x.id === reqdoc.id)!.status).toBe("out_of_scope");
    expect(audit.find((a) => a.entityId === reqdoc.id)).toBeUndefined();
  });

  it("b) locked reqdoc completes directly to done with the data-completion audit reason", () => {
    const s = seed();
    const pid = "p_ornek";
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    expect(reqdoc.status).toBe("locked");
    const withDoc = withReqDoc(s, pid);
    const { mk, audit } = mkMk();
    const next = settleAll(withDoc, mk, NOW);
    expect(next.steps.find((x) => x.id === reqdoc.id)!.status).toBe("done");
    const entry = audit.find((a) => a.entityId === reqdoc.id && a.newValue === "done");
    expect(entry?.reason).toBe("Otomatik kural: veri tamamlandı — Kurulum gereksinim dokümanı");
  });

  it("c) pending reqdoc completes to done", () => {
    const s = seed();
    const pid = "p_ornek";
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const pending: RqState = { ...s, steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "pending" as const, activatedAt: NOW.toISOString() } : x)) };
    const withDoc = withReqDoc(pending, pid);
    const { mk } = mkMk();
    const next = settleAll(withDoc, mk, NOW);
    expect(next.steps.find((x) => x.id === reqdoc.id)!.status).toBe("done");
  });
});

describe("AC2 — flow chains through settleProject", () => {
  it("Taahhütler done opens Satış devri toplantısı (previous-dependency chain); install_llm stays independent", () => {
    const s = createSeed();
    const pid = "p_ornek";
    const { mk } = mkMk();
    const briefStep0 = s.steps.find((x) => x.projectId === pid && x.key === "brief")!;
    expect(briefStep0.status).toBe("locked"); // Taahhütler (previous step) not yet done

    const withCommitment: RqState = { ...s, commitments: [...s.commitments, { id: "cm_x", projectId: pid, text: "x", targetPhaseCode: "00", status: "open" as const, note: "" }] };
    const settled = settleProject(withCommitment, pid, mk, NOW);
    expect(settled.steps.find((x) => x.projectId === pid && x.key === "commitments")!.status).toBe("done");
    const briefStep = settled.steps.find((x) => x.projectId === pid && x.key === "brief")!;
    expect(["pending", "in_progress"]).toContain(briefStep.status);
    // install_llm is independent and was already open before Taahhütler completed — unaffected by this chain
    const installLlmStep = settled.steps.find((x) => x.projectId === pid && x.key === "install_llm")!;
    expect(installLlmStep.status).toBe("pending");
  });

  it("CSM assignment on a fresh project opens the next previous-dependency step", () => {
    const s = createSeed();
    const project = s.projects.find((p) => p.id === "p_ornek")!;
    const pid = "p_new";
    const { mk } = mkMk();
    const newProject = { ...project, id: pid, csmId: null, salespersonId: null, licenseModel: "", purchasedModules: [] };
    const { phases, steps } = buildFromTemplate(newProject, s.users);
    const built: RqState = {
      ...s,
      projects: [...s.projects, newProject],
      phases: [...s.phases, ...phases],
      steps: [...s.steps, ...steps],
    };
    const settled0 = settleProject(built, pid, mk, NOW);
    const csmStep0 = settled0.steps.find((x) => x.projectId === pid && x.key === "csm")!;
    const salesStep0 = settled0.steps.find((x) => x.projectId === pid && x.key === "sales_license")!;
    expect(csmStep0.status).toBe("pending"); // first step of phase 00, opened by flow engine
    expect(salesStep0.status).toBe("locked"); // depends on previous (csm), not yet done

    const withCsm: RqState = { ...settled0, projects: settled0.projects.map((p) => (p.id === pid ? { ...p, csmId: "u_deniz" } : p)) };
    const settled1 = settleProject(withCsm, pid, mk, NOW);
    expect(settled1.steps.find((x) => x.projectId === pid && x.key === "csm")!.status).toBe("done");
    expect(settled1.steps.find((x) => x.projectId === pid && x.key === "sales_license")!.status).toBe("pending");
  });
});

describe("manualStatusError", () => {
  it("manual step: always null", () => {
    const base = createSeed().steps.find((s) => s.completion === "manual")!;
    expect(manualStatusError(base, "done")).toBeNull();
  });
  it("data step: pending -> done rejected", () => {
    const s = createSeed();
    const step = s.steps.find((x) => x.projectId === "p_ornek" && x.key === "sales_license")!;
    expect(manualStatusError(step, "done")).toBe("Bu adım veriyle tamamlanır");
  });
  it("data step: done -> pending/in_progress rejected", () => {
    const s = createSeed();
    const doneStep = s.steps.find((x) => x.projectId === "p_isyatirim" && x.key === "sales_license")!;
    expect(manualStatusError(doneStep, "pending")).toBe("Bu adım veriyle tamamlanır");
    expect(manualStatusError(doneStep, "in_progress")).toBe("Bu adım veriyle tamamlanır");
  });
  it("data step: -> out_of_scope allowed", () => {
    const s = createSeed();
    const step = s.steps.find((x) => x.projectId === "p_ornek" && x.key === "sales_license")!;
    expect(manualStatusError(step, "out_of_scope")).toBeNull();
  });
  it("data step: out_of_scope -> pending allowed", () => {
    const s = createSeed();
    const step = { ...s.steps.find((x) => x.projectId === "p_ornek" && x.key === "sales_license")!, status: "out_of_scope" as const };
    expect(manualStatusError(step, "pending")).toBeNull();
  });
  it("undefined / same status -> null", () => {
    const s = createSeed();
    const step = s.steps.find((x) => x.key === "sales_license")!;
    expect(manualStatusError(step, undefined)).toBeNull();
    expect(manualStatusError(step, step.status)).toBeNull();
  });

  it("reqdoc (AC12 d): manual 'done' rejected, 'out_of_scope' allowed", () => {
    const s = createSeed();
    const step = s.steps.find((x) => x.projectId === "p_ornek" && x.key === "reqdoc")!;
    expect(manualStatusError(step, "done")).toBe("Bu adım veriyle tamamlanır");
    expect(manualStatusError(step, "out_of_scope")).toBeNull();
  });
});

describe("installChoiceError", () => {
  it("null -> value: no error, no reason needed", () => {
    expect(installChoiceError({ installType: null, llmChoice: null }, { installType: "onprem" })).toBeNull();
  });
  it("value -> different value without reason: error", () => {
    expect(installChoiceError({ installType: "onprem", llmChoice: null }, { installType: "saas" })).toBe("Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu");
  });
  it("value -> different value with reason: ok", () => {
    expect(installChoiceError({ installType: "onprem", llmChoice: null }, { installType: "saas" }, "müşteri kararı")).toBeNull();
  });
  it("value -> null: rejected", () => {
    expect(installChoiceError({ installType: "onprem", llmChoice: null }, { installType: null })).toBe("Kurulum tipi seçildikten sonra 'Henüz belli değil' yapılamaz");
  });
  it("llmChoice value -> null: rejected with llm-specific message", () => {
    expect(installChoiceError({ installType: null, llmChoice: "rabbitqa" }, { llmChoice: null })).toBe("LLM tercihi seçildikten sonra 'Henüz belli değil' yapılamaz");
  });
});

describe("applyMeetingHeldRules", () => {
  it("planned meeting: no-op", () => {
    const s = createSeed();
    const { mk } = mkMk();
    const m = { id: "m_x", projectId: "p_isyatirim", type: "devops_handover" as const, date: todayISO(), internalIds: [], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "planned" as const };
    expect(applyMeetingHeldRules(s, m, mk)).toBe(s);
  });
  it("held devops_handover: ball moves to devops, step completes via completion engine separately", () => {
    const s = createSeed();
    const { mk } = mkMk();
    const m = { id: "m_x", projectId: "p_isyatirim", type: "devops_handover" as const, date: todayISO(), internalIds: [], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "held" as const };
    const next = applyMeetingHeldRules(s, m, mk);
    const step = next.steps.find((x) => x.projectId === "p_isyatirim" && x.key === "devops_handover")!;
    expect(step.ball).toBe("devops");
  });
  it("held go_no_go: gonogo step marked done", () => {
    const s = createSeed();
    const { mk } = mkMk();
    const m = { id: "m_x", projectId: "p_isyatirim", type: "go_no_go" as const, date: todayISO(), internalIds: [], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "held" as const };
    const next = applyMeetingHeldRules(s, m, mk);
    expect(next.steps.find((x) => x.projectId === "p_isyatirim" && x.key === "gonogo")!.status).toBe("done");
  });
});

describe("AI / alerts interplay", () => {
  it("analyzeText never proposes step_update for non-manual steps", () => {
    const s = createSeed();
    const dataStep = s.steps.find((x) => x.projectId === "p_ornek" && x.completion === "data")!;
    const drafts = analyzeText(s, "p_ornek", "teams", `${dataStep.title} tamamlandı.`, { title: "t", from: "f" });
    expect(drafts.every((d) => d.kind !== "step_update" || d.targetId !== dataStep.id)).toBe(true);
  });

  it("reqdoc_not_shared only counts held kickoff (RUL-02)", () => {
    const s = createSeed();
    const pid = "p_garanti";
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const open: RqState = { ...s, steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "pending" as const } : x)) };
    const onlyPlanned: RqState = {
      ...open,
      meetings: open.meetings.map((m) => (m.projectId === pid && m.type === "kickoff" ? { ...m, status: "planned" as const } : m)),
    };
    const alerts1 = computeAlerts(onlyPlanned, "2026-10-20");
    expect(alerts1.some((a) => a.type === "reqdoc_not_shared" && a.projectId === pid)).toBe(false);

    const alerts2 = computeAlerts(open, "2026-10-20");
    expect(alerts2.some((a) => a.type === "reqdoc_not_shared" && a.projectId === pid)).toBe(true);
  });
});

describe("reqdoc_not_shared — reads step status, not a project field (AC7, M-09b)", () => {
  // createSeed() tarihleri "bugün"e göre kurar; seed'in referans tarihine sabitlenir.
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  function fixtureWithOpenReqdoc(pid: string) {
    const s = createSeed();
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    return { s, reqdoc };
  }

  it("pending reqdoc + held kickoff + threshold reached -> alert fires", () => {
    const { s, reqdoc } = fixtureWithOpenReqdoc("p_garanti");
    const next: RqState = { ...s, steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "pending" as const } : x)) };
    const alerts = computeAlerts(next, "2026-10-20");
    expect(alerts.some((a) => a.type === "reqdoc_not_shared" && a.projectId === "p_garanti")).toBe(true);
  });

  it.each(["done", "out_of_scope", "locked"] as const)("%s reqdoc never produces the alert", (status) => {
    const { s, reqdoc } = fixtureWithOpenReqdoc("p_garanti");
    const next: RqState = { ...s, steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status } : x)) };
    const alerts = computeAlerts(next, "2026-10-20");
    expect(alerts.some((a) => a.type === "reqdoc_not_shared" && a.projectId === "p_garanti")).toBe(false);
  });

  it("adding a req_doc document and settling closes the step and the alert", () => {
    const { s, reqdoc } = fixtureWithOpenReqdoc("p_garanti");
    const open: RqState = { ...s, steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "pending" as const } : x)) };
    expect(computeAlerts(open, "2026-10-20").some((a) => a.type === "reqdoc_not_shared" && a.projectId === "p_garanti")).toBe(true);
    const withDoc: RqState = { ...open, documents: [...open.documents, { id: "d_test_reqdoc", projectId: "p_garanti", type: "req_doc" as const, name: "Gereksinim.pdf", linkType: "project" as const, linkId: null, addedAt: "2026-10-20T10:00:00.000Z" }] };
    const { mk } = mkMk();
    const settled = settleAll(withDoc, mk, new Date("2026-10-20T09:00:00"));
    expect(settled.steps.find((x) => x.id === reqdoc.id)!.status).toBe("done");
    expect(computeAlerts(settled, "2026-10-20").some((a) => a.type === "reqdoc_not_shared" && a.projectId === "p_garanti")).toBe(false);
  });

  it("only-planned kickoff never produces the alert even with an open reqdoc", () => {
    const { s, reqdoc } = fixtureWithOpenReqdoc("p_garanti");
    const open: RqState = {
      ...s,
      steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "pending" as const } : x)),
      meetings: s.meetings.map((m) => (m.projectId === "p_garanti" && m.type === "kickoff" ? { ...m, status: "planned" as const } : m)),
    };
    expect(computeAlerts(open, "2026-10-20").some((a) => a.type === "reqdoc_not_shared" && a.projectId === "p_garanti")).toBe(false);
  });

  it("seed produces reqdoc_not_shared only for p_lojistik (S5/AC17)", () => {
    const s = createSeed();
    const hits = computeAlerts(s, "2026-10-20").filter((a) => a.type === "reqdoc_not_shared");
    expect(hits.map((a) => a.projectId)).toEqual(["p_lojistik"]);
  });
});

describe("RUL-12 — reqdoc_not_shared business-day threshold (holiday boundary)", () => {
  it("bd = reqDocDays - 1 -> no alert; bd = reqDocDays -> alert (count crosses the 29 Oct full-day holiday)", () => {
    const s = createSeed();
    const pid = "p_garanti";
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const open: RqState = {
      ...s,
      steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "pending" as const } : x)),
      meetings: s.meetings.map((m) => (m.projectId === pid && m.type === "kickoff" ? { ...m, status: "held" as const, date: "2026-10-27" } : m)),
    };
    // Kickoff 2026-10-27 (Tue). 28 Oct is a half-day holiday (arife) and still counts as a business
    // day; 29 Oct is the full-day Cumhuriyet Bayramı holiday and is skipped entirely.
    // 27 -> 28: 1 business day (bd = reqDocDays - 1 = 1) -> no alert.
    expect(computeAlerts(open, "2026-10-28").some((a) => a.type === "reqdoc_not_shared" && a.projectId === pid)).toBe(false);
    // 27 -> 29: still only 1 business day (28 counts, 29 is the full-day holiday itself and is skipped) ->
    // no alert. This is the assertion that actually proves the holiday is excluded from the count: if 29
    // Oct were not skipped, this would be bd = 2 and the alert would fire (REV-12).
    expect(computeAlerts(open, "2026-10-29").some((a) => a.type === "reqdoc_not_shared" && a.projectId === pid)).toBe(false);
    // 27 -> 30: 2 business days (28 counts, 29 is skipped, 30 is the 2nd business day) -> alert (bd = reqDocDays = 2).
    expect(computeAlerts(open, "2026-10-30").some((a) => a.type === "reqdoc_not_shared" && a.projectId === pid)).toBe(true);
  });
});

describe("template", () => {
  it("01 has no install_type/llm step keys", () => {
    const ph01 = PHASE_TEMPLATE.find((p) => p.code === "01")!;
    expect(ph01.steps.some((s) => s.key === "install_type" || s.key === "llm")).toBe(false);
  });
  it("00 index 5 is install_llm (data, independent, 2, required)", () => {
    const ph00 = PHASE_TEMPLATE.find((p) => p.code === "00")!;
    const step = ph00.steps[5];
    expect(step.key).toBe("install_llm");
    expect(step.completion).toBe("data");
    expect(step.dependency).toBe("independent");
    expect(step.durationDays).toBe(2);
    expect(step.required).toBe(true);
    expect(ph00.steps[4].key).toBe("brief");
  });
  it("02 teams step is not required", () => {
    const ph02 = PHASE_TEMPLATE.find((p) => p.code === "02")!;
    const teamsStep = ph02.steps.find((s) => s.key === "teams")!;
    expect(teamsStep.required).toBe(false);
  });

  it("01 reqdoc is completion 'data' (S5); 01 has exactly 3 steps: meeting / data / manual", () => {
    const ph01 = PHASE_TEMPLATE.find((p) => p.code === "01")!;
    expect(ph01.steps.length).toBe(3);
    const reqdoc = ph01.steps.find((s) => s.key === "reqdoc")!;
    expect(reqdoc.completion).toBe("data");
    const kickoff = ph01.steps.find((s) => s.key === "kickoff")!;
    expect(kickoff.completion).toBe("meeting");
    const presentation = ph01.steps.find((s) => s.key === "presentation")!;
    expect(presentation.completion).toBeUndefined();
  });

  it("stepConditionResult for an unmet reqdoc step reports missing field doc:req_doc", () => {
    const s = createSeed();
    const step = s.steps.find((x) => x.projectId === "p_ornek" && x.key === "reqdoc")!;
    const r = stepConditionResult(s, step)!;
    expect(r.met).toBe(false);
    expect(r.missing.map((m) => m.field)).toContain("doc:req_doc");
  });
});

describe("isAutoStep (REV-08)", () => {
  it("data and meeting steps are auto; manual and undefined completion are not", () => {
    expect(isAutoStep({ completion: "data" })).toBe(true);
    expect(isAutoStep({ completion: "meeting" })).toBe(true);
    expect(isAutoStep({ completion: "manual" })).toBe(false);
    expect(isAutoStep({ completion: undefined as unknown as "manual" })).toBe(false);
  });
});

describe("latestHeldMeeting", () => {
  it("returns the most recent held meeting of the given type, ignoring planned/cancelled", () => {
    const s = createSeed();
    const m = latestHeldMeeting(s, "p_isyatirim", "brief");
    expect(m?.id).toBe("m_brief_isy");
  });
  it("returns null when no held meeting of that type exists", () => {
    const s = createSeed();
    expect(latestHeldMeeting(s, "p_ornek", "kickoff")).toBeNull();
  });
});

describe("RUL-09 — meeting step reopen reason", () => {
  it("done meeting step in a not-done phase, with no held meeting left, reopens with the RUL-09 phrasing", () => {
    const s = createSeed();
    const pid = "p_ornek";
    const step = s.steps.find((x) => x.projectId === pid && x.key === "brief")!;
    // seed has this brief meeting only "planned" for p_ornek — force it held+done to set up the reopen scenario
    const held: RqState = {
      ...s,
      meetings: s.meetings.map((m) => (m.id === "m_brief_ornek" ? { ...m, status: "held" as const } : m)),
      steps: s.steps.map((x) => (x.id === step.id ? { ...x, status: "done" as const, activatedAt: NOW.toISOString() } : x)),
    };
    const noHeldBrief: RqState = { ...held, meetings: held.meetings.map((m) => (m.id === "m_brief_ornek" ? { ...m, type: "checkin" as const } : m)) };
    const { mk, audit } = mkMk();
    const back = applyStepCompletion(noHeldBrief, pid, mk, NOW);
    expect(back.steps.find((x) => x.id === step.id)!.status).toBe("pending");
    const entry = audit.find((a) => a.entityId === step.id && a.field === "status");
    expect(entry?.reason).toBe("Otomatik kural: Yapıldı durumunda Satış devri toplantısı kalmadı");
  });
});

describe("seed invariants (AC16)", () => {
  it("PHASE_TEMPLATE'te ve seed'deki hiçbir projede support_track adımı yoktur (S7)", async () => {
    const { PHASE_TEMPLATE } = await import("./seed");
    expect(PHASE_TEMPLATE.some((p) => p.steps.some((s) => s.key === "support_track"))).toBe(false);
    const s = createSeed();
    expect(s.steps.some((st) => st.key === "support_track")).toBe(false);
  });
  it("Garanti noCommitments is true", () => {
    const s = createSeed();
    expect(s.projects.find((p) => p.id === "p_garanti")!.noCommitments).toBe(true);
  });
  it("has a future-dated planned meeting", () => {
    const s = createSeed();
    const today = todayISO();
    expect(s.meetings.some((m) => m.status === "planned" && m.date > today)).toBe(true);
  });
  it("p_ornek sales_license missing licenseModel; install_llm missing both fields", () => {
    const s = createSeed();
    const sales = s.steps.find((x) => x.projectId === "p_ornek" && x.key === "sales_license")!;
    const r1 = stepConditionResult(s, sales)!;
    expect(r1.missing.map((m) => m.field)).toContain("licenseModel");
    const install = s.steps.find((x) => x.projectId === "p_ornek" && x.key === "install_llm")!;
    const r2 = stepConditionResult(s, install)!;
    expect(r2.missing.map((m) => m.field)).toEqual(["installType", "llmChoice"]);
  });
  it("every done data/meeting step in a done phase satisfies its condition (AC16 invariant, REV-03/RUL-03)", () => {
    // Exception: reqdoc (M-09b §7/§11 risk, accepted) — seed has no req_doc documents, so done 01
    // phases carry a reqdoc step that is "done" by seed fiat without satisfying its data condition.
    // The phase being done means the engine never reopens it (by design); this is accepted demo-data
    // inconsistency, not a regression.
    const s = createSeed();
    const donePhaseIds = new Set(s.phases.filter((p) => p.status === "done").map((p) => p.id));
    const offenders = s.steps.filter(
      (st) => donePhaseIds.has(st.phaseId) && st.status === "done" && st.completion !== "manual" && st.key !== "reqdoc",
    ).filter((st) => !(stepConditionResult(s, st)?.met ?? false));
    expect(offenders).toEqual([]);
  });
});

describe("training_plan / training_done conditions (AC5, AC-NEG1)", () => {
  it("training_plan is met by any non-cancelled training meeting; training_done requires all held", () => {
    const s = createSeed();
    const pid = "p_garanti"; // no training meetings yet
    const planCond = conditionFor("training_plan")!;
    const doneCond = conditionFor("training_done")!;
    expect(planCond.check(s, pid).met).toBe(false);
    expect(doneCond.check(s, pid).met).toBe(false);

    const withPlanned: RqState = {
      ...s,
      meetings: [...s.meetings, { id: "m_test_tr1", projectId: pid, type: "training", date: "2026-10-10", internalIds: [], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "planned" }],
    };
    expect(planCond.check(withPlanned, pid).met).toBe(true);
    expect(doneCond.check(withPlanned, pid).met).toBe(false);

    const withHeld: RqState = {
      ...withPlanned,
      meetings: withPlanned.meetings.map((m) => (m.id === "m_test_tr1" ? { ...m, status: "held" as const } : m)),
    };
    expect(doneCond.check(withHeld, pid).met).toBe(true);

    const withSecondPlanned: RqState = {
      ...withHeld,
      meetings: [...withHeld.meetings, { id: "m_test_tr2", projectId: pid, type: "training", date: "2026-10-12", internalIds: [], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "planned" }],
    };
    expect(doneCond.check(withSecondPlanned, pid).met).toBe(false); // AC5: reopens when a new planned session is added
  });

  it("AC-NEG1: only a cancelled training meeting satisfies neither condition; manualStatusError rejects manual done", () => {
    const s = createSeed();
    const pid = "p_garanti";
    const withCancelled: RqState = {
      ...s,
      meetings: [...s.meetings, { id: "m_test_trc", projectId: pid, type: "training", date: "2026-10-10", internalIds: [], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "cancelled" }],
    };
    expect(conditionFor("training_plan")!.check(withCancelled, pid).met).toBe(false);
    expect(conditionFor("training_done")!.check(withCancelled, pid).met).toBe(false);
    const step = s.steps.find((x) => x.projectId === pid && x.key === "training_done")!;
    expect(manualStatusError(step, "done")).toBe("Bu adım veriyle tamamlanır");
  });
});

describe("adaptationCondition / conditionFor('adapt:*') (AC8, AC9, AC-NEG2)", () => {
  it("no record -> all 5 items unmet; general (teamId null) uses 'adapt:general' label", () => {
    const s = createSeed();
    const r = adaptationCondition(s, "p_akbank", null);
    expect(r.met).toBe(false);
    expect(r.checks.every((c) => !c.met)).toBe(true);
    expect(r.checks.map((c) => c.field)).toEqual([
      "adapt:general:projectCreated", "adapt:general:docsIdentified", "adapt:general:docsUploaded", "adapt:general:aiTrained", "adapt:general:firstSamples",
    ]);
    const cond = conditionFor("adapt:general")!;
    expect(cond.label).toBe("Uyarlama kontrol listesi");
  });

  it("team-specific record -> field uses team name; label includes team", () => {
    const s = createSeed();
    const r = adaptationCondition(s, "p_isyatirim", "Herkese Borsa");
    expect(r.met).toBe(true); // seed has this team fully checked
    const cond = conditionFor("adapt:Herkese Borsa")!;
    expect(cond.label).toBe("Uyarlama kontrol listesi — Herkese Borsa");
  });

  it("conditionFor falls back to STEP_CONDITIONS for known keys and undefined for unknown ones", () => {
    expect(conditionFor("csm")).toBe(STEP_CONDITIONS.csm);
    expect(conditionFor(undefined)).toBeUndefined();
    expect(conditionFor("not_a_real_key")).toBeUndefined();
  });
});

describe("RUL-05 Seçenek A — ensureReviewAction / cancelReviewAction (AC19)", () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  /** p_isyatirim'de 01 done; reqdoc'u seed'in kendi "done" fiat'ından bağımsız, SaaS seçilip
   * req_doc paylaşılmamış senaryosuna göre out_of_scope'a zorlar (AC19 fixture'ı). */
  function fixtureWithOutOfScopeReqdoc(): RqState {
    const s = createSeed();
    const pid = "p_isyatirim";
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    return { ...s, steps: s.steps.map((x) => (x.id === reqdoc.id ? { ...x, status: "out_of_scope" as const } : x)) };
  }

  it("installType SaaS->On-prem on a done 01 phase: reqdoc stays out_of_scope, one open rule_review action opens with the right due/owner/title", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim"; // 01 is done
    const { mk } = mkMk();
    const next = applyInstallType(s, pid, "onprem", mk, "gerekçe", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    expect(reqdoc.status).toBe("out_of_scope");
    const ph01 = next.phases.find((p) => p.projectId === pid && p.code === "01")!;
    expect(ph01.status).toBe("done");
    const actions = next.actions.filter((a) => a.ruleKey === `rule_review:${reqdoc.id}`);
    expect(actions.length).toBe(1);
    const a = actions[0];
    expect(a.status).toBe("open");
    const project = next.projects.find((p) => p.id === pid)!;
    expect(a.ownerId).toBe(project.csmId);
    expect(a.ball).toBe("csm");
    expect(a.source).toBe("rule");
    expect(a.isCustomerVisible).toBe(false);
    expect(a.due).toBe(addBusinessDays(todayISO(), 2));
    expect(a.title).toContain("Gözden geçir: ");
    expect(a.title).toContain("Kurulum tipi SaaS→On-prem değişti; 01 Kick-off tamamlanmıştı");
    const createAudit = next.audit.find((au) => au.entity === "action" && au.entityId === a.id && au.kind === "create");
    expect(createAudit?.reason).toBe("Otomatik kural: Kurulum tipi SaaS→On-prem değişti; 01 Kick-off tamamlanmıştı");
    // RUL-07 (m09b r3): review action açıldığı için reqdoc_not_shared üretilmez.
    expect(computeAlerts(next, todayISO()).some((al) => al.type === "reqdoc_not_shared" && al.projectId === pid)).toBe(false);
  });

  it("idempotent: calling ensureReviewAction twice directly creates exactly one open action", () => {
    const s = createSeed();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    const step = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const phase = s.phases.find((p) => p.id === step.phaseId)!;
    let next = ensureReviewAction(s, pid, step, mk, "test gerekçe");
    next = ensureReviewAction(next, pid, step, mk, "test gerekçe");
    expect(next.actions.filter((a) => a.ruleKey === `rule_review:${step.id}`).length).toBe(1);
  });

  it("A -> B -> A: cancel then reopen reuses the same action id; total open count stays 1", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    let next = applyInstallType(s, pid, "onprem", mk, "r1", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const ruleKey = `rule_review:${reqdoc.id}`;
    const firstActionId = next.actions.find((a) => a.ruleKey === ruleKey)!.id;

    next = applyInstallType(next, pid, "saas", mk, "r2", "onprem");
    const cancelled = next.actions.find((a) => a.ruleKey === ruleKey)!;
    expect(cancelled.id).toBe(firstActionId);
    expect(cancelled.status).toBe("cancelled");

    next = applyInstallType(next, pid, "onprem", mk, "r3", "saas");
    const reopened = next.actions.filter((a) => a.ruleKey === ruleKey);
    expect(reopened.length).toBe(1);
    expect(reopened[0].id).toBe(firstActionId);
    expect(reopened[0].status).toBe("open");
  });

  it("LLM gpu choice on a done 03 phase: model_install stays out_of_scope, a rule_review action opens; non-gpu cancels it", () => {
    const s = createSeed();
    const pid = "p_isyatirim"; // 03 is done, model_install out_of_scope, llmChoice starts rabbitqa
    const { mk } = mkMk();
    let next = applyLlmChoice(s, pid, "gpu", mk, "gpu gerekçe", "rabbitqa");
    const model = next.steps.find((x) => x.projectId === pid && x.key === "model_install")!;
    expect(model.status).toBe("out_of_scope");
    const ruleKey = `rule_review:${model.id}`;
    const review = next.actions.find((a) => a.ruleKey === ruleKey)!;
    expect(review.status).toBe("open");
    expect(review.title).toContain("LLM tercihi RabbitQA LLM→Müşteri GPU'lu sunucu değişti; 03");

    next = applyLlmChoice(next, pid, "rabbitqa", mk, "geri dönüş", "gpu");
    expect(next.actions.find((a) => a.ruleKey === ruleKey)!.status).toBe("cancelled");
  });

  it("out_of_scope phase: triggering the rule does not change step status and does not open an action", () => {
    const s = createSeed();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    const reqdoc = s.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const outOfScopePhase = { ...s.phases.find((p) => p.id === reqdoc.phaseId)!, status: "out_of_scope" as const };
    const scoped: RqState = { ...s, phases: s.phases.map((p) => (p.id === outOfScopePhase.id ? outOfScopePhase : p)) };
    const next = applyInstallType(scoped, pid, "onprem", mk, "r", "saas");
    const after = next.steps.find((x) => x.id === reqdoc.id)!;
    expect(after.status).toBe(reqdoc.status);
    expect(next.actions.some((a) => a.ruleKey === `rule_review:${reqdoc.id}`)).toBe(false);
  });

  it("cancelReviewAction is a no-op when no open/in_progress action exists for the ruleKey", () => {
    const s = createSeed();
    const { mk } = mkMk();
    const next = cancelReviewAction(s, "p_isyatirim", "nonexistent_step_id", mk, "reason");
    expect(next).toBe(s);
  });

  it("due date lands after the configured business days, skipping weekends/holidays", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    const next = applyInstallType(s, pid, "onprem", mk, "r", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const action = next.actions.find((a) => a.ruleKey === `rule_review:${reqdoc.id}`)!;
    expect(action.due).toBe(addBusinessDays(todayISO(), 2, s.holidays.filter((h) => !h.halfDay).map((h) => h.date)));
  });

  it("item_late is produced once the review action's due date has passed (computeAlerts, alerts.ts mechanism reused)", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    const next = applyInstallType(s, pid, "onprem", mk, "r", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const action = next.actions.find((a) => a.ruleKey === `rule_review:${reqdoc.id}`)!;
    const future = addBusinessDays(action.due!, 3);
    const alerts = computeAlerts(next, future);
    expect(alerts.some((a) => a.type === "item_late" && a.entityId === action.id)).toBe(true);
  });

  it("REV-01/RUL-01: saas_env A->B->A on a done 03 phase — SaaS->On-prem cancels the review action, On-prem->SaaS reopens the same one", () => {
    const s = createSeed();
    const pid = "p_isyatirim"; // 03 is done, on-prem, no saas_env step yet
    const { mk } = mkMk();

    let next = applyInstallType(s, pid, "saas", mk, "r1", "onprem");
    let saasEnv = next.steps.find((x) => x.projectId === pid && x.key === "saas_env")!;
    expect(saasEnv.status).toBe("out_of_scope");
    const ruleKey = `rule_review:${saasEnv.id}`;
    const firstActionId = next.actions.find((a) => a.ruleKey === ruleKey)!.id;
    expect(next.actions.find((a) => a.id === firstActionId)!.status).toBe("open");

    next = applyInstallType(next, pid, "onprem", mk, "r2", "saas");
    const cancelled = next.actions.find((a) => a.ruleKey === ruleKey)!;
    expect(cancelled.id).toBe(firstActionId);
    expect(cancelled.status).toBe("cancelled");
    const cancelAudit = next.audit.find((au) => au.entity === "action" && au.entityId === cancelled.id && au.field === "status" && au.newValue === "cancelled");
    expect(cancelAudit?.reason).toBe("Otomatik kural: kurulum tipi değişti, gözden geçirme gereksiz");
    saasEnv = next.steps.find((x) => x.id === saasEnv.id)!;
    expect(saasEnv.status).toBe("out_of_scope");

    next = applyInstallType(next, pid, "saas", mk, "r3", "onprem");
    const reopened = next.actions.filter((a) => a.ruleKey === ruleKey);
    expect(reopened.length).toBe(1);
    expect(reopened[0].id).toBe(firstActionId);
    expect(reopened[0].status).toBe("open");
    expect(next.steps.filter((x) => x.projectId === pid && x.key === "saas_env").length).toBe(1);
  });

  it("REV-03/RUL-03 (c): retriggering while the action is in_progress does not open a second one", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    let next = applyInstallType(s, pid, "onprem", mk, "r1", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const ruleKey = `rule_review:${reqdoc.id}`;
    const actionId = next.actions.find((a) => a.ruleKey === ruleKey)!.id;
    next = { ...next, actions: next.actions.map((a) => (a.id === actionId ? { ...a, status: "in_progress" as const } : a)) };

    next = applyInstallType(next, pid, "onprem", mk, "r2", "saas");
    const matches = next.actions.filter((a) => a.ruleKey === ruleKey);
    expect(matches.length).toBe(1);
    expect(matches[0].id).toBe(actionId);
    expect(matches[0].status).toBe("in_progress");
  });

  it("REV-03/RUL-03 (d): retriggering after the action was completed opens a new one; the done record is untouched", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    let next = applyInstallType(s, pid, "onprem", mk, "r1", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const ruleKey = `rule_review:${reqdoc.id}`;
    const firstActionId = next.actions.find((a) => a.ruleKey === ruleKey)!.id;
    next = { ...next, actions: next.actions.map((a) => (a.id === firstActionId ? { ...a, status: "done" as const } : a)) };

    next = applyInstallType(next, pid, "onprem", mk, "r2", "saas");
    const matches = next.actions.filter((a) => a.ruleKey === ruleKey);
    expect(matches.length).toBe(2);
    const done = matches.find((a) => a.id === firstActionId)!;
    expect(done.status).toBe("done");
    const opened = matches.find((a) => a.id !== firstActionId)!;
    expect(opened.status).toBe("open");
  });

  it("REV-03/RUL-03 (e)/(f): reopening a cancelled action refreshes due/ownerId/title with a per-field audit; cancelling logs a status audit", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    let next = applyInstallType(s, pid, "onprem", mk, "r1", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const ruleKey = `rule_review:${reqdoc.id}`;
    const firstActionId = next.actions.find((a) => a.ruleKey === ruleKey)!.id;

    next = applyInstallType(next, pid, "saas", mk, "r2", "onprem");
    const cancelled = next.actions.find((a) => a.ruleKey === ruleKey)!;
    expect(cancelled.status).toBe("cancelled");
    const cancelAudit = next.audit.find((au) => au.entity === "action" && au.entityId === cancelled.id && au.field === "status" && au.newValue === "cancelled");
    expect(cancelAudit).toBeTruthy();
    expect(cancelAudit?.oldValue).toBe("open");

    const otherProject = { ...next.projects.find((p) => p.id === pid)! };
    const otherCsmId = next.users.find((u) => u.role === "csm" && u.id !== otherProject.csmId)?.id ?? otherProject.csmId;
    const reassigned: RqState = { ...next, projects: next.projects.map((p) => (p.id === pid ? { ...p, csmId: otherCsmId } : p)) };

    next = applyInstallType(reassigned, pid, "onprem", mk, "r3", "saas");
    const reopened = next.actions.find((a) => a.id === firstActionId)!;
    expect(reopened.status).toBe("open");
    expect(reopened.ownerId).toBe(otherCsmId);
    expect(reopened.due).toBe(addBusinessDays(todayISO(), 2));
    expect(reopened.title).toContain("SaaS→On-prem");

    const fieldsChanged = next.audit.filter((au) => au.entity === "action" && au.entityId === firstActionId && au.kind === "update" && au.at === NOW.toISOString());
    const changedFields = new Set(fieldsChanged.map((a) => a.field));
    expect(changedFields.has("status")).toBe(true);
    expect(changedFields.has("ownerId")).toBe(true);
  });

  it("REV-03/RUL-03 (g): a freshly opened review action is within dueSoonDays and produces action_due_soon", () => {
    const s = fixtureWithOutOfScopeReqdoc();
    const pid = "p_isyatirim";
    const { mk } = mkMk();
    const next = applyInstallType(s, pid, "onprem", mk, "r", "saas");
    const reqdoc = next.steps.find((x) => x.projectId === pid && x.key === "reqdoc")!;
    const action = next.actions.find((a) => a.ruleKey === `rule_review:${reqdoc.id}`)!;
    const alerts = computeAlerts(next, todayISO());
    expect(alerts.some((a) => a.type === "action_due_soon" && a.entityId === action.id)).toBe(true);
  });

  it("REV-03/RUL-03 (h): the LLM_ACTIONS cancel/reopen loop does not touch an open rule_review:* action", () => {
    const s = createSeed();
    const pid = "p_isyatirim"; // 03 is done
    const { mk } = mkMk();
    let next = applyLlmChoice(s, pid, "gpu", mk, "gpu gerekçe", "rabbitqa");
    const model = next.steps.find((x) => x.projectId === pid && x.key === "model_install")!;
    const ruleKey = `rule_review:${model.id}`;
    const action = next.actions.find((a) => a.ruleKey === ruleKey)!;
    expect(action.status).toBe("open");

    // Toggle gpu -> own -> gpu: LLM_ACTIONS members (gpu_req/gpu_model/llm_endpoint/llm_integration) cycle,
    // but the rule_review:* action must stay exactly as it is (it is not a member of LLM_ACTIONS).
    next = applyLlmChoice(next, pid, "own", mk, "own gerekçe", "gpu");
    const afterOwn = next.actions.find((a) => a.ruleKey === ruleKey)!;
    expect(afterOwn.id).toBe(action.id);
    expect(afterOwn.status).toBe("cancelled"); // cancelled by the model_install review cancel path, not by LLM_ACTIONS

    next = applyLlmChoice(next, pid, "gpu", mk, "gpu gerekçe 2", "own");
    const afterGpu = next.actions.filter((a) => a.ruleKey === ruleKey);
    expect(afterGpu.length).toBe(1);
    expect(afterGpu[0].id).toBe(action.id);
    expect(afterGpu[0].status).toBe("open");
  });

  it("REV-03/RUL-03 (i): a done phase keeps every ONPREM_KEYS step out_of_scope on On-prem->SaaS and opens a review action for each", () => {
    const s = createSeed();
    const pid = "p_isyatirim"; // 01 and 03 are done; force the ONPREM_KEYS steps out_of_scope first (AC19 fixture, same shape as fixtureWithOutOfScopeReqdoc)
    const onpremKeys: (string | undefined)[] = ["reqdoc", "vpn_req", "vpn_info", "servers", "devops_handover"];
    const scoped: RqState = {
      ...s,
      steps: s.steps.map((x) => (x.projectId === pid && onpremKeys.includes(x.key) ? { ...x, status: "out_of_scope" as const } : x)),
    };
    const { mk } = mkMk();
    const next = applyInstallType(scoped, pid, "onprem", mk, "r", "saas");
    for (const key of onpremKeys) {
      const st = next.steps.find((x) => x.projectId === pid && x.key === key)!;
      expect(st.status).toBe("out_of_scope");
      const action = next.actions.find((a) => a.ruleKey === `rule_review:${st.id}`);
      expect(action).toBeTruthy();
      expect(action?.status).toBe("open");
    }
  });
});

describe("buildReportSnapshot — p_perakende Uyarlama: Mobil (AC18)", () => {
  // createSeed() tarihleri "bugün"e göre kurar; seed'in referans tarihine sabitlenir.
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it("a step completed this week via an 'adapt:<team>' audit appears in the completed list; phases 04/05 are present with the right status", async () => {
    const { buildReportSnapshot } = await import("./reports");
    const { weekStartOf } = await import("./alerts");
    const s = createSeed();
    const pid = "p_perakende";
    const today = todayISO();
    const mobilStep = s.steps.find((x) => x.projectId === pid && x.key === "adapt:Mobil")!;
    const audit: AuditEntry = {
      id: "au_test_ac18", at: today + "T10:00:00.000Z", userId: "u_deniz", projectId: pid, kind: "update",
      entity: "step", entityId: mobilStep.id, label: "Uyarlama: Mobil", field: "status", oldValue: "pending", newValue: "done",
    };
    const withCompletion: RqState = {
      ...s,
      steps: s.steps.map((x) => (x.id === mobilStep.id ? { ...x, status: "done" as const } : x)),
      audit: [...s.audit, audit],
    };
    const snap = buildReportSnapshot(withCompletion, pid, weekStartOf(today), today);
    expect(snap.completed.some((c) => c.title === "Uyarlama: Mobil")).toBe(true);
    const ph04 = snap.phases.find((p) => p.code === "04")!;
    const ph05 = snap.phases.find((p) => p.code === "05")!;
    expect(ph04.status).toBe("done");
    expect(ph05.status).toBe("in_progress");
  });
});
