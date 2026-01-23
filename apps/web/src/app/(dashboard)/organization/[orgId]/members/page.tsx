import { RequireSession } from "@/components/auth/require-session";

import MembersManagement from "./members-management";

interface Props {
  params: { orgId: string };
}

export default function MembersPage({ params }: Props) {
  const { orgId } = params;

  return (
    <RequireSession>
      <MembersManagement orgId={orgId} />
    </RequireSession>
  );
}
