import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { and, eq } from "drizzle-orm";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { BffSignatureGuard } from "../auth/bff-signature.guard";
import { UserContextGuard } from "../auth/user-context.guard";
import { getDb, schema } from "../db";
import { TenantService } from "./tenant.service";
import type { CreateTenantDto } from "./tenant.dto";

@Controller("api/v1/tenants")
@UseGuards(AdminAuthGuard, BffSignatureGuard, UserContextGuard)
export class TenantAdminController {
  constructor(private readonly tenants: TenantService) {}

  private async permitted(request: Request, tenantId: string) {
    if (!request.eckUser?.sub || request.eckServiceId !== "bff") throw new ForbiddenException("Signed BFF user required");
    const db = getDb();
    if (!db) throw new ForbiddenException("Database unavailable");
    const [membership] = await db.select({ role: schema.tenantMemberships.role }).from(schema.tenantMemberships)
      .where(and(eq(schema.tenantMemberships.tenantId, tenantId), eq(schema.tenantMemberships.userSub, request.eckUser.sub)))
      .limit(1);
    if (!membership) throw new ForbiddenException("No tenant access");
  }

  @Get()
  async list(@Req() request: Request) {
    if (!request.eckUser?.sub || request.eckServiceId !== "bff") throw new ForbiddenException("Signed BFF user required");
    const db = getDb();
    if (!db) throw new ForbiddenException("Database unavailable");
    const memberships = await db.select({ tenantId: schema.tenantMemberships.tenantId })
      .from(schema.tenantMemberships).where(eq(schema.tenantMemberships.userSub, request.eckUser.sub));
    const tenants = await Promise.all(memberships.map((m) => this.tenants.findById(m.tenantId)));
    return tenants;
  }

  @Post()
  async create(@Req() request: Request, @Body() body: CreateTenantDto) {
    if (request.eckServiceId !== "bff" || !request.eckUser?.roles.includes("platform_admin")) {
      throw new ForbiddenException("Platform admin required");
    }
    const tenant = await this.tenants.create(body);
    await getDb()!.insert(schema.tenantMemberships).values({ tenantId: tenant.id, userSub: request.eckUser.sub, role: "tenant_admin" });
    return tenant;
  }

  @Get(":tenantId")
  async get(@Param("tenantId") tenantId: string, @Req() request: Request) {
    await this.permitted(request, tenantId);
    return this.tenants.findById(tenantId);
  }
}

export class RunAdminController {}
