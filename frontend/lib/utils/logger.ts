"use client";

type ErrorLogger = (payload: { message: string; error?: unknown; context?: Record<string, unknown> }) => void;

// Default logger just writes to console; can be swapped via setErrorLogger.
let currentLogger: ErrorLogger = ({ message, error, context }) => {
  console.error(message, { error, context });
};

export function setErrorLogger(logger: ErrorLogger) {
  currentLogger = logger;
}

export function logError(message: string, error?: unknown, context?: Record<string, unknown>) {
  currentLogger({ message, error, context });
}
