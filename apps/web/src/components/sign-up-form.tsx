"use client";

import { useForm } from "@tanstack/react-form";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { setTurnstileToken } from "@/lib/bot-challenge";

import Loader from "./loader";
import { TurnstileWidget } from "./turnstile-widget";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const { isPending } = authClient.useSession();
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [needsBotChallenge, setNeedsBotChallenge] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            setSubmittedEmail(value.email);
            setIsSuccess(true);
            toast.success("Conta criada com sucesso! Verifique seu email.");
          },
          onError: (error) => {
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
            toast.error(error.error.message || "Erro ao criar conta");
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
        email: z.string().email("Digite um email valido"),
        password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  if (isSuccess) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="mb-2 font-bold text-2xl text-foreground">
            Conta criada!
          </h1>
          <p className="mb-6 text-muted-foreground">
            Enviamos um email de confirmacao para{" "}
            <span className="font-medium text-foreground">
              {submittedEmail}
            </span>
          </p>

          <div className="mb-6 rounded-lg border border-border bg-card/50 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <div className="text-left">
                <p className="font-medium text-sm text-foreground">
                  Verifique sua caixa de entrada
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Clique no link que enviamos para confirmar seu email e comecar
                  a usar o WhatLead.
                </p>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-sm">
            Nao recebeu o email?{" "}
            <button
              onClick={() => {
                authClient.sendVerificationEmail({ email: submittedEmail });
                toast.success("Email reenviado!");
              }}
              className="text-primary underline hover:text-primary/80"
            >
              Reenviar email
            </button>
          </p>

          <div className="mt-6">
            <Button
              variant="outline"
              onClick={onSwitchToSignIn}
              className="w-full"
            >
              Voltar para o Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-2 text-center font-bold text-3xl text-foreground">
        Criar conta
      </h1>
      <p className="mb-6 text-center text-muted-foreground">
        Comece a transformar conversas em vendas
      </p>

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
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Nome</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Seu nome"
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
                <Label htmlFor={field.name}>Senha</Label>
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
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button variant="link" onClick={onSwitchToSignIn}>
          Ja tem uma conta? Entrar
        </Button>
      </div>
    </div>
  );
}
