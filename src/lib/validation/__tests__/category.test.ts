import { describe, it, expect } from "vitest";
import {
  categorySchema,
  categoryUpdateSchema,
  categoryQuerySchema,
  CATEGORY_COLORS,
  CATEGORY_LIMITS,
  type CategoryFormData,
  type CategoryUpdateData,
  type CategoryQueryParams,
} from "../category";

describe("Category Validation Schemas", () => {
  describe("categorySchema", () => {
    const validCategoryData: CategoryFormData = {
      name: "Food & Dining",
      color: "#FF5733",
      icon: "utensils",
      isDefault: false,
    };

    it("should validate a complete valid category", () => {
      const result = categorySchema.safeParse(validCategoryData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          ...validCategoryData,
          color: "#FF5733", // Should be normalized to uppercase
        });
      }
    });

    it("should validate category without optional fields", () => {
      const minimalData = {
        name: "Transportation",
        color: "#33FF57",
      };

      const result = categorySchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBe(false); // Default value
        expect(result.data.icon).toBeUndefined();
      }
    });

    describe("name validation", () => {
      it("should reject empty name", () => {
        const data = { ...validCategoryData, name: "" };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Category name is required"
          );
        }
      });

      it("should reject whitespace-only name", () => {
        const data = { ...validCategoryData, name: "   " };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Category name cannot be empty or only whitespace"
          );
        }
      });

      it("should trim whitespace from name", () => {
        const data = { ...validCategoryData, name: "  Food & Dining  " };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.name).toBe("Food & Dining");
        }
      });

      it("should reject name exceeding maximum length", () => {
        const data = { ...validCategoryData, name: "a".repeat(51) };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Category name cannot exceed 50 characters"
          );
        }
      });

      it("should accept name at maximum length", () => {
        const data = { ...validCategoryData, name: "a".repeat(50) };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept single character name", () => {
        const data = { ...validCategoryData, name: "A" };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("color validation", () => {
      it("should accept valid hex colors", () => {
        const validColors = [
          "#FF5733",
          "#33ff57",
          "#3357FF",
          "#000000",
          "#FFFFFF",
        ];

        for (const color of validColors) {
          const data = { ...validCategoryData, color };
          const result = categorySchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.color).toBe(color.toUpperCase());
          }
        }
      });

      it("should reject invalid hex color formats", () => {
        const invalidColors = [
          "#FF573", // Too short
          "#FF57333", // Too long
          "FF5733", // Missing #
          "#GG5733", // Invalid hex characters
          "#ff573g", // Invalid hex character
          "red", // Color name
          "rgb(255, 87, 51)", // RGB format
        ];

        for (const color of invalidColors) {
          const data = { ...validCategoryData, color };
          const result = categorySchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              "Color must be a valid hex color code (e.g., #FF5733)"
            );
          }
        }
      });

      it("should normalize color to uppercase", () => {
        const data = { ...validCategoryData, color: "#ff5733" };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.color).toBe("#FF5733");
        }
      });
    });

    describe("icon validation", () => {
      it("should accept valid icon names", () => {
        const validIcons = [
          "utensils",
          "car",
          "home",
          "shopping-cart",
          "credit-card",
          "heart",
          "star",
          "user",
          "settings",
          "help-circle",
        ];

        for (const icon of validIcons) {
          const data = { ...validCategoryData, icon };
          const result = categorySchema.safeParse(data);
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.icon).toBe(icon);
          }
        }
      });

      it("should reject invalid icon formats", () => {
        const invalidIcons = [
          "UTENSILS", // Uppercase
          "utensils_fork", // Underscore
          "utensils fork", // Space
          "utensils!", // Special character
          "utensils.svg", // File extension
        ];

        for (const icon of invalidIcons) {
          const data = { ...validCategoryData, icon };
          const result = categorySchema.safeParse(data);
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              "Icon must contain only lowercase letters, numbers, and hyphens"
            );
          }
        }
      });

      it("should reject icon name exceeding maximum length", () => {
        const data = { ...validCategoryData, icon: "a".repeat(51) };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Icon name too long");
        }
      });

      it("should accept icon at maximum length", () => {
        const data = { ...validCategoryData, icon: "a".repeat(50) };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept undefined icon", () => {
        const { icon, ...dataWithoutIcon } = validCategoryData;
        const result = categorySchema.safeParse(dataWithoutIcon);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.icon).toBeUndefined();
        }
      });
    });

    describe("isDefault validation", () => {
      it("should accept true value", () => {
        const data = { ...validCategoryData, isDefault: true };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isDefault).toBe(true);
        }
      });

      it("should accept false value", () => {
        const data = { ...validCategoryData, isDefault: false };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isDefault).toBe(false);
        }
      });

      it("should default to false when undefined", () => {
        const { isDefault, ...dataWithoutDefault } = validCategoryData;
        const result = categorySchema.safeParse(dataWithoutDefault);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.isDefault).toBe(false);
        }
      });

      it("should reject non-boolean values", () => {
        const data = { ...validCategoryData, isDefault: "true" as any };
        const result = categorySchema.safeParse(data);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("categoryUpdateSchema", () => {
    it("should validate partial updates", () => {
      const partialUpdate: CategoryUpdateData = {
        name: "Updated Food",
        color: "#33FF57",
        isDefault: false,
      };

      const result = categoryUpdateSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          ...partialUpdate,
          color: "#33FF57", // Normalized
          isDefault: false, // Default value
        });
      }
    });

    it("should validate empty update object", () => {
      const result = categoryUpdateSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isDefault).toBe(false); // Default value should still apply
      }
    });

    it("should validate single field updates", () => {
      const updates = [
        { name: "New Name" },
        { color: "#FF0000" },
        { icon: "new-icon" },
        { isDefault: true },
      ];

      for (const update of updates) {
        const result = categoryUpdateSchema.safeParse(update);
        expect(result.success).toBe(true);
      }
    });

    it("should apply same validation rules as create schema", () => {
      const invalidUpdate = {
        name: "",
        color: "invalid-color",
        icon: "INVALID_ICON",
      };

      const result = categoryUpdateSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
      }
    });
  });

  describe("categoryQuerySchema", () => {
    it("should validate with default values", () => {
      const result = categoryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeDefault).toBe(true);
        expect(result.data.sortBy).toBe("name");
        expect(result.data.sortOrder).toBe("asc");
      }
    });

    it("should validate complete query parameters", () => {
      const queryParams = {
        teamId: "550e8400-e29b-41d4-a716-446655440000",
        includeDefault: "false",
        sortBy: "createdAt" as const,
        sortOrder: "desc" as const,
      };

      const result = categoryQuerySchema.safeParse(queryParams);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          teamId: queryParams.teamId,
          includeDefault: false,
          sortBy: queryParams.sortBy,
          sortOrder: queryParams.sortOrder,
        });
      }
    });

    describe("teamId validation", () => {
      it("should accept valid team UUID", () => {
        const result = categoryQuerySchema.safeParse({
          teamId: "550e8400-e29b-41d4-a716-446655440000",
        });
        expect(result.success).toBe(true);
      });

      it("should reject invalid team UUID", () => {
        const result = categoryQuerySchema.safeParse({
          teamId: "invalid-uuid",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid team ID");
        }
      });

      it("should accept undefined teamId", () => {
        const result = categoryQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.teamId).toBeUndefined();
        }
      });
    });

    describe("includeDefault validation", () => {
      it("should convert string 'true' to boolean true", () => {
        const result = categoryQuerySchema.safeParse({
          includeDefault: "true",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includeDefault).toBe(true);
        }
      });

      it("should convert string 'false' to boolean false", () => {
        const result = categoryQuerySchema.safeParse({
          includeDefault: "false",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includeDefault).toBe(false);
        }
      });

      it("should convert other strings to false", () => {
        const result = categoryQuerySchema.safeParse({
          includeDefault: "maybe",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includeDefault).toBe(false);
        }
      });

      it("should default to true when undefined", () => {
        const result = categoryQuerySchema.safeParse({});
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.includeDefault).toBe(true);
        }
      });
    });

    describe("sorting validation", () => {
      it("should accept valid sort fields", () => {
        const validSortFields = ["name", "createdAt"];

        for (const sortBy of validSortFields) {
          const result = categoryQuerySchema.safeParse({ sortBy });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.sortBy).toBe(sortBy);
          }
        }
      });

      it("should reject invalid sort fields", () => {
        const result = categoryQuerySchema.safeParse({
          sortBy: "invalidField",
        });
        expect(result.success).toBe(false);
      });

      it("should accept valid sort orders", () => {
        const validSortOrders = ["asc", "desc"];

        for (const sortOrder of validSortOrders) {
          const result = categoryQuerySchema.safeParse({ sortOrder });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.sortOrder).toBe(sortOrder);
          }
        }
      });

      it("should reject invalid sort orders", () => {
        const result = categoryQuerySchema.safeParse({ sortOrder: "invalid" });
        expect(result.success).toBe(false);
      });
    });
  });

  describe("Constants", () => {
    describe("CATEGORY_COLORS", () => {
      it("should contain valid hex colors", () => {
        expect(CATEGORY_COLORS).toBeDefined();
        expect(Array.isArray(CATEGORY_COLORS)).toBe(true);
        expect(CATEGORY_COLORS.length).toBeGreaterThan(0);

        for (const color of CATEGORY_COLORS) {
          expect(color).toMatch(/^#[0-9A-F]{6}$/);
        }
      });

      it("should contain unique colors", () => {
        const uniqueColors = new Set(CATEGORY_COLORS);
        expect(uniqueColors.size).toBe(CATEGORY_COLORS.length);
      });
    });

    describe("CATEGORY_LIMITS", () => {
      it("should have proper structure and values", () => {
        expect(CATEGORY_LIMITS).toBeDefined();
        expect(CATEGORY_LIMITS.NAME).toBeDefined();
        expect(CATEGORY_LIMITS.NAME.MIN).toBe(1);
        expect(CATEGORY_LIMITS.NAME.MAX).toBe(50);
        expect(CATEGORY_LIMITS.ICON).toBeDefined();
        expect(CATEGORY_LIMITS.ICON.MAX).toBe(50);
      });

      it("should have consistent limits with validation", () => {
        // Test that the constants match what's used in validation
        const testData = {
          name: "a".repeat(CATEGORY_LIMITS.NAME.MAX),
          color: "#FF5733",
          icon: "a".repeat(CATEGORY_LIMITS.ICON.MAX),
        };

        const result = categorySchema.safeParse(testData);
        expect(result.success).toBe(true);

        // Test exceeding limits
        const exceedingData = {
          name: "a".repeat(CATEGORY_LIMITS.NAME.MAX + 1),
          color: "#FF5733",
          icon: "a".repeat(CATEGORY_LIMITS.ICON.MAX + 1),
        };

        const exceedingResult = categorySchema.safeParse(exceedingData);
        expect(exceedingResult.success).toBe(false);
      });
    });
  });
});
