import { expect, test, type Locator, type Page } from "@playwright/test";

type Direction = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
const DIRECTIONS: Direction[] = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
const WORLD_DIRECTION: Record<Direction, { x: number; z: number }> = {
  ArrowUp: { x: -1, z: 1 },
  ArrowDown: { x: 1, z: -1 },
  ArrowLeft: { x: -1, z: -1 },
  ArrowRight: { x: 1, z: 1 },
};

async function position(canvas: Locator): Promise<{ x: number; z: number }> {
  const raw = await canvas.getAttribute("data-debug-player-position");
  if (!raw) throw new Error("player position is not ready");
  const [x, z] = raw.split(",").map(Number);
  return { x, z };
}

async function walk(page: Page, key: Direction, milliseconds: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
  await page.waitForTimeout(80);
}

async function walkTo(
  page: Page,
  target: { x: number; z: number },
  stopDistance = 1.7,
): Promise<void> {
  const canvas = page.locator("canvas.game-canvas");
  await canvas.click();
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const before = await position(canvas);
    const dx = target.x - before.x;
    const dz = target.z - before.z;
    if (Math.hypot(dx, dz) <= stopDistance) return;
    const ranked = DIRECTIONS
      .map((key) => ({
        key,
        score: WORLD_DIRECTION[key].x * dx + WORLD_DIRECTION[key].z * dz,
      }))
      .sort((a, b) => b.score - a.score);
    let moved = false;
    for (const candidate of ranked) {
      await walk(page, candidate.key, 420);
      const after = await position(canvas);
      if (Math.hypot(after.x - before.x, after.z - before.z) > 0.03) {
        moved = true;
        break;
      }
    }
    if (!moved) throw new Error(`normal walking was blocked at ${before.x},${before.z}`);
  }
  throw new Error("normal walking did not reach the visible goal");
}

async function enterFreshGame(page: Page): Promise<Locator> {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const canvas = page.locator("canvas.game-canvas");
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const start = page.getByRole("button", { name: /あたらしく始める/ });
    await expect(start).toBeVisible();
    await start.evaluate((button) => {
      window.setTimeout(() => (button as HTMLButtonElement).click(), 0);
    });
    try {
      await canvas.waitFor({ state: "visible", timeout: 45_000 });
      break;
    } catch {
      if (attempt === 1) throw new Error("game did not start after warm-up retry");
    }
  }
  return canvas;
}

test("normal speed: a child can gather, craft, place, talk, unlock, and save", async ({
  page,
}) => {
  test.setTimeout(360_000);
  const startedAt = Date.now();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const canvas = await enterFreshGame(page);
  expect(new URL(page.url()).searchParams.has("e2e")).toBe(false);
  await expect(canvas).toHaveAttribute("data-player-avatar", "production-glb", {
    timeout: 90_000,
  });

  await walkTo(page, { x: -7.7, z: 7.6 }, 2.1);
  await expect(page.locator(".interaction-hint")).toContainText("えだを集める");
  await page.keyboard.press("KeyE");
  const wood = page.getByTestId("activity-wood");
  await expect(wood).toBeVisible();
  const hit = wood.locator("[data-activity-primary]");
  await hit.click();
  await hit.click();
  await hit.click();
  await wood.locator("[data-activity-confirm]").click();

  const tutorial = page.getByTestId("tutorial-coach");
  await expect(tutorial).toContainText("\u30d0\u30c3\u30b0\u3092 \u3072\u3089\u3053\u3046", { timeout: 20_000 });
  await page.keyboard.press("KeyI");
  await expect(page.getByTestId("tutorial-coach")).toContainText(
    "\u3053\u3048\u3060\u306e \u3044\u3059\u3092 \u3064\u304f\u308d\u3046",
  );
  await page.keyboard.press("KeyC");
  await expect(
    page.getByRole("heading", { name: "木かげの作業台" }),
  ).toBeVisible();
  const recipe = page.locator(".recipe-list article").filter({ hasText: "小えだのいす" });
  await recipe.getByRole("button", { name: /つくる/ }).click();
  await page.keyboard.press("KeyI");
  await page.locator(".furniture-list article").filter({ hasText: "小えだのいす" })
    .getByRole("button", { name: "場所をえらぶ" }).click();
  const confirm = page.locator(".placement-confirm");
  for (const key of DIRECTIONS) {
    if (await confirm.isEnabled()) break;
    await walk(page, key, 700);
  }
  await expect(confirm).toBeEnabled();
  await confirm.click();

  const npcPositions = await canvas.getAttribute("data-debug-npc-positions");
  const nolla = npcPositions?.match(/ノラ:([\d.-]+),([\d.-]+)/);
  if (!nolla) throw new Error("Nolla position was not available for walking");
  await walkTo(page, { x: Number(nolla[1]), z: Number(nolla[2]) }, 1.05);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if ((await canvas.getAttribute("data-debug-closest-target")) === "\u30ce\u30e9") break;
    const livePositions = await canvas.getAttribute("data-debug-npc-positions");
    const liveNolla = livePositions?.match(/\u30ce\u30e9:([\d.-]+),([\d.-]+)/);
    if (!liveNolla) throw new Error("Nolla position disappeared while walking");
    await walkTo(
      page, { x: Number(liveNolla[1]), z: Number(liveNolla[2]) }, 0.95,
    );
  }
  await canvas.click();
  await page.keyboard.press("KeyE");
  await expect(page.locator(".resident-dialog")).toBeVisible({ timeout: 12_000 });
  await page.getByRole("button", { name: "\u3064\u304e" }).click();
  await page.getByRole("button", { name: "またね" }).click();
  await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);

  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /島づくり/ }).click();
  await page.getByRole("button", { name: /18 Lで ひらく/ }).click();
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(page.locator(".zone-badge")).toBeVisible();

  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /せってい/ }).click();
  await page.getByRole("button", { name: /いま セーブする/ }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: /つづきから/ })).toBeVisible();

  const elapsedSeconds = Math.round((Date.now() - startedAt) / 1000);
  await page.screenshot({
    path: "screenshots/90-point-rc/live-normal-speed-first-loop-90-plus.png",
    fullPage: true,
  });
  expect(elapsedSeconds).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
