import { prisma } from "@/lib/prisma";

// Default categories to create for new users
const DEFAULT_CATEGORIES = [
  {
    name: "Food & Dining",
    color: "#FF5733",
    icon: "utensils",
    isDefault: true,
  },
  { name: "Transportation", color: "#33A1FF", icon: "car", isDefault: true },
  { name: "Housing", color: "#33FF57", icon: "home", isDefault: true },
  { name: "Entertainment", color: "#D433FF", icon: "film", isDefault: true },
  { name: "Shopping", color: "#FF33A1", icon: "shopping-bag", isDefault: true },
  { name: "Utilities", color: "#FFD700", icon: "bolt", isDefault: true },
  { name: "Healthcare", color: "#4CAF50", icon: "heartbeat", isDefault: true },
  { name: "Travel", color: "#9C27B0", icon: "plane", isDefault: true },
  {
    name: "Education",
    color: "#3F51B5",
    icon: "graduation-cap",
    isDefault: true,
  },
  { name: "Personal Care", color: "#E91E63", icon: "spa", isDefault: true },
  { name: "Other", color: "#607D8B", icon: "ellipsis-h", isDefault: true },
];

/**
 * Creates default categories for a new user
 * @param userId The ID of the user to create categories for
 */
export async function createDefaultCategoriesForUser(userId: string) {
  try {
    // Check if user already has categories
    const existingCategories = await prisma.category.count({
      where: { userId },
    });

    if (existingCategories > 0) {
      return; // User already has categories, don't create defaults
    }

    // Create default categories for the user
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        ...category,
        userId,
      })),
    });

    console.log(
      `Created ${DEFAULT_CATEGORIES.length} default categories for user ${userId}`
    );
  } catch (error) {
    console.error("Error creating default categories:", error);
    throw new Error("Failed to create default categories");
  }
}

/**
 * Creates default categories for a new team
 * @param teamId The ID of the team to create categories for
 */
export async function createDefaultCategoriesForTeam(teamId: string) {
  try {
    // Check if team already has categories
    const existingCategories = await prisma.category.count({
      where: { teamId },
    });

    if (existingCategories > 0) {
      return; // Team already has categories, don't create defaults
    }

    // Create default categories for the team
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((category) => ({
        ...category,
        teamId,
      })),
    });

    console.log(
      `Created ${DEFAULT_CATEGORIES.length} default categories for team ${teamId}`
    );
  } catch (error) {
    console.error("Error creating default categories for team:", error);
    throw new Error("Failed to create default categories for team");
  }
}
