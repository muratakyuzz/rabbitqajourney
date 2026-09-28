import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const SAMPLE_DEALS = [
  { id: "d_1001", partner: "Acme Solutions", customer: "Northwind Corp", stage: "Proposal", value: 18500, currency: "USD", closeDate: "2026-08-14" },
  { id: "d_1002", partner: "Acme Solutions", customer: "Globex", stage: "Won", value: 22500, currency: "USD", closeDate: "2026-06-30" },
  { id: "d_1003", partner: "Cobalt IT", customer: "Initech", stage: "Negotiation", value: 78000, currency: "USD", closeDate: "2026-09-01" },
  { id: "d_1004", partner: "Bright Systems", customer: "Umbrella", stage: "Qualified", value: 6500, currency: "USD", closeDate: "2026-07-20" },
  { id: "d_1005", partner: "DeltaWorks", customer: "Wayne Ent.", stage: "Lost", value: 3200, currency: "USD", closeDate: "2026-05-10" },
];

export default defineTool({
  name: "list_deals",
  title: "List deals",
  description: "List deals in the pipeline. Supports optional stage and partner filters.",
  inputSchema: {
    stage: z.enum(["Qualified", "Proposal", "Negotiation", "Won", "Lost"]).optional(),
    partner: z.string().optional().describe("Partner name substring to filter by."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ stage, partner, limit }) => {
    let rows = SAMPLE_DEALS;
    if (stage) rows = rows.filter((d) => d.stage === stage);
    if (partner) {
      const q = partner.toLowerCase();
      rows = rows.filter((d) => d.partner.toLowerCase().includes(q));
    }
    if (limit) rows = rows.slice(0, limit);
    const totalValue = rows.reduce((sum, d) => sum + d.value, 0);
    return {
      content: [{ type: "text", text: JSON.stringify({ deals: rows, totalValue }, null, 2) }],
      structuredContent: { deals: rows, totalValue },
    };
  },
});