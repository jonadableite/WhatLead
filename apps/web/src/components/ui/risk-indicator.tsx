"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

import { StatusBadge } from "./status-badge";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface RiskIndicatorProps {
	level: RiskLevel;
}

const riskConfig: Record<
	RiskLevel,
	{ label: string; icon: ReactNode; variant: "success" | "warning" | "danger" }
> = {
	LOW: { label: "Baixo", icon: <ShieldCheck className="h-3.5 w-3.5" />, variant: "success" },
	MEDIUM: {
		label: "Médio",
		icon: <ShieldAlert className="h-3.5 w-3.5" />,
		variant: "warning",
	},
	HIGH: { label: "Alto", icon: <AlertTriangle className="h-3.5 w-3.5" />, variant: "danger" },
};

export const RiskIndicator = ({ level }: RiskIndicatorProps) => {
	const config = riskConfig[level];
	return (
		<div className="inline-flex items-center gap-2">
			{config.icon}
			<StatusBadge label={config.label} variant={config.variant} />
		</div>
	);
};
