import useSWR, { type SWRConfiguration } from "swr";
import { apiFetch } from "./api-fetch";

export const useApiSWR = <T>(
	path: string | null,
	config?: SWRConfiguration,
) => {
	return useSWR<T>(path, (p: string) => apiFetch<T>(p), config);
};

