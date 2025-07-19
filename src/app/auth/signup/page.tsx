"use client";

import Link from "next/link";
import { useSignUpMutation } from "@/hooks/use-auth-mutations";
import { signUpSchema } from "@/lib/validation/auth";
import { AuthForm } from "@/components/auth/auth-form";
import {
  Auth,
  AuthHeader,
  AuthTitle,
  AuthDescription,
} from "@/components/auth/auth-layout";

export default function SignUpPage() {
  const signUpMutation = useSignUpMutation();

  const formFields = [
    {
      name: "name",
      label: "Full Name",
      type: "text" as const,
      placeholder: "Enter your full name",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email" as const,
      placeholder: "Enter your email address",
    },
    {
      name: "password",
      label: "Password",
      type: "password" as const,
      placeholder: "Create a password",
      description:
        "Password must be at least 8 characters with uppercase, lowercase, and numbers",
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password" as const,
      placeholder: "Confirm your password",
    },
  ];

  return (
    <Auth imgSrc="/images/illustrations/misc/welcome.svg">
      <div className="space-y-6">
        <AuthHeader>
          <AuthTitle>Create your account</AuthTitle>
          <AuthDescription>
            Enter your information to create an account or{" "}
            <Link
              href="/auth/signin"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              sign in to your existing account
            </Link>
          </AuthDescription>
        </AuthHeader>

        <AuthForm
          schema={signUpSchema}
          defaultValues={{
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          onSubmit={(data) => signUpMutation.mutate(data)}
          submitLabel="Create account"
          submitLoadingLabel="Creating account..."
          isSubmitting={signUpMutation.isPending}
          error={signUpMutation.error?.message}
          fields={formFields}
        />
      </div>
    </Auth>
  );
}
