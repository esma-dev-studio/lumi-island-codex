import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.LUMI_URL ?? "http://localhost:3000";
const output = path.resolve("screenshots");
const saveKey = "lumi-island-save-v1";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(message.text());
});

async function seed(values = {}) {
  await page.goto(baseURL);
  await page.evaluate(
    ({ key, values: seedValues }) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 3,
          tutorialStep: 7,
          tutorialProgress: { step: 7, walkedDistance: 3 },
          easyMode: false,
          playerPosition: { x: 0, z: 6 },
          ...seedValues,
        }),
      );
    },
    { key: saveKey, values },
  );
  await page.reload();
  await page.getByRole("button", { name: /つづきから/ }).click();
  await page.locator("canvas.game-canvas").waitFor({ state: "visible" });
  await page.waitForTimeout(2200);
}

async function shot(name) {
  await page.screenshot({ path: path.join(output, name) });
}

await fs.mkdir(output, { recursive: true });

await seed({ lumen: 120, groveRepairs: 0 });
await page.getByRole("button", { name: "メニュー", exact: true }).click();
await shot("phase2-2-rank-before.png");
await page.locator(".lumen-shop").getByRole("button", { name: /杉のベンチ/ }).click();
await page.locator(".lumen-shop").getByRole("button", { name: /木もれ日の森/ }).click();
await shot("phase2-2-lumen-exchange.png");

const completeQuests = {
  "first-kindling": { status: "complete", amount: 3 },
  "warm-light": { status: "complete", amount: 1 },
  "sea-letter": { status: "complete", amount: 3 },
  "herbal-tea": { status: "complete", amount: 1 },
  "lighthouse-picnic": { status: "complete", amount: 1 },
};
const collectionCounts = Object.fromEntries(
  [
    "lumi-minnow", "moon-carp", "ripple-perch", "berry-red", "berry-twin",
    "herb-moon", "herb-star", "glowcap-light", "glowcap-firefly", "reed-water",
  ].map((id) => [id, 1]),
);
const advanced = {
  playerPosition: { x: 0, z: -7.4 },
  lumen: 760,
  quests: completeQuests,
  collectionCounts,
  discoveredItems: Object.keys(collectionCounts),
  collectionMilestones: [25, 50, 75],
  groveRepairs: 3,
  residentFriendship: { ノラ: 3, カイ: 3, セラ: 3 },
  placedFurniture: [
    { id: "rank-seat", type: "twig-stool", position: { x: 2, z: -5 }, rotation: 0 },
    { id: "rank-lamp", type: "stone-lantern", position: { x: -2, z: -5 }, rotation: 0 },
  ],
  dayMinute: 12 * 60,
};
await seed(advanced);
await shot("phase2-2-rank-after-world.png");
await page.getByRole("button", { name: "メニュー", exact: true }).click();
await shot("phase2-2-rank-after.png");

await seed({ playerPosition: { x: -8.7, z: 4.4 }, dayMinute: 12 * 60 });
await page.locator("canvas.game-canvas").click();
await page.keyboard.press("KeyE");
await page.waitForTimeout(700);
await shot("phase2-2-npc-dialogue.png");

await seed({ dayMinute: 12 * 60 });
await shot("phase2-2-island-day.png");
await seed({ dayMinute: 20 * 60 });
await shot("phase2-2-island-night.png");

await browser.close();
if (browserErrors.length) {
  throw new Error(`Browser errors during capture: ${browserErrors.join(" | ")}`);
}
console.log("Phase 2.2 screenshots captured.");