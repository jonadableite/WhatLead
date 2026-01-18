import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import AdminDashboard from "./admin-dashboard";

export default async function AdminPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session?.data?.user) {
    redirect("/sign-in");
  }

  // Verificar se é admin
  const user = session.data.user;

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminDashboard user={user} />;
}
