import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const output = path.join(root, "docs", "images");
const base = process.env.MOVEMOCAR_PREVIEW_URL ?? "http://127.0.0.1:5173";

await mkdir(output, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  colorScheme: "light",
  deviceScaleFactor: 1,
});

const captureGenerator = async (
  locale,
  filename,
  vehicle,
  phone,
) => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.route("https://api.day.app/push", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: '{"code":200}' }),
  );
  await page.goto(`${base}/create/?lang=${locale}`);
  await page.locator('[data-action="open-picker"]').click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  await page.locator(".channel-card input").first().fill("readme-demo-device-key");
  await page.locator('[data-action="test-channel"]').click();
  await page.locator(".channel-status--success").waitFor();
  await page.locator("#vehicle-plate").fill(vehicle);
  await page.locator("#owner-phone").fill(phone);
  await page.locator('[data-action="generate"]').click();
  await page.locator(".qr-frame img").waitFor();
  await page.screenshot({ path: path.join(output, filename), fullPage: true });
  await page.close();
};

const captureContact = async (
  locale,
  filename,
  phone,
  message,
) => {
  const page = await context.newPage();
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto(`${base}/m/?lang=${locale}&preview=sent`);
  await page.locator("#phone").fill(phone);
  await page.locator("#message").fill(message);
  await page.locator(".emergency-link").waitFor();
  await page.screenshot({ path: path.join(output, filename), fullPage: true });
  await page.close();
};

await captureGenerator("zh-CN", "generator-setup.png", "浙A·MOCHA", "13800138000");
await captureContact(
  "zh-CN",
  "contact-page.png",
  "13612345678",
  "车辆挡住出口，麻烦您挪一下车，谢谢！",
);
await captureGenerator("en", "generator-setup-en.png", "MOCHA", "2025550148");
await captureContact(
  "en",
  "contact-page-en.png",
  "2025550148",
  "Your vehicle is blocking the exit. Could you please move it? Thank you!",
);
await browser.close();
console.log(`README screenshots written to ${output}`);
