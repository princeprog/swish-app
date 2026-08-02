"use client";

import * as React from "react";
import { LogOutIcon, UserCircleIcon } from "lucide-react";

import { LogoutConfirmationDialog } from "@/components/auth/logout-confirmation-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMeQuery } from "@/hooks/use-auth";

function getInitials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function HeaderAccountMenu() {
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const meQuery = useMeQuery();
  const user = meQuery.data?.user;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Open account menu" variant="outline" size="icon">
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
              <UserCircleIcon />
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

      <LogoutConfirmationDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
      />
    </>
  );
}
