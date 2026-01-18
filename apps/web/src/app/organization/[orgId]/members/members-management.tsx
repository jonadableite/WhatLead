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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(iso));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/organization"
            className="mb-4 inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Organizacoes
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl text-foreground">
                {organization?.name || "Organizacao"}
              </h1>
              <p className="text-muted-foreground text-sm">
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
            <Button onClick={() => setShowInviteForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Convidar
            </Button>
          </div>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Convidar Colaborador</CardTitle>
              <CardDescription>
                Envie um convite por email para adicionar um novo membro ao time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="colaborador@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Papel na equipe</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={inviteRole === "member" ? "default" : "outline"}
                    onClick={() => setInviteRole("member")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Colaborador
                  </Button>
                  <Button
                    type="button"
                    variant={inviteRole === "admin" ? "default" : "outline"}
                    onClick={() => setInviteRole("admin")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Gestor
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  {inviteRole === "admin"
                    ? "Gestores podem gerenciar membros e configuracoes"
                    : "Colaboradores podem usar as ferramentas da organizacao"}
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleInvite} disabled={isInviting}>
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
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Members List */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-center text-muted-foreground">
                Nenhum membro ainda
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role] || User;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
                            <span className="font-medium text-foreground">
                              {member.user.name}
                            </span>
                            <span className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                              <RoleIcon className="h-3 w-3" />
                              {roleLabels[member.role] || member.role}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {member.user.email}
                          </p>
                        </div>
                      </div>

                      {member.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={actionLoading === member.id}
                              />
                            }
                          >
                            {actionLoading === member.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateRole(
                                  member.id,
                                  member.role === "admin" ? "member" : "admin",
                                )
                              }
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              variant="destructive"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {invitation.email}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {roleLabels[invitation.role] || invitation.role} •
                          Expira em {formatDate(invitation.expiresAt)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        disabled={actionLoading === invitation.id}
                        className="text-muted-foreground hover:text-destructive"
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
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Ver Times
            </Button>
          </Link>
          <Link href={`/organization/${orgId}/settings`}>
            <Button variant="outline">Configuracoes</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
