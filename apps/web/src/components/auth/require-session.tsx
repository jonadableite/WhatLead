"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { authClient, type Session } from "@/lib/auth-client";

export function RequireSession({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !data?.user && !error) {
      const redirectTo = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/sign-in?redirect=${redirectTo}`);
    }
  }, [data?.user, error, isPending, pathname, router]);

  if (isPending) return <Loader />;

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 pt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível validar sua sessão (servidor indisponível).
        </p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!data?.user) return <Loader />;

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!data?.user && !error) {
      const redirectTo = encodeURIComponent(pathname || "/admin");
      router.replace(`/sign-in?redirect=${redirectTo}`);
      return;
    }
    if (data?.user && data.user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [data?.user, error, isPending, pathname, router]);

  if (isPending) return <Loader />;
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 pt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível validar sua sessão (servidor indisponível).
        </p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }
  if (!data?.user) return <Loader />;
  if (data.user.role !== "admin") return <Loader />;
  return children;
}
