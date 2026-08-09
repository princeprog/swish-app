import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type PageMotionVariant = "standard" | "subtle"

type PageEntranceProps = React.ComponentProps<"div"> & {
  asChild?: boolean
  variant?: PageMotionVariant
}

type StaggerRevealProps = React.ComponentProps<"div"> & {
  asChild?: boolean
}

export function PageEntrance({
  asChild = false,
  className,
  variant = "standard",
  ...props
}: PageEntranceProps) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-motion="page-entrance"
      data-motion-variant={variant}
      className={cn(
        "page-entrance",
        variant === "subtle" && "page-entrance-subtle",
        className,
      )}
      {...props}
    />
  )
}

export function StaggerReveal({
  asChild = false,
  className,
  ...props
}: StaggerRevealProps) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-motion="stagger-reveal"
      className={cn("stagger-reveal", className)}
      {...props}
    />
  )
}
