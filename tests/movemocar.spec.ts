import { expect, test, type Page, type Route } from "@playwright/test";
import { encode, rfc8949EncodeOptions } from "cborg";
import { encodeMoveCode } from "../src/qr-config";
import type { UrlMoveMoCarConfig } from "../src/config";
import { SUCCESS_GRACE_PERIOD_MS } from "../src/notifications";

const testConfig = {
  ownerPhone: "13000000000",
  notification: {
    transport: "http",
    url: "https://notify.example.test/movemocar",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    bodyTemplate: {
      title: "{{vehicleTitle}}",
      body: "来自：{{phone}}\n留言：{{message}}",
      url: "tel:{{phone}}",
    },
  },
};

const mockConfig = (page: Page) =>
  page.route("**/movemocar.config.json", (route) =>
    route.fulfill({ json: testConfig }),
  );

const mockWebhook = (
  page: Page,
  handler: (route: Route) => void | Promise<void> = (route) =>
    route.fulfill({ json: { code: 200 } }),
) => page.route(testConfig.notification.url, handler);

const encodeUrlConfig = (value: unknown) =>
  encodeMoveCode(value as UrlMoveMoCarConfig);

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const encodeBase32 = (bytes: Uint8Array) => {
  let output = "";
  let buffer = 0;
  let bitCount = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      output += base32Alphabet[(buffer >>> (bitCount - 5)) & 31];
      bitCount -= 5;
    }
    buffer &= (1 << bitCount) - 1;
  }
  if (bitCount > 0) output += base32Alphabet[(buffer << (5 - bitCount)) & 31];
  return output;
};

const packPhone = (phone: string) =>
  Uint8Array.from(
    Array.from({ length: Math.ceil(phone.length / 2) }, (_, index) => {
      const high = Number(phone[index * 2]);
      const low = index * 2 + 1 < phone.length ? Number(phone[index * 2 + 1]) : 15;
      return (high << 4) | low;
    }),
  );

const encodeUncheckedM1 = (phone: string, car: string, channels: unknown[]) =>
  `M1.${encodeBase32(encode([packPhone(phone), car], rfc8949EncodeOptions))}.U${encodeBase32(encode(channels, rfc8949EncodeOptions))}`;

test("本地预览链接覆盖用户页的全部关键视觉状态", async ({ page }) => {
  await page.goto("/m/?preview=ready");
  await expect(page.getByLabel("您的电话号码")).toHaveValue("13800138000");
  await expect(page.getByRole("button", { name: "通知车主" })).toBeEnabled();

  await page.goto("/m/?preview=loading");
  await expect(page.getByRole("button", { name: "正在通知车主" })).toBeVisible();
  await expect(page.locator(".submit-button__spinner")).toBeVisible();

  await page.goto("/m/?preview=success");
  await expect(page.getByRole("dialog", { name: "发送成功" })).toBeVisible();

  await page.goto("/m/?preview=sent");
  await expect(page.getByRole("button", { name: "紧急情况？" })).toBeVisible();

  await page.goto("/m/?preview=emergency");
  await expect(page.getByRole("dialog", { name: "紧急情况？" })).toBeVisible();

  await page.goto("/m/?preview=failure");
  await expect(page.getByRole("dialog", { name: "通知失败" })).toBeVisible();

  await page.goto("/m/?preview=damaged");
  const damagedWithPhone = page.getByRole("dialog", { name: "挪车码已损坏" });
  await expect(damagedWithPhone).toBeVisible();
  await expect(damagedWithPhone.getByRole("button", { name: "直接呼叫车主" })).toBeVisible();
  await expect(damagedWithPhone.getByRole("button", { name: "取消" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(damagedWithPhone).toBeVisible();
  await page.locator(".dialog-layer").click({ position: { x: 2, y: 2 } });
  await expect(damagedWithPhone).toBeVisible();
  await damagedWithPhone.getByRole("button", { name: "直接呼叫车主" }).click();
  await expect(damagedWithPhone).toBeVisible();

  await page.goto("/m/?preview=damaged-empty");
  const damagedWithoutPhone = page.getByRole("dialog", { name: "挪车码损坏" });
  await expect(damagedWithoutPhone.getByRole("button", { name: "直接呼叫车主" })).toHaveCount(0);
  await expect(damagedWithoutPhone.getByRole("button", { name: "取消" })).toHaveCount(0);
});

test("公开演示页使用固定备用号码并模拟通知成功", async ({ page }) => {
  await page.route("**/*", async (route) => {
    if (route.request().resourceType() === "fetch") {
      throw new Error(`演示页不应发送网络请求：${route.request().url()}`);
    }
    await route.continue();
  });

  await page.goto("/m/demo/");
  await page.getByLabel("您的电话号码").fill("13800138000");
  await page.getByLabel("留言").fill("演示留言");
  await page.getByRole("button", { name: "通知车主" }).click();

  const simulatedNotification = page.locator(".demo-notification");
  await expect(simulatedNotification).toContainText("挪车请求·DEMO");
  await expect(simulatedNotification).toContainText("来自：13800138000");
  await expect(simulatedNotification).toContainText("留言：演示留言");
  await expect(page.getByRole("dialog", { name: "发送成功" })).toBeVisible();
  await page.getByRole("button", { name: "确认" }).click();
  await expect(page.getByRole("button", { name: "紧急情况？" })).toBeVisible();
});

test("生产构建中的用户页图标指向可访问的单层 assets 路径", async ({ page, request }) => {
  const readMaskUrl = (selector: string) =>
    page.locator(selector).evaluate((element) => {
      const maskImage = getComputedStyle(element).webkitMaskImage;
      return /^url\(["']?(.*?)["']?\)$/.exec(maskImage)?.[1] ?? "";
    });

  await page.goto("/m/?preview=success");
  const carUrl = await readMaskUrl(".hero__glyph");
  const checkUrl = await readMaskUrl(".dialog-icon__glyph");

  await page.goto("/m/?preview=emergency");
  const callUrl = await readMaskUrl(".dialog-icon__glyph");

  for (const url of [carUrl, checkUrl, callUrl]) {
    expect(url).toMatch(/\/assets\/(car-crash|check|call)\.svg$/);
    expect(url).not.toContain("/assets/assets/");
    expect((await request.get(url)).status()).toBe(200);
  }
});

test("用户页可关闭弹窗播放退出动画后再移除", async ({ page }) => {
  await page.goto("/m/?preview=emergency");
  const layer = page.locator(".dialog-layer");
  await page.getByRole("button", { name: "取消" }).click();
  await expect(layer).toHaveClass(/dialog-layer--closing/);
  await expect(layer).toHaveCount(0);
});

test("手机号仅保留数字且最多 15 位", async ({ page }) => {
  await mockConfig(page);
  await mockWebhook(page);
  await page.goto("/m/?car=浙A12345");

  const phone = page.getByLabel("您的电话号码");
  await phone.fill("+86 138 0013 8000 123");

  await expect(phone).toHaveValue("861380013800012");
  await expect(page.getByRole("button", { name: "通知车主" })).toBeEnabled();
});

test("多渠道首个成功后等待宽限期并取消仍未完成的请求", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url === "https://api.day.app/push") {
        return Promise.resolve(new Response(JSON.stringify({ code: 200 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }));
      }
      if (url.startsWith("https://slow.example.test/push")) {
        return new Promise<Response>((_resolve, reject) => {
          const abort = () => {
            localStorage.setItem("slow-channel-aborted", "yes");
            reject(new DOMException("Aborted", "AbortError"));
          };
          if (init?.signal?.aborted) abort();
          else init?.signal?.addEventListener("abort", abort, { once: true });
        });
      }
      return originalFetch(input, init);
    };
  });

  const code = encodeUrlConfig({
    v: 1,
    car: "浙A12345",
    num: "13000000000",
    pushes: [
      { type: "bark", key: "test-key" },
      { type: "webhook", url: "https://slow.example.test/push", method: "POST" },
    ],
  });
  await page.goto(`/m/#${code}`);
  await page.getByLabel("您的电话号码").fill("13800138000");
  const startedAt = Date.now();
  await page.getByRole("button", { name: "通知车主" }).click();
  await expect(page.getByRole("dialog", { name: "发送成功" })).toBeVisible({
    timeout: SUCCESS_GRACE_PERIOD_MS + 5000,
  });
  const elapsed = Date.now() - startedAt;

  expect(elapsed).toBeGreaterThanOrEqual(SUCCESS_GRACE_PERIOD_MS - 200);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("slow-channel-aborted")))
    .toBe("yes");
});

test("触屏按下按钮时显示明确的按压反馈", async ({ page }) => {
  await mockConfig(page);
  await mockWebhook(page);
  await page.goto("/m/");

  await page.getByLabel("您的电话号码").fill("13800138000");
  const submit = page.getByRole("button", { name: "通知车主" });

  await submit.dispatchEvent("pointerdown", { pointerType: "touch" });
  await expect(submit).toHaveClass(/button--pressed/);
  await submit.dispatchEvent("pointerup", { pointerType: "touch" });
  await expect(submit).not.toHaveClass(/button--pressed/);

  await submit.click();
  await expect(submit).toHaveClass(/button--tapped/);
  await expect(submit).not.toHaveClass(/button--tapped/, { timeout: 1000 });
});

test("多语言用户页保留主视觉尺寸且短屏底部操作可见", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });

  for (const locale of ["zh-CN", "de", "ja", "ko"]) {
    await page.goto(`/m/?lang=${locale}`);
    const layout = await page.evaluate(() => {
      const icon = document.querySelector<HTMLElement>(".hero__icon")!.getBoundingClientRect();
      const button = document.querySelector<HTMLButtonElement>(".submit-button")!.getBoundingClientRect();
      return {
        iconWidth: icon.width,
        buttonBottom: button.bottom,
        viewportHeight: window.innerHeight,
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });

    expect(layout.iconWidth).toBe(113);
    expect(layout.buttonBottom).toBeLessThanOrEqual(layout.viewportHeight - 16);
    expect(layout.horizontalOverflow).toBe(0);
  }
});

test("用户页限制页面选取和缩放但保留输入编辑", async ({ page }) => {
  await page.goto("/m/");
  const behavior = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    const inputStyle = getComputedStyle(document.querySelector<HTMLInputElement>("#phone")!);
    return {
      viewport: document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content,
      pageSelection: bodyStyle.userSelect || bodyStyle.webkitUserSelect,
      inputSelection: inputStyle.userSelect || inputStyle.webkitUserSelect,
    };
  });

  expect(behavior.viewport).toContain("maximum-scale=1");
  expect(behavior.viewport).toContain("user-scalable=no");
  expect(behavior.pageSelection).toBe("none");
  expect(behavior.inputSelection).toBe("text");
});

test("用户页切换语言后保留正在填写的内容", async ({ page }) => {
  await page.goto("/m/?lang=zh-CN");
  await page.getByLabel("您的电话号码").fill("13800138000");
  await page.getByLabel("留言").fill("请尽快挪车");

  await page.getByRole("button", { name: "选择语言" }).click();
  await page.getByRole("radio", { name: "English" }).click();

  await expect(page).not.toHaveURL(/lang=/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Contact the car owner" })).toBeVisible();
  await expect(page.getByLabel("Your phone number")).toHaveValue("13800138000");
  await expect(page.getByLabel("Message")).toHaveValue("请尽快挪车");
});

test.describe("自动深色模式", () => {
  test.use({ colorScheme: "dark" });

  test("跟随系统外观并应用完整深色表面", async ({ page }) => {
    await mockConfig(page);
    await page.goto("/m/?preview=failure");

    const colors = await page.locator(".move-page").evaluate((element) => ({
      page: getComputedStyle(element).backgroundColor,
      hero: getComputedStyle(document.querySelector<HTMLElement>(".hero")!).backgroundColor,
      heroIconBackground: getComputedStyle(document.querySelector<HTMLElement>(".hero__icon")!).backgroundColor,
      heroIconColor: getComputedStyle(document.querySelector<HTMLElement>(".hero__icon")!).color,
      statusIconBackground: getComputedStyle(document.querySelector<HTMLElement>(".dialog-icon--failure")!).backgroundColor,
      statusIconColor: getComputedStyle(document.querySelector<HTMLElement>(".dialog-icon--failure")!).color,
      field: getComputedStyle(document.querySelector<HTMLInputElement>("#phone")!).backgroundColor,
      text: getComputedStyle(document.querySelector<HTMLInputElement>("#phone")!).color,
    }));

    expect(colors).toEqual({
      page: "rgb(27, 27, 27)",
      hero: "rgb(17, 17, 17)",
      heroIconBackground: "rgb(38, 62, 40)",
      heroIconColor: "rgb(154, 229, 158)",
      statusIconBackground: "rgb(38, 62, 40)",
      statusIconColor: "rgb(154, 229, 158)",
      field: "rgb(36, 36, 36)",
      text: "rgb(241, 241, 241)",
    });
  });
});

test("发送请求包含车牌标题、号码、留言和回拨链接", async ({ page }) => {
  await mockConfig(page);
  let payload: Record<string, string> | undefined;
  await mockWebhook(page, async (route) => {
    payload = route.request().postDataJSON() as Record<string, string>;
    await route.fulfill({ json: { code: 200 } });
  });
  await page.goto("/m/?car=浙A12345");

  await page.getByLabel("您的电话号码").fill("13800138000");
  await page.getByLabel("留言").fill("车辆挡住出口，请尽快联系");
  await page.getByRole("button", { name: "通知车主" }).click();

  await expect(page.getByRole("heading", { name: "发送成功" })).toBeVisible();
  expect(payload).toEqual({
    title: "挪车请求·浙A12345",
    body: "来自：13800138000\n留言：车辆挡住出口，请尽快联系",
    url: "tel:13800138000",
  });
});

test("扫码者界面语言与车主通知语言相互独立", async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route("https://api.day.app/push", async (route) => {
    payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { code: 200 } });
  });
  const code = encodeUrlConfig({
    v: 1,
    car: "CAR12",
    num: "13000000000",
    locale: "en",
    pushes: [{ type: "bark", key: "test-key" }],
  });
  await page.goto(`/m/?lang=de#${code}`);

  await page.getByLabel("Ihre Telefonnummer").fill("49123456789");
  await page.getByLabel("Nachricht").fill("Bitte zurückrufen");
  await page.getByRole("button", { name: "Fahrzeughalter benachrichtigen" }).click();

  await expect(page.getByRole("dialog", { name: "Erfolgreich gesendet" })).toBeVisible();
  expect(payload).toMatchObject({
    title: "Move request · CAR12",
    body: "From: 49123456789\nMessage: Bitte zurückrufen",
  });
});

test("发送期间禁用表单，完成后恢复编辑", async ({ page }) => {
  await mockConfig(page);
  let releaseRequest = () => {};
  const requestGate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  await mockWebhook(page, async (route) => {
    await requestGate;
    await route.fulfill({ json: { code: 200 } });
  });
  await page.goto("/m/");

  const phone = page.getByLabel("您的电话号码");
  const message = page.getByLabel("留言");
  await phone.fill("13800138000");
  await message.fill("请联系我");
  await page.getByRole("button", { name: "通知车主" }).click();

  await expect(phone).toBeDisabled();
  await expect(message).toBeDisabled();
  await expect(page.locator("form")).toHaveAttribute("aria-busy", "true");

  releaseRequest();
  await expect(page.getByRole("heading", { name: "发送成功" })).toBeVisible();
  await expect(phone).toBeEnabled();
  await expect(message).toBeEnabled();
});

test("配置临时加载失败后可在不刷新页面的情况下重试", async ({ page }) => {
  let configRequests = 0;
  await page.route("**/movemocar.config.json", (route) => {
    configRequests += 1;
    if (configRequests === 1) {
      return route.fulfill({ status: 503, body: "temporary unavailable" });
    }
    return route.fulfill({ json: testConfig });
  });
  await mockWebhook(page);
  await page.goto("/m/");

  await page.getByLabel("您的电话号码").fill("13800138000");
  await page.getByRole("button", { name: "通知车主" }).click();
  await expect(page.getByText("发送失败，请稍后重试")).toBeVisible();

  await page.getByRole("button", { name: "通知车主" }).click();
  await expect(page.getByRole("heading", { name: "发送成功" })).toBeVisible();
  expect(configRequests).toBe(2);
});

test("URL 配置并行发送 Bark、WxPusher、ntfy 和 Webhook", async ({ page }) => {
  const requests = new Map<string, Record<string, unknown>>();
  await page.route("https://api.day.app/push", async (route) => {
    requests.set("bark", route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ json: { code: 200 } });
  });
  await page.route(
    "https://wxpusher.zjiecode.com/api/send/message/simple-push",
    async (route) => {
      requests.set("wxpusher", route.request().postDataJSON() as Record<string, unknown>);
      await route.fulfill({ json: { code: 1000, success: true } });
    },
  );
  await page.route("https://ntfy.sh/", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    requests.set("ntfy", payload);
    await route.fulfill({ json: { id: "ntfy-message", topic: payload.topic } });
  });
  await page.route("https://notify.example.test/move", async (route) => {
    requests.set("webhook", route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({ status: 204 });
  });

  const config = {
    v: 1,
    car: "浙A12345",
    num: "13000000000",
    pushes: [
      { type: "bark", key: "bark-test-key" },
      { type: "wxpusher", spt: "SPT_TEST123" },
      { type: "ntfy", topic: "mmc_test_topic" },
      {
        type: "webhook",
        url: "https://notify.example.test/move",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        bodyTemplate: {
          title: "{{vehicleTitle}}",
          pageUrl: "{{pageUrl}}",
          message: "{{message}}",
        },
      },
    ],
  };

  await page.goto(`/m/#${encodeUrlConfig(config)}`);
  await page.getByLabel("您的电话号码").fill("13800138000");
  await page.getByLabel("留言").fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button", { name: "通知车主" }).click();
  await expect(page.getByRole("heading", { name: "发送成功" })).toBeVisible();

  expect(requests.get("bark")).toEqual({
    device_key: "bark-test-key",
    title: "挪车请求·浙A12345",
    body: "来自：13800138000\n留言：<img src=x onerror=alert(1)>",
    url: "tel:13800138000",
  });
  expect(requests.get("wxpusher")).toEqual({
    summary: "挪车请求·浙A12345",
    content:
      '<p>来自：13800138000</p><p>留言：&lt;img src=x onerror=alert(1)&gt;</p><p><a href="tel:13800138000">点击回拨</a></p>',
    contentType: 2,
    spt: "SPT_TEST123",
    url: "tel:13800138000",
  });
  expect(requests.get("ntfy")).toMatchObject({
    topic: "mmc_test_topic",
    title: "挪车请求·浙A12345",
    message: "来自：13800138000\n留言：<img src=x onerror=alert(1)>",
    priority: 4,
    click: "tel:13800138000",
  });
  expect(requests.get("webhook")).toEqual({
    title: "挪车请求·浙A12345",
    pageUrl: "http://127.0.0.1:4173/m/",
    message: "<img src=x onerror=alert(1)>",
  });
});

test("多个渠道中任意一个成功即显示发送成功", async ({ page }) => {
  await page.route("https://api.day.app/push", (route) => route.fulfill({ status: 500 }));
  await page.route("https://ntfy.sh/", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ json: { id: "accepted", topic: payload.topic } });
  });
  const config = {
    v: 1,
    car: "浙A12345",
    num: "13000000000",
    pushes: [
      { type: "bark", key: "unavailable" },
      { type: "ntfy", topic: "mmc_fallback_topic" },
    ],
  };

  await page.goto(`/m/#${encodeUrlConfig(config)}`);
  await page.getByLabel("您的电话号码").fill("13800138000");
  await page.getByRole("button", { name: "通知车主" }).click();
  await expect(page.getByRole("heading", { name: "发送成功" })).toBeVisible();
});

test("全部渠道失败时显示回拨预案并解锁紧急呼叫", async ({ page }) => {
  let releaseRequests = () => {};
  const requestGate = new Promise<void>((resolve) => {
    releaseRequests = resolve;
  });
  await page.route("https://api.day.app/push", async (route) => {
    await requestGate;
    await route.fulfill({ status: 500 });
  });
  await page.route("https://ntfy.sh/", async (route) => {
    await requestGate;
    await route.fulfill({ status: 503 });
  });
  const config = {
    v: 1,
    car: "浙A12345",
    num: "13000000000",
    pushes: [
      { type: "bark", key: "unavailable" },
      { type: "ntfy", topic: "mmc_unavailable_topic" },
    ],
  };

  await page.goto(`/m/#${encodeUrlConfig(config)}`);
  await page.getByLabel("您的电话号码").fill("13800138000");
  const submit = page.getByRole("button", { name: "正在通知车主" });
  await page.getByRole("button", { name: "通知车主" }).click();
  await expect(submit).toBeVisible();
  await expect(submit.locator(".submit-button__spinner")).toBeVisible();

  releaseRequests();
  const failureDialog = page.getByRole("dialog", { name: "通知失败" });
  await expect(failureDialog).toBeVisible();
  await expect(failureDialog.locator(".dialog-icon--failure")).toHaveCSS(
    "background-color",
    "rgb(203, 237, 204)",
  );
  await expect(failureDialog.getByText("您可以尝试直接联系车主")).toBeVisible();
  await expect(failureDialog.getByRole("button", { name: "直接呼叫车主" })).toBeVisible();
  await failureDialog.getByRole("button", { name: "取消" }).click();
  await expect(page.getByRole("button", { name: "紧急情况？" })).toBeVisible();
});

test("通知渠道段损坏时使用独立核心段号码提供直接回拨", async ({ page }) => {
  const ownerPhone = "13000000000";
  const validCode = encodeUrlConfig({
    v: 1,
    car: "浙A12345",
    num: ownerPhone,
    pushes: [{ type: "bark", key: "bark-test-key" }],
  });
  const [format, core] = validCode.split(".");
  await page.goto(`/m/#${format}.${core}.UDAMAGED`);

  const damagedDialog = page.getByRole("dialog", { name: "挪车码已损坏" });
  await expect(damagedDialog).toBeVisible();
  await expect(damagedDialog.getByText(/可以尝试直接联系车主/)).toBeVisible();
  await expect(damagedDialog.getByRole("button", { name: "直接呼叫车主" })).toBeVisible();
  await expect(damagedDialog.getByRole("button", { name: "取消" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "紧急情况？" })).toBeVisible();
  await expect(page.getByRole("button", { name: "通知车主" })).toBeDisabled();
});

test("无通知渠道二维码正常进入常驻直接联系模式", async ({ page }) => {
  const code = encodeUrlConfig({
    v: 1,
    car: "浙A12345",
    num: "13000000000",
    pushes: [],
  });
  await page.goto(`/m/#${code}`);

  const dialog = page.getByRole("dialog", { name: "联系车主" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("请直接拨打电话联系车主")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "呼叫", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "取消" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "通知车主" })).toBeDisabled();
});

test("核心车辆字段校验失败时仍恢复其中的车主号码", async ({ page }) => {
  const invalidCode = encodeUncheckedM1("13000000000", "", [[0, "bark-test-key"]]);
  await page.goto(`/m/#${invalidCode}`);

  const damagedDialog = page.getByRole("dialog", { name: "挪车码已损坏" });
  await expect(damagedDialog.getByRole("button", { name: "直接呼叫车主" })).toBeVisible();
});

test("URL 配置拒绝超过五个推送渠道", async ({ page }) => {
  const invalidCode = encodeUncheckedM1(
    "13000000000",
    "浙A12345",
    Array.from({ length: 6 }, (_, index) => [2, `mmc_topic_${index}`]),
  );
  await page.goto(`/m/#${invalidCode}`);
  const damagedDialog = page.getByRole("dialog", { name: "挪车码已损坏" });
  await expect(damagedDialog).toBeVisible();
  await expect(damagedDialog.getByRole("button", { name: "直接呼叫车主" })).toBeVisible();
  await expect(page.getByRole("button", { name: "通知车主" })).toBeDisabled();
});

test("解码器拒绝超过 15 位的备用号码", async ({ page }) => {
  const fragment = encodeUncheckedM1("1234567890123456", "浙A12345", []);
  await page.goto(`/m/#${fragment}`);
  await expect(page.getByRole("dialog", { name: "挪车码损坏" })).toBeVisible();
  await expect(page.getByRole("button", { name: "直接呼叫车主" })).toHaveCount(0);
});
