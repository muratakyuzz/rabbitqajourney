import { delay, nextId, nowIso, onboardingConfig } from "@/lib/mock-store";

export interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingConfig {
  enabled: boolean;
  steps: OnboardingStep[];
}

export async function getOnboardingConfig(_token: string) {
  await delay();
  return { enabled: onboardingConfig.enabled, steps: [...onboardingConfig.steps].sort((a, b) => a.order - b.order) };
}

export async function updateOnboardingConfig(_token: string, input: { enabled: boolean }) {
  await delay();
  onboardingConfig.enabled = input.enabled;
  return { enabled: input.enabled, createdAt: nowIso(), updatedAt: nowIso() };
}

export async function createOnboardingStep(_token: string, input: { title: string; description: string }) {
  await delay();
  const order = onboardingConfig.steps.reduce((max, s) => Math.max(max, s.order), 0) + 1;
  const step: OnboardingStep = {
    id: nextId("ob"),
    order,
    title: input.title,
    description: input.description,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  onboardingConfig.steps.push(step);
  return step;
}

export async function updateOnboardingStep(_token: string, stepId: string, input: { title?: string; description?: string }) {
  await delay();
  const s = onboardingConfig.steps.find((x) => x.id === stepId);
  if (!s) throw new Error("Step not found");
  if (input.title !== undefined) s.title = input.title;
  if (input.description !== undefined) s.description = input.description;
  s.updatedAt = nowIso();
  return s;
}

export async function deleteOnboardingStep(_token: string, stepId: string) {
  await delay();
  const idx = onboardingConfig.steps.findIndex((x) => x.id === stepId);
  if (idx < 0) throw new Error("Step not found");
  onboardingConfig.steps.splice(idx, 1);
  // Renumber order
  onboardingConfig.steps.sort((a, b) => a.order - b.order).forEach((s, i) => { s.order = i + 1; });
  return { id: stepId, deleted: true as const };
}
