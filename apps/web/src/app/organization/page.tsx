import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import OrganizationDashboard from "./organization-dashboard";

export default async function OrganizationPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session?.data?.user) {
    redirect("/sign-in");
  }

  return <OrganizationDashboard user={session.data.user} />;
}
