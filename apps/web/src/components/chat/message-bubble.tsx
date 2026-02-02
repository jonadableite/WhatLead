"use client";

import { useEffect, useRef, useState } from "react";
import { X, Pause, Play } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
	direction: "INBOUND" | "OUTBOUND";
	type: string;
	body: string;
	media?: {
		url?: string;
		base64?: string;
		mimeType?: string;
		caption?: string;
	};
	occurredAt: string;
	sentBy: string;
}

export function MessageBubble({
	direction,
	type,
	body,
	media,
	occurredAt,
	sentBy,
}: MessageBubbleProps) {
	const isOutbound = direction === "OUTBOUND";
	const isSystem = sentBy === "SYSTEM";
	const mediaSrc = media?.base64 || media?.url;
	const mediaMime = media?.mimeType ?? "";
	const mediaKind = resolveMediaKind(mediaSrc, mediaMime, type);
	const caption = media?.caption || body;
	const [lightboxOpen, setLightboxOpen] = useState(false);

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
				{mediaSrc && mediaKind === "image" && (
					<button
						type="button"
						onClick={() => setLightboxOpen(true)}
						className="mb-2 block overflow-hidden rounded-lg"
					>
						<img
							src={mediaSrc}
							alt={caption || "Imagem"}
							className="max-h-72 w-auto rounded-lg object-contain transition-transform hover:scale-[1.01]"
						/>
					</button>
				)}
				{mediaSrc && mediaKind === "video" && (
					<video
						src={mediaSrc}
						controls
						className="mb-2 max-h-72 w-full rounded-lg"
					/>
				)}
				{mediaSrc && mediaKind === "audio" && (
					<AudioPlayer src={mediaSrc} />
				)}
				{caption ? (
					<p className="whitespace-pre-wrap">{caption}</p>
				) : mediaSrc ? null : (
					<p className="whitespace-pre-wrap">{body || "Mensagem sem conteúdo"}</p>
				)}
				<div className="mt-1 text-[10px] text-white/70">
					{format(new Date(occurredAt), "HH:mm")}
				</div>
			</div>
			{lightboxOpen && mediaSrc && mediaKind === "image" && (
				<div
					role="dialog"
					aria-modal="true"
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
					onClick={() => setLightboxOpen(false)}
				>
					<button
						type="button"
						onClick={() => setLightboxOpen(false)}
						className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
					>
						<X className="h-5 w-5" />
					</button>
					<img
						src={mediaSrc}
						alt={caption || "Imagem"}
						className="max-h-[85vh] max-w-[95vw] rounded-xl object-contain"
					/>
				</div>
			)}
		</div>
	);
}

const resolveMediaKind = (
	src: string | undefined,
	mimeType: string,
	messageType: string,
): "image" | "video" | "audio" | null => {
	if (!src) return null;
	if (mimeType.startsWith("image/")) return "image";
	if (mimeType.startsWith("video/")) return "video";
	if (mimeType.startsWith("audio/")) return "audio";
	if (messageType === "IMAGE") return "image";
	if (messageType === "VIDEO") return "video";
	if (messageType === "AUDIO") return "audio";
	if (messageType === "STICKER") return "image";
	if (src.startsWith("data:image/")) return "image";
	if (src.startsWith("data:video/")) return "video";
	if (src.startsWith("data:audio/")) return "audio";
	return null;
};

const AudioPlayer = ({ src }: { src: string }) => {
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const onLoaded = () => setDuration(audio.duration || 0);
		const onTime = () => setCurrentTime(audio.currentTime || 0);
		const onEnded = () => setIsPlaying(false);

		audio.addEventListener("loadedmetadata", onLoaded);
		audio.addEventListener("timeupdate", onTime);
		audio.addEventListener("ended", onEnded);

		return () => {
			audio.removeEventListener("loadedmetadata", onLoaded);
			audio.removeEventListener("timeupdate", onTime);
			audio.removeEventListener("ended", onEnded);
		};
	}, []);

	const toggle = async () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (audio.paused) {
			await audio.play();
			setIsPlaying(true);
		} else {
			audio.pause();
			setIsPlaying(false);
		}
	};

	const progress = duration > 0 ? currentTime / duration : 0;

	return (
		<div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2">
			<button
				type="button"
				onClick={toggle}
				className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
			>
				{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
			</button>
			<div className="flex-1">
				<div className="relative h-6">
					<div className="absolute inset-0 rounded-full bg-white/10" />
					<div
						className="absolute inset-y-0 left-0 rounded-full bg-indigo-400/70"
						style={{ width: `${progress * 100}%` }}
					/>
					<div className="absolute inset-0 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.15)_0_40%,transparent_40%_60%,rgba(255,255,255,0.15)_60%_100%)] opacity-70" />
				</div>
				<input
					type="range"
					min={0}
					max={duration || 0}
					step={0.1}
					value={currentTime}
					onChange={(event) => {
						const next = Number(event.target.value);
						if (audioRef.current) audioRef.current.currentTime = next;
						setCurrentTime(next);
					}}
					className="mt-2 w-full accent-indigo-400"
				/>
			</div>
			<div className="text-[10px] text-white/70">
				{formatTime(currentTime)}
			</div>
			<audio ref={audioRef} src={src} preload="metadata" />
		</div>
	);
};

const formatTime = (value: number): string => {
	if (!Number.isFinite(value)) return "0:00";
	const minutes = Math.floor(value / 60);
	const seconds = Math.floor(value % 60);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
