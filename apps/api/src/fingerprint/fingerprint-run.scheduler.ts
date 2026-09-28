import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { FingerprintRunService } from "./fingerprint-run.service";

@Injectable()
export class FingerprintRunSchedulerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(FingerprintRunSchedulerService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly runService: FingerprintRunService) {}

  onModuleInit(): void {
    if (process.env.FINGERPRINT_AUTO_COMPLETE === "false") {
      this.logger.log("Fingerprint auto-complete disabled (env)");
      return;
    }

    const intervalMs = Number(
      process.env.FINGERPRINT_AUTO_COMPLETE_INTERVAL_MS ?? 300_000,
    );

    this.logger.log(
      `Fingerprint auto-complete enabled (interval ${intervalMs}ms)`,
    );

    void this.tick("startup");
    this.timer = setInterval(() => void this.tick("interval"), intervalMs);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async tick(reason: string): Promise<void> {
    try {
      const result = await this.runService.completeExpiredRuns();
      if (result.completed.length > 0) {
        this.logger.log(
          `Auto-completed ${result.completed.length} fingerprint run(s) (${reason})`,
        );
      }
      for (const err of result.errors) {
        this.logger.warn(
          `Auto-complete failed for ${err.runId}: ${err.message}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Fingerprint auto-complete tick failed: ${(err as Error).message}`,
      );
    }
  }
}
