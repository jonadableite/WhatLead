"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiSWR } from "@/lib/api/swr";
import { cn } from "@/lib/utils";

type InstanceGateState = "READY" | "NO_INSTANCE" | "NOT_HEALTHY";

interface GateResponseReady {
  state: "READY";
}

interface GateResponseBlocked {
  state: "NO_INSTANCE" | "NOT_HEALTHY";
  message: string;
  recommendedAction: "CREATE_INSTANCE" | "OPEN_INSTANCES";
}

type GateResponse = GateResponseReady | GateResponseBlocked;

export function InstanceGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isInstancesRoute = pathname?.startsWith("/instances") ?? false;

  const { data, isLoading } = useApiSWR<GateResponse>("/api/instances/gate", {
    revalidateOnFocus: true,
    dedupingInterval: 10_000,
  });

  const blocked =
    !isInstancesRoute && !isLoading && !!data && data.state !== "READY";

  return (
    <div className="relative">
      <div
        className={cn(
          blocked &&
            "pointer-events-none select-none grayscale opacity-35 blur-[0.2px]",
        )}
      >
        {children}
      </div>

      {blocked && (
        <div className="absolute inset-0 z-50 flex items-start justify-center p-4 pt-10 md:pt-16">
          <Card className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0D0D0D]/70 backdrop-blur-xl shadow-2xl">
            <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-blue-400" />
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white">
                Plataforma aguardando instância saudável
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {(data as GateResponseBlocked).message}
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Link href="/instances">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                  >
                    Ver instâncias
                  </Button>
                </Link>
                <Link href="/instances/new">
                  <Button className="w-full sm:w-auto">Criar instância</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
