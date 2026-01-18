"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

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

export default function ForgotPasswordForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: "/reset-password",
        });

        if (result.error) {
          toast.error(result.error.message || "Erro ao enviar email");
          return;
        }

        setSubmittedEmail(value.email);
        setIsSubmitted(true);
        toast.success("Email enviado com sucesso!");
      } catch {
        toast.error("Ocorreu um erro. Tente novamente.");
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Digite um email valido"),
      }),
    },
  });

  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifique seu email</CardTitle>
          <CardDescription>
            Enviamos um link de recuperacao para{" "}
            <span className="font-medium text-card-foreground">
              {submittedEmail}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground text-sm">
            Nao recebeu o email? Verifique sua caixa de spam ou{" "}
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-primary underline hover:text-primary/80"
            >
              tente novamente
            </button>
          </p>
          <Link href="/sign-in" className="block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Esqueceu sua senha?</CardTitle>
        <CardDescription>
          Sem problemas! Digite seu email e enviaremos um link para voce criar
          uma nova senha.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <form.Field name="email">
              {(field) => (
                <>
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
                    <p
                      key={error?.message}
                      className="text-destructive text-sm"
                    >
                      {error?.message}
                    </p>
                  ))}
                </>
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
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperacao"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <div className="mt-6">
          <Link href="/sign-in" className="block">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
