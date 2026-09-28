import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import {
  getServiceTokens,
  matchesServiceToken,
} from "./service-secrets";

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const tokens = getServiceTokens();
    if (tokens.length === 0) {
      return false;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!matchesServiceToken(request)) {
      throw new UnauthorizedException("Invalid or missing service token");
    }

    return true;
  }

  /** True when guard would accept without throwing (for composite). */
  static matches(request: Request): boolean {
    return matchesServiceToken(request);
  }
}
