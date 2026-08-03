import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "lumi-island-save-v1";

async function seedGame(
  page: Page,
  values: Record<string, unknown>,
): Promise<void> {
  await page.goto("/");
  await page.evaluate(
    ({ key, values: seed }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          tutorialStep: 7,
          tutorialProgress: { step: 7, walkedDistance: 3 },
          easyMode: true,
          ...seed,
        }),
      );
    },
    { key: SAVE_KEY, values },
  );
  await page.reload();
  await page.getByRole("button", { name: /つづきから/ }).evaluate((button) => {
    window.setTimeout(() => (button as HTMLButtonElement).click(), 0);
  });
  await expect(page.locator("canvas.game-canvas")).toBeVisible();
  await page.locator("canvas.game-canvas").click();
  await page.waitForTimeout(500);
}

function watchBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test.describe.serial("Lumi Island Phase 2.2 input and action lock", () => {
  test("wood is keyboard-only, traps focus, locks movement, and restores canvas focus", async ({
    page,
  }) => {
    const errors = watchBrowserErrors(page);
    await seedGame(page, { playerPosition: { x: -9.3, z: -7 } });

    await page.keyboard.press("KeyE");
    const wood = page.getByTestId("activity-wood");
    await expect(wood).toBeVisible();
    const action = wood.locator("[data-activity-primary]");
    await expect(action).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(wood.locator(".activity-close")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(action).toBeFocused();

    const canvas = page.locator("canvas.game-canvas");
    await expect(canvas).toHaveAttribute("data-debug-paused", "true");
    const before = await canvas.getAttribute("data-debug-player-position");
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(420);
    const during = await canvas.getAttribute("data-debug-player-position");
    await page.keyboard.up("ArrowRight");
    expect(during).toBe(before);

    await page.keyboard.press("KeyE");
    await page.keyboard.press("Space");
    await page.keyboard.press("KeyE");
    await expect(wood.locator(".wood-hit-count span[class^='is-']")).toHaveCount(
      3,
    );

    await page.keyboard.press("Enter");
    await expect(wood).toHaveCount(0);
    await expect(canvas).toBeFocused();
    await expect(canvas).toHaveAttribute("data-debug-paused", "false");
    await expect(canvas).toHaveAttribute("data-debug-action-state", "free", {
      timeout: 5_000,
    });
    expect(errors).toEqual([]);
  });

  test("Escape cancels an activity without opening the menu", async ({ page }) => {
    await seedGame(page, { playerPosition: { x: -9.3, z: -7 } });
    await page.keyboard.press("KeyE");
    await expect(page.getByTestId("activity-wood")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("activity-wood")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "ひと休み" })).toHaveCount(
      0,
    );
    await expect(page.locator("canvas.game-canvas")).toBeFocused();
  });

  test("stone can be selected and confirmed without a mouse", async ({
    page,
  }) => {
    await seedGame(page, { playerPosition: { x: -5.3, z: 6.15 } });
    await page.keyboard.press("KeyE");
    const stone = page.getByTestId("activity-stone");
    await expect(stone).toBeVisible();
    const choices = stone.locator("[data-activity-choice]");
    await expect(choices.first()).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(choices.nth(1)).toBeFocused();
    await expect(choices.nth(1)).toHaveClass(/is-selected/);
    await page.keyboard.press("Enter");
    await expect(stone.locator("[data-activity-confirm]")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(stone).toHaveCount(0);
  });

  test("fishing supports arrows, E, Space, and Enter without mouse input", async ({
    page,
  }) => {
    await seedGame(page, { playerPosition: { x: -9.6, z: 1.2 } });
    await page.keyboard.press("KeyE");
    const fishing = page.getByTestId("activity-fishing");
    await expect(fishing).toBeVisible();
    const selected = fishing.locator("[data-activity-choice].is-selected");
    await expect(selected).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("KeyE");

    const pull = fishing.locator("[data-activity-primary]");
    await expect(pull).toBeEnabled({ timeout: 8_000 });
    await page.keyboard.press("Space");
    await page.keyboard.press("Space");
    await expect(fishing.locator("[data-activity-confirm]")).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(fishing).toHaveCount(0);
  });

  test("footsteps are requested while moving and stop when movement stops", async ({
    page,
  }) => {
    await seedGame(page, { playerPosition: { x: 0, z: 6 } });
    const canvas = page.locator("canvas.game-canvas");
    await page.keyboard.down("ArrowRight");
    await expect
      .poll(async () => Number((await canvas.getAttribute("data-debug-footstep-count")) ?? "0"))
      .toBeGreaterThan(0);
    await page.keyboard.up("ArrowRight");
    await page.waitForTimeout(120);
    const stoppedCount = await canvas.getAttribute("data-debug-footstep-count");
    await page.waitForTimeout(500);
    await expect(canvas).toHaveAttribute(
      "data-debug-footstep-count",
      stoppedCount ?? "0",
    );
    });

  test("spends earned lumen on real island upgrades, then saves the result", async ({
    page,
  }) => {
    await seedGame(page, { lumen: 60, groveRepairs: 0 });
    await page.getByRole("button", { name: "メニュー", exact: true }).click();
    await page.getByRole("button", { name: /島づくり/ }).click();
    const shop = page.locator(".unlock-shop-grid");
    await expect(shop).toBeVisible();

    await shop.getByRole("button", { name: /24 Lで ひらく/ }).click();
    await expect(page.locator(".menu-status")).toContainText("36");

    await shop.getByRole("button", { name: /18 Lで ひらく/ }).click();
    await page.getByRole("button", { name: "もうすこし" }).click();
    await expect(shop).toContainText("1/3");
    await expect(page.locator(".menu-status")).toContainText("18");

    await page.getByRole("button", { name: "閉じる" }).click();
    await page.getByRole("button", { name: "メニュー", exact: true }).click();
    await page.getByRole("button", { name: /せってい/ }).click();
    await page.getByRole("button", { name: /いま セーブする/ }).click();
    await page.reload();
    await page.getByRole("button", { name: /つづきから/ }).evaluate((button) => {
    window.setTimeout(() => (button as HTMLButtonElement).click(), 0);
  });
    await page.getByRole("button", { name: "メニュー", exact: true }).click();
    await page.getByRole("button", { name: /島づくり/ }).click();
    await page.getByRole("button", { name: "もうすこし" }).click();
    await expect(page.locator(".unlock-shop-grid")).toContainText("1/3");
    await expect(page.locator(".menu-status")).toContainText("18");
  });
});