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
		<div className="min-h-screen bg-background p-6">
			<div className="mx-auto max-w-7xl">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
							<Shield className="h-5 w-5 text-primary-foreground" />
						</div>
						<div>
							<h1 className="font-bold text-2xl text-foreground">
								Painel Administrativo
							</h1>
							<p className="text-muted-foreground text-sm">Bem-vindo, {user.name}</p>
						</div>
					</div>
				</div>

				{/* Stats Cards */}
				<div className="mb-8 grid gap-6 md:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-sm">
								Total de Usuarios
							</CardTitle>
							<Users className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-foreground">--</div>
							<p className="text-muted-foreground text-xs">Carregando...</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-sm">
								Organizacoes
							</CardTitle>
							<BarChart3 className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-foreground">--</div>
							<p className="text-muted-foreground text-xs">Carregando...</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between pb-2">
							<CardTitle className="font-medium text-muted-foreground text-sm">
								Usuarios Banidos
							</CardTitle>
							<Shield className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl text-foreground">--</div>
							<p className="text-muted-foreground text-xs">Carregando...</p>
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<div className="grid gap-6 md:grid-cols-2">
					<Link href="/admin/users">
						<Card className="cursor-pointer border border-border transition-colors hover:border-primary/50">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Gerenciar Usuarios
								</CardTitle>
								<CardDescription>
									Visualize, edite e gerencie todos os usuarios da plataforma
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-muted-foreground text-sm">
									<li>• Listar todos os usuarios</li>
									<li>• Banir/Desbanir usuarios</li>
									<li>• Alterar roles (admin/user)</li>
									<li>• Visualizar sessoes ativas</li>
								</ul>
							</CardContent>
						</Card>
					</Link>

					<Card className="border border-border opacity-50">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="h-5 w-5" />
								Analytics
								<span className="rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
									Em breve
								</span>
							</CardTitle>
							<CardDescription>
								Metricas e relatorios da plataforma
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-muted-foreground text-sm">
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
						className="text-muted-foreground text-sm hover:text-foreground"
					>
						&larr; Voltar para o Dashboard
					</Link>
				</div>
			</div>
		</div>
	);
}
