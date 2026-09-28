import { Injectable, Logger } from "@nestjs/common";
import type { Request, Response } from "express";
import { Readable } from "node:stream";
import { OnboardingService } from "../onboarding/onboarding.service";
import { FingerprintService } from "../fingerprint/fingerprint.service";

const HOP_HEADERS = new Set(["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host", "content-length", "x-forwarded-host", "x-forwarded-for", "x-forwarded-proto"]);

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  constructor(private readonly onboarding: OnboardingService, private readonly fingerprint: FingerprintService) {}

  isProxyRequest(hostname: string): boolean {
    const domain = process.env.ECK_FP_DOMAIN?.toLowerCase();
    return Boolean(domain && hostname.toLowerCase().endsWith(`.${domain}`));
  }

  async handle(req: Request, res: Response): Promise<void> {
    const host = req.hostname.toLowerCase();
    const setup = await this.onboarding.findForHost(host);
    if (!setup || ["draft", "ready", "unsupported"].includes(setup.status)) {
      res.status(404).json({ message: "Unknown or inactive integration" });
      return;
    }
    // URL() accepts //other-host as an authority override. Only origin-relative
    // paths may be forwarded. Do not put the rejected URL into logs.
    const path = req.url;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
      res.status(400).json({ message: "Invalid path" });
      return;
    }
    const target = new URL(path, `${setup.upstreamUrl}/`);
    if (target.origin !== setup.upstreamUrl) {
      res.status(400).json({ message: "Invalid upstream" });
      return;
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (HOP_HEADERS.has(key.toLowerCase()) || value === undefined) continue;
      headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
    let upstream: globalThis.Response;
    try {
      upstream = await fetch(target, {
        method: req.method, headers, redirect: "manual", signal: AbortSignal.timeout(30_000),
        body: ["GET", "HEAD"].includes(req.method) ? undefined : Readable.toWeb(req) as ReadableStream,
        duplex: "half",
      } as RequestInit & { duplex: "half" });
    } catch {
      // No URL, headers, body or token is logged on failure.
      this.logger.warn(`Upstream unavailable for integration ${setup.id}`);
      res.status(502).json({ message: "Upstream unavailable" });
      return;
    }
    try {
      const observation = await this.onboarding.observeHost(host, upstream.status);
      if (observation?.record) {
        await this.fingerprint.ingest({ tenantId: setup.tenantId, integrationId: setup.id,
          method: req.method, path: path.split("?")[0] ?? "/", responseStatus: upstream.status });
      }
    } catch {
      this.logger.warn(`Observation failed for integration ${setup.id}`);
    }
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (!HOP_HEADERS.has(key.toLowerCase())) res.setHeader(key, value);
    });
    if (upstream.body) {
      Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
    } else res.end();
  }
}
