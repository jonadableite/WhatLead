"use client";

import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { ShineBorder } from "@/components/ui/shine-border";
import { signIn } from "@/lib/auth-client";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = (() => {
    const raw = searchParams.get("redirect");
    if (!raw) return "/dashboard";
    if (!raw.startsWith("/")) return "/dashboard";
    return raw;
  })();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "E-mail inválido";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Senha é obrigatória";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const { data, error } = await signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
        callbackURL: redirectTo,
      });

      if (process.env.NODE_ENV === "development") {
        console.log("[SignIn] Response:", { data, error });
      }

      if (error) {
        console.error("[SignIn] Error:", error);

        if (error.message?.toLowerCase().includes("too many")) {
          setErrors({
            general: "Muitas tentativas. Aguarde um minuto e tente novamente.",
          });
          return;
        }

        if (
          error.message?.includes("Invalid") ||
          error.message?.includes("credentials") ||
          error.message?.includes("incorrect") ||
          error.message?.includes("not found")
        ) {
          setErrors({ general: "E-mail ou senha incorretos" });
        } else if (error.message?.includes("banned")) {
          setErrors({
            general: "Sua conta foi suspensa. Entre em contato com o suporte.",
          });
        } else {
          const errorMsg = error.message || "Erro ao fazer login";
          setErrors({ general: errorMsg });
        }
        return;
      }

      if (data) {
        router.push(redirectTo as Route);
        router.refresh();
        return;
      }

      console.warn("[SignIn] No data or error returned");
      setErrors({
        general:
          "Não foi possível efetuar login agora. Tente novamente em instantes.",
      });
    } catch (err) {
      console.error("[SignIn] Exception:", err);

      if (err instanceof TypeError && err.message.includes("Failed to fetch")) {
        setErrors({
          general:
            "Não foi possível conectar ao servidor. Verifique sua conexão.",
        });
      } else {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro inesperado. Tente novamente.";
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSocialLogin = async (provider: "google" | "github") => {
    setIsLoading(true);
    try {
      await signIn.social({
        provider,
        callbackURL: "/dashboard",
      });
    } catch (err) {
      console.error(`[SignIn] ${provider} error:`, err);
      setErrors({ general: `Erro ao fazer login com ${provider}` });
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Card with Shine Border */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8">
        <ShineBorder
          shineColor={[
            "hsl(var(--primary))",
            "hsl(var(--success))",
            "hsl(var(--primary))",
          ]}
          borderWidth={1}
          duration={10}
        />

        {/* Header */}
        <div className="mb-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 text-2xl font-bold text-foreground"
          >
            Bem-vindo de volta
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Entre na sua conta para continuar
          </motion.p>
        </div>

        {/* Error Alert */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4"
          >
            <p className="text-sm text-destructive">{errors.general}</p>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <EnhancedInput
              name="email"
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              leftIcon={<Mail className="h-5 w-5" />}
              disabled={isLoading}
              autoComplete="email"
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <EnhancedInput
              name="password"
              type={showPassword ? "text" : "password"}
              label="Senha"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="transition-colors hover:text-primary"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              disabled={isLoading}
              autoComplete="current-password"
            />
          </motion.div>

          {/* Remember Me & Forgot Password */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between"
          >
            <label className="group flex cursor-pointer items-center gap-2">
              <div className="relative">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="peer sr-only"
                  disabled={isLoading}
                />
                <div className="h-5 w-5 rounded border-2 border-border bg-card transition-all peer-checked:border-primary peer-checked:bg-primary group-hover:border-primary/50">
                  <svg
                    className="h-full w-full p-0.5 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <svg
                  className={`absolute inset-0 h-full w-full p-0.5 text-primary-foreground transition-opacity ${
                    formData.rememberMe ? "opacity-100" : "opacity-0"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground/90">
                Lembrar de mim
              </span>
            </label>

            <Link
              href="/forgot-password"
              className="text-sm text-primary transition-colors hover:text-primary/80"
            >
              Esqueceu a senha?
            </Link>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <EnhancedButton
              type="submit"
              className="h-12 w-full text-base font-semibold"
              isLoading={isLoading}
              rightIcon={!isLoading && <ArrowRight className="h-5 w-5" />}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </EnhancedButton>
          </motion.div>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-4 text-muted-foreground">
              ou continue com
            </span>
          </div>
        </div>

        {/* Social Login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <EnhancedButton
            type="button"
            variant="outline"
            className="h-11 border-border hover:border-primary/50 hover:bg-primary/5"
            disabled={isLoading}
            onClick={() => handleSocialLogin("google")}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </EnhancedButton>

          <EnhancedButton
            type="button"
            variant="outline"
            className="h-11 border-border hover:border-primary/50 hover:bg-primary/5"
            disabled={isLoading}
            onClick={() => handleSocialLogin("github")}
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </EnhancedButton>
        </motion.div>

        {/* Sign Up Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-8 text-center text-muted-foreground"
        >
          Não tem uma conta?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Criar conta gratuita
          </Link>
        </motion.p>
      </div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <svg
          className="h-4 w-4 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Conexão segura e criptografada</span>
      </motion.div>
    </div>
  );
}
