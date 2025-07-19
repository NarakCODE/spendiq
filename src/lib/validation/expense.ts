import { z } from "zod";

// Centralized validation constants
export const EXPENSE_VALIDATION = {
  AMOUNT: {
    MIN: 0.01,
    MAX: 99999999.99,
    MAX_DECIMAL_PLACES: 2,
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
export const amountValidator = z
  .number()
  .min(
    EXPENSE_VALIDATION.AMOUNT.MIN,
    `Amount must be at least $${EXPENSE_VALIDATION.AMOUNT.MIN}`
  )
  .max(
    EXPENSE_VALIDATION.AMOUNT.MAX,
    `Amount cannot exceed $${EXPENSE_VALIDATION.AMOUNT.MAX.toLocaleString()}`
  )
  .multipleOf(
    0.01,
    `Amount can have at most ${EXPENSE_VALIDATION.AMOUNT.MAX_DECIMAL_PLACES} decimal places`
  );

// String amount validator for forms
export const amountStringValidator = z
  .string()
  .min(1, "Amount is required")
  .refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Please enter a valid amount")
  .refine((val) => {
    const num = parseFloat(val);
    return num >= EXPENSE_VALIDATION.AMOUNT.MIN;
  }, `Amount must be at least $${EXPENSE_VALIDATION.AMOUNT.MIN}`)
  .refine((val) => {
    const num = parseFloat(val);
    return num <= EXPENSE_VALIDATION.AMOUNT.MAX;
  }, `Amount cannot exceed $${EXPENSE_VALIDATION.AMOUNT.MAX.toLocaleString()}`)
  .refine((val) => {
    const decimalPart = val.split(".")[1];
    return (
      !decimalPart ||
      decimalPart.length <= EXPENSE_VALIDATION.AMOUNT.MAX_DECIMAL_PLACES
    );
  }, `Amount can have at most ${EXPENSE_VALIDATION.AMOUNT.MAX_DECIMAL_PLACES} decimal places`);

export const descriptionValidator = z
  .string()
  .trim()
  .min(EXPENSE_VALIDATION.DESCRIPTION.MIN, "Description is required")
  .max(
    EXPENSE_VALIDATION.DESCRIPTION.MAX,
    `Description cannot exceed ${EXPENSE_VALIDATION.DESCRIPTION.MAX} characters`
  )
  .refine((val) => val.trim().length > 0, "Description cannot be empty");

// Date validator for API (string format)
export const dateStringValidator = z
  .string()
  .refine((val) => {
    try {
      const date = new Date(val);
      return !isNaN(date.getTime()) && val.includes("T") && val.includes("Z");
    } catch {
      return false;
    }
  }, "Invalid date format")
  .refine((date) => {
    const expenseDate = new Date(date);
    const now = new Date();
    return expenseDate <= now;
  }, "Expense date cannot be in the future");

// Date validator for forms (Date object)
export const dateValidator = z
  .date({ message: "Please select a valid date" })
  .refine((date) => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return date <= now;
  }, "Expense date cannot be in the future");

export const receiptUrlValidator = z
  .string()
  .refine((val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Invalid receipt URL")
  .max(EXPENSE_VALIDATION.RECEIPT_URL_MAX_LENGTH, "Receipt URL too long")
  .optional();

// Reusable UUID validator
const uuidValidator = (fieldName: string) =>
  z
    .string()
    .regex(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      `Invalid ${fieldName}`
    );

export const categoryIdValidator = uuidValidator("category ID");
export const teamIdValidator = uuidValidator("team ID").optional();

// Reusable date string validator for query parameters
const dateStringQueryValidator = (fieldName: string) =>
  z
    .string()
    .refine((val) => {
      try {
        const date = new Date(val);
        return !isNaN(date.getTime()) && val.includes("T");
      } catch {
        return false;
      }
    }, `Invalid ${fieldName} format`)
    .optional();

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

// Form schema for client-side validation (uses string amount and Date object)
export const expenseFormSchema = z.object({
  amount: amountStringValidator,
  description: descriptionValidator,
  categoryId: categoryIdValidator,
  date: dateValidator,
  teamId: z.string().optional(),
});

// API schema for expense creation (uses number amount and string date)
export const createExpenseSchema = z.object({
  amount: amountValidator,
  description: descriptionValidator,
  categoryId: categoryIdValidator,
  date: dateStringValidator,
  receiptUrl: receiptUrlValidator,
  teamId: teamIdValidator,
});

// API schema for expense updates (all fields optional)
export const updateExpenseSchema = z.object({
  amount: amountValidator.optional(),
  description: descriptionValidator.optional(),
  categoryId: categoryIdValidator.optional(),
  date: dateStringValidator.optional(),
  receiptUrl: receiptUrlValidator.nullable(),
  teamId: teamIdValidator.nullable(),
});

// Query parameters for filtering expenses
export const expenseQuerySchema = z
  .object({
    page: positiveIntegerString(
      "Page",
      EXPENSE_VALIDATION.PAGINATION.MIN_PAGE,
      EXPENSE_VALIDATION.PAGINATION.MAX_PAGE
    )
      .optional()
      .default(EXPENSE_VALIDATION.PAGINATION.DEFAULT_PAGE),
    limit: positiveIntegerString(
      "Limit",
      EXPENSE_VALIDATION.PAGINATION.MIN_LIMIT,
      EXPENSE_VALIDATION.PAGINATION.MAX_LIMIT
    )
      .optional()
      .default(EXPENSE_VALIDATION.PAGINATION.DEFAULT_LIMIT),
    categoryId: uuidValidator("category ID").optional(),
    teamId: uuidValidator("team ID").optional(),
    startDate: dateStringQueryValidator("start date"),
    endDate: dateStringQueryValidator("end date"),
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
