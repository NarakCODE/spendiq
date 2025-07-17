import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function getRequiredSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
