import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { createDefaultCategoriesForTeam } from "@/lib/services/category-service";
import { z } from "zod";

// Helper function to authenticate and get user ID
async function authenticateUser(): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId: session.user.id };
}

// Team creation schema
const teamCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Team name is required")
    .max(100, "Team name is too long"),
});

// GET /api/teams - Get all teams for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get teams where user is a member
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    // Format the response
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      role: team.members[0]?.role,
      createdAt: team.createdAt,
    }));

    return NextResponse.json(formattedTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();

    // Validate request body
    const validationResult = teamCreateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid team data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { name } = validationResult.data;

    // Create team and add current user as admin in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the team
      const team = await tx.team.create({
        data: {
          name,
        },
      });

      // Add current user as admin
      await tx.teamMember.create({
        data: {
          userId,
          teamId: team.id,
          role: "ADMIN",
        },
      });

      return team;
    });

    // Create default categories for the team
    await createDefaultCategoriesForTeam(result.id);

    return NextResponse.json(
      {
        id: result.id,
        name: result.name,
        role: "ADMIN",
        createdAt: result.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
