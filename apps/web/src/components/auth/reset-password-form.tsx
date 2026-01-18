"use client";

import { useForm } from "@tanstack/react-form";
import { CheckCircle, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        setIsError(true);
        setErrorMessage("Token de recuperacao nao encontrado");
        return;
      }

      if (value.password !== value.confirmPassword) {
        toast.error("As senhas nao coincidem");
        return;
      }

      try {
        const result = await authClient.resetPassword({
          newPassword: value.password,
          token,
        });

        if (result.error) {
          if (result.error.message?.includes("expired")) {
            setIsError(true);
            setErrorMessage(
              "Este link expirou. Solicite um novo link de recuperacao.",
            );
          } else {
            toast.error(result.error.message || "Erro ao redefinir senha");
          }
          return;
        }

        setIsSuccess(true);
        toast.success("Senha alterada com sucesso!");

        // Redirecionar após 3 segundos
        setTimeout(() => {
          router.push("/sign-in");
        }, 3000);
      } catch {
        toast.error("Ocorreu um erro. Tente novamente.");
      }
    },
    validators: {
      onSubmit: z
        .object({
          password: z
            .string()
            .min(8, "A senha deve ter pelo menos 8 caracteres")
            .regex(
              /[A-Z]/,
              "A senha deve conter pelo menos uma letra maiuscula",
            )
            .regex(
              /[a-z]/,
              "A senha deve conter pelo menos uma letra minuscula",
            )
            .regex(/[0-9]/, "A senha deve conter pelo menos um numero"),
          confirmPassword: z.string(),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "As senhas nao coincidem",
          path: ["confirmPassword"],
        }),
    },
  });

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Link invalido</CardTitle>
          <CardDescription>
            O link de recuperacao de senha e invalido ou expirou. Solicite um
            novo link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="block">
            <Button className="w-full">Solicitar novo link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Erro</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="block">
            <Button className="w-full">Solicitar novo link</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-success" />
          </div>
          <CardTitle className="text-2xl">Senha alterada!</CardTitle>
          <CardDescription>
            Sua senha foi redefinida com sucesso. Voce sera redirecionado para o
            login em instantes...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/sign-in" className="block">
            <Button className="w-full">Ir para o Login</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Criar nova senha</CardTitle>
        <CardDescription>
          Digite sua nova senha abaixo. Escolha uma senha forte e segura.
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
            <form.Field name="password">
              {(field) => (
                <>
                  <Label htmlFor={field.name}>Nova senha</Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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

          <div className="space-y-2">
            <form.Field name="confirmPassword">
              {(field) => (
                <>
                  <Label htmlFor={field.name}>Confirmar senha</Label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="********"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-muted-foreground text-xs">
              Sua senha deve conter:
            </p>
            <ul className="mt-1 space-y-1 text-muted-foreground text-xs">
              <li>• Pelo menos 8 caracteres</li>
              <li>• Uma letra maiuscula</li>
              <li>• Uma letra minuscula</li>
              <li>• Um numero</li>
            </ul>
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
                    Alterando...
                  </>
                ) : (
                  "Alterar senha"
                )}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
