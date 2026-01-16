"use client";

import { Building2, Loader2, Plus, Settings, Users } from "lucide-react";
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
import { authClient, type User } from "@/lib/auth-client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: Date;
}

interface OrganizationDashboardProps {
  user: User;
}

export default function OrganizationDashboard({
  user,
}: OrganizationDashboardProps) {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await authClient.organization.list();
      if (result.data) {
        setOrganizations(result.data as Organization[]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.error("Digite o nome da organizacao");
      return;
    }

    setIsCreating(true);
    try {
      const slug =
        newOrgSlug.trim() ||
        newOrgName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

      const result = await authClient.organization.create({
        name: newOrgName,
        slug,
      });

      if (result.error) {
        toast.error(result.error.message || "Erro ao criar organizacao");
        return;
      }

      toast.success("Organizacao criada com sucesso!");
      setShowCreateForm(false);
      setNewOrgName("");
      setNewOrgSlug("");
      await fetchOrganizations();

      // Redirecionar para a nova organização
      if (result.data?.id) {
        router.push(`/organization/${result.data.id}`);
      }
    } catch {
      toast.error("Erro ao criar organizacao");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B1B1F] p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e1b4a]">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-2xl text-white">
                  Minhas Organizacoes
                </h1>
                <p className="text-gray-400 text-sm">
                  Gerencie seus times e colaboradores
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Organizacao
            </Button>
          </div>
        </div>

        {/* Create Organization Form */}
        {showCreateForm && (
          <Card className="mb-6 border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-white">
                Criar Nova Organizacao
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure sua organizacao para comecar a adicionar colaboradores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nome da Organizacao</Label>
                <Input
                  placeholder="Minha Empresa"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug) {
                      setNewOrgSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "")
                      );
                    }
                  }}
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Slug (URL amigavel)</Label>
                <Input
                  placeholder="minha-empresa"
                  value={newOrgSlug}
                  onChange={(e) =>
                    setNewOrgSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-")
                    )
                  }
                  className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-500"
                />
                <p className="text-gray-500 text-xs">
                  Sera usado na URL: whatlead.com.br/org/{newOrgSlug || "slug"}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateOrg}
                  disabled={isCreating}
                  className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Organizacao"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewOrgName("");
                    setNewOrgSlug("");
                  }}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organizations List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#1e1b4a]" />
          </div>
        ) : organizations.length === 0 ? (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-600" />
              <h3 className="mb-2 font-medium text-lg text-white">
                Nenhuma organizacao
              </h3>
              <p className="mb-6 text-gray-400">
                Crie sua primeira organizacao para comecar a colaborar com seu
                time.
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-[#1e1b4a] hover:bg-[#2d2a5e]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Organizacao
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="border-gray-800 bg-gray-900 transition-colors hover:border-[#1e1b4a]"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#1e1b4a] text-white">
                        {org.logo ? (
                          <img
                            src={org.logo}
                            alt={org.name}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <span className="font-bold text-lg">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{org.name}</h3>
                        <p className="text-gray-400 text-sm">/{org.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/organization/${org.id}/members`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Membros
                        </Button>
                      </Link>
                      <Link href={`/organization/${org.id}/settings`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-gray-400 text-sm hover:text-white"
          >
            &larr; Voltar para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
