import { Module } from "@nestjs/common";
import { FingerprintModule } from "../fingerprint/fingerprint.module";
import { TenantsModule } from "../tenants/tenants.module";
import { ProxyService } from "./proxy.service";

@Module({
  imports: [TenantsModule, FingerprintModule],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
