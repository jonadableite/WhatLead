"use client";

import { cn } from "@/lib/utils";

type StatusVariant = "neutral" | "primary" | "success" | "warning" | "danger";

interface StatusBadgeProps {
	label: string;
	variant?: StatusVariant;
}

const variantClassMap: Record<StatusVariant, string> = {
	neutral: "border-border bg-card text-muted-foreground",
	primary: "border-primary/40 bg-primary/10 text-primary",
	success: "border-secondary/40 bg-secondary/10 text-secondary-foreground",
	warning: "border-accent/40 bg-accent/10 text-accent-foreground",
	danger: "border-destructive/40 bg-destructive/10 text-destructive",
};

export const StatusBadge = ({ label, variant = "neutral" }: StatusBadgeProps) => (
	<span
		className={cn(
			"inline-flex items-center rounded-full border px-2.5 py-1 text-xs",
			variantClassMap[variant],
		)}
	>
		{label}
	</span>
);
