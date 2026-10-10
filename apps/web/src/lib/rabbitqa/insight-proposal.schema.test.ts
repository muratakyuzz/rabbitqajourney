import { InsightProposalSchema, InsightKindSchema } from "@rabbitqa/shared";
import { analyzeText, type InsightDraft } from "./ai-mock";
import { createSeed } from "./seed";
import type { AiInsight } from "./types";

// F0-04a AC7 (L2c precursor): seed insights and ai-mock drafts already fit the shared InsightProposal schema,
// and parsing drops nothing (toEqual input). Mock behaviour is unchanged; runtime parsing comes in 04h / F8-03.
const NOW = new Date("2026-10-05T09:00:00");

// One message per kind; together they make analyzeText produce all 7 kinds.
const MESSAGES = [
  "Trade Master için senaryo sayısını netleştirdik, bu iş yapıldı.", // action_update
  "KPI ölçümleri tamamlandı.", // step_update
  "VPN erişim bilgilerini Çağla Hanım'a 10.10.2026 tarihine kadar göndereceğiz.", // action_create
  "İç onay süreçleri nedeniyle Go-Live 16.10.2026 tarihine ertelendi.", // date_change + health_change
  "Koşum süreleri konusunda endişemiz var.", // risk_create
  "MobileHub demosunu Go-Live sonrasına almak konusunda anlaştık.", // decision_create
];

const toProposal = ({ id, status, createdAt, reviewedBy, reviewedAt, reviewNote, appliedEntityId, ...proposal }: AiInsight): InsightDraft =>
  proposal;

describe("mock insights fit InsightProposalSchema", () => {
  beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(NOW); });
  afterEach(() => { vi.useRealTimers(); });

  it("every seed insight parses unchanged", () => {
    const insights = createSeed().insights;
    expect(insights.length).toBeGreaterThan(0);
    for (const insight of insights) {
      const proposal = toProposal(insight);
      expect(InsightProposalSchema.parse(proposal), insight.id).toEqual(proposal);
    }
  });

  it("analyzeText drafts of all 7 kinds parse unchanged", () => {
    const state = createSeed();
    const projectId = state.insights[0].projectId;
    const drafts = MESSAGES.flatMap((text, n) =>
      analyzeText(state, projectId, n % 2 ? "teams" : "email", text, { title: "Test", from: "sevcan.vural@isyatirim.com.tr", direction: "in" }),
    );
    expect(new Set(drafts.map((d) => d.kind))).toEqual(new Set(InsightKindSchema.options));
    for (const draft of drafts) expect(InsightProposalSchema.parse(draft), draft.kind).toEqual(draft);
  });
});
