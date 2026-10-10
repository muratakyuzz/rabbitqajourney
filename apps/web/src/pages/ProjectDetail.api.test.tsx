import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RqProvider } from "@/lib/rabbitqa/store";
import ProjectDetail from "@/pages/ProjectDetail";
import { STATE_KEY } from "@rabbitqa/shared/domain/seed";
import type { RqState } from "@rabbitqa/shared/domain/types";
import { apiError, fakeApi, json } from "@/test/fake-api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" }, token: "t", isLoading: false }),
}));

const NOW = "2026-10-12T09:00:00.000Z";
const stored = () => JSON.parse(localStorage.getItem(STATE_KEY)!) as RqState;

async function renderProject(projectId: string, api: ReturnType<typeof fakeApi>, tab = "phases") {
  render(
    <MemoryRouter initialEntries={[`/app/projects/${projectId}?tab=${tab}`]}>
      <TooltipProvider>
        <RqProvider>
          <Routes><Route path="/app/projects/:id" element={<ProjectDetail />} /></Routes>
        </RqProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(api.callsTo("GET", new RegExp(`^/projects/${projectId}/phases$`))).toHaveLength(1));
  await waitFor(() => expect(api.callsTo("GET", new RegExp(`^/projects/${projectId}/actions$`))).toHaveLength(1));
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

describe("Aşamalar ve adımlar → API", () => {
  it("step dialog: mark done → PATCH /steps/:id without reason → store takes the server's effects", async () => {
    const api = fakeApi({
      "PATCH /steps/st_garanti_18": (c) => {
        const step = api.server.steps.find((s) => s.id === "st_garanti_18")!;
        const next = api.server.steps.find((s) => s.id === "st_garanti_19")!;
        return json(200, {
          phases: [], actions: [],
          steps: [{ ...step, ...(c.body as object), status: "done" }, { ...next, status: "pending", activatedAt: NOW, due: "2026-10-15" }],
        });
      },
    });
    await renderProject("p_garanti", api);
    const title = api.server.steps.find((s) => s.id === "st_garanti_18")!.title;
    const row = screen.getByRole("button", { name: title }).closest("tr")!;
    fireEvent.click(within(row).getByRole("button", { name: "Adımı düzenle" }));

    const dialog = await screen.findByRole("dialog");
    const statusSection = within(dialog).getByText("Durum").parentElement!;
    fireEvent.click(within(statusSection).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "Tamamlandı" }));
    expect(within(dialog).queryByText(/Gerekçe/)).toBeNull(); // done needs no reason (K1)
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Adım güncellendi"));
    const [patch] = api.callsTo("PATCH", /^\/steps\/st_garanti_18$/);
    expect(patch.body).toMatchObject({ status: "done" });
    expect(patch.body).not.toHaveProperty("reason");
    await waitFor(() => {
      const s = stored();
      expect(s.steps.find((x) => x.id === "st_garanti_18")?.status).toBe("done");
      expect(s.steps.find((x) => x.id === "st_garanti_19")).toMatchObject({ status: "pending", due: "2026-10-15" });
    });
  });

  it("step dialog: API error is shown and the dialog stays open", async () => {
    const api = fakeApi({ "PATCH /steps/st_garanti_18": () => apiError(409, "CONFLICT", "Adımın sırası gelmedi") });
    await renderProject("p_garanti", api);
    const title = api.server.steps.find((s) => s.id === "st_garanti_18")!.title;
    fireEvent.click(within(screen.getByRole("button", { name: title }).closest("tr")!).getByRole("button", { name: "Adımı düzenle" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Adımın sırası gelmedi"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("phase approval: POST /phases/:id/complete → approver shown, next phase opens", async () => {
    const api = fakeApi({
      "POST /phases/ph_isyatirim_07/complete": () => {
        const ph = api.server.phases.find((p) => p.id === "ph_isyatirim_07")!;
        const next = api.server.phases.find((p) => p.id === "ph_isyatirim_08")!;
        return json(200, {
          phases: [
            { ...ph, status: "done", approvedBy: "u_admin", approvedAt: NOW, actualEnd: "2026-10-12" },
            { ...next, status: "in_progress", activatedAt: NOW, actualStart: "2026-10-12" },
          ],
          steps: [], actions: [],
        });
      },
    });
    await renderProject("p_isyatirim", api);
    const buttons = screen.getAllByRole("button", { name: "Aşamayı tamamla" });
    expect(buttons).toHaveLength(1); // only 06 is open and approvable
    fireEvent.click(buttons[0]);

    await waitFor(() => expect(api.callsTo("POST", /^\/phases\/ph_isyatirim_07\/complete$/)).toHaveLength(1));
    await waitFor(() => expect(screen.getByText(/Onaylayan: Örnek Administrator/)).toBeInTheDocument());
    expect(stored().phases.find((p) => p.id === "ph_isyatirim_08")?.status).toBe("in_progress");
  });
});

describe("Aksiyonlar → API", () => {
  const P = "p_isyatirim";
  const serverAction = (api: ReturnType<typeof fakeApi>, id: string) => api.server.actions.find((a) => a.id === id)!;
  /** Echo of PATCH /actions/:id like the API: the patched action (reason dropped) as the only effect. */
  const patchEcho = (api: () => ReturnType<typeof fakeApi>) => (c: { path: string; body: unknown }) => {
    const id = c.path.split("/").pop()!;
    const { reason: _r, ...patch } = c.body as Record<string, unknown>;
    return json(200, { phases: [], steps: [], actions: [{ ...serverAction(api(), id), ...patch }] });
  };
  const row = (title: string) => screen.getByText(title).closest("tr")!;
  const openEdit = async (title: string) => {
    fireEvent.click(within(row(title)).getByRole("button", { name: "Aksiyonu düzenle" }));
    return screen.findByRole("dialog");
  };
  const pick = async (dialog: HTMLElement, label: string, option: string) => {
    fireEvent.click(within(within(dialog).getByText(label).parentElement!).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: option }));
  };
  const filter = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

  it("filters work on the hydrated (server) actions", async () => {
    const api = fakeApi();
    await renderProject(P, api, "actions");
    const a1 = serverAction(api, "a_1").title; // contact owner, ball customer, open
    const a2 = serverAction(api, "a_2").title; // u_deniz, csm
    expect(screen.getByText(a1)).toBeInTheDocument();
    filter(/^Top müşteride/);
    expect(screen.getByText(a1)).toBeInTheDocument();
    expect(screen.queryByText(a2)).toBeNull();
    filter(/^Tamamlanan/);
    expect(screen.queryByText(a1)).toBeNull();
    filter(/^Bana atanan/); // u_manager owns nothing here
    expect(screen.getByText("Bu filtrede aksiyon yok")).toBeInTheDocument();
    filter(/^Tümü/);
    expect(screen.getByText(a2)).toBeInTheDocument();
  });

  it("new action: POST with the owner-derived ball → the server's record is in the store and the list", async () => {
    const api = fakeApi({
      [`POST /projects/${P}/actions`]: (c) => json(201, {
        phases: [], steps: [],
        actions: [{ ...(c.body as object), id: "a_srv", projectId: P, source: "manual", meetingId: null, createdAt: NOW, isCustomerVisible: true }],
      }),
    });
    await renderProject(P, api, "actions");
    fireEvent.click(screen.getByRole("button", { name: "Aksiyon ekle" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByText("Başlık").parentElement!.querySelector("input")!, { target: { value: "Yeni API aksiyonu" } });
    await pick(dialog, "Sahip", "Mehmet Ertuğrul Elitop (müşteri)");
    expect(within(within(dialog).getByText("Top kimde").parentElement!).getByRole("combobox")).toHaveTextContent("Müşteri");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Aksiyon eklendi"));
    const [post] = api.callsTo("POST", new RegExp(`^/projects/${P}/actions$`));
    expect(post.body).toMatchObject({ title: "Yeni API aksiyonu", ownerId: "c_2", ball: "customer", status: "open" });
    expect(screen.getByText("Yeni API aksiyonu")).toBeInTheDocument();
    expect(stored().actions.find((a) => a.id === "a_srv")).toMatchObject({ title: "Yeni API aksiyonu", ball: "customer" });
    // the API's own record is the server view: the bridge sends nothing
    await new Promise((r) => setTimeout(r, 400));
    expect(api.callsTo("POST", /steps\/sync$/)).toEqual([]);
  });

  it("due change: the reason is asked in the panel, then sent with the PATCH", async () => {
    const api = fakeApi({ "PATCH /actions/a_2": patchEcho(() => api) });
    await renderProject(P, api, "actions");
    const dialog = await openEdit(serverAction(api, "a_2").title);
    fireEvent.change(within(dialog).getByText("Termin").parentElement!.querySelector("input")!, { target: { value: "2026-10-30" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Gerekçe zorunlu");
    expect(api.callsTo("PATCH", /^\/actions\//)).toEqual([]);

    fireEvent.change(within(dialog).getByText(/^Gerekçe \(/).parentElement!.querySelector("textarea")!, { target: { value: "Müşteri tatilde" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Aksiyon güncellendi"));
    expect(api.callsTo("PATCH", /^\/actions\/a_2$/)[0].body).toMatchObject({ due: "2026-10-30", reason: "Müşteri tatilde" });
    expect(stored().actions.find((a) => a.id === "a_2")?.due).toBe("2026-10-30");
  });

  it("cancelling asks for a reason; completing in the panel does not", async () => {
    const api = fakeApi({ "PATCH /actions/a_2": patchEcho(() => api) });
    await renderProject(P, api, "actions");
    let dialog = await openEdit(serverAction(api, "a_2").title);
    await pick(dialog, "Durum", "İptal");
    expect(within(dialog).getByText(/Gerekçe \(termin değişikliği ve iptalde zorunlu\)/)).toBeInTheDocument();
    await pick(dialog, "Durum", "Tamamlandı");
    expect(within(dialog).queryByText(/^Gerekçe \(/)).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(api.callsTo("PATCH", /^\/actions\/a_2$/)).toHaveLength(1));
    expect(api.callsTo("PATCH", /^\/actions\/a_2$/)[0].body).not.toHaveProperty("reason");

    filter(/^Tümü/);
    dialog = await openEdit(serverAction(api, "a_2").title);
    await pick(dialog, "Durum", "İptal");
    fireEvent.change(within(dialog).getByText(/^Gerekçe \(/).parentElement!.querySelector("textarea")!, { target: { value: "Gerek kalmadı" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(api.callsTo("PATCH", /^\/actions\/a_2$/)).toHaveLength(2));
    expect(api.callsTo("PATCH", /^\/actions\/a_2$/)[1].body).toMatchObject({ status: "cancelled", reason: "Gerek kalmadı" });
  });

  it("owner → customer contact: the ball follows, PATCH carries the owner", async () => {
    const api = fakeApi({ "PATCH /actions/a_2": patchEcho(() => api) });
    await renderProject(P, api, "actions");
    const dialog = await openEdit(serverAction(api, "a_2").title);
    await pick(dialog, "Sahip", "Mehmet Ertuğrul Elitop (müşteri)");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(api.callsTo("PATCH", /^\/actions\/a_2$/)).toHaveLength(1));
    expect(api.callsTo("PATCH", /^\/actions\/a_2$/)[0].body).toMatchObject({ ownerId: "c_2", ball: "customer" });
    await waitFor(() => expect(within(row(serverAction(api, "a_2").title)).getByText("Müşteri")).toBeInTheDocument());
  });

  it("Tamamlandı checkbox → PATCH status done → the row moves to Tamamlanan", async () => {
    const api = fakeApi({ "PATCH /actions/a_2": patchEcho(() => api) });
    await renderProject(P, api, "actions");
    const title = serverAction(api, "a_2").title;
    fireEvent.click(within(row(title)).getByRole("checkbox", { name: `Tamamlandı: ${title}` }));
    await waitFor(() => expect(api.callsTo("PATCH", /^\/actions\/a_2$/)).toHaveLength(1));
    expect(api.callsTo("PATCH", /^\/actions\/a_2$/)[0].body).toEqual({ status: "done" });
    await waitFor(() => expect(screen.queryByText(title)).toBeNull()); // gone from "Açık"
    filter(/^Tamamlanan/);
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it("API error → message in the panel, panel stays open, store unchanged", async () => {
    const api = fakeApi({ "PATCH /actions/a_2": () => apiError(400, "REASON_REQUIRED", "Gerekçe zorunludur.") });
    await renderProject(P, api, "actions");
    const before = stored().actions.find((a) => a.id === "a_2");
    const dialog = await openEdit(serverAction(api, "a_2").title);
    await pick(dialog, "Öncelik", "Düşük");
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent("Gerekçe zorunludur."));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(stored().actions.find((a) => a.id === "a_2")).toEqual(before);
  });
});
