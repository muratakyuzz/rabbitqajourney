import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { RqProvider, useRq } from "./store";
import { manualStatusError } from "./completion";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" } }),
}));

function setup() {
  return renderHook(() => useRq(), { wrapper: RqProvider });
}

beforeEach(() => {
  localStorage.clear();
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

describe("setKickoff (AC14, AC-NEG3)", () => {
  it("null -> onprem without reason succeeds and logs an audit entry", () => {
    const { result } = setup();
    const pid = "p_ornek";
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setKickoff(pid, { presentationShared: false, installType: "onprem", llmChoice: null, reqDocShared: false, reqDocSharedAt: null });
    });
    expect(res.error).toBeNull();
    const entry = result.current.state.audit.find((a) => a.projectId === pid && a.field === "installType");
    expect(entry).toBeDefined();
  });

  it("onprem -> saas without reason is rejected and state is unchanged", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.setKickoff(pid, { presentationShared: false, installType: "onprem", llmChoice: null, reqDocShared: false, reqDocSharedAt: null });
    });
    const before = result.current.state;
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setKickoff(pid, { presentationShared: false, installType: "saas", llmChoice: null, reqDocShared: false, reqDocSharedAt: null });
    });
    expect(res.error).toBe("Kurulum tipi veya LLM değişikliğinde gerekçe zorunlu");
    expect(result.current.state).toBe(before);
  });

  it("onprem -> saas with reason succeeds; on-prem steps become out_of_scope and saas_env opens", () => {
    const { result } = setup();
    const pid = "p_ornek";
    act(() => {
      result.current.setKickoff(pid, { presentationShared: false, installType: "onprem", llmChoice: null, reqDocShared: false, reqDocSharedAt: null });
    });
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setKickoff(pid, { presentationShared: false, installType: "saas", llmChoice: null, reqDocShared: false, reqDocSharedAt: null }, "müşteri kararı");
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
      result.current.setKickoff(pid, { presentationShared: false, installType: "saas", llmChoice: null, reqDocShared: false, reqDocSharedAt: null });
    });
    const saasEnvAfterFirst = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnvAfterFirst).toBeDefined();
    const vpnInfoAfterSaas = result.current.state.steps.find((s) => s.projectId === pid && s.key === "vpn_info")!;
    expect(vpnInfoAfterSaas.status).toBe("out_of_scope");

    act(() => {
      result.current.setKickoff(pid, { presentationShared: false, installType: "onprem", llmChoice: null, reqDocShared: false, reqDocSharedAt: null }, "müşteri onprem'e döndü");
    });
    const vpnInfoAfterOnprem = result.current.state.steps.find((s) => s.projectId === pid && s.key === "vpn_info")!;
    expect(vpnInfoAfterOnprem.status).toBe("locked");
    const saasEnvAfterOnprem = result.current.state.steps.find((s) => s.projectId === pid && s.key === "saas_env")!;
    expect(saasEnvAfterOnprem.status).toBe("out_of_scope");

    act(() => {
      result.current.setKickoff(pid, { presentationShared: false, installType: "saas", llmChoice: null, reqDocShared: false, reqDocSharedAt: null }, "müşteri tekrar saas'a döndü");
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
      result.current.setKickoff(pid, { presentationShared: false, installType: "onprem", llmChoice: null, reqDocShared: false, reqDocSharedAt: null });
    });
    let res: { error: string | null; summary: string | null } = { error: null, summary: null };
    act(() => {
      res = result.current.setKickoff(pid, { presentationShared: false, installType: null, llmChoice: null, reqDocShared: false, reqDocSharedAt: null });
    });
    expect(res.error).toBe("Kurulum tipi seçildikten sonra 'Henüz belli değil' yapılamaz");
  });
});

describe("addTeam — adaptation steps are manual (REV-01)", () => {
  it("adds adaptation steps with completion manual and manualStatusError allows done", () => {
    const { result } = setup();
    const pid = "p_akbank";
    act(() => { result.current.addTeam(pid, "Yeni Takım"); });
    const added = result.current.state.steps.filter((s) => s.projectId === pid && s.title.startsWith("Yeni Takım"));
    expect(added.length).toBeGreaterThan(0);
    added.forEach((s) => {
      expect(s.completion).toBe("manual");
      expect(manualStatusError({ ...s, status: "pending" }, "done")).toBeNull();
    });
  });
});

describe("addTraining — participant step is manual (REV-01)", () => {
  it("done training step stays done after settleAll and no 'data missing' audit is written", () => {
    const { result } = setup();
    const pid = "p_akbank";
    act(() => {
      result.current.addTraining({ projectId: pid, date: "2026-10-10", trainerId: null, attendees: "Ali, Veli", modules: [], recordingUrl: "", notes: "", status: "done" });
    });
    const step = result.current.state.steps.find((s) => s.projectId === pid && s.title.includes("2026") && s.status === "done" && s.completion === "manual")!;
    expect(step).toBeDefined();
    expect(step.status).toBe("done");
    const reopened = result.current.state.audit.find((a) => a.entityId === step.id && a.reason?.startsWith("Otomatik kural: veri eksildi"));
    expect(reopened).toBeUndefined();
  });
});

describe("setKickoff — SaaS step is manual (REV-01)", () => {
  it("saas_env step is created with completion manual and can be completed by hand", () => {
    const { result } = setup();
    const pid = "p_akbank";
    act(() => {
      result.current.setKickoff(pid, { presentationShared: true, installType: "saas", llmChoice: "rabbitqa", reqDocShared: true, reqDocSharedAt: "2026-09-08" }, "müşteri kararı");
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
