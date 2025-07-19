import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDefaultCategoriesForUser,
  createDefaultCategoriesForTeam,
} from "../category-service";
import { prisma } from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      count: vi.fn(),
      createMany: vi.fn(),
    },
  },
}));

describe("Category Service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("createDefaultCategoriesForUser", () => {
    it("should create default categories for a new user", async () => {
      // Mock that user has no categories
      (prisma.category.count as any).mockResolvedValue(0);
      (prisma.category.createMany as any).mockResolvedValue({ count: 11 });

      await createDefaultCategoriesForUser("user-1");

      // Verify count was called with correct parameters
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });

      // Verify createMany was called
      expect(prisma.category.createMany).toHaveBeenCalled();

      // Get the call arguments
      const createManyCall = (prisma.category.createMany as any).mock
        .calls[0][0];

      // Verify the data structure
      expect(createManyCall).toHaveProperty("data");
      expect(Array.isArray(createManyCall.data)).toBe(true);
      expect(createManyCall.data.length).toBeGreaterThan(0);

      // Check that all categories have the correct userId
      createManyCall.data.forEach((category: any) => {
        expect(category).toHaveProperty("userId", "user-1");
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("color");
        expect(category).toHaveProperty("icon");
        expect(category).toHaveProperty("isDefault");
      });
    });

    it("should not create categories if user already has some", async () => {
      // Mock that user already has categories
      (prisma.category.count as any).mockResolvedValue(5);

      await createDefaultCategoriesForUser("user-1");

      // Verify count was called
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { userId: "user-1" },
      });

      // Verify createMany was not called
      expect(prisma.category.createMany).not.toHaveBeenCalled();
    });
  });

  describe("createDefaultCategoriesForTeam", () => {
    it("should create default categories for a new team", async () => {
      // Mock that team has no categories
      (prisma.category.count as any).mockResolvedValue(0);
      (prisma.category.createMany as any).mockResolvedValue({ count: 11 });

      await createDefaultCategoriesForTeam("team-1");

      // Verify count was called with correct parameters
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { teamId: "team-1" },
      });

      // Verify createMany was called
      expect(prisma.category.createMany).toHaveBeenCalled();

      // Get the call arguments
      const createManyCall = (prisma.category.createMany as any).mock
        .calls[0][0];

      // Verify the data structure
      expect(createManyCall).toHaveProperty("data");
      expect(Array.isArray(createManyCall.data)).toBe(true);
      expect(createManyCall.data.length).toBeGreaterThan(0);

      // Check that all categories have the correct teamId
      createManyCall.data.forEach((category: any) => {
        expect(category).toHaveProperty("teamId", "team-1");
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("color");
        expect(category).toHaveProperty("icon");
        expect(category).toHaveProperty("isDefault");
      });
    });

    it("should not create categories if team already has some", async () => {
      // Mock that team already has categories
      (prisma.category.count as any).mockResolvedValue(5);

      await createDefaultCategoriesForTeam("team-1");

      // Verify count was called
      expect(prisma.category.count).toHaveBeenCalledWith({
        where: { teamId: "team-1" },
      });

      // Verify createMany was not called
      expect(prisma.category.createMany).not.toHaveBeenCalled();
    });
  });
});
