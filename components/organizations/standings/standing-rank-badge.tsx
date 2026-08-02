import { cn } from "@/lib/utils"

const podiumRankStyles: Record<number, string> = {
  1: "border-amber-300/50 bg-amber-500/15 text-amber-200 shadow-[0_0_0_3px_rgba(245,158,11,0.08)]",
  2: "border-zinc-300/40 bg-zinc-400/15 text-zinc-100 shadow-[0_0_0_3px_rgba(212,212,216,0.08)]",
  3: "border-orange-300/45 bg-orange-500/15 text-orange-200 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]",
}

export function StandingRankBadge({ rank }: { rank: number }) {
  const isPodium = rank <= 3

  return (
    <span
      aria-label={`Rank ${rank}`}
      className={cn(
        "inline-flex items-center justify-center border font-semibold",
        isPodium
          ? "size-10 rounded-full text-base"
          : "size-8 rounded-md bg-background/70 text-sm text-muted-foreground",
        podiumRankStyles[rank],
      )}
    >
      {rank}
    </span>
  )
}
