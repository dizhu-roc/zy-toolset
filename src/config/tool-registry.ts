import type { HomeToolIconId } from "@/components/icons/home-tool-icons";
import type { Messages } from "@/i18n/dictionaries";

/**
 * 站点内工具路由（不含语言前缀）。
 * 供首页、顶栏导航、sitemap、工具页交叉链接等复用，避免路径字符串分散导致漏改。
 */
export const TOOL_ROUTES = {
  base64: {
    textEncode: "tools/base64/text-encode",
    textDecode: "tools/base64/text-decode",
    fileEncode: "tools/base64/file-encode",
    fileDecode: "tools/base64/file-decode",
  },
  generator: {
    password: "tools/generator/password",
    ico: "tools/generator/ico",
  },
  image: {
    compress: "tools/image/compress",
    crop: "tools/image/crop",
    resize: "tools/image/resize",
  },
} as const;

/** 与 `app/sitemap.ts` 历史顺序一致，便于 diff 审阅 */
export const SITEMAP_TOOL_RESTS: readonly string[] = [
  TOOL_ROUTES.base64.textEncode,
  TOOL_ROUTES.base64.textDecode,
  TOOL_ROUTES.base64.fileEncode,
  TOOL_ROUTES.base64.fileDecode,
  TOOL_ROUTES.generator.password,
  TOOL_ROUTES.generator.ico,
  TOOL_ROUTES.image.compress,
  TOOL_ROUTES.image.crop,
  TOOL_ROUTES.image.resize,
];

type HomeGridToolKey = keyof Pick<
  Messages["tools"],
  | "passwordGenerator"
  | "icoGenerator"
  | "imageCompressor"
  | "imageCropper"
  | "imageResizer"
>;

/** 首页工具矩阵中除「Base64 文本/文件」卡片外的条目（文案来自 `tools.<key>`） */
export const HOME_GRID_TOOL_ENTRIES: readonly {
  rest: string;
  key: HomeGridToolKey;
  icon: HomeToolIconId;
}[] = [
  {
    rest: TOOL_ROUTES.generator.password,
    key: "passwordGenerator",
    icon: "passwordGenerator",
  },
  {
    rest: TOOL_ROUTES.generator.ico,
    key: "icoGenerator",
    icon: "icoGenerator",
  },
  {
    rest: TOOL_ROUTES.image.compress,
    key: "imageCompressor",
    icon: "imageCompressor",
  },
  {
    rest: TOOL_ROUTES.image.crop,
    key: "imageCropper",
    icon: "imageCropper",
  },
  {
    rest: TOOL_ROUTES.image.resize,
    key: "imageResizer",
    icon: "imageResizer",
  },
];
