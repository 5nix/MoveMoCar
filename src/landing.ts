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
    skip: "跳到主要内容", navAria: "主导航", homeAria: "MoveMoCar 首页", menu: "打开菜单", navHow: "工作方式", navCreate: "生成", navTech: "技术", ctaCreate: "创建挪车码", ctaOpen: "创建挪车码",
    heroKicker: "无需后端的开源挪车码", heroTitle: "扫描挪车码发送留言<br />需要的时候再打电话", heroBody: "MoveMoCar 谐音自 Move Mocha ☕️<br />希望这个简洁优雅的小项目，也能给你带来摩卡般的丝滑体验", heroDemo: "体验扫码视角",
    premiseTitle: "一点点门槛", premise1: "MoveMoCar 没有试图把手机号变成什么无法破解的秘密。", premise2: "号码仍然存在二维码中，有心研究二维码内容的人依然可以把它找出来。", premise3: "它做的事情很简单：让手机号不再直接写在车窗上，也不再成为扫码之后第一眼就能看到的东西。", premise4: "对于正常挪车，多出来的只是填写电话和一句留言。", premise5: "对于随手扫一下、抄走号码的人，这大概已经多了一点麻烦。",
    relayTitle: "工作方式", relay1: "把生成好的二维码放在车里。别人扫码以后，会先看到一个很简单的联系页面，填写自己的手机号和留言。", relay2: "这些信息会被发送到你配置好的通知渠道，比如 Bark、WxPusher 或 ntfy。你收到通知后，可以直接回拨。",
    noticeNow: "现在", noticeTitle: "有人需要您挪车", noticeMessage: "车辆挡住出口，麻烦您挪一下，谢谢！", noticeCall: "回拨", step1Title: "扫描车窗内的二维码", step1Body: "打开联系页面，不显示车主号码", step2Title: "留下自己的电话和挪车说明", step2Body: "页面只收集扫码者提供的信息", step3Title: "车主收到通知后回拨", step3Body: "通知失败的情况下扫码者可以向车主拨号",
    builderTitle: "生成挪车码", builderBody: "填写联系电话，按需添加通知渠道。配置会写入二维码本身，不需要注册账号。", builderStep1: "填写联系方式与车辆标识", builderStep2: "添加并测试通知渠道", builderStep3: "保存二维码，打印后放在车内",
    systemTitle: "编码与技术参数", systemBody: "联系电话、车辆标识和通知配置使用专用的开源 M1 格式写进二维码。扫码后，由浏览器读取并直接向通知服务发送消息。", flowAria: "电话号码和通知配置经过编码写入二维码，再由浏览器解码并通知车主", inputPhone: "联系电话", inputVehicle: "车辆标识", inputPlate: "浙A12345", inputChannel: "通知渠道", qrAlt: "M1 示例配置生成的二维码", flowOutput: "解码并通知车主", note1Label: "通知方式", note2Label: "发送方式", note2Value: "扫码者的浏览器<br />直接发送", note3Label: "部署方式", note3Value: "静态托管<br />或自己的 Web Server", note4Label: "界面语言", note4Value: "十种支持语言", boundaryLabel: "边界说明", boundaryBody: "M1 不加密车主号码或通知凭据。有意分析二维码仍可读取其中信息；MoveMoCar 减少的是日常场景里的直接暴露。",
    faqTitle: "常见问题", faqReadme: "查看完整 README", faq1Q: "不会配置 Bark、WxPusher 或 ntfy，还能用吗？", faq1A: "可以。你依然可以生成只包含联系电话的二维码，只是体验会更接近普通挪车码。有条件的话，还是建议配置一个通知渠道。", faq2Q: "更换手机号或通知配置以后怎么办？", faq2A: "重新生成二维码并重新打印。配置跟着二维码本身走，已经打印出来的二维码不会自动更新。", faq3Q: "二维码被别人解析以后，能看到我的号码吗？", faq3A: "能。如果有人有意分析二维码内容，仍然可以读取其中的信息。MoveMoCar 主要减少的是日常场景里的直接暴露。", faq4Q: "通知服务挂了，会不会完全联系不到我？", faq4A: "不会。MoveMoCar 会同时尝试已经配置的通知渠道；如果全部失败，页面会提示发送失败并开放直接拨号入口。",
    closingTitle: "生成你的<br />挪车码", footerContact: "联系页面", footerAria: "页脚导航", heroAlt: "白色圆形展示台上停放的奶白色汽车，前挡风玻璃内放着绿色联系卡", relayAlt: "扫码者从车侧用手机扫描车窗内的二维码联系卡", contactAlt: "iPhone 15 Pro 中的 MoveMoCar 联系页面，扫码者填写自己的电话和挪车留言", createAlt: "iPhone 15 Pro 中的 MoveMoCar 创建页面", resultAlt: "iPhone 15 Pro 中生成完成的 MoveMoCar 挪车二维码", closingAlt: "车主在安静的室内查看手机通知",
  },
  en: {
    skip: "Skip to main content", navAria: "Primary navigation", homeAria: "MoveMoCar home", menu: "Open menu", navHow: "How it works", navCreate: "Create", navTech: "Technology", ctaCreate: "Create my MoveMoCar code", ctaOpen: "Create my MoveMoCar code",
    heroKicker: "An open-source parking contact code with no backend", heroTitle: "Scan the parking code to leave a message<br />Call only when needed", heroBody: "MoveMoCar sounds like Move Mocha ☕️<br />I hope this simple little project feels just as smooth", heroDemo: "Try the visitor view",
    premiseTitle: "A little friction", premise1: "MoveMoCar does not pretend to turn your phone number into an unbreakable secret.", premise2: "The number is still stored in the QR code. Someone determined to inspect its contents can still find it.", premise3: "What it does is simple: your number is no longer written directly on the car window, or shown at first glance after scanning.", premise4: "For someone who genuinely needs the car moved, the only extra step is leaving a phone number and a short message.", premise5: "For someone casually scanning and copying numbers, that small step may be enough friction.",
    relayTitle: "How it works", relay1: "Place the generated QR code inside your car. After scanning, the visitor sees a simple contact page where they can leave their phone number and a message.", relay2: "The message is sent to a channel you configure, such as Bark, WxPusher, or ntfy. Once notified, you can call them back directly.",
    noticeNow: "now", noticeTitle: "Someone needs you to move your car", noticeMessage: "The car is blocking the exit. Could you move it? Thanks!", noticeCall: "Call back", step1Title: "Scan the QR code in the window", step1Body: "Open the contact page without showing the owner's number", step2Title: "Leave a phone number and message", step2Body: "The page only collects information entered by the visitor", step3Title: "The owner receives a notification and calls back", step3Body: "If delivery fails, the visitor can call the owner directly",
    builderTitle: "Create your parking code", builderBody: "Enter a contact number and add notification channels if needed. The configuration is stored in the QR code itself, with no account required.", builderStep1: "Add contact and vehicle details", builderStep2: "Add and test notification channels", builderStep3: "Save, print, and place the code in your car",
    systemTitle: "Encoding & technical details", systemBody: "The phone number, vehicle label, and notification settings are encoded into the QR code using the dedicated, open-source M1 format. After scanning, the browser reads the configuration and sends the message directly to the notification service.", flowAria: "Phone and notification settings are encoded into a QR code, then decoded in the browser to notify the owner", inputPhone: "Contact number", inputVehicle: "Vehicle label", inputPlate: "A12345", inputChannel: "Notification", qrAlt: "QR code generated from an example M1 configuration", flowOutput: "Decode and notify the owner", note1Label: "Notifications", note2Label: "Delivery", note2Value: "Sent directly from<br />the visitor's browser", note3Label: "Hosting", note3Value: "Static hosting<br />or your own web server", note4Label: "Languages", note4Value: "Ten supported languages", boundaryLabel: "Boundary", boundaryBody: "M1 does not encrypt the owner's number or notification credentials. A determined person can still inspect the QR code; MoveMoCar reduces casual exposure in everyday situations.",
    faqTitle: "FAQ", faqReadme: "Read the full README", faq1Q: "Can I use it without Bark, WxPusher, or ntfy?", faq1A: "Yes. You can generate a QR code with only a contact number, though the experience will be closer to a regular parking code. A notification channel is still recommended when possible.", faq2Q: "What if I change my phone number or notification settings?", faq2A: "Generate and print a new QR code. The configuration lives inside the code, so a printed code will not update automatically.", faq3Q: "Can someone extract my number from the QR code?", faq3A: "Yes. Someone who deliberately inspects the QR data can still read it. MoveMoCar mainly reduces direct exposure in everyday situations.", faq4Q: "Could a notification outage make me unreachable?", faq4A: "No. MoveMoCar tries every configured notification channel. If they all fail, the page reports the failure and offers a direct-call option.",
    closingTitle: "One for<br />your car", footerContact: "Contact page", footerAria: "Footer navigation", heroAlt: "A milk-white car on a circular display platform with a QR contact card in the windshield", relayAlt: "A visitor scanning the QR contact card in a car window", contactAlt: "MoveMoCar contact form shown on an iPhone 15 Pro", createAlt: "MoveMoCar code generator shown on an iPhone 15 Pro", resultAlt: "A generated MoveMoCar QR code shown on an iPhone 15 Pro", closingAlt: "A car owner checking a phone notification in a quiet interior",
  },
} as const;

const params = new URLSearchParams(location.search);
let locale: Locale = params.get("lang") === "en" ? "en" : "zh";
let theme: Theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
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
};

const navToggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const navLinks = document.querySelector<HTMLElement>(".nav-links");
const header = document.querySelector<HTMLElement>("[data-header]");
const closeMenu = () => { navToggle?.setAttribute("aria-expanded", "false"); navLinks?.classList.remove("nav-links--open"); document.body.classList.remove("menu-open"); };

navToggle?.addEventListener("click", () => { const open = navToggle.getAttribute("aria-expanded") !== "true"; navToggle.setAttribute("aria-expanded", String(open)); navLinks?.classList.toggle("nav-links--open", open); document.body.classList.toggle("menu-open", open); });
navLinks?.addEventListener("click", (event) => { if ((event.target as Element).closest("a")) closeMenu(); });
document.querySelector("[data-language-toggle]")?.addEventListener("click", () => { locale = locale === "zh" ? "en" : "zh"; setQuery("lang", locale, "zh"); render(); });
document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => { theme = theme === "light" ? "dark" : "light"; localStorage.setItem("movemocar-theme", theme); setQuery("theme", theme, "light"); render(); });
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
    builder.style.setProperty("--builder-glow-x", `${(x * 28).toFixed(2)}px`);
    builder.style.setProperty("--builder-glow-y", `${(y * 24).toFixed(2)}px`);
    builder.style.setProperty("--builder-light-x", `${(px * 100).toFixed(1)}%`);
    builder.style.setProperty("--builder-light-y", `${(py * 100).toFixed(1)}%`);
  }, { passive: true });
  builder?.addEventListener("pointerleave", () => {
    ["--builder-main-x", "--builder-main-y", "--builder-result-x", "--builder-result-y", "--builder-tilt-x", "--builder-tilt-y", "--builder-result-tilt-x", "--builder-result-tilt-y", "--builder-glow-x", "--builder-glow-y", "--builder-light-x", "--builder-light-y"].forEach((property) => builder.style.removeProperty(property));
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

const initHeroShader = () => {
  const canvas = document.querySelector<HTMLCanvasElement>("[data-hero-shader]");
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
    uniform float darkMode;

    float ribbon(vec2 uv, float offset, float pace) {
      float wave = .57 + offset + sin(uv.x * 8.0 + time * pace) * .035 + sin(uv.x * 18.0 - time * .24) * .012;
      float distanceToWave = abs(uv.y - wave);
      return smoothstep(.0, .006, distanceToWave) - smoothstep(.0, .022, distanceToWave);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      uv.y = 1.0 - uv.y;
      float rightMask = smoothstep(.30, .88, uv.x) * (1.0 - smoothstep(.58, .96, uv.y));
      float sweep = ribbon(uv, .04, .38) * .52 + ribbon(uv, .13, -.3) * .27;
      vec2 focus = uv - pointer;
      focus.x *= resolution.x / resolution.y;
      float halo = exp(-dot(focus, focus) * 15.0) * .11;
      float spark = pow(max(0.0, sin((uv.x + uv.y) * 18.0 - time * .55)), 18.0) * .055;
      float alpha = (sweep * .15 + halo + spark * rightMask) * rightMask * mix(.72, 1.32, darkMode);
      vec3 mint = vec3(.56, .89, .57);
      vec3 color = mix(mint, vec3(.91, 1.0, .93), smoothstep(.0, .18, sweep));
      alpha = clamp(alpha, 0.0, .24);
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
  const darkMode = gl.getUniformLocation(program, "darkMode");

  const pointerX = .72;
  const pointerY = .62;
  let needsResize = true;
  const resize = () => {
    const bounds = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio, 1.25);
    const width = Math.max(1, Math.round(bounds.width * dpr));
    const height = Math.max(1, Math.round(bounds.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    needsResize = false;
  };
  const draw = (now: number) => {
    if (needsResize) resize();
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform2f(pointer, pointerX, pointerY);
    gl.uniform1f(time, now * .001);
    gl.uniform1f(darkMode, document.documentElement.dataset.theme === "dark" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  const resizeObserver = new ResizeObserver(() => { needsResize = true; });
  resizeObserver.observe(canvas);
  runAnimationWhenVisible(canvas, draw);
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
      vec2 p = (gl_FragCoord.xy - vec2(resolution.x * .145, resolution.y * .52)) / resolution.y;
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
  const time = gl.getUniformLocation(program, "time");
  const darkMode = gl.getUniformLocation(program, "darkMode");
  let needsResize = true;
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
    gl.uniform1f(time, now * .001);
    gl.uniform1f(darkMode, document.documentElement.dataset.theme === "dark" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  new ResizeObserver(() => { needsResize = true; }).observe(canvas);
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

initHeroShader();
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
const revealItems = document.querySelectorAll<HTMLElement>("[data-reveal]");
if (reducedMotion) revealItems.forEach((item) => item.classList.add("is-visible"));
else { const observer = new IntersectionObserver((entries, current) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); current.unobserve(entry.target); } }), { rootMargin: "0px 0px -8%", threshold: 0.12 }); revealItems.forEach((item) => observer.observe(item)); }

render();
