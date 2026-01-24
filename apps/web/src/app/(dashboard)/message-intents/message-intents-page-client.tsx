"use client";

import { ListFilter, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiSWR } from "@/lib/api/swr";
import type { ListInstancesResponse } from "@/lib/instances/instance-types";
import type {
	ListMessageIntentsResponse,
	MessageIntentPurpose,
	MessageIntentStatus,
} from "@/lib/message-intents/message-intents-types";
import type { MessageIntentTimelineResponse } from "@/lib/ops/ops-types";

const STATUS_OPTIONS: Array<{ value: MessageIntentStatus; label: string }> = [
	{ value: "PENDING", label: "Pendente" },
	{ value: "APPROVED", label: "Aprovado" },
	{ value: "QUEUED", label: "Em fila" },
	{ value: "BLOCKED", label: "Bloqueado" },
	{ value: "DROPPED", label: "Descartado" },
	{ value: "SENT", label: "Enviado" },
];

const PURPOSE_OPTIONS: Array<{ value: MessageIntentPurpose; label: string }> = [
	{ value: "WARMUP", label: "Aquecimento" },
	{ value: "DISPATCH", label: "Disparo" },
	{ value: "SCHEDULE", label: "Agendamento" },
];

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

export default function MessageIntentsPageClient() {
	const [status, setStatus] = useState<MessageIntentStatus | "">("");
	const [purpose, setPurpose] = useState<MessageIntentPurpose | "">("");
	const [instanceId, setInstanceId] = useState("");
	const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);

	const instances = useApiSWR<ListInstancesResponse>("/api/instances");

	const queryString = useMemo(() => {
		const params = new URLSearchParams();
		if (status) params.set("status", status);
		if (purpose) params.set("purpose", purpose);
		if (instanceId) params.set("instanceId", instanceId);
		params.set("limit", "50");
		return params.toString();
	}, [status, purpose, instanceId]);

	const intents = useApiSWR<ListMessageIntentsResponse>(
		`/api/message-intents${queryString ? `?${queryString}` : ""}`,
		{
			revalidateOnFocus: true,
			dedupingInterval: 5_000,
		},
	);

	const timeline = useApiSWR<MessageIntentTimelineResponse>(
		selectedIntentId
			? `/api/ops/message-intents/${encodeURIComponent(selectedIntentId)}/timeline?limit=200`
			: null,
	);

	return (
		<div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-background p-4 md:p-8">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
				<div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
			</div>

			<div className="relative mx-auto max-w-6xl space-y-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-2xl font-semibold text-foreground">
							Intents de Mensagem
						</h1>
						<p className="text-sm text-muted-foreground">
							Visualize decisões do Gate e o histórico operacional.
						</p>
					</div>
					<Button variant="outline" onClick={() => intents.mutate()}>
						<RefreshCw className="mr-2 h-4 w-4" />
						Atualizar
					</Button>
				</div>

				<Card>
					<CardContent className="grid gap-4 p-6 md:grid-cols-4">
						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground">
								Status
							</label>
							<select
								className="input-premium"
								value={status}
								onChange={(event) =>
									setStatus(event.target.value as MessageIntentStatus | "")
								}
							>
								<option value="">Todos</option>
								{STATUS_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<label className="text-xs font-medium text-muted-foreground">
								Propósito
							</label>
							<select
								className="input-premium"
								value={purpose}
								onChange={(event) =>
									setPurpose(event.target.value as MessageIntentPurpose | "")
								}
							>
								<option value="">Todos</option>
								{PURPOSE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2 md:col-span-2">
							<label className="text-xs font-medium text-muted-foreground">
								Instância
							</label>
							<select
								className="input-premium"
								value={instanceId}
								onChange={(event) => setInstanceId(event.target.value)}
							>
								<option value="">Todas</option>
								{instances.data?.items.map((instance) => (
									<option key={instance.id} value={instance.id}>
										{instance.name}
									</option>
								))}
							</select>
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<ListFilter className="h-4 w-4 text-primary" />
						<span>{intents.data?.items.length ?? 0} intents</span>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
					<Card>
						<CardContent className="p-6">
							{intents.isLoading ? (
								<p className="text-sm text-muted-foreground">
									Carregando intents...
								</p>
							) : (intents.data?.items?.length ?? 0) === 0 ? (
								<p className="text-sm text-muted-foreground">
									Nenhum intent encontrado.
								</p>
							) : (
								<div className="space-y-2">
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
												{STATUS_OPTIONS.find((o) => o.value === intent.status)?.label} •{" "}
												{PURPOSE_OPTIONS.find((o) => o.value === intent.purpose)?.label}
											</p>
											<p className="mt-1 text-xs text-muted-foreground">
												{new Date(intent.createdAt).toLocaleString("pt-BR")}
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
									Selecione um intent para ver detalhes.
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
			</div>
		</div>
	);
}
