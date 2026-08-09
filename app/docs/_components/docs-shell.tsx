import Link from "next/link";
import type { ReactNode } from "react";

import { PageEntrance, StaggerReveal } from "@/components/motion/page-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { docNavItems } from "@/lib/project-docs";

export function DocsShell({
  children,
  eyebrow,
  title,
  summary,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <Link href="/docs" className="block text-lg font-semibold">
            Swish League OS
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">
            Planning docs for the basketball league operating system.
          </p>
          <nav className="mt-6 flex flex-col gap-2">
            {docNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md border border-transparent px-3 py-2 text-sm transition-colors hover:border-border hover:bg-muted"
              >
                <span className="font-medium">{item.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {item.description}
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <PageEntrance asChild>
          <section className="flex min-w-0 flex-col gap-8">
            <header className="flex flex-col gap-4 py-2">
              <Badge variant="secondary" className="w-fit">
                {eyebrow}
              </Badge>
              <div className="flex max-w-4xl flex-col gap-3">
                <h1 className="text-3xl font-semibold tracking-normal text-balance md:text-5xl">
                  {title}
                </h1>
                <p className="text-base leading-7 text-muted-foreground md:text-lg">
                  {summary}
                </p>
              </div>
            </header>
            <Separator />
            <StaggerReveal className="contents">{children}</StaggerReveal>
            <Card>
              <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Planning rule</p>
                <p>
                  This documentation defines the target product before app
                  implementation. Backend services, database details, and final
                  stack choices should be planned in their own repos or
                  milestone plans when the product shape is approved.
                </p>
              </CardContent>
            </Card>
          </section>
        </PageEntrance>
      </div>
    </main>
  );
}
