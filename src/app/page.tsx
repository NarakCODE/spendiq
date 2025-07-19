import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WelcomeScreen } from "@/components/home/welcome-screen";

export const metadata: Metadata = {
  title: "SpendIQ - Smart Expense Tracking",
  description:
    "Track expenses, manage budgets, and collaborate with teams. Start your financial journey with SpendIQ.",
  keywords: [
    "expense tracking",
    "budget management",
    "financial planning",
    "team collaboration",
  ],
  openGraph: {
    title: "SpendIQ - Smart Expense Tracking",
    description: "Track expenses, manage budgets, and collaborate with teams.",
    type: "website",
  },
};

/**
 * Home page component that serves as the landing page for unauthenticated users.
 * Authenticated users are automatically redirected to the dashboard.
 *
 * @returns JSX element containing the welcome screen for new users
 */
export default async function Home() {
  try {
    const session = await getServerSession(authOptions);

    // Redirect authenticated users to their dashboard
    if (session?.user) {
      redirect("/dashboard");
    }

    return <WelcomeScreen />;
  } catch (error) {
    console.error("Authentication check failed:", error);
    // Fallback to welcome screen if auth check fails
    return <WelcomeScreen />;
  }
}
