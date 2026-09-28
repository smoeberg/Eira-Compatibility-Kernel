import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import {
  apiBffOnly,
  INTERNAL_ROUTE_IDENTITIES,
  verifyServiceAuth,
} from "@eck/service-auth";
import type { Request } from "express";
import { InternalApiKeyGuard } from "./internal-api-key.guard";
import { ServiceTokenGuard } from "./service-token.guard";

/**
 * S2S auth for internal routes — Bearer + X-ECK-Service-Id.
 * Legacy X-Internal-Api-Key accepted in dev when service token not used.
 */
@Injectable()
export class InternalServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(InternalServiceAuthGuard.name);
  private readonly legacyGuard = new InternalApiKeyGuard();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (ServiceTokenGuard.matches(request)) {
      const result = verifyServiceAuth(request, INTERNAL_ROUTE_IDENTITIES);
      if (!result.ok) {
        throw new UnauthorizedException(
          result.reason ?? "Invalid internal service identity",
        );
      }
      if (result.serviceId) {
        request.eckServiceId = result.serviceId;
      }
      return true;
    }

    if (apiBffOnly()) {
      throw new UnauthorizedException(
        "Internal routes require service token — ECK_API_BFF_ONLY=true",
      );
    }

    try {
      return this.legacyGuard.canActivate(context);
    } catch {
      const hasToken = Boolean(process.env.ECK_SERVICE_TOKEN);
      const hasKey = Boolean(process.env.INTERNAL_API_KEY);
      if (!hasToken && !hasKey) {
        this.logger.warn("Internal routes open — dev only");
        return true;
      }
      throw new UnauthorizedException(
        "Invalid internal credentials — require service token + X-ECK-Service-Id or X-Internal-Api-Key",
      );
    }
  }
}
