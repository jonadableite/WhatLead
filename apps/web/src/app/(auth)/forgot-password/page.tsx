"use client";

import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { ShineBorder } from "@/components/ui/shine-border";
import { requestPasswordReset } from "@/lib/auth-client";
import { motion } from "motion/react";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";

export default function ForgotPasswordPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [email, setEmail] = useState("");

	const validateEmail = (emailToValidate: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(emailToValidate);
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!email) {
			setError("E-mail é obrigatório");
			return;
		}

		if (!validateEmail(email)) {
			setError("E-mail inválido");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const { error: resetError } = await requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/reset-password`,
			});

			if (resetError) {
				setError(resetError.message || "Erro ao enviar e-mail de recuperação");
				return;
			}

			setIsSuccess(true);
		} catch (err) {
			console.error("[ForgotPassword] Exception:", err);
			setError("Erro inesperado. Tente novamente.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
		if (error) setError(null);
	};

	// Success State
	if (isSuccess) {
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
							E-mail enviado!
						</h1>
						<p className="mb-6 text-[#a9a9b2]">
							Se existe uma conta com o e-mail{" "}
							<span className="font-medium text-white">{email}</span>, você
							receberá um link para redefinir sua senha.
						</p>

						<div className="space-y-3">
							<p className="text-sm text-[#7c7c8a]">
								Não recebeu o e-mail? Verifique sua pasta de spam ou
							</p>
							<EnhancedButton
								type="button"
								variant="outline"
								className="w-full border-[#29292e]"
								onClick={() => {
									setIsSuccess(false);
									setEmail("");
								}}
							>
								Tentar novamente
							</EnhancedButton>
						</div>

						<Link
							href="/sign-in"
							className="mt-6 inline-flex items-center gap-2 text-[#8257e5] transition-colors hover:text-[#996dff]"
						>
							<ArrowLeft className="h-4 w-4" />
							Voltar para o login
						</Link>
					</motion.div>
				</div>
			</div>
		);
	}

	// Form State
	return (
		<div className="relative">
			<div className="relative overflow-hidden rounded-2xl border border-[#29292e] bg-[#121214] p-8">
				<ShineBorder
					shineColor={["#8257e5", "#04d361", "#8257e5"]}
					borderWidth={1}
					duration={10}
				/>

				{/* Back Link */}
				<motion.div
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					className="mb-6"
				>
					<Link
						href="/sign-in"
						className="inline-flex items-center gap-2 text-[#a9a9b2] transition-colors hover:text-white"
					>
						<ArrowLeft className="h-4 w-4" />
						Voltar para o login
					</Link>
				</motion.div>

				{/* Header */}
				<div className="mb-8 text-center">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8257e5]/20"
					>
						<Mail className="h-7 w-7 text-[#8257e5]" />
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-2 text-2xl font-bold text-white"
					>
						Esqueceu sua senha?
					</motion.h1>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className="text-[#a9a9b2]"
					>
						Digite seu e-mail e enviaremos um link para redefinir sua senha
					</motion.p>
				</div>

				{/* Error Alert */}
				{error && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-6 rounded-lg border border-[#f75a68]/20 bg-[#f75a68]/10 p-4"
					>
						<p className="text-sm text-[#f75a68]">{error}</p>
					</motion.div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-5">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
					>
						<EnhancedInput
							name="email"
							type="email"
							label="E-mail"
							placeholder="seu@email.com"
							value={email}
							onChange={handleEmailChange}
							leftIcon={<Mail className="h-5 w-5" />}
							disabled={isLoading}
							autoComplete="email"
							autoFocus
						/>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15 }}
					>
						<EnhancedButton
							type="submit"
							className="h-12 w-full text-base font-semibold"
							isLoading={isLoading}
						>
							{isLoading ? "Enviando..." : "Enviar link de recuperação"}
						</EnhancedButton>
					</motion.div>
				</form>
			</div>
		</div>
	);
}
