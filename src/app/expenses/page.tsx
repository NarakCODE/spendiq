"use client";

import { ExpenseList } from "@/components/expenses/expense-list";
import { ExpenseFilters } from "@/components/expenses/expense-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";

export default function ExpensesPage() {
  const [filters, setFilters] = useState({
    categoryId: "",
    teamId: "",
    startDate: "",
    endDate: "",
    sortBy: "date" as const,
    sortOrder: "desc" as const,
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage all your expenses
          </p>
        </div>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      <ExpenseList filters={filters} />
    </div>
  );
}
