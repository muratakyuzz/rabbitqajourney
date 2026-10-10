import { describe, expect, it } from "vitest";
import * as enums from "./index";

// AC5: every API_CONTRACT §6 enum is exported as <Name>Schema (its type comes from z.infer).
const CONTRACT_ENUMS = [
  "Role", "Ball", "StepStatus", "Dependency", "PhaseStatus", "Health", "ActionStatus", "Priority",
  "ActionSource", "ContactRole", "CommitmentStatus", "MeetingType", "InstallType", "LlmChoice", "DocType",
  "StepCompletion", "MeetingStatus", "AdaptationItem", "AlertSeverity", "AlertStatus", "TicketStatus",
  "TicketType", "BoardDecision", "RiskKind", "RiskStatus", "AlertType", "AlertLevel", "AlertStateStatus",
  "ChatProvider", "ConnStatus", "InsightKind", "InsightStatus", "InsightSource",
] as const;

describe("shared enums", () => {
  it("covers the 33 API_CONTRACT §6 enums and nothing else", () => {
    expect(CONTRACT_ENUMS).toHaveLength(33);
    expect(Object.keys(enums).sort()).toEqual(CONTRACT_ENUMS.map((name) => `${name}Schema`).sort());
  });

  it.each(CONTRACT_ENUMS)("%sSchema accepts its values and rejects unknown ones", (name) => {
    const schema = enums[`${name}Schema`];
    expect(schema.options.length).toBeGreaterThan(0);
    for (const value of schema.options) expect(schema.parse(value)).toBe(value);
    expect(schema.safeParse("__unknown__").success).toBe(false);
  });
});
