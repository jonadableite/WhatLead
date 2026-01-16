"use client";

import {
  ArrowLeft,
  Headphones,
  Loader2,
  Megaphone,
  Plus,
  Settings,
  ShoppingCart,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

interface Team {
  id: string;
  name: string;
  createdAt: string;
  members?: { id: string }[];
}

interface TeamsManagementProps {
  orgId: string;
}

const teamIcons: Record<string, typeof Users> = {
  vendas: ShoppingCart,
  atendimento: Headphones,
  marketing: Megaphone,
  operacoes: Settings,
};

const suggestedTeams = [
  {
    name: "Vendas",
    icon: ShoppingCart,
    description: "Time focado em conversao e fechamento",
  },
  {
    name: "Atendimento",
    icon: Headphones,
    description: "Time de suporte e relacionamento",
  },
  {
    name: "Marketing",
    icon: Megaphone,
    description: "Time de campanhas e disparos",
  },
  {
    name: "Operacoes",
    icon: Settings,
    description: "Time tecnico e operacional",
  },
];

export default function TeamsManagement({ orgId }: TeamsManagementProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      await authClient.organization.setActive({ organizationId: orgId });
      const result = await authClient.$fetch("/organization/list-teams", {
        method: "GET",
        query: {
          organizationId: orgId,
        },
      });

      const data = (result as { data?: unknown }).data;
      if (Array.isArray(data)) {
        setTeams(data as Team[]);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (name?: string) => {
    const teamName = name || newTeamName.trim();
    if (!teamName) {
      toast.error("Digite o nome do time");
      return;
    }

    setIsCreating(true);
    try {
      const result = await authClient.$fetch("/organization/create-team", {
        method: "POST",
        body: {
          name: teamName,
          organizationId: orgId,
        },
      });

      const error = (result as { error?: unknown }).error;
      if (error && typeof error === "object" && "message" in error) {
        toast.error(
          typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Erro ao criar time"
        );
        return;
      }

      toast.success("Time criado com sucesso!");
      setShowCreateForm(false);
      setNewTeamName("");
      await fetchTeams();
    } catch {
      toast.error("Erro ao criar time");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const result = await authClient.$fetch("/organization/remove-team", {
        method: "POST",
        body: {
          teamId,
          organizationId: orgId,
        },
      });

      const error = (result as { error?: unknown }).error;
      if (error && typeof error === "object" && "message" in error) {
        toast.error(
          typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Erro ao remover time"
        );
        return;
      }

      toast.success("Time removido com sucesso");
      await fetchTeams();
    } catch {
      toast.error("Erro ao remover time");
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
            href={`/organization/${orgId}/members`}
            className="mb-4 inline-flex items-center text-gray-400 text-sm hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Membros
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl text-white">Times</h1>
              <p className="text-gray-400 text-sm">
                Organize seus colaboradores em times especializados
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Time
            </Button>
          </div>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <Card className="mb-6 border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">Criar Novo Time</CardTitle>
              <CardDescription className="text-gray-400">
                Crie um time para organizar seus colaboradores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nome do Time</Label>
                <Input
                  placeholder="Ex: Vendas, Suporte, Marketing..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Suggested Teams */}
              <div className="space-y-2">
                <Label className="text-gray-300">
                  Ou escolha um time sugerido:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedTeams.map((suggested) => {
                    const Icon = suggested.icon;
                    const alreadyExists = teams.some(
                      (t) =>
                        t.name.toLowerCase() === suggested.name.toLowerCase()
                    );
                    return (
                      <Button
                        key={suggested.name}
                        type="button"
                        variant="outline"
                        disabled={alreadyExists || isCreating}
                        onClick={() => handleCreateTeam(suggested.name)}
                        className={`justify-start border-gray-700 text-gray-300 hover:bg-gray-800 ${
                          alreadyExists ? "opacity-50" : ""
                        }`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {suggested.name}
                        {alreadyExists && (
                          <span className="ml-auto text-gray-500 text-xs">
                            ja existe
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleCreateTeam()}
                  disabled={isCreating || !newTeamName.trim()}
                  className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Time"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTeamName("");
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams List */}
        {teams.length === 0 ? (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-12 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h3 className="mb-2 font-medium text-lg text-white">
                Nenhum time criado
              </h3>
              <p className="mb-6 text-gray-400">
                Crie times para organizar seus colaboradores por area de
                atuacao.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Time
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => {
              const iconKey = team.name.toLowerCase();
              const Icon = teamIcons[iconKey] || Users;
              return (
                <Card key={team.id} className="border-gray-800 bg-gray-900">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1b4a] text-white">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {team.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {team.members?.length || 0} membros
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-gray-400 hover:text-red-400"
                      >
                        Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 rounded-lg border border-gray-800 bg-gray-800/50 p-4">
          <p className="text-gray-400 text-sm">
            <strong className="text-gray-300">Dica:</strong> Times ajudam a
            organizar seus colaboradores por area. Voce pode adicionar membros a
            times na pagina de gerenciamento de membros.
          </p>
        </div>
      </div>
    </div>
  );
}
