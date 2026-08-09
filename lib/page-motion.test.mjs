import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const motionSource = readFileSync(
  new URL("../components/motion/page-motion.tsx", import.meta.url),
  "utf8",
)
const motionCss = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
)

test("exposes explicit component reveal primitives", () => {
  assert.match(motionSource, /export function ComponentReveal/)
  assert.match(motionSource, /export function RevealGroup/)
  assert.match(motionSource, /data-motion=\"component-reveal\"/)
  assert.match(motionSource, /data-motion=\"reveal-group\"/)
  assert.match(motionSource, /data-motion-trigger/)
  assert.match(motionSource, /data-motion-pace/)
})

test("uses the balanced page and component motion timings", () => {
  assert.match(
    motionCss,
    /swish-page-entrance 280ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
  )
  assert.match(motionCss, /translate3d\(0, 12px, 0\)/)
  assert.match(
    motionCss,
    /swish-component-reveal 220ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
  )
  assert.match(motionCss, /translate3d\(0, 8px, 0\)/)
  assert.match(motionCss, /\.component-reveal-subtle[\s\S]*animation-duration: 160ms/)
  assert.match(motionCss, /\.component-reveal-subtle[\s\S]*animation-timing-function: cubic-bezier\(0\.33, 1, 0\.68, 1\)/)
})

test("caps standard and compact reveal groups after six items", () => {
  assert.match(motionCss, /45ms/)
  assert.match(motionCss, /25ms/)
  assert.match(motionCss, /:nth-child\(n \+ 6\)/)
  assert.match(motionCss, /reveal-group-compact/)
})

test("replays active component reveals without adding exit motion", () => {
  assert.match(
    motionCss,
    /component-reveal\[data-motion-trigger=\"active\"\]\[data-state=\"active\"\]/,
  )
  assert.match(motionCss, /prefers-reduced-motion: reduce/)
  assert.match(motionCss, /component-reveal/)
  assert.match(motionCss, /reveal-group/)
  assert.doesNotMatch(motionCss, /swish-component-exit/)
})
