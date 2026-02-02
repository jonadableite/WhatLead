"use client";

import { Smile, Send } from "lucide-react";

import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
	value: string;
	onChange: (value: string) => void;
	onSend: () => void;
	disabled: boolean;
	disabledReason?: { title: string; description?: string; variant?: "risk" | "cooldown" | "blocked" | "info" };
	isSending: boolean;
}

export function MessageInput({
	value,
	onChange,
	onSend,
	disabled,
	disabledReason,
	isSending,
}: MessageInputProps) {
	return (
		<div className="space-y-3 border-t border-white/10 bg-black/30 p-4">
			{disabled && disabledReason && (
				<AlertBanner
					title={disabledReason.title}
					description={disabledReason.description}
					variant={disabledReason.variant ?? "info"}
				/>
			)}
			<div className="flex items-center gap-3">
				<Button
					size="icon"
					variant="ghost"
					className="h-10 w-10 rounded-full text-zinc-400 hover:text-white"
					disabled={disabled || isSending}
				>
					<Smile className="h-5 w-5" />
				</Button>
				<div className="flex-1">
					<Input
						placeholder="Digite uma mensagem..."
						value={value}
						onChange={(event) => onChange(event.target.value)}
						className="h-12 rounded-full bg-zinc-900/80 border-white/10 px-4"
						disabled={disabled || isSending}
						onKeyDown={(event) => {
							if (event.key === "Enter" && !event.shiftKey) {
								event.preventDefault();
								if (!disabled && !isSending) onSend();
							}
						}}
					/>
				</div>
				<Button
					size="icon"
					disabled={disabled || isSending}
					onClick={onSend}
					className="h-12 w-12 rounded-full bg-indigo-600 hover:bg-indigo-500"
				>
					<Send className="h-5 w-5" />
				</Button>
			</div>
			<div className="flex items-center justify-between text-[10px] text-muted-foreground">
				<span>Enter para enviar</span>
				<span>{isSending ? "Enviando..." : "Mensagem manual"}</span>
			</div>
		</div>
	);
}
