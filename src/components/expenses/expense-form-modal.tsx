"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseForm } from "./expense-form";
// Define a consistent expense type for the modal
export interface ExpenseModalData {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  teamId?: string;
}

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: ExpenseModalData;
  onSuccess?: () => void;
}

export function ExpenseFormModal({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: ExpenseFormModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create</DialogTitle>
        </DialogHeader>
        <ExpenseForm
          expense={expense}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
