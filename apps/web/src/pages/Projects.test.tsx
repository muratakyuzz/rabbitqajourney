import { describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RqProvider } from "@/lib/rabbitqa/store";
import Projects from "@/pages/Projects";
import type { AuthUser } from "@/lib/auth-api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let currentUser: AuthUser | null = { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" };
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: currentUser, token: "t", isLoading: false, login: vi.fn(), logout: vi.fn(), refreshMe: vi.fn() }) }));

function setUser(u: AuthUser | null) { currentUser = u; }

function renderProjects() {
  return render(
    <MemoryRouter initialEntries={["/app/projects"]}>
      <TooltipProvider>
        <RqProvider>
          <Routes><Route path="/app/projects" element={<Projects />} /></Routes>
        </RqProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

describe("NewProjectDialog CSM select (RUL-01)", () => {
  it("manager can assign a CSM when creating a project", () => {
    setUser({ id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" });
    renderProjects();
    fireEvent.click(screen.getByRole("button", { name: /Yeni proje/i }));
    const dialog = screen.getByRole("dialog");
    const csmTrigger = within(dialog).getAllByRole("combobox")[0];
    expect(csmTrigger).not.toHaveAttribute("data-disabled");
  });

  it("admin cannot assign a CSM when creating a project", () => {
    setUser({ id: "u_admin", role: "admin", name: "Örnek Administrator", email: "admin@virgosol.com" });
    renderProjects();
    fireEvent.click(screen.getByRole("button", { name: /Yeni proje/i }));
    const dialog = screen.getByRole("dialog");
    const csmTrigger = within(dialog).getAllByRole("combobox")[0];
    expect(csmTrigger).toHaveAttribute("data-disabled");
  });
});
