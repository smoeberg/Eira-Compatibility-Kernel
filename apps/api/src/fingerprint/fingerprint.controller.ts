import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { InternalServiceAuthGuard } from "../auth/internal-service-auth.guard";
import type { CreateFingerprintRunDto } from "./fingerprint-run.dto";
import { FingerprintRunService } from "./fingerprint-run.service";
import type { IngestFingerprintDto, ScoreFromLogsDto } from "./fingerprint.dto";
import { FingerprintService } from "./fingerprint.service";

@Controller("internal/fingerprint")
@UseGuards(InternalServiceAuthGuard)
export class FingerprintController {
  constructor(
    private readonly fingerprintService: FingerprintService,
    private readonly runService: FingerprintRunService,
  ) {}

  @Post("runs")
  createRun(@Body() body: CreateFingerprintRunDto) {
    return this.runService.createRun(body);
  }

  @Get("runs")
  listRuns(@Query("tenantId") tenantId: string) {
    return this.runService.listRuns(tenantId);
  }

  @Get("runs/:runId")
  getRun(@Param("runId") runId: string) {
    return this.runService.getRun(runId);
  }

  @Delete("runs/:runId")
  cancelRun(@Param("runId") runId: string) {
    return this.runService.cancelRun(runId);
  }

  @Post("runs/:runId/complete")
  completeRun(@Param("runId") runId: string) {
    return this.runService.completeRun(runId);
  }

  @Get("runs/:runId/report")
  getReport(@Param("runId") runId: string) {
    return this.runService.getReportForRun(runId);
  }

  @Post("ingest")
  ingest(@Body() body: IngestFingerprintDto) {
    return this.fingerprintService.ingest(body);
  }

  @Post("score")
  scoreFromLogs(@Body() body: ScoreFromLogsDto) {
    return this.fingerprintService.scoreFromLogs(body);
  }

  @Get("score/run/:runId")
  async scoreFromRun(@Param("runId") runId: string) {
    return this.fingerprintService.scoreFromRun(runId);
  }
}
