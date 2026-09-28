import type { CompatibilityReportDisclaimer } from "./compatibility-report.types";

/** Kladde — godkend via advokat (L1/L2) før betalende produktion */
export const FINGERPRINT_REPORT_DISCLAIMER: CompatibilityReportDisclaimer = {
  status: "draft_pending_lawyer",
  primary:
    "Compatibility Score er en analyse af observeret API-trafik over observationsperioden. " +
    "Rapporten udgør beslutningsstøtte — ikke en garanti for fuld migrering, driftssikkerhed " +
    "eller juridisk godkendelse af platformskifte.",
  secondary:
    "Beslutning om migrering træffes udelukkende af kunden på baggrund af egen risikovurdering, " +
    "herunder kontraktforhold med eksisterende platformleverandør.",
};
