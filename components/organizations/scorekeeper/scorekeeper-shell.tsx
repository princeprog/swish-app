"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  Building2,
  Check,
  ChevronDown,
  LogOut,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  getApiErrorMessage,
  useLogoutMutation,
  useMeQuery,
} from "@/hooks/use-auth";
import { getOrganizationLandingPath } from "@/lib/organization-routing";
import type { Organization } from "@/services/organization.service";

type ScorekeeperShellProps = {
  children: ReactNode;
  organization: Organization;
  organizations: Organization[];
};

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ScorekeeperShell({
  children,
  organization,
  organizations,
}: ScorekeeperShellProps) {
  const router = useRouter();
  const meQuery = useMeQuery();
  const logoutMutation = useLogoutMutation();
  const user = meQuery.data?.user;

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync();
      router.push("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  aria-label="Open account menu"
                  variant="outline"
                  size="icon"
                >
                  <Avatar className="size-7">
                    <AvatarFallback>
                      {getInitials(user?.name ?? user?.email ?? "User")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex min-w-0 items-center gap-2">
                    <UserCircle className="size-4" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {user?.name ?? "Signed in"}
                      </p>
                      <p className="truncate text-xs font-normal">
                        {user?.email ?? "Account"}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={logoutMutation.isPending}
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
