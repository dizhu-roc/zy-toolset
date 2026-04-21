import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-prose flex-col justify-center px-4 py-20">
      <h1 className="text-2xl font-semibold text-text">404</h1>
      <p className="mt-2 text-text-secondary leading-relaxed">
        This page does not exist, or the link is outdated.
      </p>
      <p className="mt-2 text-text-secondary leading-relaxed">
        页面不存在，或链接已失效。
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-surface-raised no-underline hover:bg-accent-hover"
      >
        Home / 首页
      </Link>
    </div>
  );
}
