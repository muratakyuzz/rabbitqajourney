import type { AiInsight, InsightKind, InsightSource, RqState } from "@rabbitqa/shared/domain/types";

export type InsightDraft = Omit<AiInsight, "id" | "status" | "createdAt" | "reviewedBy" | "reviewedAt" | "reviewNote" | "appliedEntityId">;
export interface IncomingMeta { title: string; from: string; at?: string; link?: string; direction?: "in" | "out" }

const lower = (s: string) => s.toLocaleLowerCase("tr-TR");
const words = (s: string) => lower(s).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 4);
const overlap = (a: string, b: string) => {
  const wb = new Set(words(b));
  return words(a).filter((w) => wb.has(w) || [...wb].some((x) => x.startsWith(w.slice(0, 5)) && w.startsWith(x.slice(0, 5)))).length;
};
const addDays = (iso: string, n: number) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

function parseDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?/);
  if (!m) return null;
  const y = m[3] ? (m[3].length === 2 ? "20" + m[3] : m[3]) : String(new Date().getFullYear());
  return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function findPerson(state: RqState, projectId: string, text: string): string | null {
  const t = lower(text);
  const people = [...state.contacts.filter((c) => c.projectId === projectId).map((c) => ({ id: c.id, name: c.name })), ...state.users.map((u) => ({ id: u.id, name: u.name }))];
  return people.find((p) => t.includes(lower(p.name.split(" ")[0])))?.id ?? null;
}

/** Saf fonksiyon: metni basit anahtar kelime kurallarıyla analiz eder, 0..n öneri taslağı döndürür. */
export function analyzeText(state: RqState, projectId: string, source: InsightSource, text: string, meta: IncomingMeta): InsightDraft[] {
  const cfg = state.integrations.ai;
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return [];
  const at = meta.at ?? new Date().toISOString();
  const out: InsightDraft[] = [];
  const sentences = text.split(/(?<=[.!?\n])\s+/).map((s) => s.trim()).filter(Boolean);
  const mk = (kind: InsightKind, sentence: string, d: Partial<InsightDraft>): InsightDraft => ({
    projectId, source, kind, targetId: null, current: null, proposed: {}, rationale: "", confidence: 60,
    sourceRef: { title: meta.title, from: meta.from, at, excerpt: sentence.slice(0, cfg.excerptMaxChars), link: meta.link ?? "#", direction: meta.direction },
    ...d,
  });

  for (const s of sentences) {
    const t = lower(s);
    if (/(tamamlandı|bitti|kuruldu|yapıldı|tamamladık)/.test(t)) {
      const act = state.actions.filter((a) => a.projectId === projectId && (a.status === "open" || a.status === "in_progress"))
        .map((a) => ({ a, n: overlap(a.title, s) })).sort((x, y) => y.n - x.n)[0];
      if (act && act.n > 0) {
        out.push(mk("action_update", s, { targetId: act.a.id, current: { status: act.a.status }, proposed: { status: "done" }, confidence: 80, rationale: `Mesajda "${act.a.title}" aksiyonunun yapıldığı belirtiliyor.` }));
      } else {
        const st = state.steps.filter((x) => x.projectId === projectId && x.completion === "manual" && (x.status === "pending" || x.status === "in_progress"))
          .map((x) => ({ x, n: overlap(x.title, s) })).sort((a, b) => b.n - a.n)[0];
        if (st && st.n > 0) out.push(mk("step_update", s, { targetId: st.x.id, current: { status: st.x.status }, proposed: { status: "done" }, confidence: 75, rationale: `Mesajda "${st.x.title}" adımının tamamlandığı belirtiliyor.` }));
      }
    }
    if (/(yapacağız|yapacak|gönderece|iletece|hazırlayacağ|paylaşacağ|tarihine kadar)/.test(t)) {
      const due = parseDate(s);
      const ownerId = findPerson(state, projectId, s);
      out.push(mk("action_create", s, {
        proposed: { title: s.replace(/[.!?]+$/, "").slice(0, 120), ownerId, due, priority: "medium", ball: ownerId && state.contacts.some((c) => c.id === ownerId) ? "customer" : "csm" },
        confidence: 65 + (due ? 10 : 0) + (ownerId ? 5 : 0), rationale: "Mesajda tarihli/kişiye bağlı bir taahhüt geçiyor.",
      }));
    }
    if (/(ertelen|kayacak|gecikece|erteledik)/.test(t)) {
      const nd = parseDate(s) ?? addDays(project.goLiveDate, 7);
      out.push(mk("date_change", s, { targetId: project.id, current: { goLiveDate: project.goLiveDate }, proposed: { goLiveDate: nd }, confidence: 70, rationale: "Mesajda takvimin kayacağı belirtiliyor." }));
      const nh = project.health === "green" ? "yellow" : "red";
      out.push(mk("health_change", s, { targetId: project.id, current: { health: project.health }, proposed: { health: nh, healthReason: `İletişimde gecikme bildirildi: ${s.slice(0, 100)}` }, confidence: 65, rationale: "Gecikme bildirimi proje sağlığını etkileyebilir." }));
    }
    if (/(risk|endişe|sorun)/.test(t)) {
      out.push(mk("risk_create", s, { proposed: { title: s.replace(/[.!?]+$/, "").slice(0, 100), description: s, impact: "medium" }, confidence: 65, rationale: "Mesajda bir risk/endişe dile getiriliyor." }));
    }
    if (/(karar verdik|anlaştık|karar alındı)/.test(t)) {
      out.push(mk("decision_create", s, { proposed: { title: s.replace(/[.!?]+$/, "").slice(0, 100), description: s, impact: "medium" }, confidence: 75, rationale: "Mesajda alınmış bir karar paylaşılıyor." }));
    }
  }
  return out.filter((d) => cfg.enabledKinds.includes(d.kind) && d.confidence >= cfg.minConfidence);
}

/** Bekleyen öneriler süresi geçtiyse görüntülemede "expired" sayılır. */
export function effectiveStatus(state: RqState, i: AiInsight) {
  if (i.status !== "pending") return i.status;
  const ageDays = (Date.now() - new Date(i.createdAt).getTime()) / 86400000;
  return ageDays > state.integrations.ai.autoExpireDays ? "expired" : "pending";
}
