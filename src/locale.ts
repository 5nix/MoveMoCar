export const supportedLocales = [
  "zh-CN",
  "en",
  "zh-TW",
  "es",
  "fr",
  "de",
  "it",
  "pt-BR",
  "ja",
  "ko",
] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "zh-CN";

export const localeNames: Record<Locale, string> = {
  "zh-CN": "简体中文",
  en: "English",
  "zh-TW": "繁體中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  "pt-BR": "Português (Brasil)",
  ja: "日本語",
  ko: "한국어",
};

export const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && supportedLocales.includes(value as Locale);

export const localeToCode = (locale: Locale) => supportedLocales.indexOf(locale);

export const localeFromCode = (code: number): Locale =>
  supportedLocales[code] ?? defaultLocale;

export const matchLocale = (value: string | null | undefined): Locale | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().replace(/_/g, "-").toLowerCase();
  if (normalized === "zh-tw" || normalized === "zh-hk" || normalized === "zh-mo" || normalized.startsWith("zh-hant")) {
    return "zh-TW";
  }
  if (normalized === "zh" || normalized === "zh-cn" || normalized === "zh-sg" || normalized.startsWith("zh-hans")) {
    return "zh-CN";
  }
  if (normalized === "pt" || normalized.startsWith("pt-br")) return "pt-BR";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  if (normalized === "fr" || normalized.startsWith("fr-")) return "fr";
  if (normalized === "de" || normalized.startsWith("de-")) return "de";
  if (normalized === "it" || normalized.startsWith("it-")) return "it";
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  if (normalized === "ko" || normalized.startsWith("ko-")) return "ko";
  return undefined;
};

const storageKey = "movemocar.locale";

export const resolveLocale = (): Locale => {
  const queryLocale = matchLocale(new URL(window.location.href).searchParams.get("lang"));
  if (queryLocale) return queryLocale;

  try {
    const savedLocale = matchLocale(window.localStorage.getItem(storageKey));
    if (savedLocale) return savedLocale;
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }

  for (const browserLocale of navigator.languages ?? [navigator.language]) {
    const locale = matchLocale(browserLocale);
    if (locale) return locale;
  }
  return defaultLocale;
};

export const selectLocale = (locale: Locale) => {
  try {
    window.localStorage.setItem(storageKey, locale);
  } catch {
    // The current page can still switch language when storage is unavailable.
  }
  const url = new URL(window.location.href);
  url.searchParams.delete("lang");
  window.history.replaceState(window.history.state, "", url.toString());
};
