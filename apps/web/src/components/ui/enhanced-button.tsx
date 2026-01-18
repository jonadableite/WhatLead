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
					"bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20",
				outline:
					"border border-border bg-transparent text-foreground hover:border-primary/50 hover:bg-primary/5",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost:
					"text-foreground hover:bg-muted",
				link: "text-primary underline-offset-4 hover:underline",
				success:
					"bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/20",
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
