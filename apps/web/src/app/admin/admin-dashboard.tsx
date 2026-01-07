"use client";

import { BarChart3, Shield, Users } from "lucide-react";
import Link from "next/link";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { User } from "@/lib/auth-client";

interface AdminDashboardProps {
	user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
	return (
		<div className="min-h-screen bg-[#1B1B1F] p-6">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1b4a]">
							<Shield className="h-5 w-5 text-white" />
						</div>
						<div>
							<h1 className="text-2xl font-bold text-white">
								Painel Administrativo
							</h1>
							<p className="text-sm text-gray-400">Bem-vindo, {user.name}</p>
						</div>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="mb-8 grid gap-6 md:grid-cols-3">
					<Card className="border-gray-800 bg-gray-900">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-gray-400">
								Total de Usuarios
							</CardTitle>
							<Users className="h-4 w-4 text-gray-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">--</div>
							<p className="text-xs text-gray-500">Carregando...</p>
						</CardContent>
					</Card>

					<Card className="border-gray-800 bg-gray-900">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-gray-400">
								Organizacoes
							</CardTitle>
							<BarChart3 className="h-4 w-4 text-gray-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">--</div>
							<p className="text-xs text-gray-500">Carregando...</p>
						</CardContent>
					</Card>

					<Card className="border-gray-800 bg-gray-900">
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="text-sm font-medium text-gray-400">
								Usuarios Banidos
							</CardTitle>
							<Shield className="h-4 w-4 text-gray-400" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold text-white">--</div>
							<p className="text-xs text-gray-500">Carregando...</p>
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<div className="grid gap-6 md:grid-cols-2">
					<Link href="/admin/users">
						<Card className="cursor-pointer border-gray-800 bg-gray-900 transition-colors hover:border-[#1e1b4a]">
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-white">
									<Users className="h-5 w-5" />
									Gerenciar Usuarios
								</CardTitle>
								<CardDescription className="text-gray-400">
									Visualize, edite e gerencie todos os usuarios da plataforma
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-sm text-gray-500">
									<li>• Listar todos os usuarios</li>
									<li>• Banir/Desbanir usuarios</li>
									<li>• Alterar roles (admin/user)</li>
									<li>• Visualizar sessoes ativas</li>
								</ul>
							</CardContent>
						</Card>
					</Link>

					<Card className="border-gray-800 bg-gray-900 opacity-50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-white">
								<BarChart3 className="h-5 w-5" />
								Analytics
								<span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-400">
									Em breve
								</span>
							</CardTitle>
							<CardDescription className="text-gray-400">
								Metricas e relatorios da plataforma
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm text-gray-500">
								<li>• Usuarios ativos</li>
								<li>• Organizacoes criadas</li>
								<li>• Metricas de uso</li>
								<li>• Logs de atividade</li>
							</ul>
						</CardContent>
					</Card>
				</div>

				{/* Back to Dashboard */}
				<div className="mt-8">
					<Link
						href="/dashboard"
						className="text-sm text-gray-400 hover:text-white"
					>
						&larr; Voltar para o Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}
