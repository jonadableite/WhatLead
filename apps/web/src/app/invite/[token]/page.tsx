"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { authClient } from "@/lib/auth-client";

type InviteStatus =
  | "loading"
  | "valid"
  | "accepted"
  | "error"
  | "expired"
  | "already-member";

interface InvitationDetails {
  organizationName: string;
  organizationSlug: string;
  inviterName: string;
  role: string;
  email: string;
}

const roleLabels: Record<string, string> = {
  owner: "Proprietario",
  admin: "Gestor",
  member: "Colaborador",
};

export default function AcceptInvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<InviteStatus>("loading");
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  const { data: session } = authClient.useSession();

  const fetchInvitation = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token de convite invalido");
      return;
    }

    try {
      const result = await authClient.organization.getInvitation({
        query: { id: token },
      });

      if (result.error) {
        if (result.error.message?.includes("expired")) {
          setStatus("expired");
        } else {
          setStatus("error");
          setErrorMessage(result.error.message || "Convite invalido");
        }
        return;
      }

      if (result.data) {
        setInvitation({
          organizationName: result.data.organizationName,
          organizationSlug: result.data.organizationSlug,
          inviterName: "Um membro",
          role: result.data.role,
          email: result.data.email,
        });
        setStatus("valid");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Erro ao carregar convite");
    }
  }, [token]);

  useEffect(() => {
    fetchInvitation();
  }, [fetchInvitation]);

  const handleAccept = async () => {
    if (!session?.user) {
      // Redirecionar para login com redirect de volta
      router.push(`/sign-in?redirect=/invite/${token}` as Route);
      return;
    }

    setIsAccepting(true);
    try {
      const result = await authClient.organization.acceptInvitation({
        invitationId: token,
      });

      if (result.error) {
        if (result.error.message?.includes("already")) {
          setStatus("already-member");
        } else {
          toast.error(result.error.message || "Erro ao aceitar convite");
        }
        return;
      }

      setStatus("accepted");
      toast.success("Convite aceito com sucesso!");

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push("/organization");
      }, 2000);
    } catch {
      toast.error("Erro ao aceitar convite");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {status === "loading" && (
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando convite...</p>
          </CardContent>
        )}

        {status === "valid" && invitation && (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Voce foi convidado!</CardTitle>
              <CardDescription>
                <strong className="text-card-foreground">
                  {invitation.inviterName}
                </strong>{" "}
                convidou voce para fazer parte de{" "}
                <strong className="text-card-foreground">
                  {invitation.organizationName}
                </strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Seu papel na equipe sera:
                </p>
                <p className="mt-1 font-semibold text-primary text-xl">
                  {roleLabels[invitation.role] || invitation.role}
                </p>
              </div>

              {!session?.user && (
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                  <p className="text-sm text-warning">
                    Voce precisa estar logado para aceitar o convite.
                  </p>
                </div>
              )}

              <Button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full"
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aceitando...
                  </>
                ) : session?.user ? (
                  "Aceitar Convite"
                ) : (
                  "Fazer Login para Aceitar"
                )}
              </Button>

              <p className="text-center text-muted-foreground text-xs">
                Ao aceitar, voce entrara para a organizacao{" "}
                {invitation.organizationName}
              </p>
            </CardContent>
          </>
        )}

        {status === "accepted" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-success" />
              </div>
              <CardTitle className="text-2xl">Bem-vindo ao time!</CardTitle>
              <CardDescription>
                Voce agora faz parte de{" "}
                <strong className="text-card-foreground">
                  {invitation?.organizationName}
                </strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/organization" className="block">
                <Button className="w-full">Ir para Organizacoes</Button>
              </Link>
            </CardContent>
          </>
        )}

        {status === "already-member" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <CheckCircle className="h-16 w-16 text-info" />
              </div>
              <CardTitle className="text-2xl">Voce ja e membro!</CardTitle>
              <CardDescription>
                Voce ja faz parte desta organizacao.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/organization" className="block">
                <Button className="w-full">Ir para Organizacoes</Button>
              </Link>
            </CardContent>
          </>
        )}

        {(status === "error" || status === "expired") && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">
                {status === "expired" ? "Convite expirado" : "Convite invalido"}
              </CardTitle>
              <CardDescription>
                {status === "expired"
                  ? "Este convite expirou. Solicite um novo convite ao administrador da organizacao."
                  : errorMessage ||
                    "O link do convite e invalido ou ja foi utilizado."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard" className="block">
                <Button variant="outline" className="w-full">
                  Voltar para o Dashboard
                </Button>
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
