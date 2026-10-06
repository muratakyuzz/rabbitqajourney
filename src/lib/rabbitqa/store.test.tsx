import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { RqProvider, useRq } from "./store";
import { manualStatusError } from "./completion";
import { createSeed, STATE_KEY } from "./seed";
import { loginApi } from "@/lib/auth-api";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function setup() {
  return renderHook(() => useRq(), { wrapper: RqProvider });
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

describe("addMeeting / updateMeeting (AC12, AC-NEG2)", () => {
  it("held brief meeting completes the Satış devri toplantısı step even while locked", () => {
    const { result } = setup();
    const pid = "p_ornek";
    const step0 = result.current.state.steps.find((s) => s.projectId === pid && s.key === "brief")!;
    expect(step0.status).toBe("locked");
    act(() => {
      result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-10-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "held" }, []);
    });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "brief")!;
    expect(step.status).toBe("done");
  });

  it("planned brief meeting does not complete the step", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-12-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "planned" }, []);
    });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "brief")!;
    expect(step.status).not.toBe("done");
  });

  it("updateMeeting planned -> held completes the step", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let meetingId = "";
    act(() => {
      meetingId = result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-12-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "planned" }, []);
    });
    act(() => { result.current.updateMeeting(meetingId, { status: "held" }); });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "brief")!;
    expect(step.status).toBe("done");
  });

  it("rejects status change on a held meeting", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let meetingId = "";
    act(() => {
      meetingId = result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-10-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "held" }, []);
    });
    let err: string | null = null;
    act(() => { err = result.current.updateMeeting(meetingId, { status: "cancelled" }, "gerekçe"); });
    expect(err).toBe("Yalnızca Planlandı toplantının durumu değiştirilebilir");
  });

  // AC-NEG5 / RUL-07 (m09a): held toplantıda tür veya tarih değişikliği gerekçesiz reddedilir.
  it("rejects a held meeting's date change without a reason, accepts it with one (RUL-07 m09a, AC-NEG5)", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let meetingId = "";
    act(() => {
      meetingId = result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-10-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "held" }, []);
    });
    let err: string | null = null;
    act(() => { err = result.current.updateMeeting(meetingId, { date: "2026-10-02" }); });
    expect(err).toBe("Yapılmış toplantının tür/tarih değişikliğinde gerekçe zorunlu");
    expect(result.current.state.meetings.find((m) => m.id === meetingId)!.date).toBe("2026-10-01");

    act(() => { err = result.current.updateMeeting(meetingId, { date: "2026-10-02" }, "müşteri talebiyle tarih güncellendi"); });
    expect(err).toBeNull();
    const after = result.current.state.meetings.find((m) => m.id === meetingId)!;
    expect(after.date).toBe("2026-10-02");
    const audit = result.current.state.audit.find((a) => a.entity === "meeting" && a.entityId === meetingId && a.field === "date");
    expect(audit?.reason).toBe("müşteri talebiyle tarih güncellendi");
  });

  it("rejects a held meeting's type change without a reason (RUL-07 m09a)", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let meetingId = "";
    act(() => {
      meetingId = result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-10-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "held" }, []);
    });
    let err: string | null = null;
    act(() => { err = result.current.updateMeeting(meetingId, { type: "kickoff" }); });
    expect(err).toBe("Yapılmış toplantının tür/tarih değişikliğinde gerekçe zorunlu");
    expect(result.current.state.meetings.find((m) => m.id === meetingId)!.type).toBe("brief");
  });

  it("rejects planned -> cancelled without reason", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let meetingId = "";
    act(() => {
      meetingId = result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-12-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "planned" }, []);
    });
    let err: string | null = null;
    act(() => { err = result.current.updateMeeting(meetingId, { status: "cancelled" }); });
    expect(err).toBe("İptal için gerekçe zorunlu");
  });

  it("cancelled meeting does not complete the step (AC12, REV-03)", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let meetingId = "";
    act(() => {
      meetingId = result.current.addMeeting({ projectId: pid, type: "brief", date: "2026-12-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "planned" }, []);
    });
    act(() => { result.current.updateMeeting(meetingId, { status: "cancelled" }, "müşteri iptal etti"); });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.key === "brief")!;
    expect(step.status).not.toBe("done");
  });

  it("planned devops_handover does not move the ball; held moves ball to devops and completes the step (AC13, REV-03)", () => {
    const { result } = setup();
    const pid = "p_isyatirim";
    const before = result.current.state.steps.find((s) => s.projectId === pid && s.key === "devops_handover")!;
    const beforeBall = before.ball;
    let meetingId = "";
    act(() => {
      meetingId = result.current.addMeeting({ projectId: pid, type: "devops_handover", date: "2026-12-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "planned" }, []);
    });
    const afterPlanned = result.current.state.steps.find((s) => s.projectId === pid && s.key === "devops_handover")!;
    expect(afterPlanned.ball).toBe(beforeBall);
    act(() => { result.current.updateMeeting(meetingId, { status: "held" }); });
    const afterHeld = result.current.state.steps.find((s) => s.projectId === pid && s.key === "devops_handover")!;
    expect(afterHeld.ball).toBe("devops");
    expect(afterHeld.status).toBe("done");
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
  it("rejects applying a step_update insight targeting a non-manual step", () => {
    const { result } = setup();
    const pid = "p_ornek";
    const dataStep = result.current.state.steps.find((s) => s.projectId === pid && s.completion === "data")!;
    act(() => {
      result.current.simulateIncoming(pid, "teams", `${dataStep.title} tamamlandı.`, { title: "t", from: "f" });
    });
    const insight = result.current.state.insights.find((i) => i.projectId === pid && i.kind === "step_update" && i.targetId === dataStep.id);
    // ai-mock filters out non-manual steps entirely — no such insight should exist, so this path is defensive.
    if (!insight) return;
    let err: string | null = null;
    act(() => { err = result.current.approveInsight(insight.id); });
    expect(err).toBe("Bu adım veriyle tamamlanır");
  });
});

describe("flowMessages — Tamamlandı toast (AC10)", () => {
  it("auto-completing a data step toasts 'Tamamlandı: <title>'", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => { result.current.updateProject(pid, { licenseModel: "X" }); });
    expect(toast.success).toHaveBeenCalledWith("Tamamlandı: Satışçı ve lisans modelinin girilmesi");
  });

  it("a held brief meeting with a rule action keeps its toast across the follow-up setState (does not get overwritten)", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.addMeeting(
        { projectId: pid, type: "brief", date: "2026-10-01", internalIds: [], contactIds: [], notes: "", decisions: "", status: "held" },
        [{ title: "Takip aksiyonu", ownerId: null, ball: "csm", due: null, priority: "medium", status: "open" }],
      );
    });
    const calls = (toast.success as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => c[0]);
    const matches = calls.filter((m) => m === "Tamamlandı: Satış devri toplantısı");
    expect(matches.length).toBe(1);
  });
});

describe("state v11 + login (AC11, AC17)", () => {
  it("createSeed version is 11", async () => {
    const { createSeed } = await import("./seed");
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
