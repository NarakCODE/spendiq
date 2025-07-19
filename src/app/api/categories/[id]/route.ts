import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { categoryUpdateSchema } from "@/lib/validation/category";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

// Helper function to get user from token
async function getUserFromToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "test-secret-do-not-use-in-production"
    ) as { id: string; email: string };

    return { id: decoded.id, email: decoded.email };
  } catch (error) {
    return null;
  }
}

// GET /api/categories/[id] - Get a specific category
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user from session first
    const session = await getServerSession(authOptions);

    // If no session, try to get user from token
    const tokenUser = !session?.user ? await getUserFromToken(req) : null;

    // If neither session nor token authentication worked, return unauthorized
    if (!session?.user && !tokenUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from either session or token
    const userId = session?.user?.id || tokenUser?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Find the category
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if user has access to this category
    if (category.userId && category.userId !== userId) {
      // Check if user is part of the team that owns this category
      if (category.teamId) {
        const teamMember = await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId,
              teamId: category.teamId,
            },
          },
        });

        if (!teamMember) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user from session first
    const session = await getServerSession(authOptions);

    // If no session, try to get user from token
    const tokenUser = !session?.user ? await getUserFromToken(req) : null;

    // If neither session nor token authentication worked, return unauthorized
    if (!session?.user && !tokenUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from either session or token
    const userId = session?.user?.id || tokenUser?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Validate request body
    const validationResult = categoryUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid category data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Find the category
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to update this category
    if (category.userId && category.userId !== userId) {
      // Check if user is part of the team that owns this category with ADMIN or EDITOR role
      if (category.teamId) {
        const teamMember = await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId,
              teamId: category.teamId,
            },
          },
        });

        if (
          !teamMember ||
          (teamMember.role !== "ADMIN" && teamMember.role !== "EDITOR")
        ) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: validationResult.data,
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try to get user from session first
    const session = await getServerSession(authOptions);

    // If no session, try to get user from token
    const tokenUser = !session?.user ? await getUserFromToken(req) : null;

    // If neither session nor token authentication worked, return unauthorized
    if (!session?.user && !tokenUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from either session or token
    const userId = session?.user?.id || tokenUser?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Find the category
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        expenses: { select: { id: true }, take: 1 },
        budgets: { select: { id: true }, take: 1 },
        recurringExpenses: { select: { id: true }, take: 1 },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this category
    if (category.userId && category.userId !== userId) {
      // Check if user is part of the team that owns this category with ADMIN role
      if (category.teamId) {
        const teamMember = await prisma.teamMember.findUnique({
          where: {
            userId_teamId: {
              userId,
              teamId: category.teamId,
            },
          },
        });

        if (!teamMember || teamMember.role !== "ADMIN") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Check if category is being used
    if (
      category.expenses.length > 0 ||
      category.budgets.length > 0 ||
      category.recurringExpenses.length > 0
    ) {
      return NextResponse.json(
        { error: "Cannot delete category that is in use" },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
