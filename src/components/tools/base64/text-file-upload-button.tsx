"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * `accept`：浏览器 MIME + 常见源码扩展名（纯文本/标记/配置/脚本，不含 office/pdf/二进制图片）
 */
export const TEXT_FILE_INPUT_ACCEPT = [
  "text/*",
  "application/json",
  "application/xml",
  "application/ld+json",
  "application/javascript",
  "application/x-javascript",
  "application/x-yaml",
  "application/toml",
  "image/svg+xml",
  ".txt",
  ".text",
  ".log",
  ".md",
  ".mdx",
  ".markdown",
  ".html",
  ".htm",
  ".xhtml",
  ".css",
  ".less",
  ".scss",
  ".sass",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".jsonc",
  ".json5",
  ".vue",
  ".svelte",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".config",
  ".env",
  ".sh",
  ".bash",
  ".zsh",
  ".bat",
  ".cmd",
  ".ps1",
  ".psm1",
  ".sql",
  ".http",
  ".graphql",
  ".gql",
  ".xml",
  ".svg",
  ".xsl",
  ".xslt",
  ".csv",
  ".tsv",
  ".editorconfig",
  ".gitignore",
  ".gitattributes",
  ".lock",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
  ".cc",
  ".go",
  ".rs",
  ".py",
  ".rb",
  ".php",
  ".java",
  ".kt",
  ".swift",
  ".r",
  ".pl",
  ".pm",
  ".hs",
  ".clj",
  ".cljs",
  ".edn",
  ".fs",
  ".fsx",
  ".vbs",
  ".rc",
  ".adoc",
  ".asc",
  ".ipynb",
].join(",");

const TEXT_FILE_EXT_LIST =
  "txt text log md mdx markdown html htm xhtml css less scss sass js mjs cjs ts tsx jsx json jsonc json5 vue svelte yaml yml toml ini cfg conf config env sh bash zsh bat cmd ps1 psm1 sql http graphql gql xml svg xsl xslt csv tsv editorconfig gitignore gitattributes lock c h cpp hpp cc go rs py rb php java kt swift r pl pm hs clj cljs cljc edn fs fsx vbs aspx adoc asc ipynb".split(" ");

const TEXT_FILE_EXTENSIONS = new Set(TEXT_FILE_EXT_LIST);

/**
 * 二次校验：明显二进制（pdf/ Office/ 常见图片与压缩包等）拒绝；无 MIME 时看扩展名。
 */
export function isPlausibleTextUpload(file: File): boolean {
  const t = (file.type || "").toLowerCase();
  if (t.startsWith("text/")) return true;
  if (t === "image/svg+xml") return true;
  if (
    t === "application/json" ||
    t === "application/xml" ||
    t === "application/ld+json" ||
    t === "application/javascript" ||
    t === "application/x-javascript" ||
    t === "application/x-yaml" ||
    t === "application/toml"
  ) {
    return true;
  }
  if (t === "application/octet-stream") {
    return hasAllowedTextExtension(file.name) || !/\.[a-z0-9]+$/i.test(file.name);
  }
  if (t.startsWith("image/") && t !== "image/svg+xml") return false;
  if (t.startsWith("video/") || t.startsWith("audio/")) return false;
  if (
    t === "application/pdf" ||
    t.includes("msword") ||
    t.includes("officedocument") ||
    t.includes("opendocument")
  ) {
    return false;
  }
  if (t === "application/zip" || t === "application/gzip" || t === "application/x-rar-compressed" || t === "application/x-7z-compressed") {
    return false;
  }
  if (!t) {
    return hasAllowedTextExtension(file.name) || !/\.[a-z0-9]+$/i.test(file.name);
  }
  if (t.startsWith("application/")) {
    return t.includes("json") || t.includes("xml") || t.includes("javascript") || t.includes("ecmascript");
  }
  return false;
}

function hasAllowedTextExtension(fileName: string): boolean {
  const i = fileName.lastIndexOf(".");
  if (i <= 0) return false;
  return TEXT_FILE_EXTENSIONS.has(fileName.slice(i + 1).toLowerCase());
}

/** 经典「上传」：底边托盘 + 向上箭头（与常见图标库一致） */
function IconUpload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      />
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="m17 8-5-5-5 5" />
      <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M12 3v12" />
    </svg>
  );
}

/**
 * 选择本地纯文本文件并读入为 UTF-8 字符串。不符合规则时调用 `onInvalid`。
 */
export function TextFileUploadButton({
  label,
  title: titleAttr,
  onTextLoaded,
  onInvalid,
  disabled,
}: {
  /** 按钮上可见的短文案 */
  label: string;
  /** 悬停时浏览器 `title` 提示（建议说明可选文件类型与限制） */
  title: string;
  onTextLoaded: (text: string) => void;
  onInvalid?: () => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={TEXT_FILE_INPUT_ACCEPT}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (!isPlausibleTextUpload(file)) {
            onInvalid?.();
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            onTextLoaded(typeof reader.result === "string" ? reader.result : "");
          };
          reader.onerror = () => onInvalid?.();
          reader.readAsText(file, "UTF-8");
        }}
      />
      <button
        type="button"
        title={titleAttr}
        aria-label={label}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-colors",
          "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
          "dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25",
        )}
      >
        <IconUpload className="size-3.5 shrink-0" />
        <span className="max-w-[7rem] truncate sm:max-w-[9rem]">{label}</span>
      </button>
    </>
  );
}
