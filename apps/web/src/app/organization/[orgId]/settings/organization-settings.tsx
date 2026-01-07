"use client";

import { AlertTriangle, ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
}

interface OrganizationSettingsProps {
	orgId: string;
}

export default function OrganizationSettings({
	orgId,
}: OrganizationSettingsProps) {
	const router = useRouter();
	const [organization, setOrganization] = useState<Organization | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [deleteConfirmText, setDeleteConfirmText] = useState("");

	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");

	const fetchOrganization = useCallback(async () => {
		setIsLoading(true);
		try {
			await authClient.organization.setActive({ organizationId: orgId });
			const result = await authClient.organization.getFullOrganization();
			if (result.data) {
				const org = result.data as unknown as Organization;
				setOrganization(org);
				setName(org.name);
				setSlug(org.slug);
			}
		} catch (error) {
			console.error("Error fetching organization:", error);
			toast.error("Erro ao carregar organizacao");
		} finally {
			setIsLoading(false);
		}
	}, [orgId]);

	useEffect(() => {
		fetchOrganization();
	}, [fetchOrganization]);

	const handleSave = async () => {
		if (!name.trim()) {
			toast.error("O nome e obrigatorio");
			return;
		}

		setIsSaving(true);
		try {
			const result = await authClient.organization.update({
				data: {
					name: name.trim(),
					slug: slug.trim() || undefined,
				},
				organizationId: orgId,
			});

			if (result.error) {
				toast.error(result.error.message || "Erro ao salvar");
				return;
			}

			toast.success("Configuracoes salvas!");
			await fetchOrganization();
		} catch {
			toast.error("Erro ao salvar configuracoes");
		} finally {
			setIsSaving(false);
		}
	};

	const handleDelete = async () => {
		if (deleteConfirmText !== organization?.name) {
			toast.error("Digite o nome da organizacao para confirmar");
			return;
		}

		setIsDeleting(true);
		try {
			const result = await authClient.organization.delete({
				organizationId: orgId,
			});

			if (result.error) {
				toast.error(result.error.message || "Erro ao excluir");
				return;
			}

			toast.success("Organizacao excluida");
			router.push("/organization");
		} catch {
			toast.error("Erro ao excluir organizacao");
		} finally {
			setIsDeleting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[#1B1B1F]">
				<Loader2 className="h-8 w-8 animate-spin text-[#1e1b4a]" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#1B1B1F] p-6">
			<div className="mx-auto max-w-2xl">
				{/* Header */}
				<div className="mb-6">
					<Link
						href={`/organization/${orgId}/members`}
						className="mb-4 inline-flex items-center text-sm text-gray-400 hover:text-white"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Link>
					<h1 className="text-2xl font-bold text-white">Configuracoes</h1>
					<p className="text-sm text-gray-400">
						Gerencie as configuracoes da sua organizacao
					</p>
				</div>

				{/* General Settings */}
				<Card className="mb-6 border-gray-800 bg-gray-900">
					<CardHeader>
						<CardTitle className="text-white">Informacoes Gerais</CardTitle>
						<CardDescription className="text-gray-400">
							Atualize os dados da sua organizacao
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label className="text-gray-300">Nome da Organizacao</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-gray-300">Slug (URL)</Label>
							<Input
								value={slug}
								onChange={(e) =>
									setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))
								}
								className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
							/>
							<p className="text-xs text-gray-500">
								Sera usado na URL: whatlead.com.br/org/{slug || "slug"}
							</p>
						</div>
						<Button
							onClick={handleSave}
							disabled={isSaving}
							className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
						>
							{isSaving ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Salvando...
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Salvar Alteracoes
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				{/* Danger Zone */}
				<Card className="border-red-500/30 bg-gray-900">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-400">
							<AlertTriangle className="h-5 w-5" />
							Zona de Perigo
						</CardTitle>
						<CardDescription className="text-gray-400">
							Acoes irreversiveis. Tenha cuidado.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{!showDeleteConfirm ? (
							<div className="flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/5 p-4">
								<div>
									<p className="font-medium text-white">Excluir Organizacao</p>
									<p className="text-sm text-gray-400">
										Esta acao e permanente e nao pode ser desfeita.
									</p>
								</div>
								<Button
									variant="outline"
									onClick={() => setShowDeleteConfirm(true)}
									className="border-red-500/50 text-red-400 hover:bg-red-500/10"
								>
									Excluir
								</Button>
							</div>
						) : (
							<div className="space-y-4 rounded-lg border border-red-500/30 bg-red-500/5 p-4">
								<div>
									<p className="font-medium text-red-400">Tem certeza?</p>
									<p className="text-sm text-gray-400">
										Esta acao ira excluir permanentemente a organizacao{" "}
										<strong className="text-white">{organization?.name}</strong>
										, todos os membros e times associados.
									</p>
								</div>
								<div className="space-y-2">
									<Label className="text-gray-300">
										Digite{" "}
										<strong className="text-white">{organization?.name}</strong>{" "}
										para confirmar:
									</Label>
									<Input
										value={deleteConfirmText}
										onChange={(e) => setDeleteConfirmText(e.target.value)}
										placeholder={organization?.name}
										className="border-red-500/30 bg-gray-800 text-white placeholder:text-gray-500"
									/>
								</div>
								<div className="flex gap-3">
									<Button
										variant="outline"
										onClick={handleDelete}
										disabled={
											isDeleting || deleteConfirmText !== organization?.name
										}
										className="border-red-500/50 text-red-400 hover:bg-red-500/10"
									>
										{isDeleting ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Excluindo...
											</>
										) : (
											"Confirmar Exclusao"
										)}
									</Button>
									<Button
										variant="ghost"
										onClick={() => {
											setShowDeleteConfirm(false);
											setDeleteConfirmText("");
										}}
										className="text-gray-400 hover:text-white"
									>
										Cancelar
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
