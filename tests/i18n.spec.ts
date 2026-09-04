import { expect, test } from "@playwright/test";
import { decodeMoveCode } from "../src/qr-config";
import { supportedLocales, type Locale } from "../src/locale";
import { t } from "../src/i18n";

test("用户页可自动切换十种语言并保持原有布局入口", async ({ page }) => {
  await page.goto("/m/?lang=ja&preview=ready");
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(page.getByRole("heading", { name: "車の持ち主に連絡" })).toBeVisible();
  await page.getByRole("button", { name: "言語を選択" }).click();
  await expect(page.getByRole("dialog", { name: "言語を選択" })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(10);
  await expect(page.getByRole("radio", { name: "日本語" })).toHaveAttribute("aria-checked", "true");
});

test("语言选择器使用无框列表、单一选中对勾和正圆关闭按钮", async ({ page }) => {
  await page.goto("/create/?lang=zh-CN");
  await page.getByRole("button", { name: "选择语言" }).click();

  const options = page.getByRole("radio");
  await expect(options).toHaveCount(10);
  await expect(page.locator('.language-option .language-symbol')).toHaveCount(1);
  await expect(options.first()).toHaveCSS("border-top-width", "0px");
  await expect(options.first()).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  const closeButton = page.getByRole("button", { name: "关闭" });
  const closeShape = await closeButton.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height, radius: getComputedStyle(button).borderRadius };
  });
  expect(Math.abs(closeShape.width - closeShape.height)).toBeLessThan(0.01);
  expect(closeShape.radius).toBe("999px");
});

test("长拼写语言使用紧凑的测试状态", () => {
  expect(["es", "fr", "de", "it", "pt-BR"].map((locale) => [
    t(locale as Locale, "creator.status.testing"),
    t(locale as Locale, "creator.status.success"),
    t(locale as Locale, "creator.status.error"),
  ])).toEqual([
    ["Probando", "Correcto", "Falló"],
    ["Test…", "Réussi", "Échec"],
    ["Test…", "Erfolg", "Fehler"],
    ["Test…", "Riuscito", "Fallito"],
    ["Teste…", "Sucesso", "Falhou"],
  ]);
});

test("生成页使用当前语言并将车主语言写入挪车码", async ({ page }) => {
  await page.goto("/create/?lang=ko");
  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("heading", { name: "차량 이동 코드 생성", exact: true }).first()).toBeVisible();

  await page.getByLabel("차량 번호").fill("KOREA 12");
  await page.getByLabel("긴급 연락처").fill("821012345678");
  await page.getByRole("switch", { name: "알림 채널 사용" }).click();
  await page.getByRole("button", { name: "QR 코드 생성" }).click();

  const generatedUrl = await page.getByRole("button", { name: "링크 복사" }).getAttribute("data-url");
  expect(generatedUrl).toBeTruthy();
  const hash = new URL(generatedUrl ?? "").hash;
  expect(decodeMoveCode(hash).locale).toBe("ko");
});

test("全部语言在移动端不横向溢出或挤压弹窗文案", async ({ page }) => {
  for (const locale of supportedLocales) {
    await page.goto(`/create/?lang=${locale}`);
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${locale} 生成页横向溢出`).toBeLessThanOrEqual(1);

    await page.goto(`/m/?lang=${locale}&preview=damaged`);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${locale} 用户页横向溢出`).toBeLessThanOrEqual(1);
    const layout = await page.locator(".dialog-card").evaluate((card) => {
      const title = card.querySelector("h2")?.getBoundingClientRect();
      const copy = card.querySelector(".dialog-copy")?.getBoundingClientRect();
      const actions = card.querySelector(".dialog-actions")?.getBoundingClientRect();
      return { titleBottom: title?.bottom, copyTop: copy?.top, copyBottom: copy?.bottom, actionsTop: actions?.top };
    });
    expect(layout.copyTop ?? 0, `${locale} 弹窗标题与正文重叠`).toBeGreaterThanOrEqual(layout.titleBottom ?? 0);
    expect(layout.actionsTop ?? 0, `${locale} 弹窗正文与按钮重叠`).toBeGreaterThanOrEqual(layout.copyBottom ?? 0);
  }
});
