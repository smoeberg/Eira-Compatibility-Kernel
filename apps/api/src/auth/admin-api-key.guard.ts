import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(AdminApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
      this.logger.warn("ADMIN_API_KEY not set — admin API is open (dev only)");
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.header("x-admin-api-key");

    if (!provided || provided !== expected) {
      throw new UnauthorizedException("Invalid or missing X-Admin-Api-Key");
    }

    return true;
  }
}
