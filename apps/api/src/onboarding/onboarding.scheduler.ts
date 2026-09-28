import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { OnboardingService } from "./onboarding.service";

@Injectable()
export class OnboardingScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OnboardingScheduler.name);
  private timer?: ReturnType<typeof setInterval>;
  constructor(private readonly onboarding: OnboardingService) {}
  onModuleInit() {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), 60_000);
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async tick() {
    try { await this.onboarding.expireDue(); }
    catch (error) { this.logger.error(`Expiry sweep failed: ${(error as Error).message}`); }
  }
}
