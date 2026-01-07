"use client";

import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

type VerificationStatus =
	| "loading"
	| "success"
	| "error"
	| "expired"
	| "already-verified";

function VerifyEmailContent() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const [status, setStatus] = useState<VerificationStatus>("loading");
	const [errorMessage, setErrorMessage] = useState("");

	const verifyToken = useCallback(async () => {
		if (!token) {
			setStatus("error");
			setErrorMessage("Token de verificacao nao encontrado");
			return;
		}

		try {
			const result = await authClient.verifyEmail({
				query: { token },
			});

			if (result.error) {
				if (result.error.message?.includes("expired")) {
					setStatus("expired");
				} else if (result.error.message?.includes("already")) {
					setStatus("already-verified");
				} else {
					setStatus("error");
					setErrorMessage(result.error.message || "Erro ao verificar email");
				}
			} else {
				setStatus("success");
			}
		} catch {
			setStatus("error");
			setErrorMessage("Ocorreu um erro inesperado. Tente novamente.");
		}
	}, [token]);

	useEffect(() => {
		verifyToken();
	}, [verifyToken]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-[#1B1B1F] p-4">
			<Card className="w-full max-w-md border-gray-800 bg-gray-900">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4">
						{status === "loading" && (
							<Loader2 className="h-16 w-16 animate-spin text-[#1e1b4a]" />
						)}
						{status === "success" && (
							<CheckCircle className="h-16 w-16 text-green-500" />
						)}
						{status === "already-verified" && (
							<CheckCircle className="h-16 w-16 text-blue-500" />
						)}
						{(status === "error" || status === "expired") && (
							<XCircle className="h-16 w-16 text-red-500" />
						)}
					</div>

					<CardTitle className="text-2xl text-white">
						{status === "loading" && "Verificando..."}
						{status === "success" && "Email confirmado!"}
						{status === "already-verified" && "Email ja verificado"}
						{status === "expired" && "Link expirado"}
						{status === "error" && "Erro na verificacao"}
					</CardTitle>

					<CardDescription className="text-gray-400">
						{status === "loading" && "Aguarde enquanto confirmamos seu email"}
						{status === "success" &&
							"Seu email foi verificado com sucesso. Agora voce pode acessar todas as funcionalidades do WhatLead!"}
						{status === "already-verified" &&
							"Este email ja foi verificado anteriormente. Voce pode fazer login normalmente."}
						{status === "expired" &&
							"Este link de verificacao expirou. Solicite um novo email de verificacao."}
						{status === "error" && errorMessage}
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-4">
					{status === "success" && (
						<Link href="/dashboard" className="block">
							<Button className="w-full bg-[#1e1b4a] hover:bg-[#2d2a5e]">
								Ir para o Dashboard
							</Button>
						</Link>
					)}

					{status === "already-verified" && (
						<Link href="/login" className="block">
							<Button className="w-full bg-[#1e1b4a] hover:bg-[#2d2a5e]">
								Fazer Login
							</Button>
						</Link>
					)}

					{(status === "expired" || status === "error") && (
						<div className="space-y-3">
							<Link href="/login" className="block">
								<Button
									variant="outline"
									className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
								>
									<Mail className="mr-2 h-4 w-4" />
									Solicitar novo email
								</Button>
							</Link>
							<Link href="/login" className="block">
								<Button
									variant="ghost"
									className="w-full text-gray-400 hover:text-white"
								>
									Voltar para o Login
								</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-[#1B1B1F]">
					<Loader2 className="h-8 w-8 animate-spin text-[#1e1b4a]" />
				</div>
			}
		>
			<VerifyEmailContent />
		</Suspense>
	);
}
