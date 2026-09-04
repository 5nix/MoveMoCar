import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.MOVEMOCAR_SCREENSHOT_URL ?? "http://127.0.0.1:5173/";
const outputDir = process.env.MOVEMOCAR_SCREENSHOT_DIR ?? "/tmp/movemocar-landing-screenshots";
const allViewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 900, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];
const requestedViewports = new Set(
  (process.env.MOVEMOCAR_SCREENSHOT_VIEWPORTS ?? "desktop,tablet,mobile")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const viewports = allViewports.filter(({ name }) => requestedViewports.has(name));
const allVariants = [
  { name: "zh-light", lang: "zh", theme: "light" },
  { name: "zh-dark", lang: "zh", theme: "dark" },
  { name: "en-light", lang: "en", theme: "light" },
  { name: "en-dark", lang: "en", theme: "dark" },
];
const requestedVariants = new Set(
  (process.env.MOVEMOCAR_SCREENSHOT_VARIANTS ?? "zh-light,zh-dark,en-light,en-dark")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const variants = allVariants.filter(({ name }) => requestedVariants.has(name));

if (viewports.length === 0) {
  throw new Error("MOVEMOCAR_SCREENSHOT_VIEWPORTS must include desktop, tablet, or mobile");
}
if (variants.length === 0) {
  throw new Error("MOVEMOCAR_SCREENSHOT_VARIANTS must include a supported language/theme pair");
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const variant of variants) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.emulateMedia({ reducedMotion: "reduce", colorScheme: variant.theme });
      const url = new URL(baseUrl);
      if (variant.lang === "en") url.searchParams.set("lang", "en");
      url.searchParams.set("theme", variant.theme);
      await page.goto(url.href, { waitUntil: "networkidle" });
      await page.locator("img[loading='lazy']").evaluateAll((images) => {
        images.forEach((image) => image.setAttribute("loading", "eager"));
      });
      await page.waitForFunction(() =>
        Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
      );
      await page.evaluate(() => document.fonts?.ready);
      const outputPath = path.join(outputDir, `landing-${variant.name}-${viewport.name}-full.png`);
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(outputPath);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
