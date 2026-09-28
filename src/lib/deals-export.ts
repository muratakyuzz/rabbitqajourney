import { utils, writeFileXLSX } from "xlsx";
import type { Lead as DealFlowLead } from "@/lib/deals-flow-adapter";

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toFileName(prefix: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.xlsx`;
}

export function exportDealsToXlsx(deals: DealFlowLead[], prefix: string) {
  const rows = deals.map((deal) => ({
    ID: deal.id,
    Title: deal.title,
    Partner: deal.partnerName ?? deal.partnerId,
    Package: deal.packageType,
    Addons: deal.addons.join(", "),
    Status: deal.status,
    RejectionReason: deal.rejectionReason ?? "",
    CreatedBy: deal.createdByEmail ?? deal.createdByUserId,
    CreatedAt: toDate(deal.createdAt),
    UpdatedAt: toDate(deal.updatedAt),
  }));

  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Deals");
  writeFileXLSX(workbook, toFileName(prefix));
}
