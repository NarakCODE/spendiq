import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validation/expense";
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

// GET /api/expenses/[id] - Get single expense
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const expense = await prisma.expense.findFirst({
      where: {
        id: params.id,
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

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Convert string dates to Date objects for test compatibility
    const processedExpense = convertDatesToInstances(expense);

    return NextResponse.json(processedExpense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      const validatedData = updateExpenseSchema.parse(body);

      // Check if expense exists and user has permission to edit
      const existingExpense = await prisma.expense.findFirst({
        where: {
          id: params.id,
          OR: [
            { userId: session.user.id },
            {
              team: {
                members: {
                  some: {
                    userId: session.user.id,
                    role: {
                      in: ["ADMIN", "EDITOR"],
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          team: {
            include: {
              members: {
                where: {
                  userId: session.user.id,
                },
              },
            },
          },
        },
      });

      if (!existingExpense) {
        return NextResponse.json(
          { error: "Expense not found or access denied" },
          { status: 404 }
        );
      }

      // If user is not the owner, check team permissions
      if (existingExpense.userId !== session.user.id) {
        const userRole = existingExpense.team?.members[0]?.role;
        if (!userRole || !["ADMIN", "EDITOR"].includes(userRole)) {
          return NextResponse.json(
            { error: "Insufficient permissions to edit this expense" },
            { status: 403 }
          );
        }
      }

      // If categoryId is being updated, verify access
      if (validatedData.categoryId) {
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
      }

      // If teamId is being updated, verify access
      if (validatedData.teamId !== undefined) {
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
      }

      // Prepare update data
      const updateData: any = { ...validatedData };
      if (validatedData.date) {
        updateData.date = new Date(validatedData.date);
      }

      // Update expense
      const updatedExpense = await prisma.expense.update({
        where: { id: params.id },
        data: updateData,
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
      const processedExpense = convertDatesToInstances(updatedExpense);

      return NextResponse.json(processedExpense);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input data", details: validationError },
          { status: 400 }
        );
      }
      throw validationError; // Re-throw if it's not a ZodError
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if expense exists and user has permission to delete
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          {
            team: {
              members: {
                some: {
                  userId: session.user.id,
                  role: {
                    in: ["ADMIN", "EDITOR"],
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        team: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: "Expense not found or access denied" },
        { status: 404 }
      );
    }

    // If user is not the owner, check team permissions
    if (existingExpense.userId !== session.user.id) {
      const userRole = existingExpense.team?.members[0]?.role;
      if (!userRole || !["ADMIN", "EDITOR"].includes(userRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions to delete this expense" },
          { status: 403 }
        );
      }
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
