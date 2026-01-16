import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import OrganizationSettings from "./organization-settings";

interface Props {
	params: Promise<{ orgId: string }>;
}

export default async function SettingsPage({ params }: Props) {
	const { orgId } = await params;

	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session?.data?.user) {
		redirect("/login");
	}

	return <OrganizationSettings orgId={orgId} />;
}
