import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type PageMotionVariant = "standard" | "subtle"
type ComponentRevealTrigger = "mount" | "active"
type RevealGroupPace = "standard" | "compact"
type RevealGroupPhase = "primary" | "secondary" | "tertiary"

type PageEntranceProps = React.ComponentProps<"div"> & {
  asChild?: boolean
  variant?: PageMotionVariant
}

type ComponentRevealProps = React.ComponentProps<"div"> & {
  asChild?: boolean
  variant?: PageMotionVariant
  trigger?: ComponentRevealTrigger
}

type RevealGroupProps = React.ComponentProps<"div"> & {
  asChild?: boolean
  pace?: RevealGroupPace
  phase?: RevealGroupPhase
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
      data-motion="reveal-group"
      data-motion-pace="standard"
      className={cn("reveal-group", className)}
      {...props}
    />
  )
}

export function ComponentReveal({
  asChild = false,
  className,
  trigger = "mount",
  variant = "standard",
  ...props
}: ComponentRevealProps) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      {...props}
      data-motion="component-reveal"
      data-motion-trigger={trigger}
      data-motion-variant={variant}
      className={cn(
        "component-reveal",
        variant === "subtle" && "component-reveal-subtle",
        className,
      )}
    />
  )
}

export function RevealGroup({
  asChild = false,
  className,
  pace = "standard",
  phase = "primary",
  ...props
}: RevealGroupProps) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      {...props}
      data-motion="reveal-group"
      data-motion-pace={pace}
      data-motion-phase={phase}
      className={cn(
        "reveal-group",
        pace === "compact" && "reveal-group-compact",
        className,
      )}
    />
  )
}
