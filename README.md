# Toolsset

在线工具集（Next.js App Router）。默认在浏览器内处理数据；产品说明见 `docs/`。

## 脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务 |
| `npm run lint` | ESLint |

## 目录约定

```
src/
  app/                 # 路由与页面（App Router）
    [locale]/          # 动态段 en | zh（仅文件结构；对外英文无前缀，见 proxy）
  components/
    layout/            # 站点壳、语言切换
    ui/                # 可复用小组件（随工具增加）
  config/              # 站点级常量（URL、名称）
  i18n/                # locale 列表、字典加载
  lib/                 # 纯函数工具（如 cn）
  messages/            # 文案 JSON（en / zh）
  styles/              # 设计 token（CSS 变量）
```

- **样式**：`src/styles/tokens.css` 为色板与节奏源；`globals.css` 用 Tailwind v4 `@theme inline` 映射为工具类，避免魔法数散落在组件里。
- **文案**：按页面/模块在 `messages/*.json` 增加键；`getMessages(locale)` 在服务端加载。
- **路由**：**`src/proxy.ts`**（必须与 `src/app` 同级；勿放在仓库根目录，否则不生效）将**无前缀**路径视为英文，rewrite 到内部 `/en/...`（地址栏不出现 `/en`）；**zh / ja / es / fr** 使用 **`/{locale}/...` 前缀**。旧链接 **`/en/...`** 会 **308** 到无前缀 URL。语言为 **下拉** + **`router.replace`**。

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 规范 URL（metadata、sitemap），缺省为 `http://localhost:3000` |

## 技术栈

- Next.js 16、React 19、TypeScript
- Tailwind CSS v4（PostCSS）
- 字体：IBM Plex Sans / Plex Mono（`next/font`）
