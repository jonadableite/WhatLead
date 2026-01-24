import { RequireSession } from "@/components/auth/require-session";

import MessageIntentsPageClient from "./message-intents-page-client";

export default function MessageIntentsPage() {
	return (
		<RequireSession>
			<MessageIntentsPageClient />
		</RequireSession>
	);
}
