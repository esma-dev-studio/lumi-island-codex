import { expect, test, type Locator, type Page } from "@playwright/test";

type Direction = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
const DIRECTIONS: Direction[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

async function position(canvas: Locator): Promise<{ x: number; z: number }> {
  const raw = await canvas.getAttribute("data-debug-player-position");
  if (!raw) throw new Error("player debug position is not ready");
  const [x, z] = raw.split(",").map(Number);
  return { x, z };
}

async function walk(page: Page, key: Direction, milliseconds: number) {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
  await page.waitForTimeout(60);
}

const WORLD_DIRECTION: Record<Direction, { x: number; z: number }> = {
  ArrowUp: { x: -1, z: 1 },
  ArrowDown: { x: 1, z: -1 },
  ArrowLeft: { x: -1, z: -1 },
  ArrowRight: { x: 1, z: 1 },
};

async function walkTo(
  page: Page,
  target: { x: number; z: number },
  stopDistance = 1.75,
) {
  const canvas = page.locator("canvas.game-canvas");
  await canvas.click();
  for (let attempt = 0; attempt < 56; attempt += 1) {
    const before = await position(canvas);
    const dx = target.x - before.x;
    const dz = target.z - before.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= stopDistance) return;
    const ranked = DIRECTIONS
      .map((key) => ({ key, score: WORLD_DIRECTION[key].x * dx + WORLD_DIRECTION[key].z * dz }))
      .sort((a, b) => b.score - a.score);
    let moved = false;
    for (const candidate of ranked) {
      await walk(page, candidate.key, 320);
      const after = await position(canvas);
      if (Math.hypot(after.x - before.x, after.z - before.z) > 0.03) {
        moved = true;
        break;
      }
    }
    if (!moved) {
      const stopped = await position(canvas);
      if (Math.hypot(target.x - stopped.x, target.z - stopped.z) <= stopDistance + 0.5) return;
      throw new Error(`all walking directions blocked at ${stopped.x},${stopped.z}`);
    }
  }
  const final = await position(canvas);
  throw new Error(`could not reach target; stopped at ${final.x},${final.z}`);
}
async function startFreshGame(page: Page, canvas: Locator) {
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
function browserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

test("fresh save completes the real tutorial, opens an upgrade, and reloads it", async ({
  page,
}) => {
  test.setTimeout(300_000);
  const errors = browserErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /LUMI/ })).toBeVisible();
  await page.screenshot({ path: "screenshots/phase2-3-fresh-start.png", fullPage: true });

  const canvas = page.locator("canvas.game-canvas");
  await startFreshGame(page, canvas);
  await canvas.click();

  await walkTo(page, { x: -7.7, z: 7.6 }, 2.2);
  const coach = page.getByTestId("tutorial-coach");
  await expect(coach).toContainText("えだを集めよう", { timeout: 15_000 });
  await expect(page.locator(".interaction-hint")).toContainText("えだを集める");
  await page.keyboard.press("KeyE");

  const wood = page.getByTestId("activity-wood");
  await expect(wood).toBeVisible();
  const hit = wood.locator("[data-activity-primary]");
  await hit.click();
  await hit.click();
  await hit.click();
  await wood.locator("[data-activity-confirm]").click();
  await expect(wood).toHaveCount(0);
  await expect(canvas).toHaveAttribute("data-debug-action-state", "free", { timeout: 15_000 });

  await page.keyboard.press("KeyI");
  await expect(coach).toContainText("小えだのいすを つくろう");
  await page.keyboard.press("KeyC");
  const stoolRecipe = page.locator(".recipe-list article").filter({ hasText: "小えだのいす" });
  await stoolRecipe.getByRole("button", { name: /つくる/ }).click();
  await expect(coach).toContainText("小えだのいすを おこう");

  await page.keyboard.press("KeyI");
  await page.locator(".furniture-list article").filter({ hasText: "小えだのいす" })
    .getByRole("button", { name: "場所をえらぶ" }).click();
  const confirm = page.locator(".placement-confirm");
  for (const key of DIRECTIONS) {
    if (await confirm.isEnabled()) break;
    await walk(page, key, 650);
  }
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(coach).toContainText("ノラに はなしかけよう");

  await walk(page, "ArrowDown", 1_400);
  const npcPositions = await canvas.getAttribute("data-debug-npc-positions");
  const nollaMatch = npcPositions?.match(/ノラ:([\d.-]+),([\d.-]+)/);
  if (!nollaMatch) throw new Error(`Nolla position missing: ${npcPositions}`);
  await walkTo(page, { x: Number(nollaMatch[1]), z: Number(nollaMatch[2]) }, 1.05);
  await expect(canvas).toHaveAttribute("data-debug-closest-target", "ノラ", { timeout: 12_000 });
  await canvas.click();
  await page.keyboard.press("KeyE");
  await expect(page.locator(".resident-dialog")).toBeVisible({ timeout: 12_000 });
  await page.getByRole("button", { name: "またね" }).click();
  await expect(coach).toHaveCount(0);

  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await expect(page.getByRole("heading", { name: "なにを する？" })).toBeVisible();
  await page.screenshot({ path: "screenshots/phase2-3-child-menu.png", fullPage: true });
  await page.getByRole("button", { name: /島づくり/ }).click();
  await expect(page.getByRole("heading", { name: "島づくり" })).toBeVisible();
  await page.getByRole("button", { name: "12 L" }).click();
  await expect(page.locator(".unlock-card--grove")).toContainText("1/3");
  await page.screenshot({ path: "screenshots/phase2-3-grove-unlock.png", fullPage: true });

  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(canvas).toHaveAttribute("data-debug-grove-repairs", "1");
  await expect(canvas).toHaveAttribute("data-debug-available-resources", /berry-restored-grove-01/);
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /せってい/ }).click();
  await page.getByRole("button", { name: /いま セーブする/ }).click();

  await page.reload();
  await page.getByRole("button", { name: /つづきから/ }).evaluate((button) => {
    window.setTimeout(() => (button as HTMLButtonElement).click(), 0);
  });
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /島づくり/ }).click();
  await expect(page.locator(".unlock-card--grove")).toContainText("1/3");
  await expect(page.locator(".menu-status")).toContainText("8");
  await page.screenshot({ path: "screenshots/phase2-3-reload.png", fullPage: true });
  expect(errors).toEqual([]);
});
