"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import {
  transitionVariants,
  type TransitionVariantName,
} from "@/components/transitions/variants";

interface PageTransitionProps {
  children: React.ReactNode;
  variant?: TransitionVariantName;
  className?: string;
}

const resolveVariantForPath = (
  pathname: string,
  direction: "forward" | "back" | "replace",
): TransitionVariantName => {
  if (pathname.startsWith("/instances")) {
    return direction === "back" ? "slideRight" : "slideLeft";
  }
  if (pathname === "/dashboard") {
    return "scale";
  }
  if (pathname.startsWith("/ai") || pathname.startsWith("/crm")) {
    return "fadeSlideUp";
  }
  return "fade";
};

export const PageTransition = ({
  children,
  variant,
  className,
}: PageTransitionProps) => {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const direction = useNavigationDirection();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const selectedVariant = useMemo(() => {
    if (variant) return variant;
    return resolveVariantForPath(pathname, direction);
  }, [variant, pathname, direction]);

  const motionVariant = transitionVariants[selectedVariant];
  const duration = prefersReducedMotion ? 0.01 : isMobile ? 0.2 : 0.3;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={motionVariant}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`page-content will-change-transform ${
          className ?? ""
        }`.trim()}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
