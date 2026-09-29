import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import express from "express";
import { AppModule } from "./app.module";
import { ProxyService } from "./proxy/proxy.service";

async function bootstrap() {
  // Route fingerprint traffic before any body parser. Bodies are streamed to
  // the approved upstream and never materialized as application objects.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const proxy = app.get(ProxyService);
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!proxy.isProxyRequest(req.hostname)) return next();
    void proxy.handle(req, res).catch(() => {
      if (!res.headersSent) res.status(502).json({ message: "Proxy unavailable" });
      else res.destroy();
    });
  });
  app.use(express.json({ limit: "1mb" }));
  await app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0");
}

void bootstrap();
