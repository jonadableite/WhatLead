import { env } from "@WhatLead/env/web";

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly payload?: unknown,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export const apiFetch = async <T>(
	path: string,
	init: RequestInit = {},
): Promise<T> => {
	const url = path.startsWith("http")
		? path
		: `${env.NEXT_PUBLIC_SERVER_URL}${path.startsWith("/") ? "" : "/"}${path}`;

	const res = await fetch(url, {
		...init,
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
	});

	const contentType = res.headers.get("content-type") ?? "";
	const payload =
		contentType.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => "");

	if (!res.ok) {
		const message =
			typeof payload === "object" && payload && "message" in payload
				? String((payload as any).message)
				: typeof payload === "string" && payload
					? payload
					: `Request failed (${res.status})`;
		throw new ApiError(message, res.status, payload);
	}

	return payload as T;
};

