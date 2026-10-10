import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type { PhaseTpl, TemplateVersion } from "@rabbitqa/shared";
import { PHASE_TEMPLATE } from "@rabbitqa/shared/domain/seed";
import { RqProvider, useRq } from "@/lib/rabbitqa/store";
import { TemplateEditor } from "./TemplateEditor";

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "u_admin", role: "admin", name: "Örnek Administrator", email: "admin@virgosol.com" } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const version = (n: number, phases: PhaseTpl[] = PHASE_TEMPLATE): TemplateVersion =>
  ({ version: n, createdAt: "2026-10-10T09:00:00.000Z", createdBy: "u_admin", phases });
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** Routes fetch by method; returns the mock so tests can read calls. */
function mockApi(handlers: { get: () => Response | Promise<Response>; put?: (body: { baseVersion: number; phases: PhaseTpl[] }) => Response }) {
  const fn = vi.fn(async (_url: string, init?: RequestInit) =>
    init?.method === "PUT" ? handlers.put!(JSON.parse(String(init.body))) : handlers.get());
  vi.stubGlobal("fetch", fn);
  return fn;
}

function Harness() {
  const { templateVersion } = useRq();
  return <TemplateEditor key={templateVersion?.version ?? 0} />;
}
const renderEditor = () => render(<RqProvider><Harness /></RqProvider>);
const saveButton = () => screen.getByRole("button", { name: "Şablonu kaydet" });

beforeEach(() => {
  localStorage.clear();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});
afterEach(() => vi.unstubAllGlobals());

describe("TemplateEditor", () => {
  it("shows the active version from the API", async () => {
    mockApi({ get: () => json(200, version(1)) });
    renderEditor();
    expect(await screen.findByText(/^Sürüm 1 · .* · yalnızca yeni projeler etkilenir$/)).toBeInTheDocument();
  });

  it("save: PUT with baseVersion and the edited phases, then shows the new version", async () => {
    const fetchMock = mockApi({
      get: () => json(200, version(1)),
      put: (body) => json(201, version(2, body.phases)),
    });
    renderEditor();
    await screen.findByText(/^Sürüm 1 ·/);

    fireEvent.click(screen.getByRole("button", { name: /06 — Uygulama/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Adım ekle/ }));
    fireEvent.click(saveButton());

    await screen.findByText(/^Sürüm 2 ·/);
    const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT")!;
    expect(put[0]).toBe("/api/config/template");
    const body = JSON.parse(String(put[1]!.body));
    expect(body.baseVersion).toBe(1);
    expect(body.phases[6].steps).toHaveLength(PHASE_TEMPLATE[6].steps.length + 1);
    expect(toast.success).toHaveBeenCalledWith("Şablon kaydedildi · sürüm 2");
  });

  it("409 version conflict: error toast with a Yenile action that reloads the template", async () => {
    let current = 1;
    mockApi({
      get: () => json(200, version(current)),
      put: () => json(409, { error: { code: "CONFLICT", message: "Şablon başka bir yerde değişti, sayfayı yenileyin.", field: "baseVersion" } }),
    });
    renderEditor();
    await screen.findByText(/^Sürüm 1 ·/);
    fireEvent.click(saveButton());

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const [message, opts] = vi.mocked(toast.error).mock.calls[0] as [string, { action: { label: string; onClick: () => void } }];
    expect(message).toBe("Şablon başka bir yerde değişti, sayfayı yenileyin.");
    expect(opts.action.label).toBe("Yenile");

    current = 3;
    act(() => opts.action.onClick());
    expect(await screen.findByText(/^Sürüm 3 ·/)).toBeInTheDocument();
  });

  it("other API errors: message in the toast, no Yenile", async () => {
    mockApi({
      get: () => json(200, version(1)),
      put: () => json(409, { error: { code: "CONFLICT", message: "Sistem adımı silinemez veya başka aşamaya taşınamaz: CSM ataması." } }),
    });
    renderEditor();
    await screen.findByText(/^Sürüm 1 ·/);
    fireEvent.click(saveButton());
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Sistem adımı silinemez veya başka aşamaya taşınamaz: CSM ataması.", undefined));
    expect(screen.getByText(/^Sürüm 1 ·/)).toBeInTheDocument();
  });

  it("API unreachable: stored template is shown, saving is disabled", async () => {
    mockApi({ get: () => Promise.reject(new TypeError("Failed to fetch")) });
    renderEditor();
    expect(await screen.findByText(/Sunucuya ulaşılamadı/)).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole("button", { name: /00 — Satış Devri/ })).toBeInTheDocument();
  });
});
