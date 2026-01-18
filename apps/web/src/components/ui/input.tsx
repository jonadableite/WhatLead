"use client";

import * as React from "react";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		const radius = 100;
		const [visible, setVisible] = React.useState(false);

		const mouseX = useMotionValue(0);
		const mouseY = useMotionValue(0);

		function handleMouseMove({
			currentTarget,
			clientX,
			clientY,
		}: React.MouseEvent<HTMLDivElement>) {
			const { left, top } = currentTarget.getBoundingClientRect();
			mouseX.set(clientX - left);
			mouseY.set(clientY - top);
		}

		return (
			<motion.div
				style={{
					background: useMotionTemplate`
            radial-gradient(
              ${visible ? `${radius}px` : "0px"} circle at ${mouseX}px ${mouseY}px,
              hsl(var(--ring)),
              transparent 80%
            )
          `,
				}}
				onMouseMove={handleMouseMove}
				onMouseEnter={() => setVisible(true)}
				onMouseLeave={() => setVisible(false)}
				className="group/input rounded-lg p-[2px] transition duration-300"
			>
				<input
					ref={ref}
					type={type}
					data-slot="input"
					className={cn(
						"shadow-input flex h-10 w-full rounded-md border-none bg-input px-3 py-2 text-sm text-foreground transition duration-300 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
						className,
					)}
					{...props}
				/>
			</motion.div>
		);
	},
);

Input.displayName = "Input";

export { Input };
