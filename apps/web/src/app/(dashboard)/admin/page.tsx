import { RequireAdmin } from "@/components/auth/require-session";

import AdminDashboard from "./admin-dashboard";

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  );
}
