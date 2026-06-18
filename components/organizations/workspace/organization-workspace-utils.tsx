export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ")
}

export function statusClasses(tone: "complete" | "progress" | "live") {
  if (tone === "complete" || tone === "live") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-300"
}
