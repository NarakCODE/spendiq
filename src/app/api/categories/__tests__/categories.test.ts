import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { GET as getCategory, PUT, DELETE } from "../[id]/route";
import { prisma } from "@/lib/prisma";
import { createMockSession } from "@/lib/test-utils";

// Mock NextAuth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(() => createMockSession()),
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
    },
  },
}));

describe("Category API Routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/categories", () => {
    it("should return categories for the current user", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Food",
          color: "#FF5733",
          icon: "utensils",
          isDefault: true,
          userId: "user-1",
          teamId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock Prisma response
      (prisma.category.findMany as any).mockResolvedValue(mockCategories);

      // Create mock request
      const req = new NextRequest("http://localhost:3000/api/categories");

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: "1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: true,
        userId: "user-1",
        teamId: null,
      });
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", teamId: null },
        orderBy: { name: "asc" },
      });
    });

    it("should return team categories when teamId is provided", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Team Food",
          color: "#FF5733",
          icon: "utensils",
          isDefault: true,
          userId: null,
          teamId: "team-1",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock Prisma response
      (prisma.category.findMany as any).mockResolvedValue(mockCategories);

      // Create mock request
      const req = new NextRequest(
        "http://localhost:3000/api/categories?teamId=team-1"
      );

      // Call the handler
      const response = await GET(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        id: "1",
        name: "Team Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: true,
        userId: null,
        teamId: "team-1",
      });
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { teamId: "team-1" },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("POST /api/categories", () => {
    it("should create a new category for the current user", async () => {
      const mockCategory = {
        id: "1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: false,
        userId: "user-1",
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma response
      (prisma.category.create as any).mockResolvedValue(mockCategory);

      // Create mock request
      const req = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "Food",
          color: "#FF5733",
          icon: "utensils",
        }),
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: "1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: false,
        userId: "user-1",
        teamId: null,
      });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Food",
          color: "#FF5733",
          icon: "utensils",
          isDefault: false,
          userId: "user-1",
          teamId: null,
        },
      });
    });

    it("should create a new category for a team", async () => {
      const mockCategory = {
        id: "1",
        name: "Team Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: false,
        userId: null,
        teamId: "team-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock team membership check
      (prisma.teamMember.findUnique as any).mockResolvedValue({
        id: "member-1",
        userId: "user-1",
        teamId: "team-1",
        role: "ADMIN",
      });

      // Mock Prisma response
      (prisma.category.create as any).mockResolvedValue(mockCategory);

      // Create mock request
      const req = new NextRequest("http://localhost:3000/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name: "Team Food",
          color: "#FF5733",
          icon: "utensils",
          teamId: "team-1",
        }),
      });

      // Call the handler
      const response = await POST(req);
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        id: "1",
        name: "Team Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: false,
        userId: null,
        teamId: "team-1",
      });
      expect(prisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: {
          userId_teamId: {
            userId: "user-1",
            teamId: "team-1",
          },
        },
      });
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: "Team Food",
          color: "#FF5733",
          icon: "utensils",
          isDefault: false,
          userId: null,
          teamId: "team-1",
        },
      });
    });
  });

  describe("GET /api/categories/[id]", () => {
    it("should return a specific category", async () => {
      const mockCategory = {
        id: "category-1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: true,
        userId: "user-1",
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock Prisma response
      (prisma.category.findUnique as any).mockResolvedValue(mockCategory);

      // Create mock request
      const req = new NextRequest(
        "http://localhost:3000/api/categories/category-1"
      );

      // Call the handler
      const response = await getCategory(req, { params: { id: "category-1" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: "category-1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: true,
        userId: "user-1",
        teamId: null,
      });
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: "category-1" },
      });
    });

    it("should return 404 if category not found", async () => {
      // Mock Prisma response
      (prisma.category.findUnique as any).mockResolvedValue(null);

      // Create mock request
      const req = new NextRequest(
        "http://localhost:3000/api/categories/non-existent"
      );

      // Call the handler
      const response = await getCategory(req, {
        params: { id: "non-existent" },
      });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: "Category not found" });
    });
  });

  describe("PUT /api/categories/[id]", () => {
    it("should update a category", async () => {
      const mockCategory = {
        id: "category-1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: true,
        userId: "user-1",
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCategory = {
        ...mockCategory,
        name: "Updated Food",
        color: "#33FF57",
      };

      // Mock Prisma responses
      (prisma.category.findUnique as any).mockResolvedValue(mockCategory);
      (prisma.category.update as any).mockResolvedValue(updatedCategory);

      // Create mock request
      const req = new NextRequest(
        "http://localhost:3000/api/categories/category-1",
        {
          method: "PUT",
          body: JSON.stringify({
            name: "Updated Food",
            color: "#33FF57",
          }),
        }
      );

      // Call the handler
      const response = await PUT(req, { params: { id: "category-1" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: "category-1",
        name: "Updated Food",
        color: "#33FF57",
        icon: "utensils",
        isDefault: true,
        userId: "user-1",
        teamId: null,
      });
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: "category-1" },
        data: {
          name: "Updated Food",
          color: "#33FF57",
          isDefault: false,
        },
      });
    });
  });

  describe("DELETE /api/categories/[id]", () => {
    it("should delete a category", async () => {
      const mockCategory = {
        id: "category-1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: true,
        userId: "user-1",
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expenses: [],
        budgets: [],
        recurringExpenses: [],
      };

      // Mock Prisma responses
      (prisma.category.findUnique as any).mockResolvedValue(mockCategory);
      (prisma.category.delete as any).mockResolvedValue(mockCategory);

      // Create mock request
      const req = new NextRequest(
        "http://localhost:3000/api/categories/category-1",
        {
          method: "DELETE",
        }
      );

      // Call the handler
      const response = await DELETE(req, { params: { id: "category-1" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: "category-1" },
      });
    });

    it("should not delete a category that is in use", async () => {
      const mockCategory = {
        id: "category-1",
        name: "Food",
        color: "#FF5733",
        icon: "utensils",
        isDefault: true,
        userId: "user-1",
        teamId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        expenses: [{ id: "expense-1" }],
        budgets: [],
        recurringExpenses: [],
      };

      // Mock Prisma response
      (prisma.category.findUnique as any).mockResolvedValue(mockCategory);

      // Create mock request
      const req = new NextRequest(
        "http://localhost:3000/api/categories/category-1",
        {
          method: "DELETE",
        }
      );

      // Call the handler
      const response = await DELETE(req, { params: { id: "category-1" } });
      const data = await response.json();

      // Assertions
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: "Cannot delete category that is in use" });
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });
  });
});
