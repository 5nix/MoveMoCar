import type { WxPusherChannel } from "../config";
import { escapeHtml } from "../webhook";
import { fetchWithTimeout, readJson } from "./http";
import type { NotificationSubmission } from "./types";
import { t } from "../i18n";

const endpoint = "https://wxpusher.zjiecode.com/api/send/message/simple-push";

export const sendWxPusher = async (
  channel: WxPusherChannel,
  submission: NotificationSubmission,
  signal?: AbortSignal,
) => {
  const from = escapeHtml(t(submission.locale, "notification.from", { phone: submission.phone }));
  const message = escapeHtml(t(submission.locale, "notification.message", { message: submission.message }));
  const callBack = escapeHtml(t(submission.locale, "notification.callBack"));
  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      summary: submission.vehicleTitle,
      content: `<p>${from}</p><p>${message}</p><p><a href="tel:${submission.phone}">${callBack}</a></p>`,
      contentType: 2,
      spt: channel.spt,
      url: `tel:${submission.phone}`,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`WxPusher 返回状态码 ${response.status}`);
  }
  const result = await readJson(response);
  if (result.code !== 1000 || result.success !== true) {
    throw new Error("WxPusher 未接受通知");
  }
};
