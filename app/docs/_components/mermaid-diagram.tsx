"use client"

import { useEffect, useId, useState } from "react"

export function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId()
  const id = `mermaid-${reactId.replace(/:/g, "")}`
  const [svg, setSvg] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default
        mermaid.initialize({
          securityLevel: "strict",
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            background: "transparent",
            fontFamily: "Inter, Arial, sans-serif",
            primaryColor: "#ffffff",
            primaryTextColor: "#111827",
            primaryBorderColor: "#d4d4d8",
            lineColor: "#71717a",
            secondaryColor: "#f4f4f5",
            tertiaryColor: "#fafafa",
          },
        })

        const result = await mermaid.render(id, chart)

        if (active) {
          setSvg(result.svg)
          setError(null)
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Diagram failed to render.")
        }
      }
    }

    void renderDiagram()

    return () => {
      active = false
    }
  }, [chart, id])

  if (error) {
    return (
      <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-4 text-xs leading-5 text-muted-foreground">
        {chart}
      </pre>
    )
  }

  return (
    <div className="min-h-48 overflow-auto rounded-md bg-muted/40 p-4">
      {svg ? (
        <div
          className="[&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-none"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground">
          Rendering diagram...
        </div>
      )}
    </div>
  )
}
