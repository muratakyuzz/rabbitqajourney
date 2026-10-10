import { describe, expect, it } from "vitest";
import type { ProjectCore } from "../schemas/project";
import { DEFAULT_PROJECT_INTEGRATIONS, projectFromCore } from "./seed";

const core: ProjectCore = {
  id: "p_x", customerName: "X A.Ş.", name: "Onboarding", csmId: "u_deniz", salespersonId: null, licenseModel: "",
  purchasedModules: [], startDate: "2026-10-12", goLiveDate: "2026-12-15", installType: null, llmChoice: null, teams: [],
  templateVersion: 2, createdAt: "2026-10-12T09:00:00.000Z",
};

describe("projectFromCore", () => {
  it("keeps the API's fields, drops templateVersion and fills the store-only fields with defaults", () => {
    const p = projectFromCore(core);
    expect(p).toMatchObject({ id: "p_x", customerName: "X A.Ş.", health: "green", healthReason: "", noCommitments: false, discoveryAnswers: {} });
    expect(p).not.toHaveProperty("templateVersion");
    expect(p.integrations).toEqual(DEFAULT_PROJECT_INTEGRATIONS);
  });

  it("each project gets its own integrations object", () => {
    const a = projectFromCore(core);
    a.integrations.email.extraDomains.push("x.com");
    a.integrations.chat.active = true;
    expect(projectFromCore(core).integrations).toEqual(DEFAULT_PROJECT_INTEGRATIONS);
    expect(DEFAULT_PROJECT_INTEGRATIONS.email.extraDomains).toEqual([]);
  });
});
