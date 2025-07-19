"use client";

import * as React from "react";
import { IconDotsVertical, IconReceipt } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const recentExpenses = [
  {
    id: 1,
    description: "Grocery Shopping",
    amount: 127.5,
    category: "Food & Dining",
    date: "2024-01-15",
    status: "completed",
  },
  {
    id: 2,
    description: "Gas Station",
    amount: 45.2,
    category: "Transportation",
    date: "2024-01-14",
    status: "completed",
  },
  {
    id: 3,
    description: "Netflix Subscription",
    amount: 15.99,
    category: "Entertainment",
    date: "2024-01-14",
    status: "completed",
  },
  {
    id: 4,
    description: "Coffee Shop",
    amount: 8.75,
    category: "Food & Dining",
    date: "2024-01-13",
    status: "completed",
  },
  {
    id: 5,
    description: "Office Supplies",
    amount: 89.99,
    category: "Business",
    date: "2024-01-12",
    status: "pending",
  },
];

const categoryColors: Record<string, string> = {
  "Food & Dining": "bg-green-100 text-green-800",
  Transportation: "bg-blue-100 text-blue-800",
  Entertainment: "bg-purple-100 text-purple-800",
  Business: "bg-orange-100 text-orange-800",
};

export function RecentExpenses() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>
              Your latest transactions and spending activity
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
            {recentExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconReceipt className="size-4 text-muted-foreground" />
                    <span className="font-medium">{expense.description}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      categoryColors[expense.category] ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${expense.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <IconDotsVertical className="size-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Duplicate</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
