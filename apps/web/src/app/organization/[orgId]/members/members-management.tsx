"use client";

import {
	ArrowLeft,
	Crown,
	Loader2,
	MoreHorizontal,
	Plus,
	Send,
	Shield,
	Trash2,
	User,
	UserMinus,
	Users,
} from "lucide-react";
import Link from "next/link";
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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface Member {
	id: string;
	userId: string;
	role: string;
	user: {
		id: string;
		name: string;
		email: string;
		image?: string;
	};
}

interface Invitation {
	id: string;
	email: string;
	role: string;
	status: string;
	expiresAt: string;
}

interface Organization {
	id: string;
	name: string;
	slug: string;
}

interface MembersManagementProps {
	orgId: string;
}

const roleIcons: Record<string, typeof Crown> = {
	owner: Crown,
	admin: Shield,
	member: User,
};

const roleLabels: Record<string, string> = {
	owner: "Proprietario",
	admin: "Gestor",
	member: "Colaborador",
};

export default function MembersManagement({ orgId }: MembersManagementProps) {
	const [organization, setOrganization] = useState<Organization | null>(null);
	const [members, setMembers] = useState<Member[]>([]);
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [showInviteForm, setShowInviteForm] = useState(false);
	const [inviteEmail, setInviteEmail] = useState("");
	const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
	const [isInviting, setIsInviting] = useState(false);
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		try {
			// Set active organization
			await authClient.organization.setActive({ organizationId: orgId });

			// Fetch organization details
			const orgResult = await authClient.organization.getFullOrganization();
			if (orgResult.data) {
				setOrganization(orgResult.data as unknown as Organization);
				setMembers((orgResult.data.members as unknown as Member[]) || []);
				setInvitations(
					(orgResult.data.invitations as unknown as Invitation[]) || [],
				);
			}
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error("Erro ao carregar dados da organizacao");
		} finally {
			setIsLoading(false);
		}
	}, [orgId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleInvite = async () => {
		if (!inviteEmail.trim()) {
			toast.error("Digite o email do colaborador");
			return;
		}

		setIsInviting(true);
		try {
			const result = await authClient.organization.inviteMember({
				email: inviteEmail,
				role: inviteRole,
				organizationId: orgId,
			});

			if (result.error) {
				toast.error(result.error.message || "Erro ao enviar convite");
				return;
			}

			toast.success("Convite enviado com sucesso!");
			setShowInviteForm(false);
			setInviteEmail("");
			setInviteRole("member");
			await fetchData();
		} catch {
			toast.error("Erro ao enviar convite");
		} finally {
			setIsInviting(false);
		}
	};

	const handleRemoveMember = async (memberId: string) => {
		setActionLoading(memberId);
		try {
			await authClient.organization.removeMember({
				memberIdOrEmail: memberId,
				organizationId: orgId,
			});
			toast.success("Membro removido com sucesso");
			await fetchData();
		} catch {
			toast.error("Erro ao remover membro");
		} finally {
			setActionLoading(null);
		}
	};

	const handleUpdateRole = async (
		memberId: string,
		newRole: "admin" | "member",
	) => {
		setActionLoading(memberId);
		try {
			await authClient.organization.updateMemberRole({
				memberId,
				role: newRole,
				organizationId: orgId,
			});
			toast.success("Role atualizado com sucesso");
			await fetchData();
		} catch {
			toast.error("Erro ao atualizar role");
		} finally {
			setActionLoading(null);
		}
	};

	const handleCancelInvitation = async (invitationId: string) => {
		setActionLoading(invitationId);
		try {
			await authClient.organization.cancelInvitation({
				invitationId,
			});
			toast.success("Convite cancelado");
			await fetchData();
		} catch {
			toast.error("Erro ao cancelar convite");
		} finally {
			setActionLoading(null);
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
			<div className="mx-auto max-w-4xl">
				{/* Header */}
				<div className="mb-6">
					<Link
						href="/organization"
						className="mb-4 inline-flex items-center text-sm text-gray-400 hover:text-white"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar para Organizacoes
					</Link>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-white">
								{organization?.name || "Organizacao"}
							</h1>
							<p className="text-sm text-gray-400">
								{members.length} membro{members.length !== 1 ? "s" : ""} •{" "}
								{invitations.filter((i) => i.status === "pending").length}{" "}
								convite
								{invitations.filter((i) => i.status === "pending").length !== 1
									? "s"
									: ""}{" "}
								pendente
								{invitations.filter((i) => i.status === "pending").length !== 1
									? "s"
									: ""}
							</p>
						</div>
						<Button
							onClick={() => setShowInviteForm(true)}
							className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
						>
							<Plus className="mr-2 h-4 w-4" />
							Convidar
						</Button>
					</div>
				</div>

				{/* Invite Form */}
				{showInviteForm && (
					<Card className="mb-6 border-gray-800 bg-gray-900">
						<CardHeader>
							<CardTitle className="text-white">Convidar Colaborador</CardTitle>
							<CardDescription className="text-gray-400">
								Envie um convite por email para adicionar um novo membro ao time
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label className="text-gray-300">Email</Label>
								<Input
									type="email"
									placeholder="colaborador@email.com"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-gray-300">Papel na equipe</Label>
								<div className="flex gap-3">
									<Button
										type="button"
										variant={inviteRole === "member" ? "default" : "outline"}
										onClick={() => setInviteRole("member")}
										className={
											inviteRole === "member"
												? "bg-[#1e1b4a]"
												: "border-gray-700 text-gray-300 hover:bg-gray-800"
										}
									>
										<User className="mr-2 h-4 w-4" />
										Colaborador
									</Button>
									<Button
										type="button"
										variant={inviteRole === "admin" ? "default" : "outline"}
										onClick={() => setInviteRole("admin")}
										className={
											inviteRole === "admin"
												? "bg-[#1e1b4a]"
												: "border-gray-700 text-gray-300 hover:bg-gray-800"
										}
									>
										<Shield className="mr-2 h-4 w-4" />
										Gestor
									</Button>
								</div>
								<p className="text-xs text-gray-500">
									{inviteRole === "admin"
										? "Gestores podem gerenciar membros e configuracoes"
										: "Colaboradores podem usar as ferramentas da organizacao"}
								</p>
							</div>
							<div className="flex gap-3">
								<Button
									onClick={handleInvite}
									disabled={isInviting}
									className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
								>
									{isInviting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Enviando...
										</>
									) : (
										<>
											<Send className="mr-2 h-4 w-4" />
											Enviar Convite
										</>
									)}
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setShowInviteForm(false);
										setInviteEmail("");
										setInviteRole("member");
									}}
									className="border-gray-700 text-gray-300 hover:bg-gray-800"
								>
									Cancelar
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Members List */}
				<Card className="mb-6 border-gray-800 bg-gray-900">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-white">
							<Users className="h-5 w-5" />
							Membros
						</CardTitle>
					</CardHeader>
					<CardContent>
						{members.length === 0 ? (
							<p className="text-center text-gray-400">Nenhum membro ainda</p>
						) : (
							<div className="space-y-3">
								{members.map((member) => {
									const RoleIcon = roleIcons[member.role] || User;
									return (
										<div
											key={member.id}
											className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e1b4a] text-white">
													{member.user.image ? (
														<img
															src={member.user.image}
															alt={member.user.name}
															className="h-full w-full rounded-full object-cover"
														/>
													) : (
														member.user.name.charAt(0).toUpperCase()
													)}
												</div>
												<div>
													<div className="flex items-center gap-2">
														<span className="font-medium text-white">
															{member.user.name}
														</span>
														<span className="flex items-center gap-1 rounded bg-gray-700 px-2 py-0.5 text-xs text-gray-300">
															<RoleIcon className="h-3 w-3" />
															{roleLabels[member.role] || member.role}
														</span>
													</div>
													<p className="text-sm text-gray-400">
														{member.user.email}
													</p>
												</div>
											</div>

											{member.role !== "owner" && (
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="sm"
															className="text-gray-400 hover:text-white"
															disabled={actionLoading === member.id}
														>
															{actionLoading === member.id ? (
																<Loader2 className="h-4 w-4 animate-spin" />
															) : (
																<MoreHorizontal className="h-4 w-4" />
															)}
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="border-gray-700 bg-gray-800"
													>
														<DropdownMenuItem
															onClick={() =>
																handleUpdateRole(
																	member.id,
																	member.role === "admin" ? "member" : "admin",
																)
															}
															className="text-gray-300 focus:bg-gray-700 focus:text-white"
														>
															{member.role === "admin" ? (
																<>
																	<User className="mr-2 h-4 w-4" />
																	Tornar Colaborador
																</>
															) : (
																<>
																	<Shield className="mr-2 h-4 w-4" />
																	Tornar Gestor
																</>
															)}
														</DropdownMenuItem>
														<DropdownMenuSeparator className="bg-gray-700" />
														<DropdownMenuItem
															onClick={() => handleRemoveMember(member.id)}
															className="text-red-400 focus:bg-gray-700 focus:text-red-300"
														>
															<UserMinus className="mr-2 h-4 w-4" />
															Remover da Equipe
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											)}
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Pending Invitations */}
				{invitations.filter((i) => i.status === "pending").length > 0 && (
					<Card className="border-gray-800 bg-gray-900">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-white">
								<Send className="h-5 w-5" />
								Convites Pendentes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{invitations
									.filter((i) => i.status === "pending")
									.map((invitation) => (
										<div
											key={invitation.id}
											className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4"
										>
											<div>
												<p className="font-medium text-white">
													{invitation.email}
												</p>
												<p className="text-sm text-gray-400">
													{roleLabels[invitation.role] || invitation.role} •
													Expira em{" "}
													{new Date(invitation.expiresAt).toLocaleDateString(
														"pt-BR",
													)}
												</p>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleCancelInvitation(invitation.id)}
												disabled={actionLoading === invitation.id}
												className="text-gray-400 hover:text-red-400"
											>
												{actionLoading === invitation.id ? (
													<Loader2 className="h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="h-4 w-4" />
												)}
											</Button>
										</div>
									))}
							</div>
						</CardContent>
					</Card>
				)}

				{/* Navigation */}
				<div className="mt-6 flex gap-4">
					<Link href={`/organization/${orgId}/teams`}>
						<Button
							variant="outline"
							className="border-gray-700 text-gray-300 hover:bg-gray-800"
						>
							<Users className="mr-2 h-4 w-4" />
							Ver Times
						</Button>
					</Link>
					<Link href={`/organization/${orgId}/settings`}>
						<Button
							variant="outline"
							className="border-gray-700 text-gray-300 hover:bg-gray-800"
						>
							Configuracoes
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
