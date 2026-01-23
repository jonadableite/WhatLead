import { RequireSession } from "@/components/auth/require-session";

import TeamsManagement from "./teams-management";

interface Props {
  params: { orgId: string };
}

export default function TeamsPage({ params }: Props) {
  const { orgId } = params;

  return (
    <RequireSession>
      <TeamsManagement orgId={orgId} />
    </RequireSession>
  );
}
