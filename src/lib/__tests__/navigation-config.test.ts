import { describe, it, expect } from "vitest";
import {
  navigationConfig,
  getNavItemByUrl,
  isNavItemActive,
  type NavItem,
} from "../navigation-config";

describe("Navigation Configuration", () => {
  describe("navigationConfig", () => {
    it("should have main navigation items", () => {
      expect(navigationConfig.navMain).toBeDefined();
      expect(navigationConfig.navMain.length).toBeGreaterThan(0);
    });

    it("should have secondary navigation items", () => {
      expect(navigationConfig.navSecondary).toBeDefined();
      expect(navigationConfig.navSecondary.length).toBeGreaterThan(0);
    });

    it("should have all required properties for main nav items", () => {
      navigationConfig.navMain.forEach((item) => {
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("url");
        expect(item).toHaveProperty("icon");
        expect(item).toHaveProperty("description");
        expect(typeof item.title).toBe("string");
        expect(typeof item.url).toBe("string");
        expect(typeof item.icon).toBe("function");
        expect(typeof item.description).toBe("string");
      });
    });

    it("should have all required properties for secondary nav items", () => {
      navigationConfig.navSecondary.forEach((item) => {
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("url");
        expect(item).toHaveProperty("icon");
        expect(item).toHaveProperty("description");
        expect(typeof item.title).toBe("string");
        expect(typeof item.url).toBe("string");
        expect(typeof item.icon).toBe("function");
        expect(typeof item.description).toBe("string");
      });
    });

    it("should have unique URLs across all navigation items", () => {
      const allItems = [
        ...navigationConfig.navMain,
        ...navigationConfig.navSecondary,
      ];
      const urls = allItems.map((item) => item.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
    });

    it("should have expected main navigation items", () => {
      const expectedItems = [
        "Dashboard",
        "Expenses",
        "Categories",
        "Budgets",
        "Analytics",
        "Teams",
      ];
      const actualItems = navigationConfig.navMain.map((item) => item.title);
      expect(actualItems).toEqual(expectedItems);
    });

    it("should have expected secondary navigation items", () => {
      const expectedItems = ["Settings", "Help"];
      const actualItems = navigationConfig.navSecondary.map(
        (item) => item.title
      );
      expect(actualItems).toEqual(expectedItems);
    });

    it("should have URLs starting with forward slash", () => {
      const allItems = [
        ...navigationConfig.navMain,
        ...navigationConfig.navSecondary,
      ];
      allItems.forEach((item) => {
        expect(item.url).toMatch(/^\/[a-z-]+$/);
      });
    });
  });

  describe("getNavItemByUrl", () => {
    it("should return correct nav item for existing URL", () => {
      const dashboardItem = getNavItemByUrl("/dashboard");
      expect(dashboardItem).toBeDefined();
      expect(dashboardItem?.title).toBe("Dashboard");
      expect(dashboardItem?.url).toBe("/dashboard");
    });

    it("should return correct nav item for secondary navigation URL", () => {
      const settingsItem = getNavItemByUrl("/settings");
      expect(settingsItem).toBeDefined();
      expect(settingsItem?.title).toBe("Settings");
      expect(settingsItem?.url).toBe("/settings");
    });

    it("should return undefined for non-existing URL", () => {
      const nonExistentItem = getNavItemByUrl("/non-existent");
      expect(nonExistentItem).toBeUndefined();
    });

    it("should return undefined for empty URL", () => {
      const emptyItem = getNavItemByUrl("");
      expect(emptyItem).toBeUndefined();
    });

    it("should return undefined for root URL", () => {
      const rootItem = getNavItemByUrl("/");
      expect(rootItem).toBeUndefined();
    });

    it("should find all main navigation items", () => {
      navigationConfig.navMain.forEach((expectedItem) => {
        const foundItem = getNavItemByUrl(expectedItem.url);
        expect(foundItem).toEqual(expectedItem);
      });
    });

    it("should find all secondary navigation items", () => {
      navigationConfig.navSecondary.forEach((expectedItem) => {
        const foundItem = getNavItemByUrl(expectedItem.url);
        expect(foundItem).toEqual(expectedItem);
      });
    });
  });

  describe("isNavItemActive", () => {
    it("should return true for exact URL match", () => {
      expect(isNavItemActive("/dashboard", "/dashboard")).toBe(true);
      expect(isNavItemActive("/expenses", "/expenses")).toBe(true);
      expect(isNavItemActive("/settings", "/settings")).toBe(true);
    });

    it("should return true for nested routes", () => {
      expect(isNavItemActive("/expenses", "/expenses/create")).toBe(true);
      expect(isNavItemActive("/expenses", "/expenses/123/edit")).toBe(true);
      expect(isNavItemActive("/categories", "/categories/new")).toBe(true);
      expect(isNavItemActive("/budgets", "/budgets/monthly")).toBe(true);
    });

    it("should return false for non-matching URLs", () => {
      expect(isNavItemActive("/dashboard", "/expenses")).toBe(false);
      expect(isNavItemActive("/expenses", "/dashboard")).toBe(false);
      expect(isNavItemActive("/settings", "/help")).toBe(false);
    });

    it("should return false for partial matches that are not nested", () => {
      expect(isNavItemActive("/expense", "/expenses")).toBe(false);
      expect(isNavItemActive("/setting", "/settings")).toBe(false);
    });

    it("should handle root path correctly", () => {
      expect(isNavItemActive("/", "/")).toBe(true);
      expect(isNavItemActive("/", "/dashboard")).toBe(false);
      expect(isNavItemActive("/dashboard", "/")).toBe(false);
    });

    it("should handle empty strings", () => {
      expect(isNavItemActive("", "")).toBe(true);
      expect(isNavItemActive("", "/dashboard")).toBe(false);
      expect(isNavItemActive("/dashboard", "")).toBe(false);
    });

    it("should be case sensitive", () => {
      expect(isNavItemActive("/Dashboard", "/dashboard")).toBe(false);
      expect(isNavItemActive("/dashboard", "/Dashboard")).toBe(false);
    });

    it("should handle trailing slashes correctly", () => {
      expect(isNavItemActive("/dashboard", "/dashboard/")).toBe(true);
      expect(isNavItemActive("/dashboard/", "/dashboard")).toBe(false);
    });

    it("should work with all navigation URLs", () => {
      const allItems = [
        ...navigationConfig.navMain,
        ...navigationConfig.navSecondary,
      ];

      allItems.forEach((item) => {
        // Exact match should be active
        expect(isNavItemActive(item.url, item.url)).toBe(true);

        // Nested route should be active
        expect(isNavItemActive(item.url, `${item.url}/nested`)).toBe(true);

        // Different route should not be active
        expect(isNavItemActive(item.url, "/different")).toBe(false);
      });
    });
  });

  describe("Type Safety", () => {
    it("should have proper TypeScript types", () => {
      const navItem: NavItem = {
        title: "Test",
        url: "/test",
        icon: () => null,
      };

      expect(navItem.title).toBe("Test");
      expect(navItem.url).toBe("/test");
      expect(typeof navItem.icon).toBe("function");
    });

    it("should allow optional properties", () => {
      const navItemWithOptionals: NavItem = {
        title: "Test",
        url: "/test",
        icon: () => null,
        badge: "New",
        isActive: true,
        description: "Test description",
      };

      expect(navItemWithOptionals.badge).toBe("New");
      expect(navItemWithOptionals.isActive).toBe(true);
      expect(navItemWithOptionals.description).toBe("Test description");
    });
  });
});
