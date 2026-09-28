import { Module } from "@nestjs/common";
import { FingerprintController } from "./fingerprint.controller";
import { FingerprintRunService } from "./fingerprint-run.service";
import { FingerprintService } from "./fingerprint.service";
import { FingerprintRunSchedulerService } from "./fingerprint-run.scheduler";

@Module({
  controllers: [FingerprintController],
  providers: [FingerprintRunService, FingerprintService, FingerprintRunSchedulerService],
  exports: [FingerprintRunService, FingerprintService],
})
export class FingerprintModule {}
