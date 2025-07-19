import { describe, it, expect } from "vitest";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
  type CreateExpenseInput,
  type UpdateExpenseInput,
  type ExpenseQueryParams,
} from "../expense";

describe("Expense Validation Schemas", () => {
  describe("createExpenseSchema", () => {
    const validExpenseData: CreateExpenseInput = {
      amount: 25.99,
      description: "Lunch at restaurant",
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
      date: "2024-01-15T12:00:00.000Z",
      receiptUrl: "https://example.com/receipt.jpg",
      teamId: "550e8400-e29b-41d4-a716-446655440001",
    };

    it("should validate a complete valid expense", () => {
      const result = createExpenseSchema.safeParse(validExpenseData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validExpenseData);
      }
    });

    it("should validate expense without optional fields", () => {
      const minimalData = {
        amount: 10.5,
        description: "Coffee",
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        date: "2024-01-15T12:00:00.000Z",
      };

      const result = createExpenseSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    describe("amount validation", () => {
      it("should reject negative amounts", () => {
        const data = { ...validExpenseData, amount: -10.5 };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Amount must be at least $0.01"
          );
        }
      });

      it("should reject zero amount", () => {
        const data = { ...validExpenseData, amount: 0 };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Amount must be at least $0.01"
          );
        }
      });

      it("should reject amounts with more than 2 decimal places", () => {
        const data = { ...validExpenseData, amount: 10.999 };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Amount must have at most 2 decimal places"
          );
        }
      });

      it("should reject amounts exceeding maximum", () => {
        const data = { ...validExpenseData, amount: 100000000 };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Amount cannot exceed $99,999,999.99"
          );
        }
      });

      it("should accept minimum valid amount", () => {
        const data = { ...validExpenseData, amount: 0.01 };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept maximum valid amount", () => {
        const data = { ...validExpenseData, amount: 99999999.99 };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("description validation", () => {
      it("should reject empty description", () => {
        const data = { ...validExpenseData, description: "" };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Description is required"
          );
        }
      });

      it("should reject whitespace-only description", () => {
        const data = { ...validExpenseData, description: "   " };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Description is required"
          );
        }
      });

      it("should trim whitespace from description", () => {
        const data = { ...validExpenseData, description: "  Coffee  " };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe("Coffee");
        }
      });

      it("should reject description exceeding maximum length", () => {
        const data = { ...validExpenseData, description: "a".repeat(501) };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Description cannot exceed 500 characters"
          );
        }
      });

      it("should accept description at maximum length", () => {
        const data = { ...validExpenseData, description: "a".repeat(500) };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("categoryId validation", () => {
      it("should reject invalid UUID format", () => {
        const data = { ...validExpenseData, categoryId: "invalid-uuid" };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid category ID");
        }
      });

      it("should accept valid UUID", () => {
        const data = {
          ...validExpenseData,
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
        };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("date validation", () => {
      it("should reject invalid date format", () => {
        const data = { ...validExpenseData, date: "2024-01-15" };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid date format");
        }
      });

      it("should reject future dates", () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const data = { ...validExpenseData, date: futureDate.toISOString() };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Expense date cannot be in the future"
          );
        }
      });

      it("should accept current date", () => {
        const data = { ...validExpenseData, date: new Date().toISOString() };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should accept past dates", () => {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);
        const data = { ...validExpenseData, date: pastDate.toISOString() };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    describe("receiptUrl validation", () => {
      it("should accept valid URL", () => {
        const data = {
          ...validExpenseData,
          receiptUrl: "https://example.com/receipt.jpg",
        };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should reject invalid URL", () => {
        const data = { ...validExpenseData, receiptUrl: "not-a-url" };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid receipt URL");
        }
      });

      it("should reject URL exceeding maximum length", () => {
        const longUrl = "https://example.com/" + "a".repeat(2048);
        const data = { ...validExpenseData, receiptUrl: longUrl };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Receipt URL too long");
        }
      });

      it("should accept undefined receiptUrl", () => {
        const { receiptUrl, ...dataWithoutReceipt } = validExpenseData;
        const result = createExpenseSchema.safeParse(dataWithoutReceipt);
        expect(result.success).toBe(true);
      });
    });

    describe("teamId validation", () => {
      it("should accept valid team UUID", () => {
        const data = {
          ...validExpenseData,
          teamId: "550e8400-e29b-41d4-a716-446655440001",
        };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(true);
      });

      it("should reject invalid team UUID", () => {
        const data = { ...validExpenseData, teamId: "invalid-uuid" };
        const result = createExpenseSchema.safeParse(data);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid team ID");
        }
      });

      it("should accept undefined teamId", () => {
        const { teamId, ...dataWithoutTeam } = validExpenseData;
        const result = createExpenseSchema.safeParse(dataWithoutTeam);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("updateExpenseSchema", () => {
    it("should validate partial updates", () => {
      const partialUpdate: UpdateExpenseInput = {
        amount: 15.99,
        description: "Updated description",
      };

      const result = updateExpenseSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(partialUpdate);
      }
    });

    it("should validate empty update object", () => {
      const result = updateExpenseSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should allow null values for nullable fields", () => {
      const updateData = {
        receiptUrl: null,
        teamId: null,
      };

      const result = updateExpenseSchema.safeParse(updateData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.receiptUrl).toBeNull();
        expect(result.data.teamId).toBeNull();
      }
    });

    it("should apply same validation rules as create schema", () => {
      const invalidUpdate = {
        amount: -10,
        description: "",
      };

      const result = updateExpenseSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
      }
    });
  });

  describe("expenseQuerySchema", () => {
    it("should validate with default values", () => {
      const result = expenseQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortBy).toBe("date");
        expect(result.data.sortOrder).toBe("desc");
      }
    });

    it("should validate complete query parameters", () => {
      const queryParams: ExpenseQueryParams = {
        page: 2,
        limit: 25,
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        teamId: "550e8400-e29b-41d4-a716-446655440001",
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-01-31T23:59:59.999Z",
        sortBy: "amount",
        sortOrder: "asc",
      };

      const result = expenseQuerySchema.safeParse({
        page: "2",
        limit: "25",
        categoryId: queryParams.categoryId,
        teamId: queryParams.teamId,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(queryParams);
      }
    });

    describe("pagination validation", () => {
      it("should reject invalid page numbers", () => {
        const result = expenseQuerySchema.safeParse({ page: "0" });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Page must be between 1 and 10000"
          );
        }
      });

      it("should reject page numbers exceeding maximum", () => {
        const result = expenseQuerySchema.safeParse({ page: "10001" });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Page must be between 1 and 10000"
          );
        }
      });

      it("should reject invalid limit values", () => {
        const result = expenseQuerySchema.safeParse({ limit: "0" });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Limit must be between 1 and 100"
          );
        }
      });

      it("should reject limit exceeding maximum", () => {
        const result = expenseQuerySchema.safeParse({ limit: "101" });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Limit must be between 1 and 100"
          );
        }
      });

      it("should reject non-numeric page/limit values", () => {
        const result = expenseQuerySchema.safeParse({
          page: "abc",
          limit: "xyz",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(2);
          expect(result.error.issues[0].message).toContain(
            "Page must be a positive integer"
          );
          expect(result.error.issues[1].message).toContain(
            "Limit must be a positive integer"
          );
        }
      });
    });

    describe("date range validation", () => {
      it("should accept valid date range", () => {
        const result = expenseQuerySchema.safeParse({
          startDate: "2024-01-01T00:00:00.000Z",
          endDate: "2024-01-31T23:59:59.999Z",
        });
        expect(result.success).toBe(true);
      });

      it("should reject invalid date range (start after end)", () => {
        const result = expenseQuerySchema.safeParse({
          startDate: "2024-01-31T23:59:59.999Z",
          endDate: "2024-01-01T00:00:00.000Z",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Start date must be before or equal to end date"
          );
          expect(result.error.issues[0].path).toEqual(["endDate"]);
        }
      });

      it("should accept equal start and end dates", () => {
        const sameDate = "2024-01-15T12:00:00.000Z";
        const result = expenseQuerySchema.safeParse({
          startDate: sameDate,
          endDate: sameDate,
        });
        expect(result.success).toBe(true);
      });

      it("should accept only start date", () => {
        const result = expenseQuerySchema.safeParse({
          startDate: "2024-01-01T00:00:00.000Z",
        });
        expect(result.success).toBe(true);
      });

      it("should accept only end date", () => {
        const result = expenseQuerySchema.safeParse({
          endDate: "2024-01-31T23:59:59.999Z",
        });
        expect(result.success).toBe(true);
      });
    });

    describe("sorting validation", () => {
      it("should accept valid sort fields", () => {
        const validSortFields = ["date", "amount", "description", "createdAt"];

        for (const sortBy of validSortFields) {
          const result = expenseQuerySchema.safeParse({ sortBy });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.sortBy).toBe(sortBy);
          }
        }
      });

      it("should reject invalid sort fields", () => {
        const result = expenseQuerySchema.safeParse({ sortBy: "invalidField" });
        expect(result.success).toBe(false);
      });

      it("should accept valid sort orders", () => {
        const validSortOrders = ["asc", "desc"];

        for (const sortOrder of validSortOrders) {
          const result = expenseQuerySchema.safeParse({ sortOrder });
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data.sortOrder).toBe(sortOrder);
          }
        }
      });

      it("should reject invalid sort orders", () => {
        const result = expenseQuerySchema.safeParse({ sortOrder: "invalid" });
        expect(result.success).toBe(false);
      });
    });

    describe("UUID validation", () => {
      it("should accept valid UUIDs for categoryId and teamId", () => {
        const result = expenseQuerySchema.safeParse({
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
          teamId: "550e8400-e29b-41d4-a716-446655440001",
        });
        expect(result.success).toBe(true);
      });

      it("should reject invalid UUIDs", () => {
        const result = expenseQuerySchema.safeParse({
          categoryId: "invalid-uuid",
          teamId: "also-invalid",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues).toHaveLength(2);
          expect(result.error.issues[0].message).toBe("Invalid category ID");
          expect(result.error.issues[1].message).toBe("Invalid team ID");
        }
      });
    });
  });
});
