"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type NavigationDirection = "forward" | "back" | "replace";

const STORAGE_KEY = "whatlead.nav.stack";
const MAX_STACK = 20;

const readStack = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStack = (stack: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {
    // Ignore storage failures (private mode, quotas)
  }
};

export const useNavigationDirection = (): NavigationDirection => {
  const pathname = usePathname();
  const [direction, setDirection] = useState<NavigationDirection>("forward");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let stack = readStack();

    if (stack.length === 0) {
      stack = [pathname];
      setDirection("forward");
      writeStack(stack);
      return;
    }

    const lastIndex = stack.lastIndexOf(pathname);
    const currentTop = stack[stack.length - 1];

    if (currentTop === pathname) {
      setDirection("replace");
      return;
    }

    if (lastIndex !== -1 && lastIndex < stack.length - 1) {
      stack = stack.slice(0, lastIndex + 1);
      setDirection("back");
      writeStack(stack);
      return;
    }

    stack = [...stack, pathname];
    if (stack.length > MAX_STACK) {
      stack = stack.slice(stack.length - MAX_STACK);
    }
    setDirection("forward");
    writeStack(stack);
  }, [pathname]);

  return direction;
};
