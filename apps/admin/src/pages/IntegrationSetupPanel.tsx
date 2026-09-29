import { useEffect, useState } from "react";
import { eckApi, type IntegrationSetup, type SetupTransition } from "../api/client";

const LABEL: Record<IntegrationSetup["status"], string> = {
  draft: "Forhåndskontrol", ready: "Klar til konfiguration", awaiting_traffic: "Venter på fagsystemkald",
  trial: "Prøvekørsel", active: "Observation kører", passthrough_only: "Kun videresendelse",
  rollback_pending: "Afventer rollback", closed: "Afsluttet", incident: "Hændelse – rollback",
  unsupported: "Ikke understøttet",
};

export function IntegrationSetupPanel({ tenantId }: { tenantId: string }) {
  const [items, setItems] = useState<IntegrationSetup[]>([]);
  const [name, setName] = useState("");
  const [upstreamUrl, setUpstreamUrl] = useState("");
  const [preflight, setPreflight] = useState(false);
  const [expected, setExpected] = useState(false);
  const [restored, setRestored] = useState(false);
  const [direct, setDirect] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setItems(await eckApi.listIntegrations(tenantId));
  }
  useEffect(() => {
    void refresh().catch((err) => setError((err as Error).message));
    const timer = setInterval(() => void refresh().catch(() => undefined), 5000);
    return () => clearInterval(timer);
  }, [tenantId]);

  async function create() {
    setBusy(true); setError(null);
    try {
      await eckApi.createIntegration(tenantId, { name, upstreamUrl, environment: "test" });
      setName(""); setUpstreamUrl(""); await refresh();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  async function move(item: IntegrationSetup, event: SetupTransition) {
    setBusy(true); setError(null);
    try { await eckApi.transitionIntegration(tenantId, item.id, event); await refresh(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="card stack">
    <h2>Guidet fingerprint pr. fagsystem</h2>
    <p>Start i testmiljø. Ingen registrering starter før en vellykket transaktion gennem proxyen og din bekræftelse.</p>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="stack">
      <label>Fagsystem <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Navn på testintegration" /></label>
      <label>Oprindelig API-origin <input value={upstreamUrl} onChange={(e) => setUpstreamUrl(e.target.value)} placeholder="https://api.example.dk" /></label>
      <button disabled={busy || !name || !upstreamUrl} onClick={() => void create()}>Opret testintegration</button>
      <small>Upstream-host skal være godkendt af ECK drift. Et produktionsmiljø kræver en særskilt godkendt guide.</small>
    </div>
    {items.map((item) => <div className="card stack" key={item.id}>
      <h3>{item.name} · {LABEL[item.status]}</h3>
      <p>Proxy: <code>{item.proxyUrl}</code> <button type="button" className="secondary small" onClick={() => void navigator.clipboard.writeText(item.proxyUrl)}>Kopiér</button></p>
      <p>Oprindelig URL til rollback: <code>{item.upstreamUrl}</code> <button type="button" className="secondary small" onClick={() => void navigator.clipboard.writeText(item.upstreamUrl)}>Kopiér</button></p>
      <p>Set via proxy: {item.observedCalls} kald · upstream succes: {item.successfulCalls}. Første succes: {item.firstSuccessfulCallAt ?? "afventer"}.</p>
      <p>Seneste proxytrafik: {item.lastProxyCallAt ?? "ingen"}. Dette viser ikke direkte kald uden om proxyen.</p>
      {item.status === "draft" && <>
        <label><input type="checkbox" checked={preflight} onChange={(e) => setPreflight(e.target.checked)} /> Jeg har kontrolleret testmiljø, konfigurerbar base-URL, auth/TLS og rollback-ansvar.</label>
        <button disabled={busy || !preflight} onClick={() => void move(item, { type: "mark_ready", preflightConfirmed: true })}>Godkend forhåndskontrol</button>
        <button className="secondary" disabled={busy} onClick={() => void move(item, { type: "mark_unsupported", reason: "Endpoint kan ikke konfigureres" })}>Markér som uegnet</button>
      </>}
      {item.status === "ready" && <>
        <p>Indsæt proxy-URL i fagsystemets API-base-URL. Gem ændringen og udfør derefter en syntetisk transaktion.</p>
        <button disabled={busy} onClick={() => void move(item, { type: "configuration_saved" })}>Jeg har gemt ændringen</button>
      </>}
      {item.status === "awaiting_traffic" && <p>Afventer et reelt fagsystemkald og svar fra upstream. Et healthcheck af proxyen er ikke nok.</p>}
      {item.status === "trial" && <>
        <p>Prøvekørsel udløber {item.trialEndsAt}. Bekræft, at resultatet også var korrekt inde i fagsystemet.</p>
        <label><input type="checkbox" checked={expected} onChange={(e) => setExpected(e.target.checked)} /> Fagsystemet viste det forventede resultat.</label>
        <button disabled={busy || !expected} onClick={() => void move(item, { type: "confirm_trial", customerSawExpectedResult: true })}>Bekræft prøvekørsel</button>
        <button disabled={busy || !item.customerConfirmed} onClick={() => void move(item, { type: "start_recording", durationDays: 14 })}>Start 14 dages observation</button>
      </>}
      {item.status === "active" && <>
        <p>Registrering slutter {item.recordingEndsAt}. Proxyen videresender fortsat efter udløb, indtil rollback er bekræftet.</p>
        <button disabled={busy} onClick={() => void move(item, { type: "stop_recording" })}>Stop registrering – fortsæt videresendelse</button>
        <button className="secondary" disabled={busy} onClick={() => void move(item, { type: "incident", reason: "Manuelt nødstop" })}>Nødstop registrering</button>
      </>}
      {["passthrough_only", "incident", "awaiting_traffic", "trial"].includes(item.status) &&
        <button disabled={busy} onClick={() => void move(item, { type: "begin_rollback" })}>Start rollback</button>}
      {item.status === "rollback_pending" && <>
        <p>Gendan den oprindelige URL i fagsystemet. Test et kald direkte mod den oprindelige API. Ingen proxytrafik alene beviser ikke rollback.</p>
        <label><input type="checkbox" checked={restored} onChange={(e) => setRestored(e.target.checked)} /> Oprindelig URL er gendannet.</label>
        <label><input type="checkbox" checked={direct} onChange={(e) => setDirect(e.target.checked)} /> Et direkte testkald lykkedes.</label>
        <button disabled={busy || !restored || !direct} onClick={() => void move(item, { type: "confirm_rollback", customerRestoredUrl: true, directCallSucceeded: true })}>Bekræft rollback og afslut</button>
      </>}
      {item.status === "closed" && <p>Afsluttet. Proxyen videresender stadig eventuelle sene kald uden fingerprintregistrering. Kontroller at tælleren ikke stiger efter rollback.</p>}
    </div>)}
  </section>;
}
