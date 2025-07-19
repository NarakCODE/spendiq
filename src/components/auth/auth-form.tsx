"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LoaderCircleIcon } from "lucide-react";

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder: string;
  description?: string;
}

interface AuthFormProps {
  schema: z.ZodSchema<any>;
  defaultValues: Record<string, any>;
  onSubmit: (data: any) => void;
  submitLabel: string;
  isSubmitting: boolean;
  submitLoadingLabel: string;
  error?: string;
  fields: readonly FormField[];
  className?: string;
}

export function AuthForm({
  schema,
  defaultValues,
  onSubmit,
  submitLabel,
  submitLoadingLabel,
  isSubmitting,
  error,
  fields,
  className,
}: AuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    // @ts-expect-error - Type incompatibility between Zod and React Hook Form
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              {...register(field.name)}
              aria-invalid={!!errors[field.name]}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">
                {field.description}
              </p>
            )}
            {errors[field.name] && (
              <p className="text-sm text-destructive">
                {String(errors[field.name]?.message || "Invalid input")}
              </p>
            )}
          </div>
        ))}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <LoaderCircleIcon
                className="-ms-1 animate-spin"
                size={16}
                aria-hidden="true"
              />
              <span>{submitLoadingLabel}</span>
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
