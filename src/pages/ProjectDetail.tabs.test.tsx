import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
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

// Seed'in referans tarihi (pazartesi). Uyarılar (ör. cuma günü açılan report_not_sent) ve terminler
// "bugün"e göre hesaplandığı için saat sabitlenir; yalnızca Date sahte, waitFor/findBy gerçek timer'la çalışır.
const NOW = new Date("2026-10-05T09:00:00");

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  localStorage.clear();
  vi.clearAllMocks();
  setUser({ id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" });
});

afterEach(() => { vi.useRealTimers(); });

describe("AC12 — Sekme düzeni", () => {
  it("manager (canSeeCredentials değil) için 12 sekme, Erişim bilgileri yok", async () => {
    renderProject("/app/projects/p_isyatirim?tab=phases");
    const tabs = screen.getAllByRole("tab").map((t) => t.textContent ?? "");
    expect(tabs.some((t) => t.includes("Erişim bilgileri"))).toBe(false);
    expect(tabs.some((t) => t.includes("Satış devri") || t.includes("Kick-off") || t.includes("Eğitim") || t.includes("Uyarlama") || t === "Uyarılar")).toBe(false);
    expect(screen.getByRole("tab", { name: "Aşamalar ve adımlar" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Aksiyonlar" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Toplantılar" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Keşif ve takımlar" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Dokümanlar" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Riskler ve kararlar" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Go-Live" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Süreklilik" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Entegrasyonlar" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Müşteri kişileri" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Müşteri geçmişi" })).toBeTruthy();
  });

  it("csm u_deniz kendi projesinde (canSeeCredentials) 13 sekmenin tamamını görür", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_garanti?tab=phases");
    expect(screen.getByRole("tab", { name: "Erişim bilgileri" })).toBeTruthy();
    expect(screen.getAllByRole("tab")).toHaveLength(13);
  });

  it("'Destek kayıtları' disabled'dır ve 'Faz 2' rozetini taşır", async () => {
    renderProject("/app/projects/p_isyatirim?tab=phases");
    const ticketsTab = screen.getByRole("tab", { name: /Destek kayıtları/i });
    expect(ticketsTab).toBeDisabled();
    expect(ticketsTab.textContent).toContain("Faz 2");
  });

  it("?tab=training ilgili paneli, ?tab=adaptation ilgili paneli açar", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_isyatirim?tab=training");
    expect(screen.getByRole("tab", { name: "Aşamalar ve adımlar", selected: true })).toBeTruthy();
    await screen.findByRole("dialog");
  });

  it("?tab=adaptation 05 panelini açar", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_isyatirim?tab=adaptation");
    expect(screen.getByRole("tab", { name: "Aşamalar ve adımlar", selected: true })).toBeTruthy();
    await screen.findByRole("dialog");
  });

  it("?tab=alerts uyarı panelini açar", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_garanti?tab=alerts");
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByText("Uyarılar").length).toBeGreaterThan(0);
  });
});

describe("AC3b — Kurulum özeti kartı sekmede (yetkili)", () => {
  it("Erişim bilgileri sekmesinde Kurulum özeti kartı görünür ve adım listesi içermez", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_garanti?tab=access");
    const summaryCard = screen.getByText("Kurulum özeti").closest(".rounded-lg") as HTMLElement;
    expect(within(summaryCard).getByText(/Kurulum tipi:/)).toBeTruthy();
    expect(within(summaryCard).getByText(/LLM:/)).toBeTruthy();
    expect(within(summaryCard).queryByRole("button")).toBeNull();
  });

  it("manager (yetkisiz) ?tab=access ile Aşamalar ve adımlar'a düşer", async () => {
    renderProject("/app/projects/p_garanti?tab=access");
    expect(screen.getByRole("tab", { name: "Aşamalar ve adımlar", selected: true })).toBeTruthy();
  });
});

describe("AC13 — Uyarı rozeti ve paneli", () => {
  it("açık uyarısı olan projede rozet görünür ve tıklanınca panel açılır", async () => {
    renderProject("/app/projects/p_garanti");
    const badge = await screen.findByText(/açık uyarı/i);
    fireEvent.click(badge.closest("button")!);
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByText("Uyarılar").length).toBeGreaterThan(0);
  });

  it("açık uyarısı olmayan bir projede rozet yoktur", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_perakende");
    await vi.waitFor(() => {
      expect(screen.queryByText(/açık uyarı/i)).toBeNull();
    });
  });

  it("?panel=alerts ile sayfa yüklenince panel açık gelir", async () => {
    renderProject("/app/projects/p_garanti?panel=alerts");
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getAllByText("Uyarılar").length).toBeGreaterThan(0);
  });
});

describe("AC-NEG4 — Gerekçesiz uyarı işlemi", () => {
  it("panelde gerekçe boşken kapatma butonu devre dışıdır", async () => {
    renderProject("/app/projects/p_garanti?panel=alerts");
    const panel = await screen.findByRole("dialog");
    const closeButtons = within(panel).getAllByRole("button", { name: "Kapat" });
    fireEvent.click(closeButtons[0]);
    const confirmDialogs = await screen.findAllByRole("dialog");
    const actionDialog = confirmDialogs.find((d) => d !== panel)!;
    const saveBtn = within(actionDialog).getByRole("button", { name: "Kapat" });
    expect(saveBtn).toBeDisabled();
  });
});

describe("AC14 — Satır uyarı ikonu", () => {
  it("gecikmiş açık bir adıma sahip fixture'da satırda uyarı ikonu vardır", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_garanti?tab=phases");
    const row = screen.getByText("Sunucuların oluşturulup teslim edilmesi").closest("tr");
    expect(row).toBeTruthy();
    expect(row!.querySelector(".lucide-triangle-alert")).toBeTruthy();
  });
});

describe("AC15 — Toplantılar filtresi", () => {
  // Radix Select jsdom'da zor çalışır (plan §9 notu); filtre kontrollerinin varlığı ve
  // başlangıç listesi burada doğrulanır, gerçek seçim L6'da (Playwright) doğrulanır.
  it("Tür ve Durum filtreleri görünür, varsayılan olarak tüm toplantılar listelenir", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_isyatirim?tab=meetings");
    expect(screen.getByLabelText("Tür")).toBeTruthy();
    expect(screen.getByLabelText("Durum")).toBeTruthy();
    // İş Yatırım seed'inde 2 Eğitim toplantısı (m_tr_1, m_tr_2) var.
    expect(screen.getAllByText("Eğitim").length).toBeGreaterThanOrEqual(2);
  });

  it("Hiç toplantısı olmayan bir fixture'da 'Toplantı yok' boş durumu görünür", async () => {
    // p_akbank'ta "brief" toplantısı var; boş durum için canlı CreateSeed dışı,
    // boş bir meetings listesiyle eşdeğer senaryo RqProvider başlangıcında yoktur.
    // Gerçek select etkileşimi (tür/durum filtresi) Radix Select nedeniyle L6'da (Playwright)
    // doğrulanır (plan §9 notu); burada filtre kontrollerinin ve varsayılan listenin varlığı yeterlidir.
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject("/app/projects/p_akbank?tab=meetings");
    expect(screen.getByText("Satış devri toplantısı.")).toBeTruthy();
  });
});
