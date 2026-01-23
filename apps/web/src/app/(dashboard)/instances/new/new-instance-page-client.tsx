"use client";

import { ChevronDown, Link2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createInstance } from "@/lib/instances/instance-api";
import type { InstancePurpose, WhatsAppEngine } from "@/lib/instances/instance-types";

const PURPOSES: Array<{
	value: InstancePurpose;
	title: string;
	description: string;
}> = [
	{
		value: "WARMUP",
		title: "Warmup",
		description: "Aquece com baixo risco antes de operar em escala.",
	},
	{
		value: "DISPATCH",
		title: "Dispatch",
		description: "Focada em disparo (requer saúde e reputação adequadas).",
	},
	{
		value: "MIXED",
		title: "Mixed",
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
		description: "Engine padrão (provider entra depois).",
	},
	{
		value: "EVOLUTION",
		title: "Evolution",
		description: "Alternativa (provider entra depois).",
	},
];

const normalizePhone = (raw: string): string =>
	raw.replace(/[^\d+]/g, "").replace(/\s+/g, "").trim();

export default function NewInstancePageClient() {
	const router = useRouter();
	const [displayName, setDisplayName] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [purpose, setPurpose] = useState<InstancePurpose>("WARMUP");
	const [engine, setEngine] = useState<WhatsAppEngine>("TURBOZAP");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const canSubmit = useMemo(() => {
		if (!displayName.trim()) return false;
		if (!normalizePhone(phoneNumber)) return false;
		return true;
	}, [displayName, phoneNumber]);

	const onSubmit = async () => {
		if (!canSubmit) return;
		setIsSubmitting(true);
		try {
			const res = await createInstance({
				displayName: displayName.trim(),
				phoneNumber: normalizePhone(phoneNumber),
				purpose,
				engine,
			});
			toast.success("Instância criada, aguardando conexão");
			router.push(`/instances/${encodeURIComponent(res.instance.id)}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Falha ao criar instância");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] p-4 md:p-8">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
				<div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
			</div>

			<div className="relative mx-auto max-w-2xl">
				<Link
					href="/instances"
					className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
				>
					&larr; Voltar
				</Link>

				<Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
					<div className="pointer-events-none absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-blue-400" />
					<div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-[120%] -translate-x-1/2 bg-gradient-to-r from-cyan-400/0 via-violet-400/35 to-blue-400/0 blur-2xl" />

					<CardContent className="p-8">
						<div className="mb-6 flex items-start gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
								<Link2 className="h-5 w-5" />
							</div>
							<div>
								<h1 className="text-2xl font-semibold tracking-tight text-white">
									Nova instância
								</h1>
								<p className="mt-1 text-sm text-white/60">
									Crie a instância (sem provider). O sistema só registra intenção e
									estado.
								</p>
							</div>
						</div>

						<div className="space-y-5">
							<div className="space-y-2">
								<label className="text-sm font-medium text-white">
									Nome da instância
								</label>
								<input
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder="Ex: WhatsApp SDR - Linha 1"
									className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 px-4 py-3 transition-all duration-200"
								/>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-white">
									Número (E.164 ou dígitos)
								</label>
								<input
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value)}
									placeholder="+55 11 99999-9999"
									className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 px-4 py-3 transition-all duration-200"
								/>
								<p className="text-xs text-white/40">
									Este número será mascarado na UI. A decisão do que fazer com ele é
									do domínio.
								</p>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-white">
									Purpose (uso principal)
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
													? "border-indigo-400/40 bg-indigo-500/15 text-white"
													: "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
											].join(" ")}
										>
											<div className="text-sm font-semibold">{p.title}</div>
											<div className="mt-1 text-xs text-white/50">
												{p.description}
											</div>
										</button>
									))}
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-sm font-medium text-white">
									Engine
								</label>
								<div className="relative">
									<select
										value={engine}
										onChange={(e) => setEngine(e.target.value as WhatsAppEngine)}
										className="w-full appearance-none rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 px-4 py-3 pr-10 transition-all duration-200"
									>
										{ENGINES.map((e) => (
											<option key={e.value} value={e.value}>
												{e.title}
											</option>
										))}
									</select>
									<ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
								</div>
								<div className="text-xs text-white/50">
									{ENGINES.find((e) => e.value === engine)?.description}
								</div>
							</div>

							<div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
								<Link href="/instances">
									<Button
										variant="outline"
										className="w-full sm:w-auto border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
									>
										Cancelar
									</Button>
								</Link>
								<Button
									onClick={onSubmit}
									disabled={!canSubmit || isSubmitting}
									className="w-full sm:w-auto"
								>
									<Plus className="mr-2 h-4 w-4" />
									{isSubmitting ? "Criando..." : "Criar instância"}
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

