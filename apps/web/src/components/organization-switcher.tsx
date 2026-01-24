"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient, useActiveOrganization, useListOrganizations } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function OrganizationSwitcher() {
  const router = useRouter();
  const { data: activeOrg } = useActiveOrganization();
  const { data: organizations } = useListOrganizations();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-11 w-full rounded-xl border border-white/5 bg-white/5" />
    );
  }

  const handleSwitchOrg = async (orgId: string) => {
    await authClient.organization.setActive({
      organizationId: orgId,
    });
    router.refresh();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/20">
              {activeOrg?.logo ? (
                <img
                  src={activeOrg.logo}
                  alt={activeOrg.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                activeOrg?.name?.slice(0, 2).toUpperCase() || "OR"
              )}
            </div>
            <div className="flex flex-col items-start truncate">
              <span className="truncate text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Workspace
              </span>
              <span className="truncate font-semibold">
                {activeOrg?.name || "Select Organization"}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {organizations?.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => handleSwitchOrg(org.id)}
              className="gap-2 p-2 cursor-pointer"
            >
              <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-500/10 text-[10px] font-bold text-indigo-500 border border-indigo-500/20">
                {org.logo ? (
                  <img
                    src={org.logo}
                    alt={org.name}
                    className="h-full w-full rounded object-cover"
                  />
                ) : (
                  org.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="flex-1 truncate text-sm font-medium">
                {org.name}
              </span>
              {activeOrg?.id === org.id && (
                <Check className="ml-auto h-4 w-4 text-indigo-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer" onSelect={() => router.push("/organization/create")}>
          <div className="flex h-6 w-6 items-center justify-center rounded border border-dashed border-zinc-500 bg-transparent text-zinc-500">
            <Plus className="h-4 w-4" />
          </div>
          <span className="text-muted-foreground">Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
