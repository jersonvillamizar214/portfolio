import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

// Captures a clean above-the-fold screenshot of each live project for the
// portfolio cards. Run: node scripts/shots.mjs
const SHOTS = [
  ["northwind-ops", "https://northwind-ops-javf.vercel.app"],
  ["rag-chat-assistant", "https://rag-chat-assistant-javf.vercel.app"],
  ["sales-system-sql", "https://sales-system-sql-javf.vercel.app"],
  ["nosql-catalog", "https://nosql-catalog-javf.vercel.app"],
  ["kpi-dashboard", "https://kpi-dashboard-javf.vercel.app"],
  ["algorithms-visualizer", "https://algorithms-visualizer-javf.vercel.app"],
  ["iot-mqtt-monitor", "https://iot-mqtt-monitor-javf.vercel.app"],
  ["serverless-url-shortener", "https://serverless-url-shortener.jersonvillamizar214.workers.dev"],
  ["jwt-auth-dashboard", "https://jwt-auth-dashboard-javf.vercel.app"],
  ["rest-api-jwt-auth", "https://rest-api-jwt-auth-javf.vercel.app"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mkdir("shots", { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5, // crisp on retina cards without huge files
    colorScheme: "dark",
  });

  for (const [name, url] of SHOTS) {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await sleep(2500); // let charts/animations settle
      await page.screenshot({
        path: `shots/${name}.jpg`,
        type: "jpeg",
        quality: 80,
        clip: { x: 0, y: 0, width: 1280, height: 800 }, // above-the-fold only
      });
      console.log(`  ok  ${name}`);
    } catch (e) {
      console.error(`  FAIL ${name}: ${e.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
}

main();
