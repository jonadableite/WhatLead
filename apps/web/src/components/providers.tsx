"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";

import { queryClient } from "@/utils/trpc";
import { installTurnstileAuthFetchShim } from "@/lib/bot-challenge";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		installTurnstileAuthFetchShim();
	}, []);

	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<QueryClientProvider client={queryClient}>
				{children}
				<ReactQueryDevtools />
			</QueryClientProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
