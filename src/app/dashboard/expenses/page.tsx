"use client";

import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { ExpenseFormModal } from "@/components/expenses/expense-form-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function ExpensesPage() {
  const [filters, setFilters] = useState<{
    categoryId: string;
    teamId: string;
    startDate: string;
    endDate: string;
    sortBy: "date" | "amount" | "description" | "createdAt";
    sortOrder: "desc" | "asc";
  }>({
    categoryId: "",
    teamId: "",
    startDate: "",
    endDate: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<{
    id: string;
    amount: number;
    description: string;
    categoryId: string;
    date: string;
    teamId?: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const handleExpenseSuccess = () => {
    // Invalidate and refetch expenses
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense({
      id: expense.id,
      amount: expense.amount,
      description: expense.description,
      categoryId: expense.category.id,
      date: expense.date,
      teamId: expense.team?.id,
    });
  };

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              Track and manage all your expenses
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseFilters filters={filters} onFiltersChange={setFilters} />
          </CardContent>
        </Card>

        <ExpenseList filters={filters} onEditExpense={handleEditExpense} />
      </div>

      <ExpenseFormModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleExpenseSuccess}
      />

      <ExpenseFormModal
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
        expense={editingExpense || undefined}
        onSuccess={handleExpenseSuccess}
      />
    </div>
  );
}
