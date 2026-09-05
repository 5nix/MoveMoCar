import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin } from "vite";

const normalizeUrl = (value = "") => value.trim().replace(/\/+$/, "");

type SeoPage = {
  path: string;
  title: string;
  description: string;
  englishTitle: string;
  englishDescription: string;
};

type SeoOptions = {
  siteUrl: string;
  siteVerification?: string;
};

const seoPages = new Map<string, SeoPage>([
  ["/index.html", {
    path: "/",
    title: "MoveMoCar｜无需后端的开源挪车码",
    description: "MoveMoCar 是一个无需后端的开源挪车码。扫描二维码后先发送留言，车主收到通知后再回拨。",
    englishTitle: "MoveMoCar | Open-source parking contact QR code",
    englishDescription: "A backend-free, open-source parking contact QR code. Visitors leave a message, and the owner calls back.",
  }],
  ["/create/index.html", {
    path: "/create/",
    title: "生成挪车码｜MoveMoCar",
    description: "在线配置联系电话和通知渠道，生成无需账号、无需后端的 MoveMoCar 挪车二维码。",
    englishTitle: "Create a MoveMoCar code | MoveMoCar",
    englishDescription: "Create a parking contact QR code with optional notification channels. No account or backend required.",
  }],
]);

const validPublicUrl = (value: string) => {
  const normalized = normalizeUrl(value);
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? normalized : "";
  } catch {
    return "";
  }
};

const localizedUrl = (siteUrl: string, path: string, locale: "zh-CN" | "en") =>
  `${siteUrl}${path}${locale === "en" ? "?lang=en" : ""}`;

const alternateTags = (siteUrl: string, page: SeoPage): HtmlTagDescriptor[] => [
  { tag: "link", attrs: { rel: "alternate", hreflang: "zh-CN", href: localizedUrl(siteUrl, page.path, "zh-CN") }, injectTo: "head" },
  { tag: "link", attrs: { rel: "alternate", hreflang: "en", href: localizedUrl(siteUrl, page.path, "en") }, injectTo: "head" },
  { tag: "link", attrs: { rel: "alternate", hreflang: "x-default", href: localizedUrl(siteUrl, page.path, "zh-CN") }, injectTo: "head" },
];

const socialTags = (siteUrl: string, page: SeoPage): HtmlTagDescriptor[] => {
  const canonical = `${siteUrl}${page.path}`;
  const image = `${siteUrl}/assets/landing/campaign-hero-3d-white-v2.webp`;
  return [
    { tag: "meta", attrs: { property: "og:type", content: "website" }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:site_name", content: "MoveMoCar" }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:title", content: page.title }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:description", content: page.description }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:url", content: canonical }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:locale", content: "zh_CN" }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:locale:alternate", content: "en_US" }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:image", content: image }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:image:type", content: "image/webp" }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:image:width", content: "1672" }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:image:height", content: "941" }, injectTo: "head" },
    { tag: "meta", attrs: { property: "og:image:alt", content: "MoveMoCar 挪车码放置在汽车前挡风玻璃内" }, injectTo: "head" },
    { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" }, injectTo: "head" },
    { tag: "meta", attrs: { name: "twitter:title", content: page.title }, injectTo: "head" },
    { tag: "meta", attrs: { name: "twitter:description", content: page.description }, injectTo: "head" },
    { tag: "meta", attrs: { name: "twitter:image", content: image }, injectTo: "head" },
    { tag: "meta", attrs: { name: "twitter:image:alt", content: "MoveMoCar 挪车码放置在汽车前挡风玻璃内" }, injectTo: "head" },
  ];
};

const structuredDataTag = (siteUrl: string, page: SeoPage): HtmlTagDescriptor => ({
  tag: "script",
  attrs: { type: "application/ld+json" },
  children: JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#application`,
        name: "MoveMoCar",
        url: `${siteUrl}/`,
        description: seoPages.get("/index.html")?.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" },
        codeRepository: "https://github.com/5nix/MoveMoCar",
        license: "https://www.gnu.org/licenses/agpl-3.0.html",
        inLanguage: ["zh-CN", "en"],
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}${page.path}#webpage`,
        url: `${siteUrl}${page.path}`,
        name: page.title,
        description: page.description,
        inLanguage: "zh-CN",
        mainEntity: { "@id": `${siteUrl}/#application` },
      },
    ],
  }).replace(/</g, "\\u003c"),
  injectTo: "head",
});

const sitemapEntry = (siteUrl: string, page: SeoPage, locale: "zh-CN" | "en") => {
  const zhUrl = localizedUrl(siteUrl, page.path, "zh-CN");
  const enUrl = localizedUrl(siteUrl, page.path, "en").replace(/&/g, "&amp;");
  const loc = localizedUrl(siteUrl, page.path, locale).replace(/&/g, "&amp;");
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    `    <xhtml:link rel="alternate" hreflang="zh-CN" href="${zhUrl}" />`,
    `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${zhUrl}" />`,
    "  </url>",
  ].join("\n");
};

const seoPlugin = (options: SeoOptions): Plugin => {
  const publicSiteUrl = validPublicUrl(options.siteUrl);
  // Trusted build-time HTML supplied by the site owner, never visitor input.
  const verificationHtml = options.siteVerification ?? "";

  return {
    name: "movemocar-seo-gate",
    transformIndexHtml: {
      order: "pre",
      handler(html, context) {
        const page = seoPages.get(context.path);
        const canIndex = Boolean(publicSiteUrl && page);
        const robots = canIndex ? "index, follow" : "noindex, nofollow";
        let transformed = html.replace(
          /<meta\s+name=["']robots["'][^>]*>/i,
          `<meta name="robots" content="${robots}" />`,
        );
        if (context.path === "/index.html" && verificationHtml) {
          transformed = transformed.replace(/<\/head>/i, () => `${verificationHtml}\n</head>`);
        }

        if (!canIndex || !page) return transformed;
        return {
          html: transformed,
          tags: [
            { tag: "link", attrs: { rel: "canonical", href: `${publicSiteUrl}${page.path}` }, injectTo: "head" },
            ...alternateTags(publicSiteUrl, page),
            ...socialTags(publicSiteUrl, page),
            structuredDataTag(publicSiteUrl, page),
          ],
        };
      },
    },
    generateBundle() {
      const robots = publicSiteUrl
        ? `User-agent: *\nAllow: /\n\nSitemap: ${publicSiteUrl}/sitemap.xml\n`
        : "User-agent: *\nAllow: /\n";
      this.emitFile({ type: "asset", fileName: "robots.txt", source: robots });

      if (publicSiteUrl) {
        const urls = [...seoPages.values()]
          .flatMap((page) => [sitemapEntry(publicSiteUrl, page, "zh-CN"), sitemapEntry(publicSiteUrl, page, "en")])
          .join("\n");
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
        });
      }
    },
  };
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ["VITE_SITE_URL", "SITE_VERIFICATION_META"]);

  return {
    base: "./",
    plugins: [seoPlugin({
      siteUrl: env.VITE_SITE_URL,
      siteVerification: env.SITE_VERIFICATION_META,
    })],
    build: {
      rollupOptions: {
        input: {
          landing: "index.html",
          contact: "m/index.html",
          demo: "m/demo/index.html",
          create: "create/index.html",
        },
      },
    },
  };
});
