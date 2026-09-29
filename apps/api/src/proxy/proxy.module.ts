import { Module } from "@nestjs/common";
import { FingerprintModule } from "../fingerprint/fingerprint.module";
import { TenantsModule } from "../tenants/tenants.module";
import { ProxyService } from "./proxy.service";
import { OnboardingModule } from "../onboarding/onboarding.module";

@Module({
  imports: [TenantsModule, FingerprintModule, OnboardingModule],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
