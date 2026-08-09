"use client"

import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type PresenceRevealState = "enter" | "exit" | "visible"
type PresenceRevealVariant = "standard" | "subtle"

type PresenceRevealProps = React.ComponentProps<"div"> & {
  animateOnMount?: boolean
  asChild?: boolean
  collapse?: boolean
  present: boolean
  variant?: PresenceRevealVariant
}

export function PresenceReveal({
  animateOnMount = true,
  asChild = false,
  className,
  collapse = false,
  onAnimationEnd,
  present,
  variant = "standard",
  ...props
}: PresenceRevealProps) {
  const skipInitialAnimation = React.useRef(!animateOnMount && present)
  const [isMounted, setIsMounted] = React.useState(present)
  const [motionState, setMotionState] = React.useState<PresenceRevealState>(
    present && !skipInitialAnimation.current ? "enter" : "visible",
  )
  const [reducedMotion, setReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches)

    updateReducedMotion()
    mediaQuery.addEventListener("change", updateReducedMotion)

    return () => mediaQuery.removeEventListener("change", updateReducedMotion)
  }, [])

  React.useEffect(() => {
    if (present) {
      setIsMounted(true)

      if (skipInitialAnimation.current) {
        skipInitialAnimation.current = false
        setMotionState("visible")
      } else {
        setMotionState("enter")
      }

      return
    }

    if (reducedMotion) {
      setIsMounted(false)
      return
    }

    if (isMounted) {
      setMotionState("exit")
      const exitDuration = variant === "subtle" ? 180 : 260
      const timeoutId = window.setTimeout(() => setIsMounted(false), exitDuration)

      return () => window.clearTimeout(timeoutId)
    }
  }, [isMounted, present, reducedMotion, variant])

  if (!isMounted) return null

  const Comp = asChild ? Slot.Root : "div"

  function handleAnimationEnd(event: React.AnimationEvent<HTMLDivElement>) {
    onAnimationEnd?.(event)
  }

  return (
    <Comp
      {...props}
      aria-hidden={motionState === "exit" ? true : props["aria-hidden"]}
      data-motion="presence-reveal"
      data-motion-collapse={collapse ? "true" : undefined}
      data-motion-state={motionState}
      data-motion-variant={variant}
      className={cn(
        "presence-reveal",
        variant === "subtle" && "presence-reveal-subtle",
        className,
      )}
      onAnimationEnd={handleAnimationEnd}
    />
  )
}
