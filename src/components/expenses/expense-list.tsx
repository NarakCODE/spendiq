"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconDotsVertical,
  IconReceipt,
  IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface ExpenseListProps {
  filters: {
    categoryId: string;
    teamId: string;
    startDate: string;
    endDate: string;
    sortBy: "date" | "amount" | "description" | "createdAt";
    sortOrder: "asc" | "desc";
  };
  onEditExpense?: (expense: Expense) => void;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  receiptUrl?: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon?: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  team?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ExpenseResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ExpenseList({ filters, onEditExpense }: ExpenseListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: currentPage.toString(),
    limit: limit.toString(),
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  if (filters.categoryId) queryParams.set("categoryId", filters.categoryId);
  if (filters.teamId) queryParams.set("teamId", filters.teamId);
  if (filters.startDate)
    queryParams.set("startDate", new Date(filters.startDate).toISOString());
  if (filters.endDate)
    queryParams.set("endDate", new Date(filters.endDate).toISOString());

  // Fetch expenses
  const { data, isLoading, error, refetch } = useQuery<ExpenseResponse>({
    queryKey: ["expenses", currentPage, filters],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return response.json();
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      toast.success("Expense deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load expenses. Please try again.
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {data ? `${data.pagination.total} Expenses` : "Expenses"}
          </CardTitle>
          {data && data.pagination.total > 0 && (
            <div className="text-sm text-muted-foreground">
              Showing {(data.pagination.page - 1) * data.pagination.limit + 1}{" "}
              to{" "}
              {Math.min(
                data.pagination.page * data.pagination.limit,
                data.pagination.total
              )}{" "}
              of {data.pagination.total} expenses
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))}
          </div>
        ) : data && data.expenses.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expense.receiptUrl ? (
                          <IconReceipt className="h-4 w-4 text-green-600" />
                        ) : (
                          <IconReceipt className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">
                            {expense.description}
                          </div>
                          {expense.team && (
                            <div className="text-sm text-muted-foreground">
                              Team: {expense.team.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-white"
                        style={{ backgroundColor: expense.category.color }}
                      >
                        {expense.category.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(expense.date)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEditExpense?.(expense)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          {expense.receiptUrl && (
                            <DropdownMenuItem>View Receipt</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {Array.from(
                      { length: Math.min(5, data.pagination.totalPages) },
                      (_, i) => {
                        let pageNumber;
                        if (data.pagination.totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (
                          currentPage >=
                          data.pagination.totalPages - 2
                        ) {
                          pageNumber = data.pagination.totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNumber)}
                              isActive={currentPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    )}

                    {data.pagination.totalPages > 5 &&
                      currentPage < data.pagination.totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage(
                            Math.min(
                              data.pagination.totalPages,
                              currentPage + 1
                            )
                          )
                        }
                        className={
                          currentPage === data.pagination.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <IconReceipt className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No expenses found</h3>
            <p className="mt-2 text-muted-foreground">
              {Object.values(filters).some(Boolean)
                ? "Try adjusting your filters to see more expenses."
                : "Get started by adding your first expense."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
