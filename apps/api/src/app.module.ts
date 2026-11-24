import { Module } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { HealthController } from "./health.controller";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [AuthModule, TenantsModule],
  controllers: [HealthController],
})
export class AppModule {}
