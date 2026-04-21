import { cn } from "@/lib/utils";

const s = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export type HomeToolIconId =
  | "base64Text"
  | "base64File"
  | "passwordGenerator"
  | "icoGenerator"
  | "imageCompressor"
  | "imageCropper"
  | "imageResizer";

export function HomeToolIcon({
  id,
  className,
}: {
  id: HomeToolIconId;
  className?: string;
}) {
  return (
    <svg
      className={cn("size-9 shrink-0", className)}
      viewBox="0 0 24 24"
      aria-hidden
    >
      {id === "base64Text" ? (
        <>
          <path
            {...s}
            d="M6 4h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
          />
          <path {...s} d="M8 9h8M8 12h8M8 15h5" />
        </>
      ) : null}
      {id === "base64File" ? (
        <path
          {...s}
          d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6"
        />
      ) : null}
      {id === "passwordGenerator" ? (
        <>
          <path {...s} d="M7 11V8a5 5 0 0 1 10 0v3" />
          <rect {...s} x="5" y="11" width="14" height="10" rx="2" />
          <path {...s} d="M12 15v2" />
        </>
      ) : null}
      {id === "icoGenerator" ? (
        <>
          <rect {...s} x="2" y="4" width="10" height="10" rx="1" />
          <rect {...s} x="12" y="10" width="10" height="10" rx="1" />
        </>
      ) : null}
      {id === "imageCompressor" ? (
        <>
          <rect {...s} x="3" y="5" width="18" height="12" rx="2" />
          <path {...s} d="M7 15h10M12 10v8" />
          <path {...s} d="m10 13 2-2 2 2" />
        </>
      ) : null}
      {id === "imageCropper" ? (
        <>
          <path
            {...s}
            d="M6 3v3M3 6h3M18 3v3M21 6h-3M6 21v-3M3 18h3M18 21v-3M21 18h-3"
          />
          <rect {...s} x="8" y="8" width="8" height="8" rx="1" />
        </>
      ) : null}
      {id === "imageResizer" ? (
        <>
          <path {...s} d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          <rect {...s} x="7" y="7" width="10" height="10" rx="1" />
        </>
      ) : null}
    </svg>
  );
}
