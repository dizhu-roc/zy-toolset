"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { IconColumnSourceText } from "@/components/tools/base64/base64-text-column-icons";
import { ToolTitleBarTextButton } from "@/components/ui/tool-title-bar-text-button";
import {
  toolSectionHeadingClass,
  toolSectionHeadingIconClass,
  toolSectionTitleBarClass,
  toolSectionTitleActionsClass,
} from "@/lib/ui/tool-surface";
import { cn } from "@/lib/utils";

type DemoProps = {
  autoEncodeLabel: string;
  backHref: string;
  backLabel: string;
};

const FOCUS_SWITCH = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-main-bg dark:focus-visible:ring-offset-main-bg";

/**
 * 纯展示用：「自动编码」开关的 UI 方案。开关与文案合成单一可点控件，便于在标题栏感知为一整块。
 */
export function TextEncodeAutoSwitchSamples({
  autoEncodeLabel,
  backHref,
  backLabel,
}: DemoProps) {
  return (
    <div className="py-6">
      <p className="m-0 text-sm text-text-secondary">
        <Link href={backHref} className="text-accent no-underline hover:underline">
          ← {backLabel}
        </Link>
      </p>
      <h1 className="mt-3 text-2xl font-semibold text-text">Auto-encode 开关样式样例</h1>
      <p className="mt-2 max-w-2xl text-sm text-text-secondary leading-relaxed">
        下述样例将<strong className="text-text/90">滑块 + 文案包在同一颗控件里</strong>：外层是单个{" "}
        <code className="rounded bg-zinc-200/80 px-1 text-xs text-text dark:bg-zinc-700/80">role="switch"</code>{" "}
        的按钮，整区可点；内部轨仅为装饰（{" "}
        <code className="rounded bg-zinc-200/50 px-0.5">aria-hidden</code> ），避免与文案割裂。
      </p>
      <p className="mt-2 max-w-2xl text-sm text-text-muted leading-relaxed">
        接到{" "}
        <code className="rounded bg-zinc-200/50 px-1 text-xs">text-base64-encode-panel</code> 时，用下述任一
        结构的按钮替换原来的 <code className="rounded bg-zinc-200/50 px-1 text-xs">label + checkbox</code> 即可。
      </p>
      <ul className="mt-2 list-inside list-disc text-xs text-text-muted">
        <li>开启态主色与顶栏主按钮一致（#1576BB）</li>
        <li>文末附一种「非整体」作对照，一般不推荐在顶栏使用</li>
      </ul>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-text-muted">整体式（推荐在标题栏）</h2>
      <div className="mt-4 flex flex-col gap-10">
        <SampleWhole1 label={autoEncodeLabel} title="1 · 线框药丸" hint="白底/暗底 + 细边，轻量、与线框按钮协调。" />
        <SampleWhole2 label={autoEncodeLabel} title="2 · 灰底药丸" hint="无强边线，关态更柔；开态仍可略提亮底。" />
        <SampleWhole3 label={autoEncodeLabel} title="3 · 开=淡蓝高亮" hint="整颗控件带 #1576BB 浅底 + 边线，开/关态差异一眼可见。" />
        <SampleWhole4 label={autoEncodeLabel} title="4 · 顶栏行高对齐（h-8）" hint="与 Encode / Clear 行高接近，更整齐。" />
        <SampleWhole5 label={autoEncodeLabel} title="5 · 全圆角长条" hint="偏「胶囊条」，长文案时横向延展自然。" />
        <SampleWhole6 label={autoEncodeLabel} title="6 · 文先轨后（同整体）" hint="阅读顺序先标签再状态，轨靠右，仍在同一可点区域内。" />
        <SampleWhole7 label={autoEncodeLabel} title="7 · 极简底条" hint="仅下划线/底边，适合想再轻一档时。" />
        <SampleWhole8 label={autoEncodeLabel} title="8 · 小屏截断" hint="同整体；文案 max-width + truncate，小屏不撑爆顶栏。" />
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-text-muted">创意式（实验向，可挑一两种落地）</h2>
      <p className="mt-2 max-w-2xl text-xs text-text-muted leading-relaxed">
        偏视觉记忆点：光效、小徽章、动效、图标等。仍保持<strong>单颗</strong>
        <code className="mx-0.5 rounded bg-zinc-200/60 px-1">switch</code>
        按钮、内部轨
        <code className="mx-0.5 rounded bg-zinc-200/60 px-1">aria-hidden</code>；若某款太抢眼，可只在较宽的桌面顶栏用。
      </p>
      <div className="mt-4 flex flex-col gap-10">
        <SampleCreative1 label={autoEncodeLabel} title="创 1 · 柔光霓虹" hint="开启时外环 + 弥散光晕，关态收束成普通线框，适合想突出「开」的质感。" />
        <SampleCreative2 label={autoEncodeLabel} title="创 2 · 闪电" hint="左侧小闪电，暗示「即时/自动」；不增加语义负担（仍在同一按钮上）。" />
        <SampleCreative3 label={autoEncodeLabel} title="创 3 ·「实时」角标" hint="仅开时显示小粒「实时」，像直播/常连状态。" />
        <SampleCreative4 label={autoEncodeLabel} title="创 4 · 点划成线" hint="关态为虚线框，开态实线 + 主色，有点「草图→成稿」的味道。" />
        <SampleCreative5 label={autoEncodeLabel} title="创 5 · 扫入高光" hint="开态从左扫入淡蓝条，有轻微动态感，适合强调「开」的瞬时感。" />
        <SampleCreative6 label={autoEncodeLabel} title="创 6 · 抬起阴影" hint="开态像薄卡片被轻微托起；关态几乎贴面。" />
        <SampleCreative7 label={autoEncodeLabel} title="创 7 · 像素网纹" hint="主色 1px 点阵在开启时若隐若现，略偏极客/相机 UI。" />
        <SampleCreative8 label={autoEncodeLabel} title="创 8 · 不规则圆角" hint="四角半径不一致，像贴纸从工具栏上揭下的视觉趣味。" />
        <SampleCreative9 label={autoEncodeLabel} title="创 9 · 二进制提示" hint="等宽 0/1 小字作旁注，仅装饰，不替代主文案；偏开发者玩笑。" />
      </div>

      <h2 className="mt-12 text-sm font-semibold uppercase tracking-wide text-text-muted">分离式（对照，不推荐在顶栏）</h2>
      <p className="mt-2 text-xs text-text-muted">可点区仅为小方块轨，与文案无共同边界，点按感割裂。</p>
      <div className="mt-4 flex flex-col gap-10">
        <SampleSplitRef label={autoEncodeLabel} title="对照 · 轨与文案分离" hint="与早期 checkbox 行类似。" />
      </div>
    </div>
  );
}

const demoBarIcon = (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const demoTrashIcon = (
  <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
  </svg>
);

function MockTitleRow({
  children,
  title,
  hint,
}: {
  children: (value: boolean, onChange: (v: boolean) => void) => ReactNode;
  title: string;
  hint: string;
}) {
  const [v, setV] = useState(true);
  return (
    <section>
      <h3 className="m-0 text-base font-semibold text-text">{title}</h3>
      <p className="mt-1 text-sm text-text-muted">{hint}</p>
      <div
        className={cn(
          "mt-4 max-w-3xl overflow-hidden rounded-lg border border-zinc-200/90 shadow-sm",
          "dark:border-zinc-700/90",
        )}
      >
        <div className={toolSectionTitleBarClass}>
          <h2 className={toolSectionHeadingClass}>
            <IconColumnSourceText className={toolSectionHeadingIconClass} />
            <span className="min-w-0 truncate">Source text</span>
          </h2>
          <div className={cn(toolSectionTitleActionsClass, "gap-2")}>
            {children(v, setV)}
            <ToolTitleBarTextButton variant="primary" icon={demoBarIcon} disabled>
              Encode
            </ToolTitleBarTextButton>
            <ToolTitleBarTextButton variant="outline" icon={demoTrashIcon} disabled>
              Clear
            </ToolTitleBarTextButton>
          </div>
        </div>
        <p className="m-0 border-t border-dashed border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-text-secondary dark:border-zinc-600 dark:bg-zinc-900/50">
          状态：<strong>{v ? "on" : "off"}</strong>（点整块控件可切换，示意）
        </p>
      </div>
    </section>
  );
}

/* —— 内联轨：仅作装饰，不单独可聚焦 —— */

function TrackSm({ on }: { on: boolean }) {
  return (
    <span
      className="relative flex h-5 w-9 shrink-0 items-center rounded-full p-px"
      aria-hidden
    >
      <span
        className={cn(
          "flex h-full w-full items-center rounded-full p-px transition-colors",
          on ? "bg-[#1576BB]" : "bg-zinc-300 dark:bg-zinc-600",
        )}
      >
        <span
          className={cn(
            "h-3.5 w-3.5 rounded-full bg-white shadow",
            on ? "ml-auto" : "ml-0",
          )}
        />
      </span>
    </span>
  );
}

function TrackMd({ on }: { on: boolean }) {
  return (
    <span className="relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5" aria-hidden>
      <span
        className={cn(
          "flex h-full w-full items-center rounded-full p-0.5 transition-colors",
          on ? "bg-[#1576BB]" : "bg-zinc-300 dark:bg-zinc-600",
        )}
      >
        <span
          className={cn("h-4 w-4 rounded-full bg-white shadow-sm", on ? "ml-auto" : "ml-0")}
        />
      </span>
    </span>
  );
}

function LabelText({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span className={cn("min-w-0 select-none leading-snug", className)} title={title}>
      {children}
    </span>
  );
}

function WholeSwitchButton({
  on,
  onClick,
  className,
  children,
}: {
  on: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn("shrink-0 cursor-pointer", FOCUS_SWITCH, className)}
    >
      {children}
    </button>
  );
}

/* —— 整体式样例 —— */

function SampleWhole1({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
            "border-zinc-200/95 bg-white text-text-secondary",
            "hover:border-zinc-300 hover:bg-zinc-50/90",
            "dark:border-zinc-600 dark:bg-zinc-900/40 dark:hover:border-zinc-500",
            v && "border-[#1576BB]/50 bg-[#1576BB]/[0.07] text-text",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="whitespace-nowrap sm:whitespace-normal">{label}</LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleWhole2({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,15rem)] items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-left text-xs transition-colors",
            "bg-zinc-100/95 text-text-secondary",
            "hover:bg-zinc-200/80 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/90",
            v && "bg-[#1576BB]/12 text-text",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="whitespace-nowrap sm:whitespace-normal">{label}</LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleWhole3({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,16rem)] items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors",
            v
              ? "border-[#1576BB]/45 bg-[#1576BB]/10 text-text"
              : "border-zinc-200/80 bg-white text-text-secondary dark:border-zinc-600 dark:bg-zinc-900/50",
            !v && "hover:border-zinc-300",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="whitespace-nowrap sm:whitespace-normal">{label}</LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleWhole4({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex h-8 max-w-[min(100%,16rem)] items-center gap-1.5 rounded-md border px-2.5 text-left text-xs transition-colors",
            "border-zinc-200/90 bg-white text-text-secondary",
            "hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900/40",
            v && "border-[#1576BB]/40 bg-[#1576BB]/8 text-text",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="whitespace-nowrap sm:whitespace-normal">{label}</LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleWhole5({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex w-full min-w-0 max-w-md items-center justify-between gap-2 rounded-full border px-3 py-1.5 text-left text-xs transition-colors sm:w-auto",
            "border-zinc-200/90 bg-white",
            "hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900/30",
            v && "border-[#1576BB]/35 bg-[#1576BB]/6",
          )}
        >
          <LabelText
            className={cn(
              "min-w-0 flex-1 text-text",
              v ? "text-text" : "text-text-secondary",
            )}
          >
            {label}
          </LabelText>
          <span aria-hidden>
            <TrackSm on={v} />
          </span>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleWhole6({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex w-full min-w-0 max-w-sm items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors sm:max-w-[20rem]",
            "border-zinc-200/90 bg-white",
            "hover:bg-zinc-50/80 dark:border-zinc-600 dark:bg-zinc-900/30 dark:hover:bg-zinc-800/50",
            v && "bg-[#1576BB]/[0.08]",
          )}
        >
          <LabelText
            className={cn(
              "min-w-0 flex-1 truncate",
              v ? "font-medium text-text" : "text-text-secondary",
            )}
            title={label}
          >
            {label}
          </LabelText>
          <span aria-hidden className="shrink-0">
            <TrackMd on={v} />
          </span>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleWhole7({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,15rem)] items-center gap-1.5 rounded-sm border-b-2 border-transparent bg-transparent px-1.5 py-1 text-left text-xs transition-colors",
            v
              ? "border-[#1576BB] text-text"
              : "text-text-secondary hover:border-zinc-300 dark:hover:border-zinc-500",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="whitespace-nowrap sm:whitespace-normal">{label}</LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleWhole8({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex w-full min-w-0 max-w-[9.5rem] items-center gap-1.5 rounded-md border px-2 py-1.5 text-left text-xs sm:max-w-[14rem]",
            "border-zinc-200/90 bg-white text-text-secondary",
            "hover:border-zinc-300",
            "dark:border-zinc-600 dark:bg-zinc-900/30",
            v && "border-[#1576BB]/45 bg-[#1576BB]/6 text-text",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="min-w-0 flex-1 truncate" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

/* —— 创意式：视觉记忆点，仍为单 switch —— */

const IconBolt = (
  <svg className="size-3.5 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M7 2v11h3l-1 9 9-12h-5l1-8H7z" />
  </svg>
);

function SampleCreative1({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,17rem)] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all duration-200",
            v
              ? "border-[#1576BB]/55 bg-[#1576BB]/8 text-text shadow-[0_0_0_1px_rgba(21,118,187,0.2),0_0_20px_rgba(21,118,187,0.14)]"
              : "border-zinc-200/90 bg-white text-text-secondary shadow-sm hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900/50",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="min-w-0 flex-1 truncate" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative2({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,17rem)] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
            "border-zinc-200/90 bg-white",
            "hover:border-amber-200/80 dark:hover:border-amber-900/40",
            v && "border-amber-300/60 bg-amber-50/80 dark:border-amber-800/50 dark:bg-amber-950/20",
            v && "text-text",
            !v && "text-text-secondary",
          )}
        >
          {IconBolt}
          <TrackSm on={v} />
          <LabelText className="min-w-0 flex-1 truncate" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative3({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,18rem)] items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left text-xs",
            "border-zinc-200/90 bg-white text-text-secondary transition-all dark:border-zinc-600 dark:bg-zinc-900/40",
            v && "border-red-500/20 bg-gradient-to-r from-zinc-50/90 to-red-50/30 dark:from-zinc-900/80 dark:to-red-950/20",
            v && "text-text",
          )}
        >
          <TrackSm on={v} />
          <span className="flex min-w-0 flex-1 items-center gap-1">
            <LabelText className="min-w-0 flex-1 truncate" title={label}>
              {label}
            </LabelText>
            {v ? (
              <span
                className="shrink-0 rounded border border-red-500/30 bg-red-500/10 px-1 py-px text-[8px] font-bold uppercase leading-none text-red-700 tabular-nums dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-300"
                aria-hidden
              >
                实时
              </span>
            ) : null}
          </span>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative4({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-md border-2 bg-white px-2.5 py-1.5 text-left text-xs transition-all dark:bg-zinc-900/30",
            v
              ? "border-solid border-[#1576BB]/55 bg-[#1576BB]/5 text-text"
              : "border-dashed border-zinc-300 text-text-secondary dark:border-zinc-600",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="min-w-0 flex-1 truncate" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative5({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "relative inline-flex max-w-[min(100%,17rem)] min-w-0 items-center overflow-hidden rounded-md border border-zinc-200/90 bg-white px-2.5 py-1.5 text-left text-xs",
            "dark:border-zinc-600 dark:bg-zinc-900/30",
            v && "border-[#1576BB]/40",
          )}
        >
          <span
            className={cn(
              "pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-[#1576BB]/18 via-[#1576BB]/8 to-transparent transition-transform duration-300 ease-out",
              v && "translate-x-0",
            )}
            aria-hidden
          />
          <span className="relative z-10 flex min-w-0 flex-1 items-center gap-1.5">
            <TrackSm on={v} />
            <LabelText
              className={cn("min-w-0 flex-1 truncate", v ? "text-text" : "text-text-secondary")}
              title={label}
            >
              {label}
            </LabelText>
          </span>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative6({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-lg border border-zinc-200/80 bg-zinc-50/50 px-2.5 py-1.5 text-left text-xs text-text-secondary transition-all dark:border-zinc-600 dark:bg-zinc-800/20",
            v
              ? "translate-y-[-1px] border-zinc-200/90 bg-white text-text shadow-[0_4px_12px_rgba(21,118,187,0.12),0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-500/80 dark:bg-zinc-800/50 dark:shadow-[0_4px_14px_rgba(0,0,0,0.25)]"
              : "shadow-none",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="min-w-0 flex-1 truncate text-inherit" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative7({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,17rem)] items-center gap-1.5 border px-2.5 py-1.5 text-left text-xs transition-colors",
            "rounded-md border-zinc-200/90 bg-white dark:border-zinc-600 dark:bg-zinc-900/30",
            v
              ? "text-text [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(21,118,187,0.04)_3px,rgba(21,118,187,0.04)_4px),repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(21,118,187,0.04)_3px,rgba(21,118,187,0.04)_4px),linear-gradient(180deg,rgba(21,118,187,0.06),transparent)]"
              : "text-text-secondary",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="min-w-0 flex-1 truncate" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative8({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 border px-2.5 py-1.5 text-left text-xs transition-all",
            "rounded-tl-lg rounded-tr-md rounded-br-xl rounded-bl-md",
            "border-zinc-200/90 bg-white",
            "hover:brightness-[1.02] dark:border-zinc-600 dark:bg-zinc-900/30",
            v
              ? "border-[#1576BB]/45 bg-[#1576BB]/8 text-text ring-1 ring-[#1576BB]/15"
              : "text-text-secondary",
          )}
        >
          <TrackSm on={v} />
          <LabelText className="min-w-0 flex-1 truncate" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

function SampleCreative9({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <WholeSwitchButton
          on={v}
          onClick={() => onChange(!v)}
          className={cn(
            "group inline-flex max-w-[min(100%,16rem)] items-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-zinc-50/80 px-2.5 py-1.5 font-sans text-left text-xs",
            "dark:border-zinc-500 dark:bg-zinc-800/30",
            v
              ? "border-solid border-[#1576BB]/35 bg-white text-text dark:border-[#1576BB]/30 dark:bg-zinc-900/60"
              : "text-text-secondary",
          )}
        >
          <TrackSm on={v} />
          <span className="font-mono text-[10px] text-text-muted tabular-nums" aria-hidden>
            {v ? "1" : "0"}
          </span>
          <LabelText className="min-w-0 flex-1 truncate" title={label}>
            {label}
          </LabelText>
        </WholeSwitchButton>
      )}
    </MockTitleRow>
  );
}

/* —— 分离式对照：轨单独可点，文案在 label 外只随轨 —— 仍用两元素演示旧体验 —— */

function SampleSplitRef({ label, title, hint }: { label: string; title: string; hint: string }) {
  return (
    <MockTitleRow title={title} hint={hint}>
      {(v, onChange) => (
        <div className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-xs text-text-secondary">
          <button
            type="button"
            role="switch"
            aria-checked={v}
            aria-label={label}
            onClick={() => onChange(!v)}
            className={cn("shrink-0", FOCUS_SWITCH)}
          >
            <span className="relative flex h-5 w-9 items-center rounded-full p-px">
              <span
                className={cn(
                  "flex h-full w-full items-center rounded-full p-px",
                  v ? "bg-[#1576BB]" : "bg-zinc-300 dark:bg-zinc-600",
                )}
              >
                <span
                  className={cn(
                    "h-3.5 w-3.5 rounded-full bg-white",
                    v ? "ml-auto" : "ml-0",
                  )}
                />
              </span>
            </span>
          </button>
          <span className="min-w-0 text-text-secondary">{label}</span>
        </div>
      )}
    </MockTitleRow>
  );
}
