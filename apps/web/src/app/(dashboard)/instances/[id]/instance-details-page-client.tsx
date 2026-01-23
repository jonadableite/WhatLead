"use client";

import { Activity, Link2, RefreshCw, ShieldAlert } from "lucide-react";
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
  GetInstanceResponse,
  InstanceListItem,
} from "@/lib/instances/instance-types";

const riskBadgeClasses = (risk: InstanceListItem["riskLevel"]): string => {
  if (risk === "HIGH") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (risk === "MEDIUM")
    return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
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

  const item = data?.instance;

  const onConnect = async () => {
    if (!item) return;
    setActionLoading(true);
    try {
      await connectInstance(item.id);
      await mutate();
      toast.success("Intenção de conexão registrada");
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
      toast.success("Intenção de reconexão registrada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao reconectar");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <Link
          href="/instances"
          className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
        >
          &larr; Voltar
        </Link>

        {error && (
          <Card className="border border-red-500/30 bg-red-500/10">
            <CardContent className="p-6 text-sm text-red-100">
              Instância não encontrada ou sem acesso.
            </CardContent>
          </Card>
        )}

        {isLoading || !item ? (
          <Card>
            <CardContent className="p-10 text-center text-white/60">
              Carregando...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
                      <Link2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-xl font-semibold text-white">
                          {item.name}
                        </h1>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${riskBadgeClasses(
                            item.riskLevel,
                          )}`}
                        >
                          Risco {item.riskLevel}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/60">
                        {item.numberMasked}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {item.lifecycleStatus}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {item.connectionStatus}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {item.engine}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                          {item.purpose}
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

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-white/80">
                  <ShieldAlert className="h-5 w-5 text-indigo-300" />
                  <div className="text-sm">{item.healthLabel}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.allowedActions.map((a) => (
                    <span
                      key={a}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
