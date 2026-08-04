import { expect, test } from "@playwright/test";

test("keeps Nolla visible and explains the upgraded light marker", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: /あたらしく始める/ }).click();

  const canvas = page.locator("canvas.game-canvas");
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await expect(canvas).toHaveAttribute("data-resident-wayfinding", "3/3");
  await expect(canvas).toHaveAttribute(
    "data-tutorial-guide-visual",
    "gold-ring-light-column",
  );
  await expect(canvas).toHaveAttribute(
    "data-resident-avatar-nolla",
    /production-glb|visible-fallback/,
    { timeout: 30_000 },
  );


  const seededGuideStep = await page.evaluate(() => {
    const raw = localStorage.getItem("lumi-island-save-v1");
    if (!raw) return false;
    const saved = JSON.parse(raw);
    saved.tutorialStep = 1;
    saved.tutorialProgress = { step: 1, walkedDistance: 3 };
    localStorage.setItem("lumi-island-save-v1", JSON.stringify(saved));
    return true;
  });
  expect(seededGuideStep).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: /つづきから/ }).click();
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  const guideExplanation = page.getByText(
    "金色の輪と 光の柱が『光のしるし』",
  );
  await expect(guideExplanation).toBeVisible({ timeout: 15_000 });

  expect(errors).toEqual([]);
});