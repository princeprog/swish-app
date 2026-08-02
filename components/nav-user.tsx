"use client"

import * as React from "react"
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { LogoutConfirmationDialog } from "@/components/auth/logout-confirmation-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useMeQuery } from "@/hooks/use-auth"
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react"

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export function NavUser() {
  const [logoutOpen, setLogoutOpen] = React.useState(false)
  const meQuery = useMeQuery()
  const user = meQuery.data?.user

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user?.name ?? user?.email ?? "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.name ?? "Signed in"}
                  </span>
                  <span className="truncate text-xs">
                    {user?.email ?? "Account"}
                  </span>
                </div>
                <ChevronsUpDownIcon className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              side="right"
              sideOffset={8}
            >
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => setLogoutOpen(true)}
                  variant="destructive"
                >
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <LogoutConfirmationDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
      />
    </>
  )
}
