"use client";

import type * as React from "react";
import { cn } from "@/lib/utils";

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the border in pixels
   * @default 1
   */
  borderWidth?: number;
  /**
   * Duration of the animation in seconds
   * @default 14
   */
  duration?: number;
  /**
   * Color of the border, can be a single color or an array of colors
   * @default "hsl(var(--primary))"
   */
  shineColor?: string | string[];
}

/**
 * Shine Border
 *
 * An animated background border effect component with configurable properties.
 * Based on Magic UI: https://magicui.design/docs/components/shine-border
 */
export const ShineBorder = ({
  borderWidth = 1,
  duration = 14,
  shineColor = "hsl(var(--primary))",
  className,
  style,
  ...props
}: ShineBorderProps) => {
  const colorString = Array.isArray(shineColor)
    ? shineColor.join(",")
    : shineColor;

  return (
    <div
      style={
        {
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          backgroundImage: `radial-gradient(transparent,transparent, ${colorString},transparent,transparent)`,
          backgroundSize: "300% 300%",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "var(--border-width)",
          ...style,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 size-full animate-shine rounded-[inherit] will-change-[background-position]",
        className,
      )}
      {...props}
    />
  );
};
