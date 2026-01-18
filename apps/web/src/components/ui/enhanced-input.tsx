"use client";

import { type InputHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

interface EnhancedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  (
    { className, label, error, helperText, leftIcon, rightIcon, id, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-lg px-4 py-3",
              "border border-border bg-input",
              "text-foreground placeholder:text-muted-foreground",
              "transition-all duration-200",
              "hover:border-border/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-destructive focus-visible:ring-destructive/30",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  },
);

EnhancedInput.displayName = "EnhancedInput";
