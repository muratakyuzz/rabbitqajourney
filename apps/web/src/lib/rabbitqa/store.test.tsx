import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { RqProvider, useRq } from "./store";
import { manualStatusError } from "@rabbitqa/shared/domain/completion";
import { createSeed, STATE_KEY } from "@rabbitqa/shared/domain/seed";
import type { StepCompletion, StepStatus } from "@rabbitqa/shared/domain/types";
import { loginApi } from "@/lib/auth-api";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function setup() {
  return renderHook(() => useRq(), { wrapper: RqProvider });
}

/** Seeds a pending step_update insight on p_ornek. Without targetId it targets the first not-done step with the given completion and sets its status. */
function seedStepUpdateInsight({ completion = "manual", status = "pending", proposed, targetId }: {
  completion?: StepCompletion; status?: StepStatus; proposed: Record<string, unknown>; targetId?: string;
}) {
  const seeded = createSeed();
  const pid = "p_ornek";
  const step = seeded.steps.find((s) => s.projectId === pid && s.completion === completion && s.status !== "done")!;
  const stepId = targetId ?? step.id;
  const insight = {
    id: "ai_test_step_update", projectId: pid, source: "teams" as const, kind: "step_update" as const, status: "pending" as const,
    createdAt: new Date().toISOString(), targetId: stepId, current: { status: step.status },
    sourceRef: { title: "t", from: "f", at: new Date().toISOString(), excerpt: "x", link: "#" },
    proposed, rationale: "test", confidence: 90,
    reviewedBy: null, reviewedAt: null, reviewNote: "", appliedEntityId: null,
  };
  localStorage.setItem(STATE_KEY, JSON.stringify({
    ...seeded,
    steps: targetId ? seeded.steps : seeded.steps.map((s) => (s.id === step.id ? { ...s, status } : s)),
    insights: [...seeded.insights, insight],
  }));
  return { pid, stepId, insightId: insight.id };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("updateStep — manual completion guard (AC10)", () => {
  it("rejects manual done on a data step (pending -> done)", () => {
    const { result } = setup();
    const step = result.current.state.steps.find((s) => s.projectId === "p_ornek" && s.key === "sales_license")!;
    let err: string | null = null;
    act(() => { err = result.current.updateStep(step.id, { status: "done" }, "x"); });
    expect(err).toBe("Bu adım veriyle tamamlanır");
    expect(result.current.state.steps.find((s) => s.id === step.id)!.status).not.toBe("done");
  });

  it("rejects manual done -> pending on a completed data step", () => {
    const { result } = setup();
    const step = result.current.state.steps.find((s) => s.projectId === "p_isyatirim" && s.key === "sales_license")!;
    expect(step.status).toBe("done");
    let err: string | null = null;
    act(() => { err = result.current.updateStep(step.id, { status: "pending" }, "x"); });
    expect(err).toBe("Bu adım veriyle tamamlanır");
  });

  it("accepts data step -> out_of_scope", () => {
    const { result } = setup();
    const step = result.current.state.steps.find((s) => s.projectId === "p_ornek" && s.key === "sales_license")!;
    let err: string | null = null;
    act(() => { err = result.current.updateStep(step.id, { status: "out_of_scope" }, "kapsam dışı"); });
    expect(err).toBeNull();
    expect(result.current.state.steps.find((s) => s.id === step.id)!.status).toBe("out_of_scope");
  });
});

describe("setNoCommitments / addCommitment (AC11, AC-NEG1)", () => {
  it("marks Taahhütler step done when noCommitments is set", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let err: string | null = null;
    act(() => { err = result.current.setNoCommitments(pid, true); });
    expect(err).toBeNull();
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "commitments")!;
    expect(step.status).toBe("done");
  });

  it("adding a commitment clears noCommitments with an audit reason, step stays done", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => { result.current.setNoCommitments(pid, true); });
    act(() => { result.current.addCommitment({ projectId: pid, text: "Yeni taahhüt", targetPhaseCode: "00", status: "open", note: "" }); });
    const project = result.current.state.projects.find((p) => p.id === pid)!;
    expect(project.noCommitments).toBe(false);
    const entry = result.current.state.audit.find((a) => a.projectId === pid && a.field === "noCommitments" && a.newValue === "false");
    expect(entry?.reason).toBe("Otomatik kural: taahhüt eklendi");
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "commitments")!;
    expect(step.status).toBe("done");
  });

  it("rejects setNoCommitments(true) when an open commitment exists", () => {
    const { result } = setup();
    const pid = "p_isyatirim"; // has cm_1 open
    let err: string | null = null;
    act(() => { err = result.current.setNoCommitments(pid, true); });
    expect(err).toBe("Taahhüt varken 'Taahhüt yok' işaretlenemez");
  });
});

describe("updateStep — out_of_scope reopens via settle (AC10, REV-03)", () => {
  it("out_of_scope -> pending is accepted; settle marks it done once the condition is met", () => {
    const { result } = setup();
    const pid = "p_ornek";
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "commitments")!;
    act(() => { result.current.updateStep(step.id, { status: "out_of_scope" }, "kapsam dışı"); });
    expect(result.current.state.steps.find((s) => s.id === step.id)!.status).toBe("out_of_scope");
    let err: string | null = null;
    act(() => { err = result.current.updateStep(step.id, { status: "pending" }, "tekrar kapsama alındı"); });
    expect(err).toBeNull();
    expect(result.current.state.steps.find((s) => s.id === step.id)!.status).toBe("pending");
    act(() => { result.current.setNoCommitments(pid, true); });
    expect(result.current.state.steps.find((s) => s.id === step.id)!.status).toBe("done");
  });
});

describe("setInstallChoice (AC14, AC-NEG3)", () => {
  it("null -> onprem without reason succeeds and logs an audit entry", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setInstallChoice(pid, { installType: "onprem" });
    });
    expect(res.error).toBeNull();
    const entry = result.current.state.audit.find((a) => a.projectId === pid && a.field === "installType");
    expect(entry).toBeDefined();
  });

  it("onprem -> saas without reason is rejected and state is unchanged", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.setInstallChoice(pid, { installType: "onprem" });
    });
    const before = result.current.state;
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setInstallChoice(pid, { installType: "saas" });
    });
    expect(res.error).toBe("Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu");
    expect(result.current.state).toBe(before);
  });

  it("onprem -> saas with reason succeeds; on-prem steps become out_of_scope and saas_env opens", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.setInstallChoice(pid, { installType: "onprem" });
    });
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setInstallChoice(pid, { installType: "saas" }, "müşteri kararı");
    });
    expect(res.error).toBeNull();
    const reqdoc = result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!;
    expect(reqdoc.status).toBe("out_of_scope");
    const saasEnv = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env");
    expect(saasEnv).toBeDefined();
  });

  it("SaaS -> On-prem -> SaaS: saas_env created once, ONPREM steps toggle out_of_scope/locked, audited each time (RUL-01)", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.setInstallChoice(pid, { installType: "saas" });
    });
    const saasEnvAfterFirst = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnvAfterFirst).toBeDefined();
    const vpnInfoAfterSaas = result.current.state.steps.find((s) => s.projectId === pid && s.key === "vpn_info")!;
    expect(vpnInfoAfterSaas.status).toBe("out_of_scope");

    act(() => {
      result.current.setInstallChoice(pid, { installType: "onprem" }, "müşteri onprem'e döndü");
    });
    const vpnInfoAfterOnprem = result.current.state.steps.find((s) => s.projectId === pid && s.key === "vpn_info")!;
    expect(vpnInfoAfterOnprem.status).toBe("locked");
    const saasEnvAfterOnprem = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnvAfterOnprem.status).toBe("out_of_scope");

    act(() => {
      result.current.setInstallChoice(pid, { installType: "saas" }, "müşteri tekrar saas'a döndü");
    });
    const saasEnvSteps = result.current.state.steps.filter((s) => s.projectId === pid && s.key === "saas_env");
    expect(saasEnvSteps.length).toBe(1);
    const vpnInfoAfterSaasAgain = result.current.state.steps.find((s) => s.projectId === pid && s.key === "vpn_info")!;
    expect(vpnInfoAfterSaasAgain.status).toBe("out_of_scope");

    const installTypeAudits = result.current.state.audit.filter((a) => a.projectId === pid && a.reason?.startsWith("Otomatik kural: kurulum tipi"));
    expect(installTypeAudits.length).toBeGreaterThan(0);
  });

  it("value -> null is rejected", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.setInstallChoice(pid, { installType: "onprem" });
    });
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setInstallChoice(pid, { installType: null });
    });
    expect(res.error).toBe("Kurulum tipi seçildikten sonra 'Henüz belli değil' yapılamaz");
  });

  // RUL-08 (m09b r3): setInstallChoice'un updater'ı en güncel `cur` ile yeniden doğrular
  // (installChoiceError ikinci kez updater içinde çalışır — store.tsx:386). Ardışık, ayrı
  // render döngülerinde yapılan çağrılarda (gerçek UI tıklamaları gibi) outer `old` her zaman
  // güncel olduğu için bu yol zaten dıştaki kontrolle örtüşür (aşağıdaki test). Aynı `act()`
  // içinde art arda iki çağrı yapılırsa (React'in tek batch'te updater'ları zincirlediği durum)
  // dönüş değeri `error: null` olarak gelebilir, state yine de reddedilen değişikliği uygulamaz —
  // bu tutarsızlık BACKLOG.md'de ayrı bir düşük öncelikli bulgu olarak not edildi (teorik, gerçek
  // UI akışında tek tıklama = tek render döngüsü olduğu için tetiklenmez).
  it("installChoiceError is re-invoked with the updater's own cur (not the outer snapshot) — regression guard", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => { result.current.setInstallChoice(pid, { installType: "onprem" }); });
    expect(result.current.state.projects.find((p) => p.id === pid)!.installType).toBe("onprem");
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => { res = result.current.setInstallChoice(pid, { installType: "saas" }); });
    expect(res.error).toBe("Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu");
    expect(result.current.state.projects.find((p) => p.id === pid)!.installType).toBe("onprem");
  });
});

describe("addTeam — adaptation step (AC7)", () => {
  it("adds exactly one data step with the expected fields; second call is a no-op", () => {
    const { result } = setup();
    const pid = "p_garanti"; // 05 is locked
    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    const added = result.current.state.steps.filter((s) => s.projectId === pid && s.key === "adapt:Yeni Takım");
    expect(added.length).toBe(1);
    const step = added[0];
    expect(step.title).toBe("Uyarlama: Yeni Takım");
    expect(step.completion).toBe("data");
    expect(step.dependency).toBe("independent");
    expect(step.durationDays).toBe(10);
    expect(step.required).toBe(true);
    const project = result.current.state.projects.find((p) => p.id === pid)!;
    expect(step.ownerId).toBe(project.csmId);
    expect(step.status).toBe("locked");

    const auditCountBefore = result.current.state.audit.length;
    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    expect(result.current.state.steps.filter((s) => s.projectId === pid && s.key === "adapt:Yeni Takım").length).toBe(1);
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });

  it("RUL-06: rejects 'general' as a team name (collides with the adapt:general template step)", () => {
    const { result } = setup();
    const pid = "p_garanti";
    const stepCountBefore = result.current.state.steps.length;
    const teamsBefore = result.current.state.projects.find((p) => p.id === pid)!.teams;
    act(() => { result.current.addTeam(pid, "general"); });
    expect(result.current.state.steps.length).toBe(stepCountBefore);
    expect(result.current.state.projects.find((p) => p.id === pid)!.teams).toEqual(teamsBefore);
  });

  it("REV-10: new team's order continues after the highest existing order in phase 05 (not the step count)", () => {
    const { result } = setup();
    const pid = "p_garanti"; // already has one team step ("Mobil Bankacılık") with a gap-prone order
    const ph05 = result.current.state.phases.find((p) => p.projectId === pid && p.code === "05")!;
    const maxOrderBefore = Math.max(...result.current.state.steps.filter((s) => s.phaseId === ph05.id).map((s) => s.order));
    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "adapt:Yeni Takım")!;
    expect(step.order).toBe(maxOrderBefore + 1);
  });

  it("no rule_review action opens while 05 is locked or active", () => {
    const { result } = setup();
    const pid = "p_garanti";
    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "adapt:Yeni Takım")!;
    expect(result.current.state.actions.some((a) => a.ruleKey === `rule_review:${step.id}`)).toBe(false);
  });

  it("REV-02/RUL-02: 05 done — new team step is out_of_scope, a rule_review action opens for the CSM, phase stays done, second addTeam is a no-op", () => {
    const { result } = setup();
    const pid = "p_isyatirim"; // 05 is done
    const ph05Before = result.current.state.phases.find((p) => p.projectId === pid && p.code === "05")!;
    expect(ph05Before.status).toBe("done");

    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "adapt:Yeni Takım")!;
    expect(step.status).toBe("out_of_scope");
    const createAudit = result.current.state.audit.find((a) => a.entity === "step" && a.entityId === step.id && a.kind === "create");
    expect(createAudit?.reason).toBe("Otomatik kural: takım eklendi — 05 Uyarlama aşaması tamamlanmıştı");

    const action = result.current.state.actions.find((a) => a.ruleKey === `rule_review:${step.id}`)!;
    expect(action.status).toBe("open");
    const project = result.current.state.projects.find((p) => p.id === pid)!;
    expect(action.ownerId).toBe(project.csmId);
    expect(action.ball).toBe("csm");
    expect(action.title).toContain("Takım eklendi: Yeni Takım; 05 Uyarlama tamamlanmıştı");

    const ph05After = result.current.state.phases.find((p) => p.projectId === pid && p.code === "05")!;
    expect(ph05After.status).toBe("done");

    const auditCountBefore = result.current.state.audit.length;
    const actionCountBefore = result.current.state.actions.length;
    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    expect(result.current.state.steps.filter((s) => s.projectId === pid && s.key === "adapt:Yeni Takım").length).toBe(1);
    expect(result.current.state.audit.length).toBe(auditCountBefore);
    expect(result.current.state.actions.length).toBe(actionCountBefore);
  });

  it("REV-02/RUL-02: 05 out_of_scope — new team step is out_of_scope, no action opens, the existing team's step is untouched", () => {
    const pid = "p_garanti"; // 05 is locked in seed; force out_of_scope for this fixture
    const seeded = createSeed();
    const ph05 = seeded.phases.find((p) => p.projectId === pid && p.code === "05")!;
    const existingStep = seeded.steps.find((s) => s.projectId === pid && s.key === "adapt:Mobil Bankacılık")!;
    localStorage.setItem(STATE_KEY, JSON.stringify({
      ...seeded,
      phases: seeded.phases.map((p) => (p.id === ph05.id ? { ...p, status: "out_of_scope" as const } : p)),
    }));

    const { result } = setup();
    expect(result.current.state.phases.find((p) => p.id === ph05.id)!.status).toBe("out_of_scope");

    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "adapt:Yeni Takım")!;
    expect(step.status).toBe("out_of_scope");
    const createAudit = result.current.state.audit.find((a) => a.entity === "step" && a.entityId === step.id && a.kind === "create");
    expect(createAudit?.reason).toBe("Otomatik kural: takım eklendi — 05 Uyarlama aşaması kapsam dışı");
    expect(result.current.state.actions.some((a) => a.ruleKey === `rule_review:${step.id}`)).toBe(false);

    const existingAfter = result.current.state.steps.find((s) => s.id === existingStep.id)!;
    expect(existingAfter.status).toBe(existingStep.status);
  });
});

describe("setInstallChoice — SaaS step is manual (REV-01)", () => {
  it("saas_env step is created with completion manual and can be completed by hand", () => {
    const { result } = setup();
    const pid = "p_akbank";
    act(() => {
      result.current.setInstallChoice(pid, { installType: "saas", llmChoice: "rabbitqa" }, "müşteri kararı");
    });
    const saasEnv = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnv).toBeDefined();
    expect(saasEnv.completion).toBe("manual");
    expect(manualStatusError({ ...saasEnv, status: "pending" }, "done")).toBeNull();
  });
});

describe("approveInsight — step_update guard (AC17)", () => {
  it("rejects applying a step_update insight targeting a pending data step — step, insight and audit stay unchanged", () => {
    // ai-mock only proposes step_update for open manual steps, so the insight is seeded directly.
    const { stepId, insightId } = seedStepUpdateInsight({ completion: "data", status: "pending", proposed: { status: "done" } });
    const { result } = setup();
    const step = result.current.state.steps.find((s) => s.id === stepId);
    expect(step).toBeDefined();
    expect(step!.completion).toBe("data");
    expect(step!.status).toBe("pending");
    const insight = result.current.state.insights.find((i) => i.id === insightId);
    expect(insight).toBeDefined();
    if (!insight) throw new Error("seed");
    const auditCountBefore = result.current.state.audit.length;
    let err: string | null = null;
    act(() => { err = result.current.approveInsight(insight.id); });
    expect(err).toBe("Bu adım veriyle tamamlanır");
    expect(result.current.state.steps.find((s) => s.id === stepId)!.status).toBe("pending");
    expect(result.current.state.insights.find((i) => i.id === insightId)!.status).toBe("pending");
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });
});

describe("approveInsight — step_update goes through updateStep's lock rules (REV-13)", () => {
  it("AC1: rejects an edited step_update proposing 'locked' on an open manual step — step and insight stay unchanged", () => {
    const { stepId, insightId } = seedStepUpdateInsight({ status: "pending", proposed: { status: "pending" } });
    const { result } = setup();
    const auditCountBefore = result.current.state.audit.length;
    let err: string | null = null;
    act(() => { err = result.current.approveInsight(insightId, { status: "locked" }); });
    expect(err).toBe("\"Sırası gelmedi\" elle seçilemez");
    expect(result.current.state.steps.find((s) => s.id === stepId)!.status).toBe("pending");
    expect(result.current.state.insights.find((i) => i.id === insightId)!.status).toBe("pending");
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });

  it("AC2: rejects approving (no edit) a step_update whose target step is now locked — step and insight stay unchanged", () => {
    const { stepId, insightId } = seedStepUpdateInsight({ status: "locked", proposed: { status: "done" } });
    const { result } = setup();
    const auditCountBefore = result.current.state.audit.length;
    let err: string | null = null;
    act(() => { err = result.current.approveInsight(insightId); });
    expect(err).toBe("Adımın sırası gelmedi; durumu elle değiştirilemez");
    expect(result.current.state.steps.find((s) => s.id === stepId)!.status).toBe("locked");
    expect(result.current.state.insights.find((i) => i.id === insightId)!.status).toBe("pending");
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });

  it("AC3 (regression): approves a step_update to 'done' on an open manual step", () => {
    const { stepId, insightId } = seedStepUpdateInsight({ status: "pending", proposed: { status: "done" } });
    const { result } = setup();
    let err: string | null = null;
    act(() => { err = result.current.approveInsight(insightId); });
    expect(err).toBeNull();
    const step = result.current.state.steps.find((s) => s.id === stepId)!;
    expect(step.status).toBe("done");
    const insight = result.current.state.insights.find((i) => i.id === insightId)!;
    expect(insight.status).toBe("approved");
    expect(insight.appliedEntityId).toBe(stepId);
    const stepAudit = result.current.state.audit.find((a) => a.entity === "step" && a.entityId === stepId);
    expect(stepAudit?.reason).toMatch(/^AI Insight onaylandı/);
  });

  it("AC5 (regression): still rejects a step_update insight targeting an auto-completed (meeting) step", () => {
    const { stepId, insightId } = seedStepUpdateInsight({ completion: "meeting", status: "pending", proposed: { status: "done" } });
    const { result } = setup();
    const step = result.current.state.steps.find((s) => s.id === stepId);
    expect(step).toBeDefined();
    expect(step!.completion).toBe("meeting");
    expect(step!.status).toBe("pending");
    const insight = result.current.state.insights.find((i) => i.id === insightId);
    expect(insight).toBeDefined();
    if (!insight) throw new Error("seed");
    const auditCountBefore = result.current.state.audit.length;
    let err: string | null = null;
    act(() => { err = result.current.approveInsight(insight.id); });
    expect(err).toBe("Bu adım veriyle tamamlanır");
    expect(result.current.state.steps.find((s) => s.id === stepId)!.status).toBe("pending");
    expect(result.current.state.insights.find((i) => i.id === insightId)!.status).toBe("pending");
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });
});

describe("not found (RUL-03)", () => {
  it("updateStep with an unknown id returns 'Adım bulunamadı' — steps and audit stay unchanged", () => {
    const { result } = setup();
    const stepsBefore = result.current.state.steps;
    const auditCountBefore = result.current.state.audit.length;
    let err: string | null = null;
    act(() => { err = result.current.updateStep("st_missing", { status: "done" }, "x"); });
    expect(err).toBe("Adım bulunamadı");
    expect(result.current.state.steps).toEqual(stepsBefore);
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });

  it("approving a step_update whose target step does not exist returns 'Adım bulunamadı' — insight stays pending, audit unchanged", () => {
    const { insightId } = seedStepUpdateInsight({ targetId: "st_missing", proposed: { status: "done" } });
    const { result } = setup();
    expect(result.current.state.steps.some((s) => s.id === "st_missing")).toBe(false);
    const auditCountBefore = result.current.state.audit.length;
    let err: string | null = null;
    act(() => { err = result.current.approveInsight(insightId); });
    expect(err).toBe("Adım bulunamadı");
    expect(result.current.state.insights.find((i) => i.id === insightId)!.status).toBe("pending");
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });
});

describe("addTicket — support_track no-op (REV-07)", () => {
  it("opening a ticket leaves steps unchanged and writes no 'destek kaydı açıldı' rule audit", () => {
    const { result } = setup();
    const pid = "p_ornek";
    const stepsBefore = result.current.state.steps;
    let err: string | null = null;
    act(() => {
      err = result.current.addTicket({
        projectId: pid, title: "Test kaydı", description: "", module: "", priority: "medium", status: "open", ownerId: null,
        type: "technical", resolution: "", boardDecision: null, customerNotifiedAt: null,
      });
    });
    expect(err).toBeNull();
    expect(result.current.state.tickets.some((t) => t.projectId === pid && t.title === "Test kaydı")).toBe(true);
    expect(result.current.state.steps).toEqual(stepsBefore);
    expect(result.current.state.audit.some((a) => a.reason === "Otomatik kural: destek kaydı açıldı")).toBe(false);
  });
});

describe("flowMessages — Tamamlandı toast (AC10)", () => {
  it("auto-completing a data step toasts 'Tamamlandı: <title>'", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => { result.current.updateProject(pid, { licenseModel: "X" }); });
    expect(toast.success).toHaveBeenCalledWith("Tamamlandı: Satışçı ve lisans modelinin girilmesi");
  });

  it("a held brief meeting from the API (server effects) toasts the completed step once", () => {
    const { result } = setup();
    const pid = "p_ornek";
    const brief = result.current.state.steps.find((s) => s.projectId === pid && s.key === "brief")!;
    const meeting = { id: "m_api", projectId: pid, type: "brief" as const, date: "2026-10-01", internalIds: ["u_deniz"], contactIds: [], notes: "", decisions: "", isCustomerVisible: false, status: "held" as const };
    act(() => { result.current.applyServerEffects({ phases: [], steps: [{ ...brief, status: "done" }], actions: [], meetings: [meeting] }); });
    expect(result.current.state.meetings.find((m) => m.id === "m_api")).toEqual(meeting);
    const calls = (toast.success as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => c[0]);
    expect(calls.filter((m) => m === "Tamamlandı: Satış devri toplantısı")).toHaveLength(1);
  });
});

describe("state v11 + login (AC11, AC17)", () => {
  it("createSeed version is 11", async () => {
    const { createSeed } = await import("@rabbitqa/shared/domain/seed");
    expect(createSeed().version).toBe(11);
  });

  it("a v10 localStorage record is discarded and the seed is reloaded (REV-11)", () => {
    localStorage.setItem("rabbitqa-demo-state-v10", JSON.stringify({ version: 10, users: [] }));
    const { result } = setup();
    expect(result.current.state.version).toBe(11);
    expect(result.current.state.projects.length).toBeGreaterThan(0);
  });

  it("addUser then loginApi succeeds for the new user", async () => {
    const { result } = setup();
    act(() => { result.current.addUser({ name: "Yeni Kişi", email: "yeni@virgosol.com", role: "csm" }); });
    const res = await loginApi("yeni@virgosol.com", "x");
    expect(res.user.email).toBe("yeni@virgosol.com");
  });

  it("a deactivated user cannot log in", async () => {
    const { result } = setup();
    const u = result.current.state.users.find((x) => x.role === "csm" && x.active !== false)!;
    act(() => { result.current.updateUser(u.id, { active: false }); });
    await expect(loginApi(u.email, "x")).rejects.toThrow("Hesap pasif");
  });
});

describe("reqdoc — data-completed step, RUL-13 (AC12)", () => {
  it("a) out_of_scope reqdoc stays out_of_scope when a req_doc document is added; no new step audit", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => { result.current.setInstallChoice(pid, { installType: "saas" }); });
    const reqdoc = result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!;
    expect(reqdoc.status).toBe("out_of_scope");
    const auditCountBefore = result.current.state.audit.filter((a) => a.entityId === reqdoc.id).length;
    act(() => { result.current.addDocument({ projectId: pid, type: "req_doc", name: "Gereksinim.pdf", linkType: "project", linkId: null }); });
    const after = result.current.state.steps.find((s) => s.id === reqdoc.id)!;
    expect(after.status).toBe("out_of_scope");
    const auditCountAfter = result.current.state.audit.filter((a) => a.entityId === reqdoc.id).length;
    expect(auditCountAfter).toBe(auditCountBefore);
    expect(result.current.state.documents.some((d) => d.projectId === pid && d.type === "req_doc")).toBe(true);
  });

  it("b) locked reqdoc completes directly (done) when a req_doc document is added; 01 stays locked", () => {
    const { result } = setup();
    const pid = "p_ornek";
    const reqdoc = result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!;
    expect(reqdoc.status).toBe("locked");
    act(() => { result.current.addDocument({ projectId: pid, type: "req_doc", name: "Gereksinim.pdf", linkType: "project", linkId: null }); });
    const after = result.current.state.steps.find((s) => s.id === reqdoc.id)!;
    expect(after.status).toBe("done");
    const entry = result.current.state.audit.find((a) => a.entityId === reqdoc.id && a.newValue === "done");
    expect(entry?.reason).toBe("Otomatik kural: veri tamamlandı — Kurulum gereksinim dokümanı");
    expect(toast.success).toHaveBeenCalledWith("Tamamlandı: Kurulum gereksinim dokümanının paylaşılması");
    const ph01 = result.current.state.phases.find((p) => p.projectId === pid && p.code === "01")!;
    expect(ph01.status).toBe("locked");
  });

  it("c) pending reqdoc completes when a req_doc document is added", () => {
    const { result } = setup();
    const pid = "p_lojistik"; // 01 is in_progress, reqdoc is genuinely pending (not locked) in seed
    const reqdoc = result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!;
    expect(reqdoc.status).toBe("pending");
    act(() => { result.current.addDocument({ projectId: pid, type: "req_doc", name: "Gereksinim.pdf", linkType: "project", linkId: null }); });
    expect(result.current.state.steps.find((s) => s.id === reqdoc.id)!.status).toBe("done");
  });

  it("e) req_doc present: out_of_scope reqdoc re-completes to done once On-prem reopens it (locked -> done via settle)", () => {
    const { result } = setup();
    const pid = "p_ornek";
    // Go SaaS first (no req_doc yet) so reqdoc becomes out_of_scope, then add the document while still SaaS (RUL-13: no-op),
    // then switch back to On-prem: applyInstallType reopens the out_of_scope step to locked, and the same setState's
    // settleAll immediately completes it since the req_doc document already exists.
    act(() => { result.current.setInstallChoice(pid, { installType: "saas" }); });
    expect(result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!.status).toBe("out_of_scope");
    act(() => { result.current.addDocument({ projectId: pid, type: "req_doc", name: "Gereksinim.pdf", linkType: "project", linkId: null }); });
    expect(result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!.status).toBe("out_of_scope");
    act(() => { result.current.setInstallChoice(pid, { installType: "onprem" }, "müşteri on-prem'e döndü"); });
    expect(result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!.status).toBe("done");
  });

  it("f) no setStepByKey call referencing 'reqdoc' remains in store.tsx", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.dirname(new URL(import.meta.url).pathname);
    const src = fs.readFileSync(path.join(dir, "store.tsx"), "utf-8");
    expect(/setStepByKey\([^)]*"reqdoc"/.test(src)).toBe(false);
  });
});

describe("setInstallChoice — SaaS -> On-prem -> SaaS (AC13, RUL-10)", () => {
  it("each transition adds a new 'Otomatik kural: kurulum tipi' audit; saas_env re-locks on return to SaaS with the same id throughout", () => {
    const { result } = setup();
    const pid = "p_ornek";
    const kuralAuditCount = () => result.current.state.audit.filter((a) => a.projectId === pid && a.reason?.startsWith("Otomatik kural: kurulum tipi")).length;

    act(() => { result.current.setInstallChoice(pid, { installType: "saas" }); });
    const afterFirst = kuralAuditCount();
    expect(afterFirst).toBeGreaterThan(0);
    const saasEnvId = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!.id;
    expect(result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!.status).toBe("locked");

    act(() => { result.current.setInstallChoice(pid, { installType: "onprem" }, "müşteri on-prem'e döndü"); });
    const afterSecond = kuralAuditCount();
    expect(afterSecond).toBeGreaterThan(afterFirst);
    const saasEnvAfterOnprem = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnvAfterOnprem.id).toBe(saasEnvId);
    expect(saasEnvAfterOnprem.status).toBe("out_of_scope");

    act(() => { result.current.setInstallChoice(pid, { installType: "saas" }, "müşteri saas'a döndü"); });
    const afterThird = kuralAuditCount();
    expect(afterThird).toBeGreaterThan(afterSecond);
    // RUL-10: SaaS -> On-prem -> SaaS must re-lock saas_env (no duplicate step), not leave it out_of_scope.
    const saasEnvAfterReturn = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnvAfterReturn.id).toBe(saasEnvId);
    expect(saasEnvAfterReturn.status).toBe("locked");
    expect(result.current.state.steps.filter((s) => s.projectId === pid && s.key === "saas_env").length).toBe(1);

    act(() => { result.current.setInstallChoice(pid, { installType: "onprem" }, "müşteri tekrar on-prem'e döndü"); });
    const saasEnvFinal = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnvFinal.id).toBe(saasEnvId);
    expect(saasEnvFinal.status).toBe("out_of_scope");
  });
});

describe("setInstallChoice — LLM gpu -> own -> gpu, 03 done (AC13, AC19, RUL-06 m09b)", () => {
  it("toggles gpu/own actions; model_install stays out_of_scope (phase done) and a rule_review action opens/cancels instead", () => {
    const { result } = setup();
    const pid = "p_isyatirim"; // llmChoice starts as rabbitqa, phase 03 is done
    const model = result.current.state.steps.find((s) => s.projectId === pid && s.key === "model_install")!;
    expect(model.status).toBe("out_of_scope");
    const ruleKey = `rule_review:${model.id}`;

    act(() => { result.current.setInstallChoice(pid, { llmChoice: "gpu" }, "gpu'ya geçiş"); });
    const gpuActions1 = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_req");
    expect(gpuActions1.length).toBe(1);
    expect(gpuActions1[0].status).toBe("open");
    const model1 = result.current.state.steps.find((s) => s.id === model.id)!;
    expect(model1.status).toBe("out_of_scope"); // RUL-05: tamamlanmış aşamada durum değişmez
    const review1 = result.current.state.actions.find((a) => a.ruleKey === ruleKey && a.status === "open");
    expect(review1).toBeDefined();

    act(() => { result.current.setInstallChoice(pid, { llmChoice: "own" }, "own'a geçiş"); });
    const gpuActions2 = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_req");
    expect(gpuActions2[0].status).toBe("cancelled");
    const ownActions = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "llm_endpoint");
    expect(ownActions.length).toBe(1);
    expect(ownActions[0].status).toBe("open");
    const model2 = result.current.state.steps.find((s) => s.id === model.id)!;
    expect(model2.status).toBe("out_of_scope");
    const review2 = result.current.state.actions.find((a) => a.ruleKey === ruleKey);
    expect(review2!.status).toBe("cancelled");

    act(() => { result.current.setInstallChoice(pid, { llmChoice: "gpu" }, "gpu'ya tekrar geçiş"); });
    const gpuActions3 = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_req");
    expect(gpuActions3[0].status).toBe("open");
    const review3 = result.current.state.actions.filter((a) => a.ruleKey === ruleKey);
    expect(review3.length).toBe(1); // A -> B -> A reuses the same action
    expect(review3[0].status).toBe("open");
    const model3 = result.current.state.steps.find((s) => s.id === model.id)!;
    expect(model3.status).toBe("out_of_scope");

    // RUL-06 (m09b r2): ruleKey uniqueness across the whole gpu->own->gpu cycle, and one
    // 'Otomatik kural: LLM tercihi' audit entry recorded per transition (3 calls so far).
    expect(result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_req").length).toBe(1);
    expect(result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_model").length).toBe(1);
    expect(result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "llm_endpoint").length).toBe(1);
    expect(result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "llm_integration").length).toBe(1);
    // Each of the 3 transitions logs its own action/project audits under this reason prefix;
    // asserting >=3 (one lower bound per transition) proves auditing happens every time, not just once.
    const llmAudits = result.current.state.audit.filter((a) => a.projectId === pid && a.reason?.startsWith("Otomatik kural: LLM tercihi"));
    expect(llmAudits.length).toBeGreaterThanOrEqual(3);

    const auditCountBefore = result.current.state.audit.length;
    act(() => { result.current.setInstallChoice(pid, { llmChoice: "gpu" }); });
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });
});

describe("updateRisk — status/due reason guard (REV-01, INV-06)", () => {
  it("rejects a status change without a reason", () => {
    const { result } = setup();
    const risk = result.current.state.risks.find((r) => r.id === "r_1")!;
    expect(risk.status).toBe("open");
    let err: string | null = null;
    act(() => { err = result.current.updateRisk(risk.id, { status: "mitigated" }); });
    expect(err).toBe("Durum veya termin değişikliğinde gerekçe zorunlu");
    expect(result.current.state.risks.find((r) => r.id === "r_1")!.status).toBe("open");
  });

  it("rejects a due-date change without a reason", () => {
    const { result } = setup();
    const risk = result.current.state.risks.find((r) => r.id === "r_1")!;
    let err: string | null = null;
    act(() => { err = result.current.updateRisk(risk.id, { due: "2026-11-01" }); });
    expect(err).toBe("Durum veya termin değişikliğinde gerekçe zorunlu");
    expect(result.current.state.risks.find((r) => r.id === "r_1")!.due).toBe(risk.due);
  });

  it("accepts a status change with a reason, and records it on the audit entry", () => {
    const { result } = setup();
    const risk = result.current.state.risks.find((r) => r.id === "r_1")!;
    let err: string | null = null;
    act(() => { err = result.current.updateRisk(risk.id, { status: "mitigated" }, "PO'lar haftalık bakım saatini devreye aldı"); });
    expect(err).toBeNull();
    expect(result.current.state.risks.find((r) => r.id === "r_1")!.status).toBe("mitigated");
    const entry = result.current.state.audit.find((a) => a.entityId === risk.id && a.field === "status");
    expect(entry?.reason).toBe("PO'lar haftalık bakım saatini devreye aldı");
  });

  it("allows title/description changes without a reason", () => {
    const { result } = setup();
    const risk = result.current.state.risks.find((r) => r.id === "r_1")!;
    let err: string | null = null;
    act(() => { err = result.current.updateRisk(risk.id, { title: "Güncel başlık" }); });
    expect(err).toBeNull();
    expect(result.current.state.risks.find((r) => r.id === "r_1")!.title).toBe("Güncel başlık");
  });
});
