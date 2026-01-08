"use client";

import { EnhancedButton } from "@/components/ui/enhanced-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { verifyEmail, sendVerificationEmail } from "@/lib/auth-client";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle, Mail, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type VerificationStatus = "loading" | "success" | "error" | "resending" | "resent";

function VerifyEmailContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const email = searchParams.get("email");

	const [status, setStatus] = useState<VerificationStatus>("loading");
	const [errorMessage, setErrorMessage] = useState<string>("");

	useEffect(() => {
		const verify = async () => {
			if (!token) {
				setStatus("error");
				setErrorMessage("Token de verificação não encontrado.");
				return;
			}

		try {
			const { error } = await verifyEmail({ token });

			if (error) {
				setStatus("error");
				setErrorMessage(
					error.message?.includes("expired")
						? "O link de verificação expirou. Solicite um novo."
						: error.message || "Erro ao verificar e-mail."
				);
				return;
			}

			setStatus("success");
		} catch (err) {
				console.error("[VerifyEmail] Exception:", err);
				setStatus("error");
				setErrorMessage("Erro inesperado. Tente novamente.");
			}
		};

		verify();
	}, [token]);

	const handleResendEmail = async () => {
		if (!email) {
			setErrorMessage("E-mail não especificado. Faça login novamente.");
			return;
		}

		setStatus("resending");

		try {
			const { error } = await sendVerificationEmail({
				email,
				callbackURL: `${window.location.origin}/verify-email`,
			});

			if (error) {
				setStatus("error");
				setErrorMessage(error.message || "Erro ao reenviar e-mail.");
				return;
			}

			setStatus("resent");
		} catch (err) {
			console.error("[VerifyEmail] Resend Exception:", err);
			setStatus("error");
			setErrorMessage("Erro ao reenviar e-mail.");
		}
	};

	// Loading State
	if (status === "loading") {
		return (
			<div className="relative">
				<div className="relative overflow-hidden rounded-2xl border border-[#29292e] bg-[#121214] p-8">
					<ShineBorder
						shineColor={["#8257e5", "#04d361", "#8257e5"]}
						borderWidth={1}
						duration={10}
					/>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center"
					>
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#8257e5]/20">
							<motion.div
								animate={{ rotate: 360 }}
								transition={{
									duration: 1,
									repeat: Number.POSITIVE_INFINITY,
									ease: "linear",
								}}
							>
								<RefreshCw className="h-8 w-8 text-[#8257e5]" />
							</motion.div>
						</div>

						<h1 className="mb-2 text-2xl font-bold text-white">
							Verificando e-mail...
						</h1>
						<p className="text-[#a9a9b2]">
							Aguarde enquanto verificamos seu e-mail.
						</p>
					</motion.div>
				</div>
			</div>
		);
	}

	// Success State
	if (status === "success") {
		return (
			<div className="relative">
				<div className="relative overflow-hidden rounded-2xl border border-[#29292e] bg-[#121214] p-8">
					<ShineBorder
						shineColor={["#04d361", "#8257e5", "#04d361"]}
						borderWidth={1}
						duration={10}
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="text-center"
					>
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#04d361]/20">
							<CheckCircle className="h-8 w-8 text-[#04d361]" />
						</div>

						<h1 className="mb-2 text-2xl font-bold text-white">
							E-mail verificado!
						</h1>
						<p className="mb-6 text-[#a9a9b2]">
							Seu e-mail foi verificado com sucesso. Agora você tem acesso
							completo à plataforma.
						</p>

						<EnhancedButton
							className="w-full"
							rightIcon={<ArrowRight className="h-5 w-5" />}
							onClick={() => router.push("/dashboard")}
						>
							Ir para o Dashboard
						</EnhancedButton>
					</motion.div>
				</div>
			</div>
		);
	}

	// Resent State
	if (status === "resent") {
		return (
			<div className="relative">
				<div className="relative overflow-hidden rounded-2xl border border-[#29292e] bg-[#121214] p-8">
					<ShineBorder
						shineColor={["#04d361", "#8257e5", "#04d361"]}
						borderWidth={1}
						duration={10}
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="text-center"
					>
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#04d361]/20">
							<Mail className="h-8 w-8 text-[#04d361]" />
						</div>

						<h1 className="mb-2 text-2xl font-bold text-white">
							E-mail reenviado!
						</h1>
						<p className="mb-6 text-[#a9a9b2]">
							Um novo e-mail de verificação foi enviado para{" "}
							<span className="font-medium text-white">{email}</span>. Verifique
							sua caixa de entrada.
						</p>

						<Link href="/sign-in">
							<EnhancedButton variant="outline" className="w-full">
								Voltar para o login
							</EnhancedButton>
						</Link>
					</motion.div>
				</div>
			</div>
		);
	}

	// Error State
	return (
		<div className="relative">
			<div className="relative overflow-hidden rounded-2xl border border-[#29292e] bg-[#121214] p-8">
				<ShineBorder
					shineColor={["#f75a68", "#8257e5", "#f75a68"]}
					borderWidth={1}
					duration={10}
				/>

				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="text-center"
				>
					<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f75a68]/20">
						<XCircle className="h-8 w-8 text-[#f75a68]" />
					</div>

					<h1 className="mb-2 text-2xl font-bold text-white">
						Falha na verificação
					</h1>
					<p className="mb-6 text-[#a9a9b2]">{errorMessage}</p>

					<div className="space-y-3">
						{email && (
							<EnhancedButton
								className="w-full"
								onClick={handleResendEmail}
								isLoading={status === "resending"}
							>
								{status === "resending" ? "Reenviando..." : "Reenviar e-mail"}
							</EnhancedButton>
						)}

						<Link href="/sign-in">
							<EnhancedButton variant="outline" className="w-full">
								Voltar para o login
							</EnhancedButton>
						</Link>
					</div>
				</motion.div>
			</div>
		</div>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8257e5] border-t-transparent" />
				</div>
			}
		>
			<VerifyEmailContent />
		</Suspense>
	);
}
