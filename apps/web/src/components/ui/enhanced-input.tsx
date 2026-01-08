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
		const inputId = id || generatedId;

		return (
			<div className="w-full">
				{label && (
					<label
						htmlFor={inputId}
						className="mb-2 block text-sm font-medium text-[var(--rocket-gray-100)]"
					>
						{label}
					</label>
				)}
				<div className="relative">
					{leftIcon && (
						<div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rocket-gray-400)]">
							{leftIcon}
						</div>
					)}
					<input
						ref={ref}
						id={inputId}
						className={cn(
							"w-full rounded-lg px-4 py-3",
							"border border-[var(--rocket-gray-600)] bg-[var(--rocket-gray-900)]",
							"text-[var(--rocket-gray-50)] placeholder:text-[var(--rocket-gray-400)]",
							"transition-all duration-200",
							"hover:border-[var(--rocket-gray-500)]",
							"focus:border-[var(--rocket-purple)] focus:outline-none focus:ring-2 focus:ring-[var(--rocket-purple)]/20",
							"disabled:cursor-not-allowed disabled:opacity-50",
							leftIcon && "pl-10",
							rightIcon && "pr-10",
							error &&
								"border-[var(--rocket-danger)] focus:border-[var(--rocket-danger)] focus:ring-[var(--rocket-danger)]/20",
							className,
						)}
						{...props}
					/>
					{rightIcon && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--rocket-gray-400)]">
							{rightIcon}
						</div>
					)}
				</div>
				{error && (
					<p className="mt-1.5 text-sm text-[var(--rocket-danger)]">{error}</p>
				)}
				{helperText && !error && (
					<p className="mt-1.5 text-sm text-[var(--rocket-gray-400)]">
						{helperText}
					</p>
				)}
			</div>
		);
	},
);

EnhancedInput.displayName = "EnhancedInput";
