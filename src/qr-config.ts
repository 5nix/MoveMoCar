import { decode, encode, rfc8949EncodeOptions } from "cborg";
import { deflateSync, inflateSync } from "fflate";
import type { PushChannel, UrlMoveMoCarConfig } from "./config";
import { MAX_PHONE_DIGITS } from "./limits";
import {
  defaultLocale,
  isLocale,
  localeFromCode,
  localeToCode,
} from "./locale";

const FORMAT = "M1";
const NO_CHANNELS = "N";
const RAW_CHANNELS = "U";
const DEFLATED_CHANNELS = "D";
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const MAX_FRAGMENT_LENGTH = 4096;
const MAX_CORE_TEXT_LENGTH = 512;
const MAX_CBOR_BYTES = 8192;
const MAX_CBOR_DEPTH = 16;
const MAX_COLLECTION_ITEMS = 100;
const MIN_COMPRESSION_SAVINGS = 8;

const CHANNEL_BARK = 0;
const CHANNEL_WXPUSHER = 1;
const CHANNEL_NTFY = 2;
const CHANNEL_WEBHOOK = 3;

const OPTION_SERVER = 0;
const WEBHOOK_METHOD = 0;
const WEBHOOK_HEADERS = 1;
const WEBHOOK_BODY = 2;
const WEBHOOK_TIMEOUT = 3;
const WEBHOOK_SUCCESS_STATUS = 4;
const CORE_LOCALE = 0;

const decodeOptions = {
  allowIndefinite: false,
  allowUndefined: false,
  rejectDuplicateMapKeys: true,
  strict: true,
  useMaps: true,
} as const;

const encodeBase32 = (bytes: Uint8Array) => {
  let output = "";
  let buffer = 0;
  let bitCount = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      output += BASE32_ALPHABET[(buffer >>> (bitCount - 5)) & 31];
      bitCount -= 5;
    }
    buffer &= (1 << bitCount) - 1;
  }

  if (bitCount > 0) {
    output += BASE32_ALPHABET[(buffer << (5 - bitCount)) & 31];
  }
  return output;
};

const decodeBase32 = (value: string, maximumLength: number) => {
  if (!value || value.length > maximumLength || !/^[A-Z2-7]+$/.test(value)) {
    throw new Error("挪车码配置编码无效");
  }

  const output: number[] = [];
  let buffer = 0;
  let bitCount = 0;
  for (const character of value) {
    buffer = (buffer << 5) | BASE32_ALPHABET.indexOf(character);
    bitCount += 5;
    while (bitCount >= 8) {
      output.push((buffer >>> (bitCount - 8)) & 255);
      bitCount -= 8;
    }
    buffer &= (1 << bitCount) - 1;
  }

  if (buffer !== 0) {
    throw new Error("挪车码配置编码无效");
  }

  const bytes = Uint8Array.from(output);
  if (encodeBase32(bytes) !== value) {
    throw new Error("挪车码配置编码无效");
  }
  return bytes;
};

const encodePhone = (phone: string) => {
  const bytes = new Uint8Array(Math.ceil(phone.length / 2));
  for (let index = 0; index < phone.length; index += 2) {
    const high = Number(phone[index]);
    const low = index + 1 < phone.length ? Number(phone[index + 1]) : 15;
    bytes[index / 2] = (high << 4) | low;
  }
  return bytes;
};

const decodePhone = (value: unknown) => {
  if (!(value instanceof Uint8Array) || value.length === 0) {
    throw new Error("备用号码无效");
  }

  let phone = "";
  value.forEach((byte, index) => {
    const high = byte >>> 4;
    const low = byte & 15;
    if (high > 9 || (low > 9 && !(low === 15 && index === value.length - 1))) {
      throw new Error("备用号码无效");
    }
    phone += String(high);
    if (low !== 15) {
      phone += String(low);
    }
  });
  if (phone.length > MAX_PHONE_DIGITS) {
    throw new Error("备用号码无效");
  }
  return phone;
};

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
};

const base64UrlToBytes = (value: string) => {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) {
    return undefined;
  }
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return bytesToBase64Url(bytes) === value ? bytes : undefined;
  } catch {
    return undefined;
  }
};

const packToken = (value: string, prefix = ""): string | Uint8Array => {
  if (!value.startsWith(prefix)) {
    return value;
  }
  const compact = base64UrlToBytes(value.slice(prefix.length));
  return compact ?? value;
};

const unpackToken = (value: unknown, prefix = "") => {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Uint8Array) {
    return `${prefix}${bytesToBase64Url(value)}`;
  }
  throw new Error("通知渠道配置无效");
};

const stripHttps = (value: string) => value.replace(/^https:\/\//, "");

const restoreHttps = (value: unknown) => {
  if (typeof value !== "string" || !value) {
    throw new Error("通知渠道地址无效");
  }
  return `https://${value}`;
};

const createOptions = (entries: Array<[number, unknown]>) =>
  entries.length > 0 ? new Map<number, unknown>(entries) : undefined;

const encodeChannel = (channel: PushChannel): unknown[] => {
  switch (channel.type) {
    case "bark": {
      const options = createOptions(
        channel.server ? [[OPTION_SERVER, stripHttps(channel.server)]] : [],
      );
      return options
        ? [CHANNEL_BARK, packToken(channel.key), options]
        : [CHANNEL_BARK, packToken(channel.key)];
    }
    case "wxpusher":
      return [CHANNEL_WXPUSHER, packToken(channel.spt, "SPT_")];
    case "ntfy": {
      const options = createOptions(
        channel.server ? [[OPTION_SERVER, stripHttps(channel.server)]] : [],
      );
      return options
        ? [CHANNEL_NTFY, packToken(channel.topic, "mmc_"), options]
        : [CHANNEL_NTFY, packToken(channel.topic, "mmc_")];
    }
    case "webhook": {
      const method = channel.method === "POST" ? undefined : channel.method === "PUT" ? 1 : 2;
      const entries: Array<[number, unknown]> = [];
      if (method !== undefined) entries.push([WEBHOOK_METHOD, method]);
      if (channel.headers !== undefined) entries.push([WEBHOOK_HEADERS, channel.headers]);
      if (channel.bodyTemplate !== undefined) entries.push([WEBHOOK_BODY, channel.bodyTemplate]);
      if (channel.timeoutMs !== undefined) entries.push([WEBHOOK_TIMEOUT, channel.timeoutMs]);
      if (channel.successStatus !== undefined) {
        entries.push([WEBHOOK_SUCCESS_STATUS, channel.successStatus]);
      }
      const options = createOptions(entries);
      return options
        ? [CHANNEL_WEBHOOK, stripHttps(channel.url), options]
        : [CHANNEL_WEBHOOK, stripHttps(channel.url)];
    }
  }
};

const requireOptions = (value: unknown) => {
  if (value === undefined) {
    return new Map<number, unknown>();
  }
  if (!(value instanceof Map) || value.size > 16) {
    throw new Error("通知渠道选项无效");
  }
  for (const key of value.keys()) {
    if (!Number.isSafeInteger(key) || key < 0) {
      throw new Error("通知渠道选项无效");
    }
  }
  return value as Map<number, unknown>;
};

const toJsonValue = (value: unknown, depth = 0): unknown => {
  if (depth > 12) {
    throw new Error("Webhook JSON 嵌套过深");
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toJsonValue(item, depth + 1));
  }
  if (value instanceof Map) {
    if (value.size > 100 || Array.from(value.keys()).some((key) => typeof key !== "string")) {
      throw new Error("Webhook JSON 无效");
    }
    return Object.fromEntries(
      Array.from(value.entries(), ([key, item]) => [
        key as string,
        toJsonValue(item, depth + 1),
      ]),
    );
  }
  throw new Error("Webhook JSON 无效");
};

const decodeChannel = (value: unknown): PushChannel | undefined => {
  if (!Array.isArray(value) || value.length < 2 || value.length > 3) {
    throw new Error("通知渠道配置无效");
  }
  const [type, data, rawOptions] = value;
  if (!Number.isSafeInteger(type) || (type as number) < 0) {
    throw new Error("通知渠道配置无效");
  }

  // Future channel types are deliberately ignored by older decoders.
  if (![CHANNEL_BARK, CHANNEL_WXPUSHER, CHANNEL_NTFY, CHANNEL_WEBHOOK].includes(type as number)) {
    return undefined;
  }

  const options = requireOptions(rawOptions);
  switch (type) {
    case CHANNEL_BARK:
      return {
        type: "bark",
        key: unpackToken(data),
        server: options.has(OPTION_SERVER)
          ? restoreHttps(options.get(OPTION_SERVER))
          : undefined,
      };
    case CHANNEL_WXPUSHER:
      return { type: "wxpusher", spt: unpackToken(data, "SPT_") };
    case CHANNEL_NTFY:
      return {
        type: "ntfy",
        topic: unpackToken(data, "mmc_"),
        server: options.has(OPTION_SERVER)
          ? restoreHttps(options.get(OPTION_SERVER))
          : undefined,
      };
    case CHANNEL_WEBHOOK: {
      const methodCode = options.get(WEBHOOK_METHOD) ?? 0;
      const method = methodCode === 0 ? "POST" : methodCode === 1 ? "PUT" : methodCode === 2 ? "PATCH" : undefined;
      if (!method) {
        throw new Error("Webhook 请求方法无效");
      }
      const headersValue = options.get(WEBHOOK_HEADERS);
      const headers = headersValue === undefined ? undefined : toJsonValue(headersValue);
      const bodyValue = options.get(WEBHOOK_BODY);
      const timeoutMs = options.get(WEBHOOK_TIMEOUT);
      const successStatus = options.get(WEBHOOK_SUCCESS_STATUS);
      if (
        timeoutMs !== undefined &&
        (!Number.isSafeInteger(timeoutMs) || (timeoutMs as number) < 1000 || (timeoutMs as number) > 15_000)
      ) {
        throw new Error("Webhook 超时时间无效");
      }
      if (
        successStatus !== undefined &&
        (!Array.isArray(successStatus) ||
          successStatus.length !== 2 ||
          !successStatus.every((item) => Number.isSafeInteger(item) && item >= 100 && item <= 599) ||
          successStatus[0] > successStatus[1])
      ) {
        throw new Error("Webhook 成功状态码范围无效");
      }
      return {
        type: "webhook",
        url: restoreHttps(data),
        method,
        headers: headers as Record<string, string> | undefined,
        bodyTemplate: bodyValue === undefined ? undefined : toJsonValue(bodyValue),
        timeoutMs: timeoutMs as number | undefined,
        successStatus: successStatus as [number, number] | undefined,
      };
    }
    default:
      return undefined;
  }
};

const encodeCbor = (value: unknown) => encode(value, rfc8949EncodeOptions);

const decodeCbor = (bytes: Uint8Array) => {
  if (bytes.length === 0 || bytes.length > MAX_CBOR_BYTES) {
    throw new Error("挪车码配置大小无效");
  }
  const value = decode(bytes, decodeOptions);
  assertBoundedCbor(value);
  return value;
};

const assertBoundedCbor = (value: unknown, depth = 0): void => {
  if (depth > MAX_CBOR_DEPTH) {
    throw new Error("挪车码配置嵌套过深");
  }
  if (Array.isArray(value)) {
    if (value.length > MAX_COLLECTION_ITEMS) {
      throw new Error("挪车码配置项目过多");
    }
    value.forEach((item) => assertBoundedCbor(item, depth + 1));
    return;
  }
  if (value instanceof Map) {
    if (value.size > MAX_COLLECTION_ITEMS) {
      throw new Error("挪车码配置项目过多");
    }
    value.forEach((item, key) => {
      assertBoundedCbor(key, depth + 1);
      assertBoundedCbor(item, depth + 1);
    });
  }
};

const inflateBounded = (bytes: Uint8Array) => {
  const inflated = inflateSync(bytes, { out: new Uint8Array(MAX_CBOR_BYTES + 1) });
  if (inflated.length > MAX_CBOR_BYTES) {
    throw new Error("挪车码配置解压后过大");
  }
  return inflated;
};

const normalizeFragment = (fragment: string) => {
  const normalized = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  if (!normalized || normalized.length > MAX_FRAGMENT_LENGTH) {
    throw new Error("挪车码配置编码无效");
  }
  return normalized;
};

const parseCorePart = (fragment: string) => {
  const parts = normalizeFragment(fragment).split(".");
  if (parts[0] !== FORMAT || !parts[1]) {
    throw new Error("不支持的挪车码配置版本");
  }
  return parts[1];
};

const parseParts = (fragment: string) => {
  const normalized = normalizeFragment(fragment);
  const parts = normalized.split(".");
  if (parts.length !== 3 || parts[0] !== FORMAT || !parts[2]) {
    throw new Error("不支持的挪车码配置版本");
  }
  return { core: parts[1], channels: parts[2] };
};

const decodeCore = (encoded: string) => {
  const value = decodeCbor(decodeBase32(encoded, MAX_CORE_TEXT_LENGTH));
  if (!Array.isArray(value) || value.length < 2 || value.length > 3) {
    throw new Error("挪车码核心配置无效");
  }
  const phone = decodePhone(value[0]);
  const car = value[1];
  if (typeof car !== "string") {
    throw new Error("挪车码核心配置无效");
  }
  let locale = defaultLocale;
  if (value[2] !== undefined) {
    if (
      !(value[2] instanceof Map) ||
      value[2].size > 16 ||
      Array.from(value[2].keys()).some(
        (key) => !Number.isSafeInteger(key) || (key as number) < 0,
      )
    ) {
      throw new Error("挪车码核心扩展无效");
    }
    const rawLocale = value[2].get(CORE_LOCALE);
    if (rawLocale !== undefined) {
      if (!Number.isSafeInteger(rawLocale) || (rawLocale as number) < 0) {
        throw new Error("挪车码核心扩展无效");
      }
      locale = localeFromCode(rawLocale as number);
    }
  }
  return { phone, car, locale };
};

export const encodeMoveCode = (config: UrlMoveMoCarConfig) => {
  if (
    config.v !== 1 ||
    typeof config.car !== "string" ||
    !config.car ||
    typeof config.num !== "string" ||
    !/^\d+$/.test(config.num) ||
    config.num.length > MAX_PHONE_DIGITS ||
    !Array.isArray(config.pushes) ||
    config.pushes.length > 5 ||
    (config.locale !== undefined && !isLocale(config.locale))
  ) {
    throw new Error("挪车码配置无效");
  }
  const locale = config.locale ?? defaultLocale;
  const coreOptions = locale === defaultLocale
    ? undefined
    : new Map<number, unknown>([[CORE_LOCALE, localeToCode(locale)]]);
  const coreBytes = encodeCbor(
    coreOptions
      ? [encodePhone(config.num), config.car, coreOptions]
      : [encodePhone(config.num), config.car],
  );
  const encodedCore = encodeBase32(coreBytes);
  if (encodedCore.length > MAX_CORE_TEXT_LENGTH) {
    throw new Error("挪车码核心配置编码过长");
  }
  decodeCbor(coreBytes);
  if (config.pushes.length === 0) {
    const fragment = `${FORMAT}.${encodedCore}.${NO_CHANNELS}`;
    if (fragment.length > MAX_FRAGMENT_LENGTH) {
      throw new Error("挪车码配置编码过长");
    }
    return fragment;
  }
  const channelBytes = encodeCbor(config.pushes.map(encodeChannel));
  // Refuse to create a code that this M1 implementation would reject itself.
  decodeCbor(channelBytes);
  const deflated = deflateSync(channelBytes, { level: 9 });
  const useCompression = channelBytes.length - deflated.length >= MIN_COMPRESSION_SAVINGS;
  const encodedChannels = encodeBase32(useCompression ? deflated : channelBytes);
  const fragment = `${FORMAT}.${encodedCore}.${useCompression ? DEFLATED_CHANNELS : RAW_CHANNELS}${encodedChannels}`;
  if (fragment.length > MAX_FRAGMENT_LENGTH) {
    throw new Error("挪车码配置编码过长");
  }
  return fragment;
};

export const decodeMoveCode = (fragment: string): UrlMoveMoCarConfig => {
  const parts = parseParts(fragment);
  const core = decodeCore(parts.core);
  if (parts.channels === NO_CHANNELS) {
    return {
      v: 1,
      car: core.car,
      num: core.phone,
      pushes: [],
      ...(core.locale === defaultLocale ? {} : { locale: core.locale }),
    };
  }
  const codec = parts.channels[0];
  const encodedChannels = parts.channels.slice(1);
  if (codec !== RAW_CHANNELS && codec !== DEFLATED_CHANNELS) {
    throw new Error("不支持的挪车码压缩格式");
  }
  const packedChannels = decodeBase32(encodedChannels, MAX_FRAGMENT_LENGTH);
  const channelBytes = codec === DEFLATED_CHANNELS ? inflateBounded(packedChannels) : packedChannels;
  const wireChannels = decodeCbor(channelBytes);
  if (!Array.isArray(wireChannels) || wireChannels.length > 5) {
    throw new Error("通知渠道数量无效");
  }
  const pushes = wireChannels.map(decodeChannel).filter((channel) => channel !== undefined);
  return {
    v: 1,
    car: core.car,
    num: core.phone,
    pushes,
    ...(core.locale === defaultLocale ? {} : { locale: core.locale }),
  };
};

export const decodeMoveCodeFallbackPhone = (fragment: string) => {
  return decodeCore(parseCorePart(fragment)).phone;
};

export const hasMoveCode = (fragment: string) => {
  const normalized = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  return normalized.startsWith(`${FORMAT}.`);
};
