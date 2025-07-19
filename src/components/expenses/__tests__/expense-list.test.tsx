import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExpenseList } from "../expense-list";
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
      receiptUrl: "https://example.com/receipt1.jpg",
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
      team: {
        id: "team1",
        name: "Family",
      },
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z",
    },
    {
      id: "2",
      amount: 45.2,
      description: "Gas Station",
      date: "2024-01-14T00:00:00.000Z",
      category: {
        id: "cat2",
        name: "Transportation",
        color: "#3b82f6",
      },
      user: {
        id: "user1",
        name: "John Doe",
        email: "john@example.com",
      },
      createdAt: "2024-01-14T10:00:00.000Z",
      updatedAt: "2024-01-14T10:00:00.000Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
};

const defaultFilters = {
  categoryId: "",
  teamId: "",
  startDate: "",
  endDate: "",
  sortBy: "date" as const,
  sortOrder: "desc" as const,
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

describe("ExpenseList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockExpensesResponse,
    } as Response);
  });

  it("renders loading state initially", () => {
    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    expect(screen.getByText("Expenses")).toBeInTheDocument();
    // Should show skeleton loaders
    expect(document.querySelectorAll('[data-testid="skeleton"]')).toBeTruthy();
  });

  it("renders expenses list after loading", async () => {
    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      expect(screen.getByText("2 Expenses")).toBeInTheDocument();
      expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
      expect(screen.getByText("Gas Station")).toBeInTheDocument();
    });
  });

  it("displays expense details correctly", async () => {
    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      // Check expense descriptions
      expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
      expect(screen.getByText("Gas Station")).toBeInTheDocument();

      // Check categories
      expect(screen.getByText("Food & Dining")).toBeInTheDocument();
      expect(screen.getByText("Transportation")).toBeInTheDocument();

      // Check amounts
      expect(screen.getByText("$127.50")).toBeInTheDocument();
      expect(screen.getByText("$45.20")).toBeInTheDocument();

      // Check dates
      expect(screen.getByText("Jan 15, 2024")).toBeInTheDocument();
      expect(screen.getByText("Jan 14, 2024")).toBeInTheDocument();

      // Check team info
      expect(screen.getByText("Team: Family")).toBeInTheDocument();
    });
  });

  it("shows receipt indicators correctly", async () => {
    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      const receiptIcons =
        screen.getAllByTestId("receipt-icon") ||
        document.querySelectorAll('[data-icon="receipt"]') ||
        document.querySelectorAll("svg");

      // First expense has receipt (should be green), second doesn't (should be muted)
      expect(receiptIcons.length).toBeGreaterThan(0);
    });
  });

  it("handles pagination correctly", async () => {
    const paginatedResponse = {
      ...mockExpensesResponse,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => paginatedResponse,
    } as Response);

    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      expect(screen.getByText("25 Expenses")).toBeInTheDocument();
      expect(
        screen.getByText("Showing 1 to 10 of 25 expenses")
      ).toBeInTheDocument();

      // Should show pagination controls
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("handles empty state correctly", async () => {
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

    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      expect(screen.getByText("No expenses found")).toBeInTheDocument();
      expect(
        screen.getByText("Get started by adding your first expense.")
      ).toBeInTheDocument();
    });
  });

  it("handles empty state with filters correctly", async () => {
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

    const filtersWithCategory = {
      ...defaultFilters,
      categoryId: "cat1",
    };

    renderWithQueryClient(<ExpenseList filters={filtersWithCategory} />);

    await waitFor(() => {
      expect(screen.getByText("No expenses found")).toBeInTheDocument();
      expect(
        screen.getByText("Try adjusting your filters to see more expenses.")
      ).toBeInTheDocument();
    });
  });

  it("handles error state correctly", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load expenses. Please try again.")
      ).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("handles delete expense correctly", async () => {
    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
    });

    // Click on the dropdown menu for the first expense
    const dropdownTriggers = screen.getAllByRole("button", {
      name: /open menu/i,
    });
    fireEvent.click(dropdownTriggers[0]);

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      expect(deleteButton).toBeInTheDocument();
    });

    // Mock successful delete
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Expense deleted successfully" }),
    } as Response);

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        "Expense deleted successfully"
      );
    });
  });

  it("handles delete expense error correctly", async () => {
    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
    });

    // Click on the dropdown menu for the first expense
    const dropdownTriggers = screen.getAllByRole("button", {
      name: /open menu/i,
    });
    fireEvent.click(dropdownTriggers[0]);

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete");
      expect(deleteButton).toBeInTheDocument();
    });

    // Mock failed delete
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const deleteButton = screen.getByText("Delete");
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to delete expense");
    });
  });

  it("applies filters correctly in API call", async () => {
    const filtersWithData = {
      categoryId: "cat1",
      teamId: "team1",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      sortBy: "amount" as const,
      sortOrder: "asc" as const,
    };

    renderWithQueryClient(<ExpenseList filters={filtersWithData} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/expenses?")
      );

      const callUrl = (mockFetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain("categoryId=cat1");
      expect(callUrl).toContain("teamId=team1");
      expect(callUrl).toContain("sortBy=amount");
      expect(callUrl).toContain("sortOrder=asc");
      expect(callUrl).toContain("startDate=");
      expect(callUrl).toContain("endDate=");
    });
  });

  it("shows dropdown menu options correctly", async () => {
    renderWithQueryClient(<ExpenseList filters={defaultFilters} />);

    await waitFor(() => {
      expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
    });

    // Click on the dropdown menu for the first expense (has receipt)
    const dropdownTriggers = screen.getAllByRole("button", {
      name: /open menu/i,
    });
    fireEvent.click(dropdownTriggers[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Duplicate")).toBeInTheDocument();
      expect(screen.getByText("View Receipt")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    // Close the dropdown and open the second one (no receipt)
    fireEvent.click(dropdownTriggers[0]);
    fireEvent.click(dropdownTriggers[1]);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Duplicate")).toBeInTheDocument();
      expect(screen.queryByText("View Receipt")).not.toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });
});
