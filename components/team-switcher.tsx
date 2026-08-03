"use client"
import * as React from "react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

export const VISIBLE_ORGANIZATION_LIMIT = 3

type TeamSwitcherItem = {
  name: string
  logo: React.ReactNode
  plan: string
  href?: string
}

export function TeamSwitcher({
  activeHref,
  teams,
}: {
  activeHref?: string
  teams: TeamSwitcherItem[]
}) {
  const activeTeam =
    teams.find((team) => team.href === activeHref) ?? teams[0]
  const visibleTeams = teams.slice(0, VISIBLE_ORGANIZATION_LIMIT)
  const hasMoreTeams = teams.length > VISIBLE_ORGANIZATION_LIMIT

  if (!activeTeam) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              {activeTeam.logo}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs">{activeTeam.plan}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto" />
          </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64"
            side="bottom"
            sideOffset={8}
          >
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>
            <DropdownMenuGroup>
              {visibleTeams.map((team) => (
                <DropdownMenuItem key={team.href ?? team.name} asChild>
                  <Link
                    href={team.href ?? "/organizations"}
                    className="flex items-center gap-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      {team.logo}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate">{team.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {team.plan}
                      </span>
                    </div>
                    {team.href === activeHref ? (
                      <CheckIcon className="ml-auto size-4" />
                    ) : null}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {hasMoreTeams ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/organizations">Show organizations</Link>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
