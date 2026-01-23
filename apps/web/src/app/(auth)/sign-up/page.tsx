"use client";

import Loader from "@/components/loader";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { ShineBorder } from "@/components/ui/shine-border";
import { signIn, signUp } from "@/lib/auth-client";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<Loader />}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres";
    }

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
    } else if (formData.password.length < 8) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Senha deve conter maiúscula, minúscula e número";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirmação de senha é obrigatória";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Senhas não coincidem";
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
      const { data, error } = await signUp.email(
        {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          callbackURL: redirectTo,
        },
        {
          onSuccess: () => {
            router.replace(redirectTo as Route);
          },
          onError: (ctx) => {
            setErrors({ general: ctx.error?.message || "Erro ao criar conta" });
            setIsLoading(false);
          },
        },
      );

      if (error) {
        setErrors({ general: error.message || "Erro ao criar conta" });
        setIsLoading(false);
        return;
      }

      if (data) {
        setTimeout(() => {
          router.replace("/dashboard");
        }, 100);
      }
    } catch (err) {
      console.error("[SignUp] Exception:", err);
      setErrors({ general: "Erro inesperado. Tente novamente." });
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      console.error(`[SignUp] ${provider} error:`, err);
      setErrors({ general: `Erro ao criar conta com ${provider}` });
      setIsLoading(false);
    }
  };

  // Password strength indicators
  const passwordChecks = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
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
            Crie sua conta
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground"
          >
            Comece a automatizar seu WhatsApp
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
          {/* Name Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <EnhancedInput
              name="name"
              label="Nome completo"
              placeholder="Seu nome"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              leftIcon={<User className="h-5 w-5" />}
              disabled={isLoading}
              autoComplete="name"
            />
          </motion.div>

          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
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
            transition={{ delay: 0.2 }}
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
              autoComplete="new-password"
            />
          </motion.div>

          {/* Confirm Password Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <EnhancedInput
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              label="Confirmar senha"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              leftIcon={<Lock className="h-5 w-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="transition-colors hover:text-primary"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              }
              disabled={isLoading}
              autoComplete="new-password"
            />
          </motion.div>

          {/* Password Requirements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-1 text-xs text-muted-foreground"
          >
            <p>A senha deve conter:</p>
            <ul className="ml-1 list-inside list-disc space-y-0.5">
              <li className={passwordChecks.length ? "text-success" : ""}>
                Pelo menos 8 caracteres
              </li>
              <li className={passwordChecks.uppercase ? "text-success" : ""}>
                Uma letra maiúscula
              </li>
              <li className={passwordChecks.lowercase ? "text-success" : ""}>
                Uma letra minúscula
              </li>
              <li className={passwordChecks.number ? "text-success" : ""}>
                Um número
              </li>
            </ul>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <EnhancedButton
              type="submit"
              className="h-12 w-full text-base font-semibold"
              isLoading={isLoading}
              rightIcon={!isLoading && <ArrowRight className="h-5 w-5" />}
            >
              {isLoading ? "Criando conta..." : "Criar conta"}
            </EnhancedButton>
          </motion.div>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-card px-4 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Social Login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <EnhancedButton
            type="button"
            variant="outline"
            className="h-11 w-full border-border hover:border-primary/50 hover:bg-primary/5"
            disabled={isLoading}
            onClick={() => handleSocialLogin("google")}
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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
            Continuar com Google
          </EnhancedButton>

          <EnhancedButton
            type="button"
            variant="outline"
            className="h-11 w-full border-border hover:border-primary/50 hover:bg-primary/5"
            disabled={isLoading}
            onClick={() => handleSocialLogin("github")}
          >
            <svg
              className="mr-3 h-5 w-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continuar com GitHub
          </EnhancedButton>
        </motion.div>

        {/* Sign In Link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-8 text-center text-muted-foreground"
        >
          Já tem uma conta?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            Entrar
          </Link>
        </motion.p>
      </div>

      {/* Terms */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-center text-xs text-muted-foreground"
      >
        Ao criar uma conta, você concorda com nossos{" "}
        <span className="cursor-pointer text-primary hover:underline">
          Termos de Uso
        </span>{" "}
        e{" "}
        <span className="cursor-pointer text-primary hover:underline">
          Política de Privacidade
        </span>
      </motion.p>
    </div>
  );
}
