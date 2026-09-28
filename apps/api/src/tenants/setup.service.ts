import { Injectable } from "@nestjs/common";
import type { FingerprintRunResponse } from "../fingerprint/fingerprint-run.dto";
import type { TenantResponse } from "./tenant.dto";

@Injectable()
export class SetupService {
  buildSetup(tenant: TenantResponse, run: FingerprintRunResponse) {
    return {
      proxyUrl: tenant.proxyUrl,
      legacyUrl: tenant.legacyBaseUrl,
      runId: run.id,
      tenantId: tenant.id,
      slug: tenant.slug,
      endsAt: run.endsAt,
      daysRemaining: run.daysRemaining,
      status: run.status,
      instructions: [
        "Log ind i fagsystemets integrations- eller administrationspanel.",
        'Find feltet "API endpoint", "Base URL" eller tilsvarende.',
        `Erstat den nuværende URL med: ${tenant.proxyUrl}`,
        "Gem konfigurationen. Ingen ændring i kommunens DNS er nødvendig.",
        `Fingerprint kører i ${run.daysRemaining} dage (slutter ${run.endsAt.slice(0, 10)}).`,
      ],
    };
  }
}
