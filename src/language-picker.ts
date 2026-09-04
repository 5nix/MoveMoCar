import "./language-picker.css";
import checkIcon from "@material-symbols/svg-400/outlined/check.svg?url";
import closeIcon from "@material-symbols/svg-400/outlined/close.svg?url";
import languageIcon from "@material-symbols/svg-400/outlined/language.svg?url";
import brandMark from "./assets/movemocar-mark.svg?url";
import { t } from "./i18n";
import { localeNames, selectLocale, supportedLocales, type Locale } from "./locale";
import { escapeHtml } from "./webhook";

const mask = (icon: string) => {
  const url = icon.replace(/'/g, "%27").replace(/"/g, "%22");
  return `<span class="language-symbol" style="--language-symbol: url(&quot;${url}&quot;)" aria-hidden="true"></span>`;
};

export const renderLanguageButton = (locale: Locale) => `
  <button class="language-button" type="button" data-open-language aria-label="${escapeHtml(t(locale, "common.chooseLanguage"))}">
    ${mask(languageIcon)}
  </button>
`;

export const renderBrandLockup = () => {
  const url = brandMark.replace(/'/g, "%27").replace(/"/g, "%22");
  return `
    <div class="brand-lockup" aria-label="MoveMoCar">
      <span class="brand-lockup__mark" style="--brand-mark: url(&quot;${url}&quot;)" aria-hidden="true"></span>
    </div>
  `;
};

const closePicker = (layer: HTMLElement, onRemove: () => void) => {
  if (layer.classList.contains("language-layer--closing")) return;
  layer.classList.add("language-layer--closing");
  const remove = () => {
    onRemove();
    layer.remove();
  };
  layer.addEventListener("animationend", remove, { once: true });
  window.setTimeout(remove, 180);
};

const openPicker = (locale: Locale, onSelect?: (locale: Locale) => void) => {
  document.querySelector(".language-layer")?.remove();
  const layer = document.createElement("div");
  layer.className = "language-layer scroll-modal-layer";
  layer.innerHTML = `
    <section class="language-dialog scroll-modal-card" role="dialog" aria-modal="true" aria-labelledby="language-title">
      <header class="language-dialog__header">
        <h2 id="language-title">${escapeHtml(t(locale, "common.chooseLanguage"))}</h2>
        <button class="language-dialog__close" type="button" data-close-language aria-label="${escapeHtml(t(locale, "common.close"))}">${mask(closeIcon)}</button>
      </header>
      <div class="language-options scroll-modal-content" role="radiogroup" aria-label="${escapeHtml(t(locale, "common.language"))}">
        ${supportedLocales.map((option) => `
          <button class="language-option" type="button" role="radio" aria-checked="${option === locale}" data-locale="${option}">
            <span lang="${option}">${escapeHtml(localeNames[option])}</span>
            ${option === locale ? mask(checkIcon) : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `;

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
  };
  const close = () => closePicker(layer, () => {
    document.removeEventListener("keydown", handleKeydown);
  });
  layer.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target === layer || target.closest("[data-close-language]")) {
      close();
      return;
    }
    const option = target.closest<HTMLElement>("[data-locale]")?.dataset.locale;
    if (supportedLocales.includes(option as Locale)) {
      const nextLocale = option as Locale;
      selectLocale(nextLocale);
      close();
      onSelect?.(nextLocale);
    }
  });
  document.addEventListener("keydown", handleKeydown);
  document.body.append(layer);
  layer.querySelector<HTMLElement>("[data-close-language]")?.focus({ preventScroll: true });
};

export const installLanguagePicker = (
  locale: Locale,
  onSelect?: (locale: Locale) => void,
) => {
  let currentLocale = locale;
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest("[data-open-language]")) {
      openPicker(currentLocale, (nextLocale) => {
        currentLocale = nextLocale;
        onSelect?.(nextLocale);
      });
    }
  });
};
