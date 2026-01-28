import type { InstanceConnectionStatus } from "@/lib/instances/instance-types";

type AvatarSize = "sm" | "md" | "lg";

interface InstanceProfileAvatarProps {
	profilePicUrl?: string | null;
	profileName?: string | null;
	connectionStatus: InstanceConnectionStatus;
	size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, string> = {
	sm: "h-9 w-9",
	md: "h-11 w-11",
	lg: "h-14 w-14",
};

const ringColor = (status: InstanceConnectionStatus): string => {
	switch (status) {
		case "CONNECTED":
			return "from-emerald-400 via-emerald-500 to-emerald-400";
		case "CONNECTING":
			return "from-amber-400 via-amber-500 to-amber-400";
		case "QRCODE":
			return "from-sky-400 via-sky-500 to-sky-400";
		case "ERROR":
			return "from-red-400 via-red-500 to-red-400";
		case "DISCONNECTED":
		default:
			return "from-slate-500 via-slate-600 to-slate-500";
	}
};

const initialsFrom = (name?: string | null): string => {
	if (!name) return "WA";
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts.map((part) => part[0]?.toUpperCase()).join("") || "WA";
};

export const InstanceProfileAvatar = ({
	profilePicUrl,
	profileName,
	connectionStatus,
	size = "md",
}: InstanceProfileAvatarProps) => {
	const ringGradient = ringColor(connectionStatus);

	return (
		<div className={`relative ${sizeMap[size]} shrink-0`}>
			<span
				className={`absolute -inset-1 rounded-full bg-linear-to-r ${ringGradient} opacity-80 blur-[2px]`}
			/>
			<span
				className={`absolute -inset-1 rounded-full bg-linear-to-r ${ringGradient} animate-spin`}
				style={{ background: `conic-gradient(var(--tw-gradient-stops))` }}
			/>
			<div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur">
				{profilePicUrl ? (
					<img
						src={profilePicUrl}
						alt={profileName ?? "WhatsApp profile"}
						className="h-full w-full object-cover"
						loading="lazy"
					/>
				) : (
					<span className="text-xs font-semibold text-white/80">
						{initialsFrom(profileName)}
					</span>
				)}
			</div>
		</div>
	);
};
