import { describe, expect, it } from "vitest";
import { applyStepCompletion } from "./completion";
import type { MkAudit } from "./flow";
import { meetingHeldError, stepsCompletedByMeeting } from "./meetings";
import { createSeed } from "./seed";
import type { Meeting, RqState } from "./types";

const mk: MkAudit = (e) => ({ ...e, id: "", at: "", userId: "" });
const meeting = (over: Partial<Meeting> = {}): Meeting => ({
  id: "m_new", projectId: "p_ornek", type: "brief", date: "2026-10-01", internalIds: ["u_deniz"], contactIds: [],
  notes: "", decisions: "", isCustomerVisible: false, status: "held", ...over,
});

describe("meetingHeldError", () => {
  it("held needs date ≤ today and an internal participant; planned and cancelled need neither", () => {
    expect(meetingHeldError(meeting(), "2026-10-01")).toBeNull();
    expect(meetingHeldError(meeting({ date: "2026-10-02" }), "2026-10-01")?.field).toBe("date");
    expect(meetingHeldError(meeting({ internalIds: [] }), "2026-10-01")?.field).toBe("internalIds");
    expect(meetingHeldError(meeting({ status: "planned", date: "2027-01-01", internalIds: [] }), "2026-10-01")).toBeNull();
    expect(meetingHeldError(meeting({ status: "cancelled", internalIds: [] }), "2026-10-01")).toBeNull();
  });
});

describe("stepsCompletedByMeeting (\"Kaydedince tamamlanır\" preview)", () => {
  it("a held brief completes the brief step; a planned one completes nothing", () => {
    const s = createSeed();
    expect(stepsCompletedByMeeting(s, meeting()).map((x) => x.key)).toEqual(["brief"]);
    expect(stepsCompletedByMeeting(s, meeting({ status: "planned" }))).toEqual([]);
  });

  it("an existing planned meeting turned held previews its step", () => {
    const s = createSeed();
    const planned = s.meetings.find((m) => m.id === "m_brief_ornek")!;
    expect(stepsCompletedByMeeting(s, { ...planned, status: "held" }).map((x) => x.key)).toEqual(["brief"]);
  });

  it("Go/No-Go held → the manual gonogo step", () => {
    const s = createSeed();
    const gonogo = s.steps.find((x) => x.projectId === "p_isyatirim" && x.key === "gonogo")!;
    expect(gonogo.status).not.toBe("done");
    expect(stepsCompletedByMeeting(s, meeting({ projectId: "p_isyatirim", type: "go_no_go" })).map((x) => x.key)).toContain("gonogo");
  });
});

describe("applyStepCompletion only", () => {
  it("only: \"meeting\" leaves data steps alone; the default handles both", () => {
    const s = createSeed();
    const pid = "p_ornek";
    // a held brief meeting and a licence model: one meeting step and one data step become due
    const changed: RqState = {
      ...s,
      projects: s.projects.map((p) => (p.id === pid ? { ...p, licenseModel: "Yıllık", salespersonId: p.salespersonId ?? "sp_1" } : p)),
      meetings: [...s.meetings, meeting()],
    };
    const byKey = (st: RqState, key: string) => st.steps.find((x) => x.projectId === pid && x.key === key)!.status;
    expect(byKey(changed, "sales_license")).not.toBe("done");

    const meetingOnly = applyStepCompletion(changed, pid, mk, new Date(), { only: "meeting" });
    expect(byKey(meetingOnly, "brief")).toBe("done");
    expect(byKey(meetingOnly, "sales_license")).toBe(byKey(changed, "sales_license"));

    const both = applyStepCompletion(changed, pid, mk);
    expect(byKey(both, "brief")).toBe("done");
    expect(byKey(both, "sales_license")).toBe("done");
  });
});
