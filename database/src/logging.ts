import { pino, Logger, LoggerOptions } from "pino";

// https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
const PinoLevelToSeverityLookup: Record<string, string> = {
  trace: "DEBUG",
  debug: "DEBUG",
  info: "INFO",
  http: "INFO",
  query: "DEBUG",
  warn: "WARNING",
  error: "ERROR",
  fatal: "CRITICAL",
};

const defaultPinoConf: LoggerOptions = {
  messageKey: "message",
  formatters: {
    level(label, number) {
      return {
        severity: PinoLevelToSeverityLookup[label] || PinoLevelToSeverityLookup.info,
        level: number,
      };
    },
  },
};

export function createLogger(options?: LoggerOptions): Logger {
  return pino({ ...defaultPinoConf, ...options });
}
