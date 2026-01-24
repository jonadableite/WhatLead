import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.url(),
		CORS_ORIGIN: z.url(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
		PORT: z.string().regex(/^\d+$/).default("3000"),
		GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
		TURBOZAP_BASE_URL: z.string().min(1).default("http://localhost:3001"),
		TURBOZAP_API_KEY: z.string().min(1).default("dev"),
		TURBOZAP_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
		REDIS_URL: z.string().default("redis://localhost:6379"),
		EXECUTION_QUEUE_ENABLED: z
			.string()
			.default("false")
			.transform((value) => value === "true"),
		REPUTATION_SIGNAL_REPOSITORY: z
			.enum(["memory", "prisma"])
			.default("memory"),
		REPUTATION_SIGNAL_RETENTION_DAYS: z.coerce.number().int().positive().default(7),
		WARMUP_TARGETS: z
			.string()
			.optional()
			.transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [])),
		SMTP_HOST: z.string().nonempty(),
		SMTP_PORT: z.string().regex(/^\d+$/).transform(Number),
		SMTP_USERNAME: z.string().nonempty(),
		SMTP_PASSWORD: z.string().nonempty(),
		SMTP_SENDER_EMAIL: z.string().nonempty(),
		SMTP_AUTH_DISABLED: z
			.string()
			.default("false")
			.transform((v) => v === "true"),
		S3_ENABLED: z
			.string()
			.default("false")
			.transform((v) => v === "true"),
		S3_ACCESS_KEY: z.string().optional(),
		S3_SECRET_KEY: z.string().optional(),
		S3_BUCKET: z.string().optional(),
		S3_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
		S3_ENDPOINT: z.string().optional(),
		S3_USE_SSL: z
			.string()
			.default("true")
			.transform((v) => v === "true"),
		S3_REGION: z.string().optional(),
		BOT_FIGHT_MODE: z
			.enum(["OFF", "STANDARD", "SUPERCOMBAT"])
			.default("SUPERCOMBAT"),
		TURNSTILE_SECRET_KEY: z.string().optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
