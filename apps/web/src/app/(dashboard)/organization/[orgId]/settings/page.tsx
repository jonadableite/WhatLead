import { RequireSession } from "@/components/auth/require-session";

import OrganizationSettings from "./organization-settings";

interface Props {
  params: { orgId: string };
}

export default function SettingsPage({ params }: Props) {
  const { orgId } = params;

  return (
    <RequireSession>
      <OrganizationSettings orgId={orgId} />
    </RequireSession>
  );
}
