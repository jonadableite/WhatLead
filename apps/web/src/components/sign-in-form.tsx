"use client";

import { useForm } from "@tanstack/react-form";
import { AlertCircle, Loader2 } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { setTurnstileToken } from "@/lib/bot-challenge";
import { logger } from "@/lib/logger";

import Loader from "./loader";
import { TurnstileWidget } from "./turnstile-widget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = (() => {
    const raw = searchParams.get("redirect");
    if (!raw) return "/dashboard";
    if (!raw.startsWith("/")) return "/dashboard";
    return raw;
  })();
  const { isPending } = authClient.useSession();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [needsBotChallenge, setNeedsBotChallenge] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      const startTime = Date.now();

      try {
        logger.userAction("attempted_login", { email: value.email });

        await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onSuccess: () => {
              const duration = Date.now() - startTime;
              logger.business("user_logged_in", "User successfully logged in", {
                email: value.email,
                duration,
              });
              logger.performance("login_flow", duration);

              router.push(redirectTo as Route);
              toast.success("Login realizado com sucesso!");
            },
            onError: (error) => {
              const duration = Date.now() - startTime;
              logger.error("Login failed", error.error, {
                email: value.email,
                duration,
                status: error.error.status,
              });

              if (
                error.error.status === 403 &&
                [
                  "BOT_CHALLENGE_REQUIRED",
                  "BOT_BLOCKED",
                  "UNTRUSTED_ORIGIN",
                ].includes((error.error as any).code)
              ) {
                setNeedsBotChallenge(true);
                toast.error("Confirme que voce nao e um robo para continuar");
                return;
              }

              // Verificar se é erro de email não verificado
              if (
                error.error.status === 403 ||
                error.error.message?.toLowerCase().includes("verif")
              ) {
                setVerificationEmail(value.email);
                setNeedsVerification(true);
                logger.info("Login failed due to unverified email", {
                  email: value.email,
                });
                return;
              }

              toast.error(error.error.message || "Email ou senha incorretos");
            },
          },
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error("Unexpected error during login", error, {
          email: value.email,
          duration,
        });
        toast.error("Erro inesperado. Tente novamente.");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Digite um email valido"),
        password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  const handleResendVerification = async () => {
    try {
      logger.userAction("requested_verification_email", {
        email: verificationEmail,
      });
      await authClient.sendVerificationEmail({ email: verificationEmail });
      logger.business("verification_email_sent", "Verification email sent", {
        email: verificationEmail,
      });
      toast.success("Email de verificacao reenviado!");
    } catch (error) {
      logger.error("Failed to send verification email", error, {
        email: verificationEmail,
      });
      toast.error("Erro ao reenviar email");
    }
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-2 text-center font-bold text-3xl text-foreground">
        Bem-vindo de volta
      </h1>
      <p className="mb-6 text-center text-muted-foreground">
        Entre na sua conta para continuar
      </p>

      {needsVerification && (
        <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning" />
            <div>
              <p className="font-medium text-sm text-warning">
                Email nao verificado
              </p>
              <p className="mt-1 text-xs text-warning/80">
                Verifique seu email antes de continuar. Nao recebeu?{" "}
                <button
                  onClick={handleResendVerification}
                  className="underline hover:text-warning/90"
                >
                  Reenviar email
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {needsBotChallenge && (
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <TurnstileWidget
              onToken={(token) => {
                setTurnstileToken(token);
                setNeedsBotChallenge(false);
              }}
            />
          </div>
        )}
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="seu@email.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Senha</Label>
                  <Link
                    href="/forgot-password"
                    className="text-primary text-xs hover:text-primary/80 hover:underline"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="********"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-destructive text-sm">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button variant="link" onClick={onSwitchToSignUp}>
          Nao tem conta? Criar conta
        </Button>
      </div>
    </div>
  );
}
