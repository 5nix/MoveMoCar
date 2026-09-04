import "@fontsource/cabin/400.css";
import "@fontsource/cabin/500.css";
import "@fontsource/cabin/600.css";
import "@fontsource/cabin/700.css";
import "./landing.css";
import arrowIcon from "@material-symbols/svg-400/outlined/arrow_outward.svg?url";
import scanIcon from "@material-symbols/svg-400/outlined/qr_code_scanner.svg?url";
import githubIcon from "simple-icons/icons/github.svg?url";

type Locale = "zh" | "en";
type Theme = "light" | "dark";

const copy = {
  zh: {
    skip: "跳到主要内容", navAria: "主导航", homeAria: "MoveMoCar 首页", menu: "打开菜单", menuClose: "关闭菜单", navHow: "工作方式", navCreate: "生成", navTech: "技术", ctaCreate: "创建挪车码", ctaOpen: "创建挪车码",
    heroKicker: "无需后端的开源挪车码", heroTitle: "扫描挪车码发送留言<br />需要的时候再打电话", heroBody: "MoveMoCar 谐音自 Move Mocha ☕️<br />希望这个简洁优雅的小项目，也能给你带来摩卡般的丝滑体验", heroDemo: "体验扫码视角",
    premiseTitle: "一点点门槛", premise1: "MoveMoCar 要求请求挪车的人向车主主动发送联系电话和留言之后才可以获取车主号码。", premise2: "对于正常挪车，多出来的只是填写电话和一句留言，而对于随手抄走号码的人，这大概已经多了一点麻烦。",
    relayTitle: "工作方式", relay1: "把生成好的二维码放在车里。别人扫码以后，会先看到一个很简单的联系页面，填写自己的手机号和留言。", relay2: "这些信息会被发送到你配置好的通知渠道，比如 Bark、WxPusher 或 ntfy。你收到通知后，可以直接回拨。",
    noticeNow: "现在", noticeTitle: "有人需要您挪车", noticeMessage: "车辆挡住出口，麻烦您挪一下，谢谢！", noticeCall: "回拨", step1Title: "扫描车窗内的二维码", step1Body: "打开联系页面，不显示车主号码", step2Title: "留下自己的电话和挪车说明", step2Body: "页面只收集扫码者提供的信息", step3Title: "车主收到通知后回拨", step3Body: "通知失败的情况下扫码者可以向车主拨号",
    builderTitle: "生成挪车码", builderBody: "填写联系电话，按需添加通知渠道。配置会写入二维码本身，不需要注册账号。", builderStep1: "填写联系方式与车辆标识", builderStep2: "添加并测试通知渠道", builderStep3: "保存二维码，打印后放在车内",
    systemTitle: "编码与技术参数", systemBody: "联系电话、车辆标识和通知配置使用专用的开源 M1 格式写进二维码。扫码后，由浏览器读取并直接向通知服务发送消息。", flowAria: "电话号码和通知配置经过编码写入二维码，再由浏览器解码并通知车主", inputPhone: "联系电话", inputVehicle: "车辆标识", inputPlate: "浙A12345", inputChannel: "通知渠道", qrAlt: "M1 示例配置生成的二维码", flowOutput: "解码并通知车主", note1Label: "通知方式", note2Label: "发送方式", note2Value: "扫码者的浏览器<br />直接发送", note3Label: "部署方式", note3Value: "静态托管<br />或自己的 Web Server", note4Label: "界面语言", note4Value: "十种支持语言", boundaryLabel: "边界说明", boundaryBody: "M1 不加密车主号码或通知凭据。有意分析二维码仍可读取其中信息；MoveMoCar 减少的是日常场景里的直接暴露。",
    faqTitle: "常见问题", faqReadme: "查看完整 README", faq1Q: "不会配置 Bark、WxPusher 或 ntfy，还能用吗？", faq1A: "可以。你依然可以生成只包含联系电话的二维码，只是体验会更接近普通挪车码。有条件的话，还是建议配置一个通知渠道。", faq2Q: "更换手机号或通知配置以后怎么办？", faq2A: "重新生成二维码并重新打印。配置跟着二维码本身走，已经打印出来的二维码不会自动更新。", faq3Q: "二维码被别人解析以后，能看到我的号码吗？", faq3A: "能。如果有人有意分析二维码内容，仍然可以读取其中的信息。MoveMoCar 主要减少的是日常场景里的直接暴露。", faq4Q: "通知服务挂了，会不会完全联系不到我？", faq4A: "不会。MoveMoCar 会同时尝试已经配置的通知渠道；如果全部失败，页面会提示发送失败并开放直接拨号入口。",
    closingTitle: "生成你的<br />挪车码", footerAria: "页脚导航", heroAlt: "白色圆形展示台上停放的奶白色汽车，前挡风玻璃内放着绿色联系卡", relayAlt: "扫码者从车侧用手机扫描车窗内的二维码联系卡", contactAlt: "iPhone 15 Pro 中的 MoveMoCar 联系页面，扫码者填写自己的电话和挪车留言", createAlt: "iPhone 15 Pro 中的 MoveMoCar 创建页面", resultAlt: "iPhone 15 Pro 中生成完成的 MoveMoCar 挪车二维码", closingAlt: "车主在安静的室内查看手机通知",
  },
  en: {
    skip: "Skip to main content", navAria: "Primary navigation", homeAria: "MoveMoCar home", menu: "Open menu", menuClose: "Close menu", navHow: "How it works", navCreate: "Create", navTech: "Technology", ctaCreate: "Create my MoveMoCar code", ctaOpen: "Create my MoveMoCar code",
    heroKicker: "An open-source parking contact code with no backend", heroTitle: "Scan the parking code to leave a message<br />Call only when needed", heroBody: "MoveMoCar sounds like Move Mocha ☕️<br />I hope this simple little project feels just as smooth", heroDemo: "Try the visitor view",
    premiseTitle: "A little friction", premise1: "MoveMoCar requires the person requesting a move to send their contact number and message to the owner before they can access the owner's number.", premise2: "For a legitimate parking request, the only extra step is entering a phone number and a short message. For someone casually copying the number, that is probably just enough extra friction.",
    relayTitle: "How it works", relay1: "Place the generated QR code inside your car. After scanning, the visitor sees a simple contact page where they can leave their phone number and a message.", relay2: "The message is sent to a channel you configure, such as Bark, WxPusher, or ntfy. Once notified, you can call them back directly.",
    noticeNow: "now", noticeTitle: "Someone needs you to move your car", noticeMessage: "The car is blocking the exit. Could you move it? Thanks!", noticeCall: "Call back", step1Title: "Scan the QR code in the window", step1Body: "Open the contact page without showing the owner's number", step2Title: "Leave a phone number and message", step2Body: "The page only collects information entered by the visitor", step3Title: "The owner receives a notification and calls back", step3Body: "If delivery fails, the visitor can call the owner directly",
    builderTitle: "Create your parking code", builderBody: "Enter a contact number and add notification channels if needed. The configuration is stored in the QR code itself, with no account required.", builderStep1: "Add contact and vehicle details", builderStep2: "Add and test notification channels", builderStep3: "Save, print, and place the code in your car",
    systemTitle: "Encoding & technical details", systemBody: "The phone number, vehicle label, and notification settings are encoded into the QR code using the dedicated, open-source M1 format. After scanning, the browser reads the configuration and sends the message directly to the notification service.", flowAria: "Phone and notification settings are encoded into a QR code, then decoded in the browser to notify the owner", inputPhone: "Contact number", inputVehicle: "Vehicle label", inputPlate: "A12345", inputChannel: "Notification", qrAlt: "QR code generated from an example M1 configuration", flowOutput: "Decode and notify the owner", note1Label: "Notifications", note2Label: "Delivery", note2Value: "Sent directly from<br />the visitor's browser", note3Label: "Hosting", note3Value: "Static hosting<br />or your own web server", note4Label: "Languages", note4Value: "Ten supported languages", boundaryLabel: "Boundary", boundaryBody: "M1 does not encrypt the owner's number or notification credentials. A determined person can still inspect the QR code; MoveMoCar reduces casual exposure in everyday situations.",
    faqTitle: "FAQ", faqReadme: "Read the full README", faq1Q: "Can I use it without Bark, WxPusher, or ntfy?", faq1A: "Yes. You can generate a QR code with only a contact number, though the experience will be closer to a regular parking code. A notification channel is still recommended when possible.", faq2Q: "What if I change my phone number or notification settings?", faq2A: "Generate and print a new QR code. The configuration lives inside the code, so a printed code will not update automatically.", faq3Q: "Can someone extract my number from the QR code?", faq3A: "Yes. Someone who deliberately inspects the QR data can still read it. MoveMoCar mainly reduces direct exposure in everyday situations.", faq4Q: "Could a notification outage make me unreachable?", faq4A: "No. MoveMoCar tries every configured notification channel. If they all fail, the page reports the failure and offers a direct-call option.",
    closingTitle: "One for<br />your car", footerAria: "Footer navigation", heroAlt: "A milk-white car on a circular display platform with a QR contact card in the windshield", relayAlt: "A visitor scanning the QR contact card in a car window", contactAlt: "MoveMoCar contact form shown on an iPhone 15 Pro", createAlt: "MoveMoCar code generator shown on an iPhone 15 Pro", resultAlt: "A generated MoveMoCar QR code shown on an iPhone 15 Pro", closingAlt: "A car owner checking a phone notification in a quiet interior",
  },
} as const;

const params = new URLSearchParams(location.search);
let locale: Locale = params.get("lang") === "en" ? "en" : "zh";
let theme: Theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
const systemTheme = matchMedia("(prefers-color-scheme: dark)");
let followsSystemTheme = !params.has("theme") && !localStorage.getItem("movemocar-theme");
const configuredFooterText = import.meta.env.VITE_FOOTER_TEXT?.trim() ?? "";
const seoCopy = {
  zh: {
    title: "MoveMoCar｜无需后端的开源挪车码",
    description: "MoveMoCar 是一个无需后端的开源挪车码。扫描二维码后先发送留言，车主收到通知后再回拨。",
    imageAlt: "MoveMoCar 挪车码放置在汽车前挡风玻璃内",
    ogLocale: "zh_CN",
  },
  en: {
    title: "MoveMoCar | Open-source parking contact QR code",
    description: "A backend-free, open-source parking contact QR code. Visitors leave a message, and the owner calls back.",
    imageAlt: "A MoveMoCar parking contact code placed inside a car windshield",
    ogLocale: "en_US",
  },
} as const;

const icons = { arrow: arrowIcon, scan: scanIcon, github: githubIcon } as const;
document.querySelectorAll<HTMLElement>("[data-icon]").forEach((element) => {
  const icon = icons[element.dataset.icon as keyof typeof icons];
  if (icon) element.style.setProperty("--icon", `url("${icon}")`);
});

const setQuery = (key: string, value: string, defaultValue: string) => {
  const url = new URL(location.href);
  if (value === defaultValue) url.searchParams.delete(key); else url.searchParams.set(key, value);
  history.replaceState({}, "", url);
};

const updateScreens = () => {
  const names = { contact: "contact-form", create: "create", result: "qr-result" } as const;
  document.querySelectorAll<HTMLImageElement>("[data-screen]").forEach((image) => {
    const type = image.dataset.screen as keyof typeof names;
    image.src = `${import.meta.env.BASE_URL}assets/app-screens/iphone-15-pro/${names[type]}-${locale}-${theme}.webp`;
  });
};

const applyNavWave = () => {
  const targets = document.querySelectorAll<HTMLElement>([
    ".brand > span:last-child",
    ".nav-links__content > a:not(.nav-cta)",
    "[data-language-toggle]",
    "[data-theme-label]",
    ".nav-cta > span:last-child",
  ].join(","));
  targets.forEach((target) => {
    const label = target.textContent ?? "";
    const interactive = target.closest<HTMLElement>("a,button");
    if (interactive && !interactive.hasAttribute("aria-label")) interactive.setAttribute("aria-label", label);
    target.classList.add("nav-wave");
    target.replaceChildren(...Array.from(label, (character, index) => {
      const span = document.createElement("span");
      span.className = "nav-wave__char";
      span.style.setProperty("--wave-index", String(index));
      span.textContent = character === " " ? "\u00a0" : character;
      return span;
    }));
  });
};

const updateMetaContent = (selector: string, content: string) => {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content);
};

const updateSeo = () => {
  const seo = seoCopy[locale];
  document.title = seo.title;
  updateMetaContent('meta[name="description"]', seo.description);
  updateMetaContent('meta[property="og:title"]', seo.title);
  updateMetaContent('meta[property="og:description"]', seo.description);
  updateMetaContent('meta[property="og:locale"]', seo.ogLocale);
  updateMetaContent('meta[property="og:locale:alternate"]', locale === "en" ? "zh_CN" : "en_US");
  updateMetaContent('meta[property="og:image:alt"]', seo.imageAlt);
  updateMetaContent('meta[name="twitter:title"]', seo.title);
  updateMetaContent('meta[name="twitter:description"]', seo.description);
  updateMetaContent('meta[name="twitter:image:alt"]', seo.imageAlt);

  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const chineseAlternate = document.querySelector<HTMLLinkElement>('link[rel="alternate"][hreflang="zh-CN"]');
  if (canonical && chineseAlternate) {
    const localizedCanonical = locale === "en" ? `${chineseAlternate.href}?lang=en` : chineseAlternate.href;
    canonical.href = localizedCanonical;
    updateMetaContent('meta[property="og:url"]', localizedCanonical);

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
          webPage.name = seo.title;
          webPage.description = seo.description;
          webPage.inLanguage = locale === "en" ? "en" : "zh-CN";
        }
        structuredData.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
      } catch {
        // Ignore malformed third-party structured data instead of breaking the page.
      }
    }
  }
};

const render = () => {
  const dictionary = copy[locale];
  document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
  document.documentElement.dataset.theme = theme;
  updateSeo();
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content = theme === "dark" ? "#07100b" : "#f2f3ee";
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => { element.textContent = dictionary[element.dataset.i18n as keyof typeof dictionary]; });
  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((element) => { element.innerHTML = dictionary[element.dataset.i18nHtml as keyof typeof dictionary]; });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((element) => { element.setAttribute("aria-label", dictionary[element.dataset.i18nAria as keyof typeof dictionary]); });
  document.querySelectorAll<HTMLImageElement>("[data-i18n-alt]").forEach((element) => { element.alt = dictionary[element.dataset.i18nAlt as keyof typeof dictionary]; });
  const languageButton = document.querySelector<HTMLButtonElement>("[data-language-toggle]");
  if (languageButton) { languageButton.textContent = locale === "zh" ? "EN" : "中"; languageButton.setAttribute("aria-label", locale === "zh" ? "Switch to English" : "切换到中文"); }
  const nextThemeName = theme === "light" ? (locale === "zh" ? "深色" : "Dark") : (locale === "zh" ? "浅色" : "Light");
  document.querySelector<HTMLElement>("[data-theme-label]")!.textContent = nextThemeName;
  document.querySelector<HTMLButtonElement>("[data-theme-toggle]")!.setAttribute("aria-label", locale === "zh" ? `切换${nextThemeName}模式` : `Switch to ${nextThemeName.toLowerCase()} mode`);
  const menuButton = document.querySelector<HTMLButtonElement>(".nav-toggle");
  menuButton?.setAttribute("aria-label", menuButton.getAttribute("aria-expanded") === "true" ? dictionary.menuClose : dictionary.menu);
  document.querySelectorAll<HTMLAnchorElement>("[data-localized-href]").forEach((link) => {
    link.href = new URL(link.dataset.localizedHref || "./", location.href).href;
  });
  document.querySelectorAll<HTMLAnchorElement>("[data-readme-link]").forEach((link) => { link.href = locale === "en" ? "./README.en.md" : "./README.md"; });
  const footerText = document.querySelector<HTMLElement>("[data-footer-text]");
  if (footerText) {
    footerText.textContent = configuredFooterText;
    footerText.hidden = !configuredFooterText;
  }
  updateScreens();
  applyNavWave();
};

const navToggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const navLinks = document.querySelector<HTMLElement>(".nav-links");
const navPanel = navLinks?.querySelector<HTMLElement>(".t-acc-panel");
const header = document.querySelector<HTMLElement>("[data-header]");
let menuCloseTimer = 0;
let menuCloseListener: ((event: TransitionEvent) => void) | undefined;
const cancelPendingMenuClose = () => {
  if (menuCloseTimer) window.clearTimeout(menuCloseTimer);
  menuCloseTimer = 0;
  if (menuCloseListener && navPanel) navPanel.removeEventListener("transitionend", menuCloseListener);
  menuCloseListener = undefined;
};
const finishMenuClose = () => {
  cancelPendingMenuClose();
  header?.classList.remove("site-header--menu-open");
};
const setMenuOpen = (open: boolean) => {
  cancelPendingMenuClose();
  navToggle?.setAttribute("aria-expanded", String(open));
  navToggle?.setAttribute("aria-label", copy[locale][open ? "menuClose" : "menu"]);
  navLinks?.setAttribute("data-open", String(open));
  navLinks?.classList.toggle("nav-links--open", open);
  if (open) {
    header?.classList.add("site-header--menu-open");
    return;
  }
  if (!header?.classList.contains("site-header--menu-open") || !navPanel) {
    finishMenuClose();
    return;
  }
  menuCloseListener = (event) => {
    if (event.target === navPanel && event.propertyName === "grid-template-rows") finishMenuClose();
  };
  navPanel.addEventListener("transitionend", menuCloseListener);
  menuCloseTimer = window.setTimeout(finishMenuClose, 650);
};
const closeMenu = () => setMenuOpen(false);

navToggle?.addEventListener("click", () => setMenuOpen(navToggle.getAttribute("aria-expanded") !== "true"));
navLinks?.addEventListener("click", (event) => { if ((event.target as Element).closest("a")) closeMenu(); });
document.querySelector("[data-language-toggle]")?.addEventListener("click", () => { locale = locale === "zh" ? "en" : "zh"; setQuery("lang", locale, "zh"); render(); });
document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => { followsSystemTheme = false; theme = theme === "light" ? "dark" : "light"; localStorage.setItem("movemocar-theme", theme); setQuery("theme", theme, "light"); render(); });
systemTheme.addEventListener("change", ({ matches }) => { if (followsSystemTheme) { theme = matches ? "dark" : "light"; render(); } });
window.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });

const hero = document.querySelector<HTMLElement>(".hero");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const webglContextAttributes: WebGLContextAttributes = {
  alpha: true,
  antialias: false,
  depth: false,
  premultipliedAlpha: true,
  stencil: false,
};

const runAnimationWhenVisible = (element: Element, renderFrame: (now: number) => void) => {
  let frame = 0;
  let visible = false;
  let lastDraw = 0;
  const loop = (now: number) => {
    frame = 0;
    if (!visible || document.hidden) return;
    if (now - lastDraw >= 32) {
      renderFrame(now);
      lastDraw = now;
    }
    frame = requestAnimationFrame(loop);
  };
  const start = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(loop); };
  const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  }, { rootMargin: "120px 0px" }).observe(element);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else start(); });
};

const initBuilderMotion = () => {
  if (reducedMotion || !matchMedia("(pointer: fine)").matches) return;
  const builder = document.querySelector<HTMLElement>(".builder__product");
  builder?.addEventListener("pointermove", (event) => {
    const bounds = builder.getBoundingClientRect();
    const px = (event.clientX - bounds.left) / bounds.width;
    const py = (event.clientY - bounds.top) / bounds.height;
    const x = px - .5;
    const y = py - .5;
    builder.style.setProperty("--builder-main-x", `${(x * 20).toFixed(2)}px`);
    builder.style.setProperty("--builder-main-y", `${(y * 14).toFixed(2)}px`);
    builder.style.setProperty("--builder-result-x", `${(x * -14).toFixed(2)}px`);
    builder.style.setProperty("--builder-result-y", `${(y * -10).toFixed(2)}px`);
    builder.style.setProperty("--builder-tilt-x", `${(y * -6).toFixed(2)}deg`);
    builder.style.setProperty("--builder-tilt-y", `${(x * 8).toFixed(2)}deg`);
    builder.style.setProperty("--builder-result-tilt-x", `${(y * 3.5).toFixed(2)}deg`);
    builder.style.setProperty("--builder-result-tilt-y", `${(x * -4.5).toFixed(2)}deg`);
  }, { passive: true });
  builder?.addEventListener("pointerleave", () => {
    ["--builder-main-x", "--builder-main-y", "--builder-result-x", "--builder-result-y", "--builder-tilt-x", "--builder-tilt-y", "--builder-result-tilt-x", "--builder-result-tilt-y"].forEach((property) => builder.style.removeProperty(property));
  }, { passive: true });
};

const initMotionRegions = () => {
  if (reducedMotion) return;
  const regions = document.querySelectorAll<HTMLElement>(".builder__product,.flow,.closing");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-motion-active", entry.isIntersecting));
  }, { rootMargin: "120px 0px" });
  regions.forEach((region) => observer.observe(region));
};

const initPremiseShader = () => {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-premise-shader]");
  if (!canvas || reducedMotion) return;
  const gl = canvas.getContext("webgl", webglContextAttributes);
  if (!gl) return;
  const vertexSource = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec2 resolution;
    uniform vec2 center;
    uniform float time;
    uniform float darkMode;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float noise(vec2 p) {
      vec2 cell = floor(p);
      vec2 local = fract(p);
      local = local * local * (3.0 - 2.0 * local);
      return mix(mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
                 mix(hash(cell + vec2(0.0, 1.0)), hash(cell + vec2(1.0, 1.0)), local.x), local.y);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - center * resolution) / resolution.y;
      float slow = time * .055;
      vec2 warp = vec2(
        noise(p * 2.15 + vec2(slow, -slow * .72)),
        noise(p * 2.35 + vec2(5.7 - slow * .64, 2.4 + slow * .46))
      ) - .5;
      vec2 warped = p + warp * .095;
      float detail = (noise(warped * 5.1 + slow * .38) - .5) * .028;
      float distanceField = length(warped) + detail;
      float ringPhase = fract(distanceField * 13.8);
      float line = 1.0 - smoothstep(.055, .105, abs(ringPhase - .5));
      float hollow = smoothstep(.145, .205, distanceField);
      float outerFade = 1.0 - smoothstep(1.12, 1.48, distanceField);
      float alpha = line * hollow * outerFade * mix(.14, .17, darkMode);
      vec3 lineColor = mix(vec3(.075, .19, .095), vec3(.56, .89, .57), darkMode);
      gl_FragColor = vec4(lineColor * alpha, alpha);
    }
  `;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "resolution");
  const center = gl.getUniformLocation(program, "center");
  const time = gl.getUniformLocation(program, "time");
  const darkMode = gl.getUniformLocation(program, "darkMode");
  const logo = canvas.parentElement?.querySelector<HTMLImageElement>(".premise__brand img");
  const layout = canvas.parentElement?.querySelector<HTMLElement>(".premise__layout");
  let centerX = .145;
  let centerY = .52;
  let needsResize = true;
  const draw = (now: number) => {
    if (needsResize) {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 1);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (logo) {
        const logoBounds = logo.getBoundingClientRect();
        centerX = Math.min(1, Math.max(0, (logoBounds.left + logoBounds.width / 2 - bounds.left) / bounds.width));
        centerY = 1 - Math.min(1, Math.max(0, (logoBounds.top + logoBounds.height / 2 - bounds.top) / bounds.height));
      }
      needsResize = false;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform2f(center, centerX, centerY);
    gl.uniform1f(time, now * .001);
    gl.uniform1f(darkMode, document.documentElement.dataset.theme === "dark" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  const resizeObserver = new ResizeObserver(() => { needsResize = true; });
  resizeObserver.observe(canvas);
  if (logo) resizeObserver.observe(logo);
  layout?.addEventListener("transitionend", () => { needsResize = true; });
  runAnimationWhenVisible(canvas, draw);
};

const initFlowShader = () => {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-flow-shader]");
  if (!canvas || reducedMotion) return;
  const gl = canvas.getContext("webgl", webglContextAttributes);
  if (!gl) return;
  const vertexSource = `
    attribute vec2 position;
    void main() { gl_Position = vec4(position, 0.0, 1.0); }
  `;
  const fragmentSource = `
    precision mediump float;
    uniform vec2 resolution;
    uniform vec2 pointer;
    uniform float time;

    float trace(vec2 uv, float offset, float phase) {
      float pull = exp(-pow(uv.x - pointer.x, 2.0) * 20.0) * (pointer.y - .5) * .16;
      float y = .5 + offset + pull + sin(uv.x * 7.0 + time * .42 + phase) * .055 + sin(uv.x * 17.0 - time * .26) * .012;
      return 1.0 - smoothstep(.0, .008, abs(uv.y - y));
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      float fade = smoothstep(.015, .12, uv.x) * (1.0 - smoothstep(.9, .99, uv.x));
      float mainTrace = trace(uv, .0, .0);
      float echoes = trace(uv, .078, 1.2) * .16;
      float runner = exp(-pow(fract(uv.x - time * .105) - .5, 2.0) * 170.0);
      float dataTicks = pow(max(0.0, sin(uv.x * 92.0 - time * 1.4)), 26.0) * mainTrace;
      float alpha = (mainTrace * (.1 + runner * .48) + echoes * .08 + dataTicks * .24) * fade;
      vec3 mint = vec3(.56, .89, .57);
      vec3 light = vec3(.86, 1.0, .88);
      alpha = clamp(alpha, 0.0, .48);
      vec3 color = mix(mint, light, runner);
      gl_FragColor = vec4(color * alpha, alpha);
    }
  `;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  if (!program) return;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, "resolution");
  const pointer = gl.getUniformLocation(program, "pointer");
  const time = gl.getUniformLocation(program, "time");
  let needsResize = true;
  const pointerX = .66;
  const pointerY = .5;
  const draw = (now: number) => {
    if (needsResize) {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 1);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      needsResize = false;
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform2f(pointer, pointerX, pointerY);
    gl.uniform1f(time, now * .001);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  new ResizeObserver(() => { needsResize = true; }).observe(canvas);
  runAnimationWhenVisible(canvas, draw);
};

if (hero && !reducedMotion) {
  let scrollOffset = 0;
  let frame = 0;
  const renderHeroMotion = () => {
    hero.style.setProperty("--hero-y", `${scrollOffset.toFixed(2)}px`);
    frame = 0;
  };
  const scheduleHeroMotion = () => { if (!frame) frame = requestAnimationFrame(renderHeroMotion); };
  window.addEventListener("scroll", () => {
    scrollOffset = Math.min(scrollY, hero.offsetHeight) * .045;
    scheduleHeroMotion();
  }, { passive: true });
}

initPremiseShader();
initFlowShader();
initBuilderMotion();
initMotionRegions();

document.querySelectorAll<HTMLButtonElement>(".faq__question").forEach((question) => {
  question.addEventListener("click", () => {
    const expanded = question.getAttribute("aria-expanded") === "true";
    question.setAttribute("aria-expanded", String(!expanded));
    const answer = document.getElementById(question.getAttribute("aria-controls") || "");
    answer?.setAttribute("aria-hidden", String(expanded));
  });
});

const updateHeader = () => header?.classList.toggle("site-header--compact", scrollY > 16);
window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
const revealOrder = new Map<HTMLElement, number>();
revealItems.forEach((item, order) => {
  revealOrder.set(item, order);
  item.dataset.revealOrder = String(order + 1);
});
type RevealGroup = {
  target: HTMLElement;
  items: Array<{ element: HTMLElement; phase: number }>;
  handoff: number;
  order: number;
};
const revealGroupSpecs = [
  { target: ".hero", items: [[".hero__copy", 0]], handoff: 1440 },
  { target: ".premise", items: [["&", 0], [".premise__layout", .5]], handoff: 960 },
  { target: ".relay", items: [["&", 0], [".section-head", .5], [".relay__stage", 2.5], [".relay__steps", 5.5]], handoff: 1920 },
  { target: ".builder", items: [["&", 0], [".builder__copy", .5], [".builder__product", 5]], handoff: 1920 },
  { target: ".system", items: [[".system__head", 0], [".flow", 2], [".system__notes", 6], [".system__limit", 10]], handoff: 2640 },
  { target: ".faq", items: [["&", 0], [".faq__layout > header", .5], [".faq__list", 2.5]], handoff: 1440 },
  { target: ".closing", items: [["&", 0], [".closing__photo", 0], [".closing__layout", .5]], handoff: 960 },
] as const;
const revealGroups: RevealGroup[] = revealGroupSpecs.flatMap((spec, order) => {
  const target = document.querySelector<HTMLElement>(spec.target);
  if (!target) return [];
  target.dataset.revealGroup = String(order + 1);
  const items = spec.items.flatMap(([selector, phase]) => {
    const element = selector === "&" ? target : target.querySelector<HTMLElement>(selector);
    if (!element) return [];
    element.dataset.revealPhase = String(phase);
    return [{ element, phase }];
  });
  return [{ target, items, handoff: spec.handoff, order }];
});
if (reducedMotion) {
  document.body.classList.remove("landing--loading");
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const groupByTarget = new Map(revealGroups.map((group) => [group.target, group]));
  const pendingGroups = new Set<RevealGroup>();
  const activeHandoffs = new Map<RevealGroup, number>();
  let revealTimer = 0;
  const flushRevealGroups = () => {
    revealTimer = 0;
    const ordered = Array.from(pendingGroups).sort((a, b) => a.order - b.order);
    pendingGroups.clear();
    const now = performance.now();
    let revealQueueUntil = Math.max(now, ...activeHandoffs.values());
    ordered.forEach((group) => {
      const groupStartAt = Math.max(now, revealQueueUntil);
      const groupStart = Math.max(0, groupStartAt - now);
      group.items.forEach(({ element, phase }) => {
        const lag = groupStart + phase * 240;
        element.style.setProperty("--queue-lag", `${lag}ms`);
        element.classList.add("is-visible");
      });
      revealQueueUntil = groupStartAt + group.handoff;
      activeHandoffs.set(group, revealQueueUntil);
    });
  };
  const entranceObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target as HTMLElement;
      const group = groupByTarget.get(target);
      if (!group || !entry.isIntersecting) return;
      pendingGroups.add(group);
      entranceObserver.unobserve(target);
    });
    if (pendingGroups.size && !revealTimer) revealTimer = window.setTimeout(flushRevealGroups, 40);
  }, { rootMargin: "-15% 0px -26%", threshold: 0.05 });
  const waitForHeroImage = async () => {
    const image = document.querySelector<HTMLImageElement>(theme === "dark" ? ".hero__photo--night" : ".hero__photo--day");
    if (!image) return;
    const ready = image.decode
      ? image.decode().catch(() => undefined)
      : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });
    await Promise.race([
      ready,
      new Promise<void>((resolve) => window.setTimeout(resolve, 1200)),
    ]);
  };
  const startReveal = async () => {
    await Promise.all([
      waitForHeroImage(),
      new Promise<void>((resolve) => window.setTimeout(resolve, 180)),
    ]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    document.body.classList.remove("landing--loading");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    revealGroups.forEach(({ target }) => entranceObserver.observe(target));
  };
  void startReveal();
}

render();
