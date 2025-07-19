import {
  IconDashboard,
  IconReceipt,
  IconTags,
  IconWallet,
  IconChartBar,
  IconUsers,
  IconSettings,
  IconHelp,
} from "@tabler/icons-react";
import { type Icon } from "@tabler/icons-react";

export interface NavItem {
  title: string;
  url: string;
  icon: Icon;
  badge?: string | number;
  description?: string;
}

export const navigationConfig = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      description: "Overview of your expenses and budgets",
    },
    {
      title: "Expenses",
      url: "/dashboard/expenses",
      icon: IconReceipt,
      description: "Manage your expense records",
    },
    {
      title: "Categories",
      url: "/dashboard/categories",
      icon: IconTags,
      description: "Organize expenses by category",
    },
    {
      title: "Budgets",
      url: "/dashboard/budgets",
      icon: IconWallet,
      description: "Track your spending limits",
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: IconChartBar,
      description: "Insights and spending trends",
    },
    {
      title: "Teams",
      url: "/dashboard/teams",
      icon: IconUsers,
      description: "Collaborate with team members",
    },
  ] as NavItem[],
  navSecondary: [
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
    {
      title: "Help",
      url: "/dashboard/help",
      icon: IconHelp,
    },
  ] as NavItem[],
};

/**
 * Helper function to determine if a navigation item is active
 * @param itemUrl The URL of the navigation item
 * @param currentPath The current pathname
 * @returns Whether the navigation item should be marked as active
 */
export function isNavItemActive(itemUrl: string, currentPath: string): boolean {
  // Exact match for root paths
  if (itemUrl === "/" || itemUrl === "/dashboard") {
    return (
      currentPath === itemUrl ||
      (itemUrl === "/dashboard" && currentPath === "/")
    );
  }

  // For other paths, check if current path starts with the item URL
  return currentPath.startsWith(itemUrl);
}
