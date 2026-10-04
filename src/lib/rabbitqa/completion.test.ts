import { describe, it, expect } from "vitest";
import { applyStepCompletion, manualStatusError, settleAll, settleProject, stepConditionResult, STEP_CONDITIONS } from "./completion";
import { installChoiceError, applyMeetingHeldRules } from "./rules";
import { analyzeText } from "./ai-mock";
import { computeAlerts } from "./alerts";
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
    const onlyPlanned: RqState = {
      ...s,
      meetings: s.meetings.map((m) => (m.projectId === pid && m.type === "kickoff" ? { ...m, status: "planned" as const } : m)),
    };
    const alerts1 = computeAlerts(onlyPlanned, "2026-10-20");
    expect(alerts1.some((a) => a.type === "reqdoc_not_shared" && a.projectId === pid)).toBe(false);

    const alerts2 = computeAlerts(s, "2026-10-20");
    expect(alerts2.some((a) => a.type === "reqdoc_not_shared" && a.projectId === pid)).toBe(true);
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
});

describe("seed invariants (AC16)", () => {
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
    const s = createSeed();
    const donePhaseIds = new Set(s.phases.filter((p) => p.status === "done").map((p) => p.id));
    const offenders = s.steps.filter(
      (st) => donePhaseIds.has(st.phaseId) && st.status === "done" && st.completion !== "manual",
    ).filter((st) => !(stepConditionResult(s, st)?.met ?? false));
    expect(offenders).toEqual([]);
  });
});
