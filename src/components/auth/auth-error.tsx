"use client";

import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

const errorMessages: Record<string, string> = {
  "Invalid+token": "The verification link is invalid or has been used already.",
  "Link+has+expired":
    "The verification link has expired. Please request a new one.",
  "Verification+failed":
    "Verification failed. Please try again or contact support.",
  Default: "An error occurred during authentication. Please try again.",
};

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  const message = errorMessages[error] || errorMessages["Default"];

  return (
    <div className="w-full max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-red-800">
            Authentication Error
          </h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}
