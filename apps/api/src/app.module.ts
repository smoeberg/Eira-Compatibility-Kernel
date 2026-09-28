import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { FingerprintModule } from "./fingerprint/fingerprint.module";
import { ProxyModule } from "./proxy/proxy.module";
import { HealthController } from "./health.controller";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [AuthModule, FingerprintModule, TenantsModule, ProxyModule],
  controllers: [HealthController],
})
export class AppModule {}
