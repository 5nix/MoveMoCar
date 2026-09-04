import type { PushChannel } from "../config";
import { sendWebhook } from "../webhook";
import { sendBark } from "./bark";
import { sendNtfy } from "./ntfy";
import type { NotificationSubmission } from "./types";
import { sendWxPusher } from "./wxpusher";

export type { NotificationSubmission } from "./types";

export const SUCCESS_GRACE_PERIOD_MS = 2000;

const sendNotification = (
  channel: PushChannel,
  submission: NotificationSubmission,
  signal?: AbortSignal,
): Promise<void> => {
  switch (channel.type) {
    case "bark":
      return sendBark(channel, submission, signal);
    case "wxpusher":
      return sendWxPusher(channel, submission, signal);
    case "ntfy":
      return sendNtfy(channel, submission, signal);
    case "webhook":
      return sendWebhook(channel, submission, signal);
  }
};

export const sendNotifications = async (
  channels: PushChannel[],
  submission: NotificationSubmission,
) => {
  const controller = new AbortController();
  const requests = channels.map((channel) =>
    sendNotification(channel, submission, controller.signal),
  );
  const settled = Promise.allSettled(requests);

  try {
    await Promise.any(requests);
  } catch {
    const results = await settled;
    throw new AggregateError(
      results
        .filter((result): result is PromiseRejectedResult => result.status === "rejected")
        .map((result) => result.reason),
      "全部推送渠道均发送失败",
    );
  }

  let graceTimer: number | undefined;
  const graceElapsed = new Promise<"grace">((resolve) => {
    graceTimer = window.setTimeout(() => resolve("grace"), SUCCESS_GRACE_PERIOD_MS);
  });
  const outcome = await Promise.race([
    settled.then(() => "settled" as const),
    graceElapsed,
  ]);
  if (graceTimer !== undefined) {
    window.clearTimeout(graceTimer);
  }
  if (outcome === "grace") {
    controller.abort();
  }
};
