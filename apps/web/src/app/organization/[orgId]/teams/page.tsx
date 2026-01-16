import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import TeamsManagement from "./teams-management";

interface Props {
	params: Promise<{ orgId: string }>;
}

export default async function TeamsPage({ params }: Props) {
	const { orgId } = await params;

	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session?.data?.user) {
		redirect("/login");
	}

	return <TeamsManagement orgId={orgId} />;
}
