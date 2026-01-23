import { RequireAdmin } from "@/components/auth/require-session";

import UsersManagement from "./users-management";

export default function AdminUsersPage() {
	return (
		<RequireAdmin>
			<UsersManagement />
		</RequireAdmin>
	);
}
