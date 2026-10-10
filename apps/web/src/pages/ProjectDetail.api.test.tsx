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

async function renderProject(projectId: string, api: ReturnType<typeof fakeApi>) {
  render(
    <MemoryRouter initialEntries={[`/app/projects/${projectId}?tab=phases`]}>
      <TooltipProvider>
        <RqProvider>
          <Routes><Route path="/app/projects/:id" element={<ProjectDetail />} /></Routes>
        </RqProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
  await waitFor(() => expect(api.callsTo("GET", new RegExp(`^/projects/${projectId}/phases$`))).toHaveLength(1));
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
