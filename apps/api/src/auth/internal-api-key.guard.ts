import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
@Injectable() export class InternalApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected) throw new UnauthorizedException("Internal API key not configured");
    const req = context.switchToHttp().getRequest<Request>();
    if (req.header("x-internal-api-key") !== expected) throw new UnauthorizedException("Invalid internal key");
    return true;
  }
}
