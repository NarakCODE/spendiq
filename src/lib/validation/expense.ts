import { z } from "zod";

// Constants for validation limits
const VALIDATION_LIMITS = {
  AMOUNT: {
    MIN: 0.01,
    MAX: 99999999.99,
  },
  DESCRIPTION: {
    MIN: 1,
    MAX: 500,
  },
  PAGINATION: {
    MIN_PAGE: 1,
    MAX_PAGE: 10000,
    MIN_LIMIT: 1,
    MAX_LIMIT: 100,
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
  },
  RECEIPT_URL_MAX_LENGTH: 2048,
} as const;

// Reusable field validators
const amountValidator = z
  .number()
  .min(VALIDATION_LIMITS.AMOUNT.MIN, "Amount must be at least $0.01")
  .max(VALIDATION_LIMITS.AMOUNT.MAX, "Amount cannot exceed $99,999,999.99")
  .multipleOf(0.01, "Amount must have at most 2 decimal places");

const descriptionValidator = z
  .string()
  .trim()
  .min(VALIDATION_LIMITS.DESCRIPTION.MIN, "Description is required")
  .max(
    VALIDATION_LIMITS.DESCRIPTION.MAX,
    "Description cannot exceed 500 characters"
  );

const categoryIdValidator = z.string().uuid("Invalid category ID");

const dateValidator = z
  .string()
  .datetime("Invalid date format")
  .refine((date) => {
    const expenseDate = new Date(date);
    const now = new Date();
    // Allow expenses up to current date/time
    return expenseDate <= now;
  }, "Expense date cannot be in the future");

const receiptUrlValidator = z
  .string()
  .url("Invalid receipt URL")
  .max(VALIDATION_LIMITS.RECEIPT_URL_MAX_LENGTH, "Receipt URL too long")
  .optional();

const teamIdValidator = z.string().uuid("Invalid team ID").optional();

// Positive integer validator for pagination
const positiveIntegerString = (fieldName: string, min: number, max: number) =>
  z
    .string()
    .regex(/^\d+$/, `${fieldName} must be a positive integer`)
    .transform(Number)
    .refine(
      (val) => val >= min && val <= max,
      `${fieldName} must be between ${min} and ${max}`
    );

// Expense creation schema
export const createExpenseSchema = z.object({
  amount: amountValidator,
  description: descriptionValidator,
  categoryId: categoryIdValidator,
  date: dateValidator,
  receiptUrl: receiptUrlValidator,
  teamId: teamIdValidator,
});

// Expense update schema (all fields optional)
export const updateExpenseSchema = z.object({
  amount: amountValidator.optional(),
  description: descriptionValidator.optional(),
  categoryId: categoryIdValidator.optional(),
  date: dateValidator.optional(),
  receiptUrl: receiptUrlValidator.nullable(),
  teamId: teamIdValidator.nullable(),
});

// Query parameters for filtering expenses
export const expenseQuerySchema = z
  .object({
    page: positiveIntegerString(
      "Page",
      VALIDATION_LIMITS.PAGINATION.MIN_PAGE,
      VALIDATION_LIMITS.PAGINATION.MAX_PAGE
    )
      .optional()
      .default(VALIDATION_LIMITS.PAGINATION.DEFAULT_PAGE.toString()),
    limit: positiveIntegerString(
      "Limit",
      VALIDATION_LIMITS.PAGINATION.MIN_LIMIT,
      VALIDATION_LIMITS.PAGINATION.MAX_LIMIT
    )
      .optional()
      .default(VALIDATION_LIMITS.PAGINATION.DEFAULT_LIMIT.toString()),
    categoryId: z.string().uuid("Invalid category ID").optional(),
    teamId: z.string().uuid("Invalid team ID").optional(),
    startDate: z.string().datetime("Invalid start date format").optional(),
    endDate: z.string().datetime("Invalid end date format").optional(),
    sortBy: z
      .enum(["date", "amount", "description", "createdAt"])
      .optional()
      .default("date"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .refine(
    (data) => {
      // Validate date range if both dates are provided
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["endDate"],
    }
  );

// Type exports
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryParams = z.infer<typeof expenseQuerySchema>;
