"use client"

import Link from "next/link"
import { Globe, Plus, UserPlus } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function WorkspaceHeader({
  primaryAction,
  organizationName,
  organizationSlug,
  pageTitle,
}: {
  organizationName: string
  organizationSlug: string
  pageTitle?: string
  primaryAction?: {
    disabled?: boolean
    href?: string
    label: string
    onClick?: () => void
  }
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-1 hidden h-4 sm:block"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/organizations">Organizations</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              {pageTitle ? (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link href={`/organizations/${organizationSlug}`}>
                        {organizationName}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage>{organizationName}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {primaryAction?.href ? (
            <Button disabled={primaryAction.disabled} size="sm" asChild>
              <Link href={primaryAction.href}>
                <Plus className="size-4" />
                {primaryAction.label}
              </Link>
            </Button>
          ) : primaryAction ? (
            <Button
              disabled={primaryAction.disabled}
              size="sm"
              onClick={primaryAction.onClick}
            >
              <Plus className="size-4" />
              {primaryAction.label}
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href={`/organizations/${organizationSlug}/seasons`}>
                <Plus className="size-4" />
                New season
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline">
            <UserPlus className="size-4" />
            Invite staff
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/docs">
              <Globe className="size-4" />
              Open public page
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
