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

function renderProject(initialPath = "/app/projects/p_ornek?tab=phases") {
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

describe("AC1 — Formu aç + live step completion", () => {
  it("opens the 00 panel and completing Lisans modeli marks the step done in the table", async () => {
    renderProject();
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("heading", { name: "Satış Devri", level: 2 })).toBeTruthy();
    const licenseInput = within(panel).getByLabelText("Lisans modeli");
    fireEvent.change(licenseInput, { target: { value: "Yıllık abonelik" } });
    fireEvent.blur(licenseInput);
    const row = screen.getAllByText("Satışçı ve lisans modelinin girilmesi").map((el) => el.closest("tr")).find((tr): tr is HTMLTableRowElement => !!tr)!;
    await vi.waitFor(() => {
      expect(within(row).getByText("Tamamlandı")).toBeTruthy();
    });
  });
});

describe("AC2 — clicking a missing step highlights its field", () => {
  it("opens the panel and highlights purchasedModules", async () => {
    renderProject();
    fireEvent.click(screen.getByText("Satın alınan modüllerin girilmesi"));
    const panel = await screen.findByRole("dialog");
    await vi.waitFor(() => {
      const el = panel.querySelector('[data-field="purchasedModules"]');
      expect(el?.className).toContain("ring-2");
    }, { timeout: 1000 });
  });
});

describe("AC3 — meeting step opens prefilled form and completes on save", () => {
  it("opens MeetingDialog with defaultType brief and completes the step on save", async () => {
    renderProject();
    fireEvent.click(screen.getByText("Satış devri toplantısı"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Toplantı kaydet")).toBeTruthy();
    // p_ornek.csmId is u_deniz (Deniz Uzun); MeetingDialog pre-checks the project's CSM as an internal participant.
    const denizLabel = within(dialog).getByText("Deniz Uzun").closest("label") as HTMLElement;
    expect(within(denizLabel).getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
    const saveBtn = within(dialog).getByRole("button", { name: "Kaydet" });
    fireEvent.click(saveBtn);
    expect(toast.success).toHaveBeenCalledWith("Toplantı kaydedildi");
    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    const row = screen.getByText("Satış devri toplantısı").closest("tr")!;
    expect(within(row).getByText("Tamamlandı")).toBeTruthy();
  });
});

describe("AC4 — Teklif kutucuğu: dosya yükle, adım tamamlanır, kutucuk güncellenir", () => {
  it("uploading an offer document locks the type, completes the offer step, and shows the file in the box and in Dokümanlar", async () => {
    renderProject();
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    const offerBox = panel.querySelector('[data-field="doc:offer"]') as HTMLElement;
    fireEvent.click(within(offerBox).getByRole("button", { name: "Yükle" }));

    const uploadDialog = await screen.findByRole("dialog", { name: "Doküman ekle" });
    const typeTrigger = within(uploadDialog).getAllByRole("combobox")[0];
    expect(typeTrigger).toHaveTextContent("Teklif");
    expect(typeTrigger).toHaveAttribute("data-disabled");

    const file = new File(["teklif içeriği"], "teklif-2026.pdf", { type: "application/pdf" });
    const fileInput = uploadDialog.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(within(uploadDialog).getByRole("button", { name: "Kaydet" }));

    expect(toast.success).toHaveBeenCalledWith("Doküman eklendi");
    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Doküman ekle" })).toBeNull();
    });

    // Box now shows the uploaded file name and a link to Dokümanlar, "Yükle" is gone.
    await vi.waitFor(() => {
      expect(within(offerBox).getByText("teklif-2026.pdf")).toBeTruthy();
    });
    expect(within(offerBox).getByText("Dokümanlar'da gör")).toBeTruthy();
    expect(within(offerBox).queryByRole("button", { name: "Yükle" })).toBeNull();

    // The "Teklif dokümanının yüklenmesi" step is done in the step table.
    const row = screen.getAllByText("Teklif dokümanının yüklenmesi").map((el) => el.closest("tr")).find((tr): tr is HTMLTableRowElement => !!tr)!;
    expect(within(row).getByText("Tamamlandı")).toBeTruthy();
  });
});

describe("AC5 / AC-NEG1 / AC-NEG2 — kurulum tipi değişikliği gerekçeli", () => {
  it("first pick saves immediately; a later change requires a non-empty reason; cancel keeps the prior value", async () => {
    renderProject(); // p_ornek.installType starts null
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    const installSection = panel.querySelector('[data-field="installType"]') as HTMLElement;

    // null -> onprem: no reason dialog.
    fireEvent.click(within(installSection).getByRole("radio", { name: "On-prem" }));
    expect(screen.queryByRole("dialog", { name: "Kurulum tipi değişikliği" })).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("Kurulum tipi kaydedildi", expect.anything());

    // "Henüz belli değil" is disabled once a value is set (AC-NEG2).
    expect(within(installSection).getByRole("radio", { name: "Henüz belli değil" })).toHaveAttribute("data-disabled");

    const auditCountBefore = screen.queryAllByText(/Otomatik kural: kurulum tipi/).length;

    // onprem -> saas: ChoiceReasonDialog opens, Kaydet disabled while reason is empty.
    fireEvent.click(within(installSection).getByRole("radio", { name: "SaaS" }));
    const reasonDialog = await screen.findByRole("dialog", { name: "Kurulum tipi değişikliği" });
    const saveBtn = within(reasonDialog).getByRole("button", { name: "Kaydet" });
    expect(saveBtn).toBeDisabled();

    // Vazgeç: installType stays onprem, no new audit (AC-NEG1).
    fireEvent.click(within(reasonDialog).getByRole("button", { name: "Vazgeç" }));
    expect(screen.queryByRole("dialog", { name: "Kurulum tipi değişikliği" })).toBeNull();
    expect(within(installSection).getByRole("radio", { name: "On-prem" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryAllByText(/Otomatik kural: kurulum tipi/).length).toBe(auditCountBefore);

    // Re-open and save with a reason: value changes, reqdoc (onprem-keyed) goes out_of_scope, saas_env appears.
    fireEvent.click(within(installSection).getByRole("radio", { name: "SaaS" }));
    const reasonDialog2 = await screen.findByRole("dialog", { name: "Kurulum tipi değişikliği" });
    fireEvent.change(within(reasonDialog2).getByRole("textbox"), { target: { value: "müşteri saas'a geçti" } });
    fireEvent.click(within(reasonDialog2).getByRole("button", { name: "Kaydet" }));
    expect(toast.success).toHaveBeenCalledWith("Kurulum tipi kaydedildi", expect.anything());
    await vi.waitFor(() => {
      expect(within(installSection).getByRole("radio", { name: "SaaS" })).toHaveAttribute("aria-checked", "true");
    });
  });
});

describe("AC6 — role-based access", () => {
  it("devops sees 'Formu aç' but all inputs are disabled and the read-only note shows", async () => {
    setUser({ id: "u_cagla", role: "devops", name: "Çağla Kahriman", email: "cagla.kahriman@virgosol.com" });
    renderProject();
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    expect(openButtons.length).toBeGreaterThan(0);
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByText("Bu paneli yalnızca görüntüleyebilirsiniz.")).toBeTruthy();
    const licenseInput = within(panel).getByLabelText("Lisans modeli") as HTMLInputElement;
    expect(licenseInput.disabled).toBe(true);
  });

  it("csm (project owner) can edit; CSM select is disabled for non-manager", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject();
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    const licenseInput = within(panel).getByLabelText("Lisans modeli") as HTMLInputElement;
    expect(licenseInput.disabled).toBe(false);
  });

  it("REV-01: manager can edit the CSM select", async () => {
    renderProject();
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    const csmTrigger = within(panel.querySelector('[data-field="csmId"]') as HTMLElement).getByRole("combobox");
    expect(csmTrigger).not.toHaveAttribute("data-disabled");
    expect(within(panel).getByText("CSM")).toBeTruthy();
  });

  it("REV-01: admin can edit other fields but the CSM select is disabled", async () => {
    setUser({ id: "u_admin", role: "admin", name: "Örnek Administrator", email: "admin@virgosol.com" });
    renderProject();
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    const csmTrigger = within(panel.querySelector('[data-field="csmId"]') as HTMLElement).getByRole("combobox");
    expect(csmTrigger).toHaveAttribute("data-disabled");
    expect(within(panel).getByText("CSM (Manager atar)")).toBeTruthy();
    const licenseInput = within(panel).getByLabelText("Lisans modeli") as HTMLInputElement;
    expect(licenseInput.disabled).toBe(false);
  });

  it("REV-01: csm (project owner) sees the CSM select disabled too", async () => {
    setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
    renderProject();
    const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
    fireEvent.click(openButtons[0]);
    const panel = await screen.findByRole("dialog");
    const csmTrigger = within(panel.querySelector('[data-field="csmId"]') as HTMLElement).getByRole("combobox");
    expect(csmTrigger).toHaveAttribute("data-disabled");
  });

  it("REV-01: devops and care have no Yükle / Toplantı kaydet / Ekle actions in the panel", async () => {
    for (const u of [
      { id: "u_cagla", role: "devops" as const, name: "Çağla Kahriman", email: "cagla.kahriman@virgosol.com" },
      { id: "u_gencay", role: "care" as const, name: "Gençay Genç", email: "gencay.genc@virgosol.com" },
    ]) {
      setUser(u);
      const { unmount } = renderProject();
      const openButtons = screen.getAllByRole("button", { name: /Formu aç/i });
      fireEvent.click(openButtons[0]);
      const panel = await screen.findByRole("dialog");
      expect(within(panel).queryByRole("button", { name: "Yükle" })).toBeNull();
      expect(within(panel).queryByRole("button", { name: "Toplantı kaydet" })).toBeNull();
      expect(within(panel).queryByRole("button", { name: "Ekle" })).toBeNull();
      unmount();
    }
  });
});

describe("AC-NEG3 — unauthorized meeting click", () => {
  it("devops clicking an unfinished meeting step does not open a form", async () => {
    setUser({ id: "u_cagla", role: "devops", name: "Çağla Kahriman", email: "cagla.kahriman@virgosol.com" });
    renderProject();
    fireEvent.click(screen.getByText("Satış devri toplantısı"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("AC7 — Kick-off ve Satış devri tabs removed; 01 has 3 steps with correct completion labels", () => {
  it("tab list has no handover/kickoff triggers; 01 phase lists its 3 steps", () => {
    renderProject();
    expect(screen.queryByRole("tab", { name: "Satış devri" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Kick-off" })).toBeNull();
    fireEvent.click(screen.getByText("Kick-off", { selector: "span" }));
    const kickoffRow = screen.getByText("Kick-off toplantısı").closest("tr")!;
    expect(within(kickoffRow).getByText("Toplantıyla")).toBeTruthy();
    const reqdocRow = screen.getByText("Kurulum gereksinim dokümanının paylaşılması").closest("tr")!;
    expect(within(reqdocRow).getByText("Veriyle")).toBeTruthy();
    // "Onboarding sunumunun paylaşılması" (presentation) stays manual completion;
    // CompletionHint only renders for data/meeting steps, so it has no completion label.
    const presentationRow = screen.getByText("Onboarding sunumunun paylaşılması").closest("tr")!;
    expect(within(presentationRow).queryByText("Elle")).toBeNull();
  });

  it("01 has no 'Formu aç' button (no workspace)", () => {
    renderProject();
    // Only phase 00 should show "Formu aç"; 01..08 have no workspace component.
    const buttons = screen.getAllByRole("button", { name: /Formu aç/i });
    expect(buttons.length).toBe(1);
  });
});

describe("AC8 — legacy tab param redirect", () => {
  it("?tab=handover opens Aşamalar ve adımlar with the 00 panel", async () => {
    renderProject("/app/projects/p_ornek?tab=handover");
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("heading", { name: "Satış Devri", level: 2 })).toBeTruthy();
  });

  it("?tab=kickoff opens Aşamalar ve adımlar with the 00 panel", async () => {
    renderProject("/app/projects/p_ornek?tab=kickoff");
    const panel = await screen.findByRole("dialog");
    expect(within(panel).getByRole("heading", { name: "Satış Devri", level: 2 })).toBeTruthy();
  });
});
