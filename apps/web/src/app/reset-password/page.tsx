"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import ResetPasswordForm from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-[#1B1B1F] p-4">
			<Suspense
				fallback={
					<div className="flex items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-[#1e1b4a]" />
					</div>
				}
			>
				<ResetPasswordForm />
			</Suspense>
		</div>
	);
}
