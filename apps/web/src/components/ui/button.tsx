import { Button as ButtonPrimitive } from "@base-ui/react/button";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-clip-padding font-semibold text-sm outline-none transition-all focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"overflow-hidden border-white/10 bg-gradient-to-b from-primary/90 via-primary/70 to-primary/45 text-primary-foreground shadow-[0_10px_30px_rgba(0,0,0,0.55)] hover:brightness-110 active:translate-y-[1px]",
				outline:
					"overflow-hidden border-white/10 bg-white/5 text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur hover:bg-white/10 active:translate-y-[1px]",
				secondary:
					"border-white/10 bg-gradient-to-b from-secondary/80 to-secondary/55 text-secondary-foreground shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:brightness-110 active:translate-y-[1px]",
				ghost:
					"rounded-xl bg-transparent text-foreground hover:bg-white/8 active:translate-y-[1px]",
				destructive:
					"overflow-hidden border-destructive/30 bg-gradient-to-b from-destructive/35 to-destructive/20 text-destructive shadow-[0_10px_30px_rgba(0,0,0,0.45)] hover:bg-destructive/30 active:translate-y-[1px] focus-visible:border-destructive/40 focus-visible:ring-destructive/30",
				link: "text-primary underline-offset-4 hover:underline",
				chrome:
					"overflow-hidden border-white/10 bg-gradient-to-b from-white/10 via-primary/55 to-primary/35 text-foreground shadow-[0_16px_42px_rgba(0,0,0,0.55)] hover:brightness-110 active:translate-y-[1px]",
				"chrome-outline":
					"overflow-hidden border-white/12 bg-gradient-to-b from-white/8 to-white/4 text-foreground shadow-[0_14px_40px_rgba(0,0,0,0.5)] backdrop-blur hover:bg-white/10 active:translate-y-[1px]",
			},
			size: {
				default:
					"h-9 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
				xs: "h-7 gap-1.5 px-3 text-xs has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-2 px-3.5 text-sm has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-11 gap-2.5 px-5 text-sm has-data-[icon=inline-end]:pr-4.5 has-data-[icon=inline-start]:pl-4.5",
				icon: "size-8",
				"icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8",
				"icon-lg": "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	children,
	...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
	const withChromeBorder =
		variant === "default" ||
		variant === "outline" ||
		variant === "chrome" ||
		variant === "chrome-outline";

	return (
		<ButtonPrimitive
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		>
			{withChromeBorder && (
				<ShineBorder
					borderWidth={1}
					duration={12}
					shineColor={[
						"rgba(99,102,241,0.0)",
						"rgba(99,102,241,0.35)",
						"rgba(168,85,247,0.25)",
						"rgba(99,102,241,0.0)",
					]}
				/>
			)}
			{children}
		</ButtonPrimitive>
	);
}

export { Button, buttonVariants };
