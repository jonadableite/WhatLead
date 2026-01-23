"use client";

import lottie, { type AnimationItem } from "lottie-web";
import { useEffect, useRef } from "react";

interface AnimatedIconProps {
  icon: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  size?: number;
  className?: string;
}

export function AnimatedIcon({
  icon,
  size = 24,
  className = "",
  trigger = "hover", // 'hover' (default) | 'manual'
  isHovered = false, // Controlled state
}: AnimatedIconProps & { trigger?: "hover" | "manual"; isHovered?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize animation
    animationRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: icon,
    });

    return () => {
      animationRef.current?.destroy();
    };
  }, [icon]);

  // Effect to handle manual trigger (e.g. parent hover)
  useEffect(() => {
    if (trigger === "manual" && animationRef.current) {
      if (isHovered) {
        animationRef.current.setDirection(1);
        animationRef.current.play();
      } else {
        animationRef.current.stop();
      }
    }
  }, [trigger, isHovered]);

  const handleMouseEnter = () => {
    if (trigger === "hover" && animationRef.current) {
      animationRef.current.setDirection(1);
      animationRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (trigger === "hover" && animationRef.current) {
      animationRef.current.stop();
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: size, height: size }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    />
  );
}
