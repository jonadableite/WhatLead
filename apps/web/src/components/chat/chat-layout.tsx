"use client";

import type { ReactNode } from "react";

interface ChatLayoutProps {
	isMobile: boolean;
	showConversationList: boolean;
	conversationList: ReactNode;
	chatView: ReactNode;
}

export function ChatLayout({
	isMobile,
	showConversationList,
	conversationList,
	chatView,
}: ChatLayoutProps) {
	const containerClass = "flex-1 min-h-0 h-full";
	if (isMobile) {
		return (
			<div className={`flex flex-1 min-h-0 flex-col gap-4 ${containerClass}`}>
				{showConversationList ? conversationList : chatView}
			</div>
		);
	}

	return (
		<div
			className={`grid flex-1 min-h-0 ${containerClass} grid-cols-[minmax(280px,360px)_minmax(0,1fr)] gap-4`}
		>
			{conversationList}
			{chatView}
		</div>
	);
}
