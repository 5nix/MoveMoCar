import type { WebhookChannel } from "./config";
import { fetchWithTimeout } from "./notifications/http";

export interface TemplateValues {
  phone: string;
  message: string;
  submittedAt: string;
  pageUrl: string;
  vehiclePlate: string;
  vehicleTitle: string;
}

interface RenderValues extends TemplateValues {
  phoneHtml: string;
  messageHtml: string;
  submittedAtHtml: string;
  pageUrlHtml: string;
  vehiclePlateHtml: string;
  vehicleTitleHtml: string;
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });

const createRenderValues = (values: TemplateValues): RenderValues => ({
  ...values,
  phoneHtml: escapeHtml(values.phone),
  messageHtml: escapeHtml(values.message),
  submittedAtHtml: escapeHtml(values.submittedAt),
  pageUrlHtml: escapeHtml(values.pageUrl),
  vehiclePlateHtml: escapeHtml(values.vehiclePlate),
  vehicleTitleHtml: escapeHtml(values.vehicleTitle),
});

const templatePattern =
  /{{\s*(phone|message|submittedAt|pageUrl|vehiclePlate|vehicleTitle|phoneHtml|messageHtml|submittedAtHtml|pageUrlHtml|vehiclePlateHtml|vehicleTitleHtml)\s*}}/g;

const renderString = (template: string, values: RenderValues) =>
  template.replace(templatePattern, (_, key: keyof RenderValues) => values[key]);

const urlTemplatePattern =
  /{{\s*(phone|message|submittedAt|pageUrl|vehiclePlate|vehicleTitle)\s*}}/g;

export const renderUrlTemplate = (template: string, values: TemplateValues) =>
  template.replace(urlTemplatePattern, (_, key: keyof TemplateValues) =>
    encodeURIComponent(values[key]),
  );

const renderTemplate = (template: unknown, values: RenderValues): unknown => {
  if (typeof template === "string") {
    return renderString(template, values);
  }

  if (Array.isArray(template)) {
    return template.map((item) => renderTemplate(item, values));
  }

  if (typeof template === "object" && template !== null) {
    return Object.fromEntries(
      Object.entries(template).map(([key, value]) => [key, renderTemplate(value, values)]),
    );
  }

  return template;
};

const renderHeaders = (
  headers: Record<string, string> | undefined,
  values: RenderValues,
) =>
  Object.fromEntries(
    Object.entries(headers ?? {}).map(([key, value]) => [key, renderString(value, values)]),
  );

export const sendWebhook = async (
  config: WebhookChannel,
  values: TemplateValues,
  signal?: AbortSignal,
): Promise<void> => {
  const renderValues = createRenderValues(values);
  const renderedBody = renderTemplate(config.bodyTemplate, renderValues);
  const headers = renderHeaders(config.headers, renderValues);
  const method = config.method.toUpperCase();

  const response = await fetchWithTimeout(
    renderUrlTemplate(config.url, values),
    {
      method,
      headers,
      body:
        method === "GET" || method === "HEAD" || renderedBody === undefined
          ? undefined
          : typeof renderedBody === "string"
            ? renderedBody
            : JSON.stringify(renderedBody),
      signal,
    },
    config.timeoutMs ?? 8000,
  );

  const [minimum, maximum] = config.successStatus ?? [200, 299];
  if (response.status < minimum || response.status > maximum) {
    throw new Error(`Webhook 返回状态码 ${response.status}`);
  }
};
