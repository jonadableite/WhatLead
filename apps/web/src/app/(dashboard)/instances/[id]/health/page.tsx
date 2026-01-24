import { RequireSession } from "@/components/auth/require-session";

import InstanceHealthPageClient from "./instance-health-page-client";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function InstanceHealthPage({ params }: Props) {
	const { id } = await params;
	return (
		<RequireSession>
			<InstanceHealthPageClient instanceId={id} />
		</RequireSession>
	);
}
