import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { BffSignatureGuard } from "../auth/bff-signature.guard";
import { ServiceIdentityGuard } from "../auth/service-identity.guard";
import { UserContextGuard } from "../auth/user-context.guard";
import { TenantAdminController } from "./tenant-admin.controller";
import { TenantService } from "./tenant.service";

@Module({
  imports: [AuditModule],
  controllers: [TenantAdminController],
  providers: [TenantService, AdminAuthGuard, BffSignatureGuard, ServiceIdentityGuard, UserContextGuard],
  exports: [TenantService],
})
export class TenantsModule {}
