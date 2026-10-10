import { describe, expect, expectTypeOf, it } from "vitest";
import type { InsightKind } from "../enums";
import { InsightProposalSchema, InsightProposedSchemaByKind, type InsightProposedAny } from "./insight";

// F0-04a AC6: per-kind field allowlist for AI proposals (API_CONTRACT #44).

const VALID: Record<InsightKind, Record<string, unknown>> = {
  step_update: { status: "in_progress", due: "2026-10-10", ball: "customer", ownerId: "u_deniz" },
  action_update: { status: "done", due: null, ownerId: "c_1" },
  health_change: { health: "red", healthReason: "Go-Live gecikecek." },
  date_change: { phaseId: "ph_1", planEnd: "2026-10-20" },
  action_create: { title: "VPN bilgisi", ownerId: "c_1", ball: "customer", due: "2026-10-10", priority: "high", status: "open", isCustomerVisible: true },
  risk_create: {
    title: "Koşum süreleri", description: "Uzun koşum", impact: "high", probability: "medium", status: "open",
    ownerId: "u_deniz", due: "2026-10-15", mitigation: "", decidedAt: null, isCustomerVisible: false,
  },
  decision_create: {
    title: "Demo ertelendi", description: "", impact: "medium", probability: "low", status: "accepted",
    ownerId: null, due: null, mitigation: "", decidedAt: "2026-10-05", isCustomerVisible: true,
  },
};
const KINDS = Object.keys(VALID) as InsightKind[];

// #44 allowlist, written out by hand (not derived from the schemas) so widening a schema breaks a test.
const RISK_DECISION_FIELDS = [
  "title", "description", "impact", "probability", "status", "ownerId", "due", "mitigation", "decidedAt", "isCustomerVisible",
];
const ALLOWED: Record<InsightKind, readonly string[]> = {
  step_update: ["status", "due", "ball", "ownerId"],
  action_update: ["status", "due", "ownerId"],
  health_change: ["health", "healthReason"],
  date_change: ["phaseId", "planEnd", "goLiveDate"],
  action_create: ["title", "ownerId", "ball", "due", "priority", "status", "isCustomerVisible"],
  risk_create: RISK_DECISION_FIELDS,
  decision_create: RISK_DECISION_FIELDS,
};
// A valid value for every allowed field of each kind (date_change: goLiveDate is the other branch).
const SAMPLES: Record<InsightKind, Record<string, unknown>> = {
  ...VALID,
  date_change: { ...VALID.date_change, goLiveDate: "2026-10-09" },
};

// Every (kind, field another kind may propose, that kind's value for it), deduplicated.
const FOREIGN_FIELDS = KINDS.flatMap((kind) =>
  KINDS.flatMap((owner) =>
    ALLOWED[owner].filter((field) => !ALLOWED[kind].includes(field)).map((field) => [kind, field, SAMPLES[owner][field], owner] as const),
  ),
).filter(([kind, field, value], i, all) => all.findIndex(([k, f, v]) => k === kind && f === field && v === value) === i);

// Status per target (#5 StepStatus, #7/#6 ActionStatus, #31 RiskStatus), by hand.
const STEP_STATUSES = ["pending", "in_progress", "done", "out_of_scope", "locked"];
const ACTION_STATUSES = ["open", "in_progress", "done", "cancelled"];
const RISK_STATUSES = ["open", "mitigated", "accepted", "realized"];
const STATUS_BY_KIND = {
  step_update: STEP_STATUSES,
  action_update: ACTION_STATUSES,
  action_create: ACTION_STATUSES,
  risk_create: RISK_STATUSES,
  decision_create: RISK_STATUSES,
} satisfies Partial<Record<InsightKind, string[]>>;
const ALL_STATUSES = [...new Set([...STEP_STATUSES, ...ACTION_STATUSES, ...RISK_STATUSES])];
const STATUS_CASES = Object.entries(STATUS_BY_KIND).flatMap(([kind, allowed]) =>
  ALL_STATUSES.map((status) => [kind as InsightKind, status, allowed.includes(status)] as const),
);

const accepts = (kind: InsightKind, proposed: unknown) => InsightProposedSchemaByKind[kind].safeParse(proposed).success;

describe("InsightProposedSchemaByKind (#44)", () => {
  it("has a schema for every InsightKind", () => {
    expect(Object.keys(InsightProposedSchemaByKind).sort()).toEqual([...KINDS].sort());
  });

  it.each(KINDS)("%s accepts all of its allowed fields", (kind) => {
    expect(InsightProposedSchemaByKind[kind].parse(VALID[kind])).toEqual(VALID[kind]);
  });

  it.each(["step_update", "action_update", "health_change", "action_create", "risk_create", "decision_create"] as const)(
    "%s accepts each allowed field on its own (partial)",
    (kind) => {
      for (const [field, value] of Object.entries(VALID[kind])) expect(accepts(kind, { [field]: value }), field).toBe(true);
    },
  );

  describe.each(KINDS)("%s rejects", (kind) => {
    it.each([
      ["dependency", "independent"],
      ["durationDays", 3],
      ["required", false],
    ])("flow field %s", (field, value) => {
      expect(accepts(kind, { ...VALID[kind], [field]: value })).toBe(false);
    });

    it("an unknown field", () => {
      expect(accepts(kind, { ...VALID[kind], foo: "bar" })).toBe(false);
    });
  });

  // RUL-01: a kind never takes a field that only another kind may propose (e.g. action_update + ball).
  it.each(KINDS)("%s samples cover exactly its #44 allowlist", (kind) => {
    expect(Object.keys(SAMPLES[kind]).sort()).toEqual([...ALLOWED[kind]].sort());
  });

  it.each(FOREIGN_FIELDS)("%s rejects %s = %j (allowed in %s)", (kind, field, value) => {
    expect(accepts(kind, { ...VALID[kind], [field]: value })).toBe(false);
    expect(accepts(kind, { [field]: value })).toBe(false);
  });

  // RUL-02: status values are checked against the target's enum, not the union of all statuses.
  it.each(STATUS_CASES)("%s status %s → accepted: %s", (kind, status, expected) => {
    expect(accepts(kind, { status })).toBe(expected);
  });

  it("date_change takes either { phaseId, planEnd } or { goLiveDate }, never a mix", () => {
    expect(accepts("date_change", { phaseId: "ph_1", planEnd: "2026-10-20" })).toBe(true);
    expect(accepts("date_change", { goLiveDate: "2026-10-09" })).toBe(true);
    expect(accepts("date_change", { goLiveDate: "2026-10-09", planEnd: "2026-10-20" })).toBe(false);
    expect(accepts("date_change", { phaseId: "ph_1", planEnd: "2026-10-20", goLiveDate: "2026-10-09" })).toBe(false);
    expect(accepts("date_change", { planEnd: "2026-10-20" })).toBe(false); // V3: target phase required
    expect(accepts("date_change", { phaseId: "ph_1", goLiveDate: "2026-10-09" })).toBe(false);
    expect(accepts("date_change", { phaseId: "ph_1" })).toBe(false);
    expect(accepts("date_change", {})).toBe(false);
  });

  it("status follows the target: cancelled is an action status, not a step status", () => {
    expect(accepts("action_update", { status: "cancelled" })).toBe(true);
    expect(accepts("step_update", { status: "cancelled" })).toBe(false);
    expect(accepts("step_update", { status: "out_of_scope" })).toBe(true);
    expect(accepts("action_update", { status: "out_of_scope" })).toBe(false);
  });

  it.each(["source", "ruleKey", "insightId", "meetingId"])("action_create rejects server-assigned %s", (field) => {
    expect(accepts("action_create", { ...VALID.action_create, [field]: "x" })).toBe(false);
  });

  describe.each(["risk_create", "decision_create"] as const)("%s", (kind) => {
    it.each([
      ["kind", "risk"],
      ["meetingId", "m_1"],
    ])("rejects %s", (field, value) => {
      expect(accepts(kind, { ...VALID[kind], [field]: value })).toBe(false);
    });
  });

  it("validates dates and ids (D7)", () => {
    expect(accepts("step_update", { due: "10.10.2026" })).toBe(false);
    expect(accepts("step_update", { due: "2026-02-30" })).toBe(false);
    expect(accepts("date_change", { goLiveDate: "2026-10-09T00:00:00Z" })).toBe(false);
    expect(accepts("action_update", { ownerId: "" })).toBe(false);
    expect(accepts("action_update", { ownerId: null })).toBe(true);
  });
});

describe("InsightProposalSchema", () => {
  const proposal = {
    projectId: "p_1",
    source: "teams",
    kind: "action_update",
    sourceRef: { title: "Müşteriler › İş Yatırım", from: "Sevcan Vural", at: "2026-10-05T07:00:00.000Z", excerpt: "Bu iş yapıldı.", link: "#", direction: "in" },
    targetId: "a_1",
    current: { status: "open" },
    proposed: { status: "done" },
    rationale: "Mesajda aksiyonun yapıldığı belirtiliyor.",
    confidence: 80,
  };

  it("accepts a well-formed proposal unchanged", () => {
    expect(InsightProposalSchema.parse(proposal)).toEqual(proposal);
  });

  it("checks proposed against the schema of its kind", () => {
    expect(InsightProposalSchema.safeParse({ ...proposal, proposed: { title: "x" } }).success).toBe(false);
    expect(InsightProposalSchema.safeParse({ ...proposal, kind: "step_update", proposed: { status: "cancelled" } }).success).toBe(false);
    expect(InsightProposalSchema.safeParse({ ...proposal, proposed: { status: "done", durationDays: 2 } }).success).toBe(false);
  });

  it("rejects an unknown kind, out-of-range confidence and a non-ISO timestamp", () => {
    expect(InsightProposalSchema.safeParse({ ...proposal, kind: "phase_complete" }).success).toBe(false);
    expect(InsightProposalSchema.safeParse({ ...proposal, confidence: 101 }).success).toBe(false);
    expect(InsightProposalSchema.safeParse({ ...proposal, confidence: -1 }).success).toBe(false);
    expect(InsightProposalSchema.safeParse({ ...proposal, sourceRef: { ...proposal.sourceRef, at: "05.10.2026" } }).success).toBe(false);
  });
});

describe("InsightProposedAny", () => {
  it("is the union of the per-kind fields, without flow fields or an index signature", () => {
    expectTypeOf<keyof InsightProposedAny>().toEqualTypeOf<
      | "status" | "due" | "ball" | "ownerId" | "health" | "healthReason" | "phaseId" | "planEnd" | "goLiveDate"
      | "title" | "priority" | "isCustomerVisible" | "description" | "impact" | "probability" | "mitigation" | "decidedAt"
    >();
    expectTypeOf<InsightProposedAny["status"]>().toEqualTypeOf<
      "pending" | "in_progress" | "done" | "out_of_scope" | "locked" | "open" | "cancelled" | "mitigated" | "accepted" | "realized" | undefined
    >();
  });
});
