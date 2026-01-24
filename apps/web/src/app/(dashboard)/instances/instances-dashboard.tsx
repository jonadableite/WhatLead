"use client";

import { Building2, Link2, Plus, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiSWR } from "@/lib/api/swr";
import {
  connectInstance,
  reconnectInstance,
} from "@/lib/instances/instance-api";
import type {
  InstanceListItem,
  ListInstancesResponse,
} from "@/lib/instances/instance-types";

const riskBadgeClasses = (risk: InstanceListItem["riskLevel"]): string => {
  if (risk === "HIGH") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (risk === "MEDIUM")
    return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
};

const statusPill = (label: string) => (
  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
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

  const [actionInstanceId, setActionInstanceId] = useState<string | null>(null);

  const onConnect = async (instanceId: string) => {
    setActionInstanceId(instanceId);
    try {
      await connectInstance(instanceId);
      await mutate();
      toast.success("Intenção de conexão registrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao conectar");
    } finally {
      setActionInstanceId(null);
    }
  };

  const onReconnect = async (instanceId: string) => {
    setActionInstanceId(instanceId);
    try {
      await reconnectInstance(instanceId);
      await mutate();
      toast.success("Intenção de reconexão registrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao reconectar");
    } finally {
      setActionInstanceId(null);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Instâncias
              </h1>
              <p className="text-sm text-white/60">
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
          <Card className="border border-red-500/30 bg-red-500/10">
            <CardContent className="p-6 text-sm text-red-100">
              Não foi possível carregar suas instâncias.
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="p-10 text-center text-white/60">
              Carregando...
            </CardContent>
          </Card>
        ) : (data?.items?.length ?? 0) === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <Building2 className="mx-auto mb-4 h-10 w-10 text-white/60" />
              <h2 className="text-lg font-semibold text-white">
                Sem instâncias ainda
              </h2>
              <p className="mt-2 text-sm text-white/60">
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
                className="transition-all hover:brightness-110"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-white">
                            {item.name}
                          </h3>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs ${riskBadgeClasses(
                              item.riskLevel,
                            )}`}
                          >
                            Risco{" "}
                            {item.riskLevel === "LOW"
                              ? "BAIXO"
                              : item.riskLevel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white/60">
                          {item.numberMasked}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {statusPill(item.lifecycleStatus)}
                        {statusPill(item.connectionStatus)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/70">
                      <ShieldAlert className="h-4 w-4 text-indigo-300" />
                      <span className="truncate">{item.healthLabel}</span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {item.engine}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {item.purpose}
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
      </div>
    </div>
  );
}
