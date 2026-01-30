"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { MessageBubble } from "./message-bubble";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationSummary {
	id: string;
	contactId: string;
	contactName?: string | null;
	profilePicUrl?: string | null;
	status: string;
}

interface MessageItem {
	id: string;
	direction: "INBOUND" | "OUTBOUND";
	type: string;
	sentBy: string;
	body: string;
	occurredAt: string;
}

interface ChatViewProps {
	isMobile: boolean;
	showBack: boolean;
	onBack: () => void;
	conversation: ConversationSummary | null;
	messages: MessageItem[];
	isLoading: boolean;
	instanceName?: string;
	instanceStatus?: string;
	children?: ReactNode;
}

export function ChatView({
	isMobile,
	showBack,
	onBack,
	conversation,
	messages,
	isLoading,
	instanceName,
	instanceStatus,
	children,
}: ChatViewProps) {
	return (
		<Card className="flex h-full flex-1 flex-col overflow-hidden border-white/10 bg-white/5">
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
				<div className="flex items-center gap-3">
					{isMobile && showBack && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={onBack}
						>
							<ArrowLeft className="h-4 w-4" />
						</Button>
					)}
					<Avatar className="h-9 w-9">
						{conversation?.profilePicUrl && (
							<AvatarImage
								src={conversation.profilePicUrl}
								alt={conversation?.contactName ?? conversation?.contactId ?? "Contato"}
							/>
						)}
						<AvatarFallback className="bg-indigo-500/20 text-indigo-200 text-xs font-semibold">
							{conversation?.contactName?.slice(0, 2).toUpperCase() ??
								conversation?.contactId?.slice(0, 2).toUpperCase() ??
								"WL"}
						</AvatarFallback>
					</Avatar>
					<div>
						<p className="text-sm font-semibold text-white">
							{conversation?.contactName || conversation?.contactId || "Contato"}
						</p>
						<div className="flex items-center gap-2 text-[10px] text-zinc-400">
							{instanceName && <span>{instanceName}</span>}
							{instanceStatus && (
								<Badge variant="outline" className="h-4 px-1 text-[9px]">
									{instanceStatus}
								</Badge>
							)}
						</div>
					</div>
				</div>
				{conversation?.status && (
					<Badge variant="outline" className="h-5 px-2 text-[10px]">
						{conversation.status}
					</Badge>
				)}
			</div>

			<div className="relative flex-1">
				<div className="absolute inset-0 bg-[url('/Fundo_whatsapp.jpg')] bg-cover bg-center opacity-20" />
				<ScrollArea className="relative h-full p-4">
					<div className="space-y-4">
						{isLoading && (
							<p className="text-xs text-zinc-400">
								Carregando mensagens...
							</p>
						)}
						{!isLoading && messages.length === 0 && (
							<p className="text-xs text-zinc-400">
								Ainda não há mensagens nesta conversa.
							</p>
						)}
						{messages.map((message) => (
							<MessageBubble
								key={message.id}
								direction={message.direction}
								body={message.body}
								occurredAt={message.occurredAt}
								sentBy={message.sentBy}
							/>
						))}
					</div>
				</ScrollArea>
			</div>

			{children}
		</Card>
	);
}
