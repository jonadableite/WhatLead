import pino from "pino";

// =============================================================================
// UNIVERSAL UUID GENERATION (Browser + Node.js compatible)
// =============================================================================

/**
 * Generate a UUID that works in both browser and Node.js environments
 */
function universalRandomUUID(): string {
  // Browser: Use Web Crypto API
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // Node.js: Use node:crypto
  if (typeof process !== "undefined" && process.versions?.node) {
    try {
      const { randomUUID } = require("node:crypto");
      return randomUUID();
    } catch {
      // Fallback if crypto module fails
    }
  }

  // Fallback: Generate UUID v4 manually
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

// Lazy import server env to avoid client-side errors
// This allows the logger to be imported on client-side for generateTraceId
let serverEnv: { NODE_ENV?: string } | null = null;

function getServerEnv() {
  // Only try to import server env if we're in Node.js runtime
  // Check for Node.js environment indicators
  const isNode = typeof process !== "undefined" &&
                 typeof process.versions !== "undefined" &&
                 typeof process.versions.node !== "undefined";

  if (isNode && !serverEnv) {
    try {
      // Use require for dynamic import (works in both CJS and ESM contexts)
      const envModule = require("@WhatLead/env/server");
      serverEnv = envModule.env;
    } catch {
      // Fallback: env not available (client-side bundle or import error)
      // Use process.env directly as fallback
      serverEnv = {
        NODE_ENV: typeof process !== "undefined" ? (process.env.NODE_ENV || "development") : "development"
      };
    }
  } else if (!isNode && !serverEnv) {
    // Client-side: return minimal env object
    serverEnv = { NODE_ENV: "development" };
  }

  return serverEnv;
}

// =============================================================================
// LOGGER ICONS & EVENTS
// =============================================================================

/**
 * Predefined icons for different log types and events
 */
export const LOG_ICONS = {
  // System events
  server_start: "🚀",
  server_shutdown: "🛑",
  server_error: "💥",

  // HTTP events
  request: "🌐",
  response: "📤",
  request_success: "✅",
  request_error: "❌",

  // Authentication events
  user_login: "🔐",
  user_logout: "🔓",
  user_register: "🎉",
  user_verify: "✅",
  auth_error: "🚫",

  // Business events
  campaign_create: "📢",
  message_send: "📤",
  payment_process: "💳",

  // Database events
  db_query: "🗄️",
  db_slow_query: "🐌",
  db_error: "💥",

  // Performance events
  performance: "⏱️",
  slow_operation: "🐌",

  // Error events
  error: "💥",
  warning: "⚠️",

  // Default icons by log level
  trace: "📋",
  debug: "🐛",
  info: "ℹ️",
  warn: "⚠️",
  fatal: "🚨",
} as const;

/**
 * Get appropriate icon for log event
 */
export function getLogIcon(event?: string, level?: string): string {
  if (event && event in LOG_ICONS) {
    return LOG_ICONS[event as keyof typeof LOG_ICONS];
  }

  if (level && level in LOG_ICONS) {
    return LOG_ICONS[level as keyof typeof LOG_ICONS];
  }

  return LOG_ICONS.info;
}

// =============================================================================
// LOGGER CONFIGURATION
// =============================================================================

/**
 * Generate a unique trace ID for request correlation
 * Works in both browser and Node.js environments
 */
export function generateTraceId(): string {
  return universalRandomUUID();
}

/**
 * Logger configuration for development environment
 * Using structured fields and Pino-Pretty native options for beautiful, serializable logs
 */
const devConfig = {
  level: "debug" as const,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
      singleLine: false,
      hideObject: false,
      // Include structured fields for beautiful display
      include: "time,level,icon,event,msg,traceId,userId,duration,statusCode,responseTime",
      // Custom colors for different field types
      customColors: {
        "time": "gray",
        "level": "bold",
        "icon": "cyan.bold",
        "event": "yellow.bold",
        "traceId": "blue",
        "userId": "green",
        "duration": "magenta",
        "statusCode": "white.bold",
        "responseTime": "cyan",
        "reqId": "blue.dim",
        "req": "blue.dim",
        "res": "green.dim",
        "err": "red.bold",
      },
    },
  },
};

/**
 * Logger configuration for production environment
 */
const prodConfig = {
  level: "info" as const,
  formatters: {
    level(label: string) {
      return { level: label };
    },
    log(obj: any) {
      // Add timestamp if not present
      if (!obj.time) {
        obj.time = new Date().toISOString();
      }

      // Add service name
      obj.service = "WhatLead";

      // Add environment
      const env = getServerEnv();
      obj.environment = env?.NODE_ENV || process.env.NODE_ENV || "development";

      // Sanitize sensitive data
      if (obj.err) {
        obj.err = sanitizeError(obj.err);
      }

      return obj;
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

/**
 * Sanitize error objects to remove sensitive information
 */
function sanitizeError(error: any) {
  if (!error) return error;

  const sanitized = { ...error };

  // Remove sensitive fields from error
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  delete sanitized.key;

  // Ensure stack trace is included for debugging
  if (error.stack && !sanitized.stack) {
    sanitized.stack = error.stack;
  }

  return sanitized;
}

/**
 * Get logger configuration based on environment
 * Lazy-loaded to avoid accessing server env on client-side
 */
function getLoggerConfig() {
  const env = getServerEnv();
  const nodeEnv = env?.NODE_ENV || process.env.NODE_ENV || "development";
  return {
    config: nodeEnv === "production" ? prodConfig : devConfig,
    stream: nodeEnv === "production" ? undefined : undefined,
  };
}

/**
 * Create the main logger instance (lazy-loaded)
 * Only accesses server env when actually used on server-side
 */
let loggerInstance: pino.Logger | null = null;

function getLogger(): pino.Logger {
  if (!loggerInstance) {
    const { config, stream } = getLoggerConfig();
    loggerInstance = pino(config, stream);
  }
  return loggerInstance;
}

/**
 * Lazy-loaded logger instance
 * Uses Proxy to defer initialization until first access
 * This prevents server env access during module evaluation on client-side
 */
export const logger = new Proxy({} as pino.Logger, {
  get(_target, prop) {
    // Only initialize logger when actually accessed
    // This allows generateTraceId and other exports to work without triggering logger init
    try {
      return getLogger()[prop as keyof pino.Logger];
    } catch (error) {
      // If logger initialization fails (e.g., on client-side), return a no-op function
      if (typeof prop === "string" && ["info", "warn", "error", "debug", "trace", "fatal"].includes(prop)) {
        return () => {}; // Return no-op for log methods
      }
      throw error;
    }
  },
});

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Create a logger for HTTP requests with traceId
 */
export function createRequestLogger(traceId?: string) {
  const context: any = {
    traceId: traceId || generateTraceId(),
  };

  return logger.child(context);
}

/**
 * Create a logger for business events with structured icon
 */
export function createBusinessLogger(event: string, context?: Record<string, any>) {
  return logger.child({
    event,
    icon: getLogIcon(event),
    ...context,
  });
}

/**
 * Log business events with structured data and beautiful icons
 */
export const businessLogger = {
  userRegistered: (userId: string, email: string, context?: Record<string, any>) =>
    createBusinessLogger("user_register", { userId, email, ...context }).info("User registered successfully"),

  userLoggedIn: (userId: string, context?: Record<string, any>) =>
    createBusinessLogger("user_login", { userId, ...context }).info("User logged in successfully"),

  userVerified: (userId: string, context?: Record<string, any>) =>
    createBusinessLogger("user_verify", { userId, ...context }).info("User email verified"),

  campaignCreated: (campaignId: string, userId: string, name: string, context?: Record<string, any>) =>
    createBusinessLogger("campaign_create", { campaignId, userId, name, ...context }).info("Campaign created successfully"),

  messageSent: (messageId: string, campaignId: string, recipient: string, context?: Record<string, any>) =>
    createBusinessLogger("message_send", { messageId, campaignId, recipient, ...context }).info("Message sent successfully"),

  paymentProcessed: (paymentId: string, userId: string, amount: number, currency: string, context?: Record<string, any>) =>
    createBusinessLogger("payment_process", { paymentId, userId, amount, currency, ...context }).info("Payment processed successfully"),

  error: (error: Error, context?: Record<string, any>) =>
    createBusinessLogger("error", { ...context }).error({ err: error }, `Error: ${error.message}`),

  userAction: (action: string, context?: Record<string, any>) =>
    createBusinessLogger(`user_action_${action}`, { action, ...context }).info(`User performed: ${action}`),
};

/**
 * Log slow database queries with beautiful formatting
 */
export function logSlowQuery(query: string, duration: number, context?: Record<string, any>) {
  createBusinessLogger("db_slow_query", {
    query: query.substring(0, 500), // Truncate long queries
    duration,
    ...context,
  }).warn(`🐌 Slow database query detected (${duration}ms)`);
}

/**
 * Performance monitoring logger with beautiful timing display
 */
export const perfLogger = {
  startTimer: (operation: string, context?: Record<string, any>) => {
    const startTime = Date.now();
    const childLogger = createChildLogger({
      operation,
      icon: getLogIcon("performance"),
      ...context
    });

    return {
      end: (additionalContext?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        childLogger.info({
          duration,
          performance: true,
          ...additionalContext
        }, `⏱️ Operation completed in ${duration}ms`);

        // Log as slow if it takes more than 1000ms
        if (duration > 1000) {
          createBusinessLogger("slow_operation", {
            operation,
            duration,
            ...context,
            ...additionalContext
          }).warn(`🐌 Slow operation detected: ${operation} (${duration}ms)`);
        }

        return duration;
      },
      fail: (error: Error, additionalContext?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        childLogger.error({
          err: error,
          duration,
          failed: true,
          ...additionalContext
        }, `💥 Operation failed after ${duration}ms: ${operation}`);
        return duration;
      },
    };
  },
};

// Export types for TypeScript
export type { Logger } from "pino";
