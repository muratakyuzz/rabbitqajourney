import { utils, writeFileXLSX } from "xlsx";
import type { Lead } from "@/lib/leads-api";

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function toFileName(prefix: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.xlsx`;
}

export function exportLeadsToXlsx(leads: Lead[], prefix: string) {
  const rows = leads.map((lead) => ({
    ID: lead.id,
    Title: lead.title,
    Partner: lead.partnerName ?? lead.partnerId,
    Package: lead.packageType,
    Addons: lead.addons.join(", "),
    Status: lead.status,
    RejectionReason: lead.rejectionReason ?? "",
    CreatedBy: lead.createdByEmail ?? lead.createdByUserId,
    CreatedAt: toDate(lead.createdAt),
    UpdatedAt: toDate(lead.updatedAt),
  }));

  const worksheet = utils.json_to_sheet(rows);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, "Leads");
  writeFileXLSX(workbook, toFileName(prefix));
}
