import { RequireSession } from "@/components/auth/require-session";
import OperatorPageClient from "./operator-page-client";

export default function OperatorPage() {
  return (
    <RequireSession>
      <OperatorPageClient />
    </RequireSession>
  );
}
