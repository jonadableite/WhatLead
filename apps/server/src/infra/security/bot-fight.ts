export type BotFightMode = "OFF" | "STANDARD" | "SUPERCOMBAT";

export const isProbablyAutomation = (userAgent: string | undefined): boolean => {
	if (!userAgent) {
		return true;
	}

	const ua = userAgent.toLowerCase();

	const deny = [
		"gptbot",
		"chatgpt-user",
		"claudebot",
		"ccbot",
		"perplexitybot",
		"google-extended",
		"bytespider",
		"scrapy",
		"python-requests",
		"httpclient",
		"okhttp",
		"wget",
		"curl",
	];

	return deny.some((token) => ua.includes(token));
};

export const isCrossSiteMutationWithoutOrigin = (params: {
	method: string;
	origin?: string;
	referer?: string;
}): boolean => {
	const m = params.method.toUpperCase();
	if (m === "GET" || m === "HEAD" || m === "OPTIONS") {
		return false;
	}
	return !params.origin && !params.referer;
};

export const isUntrustedOrigin = (params: {
	origin?: string;
	referer?: string;
	trustedOrigin: string;
}): boolean => {
	const trusted = params.trustedOrigin;
	if (params.origin) {
		return params.origin !== trusted;
	}
	if (params.referer) {
		try {
			const u = new URL(params.referer);
			return u.origin !== trusted;
		} catch {
			return true;
		}
	}
	return false;
};

