"use client";

import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "risk" | "cooldown" | "blocked" | "info" | "success";

interface AlertBannerProps {
	title: string;
	description?: string;
	variant?: AlertVariant;
}

const variantStyles: Record<AlertVariant, string> = {
	risk: "border-destructive/30 bg-destructive/10 text-destructive",
	cooldown: "border-accent/40 bg-accent/10 text-accent-foreground",
	blocked: "border-destructive/40 bg-destructive/10 text-destructive",
	info: "border-border bg-card text-muted-foreground",
	success: "border-primary/40 bg-primary/10 text-primary",
};

const variantIcon: Record<AlertVariant, ReactNode> = {
	risk: <AlertTriangle className="h-4 w-4" />,
	cooldown: <ShieldAlert className="h-4 w-4" />,
	blocked: <AlertTriangle className="h-4 w-4" />,
	info: <Info className="h-4 w-4" />,
	success: <CheckCircle2 className="h-4 w-4" />,
};

export const AlertBanner = ({
	title,
	description,
	variant = "info",
}: AlertBannerProps) => (
	<div className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-xs", variantStyles[variant])}>
		<div className="mt-0.5">{variantIcon[variant]}</div>
		<div>
			<p className="font-semibold">{title}</p>
			{description && <p className="mt-1 text-xs">{description}</p>}
		</div>
	</div>
);
