"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { IconCreditCard } from "@tabler/icons-react";

import { NavMain } from "@/components/dashboard/nav-main";
import { NavSecondary } from "@/components/dashboard/nav-secondary";
import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  navigationConfig,
  isNavItemActive,
  type NavItem,
} from "@/lib/navigation-config";

// Component props interface
interface ExpenseSidebarProps extends React.ComponentProps<typeof Sidebar> {
  className?: string;
}

export function ExpenseSidebar({ ...props }: ExpenseSidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Add active state to navigation items using helper function
  const navMainWithActive = navigationConfig.navMain.map((item) => ({
    ...item,
    isActive: isNavItemActive(item.url, pathname),
  }));

  const navSecondaryWithActive = navigationConfig.navSecondary.map((item) => ({
    ...item,
    isActive: isNavItemActive(item.url, pathname),
  }));

  // Prepare user data from session
  const userData = session?.user
    ? {
        name: session.user.name || "User",
        email: session.user.email || "",
        avatar: session.user.image || "/avatars/male-01.svg",
      }
    : {
        name: "Loading...",
        email: "",
        avatar: "/avatars/male-01.svg",
      };

  // Loading state
  if (status === "loading") {
    return (
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarContent>
          <div
            className="flex items-center justify-center p-4"
            role="status"
            aria-label="Loading navigation"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" aria-label="Go to dashboard home">
                <IconCreditCard className="!size-5" aria-hidden="true" />
                <span className="text-base font-semibold">SpendIQ</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Main navigation">
          <NavMain items={navMainWithActive} />
        </nav>
        <nav aria-label="Secondary navigation">
          <NavSecondary items={navSecondaryWithActive} className="mt-auto" />
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
