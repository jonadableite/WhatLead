"use client";

import { RequireSession } from "@/components/auth/require-session";
import { authClient } from "@/lib/auth-client";
import Dashboard from "./dashboard";

function DashboardContent() {
  const { data } = authClient.useSession();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {data?.user?.name}</p>
      <Dashboard />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireSession>
      <DashboardContent />
    </RequireSession>
  );
}
