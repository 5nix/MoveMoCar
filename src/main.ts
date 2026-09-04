import "./styles.css";
import callIcon from "/assets/call.svg?url";
import carIcon from "/assets/car-crash.svg?url";
import checkIcon from "/assets/check.svg?url";
import warningIcon from "@material-symbols/svg-400/outlined/priority_high.svg?url";
import brandMark from "./assets/movemocar-mark.svg?url";
import {
  getEmergencyPhoneFallback,
  hasUrlConfig,
  loadConfig,
  type MoveMoCarConfig,
} from "./config";
import { sendNotifications, type NotificationSubmission } from "./notifications";
import { escapeHtml } from "./webhook";
import { t } from "./i18n";
import { installLanguagePicker, renderBrandLockup, renderLanguageButton } from "./language-picker";
import { resolveLocale, type Locale } from "./locale";
import { normalizePhoneInput } from "./limits";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found");
}

const iconMask = (url: string, className = "") => {
  const iconUrl = url.replace(/'/g, "%27").replace(/"/g, "%22");
  return `<span class="masked-icon ${className}" style="--masked-icon: url(&quot;${iconUrl}&quot;)" aria-hidden="true"></span>`;
};

const siteRecord = import.meta.env.VITE_FOOTER_TEXT?.trim() ?? "";
const isDemoPage = /\/m\/demo\/?$/.test(window.location.pathname);
let locale = resolveLocale();
document.documentElement.lang = locale;
document.title = `${t(locale, "visitor.title")} · MoveMoCar`;

const syncVisualViewportInset = () => {
  const viewport = window.visualViewport;
  const obstruction = viewport
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0;
  document.documentElement.style.setProperty(
    "--viewport-bottom-obstruction",
    `${Math.round(obstruction)}px`,
  );
};

syncVisualViewportInset();
window.visualViewport?.addEventListener("resize", syncVisualViewportInset, { passive: true });
window.visualViewport?.addEventListener("scroll", syncVisualViewportInset, { passive: true });

app.innerHTML = `
  <main class="move-page">
    <header class="hero">
      ${renderBrandLockup()}
      ${renderLanguageButton(locale)}
      <div class="hero__content">
        <div class="hero__icon" aria-hidden="true">
          ${iconMask(carIcon, "hero__glyph")}
        </div>
        <h1>${t(locale, "visitor.title")}</h1>
        <div class="hero__description">
          <p>${t(locale, "visitor.description1")}</p>
          <p>${t(locale, "visitor.description2")}</p>
        </div>
      </div>
    </header>

    <form class="contact-form" novalidate>
      <div class="field field--phone">
        <label for="phone">${t(locale, "visitor.phoneLabel")}</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputmode="numeric"
          autocomplete="tel"
          aria-describedby="phone-error"
        />
        <p id="phone-error" class="sr-only" aria-live="polite"></p>
      </div>

      <div class="field field--message">
        <label for="message">${t(locale, "visitor.messageLabel")}</label>
        <textarea id="message" name="message" maxlength="200"></textarea>
      </div>

      <button class="emergency-link" type="button" hidden>${t(locale, "visitor.emergencyLink")}</button>

      <p class="form-status" role="status" aria-live="polite"></p>

      <button class="submit-button" type="submit" disabled>${t(locale, "visitor.notifyOwner")}</button>
    </form>

    ${siteRecord ? `<footer class="site-record">${escapeHtml(siteRecord)}</footer>` : ""}
  </main>
`;

const form = app.querySelector<HTMLFormElement>(".contact-form");
const phoneInput = app.querySelector<HTMLInputElement>("#phone");
const messageInput = app.querySelector<HTMLTextAreaElement>("#message");
const submitButton = app.querySelector<HTMLButtonElement>(".submit-button");
const emergencyLink = app.querySelector<HTMLButtonElement>(".emergency-link");
const formStatus = app.querySelector<HTMLParagraphElement>(".form-status");

if (!form || !phoneInput || !messageInput || !submitButton || !emergencyLink || !formStatus) {
  throw new Error("Contact form did not render correctly");
}

const applyVisitorLocale = (nextLocale: Locale) => {
  locale = nextLocale;
  document.documentElement.lang = locale;
  document.title = `${t(locale, "visitor.title")} · MoveMoCar`;
  app.querySelector<HTMLElement>(".language-button")?.setAttribute(
    "aria-label",
    t(locale, "common.chooseLanguage"),
  );
  const description = app.querySelectorAll<HTMLElement>(".hero__description p");
  const localizedText: Array<[string, string]> = [
    [".hero h1", t(locale, "visitor.title")],
    [".field--phone label", t(locale, "visitor.phoneLabel")],
    [".field--message label", t(locale, "visitor.messageLabel")],
    [".emergency-link", t(locale, "visitor.emergencyLink")],
  ];
  localizedText.forEach(([selector, value]) => {
    const element = app.querySelector<HTMLElement>(selector);
    if (element) element.textContent = value;
  });
  if (description[0]) description[0].textContent = t(locale, "visitor.description1");
  if (description[1]) description[1].textContent = t(locale, "visitor.description2");
  syncFormState();
};

installLanguagePicker(locale, applyVisitorLocale);

const loadActiveConfig = (): Promise<MoveMoCarConfig> => {
  if (!isDemoPage) {
    return loadConfig();
  }

  return Promise.resolve({
    ownerPhone: "1234567890",
    vehiclePlate: "DEMO",
    pushes: [],
    ownerLocale: locale,
    source: "url",
  });
};

let configPromise: Promise<MoveMoCarConfig> | undefined;
const getConfig = () => {
  if (!configPromise) {
    configPromise = loadActiveConfig().catch((error) => {
      configPromise = undefined;
      throw error;
    });
  }

  return configPromise;
};
let isSubmitting = false;
let lastRequestStartedAt = 0;
let configurationDamaged = false;
let emergencyOwnerPhone: string | undefined;
const minimumRequestInterval = 15_000;

const getSafePageUrl = () => {
  const url = new URL(window.location.href);
  url.hash = "";
  return url.toString();
};

const releasePressedButtons = () => {
  app.querySelectorAll(".button--pressed").forEach((button) => {
    button.classList.remove("button--pressed");
  });
};

app.addEventListener("pointerdown", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>(".submit-button, .dialog-button");
  if (!button || button.disabled) {
    return;
  }

  releasePressedButtons();
  button.classList.add("button--pressed");
});

app.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>(".submit-button, .dialog-button");
  if (!button || button.disabled) {
    return;
  }

  button.classList.remove("button--tapped");
  void button.offsetWidth;
  button.classList.add("button--tapped");
  button.addEventListener(
    "animationend",
    () => button.classList.remove("button--tapped"),
    { once: true },
  );
});

window.addEventListener("pointerup", releasePressedButtons, { passive: true });
window.addEventListener("pointercancel", releasePressedButtons, { passive: true });
window.addEventListener("blur", releasePressedButtons);

const syncFormState = () => {
  const normalized = normalizePhoneInput(phoneInput.value);
  if (normalized !== phoneInput.value) {
    phoneInput.value = normalized;
  }

  submitButton.disabled = normalized.length === 0 || isSubmitting || configurationDamaged;
  submitButton.classList.toggle("submit-button--loading", isSubmitting);
  phoneInput.disabled = isSubmitting || configurationDamaged;
  messageInput.disabled = isSubmitting || configurationDamaged;
  form.setAttribute("aria-busy", String(isSubmitting));

  if (isSubmitting) {
    if (!submitButton.querySelector(".submit-button__spinner")) {
      submitButton.innerHTML = `
        <span class="submit-button__spinner" aria-hidden="true"></span>
        <span class="sr-only">${t(locale, "visitor.notifyingOwner")}</span>
      `;
    }
    submitButton.setAttribute("aria-label", t(locale, "visitor.notifyingOwner"));
  } else {
    submitButton.textContent = t(locale, "visitor.notifyOwner");
    submitButton.removeAttribute("aria-label");
  }
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

let demoNotificationTimer: number | undefined;
const showDemoNotification = (submission: NotificationSubmission) => {
  document.querySelector(".demo-notification")?.remove();
  if (demoNotificationTimer !== undefined) {
    window.clearTimeout(demoNotificationTimer);
  }

  const notification = document.createElement("aside");
  notification.className = "demo-notification";
  notification.setAttribute("role", "status");
  notification.innerHTML = `
    <div class="demo-notification__header">
      <span class="demo-notification__mark">${iconMask(brandMark, "demo-notification__mark-glyph")}</span>
      <span>MoveMoCar</span>
      <span>${new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date())}</span>
    </div>
    <strong>${escapeHtml(submission.vehicleTitle)}</strong>
    <p>${escapeHtml(t(submission.locale, "notification.from", { phone: submission.phone }))}</p>
    <p>${escapeHtml(t(submission.locale, "notification.message", { message: submission.message }))}</p>
  `;
  document.body.append(notification);

  demoNotificationTimer = window.setTimeout(() => {
    notification.classList.add("demo-notification--closing");
    notification.addEventListener("animationend", () => notification.remove(), { once: true });
  }, 4_500);
};

type DialogKind = "success" | "emergency" | "failure" | "damaged" | "direct";

const unlockEmergencyContact = (ownerPhone: string | undefined) => {
  if (!ownerPhone) {
    return;
  }
  emergencyOwnerPhone = ownerPhone;
  emergencyLink.hidden = false;
};

const closeDialog = (animate = true) => {
  const layer = app.querySelector<HTMLElement>(".dialog-layer");
  if (!layer) {
    return;
  }

  if (!animate) {
    layer.remove();
    return;
  }

  layer.classList.add("dialog-layer--closing");
  const handleAnimationEnd = (event: AnimationEvent) => {
    if (event.target !== layer) {
      return;
    }
    layer.removeEventListener("animationend", handleAnimationEnd);
    layer.remove();
  };
  layer.addEventListener("animationend", handleAnimationEnd);
};

const showDialog = (kind: DialogKind, ownerPhone?: string) => {
  closeDialog(false);

  const isSuccess = kind === "success";
  const isPersistent = kind === "damaged" || kind === "direct";
  const canCall = !isSuccess && Boolean(ownerPhone);
  const hasCancel = !isSuccess && !isPersistent;
  const hasActions = isSuccess || canCall || hasCancel;
  const title = {
    success: t(locale, "visitor.dialog.successTitle"),
    emergency: t(locale, "visitor.dialog.emergencyTitle"),
    failure: t(locale, "visitor.dialog.failureTitle"),
    damaged: ownerPhone
      ? t(locale, "visitor.dialog.damagedRecoverableTitle")
      : t(locale, "visitor.dialog.damagedTitle"),
    direct: t(locale, "visitor.dialog.directTitle"),
  }[kind];
  const copyLines = {
    success: [t(locale, "visitor.dialog.successLine1"), t(locale, "visitor.dialog.successLine2")],
    emergency: [],
    failure: [t(locale, "visitor.dialog.failure")],
    damaged: [ownerPhone
      ? t(locale, "visitor.dialog.damagedRecoverable")
      : t(locale, "visitor.dialog.damaged")],
    direct: [t(locale, "visitor.dialog.direct")],
  }[kind];
  const copy = copyLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const dialogIcon =
    kind === "success"
      ? checkIcon
      : kind === "emergency" || kind === "direct"
        ? callIcon
        : warningIcon;
  const layer = document.createElement("div");
  layer.className = "dialog-layer scroll-modal-layer";
  layer.innerHTML = `
    <section class="dialog-card scroll-modal-whole-card dialog-card--${kind}${hasActions ? "" : " dialog-card--no-actions"}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">
      <div class="dialog-icon dialog-icon--${kind}" aria-hidden="true">
        ${iconMask(dialogIcon, "dialog-icon__glyph")}
      </div>
      <h2 id="dialog-title">${escapeHtml(title)}</h2>
      ${copy ? `<div class="dialog-copy">${copy}</div>` : ""}
      ${
        hasActions
          ? `<div class="dialog-actions">
              ${
                isSuccess || canCall
                  ? `<button class="dialog-button ${isSuccess ? "dialog-button--primary" : "dialog-button--danger"}" type="button" data-action="confirm">
                      ${isSuccess
                        ? t(locale, "common.confirm")
                        : kind === "direct"
                          ? t(locale, "visitor.dialog.call")
                          : t(locale, "visitor.dialog.callOwner")}
                    </button>`
                  : ""
              }
              ${
                hasCancel
                  ? `<button class="dialog-button dialog-button--secondary" type="button" data-action="cancel">${t(locale, "common.cancel")}</button>`
                  : ""
              }
            </div>`
          : ""
      }
    </section>
  `;

  app.append(layer);

  const confirmButton = layer.querySelector<HTMLButtonElement>("[data-action='confirm']");
  const cancelButton = layer.querySelector<HTMLButtonElement>("[data-action='cancel']");
  const dialog = layer.querySelector<HTMLElement>(".dialog-card");

  confirmButton?.addEventListener("click", () => {
    if (isSuccess) {
      closeDialog();
      unlockEmergencyContact(ownerPhone);
      emergencyLink.focus({ preventScroll: true });
      return;
    }

    if (ownerPhone) {
      if (!isPersistent) {
        closeDialog();
      }
      window.location.href = `tel:${ownerPhone.replace(/[^\d+]/g, "")}`;
    }
  });

  cancelButton?.addEventListener("click", () => closeDialog());
  (confirmButton ?? cancelButton ?? dialog)?.focus({ preventScroll: true });
};

phoneInput.addEventListener("input", syncFormState);

emergencyLink.addEventListener("click", async () => {
  if (emergencyOwnerPhone) {
    showDialog("emergency", emergencyOwnerPhone);
    return;
  }
  try {
    const config = await getConfig();
    showDialog("emergency", config.ownerPhone);
  } catch {
    formStatus.textContent = t(locale, "visitor.error.load");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting || phoneInput.value.length === 0) {
    return;
  }

  const phone = phoneInput.value;
  const message = messageInput.value.trim();
  const submittedAt = new Date().toISOString();
  let ownerPhone = getEmergencyPhoneFallback();

  isSubmitting = true;
  formStatus.textContent = "";
  syncFormState();

  try {
    const waitTime = Math.max(
      0,
      minimumRequestInterval - (Date.now() - lastRequestStartedAt),
    );
    if (waitTime > 0) {
      await wait(waitTime);
    }

    const config = await getConfig();
    ownerPhone = config.ownerPhone;
    const submission: NotificationSubmission = {
      locale: config.ownerLocale,
      phone,
      message,
      submittedAt,
      pageUrl: getSafePageUrl(),
      vehiclePlate: config.vehiclePlate,
      vehicleTitle: config.vehiclePlate
        ? t(config.ownerLocale, "notification.requestTitleWithCar", { car: config.vehiclePlate })
        : t(config.ownerLocale, "notification.requestTitle"),
    };
    lastRequestStartedAt = Date.now();
    if (isDemoPage) {
      showDemoNotification(submission);
      await wait(850);
    } else {
      await sendNotifications(config.pushes, submission);
    }

    showDialog("success", ownerPhone);
  } catch (error) {
    console.error(error);
    unlockEmergencyContact(ownerPhone);
    if (ownerPhone) {
      showDialog("failure", ownerPhone);
    } else {
      formStatus.textContent = t(locale, "visitor.error.send");
    }
  } finally {
    isSubmitting = false;
    syncFormState();
  }
});

syncFormState();

if (!isDemoPage && hasUrlConfig()) {
  void getConfig()
    .then((config) => {
      if (config.pushes.length === 0) {
        configurationDamaged = true;
        unlockEmergencyContact(config.ownerPhone);
        syncFormState();
        showDialog("direct", config.ownerPhone);
      }
    })
    .catch(() => {
      const ownerPhone = getEmergencyPhoneFallback();
      configurationDamaged = true;
      unlockEmergencyContact(ownerPhone);
      syncFormState();
      showDialog("damaged", ownerPhone);
    });
}

const applyLocalPreviewState = () => {
  if (!(["127.0.0.1", "localhost", "::1"] as string[]).includes(window.location.hostname)) {
    return;
  }

  const state = new URLSearchParams(window.location.search).get("preview");
  const previewOwnerPhone = "13000000000";
  const fillPreviewForm = () => {
    phoneInput.value = "13800138000";
    messageInput.value = t(locale, "visitor.preview.message");
  };

  switch (state) {
    case "ready":
      fillPreviewForm();
      syncFormState();
      break;
    case "loading":
      fillPreviewForm();
      isSubmitting = true;
      syncFormState();
      break;
    case "success":
      showDialog("success", previewOwnerPhone);
      break;
    case "sent":
      fillPreviewForm();
      unlockEmergencyContact(previewOwnerPhone);
      syncFormState();
      break;
    case "emergency":
      unlockEmergencyContact(previewOwnerPhone);
      showDialog("emergency", previewOwnerPhone);
      break;
    case "failure":
      fillPreviewForm();
      unlockEmergencyContact(previewOwnerPhone);
      syncFormState();
      showDialog("failure", previewOwnerPhone);
      break;
    case "damaged":
      configurationDamaged = true;
      unlockEmergencyContact(previewOwnerPhone);
      syncFormState();
      showDialog("damaged", previewOwnerPhone);
      break;
    case "damaged-empty":
      configurationDamaged = true;
      syncFormState();
      showDialog("damaged");
      break;
  }
};

applyLocalPreviewState();
