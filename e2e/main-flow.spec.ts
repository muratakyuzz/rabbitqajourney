import { expect, test, type Locator, type Page } from "@playwright/test";

// M5 main flow against the real API (docs/PLAN.md). Everything goes through the UI, no direct API calls.
// The customer name is unique per run, so the test does not depend on a freshly seeded API.
test("new project → 00 data steps → meeting + action → complete action → approve 00 → manual step in 01", async ({ page }) => {
  const customer = `E2E Müşteri ${Date.now()}`;
  const actionTitle = `E2E aksiyon ${Date.now()}`;

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
    await expectStepDone(page, "CSM ataması");
  });

  await test.step("2. 00 data steps from the Satış Devri workspace", async () => {
    await phaseRegion(page, "Satış Devri").getByRole("button", { name: "Formu aç" }).click();
    const sheet = page.getByRole("dialog", { name: "Satış Devri" });

    await sheet.getByLabel("Devir alınan satışçı").click();
    await page.getByRole("option", { name: "Örnek Satışçı 1" }).click();
    await sheet.getByLabel("Lisans modeli").fill("Yıllık abonelik");
    await sheet.getByLabel("Lisans modeli").blur();
    await expectStepDone(page, "Satışçı ve lisans modelinin girilmesi");

    await sheet.getByRole("checkbox", { name: "TestPilot" }).click();
    await expectStepDone(page, "Satın alınan modüllerin girilmesi");

    await sheet.getByRole("checkbox", { name: "Taahhüt yok" }).click();
    await expectStepDone(page, "Taahhütlerin girilmesi");

    await sheet.getByRole("radio", { name: "SaaS" }).click();
    await sheet.getByRole("radio", { name: "RabbitQA'nın sağladığı LLM" }).click();
    await expectStepDone(page, "Kurulum tipi ve LLM tercihinin girilmesi");

    await uploadDocument(page, sheet.locator('[data-field="doc:offer"]'), "teklif.pdf");
    await expectStepDone(page, "Teklif dokümanının yüklenmesi");
    await uploadDocument(page, sheet.locator('[data-field="doc:contract"]'), "sozlesme.pdf");
    await expectStepDone(page, "Müşteri sözleşmesinin yüklenmesi");

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  await test.step("3. meeting from the Satış devri toplantısı step, with one action", async () => {
    await stepRow(page, "Satış devri toplantısı").getByRole("button", { name: "Satış devri toplantısı" }).click();
    const dialog = page.getByRole("dialog", { name: "Toplantı kaydet" });
    await expect(dialog.getByLabel("Durum")).toHaveText("Yapıldı");
    await expect(dialog.getByRole("checkbox", { name: "Deniz Uzun" })).toBeChecked();
    await dialog.getByRole("button", { name: "Aksiyon", exact: true }).click();
    await dialog.getByLabel("Başlık").fill(actionTitle);
    await dialog.getByRole("button", { name: "Kaydet" }).click();
    await expect(dialog).toBeHidden();
    await expectStepDone(page, "Satış devri toplantısı");
  });

  await test.step("4. Aksiyonlar tab: the action is listed and completed from its row", async () => {
    await page.getByRole("tab", { name: "Aksiyonlar" }).click();
    const done = page.getByRole("checkbox", { name: `Tamamlandı: ${actionTitle}` });
    await expect(done).not.toBeChecked();
    await done.click();
    await page.getByRole("button", { name: /^Tamamlanan/ }).click();
    await expect(page.getByRole("checkbox", { name: `Tamamlandı: ${actionTitle}` })).toBeChecked();
  });

  await test.step("5. approve 00 with Aşamayı tamamla; after a reload the data comes from the API", async () => {
    await page.getByRole("tab", { name: "Aşamalar ve adımlar" }).click();
    await phaseRegion(page, "Satış Devri").getByRole("button", { name: "Aşamayı tamamla" }).click();
    await expect(phaseTrigger(page, "Satış Devri")).toContainText("Tamamlandı");
    // Faz 1: no auth on the API, the approver is the seed Admin (docs/PLAN.md → Yetki)
    await expect(phaseRegion(page, "Satış Devri")).toContainText("Onaylayan: Örnek Administrator");

    await page.reload();
    await expect(phaseTrigger(page, "Satış Devri")).toContainText("Tamamlandı");
    await page.getByRole("tab", { name: "Aksiyonlar" }).click();
    await page.getByRole("button", { name: /^Tamamlanan/ }).click();
    await expect(page.getByRole("checkbox", { name: `Tamamlandı: ${actionTitle}` })).toBeChecked();
    await page.getByRole("tab", { name: "Toplantılar" }).click();
    await expect(page.getByRole("tabpanel", { name: "Toplantılar" })).toContainText("Satış devri");
  });

  await test.step("6. 01: Onboarding sunumunun paylaşılması marked done by hand in the step dialog", async () => {
    await page.getByRole("tab", { name: "Aşamalar ve adımlar" }).click();
    const title = "Onboarding sunumunun paylaşılması";
    await stepRow(page, title).getByRole("button", { name: title }).click();
    const dialog = page.getByRole("dialog", { name: title });
    await dialog.getByLabel("Durum").click();
    await page.getByRole("option", { name: "Tamamlandı" }).click();
    await dialog.getByRole("button", { name: "Kaydet" }).click();
    await expect(dialog).toBeHidden();
    await expectStepDone(page, title);

    await page.reload();
    await expectStepDone(page, title);
  });
});

function phaseTrigger(page: Page, name: string): Locator {
  return page.getByRole("button", { name: new RegExp(`^\\d\\d\\s*${name}`) });
}

function phaseRegion(page: Page, name: string): Locator {
  return page.getByRole("region", { name: new RegExp(`^\\d\\d\\s*${name}`) });
}

/** A row of the phases table, found by its step title button. */
function stepRow(page: Page, title: string): Locator {
  return page.getByRole("row").filter({ has: page.getByRole("button", { name: title, exact: true }) });
}

async function expectStepDone(page: Page, title: string): Promise<void> {
  await expect(stepRow(page, title).getByRole("cell").nth(7)).toContainText("Tamamlandı");
}

async function uploadDocument(page: Page, card: Locator, fileName: string): Promise<void> {
  await card.getByRole("button", { name: "Yükle" }).click();
  const dialog = page.getByRole("dialog", { name: "Doküman ekle" });
  await dialog.getByLabel("Dosya").setInputFiles({ name: fileName, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
  await dialog.getByRole("button", { name: "Kaydet" }).click();
  await expect(dialog).toBeHidden();
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
