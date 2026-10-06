import { useEffect, useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RqProvider, useRq } from "@/lib/rabbitqa/store";
import MyWork from "@/pages/MyWork";
import type { AuthUser } from "@/lib/auth-api";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let currentUser: AuthUser | null = { id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" };
vi.mock("@/lib/auth-context", () => ({ useAuth: () => ({ user: currentUser, token: "t", isLoading: false, login: vi.fn(), logout: vi.fn(), refreshMe: vi.fn() }) }));

function setUser(u: AuthUser | null) { currentUser = u; }

/** AC19 testinde kural tetikleyicisini çağırıp hemen MyWork'ü render eden yardımcı bileşen. */
function TriggerAndShow({ trigger }: { trigger: (ctx: ReturnType<typeof useRq>) => void }) {
  const ctx = useRq();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) { done.current = true; trigger(ctx); }
  }, [ctx, trigger]);
  return <MyWork />;
}

function renderMyWork() {
  return render(
    <MemoryRouter initialEntries={["/app/mywork"]}>
      <TooltipProvider>
        <RqProvider>
          <Routes>
            <Route path="/app/mywork" element={<MyWork />} />
          </Routes>
        </RqProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function renderMyWorkWithTrigger(trigger: (ctx: ReturnType<typeof useRq>) => void) {
  return render(
    <MemoryRouter initialEntries={["/app/mywork"]}>
      <TooltipProvider>
        <RqProvider>
          <Routes>
            <Route path="/app/mywork" element={<TriggerAndShow trigger={trigger} />} />
          </Routes>
        </RqProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setUser({ id: "u_deniz", role: "csm", name: "Deniz Uzun", email: "deniz.uzun@virgosol.com" });
});

describe("AC11 — Kilitli uyarlama adımı iş değildir (MyWork)", () => {
  it("p_garanti'nin kilitli adapt:* adımı u_deniz'in Bana atananlar listesinde yoktur", async () => {
    renderMyWork();
    await screen.findByText("Bana atananlar");
    expect(screen.queryByText("Uyarlama: Mobil Bankacılık")).toBeNull();
  });
});

describe("AC19 — RUL-05 aksiyonu CSM'in Bana atananlar listesinde görünür", () => {
  it("LLM gpu'ya geçiş, 03 done iken açılan rule_review aksiyonu u_deniz'e görünür", async () => {
    renderMyWorkWithTrigger((ctx) => {
      ctx.setInstallChoice("p_isyatirim", { llmChoice: "gpu" }, "AC19 testi — gpu'ya geçiş");
    });
    await screen.findByText("Bana atananlar");
    await vi.waitFor(() => {
      expect(screen.getAllByText(/Gözden geçir:/).length).toBeGreaterThan(0);
    });
  });
});
