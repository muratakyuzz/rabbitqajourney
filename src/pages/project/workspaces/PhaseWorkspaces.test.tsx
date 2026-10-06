import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RqProvider } from "@/lib/rabbitqa/store";
import ProjectDetail from "@/pages/ProjectDetail";
import type { AuthUser } from "@/lib/auth-api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let currentUser: AuthUser | null = { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" };
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: currentUser, token: "t", isLoading: false, login: vi.fn(), logout: vi.fn(), refreshMe: vi.fn() }) }));

function setUser(u: AuthUser | null) { currentUser = u; }

function renderProject(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
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

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setUser({ id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" });
});

describe("AC1/AC2 — Keşif: sekme ve panel aynı bileşen, eksik alan vurgusu", () => {
  it("02 panelinde cevap girilince sekmede de görünür; panel [data-field] işaretli", async () => {
    renderProject("/app/projects/p_akbank?ws=02");
    const panel = await screen.findByRole("dialog");
    expect(panel.querySelector('[data-field="discovery:q_teams"]')).toBeTruthy();
    expect(panel.querySelector('[data-field="meeting:discovery"]')).toBeTruthy();
    const textarea = within(panel).getAllByRole("textbox").find((el) => el.closest('[data-field="discovery:q_teams"]'))!;
    fireEvent.change(textarea, { target: { value: "2 takım" } });
    fireEvent.blur(textarea);
    await vi.waitFor(() => {
      expect(screen.getByRole("tab", { name: /Keşif ve takımlar/i })).toBeTruthy();
    });
  });

  it("KPI tanımı satırına tıklayınca panel açılır ve [data-field='kpis'] vurgulanır", async () => {
    renderProject("/app/projects/p_akbank?tab=phases");
    fireEvent.click(screen.getByText("KPI tanımı"));
    const panel = await screen.findByRole("dialog");
    await vi.waitFor(() => {
      const el = panel.querySelector('[data-field="kpis"]');
      expect(el?.className).toContain("ring-2");
    }, { timeout: 1000 });
  });
});

describe("AC3 / AC3b — Erişim paneli ve Kurulum özeti kartı", () => {
  it("03 panelinde VPN erişim bilgisi ekleyince vpn_info tamamlanır", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_garanti?ws=03");
    const panel = await screen.findByRole("dialog");
    const form = panel.querySelector('[data-field="credential:vpn"]')!;
    fireEvent.change(within(form as HTMLElement).getByPlaceholderText("Sağlayıcı"), { target: { value: "FortiClient" } });
    fireEvent.change(within(form as HTMLElement).getByPlaceholderText("Kullanıcı adı"), { target: { value: "test.user" } });
    fireEvent.click(within(form as HTMLElement).getByRole("button", { name: "Erişim bilgisi ekle" }));
    const row = screen.getAllByText("VPN bilgilerinin alınması ve kaydedilmesi").map((el) => el.closest("tr")).find((tr): tr is HTMLTableRowElement => !!tr)!;
    await vi.waitFor(() => {
      expect(within(row).getByText("Tamamlandı")).toBeTruthy();
    });
  });

  it("Kurulum özeti kartı 03 panelinde ve sekmesinde görünür, adım listesi içermez", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_garanti?ws=03");
    const panel = await screen.findByRole("dialog");
    const summaryCard = within(panel).getByText("Kurulum özeti").closest(".rounded-lg") as HTMLElement;
    expect(within(summaryCard).getByText(/Kurulum tipi:/)).toBeTruthy();
    expect(within(summaryCard).getByText(/LLM:/)).toBeTruthy();
    expect(within(summaryCard).queryByText("VPN erişiminin talep edilmesi")).toBeNull();
    expect(within(summaryCard).queryByRole("button")).toBeNull();
  });
});

describe("AC4 — Erişim yetkisi", () => {
  it("care kullanıcısı 03 panelini açamaz (?ws=03 yok sayılır)", async () => {
    setUser({ id: "u_gencay", role: "care", name: "Gençay Genç", email: "gencay.genc@virgosol.com" });
    renderProject("/app/projects/p_garanti?ws=03");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("csm (proje sahibi) Erişim bilgileri sekmesini görür, Formu aç ile panel açılır", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_garanti?tab=phases");
    expect(screen.getByRole("tab", { name: /Erişim bilgileri/i })).toBeTruthy();
  });
});

describe("AC6 — Eğitim: TrainingWorkspace form", () => {
  it("Session ekle ile açılan form tür Eğitim, durum Planlandı; Eğitmen/Modüller/Kayıt linki alanları görünür", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_isyatirim?ws=04");
    const panel = await screen.findByRole("dialog");
    fireEvent.click(within(panel).getByRole("button", { name: /Session ekle/i }));
    const dialogs = await screen.findAllByRole("dialog");
    const form = dialogs.find((d) => within(d).queryByText("Eğitmen"))!;
    expect(form).toBeTruthy();
    expect(within(form).getByText("Eğitmen")).toBeTruthy();
    expect(within(form).getByText("Anlatılan modüller")).toBeTruthy();
    expect(within(form).getByText("Kayıt linki")).toBeTruthy();
  });
});

describe("AC8 / AC10 — Uyarlama kontrol listesi ve toplantı görünürlüğü", () => {
  it("p_perakende 'Mobil' takımında kalan 3 madde işaretlenince adım done olur", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_perakende?ws=05");
    const panel = await screen.findByRole("dialog");
    const mobilCard = within(panel).getByText("Mobil").closest(".rounded-lg") as HTMLElement;
    const checkboxes = within(mobilCard).getAllByRole("checkbox");
    const unchecked = checkboxes.filter((c) => c.getAttribute("aria-checked") !== "true" && c.getAttribute("data-state") !== "checked");
    unchecked.forEach((c) => fireEvent.click(c));
    await vi.waitFor(() => {
      expect(within(mobilCard).getByText("Tamamlandı")).toBeTruthy();
    });
  });

  it("'+ Session ekle' uyarlama toplantı formunu takım ön seçili açar", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_perakende?ws=05");
    const panel = await screen.findByRole("dialog");
    const mobilCard = within(panel).getByText("Mobil").closest(".rounded-lg") as HTMLElement;
    fireEvent.click(within(mobilCard).getByRole("button", { name: /Session ekle/i }));
    const dialogs = await screen.findAllByRole("dialog");
    const form = dialogs.find((d) => within(d).queryByText("Takım"))!;
    expect(within(form).getByText("Takım")).toBeTruthy();
  });
});

describe("AC-NEG3 — Salt okunur kontrol listesi", () => {
  it("devops 05 panelinde onay kutularını disabled görür, '+ Session ekle' yoktur", async () => {
    setUser({ id: "u_cagla", role: "devops", name: "Çağla Kahriman", email: "cagla.kahriman@virgosol.com" });
    renderProject("/app/projects/p_perakende?ws=05");
    const panel = await screen.findByRole("dialog");
    const checkboxes = within(panel).getAllByRole("checkbox");
    checkboxes.forEach((c) => expect(c).toBeDisabled());
    expect(within(panel).queryByRole("button", { name: /Session ekle/i })).toBeNull();
  });
});
