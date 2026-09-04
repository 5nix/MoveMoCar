export const fetchWithTimeout = async (
  input: string,
  init: RequestInit,
  timeoutMs = 8000,
) => {
  const controller = new AbortController();
  const parentSignal = init.signal;
  const abortFromParent = () => controller.abort(parentSignal?.reason);
  if (parentSignal?.aborted) {
    abortFromParent();
  } else {
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });
  }
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      cache: "no-store",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
    parentSignal?.removeEventListener("abort", abortFromParent);
  }
};

export const readJson = async (response: Response): Promise<Record<string, unknown>> => {
  const value: unknown = await response.json();
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("推送服务返回了无效响应");
  }
  return value as Record<string, unknown>;
};
