import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_dashboard_summary",
  title: "Get dashboard summary",
  description: "Return an aggregated snapshot of the PartnerHub admin dashboard: KPIs, pipeline stages, and top-tier distribution.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => {
    const summary = {
      kpis: {
        activePartners: 128,
        pipelineValueUsd: 1_240_500,
        wonThisQuarterUsd: 384_200,
        avgDealSizeUsd: 12_450,
      },
      pipeline: [
        { stage: "Qualified", count: 42, valueUsd: 210_000 },
        { stage: "Proposal", count: 28, valueUsd: 380_500 },
        { stage: "Negotiation", count: 15, valueUsd: 420_000 },
        { stage: "Won", count: 22, valueUsd: 384_200 },
      ],
      tiers: { Bronze: 54, Silver: 41, Gold: 26, Platinum: 7 },
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});