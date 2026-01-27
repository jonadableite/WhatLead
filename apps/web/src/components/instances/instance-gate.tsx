"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiSWR } from "@/lib/api/swr";
import { useSession } from "@/lib/auth-client";
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
  const { data: session, isPending: isSessionPending } = useSession();
  const isInstancesRoute = pathname?.startsWith("/instances") ?? false;
  const shouldFetchGate = !isSessionPending && !!session?.user;

  const { data, isLoading } = useApiSWR<GateResponse>(
    shouldFetchGate ? "/api/instances/gate" : null,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
    },
  );

  const blocked =
    shouldFetchGate && !isInstancesRoute && !isLoading && !!data && data.state !== "READY";

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
          <Card className="w-full max-w-xl bg-[#0D0D0D]/70">
            <CardContent className="p-6 md:p-8">
              <h2 className="text-lg font-semibold text-white">
                Plataforma aguardando instância saudável
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {(data as GateResponseBlocked).message}
              </p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Link href="/instances">
                  <Button variant="outline" className="w-full sm:w-auto">
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
