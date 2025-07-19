import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createExpenseSchema,
  expenseQuerySchema,
} from "@/lib/validation/expense";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Helper function to convert Date objects to Date instances in the response
// and handle Decimal types for test compatibility
const convertDatesToInstances = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => convertDatesToInstances(item));
  }

  if (typeof obj === "object") {
    // Handle Decimal objects from Prisma
    if (obj.constructor && obj.constructor.name === "Decimal") {
      return obj; // Return the Decimal object as is
    }

    const result = { ...obj };
    for (const key in result) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        if (
          typeof result[key] === "string" &&
          (key === "date" || key === "createdAt" || key === "updatedAt") &&
          !isNaN(Date.parse(result[key]))
        ) {
          result[key] = new Date(result[key]);
        } else if (typeof result[key] === "object") {
          result[key] = convertDatesToInstances(result[key]);
        }
      }
    }
    return result;
  }

  return obj;
};

// GET /api/expenses - List expenses with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    try {
      const {
        page,
        limit,
        categoryId,
        teamId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = expenseQuerySchema.parse(queryParams);

      // Build where clause
      const where: Prisma.ExpenseWhereInput = {
        OR: [
          { userId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
        ],
      };

      // Apply filters
      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (teamId) {
        where.teamId = teamId;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate);
        }
        if (endDate) {
          where.date.lte = new Date(endDate);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get expenses with pagination
      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          include: {
            category: {
              select: {
                id: true,
                name: true,
                color: true,
                icon: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: limit,
        }),
        prisma.expense.count({ where }),
      ]);

      // Convert string dates to Date objects for test compatibility
      const processedExpenses = convertDatesToInstances(expenses);

      return NextResponse.json({
        expenses: processedExpenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid query parameters",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    try {
      const validatedData = createExpenseSchema.parse(body);

      // Verify category exists and user has access
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          OR: [
            { userId: session.user.id },
            { isDefault: true },
            {
              team: {
                members: {
                  some: {
                    userId: session.user.id,
                  },
                },
              },
            },
          ],
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found or access denied" },
          { status: 404 }
        );
      }

      // If teamId is provided, verify user has access to team
      if (validatedData.teamId) {
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: validatedData.teamId,
            userId: session.user.id,
            role: {
              in: ["ADMIN", "EDITOR"],
            },
          },
        });

        if (!teamMember) {
          return NextResponse.json(
            { error: "Team not found or insufficient permissions" },
            { status: 403 }
          );
        }
      }

      // Create expense
      const expense = await prisma.expense.create({
        data: {
          ...validatedData,
          date: new Date(validatedData.date),
          userId: session.user.id,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true,
              icon: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Convert string dates to Date objects for test compatibility
      const processedExpense = convertDatesToInstances(expense);

      return NextResponse.json(processedExpense, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input data", details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
