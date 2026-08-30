"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import type { OrganizationAccess } from "@/services/organization.service";
import {
  Building2Icon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserRoundIcon,
  Users2Icon,
} from "lucide-react";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  organization?: {
    access?: OrganizationAccess;
    name: string;
    slug: string;
    status: string;
  };
};

export function AppSidebar({ organization, ...props }: AppSidebarProps) {
  const organizationsQuery = useOrganizationsQuery();
  const searchParams = useSearchParams();
  const workspaceBasePath = organization
    ? `/organizations/${organization.slug}`
    : "/organizations";
  const managerSeasonQuery = searchParams.get("seasonId")
    ? `?seasonId=${searchParams.get("seasonId")}`
    : "";

  const fallbackWorkspaceItems = organization
    ? [
        {
          name: organization.name,
          logo: <Building2Icon />,
          plan: organization.status,
          href: workspaceBasePath,
        },
      ]
    : [
        {
          name: "Organizations",
          logo: <Building2Icon />,
          plan: "Workspace list",
          href: "/organizations",
        },
      ];

  const workspaceItems = organizationsQuery.data?.length
    ? organizationsQuery.data.map((item) => ({
        name: item.name,
        logo: <Building2Icon />,
        plan: item.status,
        href: `/organizations/${item.slug}`,
      }))
    : fallbackWorkspaceItems;

  const permissions = organization?.access?.permissions ?? [];
  const isTeamManager = organization?.access?.role === "team_manager";
  const canManageCompetition = permissions.includes("schedule.manage");
  const canManagePeople =
    permissions.includes("teams.read") ||
    permissions.includes("teams.read.assigned");
  const canViewSchedules = permissions.includes("games.read.assigned");
  const canViewStandings =
    permissions.includes("standings.read") ||
    permissions.includes("standings.read.assigned_division");
  const canManageAccess = permissions.includes("members.manage");

  const managerNavMain = [
    {
      title: "My team",
      url: `${workspaceBasePath}/teams${managerSeasonQuery}`,
      icon: <Users2Icon />,
    },
    {
      title: "Players",
      url: `${workspaceBasePath}/players${managerSeasonQuery}`,
      icon: <UserRoundIcon />,
    },
    {
      title: "Schedule",
      url: `${workspaceBasePath}/schedules${managerSeasonQuery}`,
      icon: <CalendarDaysIcon />,
    },
    {
      title: "Standings",
      url: `${workspaceBasePath}/standings${managerSeasonQuery}`,
      icon: <TrophyIcon />,
    },
  ];

  const adminNavMain = [
    {
      title: "Overview",
      url: workspaceBasePath,
      icon: <TrophyIcon />,
      isActive: true,
      items: [
        {
          title: "Workspace",
          url: workspaceBasePath,
        },
      ],
    },
    canManageCompetition || canViewSchedules || canViewStandings
      ? {
          title: "Competition",
          url: workspaceBasePath,
          icon: <CalendarDaysIcon />,
          items: [
            ...(canManageCompetition
              ? [
                  {
                    title: "Seasons",
                    url: `${workspaceBasePath}/seasons`,
                  },
                  {
                    title: "Divisions",
                    url: `${workspaceBasePath}/divisions`,
                  },
                  {
                    title: "Format & playoffs",
                    url: `${workspaceBasePath}/competition`,
                  },
                ]
              : []),
            ...(canViewSchedules
              ? [
                  {
                    title: "Schedules",
                    url: `${workspaceBasePath}/schedules`,
                  },
                ]
              : []),
            ...(canViewStandings
              ? [
                  {
                    title: "Standings",
                    url: `${workspaceBasePath}/standings`,
                  },
                ]
              : []),
            ...(canManageCompetition
              ? [
                  {
                    title: "Venues",
                    url: `${workspaceBasePath}/venues`,
                  },
                ]
              : []),
          ],
        }
      : null,
    canManagePeople
      ? {
          title: "People",
          url: workspaceBasePath,
          icon: <Users2Icon />,
          items: [
            {
              title: "Teams",
              url: `${workspaceBasePath}/teams`,
            },
            {
              title: "Players",
              url: `${workspaceBasePath}/players`,
            },
          ],
        }
      : null,
    canManageAccess
      ? {
          title: "Access",
          url: workspaceBasePath,
          icon: <ShieldCheckIcon />,
          items: [
            {
              title: "Staff & access",
              url: `${workspaceBasePath}/members`,
            },
            {
              title: "Settings",
              url: workspaceBasePath,
            },
          ],
        }
      : null,
  ].filter((item) => item !== null);

  const navMain = isTeamManager ? managerNavMain : adminNavMain;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher activeHref={workspaceBasePath} teams={workspaceItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {organization ? (
          <div className="px-4 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <Link href="/organizations" className="hover:text-foreground">
              Switch organization
            </Link>
          </div>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex justify-end px-1 group-data-[collapsible=icon]:justify-center">
          <NotificationBell />
        </div>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
