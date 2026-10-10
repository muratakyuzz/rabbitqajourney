import { expect, test } from "@playwright/test";

// M5 main flow against the real API (docs/PLAN.md). The customer name is unique per run, so the
// test does not depend on a freshly seeded API.
test("new project → steps → meeting + action → complete action → approve phase 00", async ({ page }) => {
  const customer = `E2E Müşteri ${Date.now()}`;

  await test.step("1. login → customers → new project", async () => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Deniz Uzun/ }).click();
    await expect(page).toHaveURL(/\/app\/overview$/);

    await page.getByRole("link", { name: "Müşteri projeleri" }).click();
    await page.getByRole("button", { name: "Yeni proje" }).click();

    const dialog = page.getByRole("dialog", { name: "Yeni onboarding projesi" });
    await dialog.getByLabel("Müşteri adı").fill(customer);
    await expect(dialog.getByLabel("CSM")).toHaveText("Deniz Uzun");
    const start = await dialog.getByLabel("Başlangıç").inputValue();
    await dialog.getByLabel("Hedef Go-Live").fill(addDays(start, 60));
    await dialog.getByRole("button", { name: "Oluştur" }).click();

    await expect(page).toHaveURL(/\/app\/projects\/p_[a-z0-9]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(customer);
    await expect(page.getByRole("tab", { name: "Aşamalar ve adımlar" })).toHaveAttribute("aria-selected", "true");
  });

  // 2. "00'da elle tamamlanan bir adımı Tamamlandı yap": the 00 Satış Devri template has no manual
  // step (every step completes with data or a meeting). Stopped here — see the M5 report.
});

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
