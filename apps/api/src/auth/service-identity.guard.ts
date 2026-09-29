import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { verifyServiceAuth, INTERNAL_ROUTE_IDENTITIES } from "@eck/service-auth";
import type { Request } from "express";
@Injectable() export class ServiceIdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const result = verifyServiceAuth(req, INTERNAL_ROUTE_IDENTITIES);
    if (!result.ok) throw new UnauthorizedException(result.reason);
    req.eckServiceId = result.serviceId;
    return true;
  }
}
