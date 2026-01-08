import { generateTraceId } from "@WhatLead/logger";

// Browser-compatible logger for Next.js client-side
class BrowserLogger {
  private context: Record<string, any> = {};

  constructor(initialContext: Record<string, any> = {}) {
    this.context = {
      ...initialContext,
      traceId: generateTraceId(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
      url: typeof window !== "undefined" ? window.location.href : "unknown",
    };
  }

  private formatMessage(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logData = {
      level,
      message,
      timestamp,
      ...this.context,
      ...(data && { data }),
    };

    // In development, use console with colors
    if (process.env.NODE_ENV === "development") {
      const colors = {
        info: "\x1b[36m",   // cyan
        warn: "\x1b[33m",   // yellow
        error: "\x1b[31m",  // red
        debug: "\x1b[35m",  // magenta
        reset: "\x1b[0m",
      };

      const color = colors[level as keyof typeof colors] || colors.reset;
      const emoji = {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        debug: "🐛",
      }[level] || "📝";

      console.log(`${color}${emoji} [${timestamp}] ${message}${colors.reset}`, data || "");
    }

    // Always send to a logging service in production
    if (process.env.NODE_ENV === "production") {
      // Send to logging service (implement based on your logging infrastructure)
      this.sendToLoggingService(logData);
    }

    return logData;
  }

  private sendToLoggingService(logData: any) {
    // Implement your logging service integration here
    // Examples: DataDog, LogRocket, Sentry, etc.
    try {
      // For now, just send to console in a structured way
      console.log(JSON.stringify(logData));
    } catch (error) {
      console.error("Failed to send log to service:", error);
    }
  }

  info(message: string, data?: any) {
    return this.formatMessage("info", message, data);
  }

  warn(message: string, data?: any) {
    return this.formatMessage("warn", message, data);
  }

  error(message: string, error?: Error | any, data?: any) {
    const errorData = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...data,
    } : data;

    return this.formatMessage("error", message, errorData);
  }

  debug(message: string, data?: any) {
    return this.formatMessage("debug", message, data);
  }

  // Create child logger with additional context
  child(additionalContext: Record<string, any>) {
    const childLogger = new BrowserLogger({
      ...this.context,
      ...additionalContext,
    });
    return childLogger;
  }

  // Business event logging
  business(event: string, message: string, data?: any) {
    return this.child({ event, component: "frontend" }).info(message, data);
  }

  // User action logging
  userAction(action: string, data?: any) {
    return this.business("user_action", `User ${action}`, data);
  }

  // Performance logging
  performance(operation: string, duration: number, data?: any) {
    return this.child({ operation, duration, component: "performance" }).info(`Operation completed in ${duration}ms`, data);
  }
}

// Create singleton logger instance
export const logger = new BrowserLogger({
  component: "frontend",
  environment: process.env.NODE_ENV,
});

// Export types
export type { BrowserLogger };