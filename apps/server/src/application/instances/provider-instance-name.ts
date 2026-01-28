import type { Instance } from "../../domain/entities/instance";

const PROVIDER_NAME_REGEX = /^[A-Za-z0-9_-]+$/;

export const getProviderInstanceName = (instance: Instance): string => {
	const candidate = instance.displayName.trim();
	if (candidate && PROVIDER_NAME_REGEX.test(candidate)) {
		return candidate;
	}
	return instance.id;
};
