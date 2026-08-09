"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Trophy } from "lucide-react";

import { PageEntrance, StaggerReveal } from "@/components/motion/page-motion";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function AuthShell({ children, description, title }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
        <section className="hidden border-r bg-muted/30 lg:flex">
          <div className="flex h-full w-full flex-col justify-between p-8 xl:p-10">
            <Link
              href="/docs"
              className="inline-flex items-center gap-3 text-sm font-medium text-foreground"
            >
              <span className="flex size-11 items-center justify-center rounded-full border bg-background shadow-xs">
                <Trophy className="size-4" />
              </span>
              <span>Swish League OS</span>
            </Link>

            <div className="max-w-md space-y-4 pb-6">
              <h2 className="text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
                Run leagues with a cleaner official record.
              </h2>
              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                Public pages, rosters, scoring workflows, and league setup all
                stay in one operating system.
              </p>
            </div>
          </div>
        </section>

        <PageEntrance asChild>
          <section className="flex min-h-screen bg-background">
            <div className="flex w-full flex-col px-6 py-6 sm:px-8 lg:px-10">
              <div className="flex flex-1 items-center justify-center py-10">
                <StaggerReveal asChild>
                  <div className="w-full max-w-md space-y-8">
                    <div className="space-y-3">
                      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                        {title}
                      </h1>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {description}
                      </p>
                    </div>

                    <div className="space-y-6">{children}</div>
                  </div>
                </StaggerReveal>
              </div>
            </div>
          </section>
        </PageEntrance>
      </div>
    </main>
  );
}
