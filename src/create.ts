import "./create.css";
import QRCode from "qrcode";
import addIcon from "@material-symbols/svg-400/outlined/add.svg?url";
import checkIcon from "@material-symbols/svg-400/outlined/check.svg?url";
import closeIcon from "@material-symbols/svg-400/outlined/close.svg?url";
import copyIcon from "@material-symbols/svg-400/outlined/content_copy.svg?url";
import deleteIcon from "@material-symbols/svg-400/outlined/delete.svg?url";
import carIcon from "@material-symbols/svg-400/outlined/directions_car.svg?url";
import downloadIcon from "@material-symbols/svg-400/outlined/download.svg?url";
import shareIcon from "@material-symbols/svg-400/outlined/ios_share.svg?url";
import tutorialIcon from "@material-symbols/svg-400/outlined/menu_book.svg?url";
import notificationsIcon from "@material-symbols/svg-400/outlined/notifications.svg?url";
import notificationActiveIcon from "@material-symbols/svg-400/outlined/notifications_active.svg?url";
import qrIcon from "@material-symbols/svg-400/outlined/qr_code_2.svg?url";
import refreshIcon from "@material-symbols/svg-400/outlined/refresh.svg?url";
import sendIcon from "@material-symbols/svg-400/outlined/send.svg?url";
import terminalIcon from "@material-symbols/svg-400/outlined/terminal.svg?url";
import webhookIcon from "@material-symbols/svg-400/outlined/webhook.svg?url";
import barkIcon from "./assets/bark.svg?url";
import {
  encodeMoveCode,
  normalizeVehiclePlate,
  validateUrlConfig,
  type PushChannel,
  type UrlMoveMoCarConfig,
} from "./config";
import { sendNotifications, type NotificationSubmission } from "./notifications";
import { parseBarkAddress } from "./notifications/bark";
import { escapeHtml } from "./webhook";
import { t } from "./i18n";
import { installLanguagePicker, renderBrandLockup, renderLanguageButton } from "./language-picker";
import { defaultLocale, resolveLocale, type Locale } from "./locale";
import { normalizePhoneInput } from "./limits";

type ChannelType = PushChannel["type"];
type TestStatus = "idle" | "testing" | "success" | "error";

interface DraftChannel {
  id: string;
  type: ChannelType;
  name: string;
  status: TestStatus;
  revision: number;
  key: string;
  spt: string;
  topic: string;
  url: string;
  method: "POST" | "PUT" | "PATCH";
  headersText: string;
  bodyText: string;
}

interface GeneratedCode {
  url: string;
  png: string;
}

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("App root not found");
}

const siteRecord = import.meta.env.VITE_FOOTER_TEXT?.trim() ?? "";
let locale = resolveLocale();
document.documentElement.lang = locale;
document.title = `${t(locale, "creator.title")} · MoveMoCar`;

const updateCreateSeo = () => {
  const isEnglish = locale === "en";
  const isChinese = locale === "zh-CN";
  const title = isEnglish
    ? "Create a MoveMoCar code | MoveMoCar"
    : isChinese
      ? "生成挪车码｜MoveMoCar"
      : `${t(locale, "creator.title")} · MoveMoCar`;
  const description = isEnglish
    ? "Create a parking contact QR code with optional notification channels. No account or backend required."
    : isChinese
      ? "在线配置联系电话和通知渠道，生成无需账号、无需后端的 MoveMoCar 挪车二维码。"
      : "Create a parking contact QR code with optional notification channels. No account or backend required.";
  document.title = title;
  const setMeta = (selector: string, content: string) =>
    document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content);
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[property="og:locale"]', isChinese ? "zh_CN" : locale.replace("-", "_"));
  setMeta('meta[property="og:locale:alternate"]', isEnglish ? "zh_CN" : "en_US");
  setMeta('meta[property="og:image:alt"]', isEnglish
    ? "A MoveMoCar parking contact code placed inside a car windshield"
    : "MoveMoCar 挪车码放置在汽车前挡风玻璃内");
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[name="twitter:image:alt"]', isEnglish
    ? "A MoveMoCar parking contact code placed inside a car windshield"
    : "MoveMoCar 挪车码放置在汽车前挡风玻璃内");

  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const chineseAlternate = document.querySelector<HTMLLinkElement>('link[rel="alternate"][hreflang="zh-CN"]');
  if (canonical && chineseAlternate) {
    const localizedCanonical = isEnglish ? `${chineseAlternate.href}?lang=en` : chineseAlternate.href;
    canonical.href = localizedCanonical;
    setMeta('meta[property="og:url"]', localizedCanonical);
    const structuredData = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (structuredData?.textContent) {
      try {
        const data = JSON.parse(structuredData.textContent);
        const webPage = Array.isArray(data["@graph"])
          ? data["@graph"].find((item: { "@type"?: string }) => item["@type"] === "WebPage")
          : undefined;
        if (webPage) {
          webPage["@id"] = `${localizedCanonical}#webpage`;
          webPage.url = localizedCanonical;
          webPage.name = title;
          webPage.description = description;
          webPage.inLanguage = isEnglish ? "en" : "zh-CN";
        }
        structuredData.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
      } catch {
        // Ignore malformed third-party structured data instead of breaking the creator.
      }
    }
  }
};

updateCreateSeo();

const icons: Record<string, string> = {
  add: addIcon,
  bark: barkIcon,
  car: carIcon,
  check: checkIcon,
  close: closeIcon,
  copy: copyIcon,
  delete: deleteIcon,
  download: downloadIcon,
  tutorial: tutorialIcon,
  ntfy: terminalIcon,
  notify: notificationActiveIcon,
  qr: qrIcon,
  refresh: refreshIcon,
  send: sendIcon,
  share: shareIcon,
  webhook: webhookIcon,
  wxpusher: notificationsIcon,
};

const symbol = (name: keyof typeof icons, className = "") => {
  const iconUrl = icons[name].replace(/'/g, "%27").replace(/"/g, "%22");
  return `<span class="symbol ${className}" style="--symbol: url(&quot;${iconUrl}&quot;)" aria-hidden="true"></span>`;
};

let providerNames: Record<ChannelType, string> = {
  bark: "Bark",
  wxpusher: "WxPusher",
  ntfy: "ntfy",
  webhook: t(locale, "creator.provider.webhook"),
};

let providerDescriptions: Record<ChannelType, string> = {
  bark: t(locale, "creator.provider.barkDescription"),
  wxpusher: t(locale, "creator.provider.wxpusherDescription"),
  ntfy: t(locale, "creator.provider.ntfyDescription"),
  webhook: t(locale, "creator.provider.webhookDescription"),
};

let statusText: Record<TestStatus, string> = {
  idle: t(locale, "creator.status.idle"),
  testing: t(locale, "creator.status.testing"),
  success: t(locale, "creator.status.success"),
  error: t(locale, "creator.status.error"),
};

let channels: DraftChannel[] = [];
let notificationsEnabled = true;
let generated: GeneratedCode | undefined;
let pickerOpen = false;
let tutorialOpen: ChannelType | undefined;
let modalClosing = false;
let busy = false;
let configurationRevision = 0;
let phoneTouched = false;
let enteringChannelId: string | undefined;
let animateGenerated = false;
let channelMotion: "opening" | "closing" | undefined;

const createId = () => crypto.randomUUID();

const createShortRandomCode = () => {
  const range = 36 ** 4;
  const ceiling = Math.floor(2 ** 32 / range) * range;
  const values = new Uint32Array(1);
  do {
    crypto.getRandomValues(values);
  } while (values[0] >= ceiling);
  return (values[0] % range).toString(36).padStart(4, "0");
};

const createTopic = () => {
  const timeCode = Math.floor(Date.now() / 1000).toString(36);
  let topic = "";
  do {
    topic = `mmc_${timeCode}${createShortRandomCode()}`;
  } while (channels.some((channel) => channel.topic === topic));
  return topic;
};

const countProvider = (type: ChannelType) =>
  channels.filter((channel) => channel.type === type).length + 1;

const newChannel = (type: ChannelType): DraftChannel => {
  const count = countProvider(type);
  return {
    id: createId(),
    type,
    name: count === 1 ? providerNames[type] : `${providerNames[type]} ${count}`,
    status: "idle",
    revision: 0,
    key: "",
    spt: "",
    topic: type === "ntfy" ? createTopic() : "",
    url: "",
    method: "POST",
    headersText: '{\n  "Content-Type": "application/json"\n}',
    bodyText:
      '{\n  "title": "{{vehicleTitle}}",\n  "phone": "{{phone}}",\n  "message": "{{message}}",\n  "url": "tel:{{phone}}"\n}',
  };
};

const renderChannelFields = (channel: DraftChannel) => {
  switch (channel.type) {
    case "bark":
      return `
        <div class="field field--wide">
          <label for="channel-${channel.id}-key">${t(locale, "creator.field.barkAddress")}</label>
          <input id="channel-${channel.id}-key" data-channel-id="${channel.id}" data-field="key" value="${escapeHtml(channel.key)}" autocomplete="off" spellcheck="false" />
        </div>
      `;
    case "wxpusher":
      return `
        <div class="field field--wide">
          <label for="channel-${channel.id}-spt">SPT</label>
          <input id="channel-${channel.id}-spt" data-channel-id="${channel.id}" data-field="spt" value="${escapeHtml(channel.spt)}" autocomplete="off" spellcheck="false" />
        </div>
      `;
    case "ntfy":
      return `
        <div class="field field--wide">
          <label for="channel-${channel.id}-topic">${t(locale, "creator.field.topic")}</label>
          <div class="field-action field-action--topic">
            <input id="channel-${channel.id}-topic" value="${escapeHtml(channel.topic)}" readonly aria-readonly="true" spellcheck="false" />
            <button class="icon-button" type="button" data-action="copy-topic" data-channel-id="${channel.id}" aria-label="${t(locale, "creator.action.copyTopic")}">
              ${symbol("copy")}
            </button>
            <button class="icon-button" type="button" data-action="refresh-topic" data-channel-id="${channel.id}" aria-label="${t(locale, "creator.action.newTopic")}">
              ${symbol("refresh")}
            </button>
            <a class="topic-subscribe-button" href="ntfy://ntfy.sh/${encodeURIComponent(channel.topic)}">${t(locale, "creator.action.subscribe")}</a>
          </div>
        </div>
      `;
    case "webhook":
      return `
        <div class="channel-form channel-form--webhook">
          <div class="field field--url">
            <label for="channel-${channel.id}-url">${t(locale, "creator.field.requestUrl")}</label>
            <input id="channel-${channel.id}-url" data-channel-id="${channel.id}" data-field="url" value="${escapeHtml(channel.url)}" inputmode="url" autocomplete="url" spellcheck="false" />
          </div>
          <div class="field field--method">
            <label for="channel-${channel.id}-method">${t(locale, "creator.field.requestMethod")}</label>
            <select id="channel-${channel.id}-method" data-channel-id="${channel.id}" data-field="method">
              ${["POST", "PUT", "PATCH"].map((method) => `<option${channel.method === method ? " selected" : ""}>${method}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="channel-${channel.id}-headers">${t(locale, "creator.field.headers")}</label>
            <textarea id="channel-${channel.id}-headers" data-channel-id="${channel.id}" data-field="headersText" spellcheck="false">${escapeHtml(channel.headersText)}</textarea>
          </div>
          <div class="field">
            <label for="channel-${channel.id}-body">${t(locale, "creator.field.body")}</label>
            <textarea id="channel-${channel.id}-body" data-channel-id="${channel.id}" data-field="bodyText" spellcheck="false">${escapeHtml(channel.bodyText)}</textarea>
          </div>
        </div>
      `;
  }
};

const renderChannel = (channel: DraftChannel) => `
  <article class="channel-card${channel.id === enteringChannelId ? " channel-card--entering" : ""}" data-id="${channel.id}">
    <header class="channel-card__header">
      <div class="channel-card__identity">
        <span class="provider-icon">${symbol(channel.type)}</span>
        <div>
          <h3>${escapeHtml(channel.name)}</h3>
          <span class="channel-status channel-status--${channel.status}">${statusText[channel.status]}</span>
        </div>
      </div>
      <div class="channel-card__actions">
        ${
          channel.type !== "webhook"
            ? `<button class="tutorial-button" type="button" data-action="open-tutorial" data-provider="${channel.type}">${symbol("tutorial")}<span>${t(locale, "creator.action.tutorial")}</span></button>`
            : ""
        }
        <button class="icon-button" type="button" data-action="delete-channel" data-channel-id="${channel.id}" aria-label="${escapeHtml(t(locale, "creator.action.deleteChannel", { channel: channel.name }))}">
          ${symbol("delete")}
        </button>
      </div>
    </header>
    <div class="channel-card__body">
      ${renderChannelFields(channel)}
    </div>
    <div class="channel-test-row">
      <span class="channel-test-hint">
        ${channel.status === "success" ? "" : t(locale, "creator.action.testHint")}
      </span>
      <button class="test-button" type="button" data-action="test-channel" data-channel-id="${channel.id}"${channel.status === "testing" ? " disabled" : ""}>
        ${channel.status === "testing" ? '<span class="spinner" aria-hidden="true"></span>' : symbol(channel.status === "success" ? "check" : "send")}
        <span>${channel.status === "testing" ? t(locale, "creator.status.testing") : t(locale, "creator.action.sendTest")}</span>
      </button>
    </div>
  </article>
`;

const renderPicker = () => {
  if (!pickerOpen) {
    return "";
  }
  return `
    <div class="modal-layer scroll-modal-layer" data-action="close-picker">
      <section class="provider-picker scroll-modal-card" role="dialog" aria-modal="true" aria-labelledby="provider-title">
        <header>
          <h2 id="provider-title">${t(locale, "creator.dialog.addChannel")}</h2>
          <button class="icon-button" type="button" data-action="close-picker" aria-label="${t(locale, "common.close")}">${symbol("close")}</button>
        </header>
        <div class="provider-list scroll-modal-content">
          ${(Object.keys(providerNames) as ChannelType[])
            .map(
              (type) => `
                <button type="button" class="provider-option" data-action="choose-provider" data-provider="${type}">
                  <span class="provider-icon">${symbol(type)}</span>
                  <span class="provider-option__text">
                    <strong>${providerNames[type]}</strong>
                    <small>${providerDescriptions[type]}</small>
                  </span>
                </button>
              `,
            )
            .join("")}
        </div>
      </section>
    </div>
  `;
};

const renderTutorial = () => {
  if (!tutorialOpen || tutorialOpen === "webhook") {
    return "";
  }

  const inlineWordSeparator = ["zh-CN", "zh-TW", "ja", "ko"].includes(locale) ? "" : " ";

  const tutorials: Record<Exclude<ChannelType, "webhook">, string> = {
    bark: `
      <li>
        <span>${t(locale, "tutorial.bark.1")}</span>
        <a href="https://apps.apple.com/cn/app/bark-%E7%BB%99%E4%BD%A0%E7%9A%84%E6%89%8B%E6%9C%BA%E5%8F%91%E6%8E%A8%E9%80%81/id1403753865" target="_blank" rel="noopener noreferrer">${t(locale, "tutorial.appStore")}</a>
        <a href="https://bark.day.app/" target="_blank" rel="noopener noreferrer">${t(locale, "tutorial.website")}</a>
      </li>
      <li>${t(locale, "tutorial.bark.2")}</li>
      <li>${t(locale, "tutorial.bark.3a")}${inlineWordSeparator}<strong>${t(locale, "tutorial.bark.3b")}</strong>${inlineWordSeparator}${t(locale, "tutorial.bark.3c")}</li>
      <li>${t(locale, "tutorial.bark.4")}</li>
    `,
    wxpusher: `
      <li>
        <span>${t(locale, "tutorial.wxpusher.1")}</span>
        <a href="https://wxpusher.zjiecode.com/" target="_blank" rel="noopener noreferrer">${t(locale, "tutorial.website")}</a>
      </li>
      <li>${t(locale, "tutorial.wxpusher.2")}</li>
      <li>${t(locale, "tutorial.wxpusher.3")}</li>
      <li>${t(locale, "tutorial.wxpusher.4")}</li>
    `,
    ntfy: `
      <li>
        <span>${t(locale, "tutorial.ntfy.1")}</span>
        <a href="https://ntfy.sh/" target="_blank" rel="noopener noreferrer">${t(locale, "tutorial.website")}</a>
      </li>
      <li>${t(locale, "tutorial.ntfy.2")}</li>
      <li>${t(locale, "tutorial.ntfy.3")}</li>
      <li>${t(locale, "tutorial.ntfy.4")}</li>
      <li>${t(locale, "tutorial.ntfy.5")}</li>
    `,
  };

  return `
    <div class="modal-layer scroll-modal-layer" data-action="close-tutorial">
      <section class="tutorial-dialog scroll-modal-card" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <header>
          <h2 id="tutorial-title">${escapeHtml(t(locale, "creator.dialog.tutorialTitle", { provider: providerNames[tutorialOpen] }))}</h2>
          <button class="icon-button" type="button" data-action="close-tutorial" aria-label="${t(locale, "common.close")}">${symbol("close")}</button>
        </header>
        <ol class="tutorial-steps scroll-modal-content">
          ${tutorials[tutorialOpen]}
        </ol>
      </section>
    </div>
  `;
};

const normalizePlateForConfig = (value: string) => normalizeVehiclePlate(value);

const getFormValues = () => ({
  car: normalizePlateForConfig(
    app.querySelector<HTMLInputElement>("#vehicle-plate")?.value ?? "",
  ),
  num: normalizePhoneInput(
    app.querySelector<HTMLInputElement>("#owner-phone")?.value ?? "",
  ),
});

const parseJsonRecord = (value: string, label: string): Record<string, string> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(t(locale, "creator.error.invalidJson", { label }));
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(t(locale, "creator.error.invalidJson", { label }));
  }
  return parsed as Record<string, string>;
};

const toPushChannel = (draft: DraftChannel): PushChannel => {
  switch (draft.type) {
    case "bark": {
      return parseBarkAddress(draft.key, draft.name);
    }
    case "wxpusher":
      return { type: "wxpusher", name: draft.name, spt: draft.spt.trim() };
    case "ntfy":
      return { type: "ntfy", name: draft.name, topic: draft.topic.trim() };
    case "webhook":
      return {
        type: "webhook",
        name: draft.name,
        url: draft.url.trim(),
        method: draft.method,
        headers: parseJsonRecord(draft.headersText, t(locale, "creator.field.headers")),
        bodyTemplate: parseJsonRecord(draft.bodyText, t(locale, "creator.field.body")),
      };
  }
};

const getRawConfig = (): UrlMoveMoCarConfig => {
  const { car, num } = getFormValues();
  return {
    v: 1,
    car,
    num,
    pushes: notificationsEnabled ? channels.map(toPushChannel) : [],
    locale,
  };
};

const validateConfig = () => {
  const raw = getRawConfig();
  const validated = validateUrlConfig(raw);
  return {
    v: 1,
    car: validated.vehiclePlate,
    num: validated.ownerPhone,
    pushes: validated.pushes,
    locale: validated.ownerLocale === defaultLocale ? undefined : validated.ownerLocale,
  } satisfies UrlMoveMoCarConfig;
};

const isReady = () => {
  if (
    busy ||
    (notificationsEnabled &&
      (channels.length === 0 || channels.some((channel) => channel.status !== "success")))
  ) {
    return false;
  }
  try {
    validateConfig();
    return true;
  } catch {
    return false;
  }
};

const render = () => {
  const plateValue = app.querySelector<HTMLInputElement>("#vehicle-plate")?.value ?? "";
  const phoneValue = app.querySelector<HTMLInputElement>("#owner-phone")?.value ?? "";
  const plate = normalizePlateForConfig(plateValue);
  const phoneInvalid = phoneTouched && phoneValue.replace(/\D/g, "").length === 0;
  const showEmpty = channels.length === 0;

  app.innerHTML = `
    <main class="creator-page">
      <header class="creator-hero">
        ${renderBrandLockup()}
        ${renderLanguageButton(locale)}
        <div class="hero-symbol">${symbol("qr")}</div>
        <h1>${t(locale, "creator.title")}</h1>
      </header>

      <div class="creator-layout">
        <form class="creator-form" novalidate>
          <section class="form-section">
            <header class="section-title">
              <span class="section-icon">${symbol("car")}</span>
              <h2>${t(locale, "creator.vehicleInfo")}</h2>
            </header>
            <div class="vehicle-fields">
              <div class="field">
                <label for="vehicle-plate">${t(locale, "creator.plate")}</label>
                <input id="vehicle-plate" name="vehiclePlate" value="${escapeHtml(plateValue)}" autocomplete="off" />
              </div>
              <div class="field${phoneInvalid ? " field--invalid" : ""}">
                <label for="owner-phone">${t(locale, "creator.ownerPhone")}</label>
                <input id="owner-phone" name="ownerPhone" value="${escapeHtml(phoneValue)}" type="tel" inputmode="numeric" autocomplete="tel" aria-invalid="${phoneInvalid}" />
              </div>
            </div>
          </section>

          <section class="form-section form-section--channels">
            <header class="section-title section-title--split">
              <div class="section-title__main">
                <span class="section-icon${notificationsEnabled ? "" : " section-icon--disabled"}">${symbol("notify")}</span>
                <h2>${t(locale, "creator.channels")}</h2>
              </div>
              <button class="notification-toggle" type="button" role="switch" aria-checked="${notificationsEnabled}" aria-label="${t(locale, "creator.enableChannels")}" data-action="toggle-notifications">
                <span aria-hidden="true"></span>
              </button>
            </header>

            <div class="channel-settings-shell channel-settings-shell--${notificationsEnabled ? "open" : "closed"}${channelMotion ? ` channel-settings-shell--${channelMotion}` : ""}"${notificationsEnabled ? "" : ' aria-hidden="true" inert'}>
              <div class="channel-settings">
                    <div class="channel-list${showEmpty ? " channel-list--empty" : ""}">
                      ${showEmpty ? `<div class="empty-channels">${symbol("notify")}<span>${t(locale, "creator.noChannels")}</span></div>` : channels.map(renderChannel).join("")}
                    </div>
                    <button class="add-button" type="button" data-action="open-picker"${channels.length >= 5 ? " disabled" : ""}>
                      ${symbol("add")}<span>${channels.length >= 5 ? t(locale, "creator.channelLimit") : t(locale, "creator.addChannel")}</span>
                    </button>
              </div>
            </div>
          </section>
        </form>

        <aside class="preview-panel">
          <header class="preview-title">
            <span class="section-icon">${symbol("qr")}</span>
            <h2>${t(locale, "creator.title")}</h2>
          </header>
          <button class="generate-button" type="button" data-action="generate"${isReady() ? "" : " disabled"}>
            ${busy ? '<span class="spinner" aria-hidden="true"></span>' : symbol("qr")}
            <span>${busy ? t(locale, "creator.generating") : generated ? t(locale, "creator.regenerate") : t(locale, "creator.generate")}</span>
          </button>
          <div class="qr-frame${generated ? " qr-frame--ready" : ""}${animateGenerated ? " qr-frame--entering" : ""}">
            ${generated ? `<img src="${generated.png}" alt="${t(locale, "creator.qrAlt")}" />` : symbol("qr", "qr-placeholder")}
          </div>
          <strong class="preview-plate">${escapeHtml(plate || t(locale, "creator.plate"))}</strong>
          <div class="preview-actions">
            <button type="button" data-action="download-png"${generated ? "" : " disabled"}>${symbol("download")}<span>${t(locale, "creator.download")}</span></button>
            <button type="button" data-action="copy" aria-label="${t(locale, "creator.copyLink")}"${generated ? ` data-url="${escapeHtml(generated.url)}"` : " disabled"}>${symbol("copy")}<span>${t(locale, "creator.copyLink")}</span></button>
            <button type="button" data-action="share-image"${generated && typeof navigator.share === "function" && typeof navigator.canShare === "function" ? "" : " disabled"}>${symbol("share")}<span>${t(locale, "creator.share")}</span></button>
          </div>
        </aside>
      </div>
      ${siteRecord ? `<footer class="site-record">${escapeHtml(siteRecord)}</footer>` : ""}
    </main>
    ${renderPicker()}
    ${renderTutorial()}
  `;

  if (pickerOpen) {
    app.querySelector<HTMLElement>(".provider-picker")?.focus();
  }
  enteringChannelId = undefined;
  animateGenerated = false;
  channelMotion = undefined;
};

const invalidate = () => {
  configurationRevision += 1;
  generated = undefined;
};

const closeCreatorModal = (
  kind: "picker" | "tutorial",
  afterClose?: () => void,
) => {
  if (modalClosing) {
    return;
  }

  const layer = app.querySelector<HTMLElement>(".modal-layer");
  let finished = false;
  const finish = () => {
    if (finished) {
      return;
    }
    finished = true;
    modalClosing = false;
    if (kind === "picker") {
      pickerOpen = false;
    } else {
      tutorialOpen = undefined;
    }
    afterClose?.();
    render();
  };

  if (!layer) {
    modalClosing = true;
    finish();
    return;
  }

  modalClosing = true;
  layer.classList.add("modal-layer--closing");
  layer.addEventListener(
    "animationend",
    (event) => {
      if (event.target === layer) {
        finish();
      }
    },
  );
  window.setTimeout(finish, 240);
};

const updateDraftField = (target: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
  const id = target.dataset.channelId;
  const field = target.dataset.field as keyof DraftChannel | undefined;
  const channel = channels.find((item) => item.id === id);
  if (!channel || !field) {
    return;
  }
  if (field === "method") {
    channel.method = target.value as DraftChannel["method"];
  } else if (typeof channel[field] === "string") {
    (channel[field] as string) = target.value;
  }
  channel.status = "idle";
  channel.revision += 1;
  invalidate();
  const card = target.closest<HTMLElement>(".channel-card");
  const status = card?.querySelector<HTMLElement>(".channel-status");
  if (status) {
    status.className = "channel-status channel-status--idle";
    status.textContent = statusText.idle;
  }
  const generateButton = app.querySelector<HTMLButtonElement>("[data-action='generate']");
  if (generateButton) {
    generateButton.disabled = true;
  }
};

const createSubmission = (): NotificationSubmission => {
  const car = getFormValues().car || t(locale, "creator.test.vehicle");
  return {
    locale,
    phone: "13800138000",
    message: t(locale, "creator.test.message"),
    submittedAt: new Date().toISOString(),
    pageUrl: new URL("../", window.location.href).toString(),
    vehiclePlate: car,
    vehicleTitle: t(locale, "notification.requestTitleWithCar", { car }),
  };
};

const testChannel = async (id: string) => {
  const channel = channels.find((item) => item.id === id);
  if (!channel || channel.status === "testing") {
    return;
  }

  const testedRevision = channel.revision;
  const resultStillApplies = () =>
    channels.includes(channel) && channel.revision === testedRevision;
  channel.status = "testing";
  render();
  try {
    const push = toPushChannel(channel);
    validateUrlConfig({
      v: 1,
      car: t(locale, "creator.test.vehicle"),
      num: "13800138000",
      pushes: [push],
      locale,
    });
    await sendNotifications([push], createSubmission());
    if (resultStillApplies()) {
      channel.status = "success";
    }
  } catch {
    if (resultStillApplies()) {
      channel.status = "error";
    }
  }
  render();
};

const createContactUrl = (config: UrlMoveMoCarConfig) => {
  const url = new URL("../m/", window.location.href);
  url.search = "";
  url.hash = encodeMoveCode(config);
  return url.toString();
};

const generateCode = async () => {
  if (!isReady()) {
    return;
  }
  const generatedRevision = configurationRevision;
  busy = true;
  render();
  try {
    const config = validateConfig();
    const url = createContactUrl(config);
    const png = await QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 960,
      color: { dark: "#000000", light: "#ffffff" },
    });
    if (configurationRevision === generatedRevision) {
      generated = { url, png };
      animateGenerated = true;
    }
  } catch {
    generated = undefined;
  } finally {
    busy = false;
    render();
  }
};

const download = (content: string, filename: string) => {
  const anchor = document.createElement("a");
  anchor.download = filename;
  anchor.href = content;
  anchor.click();
};

const showCopiedFeedback = (button: HTMLButtonElement) => {
  if (button.dataset.copyFeedback === "active") {
    return;
  }
  const originalMarkup = button.innerHTML;
  const originalLabel = button.getAttribute("aria-label");
  const iconOnly = button.classList.contains("icon-button");
  button.dataset.copyFeedback = "active";
  button.classList.add("copy-button--success");
  button.setAttribute("aria-label", t(locale, "common.copied"));
  button.innerHTML = `${symbol("check")}${iconOnly ? "" : `<span class="copy-button__success-text">${t(locale, "common.copied")}</span>`}`;

  window.setTimeout(() => {
    if (!button.isConnected) {
      return;
    }
    button.innerHTML = originalMarkup;
    button.classList.remove("copy-button--success");
    delete button.dataset.copyFeedback;
    if (originalLabel) {
      button.setAttribute("aria-label", originalLabel);
    } else {
      button.removeAttribute("aria-label");
    }
  }, 1000);
};

const copyText = async (value: string, button: HTMLButtonElement) => {
  try {
    await navigator.clipboard.writeText(value);
    showCopiedFeedback(button);
  } catch {
    // Clipboard availability is browser-controlled; keep the page visually quiet.
  }
};

const pngFileFromDataUrl = (dataUrl: string, filename: string) => {
  const encoded = dataUrl.split(",", 2)[1];
  if (!encoded) {
    throw new Error("Invalid PNG data URL");
  }
  const binary = window.atob(encoded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new File([bytes], filename, { type: "image/png" });
};

const shareImage = async () => {
  if (!generated || typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    return;
  }
  try {
    const file = pngFileFromDataUrl(
      generated.png,
      `MoveMoCar-${getFormValues().car}.png`,
    );
    if (!navigator.canShare({ files: [file] })) {
      return;
    }
    await navigator.share({ files: [file], title: t(locale, "creator.shareTitle") });
  } catch {
    // Closing the native share sheet is a normal outcome and needs no page message.
  }
};

const releasePressedButtons = () => {
  app.querySelectorAll(".button--pressed").forEach((button) => {
    button.classList.remove("button--pressed");
  });
};

const getInteractiveControl = (target: EventTarget | null) => {
  if (!(target instanceof Element)) {
    return undefined;
  }
  const control = target.closest<HTMLElement>(
    "button, a.icon-button, a.topic-subscribe-button",
  );
  if (control instanceof HTMLButtonElement && control.disabled) {
    return undefined;
  }
  return control ?? undefined;
};

app.addEventListener("pointerdown", (event) => {
  const control = getInteractiveControl(event.target);
  if (!control) {
    return;
  }
  releasePressedButtons();
  control.classList.add("button--pressed");
});

app.addEventListener("click", (event) => {
  const control = getInteractiveControl(event.target);
  if (!control) {
    return;
  }
  control.classList.remove("button--tapped");
  void control.offsetWidth;
  control.classList.add("button--tapped");
  control.addEventListener(
    "animationend",
    () => control.classList.remove("button--tapped"),
    { once: true },
  );
});

window.addEventListener("pointerup", releasePressedButtons, { passive: true });
window.addEventListener("pointercancel", releasePressedButtons, { passive: true });
window.addEventListener("blur", releasePressedButtons);

app.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return;
  }

  if (target.id === "owner-phone") {
    target.value = normalizePhoneInput(target.value);
    target.closest(".field")?.classList.remove("field--invalid");
    target.setAttribute("aria-invalid", "false");
    invalidate();
  } else if (target.id === "vehicle-plate") {
    invalidate();
    const preview = app.querySelector<HTMLElement>(".preview-plate");
    if (preview) {
      preview.textContent = normalizePlateForConfig(target.value) || t(locale, "creator.plate");
    }
  } else {
    updateDraftField(target);
  }

  const button = app.querySelector<HTMLButtonElement>("[data-action='generate']");
  if (button) {
    button.disabled = !isReady();
  }
});

app.addEventListener("focusout", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  let invalid = false;
  if (target.id === "owner-phone") {
    phoneTouched = true;
    invalid = target.value.length === 0;
  } else {
    return;
  }

  target.closest(".field")?.classList.toggle("field--invalid", invalid);
  target.setAttribute("aria-invalid", String(invalid));
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement) {
    updateDraftField(target);
  }
});

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const actionButton = target.closest<HTMLElement>("[data-action]");
  const action = actionButton?.dataset.action;
  if (!action) {
    return;
  }

  if (
    (action === "close-picker" || action === "close-tutorial") &&
    actionButton.classList.contains("modal-layer") &&
    target !== actionButton
  ) {
    return;
  }

  switch (action) {
    case "toggle-notifications":
      notificationsEnabled = !notificationsEnabled;
      channelMotion = notificationsEnabled ? "opening" : "closing";
      invalidate();
      render();
      break;
    case "open-picker":
      pickerOpen = true;
      render();
      break;
    case "close-picker":
      closeCreatorModal("picker");
      break;
    case "open-tutorial":
      tutorialOpen = actionButton.dataset.provider as ChannelType;
      render();
      break;
    case "close-tutorial":
      closeCreatorModal("tutorial");
      break;
    case "choose-provider": {
      const type = actionButton.dataset.provider as ChannelType;
      if (channels.length < 5 && type in providerNames) {
        closeCreatorModal("picker", () => {
          const channel = newChannel(type);
          channels.push(channel);
          enteringChannelId = channel.id;
          invalidate();
        });
      }
      break;
    }
    case "delete-channel":
      channels = channels.filter((channel) => channel.id !== actionButton.dataset.channelId);
      invalidate();
      render();
      break;
    case "refresh-topic": {
      const channel = channels.find((item) => item.id === actionButton.dataset.channelId);
      if (channel) {
        channel.topic = createTopic();
        channel.status = "idle";
        channel.revision += 1;
        invalidate();
        render();
      }
      break;
    }
    case "copy-topic": {
      const channel = channels.find((item) => item.id === actionButton.dataset.channelId);
      if (channel && actionButton instanceof HTMLButtonElement) {
        void copyText(channel.topic, actionButton);
      }
      break;
    }
    case "test-channel":
      void testChannel(actionButton.dataset.channelId ?? "");
      break;
    case "generate":
      void generateCode();
      break;
    case "copy":
      if (generated && actionButton instanceof HTMLButtonElement) {
        void copyText(generated.url, actionButton);
      }
      break;
    case "download-png":
      if (generated) {
        download(generated.png, `MoveMoCar-${getFormValues().car}.png`);
      }
      break;
    case "share-image":
      void shareImage();
      break;
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (tutorialOpen) {
      closeCreatorModal("tutorial");
    } else if (pickerOpen) {
      closeCreatorModal("picker");
    }
  }
});

installLanguagePicker(locale, (nextLocale: Locale) => {
  locale = nextLocale;
  document.documentElement.lang = locale;
  updateCreateSeo();
  providerNames = {
    bark: "Bark",
    wxpusher: "WxPusher",
    ntfy: "ntfy",
    webhook: t(locale, "creator.provider.webhook"),
  };
  providerDescriptions = {
    bark: t(locale, "creator.provider.barkDescription"),
    wxpusher: t(locale, "creator.provider.wxpusherDescription"),
    ntfy: t(locale, "creator.provider.ntfyDescription"),
    webhook: t(locale, "creator.provider.webhookDescription"),
  };
  statusText = {
    idle: t(locale, "creator.status.idle"),
    testing: t(locale, "creator.status.testing"),
    success: t(locale, "creator.status.success"),
    error: t(locale, "creator.status.error"),
  };
  const providerCounts = new Map<ChannelType, number>();
  channels.forEach((channel) => {
    const count = (providerCounts.get(channel.type) ?? 0) + 1;
    providerCounts.set(channel.type, count);
    channel.name = count === 1
      ? providerNames[channel.type]
      : `${providerNames[channel.type]} ${count}`;
  });
  invalidate();
  render();
});
render();
