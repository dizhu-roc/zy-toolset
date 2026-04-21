import Image from "next/image";
import Link from "next/link";
import { brandLogoSrc, siteName } from "@/config/site";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  className?: string;
};

/** 顶栏品牌：使用 public 下 UUID 命名的 PNG（图内可含图标 + 字标） */
export function SiteLogo({ href, className }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center self-center no-underline outline-none transition-opacity hover:opacity-90",
        "focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
        className,
      )}
    >
      <Image
        src={brandLogoSrc}
        alt={siteName}
        width={640}
        height={160}
        priority
        className="h-8 w-auto max-h-8 max-w-[min(100%,12rem)] object-contain object-left"
        sizes="(max-width: 768px) 45vw, 192px"
      />
    </Link>
  );
}
