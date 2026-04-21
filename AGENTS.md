<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Toolsset 工程约定（布局与路由）

### URL 与目录

- **工具页**统一挂在 **`src/app/[locale]/tools/{slug}/page.tsx`**。英文默认语言在地址栏为 **`/tools/{slug}`**（由 `src/proxy.ts` rewrite），其它语言为 **`/{locale}/tools/{slug}`**。
- **合规与 SEO 占位页**：`privacy`、`terms`、`cookies` 与工具同级目录 **`src/app/[locale]/{page}/page.tsx`**。
- 浏览器 href 一律用 **`hrefForLocale(locale, "rest/path")`**（`src/lib/localized-path.ts`），不要手写 `/en/...`。

### 布局组件

- **全站壳**：`SiteShell`（顶栏、`main`、页脚）。`main` 与顶栏共用 **`max-w-content`**（设计 token `--measure-content`，当前 **80rem ≈ 1280px**）。
- **工具页壳**：`ToolPageLayout`（**Server Component**）。标题与说明服务端渲染；需要 Tab、大输入、文件等交互时，在 **`children` 下挂独立 Client 子组件**。

### 新增一个工具（检查清单）

1. 在 **`src/messages/*.json`** 增加该工具文案键（与 `getMessages` 类型一致）。
2. 新建 **`src/app/[locale]/tools/<slug>/page.tsx`**，默认导出页面包 **`ToolPageLayout`**，并实现 **`generateMetadata`**（`title` / `description`，建议 `robots: { index: true, follow: true }`）。
3. 将 **`tools/<slug>`**（`rest` 为 `tools/<slug>`）加入 **`src/app/sitemap.ts`** 的静态或动态列表。
4. 从首页或工具矩阵加上入口链接（若已对外宣传）。

### 合规文案

- **隐私 / 条款 / Cookie** 正文放在 **`messages`** 的 `privacy`、`terms`、`cookies` 键下；占位页用 **`LegalArticle`** 渲染。正式对外前需替换为法务审核稿。
