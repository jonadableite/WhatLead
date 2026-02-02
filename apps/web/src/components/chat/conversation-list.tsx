"use client";

import { Search } from "lucide-react";

import { ConversationItem } from "./conversation-item";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InstanceListItem } from "@/lib/instances/instance-types";

interface ConversationListItem {
	id: string;
	contactId: string;
	contactName?: string | null;
	profilePicUrl?: string | null;
	lastMessageAt: string;
	unreadCount: number;
	lastMessage?: {
		body: string;
	} | null;
}

interface ConversationListProps {
	instances: InstanceListItem[];
	selectedInstanceId: string | null;
	onInstanceChange: (value: string) => void;
	search: string;
	onSearch: (value: string) => void;
	conversations: ConversationListItem[];
	isLoading: boolean;
	activeConversationId: string | null;
	onSelectConversation: (id: string) => void;
}

export function ConversationList({
	instances,
	selectedInstanceId,
	onInstanceChange,
	search,
	onSearch,
	conversations,
	isLoading,
	activeConversationId,
	onSelectConversation,
}: ConversationListProps) {
	return (
		<Card className="flex h-full min-h-0 flex-col gap-4 border-white/10 bg-white/5 p-4 backdrop-blur-xl">
			<div className="space-y-3 flex-shrink-0">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
						Conversas
					</p>
					<p className="text-sm text-zinc-400">
						Visualize conversas reais da sua instância ativa.
					</p>
				</div>

				<div className="space-y-2">
					<select
						value={selectedInstanceId ?? ""}
						onChange={(event) => onInstanceChange(event.target.value)}
						className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900/60 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
					>
						<option value="" disabled>
							Selecione uma instância
						</option>
						{instances.map((instance) => (
							<option key={instance.id} value={instance.id}>
								{instance.name}
							</option>
						))}
					</select>

					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Buscar conversa..."
							value={search}
							onChange={(event) => onSearch(event.target.value)}
							className="pl-9"
						/>
					</div>
				</div>
			</div>

			<ScrollArea className="flex-1 min-h-0 pr-2">
				<div className="space-y-3">
					{isLoading && (
						<p className="text-xs text-zinc-500">Carregando conversas...</p>
					)}
					{!isLoading && conversations.length === 0 && (
						<p className="text-xs text-zinc-500">Nenhuma conversa encontrada.</p>
					)}
					{conversations.map((conversation) => (
						<ConversationItem
							key={conversation.id}
							id={conversation.id}
							name={conversation.contactName || conversation.contactId}
							profilePicUrl={conversation.profilePicUrl ?? null}
							preview={conversation.lastMessage?.body || "Sem mensagens ainda"}
							lastMessageAt={conversation.lastMessageAt}
							unreadCount={conversation.unreadCount}
							isSelected={conversation.id === activeConversationId}
							onSelect={onSelectConversation}
						/>
					))}
				</div>
			</ScrollArea>
		</Card>
	);
}
