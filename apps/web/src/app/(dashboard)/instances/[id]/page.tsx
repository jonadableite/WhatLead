import { RequireSession } from "@/components/auth/require-session";

import InstanceDetailsPageClient from "./instance-details-page-client";

interface Props {
	params: { id: string };
}

export default function InstanceDetailsPage({ params }: Props) {
	return (
		<RequireSession>
			<InstanceDetailsPageClient instanceId={params.id} />
		</RequireSession>
	);
}

