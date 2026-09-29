import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { eckApi, type IntegrationSetup, type SetupTransition } from "../api/client";
import { IntegrationStepper, StatusBadge, trafficSignal } from "./integration-ui";

function dateLabel(value?: string): string {
  return value ? new Date(value).toLocaleString("da-DK") : "—";
}
const POLL_STATUSES = new Set(["awaiting_traffic", "trial", "active", "passthrough_only", "incident", "rollback_pending", "closed"]);

function CheckRow({ value, onChange, children }: { value: boolean; onChange: () => void; children: string }) {
  return <label className="check-row"><input type="checkbox" checked={value} onChange={onChange} /> {children}</label>;
}

export function IntegrationWorkspacePage() {
  const { tenantId, integrationId } = useParams<{ tenantId: string; integrationId: string }>();
  if (!tenantId || !integrationId) return <div className="page" role="alert">Integration mangler i adressen.</div>;
  // A different integration always receives fresh confirmation state.
  return <IntegrationWorkspace key={integrationId} tenantId={tenantId} integrationId={integrationId} />;
}

export function IntegrationWorkspace({ tenantId, integrationId }: { tenantId: string; integrationId: string }) {
  const [item, setItem] = useState<IntegrationSetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState(14);
  const requestVersion = useRef(0);

  useEffect(() => {
    let current = true;
    const refresh = () => {
      const version = ++requestVersion.current;
      void eckApi.getIntegration(tenantId, integrationId)
      .then((next) => { if (current && version === requestVersion.current) setItem(next); })
      .catch((err) => { if (current && version === requestVersion.current) setError((err as Error).message); })
      .finally(() => { if (current) setLoading(false); });
    };
    refresh();
    const timer = setInterval(() => {
      if (current && (!item || POLL_STATUSES.has(item.status))) refresh();
    }, 5000);
    return () => { current = false; clearInterval(timer); };
  }, [tenantId, integrationId, item?.status]);

  function checked(key: string) { return checks[key] === true; }
  function toggle(key: string) { setChecks((value) => ({ ...value, [key]: !value[key] })); }
  function checkbox(id: string, label: string) {
    return <CheckRow value={checked(id)} onChange={() => toggle(id)}>{label}</CheckRow>;
  }

  async function move(event: SetupTransition) {
    setBusy(event.type); setError(null);
    try {
      const next = await eckApi.transitionIntegration(tenantId, integrationId, event);
      requestVersion.current++;
      setItem(next);
      setChecks({});
      setReason("");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(null); }
  }

  async function copy(value: string) {
    try { await navigator.clipboard.writeText(value); }
    catch { setError("Kunne ikke kopiere. Markér og kopiér URL'en manuelt."); }
  }

  if (loading) return <div className="page" role="status">Henter integration…</div>;
  if (!item) return <div className="page"><p role="alert">{error ?? "Integrationen blev ikke fundet."}</p></div>;

  const expiredTrial = !!item.trialEndsAt && Date.now() >= Date.parse(item.trialEndsAt);
  const preflight = ["test", "baseUrl", "auth", "owner"].every(checked);
  const rollback = checked("restored") && checked("direct");

  return <div className="page stack">
    <Link to={"/tenants/" + tenantId} className="back">← Tenant</Link>
    <header className="stack gap-sm">
      <div className="row"><div><h1>{item.name}</h1><p className="muted">{item.environment === "test" ? "Testmiljø" : "Produktion"}</p></div>
        <StatusBadge status={item.status} /></div>
      <IntegrationStepper status={item.status} />
    </header>
    {error && <p role="alert" className="error">{error}</p>}
    <section className="card stack" aria-label="API-adresser">
      <h2>API-adresser</h2>
      <div><span className="label">Proxyadresse</span><code className="block">{item.proxyUrl}</code>
        <button type="button" className="secondary small" onClick={() => void copy(item.proxyUrl)}>Kopiér proxyadresse</button></div>
      <div><span className="label">Oprindelig URL til rollback</span><code className="block">{item.upstreamUrl}</code>
        <button type="button" className="secondary small" onClick={() => void copy(item.upstreamUrl)}>Kopiér oprindelig URL</button></div>
    </section>
    <section className="card stack" aria-label="Trafiksignaler">
      <h2>Modtager vi data?</h2>
      <p className="signal">{trafficSignal(item)}</p>
      <p>Proxy-kald set: <strong>{item.observedCalls}</strong> · upstream succes (2xx/3xx): <strong>{item.successfulCalls}</strong></p>
      <p>Første succes: {dateLabel(item.firstSuccessfulCallAt)} · seneste proxytrafik: {dateLabel(item.lastProxyCallAt)}</p>
      <p className="muted">Dækning: ukendt. ECK kan ikke se direkte kald uden om proxyen og har ingen ekstern baseline.</p>
    </section>
    <section className="card stack" aria-label="Næste handling">
      <h2>Næste handling</h2>
      {item.status === "draft" && <>
        <p>Kontrollér forudsætningerne i testmiljøet, før du ændrer fagsystemets indstillinger.</p>
        {checkbox("test", "Testmiljøet er isoleret fra produktion.")}
        {checkbox("baseUrl", "Fagsystemets API-base-URL kan ændres.")}
        {checkbox("auth", "Auth og TLS er afklaret.")}
        {checkbox("owner", "En rollback-ansvarlig er aftalt.")}
        <button disabled={!!busy || !preflight} onClick={() => void move({ type: "mark_ready", preflightConfirmed: true })}>Godkend forhåndskontrol</button>
        <label>Årsag til at metoden er uegnet
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Base-URL kan ikke ændres" />
        </label>
        <button className="secondary" disabled={!!busy || !reason.trim()} onClick={() => void move({ type: "mark_unsupported", reason: reason.trim() })}>Markér som uegnet</button>
      </>}
      {item.status === "ready" && <>
        <ol><li>Åbn fagsystemets integrationsindstillinger.</li><li>Erstat API-base-URL med proxyadressen ovenfor.</li>
          <li>Gem og udfør en syntetisk transaktion i fagsystemet.</li></ol>
        <button disabled={!!busy} onClick={() => void move({ type: "configuration_saved" })}>Jeg har gemt ændringen</button>
      </>}
      {item.status === "awaiting_traffic" && <p>Afventer et reelt fagsystemkald og et vellykket upstream-svar. Et proxy-healthcheck starter ikke prøvekørslen.</p>}
      {item.status === "trial" && <>
        <p>Prøvekørsel udløber {dateLabel(item.trialEndsAt)}. Bekræft resultatet inde i fagsystemet.</p>
        {!item.customerConfirmed ? <>
          {checkbox("expected", "Fagsystemet viste det forventede resultat.")}
          <button disabled={!!busy || !checked("expected") || expiredTrial} onClick={() => void move({ type: "confirm_trial", customerSawExpectedResult: true })}>Bekræft prøvekørsel</button>
        </> : <>
          <p className="signal">Prøvekørsel bekræftet. Vælg observationsperiode.</p>
          <label>Varighed i dage (1–14)
            <input type="number" min={1} max={14} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </label>
          <button disabled={!!busy || expiredTrial || !Number.isInteger(duration) || duration < 1 || duration > 14}
            onClick={() => void move({ type: "start_recording", durationDays: duration })}>Start observation</button>
        </>}
        {expiredTrial && <p role="alert">Prøvekørslen er udløbet. Start rollback og opret en ny testintegration.</p>}
      </>}
      {item.status === "active" && <>
        <p>Registrering slutter {dateLabel(item.recordingEndsAt)}. Proxyen fortsætter med at videresende efter udløb.</p>
        <button disabled={!!busy} onClick={() => void move({ type: "stop_recording" })}>Stop registrering – fortsæt videresendelse</button>
        <label>Årsag til nødstop
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Upstream svarer forkert" />
        </label>
        <button className="secondary" disabled={!!busy || !reason.trim()} onClick={() => void move({ type: "incident", reason: reason.trim() })}>Nødstop registrering</button>
      </>}
      {item.status === "passthrough_only" && <p>Observationen er stoppet. Proxyen videresender stadig uden fingerprintregistrering. Gendan den oprindelige URL.</p>}
      {item.status === "incident" && <p role="alert">Registrering stoppet: {item.reason}. Undersøg hændelsen og rul tilbage.</p>}
      {["awaiting_traffic", "trial", "passthrough_only", "incident"].includes(item.status) &&
        <button disabled={!!busy} onClick={() => void move({ type: "begin_rollback" })}>Start rollback</button>}
      {item.status === "rollback_pending" && <>
        <ol><li>Gendan den oprindelige URL ovenfor i fagsystemet.</li><li>Test et kald direkte mod den oprindelige API.</li></ol>
        {checkbox("restored", "Oprindelig URL er gendannet.")}
        {checkbox("direct", "Et direkte testkald lykkedes.")}
        <p className="muted">Manglende proxytrafik er kun en indikation, ikke bevis på rollback.</p>
        <button disabled={!!busy || !rollback} onClick={() => void move({ type: "confirm_rollback", customerRestoredUrl: true, directCallSucceeded: true })}>Bekræft rollback og afslut</button>
      </>}
      {item.status === "closed" && <>
        <p>Afsluttet {dateLabel(item.rollbackConfirmedAt)}. Sene proxykald videresendes uden fingerprintregistrering.</p>
        <p>Kontrollér, at tælleren ikke stiger efter rollback. {trafficSignal(item)}</p>
        <p className="muted">Rapportgenerering for dette integrationsflow er endnu ikke tilgængelig.</p>
      </>}
      {item.status === "unsupported" && <p>Denne metode kan ikke bruges: {item.reason}</p>}
    </section>
  </div>;
}
