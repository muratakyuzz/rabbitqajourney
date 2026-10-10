import { describe, expect, it } from "vitest";
import { createSeed } from "./seed";

describe("createSeed", () => {
  it("builds the same phase/step ids on every call (web and API share one seed)", () => {
    const a = createSeed();
    const b = createSeed();
    expect(a.phases.map((p) => p.id)).toEqual(b.phases.map((p) => p.id));
    expect(a.steps.map((s) => s.id)).toEqual(b.steps.map((s) => s.id));
    expect(a.actions.map((x) => x.id)).toEqual(b.actions.map((x) => x.id));
    expect(a.meetings.map((m) => m.id)).toEqual(b.meetings.map((m) => m.id));
  });

  it("has unique ids and resolvable references", () => {
    const s = createSeed();
    for (const list of [s.projects, s.phases, s.steps, s.actions, s.meetings]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    const phaseIds = new Set(s.phases.map((p) => p.id));
    const meetingIds = new Set(s.meetings.map((m) => m.id));
    expect(s.steps.every((x) => phaseIds.has(x.phaseId))).toBe(true);
    expect(s.actions.every((a) => !a.meetingId || meetingIds.has(a.meetingId))).toBe(true);
  });
});
