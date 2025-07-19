"use client";

import Link from "next/link";
import { useSignInMutation } from "@/hooks/use-auth-mutations";
import { signInSchema } from "@/lib/validation/auth";
import { AuthForm } from "@/components/auth/auth-form";
import {
  Auth,
  AuthHeader,
  AuthTitle,
  AuthDescription,
} from "@/components/auth/auth-layout";

export default function SignInPage() {
  const signInMutation = useSignInMutation();

  const formFields = [
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
      placeholder: "Enter your password",
    },
  ];

  return (
    <Auth imgSrc="/images/illustrations/misc/welcome.svg">
      <div className="space-y-6">
        <AuthHeader>
          <AuthTitle>Sign in to your account</AuthTitle>
          <AuthDescription>
            Enter your credentials or{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              create a new account
            </Link>
          </AuthDescription>
        </AuthHeader>

        <AuthForm
          schema={signInSchema}
          defaultValues={{
            email: "",
            password: "",
          }}
          onSubmit={(data) => signInMutation.mutate(data)}
          submitLabel="Sign in"
          submitLoadingLabel="Signing in"
          isSubmitting={signInMutation.isPending}
          error={signInMutation.error?.message}
          fields={formFields}
        />
      </div>
    </Auth>
  );
}
