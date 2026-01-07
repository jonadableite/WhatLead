"use client";

import { useForm } from "@tanstack/react-form";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({
	onSwitchToSignUp,
}: {
	onSwitchToSignUp: () => void;
}) {
	const router = useRouter();
	const { isPending } = authClient.useSession();
	const [needsVerification, setNeedsVerification] = useState(false);
	const [verificationEmail, setVerificationEmail] = useState("");

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
						toast.success("Login realizado com sucesso!");
					},
					onError: (error) => {
						// Verificar se é erro de email não verificado
						if (
							error.error.status === 403 ||
							error.error.message?.toLowerCase().includes("verif")
						) {
							setVerificationEmail(value.email);
							setNeedsVerification(true);
							return;
						}

						toast.error(error.error.message || "Email ou senha incorretos");
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.string().email("Digite um email valido"),
				password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
			}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	const handleResendVerification = async () => {
		try {
			await authClient.sendVerificationEmail({ email: verificationEmail });
			toast.success("Email de verificacao reenviado!");
		} catch {
			toast.error("Erro ao reenviar email");
		}
	};

	return (
		<div className="mx-auto mt-10 w-full max-w-md p-6">
			<h1 className="mb-2 text-center text-3xl font-bold text-white">
				Bem-vindo de volta
			</h1>
			<p className="mb-6 text-center text-gray-400">
				Entre na sua conta para continuar
			</p>

			{needsVerification && (
				<div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
					<div className="flex items-start gap-3">
						<AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-500" />
						<div>
							<p className="text-sm font-medium text-yellow-500">
								Email nao verificado
							</p>
							<p className="mt-1 text-xs text-yellow-400/80">
								Verifique seu email antes de continuar. Nao recebeu?{" "}
								<button
									onClick={handleResendVerification}
									className="underline hover:text-yellow-300"
								>
									Reenviar email
								</button>
							</p>
						</div>
					</div>
				</div>
			)}

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name} className="text-gray-300">
									Email
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									placeholder="seu@email.com"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-sm text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor={field.name} className="text-gray-300">
										Senha
									</Label>
									<Link
										href="/forgot-password"
										className="text-xs text-[#1e1b4a] hover:text-[#2d2a5e] hover:underline"
									>
										Esqueceu a senha?
									</Link>
								</div>
								<Input
									id={field.name}
									name={field.name}
									type="password"
									placeholder="********"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-sm text-red-500">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<Button
							type="submit"
							className="w-full bg-[#1e1b4a] hover:bg-[#2d2a5e]"
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Entrando...
								</>
							) : (
								"Entrar"
							)}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className="mt-4 text-center">
				<Button
					variant="link"
					onClick={onSwitchToSignUp}
					className="text-[#1e1b4a] hover:text-[#2d2a5e]"
				>
					Nao tem conta? Criar conta
				</Button>
			</div>
		</div>
	);
}
