import { RequireSession } from "@/components/auth/require-session";

import NewInstancePageClient from "./new-instance-page-client";

export default function NewInstancePage() {
	return (
		<RequireSession>
			<NewInstancePageClient />
		</RequireSession>
	);
}

