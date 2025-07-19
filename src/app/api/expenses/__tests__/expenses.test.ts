import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { Decimal } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "../route";
import { GET as getExpense, PUT, DELETE } from "../[id]/route";

// Mock dependencies
vi.mock("next-auth");
vi.mock("@/lib/prisma", () => ({
  prisma: {
    expense: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    category: {
      findFirst: vi.fn(),
    },
    teamMember: {
      findFirst: vi.fn(),
    },
  },
}));

const mockSession = {
  user: {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
  },
};

const mockExpense = {
  id: "expense-1",
  amount: new Decimal(50.0),
  description: "Test expense",
  categoryId: "category-1",
  date: new Date("2024-01-15"),
  receiptUrl: null,
  userId: "user-1",
  teamId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: {
    id: "category-1",
    name: "Food",
    color: "#ff0000",
    icon: "🍔",
  },
  user: {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
  },
  team: null,
};

const mockCategory = {
  id: "category-1",
  name: "Food",
  color: "#ff0000",
  icon: "🍔",
  isDefault: false,
  userId: "user-1",
  teamId: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

describe("/api/expenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("GET /api/expenses", () => {
    it("should return expenses with pagination for authenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.count).mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/expenses?page=1&limit=10"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.expenses).toHaveLength(1);
      expect(data.expenses[0]).toEqual(mockExpense);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it("should filter expenses by category", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.count).mockResolvedValue(1);

      const request = new NextRequest(
        "http://localhost:3000/api/expenses?categoryId=category-1"
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: "category-1",
          }),
        })
      );
    });

    it("should filter expenses by date range", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findMany).mockResolvedValue([mockExpense]);
      vi.mocked(prisma.expense.count).mockResolvedValue(1);

      const startDate = "2024-01-01T00:00:00.000Z";
      const endDate = "2024-01-31T23:59:59.999Z";
      const request = new NextRequest(
        `http://localhost:3000/api/expenses?startDate=${startDate}&endDate=${endDate}`
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.expense.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        })
      );
    });

    it("should return 401 for unauthenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/expenses");
      const response = await GET(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    it("should handle invalid query parameters", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new NextRequest(
        "http://localhost:3000/api/expenses?page=invalid"
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({
          error: "Invalid query parameters",
        })
      );
    });
  });

  describe("POST /api/expenses", () => {
    const validExpenseData = {
      amount: 50.0,
      description: "Test expense",
      categoryId: "category-1",
      date: "2024-01-15T10:00:00.000Z",
    };

    it("should create expense for authenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(prisma.expense.create).mockResolvedValue(mockExpense);

      const request = new NextRequest("http://localhost:3000/api/expenses", {
        method: "POST",
        body: JSON.stringify(validExpenseData),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(await response.json()).toEqual(mockExpense);
      expect(prisma.expense.create).toHaveBeenCalledWith({
        data: {
          ...validExpenseData,
          date: new Date(validExpenseData.date),
          userId: mockSession.user.id,
        },
        include: expect.any(Object),
      });
    });

    it("should create team expense when teamId provided", async () => {
      const teamExpenseData = { ...validExpenseData, teamId: "team-1" };
      const mockTeamMember = {
        id: "member-1",
        userId: "user-1",
        teamId: "team-1",
        role: "EDITOR" as const,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(mockTeamMember);
      vi.mocked(prisma.expense.create).mockResolvedValue({
        ...mockExpense,
        teamId: "team-1",
      });

      const request = new NextRequest("http://localhost:3000/api/expenses", {
        method: "POST",
        body: JSON.stringify(teamExpenseData),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      expect(prisma.teamMember.findFirst).toHaveBeenCalledWith({
        where: {
          teamId: "team-1",
          userId: mockSession.user.id,
          role: { in: ["ADMIN", "EDITOR"] },
        },
      });
    });

    it("should return 401 for unauthenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/expenses", {
        method: "POST",
        body: JSON.stringify(validExpenseData),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });

    it("should return 404 for invalid category", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/expenses", {
        method: "POST",
        body: JSON.stringify(validExpenseData),
      });
      const response = await POST(request);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "Category not found or access denied",
      });
    });

    it("should return 403 for team without permissions", async () => {
      const teamExpenseData = { ...validExpenseData, teamId: "team-1" };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(mockCategory);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/expenses", {
        method: "POST",
        body: JSON.stringify(teamExpenseData),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Team not found or insufficient permissions",
      });
    });

    it("should validate required fields", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const invalidData = { amount: -10 }; // Invalid amount
      const request = new NextRequest("http://localhost:3000/api/expenses", {
        method: "POST",
        body: JSON.stringify(invalidData),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(
        expect.objectContaining({
          error: "Invalid input data",
        })
      );
    });
  });
});

describe("/api/expenses/[id]", () => {
  const expenseId = "expense-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/expenses/[id]", () => {
    it("should return expense for authenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(mockExpense);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`
      );
      const response = await getExpense(request, { params: { id: expenseId } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(mockExpense);
    });

    it("should return 404 for non-existent expense", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`
      );
      const response = await getExpense(request, { params: { id: expenseId } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "Expense not found" });
    });

    it("should return 401 for unauthenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`
      );
      const response = await getExpense(request, { params: { id: expenseId } });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });
  });

  describe("PUT /api/expenses/[id]", () => {
    const updateData = {
      amount: 75.0,
      description: "Updated expense",
    };

    it("should update expense for owner", async () => {
      const updatedExpense = {
        ...mockExpense,
        amount: new Decimal(updateData.amount),
        description: updateData.description,
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(mockExpense);
      vi.mocked(prisma.expense.update).mockResolvedValue(updatedExpense);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );
      const response = await PUT(request, { params: { id: expenseId } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(updatedExpense);
      expect(prisma.expense.update).toHaveBeenCalledWith({
        where: { id: expenseId },
        data: updateData,
        include: expect.any(Object),
      });
    });

    it("should update expense for team member with EDITOR role", async () => {
      const teamExpense = {
        ...mockExpense,
        userId: "other-user",
        teamId: "team-1",
        team: {
          members: [{ userId: "user-1", role: "EDITOR" }],
        },
      };
      const updatedExpense = {
        ...teamExpense,
        amount: new Decimal(updateData.amount),
        description: updateData.description,
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(teamExpense);
      vi.mocked(prisma.expense.update).mockResolvedValue(updatedExpense);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );
      const response = await PUT(request, { params: { id: expenseId } });

      expect(response.status).toBe(200);
    });

    it("should return 403 for team member with VIEWER role", async () => {
      const teamExpense = {
        ...mockExpense,
        userId: "other-user",
        teamId: "team-1",
        team: {
          members: [{ userId: "user-1", role: "VIEWER" }],
        },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(teamExpense);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );
      const response = await PUT(request, { params: { id: expenseId } });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Insufficient permissions to edit this expense",
      });
    });

    it("should return 404 for non-existent expense", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateData),
        }
      );
      const response = await PUT(request, { params: { id: expenseId } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "Expense not found or access denied",
      });
    });

    it("should validate category when updating categoryId", async () => {
      const updateWithCategory = { ...updateData, categoryId: "new-category" };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(mockExpense);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "PUT",
          body: JSON.stringify(updateWithCategory),
        }
      );
      const response = await PUT(request, { params: { id: expenseId } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "Category not found or access denied",
      });
    });
  });

  describe("DELETE /api/expenses/[id]", () => {
    it("should delete expense for owner", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(mockExpense);
      vi.mocked(prisma.expense.delete).mockResolvedValue(mockExpense);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, { params: { id: expenseId } });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        message: "Expense deleted successfully",
      });
      expect(prisma.expense.delete).toHaveBeenCalledWith({
        where: { id: expenseId },
      });
    });

    it("should delete expense for team member with ADMIN role", async () => {
      const teamExpense = {
        ...mockExpense,
        userId: "other-user",
        teamId: "team-1",
        team: {
          members: [{ userId: "user-1", role: "ADMIN" }],
        },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(teamExpense);
      vi.mocked(prisma.expense.delete).mockResolvedValue(teamExpense);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, { params: { id: expenseId } });

      expect(response.status).toBe(200);
    });

    it("should return 403 for team member with VIEWER role", async () => {
      const teamExpense = {
        ...mockExpense,
        userId: "other-user",
        teamId: "team-1",
        team: {
          members: [{ userId: "user-1", role: "VIEWER" }],
        },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(teamExpense);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, { params: { id: expenseId } });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: "Insufficient permissions to delete this expense",
      });
    });

    it("should return 404 for non-existent expense", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      vi.mocked(prisma.expense.findFirst).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, { params: { id: expenseId } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        error: "Expense not found or access denied",
      });
    });

    it("should return 401 for unauthenticated user", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest(
        `http://localhost:3000/api/expenses/${expenseId}`,
        {
          method: "DELETE",
        }
      );
      const response = await DELETE(request, { params: { id: expenseId } });

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
    });
  });
});
