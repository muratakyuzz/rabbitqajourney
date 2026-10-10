import { TemplateVersionSchema, type PhaseTpl, type TemplateVersion } from "@rabbitqa/shared";
import { api } from "@/lib/api";

// Ayarlar → Aşama şablonu (docs/PLAN.md M1). The API owns the template; the store keeps a copy for new projects.

export const fetchTemplate = (): Promise<TemplateVersion> => api("/config/template", { schema: TemplateVersionSchema });

export const saveTemplate = (baseVersion: number, phases: PhaseTpl[]): Promise<TemplateVersion> =>
  api("/config/template", { method: "PUT", body: { baseVersion, phases }, schema: TemplateVersionSchema });
