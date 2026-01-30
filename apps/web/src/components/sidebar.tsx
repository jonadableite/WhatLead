"use client";

import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Menu, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { OrganizationSwitcher } from "./organization-switcher";
import { AnimatedIcon } from "./ui/animated-icon";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import UserMenu from "./user-menu";

// Assets Imports
import organizationIcon from "@/asset/wired-outline-1007-organization-hover-pinch.json";
import instancesIcon from "@/asset/wired-outline-1686-scan-qr-code-hover-pinch.json";
import aiIcon from "@/asset/wired-outline-2512-artificial-intelligence-ai-alt-hover-pinch.json";
import crmIcon from "@/asset/wired-outline-2610-lead-generation-hover-pinch.json";
import boostIcon from "@/asset/wired-outline-3139-rocket-space-alt-hover-pinch.json";
import dashboardIcon from "@/asset/wired-outline-63-home-hover-3d-roll.json";
import operatorIcon from "@/asset/wired-outline-964-omnichannel-hover-pinch.json";
import tasksIcon from "@/asset/wired-outline-978-project-management-hover-pinch.json";
import chatIcon from "@/asset/wired-outline-981-consultation-hover-conversation.json";

const menuItems = [
  { name: "Dashboard", icon: dashboardIcon, path: "/dashboard" },
  { name: "Instâncias", icon: instancesIcon, path: "/instances" },
  { name: "Chat CRM", icon: chatIcon, path: "/chat" },
  { name: "Operator View", icon: operatorIcon, path: "/operator" },
  { name: "CRM & Leads", icon: crmIcon, path: "/crm" },
  { name: "AI Chat", icon: aiIcon, path: "/ai" },
  { name: "Organization", icon: organizationIcon, path: "/organization" },
  { name: "Tasks", icon: tasksIcon, path: "/todos" },
] as const satisfies ReadonlyArray<{
  name: string;
  icon: unknown;
  path: Route;
}>;

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, isPending: isSessionPending } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredItemPath, setHoveredItemPath] = useState<string | null>(null);

  // Handle Resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [pathname, isMobile]);

  return (
    <>
      {/* Mobile Trigger */}
      <div className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-[#050505]/80 px-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="text-white hover:bg-white/10"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="text-lg font-bold text-white">WhatLead</span>
        </div>
      </div>

      {/* Backdrop (Mobile) */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 border-r border-white/5 bg-[#0D0D0D] shadow-2xl",
          "md:translate-x-0"
        )}
        initial={false}
        animate={{ x: isOpen || !isMobile ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex h-full flex-col p-6">
          {/* Logo & Close */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 relative flex items-center justify-center">
                <Image
                  src="/favicon-logo.svg"
                  alt="WhatLead Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                WhatLead
              </span>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Organization Switcher */}
          <div className="mb-6">
            {isSessionPending ? (
              <div className="h-11 w-full rounded-xl border border-white/5 bg-white/5" />
            ) : session?.user ? (
              <OrganizationSwitcher />
            ) : null}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search..."
              className="h-10 border-white/5 bg-white/5 pl-10 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500/50"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
              ⌘ K
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-white/5"
                  onMouseEnter={() => setHoveredItemPath(item.path)}
                  onMouseLeave={() => setHoveredItemPath(null)}
                >
                  {/* Active Background Gradient */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Active Indicator Bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBar"
                      className="absolute right-0 h-6 w-1 rounded-l-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3">
                    <AnimatedIcon
                      icon={item.icon}
                      size={24}
                      trigger="manual"
                      isHovered={hoveredItemPath === item.path}
                      className={cn(
                        "opacity-70 transition-opacity duration-200 group-hover:opacity-100",
                        isActive && "opacity-100 text-indigo-400" // Lordicon uses internal colors, but we can try filter if needed
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium text-zinc-400 transition-colors duration-200 group-hover:text-white",
                        isActive && "text-white"
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="mt-auto pt-6 space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-5">
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-3 flex items-center gap-2">
                  <AnimatedIcon icon={boostIcon} size={20} />
                  <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-sm font-semibold text-transparent">
                    Boost with AI
                  </span>
                </div>
                <p className="mb-4 text-xs leading-relaxed text-zinc-400">
                  Unlock advanced AI features and automate your workflow.
                </p>
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500 border-0">
                  Upgrade to Pro
                </Button>
              </div>
            </div>

            {/* Mobile User Menu */}
            <div className="md:hidden border-t border-white/5 pt-4">
              <div className="flex items-center gap-3 px-2">
                <UserMenu align="start" />
                <div className="text-xs text-zinc-400">My Account</div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
