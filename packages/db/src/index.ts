import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@WhatLead/env/server";
import { createChildLogger, logSlowQuery } from "@WhatLead/logger";

import { Prisma, PrismaClient } from "../prisma/generated/client.js";

// Create database logger
const dbLogger = createChildLogger({ component: "database" });

const adapter = new PrismaPg({
	connectionString: env.DATABASE_URL,
});

// Prisma client with logging and performance monitoring
const prisma = new PrismaClient({
	adapter,
  log: [
    { level: "query", emit: "event" },
    { level: "info", emit: "event" },
    { level: "warn", emit: "event" },
    { level: "error", emit: "event" },
  ],
});

// Log Prisma events
prisma.$on("query", (e: Prisma.QueryEvent) => {
  const duration = e.duration;
  const query = e.query;

  // Log slow queries (queries taking more than 100ms)
  if (duration > 100) {
    logSlowQuery(query, duration, {
      params: e.params,
      target: e.target,
    });
  } else if (env.NODE_ENV === "development") {
    dbLogger.debug({
      query: query.substring(0, 200), // Truncate long queries in dev
      duration,
      params: e.params,
    }, "Database query executed");
  }
});

prisma.$on("info", (e: Prisma.LogEvent) => {
  dbLogger.info({ message: e.message, target: e.target }, "Prisma info");
});

prisma.$on("warn", (e: Prisma.LogEvent) => {
  dbLogger.warn({ message: e.message, target: e.target }, "Prisma warning");
});

prisma.$on("error", (e: Prisma.LogEvent) => {
  dbLogger.error({
    message: e.message,
    target: e.target,
  }, "Prisma error");
});

export default prisma;
