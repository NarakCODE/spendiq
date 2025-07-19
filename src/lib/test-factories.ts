import { Decimal } from "@prisma/client/runtime/library";

/**
 * Test data factories for consistent test data creation
 */

// User factories
export const createMockUser = (overrides = {}) => ({
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

// Team factories
export const createMockTeam = (overrides = {}) => ({
  id: "team-123",
  name: "Test Team",
  createdAt: new Date("2024-01-15T10:00:00.000Z"),
  updatedAt: new Date("2024-01-15T10:00:00.000Z"),
  ...overrides,
});

export const createMockTeamMember = (overrides = {}) => ({
  id: "member-123",
  userId: "user-123",
  teamId: "team-123",
  role: "ADMIN" as const,
  createdAt: new Date("2024-01-15T10:00:00.000Z"),
  updatedAt: new Date("2024-01-15T10:00:00.000Z"),
  ...overrides,
});

// Category factories
export const createMockCategory = (overrides = {}) => ({
  id: "category-123",
  name: "Test Category",
  color: "#FF5733",
  icon: "utensils",
  isDefault: false,
  userId: "user-123",
  teamId: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

// Expense factories
export const createMockExpense = (overrides = {}) => ({
  id: "expense-123",
  amount: new Decimal(25.99),
  description: "Test expense",
  categoryId: "category-123",
  date: new Date("2024-01-15T12:00:00.000Z"),
  receiptUrl: null,
  userId: "user-123",
  teamId: null,
  createdAt: new Date("2024-01-15T12:00:00.000Z"),
  updatedAt: new Date("2024-01-15T12:00:00.000Z"),
  ...overrides,
});

// Budget factories
export const createMockBudget = (overrides = {}) => ({
  id: "budget-123",
  name: "Test Budget",
  amount: new Decimal(500.0),
  categoryId: "category-123",
  startDate: new Date("2024-01-01T00:00:00.000Z"),
  endDate: new Date("2024-01-31T23:59:59.999Z"),
  userId: "user-123",
  teamId: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

// Request factories for API testing
export const createApiRequest = (
  url: string,
  method: string = "GET",
  body?: any,
  headers: Record<string, string> = {}
) => {
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  const options: RequestInit = {
    method,
    headers: defaultHeaders,
  };

  if (body && method !== "GET") {
    options.body = JSON.stringify(body);
  }

  return new Request(url, options);
};

// Response assertion helpers
export const expectApiError = async (
  response: Response,
  expectedStatus: number,
  expectedError?: string
) => {
  expect(response.status).toBe(expectedStatus);
  const data = await response.json();
  if (expectedError) {
    expect(data.error).toBe(expectedError);
  }
  return data;
};

export const expectApiSuccess = async (
  response: Response,
  expectedStatus: number = 200
) => {
  expect(response.status).toBe(expectedStatus);
  return await response.json();
};

// Database mock helpers
export const createMockPrismaTransaction = (mockOperations: any) => {
  return vi.fn().mockImplementation(async (callback) => {
    return await callback(mockOperations);
  });
};

// Date helpers for consistent test dates
export const TEST_DATES = {
  PAST: new Date("2023-12-01T00:00:00.000Z"),
  CURRENT: new Date("2024-01-15T12:00:00.000Z"),
  FUTURE: new Date("2024-12-31T23:59:59.999Z"),
} as const;

// Test constants
export const TEST_IDS = {
  USER: "user-123",
  TEAM: "team-123",
  CATEGORY: "category-123",
  EXPENSE: "expense-123",
  BUDGET: "budget-123",
} as const;

export const TEST_URLS = {
  BASE: "http://localhost:3000",
  API_TEAMS: "http://localhost:3000/api/teams",
  API_CATEGORIES: "http://localhost:3000/api/categories",
  API_EXPENSES: "http://localhost:3000/api/expenses",
  API_BUDGETS: "http://localhost:3000/api/budgets",
} as const;
