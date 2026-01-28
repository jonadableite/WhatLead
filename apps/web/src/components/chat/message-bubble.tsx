"use client";

import { format } from "date-fns";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
	direction: "INBOUND" | "OUTBOUND";
	body: string;
	occurredAt: string;
	sentBy: string;
}

export function MessageBubble({
	direction,
	body,
	occurredAt,
	sentBy,
}: MessageBubbleProps) {
	const isOutbound = direction === "OUTBOUND";
	const isSystem = sentBy === "SYSTEM";

	if (isSystem) {
		return (
			<div className="flex w-full justify-center">
				<div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-400">
					{body || "Evento do sistema"}
				</div>
			</div>
		);
	}

	return (
		<div className={cn("flex w-full", isOutbound ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
					isOutbound
						? "bg-indigo-600 text-white rounded-tr-none"
						: "bg-zinc-800/90 text-zinc-100 rounded-tl-none",
				)}
			>
				<p className="whitespace-pre-wrap">{body || "Mensagem sem conteúdo"}</p>
				<div className="mt-1 text-[10px] text-white/70">
					{format(new Date(occurredAt), "HH:mm")}
				</div>
			</div>
		</div>
	);
}
