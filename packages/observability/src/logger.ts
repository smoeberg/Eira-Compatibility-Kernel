export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  correlationId?: string;
  serviceId?: string;
  userSub?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  err?: unknown;
  [key: string]: unknown;
}

export interface EckLogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

function serializeError(err: unknown): Record<string, unknown> | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

export function createLogger(service: string): EckLogger {
  function write(level: LogLevel, message: string, context: LogContext = {}) {
    const { err, ...rest } = context;
    const entry = {
      ts: new Date().toISOString(),
      level,
      service,
      msg: message,
      ...rest,
      ...(err !== undefined ? { error: serializeError(err) } : {}),
    };
    const line = JSON.stringify(entry);
    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  return {
    debug: (message, context) => write("debug", message, context),
    info: (message, context) => write("info", message, context),
    warn: (message, context) => write("warn", message, context),
    error: (message, context) => write("error", message, context),
  };
}
