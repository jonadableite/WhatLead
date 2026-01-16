import { env } from "@WhatLead/env/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { logSlowQuery, createChildLogger } from "@WhatLead/logger";

import { PrismaClient } from "../prisma/generated/client.js";

const adapter = new PrismaPg({
	connectionString: env.DATABASE_URL,
});

// Create database logger
const dbLogger = createChildLogger({ component: "database" });

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
prisma.$on("query", (e) => {
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

prisma.$on("info", (e) => {
  dbLogger.info({ message: e.message, target: e.target }, "Prisma info");
});

prisma.$on("warn", (e) => {
  dbLogger.warn({ message: e.message, target: e.target }, "Prisma warning");
});

prisma.$on("error", (e) => {
  dbLogger.error({
    message: e.message,
    target: e.target,
  }, "Prisma error");
});

export default prisma;
