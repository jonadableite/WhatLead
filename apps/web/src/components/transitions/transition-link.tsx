"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import { useViewTransitions } from "@/hooks/use-view-transitions";

interface TransitionLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

const shouldHandleClick = (event: MouseEvent<HTMLAnchorElement>) => {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
};

export const TransitionLink = ({
  href,
  onClick,
  children,
  ...props
}: TransitionLinkProps) => {
  const router = useRouter();
  const { startViewTransition } = useViewTransitions();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!shouldHandleClick(event)) return;
    if (typeof href !== "string") return;
    if (href.startsWith("#")) return;

    event.preventDefault();
    startViewTransition(() => router.push(href));
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
};
