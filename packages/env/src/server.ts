import { createEnv } from "@t3-oss/env-core";
import "dotenv/config";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().regex(/^\d+$/).default("3000"),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
    SMTP_HOST: z.string().nonempty(),
    SMTP_PORT: z.string().regex(/^\d+$/).transform(Number),
    SMTP_USERNAME: z.string().nonempty(),
    SMTP_PASSWORD: z.string().nonempty(),
    SMTP_SENDER_EMAIL: z.string().nonempty(),
    SMTP_AUTH_DISABLED: z.string().default('false').transform((v) => v === 'true'),
    S3_ENABLED: z.string().default("false").transform((v) => v === "true"),
    S3_ACCESS_KEY: z.string().optional(),
    S3_SECRET_KEY: z.string().optional(),
    S3_BUCKET: z.string().optional(),
    S3_PORT: z.string().regex(/^\d+$/).transform(Number).optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_USE_SSL: z.string().default("true").transform((v) => v === "true"),
    S3_REGION: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
