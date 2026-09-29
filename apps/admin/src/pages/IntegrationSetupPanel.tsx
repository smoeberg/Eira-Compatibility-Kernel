import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eckApi, type IntegrationSetup } from "../api/client";
import { StatusBadge, trafficSignal } from "./integration-ui";

/** Tenant-level index and creation. Transitions live on one integration workspace. */
export function IntegrationSetupPanel({ tenantId }: { tenantId: string }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<IntegrationSetup[]>([]);
  const [name, setName] = useState("");
  const [upstreamUrl, setUpstreamUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    eckApi.listIntegrations(tenantId)
      .then((rows) => { if (current) setItems(rows); })
      .catch((err) => { if (current) setError((err as Error).message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [tenantId]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      const item = await eckApi.createIntegration(tenantId, { name: name.trim(), upstreamUrl: upstreamUrl.trim(), environment: "test" });
      navigate("/tenants/" + tenantId + "/integrations/" + item.id);
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return <section className="stack" aria-labelledby="integrations-title">
    <div className="row"><h2 id="integrations-title">Integrationer</h2></div>
    <form className="card stack" onSubmit={(event) => void create(event)}>
      <h3>Ny testintegration</h3>
      <p className="muted">Hvert fagsystem får sin egen proxyadresse. Start i testmiljø.</p>
      <label>Fagsystem
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ESDH testmiljø" required />
      </label>
      <label>Oprindelig API-origin
        <input type="url" value={upstreamUrl} onChange={(e) => setUpstreamUrl(e.target.value)} placeholder="https://api.example.dk" required />
        <span className="hint">Kun HTTPS-origin uden sti. ECK drift skal godkende upstream-host.</span>
      </label>
      <button disabled={busy || !name.trim() || !upstreamUrl.trim()}>{busy ? "Opretter…" : "Opret integration"}</button>
    </form>
    {error && <p role="alert" className="error">{error}</p>}
    {loading && <p role="status">Henter integrationer…</p>}
    {!loading && items.length === 0 && <p className="muted">Ingen integrationer endnu. Opret den første ovenfor.</p>}
    <div className="grid">
      {items.map((item) => <Link className="card tenant-card" key={item.id}
        to={"/tenants/" + tenantId + "/integrations/" + item.id}>
        <strong>{item.name}</strong> <StatusBadge status={item.status} />
        <span className="muted">{item.environment === "test" ? "Testmiljø" : "Produktion"} · {trafficSignal(item)}</span>
        <span className="muted">{item.observedCalls} kald set · {item.successfulCalls} upstream-succeser</span>
        <span>Åbn integration →</span>
      </Link>)}
    </div>
  </section>;
}
