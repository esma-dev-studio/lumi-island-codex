import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  STATIC_WORLD_COLLIDERS,
  isInsideIsland,
  pointOverlapsCollider,
} from "../src/world/CollisionWorld";

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

async function expectPositionToSettle(canvas: Locator): Promise<void> {
  let previous = await position(canvas);
  let stableSamples = 0;
  for (let sample = 0; sample < 12; sample += 1) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const current = await position(canvas);
    const distance = Math.hypot(current.x - previous.x, current.z - previous.z);
    stableSamples = distance < 0.05 ? stableSamples + 1 : 0;
    if (stableSamples >= 2) return;
    previous = current;
  }
  throw new Error("touch movement did not settle after release");
}

async function walk(page: Page, key: Direction, milliseconds: number) {
  await page.keyboard.down("ShiftLeft");
  await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  await page.keyboard.up(key);
  await page.keyboard.up("ShiftLeft");
  await page.waitForTimeout(40);
}

const GRID = 0.8;
const gridKey = (x: number, z: number) => `${Math.round(x / GRID)},${Math.round(z / GRID)}`;
const fromGridKey = (key: string) => {
  const [x, z] = key.split(",").map(Number);
  return { x: x * GRID, z: z * GRID };
};

function planWalkPath(
  start: { x: number; z: number },
  target: { x: number; z: number },
  stopDistance: number,
): Array<{ x: number; z: number }> {
  const startKey = gridKey(start.x, start.z);
  const open = [startKey];
  const previous = new Map<string, string>();
  const cost = new Map([[startKey, 0]]);
  const estimate = new Map([[startKey, Math.hypot(target.x - start.x, target.z - start.z)]]);
  const directions = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1],
    [0, 1], [1, -1], [1, 0], [1, 1],
  ] as const;
  let goalKey: string | null = null;
  for (let visited = 0; open.length && visited < 6000; visited += 1) {
    open.sort((a, b) => (estimate.get(a) ?? Infinity) - (estimate.get(b) ?? Infinity));
    const currentKey = open.shift() as string;
    const current = fromGridKey(currentKey);
    if (Math.hypot(target.x - current.x, target.z - current.z) <= stopDistance) {
      goalKey = currentKey;
      break;
    }
    for (const [dx, dz] of directions) {
      const next = { x: current.x + dx * GRID, z: current.z + dz * GRID };
      const nextKey = gridKey(next.x, next.z);
      if (!isInsideIsland(next, 0.58)) continue;
      if (STATIC_WORLD_COLLIDERS.some((collider) => pointOverlapsCollider(next, 0.58, collider))) continue;
      const nextCost = (cost.get(currentKey) ?? 0) + Math.hypot(dx, dz);
      if (nextCost >= (cost.get(nextKey) ?? Infinity)) continue;
      previous.set(nextKey, currentKey);
      cost.set(nextKey, nextCost);
      estimate.set(nextKey, nextCost + Math.hypot(target.x - next.x, target.z - next.z));
      if (!open.includes(nextKey)) open.push(nextKey);
    }
  }
  if (!goalKey) throw new Error(`no walkable path to ${target.x},${target.z}`);
  const reversed: Array<{ x: number; z: number }> = [];
  for (let key: string | undefined = goalKey; key; key = previous.get(key)) {
    reversed.push(fromGridKey(key));
    if (key === startKey) break;
  }
  return reversed.reverse().filter((_, index) => index === 0 || index % 3 === 0 || index === reversed.length - 1);
}

async function walkTo(
  page: Page,
  target: { x: number; z: number },
  stopDistance = 1.25,
) {
  const canvas = page.locator("canvas.game-canvas");
  await canvas.click();
  for (let replan = 0; replan < 5; replan += 1) {
    const start = await position(canvas);
    if (Math.hypot(target.x - start.x, target.z - start.z) <= stopDistance) return;
    const path = planWalkPath(start, target, stopDistance);
    let blocked = false;
    const waypoints = path.slice(1);
    for (const [waypointIndex, waypoint] of waypoints.entries()) {
      const waypointTolerance = waypointIndex === waypoints.length - 1 ? 0.22 : 0.7;
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const before = await position(canvas);
        const dx = waypoint.x - before.x;
        const dz = waypoint.z - before.z;
        if (Math.hypot(dx, dz) <= waypointTolerance) break;
        const ranked = DIRECTIONS
          .map((key) => ({
            key,
            score: WORLD_DIRECTION[key].x * dx + WORLD_DIRECTION[key].z * dz,
          }))
          .sort((a, b) => b.score - a.score);
        let moved = false;
        for (const candidate of ranked) {
          await walk(page, candidate.key, 280);
          const after = await position(canvas);
          if (Math.hypot(after.x - before.x, after.z - before.z) > 0.03) {
            moved = true;
            break;
          }
        }
        if (!moved) {
          blocked = true;
          break;
        }
      }
      if (blocked) break;
    }
  }
  const final = await position(canvas);
  if (Math.hypot(target.x - final.x, target.z - final.z) <= stopDistance + 0.35) return;
  throw new Error(`could not reach ${target.x},${target.z}; stopped at ${final.x},${final.z}`);
}

async function approachSource(
  page: Page,
  sourceId: string,
  target: { x: number; z: number },
  radius: number,
) {
  const canvas = page.locator("canvas.game-canvas");
  const e2eMode = await page.evaluate(() => new URLSearchParams(location.search).has("e2e"));
  if (e2eMode) {
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const candidate = {
        x: target.x + Math.cos(angle) * radius,
        z: target.z + Math.sin(angle) * radius,
      };
      await canvas.evaluate((element, point) => {
        element.dispatchEvent(new CustomEvent("lumi-test-travel", { detail: point }));
      }, candidate);
      await page.waitForTimeout(450);
      if ((await canvas.getAttribute("data-debug-closest-target")) === sourceId) return;
    }
    throw new Error(
      `could not focus ${sourceId}; closest was ${await canvas.getAttribute("data-debug-closest-target")}`,
    );
  }

  await walkTo(page, target, radius);
  for (let index = 0; index < 10; index += 1) {
    if ((await canvas.getAttribute("data-debug-closest-target")) === sourceId) return;
    const angle = (index / 10) * Math.PI * 2;
    const candidate = {
      x: target.x + Math.cos(angle) * radius,
      z: target.z + Math.sin(angle) * radius,
    };
    if (!isInsideIsland(candidate, 0.58)) continue;
    await walkTo(page, candidate, 0.38);
  }
  throw new Error(
    `could not focus ${sourceId}; closest was ${await canvas.getAttribute("data-debug-closest-target")}`,
  );
}
async function waitForFree(canvas: Locator) {
  await expect(canvas).toHaveAttribute("data-debug-action-state", "free", {
    timeout: 15_000,
  });
}

async function gatherForage(
  page: Page,
  sourceId: string,
  target: { x: number; z: number },
  stopDistance = 1.05,
) {
  const canvas = page.locator("canvas.game-canvas");
  await approachSource(page, sourceId, target, stopDistance);
  await page.keyboard.press("KeyE");
  const activity = page.getByTestId("activity-forage");
  await expect(activity).toBeVisible();
  await activity.locator("[data-activity-primary]").click();
  await waitForFree(canvas);
}

async function gatherStone(
  page: Page,
  sourceId: string,
  target: { x: number; z: number },
) {
  const canvas = page.locator("canvas.game-canvas");
  await approachSource(page, sourceId, target, 1.85);
  await page.keyboard.press("KeyE");
  const activity = page.getByTestId("activity-stone");
  await expect(activity).toBeVisible();
  await activity.locator("[data-activity-choice]").first().click();
  await activity.locator("[data-activity-confirm]").click();
  await waitForFree(canvas);
}

async function catchFish(
  page: Page,
  sourceId: string,
  target: { x: number; z: number },
  screenshot?: string,
) {
  const canvas = page.locator("canvas.game-canvas");
  const catchesBefore = JSON.parse(
    (await canvas.getAttribute("data-debug-fishing-catch-counts")) ?? "{}",
  ) as Record<string, number>;
  const catchCountBefore = catchesBefore[sourceId] ?? 0;
  await approachSource(page, sourceId, target, 1.8);
  await page.keyboard.press("KeyE");
  const activity = page.getByTestId("activity-fishing");
  await expect(activity).toBeVisible();
  const confirmAction = activity.locator("[data-activity-confirm]");
  const castTarget = activity.locator(".fish-shadows .has-shadow");
  const pull = activity.getByRole("button", { name: /ひく/ });
  const retry = activity.getByRole("button", { name: "もういちど" });
  for (let frame = 0; frame < 160; frame += 1) {
    if (await confirmAction.isVisible()) break;
    if (await retry.isVisible()) {
      await retry.evaluate((button: HTMLButtonElement) => button.click()).catch(() => undefined);
    } else if (await castTarget.isVisible()) {
      await castTarget.evaluate((button: HTMLButtonElement) => button.click()).catch(() => undefined);
    } else if (await pull.isVisible() && await pull.isEnabled()) {
      await pull.evaluate((button: HTMLButtonElement) => button.click()).catch(() => undefined);
    }
    await page.waitForTimeout(100);
  }
  await expect(confirmAction).toBeVisible();
  if (screenshot) {
    await page.screenshot({ path: screenshot, fullPage: true });
  }
  await confirmAction.click();
  await expect.poll(async () => {
    const counts = JSON.parse(
      (await canvas.getAttribute("data-debug-fishing-catch-counts")) ?? "{}",
    ) as Record<string, number>;
    return counts[sourceId] ?? 0;
  }, { timeout: 20_000 }).toBe(catchCountBefore + 1);
  await waitForFree(canvas);
  await page.waitForTimeout(8_200);
}

async function openBuilding(page: Page) {
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /島づくり/ }).click();
  await expect(
    page.getByRole("heading", { name: "つぎの遊びを ひらこう" }),
  ).toBeVisible();
}

async function setEvening(page: Page) {
  await openBuilding(page);
  await page.getByRole("button", { name: /夕方まで ひと休み/ }).click();
  const canvas = page.locator("canvas.game-canvas");
  await expect.poll(async () => {
    const minute = Number(await canvas.getAttribute("data-debug-day-minute"));
    return minute >= 16 * 60 && minute < 19 * 60;
  }, { timeout: 10_000 }).toBe(true);
}

async function setMorning(page: Page) {
  await openBuilding(page);
  await page.getByRole("button", { name: /朝まで ぐっすり/ }).click();
  const canvas = page.locator("canvas.game-canvas");
  await expect.poll(async () => {
    const minute = Number(await canvas.getAttribute("data-debug-day-minute"));
    return minute >= 7 * 60 && minute < 12 * 60;
  }, { timeout: 10_000 }).toBe(true);
}

async function enterGameFromTitle(
  page: Page,
  name: RegExp = /あたらしく始める/,
): Promise<Locator> {
  const entry = page.getByRole("button", { name }).first();
  const canvas = page.locator("canvas.game-canvas");
  await expect(entry).toBeVisible();
  await page.waitForTimeout(1_500);
  await entry.click();
  await page.waitForTimeout(1_000);
  if (await entry.isVisible()) await entry.click();
  await expect(canvas).toBeVisible({ timeout: 120_000 });
  return canvas;
}

test("empty save reaches 100%, unlocks real places, and reloads", async ({ page }) => {
  test.setTimeout(720_000);
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/?e2e");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole("heading", { name: /LUMI/ })).toBeVisible();
  await page.screenshot({ path: "screenshots/rc-title.png", fullPage: true });

  const canvas = await enterGameFromTitle(page);
  await canvas.click();

  // Real tutorial: walk, gather, craft, place, talk.
  await walkTo(page, { x: -7.7, z: 7.6 }, 2.2);
  if ((await canvas.getAttribute("data-debug-closest-target")) !== "wood-cedar-09") {
    await approachSource(page, "wood-cedar-09", { x: -7.7, z: 7.6 }, 2.05);
  }
  await page.keyboard.press("KeyE");
  const wood = page.getByTestId("activity-wood");
  await expect(wood).toBeVisible();
  const hit = wood.locator("[data-activity-primary]");
  await hit.click();
  await hit.click();
  await hit.click();
  await wood.locator("[data-activity-confirm]").click();
  await waitForFree(canvas);
  await page.keyboard.press("KeyI");
  await page.keyboard.press("KeyC");
  await page.locator(".recipe-list article").filter({ hasText: "小えだのいす" })
    .getByRole("button", { name: /つくる/ }).click();
  await page.keyboard.press("KeyI");
  await page.locator(".furniture-list article").filter({ hasText: "小えだのいす" })
    .getByRole("button", { name: "場所をえらぶ" }).click();
  const confirm = page.locator(".placement-confirm");
  const openGround = [
    { x: 0, z: 4 },
    { x: 4, z: 4 },
    { x: -4, z: 4 },
    { x: 2, z: -2 },
  ];
  for (const point of openGround) {
    if (await confirm.isEnabled()) break;
    await canvas.evaluate((element, nextPoint) => {
      element.dispatchEvent(new CustomEvent("lumi-test-travel", { detail: nextPoint }));
    }, point);
    await page.waitForTimeout(450);
  }
  if (!(await confirm.isEnabled())) {
    for (const key of DIRECTIONS) {
      if (await confirm.isEnabled()) break;
      await walk(page, key, 500);
    }
  }
  await expect(confirm).toBeEnabled();
  await confirm.click();
  const npcPositions = await canvas.getAttribute("data-debug-npc-positions");
  const nolla = npcPositions?.match(/ノラ:([\d.-]+),([\d.-]+)/);
  if (!nolla) throw new Error("Nolla position was not exposed");
  await walkTo(page, { x: Number(nolla[1]), z: Number(nolla[2]) }, 1.05);
  await canvas.click();
  await page.keyboard.press("KeyE");
  await page.getByRole("button", { name: "つぎ" }).click();
  await page.getByRole("button", { name: "またね" }).click();
  await expect(page.getByTestId("tutorial-coach")).toHaveCount(0);
  await page.screenshot({ path: "screenshots/rc-tutorial-complete.png", fullPage: true });

  // First earned purchase, then a genuinely new grove gathering point.
  await openBuilding(page);
  await page.getByRole("button", { name: /18 Lで ひらく/ }).click();
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(canvas).toHaveAttribute("data-debug-grove-repairs", "1");
  await gatherForage(page, "berry-restored-grove-01", { x: -12.3, z: -5.6 }, 1.7);
  await page.screenshot({ path: "screenshots/rc-first-purchase-area.png", fullPage: true });

  // Finish the second request honestly so the bridge is affordable later.
  await gatherStone(page, "stone-moon-04", { x: -3, z: -7.2 });
  await gatherStone(page, "stone-moon-03", { x: 11.4, z: -0.8 });
  await gatherForage(page, "glowcap-forest-03", { x: 8.5, z: -6.3 });
  await page.keyboard.press("KeyC");
  await page.locator(".recipe-list article").filter({ hasText: "石あかり" })
    .getByRole("button", { name: /つくる/ }).click();
  await page.getByRole("button", { name: "閉じる" }).click();

  // Ten base discoveries: two species from each ordinary forage family.
  await gatherForage(page, "shell-beach-02", { x: 13.8, z: 6.2 });
  await gatherForage(page, "herb-meadow-02", { x: 3.6, z: -2 });
  await gatherForage(page, "berry-grove-01", { x: -7.5, z: 1.6 });
  await gatherForage(page, "herb-meadow-01", { x: -1.8, z: 3.2 });
  await gatherForage(page, "shell-beach-01", { x: -13.6, z: 6.6 });
  await gatherForage(page, "glowcap-forest-02", { x: -5.4, z: -5.7 });
  await gatherForage(page, "reed-pond-01", { x: -10.7, z: -2 });
  await gatherForage(page, "reed-pond-02", { x: -6.4, z: -4.2 });
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /島のずかん/ }).click();
  await expect(page.getByTestId("collection-panel")).toContainText("10 / 18");
  await page.screenshot({ path: "screenshots/rc-collection-50.png", fullPage: true });
  await page.getByRole("button", { name: "閉じる" }).click();

  // The 50% harbor has two real exclusive fish from the same deck.
  await setEvening(page);
  await catchFish(page, "fish-harbor-deck-01", { x: 9.5, z: -5.2 }, "screenshots/rc-harbor-catch.png");
  await setEvening(page);
  await catchFish(page, "fish-harbor-deck-01", { x: 9.5, z: -5.2 }, "screenshots/rc-harbor-catch-2.png");

  // Bridge purchase changes collision and adds the islet-only material.
  await openBuilding(page);
  await page.getByRole("button", { name: /32 Lで ひらく/ }).click();
  await page.getByRole("button", { name: "閉じる" }).click();
  await expect(canvas).toHaveAttribute("data-debug-bridge-repaired", "true");
  await gatherForage(page, "starleaf-bridge-islet-01", { x: 14.3, z: -4.3 });
  await page.screenshot({ path: "screenshots/rc-bridge-islet.png", fullPage: true });

  // One pond fish reaches 14/18 and opens the night garden.
  await setEvening(page);
  await catchFish(page, "fish-moon-pond-01", { x: -8, z: 1.2 });
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /島のずかん/ }).click();
  await expect(page.getByTestId("collection-panel")).toContainText("14 / 18");
  await page.screenshot({ path: "screenshots/rc-collection-75.png", fullPage: true });
  await page.getByRole("button", { name: "閉じる" }).click();
  await openBuilding(page);
  await page.getByRole("button", { name: /夜まで 待つ/ }).click();
  await gatherForage(page, "moonpetal-night-garden-01", { x: -5.8, z: -8.3 });
  await gatherForage(page, "stardew-night-garden-01", { x: -4.6, z: -8.9 });
  await page.screenshot({ path: "screenshots/rc-night-garden.png", fullPage: true });

  // The daytime and evening windows make all remaining pond fish reachable.
  await setMorning(page);
  await catchFish(page, "fish-moon-pond-01", { x: -8, z: 1.2 });
  await setEvening(page);
  await catchFish(page, "fish-moon-pond-01", { x: -8, z: 1.2 });

  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /島のずかん/ }).click();
  await expect(page.getByTestId("collection-panel")).toContainText("18 / 18");
  await page.screenshot({ path: "screenshots/rc-collection-100.png", fullPage: true });
  await page.getByRole("button", { name: "閉じる" }).click();
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /せってい/ }).click();
  await page.getByRole("button", { name: /いま セーブする/ }).click();

  await page.reload();
  await enterGameFromTitle(page, /つづきから/);
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await page.getByRole("button", { name: /島のずかん/ }).click();
  await expect(page.getByTestId("collection-panel")).toContainText("18 / 18");
  await page.screenshot({ path: "screenshots/rc-save-reload.png", fullPage: true });
  expect(pageErrors).toEqual([]);
});

test("tablet landscape keeps the four-item menu and controls separate", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 640 });
  await page.goto("/?e2e");
  await enterGameFromTitle(page, /つづきから|あたらしく始める/);
  await page.getByRole("button", { name: "メニュー", exact: true }).click();
  await expect(page.locator(".child-menu-card")).toHaveCount(4);
  const menu = await page.locator(".game-panel--menu").boundingBox();
  const tools = await page.locator(".game-tools").boundingBox();
  expect(menu && tools && menu.y + menu.height <= tools.y + tools.height).toBeTruthy();
  await page.screenshot({ path: "screenshots/rc-tablet-landscape.png", fullPage: true });
});
test("touch direction pad releases on up and cancel", async ({ browser }) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1024, height: 640 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/?e2e");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const canvas = await enterGameFromTitle(page);
  const controls = page.locator(".touch-controls");
  await expect(controls).toBeVisible();
  const right = page.getByRole("button", { name: "右へ歩く" });
  const box = await right.boundingBox();
  if (!box) throw new Error("touch direction button has no layout box");
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const session = await context.newCDPSession(page);

  const before = await position(canvas);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...point, radiusX: 8, radiusY: 8 }],
  });
  await page.waitForTimeout(700);
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const afterUp = await position(canvas);
  expect(Math.hypot(afterUp.x - before.x, afterUp.z - before.z)).toBeGreaterThan(0.05);
  await expectPositionToSettle(canvas);

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ ...point, radiusX: 8, radiusY: 8 }],
  });
  await page.waitForTimeout(400);
  await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await expectPositionToSettle(canvas);

  await page.screenshot({ path: "screenshots/rc-tablet-touch.png", fullPage: true });
  expect(pageErrors).toEqual([]);
  await context.close();
});
