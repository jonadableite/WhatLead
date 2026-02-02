"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

import { MessageBubble } from "./message-bubble";
import { ExecutionJobsPanel } from "./execution-jobs-panel";
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

type TimelineEvent =
	| {
			type: "MESSAGE";
			messageId: string;
			direction: "INBOUND" | "OUTBOUND";
			origin: "MANUAL" | "AI" | "AUTOMATION";
			payload: {
				kind: "TEXT" | "MEDIA" | "AUDIO" | "REACTION";
				text?: string;
				media?: {
					url?: string;
					base64?: string;
					mimeType?: string;
					caption?: string;
				};
				audio?: {
					url?: string;
					base64?: string;
					mimeType?: string;
				};
				reaction?: {
					emoji: string;
					targetMessageId?: string;
				};
			};
			createdAt: string;
	  }
	| {
			type: "SYSTEM";
			action: "CONVERSATION_OPENED" | "CONVERSATION_CLOSED";
			createdAt: string;
	  }
	| {
			type: "ASSIGNMENT";
			assignedTo: { type: "OPERATOR" | "AI"; id: string };
			createdAt: string;
	  }
	| {
			type: "TAG";
			tag: string;
			createdAt: string;
	  };

interface ExecutionJob {
	id: string;
	type: string;
	status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
	scheduledFor: string;
	attempts: number;
	maxAttempts: number;
	lastError: string | null;
	createdAt: string;
	executedAt: string | null;
	failedAt: string | null;
	cancelledAt: string | null;
}

interface ChatViewProps {
	isMobile: boolean;
	showBack: boolean;
	onBack: () => void;
	conversation: ConversationSummary | null;
	timeline: TimelineEvent[];
	isLoading: boolean;
	executionJobs?: ExecutionJob[];
	isLoadingJobs?: boolean;
	instanceName?: string;
	instanceStatus?: string;
	children?: ReactNode;
}

export function ChatView({
	isMobile,
	showBack,
	onBack,
	conversation,
	timeline,
	isLoading,
	executionJobs = [],
	isLoadingJobs = false,
	instanceName,
	instanceStatus,
	children,
}: ChatViewProps) {
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [timeline.length, isLoading]);

	return (
		<Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-white/10 bg-white/5">
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

			<div className="relative flex-1 min-h-0">
				<div className="absolute inset-0 bg-[url('/Fundo_whatsapp.jpg')] bg-cover bg-center opacity-20" />
				<ScrollArea className="relative h-full flex-1 min-h-0 p-4">
					<div className="space-y-4">
						{isLoading && (
							<p className="text-xs text-zinc-400">
								Carregando mensagens...
							</p>
						)}
						{!isLoading && timeline.length === 0 && (
							<p className="text-xs text-zinc-400">
								Ainda não há mensagens nesta conversa.
							</p>
						)}
						{timeline.map((event) => {
							if (event.type === "MESSAGE") {
								const payload = event.payload ?? {};
								const media = payload.media ?? payload.audio;
								const inferredType = resolveMessageType(payload);
								const body =
									payload.text ?? payload.reaction?.emoji ?? "";
								return (
									<MessageBubble
										key={event.messageId}
										direction={event.direction}
										type={inferredType}
										body={body}
										media={media ?? undefined}
										occurredAt={event.createdAt}
										sentBy={event.origin}
									/>
								);
							}

							return (
								<div
									key={`${event.type}-${event.createdAt}`}
									className="flex items-center justify-center"
								>
									<span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400">
										{renderTimelineLabel(event)}
									</span>
								</div>
							);
						})}
						<div ref={bottomRef} />
					</div>
				</ScrollArea>
			</div>

			<ExecutionJobsPanel jobs={executionJobs} isLoading={isLoadingJobs} />

			{children}
		</Card>
	);
}

const resolveMessageType = (payload: {
	kind: "TEXT" | "MEDIA" | "AUDIO" | "REACTION";
	media?: { url?: string; base64?: string; mimeType?: string };
	audio?: { url?: string; base64?: string; mimeType?: string };
	reaction?: { emoji: string };
}) => {
	if (payload.kind === "REACTION") return "REACTION";
	if (payload.kind === "AUDIO") return "AUDIO";
	if (payload.kind === "MEDIA") {
		if (payload.media?.mimeType?.startsWith("video/")) return "VIDEO";
		return "IMAGE";
	}
	return "TEXT";
};

const renderTimelineLabel = (event: Exclude<TimelineEvent, { type: "MESSAGE" }>) => {
	if (event.type === "SYSTEM") {
		return event.action === "CONVERSATION_OPENED"
			? "Conversa aberta"
			: "Conversa encerrada";
	}
	if (event.type === "ASSIGNMENT") {
		return event.assignedTo.type === "AI"
			? "Atendimento assumido pela IA"
			: "Atendimento assumido pelo operador";
	}
	return `Tag aplicada: ${event.tag}`;
};
