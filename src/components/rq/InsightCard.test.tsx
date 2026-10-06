import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RqProvider } from "@/lib/rabbitqa/store";
import { createSeed, STATE_KEY } from "@/lib/rabbitqa/seed";
import { InsightCard } from "@/components/rq/InsightCard";
import type { AiInsight } from "@/lib/rabbitqa/types";
import type { AuthUser } from "@/lib/auth-api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const user: AuthUser = { id: "u_manager", role: "manager", name: "Örnek Manager", email: "manager@virgosol.com" };
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user, token: "t", isLoading: false, login: vi.fn(), logout: vi.fn(), refreshMe: vi.fn() }) }));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

function renderStepUpdateInsight() {
  const seeded = createSeed();
  const pid = "p_ornek";
  const manualStep = seeded.steps.find((s) => s.projectId === pid && s.completion === "manual" && s.status !== "done")!;
  const insight: AiInsight = {
    id: "ai_test_step_update", projectId: pid, source: "teams", kind: "step_update", status: "pending",
    createdAt: new Date().toISOString(), targetId: manualStep.id, current: { status: manualStep.status },
    sourceRef: { title: "t", from: "f", at: new Date().toISOString(), excerpt: "x", link: "#" },
    proposed: { status: "done" }, rationale: "test", confidence: 90,
    reviewedBy: null, reviewedAt: null, reviewNote: "", appliedEntityId: null,
  };
  localStorage.setItem(STATE_KEY, JSON.stringify({ ...seeded, insights: [...seeded.insights, insight] }));

  render(
    <MemoryRouter>
      <RqProvider>
        <InsightCard insight={insight} />
      </RqProvider>
    </MemoryRouter>,
  );
  return insight;
}

describe("InsightCard — ApproveDialog step_update status options (REV-13, AC4)", () => {
  it("does not offer 'Sırası gelmedi' as a status option, and keeps the other four", async () => {
    renderStepUpdateInsight();
    fireEvent.click(screen.getByRole("button", { name: "Düzenle ve onayla" }));
    const dialog = await screen.findByRole("dialog");
    const statusSection = within(dialog).getByText("Durum", { selector: "label" }).closest("div")!;
    fireEvent.click(within(statusSection).getByRole("combobox"));
    expect(screen.queryByRole("option", { name: "Sırası gelmedi" })).toBeNull();
    expect(screen.getByRole("option", { name: "Bekliyor" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Devam ediyor" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Tamamlandı" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Kapsam dışı" })).toBeTruthy();
  });
});
