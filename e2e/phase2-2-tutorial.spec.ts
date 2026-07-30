import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "lumi-island-save-v1";

async function seedTutorial(
  page: Page,
  values: Record<string, unknown>,
): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ({ key, seed }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          tutorialStep: 1,
          tutorialProgress: { step: 1, walkedDistance: 3 },
          easyMode: false,
          ...seed,
        }),
      );
    },
    { key: SAVE_KEY, seed: values },
  );
  await page.reload();
  await page.getByRole("button", { name: /つづきから/ }).click();
  await expect(page.locator("canvas.game-canvas")).toBeVisible();
}

test.describe.serial("Lumi Island Phase 2.2 tutorial and child HUD", () => {
  test("shows one readable goal and hides desktop-only clutter", async ({
    page,
  }) => {
    await seedTutorial(page, {
      tutorialStep: 0,
      tutorialProgress: { step: 0, walkedDistance: 0 },
    });

    const coach = page.getByTestId("tutorial-coach");
    await expect(coach).toBeVisible();
    await expect(coach).toContainText("矢印で すこし歩こう");
    await expect(coach).not.toContainText("3m");
    await expect(page.locator(".quest-ribbon")).toHaveCount(0);
    await expect(page.locator(".touch-controls")).toBeHidden();

    const sizes = await page.evaluate(() => {
      const goal = document.querySelector(".tutorial-coach h2");
      const button = document.querySelector(".tutorial-coach button");
      return {
        goal: goal ? parseFloat(getComputedStyle(goal).fontSize) : 0,
        button: button ? parseFloat(getComputedStyle(button).fontSize) : 0,
      };
    });
    expect(sizes.goal).toBeGreaterThanOrEqual(18);
    expect(sizes.button).toBeGreaterThanOrEqual(16);
  });

  test("hides for this session, resumes from menu, and confirms quitting", async ({
    page,
  }) => {
    await seedTutorial(page, {
      tutorialStep: 0,
      tutorialProgress: { step: 0, walkedDistance: 0 },
    });
    const coach = page.getByTestId("tutorial-coach");
    await expect(coach).toBeVisible();
    await coach.getByRole("button", { name: "いったん隠す" }).click();
    await expect(coach).toHaveCount(0);

    await page.getByRole("button", { name: "メニュー", exact: true }).click();
    await page
      .getByRole("button", { name: /チュートリアルを再開/ })
      .click();
    await expect(page.getByTestId("tutorial-coach")).toBeVisible();

    await page
      .getByTestId("tutorial-coach")
      .getByRole("button", { name: "チュートリアルをやめる" })
      .click();
    await expect(page.getByRole("alert")).toContainText("ほんとうに やめる");
    await page
      .getByRole("alert")
      .getByRole("button", { name: "やめる", exact: true })
      .click();
    await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);
    await expect(page.locator(".quest-ribbon")).toBeVisible();
  });

  test("does not advance near the wrong resource", async ({ page }) => {
    await seedTutorial(page, {
      playerPosition: { x: -5.3, z: 6.15 },
    });
    const coach = page.getByTestId("tutorial-coach");
    await expect(coach).toContainText("金色に光る 木");
    await page.waitForTimeout(1_000);
    await expect(coach.locator(".tutorial-coach__step")).toContainText("2/7");
  });

  test("easy mode changes copy, key hints, size, and the world guide", async ({
    page,
  }) => {
    await seedTutorial(page, {
      easyMode: true,
      playerPosition: { x: 0, z: 6 },
    });
    const coach = page.getByTestId("tutorial-coach");
    await expect(coach).toContainText("きんいろに ひかる 木へ いこう");
    await expect(coach.locator("kbd")).toHaveCount(0);
    await expect(page.locator("canvas.game-canvas")).toHaveAttribute(
      "data-debug-tutorial-guide",
      "wood-cedar-09",
    );
    const goalSize = await coach.locator("h2").evaluate((element) =>
      parseFloat(getComputedStyle(element).fontSize),
    );
    expect(goalSize).toBeGreaterThanOrEqual(20);
  });
});
