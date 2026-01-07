import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import UsersManagement from "./users-management";

export default async function AdminUsersPage() {
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

	return <UsersManagement />;
}
