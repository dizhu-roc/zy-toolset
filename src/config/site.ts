/** Canonical site URL — set in deployment env when known */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const siteName = "Toolsset";

/** 顶栏品牌图（public 下文件名，UUID 避免缓存与误链） */
export const brandLogoSrc =
  "/4e309b54-c518-4b6f-9a5d-7aedc2ef64ae.png";
