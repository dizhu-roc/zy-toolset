import type { Locale } from "./config";
import en from "@/messages/en.json";

export type Messages = typeof en;

export async function getMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case "zh":
      return (await import("@/messages/zh.json")).default;
    case "ja":
      return (await import("@/messages/ja.json")).default;
    case "es":
      return (await import("@/messages/es.json")).default;
    case "fr":
      return (await import("@/messages/fr.json")).default;
    case "en":
    default:
      return en;
  }
}
