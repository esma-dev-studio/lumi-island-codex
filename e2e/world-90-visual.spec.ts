import { expect, test, type Locator, type Page } from "@playwright/test";

const ZONES = [
  { id: "meadow", file: "live-central-meadow-90-plus.png", point: { x: 0, z: 3 } },
  { id: "forest", file: "live-forest-90-plus.png", point: { x: -14.5, z: -1.5 } },
  { id: "harbor", file: "live-harbor-90-plus.png", point: { x: 18.5, z: -2.4 } },
  { id: "moon-garden", file: "live-moon-garden-90-plus.png", point: { x: 0, z: -11.5 } },
] as const;

async function enterFreshGame(page: Page): Promise<Locator> {
  await page.goto("/?e2e");
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
      if (attempt === 1) throw new Error("game canvas did not load after warm-up retry");
      await expect(start).toBeVisible({ timeout: 15_000 });
    }
  }
  await expect(canvas).toBeVisible();
  await expect(canvas).toHaveAttribute("data-player-avatar", "production-glb", {
    timeout: 30_000,
  });
  await expect(canvas).toHaveAttribute("data-production-environment", "10/10", {
    timeout: 30_000,
  });
  return canvas;
}

async function travel(canvas: Locator, point: { x: number; z: number }): Promise<void> {
  await canvas.evaluate((element, destination) => {
    element.dispatchEvent(
      new CustomEvent("lumi-test-travel", { detail: destination }),
    );
  }, point);
}

test("four production zones are visibly distinct with the production player", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const canvas = await enterFreshGame(page);

  for (const zone of ZONES) {
    await travel(canvas, zone.point);
    await expect(canvas).toHaveAttribute("data-zone", zone.id);
    await page.waitForTimeout(800);
    await page.screenshot({
      path: `screenshots/90-point-rc/${zone.file}`,
      fullPage: true,
    });
  }

  const metrics = await canvas.getAttribute("data-performance-snapshot");
  expect(metrics).not.toBeNull();
  const parsed = JSON.parse(metrics ?? "{}") as {
    averageFps?: number;
    meshes?: number;
    materials?: number;
    textures?: number;
  };
  // SwiftShader proves the scene keeps rendering; hardware FPS is measured separately.
  expect(parsed.averageFps).toBeGreaterThan(0);
  expect(parsed.meshes).toBeGreaterThan(0);
  expect(parsed.materials).toBeGreaterThan(0);
  expect(parsed.textures).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test("iPad landscape keeps the zone name, objective, and touch controls visible", async ({
  browser,
}) => {
  test.setTimeout(180_000);
  const context = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    viewport: { width: 1024, height: 640 },
    hasTouch: true,
    isMobile: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const canvas = await enterFreshGame(page);
  await expect(page.locator(".zone-badge")).toBeVisible();
  await expect(page.getByTestId("tutorial-coach")).toBeVisible();
  await expect(page.locator(".touch-controls")).toBeVisible();
  await expect(canvas).toHaveAttribute("data-player-avatar", "production-glb");
  await page.waitForTimeout(12_000);
  const snapshot = JSON.parse(
    (await canvas.getAttribute("data-performance-snapshot")) ?? "{}",
  ) as { averageFps?: number; minimumFps?: number; p95FrameMs?: number };
  console.log("TABLET_PERFORMANCE", JSON.stringify(snapshot));
  if (process.env.PLAYWRIGHT_NATIVE_GPU === "1") {
    expect(snapshot.averageFps).toBeGreaterThanOrEqual(30);
  } else {
    expect(snapshot.averageFps).toBeGreaterThan(0);
  }
  expect(snapshot.minimumFps).toBeGreaterThan(0);
  expect(snapshot.p95FrameMs).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: "screenshots/90-point-rc/live-ipad-landscape-90-plus.png",
    fullPage: true,
  });
  await context.close();
});
