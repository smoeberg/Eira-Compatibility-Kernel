import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { sql } from "drizzle-orm";
import { renderPrometheusMetrics } from "@eck/observability";
import { getDb } from "./db/index";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { status: "ok", service: "eck-api" };
  }

  @Get("ready")
  async ready() {
    const db = getDb();
    if (!db) {
      return { status: "degraded", service: "eck-api", checks: { db: false } };
    }
    try {
      await db.execute(sql`select 1`);
      return { status: "ok", service: "eck-api", checks: { db: true } };
    } catch {
      return { status: "degraded", service: "eck-api", checks: { db: false } };
    }
  }

  @Get("metrics")
  metrics(@Res({ passthrough: false }) res: Response) {
    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(renderPrometheusMetrics("eck-api"));
  }
}
