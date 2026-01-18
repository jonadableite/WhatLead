"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Label = React.forwardRef<
	HTMLLabelElement,
	React.ComponentPropsWithoutRef<"label">
>(({ className, ...props }, ref) => (
	<label
		ref={ref}
		data-slot="label"
		className={cn(
			"text-sm font-medium text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
			className,
		)}
		{...props}
	/>
));

export { Label };
