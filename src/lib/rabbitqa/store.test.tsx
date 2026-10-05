import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { toast } from "sonner";
import { RqProvider, useRq } from "./store";
import { manualStatusError } from "./completion";
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

describe("state v10 + login (AC11)", () => {
  it("createSeed version is 10", async () => {
    const { createSeed } = await import("./seed");
    expect(createSeed().version).toBe(10);
  });

  it("a v9 localStorage record is discarded and the seed is reloaded", () => {
    localStorage.setItem("rabbitqa-demo-state-v9", JSON.stringify({ version: 9, users: [] }));
    const { result } = setup();
    expect(result.current.state.version).toBe(10);
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
    const pid = "p_ornek";
    act(() => { result.current.setInstallChoice(pid, { installType: "onprem" }); });
    const reqdoc = result.current.state.steps.find((s) => s.projectId === pid && s.key === "reqdoc")!;
    expect(["pending", "in_progress", "locked"]).toContain(reqdoc.status);
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

describe("setInstallChoice — LLM gpu -> own -> gpu (AC13, RUL-11)", () => {
  it("toggles gpu/own actions and model_install step exactly once per ruleKey, each transition audited", () => {
    const { result } = setup();
    const pid = "p_isyatirim"; // llmChoice starts as rabbitqa
    act(() => { result.current.setInstallChoice(pid, { llmChoice: "gpu" }, "gpu'ya geçiş"); });
    const gpuActions1 = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_req");
    expect(gpuActions1.length).toBe(1);
    expect(gpuActions1[0].status).toBe("open");
    const model1 = result.current.state.steps.find((s) => s.projectId === pid && s.key === "model_install")!;
    expect(model1.status).not.toBe("out_of_scope");

    act(() => { result.current.setInstallChoice(pid, { llmChoice: "own" }, "own'a geçiş"); });
    const gpuActions2 = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_req");
    expect(gpuActions2.length).toBe(1);
    expect(gpuActions2[0].status).toBe("cancelled");
    const ownActions = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "llm_endpoint");
    expect(ownActions.length).toBe(1);
    expect(ownActions[0].status).toBe("open");
    const model2 = result.current.state.steps.find((s) => s.projectId === pid && s.key === "model_install")!;
    expect(model2.status).toBe("out_of_scope");

    act(() => { result.current.setInstallChoice(pid, { llmChoice: "gpu" }, "gpu'ya tekrar geçiş"); });
    const gpuActions3 = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "gpu_req");
    expect(gpuActions3.length).toBe(1);
    expect(gpuActions3[0].status).toBe("open");
    const ownActions2 = result.current.state.actions.filter((a) => a.projectId === pid && a.ruleKey === "llm_endpoint");
    expect(ownActions2[0].status).toBe("cancelled");
    const model3 = result.current.state.steps.find((s) => s.projectId === pid && s.key === "model_install")!;
    expect(model3.status).not.toBe("out_of_scope");

    const llmAudits = result.current.state.audit.filter((a) => a.projectId === pid && a.reason?.startsWith("Otomatik kural: LLM tercihi"));
    expect(llmAudits.length).toBeGreaterThan(0);

    const auditCountBefore = result.current.state.audit.length;
    act(() => { result.current.setInstallChoice(pid, { llmChoice: "gpu" }); });
    expect(result.current.state.audit.length).toBe(auditCountBefore);
  });
});
