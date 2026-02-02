"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExecutionJob {
	id: string;
	type: string;
	status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
	scheduledFor: string;
	attempts: number;
	maxAttempts: number;
	lastError: string | null;
	createdAt: string;
	executedAt: string | null;
	failedAt: string | null;
	cancelledAt: string | null;
}

interface ExecutionJobsPanelProps {
	jobs: ExecutionJob[];
	isLoading: boolean;
}

const JOB_TYPE_LABELS: Record<string, string> = {
	WARMUP_CHECK: "Verificação de Warmup",
	SLA_TIMEOUT: "Timeout de SLA",
	ASSIGNMENT_EVALUATION: "Avaliação de Atribuição",
	AUTO_CLOSE_CONVERSATION: "Fechamento Automático",
	WEBHOOK_DISPATCH: "Envio de Webhook",
};

const STATUS_CONFIG: Record<
	string,
	{ label: string; icon: typeof Clock; className: string }
> = {
	PENDING: {
		label: "Pendente",
		icon: Clock,
		className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
	},
	RUNNING: {
		label: "Executando",
		icon: Loader2,
		className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
	},
	COMPLETED: {
		label: "Concluído",
		icon: CheckCircle2,
		className: "bg-green-500/10 text-green-400 border-green-500/20",
	},
	FAILED: {
		label: "Falhou",
		icon: XCircle,
		className: "bg-red-500/10 text-red-400 border-red-500/20",
	},
	CANCELLED: {
		label: "Cancelado",
		icon: AlertCircle,
		className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
	},
};

export function ExecutionJobsPanel({ jobs, isLoading }: ExecutionJobsPanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);

	const pendingCount = jobs.filter((j) => j.status === "PENDING" || j.status === "RUNNING").length;
	const failedCount = jobs.filter((j) => j.status === "FAILED").length;

	if (jobs.length === 0 && !isLoading) {
		return null;
	}

	return (
		<div className="border-t border-white/10 bg-black/20">
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-white/5"
			>
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
						Tarefas de Execução
					</span>
					{pendingCount > 0 && (
						<Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
							{pendingCount} pendente{pendingCount > 1 ? "s" : ""}
						</Badge>
					)}
					{failedCount > 0 && (
						<Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-red-500/10 text-red-400 border-red-500/20">
							{failedCount} falha{failedCount > 1 ? "s" : ""}
						</Badge>
					)}
				</div>
				{isExpanded ? (
					<ChevronUp className="h-4 w-4 text-zinc-400" />
				) : (
					<ChevronDown className="h-4 w-4 text-zinc-400" />
				)}
			</button>

			{isExpanded && (
				<div className="max-h-48 overflow-y-auto px-4 pb-3">
					{isLoading ? (
						<div className="flex items-center justify-center py-4">
							<Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
							<span className="ml-2 text-xs text-zinc-400">Carregando...</span>
						</div>
					) : (
						<div className="space-y-2">
							{jobs.map((job) => (
								<JobItem key={job.id} job={job} />
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

function JobItem({ job }: { job: ExecutionJob }) {
	const config = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING;
	const Icon = config.icon;
	const isRunning = job.status === "RUNNING";

	return (
		<div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-2">
			<div className="flex items-center gap-3">
				<div className={cn("rounded-full p-1.5", config.className)}>
					<Icon className={cn("h-3 w-3", isRunning && "animate-spin")} />
				</div>
				<div>
					<p className="text-xs font-medium text-white">
						{JOB_TYPE_LABELS[job.type] ?? job.type}
					</p>
					<p className="text-[10px] text-zinc-500">
						{job.status === "COMPLETED" && job.executedAt
							? `Executado ${formatDistanceToNow(new Date(job.executedAt), { addSuffix: true, locale: ptBR })}`
							: job.status === "FAILED" && job.failedAt
								? `Falhou ${formatDistanceToNow(new Date(job.failedAt), { addSuffix: true, locale: ptBR })}`
								: job.status === "CANCELLED" && job.cancelledAt
									? `Cancelado ${formatDistanceToNow(new Date(job.cancelledAt), { addSuffix: true, locale: ptBR })}`
									: `Agendado para ${formatDistanceToNow(new Date(job.scheduledFor), { addSuffix: true, locale: ptBR })}`}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-2">
				{job.attempts > 0 && (
					<span className="text-[10px] text-zinc-500">
						{job.attempts}/{job.maxAttempts}
					</span>
				)}
				<Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", config.className)}>
					{config.label}
				</Badge>
			</div>
		</div>
	);
}
