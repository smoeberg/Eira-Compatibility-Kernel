import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import type { Request } from "express";
import { getDb, schema } from "../db";

@Injectable()
export class OnboardingGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.eckUser?.sub || request.eckServiceId !== "bff") {
      throw new UnauthorizedException("Signed BFF user context required");
    }
    const tenantId = request.params.tenantId;
    if (typeof tenantId !== "string") throw new ForbiddenException("Tenant route required");
    const db = getDb();
    if (!db) throw new ServiceUnavailableException("DATABASE_URL required");
    const [membership] = await db.select({ role: schema.tenantMemberships.role })
      .from(schema.tenantMemberships)
      .where(and(eq(schema.tenantMemberships.tenantId, tenantId), eq(schema.tenantMemberships.userSub, request.eckUser.sub)))
      .limit(1);
    if (!membership) throw new ForbiddenException("No access to this tenant");
    if (request.method !== "GET" && membership.role !== "tenant_admin") {
      throw new ForbiddenException("Tenant admin role required");
    }
    return true;
  }
}
