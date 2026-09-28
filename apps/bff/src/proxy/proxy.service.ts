import { randomUUID } from "node:crypto";
import {
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { buildServiceAuthHeaders } from "@eck/service-auth";
import { getActiveSigningSecret, signOutboundRequest } from "@eck/bff-core";
import { bffConfig } from "../config/bff.config";
import { OidcService } from "../auth/oidc.service";

@Injectable()
export class ProxyService {
  constructor(private readonly oidc: OidcService) {}

  async forward(request: Request, response: Response): Promise<void> {
    const cfg = bffConfig();
    if (!cfg.serviceToken) {
      throw new ServiceUnavailableException("ECK_SERVICE_TOKEN not configured");
    }

    const path = request.originalUrl ?? request.url;
    const target = `${cfg.upstream}${path}`;
    const body =
      request.rawBody && request.rawBody.length > 0
        ? request.rawBody.toString("utf8")
        : "";

    const correlationId =
      request.correlationId ??
      request.header("x-request-id") ??
      randomUUID();

    const serviceAuth = buildServiceAuthHeaders("bff", cfg.serviceToken);
    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: serviceAuth.Authorization,
      "X-ECK-Service-Id": serviceAuth["X-ECK-Service-Id"],
      "X-Request-Id": correlationId,
    };

    let userSub = "";
    if (this.oidc.isEnabled()) {
      const user = this.oidc.requireSessionUser(request);
      userSub = user.sub;
      headers["X-User-Sub"] = user.sub;
      if (user.email) headers["X-User-Email"] = user.email;
      if (user.accessToken) headers["X-User-Token"] = user.accessToken;
      if (user.roles.length > 0) {
        headers["X-User-Roles"] = user.roles.join(",");
      }
    }

    const signingSecret = getActiveSigningSecret();
    if (signingSecret) {
      const pathOnly = path.split("?")[0] ?? path;
      const sig = signOutboundRequest(
        signingSecret,
        request.method,
        pathOnly,
        body,
        userSub,
      );
      headers["X-ECK-Timestamp"] = sig["X-ECK-Timestamp"];
      headers["X-ECK-Signature"] = sig["X-ECK-Signature"];
    }

    const contentType = request.header("content-type");
    if (body && contentType) {
      headers["Content-Type"] = contentType;
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body:
        body && !["GET", "HEAD"].includes(request.method) ? body : undefined,
    });

    response.setHeader("X-Request-Id", correlationId);
    response.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      response.setHeader(key, value);
    });

    const text = await upstream.text();
    response.send(text);
  }
}
