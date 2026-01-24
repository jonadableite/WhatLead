"use client";

import { Progress } from "./progress";
import { StatusBadge } from "./status-badge";

interface InstanceHealthMeterProps {
	score: number;
	label?: string;
}

const getHealthVariant = (score: number): "success" | "warning" | "danger" => {
	if (score >= 75) return "success";
	if (score >= 45) return "warning";
	return "danger";
};

export const InstanceHealthMeter = ({ score, label }: InstanceHealthMeterProps) => {
	const safeScore = Math.min(Math.max(score, 0), 100);
	const variant = getHealthVariant(safeScore);
	const displayLabel = label ?? "Saúde";

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-xs text-muted-foreground">
				<span>{displayLabel}</span>
				<StatusBadge label={`${safeScore}%`} variant={variant} />
			</div>
			<Progress value={safeScore} />
		</div>
	);
};
