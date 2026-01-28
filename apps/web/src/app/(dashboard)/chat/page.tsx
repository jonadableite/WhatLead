import { RequireSession } from "@/components/auth/require-session";
import ChatPageClient from "./chat-page-client";

export default function ChatPage() {
	return (
		<RequireSession>
			<ChatPageClient />
		</RequireSession>
	);
}
