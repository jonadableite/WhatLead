"use client";

import { StatusBadge } from "./status-badge";

export type ExecutionState =
	| "PENDING"
	| "PROCESSING"
	| "SENT"
	| "FAILED"
	| "RETRY";

interface ExecutionStateChipProps {
	status: ExecutionState;
}

const statusConfig: Record<
	ExecutionState,
	{ label: string; variant: "neutral" | "primary" | "success" | "warning" | "danger" }
> = {
	PENDING: { label: "Pendente", variant: "neutral" },
	PROCESSING: { label: "Processando", variant: "primary" },
	SENT: { label: "Enviado", variant: "success" },
	FAILED: { label: "Falhou", variant: "danger" },
	RETRY: { label: "Tentando", variant: "warning" },
};

export const ExecutionStateChip = ({ status }: ExecutionStateChipProps) => (
	<StatusBadge label={statusConfig[status].label} variant={statusConfig[status].variant} />
);
