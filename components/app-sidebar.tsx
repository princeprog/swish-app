"use client"

import * as React from "react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Building2Icon, CalendarDaysIcon, MapPinIcon, Settings2Icon, ShieldCheckIcon, TrophyIcon, Users2Icon } from "lucide-react"

const baseData = {
  user: {
    name: "Swish Admin",
    email: "admin@swish.local",
    avatar: "",
  },
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  organization?: {
    name: string
    slug: string
    status: string
  }
}

export function AppSidebar({
  organization,
  ...props
}: AppSidebarProps) {
  const workspaceBasePath = organization
    ? `/organizations/${organization.slug}`
    : "/organizations"

  const workspaceItems = organization
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
      ]

  const navMain = [
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
    {
      title: "Competition",
      url: workspaceBasePath,
      icon: <CalendarDaysIcon />,
      items: [
        {
          title: "Seasons",
          url: `${workspaceBasePath}/seasons`,
        },
        {
          title: "Divisions",
          url: `${workspaceBasePath}/divisions`,
        },
        {
          title: "Schedules",
          url: `${workspaceBasePath}/schedules`,
        },
        {
          title: "Standings",
          url: `${workspaceBasePath}/standings`,
        },
        {
          title: "Venues",
          url: `${workspaceBasePath}/venues`,
        },
      ],
    },
    {
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
    },
    {
      title: "Access",
      url: workspaceBasePath,
      icon: <ShieldCheckIcon />,
      items: [
        {
          title: "Roles",
          url: workspaceBasePath,
        },
        {
          title: "Settings",
          url: workspaceBasePath,
        },
      ],
    },
  ]

  const quickLinks = organization
    ? [
        {
          name: "Open docs",
          url: "/docs",
          icon: <Settings2Icon />,
        },
        {
          name: "All organizations",
          url: "/organizations",
          icon: <Building2Icon />,
        },
      ]
    : [
        {
          name: "Planning docs",
          url: "/docs",
          icon: <Settings2Icon />,
        },
      ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={workspaceItems} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={quickLinks} />
        {organization ? (
          <div className="px-4 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <Link href="/organizations" className="hover:text-foreground">
              Switch organization
            </Link>
          </div>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={baseData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
