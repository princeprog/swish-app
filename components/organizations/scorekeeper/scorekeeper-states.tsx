"use client";

import Link from "next/link";
import { AlertCircle, CalendarOff, Lock, SearchX } from "lucide-react";

import {
  ComponentReveal,
  PageEntrance,
} from "@/components/motion/page-motion";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiRequestError } from "@/services/api.service";

type FocusedStateProps = {
  actionHref?: string;
  actionLabel?: string;
  description: string;
  icon?: "calendar" | "error" | "lock" | "not-found";
  onRetry?: () => void;
  title: string;
};

function StateIcon({ icon }: { icon: FocusedStateProps["icon"] }) {
  if (icon === "lock") {
    return <Lock className="size-5" />;
  }

  if (icon === "not-found") {
    return <SearchX className="size-5" />;
  }

  if (icon === "error") {
    return <AlertCircle className="size-5" />;
  }

  return <CalendarOff className="size-5" />;
}

export function ScorekeeperFocusedState({
  actionHref,
  actionLabel,
  description,
  icon = "calendar",
  onRetry,
  title,
}: FocusedStateProps) {
  return (
    <ComponentReveal variant="subtle">
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <StateIcon icon={icon} />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {onRetry || actionHref ? (
          <EmptyContent>
            {onRetry ? (
              <Button onClick={onRetry}>Try again</Button>
            ) : actionHref && actionLabel ? (
              <Button asChild>
                <Link href={actionHref}>{actionLabel}</Link>
              </Button>
            ) : null}
          </EmptyContent>
        ) : null}
      </Empty>
    </ComponentReveal>
  );
}

export function ScorekeeperLoadingState() {
  return (
    <PageEntrance asChild variant="subtle">
      <main className="min-h-screen bg-background text-foreground">
        <ComponentReveal asChild variant="subtle">
          <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-32" />
            </div>
            <Skeleton className="h-24 rounded-lg" />
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-36 rounded-lg" />
              ))}
            </div>
          </div>
        </ComponentReveal>
      </main>
    </PageEntrance>
  );
}

export function getScorekeeperErrorState(error: unknown) {
  if (error instanceof ApiRequestError && error.status === 403) {
    return {
      description:
        "Your staff access is suspended or missing permission for this organization.",
      icon: "lock" as const,
      title: "Access is not available",
    };
  }

  if (error instanceof ApiRequestError && error.status === 404) {
    return {
      description:
        "This game is outside your assigned schedule or belongs to another organization.",
      icon: "not-found" as const,
      title: "Game not found",
    };
  }

  return {
    description: "The schedule could not be loaded. Please try again.",
    icon: "error" as const,
    title: "We couldn't load assigned games",
  };
}
