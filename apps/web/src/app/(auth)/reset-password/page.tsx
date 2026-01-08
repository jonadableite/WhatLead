"use client";

import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { ShineBorder } from "@/components/ui/shine-border";
import { resetPassword } from "@/lib/auth-client";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle, Eye, EyeOff, Lock, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";

interface FormErrors {
	password?: string;
	confirmPassword?: string;
	general?: string;
}

interface FormData {
	password: string;
	confirmPassword: string;
}

function ResetPasswordContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [formData, setFormData] = useState<FormData>({
		password: "",
		confirmPassword: "",
	});

	// If no token, show error
	if (!token) {
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
							Link inválido
						</h1>
						<p className="mb-6 text-[#a9a9b2]">
							O link de redefinição de senha é inválido ou expirou. Por favor,
							solicite um novo link.
						</p>

						<Link href="/forgot-password">
							<EnhancedButton className="w-full">
								Solicitar novo link
							</EnhancedButton>
						</Link>
					</motion.div>
				</div>
			</div>
		);
	}

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		// Password validation
		if (!formData.password) {
			newErrors.password = "Senha é obrigatória";
		} else if (formData.password.length < 8) {
			newErrors.password = "Senha deve ter pelo menos 8 caracteres";
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
			newErrors.password = "Senha deve conter maiúscula, minúscula e número";
		}

		// Confirm password validation
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Confirmação de senha é obrigatória";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Senhas não coincidem";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!validateForm()) return;

		setIsLoading(true);
		setErrors({});

		try {
			const { error } = await resetPassword({
				token,
				newPassword: formData.password,
			});

			if (error) {
				if (error.message?.includes("expired") || error.message?.includes("invalid")) {
					setErrors({
						general: "O link de redefinição expirou. Solicite um novo link.",
					});
				} else {
					setErrors({ general: error.message || "Erro ao redefinir senha" });
				}
				return;
			}

			setIsSuccess(true);
		} catch (err) {
			console.error("[ResetPassword] Exception:", err);
			setErrors({ general: "Erro inesperado. Tente novamente." });
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name as keyof FormErrors]) {
			setErrors((prev) => ({ ...prev, [name]: undefined }));
		}
	};

	// Password strength indicators
	const passwordChecks = {
		length: formData.password.length >= 8,
		uppercase: /[A-Z]/.test(formData.password),
		lowercase: /[a-z]/.test(formData.password),
		number: /\d/.test(formData.password),
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
							Senha redefinida!
						</h1>
						<p className="mb-6 text-[#a9a9b2]">
							Sua senha foi alterada com sucesso. Você já pode fazer login com
							sua nova senha.
						</p>

						<EnhancedButton
							className="w-full"
							rightIcon={<ArrowRight className="h-5 w-5" />}
							onClick={() => router.push("/sign-in")}
						>
							Ir para o login
						</EnhancedButton>
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

				{/* Header */}
				<div className="mb-8 text-center">
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8257e5]/20"
					>
						<Lock className="h-7 w-7 text-[#8257e5]" />
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-2 text-2xl font-bold text-white"
					>
						Criar nova senha
					</motion.h1>
					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.1 }}
						className="text-[#a9a9b2]"
					>
						Digite sua nova senha abaixo
					</motion.p>
				</div>

				{/* Error Alert */}
				{errors.general && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mb-6 rounded-lg border border-[#f75a68]/20 bg-[#f75a68]/10 p-4"
					>
						<p className="text-sm text-[#f75a68]">{errors.general}</p>
					</motion.div>
				)}

				{/* Form */}
				<form onSubmit={handleSubmit} className="space-y-5">
					{/* Password Field */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
					>
						<EnhancedInput
							name="password"
							type={showPassword ? "text" : "password"}
							label="Nova senha"
							placeholder="••••••••"
							value={formData.password}
							onChange={handleChange}
							error={errors.password}
							leftIcon={<Lock className="h-5 w-5" />}
							rightIcon={
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="transition-colors hover:text-[#8257e5]"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							}
							disabled={isLoading}
							autoComplete="new-password"
							autoFocus
						/>
					</motion.div>

					{/* Confirm Password Field */}
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.15 }}
					>
						<EnhancedInput
							name="confirmPassword"
							type={showConfirmPassword ? "text" : "password"}
							label="Confirmar nova senha"
							placeholder="••••••••"
							value={formData.confirmPassword}
							onChange={handleChange}
							error={errors.confirmPassword}
							leftIcon={<Lock className="h-5 w-5" />}
							rightIcon={
								<button
									type="button"
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className="transition-colors hover:text-[#8257e5]"
									tabIndex={-1}
								>
									{showConfirmPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							}
							disabled={isLoading}
							autoComplete="new-password"
						/>
					</motion.div>

					{/* Password Requirements */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2 }}
						className="space-y-1 text-xs text-[#7c7c8a]"
					>
						<p>A senha deve conter:</p>
						<ul className="ml-1 list-inside list-disc space-y-0.5">
							<li className={passwordChecks.length ? "text-[#04d361]" : ""}>
								Pelo menos 8 caracteres
							</li>
							<li className={passwordChecks.uppercase ? "text-[#04d361]" : ""}>
								Uma letra maiúscula
							</li>
							<li className={passwordChecks.lowercase ? "text-[#04d361]" : ""}>
								Uma letra minúscula
							</li>
							<li className={passwordChecks.number ? "text-[#04d361]" : ""}>
								Um número
							</li>
						</ul>
					</motion.div>

					{/* Submit Button */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.25 }}
					>
						<EnhancedButton
							type="submit"
							className="h-12 w-full text-base font-semibold"
							isLoading={isLoading}
							rightIcon={!isLoading && <ArrowRight className="h-5 w-5" />}
						>
							{isLoading ? "Redefinindo..." : "Redefinir senha"}
						</EnhancedButton>
					</motion.div>
				</form>

				{/* Back to Login Link */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3 }}
					className="mt-8 text-center text-[#a9a9b2]"
				>
					Lembrou sua senha?{" "}
					<Link
						href="/sign-in"
						className="font-medium text-[#8257e5] transition-colors hover:text-[#996dff]"
					>
						Voltar para o login
					</Link>
				</motion.p>
			</div>
		</div>
	);
}

export default function ResetPasswordPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8257e5] border-t-transparent" />
				</div>
			}
		>
			<ResetPasswordContent />
		</Suspense>
	);
}
