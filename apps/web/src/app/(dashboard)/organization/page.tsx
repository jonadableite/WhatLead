import { RequireSession } from "@/components/auth/require-session";

import OrganizationDashboard from "./organization-dashboard";

export default function OrganizationPage() {
  return (
    <RequireSession>
      <OrganizationDashboard />
    </RequireSession>
  );
}
