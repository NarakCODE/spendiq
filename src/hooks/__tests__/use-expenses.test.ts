import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useExpenses } from "../use-expenses";
import { toast } from "sonner";

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockExpensesResponse = {
  expenses: [
    {
      id: "1",
      amount: 127.5,
      description: "Grocery Shopping",
      date: "2024-01-15T00:00:00.000Z",
      category: {
        id: "cat1",
        name: "Food & Dining",
        color: "#10b981",
      },
      user: {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
      },
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useExpenses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockExpensesResponse,
    } as Response);
  });

  it("fetches expenses successfully", async () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.expenses).toEqual(mockExpensesResponse.expenses);
      expect(result.current.pagination).toEqual(
        mockExpensesResponse.pagination
      );
      expect(result.current.error).toBeNull();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/expenses?");
  });

  it("applies filters correctly in API call", async () => {
    const filters = {
      categoryId: "cat1",
      teamId: "team1",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      sortBy: "amount" as const,
      sortOrder: "asc" as const,
      page: 2,
      limit: 20,
    };

    renderHook(() => useExpenses({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/expenses?")
      );

      const callUrl = (mockFetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("categoryId=cat1");
      expect(callUrl).toContain("teamId=team1");
      expect(callUrl).toContain("startDate=2024-01-01");
      expect(callUrl).toContain("endDate=2024-01-31");
      expect(callUrl).toContain("sortBy=amount");
      expect(callUrl).toContain("sortOrder=asc");
      expect(callUrl).toContain("page=2");
      expect(callUrl).toContain("limit=20");
    });
  });

  it("handles empty filters correctly", async () => {
    const filters = {
      categoryId: "",
      teamId: "",
      startDate: "",
      endDate: "",
    };

    renderHook(() => useExpenses({ filters }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/expenses?");
    });
  });

  it("creates expense successfully", async () => {
    const mockOnSuccess = jest.fn();
    const { result } = renderHook(
      () => useExpenses({ onSuccess: mockOnSuccess }),
      {
        wrapper: createWrapper(),
      }
    );

    const newExpense = {
      amount: 50.0,
      description: "Test Expense",
      categoryId: "cat1",
      date: "2024-01-15T00:00:00.000Z",
    };

    const createdExpense = {
      id: "2",
      ...newExpense,
      category: { id: "cat1", name: "Food & Dining", color: "#10b981" },
      user: { id: "user1", name: "John Doe", email: "john@example.com" },
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createdExpense,
    } as Response);

    await result.current.createExpense(newExpense);

    expect(mockFetch).toHaveBeenCalledWith("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newExpense),
    });

    expect(toast.success).toHaveBeenCalledWith("Expense created successfully");
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("handles create expense error", async () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    const newExpense = {
      amount: 50.0,
      description: "Test Expense",
      categoryId: "cat1",
      date: "2024-01-15T00:00:00.000Z",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid category" }),
    } as Response);

    await expect(result.current.createExpense(newExpense)).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Invalid category");
  });

  it("updates expense successfully", async () => {
    const mockOnSuccess = jest.fn();
    const { result } = renderHook(
      () => useExpenses({ onSuccess: mockOnSuccess }),
      {
        wrapper: createWrapper(),
      }
    );

    const updateData = {
      amount: 75.0,
      description: "Updated Expense",
    };

    const updatedExpense = {
      id: "1",
      ...updateData,
      categoryId: "cat1",
      date: "2024-01-15T00:00:00.000Z",
      category: { id: "cat1", name: "Food & Dining", color: "#10b981" },
      user: { id: "user1", name: "John Doe", email: "john@example.com" },
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T11:00:00.000Z",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedExpense,
    } as Response);

    await result.current.updateExpense("1", updateData);

    expect(mockFetch).toHaveBeenCalledWith("/api/expenses/1", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    expect(toast.success).toHaveBeenCalledWith("Expense updated successfully");
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("handles update expense error", async () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    const updateData = {
      amount: 75.0,
      description: "Updated Expense",
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Expense not found" }),
    } as Response);

    await expect(
      result.current.updateExpense("1", updateData)
    ).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Expense not found");
  });

  it("deletes expense successfully", async () => {
    const mockOnSuccess = jest.fn();
    const { result } = renderHook(
      () => useExpenses({ onSuccess: mockOnSuccess }),
      {
        wrapper: createWrapper(),
      }
    );

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Expense deleted successfully" }),
    } as Response);

    await result.current.deleteExpense("1");

    expect(mockFetch).toHaveBeenCalledWith("/api/expenses/1", {
      method: "DELETE",
    });

    expect(toast.success).toHaveBeenCalledWith("Expense deleted successfully");
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("handles delete expense error", async () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Access denied" }),
    } as Response);

    await expect(result.current.deleteExpense("1")).rejects.toThrow();
    expect(toast.error).toHaveBeenCalledWith("Access denied");
  });

  it("handles fetch error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.expenses).toEqual([]);
    });
  });

  it("sets loading state correctly during mutations", async () => {
    const { result } = renderHook(() => useExpenses(), {
      wrapper: createWrapper(),
    });

    // Mock a slow response
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({}),
              } as Response),
            100
          )
        )
    );

    const createPromise = result.current.createExpense({
      amount: 50.0,
      description: "Test Expense",
      categoryId: "cat1",
      date: "2024-01-15T00:00:00.000Z",
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);

    await createPromise;

    // Should not be loading anymore
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
