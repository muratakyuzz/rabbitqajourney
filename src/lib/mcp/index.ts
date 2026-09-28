import { defineMcp } from "@lovable.dev/mcp-js";
import listPartnersTool from "./tools/list-partners";
import listDealsTool from "./tools/list-deals";
import getDashboardSummaryTool from "./tools/get-dashboard-summary";

export default defineMcp({
  name: "partnerhub-mcp",
  title: "PartnerHub MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the PartnerHub B2B partner portal. Use `list_partners` to browse partners, `list_deals` to inspect the deal pipeline, and `get_dashboard_summary` for high-level KPIs.",
  tools: [listPartnersTool, listDealsTool, getDashboardSummaryTool],
});