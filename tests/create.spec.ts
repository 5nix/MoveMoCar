import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { PNG } from "pngjs";
import QRCode from "qrcode";
import { decodeMoveCode } from "../src/qr-config";

const averageRgbDifference = (first: Buffer, second: Buffer) => {
  const a = PNG.sync.read(first);
  const b = PNG.sync.read(second);
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  let difference = 0;
  for (let index = 0; index < a.data.length; index += 4) {
    difference += Math.abs(a.data[index] - b.data[index]);
    difference += Math.abs(a.data[index + 1] - b.data[index + 1]);
    difference += Math.abs(a.data[index + 2] - b.data[index + 2]);
  }
  return difference / (a.width * a.height * 3);
};

test("所有页面使用统一的圆底品牌网站图标", async ({ page }) => {
  for (const path of ["/", "/create/", "/m/", "/m/demo/"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", /assets\/movemocar-favicon\.svg$/);
  }
});

test("根路径保留独立 Landing Page 入口", async ({ page }) => {
  await page.goto("/?theme=light");
  await expect(page.getByRole("heading", { name: "扫描挪车码发送留言 需要的时候再打电话" })).toBeVisible();
  await expect(page.getByRole("link", { name: "创建挪车码" }).first()).toHaveAttribute("href", /\/create\/$/);
  await expect(page.getByRole("link", { name: "体验扫码视角" })).toHaveAttribute("href", /\/m\/demo\/$/);
  await expect(page.locator('.hero__actions [data-icon="arrow"]')).toBeVisible();
  await expect(page.locator('.hero__actions [data-icon="scan"]')).toBeVisible();
  const github = page.getByRole("link", { name: "GitHub" }).first();
  await expect(github).toHaveAttribute("href", "https://github.com/5nix/MoveMoCar");
  await expect(github.locator('[data-icon="github"]')).toBeVisible();
  await expect(github).toHaveCSS("background-color", "rgb(13, 17, 23)");
  await expect(page.locator("#app")).toHaveCount(0);
});

test("搜索索引、canonical 与站点地图受公开站点地址控制", async ({ page, request }) => {
  const siteUrl = process.env.VITE_SITE_URL?.trim().replace(/\/+$/, "");
  const publicPages = [["/", "/"], ["/create/?lang=zh-CN", "/create/"]] as const;

  for (const [path, canonicalPath] of publicPages) {
    await page.goto(path);
    if (siteUrl) {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${siteUrl}${canonicalPath}`);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${siteUrl}/assets/landing/campaign-hero-3d-white-v2.webp`);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
      const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
      expect(structuredData).not.toBeNull();
      const graph = JSON.parse(structuredData ?? "{}")["@graph"];
      expect(graph.some((item: { "@type"?: string }) => item["@type"] === "WebApplication")).toBe(true);
    } else {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    }
  }

  for (const path of ["/m/", "/m/demo/"]) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  }

  if (siteUrl) {
    await page.goto("/?lang=en");
    await expect(page).toHaveTitle("MoveMoCar | Open-source parking contact QR code");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${siteUrl}/?lang=en`);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "en_US");

    await page.goto("/create/?lang=en");
    await expect(page).toHaveTitle("Create a MoveMoCar code | MoveMoCar");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${siteUrl}/create/?lang=en`);
  }

  const robots = await request.get("/robots.txt");
  if (siteUrl) {
    expect(await robots.text()).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
    expect(existsSync("dist/sitemap.xml")).toBe(true);
  } else {
    expect(await robots.text()).toBe("User-agent: *\nAllow: /\n");
    expect(existsSync("dist/sitemap.xml")).toBe(false);
  }
});

test("Landing Page 的导航、中英文、明暗主题和对应截图可联动", async ({ page }) => {
  await page.goto("/?theme=light");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.locator(".brand__mark")).toHaveCSS("background-color", "rgb(1, 57, 2)");
  for (const [name, hash] of [["工作方式", "#how"], ["生成", "#builder"], ["技术", "#system"], ["FAQ", "#faq"]] as const) {
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute("href", hash);
  }
  await expect(page.locator('[data-screen="contact"]')).toHaveAttribute("src", /contact-form-zh-light\.webp$/);

  const menuButton = page.getByRole("button", { name: "打开菜单" });
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.locator("#nav-links .t-acc-panel").evaluate((panel) => Promise.all(panel.getAnimations().map((animation) => animation.finished)));
  }
  await page.getByRole("button", { name: "Switch to English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Scan the parking code to leave a message Call only when needed" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "One for your car" })).toBeVisible();
  await expect(page.locator('[data-screen="create"]')).toHaveAttribute("src", /create-en-light\.webp$/);
  await expect(page.getByRole("link", { name: "Create my MoveMoCar code" }).first()).toHaveAttribute("href", /\/create\/$/);
  await expect(page.getByRole("link", { name: "Try the visitor view" })).toHaveAttribute("href", /\/m\/demo\/$/);

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".brand__mark")).toHaveCSS("background-color", "rgb(143, 227, 146)");
  await expect(page.locator('[data-screen="result"]')).toHaveAttribute("src", /qr-result-en-dark\.webp$/);
  await expect(page.getByRole("link", { name: "GitHub" }).first()).toHaveCSS("background-color", "rgb(255, 255, 255)");
});

test("Landing Page 默认实时跟随系统主题且手动选择优先", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  const menuButton = page.locator(".nav-toggle");
  if (await menuButton.isVisible()) await menuButton.click();
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("Landing Page 在模块样式到达前只显示当前主题主图", async ({ page }) => {
  await page.route(/\/assets\/landing-.*\.css$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });

  for (const [selectedTheme, expected] of [
    ["light", { day: "1", night: "0" }],
    ["dark", { day: "0", night: "1" }],
  ] as const) {
    await page.goto(`/?theme=${selectedTheme}`, { waitUntil: "commit" });
    await page.locator(".hero__photo--night").waitFor({ state: "attached" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", selectedTheme);
    const opacity = await page.locator(".hero__photo").evaluateAll((images) =>
      images.map((image) => getComputedStyle(image).opacity),
    );
    expect(opacity).toEqual([expected.day, expected.night]);
  }
});

test("Landing Page 在手机宽度没有横向溢出且菜单可用", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?lang=en&theme=dark");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute("content", /maximum-scale=1, user-scalable=no/);
  await expect(page.locator("[data-hero-shader]")).toHaveCount(0);
  const menuButton = page.locator(".nav-toggle");
  const menuPanel = page.locator("#nav-links .t-acc-panel");
  await expect(menuButton).toHaveAttribute("aria-label", "Open menu");
  expect((await page.locator("#nav-links").boundingBox())?.height).toBe(0);
  expect((await menuPanel.boundingBox())?.height).toBe(0);
  const closedTransforms = await page.locator(".nav-toggle__line").evaluateAll((lines) => lines.map((line) => getComputedStyle(line).transform));
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(menuButton).toHaveAttribute("aria-label", "Close menu");
  await expect(page.locator("#nav-links")).toHaveAttribute("data-open", "true");
  await expect(page.locator("#nav-links")).toHaveCSS("border-top-width", "0px");
  await expect(page.locator("#nav-links")).toHaveCSS("box-shadow", "none");
  expect(await menuPanel.evaluate((panel) => getComputedStyle(panel).transitionDelay)).toBe("0s");
  await expect.poll(() => page.locator(".site-header").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element, "::before").borderBottomLeftRadius),
  )).toBeGreaterThanOrEqual(30);
  const headerJoin = await page.evaluate(() => {
    const headerBox = document.querySelector(".site-header")!.getBoundingClientRect();
    const panelBox = document.querySelector("#nav-links .t-acc-panel")!.getBoundingClientRect();
    const toggle = document.querySelector<HTMLElement>(".nav-toggle")!;
    const navLink = document.querySelector("#nav-links a:not(.nav-cta)")!;
    return {
      panelTop: panelBox.top - headerBox.top,
      edgeJoin: headerBox.bottom - panelBox.bottom,
      toggleTop: toggle.offsetTop,
      underlineDisplay: getComputedStyle(navLink, "::after").display,
    };
  });
  expect(headerJoin.panelTop).toBeCloseTo(68, 0);
  expect(Math.abs(headerJoin.edgeJoin)).toBeLessThan(0.5);
  expect(headerJoin.toggleTop).toBeCloseTo(13, 0);
  expect(headerJoin.underlineDisplay).toBe("none");
  const itemMotion = await page.locator(".nav-links__content").evaluate((content) =>
    Array.from(content.children).map((item) => {
      const style = getComputedStyle(item);
      return { delay: style.transitionDelay, duration: style.transitionDuration };
    }),
  );
  expect(itemMotion.map(({ delay }) => delay)).toEqual(["0s", "0.08s", "0.16s", "0.24s", "0.32s", "0.4s"]);
  expect(itemMotion.at(-1)?.duration).toBe("0.28s, 0.32s, 0.32s");
  const menuFinishOffset = await page.evaluate(() => {
    const panel = getComputedStyle(document.querySelector("#nav-links .t-acc-panel")!);
    const lastItem = getComputedStyle(document.querySelector(".nav-links__content > :last-child")!);
    const panelEnd = Number.parseFloat(panel.transitionDelay) + Number.parseFloat(panel.transitionDuration);
    const itemDelay = Number.parseFloat(lastItem.transitionDelay);
    const itemDuration = Math.max(...lastItem.transitionDuration.split(",").map(Number.parseFloat));
    return panelEnd - (itemDelay + itemDuration);
  });
  expect(menuFinishOffset).toBeCloseTo(.1, 2);
  await menuPanel.evaluate((panel) => Promise.all(panel.getAnimations({ subtree: true }).map((animation) => animation.finished)));
  await menuButton.evaluate((button) => Promise.all(button.getAnimations({ subtree: true }).map((animation) => animation.finished)));
  const openTransforms = await page.locator(".nav-toggle__line").evaluateAll((lines) => lines.map((line) => getComputedStyle(line).transform));
  expect(openTransforms).not.toEqual(closedTransforms);
  await expect(page.getByRole("link", { name: "Technology" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Technology" })).toHaveCSS("color", "rgb(238, 244, 239)");
  const heroImages = await page.locator(".hero__photo").evaluateAll((images) => images.map((image) => ({
    animationName: getComputedStyle(image).animationName,
    objectPosition: getComputedStyle(image).objectPosition,
  })));
  expect(heroImages.map(({ animationName }) => animationName)).toEqual(["none", "none"]);
  expect(new Set(heroImages.map(({ objectPosition }) => objectPosition)).size).toBe(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await menuButton.click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#nav-links")).toHaveAttribute("data-open", "false");
  await expect(page.locator(".site-header")).toHaveClass(/site-header--menu-open/);
  await menuPanel.evaluate((panel) => Promise.all(panel.getAnimations({ subtree: true }).map((animation) => animation.finished)));
  await expect(page.locator(".site-header")).not.toHaveClass(/site-header--menu-open/);
  expect((await page.locator("#nav-links").boundingBox())?.height).toBe(0);
  expect((await menuPanel.boundingBox())?.height).toBe(0);
});

test("竖屏首屏操作上下自适应内容，横屏保持横向排列", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?theme=light");
  const primary = page.locator(".hero__actions .button:first-child");
  const secondary = page.locator(".hero__actions .button--outline");
  await expect(primary).toBeVisible();
  await expect(secondary).toBeVisible();
  const portraitPrimary = await primary.boundingBox();
  const portraitSecondary = await secondary.boundingBox();
  expect(portraitPrimary).not.toBeNull();
  expect(portraitSecondary).not.toBeNull();
  expect(Math.abs(portraitPrimary!.width - portraitSecondary!.width)).toBeGreaterThan(8);
  expect(portraitPrimary!.width).toBeLessThan(270);
  expect(portraitSecondary!.width).toBeLessThan(270);
  expect(portraitSecondary!.y).toBeGreaterThan(portraitPrimary!.y + portraitPrimary!.height);
  await expect(secondary).toHaveCSS("border-top-width", "2px");
  await expect(secondary).toHaveCSS("border-radius", "999px");
  await expect(secondary).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  await page.setViewportSize({ width: 844, height: 390 });
  const landscapePrimary = await primary.boundingBox();
  const landscapeSecondary = await secondary.boundingBox();
  expect(landscapePrimary).not.toBeNull();
  expect(landscapeSecondary).not.toBeNull();
  expect(landscapeSecondary!.x).toBeGreaterThan(landscapePrimary!.x + landscapePrimary!.width);
  const primaryCenter = landscapePrimary!.y + landscapePrimary!.height / 2;
  const secondaryCenter = landscapeSecondary!.y + landscapeSecondary!.height / 2;
  expect(Math.abs(primaryCenter - secondaryCenter)).toBeLessThan(1);
});

test("带右侧图标的操作统一上浮并向右舒展", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  const targets = [
    page.locator(".hero__actions .button:first-child"),
    page.locator(".hero__actions .button--outline"),
    page.locator(".builder__copy .button"),
    page.locator(".closing .button"),
  ];
  for (const target of targets) {
    await target.evaluate((element) => Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)));
    const before = await target.boundingBox();
    await target.hover();
    await page.waitForTimeout(460);
    const after = await target.boundingBox();
    const iconTransform = await target.locator(".ui-icon").evaluate((icon) => getComputedStyle(icon).transform);
    expect(before).not.toBeNull();
    expect(after).not.toBeNull();
    expect(after!.width).toBeGreaterThan(before!.width + 6);
    expect(after!.y).toBeLessThan(before!.y - 2);
    expect(iconTransform).not.toBe("none");
  }
});

test("门槛文案、卡片与分段内容按顺序模糊进场", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?theme=light#privacy");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  await expect(page.getByText("MoveMoCar 要求请求挪车的人向车主主动发送联系电话和留言之后才可以获取车主号码。")).toBeVisible();
  await expect(page.getByText("对于正常挪车，多出来的只是填写电话和一句留言，而对于随手抄走号码的人，这大概已经多了一点麻烦。")).toBeVisible();

  const premise = page.locator(".premise");
  const cardMotion = await premise.evaluate((element) => getComputedStyle(element).transitionProperty);
  expect(cardMotion).toContain("filter");
  await expect(premise.locator(".premise__shader")).toHaveCount(1);
  const paragraphDelays = await premise.locator(".premise__copy > p").evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).transitionDelay) || 0),
  );
  expect(paragraphDelays[1]).toBeGreaterThan(paragraphDelays[0]);

  await page.locator("#faq").scrollIntoViewIfNeeded();
  const faqDelays = await page.locator(".faq__list article").evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).transitionDelay) || 0),
  );
  expect(faqDelays).toEqual([...faqDelays].sort((a, b) => a - b));
  expect(new Set(faqDelays).size).toBe(faqDelays.length);
});

test("桌面门槛卡片随文案收短并保持上下对称留白", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light#privacy");
  await expect(page.locator(".premise")).toHaveClass(/is-visible/);
  await expect(page.locator(".premise__layout")).toHaveClass(/is-visible/);
  await page.locator(".premise").evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)),
  );
  const spacing = await page.locator(".premise__layout").evaluate((layout) => {
    const layoutBox = layout.getBoundingClientRect();
    const children = Array.from(layout.children).map((child) => child.getBoundingClientRect());
    return {
      sectionHeight: layout.parentElement!.getBoundingClientRect().height,
      top: Math.min(...children.map((child) => child.top)) - layoutBox.top,
      bottom: layoutBox.bottom - Math.max(...children.map((child) => child.bottom)),
    };
  });
  expect(spacing.sectionHeight).toBeLessThan(330);
  expect(Math.abs(spacing.top - spacing.bottom)).toBeLessThan(2);
});

test("桌面顶栏贴边、首屏使用短渐变遮罩且顶部悬停反馈克制", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  const surface = await page.locator(".site-header").evaluate((header) => {
    const style = getComputedStyle(header, "::before");
    const navLink = getComputedStyle(header.querySelector(".nav-links__content > a")!);
    const veil = getComputedStyle(document.querySelector(".hero__veil")!);
    const box = header.getBoundingClientRect();
    return {
      radius: Number.parseFloat(style.borderBottomLeftRadius),
      veil: veil.backgroundImage,
      textShadow: navLink.textShadow,
      left: box.left,
      right: innerWidth - box.right,
    };
  });
  expect(surface.radius).toBeGreaterThanOrEqual(30);
  expect(surface.veil).toContain("linear-gradient");
  expect(surface.veil).toContain("30%");
  expect(surface.textShadow).toBe("none");
  expect(surface.left).toBe(0);
  expect(surface.right).toBe(0);

  if (await page.evaluate(() => matchMedia("(hover:hover)").matches)) {
    const brand = page.locator(".site-header .brand");
    const characters = brand.locator(".nav-wave__char");
    expect(await characters.count()).toBeGreaterThan(4);
    await brand.hover();
    await page.waitForTimeout(340);
    expect(await characters.evaluateAll((elements) =>
      elements.every((element) => getComputedStyle(element).transform === "none"),
    )).toBe(true);
    expect(await brand.locator(".nav-wave").evaluate((element) =>
      getComputedStyle(element, "::after").transform,
    )).toBe("matrix(1, 0, 0, 1, 0, 0)");
  }
});

test("顶栏按视觉位置从左到右依次模糊进场", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);

  const delays = await page.locator(".brand, .nav-links__content > a:not(.nav-cta), .nav-control, .nav-cta").evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).transitionDelay)),
  );
  expect(delays).toEqual([0, .08, .16, .24, .32, .4, .48, .56]);
});

test("工作方式在桌面留出手机顶部呼吸空间并在平板贴齐通知卡片", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light#how");
  await expect(page.locator(".relay__stage")).toHaveClass(/is-visible/);
  await page.locator(".relay__stage").evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)),
  );
  let stage = await page.locator(".relay__stage").boundingBox();
  let phone = await page.locator(".relay__phone").boundingBox();
  expect(stage).not.toBeNull();
  expect(phone).not.toBeNull();
  expect(phone!.y - stage!.y).toBeGreaterThanOrEqual(18);
  expect(phone!.y - stage!.y).toBeLessThanOrEqual(22);

  await page.setViewportSize({ width: 900, height: 1000 });
  await page.goto("/?theme=light#how");
  await expect(page.locator(".relay__stage")).toHaveClass(/is-visible/);
  await page.locator(".relay__stage").evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)),
  );
  stage = await page.locator(".relay__stage").boundingBox();
  phone = await page.locator(".relay__phone").boundingBox();
  const notice = await page.locator(".notice").boundingBox();
  expect(stage).not.toBeNull();
  expect(phone).not.toBeNull();
  expect(notice).not.toBeNull();
  expect(phone!.y - stage!.y).toBeGreaterThanOrEqual(17);
  const edgeOverlap = phone!.x + phone!.width - notice!.x;
  expect(edgeOverlap).toBeGreaterThanOrEqual(7);
  expect(edgeOverlap).toBeLessThanOrEqual(9);
});

test("首屏按阅读顺序模糊进场且返回时不重复触发", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);

  const hero = page.locator(".hero__copy");
  await expect(hero).toHaveClass(/is-visible/);
  const heroDelays = await page.locator(".hero__copy > .kicker, .hero__copy > h1, .hero__copy > p:not(.kicker), .hero__actions > .button").evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).transitionDelay) || 0),
  );
  expect(heroDelays).toEqual([...heroDelays].sort((a, b) => a - b));
  expect(new Set(heroDelays).size).toBe(heroDelays.length);

  const closingPhoto = page.locator(".closing__photo");
  const closingMotion = await closingPhoto.evaluate((element) => {
    const style = getComputedStyle(element);
    return { properties: style.transitionProperty, durations: style.transitionDuration };
  });
  expect(closingMotion.properties).toContain("filter");
  expect(closingMotion.durations).toContain("1.8s");

  await hero.locator("h1").evaluate((element) =>
    Promise.all(element.getAnimations().map((animation) => animation.finished)),
  );

  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
  await page.locator("#system").scrollIntoViewIfNeeded();
  await expect(hero).toHaveClass(/is-visible/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(hero).toHaveClass(/is-visible/);
  expect(await hero.locator("h1").evaluate((element) =>
    element.getAnimations().some((animation) => animation.playState === "running"),
  )).toBe(false);

  await page.locator(".closing").scrollIntoViewIfNeeded();
  await expect(closingPhoto).toHaveClass(/is-visible/);
  await expect.poll(() => closingPhoto.evaluate((element) =>
    element.getAnimations().some((animation) => animation.playState === "running"),
  )).toBe(true);
});

test("Landing 进场顺序表保持 DOM 次序并使用分层速度", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);

  const orderedItems = await page.locator("[data-reveal-order]").evaluateAll((elements) =>
    elements.map((element) => Number(element.getAttribute("data-reveal-order"))),
  );
  expect(orderedItems).toEqual([...orderedItems].sort((a, b) => a - b));
  expect(new Set(orderedItems).size).toBe(orderedItems.length);

  const revealGroups = await page.locator("[data-reveal-group]").evaluateAll((elements) =>
    elements.map((element: HTMLElement) => ({
      group: Number(element.getAttribute("data-reveal-group")),
      target: element.className,
      itemPhases: [element, ...Array.from(element.querySelectorAll<HTMLElement>("[data-reveal-phase]"))]
        .filter((item) => item.hasAttribute("data-reveal-phase"))
        .map((item) => Number(item.dataset.revealPhase)),
    })),
  );
  expect(revealGroups).toHaveLength(7);
  expect(revealGroups.map(({ group }) => group)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  expect(revealGroups.map(({ itemPhases }) => itemPhases)).toEqual([
    [0],
    [0, .5],
    [0, .5, 2.5, 5.5],
    [0, .5, 5],
    [0, 2, 6, 10],
    [0, .5, 2.5],
    [0, 0, .5],
  ]);

  const timing = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const card = getComputedStyle(document.querySelector(".premise")!);
    const paragraph = getComputedStyle(document.querySelector(".premise__copy p")!);
    const heroButtons = Array.from(document.querySelectorAll(".hero__actions .button"));
    return {
      stagger: root.getPropertyValue("--reveal-stagger").trim(),
      cardFilterDuration: card.transitionDuration.split(", ")[2],
      paragraphFilterDuration: paragraph.transitionDuration.split(", ")[2],
      heroButtonDelays: heroButtons.map((button) => Number.parseFloat(getComputedStyle(button).transitionDelay)),
    };
  });
  expect(["240ms", ".24s"]).toContain(timing.stagger);
  expect(timing.cardFilterDuration).toBe("0.62s");
  expect(timing.paragraphFilterDuration).toBe("1.32s");
  expect(timing.heroButtonDelays).toEqual([.9, 1.2]);
});

test("首屏完成前下一章节不会抢先播放", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  await expect(page.locator(".hero__copy")).toHaveClass(/is-visible/);
  await expect(page.locator(".premise")).not.toHaveClass(/is-visible/);

  await page.locator(".premise").scrollIntoViewIfNeeded();
  await expect(page.locator(".premise")).toHaveClass(/is-visible/);
  await expect(page.locator(".premise__layout")).toHaveClass(/is-visible/);
});

test("章节进场只播放一次且离开视口后保持完成态", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });

  const premise = page.locator(".premise");
  await premise.scrollIntoViewIfNeeded();
  await expect(premise).toHaveClass(/is-visible/);
  await premise.evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)),
  );
  const metrics = await premise.evaluate((element) => ({
    top: element.offsetTop,
    height: element.offsetHeight,
  }));

  await page.evaluate((top) => window.scrollTo(0, top + 80), metrics.top);
  await expect(premise).toHaveClass(/is-visible/);
  const partialRect = await premise.evaluate((element) => element.getBoundingClientRect().toJSON());
  expect(partialRect.top).toBeLessThan(0);
  expect(partialRect.bottom).toBeGreaterThan(0);

  await page.evaluate(({ top, height }) => window.scrollTo(0, top + height + 1), metrics);
  await expect(premise).toHaveClass(/is-visible/);
  await premise.scrollIntoViewIfNeeded();
  expect(await premise.evaluate((element) =>
    element.getAnimations({ subtree: true }).some((animation) => animation.playState === "running"),
  )).toBe(false);
});

test("生成区严格先播放文字序列再启动右侧 mockup", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light#builder");
  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  await expect(page.locator(".builder__copy")).toHaveClass(/is-visible/);
  await expect(page.locator(".builder__product")).toHaveClass(/is-visible/);

  const lags = await page.evaluate(() => ({
    copy: Number.parseFloat((document.querySelector<HTMLElement>(".builder__copy")?.style.getPropertyValue("--queue-lag") ?? "0")),
    product: Number.parseFloat((document.querySelector<HTMLElement>(".builder__product")?.style.getPropertyValue("--queue-lag") ?? "0")),
  }));
  expect(lags.product - lags.copy).toBeGreaterThanOrEqual(1080);
});

test("工作方式悬停模糊背景，生成区无高光，编码光束与浅灰二维码卡片正确", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light#how");
  const stage = page.locator(".relay__stage");
  await stage.scrollIntoViewIfNeeded();
  await expect(stage).toHaveClass(/is-visible/);
  if (await page.evaluate(() => matchMedia("(hover: hover)").matches)) {
    await stage.hover();
    await expect.poll(() => page.locator(".relay__backdrop").evaluate((element) => getComputedStyle(element).filter)).toContain("blur(5px)");
  }

  await page.locator("#builder").scrollIntoViewIfNeeded();
  expect(await page.locator(".builder__product").evaluate((element) => getComputedStyle(element, "::before").content)).toBe("none");

  await page.locator("#system").scrollIntoViewIfNeeded();
  await expect(page.locator(".flow")).toHaveClass(/is-visible/);
  await expect.poll(
    () => page.locator(".flow__input").evaluate((element) =>
      Math.abs(new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)),
    { timeout: 8_000 },
  ).toBeLessThan(0.5);
  const flowMetrics = await page.evaluate(() => {
    const flow = document.querySelector(".flow")!.getBoundingClientRect();
    const beam = document.querySelector(".flow__beam")!.getBoundingClientRect();
    const bark = document.querySelector(".flow__input dl > div:last-child dd")!.getBoundingClientRect();
    const qr = getComputedStyle(document.querySelector(".flow__qr")!);
    const qrImage = getComputedStyle(document.querySelector(".flow__qr img")!);
    return {
      beamLeft: beam.left - flow.left,
      beamRight: flow.right - beam.right,
      beamBelowBark: beam.top > bark.bottom,
      qrBackground: qr.backgroundColor,
      qrBlend: qrImage.mixBlendMode,
    };
  });
  expect(flowMetrics.beamLeft).toBeCloseTo(42, 0);
  expect(flowMetrics.beamRight).toBeCloseTo(0, 0);
  expect(flowMetrics.beamBelowBark).toBe(true);
  expect(flowMetrics.qrBackground).toBe("rgb(236, 239, 233)");
  expect(flowMetrics.qrBlend).toBe("normal");
});

test("首次加载先建立稳定隐藏帧再播放正式模糊动画", async ({ page }) => {
  await page.addInitScript(() => {
    const nativeDecode = HTMLImageElement.prototype.decode;
    HTMLImageElement.prototype.decode = function decodeWithInspectionWindow() {
      const decoded = nativeDecode.call(this).catch(() => undefined);
      if (!this.classList.contains("hero__photo")) return decoded;
      return new Promise<void>((resolve) => window.setTimeout(() => { void decoded.then(() => resolve()); }, 700));
    };
  });
  await page.goto("/?theme=light", { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).toHaveClass(/landing--loading/);
  await expect(page.locator(".hero__copy h1")).toHaveCSS("opacity", "0");
  await expect(page.locator(".hero__copy h1")).toHaveCSS("filter", "blur(9px)");

  await expect(page.locator("body")).not.toHaveClass(/landing--loading/);
  await expect(page.locator(".hero__copy")).toHaveClass(/is-visible/);
  await expect.poll(() => page.locator(".hero__copy h1").evaluate((element) =>
    element.getAnimations().some((animation) => animation.playState === "running"),
  )).toBe(true);
});

test("门槛水波中心在手机、平板和桌面视图中跟随品牌标志", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 900, height: 1000 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/?theme=light#privacy");
    await expect(page.locator(".premise")).toHaveClass(/is-visible/);
    await expect(page.locator(".premise__layout")).toHaveClass(/is-visible/);
    await page.locator(".premise").evaluate((premise) =>
      Promise.all(premise.getAnimations({ subtree: true }).map((animation) => animation.finished)),
    );
    const readAlignment = () => page.locator(".premise__shader").evaluate((canvas) => {
      const element = canvas as HTMLCanvasElement;
      const logo = element.parentElement?.querySelector<HTMLImageElement>(".premise__brand img");
      const gl = element.getContext("webgl");
      const program = gl?.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram | null;
      if (!logo || !gl || !program) return null;
      const canvasRect = element.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const location = gl.getUniformLocation(program, "center");
      const actual = location ? gl.getUniform(program, location) as Float32Array : null;
      if (!actual) return null;
      const expectedX = (logoRect.left + logoRect.width / 2 - canvasRect.left) / canvasRect.width;
      const expectedY = 1 - (logoRect.top + logoRect.height / 2 - canvasRect.top) / canvasRect.height;
      return {
        x: Math.abs(actual[0] - expectedX),
        y: Math.abs(actual[1] - expectedY),
      };
    });
    await expect.poll(async () => {
      const value = await readAlignment();
      return value ? Math.max(value.x, value.y) : Number.POSITIVE_INFINITY;
    }).toBeLessThan(.001);
    const alignment = await readAlignment();
    expect(alignment!.x).toBeLessThan(.001);
    expect(alignment!.y).toBeLessThan(.001);
  }
});

test("Landing Page 的主要版块使用圆角，关键操作使用胶囊按钮", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?theme=light");

  for (const selector of [".hero", ".premise", ".relay", ".builder", ".faq", ".closing"]) {
    const radius = await page.locator(selector).evaluate((element) => {
      const style = getComputedStyle(element);
      return Math.max(
        Number.parseFloat(style.borderTopLeftRadius),
        Number.parseFloat(style.borderBottomLeftRadius),
      );
    });
    expect(radius, selector).toBeGreaterThanOrEqual(20);
  }

  for (const selector of [".hero__actions .button:first-child", ".hero__actions .button--outline", ".builder__copy .button", ".closing .button", ".nav-cta"]) {
    const metrics = await page.locator(selector).evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      radius: Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
    }));
    expect(metrics.radius, selector).toBeGreaterThanOrEqual(metrics.height / 2 - 1);
  }
});

test("Landing Page 的透明 WebGL 在 WebKit 中使用预乘 Alpha 且不污染透明区域", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("webkit"), "该回归针对 WebKit 页面合成器");
  await page.goto("/?theme=light");

  const contexts = await page.locator("canvas").evaluateAll((canvases) => canvases.map((canvas) =>
    (canvas as HTMLCanvasElement).getContext("webgl")?.getContextAttributes(),
  ));
  expect(contexts).toHaveLength(2);
  expect(contexts.every((attributes) => attributes?.alpha && attributes.premultipliedAlpha && !attributes.depth)).toBe(true);

  const premiseCanvas = page.locator(".premise__shader");
  await premiseCanvas.scrollIntoViewIfNeeded();
  await page.locator(".premise").evaluate((element) => Promise.all(
    element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)),
  ));
  const premiseBox = await premiseCanvas.boundingBox();
  const premiseLogoBox = await page.locator(".premise__brand img").boundingBox();
  expect(premiseBox).not.toBeNull();
  expect(premiseLogoBox).not.toBeNull();
  const premiseClip = {
    x: Math.floor(premiseLogoBox!.x + premiseLogoBox!.width / 2 - 4),
    y: Math.floor(premiseLogoBox!.y + premiseLogoBox!.height / 2 - 4),
    width: 8,
    height: 8,
  };
  const premiseWithShader = await page.screenshot({ clip: premiseClip });
  await premiseCanvas.evaluate(async (element) => {
    element.style.visibility = "hidden";
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  const premiseWithoutShader = await page.screenshot({ clip: premiseClip });
  await premiseCanvas.evaluate((element) => { element.style.visibility = ""; });
  expect(averageRgbDifference(premiseWithShader, premiseWithoutShader), ".premise__shader").toBeLessThan(1);

  for (const [selector, xRatio, yRatio] of [
    [".flow__shader", .005, .4],
  ] as const) {
    const canvas = page.locator(selector);
    await canvas.scrollIntoViewIfNeeded();
    const surface = page.locator(".flow");
    await expect(surface).toHaveClass(/is-visible/);
    await surface.evaluate((element) => Promise.all(
      element.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    ));
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const clip = {
      x: Math.floor(box!.x + box!.width * xRatio),
      y: Math.floor(box!.y + box!.height * yRatio),
      width: 8,
      height: 8,
    };
    const withShader = await page.screenshot({ clip });
    await canvas.evaluate(async (element) => {
      element.style.visibility = "hidden";
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    const withoutShader = await page.screenshot({ clip });
    await canvas.evaluate((element) => { element.style.visibility = ""; });
    expect(averageRgbDifference(withShader, withoutShader), selector).toBeLessThan(1);
  }
});

test("Landing Page 暗色主题使用夜间主图，平板宽度的通知卡片位于联系 Mockup 上层", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 1000 });
  await page.goto("/?lang=en&theme=dark");
  await expect(page.locator(".hero__photo--night")).toHaveCSS("opacity", "1");

  const phone = await page.locator(".relay__phone").boundingBox();
  const notice = await page.locator(".notice").boundingBox();
  expect(phone).not.toBeNull();
  expect(notice).not.toBeNull();
  const layers = await page.evaluate(() => ({
    phone: Number.parseInt(getComputedStyle(document.querySelector(".relay__phone")!).zIndex, 10),
    notice: Number.parseInt(getComputedStyle(document.querySelector(".notice")!).zIndex, 10),
  }));
  expect(layers.notice).toBeGreaterThan(layers.phone);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("Landing Page 手机宽度的工作方式构图截断 Mockup 并对齐步骤编号", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?theme=light#how");

  const composition = await page.evaluate(() => ({
    phonePosition: getComputedStyle(document.querySelector(".relay__phone")!).position,
    phoneBottom: getComputedStyle(document.querySelector(".relay__phone")!).bottom,
    stageOverflow: getComputedStyle(document.querySelector(".relay__stage")!).overflow,
    noticeTop: getComputedStyle(document.querySelector(".notice")!).top,
    noticeRight: getComputedStyle(document.querySelector(".notice")!).right,
  }));
  expect(composition).toEqual({
    phonePosition: "absolute",
    phoneBottom: "-150px",
    stageOverflow: "hidden",
    noticeTop: "28px",
    noticeRight: "12px",
  });

  const numberMetrics = await page.locator(".relay__steps > li > span").evaluateAll((elements) =>
    elements.map((element) => ({ x: element.getBoundingClientRect().x, size: Number.parseFloat(getComputedStyle(element).fontSize) })),
  );
  expect(Math.max(...numberMetrics.map(({ x }) => x)) - Math.min(...numberMetrics.map(({ x }) => x))).toBeLessThan(1);
  expect(Math.min(...numberMetrics.map(({ size }) => size))).toBeGreaterThanOrEqual(18);
  await expect(page.getByText("通知失败的情况下扫码者可以向车主拨号")).toBeVisible();
});

test("自定义页脚信息由构建变量控制且两页样式一致", async ({ page }) => {
  const expected = process.env.VITE_FOOTER_TEXT?.trim() ?? "";

  for (const path of ["/m/", "/create/"]) {
    await page.goto(path);
    const record = page.locator(".site-record");
    if (expected) {
      await expect(record).toHaveText(expected);
      await expect(record).toHaveCSS("position", "absolute");
      await expect(record).toHaveCSS("text-align", "center");
      await expect(record).toHaveCSS("font-size", "9px");
      if (path === "/create/") {
        const reservedBottomSpace = await page.locator(".creator-page").evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).paddingBottom),
        );
        expect(reservedBottomSpace).toBeGreaterThanOrEqual(24);
      }
    } else {
      await expect(record).toHaveCount(0);
    }
  }
});

test("Landing Page 未配置底部变量时不显示默认说明", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-footer-text]")).toBeHidden();
  await expect(page.getByText("一个无需后端的开源挪车码", { exact: true })).toHaveCount(0);
  const footer = page.locator(".site-footer");
  await expect(footer.getByRole("link", { name: "联系页面" })).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "README" })).toHaveCount(0);
  await expect(footer.getByRole("link", { name: "GitHub" })).toHaveCount(1);
});

test("生成按钮位于预览标题和二维码框之间", async ({ page }) => {
  await page.goto("/create/");
  await expect(page.locator(".preview-title h2")).toHaveText("生成挪车码");
  const order = await page.locator(".preview-panel > *").evaluateAll((elements) =>
    elements.slice(0, 3).map((element) => element.className),
  );
  expect(order).toEqual(["preview-title", "generate-button", "qr-frame"]);
});

test("生成后仅保留下载图片、复制链接和分享图片操作，不显示生成提示", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => localStorage.setItem("copied-link", value),
      },
    });
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: (data: ShareData) => Boolean(data.files?.length),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        const shares = JSON.parse(localStorage.getItem("shares") ?? "[]") as unknown[];
        shares.push({ file: data.files?.[0]?.name ?? null, url: data.url ?? null });
        localStorage.setItem("shares", JSON.stringify(shares));
      },
    });
  });
  await page.goto("/create/");
  await page.getByRole("switch", { name: "启用通知渠道" }).click();
  await page.getByLabel("车牌号").fill("浙A12345");
  await page.getByLabel("紧急联系电话").fill("13900000000");
  await page.getByRole("button", { name: "生成二维码" }).click();

  await expect(page.getByAltText("挪车二维码")).toBeVisible();
  await expect(page.locator(".creator-status")).toHaveCount(0);
  const labels = await page.locator(".preview-actions button span:last-child").allTextContents();
  expect(labels).toEqual(["下载图片", "复制链接", "分享"]);
  await expect(page.getByRole("button", { name: "SVG" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "打印" })).toHaveCount(0);

  const copyLink = page.locator('[data-action="copy"]');
  const generatedUrl = await copyLink.getAttribute("data-url");
  expect(new URL(generatedUrl!).pathname).toBe("/m/");
  expect(new URL(generatedUrl!).hash).toMatch(/^#M1\./);
  await copyLink.click();
  await expect(copyLink).toHaveAttribute("aria-label", "已复制！");
  await expect(copyLink).toContainText("已复制！");
  await expect(copyLink.locator(".symbol")).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem("copied-link"))).toBe(generatedUrl);
  await expect(copyLink).toHaveAttribute("aria-label", "复制链接", { timeout: 1500 });
  await expect(copyLink).toContainText("复制链接");

  await page.getByRole("button", { name: "分享" }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("shares") ?? "[]").length)).toBe(1);
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem("shares"))) ?? "[]")).toEqual([
    { file: "MoveMoCar-浙A12345.png", url: null },
  ]);
});

test("生成器触屏按钮复用用户页的按下与点击反馈", async ({ page }) => {
  await page.goto("/create/");
  const addButton = page.getByRole("button", { name: "添加" });

  await addButton.dispatchEvent("pointerdown", { pointerType: "touch" });
  await expect(addButton).toHaveClass(/button--pressed/);
  await addButton.dispatchEvent("pointerup", { pointerType: "touch" });
  await expect(addButton).not.toHaveClass(/button--pressed/);

  await addButton.click();
  const provider = page.getByRole("button", { name: /^Bark/ });
  await provider.click();
  const tutorial = page.getByRole("button", { name: "配置教程" });
  await tutorial.dispatchEvent("pointerdown", { pointerType: "touch" });
  await expect(tutorial).toHaveClass(/button--pressed/);
  await tutorial.dispatchEvent("pointerup", { pointerType: "touch" });
  await expect(tutorial).not.toHaveClass(/button--pressed/);
});

test("生成器使用 Outlined 图标并生成可用的挪车码链接", async ({ page }) => {
  await page.route("https://api.day.app/push", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    expect(payload).toMatchObject({
      device_key: "test-bark-key",
      title: "挪车请求·测试车辆",
    });
    await route.fulfill({ json: { code: 200 } });
  });

  await page.goto("/create/");
  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  await expect(page.getByRole("link", { name: "打开 Bark 官网" })).toHaveCount(0);
  await page.getByRole("button", { name: "配置教程" }).click();
  await expect(page.getByRole("dialog", { name: "Bark 配置教程" })).toBeVisible();
  const appStoreLink = page.getByRole("link", { name: "前往 App Store" });
  await expect(appStoreLink).toHaveAttribute(
    "href",
    /id1403753865/,
  );
  await expect(appStoreLink).toHaveCSS("display", "block");
  await expect(page.getByRole("link", { name: "前往官网" })).toHaveAttribute(
    "href",
    "https://bark.day.app/",
  );
  const barkSteps = page.getByRole("dialog", { name: "Bark 配置教程" }).getByRole("listitem");
  await expect(barkSteps.nth(0)).toContainText("iOS 用户请从 App Store 搜索安装 Bark");
  await expect(barkSteps.nth(1)).toHaveText("打开 Bark，进入“服务器”页面，完成设备注册");
  await expect(barkSteps.nth(2).locator("strong")).toHaveText("原样");
  await expect(barkSteps.nth(2)).toContainText("粘贴到本页面配置框");
  await page.getByRole("button", { name: "关闭" }).click();
  await page.getByLabel("Bark 地址").fill("test-bark-key");
  await page.getByRole("button", { name: "测试" }).click();

  await expect(page.getByText("测试成功")).toBeVisible();
  await expect(page.locator(".channel-test-hint")).toHaveText("");
  await page.getByLabel("车牌号").fill("浙a12345");
  await expect(page.getByLabel("车牌号")).toHaveValue("浙a12345");
  await page.getByLabel("紧急联系电话").fill("139-0000-0000");
  await expect(page.getByLabel("紧急联系电话")).toHaveValue("13900000000");
  const generate = page.getByRole("button", { name: "生成二维码" });
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(page.getByAltText("挪车二维码")).toBeVisible();

  const generatedUrl = await page.getByRole("button", { name: "复制链接" }).getAttribute("data-url");
  const url = new URL(generatedUrl ?? "");
  expect(url.pathname).toBe("/m/");
  expect(url.search).toBe("");

  expect(url.hash).toMatch(/^#M1\.[A-Z2-7]+\.[UD][A-Z2-7]+$/);
  expect(decodeMoveCode(url.hash)).toEqual({
    v: 1,
    car: "浙A12345",
    num: "13900000000",
    pushes: [{ type: "bark", key: "test-bark-key", server: undefined }],
  });
  const qr = QRCode.create(generatedUrl ?? "", { errorCorrectionLevel: "M" });
  expect(qr.version).toBeLessThanOrEqual(6);
});

test("三个内置通知渠道使用指定图标", async ({ page }) => {
  await page.goto("/create/");
  await page.getByRole("button", { name: "添加" }).click();

  const iconUrl = async (provider: RegExp) => {
    const style = await page.getByRole("button", { name: provider }).locator(".symbol").getAttribute("style");
    return style ?? "";
  };
  const bark = await iconUrl(/^Bark/);
  const wxpusher = await iconUrl(/^WxPusher/);
  const ntfy = await iconUrl(/^ntfy/);
  expect(bark).toContain("viewBox=%270%200%201000%201000%27");
  expect(new Set([bark, wxpusher, ntfy]).size).toBe(3);
});

test("Bark 完整地址只提取第一段设备 Key 并忽略示例标题和正文", async ({ page }) => {
  const payloads: Record<string, unknown>[] = [];
  await page.route("https://api.day.app/push", async (route) => {
    payloads.push(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ json: { code: 200 } });
  });
  await page.goto("/create/");
  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  await page
    .getByLabel("Bark 地址")
    .fill("https://api.day.app/device-test-key/推送标题/这里改成你自己的推送内容");
  await page.getByRole("button", { name: "测试" }).click();

  await expect(page.getByText("测试成功")).toBeVisible();
  expect(payloads[0]?.device_key).toBe("device-test-key");
  expect(payloads[0]?.title).toBe("挪车请求·测试车辆");
  expect(payloads[0]?.body).toBe("来自：13800138000\n留言：这是一条测试消息");

  await page
    .getByLabel("Bark 地址")
    .fill("https://api.day.app/another-device-key/这里改成你自己的推送内容");
  await page.getByRole("button", { name: "测试" }).click();
  await expect.poll(() => payloads.length).toBe(2);
  expect(payloads[1]?.device_key).toBe("another-device-key");
});

test("车牌输入不受限制，结果去空格、转大写并保留十三个字符", async ({ page }) => {
  await page.goto("/create/");
  const plate = page.getByLabel("车牌号");

  await plate.fill("粤 b - 12345!!!🙂LONG");
  await expect(plate).toHaveValue("粤 b - 12345!!!🙂LONG");
  await expect(page.locator(".preview-plate")).toHaveText("粤B-12345!!!🙂L");
  await plate.blur();
  await expect(plate.locator("xpath=..")).not.toHaveClass(/field--invalid/);

  await plate.fill("      ");
  await expect(page.locator(".preview-plate")).toHaveText("车牌号");
});

test("生成器最多允许添加五个通知渠道", async ({ page }) => {
  await page.goto("/create/");

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole("button", { name: "添加" }).click();
    const picker = page.getByRole("dialog", { name: "添加通知渠道" });
    await expect(picker).toBeVisible();
    await picker.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    await page.getByRole("button", { name: /^ntfy/ }).click();
    await expect(picker).toHaveCount(0);
  }

  const addChannel = page.getByRole("button", { name: "已达通知渠道数量上限" });
  await expect(addChannel).toBeDisabled();
  await expect(page.locator(".channel-card")).toHaveCount(5);
});

test("关闭通知渠道后折叠配置并保留草稿，可生成仅电话联系的二维码", async ({ page }) => {
  await page.goto("/create/");
  await page.getByLabel("车牌号").fill("浙A12345");
  await page.getByLabel("紧急联系电话").fill("13900000000");
  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  await page.getByLabel("Bark 地址").fill("preserved-bark-key");

  const toggle = page.getByRole("switch", { name: "启用通知渠道" });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: "添加" })).toBeVisible();
  await toggle.click();

  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.locator(".section-icon--disabled")).toBeVisible();
  await expect(page.locator(".channel-settings-shell")).toHaveClass(/channel-settings-shell--closing/);
  const closingMotion = await page.locator(".channel-settings-shell").evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.animationDuration, style.animationTimingFunction];
  });
  await expect(page.locator(".channel-card")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "添加" })).toBeHidden();

  const generate = page.getByRole("button", { name: "生成二维码" });
  await expect(generate).toBeEnabled();
  await generate.click();
  const generatedUrl = await page.getByRole("button", { name: "复制链接" }).getAttribute("data-url");
  expect(decodeMoveCode(new URL(generatedUrl ?? "").hash)).toEqual({
    v: 1,
    car: "浙A12345",
    num: "13900000000",
    pushes: [],
  });

  await toggle.click();
  await expect(page.locator(".channel-settings-shell")).toHaveClass(/channel-settings-shell--opening/);
  const openingMotion = await page.locator(".channel-settings-shell").evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.animationDuration, style.animationTimingFunction];
  });
  expect(closingMotion).toEqual(openingMotion);
  await expect(page.getByLabel("Bark 地址")).toHaveValue("preserved-bark-key");
  await expect(page.getByRole("button", { name: "添加" })).toBeVisible();
});

test("ntfy 主题由生成器托管并可复制或随机更换", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => localStorage.setItem("copied-topic", value),
      },
    });
  });
  await page.goto("/create/");
  await page.route("https://ntfy.sh/", async (route) => {
    const payload = route.request().postDataJSON() as { topic: string };
    await route.fulfill({ json: { id: "test-message", topic: payload.topic } });
  });
  await page.getByLabel("车牌号").fill("浙A12345");
  await page.getByLabel("紧急联系电话").fill("13900000000");
  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^ntfy/ }).click();

  const topic = page.getByRole("textbox", { name: "主题", exact: true });
  await expect(topic).toHaveAttribute("readonly", "");
  const initialTopic = await topic.inputValue();
  expect(initialTopic).toMatch(/^mmc_[a-z0-9]+$/);
  expect(initialTopic.length).toBeLessThanOrEqual(15);
  await expect(topic).toHaveCSS("text-overflow", "ellipsis");

  const copyTopic = page.locator('[data-action="copy-topic"]');
  await expect(copyTopic).toHaveAttribute("aria-label", "复制主题");
  const refreshTopic = page.getByRole("button", { name: "换一个主题" });
  const subscribeTopic = page.getByRole("link", { name: "直接订阅" });
  await expect(subscribeTopic.locator(".symbol")).toHaveCount(0);
  await expect(refreshTopic).toHaveText("");
  await expect(subscribeTopic).toHaveAttribute(
    "href",
    `ntfy://ntfy.sh/${initialTopic}`,
  );
  const controlTops = await Promise.all(
    [copyTopic, refreshTopic, subscribeTopic].map(async (control) => (await control.boundingBox())?.y),
  );
  const numericTops = controlTops.filter((value): value is number => value !== undefined);
  expect(Math.max(...numericTops) - Math.min(...numericTops)).toBeLessThan(1);
  expect(
    await topic.locator("xpath=..").evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);

  await copyTopic.click();
  expect(await page.evaluate(() => localStorage.getItem("copied-topic"))).toBe(initialTopic);
  await expect(copyTopic).toHaveAttribute("aria-label", "已复制！");
  await expect(copyTopic).toHaveText("");
  await expect(copyTopic).toHaveCSS("width", "45px");
  await expect(copyTopic).toHaveAttribute("aria-label", "复制主题", { timeout: 1500 });

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => Promise.reject(new Error("denied")) },
    });
  });
  await page.getByRole("button", { name: "复制主题" }).click();
  await expect(page.locator(".creator-status")).toHaveCount(0);

  await refreshTopic.click();
  const refreshedTopic = await topic.inputValue();
  expect(refreshedTopic).toMatch(/^mmc_[a-z0-9]+$/);
  expect(refreshedTopic).not.toBe(initialTopic);

  await page.getByRole("button", { name: "测试" }).click();
  await expect(page.getByText("测试成功")).toBeVisible();
  await page.getByRole("button", { name: "生成二维码" }).click();
  const generatedUrl = await page.getByRole("button", { name: "复制链接" }).getAttribute("data-url");
  expect(decodeMoveCode(new URL(generatedUrl ?? "").hash).pushes).toEqual([
    { type: "ntfy", topic: refreshedTopic, server: undefined },
  ]);
});

test("渠道内容在测试期间改变时不会继承旧测试的成功状态", async ({ page }) => {
  let releaseResponse = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  let markRequested = () => {};
  const requestStarted = new Promise<void>((resolve) => {
    markRequested = resolve;
  });
  await page.route("https://api.day.app/push", async (route) => {
    markRequested();
    await responseGate;
    await route.fulfill({ json: { code: 200 } });
  });

  await page.goto("/create/");
  await page.getByLabel("车牌号").fill("浙A12345");
  await page.getByLabel("紧急联系电话").fill("13900000000");
  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  const barkAddress = page.getByLabel("Bark 地址");
  await barkAddress.fill("old-key");
  await page.getByRole("button", { name: "测试" }).click();
  await requestStarted;
  await barkAddress.fill("new-key");
  releaseResponse();

  await expect(page.getByText("未测试")).toBeVisible();
  await expect(
    page.getByText("请在生成二维码前先完成通知渠道测试"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "生成二维码" })).toBeDisabled();
});

test("渠道卡片和二维码只在首次出现时播放动画", async ({ page }) => {
  await page.route("https://api.day.app/push", (route) => route.fulfill({ json: { code: 200 } }));
  await page.goto("/create/");
  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  const card = page.locator(".channel-card");
  await expect(card).toHaveClass(/channel-card--entering/);
  await page.getByLabel("Bark 地址").fill("test-key");
  await page.getByRole("button", { name: "测试" }).click();
  await expect(page.getByText("测试成功")).toBeVisible();
  await page.getByLabel("车牌号").fill("浙A12345");
  await page.getByLabel("紧急联系电话").fill("13900000000");
  await page.getByRole("button", { name: "生成二维码" }).click();
  await expect(page.locator(".qr-frame")).toHaveClass(/qr-frame--entering/);

  await page.getByRole("button", { name: "配置教程" }).click();
  await expect(page.getByRole("dialog", { name: "Bark 配置教程" })).toBeVisible();
  await expect(page.locator(".channel-card")).not.toHaveClass(/channel-card--entering/);
  await expect(page.locator(".qr-frame")).not.toHaveClass(/qr-frame--entering/);
  await page.getByRole("button", { name: "关闭" }).click();
  await expect(page.locator(".channel-card")).not.toHaveClass(/channel-card--entering/);
  await expect(page.locator(".qr-frame")).not.toHaveClass(/qr-frame--entering/);
});

test("添加通知渠道弹窗可以通过关闭按钮关闭", async ({ page }) => {
  await page.goto("/create/");
  await page.getByRole("button", { name: "添加" }).click();
  await expect(page.getByRole("dialog", { name: "添加通知渠道" })).toBeVisible();
  await expect(page.getByText("iOS")).toBeVisible();
  await expect(page.getByText("大陆安卓与鸿蒙")).toBeVisible();
  await expect(page.getByText("Android")).toBeVisible();
  await expect(page.getByText("自定义")).toBeVisible();
  const layer = page.locator(".modal-layer");
  const closeButton = page.getByRole("button", { name: "关闭" });
  const closeShape = await closeButton.evaluate((button) => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height, radius: getComputedStyle(button).borderRadius };
  });
  expect(Math.abs(closeShape.width - closeShape.height)).toBeLessThan(0.01);
  expect(closeShape.radius).toBe("999px");
  await closeButton.click();
  await expect(layer).toHaveClass(/modal-layer--closing/);
  await expect(page.getByRole("dialog", { name: "添加通知渠道" })).toHaveCount(0);
});

test("通知渠道选项悬停仅加深且不显示发光边框", async ({ page }) => {
  await page.goto("/create/");
  await page.getByRole("button", { name: "添加" }).click();
  const option = page.getByRole("button", { name: /^Bark/ });
  await option.hover();

  await expect(option).toHaveCSS("filter", "brightness(0.96)");
  await expect(option).toHaveCSS("box-shadow", "none");
  await expect(option).toHaveCSS("border-color", "rgb(215, 215, 215)");
});

test("WxPusher 和 ntfy 渠道提供对应的配置教程", async ({ page }) => {
  await page.goto("/create/");

  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^WxPusher/ }).click();
  await page.getByRole("button", { name: "配置教程" }).click();
  const wxpusherTutorial = page.getByRole("dialog", { name: "WxPusher 配置教程" });
  await expect(wxpusherTutorial).toBeVisible();
  await expect(wxpusherTutorial.getByText("中国大陆安卓和鸿蒙用户")).toBeVisible();
  await expect(wxpusherTutorial.getByRole("link", { name: "前往官网" })).toHaveAttribute(
    "href",
    "https://wxpusher.zjiecode.com/",
  );
  await expect(wxpusherTutorial.getByRole("link", { name: "前往官网" })).toHaveCSS("display", "block");
  await expect(wxpusherTutorial.getByText(/找到 SPT/)).toBeVisible();
  await wxpusherTutorial.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^ntfy/ }).click();
  const ntfyCard = page.locator(".channel-card").filter({ hasText: "ntfy" });
  await ntfyCard.getByRole("button", { name: "配置教程" }).click();
  const ntfyTutorial = page.getByRole("dialog", { name: "ntfy 配置教程" });
  await expect(ntfyTutorial).toBeVisible();
  await expect(ntfyTutorial.getByRole("link", { name: "前往官网" })).toHaveAttribute(
    "href",
    "https://ntfy.sh/",
  );
  await expect(ntfyTutorial.getByRole("link", { name: "前往官网" })).toHaveCSS("display", "block");
  await expect(ntfyTutorial.getByText(/“直接订阅”唤起应用/)).toBeVisible();
  await expect(ntfyTutorial.getByText(/mmc_ 开头主题/)).toBeVisible();
  await expect(ntfyTutorial.getByText(/低功耗模式下仍实时推送/)).toBeVisible();
  await expect(ntfyTutorial.getByRole("listitem")).toHaveCount(5);
  await expect(ntfyTutorial.getByRole("listitem").nth(4)).toHaveText(/测试/);
});

test("生成器原地切换语言并保留当前配置", async ({ page }) => {
  await page.goto("/create/?lang=zh-CN");
  await page.getByLabel("车牌号").fill("浙A12345");
  await page.getByLabel("紧急联系电话").fill("13800138000");
  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  await page.getByLabel("Bark 地址").fill("test-key");

  await page.getByRole("button", { name: "选择语言" }).click();
  await page.getByRole("radio", { name: "English" }).click();

  await expect(page).not.toHaveURL(/lang=/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Generate MoveMoCar code", exact: true }).first()).toBeVisible();
  await expect(page.getByLabel("License plate")).toHaveValue("浙A12345");
  await expect(page.getByLabel("Emergency contact number")).toHaveValue("13800138000");
  await expect(page.getByLabel("Bark address")).toHaveValue("test-key");
});

test("窄屏长语言下标题居中且通知渠道卡片不横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/create/?lang=fr");

  const heading = page.locator(".creator-hero h1");
  await expect(heading).toHaveCSS("text-align", "center");

  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: /^WxPusher/ }).click();

  const layout = await page.locator(".channel-card").evaluate((card) => {
    const rect = card.getBoundingClientRect();
    const testButton = card.querySelector<HTMLElement>(".test-button")!;
    const tutorialButton = card.querySelector<HTMLElement>(".tutorial-button")!;
    return {
      cardLeft: rect.left,
      cardRight: rect.right,
      viewportWidth: document.documentElement.clientWidth,
      documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      testButtonHeight: testButton.getBoundingClientRect().height,
      tutorialFits: tutorialButton.scrollWidth <= tutorialButton.clientWidth,
    };
  });

  expect(layout.cardLeft).toBeGreaterThanOrEqual(0);
  expect(layout.cardRight).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.documentOverflow).toBeLessThanOrEqual(0);
  expect(layout.tutorialFits).toBe(true);
  expect(layout.testButtonHeight).toBeLessThanOrEqual(40);
});

test("小屏弹窗保留对称边距且只滚动正文", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/create/");

  await page.getByRole("button", { name: "添加" }).click();
  await page.getByRole("button", { name: /^ntfy/ }).click();
  await page.getByRole("button", { name: "配置教程" }).click();

  const tutorial = page.getByRole("dialog", { name: "ntfy 配置教程" });
  await tutorial.evaluate((card) => Promise.all(card.getAnimations().map((animation) => animation.finished)));
  const tutorialLayout = await tutorial.evaluate((card) => {
    const rect = card.getBoundingClientRect();
    const content = card.querySelector<HTMLElement>(".tutorial-steps")!;
    return {
      top: rect.top,
      bottomGap: document.documentElement.clientHeight - rect.bottom,
      contentScrollable: content.scrollHeight > content.clientHeight,
      cardFits: rect.height <= document.documentElement.clientHeight - 32,
    };
  });
  expect(tutorialLayout.top).toBeGreaterThanOrEqual(15);
  expect(Math.abs(tutorialLayout.top - tutorialLayout.bottomGap)).toBeLessThanOrEqual(1);
  expect(tutorialLayout.cardFits).toBe(true);
  expect(tutorialLayout.contentScrollable).toBe(true);
  await tutorial.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "选择语言" }).click();
  const languageDialog = page.getByRole("dialog", { name: "选择语言" });
  await languageDialog.evaluate((card) => Promise.all(card.getAnimations().map((animation) => animation.finished)));
  const languageLayout = await languageDialog.evaluate((card) => {
    const rect = card.getBoundingClientRect();
    const content = card.querySelector<HTMLElement>(".language-options")!;
    return {
      top: rect.top,
      bottomGap: document.documentElement.clientHeight - rect.bottom,
      contentScrollable: content.scrollHeight > content.clientHeight,
    };
  });
  expect(Math.abs(languageLayout.top - languageLayout.bottomGap)).toBeLessThanOrEqual(1);
  expect(languageLayout.contentScrollable).toBe(true);
});

test("窄屏长语言测试时优先保留按钮与正常旋转的加载图标", async ({ page }) => {
  let releaseResponse = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("https://api.day.app/push", async (route) => {
    await responseGate;
    await route.fulfill({ json: { code: 200 } });
  });
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/create/?lang=fr");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  await page.getByLabel("Adresse Bark").fill("test-key");
  await page.getByRole("button", { name: "Tester" }).click();

  const testButton = page.getByRole("button", { name: "Test…" });
  await expect(testButton).toBeVisible();
  const loadingLayout = await page.locator(".channel-test-row").evaluate((row) => {
    const hint = row.querySelector<HTMLElement>(".channel-test-hint")!.getBoundingClientRect();
    const button = row.querySelector<HTMLElement>(".test-button")!.getBoundingClientRect();
    const spinner = row.querySelector<HTMLElement>(".spinner")!;
    const spinnerRect = spinner.getBoundingClientRect();
    return {
      separated: hint.right <= button.left,
      buttonInside: button.right <= row.getBoundingClientRect().right,
      spinnerWidth: spinnerRect.width,
      spinnerHeight: spinnerRect.height,
      animationName: getComputedStyle(spinner).animationName,
    };
  });
  expect(loadingLayout.separated).toBe(true);
  expect(loadingLayout.buttonInside).toBe(true);
  expect(Math.abs(loadingLayout.spinnerWidth - loadingLayout.spinnerHeight)).toBeLessThan(0.01);
  expect(loadingLayout.spinnerWidth).toBeGreaterThanOrEqual(18);
  expect(loadingLayout.animationName).toBe("spin");

  releaseResponse();
  await expect(page.getByText("Réussi", { exact: true })).toBeVisible();
});

test("拉丁字母语言的 Bark 教程加粗片段前后保留单词空格", async ({ page }) => {
  await page.goto("/create/?lang=fr");
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByRole("button", { name: /^Bark/ }).click();
  await page.getByRole("button", { name: "Guide" }).click();

  const emphasizedStep = page
    .getByRole("dialog", { name: "Guide de configuration de Bark" })
    .getByRole("listitem")
    .nth(2);
  await expect(emphasizedStep).toContainText("contenu tel quel dans le champ");
});

test.describe("生成器自动深色模式", () => {
  test.use({ colorScheme: "dark" });

  test("使用中性深色大色块", async ({ page }) => {
    await page.goto("/create/");
    const colors = await page.locator(".creator-page").evaluate((element) => ({
      page: getComputedStyle(element).backgroundColor,
      hero: getComputedStyle(document.querySelector<HTMLElement>(".creator-hero")!).backgroundColor,
      heroIconBackground: getComputedStyle(document.querySelector<HTMLElement>(".hero-symbol")!).backgroundColor,
      heroIconColor: getComputedStyle(document.querySelector<HTMLElement>(".hero-symbol")!).color,
      placeholder: getComputedStyle(document.querySelector<HTMLElement>(".qr-frame")!).backgroundColor,
    }));

    expect(colors).toEqual({
      page: "rgb(27, 27, 27)",
      hero: "rgb(17, 17, 17)",
      heroIconBackground: "rgb(38, 62, 40)",
      heroIconColor: "rgb(154, 229, 158)",
      placeholder: "rgb(36, 36, 36)",
    });
  });

  test("通知开关关闭后仍保持可操作层级且图标完全置灰", async ({ page }) => {
    await page.goto("/create/");
    const toggle = page.getByRole("switch", { name: "启用通知渠道" });
    await toggle.click();
    await toggle.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    const styles = await toggle.evaluate((element) => {
      const thumb = element.querySelector<HTMLElement>("span")!;
      const icon = document.querySelector<HTMLElement>(".section-icon--disabled")!;
      return {
        baseTrack: getComputedStyle(document.documentElement)
          .getPropertyValue("--switch-off")
          .trim(),
        track: getComputedStyle(element).backgroundColor,
        thumb: getComputedStyle(thumb).backgroundColor,
        cursor: getComputedStyle(element).cursor,
        marginRight: getComputedStyle(element).marginRight,
        iconBackground: getComputedStyle(icon).backgroundColor,
        iconColor: getComputedStyle(icon).color,
      };
    });
    expect(styles).toEqual({
      baseTrack: "#626262",
      track: "rgb(114, 114, 114)",
      thumb: "rgb(222, 222, 222)",
      cursor: "pointer",
      marginRight: "8px",
      iconBackground: "rgb(58, 58, 58)",
      iconColor: "rgb(154, 154, 154)",
    });
  });
});
