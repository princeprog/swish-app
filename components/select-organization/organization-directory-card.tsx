"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CopyIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { toast } from "sonner";

import { getOrganizationRoleDetails } from "@/lib/organization-directory";
import { getOrganizationLandingPath } from "@/lib/organization-routing";
import type { Organization } from "@/services/organization.service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

function getOrganizationInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function OrganizationDirectoryCard({
  organization,
}: {
  organization: Organization;
}) {
  const roleDetails = getOrganizationRoleDetails(organization.access.role);
  const landingPath = getOrganizationLandingPath(organization);

  async function copySlug() {
    try {
      await navigator.clipboard.writeText(organization.slug);
      toast.success("Organization slug copied");
    } catch {
      toast.error("Could not copy the organization slug");
    }
  }

  return (
    <Card size="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar size="lg" className="shrink-0 rounded-md">
              <AvatarFallback className="rounded-md">
                {getOrganizationInitials(organization.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle className="truncate">{organization.name}</CardTitle>
              <CardDescription>{organization.slug}</CardDescription>
              <div>
                <Badge variant="outline">{roleDetails.badgeLabel}</Badge>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary">
              <CheckCircle2Icon data-icon="inline-start" />
              {organization.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${organization.name}`}
                >
                  <EllipsisVerticalIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href={landingPath}>
                      <ExternalLinkIcon />
                      Open workspace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={copySlug}>
                    <CopyIcon />
                    Copy slug
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Alert>
          <ShieldCheckIcon />
          <AlertDescription>{roleDetails.workspaceLabel}</AlertDescription>
        </Alert>

        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
          <div className="flex items-center gap-3 pr-3">
            <KeyRoundIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium">
                {organization.access.permissions.length}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                permissions
              </p>
            </div>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="flex items-center gap-3 px-3">
            <ShieldCheckIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium">{roleDetails.badgeLabel}</p>
              <p className="truncate text-xs text-muted-foreground">role</p>
            </div>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="flex items-center gap-3 pl-3">
            <CalendarClockIcon className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate font-medium">
                {formatUpdatedAt(organization.updated_at)}
              </p>
              <p className="truncate text-xs text-muted-foreground">updated</p>
            </div>
          </div>
        </div>
      </CardContent>

      <Separator />

      <CardFooter className="justify-between gap-4 pt-4">
        <p className="truncate text-sm text-muted-foreground">
          swish.app/{organization.slug}
        </p>
        <Button asChild variant="outline">
          <Link href={landingPath}>
            {roleDetails.actionLabel}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
