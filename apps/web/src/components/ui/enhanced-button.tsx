"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "motion/react";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-[var(--rocket-purple)] text-white hover:bg-[var(--rocket-purple-light)] shadow-lg shadow-[var(--rocket-purple)]/20",
				destructive:
					"bg-[var(--rocket-danger)] text-white hover:bg-[var(--rocket-danger)]/90 shadow-lg shadow-[var(--rocket-danger)]/20",
				outline:
					"border border-[var(--rocket-gray-600)] bg-transparent text-[var(--rocket-gray-100)] hover:border-[var(--rocket-purple)]/50 hover:bg-[var(--rocket-purple)]/5",
				secondary:
					"bg-[var(--rocket-gray-700)] text-[var(--rocket-gray-100)] hover:bg-[var(--rocket-gray-600)]",
				ghost:
					"text-[var(--rocket-gray-100)] hover:bg-[var(--rocket-gray-700)]",
				link: "text-[var(--rocket-purple)] underline-offset-4 hover:underline",
				success:
					"bg-[var(--rocket-green)] text-white hover:bg-[var(--rocket-green-dark)] shadow-lg shadow-[var(--rocket-green)]/20",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-11 rounded-lg px-8",
				xl: "h-12 rounded-lg px-10 text-base",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type MotionButtonProps = Omit<
	HTMLMotionProps<"button">,
	"ref" | "children" | "className"
>;

interface EnhancedButtonProps
	extends MotionButtonProps,
		VariantProps<typeof buttonVariants> {
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	children?: React.ReactNode;
	className?: string;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, EnhancedButtonProps>(
	(
		{
			className,
			variant,
			size,
			isLoading,
			leftIcon,
			rightIcon,
			children,
			...props
		},
		ref,
	) => {
		const isDisabled = props.disabled || isLoading;

		return (
			<motion.button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				whileHover={{ scale: isDisabled ? 1 : 1.02 }}
				whileTap={{ scale: isDisabled ? 1 : 0.98 }}
				disabled={isDisabled}
				{...props}
			>
				{isLoading ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : leftIcon ? (
					<span className="mr-2 flex items-center">{leftIcon}</span>
				) : null}
				{children}
				{!isLoading && rightIcon && (
					<span className="ml-2 flex items-center">{rightIcon}</span>
				)}
			</motion.button>
		);
	},
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, buttonVariants };
