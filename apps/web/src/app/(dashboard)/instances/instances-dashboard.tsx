"use client";

import {
	Building2,
	Link2,
	Pause,
	Play,
	Plus,
	RefreshCw,
	ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { QRCodeConnectionStep } from "@/components/instances/qr-code-connection-step";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useApiSWR } from "@/lib/api/swr";
import { pauseInstance, resumeInstance } from "@/lib/ops/ops-api";
import type { ExecutionMetricsSnapshot } from "@/lib/ops/ops-types";
import {
	getConnectionStatus,
  reconnectInstance,
} from "@/lib/instances/instance-api";
import type {
  InstanceListItem,
  ListInstancesResponse,
} from "@/lib/instances/instance-types";
import {
	translateConnectionStatus,
	translateLifecycleStatus,
	translatePurpose,
	translateRiskLevel,
} from "@/lib/instances/instance-status-translations";

const riskBadgeClasses = (risk: InstanceListItem["riskLevel"]): string => {
	if (risk === "HIGH")
		return "border-destructive/40 bg-destructive/10 text-destructive";
	if (risk === "MEDIUM")
		return "border-accent/40 bg-accent/10 text-accent-foreground";
	return "border-primary/40 bg-primary/10 text-primary";
};

const statusPill = (label: string) => (
	<span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground">
    {label}
  </span>
);

export default function InstancesDashboard() {
  const { data, error, isLoading, mutate } = useApiSWR<ListInstancesResponse>(
    "/api/instances",
    {
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    },
  );
	const { data: metrics } = useApiSWR<ExecutionMetricsSnapshot>(
		"/api/ops/metrics?window=60",
		{
			revalidateOnFocus: false,
			dedupingInterval: 10_000,
		},
	);

  const [actionInstanceId, setActionInstanceId] = useState<string | null>(null);
	const [connectModalOpen, setConnectModalOpen] = useState(false);
	const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
		null,
	);

  const onConnect = async (instanceId: string) => {
		setSelectedInstanceId(instanceId);
		setConnectModalOpen(true);
  };

  const onReconnect = async (instanceId: string) => {
    setActionInstanceId(instanceId);
    try {
      await reconnectInstance(instanceId);
			await getConnectionStatus(instanceId);
      await mutate();
			toast.success("Reconexão iniciada. Acompanhe o status.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao reconectar");
    } finally {
      setActionInstanceId(null);
    }
  };

	const onPause = async (instanceId: string) => {
		setActionInstanceId(instanceId);
		try {
			await pauseInstance(instanceId, { reason: "Pausa solicitada no painel" });
			await mutate();
			toast.success("Instância pausada.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Falha ao pausar");
		} finally {
			setActionInstanceId(null);
		}
	};

	const onResume = async (instanceId: string) => {
		setActionInstanceId(instanceId);
		try {
			await resumeInstance(instanceId);
			await mutate();
			toast.success("Instância retomada.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Falha ao retomar");
		} finally {
			setActionInstanceId(null);
		}
	};

	const handleConnectModalOpenChange = (open: boolean) => {
		setConnectModalOpen(open);
		if (!open) {
			setSelectedInstanceId(null);
		}
	};

	const handleConnected = async () => {
		setConnectModalOpen(false);
		setSelectedInstanceId(null);
		await mutate();
		toast.success("Instância conectada com sucesso.");
	};

	return (
		<div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-background p-4 md:p-8">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
				<div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
			</div>

			<div className="relative mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-foreground">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
								<h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Instâncias
              </h1>
								<p className="text-sm text-muted-foreground">
                O recurso escasso que define risco, custo e escala.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={() => mutate()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Link href="/instances/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova instância
              </Button>
            </Link>
          </div>
        </div>

				{error && (
					<Card className="border border-destructive/30 bg-destructive/10">
						<CardContent className="p-6 text-sm text-destructive">
              Não foi possível carregar suas instâncias.
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
						<CardContent className="p-10 text-center text-muted-foreground">
              Carregando...
            </CardContent>
          </Card>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
							<Building2 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
							<h2 className="text-lg font-semibold text-foreground">
                Sem instâncias ainda
              </h2>
							<p className="mt-2 text-sm text-muted-foreground">
                Sem uma instância, o Agent não age, o Gate não tem contexto e a
                plataforma fica “cinza”.
              </p>
              <div className="mt-6">
                <Link href="/instances/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar instância
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
					<div className="grid gap-4 md:grid-cols-2">
            {data?.items.map((item) => (
              <Card
                key={item.id}
								className="transition-all hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
													<h3 className="text-base font-semibold text-foreground">
                            {item.name}
                          </h3>
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
                      </div>
					<div className="flex items-center gap-2 text-xs">
						{statusPill(translateLifecycleStatus(item.lifecycleStatus))}
						{statusPill(translateConnectionStatus(item.connectionStatus))}
					</div>
                    </div>

										<div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
											<ShieldAlert className="h-4 w-4 text-primary" />
                      <span className="truncate">{item.healthLabel}</span>
                    </div>

				{item.lifecycleStatus === "COOLDOWN" && (
					<AlertBanner
						variant="cooldown"
						title="Instância em cooldown"
						description="Evite disparos até a retomada para reduzir risco operacional."
					/>
				)}
				{item.riskLevel === "HIGH" && (
					<AlertBanner
						variant="risk"
						title="Risco elevado detectado"
						description="Reduza volume e priorize qualidade antes de continuar."
					/>
				)}

										<div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
					<span>Mensagens enviadas (última hora)</span>
											<span className="font-semibold text-foreground">
						{metrics?.byInstance.find((metric) => metric.instanceId === item.id)
							?.messagesSent ?? 0}
					</span>
				</div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
											<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
												<span className="rounded-full border border-border bg-card px-2 py-1">
							{item.engine}
                        </span>
												<span className="rounded-full border border-border bg-card px-2 py-1">
							{translatePurpose(item.purpose)}
                        </span>
												<span className="rounded-full border border-border bg-card px-2 py-1">
							Risco {translateRiskLevel(item.riskLevel)}
						</span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        {item.allowedActions.includes("CONNECT") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionInstanceId === item.id}
                            onClick={() => onConnect(item.id)}
                          >
                            Conectar
                          </Button>
                        )}
                        {item.allowedActions.includes("RECONNECT") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionInstanceId === item.id}
                            onClick={() => onReconnect(item.id)}
                          >
                            Reconectar
                          </Button>
                        )}
						<Button
							variant="outline"
							size="sm"
							disabled={actionInstanceId === item.id}
							onClick={() => onPause(item.id)}
						>
							<Pause className="mr-2 h-3.5 w-3.5" />
							Pausar
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={actionInstanceId === item.id}
							onClick={() => onResume(item.id)}
						>
							<Play className="mr-2 h-3.5 w-3.5" />
							Retomar
						</Button>
                        <Link
                          href={`/instances/${encodeURIComponent(item.id)}`}
                        >
                          <Button size="sm">Detalhes</Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
				<Dialog
					open={connectModalOpen}
					onOpenChange={handleConnectModalOpenChange}
				>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>Conectar WhatsApp</DialogTitle>
							<DialogDescription>
								Leia o QR Code no WhatsApp para ativar a instância.
							</DialogDescription>
						</DialogHeader>
						{selectedInstanceId ? (
							<QRCodeConnectionStep
								instanceId={selectedInstanceId}
								onConnected={handleConnected}
							/>
						) : null}
					</DialogContent>
				</Dialog>
      </div>
    </div>
  );
}
