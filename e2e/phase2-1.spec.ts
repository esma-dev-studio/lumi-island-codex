import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "lumi-island-save-v1";

type SaveSeed = Record<string, unknown> & {
  playerPosition?: { x: number; z: number };
};

async function clearSave(page: Page) {
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload();
}

async function seedSave(page: Page, overrides: SaveSeed) {
  await page.goto("/");
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          tutorialStep: 7,
          tutorialProgress: { step: 7, walkedDistance: 3 },
          ...value,
        }),
      );
    },
    { key: SAVE_KEY, value: overrides },
  );
  await page.reload();
  await page.getByRole("button", { name: /つづきから/ }).evaluate((button) => {
    window.setTimeout(() => (button as HTMLButtonElement).click(), 0);
  });
  await expect(page.locator("canvas.game-canvas")).toBeVisible({
    timeout: 45_000,
  });
}

async function startNewGame(page: Page) {
  const canvas = page.locator("canvas.game-canvas");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const start = page.getByRole("button", { name: /あたらしく始める/ });
    await expect(start).toBeVisible();
    await start.evaluate((button) => {
      window.setTimeout(() => (button as HTMLButtonElement).click(), 0);
    });
    try {
      await canvas.waitFor({ state: "visible", timeout: 30_000 });
      return;
    } catch {
      if (attempt === 1) throw new Error("game canvas did not load after Vite warm-up retry");
      await expect(start).toBeVisible({ timeout: 15_000 });
    }
  }
}
function monitorErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

async function openMenu(page: Page) {
  await page.getByRole("button", { name: "メニュー" }).click();
  await expect(page.getByRole("heading", { name: "なにを する？" })).toBeVisible();
}

async function openSettings(page: Page) {
  await openMenu(page);
  await page.getByRole("button", { name: /せってい/ }).click();
  await expect(page.getByRole("heading", { name: "せってい" })).toBeVisible();
}
async function interactWithNearbyTarget(page: Page) {
  const canvas = page.locator("canvas.game-canvas");
  await canvas.click();
  await page.keyboard.press("KeyE");
}

test.describe.serial("Lumi Island Phase 2.1", () => {
  test("title, real-action tutorial, easy mode, pause, save and reload", async ({
    page,
  }) => {
    const errors = monitorErrors(page);
    await clearSave(page);

    await expect(page.getByRole("heading", { name: /LUMI/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /あたらしく始める/ }),
    ).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase2-1-title.png",
      fullPage: true,
    });

    await startNewGame(page);
    await expect(page.locator("canvas.game-canvas")).toBeVisible();
    const tutorial = page.getByTestId("tutorial-coach");
    await expect(tutorial).toContainText("やじるしで すこし あるこう");
    await page.screenshot({
      path: "screenshots/phase2-1-tutorial-walk.png",
      fullPage: true,
    });

    await page.locator("canvas.game-canvas").click();
    await page.waitForTimeout(700);
    await page.keyboard.down("Shift");
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(6_000);
    await page.keyboard.up("ArrowDown");
    await page.keyboard.up("Shift");
    await expect(tutorial).toContainText("きんいろに ひかる");
    await page.screenshot({
      path: "screenshots/phase2-1-tutorial-gather.png",
      fullPage: true,
    });

    await page.screenshot({
      path: "screenshots/phase2-1-normal-mode.png",
      fullPage: true,
    });
    await openSettings(page);
    const canvasClock = page.locator("canvas.game-canvas");
    await expect(canvasClock).toHaveAttribute("data-debug-paused", "true");
    const pausedTime = await canvasClock.getAttribute("data-debug-game-elapsed-time");
    await page.waitForTimeout(1_300);
    await expect(canvasClock).toHaveAttribute(
      "data-debug-game-elapsed-time",
      pausedTime ?? "",
    );

    await expect(page.locator("main.game-screen")).toHaveClass(/is-easy/);
    await page.getByRole("button", { name: /やさしい表示 ON/ }).click();
    await expect(page.locator("main.game-screen")).not.toHaveClass(/is-easy/);
    await expect(
      page.getByRole("button", { name: /やさしい表示 OFF/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: /やさしい表示 OFF/ }).click();
    await expect(page.locator("main.game-screen")).toHaveClass(/is-easy/);
    await expect(
      page.getByRole("button", { name: /やさしい表示 ON/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();
    await expect(page.locator(".game-tools kbd")).toHaveCount(0);
    await page.screenshot({
      path: "screenshots/phase2-1-easy-mode.png",
      fullPage: true,
    });

    await openSettings(page);
    await page.getByRole("button", { name: /いま セーブする/ }).click();
    await page.reload();
    await expect(
      page.getByRole("button", { name: /つづきから/ }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("wood gathering depletes the same tree and restores that state", async ({
    page,
  }) => {
    const errors = monitorErrors(page);
    await seedSave(page, {
      easyMode: true,
      playerPosition: { x: -9.3, z: -7 },
      tutorialStep: 2,
      tutorialProgress: { step: 2, walkedDistance: 3.2 },
    });

    await expect(page.locator(".interaction-hint")).toContainText("えだを集める");
    await page.screenshot({
      path: "screenshots/phase2-1-wood-before.png",
      fullPage: true,
    });
    await interactWithNearbyTarget(page);
    const woodGame = page.getByTestId("activity-wood");
    await expect(woodGame).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase2-1-wood-game.png",
      fullPage: true,
    });

    const hit = page.getByRole("button", { name: /たたく/ });
    await hit.click();
    await hit.click();
    await hit.click();
    await page.getByRole("button", { name: "バッグに いれる" }).click();
    await expect(page.getByRole("status")).toContainText("木のえだ");
    await page.waitForTimeout(900);
    await expect(page.getByTestId("activity-wood")).toHaveCount(0);
    await expect(page.locator(".interaction-hint")).toHaveCount(0);
    await expect(page.locator("canvas.game-canvas")).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase2-1-wood-after.png",
      fullPage: true,
    });

    await openSettings(page);
    await page.getByRole("button", { name: /いま セーブする/ }).click();
    const saved = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, SAVE_KEY);
    expect(saved.resourceStates["wood-cedar-02"].state).toBe("depleted");
    expect(
      saved.resourceStates["wood-cedar-02"].recoverAt - saved.playSeconds,
    ).toBeGreaterThan(100);
    expect(saved.inventory.wood).toBeGreaterThanOrEqual(1);

    await page.reload();
    await page.getByRole("button", { name: /つづきから/ }).evaluate((button) => {
    window.setTimeout(() => (button as HTMLButtonElement).click(), 0);
  });
    await expect(page.locator("canvas.game-canvas")).toBeVisible();
    await page.waitForTimeout(650);
    await expect(page.locator("canvas.game-canvas")).not.toHaveAttribute(
      "data-debug-available-resources",
      /wood-cedar-02/,
    );
    await expect(page.locator(".interaction-hint")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("rock and foraging use different UI and discoveries auto-register", async ({
    page,
  }) => {
    const errors = monitorErrors(page);
    await seedSave(page, {
      easyMode: true,
      playerPosition: { x: -5.3, z: 6.15 },
    });
    await interactWithNearbyTarget(page);
    const rockGame = page.getByTestId("activity-stone");
    await expect(rockGame).toContainText("3つの ひび");
    await expect(rockGame.locator(".timing-track")).toHaveCount(0);
    await page.screenshot({
      path: "screenshots/phase2-1-rock-game.png",
      fullPage: true,
    });
    await rockGame.locator(".rock-cracks button").first().click();
    await page.getByRole("button", { name: "バッグに いれる" }).click();
    await expect(page.getByRole("status")).toContainText("石");

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("button", { name: /せってい/ }).click();
    await page.getByRole("button", { name: /タイトルへ もどる/ }).click();
    await seedSave(page, {
      easyMode: true,
      playerPosition: { x: -6.2, z: 1.6 },
    });
    await interactWithNearbyTarget(page);
    const forageGame = page.getByTestId("activity-forage");
    await expect(forageGame).toContainText("見つけた");
    await page.screenshot({
      path: "screenshots/phase2-1-foraging.png",
      fullPage: true,
    });
    const discoveryName =
      (await forageGame.locator(".discovery-copy h3").textContent()) ?? "";
    await page.getByRole("button", { name: "そっと ひろう" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.waitForTimeout(800);

    await page.getByRole("button", { name: "ずかんを見る" }).click();
    const collection = page.getByTestId("collection-panel");
    await expect(collection).toBeVisible();
    await expect(collection).toContainText(discoveryName.trim());
    await expect(collection).toContainText("%");
    await expect(collection.locator(".collection-thumbnail").first()).toBeVisible();
    await page.screenshot({
      path: "screenshots/phase2-1-collection.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });

  test("fishing includes aim, bite, reel, catch, and collection registration", async ({
    page,
  }) => {
    const errors = monitorErrors(page);
    await seedSave(page, {
      easyMode: true,
      playerPosition: { x: -9.6, z: 1.2 },
    });
    await interactWithNearbyTarget(page);
    const fishing = page.getByTestId("activity-fishing");
    await expect(fishing).toContainText("魚の かげ");
    await fishing.locator(".fish-shadows .has-shadow").click();

    const pull = page.getByRole("button", { name: /ひく/ });
    await expect(pull).toBeEnabled({ timeout: 8_000 });
    await expect(fishing).toContainText("いま！");
    await page.screenshot({
      path: "screenshots/phase2-1-fishing-bite.png",
      fullPage: true,
    });
    const retry = page.getByRole("button", { name: "もういちど" });
    if (await retry.isVisible()) {
      await retry.click();
      await fishing.locator(".fish-shadows .has-shadow").click();
      await expect(pull).toBeEnabled({ timeout: 8_000 });
    }

    await pull.click();
    await pull.click();
    await expect(fishing).toContainText("つれた！");
    await page.screenshot({
      path: "screenshots/phase2-1-fishing-catch.png",
      fullPage: true,
    });
    const fishName =
      (await fishing.locator(".discovery-copy h3").textContent()) ?? "";
    await page.getByRole("button", { name: "つづける" }).click();
    await expect(page.getByRole("status")).toBeVisible();
    await page.getByRole("button", { name: "ずかんを見る" }).click();
    await expect(page.getByTestId("collection-panel")).toContainText(
      fishName.trim(),
    );
    expect(errors).toEqual([]);
  });

  test("development showcase captures all required character inspection views", async ({
    page,
  }) => {
    const errors = monitorErrors(page);
    await page.goto("/?debug");
    await page
      .getByRole("button", { name: /キャラクター確認（開発用）/ })
      .click();
    await expect(page.locator(".model-status")).toHaveCount(0, {
      timeout: 20_000,
    });

    await page.getByRole("button", { name: "正面", exact: true }).click();
    await page.screenshot({
      path: "screenshots/phase2-1-player-front.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "横", exact: true }).click();
    await page.screenshot({
      path: "screenshots/phase2-1-player-side.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "うしろ", exact: true }).click();
    await page.screenshot({
      path: "screenshots/phase2-1-player-back.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "ななめ45°" }).click();
    await page.getByRole("button", { name: "拾う", exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: "screenshots/phase2-1-player-joint-bend.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "夜", exact: true }).click();
    await page.screenshot({
      path: "screenshots/phase2-1-player-night.png",
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
});
