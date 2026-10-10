import type { PhaseTpl, StepTpl } from "@rabbitqa/shared";
import { badRequest, conflict, type HttpError } from "../../http/errors";

// Rules for a new template version against the active one (docs/PLAN.md M1). Pure: returns the first
// violation (400 structure, 409 system step) or null. Field paths point into the PUT body.

/** Adaptation phase: its steps are generated per team at project creation, so the list is fixed. */
const ADAPTATION_CODE = "05";

const completionOf = (s: StepTpl) => s.completion ?? "manual";
/** A step that rules/completion address by key, or that completes by data/meeting. */
export const isSystemStep = (s: StepTpl) => !!s.key || completionOf(s) !== "manual";

export function checkTemplateChange(active: PhaseTpl[], next: PhaseTpl[]): HttpError | null {
  // --- structure (400) ---
  if (next.length !== active.length || next.some((p, i) => p.code !== active[i].code)) {
    return badRequest(`Aşamalar değiştirilemez; beklenen sıra: ${active.map((p) => p.code).join(", ")}.`, "phases");
  }
  if (next[0].dependency !== active[0].dependency) {
    return badRequest("İlk aşamanın başlangıç koşulu değiştirilemez.", "phases.0.dependency");
  }
  const seen = new Set<string>();
  for (const [pi, p] of next.entries()) {
    if (p.code === ADAPTATION_CODE && p.steps.length !== active[pi].steps.length) {
      return badRequest("Uyarlama aşamasında adım eklenemez veya silinemez.", `phases.${pi}.steps`);
    }
    for (const [si, s] of p.steps.entries()) {
      if (!s.key) continue;
      if (seen.has(s.key)) return badRequest(`Adım anahtarı tekrar ediyor: ${s.key}.`, `phases.${pi}.steps.${si}.key`);
      seen.add(s.key);
    }
  }

  // --- system steps (409): every keyed step stays in its phase with the same key and completion ---
  for (const [pi, p] of active.entries()) {
    const nextSteps = next[pi].steps;
    for (const s of p.steps.filter(isSystemStep)) {
      const match = s.key ? nextSteps.find((n) => n.key === s.key) : undefined;
      if (!match) return conflict(`Sistem adımı silinemez veya başka aşamaya taşınamaz: ${s.title}.`);
      if (completionOf(match) !== completionOf(s) || match.meetingType !== s.meetingType) {
        return conflict(`Sistem adımının tamamlanma biçimi değiştirilemez: ${s.title}.`);
      }
    }
    const activeKeys = new Set(p.steps.map((s) => s.key).filter(Boolean));
    const extra = nextSteps.find((n) => isSystemStep(n) && !(n.key && activeKeys.has(n.key)));
    if (extra) return conflict(`Yeni adım sistem adımı olamaz (anahtar ve tamamlanma biçimi değiştirilemez): ${extra.title}.`);
  }
  return null;
}
