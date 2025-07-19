"use client";

import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SignUpData {
  name: string;
  email: string;
  password: string;
}

interface SignInData {
  email: string;
  password: string;
}

// Sign up mutation
export function useSignUpMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (
      data: SignUpData
    ): Promise<{ message: string; user: any }> => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      // Auto sign in after successful registration
      const result = await signIn("credentials", {
        email: variables.email,
        password: variables.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(
          "Registration successful, but sign in failed. Please try signing in manually."
        );
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    },
  });
}

// Sign in mutation
export function useSignInMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: SignInData) => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      return result;
    },
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });
}
