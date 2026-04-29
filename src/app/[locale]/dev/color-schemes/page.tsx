import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ColorSchemePreviews } from "@/components/dev/color-scheme-previews";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return { title: "Color schemes", robots: { index: false, follow: false } };
  }
  const t = await getMessages(raw);
  return {
    title: `配色方案预览 · ${t.site.name}`,
    description: "内部参考：六套白色底方向示意（冷静蓝 / 松石绿 / 石墨灰 / 柔紫 / 琥珀 / 青蓝）。",
    robots: { index: false, follow: false },
  };
}

export default async function ColorSchemesDemoPage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-content px-4 py-2 sm:px-6">
      <ColorSchemePreviews />
    </div>
  );
}
