"use client";

// Non-intrusive AdSense placeholder. Renders a labeled reserved space so
// layout never shifts (CLS-safe). Wire `data-ad-slot` per placement.
import { cn } from "@/lib/cn";

type Placement = "top" | "mid" | "bottom";

const SIZES: Record<Placement, string> = {
  top: "h-[90px] md:h-[90px]",
  mid: "h-[250px] md:h-[100px]",
  bottom: "h-[90px]",
};

export function AdSlot({ placement, className }: { placement: Placement; className?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <aside
      aria-label="advertisement"
      className={cn(
        "flex w-full items-center justify-center overflow-hidden rounded-xl border border-white/5",
        "bg-ink-800/40 text-[11px] uppercase tracking-[0.2em] text-white/25",
        SIZES[placement],
        className,
      )}
    >
      {/* In production, mount <ins class="adsbygoogle" …/> here and push. */}
      <span>{client ? `Ad · ${placement}` : "Ad space"}</span>
    </aside>
  );
}
