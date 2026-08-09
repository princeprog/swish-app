import Link from "next/link";
import {
  Building2Icon,
  ClipboardCheckIcon,
  MailIcon,
  UsersRoundIcon,
} from "lucide-react";

import { HeaderAccountMenu } from "@/components/auth/header-account-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { CreateOrganizationDialog } from "@/components/select-organization/create-organization-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function DirectoryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2Icon;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-5" />
      </span>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function OrganizationsAppHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm"
        >
          <span className="text-muted-foreground">Workspace</span>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <span>Organizations</span>
        </nav>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <HeaderAccountMenu />
        </div>
      </div>
    </header>
  );
}

export function OrganizationDirectoryOverview({
  activeCount,
  organizationCount,
  scorekeeperCount,
}: {
  activeCount: number;
  organizationCount: number;
  scorekeeperCount: number;
}) {
  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Organizations
          </h1>
          <p className="text-muted-foreground">
            Choose a workspace to manage leagues, teams, games, and staff
            access.
          </p>
        </div>
        <CreateOrganizationDialog />
      </section>

      <Card size="sm">
        <CardContent className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <DirectoryMetric
            icon={Building2Icon}
            label="organizations"
            value={organizationCount}
          />
          <Separator className="md:hidden" />
          <Separator orientation="vertical" className="hidden h-10 md:block" />
          <DirectoryMetric
            icon={UsersRoundIcon}
            label="active workspaces"
            value={activeCount}
          />
          <Separator className="md:hidden" />
          <Separator orientation="vertical" className="hidden h-10 md:block" />
          <DirectoryMetric
            icon={ClipboardCheckIcon}
            label="scorekeeper workspaces"
            value={scorekeeperCount}
          />
        </CardContent>
      </Card>
    </>
  );
}

export function OrganizationInvitationCard() {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md border">
            <MailIcon className="size-5" />
          </span>
          <div>
            <p className="font-medium">Have an invitation?</p>
            <p className="text-sm text-muted-foreground">
              Join another organization using your invitation link.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/invitations/accept">Accept invitation</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
