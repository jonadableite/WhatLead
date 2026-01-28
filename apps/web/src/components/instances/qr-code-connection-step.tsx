"use client";

import { AlertTriangle, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApiSWR } from "@/lib/api/swr";
import {
    connectInstance,
    getConnectionStatus,
    getQRCode,
} from "@/lib/instances/instance-api";
import { translateConnectionStatus } from "@/lib/instances/instance-status-translations";
import type {
    ConnectInstanceResponse,
    InstanceConnectionStatus,
    InstanceConnectionStatusResponse,
    InstanceQRCodeResponse,
} from "@/lib/instances/instance-types";

interface QRCodeConnectionStepProps {
	instanceId: string;
	onConnected: () => void;
}

const STATUS_REFRESH_INTERVAL_MS = 3_000;
const STATUS_CONNECTED_INTERVAL_MS = 15_000;
const STATUS_IDLE_INTERVAL_MS = 8_000;
const QRCODE_REFRESH_INTERVAL_MS = 12_000;

const statusMessage = (status: InstanceConnectionStatus): string => {
	switch (status) {
		case "QRCODE":
			return "Aguardando leitura do QR Code";
		case "CONNECTING":
			return "Conectando...";
		case "CONNECTED":
			return "Conectado com sucesso";
		case "ERROR":
			return "Falha ao conectar. Tente novamente.";
		case "DISCONNECTED":
		default:
			return "Instância desconectada. Gere um novo QR Code.";
	}
};

export const QRCodeConnectionStep = ({
	instanceId,
	onConnected,
}: QRCodeConnectionStepProps) => {
	const hasTriggeredConnect = useRef(false);
	const [connectError, setConnectError] = useState<string | null>(null);
	const [localQrCode, setLocalQrCode] = useState<string | null>(null);
	const [isConnecting, setIsConnecting] = useState(false);

	const { data: statusData, mutate: refreshStatus } =
		useApiSWR<InstanceConnectionStatusResponse>(
			instanceId
				? `/api/instances/${encodeURIComponent(instanceId)}/connection-status`
				: null,
			{
				refreshInterval: (data) => {
					const status = data?.connection.status ?? "DISCONNECTED";
					if (status === "CONNECTED") return STATUS_CONNECTED_INTERVAL_MS;
					if (status === "QRCODE" || status === "CONNECTING") {
						return STATUS_REFRESH_INTERVAL_MS;
					}
					return STATUS_IDLE_INTERVAL_MS;
				},
				revalidateOnFocus: true,
			},
		);

	const { data: qrData, mutate: refreshQrCode, isLoading: isQrLoading } =
		useApiSWR<InstanceQRCodeResponse>(
			statusData?.connection.status === "QRCODE"
				? `/api/instances/${encodeURIComponent(instanceId)}/qrcode`
				: null,
			{
				refreshInterval: statusData?.connection.status === "QRCODE"
					? QRCODE_REFRESH_INTERVAL_MS
					: 0,
				revalidateOnFocus: false,
			},
		);

	const connectionStatus = statusData?.connection.status ?? "DISCONNECTED";
	const qrCodeValue = qrData?.qrCode ?? localQrCode;
	const isConnected = connectionStatus === "CONNECTED";

	const statusLabel = useMemo(
		() => translateConnectionStatus(connectionStatus),
		[connectionStatus],
	);

	useEffect(() => {
		if (isConnected) onConnected();
	}, [isConnected, onConnected]);

	useEffect(() => {
		if (!instanceId || hasTriggeredConnect.current) return;
		hasTriggeredConnect.current = true;
		const run = async () => {
			setIsConnecting(true);
			setConnectError(null);
			try {
				const response: ConnectInstanceResponse = await connectInstance(instanceId);
				if (!response.connection.success) {
					setConnectError(response.connection.error ?? "Falha ao iniciar conexão.");
				}
				if (response.connection.qrCode) {
					setLocalQrCode(response.connection.qrCode);
				}
				await refreshStatus();
			} catch (error) {
				setConnectError(
					error instanceof Error ? error.message : "Falha ao iniciar conexão.",
				);
			} finally {
				setIsConnecting(false);
			}
		};
		void run();
	}, [instanceId, refreshStatus]);

	const handleRetry = async () => {
		setConnectError(null);
		setIsConnecting(true);
		try {
			const response = await connectInstance(instanceId);
			if (response.connection.qrCode) {
				setLocalQrCode(response.connection.qrCode);
			}
			await refreshStatus();
			await refreshQrCode();
		} catch (error) {
			setConnectError(error instanceof Error ? error.message : "Falha ao gerar QR Code.");
		} finally {
			setIsConnecting(false);
		}
	};

	const handleRefreshQrCode = async () => {
		setIsConnecting(true);
		try {
			const response = await getQRCode(instanceId);
			setLocalQrCode(response.qrCode);
		} catch {
			setConnectError("Não foi possível atualizar o QR Code.");
		} finally {
			setIsConnecting(false);
		}
	};

	const handleRefreshStatus = async () => {
		setIsConnecting(true);
		try {
			await getConnectionStatus(instanceId);
			await refreshStatus();
		} finally {
			setIsConnecting(false);
		}
	};

	return (
		<Card>
			<CardContent className="space-y-4 p-6">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<QrCode className="h-4 w-4 text-primary" />
					<span>{statusMessage(connectionStatus)}</span>
				</div>

				<div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
					<div>
						<p className="text-sm font-semibold text-foreground">
							Status: {statusLabel}
						</p>
						<p className="text-xs text-muted-foreground">
							Escaneie o QR Code no WhatsApp para conectar.
						</p>
					</div>
					{isConnected ? (
						<CheckCircle2 className="h-6 w-6 text-primary" />
					) : (
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					)}
				</div>

				{connectError && (
					<div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
						<AlertTriangle className="mt-0.5 h-4 w-4" />
						<span>{connectError}</span>
					</div>
				)}

				<div className="flex flex-col items-center gap-4">
					<div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-border bg-muted">
						{qrCodeValue ? (
							<img
								src={qrCodeValue}
								alt="QR Code da instância"
								className="h-44 w-44 rounded-xl bg-card p-2"
							/>
						) : (
							<div className="text-center text-xs text-muted-foreground">
								{isQrLoading || isConnecting
									? "Gerando QR Code..."
									: "QR Code indisponível"}
							</div>
						)}
					</div>

					<div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
						<Button
							variant="outline"
							onClick={handleRefreshQrCode}
							disabled={isConnecting}
						>
							Atualizar QR Code
						</Button>
						<Button
							variant="outline"
							onClick={handleRefreshStatus}
							disabled={isConnecting}
						>
							Verificar status
						</Button>
						<Button onClick={handleRetry} disabled={isConnecting}>
							Reiniciar conexão
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
