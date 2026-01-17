let turnstileToken: string | null = null;
let installed = false;

export const setTurnstileToken = (token: string | null): void => {
	turnstileToken = token;
};

export const installTurnstileAuthFetchShim = (): void => {
	if (installed) {
		return;
	}
	installed = true;

	if (typeof window === "undefined") {
		return;
	}

	const originalFetch = window.fetch.bind(window);

	window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		const url =
			typeof input === "string"
				? input
				: input instanceof Request
					? input.url
					: input instanceof URL
						? input.toString()
						: "";

		if (turnstileToken && url.includes("/api/auth/")) {
			const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
			headers.set("x-turnstile-token", turnstileToken);
			return await originalFetch(input, { ...(init ?? {}), headers });
		}

		return await originalFetch(input, init);
	};
};

