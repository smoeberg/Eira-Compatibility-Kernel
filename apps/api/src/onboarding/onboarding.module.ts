import { Module } from "@nestjs/common";
import { TenantsModule } from "../tenants/tenants.module";
import { OnboardingController } from "./onboarding.controller";
import { DbSetupStore, OnboardingService } from "./onboarding.service";
import { OnboardingGuard } from "./onboarding.guard";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { BffSignatureGuard } from "../auth/bff-signature.guard";
import { UserContextGuard } from "../auth/user-context.guard";
import { OnboardingScheduler } from "./onboarding.scheduler";

@Module({
  imports: [TenantsModule],
  controllers: [OnboardingController],
  providers: [DbSetupStore, OnboardingService, OnboardingGuard, AdminAuthGuard, BffSignatureGuard, UserContextGuard, OnboardingScheduler],
  exports: [OnboardingService],
})
export class OnboardingModule {}
