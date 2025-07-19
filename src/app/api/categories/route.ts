import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validation/category";
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

// GET /api/categories - Get all categories for the current user
export async function GET(req: NextRequest) {
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

    // Get query parameters
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    // Build the query based on whether we're fetching team or personal categories
    const query = teamId ? { teamId } : { userId, teamId: null };

    const categories = await prisma.category.findMany({
      where: query,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(req: NextRequest) {
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

    const body = await req.json();

    // Validate request body
    const validationResult = categorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid category data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, color, icon, isDefault } = validationResult.data;

    // Check if teamId is provided
    const teamId = body.teamId || null;

    // If teamId is provided, verify user is a member of the team
    if (teamId) {
      const teamMember = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId,
          },
        },
      });

      if (!teamMember) {
        return NextResponse.json(
          { error: "You are not a member of this team" },
          { status: 403 }
        );
      }
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        name,
        color,
        icon,
        isDefault,
        userId: teamId ? null : userId,
        teamId,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
