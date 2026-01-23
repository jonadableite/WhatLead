"use client";

import { Activity, RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiSWR } from "@/lib/api/swr";
import { evaluateInstanceHealth } from "@/lib/instances/instance-api";
import type { InstanceHealthResponse } from "@/lib/instances/instance-types";

export default function InstanceHealthPageClient({
  instanceId,
}: {
  instanceId: string;
}) {
  const { data, error, isLoading, mutate } = useApiSWR<InstanceHealthResponse>(
    `/api/instances/${encodeURIComponent(instanceId)}/health`,
    { revalidateOnFocus: true, dedupingInterval: 5_000 },
  );

  const [isEvaluating, setIsEvaluating] = useState(false);

  const onEvaluate = async () => {
    setIsEvaluating(true);
    try {
      const next = await evaluateInstanceHealth(instanceId);
      await mutate(next, { revalidate: false });
      toast.success("Saúde reavaliada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao reavaliar");
    } finally {
      setIsEvaluating(false);
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
          href={`/instances/${encodeURIComponent(instanceId)}`}
          className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
        >
          &larr; Voltar
        </Link>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Saúde da instância
              </h1>
              <p className="text-sm text-white/60">
                Este painel reflete decisões do domínio (sem heurística da UI).
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              variant="outline"
              onClick={() => mutate()}
              disabled={isEvaluating}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={onEvaluate} disabled={isEvaluating}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              {isEvaluating ? "Reavaliando..." : "Reavaliar agora"}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border border-red-500/30 bg-red-500/10">
            <CardContent className="p-6 text-sm text-red-100">
              Não foi possível carregar a saúde desta instância.
            </CardContent>
          </Card>
        )}

        {isLoading || !data ? (
          <Card>
            <CardContent className="p-10 text-center text-white/60">
              Carregando...
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {data.instance.name}
                    </h2>
                    <p className="mt-1 text-sm text-white/60">
                      {data.instance.numberMasked}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
                      {data.health.status.lifecycle}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
                      {data.health.status.connection}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/70">
                      Risco {data.health.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/50">Temperatura</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {data.health.temperatureLevel}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/50">Score</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {data.health.reputationScore}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs text-white/50">Warmup phase</div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {data.health.warmUpPhase}
                    </div>
                  </div>
                </div>

                {data.health.cooldownReason && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                    Cooldown: {data.health.cooldownReason}
                  </div>
                )}

                <div className="mt-6">
                  <div className="text-sm font-semibold text-white">
                    Ações (domínio)
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {data.health.actions.map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-semibold text-white">
                    Alertas
                  </div>
                  {data.health.alerts.length ? (
                    <ul className="mt-2 space-y-2 text-sm text-white/70">
                      {data.health.alerts.map((a) => (
                        <li
                          key={a}
                          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                        >
                          {a}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-white/50">Sem alertas.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-sm font-semibold text-white">
                  Signals snapshot
                </div>
                <pre className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                  {JSON.stringify(data.health.signalsSnapshot, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
