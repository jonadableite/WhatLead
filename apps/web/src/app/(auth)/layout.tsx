"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Zap } from "lucide-react";

interface AuthLayoutProps {
	children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
	return (
		<div className="flex min-h-screen bg-[#0D0D0F]">
			{/* Left Panel - Branding (Desktop only) */}
			<div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
				{/* Gradient Background */}
				<div className="absolute inset-0 bg-gradient-to-br from-[#8257e5]/20 via-[#0D0D0F] to-[#04d361]/10" />

				{/* Animated Grid Pattern */}
				<div
					className="absolute inset-0 opacity-20"
					style={{
						backgroundImage: `
              linear-gradient(rgba(130, 87, 229, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(130, 87, 229, 0.1) 1px, transparent 1px)
            `,
						backgroundSize: "60px 60px",
					}}
				/>

				{/* Glowing Orbs */}
				<motion.div
					className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-[#8257e5]/30 blur-[120px]"
					animate={{
						scale: [1, 1.2, 1],
						opacity: [0.3, 0.5, 0.3],
					}}
					transition={{
						duration: 8,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
					}}
				/>
				<motion.div
					className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#04d361]/20 blur-[100px]"
					animate={{
						scale: [1, 1.3, 1],
						opacity: [0.2, 0.4, 0.2],
					}}
					transition={{
						duration: 10,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: 1,
					}}
				/>

				{/* Content */}
				<div className="relative z-10 flex flex-col justify-center px-16 py-12">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
					>
						{/* Logo */}
						<Link href="/" className="mb-12 flex items-center gap-3">
							<div className="relative">
								<div className="absolute inset-0 bg-[#8257e5] opacity-50 blur-xl" />
								<div className="relative rounded-xl bg-gradient-to-br from-[#8257e5] to-[#633bbc] p-3">
									<Zap className="h-8 w-8 text-white" fill="currentColor" />
								</div>
							</div>
							<span className="text-3xl font-bold text-white">WhatLead</span>
						</Link>

						{/* Headline */}
						<h1 className="mb-6 text-4xl font-bold leading-tight text-white lg:text-5xl">
							Automatize seu{" "}
							<span className="bg-gradient-to-r from-[#8257e5] to-[#04d361] bg-clip-text text-transparent">
								WhatsApp
							</span>
							<br />
							de forma inteligente
						</h1>

						<p className="mb-12 max-w-md text-lg text-[#a9a9b2]">
							Crie campanhas, envie mensagens em massa e integre com seus
							sistemas através de nossa plataforma poderosa.
						</p>

						{/* Features */}
						<div className="space-y-4">
							{[
								"Sistema anti-ban avançado",
								"Aquecimento inteligente de contas",
								"Múltiplas instâncias simultâneas",
								"IA para automação de respostas",
							].map((feature, index) => (
								<motion.div
									key={feature}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
									className="flex items-center gap-3"
								>
									<div className="h-2 w-2 rounded-full bg-[#04d361]" />
									<span className="text-[#c4c4cc]">{feature}</span>
								</motion.div>
							))}
						</div>
					</motion.div>
				</div>
			</div>

			{/* Right Panel - Auth Form */}
			<div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ duration: 0.4 }}
					className="w-full max-w-md"
				>
					{children}
				</motion.div>
			</div>

			{/* Mobile Logo (shown only on small screens) */}
			<div className="fixed left-6 top-6 z-20 lg:hidden">
				<Link href="/" className="flex items-center gap-2">
					<div className="rounded-lg bg-gradient-to-br from-[#8257e5] to-[#633bbc] p-2">
						<Zap className="h-5 w-5 text-white" fill="currentColor" />
					</div>
					<span className="text-xl font-bold text-white">WhatLead</span>
				</Link>
			</div>
		</div>
	);
}
