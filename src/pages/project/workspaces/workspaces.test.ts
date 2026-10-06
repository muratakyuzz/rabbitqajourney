import { describe, it, expect, vi } from "vitest";
import { stepClickTarget, workspaceAvailable } from "./index";
import { highlightField } from "./highlight";
import { createSeed } from "@/lib/rabbitqa/seed";
import type { AuthUser } from "@/lib/auth-api";

function step(s: ReturnType<typeof createSeed>, pid: string, key: string) {
  return s.steps.find((x) => x.projectId === pid && x.key === key)!;
}

describe("stepClickTarget — decision table (plan §6.3, AC9)", () => {
  it("row 1: data step, open (incl. locked), workspace exists -> workspace + first missing field", () => {
    const s = createSeed();
    const st = step(s, "p_ornek", "offer"); // locked, has a workspace (00)
    const target = stepClickTarget(s, st, { hasWorkspace: true, canManage: true, canEdit: true });
    expect(target).toEqual({ kind: "workspace", field: "doc:offer" });
  });

  it("row 2: data step, done or out_of_scope, workspace exists -> workspace with field null", () => {
    const s = createSeed();
    const st = step(s, "p_isyatirim", "offer"); // done
    const target = stepClickTarget(s, st, { hasWorkspace: true, canManage: true, canEdit: true });
    expect(target).toEqual({ kind: "workspace", field: null });
  });

  it("row 3: data step, no workspace -> step_dialog if canEdit, else none (p_ornek 01 reqdoc)", () => {
    const s = createSeed();
    const st = step(s, "p_ornek", "reqdoc");
    expect(stepClickTarget(s, st, { hasWorkspace: false, canManage: true, canEdit: true })).toEqual({ kind: "step_dialog" });
    expect(stepClickTarget(s, st, { hasWorkspace: false, canManage: true, canEdit: false })).toEqual({ kind: "none" });
  });

  it("row 4: meeting step, open (incl. locked), canManage -> meeting_form", () => {
    const s = createSeed();
    const st = step(s, "p_ornek", "brief"); // locked
    const target = stepClickTarget(s, st, { hasWorkspace: true, canManage: true, canEdit: true });
    expect(target).toEqual({ kind: "meeting_form", type: "brief" });
  });

  it("row 5: meeting step, open, !canManage -> none (AC-NEG3, devops clicking an unfinished meeting step)", () => {
    const s = createSeed();
    const st = step(s, "p_ornek", "brief");
    const target = stepClickTarget(s, st, { hasWorkspace: true, canManage: false, canEdit: false });
    expect(target).toEqual({ kind: "none" });
  });

  it("row 6: meeting step, done, held meeting exists -> meeting_detail (İş Yatırım brief -> m_brief_isy)", () => {
    const s = createSeed();
    const st = step(s, "p_isyatirim", "brief");
    expect(st.status).toBe("done");
    const target = stepClickTarget(s, st, { hasWorkspace: true, canManage: true, canEdit: true });
    expect(target).toEqual({ kind: "meeting_detail", meetingId: "m_brief_isy" });
  });

  it("row 7: meeting step, done, no held meeting left (unreachable edge case) -> step_dialog if canEdit, else none", () => {
    const s = createSeed();
    const st = step(s, "p_isyatirim", "brief");
    const noHeld = { ...s, meetings: s.meetings.map((m) => (m.id === "m_brief_isy" ? { ...m, type: "checkin" as const } : m)) };
    expect(stepClickTarget(noHeld, st, { hasWorkspace: true, canManage: true, canEdit: true })).toEqual({ kind: "step_dialog" });
    expect(stepClickTarget(noHeld, st, { hasWorkspace: true, canManage: true, canEdit: false })).toEqual({ kind: "none" });
  });

  it("row 8: meeting step, out_of_scope -> step_dialog if canEdit, else none", () => {
    const s = createSeed();
    const st = { ...step(s, "p_ornek", "brief"), status: "out_of_scope" as const };
    expect(stepClickTarget(s, st, { hasWorkspace: true, canManage: true, canEdit: true })).toEqual({ kind: "step_dialog" });
    expect(stepClickTarget(s, st, { hasWorkspace: true, canManage: true, canEdit: false })).toEqual({ kind: "none" });
  });

  it("row 9: manual step -> step_dialog if canEdit, else none (p_ornek 01 presentation)", () => {
    const s = createSeed();
    const st = step(s, "p_ornek", "presentation");
    expect(st.completion).toBe("manual");
    expect(stepClickTarget(s, st, { hasWorkspace: false, canManage: true, canEdit: true })).toEqual({ kind: "step_dialog" });
    expect(stepClickTarget(s, st, { hasWorkspace: false, canManage: true, canEdit: false })).toEqual({ kind: "none" });
  });

  it("Akbank 02 discovery_form — 02 now has a workspace -> workspace + first missing field (discovery:q_teams)", () => {
    const s = createSeed();
    const st = step(s, "p_akbank", "discovery_form");
    const target = stepClickTarget(s, st, { hasWorkspace: true, canManage: true, canEdit: true });
    expect(target).toEqual({ kind: "workspace", field: "discovery:q_teams" });
  });
});

describe("workspaceAvailable (AC4)", () => {
  const manager: AuthUser = { id: "u_manager", role: "manager", name: "Manager", email: "manager@virgosol.com" };
  const csm: AuthUser = { id: "u_deniz", role: "csm", name: "Deniz", email: "deniz.uzun@virgosol.com" };
  const care: AuthUser = { id: "u_gencay", role: "care", name: "Gençay", email: "gencay.genc@virgosol.com" };

  it("02/04/05 are available to any authenticated user", () => {
    const s = createSeed();
    const p = s.projects.find((x) => x.id === "p_garanti")!;
    expect(workspaceAvailable("02", manager, p)).toBe(true);
    expect(workspaceAvailable("04", care, p)).toBe(true);
    expect(workspaceAvailable("05", care, p)).toBe(true);
  });

  it("03 is available only to canSeeCredentials (csm of the project, or devops)", () => {
    const s = createSeed();
    const p = s.projects.find((x) => x.id === "p_garanti")!; // csmId: u_deniz
    expect(workspaceAvailable("03", csm, p)).toBe(true);
    expect(workspaceAvailable("03", manager, p)).toBe(false);
    expect(workspaceAvailable("03", care, p)).toBe(false);
  });

  it("unknown phase code is never available", () => {
    const s = createSeed();
    const p = s.projects.find((x) => x.id === "p_garanti")!;
    expect(workspaceAvailable("99", manager, p)).toBe(false);
  });
});

describe("highlightField", () => {
  it("adds the ring classes, focuses the first interactive child, and removes classes after ms", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `<div data-field="licenseModel"><input /></div>`;
    const found = highlightField(document.body, "licenseModel", 500);
    expect(found).toBe(true);
    const el = document.querySelector('[data-field="licenseModel"]')!;
    expect(el.classList.contains("ring-2")).toBe(true);
    expect(document.activeElement).toBe(el.querySelector("input"));
    vi.advanceTimersByTime(500);
    expect(el.classList.contains("ring-2")).toBe(false);
    vi.useRealTimers();
  });

  it("returns false when the field is not found", () => {
    document.body.innerHTML = `<div></div>`;
    expect(highlightField(document.body, "nope")).toBe(false);
  });
});
