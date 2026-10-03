import type { AuthUser } from "@/lib/auth-api";
import type { AiInsight, Project, RqState } from "./types";

export const isAllSeeing = (u: AuthUser | null) => u?.role === "manager" || u?.role === "admin";

export function canManageProject(u: AuthUser | null, p: Project) {
  if (!u) return false;
  return isAllSeeing(u) || (u.role === "csm" && p.csmId === u.id);
}

export function canEditItem(u: AuthUser | null, p: Project, ownerId: string | null) {
  return canManageProject(u, p) || (!!u && ownerId === u.id);
}

export function visibleProjects(state: RqState, u: AuthUser | null) {
  if (!u) return [];
  if (isAllSeeing(u)) return state.projects;
  if (u.role === "csm") return state.projects.filter((p) => p.csmId === u.id);
  const ids = new Set([
    ...state.steps.filter((s) => s.ownerId === u.id).map((s) => s.projectId),
    ...state.actions.filter((a) => a.ownerId === u.id).map((a) => a.projectId),
  ]);
  return state.projects.filter((p) => ids.has(p.id));
}

export function canSeeCredentials(u: AuthUser | null, p: Project) {
  if (!u) return false;
  return u.role === "devops" || (u.role === "csm" && p.csmId === u.id);
}

export const canManageIntegrations = (u: AuthUser | null) => u?.role === "admin";
export const canSeeSecrets = canManageIntegrations;
export const canSetProjectIntegration = (u: AuthUser | null, p: Project) => canManageProject(u, p);
export function canReviewInsight(state: RqState, u: AuthUser | null, i: AiInsight) {
  return visibleProjects(state, u).some((p) => p.id === i.projectId);
}
export function visibleInsights(state: RqState, u: AuthUser | null) {
  const ids = new Set(visibleProjects(state, u).map((p) => p.id));
  return state.insights.filter((i) => ids.has(i.projectId));
}
