import {
  decodeMoveCode,
  decodeMoveCodeFallbackPhone,
  encodeMoveCode,
  hasMoveCode,
} from "./qr-config";
import { defaultLocale, isLocale, type Locale } from "./locale";
import { normalizeConfiguredPhone } from "./limits";

export interface LegacyNotificationConfig {
  transport: "http";
  url: string;
  method: string;
  headers?: Record<string, string>;
  bodyTemplate?: unknown;
  timeoutMs?: number;
  successStatus?: [number, number];
}

interface NamedChannel {
  name?: string;
}

export interface BarkChannel extends NamedChannel {
  type: "bark";
  key: string;
  server?: string;
}

export interface WxPusherChannel extends NamedChannel {
  type: "wxpusher";
  spt: string;
}

export interface NtfyChannel extends NamedChannel {
  type: "ntfy";
  topic: string;
  server?: string;
}

export interface WebhookChannel extends NamedChannel {
  type: "webhook";
  url: string;
  method: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  bodyTemplate?: unknown;
  timeoutMs?: number;
  successStatus?: [number, number];
}

export type PushChannel = BarkChannel | WxPusherChannel | NtfyChannel | WebhookChannel;

export interface UrlMoveMoCarConfig {
  v: 1;
  car: string;
  num: string;
  pushes: PushChannel[];
  locale?: Locale;
}

export interface MoveMoCarConfig {
  ownerPhone: string;
  vehiclePlate: string;
  pushes: PushChannel[];
  ownerLocale: Locale;
  source: "url" | "file";
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const normalizeVehiclePlate = (value: string) =>
  Array.from(value.replace(/\s+/g, "").toUpperCase()).slice(0, 13).join("");

const normalizeName = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, 30) : undefined;

const parseHttpsUrl = (value: unknown, fieldName: string): URL => {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} 无效`);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${fieldName} 无效`);
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`${fieldName} 必须使用 HTTPS`);
  }

  return url;
};

const isPrivateHostname = (hostname: string) => {
  const normalized = hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "")
    .toLowerCase();
  if (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized === "::" ||
    normalized === "::1" ||
    (normalized.includes(":") && normalized.startsWith("fc")) ||
    (normalized.includes(":") && normalized.startsWith("fd")) ||
    normalized.startsWith("fe80:")
  ) {
    return true;
  }

  const ipv4FromHextets = (value: string) => {
    const parts = value.split(":");
    if (parts.length < 2) return undefined;
    const high = Number.parseInt(parts.at(-2) ?? "", 16);
    const low = Number.parseInt(parts.at(-1) ?? "", 16);
    if (!Number.isFinite(high) || !Number.isFinite(low) || high > 0xffff || low > 0xffff) {
      return undefined;
    }
    return `${high >>> 8}.${high & 255}.${low >>> 8}.${low & 255}`;
  };

  const mappedIpv4 = normalized.startsWith("::ffff:")
    ? ipv4FromHextets(normalized)
    : undefined;
  const candidate = mappedIpv4 ?? normalized;
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(candidate);
  if (!match) {
    return false;
  }

  const octets = match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) {
    return true;
  }

  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
};

const URL_TEMPLATE_PATTERN =
  /{{\s*(phone|message|submittedAt|pageUrl|vehiclePlate|vehicleTitle)\s*}}/g;

const assertPublicHttpsUrl = (
  value: unknown,
  fieldName: string,
  allowTemplate = false,
) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} 无效`);
  }
  const raw = value.trim();
  const authority = /^https:\/\/([^/?#]*)/i.exec(raw)?.[1] ?? "";
  if (allowTemplate && authority.includes("{{")) {
    throw new Error(`${fieldName} 的主机名不能使用变量`);
  }
  const probe = allowTemplate ? raw.replace(URL_TEMPLATE_PATTERN, "movemocar") : raw;
  if (allowTemplate && /{{|}}/.test(probe)) {
    throw new Error(`${fieldName} 包含未知变量`);
  }
  const parsed = parseHttpsUrl(probe, fieldName);
  if (isPrivateHostname(parsed.hostname)) {
    throw new Error(`${fieldName} 不允许指向本机或内网`);
  }
  return allowTemplate ? raw : parsed.toString().replace(/\/$/, "");
};

const assertWebhookUrl = (value: unknown) =>
  assertPublicHttpsUrl(value, "Webhook URL", true);

const assertTimeoutMs = (value: unknown) => {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || (value as number) < 1000 || (value as number) > 15_000) {
    throw new Error("Webhook 超时时间无效");
  }
  return value as number;
};

const assertSuccessStatus = (value: unknown): [number, number] | undefined => {
  if (value === undefined) return undefined;
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every((item) => Number.isSafeInteger(item) && item >= 100 && item <= 599) ||
    value[0] > value[1]
  ) {
    throw new Error("Webhook 成功状态码范围无效");
  }
  return [value[0], value[1]];
};

const assertHeaders = (value: unknown): Record<string, string> | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value) || Object.keys(value).length > 10) {
    throw new Error("Webhook 请求头无效");
  }

  const entries = Object.entries(value);
  if (entries.some(([key, headerValue]) => !key.trim() || typeof headerValue !== "string")) {
    throw new Error("Webhook 请求头无效");
  }
  return Object.fromEntries(entries) as Record<string, string>;
};

const assertChannel = (value: unknown): PushChannel => {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new Error("推送渠道无效");
  }

  const name = normalizeName(value.name);
  switch (value.type) {
    case "bark": {
      if (typeof value.key !== "string" || !value.key.trim() || value.key.length > 500) {
        throw new Error("Bark Key 无效");
      }
      return {
        type: "bark",
        name,
        key: value.key.trim(),
        server:
          value.server === undefined
            ? undefined
            : assertPublicHttpsUrl(value.server, "Bark Server"),
      };
    }
    case "wxpusher": {
      if (typeof value.spt !== "string" || !/^SPT_[A-Za-z0-9]+$/.test(value.spt)) {
        throw new Error("WxPusher SPT 无效");
      }
      return { type: "wxpusher", name, spt: value.spt };
    }
    case "ntfy": {
      if (typeof value.topic !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(value.topic)) {
        throw new Error("ntfy Topic 无效");
      }
      return {
        type: "ntfy",
        name,
        topic: value.topic,
        server:
          value.server === undefined
            ? undefined
            : assertPublicHttpsUrl(value.server, "ntfy Server"),
      };
    }
    case "webhook": {
      const method = typeof value.method === "string" ? value.method.toUpperCase() : "";
      if (method !== "POST" && method !== "PUT" && method !== "PATCH") {
        throw new Error("Webhook 请求方法无效");
      }
      return {
        type: "webhook",
        name,
        url: assertWebhookUrl(value.url),
        method,
        headers: assertHeaders(value.headers),
        bodyTemplate: value.bodyTemplate,
        timeoutMs: assertTimeoutMs(value.timeoutMs),
        successStatus: assertSuccessStatus(value.successStatus),
      };
    }
    default:
      throw new Error("不支持的推送渠道");
  }
};

const channelIdentity = (channel: PushChannel) => {
  switch (channel.type) {
    case "bark":
      return `bark:${channel.server ?? "https://api.day.app"}:${channel.key}`;
    case "wxpusher":
      return `wxpusher:${channel.spt}`;
    case "ntfy":
      return `ntfy:${channel.server ?? "https://ntfy.sh"}:${channel.topic}`;
    case "webhook":
      return `webhook:${channel.method}:${channel.url}:${JSON.stringify(channel.headers)}:${JSON.stringify(channel.bodyTemplate)}`;
  }
};

export const validateUrlConfig = (value: unknown): MoveMoCarConfig => {
  if (!isRecord(value) || value.v !== 1) {
    throw new Error("不支持的挪车码配置版本");
  }
  if (typeof value.car !== "string" || typeof value.num !== "string") {
    throw new Error("挪车码缺少车辆信息");
  }
  if (!Array.isArray(value.pushes) || value.pushes.length > 5) {
    throw new Error("推送渠道数量不能超过 5 个");
  }

  const ownerPhone = normalizeConfiguredPhone(value.num);
  const vehiclePlate = normalizeVehiclePlate(value.car);
  if (!vehiclePlate) {
    throw new Error("车牌或车主号码无效");
  }

  const channels = value.pushes.map(assertChannel);
  const seen = new Set<string>();
  const pushes = channels.filter((channel) => {
    const identity = channelIdentity(channel);
    if (seen.has(identity)) {
      return false;
    }
    seen.add(identity);
    return true;
  });

  if (value.locale !== undefined && !isLocale(value.locale)) {
    throw new Error("不支持的车主语言");
  }

  return {
    ownerPhone,
    vehiclePlate,
    pushes,
    ownerLocale: value.locale ?? defaultLocale,
    source: "url",
  };
};

export { encodeMoveCode };

export const hasUrlConfig = () => hasMoveCode(window.location.hash);

export const getEmergencyPhoneFallback = () => {
  try {
    return decodeMoveCodeFallbackPhone(window.location.hash);
  } catch {
    return undefined;
  }
};

const loadUrlConfig = (): MoveMoCarConfig | undefined => {
  if (!hasMoveCode(window.location.hash)) {
    return undefined;
  }
  return validateUrlConfig(decodeMoveCode(window.location.hash));
};

const loadFileConfig = async (): Promise<MoveMoCarConfig> => {
  const configUrl = new URL("../movemocar.config.json", document.baseURI);
  const response = await fetch(configUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("未找到 movemocar.config.json");
  }

  const value: unknown = await response.json();
  if (!isRecord(value) || typeof value.ownerPhone !== "string") {
    throw new Error("配置文件缺少 ownerPhone");
  }
  if (!isRecord(value.notification)) {
    throw new Error("配置文件中的 notification 无效");
  }

  const notification = value.notification;
  if (
    notification.transport !== "http" ||
    typeof notification.url !== "string" ||
    typeof notification.method !== "string"
  ) {
    throw new Error("配置文件中的 notification 无效");
  }

  const method = notification.method.toUpperCase();
  if (method !== "POST" && method !== "PUT" && method !== "PATCH") {
    throw new Error("配置文件中的请求方法无效");
  }

  const ownerPhone = normalizeConfiguredPhone(value.ownerPhone);

  const legacyChannel: WebhookChannel = {
    type: "webhook",
    url: assertWebhookUrl(notification.url),
    method,
    headers: assertHeaders(notification.headers),
    bodyTemplate: notification.bodyTemplate,
    timeoutMs: assertTimeoutMs(notification.timeoutMs),
    successStatus: assertSuccessStatus(notification.successStatus),
  };

  const vehiclePlate = normalizeVehiclePlate(
    new URLSearchParams(window.location.search).get("car") ?? "",
  );
  return {
    ownerPhone,
    vehiclePlate,
    pushes: [legacyChannel],
    ownerLocale: isLocale(value.locale) ? value.locale : defaultLocale,
    source: "file",
  };
};

export const loadConfig = async (): Promise<MoveMoCarConfig> =>
  loadUrlConfig() ?? loadFileConfig();
