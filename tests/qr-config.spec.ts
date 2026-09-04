import { expect, test } from "@playwright/test";
import QRCode from "qrcode";
import {
  decodeMoveCode,
  decodeMoveCodeFallbackPhone,
  encodeMoveCode,
} from "../src/qr-config";
import type { UrlMoveMoCarConfig } from "../src/config";
import { validateUrlConfig } from "../src/config";
import { supportedLocales } from "../src/locale";
import { renderUrlTemplate } from "../src/webhook";

test("M1 可往返全部界面语言，默认中文不增加编码字段", () => {
  const base: UrlMoveMoCarConfig = {
    v: 1,
    car: "浙A12345",
    num: "13000000000",
    pushes: [],
  };
  const defaultCode = encodeMoveCode(base);
  expect(encodeMoveCode({ ...base, locale: "zh-CN" })).toBe(defaultCode);

  for (const locale of supportedLocales.filter((item) => item !== "zh-CN")) {
    const encoded = encodeMoveCode({ ...base, locale });
    expect(decodeMoveCode(encoded)).toEqual({ ...base, locale });
    expect(decodeMoveCodeFallbackPhone(encoded)).toBe(base.num);
  }
});

test("M1 编码具有稳定测试向量并可完整往返", () => {
  const config: UrlMoveMoCarConfig = {
    v: 1,
    car: "浙A12345",
    num: "13900000000",
    pushes: [{ type: "bark", name: "仅用于生成器显示", key: "test-bark-key" }],
  };

  const encoded = encodeMoveCode(config);
  expect(encoded).toBe(
    "M1.QJDBHEAAAAAA62PGWWMUCMJSGM2DK.UQGBAA3LUMVZXILLCMFZGWLLLMV4Q",
  );
  expect(decodeMoveCode(encoded)).toEqual({
    v: 1,
    car: "浙A12345",
    num: "13900000000",
    pushes: [{ type: "bark", key: "test-bark-key", server: undefined }],
  });
});

test("M1 往返全部渠道、奇数位号码、自托管地址和 Webhook JSON", () => {
  const config: UrlMoveMoCarConfig = {
    v: 1,
    car: "粤B·TEST🙂",
    num: "861380013800012",
    pushes: [
      {
        type: "bark",
        key: "TEST_BARK_KEY_X7g2P9kLm",
        server: "https://bark.example.com/push",
      },
      { type: "wxpusher", spt: "SPT_TESTWXPUSHER1234567890" },
      {
        type: "ntfy",
        topic: "mmc_Qx7Vg2jNz8KrLp4a",
        server: "https://ntfy.example.com",
      },
      {
        type: "webhook",
        url: "https://notify.example.com/api/move",
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        bodyTemplate: { title: "{{vehicleTitle}}", nested: [true, 12, null] },
        timeoutMs: 8000,
        successStatus: [200, 204],
      },
    ],
  };

  expect(decodeMoveCode(encodeMoveCode(config))).toMatchObject({
    v: 1,
    car: config.car,
    num: config.num,
    pushes: config.pushes.map(({ name: _name, ...channel }) => channel),
  });
});

test("复杂 Webhook 仅在有明确收益时启用 DEFLATE", () => {
  const config: UrlMoveMoCarConfig = {
    v: 1,
    car: "浙A12345",
    num: "13800138000",
    pushes: [
      {
        type: "webhook",
        url: "https://notify.example.com/api/v1/move",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer abcdefghijklmnopqrstuvwxyz",
        },
        bodyTemplate: {
          title: "{{vehicleTitle}}",
          body: "来自：{{phone}}\n留言：{{message}}",
          url: "tel:{{phone}}",
        },
      },
    ],
  };

  const encoded = encodeMoveCode(config);
  expect(encoded.split(".")[2]).toMatch(/^D/);
  expect(decodeMoveCode(encoded)).toMatchObject({ car: config.car, num: config.num });
});

test("核心段可在通知渠道段丢失时独立恢复，常见配置保持低密度", () => {
  const config: UrlMoveMoCarConfig = {
    v: 1,
    car: "浙A12345",
    num: "13800138000",
    pushes: [{ type: "bark", key: "TEST_BARK_KEY_X7g2P9kLm" }],
  };
  const encoded = encodeMoveCode(config);
  const [format, core] = encoded.split(".");

  expect(decodeMoveCodeFallbackPhone(`${format}.${core}`)).toBe(config.num);
  expect(() => decodeMoveCode(`${format}.${core}`)).toThrow();

  const qr = QRCode.create(`https://movemocar.cn/#${encoded}`, {
    errorCorrectionLevel: "M",
  });
  expect(qr.version).toBeLessThanOrEqual(5);
});

test("M1 支持仅电话联系，并拒绝无法生成长期二维码的无效语义配置", () => {
  const phoneOnly = {
    v: 1 as const,
    car: "浙A12345",
    num: "13000000000",
    pushes: [],
  };
  const encodedPhoneOnly = encodeMoveCode(phoneOnly);
  expect(encodedPhoneOnly).toMatch(/\.N$/);
  expect(decodeMoveCode(encodedPhoneOnly)).toEqual(phoneOnly);

  const [format, core] = encodedPhoneOnly.split(".");
  expect(decodeMoveCode(`${format}.${core}.UQA`)).toEqual(phoneOnly);

  expect(() =>
    encodeMoveCode({
      v: 1,
      car: "",
      num: "13000000000",
      pushes: [{ type: "bark", key: "test" }],
    }),
  ).toThrow("挪车码配置无效");

  expect(() =>
    encodeMoveCode({
      ...phoneOnly,
      num: "1234567890123456",
    }),
  ).toThrow("挪车码配置无效");

});

test("M1 编码器拒绝生成自身无法解析的过深或过长配置", () => {
  let nested: unknown = "value";
  for (let depth = 0; depth < 20; depth += 1) {
    nested = { nested };
  }
  let seed = 0x12345678;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const incompressible = Array.from({ length: 5000 }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return alphabet[(seed >>> 24) & 63];
  }).join("");
  expect(() =>
    encodeMoveCode({
      v: 1,
      car: "浙A12345",
      num: "13000000000",
      pushes: [
        {
          type: "webhook",
          url: "https://example.com/push",
          method: "POST",
          bodyTemplate: nested,
        },
      ],
    }),
  ).toThrow("嵌套过深");

  expect(() =>
    encodeMoveCode({
      v: 1,
      car: "浙A12345",
      num: "13000000000",
      pushes: [
        {
          type: "webhook",
          url: "https://example.com/push",
          method: "POST",
          bodyTemplate: { value: incompressible },
        },
      ],
    }),
  ).toThrow("编码过长");

  expect(() =>
    encodeMoveCode({
      v: 1,
      car: "车辆".repeat(300),
      num: "13000000000",
      pushes: [],
    }),
  ).toThrow("核心配置编码过长");
});

test("Webhook URL 保留模板并按 URL 语义编码替换值", () => {
  const url = "https://notify.example.com/move/{{vehiclePlate}}?message={{message}}&phone={{phone}}";
  const validated = validateUrlConfig({
    v: 1,
    car: "浙A12345",
    num: "13000000000",
    pushes: [{ type: "webhook", url, method: "POST" }],
  });
  expect(validated.pushes[0]).toMatchObject({ url });
  expect(renderUrlTemplate(url, {
    phone: "13800138000",
    message: "请尽快 / 谢谢",
    submittedAt: "2026-09-03T00:00:00.000Z",
    pageUrl: "https://example.com/#code",
    vehiclePlate: "浙A 12345",
    vehicleTitle: "挪车请求",
  })).toBe(
    "https://notify.example.com/move/%E6%B5%99A%2012345?message=%E8%AF%B7%E5%B0%BD%E5%BF%AB%20%2F%20%E8%B0%A2%E8%B0%A2&phone=13800138000",
  );
});

test("配置验证拒绝内网变体和无效 Webhook 数字选项", () => {
  const base = {
    v: 1 as const,
    car: "浙A12345",
    num: "13000000000",
  };
  for (const url of [
    "https://localhost./push",
    "https://[::ffff:7f00:1]/push",
    "https://192.168.1.2/push",
  ]) {
    expect(() => validateUrlConfig({
      ...base,
      pushes: [{ type: "webhook", url, method: "POST" }],
    })).toThrow("不允许指向本机或内网");
  }

  for (const options of [
    { timeoutMs: Number.NaN },
    { timeoutMs: 999 },
    { successStatus: [299, 200] },
    { successStatus: [99, 200] },
  ]) {
    expect(() => validateUrlConfig({
      ...base,
      pushes: [{
        type: "webhook",
        url: "https://notify.example.com/push",
        method: "POST",
        ...options,
      }],
    })).toThrow();
  }

  expect(() => validateUrlConfig({
    ...base,
    pushes: [{
      type: "webhook",
      url: "https://fcm.example.com/push",
      method: "POST",
    }],
  })).not.toThrow();
});
