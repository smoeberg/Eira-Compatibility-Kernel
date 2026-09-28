import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { OidcService } from "./oidc.service";

@Module({
  controllers: [AuthController],
  providers: [OidcService],
  exports: [OidcService],
})
export class AuthModule {}
