import { RequireSession } from "@/components/auth/require-session";

import InstanceDetailsPageClient from "./instance-details-page-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InstanceDetailsPage({ params }: Props) {
  const { id } = await params;
  return (
    <RequireSession>
      <InstanceDetailsPageClient instanceId={id} />
    </RequireSession>
  );
}
