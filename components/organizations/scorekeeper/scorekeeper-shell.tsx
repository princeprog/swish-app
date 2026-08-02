"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  Building2,
  Check,
  ChevronDown,
} from "lucide-react";

import { HeaderAccountMenu } from "@/components/auth/header-account-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getOrganizationLandingPath } from "@/lib/organization-routing";
import type { Organization } from "@/services/organization.service";

type ScorekeeperShellProps = {
  children: ReactNode;
  organization: Organization;
  organizations: Organization[];
};

export function ScorekeeperShell({
  children,
  organization,
  organizations,
}: ScorekeeperShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
              <Building2 className="size-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  {organization.name}
                </h1>
                <Badge variant="secondary">Scorekeeper</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Assigned game schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowLeftRight className="size-4" />
                  <span className="hidden sm:inline">Switch</span>
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                {organizations.map((item) => (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link
                      className="flex w-full items-center gap-2"
                      href={getOrganizationLandingPath(item)}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.access.role.replace("_", " ")}
                      </span>
                      {item.id === organization.id ? (
                        <Check className="size-4" />
                      ) : null}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/organizations">All organizations</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
            <HeaderAccountMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
