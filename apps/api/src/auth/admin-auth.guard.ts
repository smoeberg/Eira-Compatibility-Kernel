import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { apiBffOnly, verifyServiceAuth, ADMIN_ROUTE_IDENTITIES } from "@eck/service-auth";
import type { Request } from "express";
import { AdminApiKeyGuard } from "./admin-api-key.guard";
import { ServiceTokenGuard } from "./service-token.guard";

/**
 * Prod: Bearer service token from BFF only (X-ECK-Service-Id: bff).
 * Dev: legacy X-Admin-Api-Key when ECK_API_BFF_ONLY is not set.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);
  private readonly apiKeyGuard = new AdminApiKeyGuard();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (ServiceTokenGuard.matches(request)) {
      const result = verifyServiceAuth(request, ADMIN_ROUTE_IDENTITIES);
      if (!result.ok) {
        throw new UnauthorizedException(
          result.reason ?? "Admin API requires BFF service identity",
        );
      }
      if (result.serviceId) {
        request.eckServiceId = result.serviceId;
      }
      return true;
    }

    if (apiBffOnly()) {
      throw new UnauthorizedException(
        "Admin API is BFF-only — browser cannot call api.eck directly",
      );
    }

    try {
      return this.apiKeyGuard.canActivate(context);
    } catch {
      const hasServiceEnv = Boolean(process.env.ECK_SERVICE_TOKEN);
      const hasKeyEnv = Boolean(process.env.ADMIN_API_KEY);

      if (!hasServiceEnv && !hasKeyEnv) {
        this.logger.warn(
          "Neither ECK_SERVICE_TOKEN nor ADMIN_API_KEY set — admin API open (dev only)",
        );
        return true;
      }

      throw new UnauthorizedException(
        "Invalid credentials — require BFF service token or X-Admin-Api-Key (dev)",
      );
    }
  }
}
