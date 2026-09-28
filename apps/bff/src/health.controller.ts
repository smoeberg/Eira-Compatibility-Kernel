import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { renderPrometheusMetrics } from "@eck/observability";
import { bffConfig } from "./config/bff.config";

@Controller()
export class HealthController {
  @Get("health")
  health() {
    return { status: "ok", service: "eck-bff" };
  }

  @Get("ready")
  async ready() {
    const cfg = bffConfig();
    try {
      const res = await fetch(`${cfg.upstream}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      const ok = res.ok;
      return {
        status: ok ? "ok" : "degraded",
        service: "eck-bff",
        checks: { upstream: ok },
      };
    } catch {
      return {
        status: "degraded",
        service: "eck-bff",
        checks: { upstream: false },
      };
    }
  }

  @Get("metrics")
  metrics(@Res({ passthrough: false }) res: Response) {
    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.send(renderPrometheusMetrics("eck-bff"));
  }
}
