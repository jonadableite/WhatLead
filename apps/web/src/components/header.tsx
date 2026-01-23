"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const pathname = usePathname();

  const getPageTitle = (path: string) => {
    if (path === "/" || path === "") return "Home";
    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/crm")) return "CRM & Leads";
    if (path.includes("/campaigns")) return "Campanhas";
    if (path.includes("/automations")) return "Automações";
    if (path.includes("/settings")) return "Configurações";

    // Fallback: capitalize first segment
    const segment = path.split("/")[1];
    return segment
      ? segment.charAt(0).toUpperCase() + segment.slice(1)
      : "WhatLead";
  };

  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 shadow-sm transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left Side: Dynamic Title */}
        <div className="flex items-center gap-2">
          <div className="hidden h-6 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-purple-600 md:block" />
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h1>
        </div>

        {/* Right Side: Actions & Profile */}
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <ModeToggle />
          </div>

          {/* Vertical Separator */}
          <div className="h-6 w-px bg-border/50 hidden md:block" />

          <UserMenu />
        </div>
      </div>

      {/* Bottom shine effect for 3D feel */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-50" />
    </header>
  );
}
