import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { BffSignatureGuard } from "../auth/bff-signature.guard";
import { ServiceIdentityGuard } from "../auth/service-identity.guard";
import { UserContextGuard } from "../auth/user-context.guard";
import { FingerprintModule } from "../fingerprint/fingerprint.module";
import { RunAdminController, TenantAdminController } from "./tenant-admin.controller";
import { SetupService } from "./setup.service";
import { TenantService } from "./tenant.service";

@Module({
  imports: [FingerprintModule, AuditModule],
  controllers: [TenantAdminController, RunAdminController],
  providers: [TenantService, SetupService, AdminAuthGuard, BffSignatureGuard, ServiceIdentityGuard, UserContextGuard],
  exports: [TenantService, SetupService],
})
export class TenantsModule {}
