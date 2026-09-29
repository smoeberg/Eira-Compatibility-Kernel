import { Body, Controller, Get, Param, Post, Req, UseGuards, BadRequestException } from "@nestjs/common";
import type { Request } from "express";
import { AdminAuthGuard } from "../auth/admin-auth.guard";
import { BffSignatureGuard } from "../auth/bff-signature.guard";
import { UserContextGuard } from "../auth/user-context.guard";
import { OnboardingGuard } from "./onboarding.guard";
import { OnboardingService, type CreateSetupInput } from "./onboarding.service";
import type { SetupEvent } from "./onboarding.machine";

const CUSTOMER_EVENTS = new Set([
  "mark_ready", "mark_unsupported", "configuration_saved", "confirm_trial",
  "start_recording", "stop_recording", "begin_rollback", "confirm_rollback", "incident",
]);

@Controller("api/v1/tenants/:tenantId/integrations")
@UseGuards(AdminAuthGuard, BffSignatureGuard, UserContextGuard, OnboardingGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post()
  create(@Param("tenantId") tenantId: string, @Body() input: CreateSetupInput) {
    return this.onboarding.create(tenantId, input);
  }

  @Get()
  list(@Param("tenantId") tenantId: string) { return this.onboarding.list(tenantId); }

  @Get(":id")
  get(@Param("tenantId") tenantId: string, @Param("id") id: string) {
    return this.onboarding.get(tenantId, id);
  }

  @Post(":id/transitions")
  transition(@Param("tenantId") tenantId: string, @Param("id") id: string,
    @Body() event: SetupEvent, @Req() request: Request) {
    if (!event || !CUSTOMER_EVENTS.has(event.type)) throw new BadRequestException("Invalid customer transition");
    if (event.type === "mark_ready" && event.preflightConfirmed !== true) {
      throw new BadRequestException("Test-environment preflight must be confirmed");
    }
    if (event.type === "confirm_trial" && event.customerSawExpectedResult !== true) {
      throw new BadRequestException("Expected result must be confirmed");
    }
    if (event.type === "confirm_rollback" && (event.customerRestoredUrl !== true || event.directCallSucceeded !== true)) {
      throw new BadRequestException("Restore and direct call must be confirmed");
    }
    return this.onboarding.apply(tenantId, id, event, request.eckUser!.sub);
  }
}
