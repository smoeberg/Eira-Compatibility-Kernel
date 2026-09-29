import type { IntegrationSetup, SetupStatus } from "../api/client";

const STATUS: Record<SetupStatus, { label: string; tone: string; step: number }> = {
  draft: { label: "Forhåndskontrol", tone: "neutral", step: 0 },
  ready: { label: "Klar til konfiguration", tone: "info", step: 1 },
  awaiting_traffic: { label: "Venter på fagsystemkald", tone: "warning", step: 2 },
  trial: { label: "Prøvekørsel", tone: "warning", step: 3 },
  active: { label: "Observation kører", tone: "success", step: 4 },
  passthrough_only: { label: "Kun videresendelse", tone: "info", step: 5 },
  rollback_pending: { label: "Afventer rollback", tone: "warning", step: 5 },
  closed: { label: "Afsluttet", tone: "neutral", step: 6 },
  incident: { label: "Hændelse", tone: "danger", step: 5 },
  unsupported: { label: "Ikke understøttet", tone: "danger", step: 0 },
};

export function StatusBadge({ status }: { status: SetupStatus }) {
  const { label, tone } = STATUS[status];
  return <span className={"status-badge status-" + tone}>{label}</span>;
}

const STEPS = ["Forhånd", "Konfigurér", "Verificér", "Prøve", "Observation", "Rollback"];
export function IntegrationStepper({ status }: { status: SetupStatus }) {
  if (status === "unsupported" || status === "closed") return null;
  const current = STATUS[status].step;
  return <ol className="stepper" aria-label="Opsætningens trin">
    {STEPS.map((label, index) => <li key={label} aria-current={index === current ? "step" : undefined}
      className={index < current ? "done" : index === current ? "current" : "upcoming"}>
      <span aria-hidden="true">{index < current ? "✓" : index + 1}</span> {label}
    </li>)}
  </ol>;
}

export function trafficSignal(item: IntegrationSetup): string {
  if (item.status === "awaiting_traffic" && item.observedCalls === 0) return "Afventer testtransaktion";
  if (item.status === "trial" && item.firstSuccessfulCallAt) return "Proxy og upstream svarede — bekræft i fagsystemet";
  if (item.status === "passthrough_only") return "Registrering stoppet — rollback kræver handling";
  if (item.status === "rollback_pending") return "Gendan URL og verificér direkte kald";
  if (item.status === "incident") return "Registrering stoppet — undersøg og rul tilbage";
  if (item.status === "closed" && item.lastProxyCallAt && item.rollbackConfirmedAt &&
      Date.parse(item.lastProxyCallAt) > Date.parse(item.rollbackConfirmedAt)) return "Trafik set efter rollback — undersøg";
  return item.observedCalls > 0 ? item.observedCalls + " proxykald set" : "Ingen proxykald set";
}
