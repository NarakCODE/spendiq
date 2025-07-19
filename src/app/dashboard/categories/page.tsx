"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconPlus, IconTag, IconAlertCircle } from "@tabler/icons-react";
import { useCategories } from "@/hooks/use-categories";

export default function CategoriesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { categories, isLoading, error } = useCategories();

  if (error) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <div className="px-4 lg:px-6">
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load categories. Please refresh the page to try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Organize your expenses with custom categories
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <IconPlus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTag className="h-5 w-5" />
              Your Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
                  role="status"
                  aria-label="Loading categories"
                />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <IconTag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No categories yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first category to start organizing expenses
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{category.name}</h4>
                      {category.icon && (
                        <p className="text-sm text-muted-foreground">
                          Icon: {category.icon}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TODO: Implement CategoryFormModal component */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Category</h2>
            <p className="text-muted-foreground mb-4">
              Category form will be implemented in the next iteration.
            </p>
            <Button onClick={() => setShowAddModal(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
