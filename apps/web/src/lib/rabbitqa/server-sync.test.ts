import { describe, expect, it } from "vitest";
import type { ProjectCore } from "@rabbitqa/shared";
import { createSeed } from "@rabbitqa/shared/domain/seed";
import type { Action } from "@rabbitqa/shared/domain/types";
import { canon, describeSent, diffProject, emptyView, mergeEffects, recordActions, recordSteps, replaceProjectData, snapshotView } from "./server-sync";

const rule = (over: Partial<Action>): Action => ({
  id: "a_x", projectId: "p_garanti", title: "Kural", ownerId: null, ball: "csm", due: null, priority: "medium",
  status: "open", source: "rule", meetingId: null, createdAt: "2026-10-12T09:00:00.000Z", ruleKey: "rk", isCustomerVisible: false, ...over,
});

describe("canon", () => {
  it("ignores key order and undefined fields", () => {
    expect(canon({ b: 1, a: { d: undefined, c: 2 } })).toBe(canon({ a: { c: 2 }, b: 1 }));
  });
});

describe("mergeEffects", () => {
  it("places phases/steps by id and adds new ones", () => {
    const s = createSeed();
    const step = { ...s.steps[0], title: "Sunucudan" };
    const added = { ...s.steps[0], id: "st_new" };
    const out = mergeEffects(s, { phases: [], steps: [step, added], actions: [] });
    expect(out.steps.find((x) => x.id === step.id)?.title).toBe("Sunucudan");
    expect(out.steps.filter((x) => x.id === "st_new")).toHaveLength(1);
    expect(out.steps).toHaveLength(s.steps.length + 1);
  });

  it("a server rule action replaces the local one with the same ruleKey (no duplicate)", () => {
    const s = { ...createSeed(), actions: [rule({ id: "a_local", title: "Yerel" })] };
    const out = mergeEffects(s, { phases: [], steps: [], actions: [rule({ id: "a_server", title: "Sunucu" })] });
    expect(out.actions).toEqual([rule({ id: "a_server", title: "Sunucu" })]);
  });

  it("keeps rule history: a done copy stays, only the open one is replaced", () => {
    const old = rule({ id: "a_old", status: "done", createdAt: "2026-10-01T09:00:00.000Z" });
    const s = { ...createSeed(), actions: [old, rule({ id: "a_local" })] };
    const out = mergeEffects(s, { phases: [], steps: [], actions: [rule({ id: "a_server" })] });
    expect(out.actions.map((a) => a.id).sort()).toEqual(["a_old", "a_server"]);
  });

  it("a new project is added with store defaults; a known one keeps the store-owned install choice", () => {
    const s = createSeed();
    const core: ProjectCore = {
      id: "p_new", customerName: "Yeni", name: "RabbitQA", csmId: "u_deniz", salespersonId: null, licenseModel: "", purchasedModules: [],
      startDate: "2026-10-12", goLiveDate: "2026-12-01", installType: null, llmChoice: null, teams: [], templateVersion: 1, createdAt: "2026-10-12T09:00:00.000Z",
    };
    const added = mergeEffects(s, { project: core, phases: [], steps: [], actions: [] });
    expect(added.projects.find((p) => p.id === "p_new")).toMatchObject({ health: "green", noCommitments: false, customerName: "Yeni" });

    const known = { ...core, id: "p_isyatirim", customerName: "İş Yatırım (API)" };
    const merged = mergeEffects(s, { project: known, phases: [], steps: [], actions: [] }).projects.find((p) => p.id === "p_isyatirim")!;
    expect(merged).toMatchObject({ customerName: "İş Yatırım (API)", installType: "onprem", llmChoice: "rabbitqa" });
  });
});

describe("diffProject", () => {
  it("nothing changed → empty; a changed step and a changed rule action show up", () => {
    const s = { ...createSeed(), actions: [rule({ ruleKey: "rk" })] };
    const view = emptyView();
    recordSteps(view, s.steps.filter((x) => x.projectId === "p_garanti"));
    recordActions(view, s.actions);
    expect(diffProject(s, "p_garanti", view)).toEqual({ steps: [], actions: [] });

    const step = s.steps.find((x) => x.projectId === "p_garanti")!;
    const changed = {
      ...s,
      steps: s.steps.map((x) => (x.id === step.id ? { ...x, ball: "care" as const } : x)),
      actions: [rule({ status: "cancelled" })],
    };
    const d = diffProject(changed, "p_garanti", view);
    expect(d.steps.map((x) => x.id)).toEqual([step.id]);
    expect(d.actions.map((a) => a.status)).toEqual(["cancelled"]);
  });

  it("other actions (meeting, AI, manual) are compared as a whole, by id; a new one shows up", () => {
    const meeting = rule({ id: "a_m", source: "meeting", ruleKey: undefined, meetingId: "m_local", title: "Toplantıdan" });
    const s = { ...createSeed(), actions: [meeting] };
    const view = emptyView();
    recordActions(view, s.actions);
    expect(diffProject(s, "p_garanti", view).actions).toEqual([]);

    const fresh = rule({ id: "a_ai", source: "teams", ruleKey: undefined, insightId: "ai_1" });
    const next = { ...s, actions: [{ ...meeting, priority: "high" as const }, fresh] };
    expect(diffProject(next, "p_garanti", view).actions.map((a) => a.id)).toEqual(["a_m", "a_ai"]);
    expect(diffProject(next, "p_akbank", view).actions).toEqual([]);
  });

  it("priority of a rule action is not compared (the server does not take it over)", () => {
    const s = { ...createSeed(), actions: [rule({})] };
    const view = emptyView();
    recordActions(view, s.actions);
    expect(diffProject({ ...s, actions: [rule({ priority: "high" })] }, "p_garanti", view).actions).toEqual([]);
  });
});

describe("replaceProjectData", () => {
  it("the project's phases, steps, actions and meetings become the server's; other projects stay", () => {
    const s = createSeed();
    const server = rule({ id: "a_server", source: "manual", ruleKey: undefined });
    const meeting = { ...s.meetings.find((m) => m.projectId === "p_garanti")!, id: "m_server" };
    const out = replaceProjectData(s, "p_garanti", { phases: [], steps: [], actions: [server], meetings: [meeting] });
    expect(out.actions.filter((a) => a.projectId === "p_garanti")).toEqual([server]);
    expect(out.actions.filter((a) => a.projectId !== "p_garanti")).toEqual(s.actions.filter((a) => a.projectId !== "p_garanti"));
    expect(out.steps.some((x) => x.projectId === "p_garanti")).toBe(false);
    expect(out.meetings.filter((m) => m.projectId === "p_garanti")).toEqual([meeting]);
    expect(out.meetings.filter((m) => m.projectId !== "p_garanti")).toEqual(s.meetings.filter((m) => m.projectId !== "p_garanti"));
  });
});

describe("mergeEffects — meetings", () => {
  it("places meetings by id and adds new ones; a response without meetings leaves them as they are", () => {
    const s = createSeed();
    const changed = { ...s.meetings[0], notes: "Sunucudan" };
    const added = { ...s.meetings[0], id: "m_new" };
    const out = mergeEffects(s, { phases: [], steps: [], actions: [], meetings: [changed, added] });
    expect(out.meetings.find((m) => m.id === changed.id)?.notes).toBe("Sunucudan");
    expect(out.meetings).toHaveLength(s.meetings.length + 1);
    expect(mergeEffects(s, { phases: [], steps: [], actions: [] }).meetings).toBe(s.meetings);
  });
});

describe("snapshotView", () => {
  it("rolls back exactly the entries a send recorded: changed ones get their old value, new ones go away", () => {
    const s = createSeed();
    const [known, fresh] = s.steps.filter((x) => x.projectId === "p_garanti");
    const other = { ...s.actions.find((a) => a.projectId === "p_garanti" && !a.ruleKey)!, title: "Yeni" };
    const view = emptyView();
    recordSteps(view, [known]);
    recordActions(view, [rule({ status: "open" })]);
    const before = { steps: new Map(view.steps), rule: new Map(view.rule), actions: new Map(view.actions) };

    const diff = { steps: [{ ...known, ball: "care" as const }, fresh], actions: [rule({ status: "done" }), other] };
    const rollback = snapshotView(view, diff);
    recordSteps(view, diff.steps);
    recordActions(view, diff.actions);
    rollback();
    expect(view).toEqual(before);
  });
});

describe("describeSent", () => {
  const s = createSeed();
  const steps = s.steps.filter((x) => x.projectId === "p_garanti").slice(0, 4);
  const action = s.actions.find((a) => a.projectId === "p_garanti")!;

  it("names the record the error field points at", () => {
    expect(describeSent({ steps, actions: [action] }, "steps.1.title")).toBe(`"${steps[1].title}" adımı`);
    expect(describeSent({ steps, actions: [action] }, "actions.0.due")).toBe(`"${action.title}" aksiyonu`);
  });

  it("without a field: up to three titles, then a count", () => {
    expect(describeSent({ steps: steps.slice(0, 1), actions: [action] })).toBe(`"${steps[0].title}" adımı, "${action.title}" aksiyonu`);
    expect(describeSent({ steps, actions: [action] })).toBe(`${steps.slice(0, 3).map((x) => `"${x.title}" adımı`).join(", ")} ve 2 kayıt daha`);
  });
});
