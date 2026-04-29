import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Albert_Sans,
  B612_Mono,
  Chivo_Mono,
  Cousine,
  DM_Mono,
  DM_Sans,
  Fira_Code,
  Fira_Mono,
  Fragment_Mono,
  IBM_Plex_Mono,
  Inconsolata,
  JetBrains_Mono,
  Manrope,
  Nova_Mono,
  Outfit,
  Overpass_Mono,
  Oxygen_Mono,
  Plus_Jakarta_Sans,
  Red_Hat_Mono,
  Roboto_Mono,
  Share_Tech_Mono,
  Source_Code_Pro,
  Space_Mono,
  Ubuntu_Mono,
  Work_Sans,
} from "next/font/google";
import type { FontCompareSpec } from "@/components/dev/font-compare-samples";
import { FontCompareSamples } from "@/components/dev/font-compare-samples";
import { getMessages } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";

type Props = { params: Promise<{ locale: string }> };

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const redHatMono = Red_Hat_Mono({
  subsets: ["latin"],
  display: "swap",
});

const inconsolata = Inconsolata({
  subsets: ["latin"],
  display: "swap",
});

const overpassMono = Overpass_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cousine = Cousine({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const oxygenMono = Oxygen_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const firaMono = Fira_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const b612Mono = B612_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const novaMono = Nova_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
});

const albertSans = Albert_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  display: "swap",
});

function buildSpecs(): FontCompareSpec[] {
  return [
    {
      id: "jetbrains-mono",
      role: "mono",
      name: "JetBrains Mono",
      blurb: "Clear punctuation; comfortable for long coding sessions and tool UI.",
      className: jetbrainsMono.className,
      cssFamily: "'JetBrains Mono', ui-monospace, monospace",
    },
    {
      id: "ibm-plex-mono",
      role: "mono",
      name: "IBM Plex Mono",
      blurb: "Neutral, slightly geometric; pairs well with UI sans-serif body text.",
      pairedFamilyNote: "Superfamily: IBM Plex Sans (UI) + IBM Plex Mono (code) on Google Fonts.",
      className: ibmPlexMono.className,
      cssFamily: "'IBM Plex Mono', ui-monospace, monospace",
    },
    {
      id: "source-code-pro",
      role: "mono",
      name: "Source Code Pro",
      blurb: "Adobe open source; a touch wide—Latin and numerals scan easily.",
      className: sourceCodePro.className,
      cssFamily: "'Source Code Pro', ui-monospace, monospace",
    },
    {
      id: "fira-code",
      role: "mono",
      name: "Fira Code",
      blurb: "Ligatures for operators—turn on font features in CSS if you use them.",
      className: firaCode.className,
      cssFamily: "'Fira Code', ui-monospace, monospace",
    },
    {
      id: "space-mono",
      role: "mono",
      name: "Space Mono",
      blurb: "Geometric and narrow; feels flat and bold in UI.",
      className: spaceMono.className,
      cssFamily: "'Space Mono', ui-monospace, monospace",
    },
    {
      id: "roboto-mono",
      role: "mono",
      name: "Roboto Mono",
      blurb: "Material Design; understated, matches Roboto for body copy.",
      pairedFamilyNote: "Superfamily: Roboto + Roboto Mono on Google Fonts.",
      className: robotoMono.className,
      cssFamily: "'Roboto Mono', ui-monospace, monospace",
    },
    {
      id: "dm-mono",
      role: "mono",
      name: "DM Mono",
      blurb: "Narrow width—fits more characters per line at the same size.",
      pairedFamilyNote: "Superfamily: DM Sans (UI) + DM Mono (code).",
      className: dmMono.className,
      cssFamily: "'DM Mono', ui-monospace, monospace",
    },
    {
      id: "red-hat-mono",
      role: "mono",
      name: "Red Hat Mono",
      blurb: "Aligned with Red Hat Text—good for docs and product copy.",
      className: redHatMono.className,
      cssFamily: "'Red Hat Mono', ui-monospace, monospace",
    },
    {
      id: "inconsolata",
      role: "mono",
      name: "Inconsolata",
      blurb: "Open counters and generous spacing—often feels lighter than dense “IDE” monos.",
      className: inconsolata.className,
      cssFamily: "'Inconsolata', ui-monospace, monospace",
    },
    {
      id: "overpass-mono",
      role: "mono",
      name: "Overpass Mono",
      blurb: "Wayfinding-inspired; wide apertures, less “heavy block” at the same pixel size.",
      className: overpassMono.className,
      cssFamily: "'Overpass Mono', ui-monospace, monospace",
    },
    {
      id: "cousine",
      role: "mono",
      name: "Cousine",
      blurb: "Metric cousin to Arial/Courier ideas but more open—readable without feeling thick.",
      className: cousine.className,
      cssFamily: "'Cousine', ui-monospace, monospace",
    },
    {
      id: "oxygen-mono",
      role: "mono",
      name: "Oxygen Mono",
      blurb: "Light editorial tone; thin strokes—UI can feel airy (pair with enough line-height).",
      className: oxygenMono.className,
      cssFamily: "'Oxygen Mono', ui-monospace, monospace",
    },
    {
      id: "ubuntu-mono",
      role: "mono",
      name: "Ubuntu Mono",
      blurb: "Humanist curves; rounder than geometric monos—often reads softer and less stern.",
      className: ubuntuMono.className,
      cssFamily: "'Ubuntu Mono', ui-monospace, monospace",
    },
    {
      id: "fira-mono",
      role: "mono",
      name: "Fira Mono",
      blurb: "Mozilla; no ligatures—often reads denser than Fira Code with the same pixel size.",
      className: firaMono.className,
      cssFamily: "'Fira Mono', ui-monospace, monospace",
    },
    {
      id: "b612-mono",
      role: "mono",
      name: "B612 Mono",
      blurb: "Aviation / DIN-inspired; tight vertical rhythm, good for dense dashboards.",
      className: b612Mono.className,
      cssFamily: "'B612 Mono', ui-monospace, monospace",
    },
    {
      id: "chivo-mono",
      role: "mono",
      name: "Chivo Mono",
      blurb: "Narrow-ish strokes and counters—fits more characters per line without shrinking px.",
      pairedFamilyNote: "Superfamily: Chivo (sans) + Chivo Mono on Google Fonts.",
      className: chivoMono.className,
      cssFamily: "'Chivo Mono', ui-monospace, monospace",
    },
    {
      id: "fragment-mono",
      role: "mono",
      name: "Fragment Mono",
      blurb: "Geometric, low-contrast bars; compact blocks of text look uniform and tight.",
      className: fragmentMono.className,
      cssFamily: "'Fragment Mono', ui-monospace, monospace",
    },
    {
      id: "nova-mono",
      role: "mono",
      name: "Nova Mono",
      blurb: "Single weight; very narrow advance—maximum glyphs per row (distinctive silhouette).",
      className: novaMono.className,
      cssFamily: "'Nova Mono', ui-monospace, monospace",
    },
    {
      id: "share-tech-mono",
      role: "mono",
      name: "Share Tech Mono",
      blurb: "Tech / signage vibe; narrow width, good for labels, tags, and tight toolbars.",
      className: shareTechMono.className,
      cssFamily: "'Share Tech Mono', ui-monospace, monospace",
    },
    {
      id: "dm-sans",
      role: "sans",
      name: "DM Sans",
      blurb: "Colophon geometric UI sans—common Graphik-like pick; roman 400–700 + italic on Google Fonts.",
      pairedFamilyNote: "Pair with DM Mono for code in the same product.",
      className: dmSans.className,
      cssFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
    },
    {
      id: "plus-jakarta-sans",
      role: "sans",
      name: "Plus Jakarta Sans",
      blurb: "Modern product / marketing UI; full weight + italic range.",
      className: plusJakartaSans.className,
      cssFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
    },
    {
      id: "manrope",
      role: "sans",
      name: "Manrope",
      blurb: "Rounded geometric sans; good for dashboards and cards.",
      pairedFamilyNote:
        "Google Fonts serves roman only—italic line below uses browser oblique, not a separate italic file.",
      className: manrope.className,
      cssFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif",
    },
    {
      id: "albert-sans",
      role: "sans",
      name: "Albert Sans",
      blurb: "Neutral grotesk for forms and dense app chrome.",
      className: albertSans.className,
      cssFamily: "'Albert Sans', ui-sans-serif, system-ui, sans-serif",
    },
    {
      id: "work-sans",
      role: "sans",
      name: "Work Sans",
      blurb: "Grotesk workhorse; many weights for hierarchy (subset here: 400–700 + italic).",
      className: workSans.className,
      cssFamily: "'Work Sans', ui-sans-serif, system-ui, sans-serif",
    },
    {
      id: "outfit",
      role: "sans",
      name: "Outfit",
      blurb: "Geometric, slightly display-leaning; strong for landing pages + UI.",
      pairedFamilyNote:
        "Google Fonts serves roman only—italic preview is synthesized oblique, not a true italic cut.",
      className: outfit.className,
      cssFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif",
    },
  ];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    return { title: "Fonts", robots: { index: false, follow: false } };
  }
  const t = await getMessages(raw);
  return {
    title: `Font compare · ${t.site.name}`,
    description:
      "Dev reference: monospace UI faces plus Graphik-like sans (weights + italic) from Google Fonts.",
    robots: { index: false, follow: false },
  };
}

export default async function FontComparePage({ params }: Props) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) {
    notFound();
  }
  const fonts = buildSpecs();

  return (
    <div className="mx-auto w-full max-w-content px-4 py-2 sm:px-6">
      <FontCompareSamples fonts={fonts} />
    </div>
  );
}
