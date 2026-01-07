import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import AdminDashboard from "./admin-dashboard";

export default async function AdminPage() {
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers(),
		},
	});

	if (!session?.user) {
		redirect("/login");
	}

	// Verificar se é admin
	if (session.user.role !== "admin") {
		redirect("/dashboard");
	}

	return <AdminDashboard user={session.user} />;
}
