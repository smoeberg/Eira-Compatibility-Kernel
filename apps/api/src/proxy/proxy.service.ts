import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import { extractSlugFromHost, isFingerprintProxyHost } from "../config/eck.config";
import { FingerprintRunService } from "../fingerprint/fingerprint-run.service";
import { FingerprintService } from "../fingerprint/fingerprint.service";
import { TenantService } from "../tenants/tenant.service";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly fingerprintService: FingerprintService,
    private readonly runService: FingerprintRunService,
  ) {}

  isProxyRequest(hostname: string): boolean {
    return isFingerprintProxyHost(hostname);
  }

  async handle(req: Request, res: Response): Promise<void> {
    const slug = extractSlugFromHost(req.hostname);
    if (!slug) {
      res.status(404).json({ message: "Unknown fingerprint host" });
      return;
    }

    let tenant;
    try {
      tenant = await this.tenantService.findBySlug(slug);
    } catch {
      throw new NotFoundException(`Tenant "${slug}" not found`);
    }

    const targetUrl = new URL(req.url, `${tenant.legacyBaseUrl}/`);
    const started = Date.now();

    const forwardHeaders = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (HOP_BY_HOP.has(key.toLowerCase())) continue;
      if (value === undefined) continue;
      forwardHeaders.set(key, Array.isArray(value) ? value.join(", ") : value);
    }

    let body: Buffer | undefined;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await this.readBody(req);
    }

    const payloadHash = body
      ? createHash("sha256").update(body).digest("hex")
      : undefined;

    let upstream: Response;
    try {
      upstream = await fetch(targetUrl, {
        method: req.method,
        headers: forwardHeaders,
        body: body as BodyInit | undefined,
        redirect: "manual",
      });
    } catch (err) {
      this.logger.error(`Upstream failed for ${slug}: ${(err as Error).message}`);
      res.status(502).json({ message: "Legacy upstream unavailable" });
      return;
    }

    const latencyMs = Date.now() - started;
    const activeRun = await this.runService.getActiveRunForTenant(tenant.id);

    if (activeRun) {
      try {
        await this.fingerprintService.ingest({
          tenantId: tenant.id,
          runId: activeRun.id,
          method: req.method,
          path: req.url.split("?")[0] ?? req.url,
          pathRaw: req.url,
          requestHeaders: this.sanitizeHeaders(req.headers),
          responseStatus: upstream.status,
          latencyMs,
          payloadHash,
        });
      } catch (err) {
        this.logger.warn(`Ingest failed: ${(err as Error).message}`);
      }
    }

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (HOP_BY_HOP.has(key.toLowerCase())) return;
      res.setHeader(key, value);
    });

    const responseBody = Buffer.from(await upstream.arrayBuffer());
    res.send(responseBody);
  }

  private async readBody(req: Request): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  private sanitizeHeaders(
    headers: Request["headers"],
  ): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === "authorization") {
        out[key] = typeof value === "string" ? value.split(" ")[0] : "Bearer";
        continue;
      }
      if (key.toLowerCase() === "cookie") continue;
      out[key] = value;
    }
    return out;
  }
}
