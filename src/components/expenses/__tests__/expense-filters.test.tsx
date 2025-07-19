import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExpenseFilters } from "../expense-filters";
import { useCategories } from "@/hooks/use-categories";

// Mock the useCategories hook
jest.mock("@/hooks/use-categories");
const mockUseCategories = useCategories as jest.MockedFunction<
  typeof useCategories
>;

const mockCategories = [
  { id: "1", name: "Food & Dining", color: "#10b981" },
  { id: "2", name: "Transportation", color: "#3b82f6" },
  { id: "3", name: "Entertainment", color: "#8b5cf6" },
];

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

describe("ExpenseFilters", () => {
  const mockOnFiltersChange = jest.fn();

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
  });

  it("renders all filter controls", () => {
    renderWithQueryClient(
      <ExpenseFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort By")).toBeInTheDocument();
    expect(screen.getByLabelText("Order:")).toBeInTheDocument();
  });

  it("displays categories in the category filter", async () => {
    renderWithQueryClient(
      <ExpenseFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categorySelect = screen.getByLabelText("Category");
    fireEvent.click(categorySelect);

    await waitFor(() => {
      expect(screen.getByText("All categories")).toBeInTheDocument();
      expect(screen.getByText("Food & Dining")).toBeInTheDocument();
      expect(screen.getByText("Transportation")).toBeInTheDocument();
      expect(screen.getByText("Entertainment")).toBeInTheDocument();
    });
  });

  it("calls onFiltersChange when category is selected", async () => {
    renderWithQueryClient(
      <ExpenseFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categorySelect = screen.getByLabelText("Category");
    fireEvent.click(categorySelect);

    await waitFor(() => {
      const foodOption = screen.getByText("Food & Dining");
      fireEvent.click(foodOption);
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      categoryId: "1",
    });
  });

  it("calls onFiltersChange when date filters are changed", () => {
    renderWithQueryClient(
      <ExpenseFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const startDateInput = screen.getByLabelText("Start Date");
    fireEvent.change(startDateInput, { target: { value: "2024-01-01" } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      startDate: "2024-01-01",
    });

    const endDateInput = screen.getByLabelText("End Date");
    fireEvent.change(endDateInput, { target: { value: "2024-01-31" } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      endDate: "2024-01-31",
    });
  });

  it("calls onFiltersChange when sort options are changed", async () => {
    renderWithQueryClient(
      <ExpenseFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const sortBySelect = screen.getByLabelText("Sort By");
    fireEvent.click(sortBySelect);

    await waitFor(() => {
      const amountOption = screen.getByText("Amount");
      fireEvent.click(amountOption);
    });

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      ...defaultFilters,
      sortBy: "amount",
    });
  });

  it("shows clear filters button when filters are active", () => {
    const activeFilters = {
      ...defaultFilters,
      categoryId: "1",
      startDate: "2024-01-01",
    };

    renderWithQueryClient(
      <ExpenseFilters
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByText("Clear Filters")).toBeInTheDocument();
  });

  it("hides clear filters button when no filters are active", () => {
    renderWithQueryClient(
      <ExpenseFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.queryByText("Clear Filters")).not.toBeInTheDocument();
  });

  it("clears all filters when clear button is clicked", () => {
    const activeFilters = {
      ...defaultFilters,
      categoryId: "1",
      startDate: "2024-01-01",
      sortBy: "amount" as const,
      sortOrder: "asc" as const,
    };

    renderWithQueryClient(
      <ExpenseFilters
        filters={activeFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const clearButton = screen.getByText("Clear Filters");
    fireEvent.click(clearButton);

    expect(mockOnFiltersChange).toHaveBeenCalledWith(defaultFilters);
  });

  it("handles loading state when categories are loading", () => {
    mockUseCategories.mockReturnValue({
      categories: undefined,
      isLoading: true,
      error: null,
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
      refresh: jest.fn(),
    });

    renderWithQueryClient(
      <ExpenseFilters
        filters={defaultFilters}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const categorySelect = screen.getByLabelText("Category");
    fireEvent.click(categorySelect);

    // Should only show "All categories" option when loading
    expect(screen.getByText("All categories")).toBeInTheDocument();
    expect(screen.queryByText("Food & Dining")).not.toBeInTheDocument();
  });
});
