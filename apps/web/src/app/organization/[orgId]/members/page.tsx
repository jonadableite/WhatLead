import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import MembersManagement from "./members-management";

interface Props {
  params: Promise<{ orgId: string }>;
}

export default async function MembersPage({ params }: Props) {
  const { orgId } = await params;

  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  if (!session?.data?.user) {
    redirect("/sign-in");
  }

  return <MembersManagement orgId={orgId} />;
}
