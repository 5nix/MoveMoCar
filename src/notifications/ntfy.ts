import type { NtfyChannel } from "../config";
import { fetchWithTimeout, readJson } from "./http";
import type { NotificationSubmission } from "./types";
import { t } from "../i18n";

export const sendNtfy = async (
  channel: NtfyChannel,
  submission: NotificationSubmission,
  signal?: AbortSignal,
) => {
  const response = await fetchWithTimeout(channel.server ?? "https://ntfy.sh", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      topic: channel.topic,
      title: submission.vehicleTitle,
      message: `${t(submission.locale, "notification.from", { phone: submission.phone })}\n${t(submission.locale, "notification.message", { message: submission.message })}`,
      priority: 4,
      click: `tel:${submission.phone}`,
      actions: [
        {
          action: "view",
          label: t(submission.locale, "notification.callBack"),
          url: `tel:${submission.phone}`,
          clear: true,
        },
      ],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`ntfy 返回状态码 ${response.status}`);
  }
  const result = await readJson(response);
  if (typeof result.id !== "string" || result.topic !== channel.topic) {
    throw new Error("ntfy 未接受通知");
  }
};
