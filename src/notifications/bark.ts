import type { BarkChannel } from "../config";
import { fetchWithTimeout, readJson } from "./http";
import type { NotificationSubmission } from "./types";
import { t } from "../i18n";

export const parseBarkAddress = (rawValue: string, name?: string): BarkChannel => {
  const value = rawValue.trim();
  if (!value) {
    throw new Error("Bark 地址不能为空");
  }
  if (!/^https:\/\//i.test(value)) {
    return { type: "bark", name, key: value };
  }

  const url = new URL(value);
  const parts = url.pathname.split("/").filter(Boolean);
  const key = parts[0] ?? "";
  if (!key || key.toLowerCase() === "push") {
    throw new Error("Bark 地址中缺少设备 Key");
  }
  return { type: "bark", name, key, server: url.origin };
};

export const sendBark = async (
  channel: BarkChannel,
  submission: NotificationSubmission,
  signal?: AbortSignal,
) => {
  const server = channel.server ?? "https://api.day.app";
  const endpoint = server.endsWith("/push") ? server : `${server}/push`;
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      device_key: channel.key,
      title: submission.vehicleTitle,
      body: `${t(submission.locale, "notification.from", { phone: submission.phone })}\n${t(submission.locale, "notification.message", { message: submission.message })}`,
      url: `tel:${submission.phone}`,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Bark 返回状态码 ${response.status}`);
  }
  const result = await readJson(response);
  if (result.code !== 200) {
    throw new Error("Bark 未接受通知");
  }
};
