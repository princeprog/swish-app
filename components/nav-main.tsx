"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()
  const defaultOpenSections = React.useMemo(
    () =>
      items.reduce<Record<string, boolean>>((accumulator, item) => {
        const hasActiveChild = item.items?.some((subItem) => pathname === subItem.url)
        accumulator[item.title] = item.isActive || Boolean(hasActiveChild)
        return accumulator
      }, {}),
    [items, pathname],
  )
  const [sectionOverrides, setSectionOverrides] = React.useState<Record<string, boolean>>({})
  const openSections = React.useMemo(
    () => ({ ...defaultOpenSections, ...sectionOverrides }),
    [defaultOpenSections, sectionOverrides],
  )

  function toggleSection(title: string) {
    setSectionOverrides((current) => ({
      ...current,
      [title]: !(title in current ? current[title] : Boolean(defaultOpenSections[title])),
    }))
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            {item.items?.length ? (
              <>
                <SidebarMenuButton
                  aria-expanded={openSections[item.title]}
                  tooltip={item.title}
                  onClick={() => toggleSection(item.title)}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  <ChevronRightIcon
                    className={`ml-auto opacity-60 transition-transform duration-200 ease-out ${
                      openSections[item.title] ? "rotate-90" : ""
                    }`}
                  />
                </SidebarMenuButton>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                    openSections[item.title]
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-70"
                  }`}
                >
                  <div className="overflow-hidden">
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </div>
                </div>
              </>
            ) : (
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
