import type { Session } from "../auth-client";
import { useApiSWR } from "./swr";

export const useSessionSWR = () => {
	return useApiSWR<Session | null>("/api/auth/get-session");
};

