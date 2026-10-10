import { vi } from "vitest";
import { createSeed } from "@rabbitqa/shared/domain/seed";

// In-memory stand-in for apps/api in web tests: serves the seed like a fresh API boot.
// `handlers` override routes by "METHOD /path" regex (path without the /api prefix).

export interface Call { method: string; path: string; body: unknown }
type Handler = (call: Call) => Response | Promise<Response>;

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
export const apiError = (status: number, code: string, message: string) => json(status, { error: { code, message } });

export function fakeApi(handlers: Record<string, Handler> = {}) {
  const server = createSeed();
  const calls: Call[] = [];
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const call: Call = {
      method: init?.method ?? "GET",
      path: String(input).replace(/^\/api/, ""),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const key = `${call.method} ${call.path}`;
    for (const [pattern, h] of Object.entries(handlers)) if (new RegExp(`^${pattern}$`).test(key)) return h(call);

    let m = key.match(/^GET \/projects\/([^/]+)\/phases$/);
    if (m) {
      const pid = m[1];
      if (!server.projects.some((p) => p.id === pid)) return apiError(404, "NOT_FOUND", "Proje bulunamadı.");
      return json(200, { phases: server.phases.filter((p) => p.projectId === pid), steps: server.steps.filter((s) => s.projectId === pid) });
    }
    m = key.match(/^GET \/projects\/([^/]+)\/actions$/);
    if (m) {
      const pid = m[1];
      if (!server.projects.some((p) => p.id === pid)) return apiError(404, "NOT_FOUND", "Proje bulunamadı.");
      return json(200, { items: server.actions.filter((a) => a.projectId === pid) });
    }
    m = key.match(/^POST \/projects\/([^/]+)\/steps\/sync$/);
    if (m) {
      const b = call.body as { steps?: unknown[]; actions?: unknown[] };
      return json(200, { phases: [], steps: b.steps ?? [], actions: b.actions ?? [] });
    }
    return apiError(404, "NOT_FOUND", "Uç bulunamadı.");
  });
  vi.stubGlobal("fetch", fn);
  const callsTo = (method: string, path: RegExp) => calls.filter((c) => c.method === method && path.test(c.path));
  return { fn, calls, callsTo, server };
}
