# MoveMoCar 项目说明

## 构建变量

- `VITE_SITE_URL`：公开站点的基础 URL。只有显式设置为合法的 `http://` 或 `https://` 地址时，构建才会允许首页和生成页参与搜索索引，并生成 canonical、`hreflang`、Open Graph、JSON-LD、`robots.txt` 和 `sitemap.xml`。正式站点使用 `https://mmc.ironip.ink`。未设置时所有页面保持 `noindex, nofollow`；联系页与演示页无论是否设置都不得参与索引。
- `VITE_GOOGLE_SITE_VERIFICATION`：可选的 Google Search Console HTML 标签验证码。只在部署环境中设置，不得提交真实验证码。
- `VITE_BING_SITE_VERIFICATION`：可选的 Bing Webmaster Tools HTML 标签验证码。只在部署环境中设置，不得提交真实验证码。
- `VITE_FOOTER_TEXT`：可选的页脚备案或站点信息。未设置或为空时不渲染占位文本。

不要添加要求自部署用户填写这些变量的 `.env` 或 `.env.example`，也不要把真实验证码写入源码、README 或 Git 历史。
