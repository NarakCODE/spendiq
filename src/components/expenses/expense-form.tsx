"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCategories } from "@/hooks/use-categories";
import { useExpenses } from "@/hooks/use-expenses";
import { IconLoader2, IconAlertCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import {
  expenseFormSchema,
  EXPENSE_VALIDATION,
} from "@/lib/validation/expense";
import { z } from "zod";
import { Category } from "@prisma/client";
import { DialogContent } from "../ui/dialog";

type ExpenseFormData = z.infer<typeof expenseFormSchema>;

// UI Constants
const UI_CONSTANTS = {
  TEXTAREA_MIN_HEIGHT: 100,
} as const;

// Default form values
const DEFAULT_FORM_VALUES = {
  amount: "",
  description: "",
  categoryId: "",
  date: new Date(),
  teamId: "",
} as const;

// Transform schema output to match API expectations
type ExpenseFormOutput = {
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  teamId?: string;
};

interface ExpenseFormProps {
  expense?: {
    id: string;
    amount: number;
    description: string;
    categoryId: string;
    date: string;
    teamId?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({
  expense,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { categories, isLoading: categoriesLoading } = useCategories();
  const {
    createExpense,
    updateExpense,
    isLoading: expenseLoading,
  } = useExpenses({
    onSuccess: () => {
      toast.success(
        isEditing
          ? "Expense updated successfully"
          : "Expense created successfully"
      );
      onSuccess?.();
    },
  });

  const isEditing = !!expense;

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: expense?.amount?.toString() || DEFAULT_FORM_VALUES.amount,
      description: expense?.description || DEFAULT_FORM_VALUES.description,
      categoryId: expense?.categoryId || DEFAULT_FORM_VALUES.categoryId,
      date: expense?.date ? new Date(expense.date) : DEFAULT_FORM_VALUES.date,
      teamId: expense?.teamId || DEFAULT_FORM_VALUES.teamId,
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    setError(null);

    try {
      // Transform form data to API format
      const expenseData: ExpenseFormOutput = {
        amount: parseFloat(data.amount),
        description: data.description.trim(),
        categoryId: data.categoryId,
        date: data.date.toISOString(),
        teamId: data.teamId || undefined,
      };

      if (isEditing && expense) {
        await updateExpense(expense.id, expenseData);
      } else {
        await createExpense(expenseData);
        // Reset form after successful creation (but not for editing)
        form.reset({
          amount: DEFAULT_FORM_VALUES.amount,
          description: DEFAULT_FORM_VALUES.description,
          categoryId: DEFAULT_FORM_VALUES.categoryId,
          date: new Date(),
          teamId: DEFAULT_FORM_VALUES.teamId,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    }
  };

  const handleReset = () => {
    form.reset({
      amount: DEFAULT_FORM_VALUES.amount,
      description: DEFAULT_FORM_VALUES.description,
      categoryId: DEFAULT_FORM_VALUES.categoryId,
      date: new Date(),
      teamId: DEFAULT_FORM_VALUES.teamId,
    });
    setError(null);
  };

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].substring(0, 2);
    }

    return numericValue;
  };

  return (
    <>
      <DialogContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="text"
                          placeholder="0.00"
                          className="pl-8"
                          value={field.value}
                          onChange={(e) => {
                            const formatted = formatCurrency(e.target.value);
                            field.onChange(formatted);
                          }}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                        placeholder="Select expense date"
                        maxDate={new Date()}
                        disabled={expenseLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Select the date when this expense occurred
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Category Field */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={categoriesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            categoriesLoading
                              ? "Loading categories..."
                              : "Select a category"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the category that best describes this expense
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter expense description..."
                      className={`min-h-[${UI_CONSTANTS.TEXTAREA_MIN_HEIGHT}px]`}
                      maxLength={EXPENSE_VALIDATION.DESCRIPTION.MAX}
                    />
                  </FormControl>
                  <div className="text-sm text-muted-foreground text-right">
                    {field.value?.length || 0}/
                    {EXPENSE_VALIDATION.DESCRIPTION.MAX}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                disabled={expenseLoading || categoriesLoading}
                className="flex-1 sm:flex-none"
              >
                {expenseLoading && (
                  <IconLoader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-testid="loading-spinner"
                  />
                )}
                {isEditing ? "Update Expense" : "Create Expense"}
              </Button>

              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={expenseLoading}
                  className="flex-1 sm:flex-none"
                >
                  Reset Form
                </Button>
              )}

              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={expenseLoading}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </>
  );
}
