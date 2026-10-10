import { describe, expect, it } from "vitest";
import type { ProjectCore } from "@rabbitqa/shared";
import { createSeed } from "@rabbitqa/shared/domain/seed";
import type { Action } from "@rabbitqa/shared/domain/types";
import { canon, diffProject, emptyView, mergeEffects, recordRuleActions, recordSteps } from "./server-sync";

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
    recordRuleActions(view, s.actions);
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

  it("priority of a rule action is not compared (the server does not take it over)", () => {
    const s = { ...createSeed(), actions: [rule({})] };
    const view = emptyView();
    recordRuleActions(view, s.actions);
    expect(diffProject({ ...s, actions: [rule({ priority: "high" })] }, "p_garanti", view).actions).toEqual([]);
  });
});
