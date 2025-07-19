import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseQueryParams,
} from "@/lib/validation/expense";

interface UseExpensesOptions {
  filters?: Partial<ExpenseQueryParams>;
  onSuccess?: () => void;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const { filters = {}, onSuccess } = options;
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Build query parameters
  const queryParams = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      queryParams.set(key, value.toString());
    }
  });

  // Query key for expenses
  const expensesQueryKey = ["expenses", filters];

  // Fetch expenses
  const fetchExpenses = async () => {
    const response = await fetch(`/api/expenses?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch expenses");
    }
    return response.json();
  };

  const { data, error, refetch } = useQuery({
    queryKey: expensesQueryKey,
    queryFn: fetchExpenses,
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (data: CreateExpenseInput) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create expense");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense created successfully");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create expense"
      );
    },
  });

  // Update expense mutation
  const updateExpenseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateExpenseInput;
    }) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update expense");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated successfully");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update expense"
      );
    },
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense deleted successfully");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete expense"
      );
    },
  });

  // Wrapper functions to maintain the same API
  const createExpense = async (data: CreateExpenseInput) => {
    setIsLoading(true);
    try {
      return await createExpenseMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const updateExpense = async (id: string, data: UpdateExpenseInput) => {
    setIsLoading(true);
    try {
      return await updateExpenseMutation.mutateAsync({ id, data });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    setIsLoading(true);
    try {
      return await deleteExpenseMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    expenses: data?.expenses || [],
    pagination: data?.pagination,
    isLoading:
      isLoading ||
      createExpenseMutation.isPending ||
      updateExpenseMutation.isPending ||
      deleteExpenseMutation.isPending,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
  };
}
