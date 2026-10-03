import type { RqState } from "./types";

export interface IncomingEmail { from: string; to: string[]; cc: string[] }

const domainOf = (a: string) => a.split("@")[1]?.toLowerCase() ?? "";

export function projectDomains(state: RqState, projectId: string) {
  const p = state.projects.find((x) => x.id === projectId);
  const fromContacts = state.contacts.filter((c) => c.projectId === projectId && c.email).map((c) => domainOf(c.email));
  return [...new Set([...fromContacts, ...(p?.integrations.email.extraDomains ?? [])].filter(Boolean))];
}

/** Saf fonksiyon: adres → domain → bulunamazsa null (kuyruk). Birden fazla proje çıkarsa da null. */
export function matchEmail(state: RqState, mail: IncomingEmail): { projectId: string | null; candidates: string[] } {
  const cfg = state.integrations.email;
  const ignoredA = cfg.ignoredAddresses.map((x) => x.toLowerCase());
  const ignoredD = cfg.ignoredDomains.map((x) => x.toLowerCase());
  const addrs = [mail.from, ...mail.to, ...mail.cc].map((a) => a.trim().toLowerCase()).filter((a) => {
    if (!a || a === cfg.mailbox.toLowerCase()) return false;
    const d = domainOf(a);
    return !ignoredD.includes(d) && !ignoredA.some((x) => a === x || a.startsWith(x + "@") || a.split("@")[0] === x);
  });
  const active = state.projects.filter((p) => p.integrations.email.active);
  const exact = new Set(active.filter((p) => state.contacts.some((c) => c.projectId === p.id && c.email && addrs.includes(c.email.toLowerCase()))).map((p) => p.id));
  if (exact.size === 1) return { projectId: [...exact][0], candidates: [...exact] };
  if (exact.size > 1) return { projectId: null, candidates: [...exact] };
  if (!cfg.matchByDomain) return { projectId: null, candidates: [] };
  const ds = new Set(addrs.map(domainOf));
  const byDomain = active.filter((p) => projectDomains(state, p.id).some((d) => ds.has(d))).map((p) => p.id);
  return { projectId: byDomain.length === 1 ? byDomain[0] : null, candidates: byDomain };
}
