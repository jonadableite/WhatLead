export const verifyTurnstile = async (params: {
	secretKey: string;
	token: string;
	remoteIp?: string;
}): Promise<boolean> => {
	const body = new URLSearchParams();
	body.set("secret", params.secretKey);
	body.set("response", params.token);
	if (params.remoteIp) {
		body.set("remoteip", params.remoteIp);
	}

	const response = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded" },
			body,
		},
	);

	if (!response.ok) {
		return false;
	}

	const json = (await response.json()) as { success?: unknown };
	return json.success === true;
};

