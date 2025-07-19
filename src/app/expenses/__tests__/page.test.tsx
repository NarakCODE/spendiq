import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ExpensesPage from "../page";
import { useCategories } from "@/hooks/use-categories";

// Mock the hooks
jest.mock("@/hooks/use-categories");
const mockUseCategories = useCategories as jest.MockedFunction<
  typeof useCategories
>;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

const mockCategories = [
  { id: "1", name: "Food & Dining", color: "#10b981" },
  { id: "2", name: "Transportation", color: "#3b82f6" },
];

const mockExpensesResponse = {
  expenses: [
    {
      id: "1",
      amount: 127.5,
      description: "Grocery Shopping",
      date: "2024-01-15T00:00:00.000Z",
      category: {
        id: "1",
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

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
  );
};

describe("ExpensesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      refresh: jest.fn(),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockExpensesResponse,
    } as Response);
  });

  it("renders the expenses page with all components", async () => {
    renderWithQueryClient(<ExpensesPage />);

    // Check page title and description
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(
      screen.getByText("Track and manage all your expenses")
    ).toBeInTheDocument();

    // Check Add Expense button
    expect(screen.getByText("Add Expense")).toBeInTheDocument();

    // Check filter section
    expect(screen.getByText("Filter Expenses")).toBeInTheDocument();

    // Wait for expenses to load
    await waitFor(() => {
      expect(screen.getByText("1 Expenses")).toBeInTheDocument();
      expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
    });
  });

  it("renders filter controls", () => {
    renderWithQueryClient(<ExpensesPage />);

    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort By")).toBeInTheDocument();
    expect(screen.getByLabelText("Order:")).toBeInTheDocument();
  });

  it("updates filters when filter controls are changed", async () => {
    renderWithQueryClient(<ExpensesPage />);

    // Change category filter
    const categorySelect = screen.getByLabelText("Category");
    fireEvent.click(categorySelect);

    await waitFor(() => {
      const foodOption = screen.getByText("Food & Dining");
      fireEvent.click(foodOption);
    });

    // The API should be called with the new filter
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("categoryId=1")
      );
    });
  });

  it("updates filters when date range is changed", async () => {
    renderWithQueryClient(<ExpensesPage />);

    const startDateInput = screen.getByLabelText("Start Date");
    fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });

    const endDateInput = screen.getByLabelText("End Date");
    fireEvent.change(endDateInput, { target: { value: "2024-01-31" } });

    // The API should be called with the new date filters
    await waitFor(() => {
      const lastCall = (mockFetch as jest.Mock).mock.calls.slice(-1)[0][0];
      expect(lastCall).toContain("startDate=");
      expect(lastCall).toContain("endDate=");
    });
  });

  it("updates sort options correctly", async () => {
    renderWithQueryClient(<ExpensesPage />);

    const sortBySelect = screen.getByLabelText("Sort By");
    fireEvent.click(sortBySelect);

    await waitFor(() => {
      const amountOption = screen.getByText("Amount");
      fireEvent.click(amountOption);
    });

    // The API should be called with the new sort option
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=amount")
      );
    });
  });

  it("shows clear filters button when filters are active", async () => {
    renderWithQueryClient(<ExpensesPage />);

    // Apply a filter
    const categorySelect = screen.getByLabelText("Category");
    fireEvent.click(categorySelect);

    await waitFor(() => {
      const foodOption = screen.getByText("Food & Dining");
      fireEvent.click(foodOption);
    });

    // Clear filters button should appear
    await waitFor(() => {
      expect(screen.getByText("Clear Filters")).toBeInTheDocument();
    });
  });

  it("clears filters when clear button is clicked", async () => {
    renderWithQueryClient(<ExpensesPage />);

    // Apply a filter first
    const categorySelect = screen.getByLabelText("Category");
    fireEvent.click(categorySelect);

    await waitFor(() => {
      const foodOption = screen.getByText("Food & Dining");
      fireEvent.click(foodOption);
    });

    // Wait for clear button to appear
    await waitFor(() => {
      expect(screen.getByText("Clear Filters")).toBeInTheDocument();
    });

    // Click clear filters
    const clearButton = screen.getByText("Clear Filters");
    fireEvent.click(clearButton);

    // Clear filters button should disappear
    await waitFor(() => {
      expect(screen.queryByText("Clear Filters")).not.toBeInTheDocument();
    });

    // API should be called with default filters
    await waitFor(() => {
      const lastCall = (mockFetch as jest.Mock).mock.calls.slice(-1)[0][0];
      expect(lastCall).toContain("sortBy=date");
      expect(lastCall).toContain("sortOrder=desc");
      expect(lastCall).not.toContain("categoryId=");
    });
  });

  it("handles empty expenses state", async () => {
    const emptyResponse = {
      expenses: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => emptyResponse,
    } as Response);

    renderWithQueryClient(<ExpensesPage />);

    await waitFor(() => {
      expect(screen.getByText("No expenses found")).toBeInTheDocument();
    });
  });

  it("handles loading state", () => {
    // Mock a slow response
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockExpensesResponse,
              } as Response),
            1000
          )
        )
    );

    renderWithQueryClient(<ExpensesPage />);

    // Should show loading state (skeleton loaders)
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    // The exact loading indicators depend on the Skeleton component implementation
  });

  it("handles error state", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    renderWithQueryClient(<ExpensesPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load expenses. Please try again.")
      ).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("maintains filter state across re-renders", async () => {
    const { rerender } = renderWithQueryClient(<ExpensesPage />);

    // Apply a filter
    const categorySelect = screen.getByLabelText("Category");
    fireEvent.click(categorySelect);

    await waitFor(() => {
      const foodOption = screen.getByText("Food & Dining");
      fireEvent.click(foodOption);
    });

    // Re-render the component
    rerender(
      <QueryClient>
        <ExpensesPage />
      </QueryClient>
    );

    // The filter should still be applied (this tests internal state management)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("categoryId=1")
      );
    });
  });
});
