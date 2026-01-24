"use client";

import {
	Activity,
	Clock,
	Link2,
	Pause,
	Play,
	RefreshCw,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiSWR } from "@/lib/api/swr";
import {
	connectInstance,
	reconnectInstance,
} from "@/lib/instances/instance-api";
import type {
	GetInstanceResponse,
	InstanceListItem,
} from "@/lib/instances/instance-types";
import {
	translateConnectionStatus,
	translateLifecycleStatus,
	translatePurpose,
	translateRiskLevel,
} from "@/lib/instances/instance-status-translations";
import type {
	ListMessageIntentsResponse,
	MessageIntentPurpose,
	MessageIntentStatus,
} from "@/lib/message-intents/message-intents-types";
import { pauseInstance, resumeInstance } from "@/lib/ops/ops-api";
import type {
	ExecutionMetricsSnapshot,
	MessageIntentTimelineResponse,
} from "@/lib/ops/ops-types";

type InstanceTab = "overview" | "metrics" | "timeline" | "settings";

const riskBadgeClasses = (risk: InstanceListItem["riskLevel"]): string => {
	if (risk === "HIGH")
		return "border-destructive/40 bg-destructive/10 text-destructive";
	if (risk === "MEDIUM")
		return "border-accent/40 bg-accent/10 text-accent-foreground";
	return "border-primary/40 bg-primary/10 text-primary";
};

const intentStatusLabel = (status: MessageIntentStatus): string => {
	switch (status) {
		case "APPROVED":
			return "Aprovado";
		case "QUEUED":
			return "Em fila";
		case "BLOCKED":
			return "Bloqueado";
		case "SENT":
			return "Enviado";
		case "DROPPED":
			return "Descartado";
		case "PENDING":
		default:
			return "Pendente";
	}
};

const intentPurposeLabel = (purpose: MessageIntentPurpose): string => {
	switch (purpose) {
		case "DISPATCH":
			return "Disparo";
		case "SCHEDULE":
			return "Agendamento";
		case "WARMUP":
		default:
			return "Aquecimento";
	}
};

const timelineEventLabel = (eventType: string): string => {
	const map: Record<string, string> = {
		MessageIntentCreated: "Intent criada",
		MessageIntentDecided: "Decisão do Gate",
		MessageApproved: "Mensagem aprovada",
		MessageBlocked: "Mensagem bloqueada",
		MessageQueued: "Mensagem em fila",
		ExecutionJobCreated: "Job criado",
		ExecutionJobExecuted: "Job executado",
		ExecutionJobFailed: "Falha de execução",
		ExecutionJobRetried: "Retry de execução",
		MessageSent: "Mensagem enviada",
		MessageDelivered: "Mensagem entregue",
		MessageRead: "Mensagem lida",
	};
	return map[eventType] ?? eventType;
};

export default function InstanceDetailsPageClient({
	instanceId,
}: {
	instanceId: string;
}) {
	const { data, error, isLoading, mutate } = useApiSWR<GetInstanceResponse>(
		`/api/instances/${encodeURIComponent(instanceId)}`,
		{ revalidateOnFocus: true },
	);
	const [actionLoading, setActionLoading] = useState(false);
	const [tab, setTab] = useState<InstanceTab>("overview");
	const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);

	const item = data?.instance;

	const metricsWindow60 = useApiSWR<ExecutionMetricsSnapshot>(
		tab === "metrics"
			? `/api/ops/instances/${encodeURIComponent(instanceId)}/metrics?window=60`
			: null,
	);
	const metricsWindow1440 = useApiSWR<ExecutionMetricsSnapshot>(
		tab === "metrics"
			? `/api/ops/instances/${encodeURIComponent(instanceId)}/metrics?window=1440`
			: null,
	);

	const intents = useApiSWR<ListMessageIntentsResponse>(
		tab === "timeline"
			? `/api/message-intents?instanceId=${encodeURIComponent(instanceId)}&limit=20`
			: null,
	);

	const timeline = useApiSWR<MessageIntentTimelineResponse>(
		selectedIntentId
			? `/api/ops/message-intents/${encodeURIComponent(selectedIntentId)}/timeline?limit=200`
			: null,
	);

	const onConnect = async () => {
		if (!item) return;
		setActionLoading(true);
		try {
			await connectInstance(item.id);
			await mutate();
			toast.success("Conexão iniciada.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Falha ao conectar");
		} finally {
			setActionLoading(false);
		}
	};

	const onReconnect = async () => {
		if (!item) return;
		setActionLoading(true);
		try {
			await reconnectInstance(item.id);
			await mutate();
			toast.success("Reconexão iniciada.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Falha ao reconectar");
		} finally {
			setActionLoading(false);
		}
	};

	const onPause = async () => {
		if (!item) return;
		setActionLoading(true);
		try {
			await pauseInstance(item.id, { reason: "Pausa solicitada no painel" });
			await mutate();
			toast.success("Instância pausada.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Falha ao pausar");
		} finally {
			setActionLoading(false);
		}
	};

	const onResume = async () => {
		if (!item) return;
		setActionLoading(true);
		try {
			await resumeInstance(item.id);
			await mutate();
			toast.success("Instância retomada.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Falha ao retomar");
		} finally {
			setActionLoading(false);
		}
	};

	const lastHourMetrics = metricsWindow60.data?.totals;
	const lastDayMetrics = metricsWindow1440.data?.totals;

	const tabs = useMemo(
		() => [
			{ id: "overview" as const, label: "Visão geral" },
			{ id: "metrics" as const, label: "Métricas" },
			{ id: "timeline" as const, label: "Auditoria" },
			{ id: "settings" as const, label: "Configurações" },
		],
		[],
	);

	return (
		<div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-background p-4 md:p-8">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
				<div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
			</div>

			<div className="relative mx-auto max-w-5xl space-y-4">
				<Link
					href="/instances"
					className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
				>
					&larr; Voltar
				</Link>

				{error && (
					<Card className="border border-destructive/30 bg-destructive/10">
						<CardContent className="p-6 text-sm text-destructive">
							Instância não encontrada ou sem acesso.
						</CardContent>
					</Card>
				)}

				{isLoading || !item ? (
					<Card>
						<CardContent className="p-10 text-center text-muted-foreground">
							Carregando...
						</CardContent>
					</Card>
				) : (
					<div className="space-y-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
									<div className="flex items-start gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-foreground">
											<Link2 className="h-5 w-5" />
										</div>
										<div>
											<div className="flex flex-wrap items-center gap-2">
												<h1 className="text-xl font-semibold text-foreground">
													{item.name}
												</h1>
												<span
													className={`rounded-full border px-2.5 py-1 text-xs ${riskBadgeClasses(
														item.riskLevel,
													)}`}
												>
													Risco {translateRiskLevel(item.riskLevel)}
												</span>
											</div>
											<p className="mt-1 text-sm text-muted-foreground">
												{item.numberMasked}
											</p>
											<div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												<span className="rounded-full border border-border bg-card px-2 py-1">
													{translateLifecycleStatus(item.lifecycleStatus)}
												</span>
												<span className="rounded-full border border-border bg-card px-2 py-1">
													{translateConnectionStatus(item.connectionStatus)}
												</span>
												<span className="rounded-full border border-border bg-card px-2 py-1">
													{item.engine}
												</span>
												<span className="rounded-full border border-border bg-card px-2 py-1">
													{translatePurpose(item.purpose)}
												</span>
											</div>
										</div>
									</div>

									<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
										<Button
											variant="outline"
											onClick={() => mutate()}
											disabled={actionLoading}
										>
											<RefreshCw className="mr-2 h-4 w-4" />
											Atualizar
										</Button>
										{item.allowedActions.includes("CONNECT") && (
											<Button
												variant="outline"
												onClick={onConnect}
												disabled={actionLoading}
											>
												Conectar
											</Button>
										)}
										{item.allowedActions.includes("RECONNECT") && (
											<Button
												variant="outline"
												onClick={onReconnect}
												disabled={actionLoading}
											>
												Reconectar
											</Button>
										)}
										<Link
											href={`/instances/${encodeURIComponent(item.id)}/health`}
										>
											<Button>
												<Activity className="mr-2 h-4 w-4" />
												Ver saúde
											</Button>
										</Link>
									</div>
								</div>
							</CardContent>
						</Card>

						<div className="flex flex-wrap gap-2">
							{tabs.map((tabItem) => (
								<Button
									key={tabItem.id}
									variant={tab === tabItem.id ? "default" : "outline"}
									onClick={() => setTab(tabItem.id)}
								>
									{tabItem.label}
								</Button>
							))}
						</div>

						{tab === "overview" && (
							<Card>
								<CardContent className="space-y-4 p-6">
									<div className="flex items-center gap-2 text-muted-foreground">
										<ShieldAlert className="h-5 w-5 text-primary" />
										<div className="text-sm">{item.healthLabel}</div>
									</div>
									<div className="grid gap-3 md:grid-cols-2">
										<div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
											<p className="font-semibold text-foreground">Status operacional</p>
											<p className="mt-1">
												{item.lifecycleStatus === "COOLDOWN"
													? "Cooldown ativo. Aguarde antes de retomar."
													: "Operação dentro dos limites atuais."}
											</p>
										</div>
										<div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
											<p className="font-semibold text-foreground">Última decisão</p>
											<p className="mt-1">
												{item.healthLabel || "Nenhuma decisão recente registrada."}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{tab === "metrics" && (
							<Card>
								<CardContent className="space-y-4 p-6">
									<div className="grid gap-3 md:grid-cols-2">
										<div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
											<div className="flex items-center gap-2 text-foreground">
												<Clock className="h-4 w-4 text-primary" />
												<p className="font-semibold">Última hora</p>
											</div>
											<div className="mt-3 space-y-1">
												<p>Jobs criados: {lastHourMetrics?.jobsCreated ?? 0}</p>
												<p>Mensagens enviadas: {lastHourMetrics?.messagesSent ?? 0}</p>
												<p>Falhas: {lastHourMetrics?.failedJobs ?? 0}</p>
												<p>Tentativas: {lastHourMetrics?.retries ?? 0}</p>
											</div>
										</div>
										<div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
											<div className="flex items-center gap-2 text-foreground">
												<Clock className="h-4 w-4 text-primary" />
												<p className="font-semibold">Últimas 24h</p>
											</div>
											<div className="mt-3 space-y-1">
												<p>Jobs criados: {lastDayMetrics?.jobsCreated ?? 0}</p>
												<p>Mensagens enviadas: {lastDayMetrics?.messagesSent ?? 0}</p>
												<p>Falhas: {lastDayMetrics?.failedJobs ?? 0}</p>
												<p>Tentativas: {lastDayMetrics?.retries ?? 0}</p>
											</div>
										</div>
									</div>
									<p className="text-xs text-muted-foreground">
										Cooldowns e alertas serão exibidos conforme forem registrados no
										core operacional.
									</p>
								</CardContent>
							</Card>
						)}

						{tab === "timeline" && (
							<div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
								<Card>
									<CardContent className="p-6">
										<h2 className="text-sm font-semibold text-foreground">
											Intents recentes
										</h2>
										{intents.isLoading ? (
											<p className="mt-3 text-sm text-muted-foreground">
												Carregando intents...
											</p>
										) : (intents.data?.items?.length ?? 0) === 0 ? (
											<p className="mt-3 text-sm text-muted-foreground">
												Nenhum intent encontrado para esta instância.
											</p>
										) : (
											<div className="mt-4 space-y-2">
												{intents.data?.items.map((intent) => (
													<button
														key={intent.id}
														type="button"
														onClick={() => setSelectedIntentId(intent.id)}
														className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${
															selectedIntentId === intent.id
																? "border-primary/40 bg-primary/10"
																: "border-border bg-card hover:bg-muted"
														}`}
													>
														<p className="font-semibold text-foreground">
															{intent.target.value}
														</p>
														<p className="mt-1 text-xs text-muted-foreground">
															{intentPurposeLabel(intent.purpose)} •{" "}
															{intentStatusLabel(intent.status)}
														</p>
													</button>
												))}
											</div>
										)}
									</CardContent>
								</Card>
								<Card>
									<CardContent className="p-6">
										<h2 className="text-sm font-semibold text-foreground">
											Timeline do intent
										</h2>
										{!selectedIntentId && (
											<p className="mt-3 text-sm text-muted-foreground">
												Selecione um intent para ver a linha do tempo.
											</p>
										)}
										{selectedIntentId && timeline.isLoading && (
											<p className="mt-3 text-sm text-muted-foreground">
												Carregando timeline...
											</p>
										)}
										{timeline.data && (
											<div className="mt-4 space-y-3">
												{timeline.data.events.map((event) => (
													<div
														key={event.id}
														className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground"
													>
														<p className="font-semibold text-foreground">
															{timelineEventLabel(event.eventType)}
														</p>
														<p className="mt-1">
															{new Date(event.occurredAt).toLocaleString("pt-BR")}
														</p>
													</div>
												))}
											</div>
										)}
									</CardContent>
								</Card>
							</div>
						)}

						{tab === "settings" && (
							<Card>
								<CardContent className="space-y-4 p-6">
									<p className="text-sm text-muted-foreground">
										Controle operacional da instância.
									</p>
									<div className="flex flex-col gap-2 sm:flex-row">
										<Button
											variant="outline"
											onClick={onPause}
											disabled={actionLoading}
										>
											<Pause className="mr-2 h-4 w-4" />
											Pausar instância
										</Button>
										<Button
											variant="outline"
											onClick={onResume}
											disabled={actionLoading}
										>
											<Play className="mr-2 h-4 w-4" />
											Retomar instância
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
