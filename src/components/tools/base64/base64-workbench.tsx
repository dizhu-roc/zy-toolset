"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import type { Messages } from "@/i18n/dictionaries";
import {
  base64ToBytes,
  bytesToBase64,
  extensionForMime,
  tryParseDataUrl,
  tryUtf8Decode,
  utf8TextToBytes,
} from "@/lib/base64";
import { cn } from "@/lib/utils";

type Copy = Messages["tools"]["base64"];

const MAX_FILE_BYTES = 8 * 1024 * 1024;

type TabId = "text" | "file" | "decode";

function tabFromHash(): TabId | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#/, "").toLowerCase();
  if (raw === "text" || raw === "file" || raw === "decode") return raw;
  return null;
}

export function Base64Workbench({
  copy,
  privacyHref,
}: {
  copy: Copy;
  privacyHref: string;
}) {
  const tabsId = useId();
  const [tab, setTab] = useState<TabId>("text");

  const [textIn, setTextIn] = useState("");
  const [textOut, setTextOut] = useState("");
  const [dataUrlText, setDataUrlText] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [fileOut, setFileOut] = useState("");
  const [dataUrlFile, setDataUrlFile] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);

  const [decodeIn, setDecodeIn] = useState("");
  const [decodeOut, setDecodeOut] = useState("");
  const [decodeInfo, setDecodeInfo] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeBytes, setDecodeBytes] = useState<Uint8Array | null>(null);
  const [decodeMime, setDecodeMime] = useState("application/octet-stream");

  const [copyHint, setCopyHint] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = tabFromHash();
    if (fromHash) setTab(fromHash);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const next = tabFromHash();
      if (next) setTab(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const selectTab = useCallback((id: TabId) => {
    setTab(id);
    const url = `${window.location.pathname}${window.location.search}#${id}`;
    window.history.replaceState(null, "", url);
  }, []);

  const flashCopy = useCallback(() => {
    setCopyHint(copy.copied);
    window.setTimeout(() => setCopyHint(null), 2000);
  }, [copy.copied]);

  const encodeText = useCallback(() => {
    try {
      const bytes = utf8TextToBytes(textIn);
      const b64 = bytesToBase64(bytes);
      setTextOut(
        dataUrlText ? `data:text/plain;charset=utf-8;base64,${b64}` : b64,
      );
    } catch {
      setTextOut("");
    }
  }, [dataUrlText, textIn]);

  const encodeFile = useCallback(async () => {
    setFileError(null);
    setFileOut("");
    if (!file) {
      setFileError(copy.filePick);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError(
        copy.fileTooLarge.replace("{mb}", String(MAX_FILE_BYTES / (1024 * 1024))),
      );
      return;
    }
    try {
      if (dataUrlFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("read"));
          reader.readAsDataURL(file);
        });
        setFileOut(dataUrl);
      } else {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        setFileOut(bytesToBase64(bytes));
      }
    } catch {
      setFileError(copy.fileReadError);
    }
  }, [copy, dataUrlFile, file]);

  const runDecode = useCallback(() => {
    setDecodeError(null);
    setDecodeOut("");
    setDecodeInfo(null);
    setDecodeBytes(null);
    try {
      const trimmed = decodeIn.trim();
      const data = tryParseDataUrl(trimmed);
      let bytes: Uint8Array;
      let mime = "text/plain;charset=utf-8";

      if (data) {
        bytes = base64ToBytes(data.base64Part);
        mime = data.mime;
      } else {
        bytes = base64ToBytes(trimmed);
      }

      setDecodeMime(mime.split(";")[0].trim());

      const utf = tryUtf8Decode(bytes);
      if (utf.ok) {
        setDecodeOut(utf.text);
        setDecodeInfo(copy.decodeUtf8Ok);
      } else {
        setDecodeInfo(copy.decodeBinaryHint);
        setDecodeBytes(bytes);
      }
    } catch {
      setDecodeError(copy.decodeErrorInvalid);
    }
  }, [copy, decodeIn]);

  const copyText = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      flashCopy();
    } catch {
      setCopyHint(copy.copyFailed);
      window.setTimeout(() => setCopyHint(null), 2500);
    }
  };

  const downloadDecoded = () => {
    if (!decodeBytes) return;
    const ext = extensionForMime(decodeMime);
    const bytes = new Uint8Array(decodeBytes.length);
    bytes.set(decodeBytes);
    const blob = new Blob([bytes], { type: decodeMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decoded${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "text", label: copy.tabText },
    { id: "file", label: copy.tabFile },
    { id: "decode", label: copy.tabDecode },
  ];

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-sm text-text-muted leading-relaxed">
        {copy.localNotice}{" "}
        <Link
          href={privacyHref}
          className="text-text-secondary no-underline hover:text-text"
        >
          {copy.privacyLink}
        </Link>
      </p>

      <div
        role="tablist"
        aria-label={copy.tabsAria}
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${tabsId}-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${tabsId}-panel-${t.id}`}
            className={cn(
              "cursor-pointer rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors",
              tab === t.id
                ? "bg-surface-raised text-text shadow-sm"
                : "text-text-secondary hover:text-text",
              "focus-visible:ring-2 focus-visible:ring-accent/25",
            )}
            onClick={() => selectTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "text" ? (
        <section
          role="tabpanel"
          id={`${tabsId}-panel-text`}
          aria-labelledby={`${tabsId}-text`}
          className="space-y-4"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">
                {copy.textInputLabel}
              </span>
              <textarea
                className="min-h-[10rem] w-full resize-y rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                value={textIn}
                onChange={(e) => setTextIn(e.target.value)}
                spellCheck={false}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">
                {copy.textOutputLabel}
              </span>
              <textarea
                readOnly
                className="min-h-[10rem] w-full resize-y rounded-md border border-border bg-canvas px-3 py-2 font-mono text-sm text-text outline-none"
                value={textOut}
                spellCheck={false}
              />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-accent"
              checked={dataUrlText}
              onChange={(e) => setDataUrlText(e.target.checked)}
            />
            {copy.asDataUrlText}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface-raised shadow-sm transition-colors hover:bg-accent-hover"
              onClick={encodeText}
            >
              {copy.encodeAction}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-raised"
              onClick={() => {
                setTextIn("");
                setTextOut("");
              }}
            >
              {copy.clearAction}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-raised"
              onClick={() => copyText(textOut)}
            >
              {copy.copyOutput}
            </button>
          </div>
        </section>
      ) : null}

      {tab === "file" ? (
        <section
          role="tabpanel"
          id={`${tabsId}-panel-file`}
          aria-labelledby={`${tabsId}-file`}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-text">
              {copy.fileLabel}
            </label>
            <input
              type="file"
              className="mt-2 block w-full max-w-md cursor-pointer text-sm text-text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-surface-raised hover:file:bg-accent-hover"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setFileOut("");
                setFileError(null);
              }}
            />
            <p className="mt-2 max-w-prose text-xs text-text-muted leading-relaxed">
              {copy.maxFileHint.replace("{mb}", String(MAX_FILE_BYTES / (1024 * 1024)))}
            </p>
            {file ? (
              <p className="mt-1 text-xs text-text-secondary">
                {file.name} — {(file.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
            {fileError ? (
              <p className="mt-2 text-sm text-danger" role="alert">
                {fileError}
              </p>
            ) : null}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="size-4 rounded border-border accent-accent"
              checked={dataUrlFile}
              onChange={(e) => setDataUrlFile(e.target.checked)}
            />
            {copy.asDataUrlFile}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">
              {copy.fileOutputLabel}
            </span>
            <textarea
              readOnly
              className="min-h-[8rem] w-full resize-y rounded-md border border-border bg-canvas px-3 py-2 font-mono text-sm text-text outline-none"
              value={fileOut}
              spellCheck={false}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface-raised shadow-sm transition-colors hover:bg-accent-hover"
              onClick={() => void encodeFile()}
            >
              {copy.encodeFileAction}
            </button>
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-raised"
              onClick={() => copyText(fileOut)}
            >
              {copy.copyOutput}
            </button>
          </div>
        </section>
      ) : null}

      {tab === "decode" ? (
        <section
          role="tabpanel"
          id={`${tabsId}-panel-decode`}
          aria-labelledby={`${tabsId}-decode`}
          className="space-y-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-text">
              {copy.decodeInputLabel}
            </span>
            <textarea
              className="min-h-[10rem] w-full resize-y rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
              value={decodeIn}
              onChange={(e) => setDecodeIn(e.target.value)}
              spellCheck={false}
              placeholder={copy.decodePlaceholder}
            />
          </label>
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface-raised shadow-sm transition-colors hover:bg-accent-hover"
            onClick={runDecode}
          >
            {copy.decodeAction}
          </button>
          {decodeError ? (
            <p className="text-sm text-danger" role="alert">
              {decodeError}
            </p>
          ) : null}
          {decodeInfo ? (
            <p className="text-sm text-text-secondary">{decodeInfo}</p>
          ) : null}
          {decodeOut ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-text">
                {copy.decodeOutputLabel}
              </span>
              <textarea
                readOnly
                className="min-h-[10rem] w-full resize-y rounded-md border border-border bg-canvas px-3 py-2 font-mono text-sm text-text outline-none"
                value={decodeOut}
                spellCheck={false}
              />
            </label>
          ) : null}
          {decodeBytes ? (
            <button
              type="button"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-raised"
              onClick={downloadDecoded}
            >
              {copy.downloadDecoded}
            </button>
          ) : null}
        </section>
      ) : null}

      {copyHint ? (
        <p className="text-sm text-text-secondary" role="status">
          {copyHint}
        </p>
      ) : null}
    </div>
  );
}
