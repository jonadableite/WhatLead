import { RequireSession } from "@/components/auth/require-session";

import InstancesDashboard from "./instances-dashboard";

export default function InstancesPage() {
	return (
		<RequireSession>
			<InstancesDashboard />
		</RequireSession>
	);
}

