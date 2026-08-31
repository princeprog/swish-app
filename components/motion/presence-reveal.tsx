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

function subscribeToReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined

  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
  mediaQuery.addEventListener("change", onStoreChange)
  return () => mediaQuery.removeEventListener("change", onStoreChange)
}

function getReducedMotionSnapshot() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function getServerReducedMotionSnapshot() {
  return false
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
    present && animateOnMount ? "enter" : "visible",
  )
  const reducedMotion = React.useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  )

  React.useEffect(() => {
    if (present) {
      const frameId = window.requestAnimationFrame(() => setIsMounted(true))

      if (skipInitialAnimation.current) {
        skipInitialAnimation.current = false
        setMotionState("visible")
      } else {
        setMotionState("enter")
      }

      return () => window.cancelAnimationFrame(frameId)
    }

    if (reducedMotion) {
      return
    }

    if (isMounted) {
      const exitDuration = variant === "subtle" ? 180 : 260
      const frameId = window.requestAnimationFrame(() =>
        setMotionState("exit"),
      )
      const timeoutId = window.setTimeout(() => setIsMounted(false), exitDuration)

      return () => {
        window.cancelAnimationFrame(frameId)
        window.clearTimeout(timeoutId)
      }
    }
  }, [isMounted, present, reducedMotion, variant])

  if (!present && (reducedMotion || !isMounted)) return null

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
