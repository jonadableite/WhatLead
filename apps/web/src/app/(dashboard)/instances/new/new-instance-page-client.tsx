"use client";

import { ChevronDown, CheckCircle2, Link2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QRCodeConnectionStep } from "@/components/instances/qr-code-connection-step";
import { createInstance } from "@/lib/instances/instance-api";
import type {
	InstanceListItem,
	InstancePurpose,
	WhatsAppEngine,
} from "@/lib/instances/instance-types";

const PURPOSES: Array<{
  value: InstancePurpose;
  title: string;
  description: string;
}> = [
  {
    value: "WARMUP",
		title: "Aquecimento",
		description: "Aquecimento gradual antes de operar em escala.",
  },
  {
    value: "DISPATCH",
		title: "Disparo",
		description: "Envio controlado (requer saúde e reputação adequadas).",
  },
  {
    value: "MIXED",
		title: "Misto",
		description: "Equilíbrio entre aquecimento e disparo.",
  },
];

const ENGINES: Array<{
  value: WhatsAppEngine;
  title: string;
  description: string;
}> = [
  {
    value: "TURBOZAP",
    title: "TurboZap",
		description: "Engine padrão para conexões rápidas.",
  },
  {
    value: "EVOLUTION",
    title: "Evolution",
		description: "Engine alternativa (quando disponível).",
  },
];

const normalizePhone = (raw: string): string =>
  raw
    .replace(/[^\d+]/g, "")
    .replace(/\s+/g, "")
    .trim();

export default function NewInstancePageClient() {
  const router = useRouter();
	const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [purpose, setPurpose] = useState<InstancePurpose>("WARMUP");
  const [engine, setEngine] = useState<WhatsAppEngine>("TURBOZAP");
  const [isSubmitting, setIsSubmitting] = useState(false);
	const [createdInstance, setCreatedInstance] = useState<InstanceListItem | null>(null);
	const [isConnected, setIsConnected] = useState(false);

  const canSubmit = useMemo(() => {
    if (!displayName.trim()) return false;
    if (!normalizePhone(phoneNumber)) return false;
    return true;
  }, [displayName, phoneNumber]);

	const onCreate = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await createInstance({
        displayName: displayName.trim(),
        phoneNumber: normalizePhone(phoneNumber),
        purpose,
        engine,
      });
			setCreatedInstance(res.instance);
			setStep(3);
			toast.success("Instância criada. Vamos conectar o WhatsApp.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao criar instância",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
		<div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-background p-4 md:p-8">
      <div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/10 blur-[100px]" />
				<div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <Link
          href="/instances"
					className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Voltar
        </Link>

        <Card>
          <CardContent className="p-8">
            <div className="mb-6 flex items-start gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-foreground">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
								<h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Nova instância
                </h1>
								<p className="mt-1 text-sm text-muted-foreground">
									Crie e conecte sua instância em poucos passos.
                </p>
              </div>
            </div>

						<div className="space-y-6">
							<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
								{[
									{ id: 1, label: "Configuração" },
									{ id: 2, label: "Criar instância" },
									{ id: 3, label: "Conectar WhatsApp" },
								].map((item) => (
									<div
										key={item.id}
										className={`rounded-lg border px-3 py-2 text-center ${
											step === item.id
												? "border-primary/40 bg-primary/10 text-primary"
												: "border-border bg-card"
										}`}
									>
										{item.label}
									</div>
								))}
							</div>

							{step === 1 && (
								<div className="space-y-5">
									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground">
											Nome da instância
										</label>
										<input
											value={displayName}
											onChange={(e) => setDisplayName(e.target.value)}
											placeholder="Ex: WhatsApp SDR - Linha 1"
											className="input-premium"
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground">
											Número (E.164 ou dígitos)
										</label>
										<input
											value={phoneNumber}
											onChange={(e) => setPhoneNumber(e.target.value)}
											placeholder="+55 11 99999-9999"
											className="input-premium"
										/>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground">
											Uso principal da instância
										</label>
										<div className="grid gap-3 sm:grid-cols-3">
											{PURPOSES.map((p) => (
												<button
													key={p.value}
													type="button"
													onClick={() => setPurpose(p.value)}
													className={[
														"rounded-xl border px-4 py-3 text-left transition-all",
														purpose === p.value
															? "border-primary/40 bg-primary/10 text-foreground"
															: "border-border bg-card text-muted-foreground hover:bg-muted",
													].join(" ")}
												>
													<div className="text-sm font-semibold">{p.title}</div>
													<div className="mt-1 text-xs text-muted-foreground">
														{p.description}
													</div>
												</button>
											))}
										</div>
									</div>

									<div className="space-y-2">
										<label className="text-sm font-medium text-foreground">
											Engine
										</label>
										<div className="relative">
											<select
												value={engine}
												onChange={(e) =>
													setEngine(e.target.value as WhatsAppEngine)
												}
												className="input-premium appearance-none pr-10"
											>
												{ENGINES.map((e) => (
													<option key={e.value} value={e.value}>
														{e.title}
													</option>
												))}
											</select>
											<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										</div>
										<div className="text-xs text-muted-foreground">
											{ENGINES.find((e) => e.value === engine)?.description}
										</div>
									</div>

									<div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
										<Link href="/instances">
											<Button variant="outline" className="w-full sm:w-auto">
												Cancelar
											</Button>
										</Link>
										<Button
											onClick={() => setStep(2)}
											disabled={!canSubmit}
											className="w-full sm:w-auto"
										>
											Continuar
										</Button>
									</div>
								</div>
							)}

							{step === 2 && (
								<div className="space-y-4">
									<div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
										<p className="text-foreground font-semibold">
											Resumo da instância
										</p>
										<p className="mt-1">Nome: {displayName}</p>
										<p>Número: {normalizePhone(phoneNumber)}</p>
										<p>Propósito: {PURPOSES.find((p) => p.value === purpose)?.title}</p>
										<p>Engine: {ENGINES.find((e) => e.value === engine)?.title}</p>
									</div>

									<div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
										<Button variant="outline" onClick={() => setStep(1)}>
											Voltar
										</Button>
										<Button
											onClick={onCreate}
											disabled={!canSubmit || isSubmitting}
										>
											<Plus className="mr-2 h-4 w-4" />
											{isSubmitting ? "Criando..." : "Criar instância"}
										</Button>
									</div>
								</div>
							)}

							{step === 3 && createdInstance && (
								<div className="space-y-4">
									<div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
										<CheckCircle2 className="h-4 w-4 text-primary" />
										<span>
											Instância criada: <strong>{createdInstance.name}</strong>
										</span>
									</div>

									<QRCodeConnectionStep
										instanceId={createdInstance.id}
										onConnected={() => setIsConnected(true)}
									/>

									<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
										<Button variant="outline" onClick={() => setStep(2)}>
											Voltar
										</Button>
										<Button
											onClick={() =>
												router.push(
													`/instances/${encodeURIComponent(createdInstance.id)}`,
												)
											}
											disabled={!isConnected}
										>
											Ver instância
										</Button>
									</div>
								</div>
							)}
						</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
