import { RequireSession } from "@/components/auth/require-session";

import InstanceHealthPageClient from "./instance-health-page-client";

interface Props {
	params: { id: string };
}

export default function InstanceHealthPage({ params }: Props) {
	return (
		<RequireSession>
			<InstanceHealthPageClient instanceId={params.id} />
		</RequireSession>
	);
}

