import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import App from "@/App";
import type { AuthUser } from "@/lib/auth-api";

const manager: AuthUser = { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" };
// AppShell/ProtectedRoute need isAuthenticated + role; everything else in App (AuthProvider, BrowserRouter,
// RqProvider) is rendered for real so the actual App.tsx wiring (Sonner/Toaster placement) is under test.
vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ user: manager, role: manager.role, token: "t", isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn(), refreshMe: vi.fn() }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, "", "/app/projects/p_ornek?tab=phases");
});

describe("QA-02 regression — install choice toast with Link does not crash the app", () => {
  it("renders the real Sonner toaster inside BrowserRouter and shows the summary toast without an uncaught render error", async () => {
    // Sonner renders toasts asynchronously via a portal outside the normal React tree, so a context
    // mismatch (Link rendered where no Router context is available) surfaces as an uncaught error on
    // `window`, not as a synchronous throw from `render`/`fireEvent`. Capture it explicitly — this is
    // exactly how QA-02 reproduced: "Cannot destructure property 'basename' of ... useContext(...) as it is null".
    const uncaught: unknown[] = [];
    const onError = (e: ErrorEvent) => { uncaught.push(e.error ?? e.message); };
    window.addEventListener("error", onError);

    try {
      render(<App />);

      const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
      fireEvent.click(openButtons[0]);
      const panel = await screen.findByRole("dialog");
      const installSection = panel.querySelector('[data-field="installType"]') as HTMLElement;

      // null -> onprem: saved immediately, no reason dialog.
      fireEvent.click(within(installSection).getByRole("radio", { name: "On-prem" }));

      // onprem -> saas: opens the reason dialog and requires a non-empty reason.
      fireEvent.click(within(installSection).getByRole("radio", { name: "SaaS" }));
      const reasonDialog = await screen.findByRole("dialog", { name: "Kurulum tipi değişikliği" });
      fireEvent.change(within(reasonDialog).getByRole("textbox"), { target: { value: "müşteri saas'a geçti" } });
      fireEvent.click(within(reasonDialog).getByRole("button", { name: "Kaydet" }));

      // The toast (with the "Müşteri geçmişinde gör" Link) renders through Sonner's portal.
      await waitFor(() => {
        expect(screen.getByText("Müşteri geçmişinde gör")).toBeTruthy();
      });
      expect(screen.getByRole("dialog")).toBeTruthy();
    } finally {
      window.removeEventListener("error", onError);
    }

    expect(uncaught).toEqual([]);
  }, 15_000); // full <App /> render; slow under a loaded parallel run
});
