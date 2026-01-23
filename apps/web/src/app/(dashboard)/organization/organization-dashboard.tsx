"use client";

import { Building2, Loader2, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: Date;
}

export default function OrganizationDashboard() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D0D0D] p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-500/10 blur-[120px]" />
      </div>
      <div className="relative mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-semibold text-2xl tracking-tight text-white">
                  Organizações
                </h1>
                <p className="text-sm text-white/60">
                  Gerencie seus times e colaboradores
                </p>
              </div>
            </div>
            <Link href="/organization/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Organizacao
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : organizations.length === 0 ? (
          <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-blue-400" />
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-white/60" />
              <h3 className="mb-2 font-medium text-lg text-white">
                Nenhuma organizacao
              </h3>
              <p className="mb-6 text-white/70">
                Crie sua primeira organizacao para comecar a colaborar com seu
                time.
              </p>
              <Link href="/organization/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Organizacao
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl transition-all hover:shadow-2xl hover:border-white/20"
              >
                <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-400 via-violet-500 to-blue-400" />
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
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
                        <p className="text-white/70 text-sm">/{org.slug}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                      <Link href={`/organization/${org.id}/members`}>
                        <Button variant="outline" size="sm">
                          <Users className="mr-2 h-4 w-4" />
                          Membros
                        </Button>
                      </Link>
                      <Link href={`/organization/${org.id}/settings`}>
                        <Button variant="outline" size="sm">
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

        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-sm text-white/60 hover:text-white"
          >
            &larr; Voltar para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
