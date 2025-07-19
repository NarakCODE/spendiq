import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryFormData } from "@/lib/validation/category";

interface UseCategoriesOptions {
  teamId?: string;
  onSuccess?: () => void;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { teamId, onSuccess } = options;
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Query key for categories
  const categoriesQueryKey = ["categories", { teamId }];

  // Fetch categories
  const fetchCategories = async () => {
    const queryParams = teamId ? `?teamId=${teamId}` : "";
    const response = await fetch(`/api/categories${queryParams}`);
    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }
    return response.json();
  };

  const { data: categories, error } = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: fetchCategories,
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          teamId: teamId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      toast.success("Category created successfully");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create category"
      );
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CategoryFormData>;
    }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      toast.success("Category updated successfully");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category"
      );
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      toast.success("Category deleted successfully");
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    },
  });

  // Wrapper functions to maintain the same API
  const createCategory = async (data: CategoryFormData) => {
    setIsLoading(true);
    try {
      return await createCategoryMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (
    id: string,
    data: Partial<CategoryFormData>
  ) => {
    setIsLoading(true);
    try {
      return await updateCategoryMutation.mutateAsync({ id, data });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setIsLoading(true);
    try {
      return await deleteCategoryMutation.mutateAsync(id);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    categories,
    isLoading:
      isLoading ||
      createCategoryMutation.isPending ||
      updateCategoryMutation.isPending ||
      deleteCategoryMutation.isPending,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh: () =>
      queryClient.invalidateQueries({ queryKey: categoriesQueryKey }),
  };
}
