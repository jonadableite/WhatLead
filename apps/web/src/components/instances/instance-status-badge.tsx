type InstanceStatusBadgeType = "connection" | "lifecycle" | "risk";

interface InstanceStatusBadgeProps {
	type: InstanceStatusBadgeType;
	value: string;
	label: string;
	animated?: boolean;
}

const baseClasses =
	"rounded-full border px-2.5 py-1 text-xs font-medium tracking-tight";

const withAnimation = (classes: string, animated?: boolean): string =>
	animated ? `${classes} animate-pulse` : classes;

const getClasses = (
	type: InstanceStatusBadgeType,
	value: string,
	animated?: boolean,
): string => {
	if (type === "connection") {
		switch (value) {
			case "CONNECTED":
				return "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
			case "CONNECTING":
				return withAnimation(
					"border-amber-500/50 bg-amber-500/10 text-amber-500",
					animated,
				);
			case "QRCODE":
				return withAnimation(
					"border-sky-500/50 bg-sky-500/10 text-sky-500",
					animated,
				);
			case "ERROR":
				return "border-red-500/50 bg-red-500/10 text-red-500";
			case "DISCONNECTED":
			default:
				return "border-slate-500/40 bg-slate-500/10 text-slate-400";
		}
	}

	if (type === "lifecycle") {
		switch (value) {
			case "ACTIVE":
				return "border-cyan-500/50 bg-cyan-500/10 text-cyan-500";
			case "COOLDOWN":
				return "border-violet-500/50 bg-violet-500/10 text-violet-500";
			case "BANNED":
				return "border-red-500/50 bg-red-500/10 text-red-500";
			case "CREATED":
			default:
				return "border-slate-500/40 bg-slate-500/10 text-slate-400";
		}
	}

	switch (value) {
		case "HIGH":
			return "border-red-500/60 bg-red-500/20 text-red-500";
		case "MEDIUM":
			return "border-amber-500/60 bg-amber-500/20 text-amber-500";
		case "LOW":
		default:
			return "border-emerald-500/50 bg-emerald-500/10 text-emerald-500";
	}
};

export const InstanceStatusBadge = ({
	type,
	value,
	label,
	animated,
}: InstanceStatusBadgeProps) => {
	return (
		<span className={`${baseClasses} ${getClasses(type, value, animated)}`}>
			{label}
		</span>
	);
};
