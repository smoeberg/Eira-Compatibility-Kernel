import type { NextFunction, Request, Response } from "express";
import type { EckLogger } from "./logger";
import { recordHttpRequest } from "./metrics";

export function createRequestLoggingMiddleware(
  logger: EckLogger,
  service: string,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const correlationId = (req as Request & { correlationId?: string }).correlationId ?? req.header("x-request-id");
    const serviceId =
      (req as Request & { eckServiceId?: string }).eckServiceId ??
      req.header("x-eck-service-id") ??
      undefined;

    res.on("finish", () => {
      const durationMs = Date.now() - start;
      const rawPath = req.originalUrl ?? req.url ?? "/";
      // No raw path or query is allowed in logs or metric labels.
      const path = rawPath.startsWith("/health") ? "/health" :
        rawPath.startsWith("/ready") ? "/ready" :
        rawPath.startsWith("/metrics") ? "/metrics" :
        rawPath.startsWith("/auth/") ? "/auth" :
        rawPath.startsWith("/api/") ? "/api" : "/proxy";
      const skip =
        path === "/health" ||
        path === "/ready" ||
        path === "/metrics" ||
        path.startsWith("/health?");

      recordHttpRequest({
        service,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs,
      });

      if (skip) return;

      const level = res.statusCode >= 500 ? "error" : "info";
      logger[level]("http_request", {
        correlationId,
        serviceId,
        method: req.method,
        path,
        statusCode: res.statusCode,
        durationMs,
      });
    });

    next();
  };
}
