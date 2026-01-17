import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	client: {
		NEXT_PUBLIC_SERVER_URL: z.url(),
		NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
	},
	runtimeEnv: {
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
		NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
	},
	emptyStringAsUndefined: true,
});
