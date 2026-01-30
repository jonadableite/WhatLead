import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
	id: string;
	name: string;
	profilePicUrl?: string | null;
	preview: string;
	lastMessageAt: string;
	unreadCount: number;
	isSelected: boolean;
	onSelect: (id: string) => void;
}

export function ConversationItem({
	id,
	name,
	profilePicUrl,
	preview,
	lastMessageAt,
	unreadCount,
	isSelected,
	onSelect,
}: ConversationItemProps) {
	return (
		<button
			type="button"
			onClick={() => onSelect(id)}
			className={cn(
				"w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left transition-all hover:border-indigo-400/40 hover:bg-white/10",
				isSelected && "border-indigo-500/40 bg-indigo-500/10",
			)}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<Avatar className="h-10 w-10">
						{profilePicUrl && (
							<AvatarImage src={profilePicUrl} alt={name} />
						)}
						<AvatarFallback className="bg-indigo-500/20 text-xs font-semibold text-indigo-200">
							{name.slice(0, 2).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-white">{name}</p>
						<p className="truncate text-xs text-zinc-400">{preview}</p>
					</div>
				</div>
				<div className="flex flex-col items-end gap-2">
					<span className="text-[10px] text-zinc-500">
						{formatDistanceToNow(new Date(lastMessageAt), {
							addSuffix: true,
							locale: ptBR,
						})}
					</span>
					{unreadCount > 0 && (
						<Badge className="h-5 rounded-full bg-indigo-500/20 px-2 text-[10px] text-indigo-100">
							{unreadCount}
						</Badge>
					)}
				</div>
			</div>
		</button>
	);
}
