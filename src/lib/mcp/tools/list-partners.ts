import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

const SAMPLE_PARTNERS = [
  { id: "p_001", name: "Acme Solutions", tier: "Gold", type: "Reseller", country: "TR", annualRevenue: 41000, certifiedUsers: 4 },
  { id: "p_002", name: "Bright Systems", tier: "Silver", type: "Referral", country: "DE", annualRevenue: 12500, certifiedUsers: 2 },
  { id: "p_003", name: "Cobalt IT", tier: "Platinum", type: "Reseller", country: "UK", annualRevenue: 245000, certifiedUsers: 11 },
  { id: "p_004", name: "DeltaWorks", tier: "Bronze", type: "Referral", country: "NL", annualRevenue: 4200, certifiedUsers: 1 },
];

export default defineTool({
  name: "list_partners",
  title: "List partners",
  description: "List partners in the PartnerHub portal. Supports optional tier and type filters.",
  inputSchema: {
    tier: z.enum(["Bronze", "Silver", "Gold", "Platinum"]).optional().describe("Filter by tier."),
    type: z.enum(["Reseller", "Referral"]).optional().describe("Filter by partner type."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum number of partners to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ tier, type, limit }) => {
    let rows = SAMPLE_PARTNERS;
    if (tier) rows = rows.filter((p) => p.tier === tier);
    if (type) rows = rows.filter((p) => p.type === type);
    if (limit) rows = rows.slice(0, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { partners: rows },
    };
  },
});