import { z } from "zod";

// Constants for category validation
const CATEGORY_LIMITS = {
  NAME: {
    MIN: 1,
    MAX: 50,
  },
  ICON: {
    MAX: 50, // For icon names like 'shopping-cart', 'food', etc.
  },
} as const;

// Predefined color palette for categories (optional constraint)
const CATEGORY_COLORS = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#FF33F5",
  "#F5FF33",
  "#33FFF5",
  "#F533FF",
  "#57FF33",
  "#5733FF",
  "#FF5733",
  "#FF8C00",
  "#32CD32",
  "#1E90FF",
  "#FF1493",
  "#FFD700",
  "#00CED1",
  "#9370DB",
  "#FF6347",
  "#40E0D0",
  "#DA70D6",
] as const;

// Reusable validators
const categoryNameValidator = z
  .string()
  .trim()
  .min(CATEGORY_LIMITS.NAME.MIN, "Category name is required")
  .max(CATEGORY_LIMITS.NAME.MAX, "Category name cannot exceed 50 characters")
  .refine(
    (name) => name.length > 0 && !/^\s*$/.test(name),
    "Category name cannot be empty or only whitespace"
  );

const categoryColorValidator = z
  .string()
  .regex(
    /^#([0-9A-F]{6})$/i,
    "Color must be a valid hex color code (e.g., #FF5733)"
  )
  .transform((color) => color.toUpperCase()); // Normalize to uppercase

const categoryIconValidator = z
  .string()
  .max(CATEGORY_LIMITS.ICON.MAX, "Icon name too long")
  .regex(
    /^[a-z0-9-]+$/,
    "Icon must contain only lowercase letters, numbers, and hyphens"
  )
  .optional();

const isDefaultValidator = z.boolean().optional().default(false);

// Main category schema
export const categorySchema = z.object({
  name: categoryNameValidator,
  color: categoryColorValidator,
  icon: categoryIconValidator,
  isDefault: isDefaultValidator,
});

// Update schema (all fields optional)
export const categoryUpdateSchema = z.object({
  name: categoryNameValidator.optional(),
  color: categoryColorValidator.optional(),
  icon: categoryIconValidator,
  isDefault: isDefaultValidator,
});

// Query schema for filtering categories
export const categoryQuerySchema = z.object({
  teamId: z.string().uuid("Invalid team ID").optional(),
  includeDefault: z
    .string()
    .transform((val) => val === "true")
    .optional()
    .default("true"),
  sortBy: z.enum(["name", "createdAt"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Type exports
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryUpdateData = z.infer<typeof categoryUpdateSchema>;
export type CategoryQueryParams = z.infer<typeof categoryQuerySchema>;

// Export constants for use in components
export { CATEGORY_COLORS, CATEGORY_LIMITS };
