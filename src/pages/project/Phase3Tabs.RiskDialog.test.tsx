import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RqProvider } from "@/lib/rabbitqa/store";
import ProjectDetail from "@/pages/ProjectDetail";
import type { AuthUser } from "@/lib/auth-api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const user: AuthUser = { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" };
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user, token: "t", isLoading: false, login: vi.fn(), logout: vi.fn(), refreshMe: vi.fn() }) }));

function renderProject() {
  return render(
    <MemoryRouter initialEntries={["/app/projects/p_isyatirim?tab=risks"]}>
      <TooltipProvider>
        <RqProvider>
          <Routes>
            <Route path="/app/projects/:id" element={<ProjectDetail />} />
          </Routes>
        </RqProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function fieldInput(dialog: HTMLElement, labelText: string) {
  const label = within(dialog).getByText(labelText, { selector: "label" });
  return label.closest("div")!.querySelector("input, textarea") as HTMLInputElement | HTMLTextAreaElement;
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});

describe("RiskDialog — status/due reason guard (REV-01, INV-06, AC1-AC4)", () => {
  it("AC1: blank reason on a status change blocks save and shows an error", async () => {
    renderProject();
    fireEvent.click((await screen.findAllByRole("button", { name: "Düzenle" }))[0]);
    const dialog = await screen.findByRole("dialog");
    const statusSection = within(dialog).getByText("Durum", { selector: "label" }).closest("div")!;
    fireEvent.click(within(statusSection).getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "Azaltıldı" }));
    expect(within(dialog).getByLabelText("Gerekçe (zorunlu)")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(toast.error).toHaveBeenCalledWith("Gerekçe zorunlu");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("AC2: a due-date change with a reason saves and records it on the audit entry", async () => {
    renderProject();
    fireEvent.click((await screen.findAllByRole("button", { name: "Düzenle" }))[0]);
    const dialog = await screen.findByRole("dialog");
    const dueInput = fieldInput(dialog, "Termin");
    fireEvent.change(dueInput, { target: { value: "2026-11-01" } });
    const reasonInput = within(dialog).getByLabelText("Gerekçe (zorunlu)");
    fireEvent.change(reasonInput, { target: { value: "Müşteri termini uzattı" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(toast.success).toHaveBeenCalledWith("Kaydedildi");
    await vi.waitFor(() => { expect(screen.queryByRole("dialog")).toBeNull(); });
  });

  it("AC3: editing only the title/description shows no reason field and saves directly", async () => {
    renderProject();
    fireEvent.click((await screen.findAllByRole("button", { name: "Düzenle" }))[0]);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText("Gerekçe (zorunlu)")).toBeNull();
    fireEvent.change(fieldInput(dialog, "Başlık"), { target: { value: "Güncellenmiş başlık" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(toast.success).toHaveBeenCalledWith("Kaydedildi");
  });

  it("AC4: creating a new risk never requires a reason", async () => {
    renderProject();
    fireEvent.click(await screen.findByRole("button", { name: /Kayıt ekle/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByLabelText("Gerekçe (zorunlu)")).toBeNull();
    fireEvent.change(fieldInput(dialog, "Başlık"), { target: { value: "Yeni risk" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Kaydet" }));
    expect(toast.success).toHaveBeenCalledWith("Kaydedildi");
  });
});
