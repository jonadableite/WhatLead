import type { TenantMe } from "./types";
import { useApiSWR } from "./swr";

export const useTenantMe = () => {
	return useApiSWR<TenantMe>("/api/tenants/me");
};

