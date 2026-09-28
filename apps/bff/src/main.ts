import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { createLogger, createRequestLoggingMiddleware } from "@eck/observability";
import { NestFactory } from "@nestjs/core";
import type { NextFunction, Request, Response } from "express";
import session from "express-session";
import { AppModule } from "./app.module";
import { bffConfig } from "./config/bff.config";

const log = createLogger("eck-bff");

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: ["error", "warn"],
  });
  const cfg = bffConfig();

  if (cfg.trustProxy) {
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const id = req.header("x-request-id") ?? randomUUID();
    req.correlationId = id;
    res.setHeader("X-Request-Id", id);
    next();
  });

  app.use(createRequestLoggingMiddleware(log, "eck-bff"));

  app.use(
    session({
      name: "eck_session",
      secret: cfg.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    }),
  );

  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://eck.localhost",
      "https://eck.eira-systems.eu",
    ],
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  log.info("service_started", { port });
}

bootstrap().catch((err) => {
  log.error("service_start_failed", { err });
  process.exit(1);
});
