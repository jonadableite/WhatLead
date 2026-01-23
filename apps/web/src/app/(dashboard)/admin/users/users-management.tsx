"use client";

import {
  ArrowLeft,
  Ban,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Shield,
  ShieldOff,
  UserCog,
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
import { authClient } from "@/lib/auth-client";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  banReason?: string;
  emailVerified: boolean;
  createdAt: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });

      if (result.data?.users) {
        setUsers(result.data.users as UserData[]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Erro ao carregar usuarios");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBanUser = async (
    userId: string,
    ban: boolean,
    reason?: string
  ) => {
    setActionLoading(userId);
    try {
      if (ban) {
        await authClient.admin.banUser({
          userId,
          banReason: reason || "Violacao dos termos de uso",
        });
        toast.success("Usuario banido com sucesso");
      } else {
        await authClient.admin.unbanUser({ userId });
        toast.success("Usuario desbanido com sucesso");
      }
      await fetchUsers();
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error("Erro ao alterar status do usuario");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetRole = async (userId: string, role: "admin" | "user") => {
    setActionLoading(userId);
    try {
      await authClient.admin.setRole({
        userId,
        role,
      });
      toast.success(`Role alterado para ${role}`);
      await fetchUsers();
    } catch (error) {
      console.error("Error setting role:", error);
      toast.error("Erro ao alterar role");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center text-muted-foreground text-sm hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl text-foreground">Gerenciar Usuarios</h1>
              <p className="text-muted-foreground text-sm">{users.length} usuarios cadastrados</p>
            </div>
            <Button
              onClick={fetchUsers}
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>Lista de todos os usuarios da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {searchQuery
                  ? "Nenhum usuario encontrado"
                  : "Nenhum usuario cadastrado"}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{user.name}</span>
                          {user.role === "admin" && (
                            <span className="rounded bg-primary px-2 py-0.5 text-primary-foreground text-xs">
                              Admin
                            </span>
                          )}
                          {user.banned && (
                            <span className="rounded bg-destructive/20 px-2 py-0.5 text-destructive text-xs">
                              Banido
                            </span>
                          )}
                          {!user.emailVerified && (
                            <span className="rounded bg-warning/20 px-2 py-0.5 text-warning text-xs">
                              Email nao verificado
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">{user.email}</p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === user.id}
                        >
                          {actionLoading === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            handleSetRole(
                              user.id,
                              user.role === "admin" ? "user" : "admin"
                            )
                          }
                        >
                          {user.role === "admin" ? (
                            <>
                              <ShieldOff className="mr-2 h-4 w-4" />
                              Remover Admin
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Tornar Admin
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleBanUser(user.id, !user.banned)}
                          className={
                            user.banned
                              ? "text-emerald-500 focus:text-emerald-500"
                              : "text-destructive focus:text-destructive"
                          }
                        >
                          {user.banned ? (
                            <>
                              <UserCog className="mr-2 h-4 w-4" />
                              Desbanir Usuario
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Banir Usuario
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
