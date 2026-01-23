"use client";

import {
  Building2,
  CheckCircle2,
  ImageUp,
  Link as LinkIcon,
  Loader2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { organization } from "@/lib/auth-client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function CreateOrganizationForm() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = React.useState(false);
  const [slugAvailable, setSlugAvailable] = React.useState<boolean | null>(
    null,
  );

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = React.useState("");
  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);
  const [logoError, setLogoError] = React.useState<string | null>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  React.useEffect(() => {
    const normalized = slugify(slug);

    if (!normalized || normalized.length < 3) {
      setSlugAvailable(null);
      setIsCheckingSlug(false);
      return;
    }

    let active = true;
    setIsCheckingSlug(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const res: Awaited<ReturnType<typeof organization.checkSlug>> =
          await organization.checkSlug({ slug: normalized });
        if (!active) return;
        if (res.error) {
          setSlugAvailable(null);
          return;
        }
        setSlugAvailable(res.data?.available ?? null);
      } catch {
        if (!active) return;
        setSlugAvailable(null);
      } finally {
        if (!active) return;
        setIsCheckingSlug(false);
      }
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [slug]);

  const openFilePicker = (): void => {
    fileInputRef.current?.click();
  };

  const clearLogo = (): void => {
    setLogoError(null);
    setLogoDataUrl(null);
    setLogoUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLogoFile = (file: File): void => {
    setLogoError(null);

    const allowedTypes = new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/svg+xml",
    ]);

    if (!allowedTypes.has(file.type)) {
      setLogoError("Formato não suportado. Use PNG, JPG, WEBP ou SVG.");
      return;
    }

    const maxBytes = 512 * 1024;
    if (file.size > maxBytes) {
      setLogoError("Imagem muito grande. Tamanho máximo: 512KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        setLogoError("Não foi possível ler a imagem.");
        return;
      }
      setLogoUrl("");
      setLogoDataUrl(result);
    };
    reader.onerror = () => setLogoError("Não foi possível ler a imagem.");
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLogoError(null);

    const finalName = name.trim();
    const finalSlug = slugify(slug);
    const finalLogo = logoDataUrl ?? logoUrl.trim();

    if (!finalName) {
      setError("Por favor, insira o nome da organização.");
      return;
    }
    if (!finalSlug || finalSlug.length < 3) {
      setError("O identificador deve ter pelo menos 3 caracteres.");
      return;
    }
    if (slugAvailable === false) {
      setError(
        "Este identificador (slug) já está em uso. Por favor, escolha outro.",
      );
      return;
    }
    if (
      finalLogo &&
      !finalLogo.startsWith("http") &&
      !finalLogo.startsWith("data:image/")
    ) {
      setLogoError(
        "Use uma URL válida (http/https) ou envie um arquivo de imagem.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const checkRes: Awaited<ReturnType<typeof organization.checkSlug>> =
        await organization.checkSlug({ slug: finalSlug });
      if (checkRes.data?.available === false) {
        setError(
          "Este identificador (slug) já está em uso. Por favor, escolha outro.",
        );
        return;
      }

      const res: Awaited<ReturnType<typeof organization.create>> =
        await organization.create({
          name: finalName,
          slug: finalSlug,
          ...(finalLogo ? { logo: finalLogo } : {}),
        });

      if (res.error) {
        throw new Error(res.error.message || "Falha ao criar organização.");
      }

      toast.success("Organização criada com sucesso!");

      router.refresh();

      const organizationId = res.data?.id;
      router.push(
        organizationId
          ? `/organization/${encodeURIComponent(organizationId)}`
          : "/organization",
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(err);

      const lower = msg.toLowerCase();
      if (lower.includes("slug") || lower.includes("unique")) {
        setError(
          "Este identificador (slug) já está em uso. Por favor, escolha outro.",
        );
      } else {
        setError(msg || "Falha ao criar organização.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="org-name"
          className="block text-sm font-medium text-white flex items-center gap-2"
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          Nome da Organização
        </label>
        <div className="relative group">
          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Minha Empresa Inc."
            className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 px-4 py-3 transition-all duration-200"
            autoFocus
          />
          <div className="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="org-slug"
          className="block text-sm font-medium text-white flex items-center gap-2"
        >
          <LinkIcon className="w-4 h-4 text-indigo-400" />
          Identificador (slug)
        </label>
        <div className="relative flex rounded-xl bg-white/5 border border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-200 overflow-hidden">
          <input
            id="org-slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            onBlur={() => setSlug((s) => slugify(s))}
            placeholder="minha-empresa"
            className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none px-4 py-3"
          />
        </div>
        <div className="ml-1 flex items-center justify-between gap-3 text-xs">
          <span className="text-white/40">
            Usado para identificar sua organização em integrações e links.
          </span>
          <span className="flex items-center gap-2">
            {isCheckingSlug ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white/50" />
                <span className="text-white/50">Verificando...</span>
              </>
            ) : slugAvailable === true ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-200">Disponível</span>
              </>
            ) : slugAvailable === false ? (
              <>
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                <span className="text-red-200">Indisponível</span>
              </>
            ) : null}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-medium text-white flex items-center gap-2">
            <ImageUp className="w-4 h-4 text-indigo-400" />
            Logo (opcional)
          </label>
          {(logoDataUrl || logoUrl.trim()) && (
            <Button
              type="button"
              onClick={clearLogo}
              variant="ghost"
              size="xs"
            >
              Remover
            </Button>
          )}
        </div>

        <div className="flex items-start gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            {logoDataUrl || logoUrl.trim() ? (
              <img
                src={logoDataUrl ?? logoUrl.trim()}
                alt="Logo da organização"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                Logo
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleLogoFile(file);
                }}
              />
              <Button
                type="button"
                onClick={openFilePicker}
                variant="outline"
                size="sm"
              >
                Enviar imagem
              </Button>
              <div className="text-xs text-white/40">
                PNG/JPG/WEBP/SVG • até 512KB
              </div>
            </div>

            <div className="relative flex rounded-xl bg-white/5 border border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all duration-200 overflow-hidden">
              <input
                type="url"
                inputMode="url"
                value={logoUrl}
                onChange={(e) => {
                  setLogoError(null);
                  setLogoDataUrl(null);
                  setLogoUrl(e.target.value);
                }}
                placeholder="https://exemplo.com/logo.png"
                className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none px-4 py-3"
              />
            </div>
          </div>
        </div>

        {logoError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <XCircle className="w-4 h-4 shrink-0" />
            {logoError}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="pt-4 flex items-center justify-end gap-3">
        <Button
          type="button"
          onClick={() => router.back()}
          variant="outline"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting || !name || !slug || slugAvailable === false}
        >
          <div className="flex items-center gap-2">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Criando...</span>
              </>
            ) : (
              <span>Criar Organização</span>
            )}
          </div>
        </Button>
      </div>
    </form>
  );
}
