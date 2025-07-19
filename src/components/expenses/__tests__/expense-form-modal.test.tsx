import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExpenseFormModal } from "../expense-form-modal";
import { useCategories } from "@/hooks/use-categories";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock dependencies
vi.mock("@/hooks/use-categories");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the ExpenseForm component to isolate modal behavior
vi.mock("../expense-form", () => ({
  ExpenseForm: ({ onSuccess, onCancel, expense }: any) => (
    <div data-testid="expense-form">
      <div data-testid="form-mode">{expense ? "Edit Mode" : "Create Mode"}</div>
      <button onClick={onSuccess} data-testid="form-success">
        Submit Form
      </button>
      <button onClick={onCancel} data-testid="form-cancel">
        Cancel
      </button>
      {expense && (
        <div data-testid="expense-data">
          {expense.amount}-{expense.description}
        </div>
      )}
    </div>
  ),
}));

const mockUseCategories = vi.mocked(useCategories);

const mockCategories = [
  { id: "1", name: "Food & Dining", color: "#10b981" },
  { id: "2", name: "Transportation", color: "#3b82f6" },
];

/**
 * Test utility to render components with QueryClient provider
 * Ensures consistent test setup and prevents query caching issues
 */
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

describe("ExpenseFormModal", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock return value
    mockUseCategories.mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      createCategory: vi.fn(),
      updateCategory: vi.fn(),
      deleteCategory: vi.fn(),
      refresh: vi.fn(),
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Modal Visibility", () => {
    it("renders modal when open prop is true", () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Add New Expense")).toBeInTheDocument();
      expect(screen.getByTestId("expense-form")).toBeInTheDocument();
    });

    it("does not render modal when open prop is false", () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={false}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText("Add New Expense")).not.toBeInTheDocument();
    });
  });

  describe("Modal Title", () => {
    it("shows 'Add New Expense' title when no expense is provided", () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Add New Expense")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("Create Mode");
    });

    it("shows 'Edit Expense' title when expense is provided", () => {
      const mockExpense = {
        id: "expense-1",
        amount: 50,
        description: "Test expense",
        categoryId: "1",
        date: "2024-01-15T00:00:00.000Z",
      };

      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          expense={mockExpense}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText("Edit Expense")).toBeInTheDocument();
      expect(screen.getByTestId("form-mode")).toHaveTextContent("Edit Mode");
      expect(screen.getByTestId("expense-data")).toHaveTextContent(
        "50-Test expense"
      );
    });
  });

  describe("Modal Interactions", () => {
    it("calls onOpenChange with false when dialog is closed via overlay", async () => {
      const user = userEvent.setup();

      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      // Simulate clicking outside the modal (overlay click)
      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" });

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("calls onOpenChange with false when form cancel is triggered", async () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const cancelButton = screen.getByTestId("form-cancel");
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("calls both onOpenChange and onSuccess when form is submitted successfully", async () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const submitButton = screen.getByTestId("form-success");
      fireEvent.click(submitButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });

    it("only calls onOpenChange when onSuccess is not provided", async () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          // onSuccess not provided
        />
      );

      const submitButton = screen.getByTestId("form-success");
      fireEvent.click(submitButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Expense Data Handling", () => {
    it("passes expense data correctly to ExpenseForm", () => {
      const mockExpense = {
        id: "expense-1",
        amount: 75.5,
        description: "Existing expense",
        categoryId: "2",
        date: "2024-01-10T00:00:00.000Z",
        teamId: "team-1",
      };

      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          expense={mockExpense}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId("expense-data")).toHaveTextContent(
        "75.5-Existing expense"
      );
    });

    it("handles expense without optional teamId", () => {
      const mockExpense = {
        id: "expense-1",
        amount: 25.99,
        description: "Simple expense",
        categoryId: "1",
        date: "2024-01-15T00:00:00.000Z",
      };

      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          expense={mockExpense}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByTestId("expense-data")).toHaveTextContent(
        "25.99-Simple expense"
      );
    });
  });

  describe("Accessibility", () => {
    it("has proper modal accessibility attributes", () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("has proper modal styling classes", () => {
      renderWithQueryClient(
        <ExpenseFormModal
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
        />
      );

      const dialogContent = screen.getByRole("dialog").parentElement;
      expect(dialogContent).toHaveClass("max-w-2xl");
      expect(dialogContent).toHaveClass("max-h-[90vh]");
      expect(dialogContent).toHaveClass("overflow-y-auto");
    });
  });

  describe("Error Handling", () => {
    it("handles missing required props gracefully", () => {
      // This test ensures the component doesn't crash with minimal props
      expect(() => {
        renderWithQueryClient(
          <ExpenseFormModal open={true} onOpenChange={mockOnOpenChange} />
        );
      }).not.toThrow();
    });
  });
});
